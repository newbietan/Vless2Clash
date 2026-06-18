#!/usr/bin/env node
import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const NAMESPACE_NAME = 'SUBLINK_KV';
const CONFIG_FILE = 'wrangler.toml';

function run(cmd) {
    try {
        return execSync(cmd, { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'pipe'] }).trim();
    } catch (e) {
        return e.stdout?.trim() || '';
    }
}

function getExistingId() {
    const config = readFileSync(CONFIG_FILE, 'utf-8');
    const match = config.match(/id\s*=\s*"([^"]+)"/);
    return match ? match[1] : null;
}

function updateConfigId(newId) {
    let config = readFileSync(CONFIG_FILE, 'utf-8');
    config = config.replace(/(binding\s*=\s*"SUBLINK_KV"[^}]*id\s*=\s*)"[^"]*"/, `$1"${newId}"`);
    writeFileSync(CONFIG_FILE, config);
    console.log(`Updated ${CONFIG_FILE} with new KV namespace ID: ${newId}`);
}

async function main() {
    console.log('Checking KV namespace...');
    
    // List existing namespaces
    const listOutput = run('npx wrangler kv namespace list');
    
    if (listOutput.includes('error') || listOutput.includes('Error')) {
        console.log('Could not list KV namespaces. Attempting to create...');
    } else {
        // Check if namespace already exists
        try {
            const namespaces = JSON.parse(listOutput);
            const existing = namespaces.find(ns => ns.title === NAMESPACE_NAME || ns.title.includes(NAMESPACE_NAME));
            if (existing) {
                console.log(`KV namespace "${NAMESPACE_NAME}" already exists with ID: ${existing.id}`);
                const currentId = getExistingId();
                if (currentId !== existing.id) {
                    updateConfigId(existing.id);
                }
                deploy();
                return;
            }
        } catch {
            // JSON parse failed, continue to create
        }
    }
    
    // Create new namespace
    console.log(`Creating KV namespace "${NAMESPACE_NAME}"...`);
    const createOutput = run('npx wrangler kv namespace create ' + NAMESPACE_NAME);
    
    const idMatch = createOutput.match(/id\s*=\s*"([^"]+)"/);
    if (idMatch) {
        const newId = idMatch[1];
        console.log(`Created KV namespace with ID: ${newId}`);
        updateConfigId(newId);
        deploy();
    } else {
        console.error('Failed to create KV namespace. Output:', createOutput);
        console.log('\nPlease manually create the KV namespace:');
        console.log('  npx wrangler kv namespace create SUBLINK_KV');
        console.log('\nThen update the ID in wrangler.toml');
        process.exit(1);
    }
}

function deploy() {
    console.log('\nDeploying to Cloudflare Workers...');
    try {
        execSync('npx wrangler deploy', { stdio: 'inherit' });
    } catch (e) {
        console.error('Deploy failed');
        process.exit(1);
    }
}

main();