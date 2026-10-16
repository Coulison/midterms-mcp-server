import { lstat, unlink } from "node:fs/promises";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WORKSPACE_ROOT } from "../config.js";
import { resolveSafe } from "../sandbox.js";
import { fail, ok, toToolError } from "./util.js";

export function registerDeleteFile(server: McpServer) {
    server.registerTool(
        "delete_file",
        {
            description:
                "DESTRUCTIVE: permanently delete one file. Folders are not deleted. " +
                "Only use when the task requires removing a file; check with list_files first. " +
                "Fails if the file does not exist or the path is a folder.",
            inputSchema: {
                path: z.string().min(1).describe("File path relative to the workspace root."),
            },
        },
        async ({ path: p }) => {
            try {
                const abs = await resolveSafe(p);
                if (abs === WORKSPACE_ROOT) return fail("Cannot delete the workspace root.");
                const st = await lstat(abs);
                if (st.isDirectory()) return fail("That path is a folder. delete_file only removes files.");
                await unlink(abs);
                return ok(`Deleted ${p}.`);
            } catch (err) {
                return toToolError(err);
            }
        }
    );
}