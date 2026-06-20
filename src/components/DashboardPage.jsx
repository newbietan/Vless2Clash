/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */

export const DashboardPage = () => {
    return (
        <fragment>
            {/* Header */}
            <div class="mb-8 border-b border-surface-variant pb-4">
                <h1 class="text-headline-lg font-headline-lg text-on-surface tracking-tight mb-1">仪表盘</h1>
                <p class="text-body-md font-code-md text-on-surface-variant">&gt; 聚合、过滤并转换多个 vless:// URI 为统一的 Clash 订阅配置。</p>
            </div>

            {/* Converter Tool */}
            <div class="max-w-4xl mx-auto w-full flex flex-col gap-gutter">
                {/* Input Card */}
                <div class="tech-card rounded-lg p-window-padding flex flex-col gap-3">
                    <div class="flex justify-between items-center mb-2">
                        <label class="text-label-sm font-code-md text-on-surface-variant uppercase tracking-widest flex items-center gap-2" for="vless-input">
                            <span class="material-symbols-outlined text-[16px]">input</span>
                            输入 VLESS 链接
                        </label>
                        <div class="flex items-center gap-4">
                            <label class="flex items-center gap-2 cursor-pointer">
                                <div class="relative flex items-center">
                                    <input type="checkbox" class="peer sr-only" checked id="opt-dedup" />
                                    <div class="w-9 h-5 bg-surface-container-high rounded-full border border-outline-variant peer-checked:bg-primary peer-checked:border-primary transition-colors"></div>
                                    <div class="absolute left-0.5 w-4 h-4 bg-surface-container-lowest rounded-full peer-checked:translate-x-4 transition-transform duration-200"></div>
                                </div>
                                <span class="text-code-md font-code-md text-on-surface-variant">去重</span>
                            </label>
                        </div>
                    </div>
                    <textarea
                        class="w-full h-48 bg-[#1A1A1A] border border-[#444444] rounded p-3 font-code-md text-code-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y transition-colors"
                        id="vless-input"
                        placeholder={`vless://uuid@server:port?security=tls&type=ws&path=/ws#节点名
vless://uuid2@server2:port?security=reality&pbk=xxx#节点名2`}
                    ></textarea>
                </div>

                {/* Convert Button */}
                <button
                    id="convert-btn"
                    class="w-full bg-primary text-on-primary-fixed-variant py-3 rounded-lg font-code-md text-label-sm uppercase tracking-wider font-bold shadow-[0_0_15px_rgba(173,198,255,0.4)] hover:bg-primary-fixed active:scale-[0.99] transition-all flex justify-center items-center gap-2"
                >
                    <span class="material-symbols-outlined text-[20px]">transform</span>
                    转换为 Clash 配置
                </button>

                {/* Output Card */}
                <div class="tech-card rounded-lg p-window-padding flex flex-col relative overflow-hidden">
                    <div class="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                    <div class="flex justify-between items-center mb-4 z-10">
                        <div class="text-label-sm font-code-md text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                            <span class="material-symbols-outlined text-[16px]">terminal</span>
                            输出
                        </div>
                        <div class="flex items-center gap-2">
                            <span class="w-2 h-2 rounded-full bg-outline-variant" id="status-dot"></span>
                            <span class="text-code-md font-code-md text-on-surface-variant" id="status-text">就绪</span>
                        </div>
                    </div>
                    <div class="bg-surface-container-lowest border border-outline-variant/30 rounded p-3 mb-4 z-10">
                        <pre class="font-code-md text-code-md text-on-surface-variant overflow-x-auto custom-scrollbar whitespace-pre-wrap break-all h-32" id="output-pre">// 生成的配置将在此显示...
// 等待输入。</pre>
                    </div>
                    <button
                        id="copy-btn"
                        class="w-full border border-outline-variant bg-surface-container text-primary py-2.5 rounded-lg font-code-md text-code-md hover:bg-primary-container/20 transition-colors flex justify-center items-center gap-2 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled
                    >
                        <span class="material-symbols-outlined text-[18px]">content_copy</span>
                        复制订阅链接
                    </button>
                </div>
            </div>

            <script dangerouslySetInnerHTML={{ __html: `
                function getToken() {
                    return localStorage.getItem('auth_token') || '';
                }

                function parseNodes(links) {
                    const nodes = [];
                    const seen = new Set();
                    for (const link of links) {
                        try {
                            const url = new URL(link.trim());
                            const uuid = url.username;
                            const server = url.hostname;
                            const port = url.port || '443';
                            const params = url.searchParams;
                            const name = decodeURIComponent(url.hash.slice(1) || server + ':' + port);
                            const dedupKey = server + ':' + port + ':' + uuid;
                            if (seen.has(dedupKey)) continue;
                            seen.add(dedupKey);
                            const region = guessRegion(server, name);
                            nodes.push({
                                name, server,
                                port: parseInt(port),
                                protocol: 'VLESS',
                                transport: params.get('type') || 'tcp',
                                security: params.get('security') || 'none',
                                sni: params.get('sni') || '',
                                region
                            });
                        } catch (e) {}
                    }
                    return nodes;
                }

                function guessRegion(server, name) {
                    const patterns = {
                        US: ['us', 'america', '美国'],
                        JP: ['jp', 'japan', '日本', '东京'],
                        HK: ['hk', 'hongkong', '香港'],
                        SG: ['sg', 'singapore', '新加坡'],
                        TW: ['tw', 'taiwan', '台湾'],
                        KR: ['kr', 'korea', '韩国', '首尔'],
                        DE: ['de', 'germany', '德国'],
                        GB: ['gb', 'uk', '英国'],
                    };
                    const lower = (name + ' ' + server).toLowerCase();
                    for (const [region, pats] of Object.entries(patterns)) {
                        if (pats.some(p => lower.includes(p))) return region;
                    }
                    return 'OTHER';
                }

                document.getElementById('convert-btn').addEventListener('click', async () => {
                    const input = document.getElementById('vless-input').value.trim();
                    if (!input) {
                        alert('请输入至少一个 VLESS 链接');
                        return;
                    }

                    const statusDot = document.getElementById('status-dot');
                    const statusText = document.getElementById('status-text');
                    const outputPre = document.getElementById('output-pre');
                    const copyBtn = document.getElementById('copy-btn');

                    statusDot.className = 'w-2 h-2 rounded-full bg-yellow-500 animate-pulse';
                    statusText.textContent = '处理中...';
                    outputPre.textContent = '// 转换中...';

                    const dedup = document.getElementById('opt-dedup').checked;

                    try {
                        let links = input.split('\\n').filter(l => l.trim().startsWith('vless://'));

                        if (dedup) {
                            const seen = new Set();
                            links = links.filter(link => {
                                try {
                                    const url = new URL(link.trim());
                                    const key = url.hostname + ':' + (url.port || '443') + ':' + url.username;
                                    if (seen.has(key)) return false;
                                    seen.add(key);
                                    return true;
                                } catch { return true; }
                            });
                        }

                        const processedInput = links.join('\\n');
                        const nodes = parseNodes(links);

                        const saveRes = await fetch('/config', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + getToken()
                            },
                            body: JSON.stringify({ vlessLinks: processedInput, nodes: nodes })
                        });

                        if (!saveRes.ok) {
                            throw new Error(await saveRes.text());
                        }

                        const configId = await saveRes.text();
                        const subscriptionUrl = window.location.origin + '/sub?id=' + configId;

                        statusDot.className = 'w-2 h-2 rounded-full bg-green-500';
                        statusText.textContent = '成功';
                        outputPre.textContent = '# 订阅链接\\n' + subscriptionUrl + '\\n\\n# 在 Clash 客户端中使用此链接\\n# 节点数量: ' + links.length;
                        copyBtn.disabled = false;
                        copyBtn.onclick = () => {
                            navigator.clipboard.writeText(subscriptionUrl);
                            copyBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">check</span> 已复制';
                            setTimeout(() => {
                                copyBtn.innerHTML = '<span class="material-symbols-outlined text-[18px]">content_copy</span> 复制订阅链接';
                            }, 2000);
                        };
                    } catch (error) {
                        statusDot.className = 'w-2 h-2 rounded-full bg-red-500';
                        statusText.textContent = '错误';
                        outputPre.textContent = '// 错误: ' + error.message;
                    }
                });
            ` }} />
        </fragment>
    );
};

export default DashboardPage;
