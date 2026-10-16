import { SandboxError } from "../sandbox.js";
import { GuardError } from "../guards.js";

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

export function toToolError(err: unknown) {
    if (err instanceof SandboxError) return fail(`Blocked: ${err.message}`);
    if (err instanceof GuardError) return fail(`Refused: ${err.message}`);
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code && MESSAGES[code]) return fail(MESSAGES[code]);
    console.error("Unexpected tool error:", err);
    return fail("Unexpected server error. See server logs.");
}