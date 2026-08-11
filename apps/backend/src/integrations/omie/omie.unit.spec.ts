import {
  OmieClient,
  OmieClientError,
  OmieCatalogReader,
  commercialStatusFor,
  loadOmieConfig,
  normalizeOmieProduct,
  planCatalogSync,
} from "./index.js"

describe("Omie configuration", () => {
  it("does not enable the client when any credential is absent", () => {
    expect(
      loadOmieConfig({
        OMIE_API_URL: "https://example.invalid",
        OMIE_APP_KEY: "fixture-key",
        OMIE_APP_SECRET: "",
      }),
    ).toBeNull()
  })
})

describe("OmieClient", () => {
  it("retries a rate limit with bounded backoff and never logs credentials", async () => {
    const sleep = jest.fn().mockResolvedValue(undefined)
    const logger = { warn: jest.fn() }
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(
        new Response("rate limited", {
          status: 429,
          headers: { "retry-after": "0" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ produto_servico_cadastro: [] }), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      )

    const client = new OmieClient(
      {
        apiUrl: "https://example.invalid",
        appKey: "fixture-secret-key",
        appSecret: "fixture-secret-value",
        maxAttempts: 2,
      },
      { fetchImpl: fetchImpl as unknown as typeof fetch, sleep, random: () => 0, logger },
    )

    await expect(client.request("ListarProdutos")).resolves.toEqual({
      produto_servico_cadastro: [],
    })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(sleep).toHaveBeenCalledWith(0)
    expect(JSON.stringify(logger.warn.mock.calls)).not.toContain("fixture-secret")
  })

  it("retries bounded upstream failures", async () => {
    const fetchImpl = jest
      .fn()
      .mockResolvedValueOnce(new Response("upstream", { status: 503 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ok: true }), { status: 200 }))
    const sleep = jest.fn().mockResolvedValue(undefined)
    const client = new OmieClient(
      {
        apiUrl: "https://example.invalid",
        appKey: "fixture-key",
        appSecret: "fixture-secret",
        maxAttempts: 2,
        baseBackoffMs: 1,
      },
      {
        fetchImpl: fetchImpl as unknown as typeof fetch,
        sleep,
        random: () => 0,
      },
    )

    await expect(client.request("ListarProdutos")).resolves.toEqual({ ok: true })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
    expect(sleep).toHaveBeenCalledWith(1)
  })

  it("sanitizes malformed response errors", async () => {
    const client = new OmieClient(
      {
        apiUrl: "https://example.invalid",
        appKey: "fixture-key",
        appSecret: "fixture-secret",
        maxAttempts: 1,
      },
      {
        fetchImpl: jest.fn().mockResolvedValue(
          new Response("not-json", { status: 200 }),
        ),
      },
    )

    const promise = client.request("ListarProdutos")
    await expect(promise).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
      operation: "ListarProdutos",
    })
    await expect(promise).rejects.not.toThrow("fixture-secret")
  })

  it("rejects non-read operations before making a network call", async () => {
    const fetchImpl = jest.fn()
    const client = new OmieClient(
      {
        apiUrl: "https://example.invalid",
        appKey: "fixture-key",
        appSecret: "fixture-secret",
      },
      { fetchImpl: fetchImpl as unknown as typeof fetch },
    )

    await expect(client.request("IncluirProduto")).rejects.toMatchObject({
      code: "READ_ONLY_VIOLATION",
    })
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it("retries network failures and reports timeout without exposing details", async () => {
    const fetchImpl = jest
      .fn()
      .mockRejectedValue(new DOMException("fixture timeout", "AbortError"))
    const client = new OmieClient(
      {
        apiUrl: "https://example.invalid",
        appKey: "fixture-key",
        appSecret: "fixture-secret",
        maxAttempts: 2,
        baseBackoffMs: 1,
      },
      {
        fetchImpl: fetchImpl as unknown as typeof fetch,
        sleep: jest.fn().mockResolvedValue(undefined),
        random: () => 0,
      },
    )

    await expect(client.request("ListarProdutos")).rejects.toMatchObject({
      code: "TIMEOUT",
      retryable: true,
    })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })
})

