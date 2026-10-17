import "dotenv/config";
import { mkdirSync, writeFileSync } from "node:fs";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const PORT = process.env.PORT || 3000;
const roles = {
    admin: process.env.MCP_PATH_SECRET,
    worker: process.env.MCP_SECRET_WORKER,
    reviewer: process.env.MCP_SECRET_REVIEWER,
};
const out = [];
const log = (s = "") => { out.push(s); console.log(s); };
const text = (r) => (r.content ?? []).map((c) => c.text ?? "").join(" ").replace(/\s+/g, " ").slice(0, 140);

async function connect(base) {
    const client = new Client({ name: "evidence-collector", version: "1.0.0" }, { capabilities: {} });
    await client.connect(new StreamableHTTPClientTransport(new URL(base)));
    return client;
}

async function probe(client, label, name, args) {
    try {
        const r = await client.callTool({ name, arguments: args });
        log(`${r.isError ? "REFUSED " : "ok      "} ${label}: ${text(r)}`);
    } catch (e) {
        log(`REJECTED ${label}: ${String(e.message).slice(0, 140)}`);
    }
}

log(`# Evidence collected ${new Date().toISOString()}`);
const c = {};
log("\n## Tools per role (live tools/list)");
for (const role of Object.keys(roles)) {
    c[role] = await connect(`http://127.0.0.1:${PORT}/mcp/${roles[role]}`);
    const { tools } = await c[role].listTools();
    log(`${role.padEnd(9)} ${tools.length} tools: ${tools.map((t) => t.name).join(", ")}`);
}

log("\n## Sandbox and guard probes (every one should be refused)");
await probe(c.admin, "list_files path '..'", "list_files", { path: ".." });
await probe(c.admin, "read_file ../package.json", "read_file", { path: "../package.json" });
await probe(c.admin, "read_file .git/config", "read_file", { path: ".git/config" });
await probe(c.admin, "write_file C:\\temp\\x.txt", "write_file", { path: "C:\\temp\\x.txt", content: "x" });
await probe(c.worker, "write_file overwrite PLAN_LOG.md", "write_file", { path: "projects/demo/PLAN_LOG.md", content: "x", overwrite: true });
await probe(c.worker, "str_replace on PLAN_LOG.md", "str_replace", { path: "projects/demo/PLAN_LOG.md", old_str: "PLAN_LOG", new_str: "x" });
await probe(c.admin, "delete_file on PROJECT_STATE.md", "delete_file", { path: "projects/demo/PROJECT_STATE.md", confirm: true });
await probe(c.admin, "delete_file without confirm", "delete_file", { path: "projects/demo/source/notes.md" });

log("\n## Role separation (tools a role does not have)");
await probe(c.worker, "worker calls delete_file", "delete_file", { path: "projects/demo/PROJECT_STATE.md", confirm: true });
await probe(c.reviewer, "reviewer calls write_file", "write_file", { path: "projects/demo/PLAN_LOG.md", content: "x", overwrite: true });
await probe(c.reviewer, "reviewer calls str_replace", "str_replace", { path: "projects/demo/PLAN_LOG.md", old_str: "PLAN_LOG", new_str: "x" });
await probe(c.reviewer, "reviewer calls git_commit", "git_commit", { message: "should not exist" });

log("\n## Public endpoint");
const domain = process.env.NGROK_DOMAIN;
if (domain) {
    try {
        const pub = await connect(`https://${domain}/mcp/${roles.admin}`);
        const r = await pub.callTool({ name: "list_files", arguments: { path: "." } });
        log(`https://${domain}/mcp/<secret> list_files -> ${r.isError ? "ERROR" : "ok"}: ${text(r)}`);
        await pub.close();
    } catch {
        log("public URL check FAILED (is the tunnel online?)");
    }
}

for (const client of Object.values(c)) await client.close();
mkdirSync("evidence/command-output", { recursive: true });
writeFileSync("evidence/command-output/tools-and-guards.txt", out.join("\n") + "\n");
console.log("\nSaved evidence/command-output/tools-and-guards.txt");