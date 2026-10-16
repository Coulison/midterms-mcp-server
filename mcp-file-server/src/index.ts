import { mkdirSync } from "node:fs";
import express from "express";
import type { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";
import { MCP_PATH_SECRET, PORT, WORKSPACE_ROOT } from "./config.js";

// Refuse to start without a strong secret.
if (MCP_PATH_SECRET.length < 32) {
    console.error("MCP_PATH_SECRET is missing or shorter than 32 characters. See .env.example.");
    process.exit(1);
}
const MCP_ROUTE = `/mcp/${MCP_PATH_SECRET}`;

mkdirSync(WORKSPACE_ROOT, { recursive: true });

const app = express();
app.disable("x-powered-by");
app.use(express.json());

// Stateless mode: a fresh server + transport per request.
// Nothing lives in memory, so a pm2 restart loses nothing.
app.post(MCP_ROUTE, async (req: Request, res: Response) => {
    const server = createServer();
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
});

const notAllowed = (_req: Request, res: Response) => {
    res.status(405).set("Allow", "POST").json({
        jsonrpc: "2.0",
        error: { code: -32000, message: "Method not allowed." },
        id: null,
    });
};
app.get(MCP_ROUTE, notAllowed);
app.delete(MCP_ROUTE, notAllowed);

// 127.0.0.1 only: the tunnel reaches us locally, the LAN can't.
app.listen(PORT, "127.0.0.1", () => {
    console.log(`MCP endpoint: http://127.0.0.1:${PORT}/mcp/<secret>`);
    console.log(`Workspace root: ${WORKSPACE_ROOT}`);
});