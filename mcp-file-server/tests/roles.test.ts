import { test } from "node:test";
import assert from "node:assert/strict";
import { ROLE_TOOLS } from "../src/roles.js";

test("admin has all nine tools", () => assert.equal(ROLE_TOOLS.admin.length, 9));
test("only admin can delete", () => {
  assert.ok(ROLE_TOOLS.admin.includes("delete_file"));
  assert.ok(!ROLE_TOOLS.worker.includes("delete_file"));
  assert.ok(!ROLE_TOOLS.reviewer.includes("delete_file"));
});
test("reviewer cannot write, replace or commit", () => {
  for (const t of ["write_file", "str_replace", "git_commit", "delete_file"])
    assert.ok(!ROLE_TOOLS.reviewer.includes(t), t);
});
test("every role can read and append", () => {
  for (const role of Object.values(ROLE_TOOLS)) {
    assert.ok(role.includes("read_file"));
    assert.ok(role.includes("append_file"));
  }
});
