import path from "node:path";

export const PORT = Number(process.env.PORT ?? 3000);
export const WORKSPACE_ROOT = path.resolve(process.env.WORKSPACE_ROOT ?? "./workspace");