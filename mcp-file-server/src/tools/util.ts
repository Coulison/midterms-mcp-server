import { SandboxError } from "../sandbox.js";
import { GuardError, ReadError } from "../guards.js";
import { GitError } from "../git.js";

export const ok = (text: string) => ({
  content: [{ type: "text" as const, text }],
});

export const fail = (text: string) => ({
  isError: true,
  content: [{ type: "text" as const, text }],
});

const MESSAGES: Record<string, string> = {
  ENOENT: "Not found. Use list_files to check the path.",
  ENOTDIR: "A parent in this path is a file, not a folder.",
  EISDIR: "That path is a folder, not a file.",
  EACCES: "Permission denied by the operating system.",
  EPERM: "Operation not permitted by the operating system.",
  EBUSY: "File is busy or locked. Try again.",
};

export function errorText(err: unknown): string {
  if (err instanceof SandboxError) return `Blocked: ${err.message}`;
  if (err instanceof GuardError) return `Refused: ${err.message}`;
  if (err instanceof GitError) return `Git error: ${err.message}`;
  if (err instanceof ReadError) return err.message;
  const code = (err as NodeJS.ErrnoException)?.code;
  if (code && MESSAGES[code]) return MESSAGES[code];
  console.error("Unexpected tool error:", err);
  return "Unexpected server error. See server logs.";
}

export const toToolError = (err: unknown) => fail(errorText(err));