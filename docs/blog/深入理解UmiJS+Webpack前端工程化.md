# 深入理解 UmiJS + Webpack 前端工程化：从配置到运行时的完整链路

> 本文基于一个真实的 Ant Design Pro + UmiJS 3.x 项目，逐层拆解 `config.ts` 中的每一项配置、构建产物的作用、以及浏览器运行时 Webpack 是如何把代码"喂"给用户的。

---

## 一、项目概览

这是一个基于 **UmiJS 3.x + Ant Design Pro** 的后台管理系统——"广州市教育业务数据采集系统"。项目部署在 `/bics/` 子路径下，接入 qiankun 微前端作为子应用，支持 IE11，开启静态导出。

核心技术栈：
- **UmiJS 3.x**：企业级 React 框架
- **Ant Design 4.x** + **ProLayout**：UI 组件和布局
- **Webpack 5** + **esbuild**：构建和压缩
- **DVA**：状态管理
- **qiankun**：微前端

---

## 二、`config.ts` 配置全景图

### 2.1 构建加速相关

#### `hash: true` — 文件名哈希
打包后 JS/CSS 文件名带内容哈希（如 `umi.4165a5ed.js`）。**内容不变哈希不变 → 利用浏览器长缓存；内容变了哈希也变 → 强制刷新。**

#### `esbuild: {}` — 极速压缩
使用 Go 语言编写的 esbuild 替代 Babel + Terser，压缩/转译速度提升 10-100 倍。

#### `webpack5: {}` — Webpack 5
启用 Webpack 5，获得更好的 Tree Shaking、持久化缓存和模块联邦。

#### `mfsu: {}` — 依赖预编译
MFSU（Module Federation Speed Up）将 `node_modules` 预编译打包，开发时直接复用，**极大加速冷启动和热更新**。

#### `nodeModulesTransform: { type: 'none' }` — 跳过依赖转译
不对 `node_modules` 做 Babel 转译，因为现代 npm 包已自带 ES5 兼容代码。

#### `fastRefresh: {}` — 快速刷新
修改组件代码后，浏览器**不丢失状态**即可看到最新效果。

#### `ignoreMomentLocale: true` — 减小 Moment.js 体积
打包时忽略 Moment.js 的多语言文件，减少约 200KB+ 的体积。

#### `targets: { ie: 11 }` — 兼容 IE11
Babel 自动添加 polyfill，确保代码能在 IE11 中运行。

#### `dynamicImport` — 按需加载
```typescript
dynamicImport: {
  loading: '@ant-design/pro-layout/es/PageLoading',
}
```
每个页面独立打包成 chunk，用户访问时才加载，而不是一次性加载全部代码。

---

### 2.2 路径与路由

这是本文的**核心重头戏**，三层配置协同工作。

| 配置 | 值 | 作用 |
|------|-----|------|
| `base` | `/bics/` | 路由前缀，所有路由自动加上 `/bics/` |
| `publicPath` | `./` | 静态资源（Webpack chunk）的加载路径前缀 |
| `manifest.basePath` | `/bics/` | `asset-manifest.json` 中 key 的前缀 |

#### `base: '/bics/'` — 三层渗透

这不仅是"URL 前缀"，它在**构建时和运行时**都留下了痕迹：

**第一层：`<base href="/bics/">` — HTML 原生锚点**

每个静态 HTML 都被注入：
```html
<base href="/bics/" />
```
效果：**页面上所有相对 URL 都以 `/bics/` 为基准解析。** 包括 `<script src>`、`<link href>`、`<img src>`、`<a href>`、JS 中的 `fetch('./')`、动态创建的标签等。

注意区分：`static/img.png`（相对路径）会受 `<base>` 影响；`/static/img.png`（`/` 开头，绝对路径）不受影响。

**第二层：`window.routerBase = "/bics/"` — Umi 路由命名空间**

```html
<script>window.routerBase = "/bics/";</script>
```
Umi 运行时读取它来初始化 history：
```javascript
createBrowserHistory({ basename: window.routerBase })  // "/bics/"
```
效果：`history.push('/welcome')` → 实际 URL 变成 `/bics/welcome`。

**第三层：`publicPath: './'` — Webpack chunk 加载路径**

编译后硬编码到 `umi.xxx.js`：
```javascript
__webpack_require__.p = "./";
```
效果：加载异步 chunk 时拼接为相对路径 `./p__WelcomeNew.0cc7cf50.async.js`，然后由 `<base>` 解析成 `/bics/p__WelcomeNew.0cc7cf50.async.js`。

#### 完整运行时加载链路

```
用户访问 /bics/welcome
  → 服务端返回 welcome/index.html
  → <base href="/bics/"> 设定基准
  → <script src="./umi.4165a5ed.js"> → 解析为 /bics/umi.4165a5ed.js ✅
  → JS 执行，__webpack_require__.p = "./"
  → umi 路由按需加载 Welcome chunk：
      __webpack_require__.p + __webpack_require__.u(9917)
      = "./" + "p__WelcomeNew.0cc7cf50.async.js"
      → <base> 解析 → /bics/p__WelcomeNew.0cc7cf50.async.js ✅
```

---

### 2.3 构建产物

#### `exportStatic: {}` — 静态导出

为每个路由生成对应的 `index.html`，你的 dist 目录下有 60+ 个 HTML 文件：
```
dist/
├── index.html
├── welcome/index.html
├── user/index.html
├── user/login/index.html
├── dataManage/index.html
└── ...
```

---

### 2.4 微前端 & 其他

