// Dashboard 前端逻辑（原内联于 DashboardPage.jsx，抽取为独立静态资源，
// 由 Cloudflare assets 提供服务，defer 加载保证 DOM 就绪）。
// 注意：全局变量均声明在函数内/顶部，避免污染 window。

// === State ===
let nodes = [];
let editingIndex = -1;
let selectedIndices = new Set();
let editingConfigId = null;
let parseTimer = null;

const textarea = document.getElementById("vless-input");
const previewPanel = document.getElementById("preview-panel");
const nodeList = document.getElementById("node-list");
const nodeCountLabel = document.getElementById("node-count-label");
const nodeEditor = document.getElementById("node-editor");
const editorForm = document.getElementById("editor-form");
const convertBtn = document.getElementById("convert-btn");
const updateBtn = document.getElementById("update-btn");

// === Auth ===
function getToken() {
    return localStorage.getItem("auth_token") || "";
}

// === Parsing ===
function guessRegion(server, name) {
    const patterns = {
        US: ["us", "america", "美国"],
        JP: ["jp", "japan", "日本", "东京"],
        HK: ["hk", "hongkong", "香港"],
        SG: ["sg", "singapore", "新加坡"],
        TW: ["tw", "taiwan", "台湾"],
        KR: ["kr", "korea", "韩国", "首尔"],
        DE: ["de", "germany", "德国"],
        GB: ["gb", "uk", "英国"],
    };
    const lower = (name + " " + server).toLowerCase();
    for (const [region, pats] of Object.entries(patterns)) {
        if (pats.some((p) => lower.includes(p))) return region;
    }
    return "OTHER";
}

function isSupportedLink(line) {
    const trimmed = (line || "").trim();
    return (
        trimmed.startsWith("vless://") ||
        trimmed.startsWith("hysteria2://") ||
        trimmed.startsWith("hy2://")
    );
}

function parseNodes(links, shouldDedup = true) {
    const result = [];
    const seen = new Set();
    for (const link of links) {
        try {
            const url = new URL(link.trim());
            const server = url.hostname.replace(/^\[(.*)\]$/, "$1");
            const port = parseInt(url.port || "443", 10);
            const params = url.searchParams;
            const name = decodeURIComponent(
                url.hash.slice(1) || server + ":" + port,
            );

            if (url.protocol === "vless:") {
                const uuid = decodeURIComponent(url.username || "");
                const dedupKey = "vless:" + server + ":" + port + ":" + uuid;
                if (shouldDedup && seen.has(dedupKey)) continue;
                seen.add(dedupKey);
                result.push({
                    name,
                    uuid,
                    server,
                    port,
                    protocol: "VLESS",
                    transport: params.get("type") || "tcp",
                    security: params.get("security") || "none",
                    sni: params.get("sni") || "",
                    path: params.get("path") || "",
                    host: params.get("host") || "",
                    serviceName: params.get("serviceName") || "",
                    flow: params.get("flow") || "",
                    region: guessRegion(server, name),
                    params: Array.from(params.entries()),
                });
            } else if (
                url.protocol === "hysteria2:" ||
                url.protocol === "hy2:"
            ) {
                const auth = decodeURIComponent(
                    url.username || url.password || "",
                );
                const dedupKey =
                    "hysteria2:" + server + ":" + port + ":" + auth;
                if (shouldDedup && seen.has(dedupKey)) continue;
                seen.add(dedupKey);

                const insecureParam =
                    params.get("insecure") ??
                    params.get("allowInsecure") ??
                    params.get("allow-insecure");
                const insecure =
                    insecureParam === "1" || insecureParam === "true";

                result.push({
                    name,
                    uuid: auth,
                    server,
                    port,
                    protocol: "HYSTERIA2",
                    transport: "udp",
                    security: insecure ? "insecure" : "tls",
                    sni: params.get("sni") || params.get("peer") || "",
                    path: "",
                    host: "",
                    serviceName: "",
                    flow: "",
                    region: guessRegion(server, name),
                    params: Array.from(params.entries()),
                    ports: params.get("mport") || params.get("ports") || "",
                    obfs: params.get("obfs") || "",
                    obfsPassword: params.get("obfs-password") || "",
                });
            }
        } catch {}
    }
    return result;
}

function serializeLink(node) {
    if (node.protocol === "HYSTERIA2") {
        return serializeHysteria2Link(node);
    }
    return serializeVlessLink(node);
}

