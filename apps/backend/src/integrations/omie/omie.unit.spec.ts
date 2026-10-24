import {
  OmieClient,
  OmieClientError,
  OmieCatalogReader,
  OmieStockReader,
  commercialStatusFor,
  loadOmieConfig,
  normalizeOmieStock,
  normalizeOmieProduct,
  planCatalogSync,
  findOmieProductsByCode,
  normalizeOmieProductCode,
  RESOLVE_OMIE_ENDPOINT,
  WRITE_OPERATIONS,
  isWriteOperation,
  calculateAvailableStock,
  extractTechnicalAttributes,
  mapCustomerToOmieUpsert,
  mapOrderToOmieOrder,
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

  it("routes ListarPosEstoque to the official stock endpoint while remaining read-only", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ nTotPaginas: 1, produtos: [{ nCodProd: 10, cCodigo: "SKU-10", fisico: 4 }] }), { status: 200 }),
    )
    const client = new OmieClient(
      { apiUrl: "https://example.invalid/api/v1/geral/produtos/", appKey: "fixture-key", appSecret: "fixture-secret" },
      { fetchImpl: fetchImpl as unknown as typeof fetch },
    )

    await expect(client.request("ListarPosEstoque", { nPagina: 1 })).resolves.toMatchObject({ nTotPaginas: 1 })
    expect(fetchImpl.mock.calls[0]?.[0]).toBe("https://example.invalid/api/v1/estoque/consulta/")
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

  it("resolves dynamic endpoints for all critical Omie categories", () => {
    const base = "https://app.omie.com.br"
    expect(RESOLVE_OMIE_ENDPOINT("ListarPosEstoque", base)).toBe("https://app.omie.com.br/api/v1/estoque/consulta/")
    expect(RESOLVE_OMIE_ENDPOINT("PosicaoEstoque", base)).toBe("https://app.omie.com.br/api/v1/estoque/consulta/")
    expect(RESOLVE_OMIE_ENDPOINT("IncluirAjusteEstoque", base)).toBe("https://app.omie.com.br/api/v1/estoque/ajuste/")
    expect(RESOLVE_OMIE_ENDPOINT("IncluirLocalEstoque", base)).toBe("https://app.omie.com.br/api/v1/estoque/local/")
    expect(RESOLVE_OMIE_ENDPOINT("ListarMovimentos", base)).toBeNull()
    expect(RESOLVE_OMIE_ENDPOINT("ListarProdutos", base)).toBe("https://app.omie.com.br/api/v1/geral/produtos/")
    expect(RESOLVE_OMIE_ENDPOINT("IncluirPedido", base)).toBe("https://app.omie.com.br/api/v1/produtos/pedido/")
    expect(RESOLVE_OMIE_ENDPOINT("FaturarPedidoVenda", base)).toBe("https://app.omie.com.br/api/v1/produtos/pedido/")
    expect(RESOLVE_OMIE_ENDPOINT("ConsultarNF", base)).toBe("https://app.omie.com.br/api/v1/produtos/nfconsultar/")
    expect(RESOLVE_OMIE_ENDPOINT("GetUrlDanfe", base)).toBe("https://app.omie.com.br/api/v1/produtos/notafiscalutil/")
    expect(RESOLVE_OMIE_ENDPOINT("UpsertClienteCpfCnpj", base)).toBe("https://app.omie.com.br/api/v1/geral/clientes/")
    expect(RESOLVE_OMIE_ENDPOINT("GerarPix", base)).toBe("https://app.omie.com.br/api/v1/financas/pix/")
    expect(RESOLVE_OMIE_ENDPOINT("GerarBoleto", base)).toBe("https://app.omie.com.br/api/v1/financas/contareceberboleto/")
    expect(RESOLVE_OMIE_ENDPOINT("LancarRecebimento", base)).toBe("https://app.omie.com.br/api/v1/financas/contareceber/")
  })

  it("permits write operations when writesEnabled is true", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ numero_pedido: "12345", codigo_pedido: 998877 }), { status: 200 }),
    )
    const client = new OmieClient(
      {
        apiUrl: "https://example.invalid",
        appKey: "fixture-key",
        appSecret: "fixture-secret",
        writesEnabled: true,
      },
      { fetchImpl: fetchImpl as unknown as typeof fetch },
    )

    const result = await client.request("IncluirPedido", { cabecalho: { etapa: "20" } })
    expect(result).toEqual({ numero_pedido: "12345", codigo_pedido: 998877 })
    expect(fetchImpl).toHaveBeenCalledTimes(1)
    expect(fetchImpl.mock.calls[0]?.[0]).toBe("https://example.invalid/api/v1/produtos/pedido/")
  })

  it("intercepts SOAP faults in JSON response and throws typed SOAP_FAULT error", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      new Response(
        JSON.stringify({
          faultstring: "ERROR: Cliente não encontrado para o CPF informado",
          faultcode: "SOAP-ENV:Client-500",
        }),
        { status: 200, headers: { "content-type": "application/json" } },
      ),
    )
    const client = new OmieClient(
      {
        apiUrl: "https://example.invalid",
        appKey: "fixture-key",
        appSecret: "fixture-secret",
        writesEnabled: true,
      },
      { fetchImpl: fetchImpl as unknown as typeof fetch },
    )

    await expect(client.request("ConsultarCliente", { cCPF: "00000000000" })).rejects.toMatchObject({
      code: "SOAP_FAULT",
      upstreamCode: "SOAP-ENV:Client-500",
    })
  })
})

