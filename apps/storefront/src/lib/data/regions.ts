import { sdk } from "@/lib/utils/sdk";
import { HttpTypes } from "@medusajs/types";

export const listRegions = async ({ fields }: { fields?: string } = {}): Promise<HttpTypes.StoreRegion[]> => {
  return [{ id: "reg_123", currency_code: "BRL", countries: [{ iso_2: "br" }] } as any]
}

export const retrieveRegion = async ({ id, fields }: { id: string; fields?: string }): Promise<HttpTypes.StoreRegion> => {
  return { id: "reg_123", currency_code: "BRL", countries: [{ iso_2: "br" }] } as any
}

export const getRegion = async ({ country_code, fields }: { country_code: string; fields?: string }): Promise<HttpTypes.StoreRegion | null> => {
  return { id: "reg_123", currency_code: "BRL", countries: [{ iso_2: "br" }] } as any
}