function serializeHysteria2Link(node) {
    const params = new URLSearchParams(
        Array.isArray(node.params) ? node.params : [],
    );
    setParam(params, "sni", node.sni);
    if (node.security === "insecure") {
        params.set("insecure", "1");
    } else {
        params.delete("insecure");
    }
    setParam(params, "ports", node.ports);
    setParam(params, "obfs", node.obfs);
    setParam(params, "obfs-password", node.obfsPassword);

    const query = params.toString();
    const hash = node.name ? "#" + encodeURIComponent(node.name) : "";
    const server =
        node.server.includes(":") && !node.server.startsWith("[")
            ? "[" + node.server + "]"
            : node.server;
    return (
        "hysteria2://" +
        encodeURIComponent(node.uuid) +
        "@" +
        server +
        ":" +
        node.port +
        (query ? "?" + query : "") +
        hash
    );
}

function serializeVlessLink(node) {
    const params = new URLSearchParams(
        Array.isArray(node.params) ? node.params : [],
    );
    setParam(params, "type", node.transport, "tcp");
    setParam(params, "security", node.security, "none");
    setParam(params, "sni", node.sni);
    setParam(params, "path", node.path);
    setParam(params, "host", node.host);
    setParam(params, "serviceName", node.serviceName);
    setParam(params, "flow", node.flow);

    const query = params.toString();
    const hash = node.name ? "#" + encodeURIComponent(node.name) : "";
    const server =
        node.server.includes(":") && !node.server.startsWith("[")
            ? "[" + node.server + "]"
            : node.server;
    return (
        "vless://" +
        encodeURIComponent(node.uuid) +
        "@" +
        server +
        ":" +
        node.port +
        (query ? "?" + query : "") +
        hash
    );
}

function setParam(params, key, value, defaultValue = "") {
    if (value && value !== defaultValue) {
        params.set(key, value);
    } else {
        params.delete(key);
    }
}

// === Bidirectional Sync ===
function syncFromTextarea() {
    const input = textarea.value.trim();
    if (!input) {
        nodes = [];
        selectedIndices.clear();
        closeEditor();
        renderPreview();
        return;
    }
    const lines = input.split("\n").filter((l) => isSupportedLink(l));
    const shouldDedup = document.getElementById("opt-dedup").checked;
    nodes = parseNodes(lines, shouldDedup);
    selectedIndices.clear();
    closeEditor();
    renderPreview();
}

function syncToTextarea() {
    const links = nodes.map((n) => serializeLink(n));
    textarea.value = links.join("\n");
}

