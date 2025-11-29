# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
npm run dev     # 使用 Vercel CLI 开发（推荐，连接远程 KV）
npm run local   # 使用本地 Express 服务器（无需 KV）
```

## Architecture Overview

这是一个 VAST 伴随广告预览工具，部署在 Vercel 上，使用 Serverless Functions 和 Vercel KV。

### Core Components

- **Vercel Serverless Functions** (`api/`): API 端点
- **Frontend** (`index.html`, `playground.js`, `styles.css`): 交互式预览界面
- **Vercel Blob**: 存储生成的 VAST XML 和伴随广告 HTML

### Key Features

1. **VAST XML 生成**: 将 HTML 模板转换为标准 VAST 4.2 格式
2. **Google IMA SDK 集成**: 用于视频广告播放和伴随广告渲染
3. **模板加载方式**: 手动输入、选择文件、从 URL 加载
4. **宏变量替换**: 自动检测并替换模板中的 `{MACRO}` 格式变量
5. **尺寸调节**: 支持拖拽调整尺寸，自动吸附 IAB 标准尺寸
6. **高级模式**: 支持 Pre-roll/Mid-roll/Post-roll 广告插入测试

### Directory Structure

```
vast-playground/
├── api/                      # Vercel Serverless Functions
│   ├── health.js             # GET /api/health
│   └── vast/
│       └── generate.js       # POST /api/vast/generate
├── src/                      # 前端源文件
│   ├── index.html            # 前端主页面
│   ├── playground.js         # 前端交互逻辑
│   ├── styles.css            # 样式文件
│   ├── lib/                  # 本地开发用模块
│   │   └── vast-generator.js
│   └── dist/                 # 示例模板
├── vercel.json               # Vercel 配置
└── server.js                 # 本地开发服务器
```

### API Endpoints

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/vast/generate` | POST | 生成 VAST XML，存储到 Blob |
| `/api/health` | GET | 健康检查 |

### Vercel Blob 存储

```javascript
// 存储 VAST XML 到 Blob
const { url: vastUrl } = await put(
  `vast/${companionId}.xml`,
  vastXml,
  { access: 'public', contentType: 'application/xml' }
);
```

需要配置环境变量 `BLOB_READ_WRITE_TOKEN`。

### Macro System

模板使用 `{MACRO_NAME}` 格式的宏变量，常见宏：

- `{LANDING_URL}` - 落地页链接
- `{BRAND_VIDEO_URL}` - 品牌视频链接
- `{BRAND_LOGO}` - 品牌 Logo
- `{BRAND_NAME}` - 品牌名称
- `{BID_ID}` - 竞价 ID

### IAB Standard Sizes

预设的 IAB 标准广告尺寸（带拖拽吸附）：

- 300×250 (Medium Rectangle)
- 728×90 (Leaderboard)
- 300×600 (Half Page)
- 160×600 (Wide Skyscraper)
- 320×50 (Mobile Leaderboard)
- 320×480 / 480×320 (Mobile Interstitial)

### Development Guidelines

1. **API 开发**: 在 `api/` 目录下创建 Serverless Functions
2. **前端开发**: 修改 `playground.js` 和 `styles.css`
3. **本地测试**: 使用 `vercel dev` 测试 API（需连接 Vercel KV）

### Deployment

- 推送到 GitHub 后自动部署到 Vercel
- 需要在 Vercel 控制台创建 Blob 存储并配置 `BLOB_READ_WRITE_TOKEN`

### Notes

- IMA SDK 可能被广告拦截插件阻止，系统会自动降级到 iframe 渲染
- VAST XML 中的 HTML 会通过 html-minifier-terser 压缩为单行
- 生成的数据存储在 Vercel Blob 中，返回公开 URL

<!-- OPENSPEC:START -->
# OpenSpec Instructions

These instructions are for AI assistants working in this project.

Always open `@/openspec/AGENTS.md` when the request:
- Mentions planning or proposals (words like proposal, spec, change, plan)
- Introduces new capabilities, breaking changes, architecture shifts, or big performance/security work
- Sounds ambiguous and you need the authoritative spec before coding

Use `@/openspec/AGENTS.md` to learn:
- How to create and apply change proposals
- Spec format and conventions
- Project structure and guidelines

Keep this managed block so 'openspec update' can refresh the instructions.

<!-- OPENSPEC:END -->
