import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      // /api 開頭的請求轉給 Spring Boot
      '/api': 'http://localhost:8080',
      // 圖片、影片放在 Spring Boot 的 static/ 底下
      '/img': 'http://localhost:8080',
      '/video': 'http://localhost:8080',
    },
  },
})
