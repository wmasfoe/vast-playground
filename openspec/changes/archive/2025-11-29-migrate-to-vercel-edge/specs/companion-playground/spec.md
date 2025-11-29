## MODIFIED Requirements

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

## ADDED Requirements

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
