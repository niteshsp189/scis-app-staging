import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(async ({ mode }) => {
  let componentTagger;
  if (mode === 'development') {
    try {
      const tagger = await import("lovable-tagger");
      componentTagger = tagger.componentTagger;
    } catch (e) {
      console.warn("lovable-tagger not found, skipping component tagging");
    }
  }

  return {
    // optimizeDeps: {
    //   esbuildOptions: {
    //     sourcemap: false,
    //   },
    // },
    server: {
      host: "::",
      port: 5173,
    },
    plugins: [
      react(),
      componentTagger && componentTagger(),
    ].filter(Boolean),
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
  };
});
