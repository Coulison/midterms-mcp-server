import { mkdirSync } from "node:fs";
import express from "express";
import type { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";
import { ensureRepo } from "./git.js";
import { PORT, ROLE_SECRETS, WORKSPACE_ROOT } from "./config.js";
import type { Role } from "./roles.js";

// Refuse to start unless every role has its own strong secret.
const roles = Object.keys(ROLE_SECRETS) as Role[];
for (const role of roles) {
  if (ROLE_SECRETS[role].length < 32) {
    console.error(`Secret for role "${role}" is missing or shorter than 32 characters. See .env.example.`);
    process.exit(1);
  }
}
if (new Set(roles.map((r) => ROLE_SECRETS[r])).size !== roles.length) {
  console.error("Each role needs its own distinct secret.");
  process.exit(1);
}

mkdirSync(WORKSPACE_ROOT, { recursive: true });

const app = express();
app.disable("x-powered-by");
app.use(express.json());

// Stateless mode: a fresh server + transport per request, built for the role that owns this URL.
const handle = (role: Role) => async (req: Request, res: Response) => {
  const server = createServer(role);
  const transport = new StreamableHTTPServerTransport({ sessionIdGenerator: undefined });
  res.on("close", () => {
    transport.close();
    server.close();
  });
  try {
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  } catch (err) {
    console.error("MCP request failed:", err);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
};

const notAllowed = (_req: Request, res: Response) => {
  res.status(405).set("Allow", "POST").json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Method not allowed." },
    id: null,
  });
};

for (const role of roles) {
  const route = `/mcp/${ROLE_SECRETS[role]}`;
  app.post(route, handle(role));
  app.get(route, notAllowed);
  app.delete(route, notAllowed);
}

try {
  await ensureRepo();
} catch (err) {
  console.warn("git-lite disabled:", (err as Error).message);
}

// 127.0.0.1 only: the tunnel reaches us locally, the LAN can't.
app.listen(PORT, "127.0.0.1", () => {
  console.log(`MCP endpoints: http://127.0.0.1:${PORT}/mcp/<secret> for roles: ${roles.join(", ")}`);
  console.log(`Workspace root: ${WORKSPACE_ROOT}`);
});