import { readFile, writeFile } from "node:fs/promises";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { resolveSafe } from "../sandbox.js";
import { fail, ok, toToolError } from "./util.js";

export function registerStrReplace(server: McpServer) {
    server.registerTool(
        "str_replace",
        {
            description:
                "Replace one exact occurrence of old_str in a file with new_str. " +
                "old_str must appear exactly once or the call fails, so widen the match with surrounding text. " +
                "Read the file first so old_str matches exactly, including whitespace.",
            inputSchema: {
                path: z.string().min(1).describe("File path relative to the workspace root."),
                old_str: z.string().min(1).describe("Exact text to find. Must be unique in the file."),
                new_str: z.string().describe("Replacement text. May be empty to delete old_str."),
            },
        },
        async ({ path: p, old_str, new_str }) => {
            try {
                const abs = await resolveSafe(p);
                const text = await readFile(abs, "utf8");
                const first = text.indexOf(old_str);
                if (first === -1) return fail("old_str was not found. Re-read the file and copy the text exactly.");
                if (text.indexOf(old_str, first + 1) !== -1)
                    return fail("old_str appears more than once. Include more surrounding text to make it unique.");
                await writeFile(abs, text.slice(0, first) + new_str + text.slice(first + old_str.length), "utf8");
                return ok(`Replaced 1 occurrence in ${p}.`);
            } catch (err) {
                return toToolError(err);
            }
        }
    );
}