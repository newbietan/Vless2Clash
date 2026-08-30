/**
 * Per-IP login brute-force protection backed by KV.
 *
 * Strategy: count consecutive failed attempts per IP in a sliding window.
 * Once the failure count reaches maxFailures, the IP is locked for
 * lockSeconds; every further attempt during the lock refreshes the lock so
 * an attacker cannot simply wait out the remaining window one attempt at a
 * time. A successful login clears the counter.
 *
 * KV is eventually consistent, which is fine here: the goal is to slow down
 * brute-force attempts, not to provide hard accounting.
 */

const LOCK_KEY_PREFIX = "throttle:login:";

export class LoginThrottleService {
    constructor(kv, options = {}) {
        this.kv = kv;
        this.maxFailures = options.maxFailures ?? 5;
        this.lockSeconds = options.lockSeconds ?? 15 * 60;
    }

    isEnabled() {
        return !!this.kv;
    }

    keyFor(ip) {
        return `${LOCK_KEY_PREFIX}${ip || "unknown"}`;
    }

    async getState(ip) {
        const raw = await this.kv.get(this.keyFor(ip));
        if (!raw) return null;
        try {
            return JSON.parse(raw);
        } catch {
            return null;
        }
    }

    /**
     * @returns {{ blocked: boolean, retryAfterSeconds?: number }}
     */
    async isBlocked(ip) {
        const state = await this.getState(ip);
        if (!state?.lockedUntil) return { blocked: false };
        const remaining = state.lockedUntil - Date.now();
        if (remaining > 0) {
            return {
                blocked: true,
                retryAfterSeconds: Math.max(1, Math.ceil(remaining / 1000)),
            };
        }
        return { blocked: false };
    }

    /**
     * Record one failed login attempt. Returns blocked=true when this
     * attempt crossed the threshold or the IP was already locked.
     *
     * @returns {{ blocked: boolean, retryAfterSeconds?: number, remainingAttempts?: number }}
     */
    async recordFailure(ip) {
        const key = this.keyFor(ip);
        const state = await this.getState(ip);
        const now = Date.now();

        // Already locked: keep the lock and refresh its expiry.
        if (state?.lockedUntil && state.lockedUntil > now) {
            const lockedUntil = now + this.lockSeconds * 1000;
            await this.putLock(key, state.count ?? 0, lockedUntil);
            return {
                blocked: true,
                retryAfterSeconds: this.lockSeconds,
            };
        }

        const count = (state?.count ?? 0) + 1;
        if (count >= this.maxFailures) {
            const lockedUntil = now + this.lockSeconds * 1000;
            await this.putLock(key, count, lockedUntil);
            return { blocked: true, retryAfterSeconds: this.lockSeconds };
        }

        await this.putLock(key, count, 0);
        return { blocked: false, remainingAttempts: this.maxFailures - count };
    }

    async recordSuccess(ip) {
        await this.kv.delete(this.keyFor(ip));
    }

    async putLock(key, count, lockedUntil) {
        await this.kv.put(
            key,
            JSON.stringify({ count, lockedUntil }),
            // TTL starts fresh on every write, so a locked IP that keeps
            // hammering never expires; an idle IP naturally resets.
            { expirationTtl: this.lockSeconds },
        );
    }
}
