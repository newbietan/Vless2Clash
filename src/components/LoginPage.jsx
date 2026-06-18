/** @jsxRuntime automatic */
/** @jsxImportSource hono/jsx */
import { APP_NAME } from '../constants.js';

export const LoginPage = ({ turnstileSitekey }) => {
    const hasTurnstile = !!turnstileSitekey;

    return (
        <html lang="zh-CN">
            <head>
                <meta charset="utf-8" />
                <meta content="width=device-width, initial-scale=1.0" name="viewport" />
                <title>登录 - {APP_NAME}</title>
                <link rel="icon" type="image/x-icon" href="/favicon.ico" />
                <script src="https://cdn.tailwindcss.com"></script>
                <link href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap" rel="stylesheet" />
                <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap" rel="stylesheet" />
                {hasTurnstile && <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer></script>}
                <script dangerouslySetInnerHTML={{ __html: `
                    tailwind.config = {
                        theme: {
                            extend: {
                                colors: {
                                    primary: '#005ac2',
                                    'primary-container': '#d8e2ff',
                                    surface: '#ffffff',
                                    'surface-container': '#ece6f0',
                                    'on-surface': '#191c20',
                                    'on-surface-variant': '#44474f',
                                    outline: '#74777f',
                                    'outline-variant': '#c4c6cf',
                                    'terminal-bg': '#0f0f1a',
                                    'terminal-header': '#1e1e2e',
                                    'terminal-border': '#313244'
                                },
                                fontFamily: {
                                    sans: ['Inter', 'sans-serif'],
                                    display: ['Geist', 'sans-serif'],
                                    mono: ['JetBrains Mono', 'monospace'],
                                }
                            }
                        }
                    }
                ` }} />
                <style dangerouslySetInnerHTML={{ __html: `
                    .terminal-window {
                        box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
                    }
                    .terminal-dot {
                        width: 12px;
                        height: 12px;
                        border-radius: 50%;
                    }
                    .terminal-dot-red { background-color: #ff5f57; }
                    .terminal-dot-yellow { background-color: #febc2e; }
                    .terminal-dot-green { background-color: #28c840; }
                ` }} />
            </head>
            <body class="bg-terminal-bg min-h-screen flex items-center justify-center p-4">
                {/* Terminal Window */}
                <div class="terminal-window w-full max-w-md rounded-2xl overflow-hidden bg-white">
                    {/* Terminal Header */}
                    <div class="bg-terminal-header px-4 py-3 flex items-center justify-between">
                        <div class="flex items-center gap-2">
                            <div class="terminal-dot terminal-dot-red"></div>
                            <div class="terminal-dot terminal-dot-yellow"></div>
                            <div class="terminal-dot terminal-dot-green"></div>
                        </div>
                        <div class="text-gray-400 text-sm font-mono">登录</div>
                        <div class="w-16"></div>
                    </div>

                    {/* Content */}
                    <div class="p-8">
                        <div class="text-center mb-8">
                            <div class="w-16 h-16 bg-primary-container rounded-full flex items-center justify-center mx-auto mb-4">
                                <span class="material-symbols-outlined text-primary text-[32px]">terminal</span>
                            </div>
                            <h1 class="text-2xl font-bold text-on-surface font-display">{APP_NAME}</h1>
                            <p class="text-on-surface-variant text-sm mt-1">VLESS 订阅管理平台</p>
                        </div>

                        <form id="login-form" class="space-y-4">
                            <div>
                                <label class="block text-sm font-medium text-on-surface-variant mb-2">
                                    管理密码
                                </label>
                                <div class="relative">
                                    <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline text-[20px]">lock</span>
                                    <input
                                        type="password"
                                        id="password"
                                        class="w-full pl-10 pr-4 py-3 border border-outline-variant rounded-lg focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all font-mono"
                                        placeholder="请输入管理密码"
                                        required
                                    />
                                </div>
                            </div>

                            {/* Turnstile Widget */}
                            {hasTurnstile && (
                                <div class="flex justify-center">
                                    <div id="turnstile-widget" class="cf-turnstile" data-sitekey={turnstileSitekey} data-callback="onTurnstileSuccess"></div>
                                </div>
                            )}

                            <div id="error-msg" class="hidden text-red-600 text-sm bg-red-50 p-3 rounded-lg">
                            </div>

                            <button
                                type="submit"
                                id="submit-btn"
                                class="w-full bg-primary text-white py-3 rounded-lg font-medium hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={hasTurnstile}
                            >
                                <span class="material-symbols-outlined text-[20px]">login</span>
                                登录
                            </button>
                        </form>

                        <div class="mt-6 pt-4 border-t border-outline-variant text-center">
                            <p class="text-xs text-on-surface-variant font-mono">
                                订阅链接无需登录即可访问
                            </p>
                        </div>
                    </div>
                </div>

                <script dangerouslySetInnerHTML={{ __html: `
                    let turnstileToken = '';
                    const hasTurnstile = ${hasTurnstile};
                    
                    // Turnstile callback
                    window.onTurnstileSuccess = function(token) {
                        turnstileToken = token;
                        document.getElementById('submit-btn').disabled = false;
                    };
                    
                    // If no turnstile, enable submit immediately
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
                                body: JSON.stringify({ 
                                    password,
                                    turnstileToken: turnstileToken 
                                })
                            });
                            
                            if (!res.ok) {
                                const text = await res.text();
                                errorMsg.textContent = text;
                                errorMsg.classList.remove('hidden');
                                submitBtn.disabled = false;
                                submitBtn.innerHTML = '<span class="material-symbols-outlined text-[20px]">login</span> 登录';
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
                            submitBtn.innerHTML = '<span class="material-symbols-outlined text-[20px]">login</span> 登录';
                        }
                    });
                ` }} />
            </body>
        </html>
    );
};

export default LoginPage;