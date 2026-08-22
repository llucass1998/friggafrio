import { defineConfig, globalIgnores } from "eslint/config"
import medusa from "@medusajs/eslint-plugin"

export default defineConfig([
  globalIgnores([
    ".medusa/**",
    "public/admin/**",
  ]),
  ...medusa.configs.recommended,
])
