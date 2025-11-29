# Change: 添加 VAST 协议伴随广告 Playground

## Why

目前团队开发伴随广告模板时，缺乏一个真实的测试环境来验证模板在 VAST 协议下的实际表现。需要一个能够模拟线上真实伴随广告投放场景的开发预览工具，让开发者可以快速迭代和测试模板。

## What Changes

- 新建 `companion-playground/` 目录，包含**完全独立**的 VAST 伴随广告预览系统
- 独立的 Express 服务器，与现有 `server.js` 完全解耦
- 集成 Google IMA SDK (Interactive Media Ads) 作为视频广告播放器
- 实现 VAST XML 生成器，支持将模板内容转换为标准 VAST 格式
- 提供可视化的 Playground 界面，支持：
  - 选择预设模板（自动读取 `companion-template/` 目录）或手动输入 HTML
  - 配置视频素材、伴随广告参数
  - 多种预设预览尺寸 + 自定义尺寸
  - 实时预览 VAST 解析与渲染效果
  - 查看生成的 VAST XML 内容
- 独立的 npm 脚本启动命令
- **支持两种预览模式**：
  - **简化模式（默认）**：直接播放广告视频 + 伴随广告，快速验证模板效果
  - **完整模式（可选）**：模拟媒体侧真实流程，内容视频 + 广告插入（Pre/Mid/Post-roll）

## Impact

- Affected specs: 新增 `companion-playground` 能力
- Affected code:
  - 新增 `companion-playground/` 目录（所有代码自包含）
- **不修改任何现有文件**，与项目其他部分完全解耦
