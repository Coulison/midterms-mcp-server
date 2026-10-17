import type { Role } from "./roles.js";

const COMMON = [
  "HANDOFF PROTOCOL (sessions never talk directly; state lives in files).",
  "- Resume from PROJECT_STATE.md (returned below). Do not read HANDOFF.md unless something here is unclear.",
  "- Uncommitted changes you did not make usually mean the last session ended early: check git_diff.",
  "  Exception: after a reviewer session, uncommitted appends to PLAN_LOG.md and CHECKPOINTS.md are expected.",
  "- Read before you write. Make independent calls together in one step (use read_files for several files).",
  "  Never re-read a file you already have. Do not retry a failed call unless you changed something.",
  "- PLAN_LOG.md, CHECKPOINTS.md and DECISIONS.md are append-only: use append_file. Never delete handoff files.",
  "- Write ONE PLAN_LOG entry per session, at the end (plan and result together).",
];

const END: Record<Role, string[]> = {
  worker: [
    "END OF SESSION (worker):",
    "1. Append your result to PLAN_LOG.md.",
    "2. Append to CHECKPOINTS.md if a milestone was reached; to DECISIONS.md if you made a choice others must respect.",
    "3. Rewrite PROJECT_STATE.md (under 40 lines), then call git_commit with a message like 'session 2: <what changed>'.",
  ],
  reviewer: [
    "END OF SESSION (reviewer):",
    "1. Append numbered findings (or 'no issues found') to PLAN_LOG.md.",
    "2. Append a short entry to CHECKPOINTS.md: what is ready, and the next step for the worker.",
    "3. Do not edit PROJECT_STATE.md and do not commit; the next worker does both.",
  ],
  admin: [
    "END OF SESSION (admin): keep PROJECT_STATE.md current and commit your work with git_commit.",
  ],
};

export const protocolFor = (role: Role) => [...COMMON, ...END[role]].join("\n");
