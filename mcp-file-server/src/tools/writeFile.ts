import { mkdir, stat, writeFile } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MAX_FILE_BYTES, WORKSPACE_ROOT } from "../config.js";
import { resolveSafe } from "../sandbox.js";
import { assertCanRewrite, assertTextContent } from "../guards.js";
import { fail, ok, toToolError } from "./util.js";

export function registerWriteFile(server: McpServer) {
    server.registerTool(
        "write_file",
        {
            description:
                "Create a new text file, or replace a whole file when overwrite=true. Parent folders are created. " +
                "By default it fails if the file already exists, so read the file first. " +
                "Refuses to replace a non-empty file with empty content, and cannot overwrite PLAN_LOG.md, " +
                "CHECKPOINTS.md or DECISIONS.md (use append_file). For small changes use str_replace.",
            inputSchema: {
                path: z.string().min(1).describe("File path relative to the workspace root."),
                content: z.string().describe("Full file content (UTF-8 text)."),
                overwrite: z.boolean().default(false).describe("Set true to replace an existing file."),
            },
        },
        async ({ path: p, content, overwrite }) => {
            try {
                const abs = await resolveSafe(p);
                if (abs === WORKSPACE_ROOT) return fail("Path must name a file, not the workspace root.");
                assertTextContent(content);
                const bytes = Buffer.byteLength(content, "utf8");
                if (bytes > MAX_FILE_BYTES) return fail(`Content is ${bytes} bytes, over the ${MAX_FILE_BYTES} byte limit.`);

                if (overwrite) {
                    assertCanRewrite(abs);
                    const existing = await stat(abs).catch(() => null);
                    if (existing && existing.size > 0 && content.trim() === "")
                        return fail("Refused: this would replace a non-empty file with empty content. Use delete_file if you mean to remove it.");
                }

                await mkdir(dirname(abs), { recursive: true });
                try {
                    await writeFile(abs, content, { encoding: "utf8", flag: overwrite ? "w" : "wx" });
                } catch (e) {
                    if ((e as NodeJS.ErrnoException).code === "EEXIST")
                        return fail("File already exists. Read it first, then retry with overwrite=true, or use str_replace.");
                    throw e;
                }
                return ok(`Wrote ${bytes} bytes to ${p}.`);
            } catch (err) {
                return toToolError(err);
            }
        }
    );
}