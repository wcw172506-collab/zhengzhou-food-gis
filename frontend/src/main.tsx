import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import { ConfigProvider } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import axios from 'axios'
import App from './App.tsx'

// 配置 axios baseURL：生产环境通过 VITE_API_BASE_URL 指向后端（如 Render），
// 本地开发留空走 vite.config.ts 的 /api 代理
axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL || ''

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ConfigProvider locale={zhCN}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </ConfigProvider>
  </React.StrictMode>,
)
