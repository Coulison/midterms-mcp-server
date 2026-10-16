import { appendFile, mkdir, stat } from "node:fs/promises";
import { dirname } from "node:path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MAX_FILE_BYTES, WORKSPACE_ROOT } from "../config.js";
import { resolveSafe } from "../sandbox.js";
import { assertTextContent } from "../guards.js";
import { fail, ok, toToolError } from "./util.js";

export function registerAppendFile(server: McpServer) {
  server.registerTool(
    "append_file",
    {
      description:
        "Append text to the end of a file, creating it if missing. A trailing newline is added if absent. " +
        "Never touches existing content, so two sessions cannot erase each other's entries. " +
        "Use this for PLAN_LOG.md, CHECKPOINTS.md and DECISIONS.md, which cannot be overwritten.",
      inputSchema: {
        path: z.string().min(1).describe("File path relative to the workspace root."),
        content: z.string().min(1).describe("Text to add at the end of the file."),
      },
    },
    async ({ path: p, content }) => {
      try {
        const abs = await resolveSafe(p);
        if (abs === WORKSPACE_ROOT) return fail("Path must name a file, not the workspace root.");
        assertTextContent(content);
        const text = content.endsWith("\n") ? content : content + "\n";
        const add = Buffer.byteLength(text, "utf8");
        const current = await stat(abs).then((s) => s.size).catch(() => 0);
        if (current + add > MAX_FILE_BYTES)
          return fail(`Append would push the file over the ${MAX_FILE_BYTES} byte limit.`);
        await mkdir(dirname(abs), { recursive: true });
        await appendFile(abs, text, "utf8");
        return ok(`Appended ${add} bytes to ${p}.`);
      } catch (err) {
        return toToolError(err);
      }
    }
  );
}
