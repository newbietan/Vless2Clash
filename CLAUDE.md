# CLAUDE.md

## 协作偏好

- 用中文回复；代码注释用英文，注释写 why 不写 how。
- 简洁直接，不要多余总结和解释；除非存在高风险或信息缺口，直接写代码。
- 函数式优先，TS/JS 中避免 OOP；新功能优先复用或重构现有代码。
- 遵循 KISS、DRY 原则；从第一性原理解构问题，警惕 XY 问题。
- 发现不合理的需求或方向要立即指出，不奉承。

## 项目概览

Vless2Clash 是 VLESS 订阅转换器：解析 vless:// 链接，去重后生成 Clash YAML 配置。运行在 Cloudflare Workers 上。技术栈：Hono（JSX SSR）+ Vitest + Wrangler。

## 常用命令

- `npm run dev` — Wrangler 本地开发
- `npm test` — Vitest（基于 `@cloudflare/vitest-pool-workers`，依赖 `wrangler.toml`）
- `npx vitest test/<file>.test.js` — 跑单个测试文件
- `npm run setup-kv` — 自动检测/创建 KV namespace 并更新 wrangler.toml
- `npm run deploy` — setup-kv + wrangler deploy

无 ESLint/Prettier/Biome 配置，未启用自动格式化。

## 项目结构

```
src/
├── adapters/kv/
│   ├── cloudflareKv.js     # Cloudflare KV 适配器
│   └── memoryKv.js         # 测试用内存 KV
├── app/createApp.jsx        # Hono 路由
├── builders/
│   └── SimpleClashConfigBuilder.js  # Clash 配置生成
├── components/              # JSX 页面组件
├── parsers/protocols/
│   └── vlessParser.js       # VLESS 链接解析
├── runtime/
│   ├── cloudflare.js        # Cloudflare 运行时适配
│   └── runtimeConfig.js     # 配置规范化
├── services/                # auth / configStorage / turnstile
├── utils.js                 # 工具函数
└── worker.jsx               # Cloudflare Workers 入口
```

## 关键约定

- `.jsx` 文件用 Hono JSX runtime，**不是 React**
- KV binding 名称为 `SUBLINK_KV`，通过 Cloudflare Dashboard 绑定或 setup-kv 脚本自动创建
- 部署方式：Cloudflare 直连 GitHub，构建命令 `npm run setup-kv`
- 错误用 `ServiceError` 子类，返回干净响应
