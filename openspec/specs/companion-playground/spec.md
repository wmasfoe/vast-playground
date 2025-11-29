# VAST Companion Ad Playground Specification

## Purpose

Provides a standalone, web-based playground for testing and previewing VAST 4.2 companion ads. This tool allows ad operations teams and developers to validate companion ad behaviors, test templates, and simulate ad serving scenarios using Google IMA SDK, without needing a full ad server environment.

## Requirements

### Requirement: VAST XML 生成能力

Playground 服务端必须（SHALL）能够根据用户输入的伴随广告模板和配置参数，生成符合 VAST 4.2 规范的 XML 文档。

#### Scenario: 生成包含伴随广告的 VAST XML

- **WHEN** 用户提供视频 URL、伴随广告模板 HTML 和宏变量配置
- **THEN** 服务端返回有效的 VAST 4.2 XML，包含 Linear 创意（视频）和 CompanionAds 创意（伴随广告）
- **THEN** 伴随广告 HTML 中的宏变量（如 `{LANDING_URL}`、`{BRAND_VIDEO_URL}`）已被实际值替换

#### Scenario: 处理无伴随广告的情况

- **WHEN** 用户仅提供视频 URL，未提供伴随广告模板
- **THEN** 服务端返回仅包含 Linear 创意的 VAST XML
- **THEN** XML 中不包含 CompanionAds 元素

#### Scenario: 验证必要参数

- **WHEN** 用户未提供视频 URL
- **THEN** 服务端返回 400 错误，错误信息说明缺少必要参数

---

### Requirement: Google IMA SDK 集成

Playground 前端必须（SHALL）集成 Google IMA SDK，用于解析 VAST XML 并播放视频广告及伴随广告。

#### Scenario: 加载并初始化 IMA SDK

- **WHEN** 用户打开 Playground 页面
- **THEN** IMA SDK 加载成功并完成初始化
- **THEN** 显示视频播放器容器和伴随广告插槽

#### Scenario: 请求并播放 VAST 广告

- **WHEN** 用户点击"预览"按钮
- **THEN** 前端向服务端请求生成的 VAST XML
- **THEN** IMA SDK 解析 VAST 并开始播放视频广告
- **THEN** 伴随广告在指定插槽中渲染

#### Scenario: IMA SDK 加载失败降级

- **WHEN** IMA SDK 因网络问题加载失败
- **THEN** 显示错误提示，并提供"直接预览伴随广告"的降级选项
- **THEN** 降级模式下，伴随广告 HTML 直接在 iframe 中渲染

---

### Requirement: 可视化配置界面

Playground 必须（SHALL）提供可视化界面，允许用户配置伴随广告预览所需的参数。

#### Scenario: 输入伴随广告模板

- **WHEN** 用户在模板编辑器中输入或粘贴 HTML
- **THEN** 编辑器实时语法高亮显示
- **THEN** 自动检测并列出模板中使用的宏变量

#### Scenario: 配置宏变量值

- **WHEN** 模板中包含宏变量（如 `{LANDING_URL}`）
- **THEN** 界面自动生成对应的输入框
- **THEN** 用户可以为每个宏变量填入实际值

#### Scenario: 配置视频素材

- **WHEN** 用户需要配置视频广告
- **THEN** 界面提供视频 URL 输入框
- **THEN** 支持输入 MP4 格式视频的直链地址

#### Scenario: 从本地文件加载模板

- **WHEN** 用户点击「选择文件」按钮并选择一个 .html 文件
- **THEN** 文件内容被读取并填充到模板编辑器
- **THEN** 自动检测并列出模板中使用的宏变量

#### Scenario: 从 URL 加载模板

- **WHEN** 用户输入一个 URL 并点击「加载」
- **THEN** 系统尝试从该 URL 获取 HTML 内容
- **WHEN** 请求成功
- **THEN** HTML 内容填充到模板编辑器
- **WHEN** 请求因 CORS 限制失败
- **THEN** 显示提示「目标服务器不允许跨域访问，请下载文件后使用文件选择功能」

#### Scenario: 选择预览尺寸

- **WHEN** 用户需要调整预览窗口尺寸
- **THEN** 界面提供 IAB 标准预设尺寸选项（如 300×250、728×90、300×600 等）
- **THEN** 用户也可以选择「自定义」并输入任意宽高值
- **THEN** 支持拖拽调整尺寸，自动吸附到 IAB 标准尺寸

---

### Requirement: VAST XML 预览

Playground 必须（SHALL）提供 VAST XML 的只读预览功能，方便用户查看和调试。

#### Scenario: 查看生成的 VAST XML

- **WHEN** 用户配置完成并点击"生成 VAST"
- **THEN** 界面展示格式化后的 VAST XML 内容
- **THEN** XML 语法高亮显示

