export type Role = "admin" | "worker" | "reviewer";

export const ROLE_TOOLS: Record<Role, readonly string[]> = {
  admin: [
    "session_start", "list_files", "read_file", "read_files", "write_file", "str_replace",
    "delete_file", "append_file", "git_status", "git_diff", "git_commit",
  ],
  worker: [
    "session_start", "list_files", "read_file", "read_files", "write_file", "str_replace",
    "append_file", "git_status", "git_diff", "git_commit",
  ],
  reviewer: [
    "session_start", "list_files", "read_file", "read_files", "append_file", "git_status", "git_diff",
  ],
};
