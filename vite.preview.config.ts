// Vite config for the UI preview harness (dev/index.html).
// Swaps Firebase and the data store for in-memory sample data so screens can
// be designed and screenshotted without a backend.
import path from "path";
import { fileURLToPath } from "url";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const root = fileURLToPath(new URL(".", import.meta.url));
const mock = (file: string) => path.resolve(root, "dev/mocks", file);

export default defineConfig({
  root: path.resolve(root, "dev"),
  plugins: [react()],
  server: { port: 5174, host: "0.0.0.0" },
  appType: "spa",
  resolve: {
    alias: [
      { find: /^firebase\/firestore$/, replacement: mock("firestore.ts") },
      { find: /^firebase\/functions$/, replacement: mock("functions.ts") },
      { find: /.*\/services\/firebase$/, replacement: mock("firebase.ts") },
      { find: /^\.\/firebase$/, replacement: mock("firebase.ts") },
      { find: /.*\/services\/registrationStore$/, replacement: mock("registrationStore.ts") },
      { find: "@", replacement: root },
    ],
  },
});
