import path from "node:path";
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { WORKSPACE_ROOT } from "../config.js";
import { git } from "../git.js";
import { resolveSafe } from "../sandbox.js";
import { ok, toToolError } from "./util.js";

const MAX_OUT = 8000;
const clip = (s: string) =>
  s.length > MAX_OUT ? s.slice(0, MAX_OUT) + `\n[truncated at ${MAX_OUT} characters: pass a path to narrow it]` : s;
const rel = (abs: string) => path.relative(WORKSPACE_ROOT, abs) || ".";

export function registerGitTools(server: McpServer) {
  server.registerTool(
    "git_status",
    {
      description:
        "Show uncommitted changes in the workspace (short format, with branch line). " +
        "Call at the start of a session: changes you did not make mean another session left work unfinished. " +
        "New files appear here but not in git_diff.",
    },
    async () => {
      try {
        return ok(clip((await git(["status", "--short", "--branch"])).trim()));
      } catch (err) {
        return toToolError(err);
      }
    }
  );

  server.registerTool(
    "git_diff",
    {
      description:
        "Show uncommitted line changes to tracked files. Pass a path to limit the output, or stat_only=true " +
        "for a summary. Output is cut at 8000 characters. New untracked files are not shown; use git_status.",
      inputSchema: {
        path: z.string().min(1).optional().describe("Limit the diff to this file or folder."),
        stat_only: z.boolean().default(false).describe("Only show which files changed and how much."),
      },
    },
    async ({ path: p, stat_only }) => {
      try {
        const args = ["diff", "--no-color", "--no-ext-diff", ...(stat_only ? ["--stat"] : [])];
        if (p) args.push("--", rel(await resolveSafe(p)));
        const out = (await git(args)).trim();
        return ok(out ? clip(out) : "(no changes in tracked files; use git_status for new files)");
      } catch (err) {
        return toToolError(err);
      }
    }
  );

  server.registerTool(
    "git_commit",
    {
      description:
        "Commit changes in the workspace with a message. Omit paths to commit everything, or list files/folders " +
        "to include. Do this at the end of every session so the next one starts from a clean state. " +
        "Says so if there is nothing to commit.",
      inputSchema: {
        message: z.string().min(3).max(200).describe("Short commit message, e.g. 'session 2: add intro section'."),
        paths: z.array(z.string().min(1)).max(50).optional().describe("Files or folders to include."),
      },
    },
    async ({ message, paths }) => {
      try {
        const targets: string[] = [];
        for (const p of paths ?? []) targets.push(rel(await resolveSafe(p)));
        await git(["add", "-A", "--", ...(targets.length ? targets : ["."])]);
        const staged = (await git(["diff", "--cached", "--name-only"])).trim();
        if (!staged) return ok("Nothing to commit: no changes.");
        await git(["commit", "-m", message, "--no-verify"]);
        const hash = (await git(["rev-parse", "--short", "HEAD"])).trim();
        return ok(`Committed ${hash}: ${staged.split("\n").length} file(s).`);
      } catch (err) {
        return toToolError(err);
      }
    }
  );
}
