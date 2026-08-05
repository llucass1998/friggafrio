const fs = require('fs')

const path = 'src/pages/login.tsx'
let content = fs.readFileSync(path, 'utf8')

content = content.replace(
  'import { useNavigate, useParams, Link } from "@tanstack/react-router"',
  'import { useNavigate, useParams, Link, useSearch } from "@tanstack/react-router"\nimport { getSafeReturnTo } from "@/lib/utils/return-to"'
)

content = content.replace(
  'const navigate = useNavigate()',
  'const navigate = useNavigate()\n  const search = useSearch({ strict: false }) as { returnTo?: string }'
)

content = content.replace(
  'const countryCode = params.countryCode || "us"',
  'const countryCode = params.countryCode || "br"'
)

content = content.replace(
  /navigate\(\{ to: "\/\$countryCode", params: \{ countryCode \} \}\)/g,
  'window.location.href = getSafeReturnTo(search.returnTo, countryCode)'
)

fs.writeFileSync(path, content)
