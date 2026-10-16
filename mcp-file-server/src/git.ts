import { execFile } from "node:child_process";
import { existsSync } from "node:fs";
import path from "node:path";
import { promisify } from "node:util";
import { WORKSPACE_ROOT } from "./config.js";

const run = promisify(execFile);

export class GitError extends Error {}

export async function git(args: string[]): Promise<string> {
  try {
    const { stdout } = await run("git", args, {
      cwd: WORKSPACE_ROOT,
      timeout: 15_000,
      maxBuffer: 1_000_000,
      windowsHide: true,
    });
    return stdout;
  } catch (e) {
    const err = e as NodeJS.ErrnoException & { stderr?: string };
    if (err.code === "ENOENT") throw new GitError("git is not installed or not on PATH for the server.");
    const first =
      String(err.stderr || err.message || "git failed").split(/\r?\n/).find((l) => l.trim()) ?? "git failed";
    const hidden = first
      .replaceAll(WORKSPACE_ROOT, "<workspace>")
      .replaceAll(WORKSPACE_ROOT.replaceAll("\\", "/"), "<workspace>");
    throw new GitError(hidden.slice(0, 300));
  }
}

export async function ensureRepo() {
  if (existsSync(path.join(WORKSPACE_ROOT, ".git"))) return;
  await git(["init", "-b", "main"]);
  await git(["config", "user.name", "MCP Agent"]);
  await git(["config", "user.email", "agent@mcp.local"]);
  await git(["config", "core.autocrlf", "false"]);
}
