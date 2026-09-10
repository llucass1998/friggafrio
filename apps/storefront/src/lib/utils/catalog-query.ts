/** Serializes catalog filters without ever emitting an empty query value. */
export function buildCatalogSearchQuery({
  regionId,
  filters,
  limit,
  offset,
}: {
  regionId: string
  filters?: Record<string, unknown>
  limit: number
  offset: number
}): Record<string, string> {
  const query: Record<string, string> = {
    limit: String(limit),
    offset: String(offset),
  }
  const normalizedRegionId = regionId.trim()
  if (normalizedRegionId) query.region_id = normalizedRegionId
  for (const [key, value] of Object.entries(filters ?? {})) {
    if (value === undefined || value === false || value === null) continue
    if (Array.isArray(value)) {
      const values = value.map((item) => String(item).trim()).filter(Boolean)
      if (values.length > 0) query[key] = values.join(",")
      continue
    }
    const normalized = String(value).trim()
    if (normalized) query[key] = normalized
  }
  return query
}
