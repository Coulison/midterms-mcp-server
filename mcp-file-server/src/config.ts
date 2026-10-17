import "dotenv/config";
import path from "node:path";

export const PORT = Number(process.env.PORT ?? 3000);
export const WORKSPACE_ROOT = path.resolve(process.env.WORKSPACE_ROOT ?? "./workspace");

export const MAX_LINES_PER_READ = 200;
export const MAX_READ_CHARS = 20_000;
export const MAX_FILE_BYTES = 1_000_000;

export const MCP_PATH_SECRET = process.env.MCP_PATH_SECRET ?? "";
export const LOG_DIR = path.resolve(process.env.LOG_DIR ?? "./logs");

export const ROLE_SECRETS = {
  admin: process.env.MCP_PATH_SECRET ?? "",
  worker: process.env.MCP_SECRET_WORKER ?? "",
  reviewer: process.env.MCP_SECRET_REVIEWER ?? "",
};

export const MAX_BATCH_FILE_CHARS = 8_000;