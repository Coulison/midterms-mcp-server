import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerListFiles } from "./tools/listFiles.js";

export function createServer() {
    const server = new McpServer({ name: "ascent-file-server", version: "0.1.0" });
    registerListFiles(server);
    return server;
}