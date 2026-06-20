<div align="center">

# Vless2Clash

**VLESS 链接聚合、去重、转换为 Clash 订阅配置**

基于 [Sublink Worker](https://github.com/7Sageer/sublink-worker) 重构

**一键转换 · 自动去重 · 白蓝终端风格 UI**

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
- [项目结构](#项目结构)
- [技术栈](#技术栈)
- [开源协议](#开源协议)

## 核心优势

### 轻量高效

- **单一职责**：专注 VLESS → Clash 转换，不做多余的事，代码精简、启动快。
- **Serverless 部署**：运行在 Cloudflare Workers 上，无需自建服务器，全球边缘节点加速。

### 开箱即用

- **一键转换**：粘贴 VLESS 链接，自动生成可直接导入 Clash 的 YAML 配置。
- **自动去重**：相同服务器 + 端口 + UUID 的节点自动合并，告别冗余。
- **KV 自动配置**：部署时自动检测/创建 KV namespace，无需手动操作。

### 安全可控

- **管理密码保护**：支持设置管理密码，防止未授权访问。
- **人机验证**：可选 Cloudflare Turnstile 验证，防止滥用。

## 核心特性

- **VLESS 协议解析**：支持 TLS / Reality / XHTTP 等传输方式，兼容各类 VLESS 链接格式。
- **节点去重**：基于 `server:port:uuid` 自动识别并去除重复节点。
- **Clash YAML 输出**：使用 GEOSITE / GEOIP 内置规则，无需下载额外规则集。
- **订阅管理**：保存、查看、删除订阅，支持展开查看节点详情（展示传输方式和安全协议），一键复制订阅链接，搜索过滤功能。
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
   - `ADMIN_PASSWORD`：默认为 `123456`，建议通过 Cloudflare Dashboard 的环境变量覆盖
3. **创建应用**：登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，进入 Workers & Pages，选择 "Import a repository"，关联你 fork 的仓库。
4. **填写构建命令**：在部署设置中，将"构建命令"填写为 `npm run setup-kv`。
5. **配置环境变量**（可选）：在 Settings → Environment Variables 中按需添加：
   - `ADMIN_PASSWORD`：管理密码，默认 `123456`，建议在此覆盖
   - `TURNSTILE_SITEKEY`：Turnstile Site Key
   - `TURNSTILE_SECRET_KEY`：Turnstile Secret Key
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

# 一键部署（自动创建 KV namespace + 部署）
npm run deploy
```

## 环境变量

在 Cloudflare Dashboard → Workers → Settings → Environment Variables 配置，或写入 `wrangler.toml` 的 `[vars]` 段：

| 变量 | 必填 | 说明 |
|------|------|------|
| `ADMIN_PASSWORD` | 否 | 管理密码，默认 `123456`，建议在环境变量中修改 |
| `TURNSTILE_SITEKEY` | 否 | Turnstile Site Key，不设置则跳过验证 |
| `TURNSTILE_SECRET_KEY` | 否 | Turnstile Secret Key |

#### 可选：配置 Turnstile 人机验证

1. 登录 [Cloudflare Dashboard](https://dash.cloudflare.com/)，进入 Turnstile 页面创建一个新的 Widget。
2. 获取 **Site Key** 和 **Secret Key**。
3. 在 Cloudflare Dashboard 的 Worker 环境变量中添加 `TURNSTILE_SITEKEY` 和 `TURNSTILE_SECRET_KEY`。
4. 重新部署使配置生效。

## 使用说明

### 1. 登录

访问部署地址，输入管理密码登录（如已配置）。

### 2. 转换订阅

1. 在仪表盘输入 VLESS 链接（每行一个）
2. 勾选"去重"可自动去除重复节点
3. 点击"转换为 Clash 配置"
4. 复制生成的订阅链接

### 3. 管理订阅

- 点击"订阅管理"查看所有已保存的订阅
- 点击订阅记录展开查看节点详情
- 可复制订阅链接或删除订阅

### 4. Clash 客户端使用

在 Clash / Mihomo 客户端中添加订阅：
- 订阅名称：自定义
- 订阅地址：生成的链接
- 自动更新：建议 3600 秒

## 生成的配置说明

### 代理组

- **PROXY** — 手动选择节点，包含 DIRECT 选项

### 路由规则

使用 GEOSITE / GEOIP 内置规则，无需下载额外规则集：

- 中国域名 → 直连
- 中国 IP → 直连
- 私有网络 → 直连
- 其他流量 → 代理

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
