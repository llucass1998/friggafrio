import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"

describe("promotion form validation regressions", () => {
  it("converts Zod 4 issues, including unions, into field errors", async () => {
    const schema = z.object({
      rules: z.array(
        z.object({
          values: z.union([
            z.number().min(1),
            z.string().min(1),
            z.array(z.string()).min(1),
          ]),
        })
      ),
      application_method: z.object({
        value: z.number().min(0).or(z.string().min(1)),
      }),
    })

    const result = await zodResolver(schema)(
      { rules: [{ values: [] }], application_method: {} },
      {},
      { criteriaMode: "firstError", fields: {} } as any
    )

    expect(result.values).toEqual({})
    expect(result.errors.rules).toBeDefined()
    expect((result.errors.application_method as any)?.value).toBeDefined()
  })
})
