import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"

export const GET = async (req: MedusaRequest, res: MedusaResponse) => {
  const auditLogModule = req.scope.resolve("audit-log") as any;

  const take = parseInt(req.query.take as string) || 20;
  const skip = parseInt(req.query.skip as string) || 0;

  const [logs, count] = await auditLogModule.listAndCountAuditLogs(
    {},
    {
      take,
      skip,
      order: { created_at: "DESC" }
    }
  );

  res.status(200).json({
    audit_logs: logs,
    count,
    offset: skip,
    limit: take,
  })
}