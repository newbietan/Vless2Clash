#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const KV_BINDING = 'SUBLINK_KV';
const WORKER_NAME = 'vless2clash';
const KV_NAMESPACE_NAME = `${WORKER_NAME}-${KV_BINDING}`;
const SUPPORTED_TITLES = [KV_NAMESPACE_NAME, KV_BINDING];
const WRANGLER_CONFIG_PATH = path.join(__dirname, '..', 'wrangler.toml');

function run(cmd, ignoreError = false) {
  try {
    return execSync(`npx wrangler ${cmd}`, { encoding: 'utf8', stdio: 'pipe' });
  } catch (error) {
    if (!ignoreError) {
      console.error(`命令失败: npx wrangler ${cmd}`);
      console.error(error.message);
      if (error.stdout) console.log('stdout:', error.stdout.toString());
      if (error.stderr) console.error('stderr:', error.stderr.toString());
      process.exit(1);
    }
    throw error;
  }
}

function findNamespace(namespaces) {
  for (const title of SUPPORTED_TITLES) {
    const ns = namespaces.find(n => n.title === title);
    if (ns) {
      console.log(`找到命名空间: ${title} (${ns.id})`);
      return ns;
    }
  }
  return null;
}

function getExistingIdFromConfig() {
  try {
    const config = fs.readFileSync(WRANGLER_CONFIG_PATH, 'utf8');
    const match = config.match(/binding\s*=\s*"SUBLINK_KV"[^}]*id\s*=\s*"([^"]+)"/);
    return match ? match[1] : null;
  } catch {
    return null;
  }
}

function checkKvNamespace() {
  console.log(`检查 KV namespace...`);
  let output;
  try {
    output = run('kv namespace list');
  } catch {
    console.error('获取 KV 列表失败');
    return null;
  }

  try {
    const jsonMatch = output.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return findNamespace(JSON.parse(jsonMatch[0]));
    }
    return null;
  } catch (error) {
    console.error('解析 KV 列表失败:', error.message);
    return null;
  }
}

function createKvNamespace() {
  console.log(`创建 KV namespace "${KV_NAMESPACE_NAME}"...`);
  try {
    const output = run(`kv namespace create "${KV_BINDING}"`, true);
    const idMatch = output.match(/id\s*=\s*"([^"]+)"/);
    if (idMatch) {
      return { title: KV_NAMESPACE_NAME, id: idMatch[1] };
    }
    throw new Error('无法提取 KV namespace ID');
  } catch (error) {
    const output = (error.stderr?.toString() || '') + (error.stdout?.toString() || '');
    if (output.includes('code: 10014') || output.includes('already exists')) {
      console.log('Namespace 已存在，尝试从 wrangler.toml 获取现有 ID...');
      const existingId = getExistingIdFromConfig();
      if (existingId) return { title: KV_NAMESPACE_NAME, id: existingId };
      console.error('无法自动获取 ID，请手动检查 Cloudflare 控制台');
      process.exit(1);
    }
    console.error('创建 KV namespace 失败:', error.message);
    process.exit(1);
  }
}

function updateWranglerConfig(kvId) {
  console.log('更新 wrangler.toml...');
  let config = fs.readFileSync(WRANGLER_CONFIG_PATH, 'utf8');

  const kvBlock = `kv_namespaces = [\n  { binding = "${KV_BINDING}", id = "${kvId}" }\n]`;
  const kvRegex = /kv_namespaces\s*=\s*\[[\s\S]*?\]/;

  if (kvRegex.test(config)) {
    config = config.replace(kvRegex, kvBlock);
  } else {
    config = config.replace(/(\[vars\])/, `${kvBlock}\n\n$1`);
  }

  fs.writeFileSync(WRANGLER_CONFIG_PATH, config);
  console.log('wrangler.toml 已更新');
}

function main() {
  console.log('=== KV Namespace 自动配置 ===\n');

  if (!process.env.CLOUDFLARE_API_TOKEN) {
    console.error('错误: 未设置 CLOUDFLARE_API_TOKEN 环境变量');
    console.error('');
    console.error('请在以下位置之一配置:');
    console.error('  1. Cloudflare Dashboard → Worker → Settings → Environment Variables');
    console.error('  2. GitHub Actions → Settings → Secrets and variables → Actions');
    console.error('  3. 本地终端: export CLOUDFLARE_API_TOKEN=<your-token>');
    console.error('');
    console.error('创建 Token: https://developers.cloudflare.com/fundamentals/api/get-started/create-token/');
    process.exit(1);
  }

  let namespace = checkKvNamespace();

  if (!namespace) {
    namespace = createKvNamespace();
    console.log(`创建成功，ID: ${namespace.id}`);
  }

  updateWranglerConfig(namespace.id);
  console.log('\n配置完成！');
}

main();
