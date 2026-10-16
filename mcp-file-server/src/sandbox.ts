import path from "node:path";
import { realpath } from "node:fs/promises";
import { WORKSPACE_ROOT } from "./config.js";

export class SandboxError extends Error { }

function isInside(root: string, target: string): boolean {
    const rel = path.relative(root, target);
    if (rel === "") return true;
    return rel !== ".." && !rel.startsWith(".." + path.sep) && !path.isAbsolute(rel);
}

function assertNotReserved(root: string, resolved: string) {
    const rel = path.relative(root, resolved);
    if (!rel) return;
    for (const seg of rel.split(path.sep)) {
        const s = seg.replace(/[. ]+$/, "").toLowerCase();
        if (s === ".git")
            throw new SandboxError("Access to .git is not allowed. Use the git_* tools.");
        if (/^[^.]{1,6}~\d+(\.[^.]*)?$/.test(s))
            throw new SandboxError("Windows short (8.3) names like NAME~1 are not allowed.");
    }
}

export async function resolveSafe(userPath: string, root: string = WORKSPACE_ROOT): Promise<string> {
    if (userPath.includes("\0")) throw new SandboxError("Path contains a null byte.");
    if (userPath.includes(":"))
        throw new SandboxError("Path must not contain ':' (drive letters and streams are not allowed).");

    const cleaned = userPath.replace(/\\/g, "/");
    if (cleaned.startsWith("/") || path.isAbsolute(cleaned))
        throw new SandboxError("Use a path relative to the workspace root, not an absolute path.");

    const resolved = path.resolve(root, cleaned);
    if (!isInside(root, resolved)) throw new SandboxError("Path escapes the workspace root.");
    assertNotReserved(root, resolved);

    // Symlink / junction check: walk up to the nearest existing ancestor.
    const realRoot = await realpath(root);
    let probe = resolved;
    for (; ;) {
        try {
            const real = await realpath(probe);
            if (!isInside(realRoot, real))
                throw new SandboxError("Path resolves outside the workspace (symlink or junction).");
            break;
        } catch (e) {
            if (e instanceof SandboxError) throw e;
            const code = (e as NodeJS.ErrnoException).code;
            if (code !== "ENOENT" && code !== "ENOTDIR") throw e;
            const parent = path.dirname(probe);
            if (parent === probe) break;
            probe = parent;
        }
    }
    return resolved;
}