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
                            <span class="text-code-md font-code-md text-on-surface-variant" id="node-count-label">0 个节点</span>
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
                        class="w-full h-48 bg-surface-container-lowest border border-outline-variant rounded p-3 font-code-md text-code-md text-on-surface focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary resize-y transition-colors"
                        id="vless-input"
                        placeholder={`vless://uuid@server:port?security=tls&type=ws&path=/ws#节点名
vless://uuid2@server2:port?security=reality&pbk=xxx#节点名2`}
                    ></textarea>
                </div>

                {/* Node Preview Panel */}
                <div id="preview-panel" class="tech-card rounded-lg p-window-padding flex-col gap-3 hidden">
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-label-sm font-code-md text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                            <span class="material-symbols-outlined text-[16px]">dns</span>
                            节点预览
                        </span>
                        <div class="flex items-center gap-2">
                            <input
                                type="text"
                                id="node-search"
                                class="bg-surface-container-lowest border border-outline-variant rounded px-2 py-1 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary w-40"
                                placeholder="搜索节点..."
                            />
                            <button id="select-all-btn" class="text-label-sm font-code-md text-primary hover:text-primary/80 transition-colors px-2 py-1">全选</button>
                            <button id="delete-selected-btn" class="text-label-sm font-code-md text-error hover:text-error/80 transition-colors px-2 py-1 hidden">删除选中</button>
                        </div>
                    </div>
                    <div id="node-list" class="flex flex-col gap-2 max-h-96 overflow-y-auto"></div>
                </div>

                {/* Node Editor (hidden by default) */}
                <div id="node-editor" class="tech-card rounded-lg p-window-padding hidden">
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-label-sm font-code-md text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                            <span class="material-symbols-outlined text-[16px]">edit</span>
                            编辑节点
                        </span>
                        <button id="editor-close-btn" class="text-on-surface-variant hover:text-on-surface transition-colors">
                            <span class="material-symbols-outlined text-[20px]">close</span>
                        </button>
                    </div>
                    <div id="editor-form" class="grid grid-cols-1 sm:grid-cols-2 gap-3"></div>
                    <div class="flex justify-end gap-3 mt-4">
                        <button id="editor-cancel-btn" class="border border-outline-variant bg-surface-container text-on-surface-variant px-4 py-2 rounded font-code-md text-code-md hover:bg-surface-container-high transition-colors">取消</button>
                        <button id="editor-save-btn" class="bg-primary text-on-primary px-4 py-2 rounded font-code-md text-code-md hover:bg-primary/90 transition-colors">保存</button>
                    </div>
                </div>

                {/* Action Buttons */}
                <div class="flex gap-3">
                    <button
                        id="convert-btn"
                        class="flex-1 bg-primary text-on-primary py-3 rounded-lg font-code-md text-label-sm uppercase tracking-wider font-bold shadow-sm hover:bg-primary/90 active:scale-[0.99] transition-all flex justify-center items-center gap-2"
                    >
                        <span class="material-symbols-outlined text-[20px]">transform</span>
                        转换为 Clash 配置
                    </button>
                    <button
                        id="update-btn"
                        class="hidden bg-secondary text-on-secondary py-3 px-6 rounded-lg font-code-md text-label-sm uppercase tracking-wider font-bold shadow-sm hover:bg-secondary/90 active:scale-[0.99] transition-all flex justify-center items-center gap-2"
                    >
                        <span class="material-symbols-outlined text-[20px]">save</span>
                        更新订阅
                    </button>
                </div>

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
                // === State ===
                let nodes = [];
                let editingIndex = -1;
                let selectedIndices = new Set();
                let editingConfigId = null;
                let parseTimer = null;

                const textarea = document.getElementById('vless-input');
                const previewPanel = document.getElementById('preview-panel');
                const nodeList = document.getElementById('node-list');
                const nodeCountLabel = document.getElementById('node-count-label');
                const nodeEditor = document.getElementById('node-editor');
                const editorForm = document.getElementById('editor-form');
                const convertBtn = document.getElementById('convert-btn');
                const updateBtn = document.getElementById('update-btn');

                // === Auth ===
                function getToken() {
                    return localStorage.getItem('auth_token') || '';
                }

                // === Parsing ===
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

                function parseNodes(links, shouldDedup = true) {
                    const result = [];
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
                            if (shouldDedup && seen.has(dedupKey)) continue;
                            seen.add(dedupKey);
                            result.push({
                                name,
                                uuid: decodeURIComponent(uuid),
                                server,
                                port: parseInt(port),
                                protocol: 'VLESS',
                                transport: params.get('type') || 'tcp',
                                security: params.get('security') || 'none',
                                sni: params.get('sni') || '',
                                path: params.get('path') || '',
                                host: params.get('host') || '',
                                serviceName: params.get('serviceName') || '',
                                flow: params.get('flow') || '',
                                region: guessRegion(server, name),
                                params: Array.from(params.entries())
                            });
                        } catch (e) {}
                    }
                    return result;
                }

                function serializeVlessLink(node) {
                    const params = new URLSearchParams(Array.isArray(node.params) ? node.params : []);
                    setParam(params, 'type', node.transport, 'tcp');
                    setParam(params, 'security', node.security, 'none');
                    setParam(params, 'sni', node.sni);
                    setParam(params, 'path', node.path);
                    setParam(params, 'host', node.host);
                    setParam(params, 'serviceName', node.serviceName);
                    setParam(params, 'flow', node.flow);

                    const query = params.toString();
                    const hash = node.name ? '#' + encodeURIComponent(node.name) : '';
                    const server = node.server.includes(':') && !node.server.startsWith('[')
                        ? '[' + node.server + ']'
                        : node.server;
                    return 'vless://' + encodeURIComponent(node.uuid) + '@' + server + ':' + node.port + (query ? '?' + query : '') + hash;
                }

                function setParam(params, key, value, defaultValue = '') {
                    if (value && value !== defaultValue) {
                        params.set(key, value);
                    } else {
                        params.delete(key);
                    }
                }

                // === Bidirectional Sync ===
                function syncFromTextarea() {
                    const input = textarea.value.trim();
                    if (!input) {
                        nodes = [];
                        selectedIndices.clear();
                        closeEditor();
                        renderPreview();
                        return;
                    }
                    const lines = input.split('\\n').filter(l => l.trim().startsWith('vless://'));
                    const shouldDedup = document.getElementById('opt-dedup').checked;
                    nodes = parseNodes(lines, shouldDedup);
                    selectedIndices.clear();
                    closeEditor();
                    renderPreview();
                }

                function syncToTextarea() {
                    const links = nodes.map(n => serializeVlessLink(n));
                    textarea.value = links.join('\\n');
                }

                // === Preview Rendering ===
                function renderPreview() {
                    const count = nodes.length;
                    nodeCountLabel.textContent = count + ' 个节点';

                    if (count === 0) {
                        previewPanel.classList.add('hidden');
                        previewPanel.classList.remove('flex');
                        return;
                    }

                    previewPanel.classList.remove('hidden');
                    previewPanel.classList.add('flex');

                    const searchQuery = (document.getElementById('node-search').value || '').toLowerCase();
                    const filtered = searchQuery
                        ? nodes.map((n, i) => ({ node: n, index: i })).filter(({ node }) =>
                            node.name.toLowerCase().includes(searchQuery) ||
                            node.server.toLowerCase().includes(searchQuery) ||
                            node.region.toLowerCase().includes(searchQuery))
                        : nodes.map((n, i) => ({ node: n, index: i }));

                    nodeList.innerHTML = filtered.map(({ node, index }) => {
                        const secColor = (node.security === 'tls' || node.security === 'reality') ? 'primary' : 'outline';
                        const secLabel = (node.security || 'none').toUpperCase();
                        const transportLabel = (node.transport || 'tcp').toUpperCase();
                        const transportColor = (node.transport === 'grpc' || node.transport === 'h2') ? 'tertiary' : 'secondary';
                        const isSelected = selectedIndices.has(index);

                        let html = '<div class="flex items-center justify-between p-2.5 border rounded transition-colors ' +
                            (isSelected ? 'border-primary/50 bg-primary/5' : 'border-outline-variant/20 bg-surface-container-lowest/30 hover:border-primary/30') + '">';
                        html += '<div class="flex items-center gap-3 flex-1 min-w-0">';
                        html += '<input type="checkbox" class="node-checkbox accent-primary" data-index="' + index + '"' + (isSelected ? ' checked' : '') + ' />';
                        html += '<div class="flex flex-col min-w-0">';
                        html += '<span class="text-secondary-fixed-dim font-code-md truncate">' + escapeHtml(node.name) + '</span>';
                        html += '<span class="text-label-sm font-code-md text-on-surface-variant/60 mt-0.5">' + escapeHtml(node.server) + ':' + node.port + '</span>';
                        html += '</div></div>';
                        html += '<div class="flex items-center gap-2 flex-shrink-0">';
                        html += '<span class="px-1.5 py-0.5 rounded bg-' + transportColor + '/10 border border-' + transportColor + '/30 text-' + transportColor + ' text-[10px] font-bold uppercase tracking-tighter">' + escapeHtml(transportLabel) + '</span>';
                        html += '<span class="px-1.5 py-0.5 rounded bg-' + secColor + '/10 border border-' + secColor + '/30 text-' + secColor + ' text-[10px] font-bold uppercase tracking-tighter">' + escapeHtml(secLabel) + '</span>';
                        html += '<button class="node-edit-btn text-on-surface-variant hover:text-primary p-1 rounded transition-colors" data-index="' + index + '" title="编辑">';
                        html += '<span class="material-symbols-outlined text-[16px]">edit</span></button>';
                        html += '<button class="node-delete-btn text-on-surface-variant hover:text-error p-1 rounded transition-colors" data-index="' + index + '" title="删除">';
                        html += '<span class="material-symbols-outlined text-[16px]">delete</span></button>';
                        html += '</div></div>';
                        return html;
                    }).join('');

                    // Update select-all button
                    const allSelected = nodes.length > 0 && selectedIndices.size === nodes.length;
                    document.getElementById('select-all-btn').textContent = allSelected ? '取消全选' : '全选';
                    document.getElementById('delete-selected-btn').classList.toggle('hidden', selectedIndices.size === 0);
                }

                function escapeHtml(str) {
                    return String(str ?? '')
                        .replace(/&/g, '&amp;')
                        .replace(/</g, '&lt;')
                        .replace(/>/g, '&gt;')
                        .replace(/"/g, '&quot;')
                        .replace(/'/g, '&#39;');
                }

                // === Node Editor ===
                function openEditor(index) {
                    editingIndex = index;
                    const node = nodes[index];
                    const transportFields = getTransportFields(node.transport, node);

                    let html = '<div class="sm:col-span-2"><label class="text-label-sm font-code-md text-on-surface-variant block mb-1">节点名</label>';
                    html += '<input type="text" id="ed-name" value="' + escapeHtml(node.name) + '" class="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary" /></div>';
                    html += '<div><label class="text-label-sm font-code-md text-on-surface-variant block mb-1">服务器</label>';
                    html += '<input type="text" id="ed-server" value="' + escapeHtml(node.server) + '" class="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary" /></div>';
                    html += '<div><label class="text-label-sm font-code-md text-on-surface-variant block mb-1">端口</label>';
                    html += '<input type="number" id="ed-port" value="' + node.port + '" class="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary" /></div>';
                    html += '<div class="sm:col-span-2"><label class="text-label-sm font-code-md text-on-surface-variant block mb-1">UUID</label>';
                    html += '<input type="text" id="ed-uuid" value="' + escapeHtml(node.uuid) + '" class="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary" /></div>';
                    html += '<div><label class="text-label-sm font-code-md text-on-surface-variant block mb-1">传输方式</label>';
                    html += '<select id="ed-transport" class="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary">';
                    ['tcp', 'ws', 'grpc', 'xhttp'].forEach(t => {
                        html += '<option value="' + t + '"' + (node.transport === t ? ' selected' : '') + '>' + t.toUpperCase() + '</option>';
                    });
                    html += '</select></div>';
                    html += '<div><label class="text-label-sm font-code-md text-on-surface-variant block mb-1">安全</label>';
                    html += '<select id="ed-security" class="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary">';
                    ['none', 'tls', 'reality'].forEach(s => {
                        html += '<option value="' + s + '"' + (node.security === s ? ' selected' : '') + '>' + s.toUpperCase() + '</option>';
                    });
                    html += '</select></div>';
                    html += '<div><label class="text-label-sm font-code-md text-on-surface-variant block mb-1">SNI</label>';
                    html += '<input type="text" id="ed-sni" value="' + escapeHtml(node.sni) + '" class="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary" /></div>';

                    // Transport-specific fields
                    html += '<div id="ed-transport-fields">' + transportFields + '</div>';

                    editorForm.innerHTML = html;
                    nodeEditor.classList.remove('hidden');

                    // Re-render transport fields on change
                    document.getElementById('ed-transport').addEventListener('change', (e) => {
                        const currentNode = {
                            ...node,
                            path: document.getElementById('ed-path')?.value.trim() || node.path || '',
                            host: document.getElementById('ed-host')?.value.trim() || node.host || '',
                            serviceName: document.getElementById('ed-svc')?.value.trim() || node.serviceName || ''
                        };
                        document.getElementById('ed-transport-fields').innerHTML = getTransportFields(e.target.value, currentNode);
                    });
                }

                function getTransportFields(transport, node) {
                    let html = '';
                    if (transport === 'ws' || transport === 'xhttp') {
                        html += '<div><label class="text-label-sm font-code-md text-on-surface-variant block mb-1">路径</label>';
                        html += '<input type="text" id="ed-path" value="' + escapeHtml(node.path || '') + '" class="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary" /></div>';
                    }
                    if (transport === 'ws') {
                        html += '<div><label class="text-label-sm font-code-md text-on-surface-variant block mb-1">Host</label>';
                        html += '<input type="text" id="ed-host" value="' + escapeHtml(node.host || '') + '" class="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary" /></div>';
                    }
                    if (transport === 'grpc') {
                        html += '<div><label class="text-label-sm font-code-md text-on-surface-variant block mb-1">Service Name</label>';
                        html += '<input type="text" id="ed-svc" value="' + escapeHtml(node.serviceName || '') + '" class="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary" /></div>';
                    }
                    return html;
                }

                function saveNodeEdit() {
                    if (editingIndex < 0 || editingIndex >= nodes.length) return;
                    const node = nodes[editingIndex];

                    node.name = document.getElementById('ed-name').value.trim() || node.name;
                    node.server = document.getElementById('ed-server').value.trim() || node.server;
                    node.port = parseInt(document.getElementById('ed-port').value) || node.port;
                    node.uuid = document.getElementById('ed-uuid').value.trim() || node.uuid;
                    node.transport = document.getElementById('ed-transport').value;
                    node.security = document.getElementById('ed-security').value;
                    node.sni = document.getElementById('ed-sni').value.trim();
                    node.region = guessRegion(node.server, node.name);

                    // Transport-specific
                    const pathEl = document.getElementById('ed-path');
                    const hostEl = document.getElementById('ed-host');
                    const svcEl = document.getElementById('ed-svc');
                    node.path = pathEl ? pathEl.value.trim() : '';
                    node.host = hostEl ? hostEl.value.trim() : '';
                    node.serviceName = svcEl ? svcEl.value.trim() : '';

                    closeEditor();
                    syncToTextarea();
                    renderPreview();
                }

                function closeEditor() {
                    editingIndex = -1;
                    nodeEditor.classList.add('hidden');
                }

                function deleteNode(index) {
                    nodes.splice(index, 1);
                    selectedIndices.delete(index);
                    // Re-index selected indices
                    const newSelected = new Set();
                    for (const i of selectedIndices) {
                        if (i > index) newSelected.add(i - 1);
                        else if (i < index) newSelected.add(i);
                    }
                    selectedIndices = newSelected;
                    syncToTextarea();
                    renderPreview();
                }

                function deleteSelected() {
                    if (selectedIndices.size === 0) return;
                    const sorted = Array.from(selectedIndices).sort((a, b) => b - a);
                    for (const i of sorted) {
                        nodes.splice(i, 1);
                    }
                    selectedIndices.clear();
                    syncToTextarea();
                    renderPreview();
                }

                // === Event Listeners ===
                textarea.addEventListener('input', () => {
                    clearTimeout(parseTimer);
                    parseTimer = setTimeout(syncFromTextarea, 300);
                });

                document.getElementById('opt-dedup').addEventListener('change', syncFromTextarea);

                nodeList.addEventListener('click', (e) => {
                    const editBtn = e.target.closest('.node-edit-btn');
                    if (editBtn) {
                        openEditor(parseInt(editBtn.dataset.index));
                        return;
                    }
                    const deleteBtn = e.target.closest('.node-delete-btn');
                    if (deleteBtn) {
                        deleteNode(parseInt(deleteBtn.dataset.index));
                        return;
                    }
                    const checkbox = e.target.closest('.node-checkbox');
                    if (checkbox) {
                        const idx = parseInt(checkbox.dataset.index);
                        if (checkbox.checked) selectedIndices.add(idx);
                        else selectedIndices.delete(idx);
                        renderPreview();
                    }
                });

                document.getElementById('node-search').addEventListener('input', () => renderPreview());

                document.getElementById('select-all-btn').addEventListener('click', () => {
                    if (selectedIndices.size === nodes.length) {
                        selectedIndices.clear();
                    } else {
                        nodes.forEach((_, i) => selectedIndices.add(i));
                    }
                    renderPreview();
                });

                document.getElementById('delete-selected-btn').addEventListener('click', deleteSelected);

                document.getElementById('editor-save-btn').addEventListener('click', saveNodeEdit);
                document.getElementById('editor-cancel-btn').addEventListener('click', closeEditor);
                document.getElementById('editor-close-btn').addEventListener('click', closeEditor);

                // === Save/Update ===
                convertBtn.addEventListener('click', async () => {
                    const input = textarea.value.trim();
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
                        const nodeData = parseNodes(links, dedup);

                        const saveRes = await fetch('/config', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + getToken()
                            },
                            body: JSON.stringify({ vlessLinks: processedInput, nodes: nodeData, dedup })
                        });

                        if (!saveRes.ok) {
                            throw new Error(await saveRes.text());
                        }

                        const configId = await saveRes.text();
                        editingConfigId = configId;
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

                        // Show update button after first save
                        updateBtn.classList.remove('hidden');
                    } catch (error) {
                        statusDot.className = 'w-2 h-2 rounded-full bg-red-500';
                        statusText.textContent = '错误';
                        outputPre.textContent = '// 错误: ' + error.message;
                    }
                });

                updateBtn.addEventListener('click', async () => {
                    if (!editingConfigId) return;
                    const input = textarea.value.trim();
                    if (!input) {
                        alert('请输入至少一个 VLESS 链接');
                        return;
                    }

                    const statusDot = document.getElementById('status-dot');
                    const statusText = document.getElementById('status-text');
                    const outputPre = document.getElementById('output-pre');

                    statusDot.className = 'w-2 h-2 rounded-full bg-yellow-500 animate-pulse';
                    statusText.textContent = '更新中...';

                    try {
                        let links = input.split('\\n').filter(l => l.trim().startsWith('vless://'));
                        const dedup = document.getElementById('opt-dedup').checked;
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
                        const nodeData = parseNodes(links, dedup);

                        const res = await fetch('/api/subscriptions/' + editingConfigId, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json',
                                'Authorization': 'Bearer ' + getToken()
                            },
                            body: JSON.stringify({ vlessLinks: links.join('\\n'), nodes: nodeData, dedup })
                        });

                        if (!res.ok) throw new Error(await res.text());

                        const subscriptionUrl = window.location.origin + '/sub?id=' + editingConfigId;
                        statusDot.className = 'w-2 h-2 rounded-full bg-green-500';
                        statusText.textContent = '已更新';
                        outputPre.textContent = '# 订阅已更新\\n' + subscriptionUrl + '\\n\\n# 节点数量: ' + links.length;
                    } catch (error) {
                        statusDot.className = 'w-2 h-2 rounded-full bg-red-500';
                        statusText.textContent = '错误';
                        outputPre.textContent = '// 更新失败: ' + error.message;
                    }
                });

                // === Load existing subscription for editing ===
                async function loadExistingConfig() {
                    const params = new URLSearchParams(window.location.search);
                    const editId = params.get('edit');
                    if (!editId) return;

                    try {
                        const res = await fetch('/api/subscriptions/' + editId, {
                            headers: { 'Authorization': 'Bearer ' + getToken() }
                        });
                        if (!res.ok) throw new Error('Failed to load');
                        const config = await res.json();

                        if (config.vlessLinks) {
                            textarea.value = config.vlessLinks;
                            editingConfigId = editId;
                            updateBtn.classList.remove('hidden');
                            syncFromTextarea();
                        }
                    } catch (error) {
                        console.error('Failed to load config:', error);
                    }
                }

                // === Init ===
                loadExistingConfig();
            ` }} />
        </fragment>
    );
};

export default DashboardPage;
