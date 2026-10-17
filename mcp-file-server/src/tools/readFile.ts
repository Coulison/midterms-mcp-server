import { readFile, stat } from "node:fs/promises";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MAX_FILE_BYTES, MAX_LINES_PER_READ, MAX_READ_CHARS } from "../config.js";
import { resolveSafe } from "../sandbox.js";
import { ReadError } from "../guards.js";
import { ok, toToolError } from "./util.js";

export async function readChunk(
  p: string,
  startLine = 1,
  endLine?: number,
  maxChars = MAX_READ_CHARS
): Promise<string> {
  const abs = await resolveSafe(p);
  const st = await stat(abs);
  if (st.isDirectory()) throw new ReadError("That path is a folder. Use list_files.");
  if (st.size > MAX_FILE_BYTES)
    throw new ReadError(`File is ${st.size} bytes, over the ${MAX_FILE_BYTES} byte limit.`);

  const lines = (await readFile(abs, "utf8")).split(/\r?\n/);
  if (lines.at(-1) === "") lines.pop();
  const total = lines.length;
  if (total === 0) return `[${p}: empty file]`;
  if (startLine > total)
    throw new ReadError(`start_line ${startLine} is past the end (file has ${total} lines).`);

  const last = Math.min(endLine ?? Infinity, startLine + MAX_LINES_PER_READ - 1, total);
  let body = lines.slice(startLine - 1, last).join("\n");
  let footer = last < total ? `\n[more: call again with start_line=${last + 1}]` : "";
  if (body.length > maxChars) {
    body = body.slice(0, maxChars);
    footer = `\n[truncated at ${maxChars} characters: request a smaller line range]`;
  }
  return `[${p} lines ${startLine}-${last} of ${total}]\n${body}${footer}`;
}

export function registerReadFile(server: McpServer) {
  server.registerTool(
    "read_file",
    {
      description:
        `Read one text file, at most ${MAX_LINES_PER_READ} lines per call. ` +
        "Use start_line/end_line to page through long files. " +
        "The reply starts with a [lines a-b of N] header and says how to get the next chunk. " +
        "To read several files at once, use read_files instead. " +
        "Always read a file before editing it. Fails if the file is missing, a folder, or too large.",
      inputSchema: {
        path: z.string().min(1).describe("File path relative to the workspace root."),
        start_line: z.number().int().min(1).default(1).describe("First line to read (1-based)."),
        end_line: z.number().int().min(1).optional().describe("Last line to read (inclusive)."),
      },
    },
    async ({ path: p, start_line, end_line }) => {
      try {
        return ok(await readChunk(p, start_line, end_line));
      } catch (err) {
        return toToolError(err);
      }
    }
  );
}