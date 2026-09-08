import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vite 配置
// 后端 CORS 白名单只允许 http://localhost:5173,必须固定端口
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    strictPort: true,
  },
})
