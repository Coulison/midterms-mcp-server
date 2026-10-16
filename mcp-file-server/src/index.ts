import { mkdirSync } from "node:fs";
import express from "express";
import type { Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { createServer } from "./server.js";
import { PORT, WORKSPACE_ROOT } from "./config.js";

mkdirSync(WORKSPACE_ROOT, { recursive: true });

const app = express();
app.use(express.json());

// Stateless mode: a fresh server + transport per request.
// Nothing lives in memory, so a pm2 restart loses nothing.
app.post("/mcp", async (req: Request, res: Response) => {
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
app.get("/mcp", notAllowed);
app.delete("/mcp", notAllowed);

// 127.0.0.1 only: the tunnel reaches us locally, the LAN can't.
app.listen(PORT, "127.0.0.1", () => {
    console.log(`MCP server on http://127.0.0.1:${PORT}/mcp`);
    console.log(`Workspace root: ${WORKSPACE_ROOT}`);
});