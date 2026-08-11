import { readFileSync } from "node:fs"
import { resolve } from "node:path"
import {
  COMMERCIAL_DEFAULTS,
  buildCommercialBootstrapPlan,
  mergeRegionCountryCodes,
  mergeSupportedCurrencies,
  mergeSupportedLocales,
  validateCommercialDefaults,
  type CommercialState,
} from "../lib/commerce-defaults"
import { formatAmount } from "../admin/utils/format-amount"

const appliedState = (): CommercialState => ({
  regions: [
    {
      id: "reg_br",
      name: "Brasil",
      currency_code: "brl",
      countries: [{ iso_2: "br" }],
      metadata: {
        commercial_defaults_key: COMMERCIAL_DEFAULTS.bootstrapKey,
      },
    },
  ],
  salesChannels: [
    {
      id: "sc_br",
      name: "Canal Brasil",
      is_disabled: false,
      metadata: {
        commercial_defaults_key: COMMERCIAL_DEFAULTS.bootstrapKey,
      },
    },
  ],
  stores: [
    {
      id: "store_br",
      name: "FriggaFrio",
      default_region_id: "reg_br",
      default_sales_channel_id: "sc_br",
      supported_currencies: [{ currency_code: "brl", is_default: true }],
      supported_locales: [{ locale_code: "pt-BR" }],
      metadata: {
        commercial_defaults_key: COMMERCIAL_DEFAULTS.bootstrapKey,
      },
    },
  ],
})

describe("Brazil commercial defaults", () => {
  it("validates the fixed Brazil contract", () => {
    expect(() => validateCommercialDefaults()).not.toThrow()
    expect(COMMERCIAL_DEFAULTS).toMatchObject({
      countryCode: "br",
      currencyCode: "brl",
      localeCode: "pt-BR",
      regionName: "Brasil",
    })

    expect(() =>
      validateCommercialDefaults({
        ...COMMERCIAL_DEFAULTS,
        currencyCode: "usd",
      } as unknown as typeof COMMERCIAL_DEFAULTS)
    ).toThrow('Commercial currency must be "brl".')
  })

  it("plans creation when no commercial records exist", () => {
    expect(
      buildCommercialBootstrapPlan({
        regions: [],
        salesChannels: [],
        stores: [],
      })
    ).toEqual({
      region: { action: "create" },
      salesChannel: { action: "create" },
      store: { action: "create" },
    })
  })

  it("plans updates for foreign defaults without creating duplicates", () => {
    const state = appliedState()
    state.regions[0].currency_code = "usd"
    state.regions[0].countries = [{ iso_2: "us" }]
    state.stores[0].supported_currencies = [
      { currency_code: "usd", is_default: true },
    ]
    state.stores[0].supported_locales = [{ locale_code: "en-US" }]

    expect(buildCommercialBootstrapPlan(state)).toEqual({
      region: { action: "update", id: "reg_br" },
      salesChannel: { action: "none", id: "sc_br" },
      store: { action: "update", id: "store_br" },
    })
  })

  it("resolves existing records by stable country and store references", () => {
    const state = appliedState()
    state.regions[0] = {
      ...state.regions[0],
      name: "Regiao antiga",
      currency_code: "usd",
      metadata: {},
    }
    state.salesChannels[0] = {
      ...state.salesChannels[0],
      name: "Default Sales Channel",
      metadata: {},
    }
    state.stores[0] = {
      ...state.stores[0],
      metadata: {},
    }

    expect(buildCommercialBootstrapPlan(state)).toEqual({
      region: { action: "update", id: "reg_br" },
      salesChannel: { action: "update", id: "sc_br" },
      store: { action: "update", id: "store_br" },
    })
  })

  it("is idempotent after the desired state is present", () => {
    const state = appliedState()
    const firstPlan = buildCommercialBootstrapPlan(state)
    const secondPlan = buildCommercialBootstrapPlan(state)

    expect(firstPlan).toEqual(secondPlan)
    expect(firstPlan).toEqual({
      region: { action: "none", id: "reg_br" },
      salesChannel: { action: "none", id: "sc_br" },
      store: { action: "none", id: "store_br" },
    })
  })

  it("preserves additional commercial relations while defaulting Brazil", () => {
    expect(
      mergeRegionCountryCodes([{ iso_2: "us" }, { iso_2: "br" }])
    ).toEqual(["us", "br"])
    expect(
      mergeSupportedCurrencies([
        { currency_code: "usd", is_default: true, is_tax_inclusive: true },
        { currency_code: "brl", is_default: false },
      ])
    ).toEqual([
      { currency_code: "brl", is_default: true },
      {
        currency_code: "usd",
        is_default: false,
        is_tax_inclusive: true,
      },
    ])
    expect(
      mergeSupportedLocales([
        { locale_code: "en-US" },
        { locale_code: "pt-BR" },
      ])
    ).toEqual([{ locale_code: "en-US" }, { locale_code: "pt-BR" }])
  })

  it("accepts preserved non-default currencies and locales as current", () => {
    const state = appliedState()
    state.regions[0].countries?.push({ iso_2: "us" })
    state.stores[0].supported_currencies?.push({
      currency_code: "usd",
      is_default: false,
      is_tax_inclusive: true,
    })
    state.stores[0].supported_locales?.push({ locale_code: "en-US" })

    expect(buildCommercialBootstrapPlan(state)).toEqual({
      region: { action: "none", id: "reg_br" },
      salesChannel: { action: "none", id: "sc_br" },
      store: { action: "none", id: "store_br" },
    })
  })

  it("rejects ambiguous stores instead of mutating an arbitrary record", () => {
    const state = appliedState()
    state.stores = [
      { ...state.stores[0], id: "store_one", metadata: {} },
      { ...state.stores[0], id: "store_two", metadata: {} },
    ]

    expect(() => buildCommercialBootstrapPlan(state)).toThrow(
      "Multiple stores exist"
    )
  })

  it("rejects conflicting Brazil region identifiers", () => {
    const state = appliedState()
    state.regions[0].countries = [{ iso_2: "us" }]
    state.regions.push({
      id: "reg_conflict",
      name: "Outra regiao",
      currency_code: "brl",
      countries: [{ iso_2: "br" }],
      metadata: {},
    })

    expect(() => buildCommercialBootstrapPlan(state)).toThrow(
      "Conflicting region records"
    )
  })

  it("rejects conflicting default and keyed sales channels", () => {
    const state = appliedState()
    state.salesChannels.push({
      id: "sc_default",
      name: "Default Sales Channel",
      is_disabled: false,
      metadata: {},
    })
    state.stores[0].default_sales_channel_id = "sc_default"

    expect(() => buildCommercialBootstrapPlan(state)).toThrow(
      "Conflicting sales channels"
    )
  })

  it("formats Medusa V2 money values directly without factor-100 conversion", () => {
    expect(formatAmount(1234.56, "brl")).toContain("1.234,56")

    const source = readFileSync(
      resolve(process.cwd(), "src/admin/utils/format-amount.ts"),
      "utf8"
    )
    expect(source).not.toMatch(/amount\s*[*/]\s*100|100\s*[*/]\s*amount/)
  })

  it("keeps the seed free of foreign currency and country fallbacks", () => {
    const source = readFileSync(
      resolve(process.cwd(), "src/scripts/seed.ts"),
      "utf8"
    ).toLowerCase()

    expect(source).not.toMatch(/\b(?:usd|eur|en-us|country_code:\s*["']us)\b/)
    expect(source).not.toMatch(/amount\s*[*/]\s*100|100\s*[*/]\s*amount/)
  })
})
