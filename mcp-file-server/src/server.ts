import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { registerListFiles } from "./tools/listFiles.js";
import { registerReadFile } from "./tools/readFile.js";
import { registerWriteFile } from "./tools/writeFile.js";
import { registerStrReplace } from "./tools/strReplace.js";
import { registerDeleteFile } from "./tools/deleteFile.js";

export function createServer() {
    const server = new McpServer({ name: "ascent-file-server", version: "0.2.0" });
    registerListFiles(server);
    registerReadFile(server);
    registerWriteFile(server);
    registerStrReplace(server);
    registerDeleteFile(server);
    return server;
}