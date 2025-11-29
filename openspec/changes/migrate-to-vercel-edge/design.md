## Context

项目需要从传统 Express 服务器迁移到 Vercel 的 Serverless/Edge 架构。主要挑战：
1. Express 的有状态内存存储（companionStore）需要替换
2. 本地文件系统读取模板的功能需要改造
3. 需要保持 IMA SDK 对 VAST XML 的访问能力

## Goals / Non-Goals

**Goals:**
- 实现 Vercel 一键部署
- API 响应延迟保持在可接受范围内
- 用户可以通过多种方式提供模板（URL、文件选择、手动输入）

**Non-Goals:**
- 不实现用户账号系统
- 不实现模板云端存储
- 不支持模板版本管理

## Decisions

### 1. Edge Function vs Serverless Function

**决定**: 使用 Vercel Serverless Functions（Node.js runtime）而非 Edge Functions

**原因**:
- Edge Functions 不支持 Node.js 特定 API（如 `html-minifier-terser` 依赖）
- Serverless Functions 兼容现有代码，迁移成本低
- VAST 生成不需要极低延迟（毫秒级差异对用户无感知）

### 2. 状态存储方案

**决定**: 使用 Vercel KV 存储

**实现**:
- 存储生成的 VAST XML 和伴随广告 HTML
- 设置 TTL（30 分钟），自动过期清理
- IMA SDK 通过服务端 URL 获取 VAST XML

**API 响应**:
```javascript
// POST /api/vast/generate 返回
{
  vastXml: "...",
  vastUrl: "https://xxx.vercel.app/api/vast/abc123.xml",
  companionId: "abc123"
}
```

**Vercel KV 配置**:
```javascript
// api/vast/generate.js
import { kv } from '@vercel/kv';

// 存储 VAST XML，TTL 30 分钟
await kv.set(`vast-${id}`, vastXml, { ex: 1800 });
await kv.set(`companion-${id}`, companionHtml, { ex: 1800 });
```

**可选扩展 - Blob URL 方案**:
> 未来如需支持无 KV 的场景（如本地开发），可实现前端 Blob URL 方案作为备选。当前版本不实现。

### 3. 模板加载方式

**决定**: 支持三种模板输入方式

| 方式 | 实现 | 优先级 |
|------|------|--------|
| 手动输入 | 已有，保持不变 | P0 |
| 选择文件 | FileReader API | P0 |
| 从 URL 加载 | fetch + CORS 提示 | P1 |

**从 URL 加载的 CORS 处理**:
- 尝试直接 fetch
- 如果 CORS 失败，提示用户「目标服务器不允许跨域访问，请下载文件后使用文件选择功能」

### 4. API 结构

```
/api
├── vast/
│   ├── generate.js      # POST: 生成 VAST XML，存储到 KV
│   ├── [id].js          # GET: /api/vast/:id.xml - 从 KV 获取 VAST XML
│   └── companion/
│       └── [id].js      # GET: /api/vast/companion/:id - 从 KV 获取伴随广告 HTML
└── health.js            # GET: 健康检查
```

移除的端点：
- `/api/templates` - 不再需要
- `/api/templates/:name` - 不再需要

保留的端点（使用 Vercel KV）：
- `/api/vast/:id.xml` - 从 KV 读取 VAST XML
- `/api/vast/companion/:id` - 从 KV 读取伴随广告 HTML

## Risks / Trade-offs

| 风险 | 缓解措施 |
|------|----------|
| 用户输入的 URL 可能跨域失败 | 明确 UI 提示，引导用户使用文件选择 |
| Serverless 冷启动延迟 | 可接受，首次请求约 1-2s，后续请求毫秒级 |

## Migration Plan

1. **阶段 1**: 前端改造（模板加载方式）
2. **阶段 2**: API 改造为 Serverless Functions
3. **阶段 3**: 添加 Vercel 配置，测试部署
4. **阶段 4**: 删除旧的 Express 服务器代码

**回滚方案**: 保留 `server.js` 直到 Vercel 部署稳定，可随时切回本地开发模式

## Open Questions

（无）
