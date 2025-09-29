import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import dyadComponentTagger from '@dyad-sh/react-vite-component-tagger';
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    dyadComponentTagger(), // Enables component selection in Applaa preview
    react(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});