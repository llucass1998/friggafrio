import type { MedusaRequest, MedusaResponse } from "@medusajs/framework/http";
import { acceptEmployeeInviteWorkflow } from "../../../../../workflows/accept-employee-invite";

type AcceptInviteBody = {
  token: string;
  first_name: string;
  last_name: string;
  phone?: string;
  password: string;
};

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { token, first_name, last_name, phone, password } =
    req.validatedBody as AcceptInviteBody;

  const { result } = await acceptEmployeeInviteWorkflow(req.scope).run({
    input: {
      token,
      first_name,
      last_name,
      phone,
      password,
    },
  });

  res.json({
    success: true,
    customer: {
      id: result.customer.id,
      email: result.customer.email,
      first_name,
      last_name,
    },
    employee: {
      id: result.employee.id,
      is_admin: result.is_admin,
      spending_limit: result.spending_limit,
    },
    company_id: result.company_id,
  });
}
