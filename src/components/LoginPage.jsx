/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import { APP_NAME } from '../constants.js';

export const LoginPage = ({ turnstileSitekey }) => {
    const hasTurnstile = !!turnstileSitekey;

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
            background-image: radial-gradient(circle at 50% 50%, rgba(200, 200, 220, 0.3) 0%, rgba(240, 240, 245, 1) 100%);
        }
        .terminal-window {
            box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
        }
        .glow-btn {
            box-shadow: 0 2px 8px rgba(77, 103, 177, 0.3);
        }
        .glow-btn:hover {
            box-shadow: 0 4px 16px rgba(77, 103, 177, 0.4);
        }
    `;

    return (
        <html lang="zh-CN">
            <head>
                <meta charset="utf-8" />
                <meta content="width=device-width, initial-scale=1.0" name="viewport" />
                <title>管理员登录 - {APP_NAME}</title>
                <link rel="icon" type="image/x-icon" href="/favicon.ico" />
                <script src="https://cdn.tailwindcss.com?plugins=forms,container-queries"></script>
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
                {hasTurnstile && <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>}
                <script id="tailwind-config" dangerouslySetInnerHTML={{ __html: tailwindConfig }} />
                <style dangerouslySetInnerHTML={{ __html: styles }} />
            </head>
            <body class="min-h-screen flex items-center justify-center p-4 text-on-surface font-body-md">
                <div class="terminal-window w-full max-w-md bg-white border border-outline-variant rounded-xl overflow-hidden relative z-10 flex flex-col">
                    {/* TopAppBar */}
                    <div class="flex justify-between items-center w-full px-window-padding h-12 bg-surface-container-low border-b border-outline-variant">
                        <div class="flex space-x-2">
                            <div class="w-3 h-3 rounded-full bg-red-500 border border-red-600"></div>
                            <div class="w-3 h-3 rounded-full bg-yellow-500 border border-yellow-600"></div>
                            <div class="w-3 h-3 rounded-full bg-green-500 border border-green-600"></div>
                        </div>
                        <div class="text-body-md font-code-md font-bold text-on-surface">
                            管理员登录 - {APP_NAME}
                        </div>
                        <div class="w-12"></div>
                    </div>

                    {/* Content */}
                    <div class="p-window-padding flex flex-col gap-6">
                        <div class="flex flex-col gap-2">
                            <p class="text-body-md font-code-md text-on-surface-variant">&gt; 正在身份验证...</p>
                            <p class="text-body-md font-code-md text-on-surface-variant">&gt; 请输入管理员密码</p>
                        </div>

                        <form id="login-form" class="flex flex-col gap-6">
                            <div class="relative flex items-center w-full">
                                <span class="absolute left-3 text-primary font-code-lg text-code-lg">&gt;</span>
                                <input
                                    type="password"
                                    id="password"
                                    autocomplete="current-password"
                                    class="w-full bg-surface-container-lowest border border-outline-variant rounded-DEFAULT py-3 pl-8 pr-4 text-on-surface font-code-lg focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-colors"
                                    placeholder="请输入密码"
                                />
                            </div>

                            {/* Turnstile */}
                            {hasTurnstile && (
                                <div class="w-full">
                                    <div id="turnstile-widget" class="cf-turnstile" data-sitekey={turnstileSitekey} data-callback="onTurnstileSuccess"></div>
                                </div>
                            )}

                            <div id="error-msg" class="hidden text-error text-sm bg-error-container/30 p-3 rounded border border-error/30">
                            </div>

                            <button
                                type="submit"
                                id="submit-btn"
                                class="w-full bg-primary hover:bg-primary/90 text-on-primary font-code-md text-code-md font-bold py-3 rounded-DEFAULT transition-all duration-200 glow-btn flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={hasTurnstile}
                            >
                                <span class="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>login</span>
                                立即登录
                            </button>
                        </form>
                    </div>

                    {/* Status Bar Footer */}
                    <div class="w-full px-window-padding py-2 bg-surface-container-low border-t border-outline-variant flex justify-between items-center mt-auto">
                        <span class="text-label-sm font-code-md text-on-surface-variant/60">SYS_STATUS: PENDING_AUTH</span>
                        <a class="text-label-sm font-code-md text-on-surface-variant/60 hover:text-primary transition-opacity" href="https://github.com/newbietan/Vless2Clash" target="_blank" rel="noopener noreferrer">GitHub</a>
                    </div>
                </div>

                <script dangerouslySetInnerHTML={{ __html: `
                    let turnstileToken = '';
                    const hasTurnstile = ${hasTurnstile};

                    window.onTurnstileSuccess = function(token) {
                        turnstileToken = token;
                        document.getElementById('submit-btn').disabled = false;
                    };

                    if (!hasTurnstile) {
                        document.getElementById('submit-btn').disabled = false;
                    }

                    document.getElementById('login-form').addEventListener('submit', async (e) => {
                        e.preventDefault();
                        const password = document.getElementById('password').value;
                        const errorMsg = document.getElementById('error-msg');
                        const submitBtn = document.getElementById('submit-btn');

                        submitBtn.disabled = true;
                        submitBtn.innerHTML = '<span class="material-symbols-outlined text-[20px] animate-spin">progress_activity</span> 验证中...';

                        try {
                            const res = await fetch('/api/login', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ password, turnstileToken })
                            });

                            if (!res.ok) {
                                const text = await res.text();
                                errorMsg.textContent = text;
                                errorMsg.classList.remove('hidden');
                                submitBtn.disabled = false;
                                submitBtn.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings: \\'FILL\\' 1">login</span> 立即登录';
                                return;
                            }

                            const { token } = await res.json();
                            localStorage.setItem('auth_token', token);
                            document.cookie = 'auth_token=' + token + '; path=/; max-age=86400';
                            window.location.href = '/';
                        } catch (err) {
                            errorMsg.textContent = '登录失败: ' + err.message;
                            errorMsg.classList.remove('hidden');
                            submitBtn.disabled = false;
                            submitBtn.innerHTML = '<span class="material-symbols-outlined" style="font-variation-settings: \\'FILL\\' 1">login</span> 立即登录';
                        }
                    });
                ` }} />
            </body>
        </html>
    );
};

export default LoginPage;
