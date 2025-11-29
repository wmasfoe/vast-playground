## 1. 项目结构搭建（独立目录）

- [x] 1.1 创建 `companion-playground/` 目录结构
- [x] 1.2 创建独立的 `companion-playground/package.json`（含依赖和启动脚本）
- [x] 1.3 创建 Playground 入口页面 `companion-playground/index.html`
- [x] 1.4 创建样式文件 `companion-playground/styles.css`
- [x] 1.5 创建前端脚本 `companion-playground/playground.js`

## 2. 独立服务端

- [x] 2.1 创建独立的 `companion-playground/server.js`（Express 服务器）
- [x] 2.2 实现 `GET /api/templates` 端点（读取 `../companion-template/` 目录）
- [x] 2.3 实现 `GET /api/templates/:name` 端点（返回模板内容）
- [x] 2.4 创建 VAST XML 生成模块 `companion-playground/lib/vast-generator.js`
- [x] 2.5 实现宏变量替换逻辑
- [x] 2.6 实现 `POST /api/vast/generate` 端点（生成 VAST XML）
- [x] 2.7 实现 `GET /api/vast/companion/:id` 端点（返回处理后的伴随广告 HTML）
- [x] 2.8 实现预构建逻辑（`scripts/build-companion-template.js`）和 watch 模式
- [x] 2.9 实现 VAST 生成时的 HTML 压缩（使用 `html-minifier-terser`）

## 3. Google IMA SDK 集成

- [x] 3.1 集成 Google IMA SDK 脚本
- [x] 3.2 实现 AdDisplayContainer 初始化
- [x] 3.3 实现 AdsLoader 和广告请求逻辑
- [x] 3.4 实现 AdsManager 事件处理（播放、暂停、完成等）
- [x] 3.5 实现伴随广告插槽绑定和渲染（使用 iframe + CSS Reset）
- [x] 3.6 实现 IMA SDK 加载失败的降级方案
- [x] 3.7 优化 IMA SDK 加载检查（重试机制和广告拦截检测）

## 4. 可视化配置界面

- [x] 4.1 实现模板编辑器（含语法高亮）
- [x] 4.2 实现宏变量自动检测和输入表单生成
- [x] 4.3 实现视频 URL 配置面板
- [x] 4.4 实现预设模板选择器（调用 `/api/templates` 接口）
- [x] 4.5 实现 VAST XML 预览面板（只读、高亮、复制功能、支持横向滚动）
- [x] 4.6 实现预览尺寸选择器（IAB 标准预设尺寸 + 自定义尺寸）

## 5. 预览与交互增强

- [x] 5.1 实现预览按钮和预览流程
- [x] 5.2 实现多尺寸预览（IAB 标准尺寸）
- [x] 5.3 实现开发模式下的埋点事件模拟输出
- [x] 5.4 实现错误处理和用户提示（Toast）
- [x] 5.5 **UI 升级**：实现蓝白浅色主题 (`styles.css`)
- [x] 5.6 **交互升级**：实现伴随广告区域拖拽调整大小 (Resizable)
- [x] 5.7 **交互升级**：实现尺寸调整时的自动吸附功能 (Snap to IAB sizes)
- [x] 5.8 **交互升级**：实现主广告和伴随广告模块的自由拖拽移动 (Draggable)

## 6. 测试与文档

- [x] 6.1 使用现有伴随广告模板进行端到端测试
- [x] 6.2 测试不同视频源和伴随广告组合
- [x] 6.3 测试各种预设尺寸和自定义尺寸
- [x] 6.4 编写 `companion-playground/README.md` 使用说明

## 7. 完整模式（可选功能）

> 注：此阶段为可选功能，在简化模式稳定后按需实现

- [x] 7.1 实现模式切换 UI（简化模式/完整模式）
- [x] 7.2 实现内容视频播放器集成
- [x] 7.3 实现内容视频 URL 配置
- [x] 7.4 实现广告插入时机选择（Pre/Mid/Post-roll）
- [x] 7.5 实现 Mid-roll 时间点配置
- [x] 7.6 调整 IMA SDK 初始化逻辑，绑定内容视频
- [x] 7.7 实现广告结束后恢复内容视频播放
- [x] 7.8 完整模式端到端测试
