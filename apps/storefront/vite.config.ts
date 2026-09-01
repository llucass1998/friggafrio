import medusaAiTags from "@medusajs-ai/tags";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import type { Plugin } from "vite";
import Terminal from "vite-plugin-terminal";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { storefrontContentSecurityPolicyReportOnly } from "./src/lib/security/content-security-policy";

const contentSecurityPolicyReportOnlyPlugin = (isDevelopment: boolean): Plugin => {
  const value = storefrontContentSecurityPolicyReportOnly(isDevelopment);
  const applyHeader = (_request: unknown, response: { setHeader: (name: string, value: string) => void }, next: () => void) => {
    response.setHeader("Content-Security-Policy-Report-Only", value);
    next();
  };

  return {
    name: "frigga-content-security-policy-report-only",
    configureServer(server) {
      // TanStack Start's SSR handler bypasses Vite's server.headers option.
      server.middlewares.use(applyHeader);
    },
    configurePreviewServer(server) {
      server.middlewares.use(applyHeader);
    },
  };
};

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";
  const allowedHosts = ["friggafrio.istigestao.com.br"];

  return {
    server: {
      host: "127.0.0.1",
      port: 5173,
      strictPort: true,
      allowedHosts,
      headers: {
        "Content-Security-Policy-Report-Only": storefrontContentSecurityPolicyReportOnly(isDev),
      },
    },

    preview: {
      allowedHosts,
      headers: {
        "Content-Security-Policy-Report-Only": storefrontContentSecurityPolicyReportOnly(false),
      },
    },

    plugins: [
      Terminal({ console: "terminal", output: ["terminal"] }),
      viteTsConfigPaths({ projects: ["./tsconfig.json"] }),
      tailwindcss(),

      ...(isDev
        ? [
            medusaAiTags({
              enabled: true,
              includeRuntime: true,
            }),
          ]
        : []),

      tanstackStart(),
      viteReact(),
      contentSecurityPolicyReportOnlyPlugin(isDev),
    ],

    ssr: {
      noExternal: ["@medusajs/js-sdk", "@medusajs/types"],
      optimizeDeps: {
        include: ["@medusajs/js-sdk"],
      },
    },

    optimizeDeps: {
      include: [
        "react",
        "react-dom",
        "react/jsx-runtime",
        "react/jsx-dev-runtime",
        "@tanstack/react-query",
        "@tanstack/react-router",
        "@medusajs/js-sdk",
        "@medusajs/icons",
        "lodash-es",
      ],
      exclude: ["@medusajs-ai/tags"],
    },

    resolve: {
      dedupe: ["react", "react-dom", "@tanstack/react-router"],
    },
  };
});
