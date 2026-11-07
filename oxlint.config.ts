// oxlint.config.ts
import { defineConfig } from "oxlint";
import tailwindcss from "oxlint-tailwindcss/config";

export default defineConfig({
  extends: [tailwindcss()],
  settings: {
    tailwindcss: { entryPoint: "app/globals.css" },
  },
});
