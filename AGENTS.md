# 项目概况

## 项目定位
个人简历 + 技术博客双站点项目，部署于同一仓库，通过 Netlify 自动构建部署。

## 技术栈
| 技术 | 用途 |
|------|------|
| **VitePress 1.x** | 技术博客静态站点生成器（基于 Vite + Vue 3） |
| **Vanilla HTML/CSS/JS** | 个人简介单页（赛博朋克风格，无框架） |
| **Netlify** | CI/CD 部署平台，GitHub 自动触发构建 |

## 目录结构
```
resume/
├── index.html               # 个人简介（单页，953行，纯前端）
├── package.json              # VitePress 构建脚本
├── AGENTS.md                 # 本文件 - 项目概况
├── netlify.toml              # Netlify 部署配置
├── docs/                     # VitePress 博客
│   ├── index.md              # 博客首页
│   ├── blog/
│   │   ├── index.md          # 博客列表
│   │   └── sse-streaming.md  # 博文：SSE流式输出
│   ├── public/
│   │   └── resume.html       # 个人简介（构建后被复制到输出目录）
│   └── .vitepress/
│       └── config.mjs        # VitePress 配置（导航、侧边栏等）
```

## 架构设计
- **双站点单仓库**：博客通过 VitePress 构建，个人简介以静态 HTML 放入 `docs/public/` 目录，随博客一同部署
- **构建流程**：`npx vitepress build docs` → 输出到 `docs/.vitepress/dist/`
- **路由**：博客根路径 `/`，个人简介 `/resume.html`
- **无自定义主题**：博客使用 VitePress 默认主题

## 部署配置
- **平台**：Netlify（GitHub 自动部署）
- **构建命令**：`npx vitepress build docs`
- **发布目录**：`docs/.vitepress/dist`
- **配置文件**：`netlify.toml`

## 当前进度
- [x] VitePress 博客基础搭建
- [x] 个人简介页面（自定义样式）
- [x] GitHub 自动部署到 Netlify
- [x] 博客正常访问
- [x] 个人简介正常访问
- [x] netlify.toml 部署配置
- [ ] 撰写更多博文
- [ ] 删除 VitePress 默认模板页面（api-examples.md, markdown-examples.md）
- [ ] 补充 README.md
