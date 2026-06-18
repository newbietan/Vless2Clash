/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import { APP_NAME } from '../constants.js';

export const Layout = ({ title, children, activePage }) => {
    const tailwindConfig = `
        tailwind.config = {
            darkMode: "class",
            theme: {
                extend: {
                    "colors": {
                        "primary": "#005ac2",
                        "primary-container": "#d8e2ff",
                        "on-primary": "#ffffff",
                        "on-primary-container": "#001a42",
                        "secondary": "#545e78",
                        "secondary-container": "#d8e2ff",
                        "on-secondary": "#ffffff",
                        "on-secondary-container": "#101b33",
                        "surface": "#ffffff",
                        "surface-container": "#ece6f0",
                        "surface-container-low": "#f3edf7",
                        "surface-container-high": "#e6e0ec",
                        "surface-container-highest": "#e0d9e6",
                        "surface-dim": "#d8d1de",
                        "on-surface": "#191c20",
                        "on-surface-variant": "#44474f",
                        "outline": "#74777f",
                        "outline-variant": "#c4c6cf",
                        "background": "#f8f9ff",
                        "on-background": "#191c20",
                        "error": "#ba1a1a",
                        "error-container": "#ffdad6",
                        "on-error": "#ffffff",
                        "on-error-container": "#410002",
                        "tertiary": "#6e5676",
                        "tertiary-container": "#f7d8ff",
                        "on-tertiary": "#ffffff",
                        "on-tertiary-container": "#27132f",
                        "terminal-bg": "#0f0f1a",
                        "terminal-header": "#1e1e2e",
                        "terminal-border": "#313244"
                    },
                    "borderRadius": {
                        "DEFAULT": "0.25rem",
                        "lg": "0.5rem",
                        "xl": "0.75rem",
                        "2xl": "1rem",
                        "full": "9999px"
                    },
                    "spacing": {
                        "unit": "4px",
                        "xs": "4px",
                        "container-max": "1280px",
                        "gutter": "20px",
                        "md": "16px",
                        "xl": "48px",
                        "sm": "8px",
                        "lg": "24px"
                    },
                    "fontFamily": {
                        "headline-lg": ["Geist"],
                        "headline-lg-mobile": ["Geist"],
                        "code-md": ["JetBrains Mono"],
                        "label-caps": ["JetBrains Mono"],
                        "body-md": ["Inter"],
                        "body-sm": ["Inter"],
                        "headline-md": ["Geist"]
                    },
                    "fontSize": {
                        "headline-lg": ["32px", {"lineHeight": "1.2", "letterSpacing": "-0.02em", "fontWeight": "600"}],
                        "headline-lg-mobile": ["24px", {"lineHeight": "1.2", "fontWeight": "600"}],
                        "code-md": ["14px", {"lineHeight": "1.5", "fontWeight": "400"}],
                        "label-caps": ["12px", {"lineHeight": "1.0", "letterSpacing": "0.05em", "fontWeight": "600"}],
                        "body-md": ["16px", {"lineHeight": "1.6", "fontWeight": "400"}],
                        "body-sm": ["14px", {"lineHeight": "1.5", "fontWeight": "400"}],
                        "headline-md": ["20px", {"lineHeight": "1.4", "fontWeight": "500"}]
                    }
                }
            }
        }
    `;

    const styles = `
        .primary-glow {
            box-shadow: 0px 0px 12px rgba(0, 90, 194, 0.15);
        }
        .primary-glow-hover:hover {
            box-shadow: 0px 0px 16px rgba(0, 90, 194, 0.25);
        }
        .card-surface {
            background-color: #ffffff;
            border: 1px solid #c4c6cf;
            box-shadow: 0px 1px 3px rgba(0, 0, 0, 0.08);
        }
        .input-focus-glow:focus {
            outline: none;
            border-color: #005ac2;
            box-shadow: 0 0 0 2px rgba(0, 90, 194, 0.15);
        }
        .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
            height: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
            background: #f3edf7;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #c4c6cf;
            border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #74777f;
        }
        .material-symbols-outlined {
            font-variation-settings: 'FILL' 0, 'wght' 400, 'GRAD' 0, 'opsz' 24;
        }
        .material-symbols-outlined.fill {
            font-variation-settings: 'FILL' 1;
        }
        .terminal-window {
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25), 
                        0 0 0 1px rgba(0, 0, 0, 0.05),
                        inset 0 1px 0 rgba(255, 255, 255, 0.1);
        }
        .terminal-dot {
            width: 12px;
            height: 12px;
            border-radius: 50%;
        }
        .terminal-dot-red { background-color: #ff5f57; }
        .terminal-dot-yellow { background-color: #febc2e; }
        .terminal-dot-green { background-color: #28c840; }
    `;

    return (
        <html lang="zh-CN">
            <head>
                <meta charset="utf-8" />
                <meta content="width=device-width, initial-scale=1.0" name="viewport" />
                <title>{title} - {APP_NAME}</title>
                <link rel="icon" type="image/x-icon" href="/favicon.ico" />
                <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
                <script id="tailwind-config" dangerouslySetInnerHTML={{ __html: tailwindConfig }} />
                <style dangerouslySetInnerHTML={{ __html: styles }} />
            </head>
            <body class="bg-terminal-bg min-h-screen flex items-center justify-center p-3 md:p-6 antialiased">
                {/* Terminal Window */}
                <div class="terminal-window w-full max-w-6xl h-[calc(100vh-24px)] md:h-[calc(100vh-48px)] rounded-xl md:rounded-2xl overflow-hidden flex flex-col bg-surface">
                    {/* Terminal Header */}
                    <div class="bg-terminal-header px-4 py-3 flex items-center justify-between border-b border-terminal-border">
                        <div class="flex items-center gap-2">
                            <div class="terminal-dot terminal-dot-red"></div>
                            <div class="terminal-dot terminal-dot-yellow"></div>
                            <div class="terminal-dot terminal-dot-green"></div>
                        </div>
                        <div class="text-gray-400 text-sm font-mono">{APP_NAME} - {title}</div>
                        <div class="w-16"></div>
                    </div>

                    {/* Navbar */}
                    <Navbar activePage={activePage} />

                    {/* Content Area */}
                    <main class="flex-grow overflow-y-auto custom-scrollbar p-6">
                        {children}
                    </main>

                    {/* Footer */}
                    <Footer />
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

                    if (mobileMenuBtn) {
                        mobileMenuBtn.addEventListener('click', toggleMenu);
                    }
                    if (mobileOverlay) {
                        mobileOverlay.addEventListener('click', toggleMenu);
                    }

                    // Logout button
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

const Navbar = ({ activePage }) => {
    const pages = [
        { name: '仪表盘', href: '/', icon: 'dashboard' },
        { name: '订阅管理', href: '/subscriptions', icon: 'subscriptions' },
    ];

    return (
        <nav class="bg-surface border-b border-outline-variant px-6 py-3">
            <div class="flex justify-between items-center">
                <div class="flex items-center gap-6">
                    <div class="font-headline-md text-headline-md font-bold text-primary flex items-center gap-2">
                        <span class="material-symbols-outlined text-[24px]">terminal</span>
                        {APP_NAME}
                    </div>
                    <div class="hidden md:flex items-center gap-1">
                        {pages.map(page => (
                            <a
                                key={page.name}
                                class={`text-sm transition-colors px-3 py-1.5 rounded-md ${
                                    activePage === page.name
                                        ? 'text-primary bg-primary-container/50 font-medium'
                                        : 'text-on-surface-variant hover:text-primary hover:bg-surface-container-high'
                                }`}
                                href={page.href}
                            >
                                {page.name}
                            </a>
                        ))}
                    </div>
                </div>
                <div class="flex items-center gap-2">
                    <button id="logout-btn" class="text-on-surface-variant hover:text-error transition-colors p-1.5 rounded-md hover:bg-error-container/30 text-sm flex items-center gap-1" title="退出登录">
                        <span class="material-symbols-outlined text-[18px]">logout</span>
                        <span class="hidden md:inline text-xs">退出</span>
                    </button>
                </div>
            </div>

            {/* Mobile Menu */}
            <div class="md:hidden mt-2">
                <button class="text-primary p-1" id="mobile-menu-btn">
                    <span class="material-symbols-outlined">menu</span>
                </button>
                <nav class="h-screen w-64 fixed left-0 top-0 bg-white border-r border-outline-variant transform -translate-x-full transition-transform duration-300 z-50 flex flex-col py-4 gap-2" id="mobile-nav">
                    <div class="px-4 pb-4 mb-4 border-b border-outline-variant">
                        <div class="font-bold text-primary flex items-center gap-2">
                            <span class="material-symbols-outlined">terminal</span>
                            {APP_NAME}
                        </div>
                    </div>
                    {pages.map(page => (
                        <a
                            key={page.name}
                            class={`mx-2 px-4 py-2 rounded-lg flex items-center gap-2 ${
                                activePage === page.name
                                    ? 'bg-primary-container text-primary font-medium'
                                    : 'text-on-surface-variant hover:bg-surface-container-high'
                            }`}
                            href={page.href}
                        >
                            <span class="material-symbols-outlined text-[20px]">{page.icon}</span>
                            {page.name}
                        </a>
                    ))}
                    <div class="mt-auto px-4 pb-4">
                        <button onclick="localStorage.removeItem('auth_token'); document.cookie='auth_token=; path=/; max-age=0'; window.location.href='/login';" class="w-full bg-error-container text-error py-2 rounded-lg text-sm flex items-center justify-center gap-2">
                            <span class="material-symbols-outlined text-[18px]">logout</span>
                            退出登录
                        </button>
                    </div>
                </nav>
                <div class="fixed inset-0 bg-black/50 z-40 hidden" id="mobile-overlay"></div>
            </div>
        </nav>
    );
};

const Footer = () => {
    return (
        <footer class="bg-surface border-t border-outline-variant px-6 py-2 flex justify-between items-center text-xs text-on-surface-variant">
            <div class="flex items-center gap-2">
                <span class="w-2 h-2 rounded-full bg-green-500"></span>
                <span>运行中</span>
            </div>
            <div class="font-mono">Refactored from <a class="text-primary hover:underline" href="https://github.com/7Sageer/sublink-worker" target="_blank" rel="noopener noreferrer">Sublink Worker</a></div>
            <a class="hover:text-primary transition-colors" href="https://github.com/newbietan/sublink-worker" target="_blank" rel="noopener noreferrer">
                GitHub
            </a>
        </footer>
    );
};

export default Layout;