describe("Omie discovery mapping", () => {
  it("normalizes only observed values and keeps incomplete products quote-only", () => {
    const product = normalizeOmieProduct({
      id_produto: "fixture-product-1",
      descricao: "Fixture Produto",
      codigo_produto: "FIXTURE-SKU-1",
      valor_unitario: 10,
      quantidade_estoque: 4,
    })

    expect(product.externalId).toBe("fixture-product-1")
    expect(product.variants[0]?.sku).toBe("FIXTURE-SKU-1")
    expect(product.commercialStatus).toBe("QUOTE_ONLY")
    expect(product.approval).toEqual({
      product: false,
      price: false,
      inventory: false,
      fiscal: false,
      shipping: false,
    })
  })

  it("never makes a product sellable without every explicit approval", () => {
    expect(
      commercialStatusFor(
        { product: true, price: true, inventory: true, fiscal: true, shipping: true },
        { amount: 25, currency: "BRL", sourceField: "fixture" },
        { quantity: 2, location: "fixture-location", sourceField: "fixture" },
      ),
    ).toBe("SELLABLE")
    expect(
      commercialStatusFor(
        { product: true, price: true, inventory: true, fiscal: true, shipping: false },
        { amount: 25, currency: "BRL", sourceField: "fixture" },
        { quantity: 2, location: "fixture-location", sourceField: "fixture" },
      ),
    ).toBe("QUOTE_ONLY")
  })

  it("paginates read-only product discovery", async () => {
    const client = new OmieClient(
      {
        apiUrl: "https://example.invalid",
        appKey: "fixture-key",
        appSecret: "fixture-secret",
      },
      {
        fetchImpl: jest
          .fn()
          .mockResolvedValueOnce(
            new Response(JSON.stringify({ produto_servico_cadastro: [{ id_produto: "1" }] }), { status: 200 }),
          )
          .mockResolvedValueOnce(
            new Response(JSON.stringify({ produto_servico_cadastro: [] }), { status: 200 }),
          ),
      },
    )

    const reader = new OmieCatalogReader(client)
    await expect(reader.readAll({ pageSize: 1 })).resolves.toEqual([{ id_produto: "1" }])
  })
})

describe("Omie dry-run reconciliation", () => {
  const fixture = normalizeOmieProduct({
    id_produto: "fixture-product-1",
    descricao: "Fixture Produto",
    codigo_produto: "FIXTURE-SKU-1",
  })

  it("is idempotent for the same source projection", () => {
    const first = planCatalogSync([fixture], [])
    const second = planCatalogSync([fixture], [fixture])

    expect(first).toEqual({
      dryRun: true,
      items: [
        {
          operation: "create",
          externalId: "fixture-product-1",
          sku: "FIXTURE-SKU-1",
          reason: "no matching Medusa record",
        },
      ],
    })
    expect(second.items[0]?.operation).toBe("no-op")
  })

  it("fails closed on duplicate stable identifiers", () => {
    const duplicate = { ...fixture, title: "Fixture Produto Duplicado" }
    const plan = planCatalogSync([fixture, duplicate], [])

    expect(plan.items.map((item) => item.operation)).toEqual(["create", "conflict"])
  })

  it("fails closed when the existing projection already has duplicate identifiers", () => {
    const duplicate = { ...fixture, title: "Fixture Produto Duplicado" }
    const plan = planCatalogSync([fixture], [fixture, duplicate])

    expect(plan.items[0]?.operation).toBe("conflict")
  })

  it("does not write anything in dry-run mode", () => {
    const plan = planCatalogSync([fixture], [])
    expect(plan.dryRun).toBe(true)
    expect(plan).not.toHaveProperty("database")
  })
})

describe("OmieClientError", () => {
  it("does not include response bodies or secrets in its message", () => {
    const error = new OmieClientError({
      code: "UPSTREAM",
      operation: "ListarProdutos",
      status: 503,
      cause: "fixture-secret",
    })

    expect(error.message).not.toContain("fixture-secret")
    expect(error.message).toBe("Omie ListarProdutos failed (UPSTREAM)")
  })
})
