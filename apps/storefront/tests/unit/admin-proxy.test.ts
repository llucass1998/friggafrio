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
})
