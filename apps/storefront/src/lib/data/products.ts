import { sdk } from "@/lib/medusa";
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
  response: {
    products: HttpTypes.StoreProduct[];
    count: number;
    next_page: number | null;
  }
}> => {
  const limit = query_params?.limit || 12;
  const offset = (page_param - 1) * limit;

  try {
    const response = await sdk.store.product.list({
      limit,
      offset,
      region_id,
      ...query_params,
    });

    const next_page =
      response.count > offset + limit ? page_param + 1 : null;

    return {
      response: {
        products: response.products,
        count: response.count,
        next_page,
      }
    };
  } catch (error) {
    console.error("Error fetching products", error);
    return {
      response: {
        products: [],
        count: 0,
        next_page: null,
      }
    };
  }
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
  return listProducts({
    page_param,
    query_params,
    region_id,
  })
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
  const response = await sdk.store.product.list({
    handle,
    region_id,
    fields,
  });

  if (!response.products || response.products.length === 0) {
    throw new Error(`Product with handle ${handle} not found`);
  }

  return response.products[0];
}
