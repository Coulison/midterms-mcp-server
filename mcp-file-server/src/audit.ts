import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { LOG_DIR } from "./config.js";

const LOG_FILE = path.join(LOG_DIR, "calls.jsonl");
const BULKY = new Set(["content", "old_str", "new_str"]);

// Log what was asked for, not file contents.
export function summarize(args: unknown) {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries((args ?? {}) as Record<string, unknown>)) {
    if (typeof v === "string") out[k] = BULKY.has(k) ? `<${v.length} chars>` : v.slice(0, 120);
    else out[k] = v;
  }
  return out;
}

export async function audit(entry: Record<string, unknown>) {
  try {
    await mkdir(LOG_DIR, { recursive: true });
    await appendFile(LOG_FILE, JSON.stringify(entry) + "\n");
  } catch (err) {
    console.error("audit write failed:", err);
  }
}
