import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { audit, summarize } from "./audit.js";
import { registerListFiles } from "./tools/listFiles.js";
import { registerReadFile } from "./tools/readFile.js";
import { registerWriteFile } from "./tools/writeFile.js";
import { registerStrReplace } from "./tools/strReplace.js";
import { registerDeleteFile } from "./tools/deleteFile.js";
import { registerAppendFile } from "./tools/appendFile.js";
import { registerGitTools } from "./tools/gitTools.js";

const INSTRUCTIONS =
  "Shared workspace with a handoff protocol. At the start of a session read HANDOFF.md, then the " +
  "project's PROJECT_STATE.md, and call git_status. Read before you write. PLAN_LOG.md, CHECKPOINTS.md and " +
  "DECISIONS.md are append-only: use append_file. End every session by updating PROJECT_STATE.md and calling git_commit.";

// Wrap registerTool so every call is written to logs/calls.jsonl.
function withAudit(server: McpServer) {
  const original = (server.registerTool as any).bind(server);
  (server as any).registerTool = (name: string, config: unknown, cb: (...a: any[]) => Promise<any>) =>
    original(name, config, async (...cbArgs: any[]) => {
      const t0 = Date.now();
      const args = cbArgs.length > 1 ? cbArgs[0] : {};
      try {
        const result = await cb(...cbArgs);
        const text = (result.content ?? []).map((c: any) => c.text ?? "").join("");
        void audit({
          ts: new Date().toISOString(),
          tool: name,
          args: summarize(args),
          ok: !result.isError,
          ms: Date.now() - t0,
          out_chars: text.length,
          ...(result.isError ? { error: text.slice(0, 160) } : {}),
        });
        return result;
      } catch (err) {
        void audit({
          ts: new Date().toISOString(),
          tool: name,
          args: summarize(args),
          ok: false,
          ms: Date.now() - t0,
          error: String((err as Error).message).slice(0, 160),
        });
        throw err;
      }
    });
}

export function createServer() {
  const server = new McpServer({ name: "ascent-file-server", version: "0.4.0" }, { instructions: INSTRUCTIONS });
  withAudit(server);
  registerListFiles(server);
  registerReadFile(server);
  registerWriteFile(server);
  registerStrReplace(server);
  registerDeleteFile(server);
  registerAppendFile(server);
  registerGitTools(server);
  return server;
}