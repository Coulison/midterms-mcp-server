import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { MAX_BATCH_FILE_CHARS } from "../config.js";
import { git } from "../git.js";
import { protocolFor } from "../protocol.js";
import type { Role } from "../roles.js";
import { readChunk } from "./readFile.js";
import { errorText, fail, ok } from "./util.js";

export function registerSessionStart(server: McpServer, role: Role) {
  server.registerTool(
    "session_start",
    {
      description:
        "Start a session in ONE call: returns your role's handoff protocol, the project's PROJECT_STATE.md and git status. " +
        "Call this first, instead of reading HANDOFF.md and PROJECT_STATE.md and running git_status separately. " +
        "Fails if the project folder or its PROJECT_STATE.md does not exist (use list_files on projects/).",
      inputSchema: {
        project: z
          .string()
          .regex(/^[A-Za-z0-9_-]{1,40}$/)
          .describe("Project folder name under projects/, for example 'demo2'."),
      },
    },
    async ({ project }) => {
      let state: string;
      try {
        state = await readChunk(`projects/${project}/PROJECT_STATE.md`, 1, undefined, MAX_BATCH_FILE_CHARS);
      } catch (err) {
        return fail(`Could not read PROJECT_STATE.md for project "${project}": ${errorText(err)}`);
      }
      let status: string;
      try {
        status = (await git(["status", "--short", "--branch"])).trim();
      } catch {
        status = "(git status unavailable)";
      }
      return ok(
        [`=== PROTOCOL (role: ${role}) ===`, protocolFor(role), `=== PROJECT_STATE ===`, state, `=== GIT STATUS ===`, status].join("\n\n")
      );
    }
  );
}
