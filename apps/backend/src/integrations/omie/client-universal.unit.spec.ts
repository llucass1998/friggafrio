import {
  OmieClient,
  OmieClientError,
  RESOLVE_OMIE_ENDPOINT,
  isWriteOperation,
} from "./client"

const clientConfig = (appKey = "unit-client-key") => ({
  apiUrl: "https://example.invalid/api/v1/geral/produtos/",
  appKey,
  appSecret: "unit-secret-that-must-never-leak",
})

const okResponse = (body: unknown = { ok: true }) =>
  new Response(JSON.stringify(body), { status: 200, headers: { "content-type": "application/json" } })

describe("OmieClient universal safety boundary", () => {
  it("requires an exact registry entry rather than using endpoint substring fallbacks", async () => {
    const fetchImpl = jest.fn()
    const client = new OmieClient(clientConfig(), { fetchImpl: fetchImpl as unknown as typeof fetch })

    expect(RESOLVE_OMIE_ENDPOINT("ListarProdutos")).toBe("https://app.omie.com.br/api/v1/geral/produtos/")
    expect(RESOLVE_OMIE_ENDPOINT("ListarLocaisEstoque")).toBe("https://app.omie.com.br/api/v1/estoque/local/")
    expect(RESOLVE_OMIE_ENDPOINT("ConsultarProdutoQueNaoEstaNoRegistry")).toBeNull()
    expect(isWriteOperation("IncluirProdutoInventado")).toBe(false)

    await expect(client.request("ConsultarProdutoQueNaoEstaNoRegistry")).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
      retryable: false,
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it("uses the registry, not operation-name prefixes, for the write gate", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(okResponse())
    const client = new OmieClient(clientConfig(), { fetchImpl: fetchImpl as unknown as typeof fetch })

    await expect(client.request("IncluirProduto")).rejects.toMatchObject({
      code: "READ_ONLY_VIOLATION",
      retryable: false,
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it("accepts writes only when config.writesEnabled is strictly true", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(okResponse({ codigo_pedido: 1 }))
    const blocked = new OmieClient(
      { ...clientConfig("strict-write-flag"), writesEnabled: "true" as unknown as boolean },
      { fetchImpl: fetchImpl as unknown as typeof fetch },
    )
    await expect(blocked.request("IncluirPedido")).rejects.toMatchObject({ code: "READ_ONLY_VIOLATION" })

    const allowed = new OmieClient(
      { ...clientConfig("strict-write-flag-allowed"), writesEnabled: true },
      { fetchImpl: fetchImpl as unknown as typeof fetch },
    )
    await expect(allowed.request("IncluirPedido")).resolves.toEqual({ codigo_pedido: 1 })
  })

  it("serializes starts across client instances sharing an app key", async () => {
    let now = 0
    const starts: number[] = []
    const sleep = jest.fn(async (milliseconds: number) => { now += milliseconds })
    const fetchImpl = jest.fn(async () => {
      starts.push(now)
      return okResponse()
    })
    const nowSpy = jest.spyOn(Date, "now").mockImplementation(() => now)

    try {
      const dependencies = { fetchImpl: fetchImpl as unknown as typeof fetch, sleep, random: () => 0 }
      const first = new OmieClient(clientConfig("shared-rate-key"), dependencies)
      const second = new OmieClient(clientConfig("shared-rate-key"), dependencies)

      await Promise.all([first.request("ListarProdutos"), second.request("ListarProdutos")])
      expect(starts).toEqual([0, 250])
      expect(sleep).toHaveBeenCalledWith(250)
    } finally {
      nowSpy.mockRestore()
    }
  })

  it("caps attempt count at three even if configuration requests more", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(new Response("unavailable", { status: 503 }))
    const client = new OmieClient(
      { ...clientConfig("max-attempts-key"), maxAttempts: 99, baseBackoffMs: 0 },
      { fetchImpl: fetchImpl as unknown as typeof fetch, sleep: jest.fn().mockResolvedValue(undefined), random: () => 0 },
    )

    await expect(client.request("ListarProdutos")).rejects.toMatchObject({
      code: "UPSTREAM",
      retryable: true,
    })
    expect(fetchImpl).toHaveBeenCalledTimes(3)
  })

  it("honors Retry-After on retryable reads", async () => {
    const sleep = jest.fn().mockResolvedValue(undefined)
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce(new Response("limited", { status: 429, headers: { "retry-after": "2" } }))
      .mockResolvedValueOnce(okResponse())
    const client = new OmieClient(
      { ...clientConfig("retry-after-key"), maxAttempts: 2 },
      { fetchImpl: fetchImpl as unknown as typeof fetch, sleep, random: () => 0 },
    )

    await expect(client.request("ListarProdutos")).resolves.toEqual({ ok: true })
    expect(sleep).toHaveBeenCalledWith(2_000)
  })

  it("inspects a typed fault body returned with HTTP 500 without exposing it through Error.cause", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(new Response(JSON.stringify({
      faultcode: "SERVER-500",
      faultstring: "customer@example.com unit-secret-that-must-never-leak",
    }), { status: 500, headers: { "content-type": "application/json" } }))
    const client = new OmieClient(clientConfig("fault-500-key"), { fetchImpl: fetchImpl as unknown as typeof fetch })

    const promise = client.request("ListarProdutos")
    await expect(promise).rejects.toMatchObject({
      code: "SOAP_FAULT",
      status: 500,
      retryable: false,
      upstreamCode: "SERVER-500",
    })
    await expect(promise).rejects.not.toHaveProperty("upstreamMessage")
    await expect(promise).rejects.not.toThrow("unit-secret-that-must-never-leak")
    await expect(promise).rejects.not.toHaveProperty("cause")
  })

  it("does not blindly replay a write after a network or timeout outcome", async () => {
    const fetchImpl = jest.fn().mockRejectedValue(new DOMException("request timed out", "AbortError"))
    const client = new OmieClient(
      { ...clientConfig("no-write-replay-key"), writesEnabled: true, maxAttempts: 3 },
      { fetchImpl: fetchImpl as unknown as typeof fetch, sleep: jest.fn().mockResolvedValue(undefined) },
    )

    await expect(client.request("IncluirPedido")).rejects.toMatchObject({
      code: "TIMEOUT",
      retryable: false,
    })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
  })

  it("may retry a 429 write because the upstream did not accept it", async () => {
    const fetchImpl = jest.fn()
      .mockResolvedValueOnce(new Response("limited", { status: 429, headers: { "retry-after": "0" } }))
      .mockResolvedValueOnce(okResponse({ codigo_pedido: 1 }))
    const client = new OmieClient(
      { ...clientConfig("write-429-key"), writesEnabled: true, maxAttempts: 2 },
      { fetchImpl: fetchImpl as unknown as typeof fetch, sleep: jest.fn().mockResolvedValue(undefined), random: () => 0 },
    )

    await expect(client.request("IncluirPedido")).resolves.toEqual({ codigo_pedido: 1 })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it("does not retain raw arbitrary causes on client errors", () => {
    const error = new OmieClientError({
      code: "NETWORK",
      operation: "ListarProdutos",
      cause: new Error("customer@example.com unit-secret-that-must-never-leak"),
    })

    expect(error.message).not.toContain("unit-secret-that-must-never-leak")
    expect(error).not.toHaveProperty("cause")
  })
})
