import medusaAiTags from "@medusajs-ai/tags";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import Terminal from "vite-plugin-terminal";
import viteTsConfigPaths from "vite-tsconfig-paths";
import { execSync } from "child_process";

// Safe git command execution
function getGitData() {
  try {
    const sha = process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || execSync("git rev-parse --short HEAD").toString().trim();
    const branch = process.env.VERCEL_GIT_COMMIT_REF || process.env.GITHUB_REF_NAME || execSync("git branch --show-current").toString().trim();
    return { sha, branch };
  } catch (_e) {
    return { sha: "local", branch: "local" };
  }
}

export default defineConfig(({ mode }) => {
  const isDev = mode === "development";
  const { sha, branch } = getGitData();

  return {
    server: {
      port: 5173,
      strictPort: true,
    },
    preview: {
      port: 4173,
      strictPort: true,
    },

    define: {
      __APP_GIT_SHA__: JSON.stringify(sha),
      __APP_GIT_BRANCH__: JSON.stringify(branch),
      __APP_BUILD_TIME__: JSON.stringify(new Date().toISOString())
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
