import path from "path";
import { fileURLToPath } from "url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";

const rootDir = fileURLToPath(new URL(".", import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [react()],
    // define: {
    //   'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    //   'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
    // },
    resolve: {
      alias: {
        "@": path.resolve(rootDir, "."),
      },
    },
    build: {
      target: "es2022", // Supports top-level await (Chrome 89+)
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes("node_modules")) return undefined;
            // Analytics loads lazily after the page is idle; keep it out of the
            // eager Firebase chunk.
            if (/@firebase\/(analytics|installations)|firebase\/analytics/.test(id)) return "vendor-analytics";
            if (id.includes("firebase")) return "vendor-firebase";
            if (id.includes("framer-motion")) return "vendor-motion";
            if (id.includes("lucide-react")) return "vendor-icons";
            if (id.includes("react")) return "vendor-react";
            return "vendor";
          },
        },
      },
    },
    esbuild: {
      target: "es2022",
    },
    optimizeDeps: {
      esbuildOptions: {
        target: "es2022",
      },
    },
  };
});
