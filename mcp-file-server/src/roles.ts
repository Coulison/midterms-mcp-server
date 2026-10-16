export type Role = "admin" | "worker" | "reviewer";

export const ROLE_TOOLS: Record<Role, readonly string[]> = {
  admin: [
    "list_files", "read_file", "write_file", "str_replace", "delete_file",
    "append_file", "git_status", "git_diff", "git_commit",
  ],
  worker: [
    "list_files", "read_file", "write_file", "str_replace",
    "append_file", "git_status", "git_diff", "git_commit",
  ],
  reviewer: ["list_files", "read_file", "append_file", "git_status", "git_diff"],
};
