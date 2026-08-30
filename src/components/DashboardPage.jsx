/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */

export const DashboardPage = () => {
    return (
        <fragment>
            {/* Header */}
            <div class="mb-8 border-b border-surface-variant pb-4">
                <h1 class="text-headline-lg font-headline-lg text-on-surface tracking-tight mb-1">
                    仪表盘
                </h1>
                <p class="text-body-md font-code-md text-on-surface-variant">
                    &gt; 聚合、过滤并转换多个 vless:// URI 为统一的 Clash
                    订阅配置。
                </p>
            </div>

            {/* Converter Tool */}
            <div class="max-w-4xl mx-auto w-full flex flex-col gap-gutter">
                {/* Input Card */}
                <div class="tech-card rounded-lg p-window-padding flex flex-col gap-3">
                    <div class="flex justify-between items-center mb-2">
                        <label
                            class="text-label-sm font-code-md text-on-surface-variant uppercase tracking-widest flex items-center gap-2"
                            for="vless-input"
                        >
                            <span class="material-symbols-outlined text-[16px]">
                                input
                            </span>
                            输入 VLESS 链接
                        </label>
                        <div class="flex items-center gap-4">
                            <span
                                class="text-code-md font-code-md text-on-surface-variant"
                                id="node-count-label"
                            >
                                0 个节点
                            </span>
                            <label class="flex items-center gap-2 cursor-pointer">
                                <div class="relative flex items-center">
                                    <input
                                        type="checkbox"
                                        class="peer sr-only"
                                        checked
                                        id="opt-dedup"
                                    />
                                    <div class="w-9 h-5 bg-surface-container-high rounded-full border border-outline-variant peer-checked:bg-primary peer-checked:border-primary transition-colors"></div>
                                    <div class="absolute left-0.5 w-4 h-4 bg-surface-container-lowest rounded-full peer-checked:translate-x-4 transition-transform duration-200"></div>
                                </div>
                                <span class="text-code-md font-code-md text-on-surface-variant">
                                    去重
                                </span>
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
                <div
                    id="preview-panel"
                    class="tech-card rounded-lg p-window-padding flex-col gap-3 hidden"
                >
                    <div class="flex justify-between items-center mb-3">
                        <span class="text-label-sm font-code-md text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                            <span class="material-symbols-outlined text-[16px]">
                                dns
                            </span>
                            节点预览
                        </span>
                        <div class="flex items-center gap-2">
                            <input
                                type="text"
                                id="node-search"
                                class="bg-surface-container-lowest border border-outline-variant rounded px-2 py-1 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary w-40"
                                placeholder="搜索节点..."
                            />
                            <button
                                id="select-all-btn"
                                class="text-label-sm font-code-md text-primary hover:text-primary/80 transition-colors px-2 py-1"
                            >
                                全选
                            </button>
                            <button
                                id="delete-selected-btn"
                                class="text-label-sm font-code-md text-error hover:text-error/80 transition-colors px-2 py-1 hidden"
                            >
                                删除选中
                            </button>
                        </div>
                    </div>
                    <div
                        id="node-list"
                        class="flex flex-col gap-2 max-h-96 overflow-y-auto"
                    ></div>
                </div>

                {/* Node Editor (hidden by default) */}
                <div
                    id="node-editor"
                    class="tech-card rounded-lg p-window-padding hidden"
                >
                    <div class="flex justify-between items-center mb-4">
                        <span class="text-label-sm font-code-md text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                            <span class="material-symbols-outlined text-[16px]">
                                edit
                            </span>
                            编辑节点
                        </span>
                        <button
                            id="editor-close-btn"
                            class="text-on-surface-variant hover:text-on-surface transition-colors"
                        >
                            <span class="material-symbols-outlined text-[20px]">
                                close
                            </span>
                        </button>
                    </div>
                    <div
                        id="editor-form"
                        class="grid grid-cols-1 sm:grid-cols-2 gap-3"
                    ></div>
                    <div class="flex justify-end gap-3 mt-4">
                        <button
                            id="editor-cancel-btn"
                            class="border border-outline-variant bg-surface-container text-on-surface-variant px-4 py-2 rounded font-code-md text-code-md hover:bg-surface-container-high transition-colors"
                        >
                            取消
                        </button>
                        <button
                            id="editor-save-btn"
                            class="bg-primary text-on-primary px-4 py-2 rounded font-code-md text-code-md hover:bg-primary/90 transition-colors"
                        >
                            保存
                        </button>
                    </div>
                </div>

                {/* Action Buttons */}
                <div class="flex gap-3">
                    <button
                        id="convert-btn"
                        class="flex-1 bg-primary text-on-primary py-3 rounded-lg font-code-md text-label-sm uppercase tracking-wider font-bold shadow-sm hover:bg-primary/90 active:scale-[0.99] transition-all flex justify-center items-center gap-2"
                    >
                        <span class="material-symbols-outlined text-[20px]">
                            transform
                        </span>
                        转换为 Clash 配置
                    </button>
                    <button
                        id="update-btn"
                        class="hidden bg-secondary text-on-secondary py-3 px-6 rounded-lg font-code-md text-label-sm uppercase tracking-wider font-bold shadow-sm hover:bg-secondary/90 active:scale-[0.99] transition-all flex justify-center items-center gap-2"
                    >
                        <span class="material-symbols-outlined text-[20px]">
                            save
                        </span>
                        更新订阅
                    </button>
                </div>

                {/* Output Card */}
                <div class="tech-card rounded-lg p-window-padding flex flex-col relative overflow-hidden">
                    <div class="absolute -top-20 -right-20 w-40 h-40 bg-primary/5 rounded-full blur-3xl pointer-events-none"></div>
                    <div class="flex justify-between items-center mb-4 z-10">
                        <div class="text-label-sm font-code-md text-on-surface-variant uppercase tracking-widest flex items-center gap-2">
                            <span class="material-symbols-outlined text-[16px]">
                                terminal
                            </span>
                            输出
                        </div>
                        <div class="flex items-center gap-2">
                            <span
                                class="w-2 h-2 rounded-full bg-outline-variant"
                                id="status-dot"
                            ></span>
                            <span
                                class="text-code-md font-code-md text-on-surface-variant"
                                id="status-text"
                            >
                                就绪
                            </span>
                        </div>
                    </div>
                    <div class="bg-surface-container-lowest border border-outline-variant/30 rounded p-3 mb-4 z-10">
                        <pre
                            class="font-code-md text-code-md text-on-surface-variant overflow-x-auto custom-scrollbar whitespace-pre-wrap break-all h-32"
                            id="output-pre"
                        >
                            // 生成的配置将在此显示... // 等待输入。
                        </pre>
                    </div>
                    <button
                        id="copy-btn"
                        class="w-full border border-outline-variant bg-surface-container text-primary py-2.5 rounded-lg font-code-md text-code-md hover:bg-primary-container/20 transition-colors flex justify-center items-center gap-2 z-10 disabled:opacity-50 disabled:cursor-not-allowed"
                        disabled
                    >
                        <span class="material-symbols-outlined text-[18px]">
                            content_copy
                        </span>
                        复制订阅链接
                    </button>
                </div>
            </div>

            <script src="/dashboard.js" defer></script>
        </fragment>
    );
};

export default DashboardPage;
