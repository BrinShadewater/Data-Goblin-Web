import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    // Never inline an asset into a JS chunk. Vite's 4096-byte default was inlining exactly one
    // file, goblin-head-icon-128.webp at 4042 bytes -- 54 bytes under the line -- and it cost
    // 4,977 bytes gzip in the entry chunk, because base64 grows 33% and compresses badly. That
    // alone put the entry chunk 2,604 bytes over its own 20 kB gzip budget while its raw size
    // was comfortably under. Emitted as a file it is 4,042 bytes, content-hashed, and served
    // `immutable` for a year (see vercel.json), so it is now strictly better outside the bundle
    // than in it: cached once instead of re-downloaded inside every entry-chunk revision.
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        manualChunks(id) {
          const normalized = id.replace(/\\/g, "/");
          if (!normalized.includes("/node_modules/")) return undefined;
          if (/\/node_modules\/(react|react-dom|scheduler|react-router|react-router-dom|@remix-run\/router)\//.test(normalized)) {
            return "react-vendor";
          }
          if (normalized.includes("/node_modules/lucide-react/")) return "icons-vendor";
          return undefined;
        },
      },
    },
  },
});