describe("Omie discovery mapping", () => {
  it("validates exact string codes without losing leading zeroes", () => {
    expect(normalizeOmieProductCode("  000123  ")).toBe("000123")
    expect(normalizeOmieProductCode("12 3")).toBeNull()
    expect(normalizeOmieProductCode(123)).toBeNull()
  })

  it("matches codes case-insensitively without matching a partial value", () => {
    const products = [
      { cCodigo: "Ab-001", nCodProd: "omie-1" },
      { cCodigo: "AB-001-extra", nCodProd: "omie-2" },
    ]
    expect(findOmieProductsByCode(products, " ab-001 ")).toEqual([products[0]])
  })

  it("prioritizes the canonical codigo field over a legacy cCodigo match", () => {
    const products = [
      { codigo: "DPGS1347", cCodigo: "LEGACY-1", nCodProd: "omie-1" },
      { codigo: "OTHER", cCodigo: "DPGS1347", nCodProd: "omie-2" },
    ]
    expect(findOmieProductsByCode(products, "DPGS1347")).toEqual([products[0]])
  })

  it("classifies stock source states without converting missing or negative values to zero", () => {
    expect(normalizeOmieStock({ nCodProd: 1, cCodigo: "SKU-1", fisico: 0 }).state).toBe("REAL_ZERO")
    expect(normalizeOmieStock({ nCodProd: 1, cCodigo: "SKU-1", fisico: -1 }).state).toBe("INVALID")
    expect(normalizeOmieStock({ nCodProd: 1, cCodigo: "SKU-1" }).state).toBe("MISSING")
  })

  it("preserves numeric Omie identifiers as lossless strings and prioritizes real product code as SKU", () => {
    const product = normalizeOmieProduct({ codigo_produto: 12345, codigo: 67890, unidade: "KG" })
    expect(product.externalId).toBe("12345")
    expect(product.code).toBe("67890")
    expect(product.unit).toBe("KG")
    expect(product.variants[0]?.sku).toBe("67890")
    expect(product.variants[0]?.unit).toBe("KG")
  })

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

  it("paginates the operational stock endpoint and preserves real zero", async () => {
    const client = new OmieClient(
      { apiUrl: "https://example.invalid/api/v1/geral/produtos/", appKey: "fixture-key", appSecret: "fixture-secret" },
      {
        fetchImpl: jest.fn()
          .mockResolvedValueOnce(new Response(JSON.stringify({ nTotPaginas: 2, produtos: [{ nCodProd: 1, cCodigo: "SKU-1", fisico: 0 }] }), { status: 200 }))
          .mockResolvedValueOnce(new Response(JSON.stringify({ nTotPaginas: 2, produtos: [{ nCodProd: 2, cCodigo: "SKU-2", fisico: 3 }] }), { status: 200 })),
      },
    )

    await expect(new OmieStockReader(client).readAll({ pageSize: 1 })).resolves.toEqual([
      expect.objectContaining({ externalId: "1", state: "REAL_ZERO", physical: 0 }),
      expect.objectContaining({ externalId: "2", state: "REAL_POSITIVE", physical: 3 }),
    ])
  })

  it("passes the homologated stock location to the operational endpoint", async () => {
    const fetchImpl = jest.fn().mockResolvedValue(
      new Response(JSON.stringify({ nTotPaginas: 1, produtos: [] }), { status: 200 }),
    )
    const client = new OmieClient(
      { apiUrl: "https://example.invalid/api/v1/geral/produtos/", appKey: "fixture-key", appSecret: "fixture-secret" },
      { fetchImpl: fetchImpl as unknown as typeof fetch },
    )

    await new OmieStockReader(client).readPage(1, { locationCode: 1982255302 })
    const request = JSON.parse(String(fetchImpl.mock.calls[0]?.[1]?.body)) as { param?: Array<Record<string, unknown>> }
    expect(request.param?.[0]?.codigo_local_estoque).toBe(1982255302)
  })

  it("fails closed when the upstream repeats a non-empty page", async () => {
    const page = new Response(JSON.stringify({ produto_servico_cadastro: [{ id_produto: "1" }] }), { status: 200 })
    const client = new OmieClient(
      { apiUrl: "https://example.invalid", appKey: "fixture-key", appSecret: "fixture-secret" },
      { fetchImpl: jest.fn().mockResolvedValueOnce(page).mockResolvedValueOnce(
        new Response(JSON.stringify({ produto_servico_cadastro: [{ id_produto: "1" }] }), { status: 200 }),
      ) },
    )

    await expect(new OmieCatalogReader(client).readAll({ pageSize: 1 })).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
      operation: "ListarProdutos",
    })
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

describe("Omie Stock Calculation & Available Stock", () => {
  it("calculates available stock applying Math.max(0, physical - reserved)", () => {
    expect(calculateAvailableStock(10, 3)).toBe(7)
    expect(calculateAvailableStock(10, 10)).toBe(0)
    expect(calculateAvailableStock(10, 15)).toBe(0)
    expect(calculateAvailableStock(0, 5)).toBe(0)
    expect(() => calculateAvailableStock(null, 0)).toThrow("OMIE_INVALID_STOCK")
    expect(() => calculateAvailableStock(undefined, 2)).toThrow("OMIE_INVALID_STOCK")
    expect(() => calculateAvailableStock(-5, 0)).toThrow("OMIE_INVALID_STOCK")
  })
})

describe("Omie Technical Attributes & Fiscal Mapping", () => {
  it("extracts brand, BTU capacity, voltage, gas type and inverter from product data", () => {
    const record = {
      descricao: "Ar Condicionado Split Hi Wall Daikin 12000 BTUs 220V Inverter R-32",
      ncm: "8415.10.11",
      cest: "21.001.00",
      ean: "7891234567890",
      peso_bruto: 32.5,
      peso_liquido: 29.8,
      altura: 55,
      largura: 80,
      profundidade: 30,
      dias_garantia: 365,
    }

    const attrs = extractTechnicalAttributes(record, record.descricao)
    expect(attrs.brand).toBe("Daikin")
    expect(attrs.capacity_btu).toBe(12000)
    expect(attrs.voltage).toBe("220V")
    expect(attrs.gas_type).toBe("R32")
    expect(attrs.inverter).toBe(true)
    expect(attrs.ncm).toBe("8415.10.11")
    expect(attrs.cest).toBe("21.001.00")
    expect(attrs.ean).toBe("7891234567890")
    expect(attrs.gross_weight).toBe(32.5)
    expect(attrs.warranty_days).toBe(365)
  })

  it("maps FiscalCustomerInput to Omie UpsertClienteCpfCnpj payload correctly", () => {
    const customer = {
      external_id: "cus_01JABCDEF",
      name: "Frigga Climatização LTDA",
      document: { type: "CNPJ" as const, number: "12.345.678/0001-99" },
      email: "financeiro@frigga.com.br",
      phone: "+55 (11) 98765-4321",
      consumer_final: false,
      state_registration: "111222333444",
      address: {
        address_1: "Avenida Paulista",
        number: "1000",
        neighborhood: "Bela Vista",
        city: "São Paulo",
        state: "SP",
        postal_code: "01310-100",
        country_code: "BR",
        ibge_code: "3550308",
      },
    }

    const payload = mapCustomerToOmieUpsert(customer)
    expect(payload.codigo_cliente_integracao).toBe("cus_01JABCDEF")
    expect(payload.cnpj_cpf).toBe("12345678000199")
    expect(payload.razao_social).toBe("Frigga Climatização LTDA")
    expect(payload.contribuinte).toBe("S")
    expect(payload.inscricao_estadual).toBe("111222333444")
    expect(payload.cidade_ibge).toBe("3550308")
    expect(payload.tags).toContainEqual({ tag: "CLIENTE_B2B" })
  })

  it("maps FiscalOrderInput to Omie IncluirPedido payload with installments and freight", () => {
    const order = {
      medusa_order_id: "order_01JXYZ",
      customer: {
        external_id: "cus_01JABCDEF",
        name: "João Silva",
        document: { type: "CPF" as const, number: "123.456.789-00" },
        consumer_final: true,
        address: {
          address_1: "Rua das Flores",
          city: "São Paulo",
          state: "SP",
          postal_code: "01000-000",
          country_code: "BR",
        },
      },
      items: [
        {
          sku: "DAIKIN-12K-220V",
          quantity: 1,
          unit_price: 3200,
          discount: 100,
          product: {
            sku: "DAIKIN-12K-220V",
            omie_code: "1988730838",
            description: "Split Daikin 12000",
            unit: "UN",
            ncm: "84151011",
            origin: 0,
            cfop: "5102",
            cst_csosn: "00",
            tax_scenario: "123456",
          },
        },
      ],
      subtotal: 3100,
      shipping: 150,
      total: 3250,
      currency_code: "BRL",
      payment: {
        status: "captured" as const,
        method: "pix" as const,
        installments: 1,
      },
      shipping_method: {
        key: "express",
        amount: 150,
        pickup: false,
        state: "SP",
      },
    }

    const payload = mapOrderToOmieOrder(order, { defaultCenarioImpostos: 123456, defaultCategory: "1.01.01", defaultBankAccount: 123 })
    expect(payload.cabecalho.codigo_pedido_integracao).toBe("order_01JXYZ")
    expect(payload.cabecalho.etapa).toBe("20")
    expect(payload.det).toHaveLength(1)
    expect(payload.det[0].produto.codigo_produto).toBe(1988730838)
    expect(payload.det[0].produto.valor_unitario).toBe(3200)
    expect(payload.det[0].produto.valor_desconto).toBe(100)
    expect(payload.frete?.modalidade).toBe("0")
    expect(payload.frete?.valor_frete).toBe(150)
    expect(payload.parcelas).toHaveLength(1)
    expect(payload.parcelas?.[0].valor).toBe(3250)
  })
})
