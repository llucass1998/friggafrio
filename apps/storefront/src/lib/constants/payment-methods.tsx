import React from "react"
import { CreditCard } from "@medusajs/icons"

/* Map of payment provider_id to their title and icon. Add in any payment providers you want to use. */
export const paymentMethodsData: Record<
  string,
  { title: string; icon: React.JSX.Element }
> = {
  pp_stripe_stripe: {
    title: "Credit card",
    icon: <CreditCard />,
  },
}
