/**
 * Simple authentication service using password + JWT-like token
 * Token is stored in KV with TTL for session management
 */

import { generateWebPath } from '../utils.js';
import { MissingDependencyError } from './errors.js';

export class AuthService {
    constructor(kv, password, options = {}) {
        this.kv = kv;
        this.password = password;
        this.sessionTtl = options.sessionTtl || 86400; // 24 hours
        this.allowUnauthenticated = options.allowUnauthenticated === true;
    }

    /**
     * Verify password and create session token
     */
    async login(password) {
        if (!this.password) {
            if (!this.allowUnauthenticated) {
                throw new MissingDependencyError('ADMIN_PASSWORD is not configured');
            }
            return { token: 'no-auth', expiresAt: Date.now() + 86400000 };
        }

        if (password !== this.password) {
            throw new Error('密码错误');
        }

        if (!this.kv) {
            throw new MissingDependencyError('Authentication requires a KV store');
        }

        const token = generateWebPath(32);
        const expiresAt = Date.now() + (this.sessionTtl * 1000);

        await this.kv.put(`session:${token}`, JSON.stringify({ expiresAt }), {
            expirationTtl: this.sessionTtl
        });

        return { token, expiresAt };
    }

    /**
     * Verify session token is valid
     */
    async verifyToken(token) {
        if (!this.password) {
            return this.allowUnauthenticated;
        }

        if (!token) {
            return false;
        }

        if (!this.kv) {
            return false;
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
        return !this.allowUnauthenticated;
    }
}
