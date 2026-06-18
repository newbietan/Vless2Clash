/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */

export const SubscriptionsPage = () => {
    return (
        <fragment>
            {/* Header Section */}
            <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8">
                <div>
                    <h1 class="text-2xl font-bold text-on-surface mb-1">订阅管理</h1>
                    <p class="text-on-surface-variant text-sm">管理您的 VLESS 订阅配置和节点信息。</p>
                </div>
                <a href="/" class="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-lg transition-all text-sm flex items-center gap-2">
                    <span class="material-symbols-outlined text-[18px]">add</span>
                    新建订阅
                </a>
            </div>

            {/* Stats Cards */}
            <div class="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                <div class="card-surface rounded-lg p-4">
                    <div class="flex items-center gap-2 text-on-surface-variant mb-2">
                        <span class="material-symbols-outlined text-[20px]">folder</span>
                        <span class="text-xs uppercase tracking-wide">总订阅数</span>
                    </div>
                    <div class="text-3xl font-bold text-primary" id="stat-total">-</div>
                </div>
                <div class="card-surface rounded-lg p-4">
                    <div class="flex items-center gap-2 text-on-surface-variant mb-2">
                        <span class="material-symbols-outlined text-[20px]">dns</span>
                        <span class="text-xs uppercase tracking-wide">总节点数</span>
                    </div>
                    <div class="text-3xl font-bold text-green-600" id="stat-nodes">-</div>
                </div>
                <div class="card-surface rounded-lg p-4">
                    <div class="flex items-center gap-2 text-on-surface-variant mb-2">
                        <span class="material-symbols-outlined text-[20px]">schedule</span>
                        <span class="text-xs uppercase tracking-wide">最近更新</span>
                    </div>
                    <div class="text-lg font-medium text-on-surface" id="stat-recent">-</div>
                </div>
            </div>

            {/* Subscriptions List */}
            <div class="space-y-4" id="subscriptions-list">
                <div class="card-surface rounded-lg p-8 text-center text-on-surface-variant">
                    <span class="material-symbols-outlined text-[48px] mb-2 block">hourglass_empty</span>
                    加载中...
                </div>
            </div>

            <script dangerouslySetInnerHTML={{ __html: `
                let expandedId = null;

                function getToken() {
                    return localStorage.getItem('auth_token') || '';
                }

                async function loadSubscriptions() {
                    try {
                        const res = await fetch('/api/subscriptions', {
                            headers: { 'Authorization': 'Bearer ' + getToken() }
                        });
                        
                        if (!res.ok) throw new Error('Failed to load');
                        
                        const configs = await res.json();
                        renderSubscriptions(configs);
                    } catch (error) {
                        document.getElementById('subscriptions-list').innerHTML = 
                            '<div class="card-surface rounded-lg p-8 text-center text-red-500">加载失败: ' + error.message + '</div>';
                    }
                }

                function renderSubscriptions(configs) {
                    const list = document.getElementById('subscriptions-list');
                    
                    // Update stats
                    document.getElementById('stat-total').textContent = configs.length;
                    const totalNodes = configs.reduce((sum, c) => sum + (c.nodeCount || 0), 0);
                    document.getElementById('stat-nodes').textContent = totalNodes;
                    
                    if (configs.length > 0) {
                        const recent = new Date(configs[0].createdAt);
                        document.getElementById('stat-recent').textContent = recent.toLocaleDateString('zh-CN');
                    }
                    
                    if (configs.length === 0) {
                        list.innerHTML = '<div class="card-surface rounded-lg p-8 text-center text-on-surface-variant">' +
                            '<span class="material-symbols-outlined text-[48px] mb-2 block">folder_open</span>' +
                            '<p class="mb-4">暂无订阅</p>' +
                            '<a href="/" class="text-primary hover:underline">前往仪表盘创建订阅</a>' +
                            '</div>';
                        return;
                    }
                    
                    list.innerHTML = configs.map(config => {
                        const date = new Date(config.createdAt).toLocaleString('zh-CN');
                        const subUrl = window.location.origin + '/sub?id=' + config.id;
                        const isExpanded = expandedId === config.id;
                        const nodes = config.nodes || [];
                        
                        let html = '<div class="card-surface rounded-lg overflow-hidden">';
                        
                        // Header row - clickable
                        html += '<div class="p-4 flex items-center justify-between cursor-pointer hover:bg-surface-container-low transition-colors" onclick="toggleExpand(\\'' + config.id + '\\')">';
                        html += '<div class="flex items-center gap-4 flex-1 min-w-0">';
                        html += '<div class="w-10 h-10 rounded-lg bg-primary-container flex items-center justify-center flex-shrink-0">';
                        html += '<span class="material-symbols-outlined text-primary">dns</span></div>';
                        html += '<div class="min-w-0">';
                        html += '<div class="font-medium text-on-surface truncate">' + (config.name || config.id) + '</div>';
                        html += '<div class="text-xs text-on-surface-variant">' + (config.nodeCount || 0) + ' 个节点 · ' + date + '</div>';
                        html += '</div></div>';
                        html += '<div class="flex items-center gap-2 flex-shrink-0">';
                        html += '<button onclick="event.stopPropagation(); copyUrl(\\'' + subUrl + '\\')" class="text-on-surface-variant hover:text-primary p-1.5 rounded hover:bg-primary-container/30" title="复制链接">';
                        html += '<span class="material-symbols-outlined text-[20px]">content_copy</span></button>';
                        html += '<button onclick="event.stopPropagation(); deleteConfig(\\'' + config.id + '\\')" class="text-on-surface-variant hover:text-red-600 p-1.5 rounded hover:bg-red-50" title="删除">';
                        html += '<span class="material-symbols-outlined text-[20px]">delete</span></button>';
                        html += '<span class="material-symbols-outlined text-on-surface-variant transition-transform ' + (isExpanded ? 'rotate-180' : '') + '">expand_more</span>';
                        html += '</div></div>';
                        
                        // Expanded content - nodes
                        if (isExpanded && nodes.length > 0) {
                            html += '<div class="border-t border-outline-variant bg-surface-container-low">';
                            html += '<div class="p-4">';
                            html += '<div class="text-xs text-on-surface-variant uppercase tracking-wide mb-3">节点列表</div>';
                            html += '<div class="space-y-2">';
                            
                            const regionFlags = { US: '🇺🇸', JP: '🇯🇵', HK: '🇭🇰', SG: '🇸🇬', TW: '🇹🇼', KR: '🇰🇷', DE: '🇩🇪', GB: '🇬🇧', OTHER: '🌐' };
                            
                            nodes.forEach(node => {
                                const flag = regionFlags[node.region] || '🌐';
                                const secBadge = (node.security === 'tls' || node.security === 'reality') 
                                    ? '<span class="bg-green-100 text-green-700 px-1.5 py-0.5 rounded text-[10px]">' + node.security.toUpperCase() + '</span>'
                                    : '<span class="bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded text-[10px]">无</span>';
                                
                                html += '<div class="flex items-center gap-3 bg-white rounded-lg px-3 py-2">';
                                html += '<span class="text-lg">' + flag + '</span>';
                                html += '<div class="flex-1 min-w-0">';
                                html += '<div class="text-sm font-medium text-on-surface truncate">' + node.name + '</div>';
                                html += '<div class="text-xs text-on-surface-variant font-mono">' + node.server + ':' + node.port + '</div>';
                                html += '</div>';
                                html += '<div class="flex items-center gap-2">';
                                html += '<span class="text-xs text-on-surface-variant">' + (node.transport || 'tcp') + '</span>';
                                html += secBadge;
                                html += '</div></div>';
                            });
                            
                            html += '</div></div>';
                            
                            // Subscription URL
                            html += '<div class="px-4 pb-4">';
                            html += '<div class="text-xs text-on-surface-variant uppercase tracking-wide mb-2">订阅链接</div>';
                            html += '<div class="flex gap-2">';
                            html += '<input type="text" readonly value="' + subUrl + '" class="flex-1 bg-white border border-outline-variant rounded px-3 py-1.5 text-xs font-mono text-on-surface-variant truncate">';
                            html += '<button onclick="copyUrl(\\'' + subUrl + '\\')" class="bg-primary text-white px-3 py-1.5 rounded text-xs hover:bg-primary/90">复制</button>';
                            html += '</div></div>';
                            
                            html += '</div>';
                        } else if (isExpanded && nodes.length === 0) {
                            html += '<div class="border-t border-outline-variant bg-surface-container-low p-4 text-center text-on-surface-variant text-sm">';
                            html += '暂无节点信息</div>';
                        }
                        
                        html += '</div>';
                        return html;
                    }).join('');
                }

                function toggleExpand(id) {
                    expandedId = expandedId === id ? null : id;
                    loadSubscriptions();
                }

                function copyUrl(url) {
                    navigator.clipboard.writeText(url);
                    alert('已复制到剪贴板');
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

                loadSubscriptions();
            ` }} />
        </fragment>
    );
};

export default SubscriptionsPage;