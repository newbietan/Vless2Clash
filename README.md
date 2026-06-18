<div align="center">

# 多平台订阅聚合平台

**VLESS 链接聚合、去重、转换为 Clash 订阅配置**

基于 [Sublink Worker](https://github.com/7Sageer/sublink-worker) 重构

</div>

---

## 功能特性

- **VLESS 协议支持** - 解析 vless:// 链接，支持 TLS/Reality/XHTTP 等传输方式
- **节点去重** - 自动识别并去除重复节点
- **Clash 配置生成** - 输出标准 Clash YAML 配置，使用 GEOSITE/GEOIP 内置规则
- **订阅管理** - 保存、查看、删除订阅，支持展开查看节点详情
- **人机验证** - 支持 Cloudflare Turnstile 验证
- **终端风格 UI** - 现代化界面设计

## 快速开始

### 环境要求

- Node.js >= 18
- Cloudflare 账户

### 安装

```bash
git clone https://github.com/newbietan/sublink-worker.git
cd sublink-worker
npm install
```

### 本地开发

```bash
npm run dev
```

访问 `http://localhost:8787`

### 部署

```bash
# 登录 Cloudflare
npx wrangler login

# 部署（自动创建 KV namespace）
npm run deploy
```

## 环境变量

在 Cloudflare Dashboard → Workers → Settings → Environment Variables 配置：

| 变量 | 必填 | 说明 |
|------|------|------|
| `ADMIN_PASSWORD` | 否 | 管理密码，不设置则无需登录 |
| `TURNSTILE_SITEKEY` | 否 | Turnstile Site Key，不设置则跳过验证 |
| `TURNSTILE_SECRET_KEY` | 否 | Turnstile Secret Key |

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

在 Clash/Mihomo 客户端中添加订阅：
- 订阅名称：自定义
- 订阅地址：生成的链接
- 自动更新：建议 3600 秒

## 生成的配置说明

### 代理组

- **PROXY** - 手动选择节点，包含 DIRECT 选项

### 路由规则

使用 GEOSITE/GEOIP 内置规则，无需下载额外规则集：

- 中国域名 → 直连
- 中国 IP → 直连
- 私有网络 → 直连
- 其他流量 → 代理

## 项目结构

```
src/
├── adapters/kv/           # KV 存储适配器
│   ├── cloudflareKv.js    # Cloudflare KV
│   └── memoryKv.js        # 测试用内存 KV
├── app/
│   └── createApp.jsx      # Hono 路由
├── builders/
│   └── SimpleClashConfigBuilder.js  # Clash 配置生成
├── components/
│   ├── Layout.jsx         # 终端风格布局
│   ├── LoginPage.jsx      # 登录页面
│   ├── DashboardPage.jsx  # 仪表盘
│   └── SubscriptionsPage.jsx  # 订阅管理
├── parsers/protocols/
│   └── vlessParser.js     # VLESS 链接解析
├── runtime/
│   ├── cloudflare.js      # Cloudflare 运行时
│   └── runtimeConfig.js   # 配置规范化
├── services/
│   ├── authService.js     # 认证服务
│   ├── configStorageService.js  # 配置存储
│   └── turnstileService.js      # Turnstile 验证
├── utils.js               # 工具函数
└── worker.jsx             # Cloudflare Workers 入口
```

## 技术栈

- **运行时**: Cloudflare Workers
- **框架**: Hono (JSX SSR)
- **存储**: Cloudflare KV
- **部署**: Wrangler
- **测试**: Vitest

## 许可证

MIT