#### Scenario: 复制 VAST XML

- **WHEN** 用户点击"复制"按钮
- **THEN** VAST XML 内容复制到剪贴板
- **THEN** 显示复制成功提示

---

### Requirement: 伴随广告渲染与交互

Playground 必须（SHALL）在预览模式下正确渲染伴随广告，并保持与线上环境一致的交互行为。

#### Scenario: 伴随广告随视频播放展示

- **WHEN** 视频广告开始播放
- **THEN** 伴随广告在指定插槽中渲染
- **THEN** 伴随广告的点击、静音、跳过等交互功能正常

#### Scenario: 伴随广告尺寸适配

- **WHEN** 用户调整预览窗口尺寸
- **THEN** 伴随广告按照模板中定义的响应式规则自适应

#### Scenario: 伴随广告事件追踪（模拟）

- **WHEN** 用户点击伴随广告中的 CTA 按钮
- **THEN** 浏览器控制台输出模拟的埋点事件日志
- **THEN** 不实际发送埋点请求（开发模式）

---

### Requirement: 独立部署与启动

Playground 必须（SHALL）支持 Vercel 平台部署，并保持本地开发能力。

#### Scenario: Vercel 部署

- **WHEN** 用户将代码推送到 GitHub 并连接 Vercel
- **THEN** Vercel 自动构建并部署应用
- **THEN** 静态文件（HTML/CSS/JS）由 Vercel CDN 托管
- **THEN** API 端点作为 Serverless Functions 运行

#### Scenario: 本地开发

- **WHEN** 开发者执行 `vercel dev` 或 `npm run dev`
- **THEN** 本地启动开发服务器
- **THEN** API 端点和静态文件均可访问
- **THEN** 支持热重载

#### Scenario: API 使用 Vercel Blob 存储

- **WHEN** 用户请求生成 VAST XML
- **THEN** 服务端生成 VAST XML 并存储到 Vercel Blob
- **THEN** 返回 `vastUrl` 供 IMA SDK 获取 VAST XML

---

### Requirement: 完整模式（媒体侧模拟）

当启用完整模式时，Playground 必须（SHALL）提供媒体侧真实广告投放流程的模拟能力。此功能为可选实现。

#### Scenario: 模式切换

- **WHEN** 用户在界面上切换到"完整模式"
- **THEN** 显示额外的媒体侧配置选项（内容视频 URL、广告插入时机）
- **THEN** 预览区域切换为内容视频播放器 + 广告叠加模式

#### Scenario: 配置内容视频

- **WHEN** 用户在完整模式下配置内容视频 URL
- **THEN** 内容视频在预览区域加载并可播放
- **THEN** 支持 MP4 格式的视频直链地址

#### Scenario: Pre-roll 广告插入

- **WHEN** 用户选择 Pre-roll（片头）广告插入时机
- **THEN** 点击播放后，先播放广告视频 + 显示伴随广告
- **THEN** 广告结束后，自动播放内容视频

#### Scenario: Mid-roll 广告插入

- **WHEN** 用户选择 Mid-roll（片中）广告插入时机并设置时间点
- **THEN** 内容视频播放到指定时间点时，暂停内容视频
- **THEN** 播放广告视频 + 显示伴随广告
- **THEN** 广告结束后，继续播放内容视频

#### Scenario: Post-roll 广告插入

- **WHEN** 用户选择 Post-roll（片尾）广告插入时机
- **THEN** 内容视频播放完成后，播放广告视频 + 显示伴随广告

---

### Requirement: Vercel Blob 状态存储

服务端必须（SHALL）使用 Vercel Blob 存储生成的 VAST XML 和伴随广告 HTML。

#### Scenario: 存储 VAST 数据

- **WHEN** 用户请求生成 VAST XML
- **THEN** 服务端生成唯一 ID
- **THEN** 将 VAST XML 存储到 Blob，文件名为 `vast/{id}.xml`
- **THEN** 将伴随广告 HTML 存储到 Blob，文件名为 `companion/{id}.html`
- **THEN** 返回 `vastUrl` 供前端传递给 IMA SDK
- **THEN** 返回的数据包含 Blob 的公开 URL

#### Scenario: 读取 VAST XML

- **WHEN** IMA SDK 请求 Blob 返回的 `vastUrl`
- **THEN** Vercel Blob 直接返回对应的 XML 内容
- **THEN** 内容类型为 `application/xml`

#### Scenario: 读取伴随广告 HTML

- **WHEN** IMA SDK 请求 Blob 返回的伴随广告 URL
- **THEN** Vercel Blob 直接返回对应的 HTML 内容
- **THEN** 内容类型为 `text/html`
