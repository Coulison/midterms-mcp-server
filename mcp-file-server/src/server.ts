import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { audit, summarize } from "./audit.js";
import { ROLE_TOOLS, type Role } from "./roles.js";
import { registerListFiles } from "./tools/listFiles.js";
import { registerReadFile } from "./tools/readFile.js";
import { registerReadFiles } from "./tools/readFiles.js";
import { registerWriteFile } from "./tools/writeFile.js";
import { registerStrReplace } from "./tools/strReplace.js";
import { registerDeleteFile } from "./tools/deleteFile.js";
import { registerAppendFile } from "./tools/appendFile.js";
import { registerGitTools } from "./tools/gitTools.js";
import { registerSessionStart } from "./tools/sessionStart.js";

const BASE_INSTRUCTIONS =
  "Shared workspace with a handoff protocol. Start every session by calling session_start with the project name: " +
  "it returns the protocol, PROJECT_STATE.md and git status in one call. Read before you write, and make independent " +
  "calls together (read_files reads several files at once). PLAN_LOG.md, CHECKPOINTS.md and DECISIONS.md are " +
  "append-only: use append_file.";

const ROLE_NOTE: Record<Role, string> = {
  admin: " Role: admin (all tools).",
  worker:
    " Role: worker. You can read, write, edit, append and commit; you cannot delete files. " +
    "End every session by rewriting PROJECT_STATE.md and calling git_commit.",
  reviewer:
    " Role: reviewer. You are read-only apart from append_file: record findings in PLAN_LOG.md, " +
    "CHECKPOINTS.md or DECISIONS.md. Do not edit other files and do not commit; the next worker session applies fixes.",
};

// Wrap registerTool so every call is written to logs/calls.jsonl, tagged with the role.
function withAudit(server: McpServer, role: Role) {
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
          role,
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
          role,
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

export function createServer(role: Role = "admin") {
  const server = new McpServer(
    { name: "ascent-file-server", version: "0.6.0" },
    { instructions: BASE_INSTRUCTIONS + ROLE_NOTE[role] }
  );
  withAudit(server, role);
  const allow = (name: string) => ROLE_TOOLS[role].includes(name);
  if (allow("session_start")) registerSessionStart(server, role);
  if (allow("read_files")) registerReadFiles(server);
  if (allow("list_files")) registerListFiles(server);
  if (allow("read_file")) registerReadFile(server);
  if (allow("write_file")) registerWriteFile(server);
  if (allow("str_replace")) registerStrReplace(server);
  if (allow("delete_file")) registerDeleteFile(server);
  if (allow("append_file")) registerAppendFile(server);
  registerGitTools(server, allow);
  return server;
}