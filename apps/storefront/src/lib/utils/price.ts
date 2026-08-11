import { isEmpty } from "@/lib/utils/validation"
import { HttpTypes } from "@medusajs/types"
import { DEFAULT_CURRENCY_CODE, DEFAULT_LOCALE } from "@/config/commerce"

// ============ FORMAT PRICE ============

type FormatPriceParams = {
  amount: number
  currency_code?: string
  minimumFractionDigits?: number
  maximumFractionDigits?: number
  locale?: string
}

export const formatPrice = ({
  amount,
  currency_code = DEFAULT_CURRENCY_CODE,
  minimumFractionDigits,
  maximumFractionDigits,
  locale = DEFAULT_LOCALE,
}: FormatPriceParams): string => {
  const resolvedCurrencyCode =
    currency_code && !isEmpty(currency_code)
      ? currency_code.toUpperCase()
      : DEFAULT_CURRENCY_CODE

  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: resolvedCurrencyCode,
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(amount)
}

export const formatMoneyAmountForStructuredData = (amount: number): string => {
  if (!Number.isFinite(amount)) {
    throw new Error("Structured money amount must be finite")
  }

  return amount.toFixed(2)
}

// ============ PERCENTAGE DIFF ============

export const getPricePercentageDiff = (original: number, calculated: number): string => {
  const diff = original - calculated
  const decrease = (diff / original) * 100

  return decrease.toFixed()
}

// ============ PRODUCT PRICE ============

export const getPricesForVariant = (variant: HttpTypes.StoreProductVariant | undefined): {
  calculated_price_number: number;
  calculated_price: string;
  original_price_number: number;
  original_price: string;
  currency_code: string;
  price_type: string;
  percentage_diff: string;
} | null => {
  const calculatedPrice = variant?.calculated_price
  if (calculatedPrice?.calculated_amount === null || calculatedPrice?.calculated_amount === undefined || !calculatedPrice.currency_code) {
    return null
  }

  const calculatedAmount = calculatedPrice.calculated_amount
  const originalAmount = calculatedPrice.original_amount ?? calculatedAmount
  const currencyCode = calculatedPrice.currency_code
  const priceListType = calculatedPrice.calculated_price?.price_list_type ?? ""

  return {
    calculated_price_number: calculatedAmount,
    calculated_price: formatPrice({
      amount: calculatedAmount,
      currency_code: currencyCode,
    }),
    original_price_number: originalAmount,
    original_price: formatPrice({
      amount: originalAmount,
      currency_code: currencyCode,
    }),
    currency_code: currencyCode,
    price_type: priceListType,
    percentage_diff: getPricePercentageDiff(
      originalAmount,
      calculatedAmount
    ),
  }
}

export function getProductPrice({
  product,
  variant_id,
}: {
  product: HttpTypes.StoreProduct
  variant_id?: string
}): {
  product: HttpTypes.StoreProduct;
  cheapestPrice: {
    calculated_price_number: number;
    calculated_price: string;
    original_price_number: number;
    original_price: string;
    currency_code: string;
    price_type: string;
    percentage_diff: string;
  } | null;
  variantPrice: {
    calculated_price_number: number;
    calculated_price: string;
    original_price_number: number;
    original_price: string;
    currency_code: string;
    price_type: string;
    percentage_diff: string;
  } | null;
} {
  if (!product || !product.id) {
    throw new Error("No product provided")
  }

  const cheapestPrice = () => {
    if (!product || !product.variants?.length) {
      return null
    }

    const variantsWithPrice = product.variants.filter(
      (v): v is HttpTypes.StoreProductVariant & { calculated_price: NonNullable<HttpTypes.StoreProductVariant["calculated_price"]> } =>
        !!v.calculated_price
    )
    const cheapestVariant = variantsWithPrice.sort((a, b) => {
      return (
        (a.calculated_price.calculated_amount ?? 0) -
        (b.calculated_price.calculated_amount ?? 0)
      )
    })[0]

    return getPricesForVariant(cheapestVariant)
  }

  const variantPrice = () => {
    if (!product || !variant_id) {
      return null
    }

    const variant = product.variants?.find(
      (v) => v.id === variant_id || v.sku === variant_id
    )

    if (!variant) {
      return null
    }

    return getPricesForVariant(variant)
  }

  return {
    product,
    cheapestPrice: cheapestPrice(),
    variantPrice: variantPrice(),
  }
}
