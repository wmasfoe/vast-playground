# Change: 迁移至 Vercel Edge Runtime 部署

## Why

当前项目使用 Express 服务器，需要独立部署和维护服务器环境。迁移到 Vercel 可以：
- 简化部署流程（git push 即可部署）
- 利用 Edge Runtime 实现低延迟的 API 响应
- 由 Vercel 托管静态 HTML/CSS/JS 文件
- 无需维护服务器基础设施

同时，原有的本地模板文件依赖需要改造为用户自助提供模板的方式。

## What Changes

### 后端改造
- **BREAKING**: 移除 Express 服务器，改用 Vercel Serverless Functions
- 移除 `/api/templates` 和 `/api/templates/:name` 端点（不再读取本地文件）
- 保留 `/api/vast/generate` 端点，改写为 Serverless Function
- 保留 `/api/vast/:id.xml` 和 `/api/vast/companion/:id` 端点
- 状态存储：使用 Vercel KV（Blob URL 方案作为可选扩展，本次不实现）

### 前端改造
- 移除模板选择下拉框（原有的预设模板功能）
- 新增「从 URL 加载」功能：用户输入 API URL，获取 HTML 模板
- 新增「选择文件」功能：用户选择本地 .html 文件，读取内容到编辑器
- 保留现有的手动输入 HTML 功能

### 部署配置
- 新增 `vercel.json` 配置文件
- 新增 `/api` 目录存放 Edge Functions
- 更新 `package.json` scripts

## Impact

- Affected specs: `companion-playground`
- Affected code:
  - `server.js` → 删除
  - `playground.js` → 修改模板加载逻辑
  - `index.html` → 修改模板配置 UI
  - 新增 `api/` 目录
  - 新增 `vercel.json`
