import { describe, it, expect, beforeEach } from "vitest";
import { LoginThrottleService } from "../src/services/loginThrottleService.js";
import { createApp } from "../src/app/createApp.jsx";
import { MemoryKVAdapter } from "../src/adapters/kv/memoryKv.js";

describe("LoginThrottleService", () => {
    let kv;
    let throttle;

    beforeEach(() => {
        kv = new MemoryKVAdapter();
        throttle = new LoginThrottleService(kv);
    });

    it("allows attempts below the failure threshold", async () => {
        for (let i = 0; i < 4; i++) {
            const { blocked } = await throttle.recordFailure("1.2.3.4");
            expect(blocked).toBe(false);
        }
        const { blocked } = await throttle.isBlocked("1.2.3.4");
        expect(blocked).toBe(false);
    });

    it("locks the IP once the threshold is reached", async () => {
        for (let i = 0; i < 5; i++) {
            await throttle.recordFailure("1.2.3.4");
        }
        const { blocked, retryAfterSeconds } =
            await throttle.isBlocked("1.2.3.4");
        expect(blocked).toBe(true);
        expect(retryAfterSeconds).toBeGreaterThan(0);
    });

    it("keeps the lock refreshed while the attacker keeps trying", async () => {
        for (let i = 0; i < 5; i++) {
            await throttle.recordFailure("1.2.3.4");
        }
        // 锁定期间继续尝试不会解除锁定
        const { blocked } = await throttle.recordFailure("1.2.3.4");
        expect(blocked).toBe(true);
        expect((await throttle.isBlocked("1.2.3.4")).blocked).toBe(true);
    });

    it("resets the counter after a successful login", async () => {
        for (let i = 0; i < 4; i++) {
            await throttle.recordFailure("1.2.3.4");
        }
        await throttle.recordSuccess("1.2.3.4");
        const { blocked } = await throttle.isBlocked("1.2.3.4");
        expect(blocked).toBe(false);
    });

    it("treats different IPs independently", async () => {
        for (let i = 0; i < 5; i++) {
            await throttle.recordFailure("1.2.3.4");
        }
        const { blocked } = await throttle.isBlocked("5.6.7.8");
        expect(blocked).toBe(false);
    });
});

describe("Login brute-force protection (integration)", () => {
    function makeApp() {
        return createApp({
            kv: new MemoryKVAdapter(),
            config: { adminPassword: "secret" },
        });
    }

    function wrongPasswordLogin(app, ip) {
        return app.request("http://example.com/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "CF-Connecting-IP": ip,
            },
            body: JSON.stringify({ password: "wrong" }),
        });
    }

    it("returns 429 after too many failed attempts from one IP", async () => {
        const app = makeApp();
        for (let i = 0; i < 5; i++) {
            const res = await wrongPasswordLogin(app, "1.2.3.4");
            expect(res.status).toBe(401);
        }
        const blocked = await wrongPasswordLogin(app, "1.2.3.4");
        expect(blocked.status).toBe(429);
    });

    it("does not block other IPs", async () => {
        const app = makeApp();
        for (let i = 0; i < 5; i++) {
            await wrongPasswordLogin(app, "1.2.3.4");
        }
        const other = await wrongPasswordLogin(app, "5.6.7.8");
        expect(other.status).toBe(401);
    });

    it("allows login again from the same IP after a success", async () => {
        const app = makeApp();
        for (let i = 0; i < 4; i++) {
            await wrongPasswordLogin(app, "1.2.3.4");
        }
        // 成功登录后失败计数清零
        const ok = await app.request("http://example.com/api/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "CF-Connecting-IP": "1.2.3.4",
            },
            body: JSON.stringify({ password: "secret" }),
        });
        expect(ok.status).toBe(200);

        for (let i = 0; i < 4; i++) {
            const res = await wrongPasswordLogin(app, "1.2.3.4");
            expect(res.status).toBe(401);
        }
        // 重置后重新累计：第 5 次失败写入锁定（仍返回 401，不暴露锁定），
        // 下一次请求才返回 429——证明计数已被成功登录清零。
        expect((await wrongPasswordLogin(app, "1.2.3.4")).status).toBe(401);
        const still = await wrongPasswordLogin(app, "1.2.3.4");
        expect(still.status).toBe(429);
    });

    it("is a no-op when no KV store is available", async () => {
        // 没有 KV 时不应抛错，也不应限制登录
        const app = createApp({ config: { adminPassword: "secret" } });
        for (let i = 0; i < 10; i++) {
            const res = await wrongPasswordLogin(app, "1.2.3.4");
            expect(res.status).toBe(401);
        }
    });
});
