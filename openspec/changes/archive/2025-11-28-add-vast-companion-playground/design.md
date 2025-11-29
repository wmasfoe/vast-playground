## Context

### 背景

VAST (Video Ad Serving Template) 是 IAB 制定的视频广告投放标准协议。伴随广告（Companion Ads）是 VAST 规范中的重要组成部分，通常与视频广告一起展示，增强广告效果。

当前项目已有伴随广告模板（如 `ad_video_landing_page.html`），但缺乏真实的 VAST 协议测试环境。

### 相关方

- 广告模板开发者（主要用户）
- QA 测试人员

### 约束

- 需要兼容现有模板的宏替换系统
- **完全独立部署**，不修改现有代码
- 前端需要支持现代浏览器（Chrome 60+）

## Goals / Non-Goals

### Goals

- 提供完整的 VAST 伴随广告预览能力
- 模拟真实的视频广告播放流程（使用 Google IMA SDK）
- 支持选择预设模板或自定义输入
- 支持多种预设尺寸（IAB 标准）和自定义尺寸预览
- **支持拖拽调整伴随广告尺寸，并自动吸附到标准尺寸**
- **支持拖拽调整主广告和伴随广告的位置**
- 生成标准 VAST 4.2 格式的 XML，支持 HTML 内容压缩
- 可视化展示 VAST 解析过程和伴随广告渲染
- **与现有项目代码完全解耦**，独立构建和运行

### Non-Goals

- 不实现完整的广告投放服务（ad server）
- 不处理广告竞价、定向等业务逻辑
- 不支持 VMAP（Video Multiple Ad Playlist）
- 不实现服务端广告插入（SSAI）
- 不修改现有的 `server.js` 或其他项目文件

## Decisions

### 1. 视频播放器选型：Google IMA SDK

**选择理由：**

- 业界标准的 VAST 解析和播放实现
- 完善的伴随广告支持
- 丰富的事件回调机制
- 免费且文档完善

### 2. 独立部署架构

**关键原则：所有代码自包含在 `companion-playground/` 目录内**

```
companion-playground/
├── package.json          # 独立的依赖管理
├── server.js             # 独立的 Express 服务器
├── index.html            # Playground 入口页面
├── styles.css            # 样式文件（蓝白清爽主题）
├── playground.js         # 前端逻辑（含拖拽、缩放逻辑）
└── lib/
    └── vast-generator.js # VAST XML 生成模块
```

### 3. 系统架构与交互设计

**视觉风格**：采用清爽的蓝白浅色主题 (`#0969da` 主色调)，提升专业感。

**布局设计**：
- **左侧配置面板**：模板选择、宏变量输入、视频配置、尺寸配置。
- **右侧预览面板**：
  - **主广告模块 (Linear Ad)**：固定比例 (16:9) 的视频播放器。
  - **伴随广告模块 (Companion Ad)**：支持拖拽调整大小的容器，内部通过 iframe 渲染。
  - **拖拽布局**：两个模块均支持通过标题栏拖拽自由移动位置。

```
┌─────────────────────────────────────────────────────────────────┐
│                    Companion Playground                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌────────────────────┐    ┌─────────────────────────────────┐  │
│  │  Configuration     │    │      Preview Panel              │  │
│  │  ────────────────  │    │                                 │  │
│  │  • 模板选择/输入   │    │   ┌─────────────────────────┐   │  │
│  │  • 宏变量配置      │    │   │  Linear Ad Player       │   │  │
│  │  • 视频URL配置     │    │   │  (Fixed Aspect Ratio)   │   │  │
│  │  • 尺寸配置        │    │   │  [ ✥ Drag Handle ]      │   │  │
│  │                    │    │   └─────────────────────────┘   │  │
│  │                    │    │                                 │  │
│  │                    │    │   ┌─────────────────────────┐   │  │
│  │                    │    │   │  Companion Ad Slot      │   │  │
│  │                    │    │   │  (Resizable & Draggable)│   │  │
│  │                    │    │   │  [ ✥ Drag Handle ]      │   │  │
│  │                    │    │   │  [ ↔ Resize Handle ]    │   │  │
│  │                    │    │   └─────────────────────────┘   │  │
│  └────────────────────┘    └─────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 3. VAST XML 结构

采用 VAST 4.2 规范，关键结构：

```xml
<VAST version="4.2">
  <Ad id="companion-preview">
    <InLine>
      ...
      <Creatives>
        ...
        <Creative>
          <CompanionAds>
            <Companion width="300" height="250">
              <HTMLResource>
                <![CDATA[...压缩后的一行HTML...]]>
              </HTMLResource>
            </Companion>
          </CompanionAds>
        </Creative>
      </Creatives>
    </InLine>
  </Ad>
</VAST>
```

**关键要求：**
- 使用 `<HTMLResource>` 嵌入完整 HTML 内容。
- HTML 内容在服务端生成时通过 `html-minifier-terser` 进行 **Minify（压缩成一行）**。
- 前端展示 VAST XML 时支持换行和局部滚动，优化阅读体验。

### 4. 宏替换与构建

- **预构建（Pre-build）**：通过 `scripts/build-companion-template.js` 读取 `pre-build-macro.json`，替换环境相关宏，输出到 `dist` 目录。
- **开发体验**：提供 `npm run dev:cp` 命令，同时启动构建脚本（watch 模式）和 Playground 服务器（nodemon），实现修改即预览。

### 5. 预览尺寸配置 (IAB 标准)

支持 IAB 标准尺寸，并在拖拽调整大小时提供 **自动吸附** 功能。

| 名称 | 尺寸 (WxH) | 类型 |
|------|------------|------|
| Medium Rectangle | 300×250 | 矩形 |
| Leaderboard | 728×90 | 横幅 |
| Half Page | 300×600 | 半页 |
| Wide Skyscraper | 160×600 | 摩天大楼 |
| Mobile Leaderboard | 320×50 | 移动端横幅 |
| Mobile Interstitial | 320×480 | 移动端插屏 |
| Mobile Interstitial | 480×320 | 移动端插屏(横) |
| 自定义 | 任意 | - |

### 6. 双模式设计：简化模式 + 完整模式

**设计原则**：简化模式为默认，完整模式作为可选功能。

#### 简化模式（默认 - 已实现）
用户配置 → 生成 VAST → IMA SDK 直接播放广告视频 + 伴随广告。
- 适用场景：快速验证伴随广告模板渲染效果。
- 特点：无需内容视频，关注广告本身。

#### 完整模式（可选 - 已实现）
用户配置 → 播放内容视频 → 触发广告请求 → 播放广告 → 继续内容视频。
- 适用场景：测试广告在真实媒体侧环境中的表现（Pre/Mid/Post-roll）。

## Risks / Trade-offs

| 风险 | 影响 | 缓解措施 |
|------|------|----------|
| IMA SDK 加载失败（网络/广告拦截） | 无法预览 | 提供降级方案：直接 iframe 渲染 + Toast 提示 |
| VAST 规范变更 | 兼容性问题 | 使用成熟的 4.2 版本 |
| 复杂模板渲染差异 | 预览与线上不一致 | 使用 iframe sandbox 模拟，注入 CSS reset |

## Migration Plan

不涉及迁移，纯新增功能。所有代码在独立目录，不影响现有系统。
