/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import { APP_NAME, GITHUB_REPO } from '../constants.js';

export const Layout = ({ title, children, activePage }) => {
    const tailwindConfig = `
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "on-primary-fixed-variant": "#004395",
                        "surface-variant": "#353535",
                        "on-secondary-fixed-variant": "#005236",
                        "background": "#131313",
                        "tertiary": "#ffb95f",
                        "secondary-container": "#00a572",
                        "on-secondary-container": "#00311f",
                        "primary-fixed": "#d8e2ff",
                        "on-surface-variant": "#c2c6d6",
                        "error-container": "#93000a",
                        "surface-container-low": "#1c1b1b",
                        "surface-dim": "#131313",
                        "on-primary": "#002e6a",
                        "surface-container-highest": "#353535",
                        "secondary-fixed-dim": "#4edea3",
                        "outline-variant": "#424754",
                        "on-primary-container": "#00285d",
                        "on-background": "#e5e2e1",
                        "tertiary-container": "#ca8100",
                        "outline": "#8c909f",
                        "surface-container": "#20201f",
                        "inverse-primary": "#005ac2",
                        "inverse-on-surface": "#313030",
                        "on-error-container": "#ffdad6",
                        "primary-fixed-dim": "#adc6ff",
                        "on-primary-fixed": "#001a42",
                        "surface": "#131313",
                        "tertiary-fixed-dim": "#ffb95f",
                        "error": "#ffb4ab",
                        "on-tertiary-container": "#3e2400",
                        "tertiary-fixed": "#ffddb8",
                        "surface-bright": "#393939",
                        "on-surface": "#e5e2e1",
                        "on-tertiary-fixed": "#2a1700",
                        "on-secondary-fixed": "#002113",
                        "surface-tint": "#adc6ff",
                        "secondary-fixed": "#6ffbbe",
                        "surface-container-lowest": "#0e0e0e",
                        "secondary": "#4edea3",
                        "on-secondary": "#003824",
                        "primary-container": "#4d8eff",
                        "inverse-surface": "#e5e2e1",
                        "on-error": "#690005",
                        "on-tertiary": "#472a00",
                        "on-tertiary-fixed-variant": "#653e00",
                        "primary": "#adc6ff",
                        "surface-container-high": "#2a2a2a"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "margin-desktop": "32px",
                        "gutter": "16px",
                        "window-padding": "20px",
                        "unit": "4px",
                        "margin-mobile": "16px"
                    },
                    "fontFamily": {
                        "headline-lg": ["Geist"],
                        "code-lg": ["JetBrains Mono"],
                        "body-lg": ["Geist"],
                        "code-md": ["JetBrains Mono"],
                        "headline-md": ["Geist"],
                        "label-sm": ["JetBrains Mono"],
                        "body-md": ["Geist"]
                    },
                    "fontSize": {
                        "headline-lg": ["32px", { "lineHeight": "40px", "letterSpacing": "-0.02em", "fontWeight": "700" }],
                        "code-lg": ["16px", { "lineHeight": "24px", "fontWeight": "500" }],
                        "body-lg": ["16px", { "lineHeight": "24px", "fontWeight": "400" }],
                        "code-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }],
                        "headline-md": ["24px", { "lineHeight": "32px", "letterSpacing": "-0.01em", "fontWeight": "600" }],
                        "label-sm": ["12px", { "lineHeight": "16px", "fontWeight": "700" }],
                        "body-md": ["14px", { "lineHeight": "20px", "fontWeight": "400" }]
                    }
                }
            }
        }
    `;

    const styles = `
        body {
            background-color: #0A0A0A;
        }
        .terminal-window {
            background-color: #1A1A1A;
            border: 1px solid #333333;
            box-shadow: 0 0 40px 0 rgba(173, 198, 255, 0.1);
        }
        .tech-card {
            background-color: #222222;
            border: 1px solid #444444;
            transition: border-color 0.2s ease;
        }
        .tech-card:hover {
            border-color: #adc6ff;
        }
        .glass-status {
            background-color: rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(12px);
        }
        ::-webkit-scrollbar {
            width: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #131313;
        }
        ::-webkit-scrollbar-thumb {
            background: #353535;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #424754;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
    `;

    const pages = [
        { name: '仪表盘', href: '/', icon: 'dashboard' },
        { name: '订阅管理', href: '/subscriptions', icon: 'subscriptions' },
    ];

    return (
        <html class="dark" lang="zh-CN">
            <head>
                <meta charset="utf-8" />
                <meta content="width=device-width, initial-scale=1.0" name="viewport" />
                <title>{activePage} | {APP_NAME}</title>
                <link rel="icon" type="image/x-icon" href="/favicon.ico" />
                <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
                <script id="tailwind-config" dangerouslySetInnerHTML={{ __html: tailwindConfig }} />
                <style dangerouslySetInnerHTML={{ __html: styles }} />
            </head>
            <body class="text-on-surface h-screen flex flex-col font-body-md text-body-md overflow-hidden relative selection:bg-primary-container selection:text-on-primary-container">
                {/* Atmospheric background */}
                <div class="absolute inset-0 z-[-1] pointer-events-none overflow-hidden">
                    <div class="absolute top-1/4 -left-1/4 w-[50vw] h-[50vw] bg-primary/5 rounded-full blur-[120px]"></div>
                    <div class="absolute bottom-1/4 -right-1/4 w-[60vw] h-[60vw] bg-secondary/5 rounded-full blur-[150px]"></div>
                </div>

                <div class="flex-1 flex p-margin-mobile md:p-margin-desktop h-full w-full max-w-7xl mx-auto z-10">
                    {/* Terminal Window */}
                    <div class="terminal-window flex-1 flex flex-col rounded-xl overflow-hidden shadow-sm relative h-full w-full">
                        {/* TopAppBar */}
                        <header class="bg-surface-container-low border-b border-outline-variant shadow-sm flex justify-between items-center w-full px-window-padding h-12 flex-shrink-0 z-20">
                            <div class="flex items-center gap-2 mr-4">
                                <div class="w-3 h-3 rounded-full bg-[#ff5f56] shadow-[0_0_4px_rgba(255,95,86,0.4)] cursor-pointer hover:opacity-80 transition-opacity" title="Close"></div>
                                <div class="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-[0_0_4px_rgba(255,189,46,0.4)] cursor-pointer hover:opacity-80 transition-opacity"></div>
                                <div class="w-3 h-3 rounded-full bg-[#27c93f] shadow-[0_0_4px_rgba(39,201,63,0.4)] cursor-pointer hover:opacity-80 transition-opacity"></div>
                            </div>
                            <div class="flex-1 text-center">
                                <span class="text-body-md font-code-md font-bold text-on-surface">终端 — root@vless2clash</span>
                            </div>
                            <div class="flex items-center gap-3 text-on-surface-variant">
                                <button id="mobile-menu-btn" aria-label="Menu" class="md:hidden hover:bg-surface-variant/20 transition-colors p-1 rounded">
                                    <span class="material-symbols-outlined text-[20px]">menu</span>
                                </button>
                            </div>
                        </header>

                        <div class="flex flex-1 overflow-hidden relative">
                            {/* SideNavBar */}
                            <nav class="hidden md:flex flex-col bg-surface border-r border-outline-variant bg-surface/80 backdrop-blur-md shadow-lg h-full w-64 flex-shrink-0 z-10 py-margin-desktop space-y-2">
                                <div class="px-6 mb-8 flex flex-col gap-1 items-center">
                                    <div class="flex flex-col items-center justify-center w-full gap-2 mb-2">
                                        <h2 class="text-headline-lg font-headline-lg text-primary tracking-tight">{APP_NAME}</h2>
                                    </div>
                                </div>
                                <div class="flex-1 flex flex-col gap-1">
                                    {pages.map(page => (
                                        <a
                                            key={page.name}
                                            class={`flex items-center gap-3 px-4 py-2 mx-2 rounded-lg transition-all duration-200 ease-in-out group ${
                                                activePage === page.name
                                                    ? 'bg-primary-container text-on-primary-container'
                                                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                                            }`}
                                            href={page.href}
                                        >
                                            <span class={`material-symbols-outlined ${activePage === page.name ? 'opacity-100' : 'opacity-70 group-hover:opacity-100'}`}
                                                style={activePage === page.name ? { fontVariationSettings: '"FILL" 1' } : {}}>
                                                {page.icon}
                                            </span>
                                            <span class="text-label-sm font-code-md tracking-wider">{page.name}</span>
                                        </a>
                                    ))}
                                </div>
                                <div class="px-4 mt-auto">
                                    <button id="logout-btn" class="w-full flex items-center gap-3 text-on-surface-variant hover:text-error px-4 py-2 rounded-lg hover:bg-error-container/20 transition-all duration-200">
                                        <span class="material-symbols-outlined text-[20px]">logout</span>
                                        <span class="text-label-sm font-code-md tracking-wider">退出登录</span>
                                    </button>
                                </div>
                            </nav>

                            {/* Mobile Drawer */}
                            <div id="mobile-overlay" class="fixed inset-0 bg-black/50 z-40 hidden md:hidden"></div>
                            <nav id="mobile-nav" class="fixed left-0 top-0 h-full w-64 bg-surface border-r border-outline-variant transform -translate-x-full transition-transform duration-300 z-50 flex flex-col py-margin-desktop space-y-2 md:hidden">
                                <div class="px-6 mb-8 flex flex-col items-center">
                                    <h2 class="text-headline-lg font-headline-lg text-primary tracking-tight">{APP_NAME}</h2>
                                </div>
                                <div class="flex-1 flex flex-col gap-1">
                                    {pages.map(page => (
                                        <a
                                            key={page.name}
                                            class={`flex items-center gap-3 px-4 py-2 mx-2 rounded-lg transition-all duration-200 ease-in-out ${
                                                activePage === page.name
                                                    ? 'bg-primary-container text-on-primary-container'
                                                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest'
                                            }`}
                                            href={page.href}
                                        >
                                            <span class="material-symbols-outlined text-[20px]">{page.icon}</span>
                                            <span class="text-label-sm font-code-md tracking-wider">{page.name}</span>
                                        </a>
                                    ))}
                                </div>
                                <div class="px-4 mt-auto">
                                    <button onclick="localStorage.removeItem('auth_token'); document.cookie='auth_token=; path=/; max-age=0'; window.location.href='/login';" class="w-full flex items-center gap-3 text-on-surface-variant hover:text-error px-4 py-2 rounded-lg hover:bg-error-container/20 transition-all">
                                        <span class="material-symbols-outlined text-[20px]">logout</span>
                                        <span class="text-label-sm font-code-md tracking-wider">退出登录</span>
                                    </button>
                                </div>
                            </nav>

                            {/* Main Content Canvas */}
                            <main class="flex-1 overflow-y-auto p-window-padding md:p-margin-desktop bg-surface-dim relative z-0">
                                {children}
                                <div class="h-16"></div>
                            </main>
                        </div>

                        {/* Footer Status Bar */}
                        <footer class="bg-surface-container-lowest/50 border-t border-outline-variant backdrop-blur-xl flex justify-between items-center w-full px-window-padding py-1 absolute bottom-0 z-50 glass-status">
                            <div class="flex items-center gap-4">
                                <span class="text-label-sm font-code-md text-on-surface-variant/60">系统状态: 运行良好</span>
                            </div>
                            <div class="flex gap-4">
                                <a class="text-label-sm font-code-md text-on-surface-variant/60 cursor-pointer opacity-80 hover:opacity-100 hover:text-secondary transition-opacity" href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">GitHub</a>
                            </div>
                        </footer>
                    </div>
                </div>

                <script dangerouslySetInnerHTML={{ __html: `
                    const mobileMenuBtn = document.getElementById('mobile-menu-btn');
                    const mobileNav = document.getElementById('mobile-nav');
                    const mobileOverlay = document.getElementById('mobile-overlay');

                    function toggleMenu() {
                        const isClosed = mobileNav.classList.contains('-translate-x-full');
                        if (isClosed) {
                            mobileNav.classList.remove('-translate-x-full');
                            mobileOverlay.classList.remove('hidden');
                        } else {
                            mobileNav.classList.add('-translate-x-full');
                            mobileOverlay.classList.add('hidden');
                        }
                    }

                    if (mobileMenuBtn) mobileMenuBtn.addEventListener('click', toggleMenu);
                    if (mobileOverlay) mobileOverlay.addEventListener('click', toggleMenu);

                    const logoutBtn = document.getElementById('logout-btn');
                    if (logoutBtn) {
                        logoutBtn.addEventListener('click', function() {
                            localStorage.removeItem('auth_token');
                            document.cookie = 'auth_token=; path=/; max-age=0';
                            window.location.href = '/login';
                        });
                    }
                ` }} />
            </body>
        </html>
    );
};

export default Layout;
