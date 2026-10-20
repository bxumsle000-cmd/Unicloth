import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],

  server: {
    proxy: {
      // 後端 API
      "/api": "http://localhost:8080",

      // Spring Boot static 資源
      "/img": "http://localhost:8080",
      "/video": "http://localhost:8080",

      // 後台新上傳的商品圖片
      "/uploads": "http://localhost:8080",
    },
  },
});