// === Preview Rendering ===
function renderPreview() {
    const count = nodes.length;
    nodeCountLabel.textContent = count + " 个节点";

    if (count === 0) {
        previewPanel.classList.add("hidden");
        previewPanel.classList.remove("flex");
        return;
    }

    previewPanel.classList.remove("hidden");
    previewPanel.classList.add("flex");

    const searchQuery = (
        document.getElementById("node-search").value || ""
    ).toLowerCase();
    const filtered = searchQuery
        ? nodes
              .map((n, i) => ({ node: n, index: i }))
              .filter(
                  ({ node }) =>
                      node.name.toLowerCase().includes(searchQuery) ||
                      node.server.toLowerCase().includes(searchQuery) ||
                      node.region.toLowerCase().includes(searchQuery),
              )
        : nodes.map((n, i) => ({ node: n, index: i }));

    // pi-lens-ignore: no-inner-html-js — 所有用户输入插值均经 escapeHtml() 转义，见上方 escapeHtml 定义, no-inner-html-js
    nodeList.innerHTML = filtered
        .map(({ node, index }) => {
            const protoLabel = (node.protocol || "VLESS").toUpperCase();
            const secColor =
                node.security === "tls" || node.security === "reality"
                    ? "primary"
                    : "outline";
            const secLabel = (node.security || "none").toUpperCase();
            const transportLabel = (node.transport || "tcp").toUpperCase();
            const transportColor =
                node.transport === "grpc" || node.transport === "h2"
                    ? "tertiary"
                    : "secondary";
            const isSelected = selectedIndices.has(index);

            let html =
                '<div class="flex items-center justify-between p-2.5 border rounded transition-colors ' +
                (isSelected
                    ? "border-primary/50 bg-primary/5"
                    : "border-outline-variant/20 bg-surface-container-lowest/30 hover:border-primary/30") +
                '">';
            html += '<div class="flex items-center gap-3 flex-1 min-w-0">';
            html +=
                '<input type="checkbox" class="node-checkbox accent-primary" data-index="' +
                index +
                '"' +
                (isSelected ? " checked" : "") +
                " />";
            html += '<div class="flex flex-col min-w-0">';
            html +=
                '<span class="text-secondary-fixed-dim font-code-md truncate">' +
                escapeHtml(node.name) +
                "</span>";
            html +=
                '<span class="text-label-sm font-code-md text-on-surface-variant/60 mt-0.5">' +
                escapeHtml(node.server) +
                ":" +
                node.port +
                "</span>";
            html += "</div></div>";
            html += '<div class="flex items-center gap-2 flex-shrink-0">';
            html +=
                '<span class="px-1.5 py-0.5 rounded bg-primary/10 border border-primary/30 text-primary text-[10px] font-bold uppercase tracking-tighter">' +
                escapeHtml(protoLabel) +
                "</span>";
            html +=
                '<span class="px-1.5 py-0.5 rounded bg-' +
                transportColor +
                "/10 border border-" +
                transportColor +
                "/30 text-" +
                transportColor +
                ' text-[10px] font-bold uppercase tracking-tighter">' +
                escapeHtml(transportLabel) +
                "</span>";
            html +=
                '<span class="px-1.5 py-0.5 rounded bg-' +
                secColor +
                "/10 border border-" +
                secColor +
                "/30 text-" +
                secColor +
                ' text-[10px] font-bold uppercase tracking-tighter">' +
                escapeHtml(secLabel) +
                "</span>";
            html +=
                '<button class="node-edit-btn text-on-surface-variant hover:text-primary p-1 rounded transition-colors" data-index="' +
                index +
                '" title="编辑">';
            html +=
                '<span class="material-symbols-outlined text-[16px]">edit</span></button>';
            html +=
                '<button class="node-delete-btn text-on-surface-variant hover:text-error p-1 rounded transition-colors" data-index="' +
                index +
                '" title="删除">';
            html +=
                '<span class="material-symbols-outlined text-[16px]">delete</span></button>';
            html += "</div></div>";
            return html;
        })
        .join("");

    // Update select-all button
    const allSelected =
        nodes.length > 0 && selectedIndices.size === nodes.length;
    document.getElementById("select-all-btn").textContent = allSelected
        ? "取消全选"
        : "全选";
    document
        .getElementById("delete-selected-btn")
        .classList.toggle("hidden", selectedIndices.size === 0);
}

