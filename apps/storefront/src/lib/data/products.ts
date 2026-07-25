import { sdk } from "@/lib/utils/sdk";
import { HttpTypes } from "@medusajs/types";

export type ListProductsQueryParams = HttpTypes.StoreProductListParams & {
  option_value_id?: string | string[]
}

export const listProducts = async ({
  page_param = 1,
  query_params,
  region_id,
}: {
  page_param?: number;
  query_params?: ListProductsQueryParams;
  region_id?: string;
}): Promise<{
  products: HttpTypes.StoreProduct[];
  count: number;
  next_page: number | null;
}> => {
  return { products: [], count: 0, next_page: null }
}

export const listAndSortProducts = async ({
  page_param = 1,
  query_params,
  region_id,
  optionValueIds,
}: {
  page_param?: number;
  query_params?: ListProductsQueryParams;
  region_id?: string;
  optionValueIds?: string[];
}) => {
  return { products: [], count: 0, next_page: null }
}

export const retrieveProduct = async ({
  handle,
  region_id,
  fields,
}: {
  handle: string;
  region_id?: string;
  fields?: string;
}): Promise<HttpTypes.StoreProduct> => {
  throw new Error("Mock Product not found");
}
