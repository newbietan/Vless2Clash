/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */

export const SubscriptionsPage = () => {
    return (
        <fragment>
            {/* Header Area */}
            <div class="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-surface-variant pb-4">
                <div>
                    <h1 class="text-headline-lg font-headline-lg text-on-surface tracking-tight mb-1">活跃订阅列表</h1>
                    <p class="text-body-md font-code-md text-on-surface-variant">&gt; 查询所有订阅状态...</p>
                </div>
                <div class="flex gap-3 w-full sm:w-auto">
                    <div class="relative flex-1 sm:w-64">
                        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-primary text-[20px]">search</span>
                        <input id="search-input" class="w-full bg-surface-container-lowest border border-outline-variant text-on-surface font-code-md text-code-md py-2 pl-10 pr-4 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/50 transition-colors" placeholder="> 搜索节点..." type="text" />
                    </div>
                    <a href="/" class="bg-primary text-on-primary px-4 py-2 font-code-md text-label-sm uppercase tracking-wider flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-sm">
                        <span class="material-symbols-outlined text-[20px]">add</span>
                        新建订阅
                    </a>
                </div>
            </div>

            {/* Metrics Top Row */}
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-gutter mb-8">
                <div class="tech-card p-5 flex items-start justify-between relative overflow-hidden group">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div>
                        <span class="text-label-sm font-code-md text-on-surface-variant block mb-2 tracking-widest uppercase">总订阅数</span>
                        <span class="text-headline-lg font-headline-lg text-on-surface" id="stat-total">-</span>
                    </div>
                    <div class="bg-surface-container p-2 rounded-lg border border-surface-variant">
                        <span class="material-symbols-outlined text-primary text-[24px]">list_alt</span>
                    </div>
                </div>
                <div class="tech-card p-5 flex items-start justify-between relative overflow-hidden group">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-secondary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div>
                        <span class="text-label-sm font-code-md text-on-surface-variant block mb-2 tracking-widest uppercase">总节点数</span>
                        <span class="text-headline-lg font-headline-lg text-on-surface" id="stat-nodes">-</span>
                    </div>
                    <div class="bg-surface-container p-2 rounded-lg border border-surface-variant">
                        <span class="material-symbols-outlined text-secondary text-[24px]">hub</span>
                    </div>
                </div>
                <div class="tech-card p-5 flex items-start justify-between relative overflow-hidden group">
                    <div class="absolute top-0 right-0 w-24 h-24 bg-tertiary/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div>
                        <span class="text-label-sm font-code-md text-on-surface-variant block mb-2 tracking-widest uppercase">最后同步</span>
                        <span class="text-headline-lg font-headline-lg text-on-surface" id="stat-recent">-</span>
                    </div>
                    <div class="bg-surface-container p-2 rounded-lg border border-surface-variant">
                        <span class="material-symbols-outlined text-tertiary text-[24px]">sync</span>
                    </div>
                </div>
            </div>

            {/* Subscription List Section */}
            <div class="flex flex-col gap-4">
                {/* List Header */}
                <div class="flex items-center justify-between border-b border-surface-variant pb-2 px-2">
                    <span class="text-label-sm font-code-md text-outline uppercase tracking-widest w-1/3">配置名称</span>
                    <span class="text-label-sm font-code-md text-outline uppercase tracking-widest w-1/6 hidden sm:block">节点数</span>
                    <span class="text-label-sm font-code-md text-outline uppercase tracking-widest w-1/6 hidden sm:block">状态</span>
                    <span class="text-label-sm font-code-md text-outline uppercase tracking-widest w-1/6 hidden md:block">添加日期</span>
                    <span class="text-label-sm font-code-md text-outline uppercase tracking-widest w-12 text-right">操作</span>
                </div>

                {/* List Container */}
                <div id="subscriptions-list">
                    <div class="tech-card p-8 text-center text-on-surface-variant">
                        <span class="material-symbols-outlined text-[48px] mb-2 block">hourglass_empty</span>
                        加载中...
                    </div>
                </div>
            </div>

            <script dangerouslySetInnerHTML={{ __html: `
                let expandedId = null;
                let allConfigs = [];

                function getToken() {
                    return localStorage.getItem('auth_token') || '';
                }

                async function loadSubscriptions() {
                    try {
                        const res = await fetch('/api/subscriptions', {
                            headers: { 'Authorization': 'Bearer ' + getToken() }
                        });
                        if (!res.ok) throw new Error('Failed to load');
                        allConfigs = await res.json();
                        renderSubscriptions(allConfigs);
                    } catch (error) {
                        document.getElementById('subscriptions-list').innerHTML =
                            '<div class="tech-card p-8 text-center text-error">加载失败: ' + error.message + '</div>';
                    }
                }

                function renderSubscriptions(configs) {
                    // Update stats
                    document.getElementById('stat-total').textContent = configs.length;
                    const totalNodes = configs.reduce((sum, c) => sum + (c.nodeCount || 0), 0);
                    document.getElementById('stat-nodes').textContent = totalNodes.toLocaleString();

                    if (configs.length > 0) {
                        const recent = new Date(configs[0].createdAt);
                        const diff = Date.now() - recent.getTime();
                        const mins = Math.floor(diff / 60000);
                        if (mins < 1) document.getElementById('stat-recent').textContent = '刚刚';
                        else if (mins < 60) document.getElementById('stat-recent').textContent = mins + '分钟前';
                        else if (mins < 1440) document.getElementById('stat-recent').textContent = Math.floor(mins / 60) + '小时前';
                        else document.getElementById('stat-recent').textContent = Math.floor(mins / 1440) + '天前';
                    }

                    const list = document.getElementById('subscriptions-list');

                    if (configs.length === 0) {
                        list.innerHTML = '<div class="tech-card p-8 text-center text-on-surface-variant">' +
                            '<span class="material-symbols-outlined text-[48px] mb-2 block">folder_open</span>' +
                            '<p class="mb-4">暂无订阅</p>' +
                            '<a href="/" class="text-primary hover:underline">前往仪表盘创建订阅</a>' +
                            '</div>';
                        return;
                    }

                    list.innerHTML = configs.map(config => {
                        const date = new Date(config.createdAt).toLocaleDateString('zh-CN');
                        const subUrl = window.location.origin + '/sub?id=' + config.id;
                        const isExpanded = expandedId === config.id;
                        const nodes = config.nodes || [];
                        const isActive = nodes.length > 0;

                        let html = '<div class="tech-card flex flex-col cursor-pointer' + (isExpanded ? ' border-primary' : ' hover:bg-surface-container/50') + (isActive ? '' : ' opacity-70 hover:opacity-100') + '">';

                        // Main Row
                        html += '<div class="p-4 flex items-center justify-between" onclick="toggleExpand(\\'' + config.id + '\\')">';

                        // Name
                        html += '<div class="w-1/3 flex items-center gap-3">';
                        html += '<div class="w-2 h-2 rounded-full ' + (isActive ? 'bg-secondary shadow-[0_0_6px_rgba(78,222,163,0.6)]' : 'bg-error') + '"></div>';
                        html += '<span class="text-body-lg font-body-lg text-on-surface font-semibold truncate' + (isActive ? '' : ' line-through') + '">' + (config.name || config.id) + '</span>';
                        html += '</div>';

                        // Node count
                        html += '<div class="w-1/6 hidden sm:flex items-center gap-2">';
                        html += '<span class="material-symbols-outlined text-outline text-[16px]">dns</span>';
                        html += '<span class="text-code-md font-code-md text-on-surface-variant">' + (config.nodeCount || 0) + '</span>';
                        html += '</div>';

                        // Status
                        html += '<div class="w-1/6 hidden sm:block">';
                        if (isActive) {
                            html += '<span class="inline-flex items-center px-2 py-0.5 border border-secondary/30 bg-secondary/10 text-secondary text-label-sm font-code-md uppercase tracking-wider">启用中</span>';
                        } else {
                            html += '<span class="inline-flex items-center px-2 py-0.5 border border-error/30 bg-error/10 text-error text-label-sm font-code-md uppercase tracking-wider">已关闭</span>';
                        }
                        html += '</div>';

                        // Date
                        html += '<div class="w-1/6 hidden md:block">';
                        html += '<span class="text-code-md font-code-md text-on-surface-variant">' + date + '</span>';
                        html += '</div>';

                        // Expand icon + actions
                        html += '<div class="w-12 flex justify-end items-center gap-1">';
                        html += '<button onclick="event.stopPropagation(); deleteConfig(\\'' + config.id + '\\')" class="text-on-surface-variant hover:text-error p-1 rounded transition-colors" title="删除">';
                        html += '<span class="material-symbols-outlined text-[18px]">delete</span></button>';
                        html += '<span class="material-symbols-outlined text-' + (isExpanded ? 'primary' : 'on-surface-variant') + ' text-[24px]">' + (isExpanded ? 'expand_less' : 'expand_more') + '</span>';
                        html += '</div>';

                        html += '</div>';

                        // Expanded Detail View
                        if (isExpanded) {
                            html += '<div class="border-t border-outline-variant bg-surface-container-low p-4 m-2 rounded relative">';

                            // Node details header
                            html += '<div class="flex justify-between items-center mb-4">';
                            html += '<span class="text-label-sm font-code-md text-outline uppercase tracking-widest">节点详细信息</span>';
                            html += '<div class="flex gap-2">';
                            html += '<button onclick="event.stopPropagation(); copyUrl(\\'' + subUrl + '\\')" class="text-on-surface-variant hover:text-primary transition-colors" title="复制订阅链接">';
                            html += '<span class="material-symbols-outlined text-[18px]">content_copy</span></button>';
                            html += '</div></div>';

                            // Nodes list
                            if (nodes.length > 0) {
                                html += '<div class="space-y-2 mb-6 overflow-y-auto max-h-48 pr-2">';
                                nodes.forEach(node => {
                                    const secColor = (node.security === 'tls' || node.security === 'reality') ? 'primary' : 'outline';
                                    const secLabel = (node.security || 'none').toUpperCase();
                                    const transportLabel = (node.transport || 'tcp').toUpperCase();
                                    const transportColor = (node.transport === 'grpc' || node.transport === 'h2') ? 'tertiary' : 'secondary';

                                    html += '<div class="flex items-center justify-between p-2 border border-outline-variant/20 bg-surface-container-lowest/30 rounded group hover:border-primary/50 transition-colors">';
                                    html += '<div class="flex flex-col">';
                                    html += '<span class="text-secondary-fixed-dim font-code-md">' + node.name + '</span>';
                                    html += '<span class="text-label-sm font-code-md text-on-surface-variant/60 mt-1">' + node.server + ':' + node.port + '</span>';
                                    html += '</div>';
                                    html += '<div class="flex items-center gap-2">';
                                    html += '<span class="px-2 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary text-[10px] font-bold uppercase tracking-tighter">VLESS</span>';
                                    html += '<span class="px-2 py-0.5 rounded bg-' + transportColor + '/10 border border-' + transportColor + '/30 text-' + transportColor + ' text-[10px] font-bold uppercase tracking-tighter">' + transportLabel + '</span>';
                                    html += '</div></div>';
                                });
                                html += '</div>';
                            } else {
                                html += '<div class="text-center text-on-surface-variant text-sm py-4">暂无节点信息</div>';
                            }

                            // Original VLESS Links
                            if (config.vlessLinks) {
                                html += '<div class="mt-4 pt-4 border-t border-outline-variant/20">';
                                html += '<div class="flex justify-between items-center mb-2">';
                                html += '<span class="text-label-sm font-code-md text-outline uppercase tracking-widest">原始 VLESS 链接</span>';
                                html += '<button onclick="event.stopPropagation(); copyVlessLinks(\\'' + config.id + '\\')" class="text-primary hover:text-primary-fixed text-label-sm font-code-md flex items-center gap-1">';
                                html += '<span class="material-symbols-outlined text-[14px]">content_copy</span> 复制全部</button>';
                                html += '</div>';
                                html += '<div class="bg-surface-container-lowest/50 p-3 rounded border border-outline-variant/30 overflow-x-auto">';
                                html += '<code class="text-secondary-fixed-dim whitespace-nowrap text-code-md" id="vless-links-display-' + config.id + '">' + escapeHtml(config.vlessLinks) + '</code>';
                                html += '</div></div>';
                            }

                            // Subscription URL
                            html += '<div class="mt-4 pt-4 border-t border-outline-variant/20">';
                            html += '<div class="flex justify-between items-center mb-2">';
                            html += '<span class="text-label-sm font-code-md text-outline uppercase tracking-widest">订阅链接</span>';
                            html += '<button onclick="event.stopPropagation(); copyUrl(\\'' + subUrl + '\\')" class="text-primary hover:text-primary-fixed text-label-sm font-code-md flex items-center gap-1">';
                            html += '<span class="material-symbols-outlined text-[14px]">content_copy</span> 复制</button>';
                            html += '</div>';
                            html += '<div class="bg-surface-container-lowest/50 p-3 rounded border border-outline-variant/30 overflow-x-auto">';
                            html += '<code class="text-secondary-fixed-dim whitespace-nowrap text-code-md">' + subUrl + '</code>';
                            html += '</div></div>';

                            html += '</div>';
                        }

                        html += '</div>';
                        return html;
                    }).join('');
                }

                function escapeHtml(str) {
                    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
                }

                function toggleExpand(id) {
                    expandedId = expandedId === id ? null : id;
                    renderSubscriptions(allConfigs);
                }

                function copyUrl(url) {
                    navigator.clipboard.writeText(url);
                    showToast('已复制到剪贴板');
                }

                function copyVlessLinks(configId) {
                    const el = document.getElementById('vless-links-display-' + configId);
                    if (el) {
                        navigator.clipboard.writeText(el.textContent);
                        showToast('VLESS 链接已复制');
                    }
                }

                async function deleteConfig(id) {
                    if (!confirm('确定要删除此订阅吗？')) return;
                    try {
                        const res = await fetch('/api/subscriptions/' + id, {
                            method: 'DELETE',
                            headers: { 'Authorization': 'Bearer ' + getToken() }
                        });
                        if (!res.ok) throw new Error(await res.text());
                        if (expandedId === id) expandedId = null;
                        loadSubscriptions();
                    } catch (error) {
                        alert('删除失败: ' + error.message);
                    }
                }

                function showToast(msg) {
                    const toast = document.createElement('div');
                    toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 bg-primary text-on-primary px-4 py-2 rounded-lg text-sm font-code-md z-[100] shadow-lg';
                    toast.textContent = msg;
                    document.body.appendChild(toast);
                    setTimeout(() => toast.remove(), 2000);
                }

                // Search filter
                document.getElementById('search-input').addEventListener('input', function(e) {
                    const q = e.target.value.toLowerCase();
                    if (!q) {
                        renderSubscriptions(allConfigs);
                        return;
                    }
                    const filtered = allConfigs.filter(c => {
                        const name = (c.name || c.id).toLowerCase();
                        const nodes = c.nodes || [];
                        const nodeMatch = nodes.some(n => n.name.toLowerCase().includes(q) || n.server.toLowerCase().includes(q));
                        return name.includes(q) || nodeMatch;
                    });
                    renderSubscriptions(filtered);
                });

                loadSubscriptions();
            ` }} />
        </fragment>
    );
};

export default SubscriptionsPage;
