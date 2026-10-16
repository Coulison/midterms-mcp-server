import { lstat, unlink } from "node:fs/promises";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WORKSPACE_ROOT } from "../config.js";
import { resolveSafe } from "../sandbox.js";
import { assertCanDelete } from "../guards.js";
import { fail, ok, toToolError } from "./util.js";

export function registerDeleteFile(server: McpServer) {
    server.registerTool(
        "delete_file",
        {
            description:
                "DESTRUCTIVE: permanently delete one file. Folders are not deleted, and the handoff files " +
                "(PROJECT_STATE, PLAN_LOG, CHECKPOINTS, DECISIONS) cannot be deleted. " +
                "Requires confirm=true. Check with list_files first; call git_commit beforehand if the file matters.",
            inputSchema: {
                path: z.string().min(1).describe("File path relative to the workspace root."),
                confirm: z.boolean().default(false).describe("Must be true to confirm the permanent deletion."),
            },
        },
        async ({ path: p, confirm }) => {
            try {
                const abs = await resolveSafe(p);
                if (abs === WORKSPACE_ROOT) return fail("Cannot delete the workspace root.");
                assertCanDelete(abs);
                if (!confirm) return fail("Not deleted: set confirm=true to confirm this permanent deletion.");
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