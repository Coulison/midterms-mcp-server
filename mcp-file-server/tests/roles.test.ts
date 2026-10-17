import { test } from "node:test";
import assert from "node:assert/strict";
import { ROLE_TOOLS } from "../src/roles.js";

test("admin has all eleven tools", () => assert.equal(ROLE_TOOLS.admin.length, 11));
test("worker has ten and reviewer has seven", () => {
  assert.equal(ROLE_TOOLS.worker.length, 10);
  assert.equal(ROLE_TOOLS.reviewer.length, 7);
});
test("only admin can delete", () => {
  assert.ok(ROLE_TOOLS.admin.includes("delete_file"));
  assert.ok(!ROLE_TOOLS.worker.includes("delete_file"));
  assert.ok(!ROLE_TOOLS.reviewer.includes("delete_file"));
});
test("reviewer cannot write, replace or commit", () => {
  for (const t of ["write_file", "str_replace", "git_commit", "delete_file"])
    assert.ok(!ROLE_TOOLS.reviewer.includes(t), t);
});
test("every role can start a session, read in batches and append", () => {
  for (const role of Object.values(ROLE_TOOLS))
    for (const t of ["session_start", "read_files", "read_file", "append_file"]) assert.ok(role.includes(t), t);
});
