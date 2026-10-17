import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MAX_BATCH_FILE_CHARS } from "../config.js";
import { readChunk } from "./readFile.js";
import { errorText, fail, ok } from "./util.js";

export function registerReadFiles(server: McpServer) {
  server.registerTool(
    "read_files",
    {
      description:
        "Read up to 5 text files in ONE call. Use it whenever you need several files that do not depend on each other. " +
        `Each file returns its first 200 lines (max ${MAX_BATCH_FILE_CHARS} characters) under its own header; ` +
        "a problem with one file does not stop the others. For long files or paging, use read_file.",
      inputSchema: {
        paths: z
          .array(z.string().min(1))
          .min(1)
          .max(5)
          .describe("File paths relative to the workspace root (1 to 5)."),
      },
    },
    async ({ paths }) => {
      const unique = [...new Set(paths)];
      const parts: string[] = [];
      let failures = 0;
      for (const p of unique) {
        try {
          parts.push(await readChunk(p, 1, undefined, MAX_BATCH_FILE_CHARS));
        } catch (err) {
          failures++;
          parts.push(`[${p}: ERROR] ${errorText(err)}`);
        }
      }
      const text = parts.join("\n\n=====\n\n");
      return failures === unique.length ? fail(text) : ok(text);
    }
  );
}
