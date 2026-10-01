import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const allowedHost = process.env.ALLOWED_HOST || env.ALLOWED_HOST;

  return {
    plugins: [react(), tailwindcss()],
    server: {
      allowedHosts: allowedHost ? [allowedHost] : [],
    },
  };
});