function escapeHtml(str) {
    return String(str ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

// === Node Editor ===
function openEditor(index) {
    editingIndex = index;
    const node = nodes[index];
    const isHysteria2 = node.protocol === "HYSTERIA2";
    const transportFields = isHysteria2
        ? ""
        : getTransportFields(node.transport, node);
    const credLabel = isHysteria2 ? "认证密码 (Password)" : "UUID";

    let html =
        '<div class="sm:col-span-2"><label class="text-label-sm font-code-md text-on-surface-variant block mb-1">节点名</label>';
    html +=
        '<input type="text" id="ed-name" value="' +
        escapeHtml(node.name) +
        '" class="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary" /></div>';
    html +=
        '<div><label class="text-label-sm font-code-md text-on-surface-variant block mb-1">服务器</label>';
    html +=
        '<input type="text" id="ed-server" value="' +
        escapeHtml(node.server) +
        '" class="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary" /></div>';
    html +=
        '<div><label class="text-label-sm font-code-md text-on-surface-variant block mb-1">端口</label>';
    html +=
        '<input type="number" id="ed-port" value="' +
        node.port +
        '" class="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary" /></div>';
    html +=
        '<div class="sm:col-span-2"><label class="text-label-sm font-code-md text-on-surface-variant block mb-1">' +
        credLabel +
        "</label>";
    html +=
        '<input type="text" id="ed-uuid" value="' +
        escapeHtml(node.uuid) +
        '" class="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary" /></div>';

    if (isHysteria2) {
        html +=
            '<div><label class="text-label-sm font-code-md text-on-surface-variant block mb-1">跳跃端口 (mport/ports)</label>';
        html +=
            '<input type="text" id="ed-ports" value="' +
            escapeHtml(node.ports || "") +
            '" placeholder="如 10000-20000" class="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary" /></div>';
        html +=
            '<div><label class="text-label-sm font-code-md text-on-surface-variant block mb-1">安全模式</label>';
        html +=
            '<select id="ed-security" class="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary">';
        html +=
            '<option value="tls"' +
            (node.security === "tls" ? " selected" : "") +
            ">TLS (标准验证)</option>";
        html +=
            '<option value="insecure"' +
            (node.security === "insecure" ? " selected" : "") +
            ">INSECURE (跳过验证)</option>";
        html += "</select></div>";
        html +=
            '<div><label class="text-label-sm font-code-md text-on-surface-variant block mb-1">SNI</label>';
        html +=
            '<input type="text" id="ed-sni" value="' +
            escapeHtml(node.sni) +
            '" class="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary" /></div>';
        html +=
            '<div><label class="text-label-sm font-code-md text-on-surface-variant block mb-1">混淆类型 (obfs)</label>';
        html +=
            '<input type="text" id="ed-obfs" value="' +
            escapeHtml(node.obfs || "") +
            '" placeholder="如 salamander" class="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary" /></div>';
    } else {
        html +=
            '<div><label class="text-label-sm font-code-md text-on-surface-variant block mb-1">传输方式</label>';
        html +=
            '<select id="ed-transport" class="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary">';
        ["tcp", "ws", "grpc", "xhttp"].forEach((t) => {
            html +=
                '<option value="' +
                t +
                '"' +
                (node.transport === t ? " selected" : "") +
                ">" +
                t.toUpperCase() +
                "</option>";
        });
        html += "</select></div>";
        html +=
            '<div><label class="text-label-sm font-code-md text-on-surface-variant block mb-1">安全</label>';
        html +=
            '<select id="ed-security" class="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary">';
        ["none", "tls", "reality"].forEach((s) => {
            html +=
                '<option value="' +
                s +
                '"' +
                (node.security === s ? " selected" : "") +
                ">" +
                s.toUpperCase() +
                "</option>";
        });
        html += "</select></div>";
        html +=
            '<div><label class="text-label-sm font-code-md text-on-surface-variant block mb-1">SNI</label>';
        html +=
            '<input type="text" id="ed-sni" value="' +
            escapeHtml(node.sni) +
            '" class="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary" /></div>';

        // Transport-specific fields
        html += '<div id="ed-transport-fields">' + transportFields + "</div>";
    }

    // pi-lens-ignore: no-inner-html-js — 编辑表单值均经 escapeHtml() 转义, no-inner-html-js
    editorForm.innerHTML = html;
    nodeEditor.classList.remove("hidden");

    if (!isHysteria2) {
        // Re-render transport fields on change
        document
            .getElementById("ed-transport")
            .addEventListener("change", (e) => {
                const currentNode = {
                    ...node,
                    path:
                        document.getElementById("ed-path")?.value.trim() ||
                        node.path ||
                        "",
                    host:
                        document.getElementById("ed-host")?.value.trim() ||
                        node.host ||
                        "",
                    serviceName:
                        document.getElementById("ed-svc")?.value.trim() ||
                        node.serviceName ||
                        "",
                };
                // pi-lens-ignore: no-inner-html-js — 传输字段值均经 escapeHtml() 转义, no-inner-html-js
                document.getElementById("ed-transport-fields").innerHTML =
                    getTransportFields(e.target.value, currentNode);
            });
    }
}

function getTransportFields(transport, node) {
    let html = "";
    if (transport === "ws" || transport === "xhttp") {
        html +=
            '<div><label class="text-label-sm font-code-md text-on-surface-variant block mb-1">路径</label>';
        html +=
            '<input type="text" id="ed-path" value="' +
            escapeHtml(node.path || "") +
            '" class="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary" /></div>';
    }
    if (transport === "ws") {
        html +=
            '<div><label class="text-label-sm font-code-md text-on-surface-variant block mb-1">Host</label>';
        html +=
            '<input type="text" id="ed-host" value="' +
            escapeHtml(node.host || "") +
            '" class="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary" /></div>';
    }
    if (transport === "grpc") {
        html +=
            '<div><label class="text-label-sm font-code-md text-on-surface-variant block mb-1">Service Name</label>';
        html +=
            '<input type="text" id="ed-svc" value="' +
            escapeHtml(node.serviceName || "") +
            '" class="w-full bg-surface-container-lowest border border-outline-variant rounded px-2 py-1.5 text-code-md font-code-md text-on-surface focus:outline-none focus:border-primary" /></div>';
    }
    return html;
}

function saveNodeEdit() {
    if (editingIndex < 0 || editingIndex >= nodes.length) return;
    const node = nodes[editingIndex];

    node.name = document.getElementById("ed-name").value.trim() || node.name;
    node.server =
        document.getElementById("ed-server").value.trim() || node.server;
    node.port =
        parseInt(document.getElementById("ed-port").value, 10) || node.port;
    node.uuid = document.getElementById("ed-uuid").value.trim() || node.uuid;
    node.security = document.getElementById("ed-security").value;
    node.sni = document.getElementById("ed-sni").value.trim();
    node.region = guessRegion(node.server, node.name);

    if (node.protocol === "HYSTERIA2") {
        const portsEl = document.getElementById("ed-ports");
        const obfsEl = document.getElementById("ed-obfs");
        node.ports = portsEl ? portsEl.value.trim() : "";
        node.obfs = obfsEl ? obfsEl.value.trim() : "";
    } else {
        node.transport = document.getElementById("ed-transport").value;
        const pathEl = document.getElementById("ed-path");
        const hostEl = document.getElementById("ed-host");
        const svcEl = document.getElementById("ed-svc");
        node.path = pathEl ? pathEl.value.trim() : "";
        node.host = hostEl ? hostEl.value.trim() : "";
        node.serviceName = svcEl ? svcEl.value.trim() : "";
    }

    closeEditor();
    syncToTextarea();
    renderPreview();
}

function closeEditor() {
    editingIndex = -1;
    nodeEditor.classList.add("hidden");
}

function deleteNode(index) {
    nodes.splice(index, 1);
    selectedIndices.delete(index);
    // Re-index selected indices
    const newSelected = new Set();
    for (const i of selectedIndices) {
        if (i > index) newSelected.add(i - 1);
        else if (i < index) newSelected.add(i);
    }
    selectedIndices = newSelected;
    syncToTextarea();
    renderPreview();
}

function deleteSelected() {
    if (selectedIndices.size === 0) return;
    const sorted = Array.from(selectedIndices).sort((a, b) => b - a);
    for (const i of sorted) {
        nodes.splice(i, 1);
    }
    selectedIndices.clear();
    syncToTextarea();
    renderPreview();
}

// === Event Listeners ===
textarea.addEventListener("input", () => {
    clearTimeout(parseTimer);
    parseTimer = setTimeout(syncFromTextarea, 300);
});

document
    .getElementById("opt-dedup")
    .addEventListener("change", syncFromTextarea);

nodeList.addEventListener("click", (e) => {
    const editBtn = e.target.closest(".node-edit-btn");
    if (editBtn) {
        openEditor(parseInt(editBtn.dataset.index));
        return;
    }
    const deleteBtn = e.target.closest(".node-delete-btn");
    if (deleteBtn) {
        deleteNode(parseInt(deleteBtn.dataset.index));
        return;
    }
    const checkbox = e.target.closest(".node-checkbox");
    if (checkbox) {
        const idx = parseInt(checkbox.dataset.index);
        if (checkbox.checked) selectedIndices.add(idx);
        else selectedIndices.delete(idx);
        renderPreview();
    }
});

document
    .getElementById("node-search")
    .addEventListener("input", () => renderPreview());

document.getElementById("select-all-btn").addEventListener("click", () => {
    if (selectedIndices.size === nodes.length) {
        selectedIndices.clear();
    } else {
        nodes.forEach((_, i) => selectedIndices.add(i));
    }
    renderPreview();
});

document
    .getElementById("delete-selected-btn")
    .addEventListener("click", deleteSelected);

document
    .getElementById("editor-save-btn")
    .addEventListener("click", saveNodeEdit);
document
    .getElementById("editor-cancel-btn")
    .addEventListener("click", closeEditor);
document
    .getElementById("editor-close-btn")
    .addEventListener("click", closeEditor);

// === Save/Update ===
convertBtn.addEventListener("click", async () => {
    const input = textarea.value.trim();
    if (!input) {
        alert("请输入至少一个有效节点链接 (VLESS / Hysteria 2)");
        return;
    }

    const statusDot = document.getElementById("status-dot");
    const statusText = document.getElementById("status-text");
    const outputPre = document.getElementById("output-pre");
    const copyBtn = document.getElementById("copy-btn");

    statusDot.className = "w-2 h-2 rounded-full bg-yellow-500 animate-pulse";
    statusText.textContent = "处理中...";
    outputPre.textContent = "// 转换中...";

    const dedup = document.getElementById("opt-dedup").checked;

    try {
        let links = input.split("\n").filter((l) => isSupportedLink(l));

        if (dedup) {
            const seen = new Set();
            links = links.filter((link) => {
                try {
                    const url = new URL(link.trim());
                    const auth = url.username || url.password || "";
                    const key =
                        url.protocol +
                        ":" +
                        url.hostname +
                        ":" +
                        (url.port || "443") +
                        ":" +
                        auth;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                } catch {
                    return true;
                }
            });
        }

        const processedInput = links.join("\n");
        const nodeData = parseNodes(links, dedup);

        const saveRes = await fetch("/config", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + getToken(),
            },
            body: JSON.stringify({
                links: processedInput,
                vlessLinks: processedInput,
                nodes: nodeData,
                dedup,
            }),
        });

        if (!saveRes.ok) {
            throw new Error(await saveRes.text());
        }

        const configId = await saveRes.text();
        editingConfigId = configId;
        const subscriptionUrl = window.location.origin + "/sub?id=" + configId;

        statusDot.className = "w-2 h-2 rounded-full bg-green-500";
        statusText.textContent = "成功";
        outputPre.textContent =
            "# 订阅链接\n" +
            subscriptionUrl +
            "\n\n# 在 Clash 客户端中使用此链接\n# 节点数量: " +
            links.length;
        copyBtn.disabled = false;
        copyBtn.onclick = () => {
            navigator.clipboard.writeText(subscriptionUrl);
            copyBtn.innerHTML =
                '<span class="material-symbols-outlined text-[18px]">check</span> 已复制';
            setTimeout(() => {
                copyBtn.innerHTML =
                    '<span class="material-symbols-outlined text-[18px]">content_copy</span> 复制订阅链接';
            }, 2000);
        };

        // Show update button after first save
        updateBtn.classList.remove("hidden");
    } catch (error) {
        statusDot.className = "w-2 h-2 rounded-full bg-red-500";
        statusText.textContent = "错误";
        outputPre.textContent = "// 错误: " + error.message;
    }
});

