import { PRODUCT_REVIEW_MODULE } from "../../../../modules/product-review"
import { ProductReviewStatus } from "../../../../modules/product-review/models/product-review"
import { GET } from "./route"

describe("GET /store/product-reviews/summaries", () => {
  it("aggregates approved reviews in one bounded query", async () => {
    const service = {
      listProductReviews: jest.fn(async () => [
        { product_id: "prod_1", rating: 4 },
        { product_id: "prod_1", rating: 5 },
      ]),
    }
    const res = { json: jest.fn() }
    await GET({
      query: { product_ids: "prod_1,prod_2,prod_1" },
      scope: { resolve: (key: unknown) => key === PRODUCT_REVIEW_MODULE ? service : undefined },
    } as never, res as never)

    expect(service.listProductReviews).toHaveBeenCalledWith({
      product_id: ["prod_1", "prod_2"],
      status: ProductReviewStatus.APPROVED,
    })
    expect(res.json).toHaveBeenCalledWith({
      summaries: {
        prod_1: { total: 2, average: 4.5 },
        prod_2: { total: 0, average: null },
      },
    })
  })
})
