# VAST Companion Ad Playground

🎬 **伴随广告预览工具** - 基于 VAST 4.2 协议的伴随广告模板测试环境

## 功能特性

- ✅ **VAST XML 生成** - 自动将伴随广告模板转换为标准 VAST 4.2 格式
- ✅ **Google IMA SDK 集成** - 业界标准的视频广告播放器
- ✅ **多种模板输入方式** - 手动输入、选择本地文件、从 URL 加载
- ✅ **宏变量替换** - 自动检测并配置模板中的宏变量
- ✅ **IAB 标准尺寸** - 预设 IAB 标准广告尺寸 + 自定义尺寸
- ✅ **尺寸调节** - 支持拖拽调整伴随广告尺寸，自动吸附 IAB 标准尺寸
- ✅ **模块拖拽** - 视频播放器和伴随广告模块支持拖拽移动
- ✅ **高级模式** - 支持简化模式和完整模式（Pre-roll/Mid-roll/Post-roll）
- ✅ **降级方案** - IMA SDK 不可用时自动切换到 iframe 渲染

## 部署方式

### Vercel 部署（推荐）

1. Fork 或 Clone 本仓库到 GitHub
2. 在 [Vercel](https://vercel.com) 导入项目
3. 在 Vercel 控制台创建 Blob 存储：
   - 进入项目 → Storage → Create Database → Blob
   - 连接到项目
   - 记下生成的 `BLOB_READ_WRITE_TOKEN` 环境变量
4. 部署完成后即可访问

### 本地开发

```bash
# 安装依赖
npm install

# 使用 Vercel CLI 开发（连接远程 KV）
npm run dev

# 或使用本地 Express 服务器（无需 KV，功能受限）
npm run local
```

## 使用方法

### 1. 加载模板

三种方式任选其一：

- **手动输入** - 直接在文本框中输入或粘贴 HTML
- **选择文件** - 点击「选择文件」按钮，选择本地 .html 文件
- **从 URL 加载** - 输入模板 URL 并点击「加载」（需目标服务器支持 CORS）

### 2. 配置参数

- **宏变量** - 为检测到的宏变量（如 `{LANDING_URL}`）填入实际值
- **广告视频** - 输入广告视频 URL
- **尺寸** - 选择 IAB 预设尺寸或自定义尺寸

### 3. 预览

点击「预览广告」按钮查看效果，或点击「生成 VAST XML」查看生成的 XML。

### 高级模式

展开「高级配置」可切换预览模式：

- **简化模式** - 直接播放广告，无需内容视频
- **完整模式** - 模拟真实广告插入场景
  - Pre-roll: 片头广告
  - Mid-roll: 片中广告（可设置时间点）
  - Post-roll: 片尾广告

## 目录结构

```
vast-playground/
├── api/                      # Vercel Serverless Functions
│   ├── health.js             # 健康检查
│   └── vast/
│       └── generate.js       # POST: 生成 VAST XML，存储到 Blob
├── src/                      # 前端源文件
│   ├── index.html            # 前端页面
│   ├── playground.js         # 前端逻辑
│   ├── styles.css            # 样式文件
│   ├── lib/                  # 本地开发用模块
│   │   └── vast-generator.js
│   └── dist/                 # 示例模板
├── vercel.json               # Vercel 配置
├── package.json              # 依赖配置
└── server.js                 # 本地开发服务器
```

## API 端点

| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/vast/generate` | POST | 生成 VAST XML，存储到 Vercel Blob |
| `/api/health` | GET | 健康检查 |

生成的 VAST XML 和伴随广告 HTML 会存储到 Vercel Blob，返回公开访问的 URL。

## IAB 预设尺寸

| 名称 | 尺寸 |
|------|------|
| Medium Rectangle | 300 × 250 |
| Leaderboard | 728 × 90 |
| Half Page | 300 × 600 |
| Wide Skyscraper | 160 × 600 |
| Mobile Leaderboard | 320 × 50 |
| Mobile Interstitial | 320 × 480 / 480 × 320 |

## 常见宏变量

| 宏变量 | 说明 | 示例值 |
|--------|------|--------|
| `{LANDING_URL}` | 落地页链接 | `https://example.com/landing` |
| `{BRAND_VIDEO_URL}` | 品牌视频链接 | `https://example.com/video.mp4` |
| `{BRAND_LOGO}` | 品牌 Logo | `https://example.com/logo.png` |
| `{BRAND_NAME}` | 品牌名称 | `Brand Name` |
| `{BID_ID}` | 竞价 ID | `test-bid-123` |

## 技术栈

- **前端**: 原生 JavaScript, CSS3
- **后端**: Vercel Serverless Functions
- **存储**: Vercel Blob
- **视频播放**: Google IMA SDK
- **广告协议**: VAST 4.2

## 故障排除

### IMA SDK 加载失败

如果 IMA SDK 因网络问题或广告拦截插件被拦截，Playground 会自动切换到降级模式。

提示：如遇到 `ERR_BLOCKED_BY_CLIENT` 错误，请尝试关闭广告拦截插件（AdBlock 等）。

### 从 URL 加载失败

如果目标服务器不允许跨域访问（CORS），请下载文件后使用「选择文件」功能。

### VAST 数据存储

生成的 VAST 数据存储在 Vercel Blob 中，会持久保存。每次生成会创建新文件。

## License

Internal use only.
