<div align="center">

# Vless2Clash

**VLESS 链接聚合、去重、转换为 Clash 订阅配置**

基于 [Sublink Worker](https://github.com/7Sageer/sublink-worker) 重构

**实时节点预览 · 可视化编辑 · 自动去重 · 一键生成订阅**

[![Stars](https://img.shields.io/github/stars/newbietan/Vless2Clash?style=flat&logo=github)](https://github.com/newbietan/Vless2Clash/stargazers)
[![License](https://img.shields.io/github/license/newbietan/Vless2Clash?style=flat)](LICENSE)
[![Cloudflare](https://img.shields.io/badge/Cloudflare-F38020?style=flat&logo=cloudflare&logoColor=white)](https://workers.cloudflare.com/)
[![Hono](https://img.shields.io/badge/Hono-E36002?style=flat&logo=hono&logoColor=white)](https://hono.dev/)

[核心优势](#核心优势) · [核心特性](#核心特性) · [快速部署](#快速部署) · [使用说明](#使用说明) · [项目结构](#项目结构)

</div>

---

## 目录

- [核心优势](#核心优势)
- [核心特性](#核心特性)
- [快速部署](#快速部署)
- [环境变量](#环境变量)
- [使用说明](#使用说明)
- [生成的配置说明](#生成的配置说明)
- [本地开发](#本地开发)
- [项目结构](#项目结构)
- [技术栈](#技术栈)
- [开源协议](#开源协议)

## 核心优势

### 轻量高效

- **单一职责**：专注 VLESS → Clash 转换，不做多余的事，代码精简、启动快。
- **Serverless 部署**：运行在 Cloudflare Workers 上，无需自建服务器，全球边缘节点加速。

### 开箱即用

- **一键转换**：粘贴 VLESS 链接，自动生成可直接导入 Clash 的 YAML 配置。
- **实时节点预览**：输入后自动解析节点，展示名称、服务器、传输方式和安全类型，无需写入 KV。
- **可视化节点管理**：支持搜索、全选、批量删除以及单节点编辑，并将修改同步回 VLESS URI。
- **自动去重**：相同服务器 + 端口 + UUID 的节点自动合并，告别冗余。
- **KV 自动配置**：部署时自动检测/创建 KV namespace，无需手动操作。

### 安全可控

- **默认关闭匿名管理**：必须配置管理密码；缺少密码时管理页面和管理 API 默认拒绝访问。
- **安全会话**：会话保存在 KV 中并设置有效期，管理页面使用 `HttpOnly`、`SameSite=Strict` Cookie。
- **人机验证**：可选 Cloudflare Turnstile 验证，防止滥用。

## 核心特性

- **VLESS 协议解析**：支持 TCP / WebSocket / gRPC / XHTTP 传输以及 TLS / Reality 安全配置，保留原始扩展参数。
- **节点去重**：基于 `server:port:uuid` 自动识别并去除重复节点。
- **Clash YAML 输出**：使用 GEOSITE / GEOIP 内置规则，无需下载额外规则集。
- **节点实时预览**：输入 VLESS URI 后即时查看、搜索、编辑和批量删除节点。当前预览对象为节点信息，最终 Clash YAML 通过订阅地址获取。
- **订阅管理**：保存、查看、编辑、更新和删除订阅，支持节点详情展开、订阅搜索和链接复制。
- **并发安全索引**：每个订阅使用独立 KV 索引，避免并发写入覆盖，索引与订阅使用相同有效期。
- **终端风格 UI**：白蓝配色的终端窗口界面，侧边栏导航，macOS 风格交通灯按钮（红点为退出），Material Design 3 色彩体系。

## 快速部署

### 前置要求

- 一个 Cloudflare 账号。
- Node.js 环境 (v18+)。

### 部署步骤

#### 通过 GitHub 绑定自动部署（推荐）

1. **Fork 本仓库** 到你的 GitHub 账号。
2. **修改配置**：部署前请先修改 `wrangler.toml` 中的以下配置：
   - `routes.pattern`：改为你自己的域名（需已在 Cloudflare 注册或接入）
   - `ADMIN_PASSWORD`：通过 Cloudflare Dashboard Secret 配置；未配置时管理端默认拒绝访问
3. **创建应用**：登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，进入 Workers & Pages，选择 "Import a repository"，关联你 fork 的仓库。
4. **填写构建命令**：在部署设置中，将"构建命令"填写为 `npm run setup-kv`。
5. **配置环境变量**：在 Settings → Environment Variables 中添加：
   - `ADMIN_PASSWORD`：管理密码，必须配置为 Secret
   - `TURNSTILE_SITEKEY`：可选，Turnstile Site Key
   - `TURNSTILE_SECRET_KEY`：可选，Turnstile Secret Key
6. **部署**：点击保存并部署，KV namespace 会自动检测，不存在则自动创建。

#### 本地命令行部署

```bash
# 克隆仓库
git clone https://github.com/newbietan/Vless2Clash.git
cd Vless2Clash

# 安装依赖
npm install

# 登录 Cloudflare
npx wrangler login

# 写入管理密码，密码不会保存到仓库
npx wrangler secret put ADMIN_PASSWORD

# 一键部署（自动创建 KV namespace + 部署）
npm run deploy
```

## 环境变量

在 Cloudflare Dashboard → Workers → Settings → Environment Variables 配置，或写入 `wrangler.toml` 的 `[vars]` 段：

| 变量 | 必填 | 说明 |
|------|------|------|
| `ADMIN_PASSWORD` | 是 | 管理密码，建议配置为 Cloudflare Secret |
| `DISABLE_AUTH` | 否 | 仅在明确需要公开管理端时设为 `true` |
| `TURNSTILE_SITEKEY` | 否 | Turnstile Site Key，不设置则跳过验证 |
| `TURNSTILE_SECRET_KEY` | 否 | Turnstile Secret Key |

本地命令行部署可通过以下命令写入密码，密码不会进入仓库：

```bash
npx wrangler secret put ADMIN_PASSWORD
```

未配置 `ADMIN_PASSWORD` 时管理页面和管理 API 默认拒绝访问。只有显式设置 `DISABLE_AUTH=true` 才会关闭认证，请勿在公网环境使用该选项。

#### 可选：配置 Turnstile 人机验证

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，进入 Turnstile 页面创建一个新的 Widget。
2. 获取 **Site Key** 和 **Secret Key**。
3. 在 Cloudflare Dashboard 的 Worker 环境变量中添加 `TURNSTILE_SITEKEY` 和 `TURNSTILE_SECRET_KEY`。
4. 重新部署使配置生效。

## 使用说明

### 1. 登录

访问部署地址，输入 `ADMIN_PASSWORD` 对应的管理密码登录。登录成功后会创建有效期为 24 小时的 KV 会话。

### 2. 预览和编辑节点

1. 在仪表盘输入 VLESS 链接，每行一个。
2. 页面会自动显示节点数量和节点预览，无需先保存订阅。
3. 可按节点名称、服务器或地区搜索，也可编辑、单独删除或批量删除节点。
4. “去重”开启时，相同服务器、端口和 UUID 的节点只保留一个；关闭后保留全部节点。

> 节点编辑会保留 Reality 公钥、Short ID、指纹及其他未展示的原始查询参数。

### 3. 生成订阅

1. 确认节点预览无误后，点击“转换为 Clash 配置”。
2. 服务端会重新校验并规范化 VLESS URI，然后保存到 KV。
3. 复制生成的订阅链接，并添加到 Clash / Mihomo 客户端。

### 4. 管理和更新订阅

- 点击"订阅管理"查看所有已保存的订阅
- 点击订阅记录展开查看节点详情
- 可复制订阅链接、搜索订阅或删除订阅
- 点击编辑按钮返回仪表盘修改节点，再点击“更新订阅”即可保留原订阅地址

### 5. Clash 客户端使用

在 Clash / Mihomo 客户端中添加订阅：
- 订阅名称：自定义
- 订阅地址：生成的链接
- 自动更新：建议 3600 秒

## 生成的配置说明

### 代理组

- **PROXY** — 默认代理选择，包含全部节点、业务分组和 `DIRECT`
- **Streaming** — Netflix、Disney+、Spotify、YouTube 等流媒体规则
- **AI** — OpenAI、Anthropic、Cursor 等 AI 服务规则
- **Microsoft** — 微软服务分组，默认优先直连
- **Telegram** — Telegram 专用分组

### 路由规则

使用 GEOSITE / GEOIP 内置规则，无需下载额外规则集：

- 中国域名 → 直连
- 中国 IP → 直连
- 私有网络 → 直连
- 广告域名 → 拒绝
- Telegram → `Telegram`
- AI 服务 → `AI`
- 流媒体 → `Streaming`
- Google、GitHub 和常用境外服务 → `PROXY`
- 其他流量 → `PROXY`

生成的配置面向支持 GEOSITE / GEOIP 规则的 Clash.Meta / Mihomo 内核。

## 本地开发

```bash
npm install
npm run dev
```

运行测试：

```bash
npm test
```

## 项目结构

```
src/
├── adapters/kv/
│   ├── cloudflareKv.js         # Cloudflare KV 适配器
│   └── memoryKv.js             # 测试用内存 KV
├── app/
│   └── createApp.jsx           # Hono 路由
├── builders/
│   └── SimpleClashConfigBuilder.js  # Clash 配置生成
├── components/
│   ├── Layout.jsx              # 白蓝终端风格布局（侧边栏导航）
│   ├── LoginPage.jsx           # 登录页面
│   ├── DashboardPage.jsx       # 仪表盘
│   └── SubscriptionsPage.jsx   # 订阅管理
├── parsers/protocols/
│   └── vlessParser.js          # VLESS 链接解析
├── runtime/
│   ├── cloudflare.js           # Cloudflare 运行时适配
│   └── runtimeConfig.js        # 配置规范化
├── services/
│   ├── authService.js          # 认证服务
│   ├── configStorageService.js # 配置存储
│   └── turnstileService.js     # Turnstile 验证
├── constants.js                # 应用常量
├── utils.js                    # 工具函数
└── worker.jsx                  # Cloudflare Workers 入口
```

## 技术栈

- **运行时**: Cloudflare Workers
- **框架**: Hono (JSX SSR)
- **存储**: Cloudflare KV
- **部署**: Wrangler
- **测试**: Vitest

## 开源协议

本项目基于 [MIT License](LICENSE) 协议开源。

欢迎提交 Issue 和 Pull Request。如果这个项目对你有帮助，恳请点个 ⭐ Star 支持一下！
