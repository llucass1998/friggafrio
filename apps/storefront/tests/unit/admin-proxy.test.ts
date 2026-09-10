import assert from "node:assert/strict"
import { afterEach, test } from "node:test"
import { proxyAdminRequest } from "../../src/lib/server/admin-proxy"

const originalFetch = globalThis.fetch

afterEach(() => {
  globalThis.fetch = originalFetch
})

test("proxies anonymous Admin requests to the local backend with path and query intact", async () => {
  let receivedUrl = ""
  let receivedMethod = ""
  let receivedCookie = ""
  globalThis.fetch = async (input, init) => {
    receivedUrl = String(input)
    receivedMethod = init?.method ?? ""
    receivedCookie = new Headers(init?.headers).get("cookie") ?? ""
    return Response.json({ message: "Unauthorized" }, { status: 401 })
  }

  const response = await proxyAdminRequest(new Request(
    "https://friggafrio.istigestao.com.br/admin/products?limit=1",
    { headers: { cookie: "session=redacted" } },
  ))

  assert.equal(receivedUrl, "http://127.0.0.1:9000/admin/products?limit=1")
  assert.equal(receivedMethod, "GET")
  assert.equal(receivedCookie, "session=redacted")
  assert.equal(response.status, 401)
  assert.match(response.headers.get("content-type") ?? "", /application\/json/)
})

test("preserves write methods and rejects paths outside the Admin namespace", async () => {
  let receivedMethod = ""
  let receivedBody = ""
  globalThis.fetch = async (_input, init) => {
    receivedMethod = init?.method ?? ""
    receivedBody = await new Response(init?.body).text()
    return new Response(null, { status: 204 })
  }

  const response = await proxyAdminRequest(new Request(
    "https://friggafrio.istigestao.com.br/admin/users",
    { method: "POST", body: '{"safe":true}', headers: { "content-type": "application/json" } },
  ))
  assert.equal(receivedMethod, "POST")
  assert.equal(receivedBody, '{"safe":true}')
  assert.equal(response.status, 204)
  await assert.rejects(
    () => proxyAdminRequest(new Request("https://friggafrio.istigestao.com.br/br")),
    /ADMIN_PROXY_PATH_DENIED/,
  )
  await assert.rejects(
    () => proxyAdminRequest(new Request("https://friggafrio.istigestao.com.br/store")),
    /ADMIN_PROXY_PATH_DENIED/,
  )
})

test("proxies store, auth, uploads, and health/ready namespaces to the local backend", async () => {
  const proxiedUrls: string[] = []
  globalThis.fetch = async (input) => {
    proxiedUrls.push(String(input))
    return Response.json({ success: true }, { status: 200 })
  }

  await proxyAdminRequest(new Request("https://friggafrio.istigestao.com.br/store/regions"))
  await proxyAdminRequest(new Request("https://friggafrio.istigestao.com.br/auth/customer/google/start"))
  await proxyAdminRequest(new Request("https://friggafrio.istigestao.com.br/uploads/products/sensor.jpg"))
  await proxyAdminRequest(new Request("https://friggafrio.istigestao.com.br/health/ready"))

  assert.deepEqual(proxiedUrls, [
    "http://127.0.0.1:9000/store/regions",
    "http://127.0.0.1:9000/auth/customer/google/start",
    "http://127.0.0.1:9000/uploads/products/sensor.jpg",
    "http://127.0.0.1:9000/health/ready",
  ])
})

