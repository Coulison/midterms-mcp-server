import "dotenv/config";
import path from "node:path";

export const PORT = Number(process.env.PORT ?? 3000);
export const WORKSPACE_ROOT = path.resolve(process.env.WORKSPACE_ROOT ?? "./workspace");

export const MAX_LINES_PER_READ = 200;
export const MAX_READ_CHARS = 20_000;
export const MAX_FILE_BYTES = 1_000_000;

export const MCP_PATH_SECRET = process.env.MCP_PATH_SECRET ?? "";