| 配置 | 作用 |
|------|------|
| `qiankun: { slave: {} }` | 注册为 qiankun 子应用 |
| `dva: { hmr: true }` | DVA 状态管理，支持热更新 |
| `antd: { mobile: false }` | 仅使用 PC 端 Ant Design |
| `proxy` | 开发环境 API 代理，解决跨域 |
| `openAPI` | 从 Swagger JSON 自动生成 API 调用代码 |
| `locale` | 国际化，默认中文 |
| `theme` | 启用 CSS Variables 模式 |

---

## 三、`asset-manifest.json` 解密

### 3.1 它是什么？

本质是一个 **JSON 映射表**：逻辑路径 → 物理文件路径。例如：

```json
{
  "/bics/umi.js": "./umi.4165a5ed.js",
  "/bics/p__user__Login.js": "./p__user__Login.e4fd0f8d.async.js",
  "/bics/static/login2.38706e60.png": "./static/login2.38706e60.png"
}
```

### 3.2 谁用它？

| 消费者 | 用途 |
|--------|------|
| **PWA Service Worker** | 读取清单，预缓存所有资源；对比新旧清单判断版本更新 |
| **后端 / Nginx** | 读取清单，注入 `<link rel="preload">` 实现资源预加载 |
| **CI/CD 部署脚本** | 读取清单，精准上传文件到 CDN/OSS |

### 3.3 浏览器会用吗？

**在这个项目里，不会。** 因为没有 Service Worker，浏览器的加载链路是：

```
index.html（已写死 umi.4165a5ed.js）
  → 直接加载 umi.4165a5ed.js（不查任何表）
  → JS 内部 ri.u() 硬编码了所有 chunk 的映射
  → 按需加载异步 chunk
```

`asset-manifest.json` 是给**外部工具**用的"花名册"，浏览器不需要它。

---

## 四、Webpack 运行时深度解析（`umi.xxx.js`）

`umi.4165a5ed.js` 不是"查表用的字典"，而是**入口 chunk + Webpack 运行时**。它包含三部分：

### 4.1 结构拆分

```
umi.4165a5ed.js  ├── Webpack 运行时（ri = __webpack_require__）
                 │    ├── ri.p = "./"           ← publicPath
                 │    ├── ri.e(chunkId)         ← 异步加载入口
                 │    ├── ri.u(chunkId)         ← chunk ID → 文件名
                 │    ├── ri.l(url, callback)   ← 创建 <script> 加载
                 │    └── ri.f.j / ri.f.miniCss ← JS/CSS 加载器
                 │
                 ├── 入口模块集合（ri.m）
                 │    └── React、ReactDOM、antd、ProLayout...
                 │    └── 这些模块"嵌入"在文件中，不需要额外请求
                 │
                 └── 异步 chunk 路由表
                      └── ri.u() 内部硬编码了每个页面 chunk 的文件名
```

### 4.2 Chunk 是什么？

**Chunk = Webpack 切割出的独立 .js 文件块。**

```
dist/
├── umi.4165a5ed.js              ← 入口 chunk
├── p__WelcomeNew.0cc7cf50.async.js    ← 异步 chunk（按需加载）
├── p__user__Login.e4fd0f8d.async.js   ← 异步 chunk
├── 8313.a93852f3.async.js        ← 共享 chunk（多页面共用）
└── ...
```

**为什么切割？** 如果所有代码打成 20MB 的单文件，首屏要等很久。切割后首屏只加载入口 chunk（~2MB），其余 60 个 chunk 按需加载。

### 4.3 异步加载的完整流程

```javascript
// 用户点击"数据管理"菜单
// ① umi 路由匹配到 dataManage 页面
// ② 调用 Webpack 运行时加载 chunk

ri.e(7244)                              // ② 7244 = dataManage 的 chunk ID
  → ri.u(7244)                          // ③ 查映射表
    → "p__DataManage__index.700a9194.async.js"
  → ri.p + ri.u(7244)                   // ④ 拼完整路径
    → "./p__DataManage__index.700a9194.async.js"
  → ri.l(url)                           // ⑤ 创建 <script> 标签
    → document.createElement('script')
    → script.src = url
    → document.head.appendChild(script)
  → 浏览器自动用 <base href="/bics/"> 解析
    → /bics/p__DataManage__index.700a9194.async.js ✅
```

---

## 五、总结：一张图看懂完整加载链路

```
用户访问 https://域名/bics/welcome
│
├─ 1. 服务端返回 welcome/index.html
│      <base href="/bics/" />                          ← 锚定所有相对路径
│      window.routerBase = "/bics/"                    ← 路由命名空间
│      <script src="./umi.4165a5ed.js"></script>       ← 入口，已写死
│
├─ 2. 浏览器加载 /bics/umi.4165a5ed.js
│      __webpack_require__.p = "./"                    ← publicPath
│      执行 React 渲染首页
│
├─ 3. 用户点击"数据管理"
│      history.push('/dataManage') → URL: /bics/dataManage
│      ri.e(7244) 加载异步 chunk
│        → "./p__DataManage__index.700a9194.async.js"
│        → <base> 解析 → /bics/p__DataManage__index.700a9194.async.js
│
└─ 4. 页面渲染完成 ✅
```

**核心设计思想**：`base` 解决"我是谁"（路由在哪），`publicPath` 解决"文件在哪"（资源怎么加载），`<base>` 是桥梁，把两者统一起来。三者分工明确、各司其职，构成了现代前端子路径部署的经典方案。

---

*本文基于真实项目产物分析，所有代码片段均来自 dist 目录下实际打包文件。*
