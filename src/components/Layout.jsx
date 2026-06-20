/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import { APP_NAME, GITHUB_REPO } from '../constants.js';

export const Layout = ({ title, children, activePage }) => {
    const tailwindConfig = `
        tailwind.config = {
            theme: {
                extend: {
                    "colors": {
                        "on-primary-fixed-variant": "#001d36",
                        "surface-variant": "#dfe2eb",
                        "on-secondary-fixed-variant": "#001e13",
                        "background": "#f8f9ff",
                        "tertiary": "#7c5800",
                        "secondary-container": "#9ef5c5",
                        "on-secondary-container": "#002114",
                        "primary-fixed": "#d8e2ff",
                        "on-surface-variant": "#44474f",
                        "error-container": "#ffdad6",
                        "surface-container-low": "#f3edf7",
                        "surface-dim": "#d8d1de",
                        "on-primary": "#ffffff",
                        "surface-container-highest": "#e0d9e6",
                        "secondary-fixed-dim": "#82d8ab",
                        "outline-variant": "#c4c6d0",
                        "on-primary-container": "#001a42",
                        "on-background": "#191c20",
                        "tertiary-container": "#ffdea6",
                        "outline": "#74777f",
                        "surface-container": "#ece6f0",
                        "inverse-primary": "#adc6ff",
                        "inverse-on-surface": "#2f3033",
                        "on-error-container": "#410002",
                        "primary-fixed-dim": "#adc6ff",
                        "on-primary-fixed": "#001a42",
                        "surface": "#f8f9ff",
                        "tertiary-fixed-dim": "#ddb255",
                        "error": "#ba1a1a",
                        "on-tertiary-container": "#271900",
                        "tertiary-fixed": "#ffdea6",
                        "surface-bright": "#f8f9ff",
                        "on-surface": "#191c20",
                        "on-tertiary-fixed": "#271900",
                        "on-secondary-fixed": "#002114",
                        "surface-tint": "#4d67b1",
                        "secondary-fixed": "#9ef5c5",
                        "surface-container-lowest": "#ffffff",
                        "secondary": "#006d3b",
                        "on-secondary": "#ffffff",
                        "primary-container": "#d8e2ff",
                        "inverse-surface": "#2f3033",
                        "on-error": "#ffffff",
                        "on-tertiary": "#ffffff",
                        "on-tertiary-fixed-variant": "#5c4200",
                        "primary": "#4d67b1",
                        "surface-container-high": "#e6e0ec"
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
            background-color: #f0f0f5;
        }
        .terminal-window {
            background-color: #ffffff;
            border: 1px solid #c4c6d0;
            box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.08);
        }
        .tech-card {
            background-color: #ffffff;
            border: 1px solid #c4c6d0;
            transition: border-color 0.2s ease, box-shadow 0.2s ease;
        }
        .tech-card:hover {
            border-color: #4d67b1;
            box-shadow: 0 2px 8px rgba(77, 103, 177, 0.1);
        }
        .glass-status {
            background-color: rgba(255, 255, 255, 0.8);
            backdrop-filter: blur(12px);
        }
        ::-webkit-scrollbar {
            width: 8px;
        }
        ::-webkit-scrollbar-track {
            background: #f3edf7;
        }
        ::-webkit-scrollbar-thumb {
            background: #c4c6d0;
            border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
            background: #74777f;
        }
        .traffic-close {
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background-color: #ff5f56;
            box-shadow: 0 0 4px rgba(255,95,86,0.4);
            cursor: pointer;
            position: relative;
            transition: transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.15s ease;
            display: flex;
            align-items: center;
            justify-content: center;
        }
        .traffic-close .close-icon {
            opacity: 0;
            transform: scale(0.5);
            transition: opacity 0.15s ease, transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
            color: rgba(0,0,0,0);
            font-size: 9px;
            font-weight: 700;
            line-height: 1;
            pointer-events: none;
            font-family: system-ui, sans-serif;
        }
        .traffic-close:hover {
            transform: scale(1.4);
            background-color: #ff5f56;
        }
        .traffic-close:hover .close-icon {
            opacity: 1;
            transform: scale(1);
            color: rgba(255,255,255,0.9);
        }
        .traffic-close:active {
            transform: scale(1.2);
        }
    `;

    const pages = [
        { name: '仪表盘', href: '/', icon: 'dashboard' },
        { name: '订阅管理', href: '/subscriptions', icon: 'subscriptions' },
    ];

    return (
        <html lang="zh-CN">
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
                <div class="flex-1 flex p-margin-mobile md:p-margin-desktop h-full w-full max-w-7xl mx-auto z-10">
                    {/* Terminal Window */}
                    <div class="terminal-window flex-1 flex flex-col rounded-xl overflow-hidden shadow-sm relative h-full w-full">
                        {/* TopAppBar */}
                        <header class="bg-surface-container-low border-b border-outline-variant flex justify-between items-center w-full px-window-padding h-12 flex-shrink-0 z-20">
                            <div class="flex items-center gap-2 mr-4">
                                <button class="traffic-close" id="logout-btn" title="退出登录">
                                    <span class="close-icon">✕</span>
                                </button>
                                <div class="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-[0_0_4px_rgba(255,189,46,0.4)]"></div>
                                <div class="w-3 h-3 rounded-full bg-[#27c93f] shadow-[0_0_4px_rgba(39,201,63,0.4)]"></div>
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
                            <nav class="hidden md:flex flex-col bg-surface border-r border-outline-variant backdrop-blur-md h-full w-64 flex-shrink-0 z-10 py-margin-desktop space-y-2">
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
                            </nav>

                            {/* Mobile Drawer */}
                            <div id="mobile-overlay" class="fixed inset-0 bg-black/30 z-40 hidden md:hidden"></div>
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
                            </nav>

                            {/* Main Content Canvas */}
                            <main class="flex-1 overflow-y-auto p-window-padding md:p-margin-desktop bg-surface-dim relative z-0">
                                {children}
                                <div class="h-16"></div>
                            </main>
                        </div>

                        {/* Footer Status Bar */}
                        <footer class="bg-surface-container-lowest/80 border-t border-outline-variant backdrop-blur-xl flex justify-between items-center w-full px-window-padding py-1 absolute bottom-0 z-50 glass-status">
                            <div class="flex items-center gap-4">
                                <span class="text-label-sm font-code-md text-on-surface-variant/60">系统状态: 运行良好</span>
                            </div>
                            <div class="flex gap-4">
                                <a class="text-label-sm font-code-md text-on-surface-variant/60 cursor-pointer opacity-80 hover:opacity-100 hover:text-primary transition-opacity" href={GITHUB_REPO} target="_blank" rel="noopener noreferrer">GitHub</a>
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