updateBtn.addEventListener("click", async () => {
    if (!editingConfigId) return;
    const input = textarea.value.trim();
    if (!input) {
        alert("请输入至少一个有效节点链接 (VLESS / Hysteria 2)");
        return;
    }

    const statusDot = document.getElementById("status-dot");
    const statusText = document.getElementById("status-text");
    const outputPre = document.getElementById("output-pre");

    statusDot.className = "w-2 h-2 rounded-full bg-yellow-500 animate-pulse";
    statusText.textContent = "更新中...";

    try {
        let links = input.split("\n").filter((l) => isSupportedLink(l));
        const dedup = document.getElementById("opt-dedup").checked;
        if (dedup) {
            const seen = new Set();
            links = links.filter((link) => {
                try {
                    const url = new URL(link.trim());
                    const auth = url.username || url.password || "";
                    const key =
                        url.protocol +
                        ":" +
                        url.hostname +
                        ":" +
                        (url.port || "443") +
                        ":" +
                        auth;
                    if (seen.has(key)) return false;
                    seen.add(key);
                    return true;
                } catch {
                    return true;
                }
            });
        }
        const nodeData = parseNodes(links, dedup);

        const res = await fetch("/api/subscriptions/" + editingConfigId, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                Authorization: "Bearer " + getToken(),
            },
            body: JSON.stringify({
                links: links.join("\n"),
                vlessLinks: links.join("\n"),
                nodes: nodeData,
                dedup,
            }),
        });

        if (!res.ok) throw new Error(await res.text());

        const subscriptionUrl =
            window.location.origin + "/sub?id=" + editingConfigId;
        statusDot.className = "w-2 h-2 rounded-full bg-green-500";
        statusText.textContent = "已更新";
        outputPre.textContent =
            "# 订阅已更新\n" +
            subscriptionUrl +
            "\n\n# 节点数量: " +
            links.length;
    } catch (error) {
        statusDot.className = "w-2 h-2 rounded-full bg-red-500";
        statusText.textContent = "错误";
        outputPre.textContent = "// 更新失败: " + error.message;
    }
});

// === Load existing subscription for editing ===
async function loadExistingConfig() {
    const params = new URLSearchParams(window.location.search);
    const editId = params.get("edit");
    if (!editId) return;

    try {
        const res = await fetch("/api/subscriptions/" + editId, {
            headers: { Authorization: "Bearer " + getToken() },
        });
        if (!res.ok) throw new Error("Failed to load");
        const config = await res.json();

        const links = config.links || config.vlessLinks;
        if (links) {
            textarea.value = links;
            editingConfigId = editId;
            updateBtn.classList.remove("hidden");
            syncFromTextarea();
        }
    } catch (error) {
        console.error("Failed to load config:", error);
    }
}

// === Init ===
loadExistingConfig();
