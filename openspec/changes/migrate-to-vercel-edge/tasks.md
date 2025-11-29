## 1. 前端改造 - 模板加载方式

- [x] 1.1 移除模板选择下拉框及相关代码（`loadTemplates`, `loadTemplateContent`）
- [x] 1.2 添加「选择文件」按钮和 FileReader 逻辑
- [x] 1.3 添加「从 URL 加载」输入框和 fetch 逻辑（含 CORS 错误处理）
- [x] 1.4 更新 UI 布局，整合三种输入方式
- [x] 1.5 测试文件选择功能（各种 HTML 文件）

## 2. 前端改造 - VAST URL 处理

- [x] 2.1 修改 `generateVast` 函数，使用服务端返回的 `vastUrl`
- [x] 2.2 测试 IMA SDK 广告播放流程

## 3. API 改造为 Vercel Serverless

- [x] 3.1 安装 `@vercel/kv` 依赖
- [x] 3.2 创建 `/api/vast/generate.js` Serverless Function（集成 Vercel KV）
- [x] 3.3 创建 `/api/vast/[id].js` 从 KV 读取 VAST XML
- [x] 3.4 创建 `/api/vast/companion/[id].js` 从 KV 读取伴随广告 HTML
- [x] 3.5 将 `lib/vast-generator.js` 调整为兼容 Serverless 环境
- [x] 3.6 创建 `/api/health.js` 健康检查端点
- [x] 3.7 本地测试 Serverless Functions（`vercel dev`）

## 4. Vercel 部署配置

- [x] 4.1 创建 `vercel.json` 配置文件
- [x] 4.2 更新 `package.json`（移除 prestart，更新 scripts）
- [x] 4.3 添加 `.vercelignore` 忽略不需要的文件
- [x] 4.4 在 Vercel 控制台创建 KV 数据库并配置环境变量
- [x] 4.5 测试 Vercel 部署（Preview 环境）

## 5. 清理与文档

- [x] 5.1 保留 `server.js` 用于本地开发（回滚方案）
- [x] 5.2 更新 `README.md` 部署说明
- [x] 5.3 更新 `CLAUDE.md` 开发指南
- [ ] 5.4 归档此变更提案
