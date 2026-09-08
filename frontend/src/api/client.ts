import axios from 'axios'

// axios 实例
// baseURL 来自 .env: VITE_API_BASE_URL=http://localhost:8000
// 后端 CORS 白名单已允许 http://localhost:5173
const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 响应拦截器:统一错误处理
// 后端 /solve 失败时返回 400 + { detail: "..." }
// 拦截器提取 detail 字段,抛出 Error 供调用方 catch
client.interceptors.response.use(
  (response) => response,
  (error) => {
    let message = '请求失败,请检查后端服务'

    if (error.response) {
      // 后端返回了响应(4xx / 5xx)
      const detail = error.response.data?.detail
      if (detail) {
        message = `后端错误 (${error.response.status}): ${detail}`
      } else {
        message = `后端错误 (${error.response.status})`
      }
    } else if (error.request) {
      // 请求已发出但无响应(后端未启动 / 网络问题)
      message = '无法连接后端,请确认 uvicorn 已启动于 8000 端口'
    }

    return Promise.reject(new Error(message))
  }
)

export default client
