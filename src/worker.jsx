import { createApp } from "./app/createApp.jsx";
import { createCloudflareRuntime } from "./runtime/cloudflare.js";

export default {
    fetch(request, env, ctx) {
        const runtime = createCloudflareRuntime(env);
        const app = createApp(runtime);
        return app.fetch(request, env, ctx);
    },
};
