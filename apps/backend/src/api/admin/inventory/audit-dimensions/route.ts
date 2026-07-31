import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { Modules } from "@medusajs/framework/utils"

export async function GET(
  req: MedusaRequest,
  res: MedusaResponse
) {
  const productModule = req.scope.resolve(Modules.PRODUCT)

  const [variants] = await productModule.listAndCountProductVariants({}, { select: ["id", "title", "weight", "width", "length", "height", "product_id"], relations: ["product"] })

  const missingDimensions: any[] = []

  for (const variant of variants) {
    if (!variant.weight || !variant.width || !variant.length || !variant.height) {
      missingDimensions.push({
        variant_id: variant.id,
        variant_title: variant.title,
        product_id: variant.product_id,
        product_title: variant.product?.title,
        missing: {
          weight: !variant.weight,
          width: !variant.width,
          length: !variant.length,
          height: !variant.height
        }
      })
    }
  }

  res.json({
    total_variants_checked: variants.length,
    variants_missing_dimensions: missingDimensions.length,
    details: missingDimensions
  })
}