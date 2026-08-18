const PRODUCT_ENTITY_REPLACEMENTS: Array<[RegExp, string]> = [
  [/&quot;|&#34;|&#x22;/gi, '"'],
  [/&apos;|&#39;|&#x27;/gi, "'"],
  [/&amp;/gi, "&"],
  [/&lt;/gi, "<"],
  [/&gt;/gi, ">"],
]

export function decodeProductText(value: string): string {
  let decoded = value
  for (let pass = 0; pass < 3; pass += 1) {
    const next = PRODUCT_ENTITY_REPLACEMENTS.reduce(
      (text, [pattern, replacement]) => text.replace(pattern, replacement),
      decoded,
    )
    if (next === decoded) break
    decoded = next
  }
  const decodeCodePoint = (value: string, radix: number) => {
    const codePoint = Number.parseInt(value, radix)
    return Number.isSafeInteger(codePoint) && codePoint >= 0 && codePoint <= 0x10ffff
      ? String.fromCodePoint(codePoint)
      : ""
  }
  decoded = decoded.replace(/&#(\d+);/g, (_, code: string) => decodeCodePoint(code, 10))
  decoded = decoded.replace(/&#x([0-9a-f]+);/gi, (_, code: string) => decodeCodePoint(code, 16))
  return decoded.replace(/<[^>]*>/g, "")
}
