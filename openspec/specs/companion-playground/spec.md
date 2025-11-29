## ADDED Requirements

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

#### Scenario: 选择预设模板

- **WHEN** 用户点击"选择模板"
- **THEN** 服务端自动读取 `companion-template/` 目录，显示可用模板列表
- **THEN** 用户选择后，模板内容自动填充到编辑器

#### Scenario: 选择预览尺寸

- **WHEN** 用户需要调整预览窗口尺寸
- **THEN** 界面提供预设尺寸选项（如 iPhone SE、iPhone 8、iPhone 11、Pixel 5、iPad Mini）
- **THEN** 用户也可以选择"自定义"并输入任意宽高值

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

Playground 必须（SHALL）作为独立模块部署，与现有项目代码完全解耦。

#### Scenario: 独立目录结构

- **WHEN** 开发者查看 `companion-playground/` 目录
- **THEN** 目录包含完整的运行所需文件（server.js、前端文件、依赖配置）
- **THEN** 不依赖项目根目录的 `server.js` 或其他模块

#### Scenario: 独立启动命令

- **WHEN** 开发者在 `companion-playground/` 目录执行 `npm start`
- **THEN** 独立的 Express 服务器启动
- **THEN** 自动打开浏览器访问 Playground 页面

#### Scenario: 读取外部模板目录

- **WHEN** Playground 服务器启动
- **THEN** 服务器能够读取 `../companion-template/` 目录下的模板文件
- **THEN** 模板列表在前端可选择使用

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
