import { readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolveSafe } from "../sandbox.js";
import { ok, toToolError } from "./util.js";

export function registerListFiles(server: McpServer) {
    server.registerTool(
        "list_files",
        {
            description:
                "List files and folders in one workspace folder (not recursive). " +
                "Use this first to see what exists before reading or writing. " +
                "Output is one entry per line: 'dir', 'file' (with size) or 'link'. " +
                "Fails if the folder does not exist or the path leaves the workspace.",
            inputSchema: {
                path: z.string().default(".").describe("Folder relative to the workspace root. '.' is the root."),
            },
        },
        async ({ path: dir }) => {
            try {
                const abs = await resolveSafe(dir);
                const entries = await readdir(abs, { withFileTypes: true });
                const lines = await Promise.all(
                    entries.filter((e) => e.name.toLowerCase() !== ".git").map(async (e) => {
                        if (e.isSymbolicLink()) return `link  ${e.name}`;
                        if (e.isDirectory()) return `dir   ${e.name}/`;
                        const { size } = await stat(join(abs, e.name));
                        return `file  ${e.name}  (${size} bytes)`;
                    })
                );
                lines.sort();
                return ok(lines.length ? lines.join("\n") : "(empty folder)");
            } catch (err) {
                return toToolError(err);
            }
        }
    );
}