import { readdir } from "node:fs/promises";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WORKSPACE_ROOT } from "../config.js";

export function registerListFiles(server: McpServer) {
    server.registerTool(
        "list_files",
        {
            description:
                "List the files and folders at the top level of the workspace. " +
                "Use this first to see what exists before reading or writing. " +
                "Returns one entry per line, marked 'dir' or 'file'. " +
                "Fails with isError if the workspace root is missing or unreadable.",
        },
        async () => {
            try {
                const entries = await readdir(WORKSPACE_ROOT, { withFileTypes: true });
                const lines = entries
                    .map((e) => `${e.isDirectory() ? "dir " : "file"}  ${e.name}`)
                    .sort();
                return {
                    content: [{ type: "text", text: lines.length ? lines.join("\n") : "(workspace is empty)" }],
                };
            } catch (err) {
                const code = (err as NodeJS.ErrnoException).code ?? "UNKNOWN";
                return {
                    isError: true,
                    content: [{ type: "text", text: `Could not list the workspace (${code}).` }],
                };
            }
        }
    );
}