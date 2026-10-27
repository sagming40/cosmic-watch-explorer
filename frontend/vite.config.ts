import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      // "@/components/ui/button" 처럼 src 기준 절대 경로로 import 하기 위한 별칭 (shadcn/ui 규칙)
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    proxy: {
      // changeOrigin: false ─ Host를 브라우저가 보낸 그대로(localhost:5173) 넘긴다.
      // 문자열로만 쓰면 Host가 localhost:8000으로 바뀌어, Django CSRF가 "Origin(5173) ≠ Host(8000)"로
      // 로그인 후의 POST/DELETE(저장·해제·로그아웃)를 전부 403으로 막는다 (로그인·가입은 비로그인 요청이라 통과).
      '/api': { target: 'http://localhost:8000', changeOrigin: false },
    },
  },
})
