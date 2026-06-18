/**
 * Simple authentication service using password + JWT-like token
 * Token is stored in KV with TTL for session management
 */

import { generateWebPath } from '../utils.js';

export class AuthService {
    constructor(kv, password, options = {}) {
        this.kv = kv;
        this.password = password;
        this.sessionTtl = options.sessionTtl || 86400; // 24 hours
    }

    /**
     * Verify password and create session token
     */
    async login(password) {
        if (!this.password) {
            // No password configured, allow access
            return { token: 'no-auth', expiresAt: Date.now() + 86400000 };
        }

        if (password !== this.password) {
            throw new Error('密码错误');
        }

        const token = generateWebPath(32);
        const expiresAt = Date.now() + (this.sessionTtl * 1000);

        if (this.kv) {
            await this.kv.put(`session:${token}`, JSON.stringify({ expiresAt }), {
                expirationTtl: this.sessionTtl
            });
        }

        return { token, expiresAt };
    }

    /**
     * Verify session token is valid
     */
    async verifyToken(token) {
        if (!this.password) {
            return true; // No password configured
        }

        if (!token) {
            return false;
        }

        if (token === 'no-auth') {
            return true;
        }

        if (!this.kv) {
            // No KV, check if token looks valid
            return token.length === 32;
        }

        const session = await this.kv.get(`session:${token}`);
        if (!session) {
            return false;
        }

        try {
            const { expiresAt } = JSON.parse(session);
            return Date.now() < expiresAt;
        } catch {
            return false;
        }
    }

    /**
     * Invalidate session token
     */
    async logout(token) {
        if (this.kv && token && token !== 'no-auth') {
            await this.kv.delete(`session:${token}`);
        }
    }

    /**
     * Check if auth is enabled
     */
    isAuthEnabled() {
        return !!this.password;
    }
}