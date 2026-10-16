import path from "node:path";

export class GuardError extends Error { }

// Logs that only grow. Agents add to them with append_file.
const APPEND_ONLY = new Set(["plan_log.md", "checkpoints.md", "decisions.md"]);
// Handoff files that must never be deleted.
const KEEP = new Set([...APPEND_ONLY, "project_state.md"]);

// Windows ignores case and trailing dots/spaces, so normalise before comparing.
const norm = (p: string) => path.basename(p).replace(/[. ]+$/, "").toLowerCase();

export function assertCanRewrite(p: string) {
    if (APPEND_ONLY.has(norm(p)))
        throw new GuardError(`${path.basename(p)} is append-only. Add to it with append_file.`);
}

export function assertCanDelete(p: string) {
    if (KEEP.has(norm(p)))
        throw new GuardError(`${path.basename(p)} is a handoff file and cannot be deleted.`);
}

export function assertTextContent(content: string) {
    if (content.includes("\0"))
        throw new GuardError("Content contains a null byte. Only text files are supported.");
}