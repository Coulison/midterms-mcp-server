import { test } from "node:test";
import assert from "node:assert/strict";
import { assertCanRewrite, assertCanDelete, assertTextContent, GuardError } from "../src/guards.js";

for (const p of ["PLAN_LOG.md", "projects/demo/plan_log.md", "CHECKPOINTS.md", "Decisions.MD", "PLAN_LOG.md."]) {
    test(`rewrite refused: ${p}`, () => assert.throws(() => assertCanRewrite(p), GuardError));
}
for (const p of ["PROJECT_STATE.md", "notes/a.txt", "PLAN_LOG_old.md"]) {
    test(`rewrite allowed: ${p}`, () => assert.doesNotThrow(() => assertCanRewrite(p)));
}
for (const p of ["PROJECT_STATE.md", "x/plan_log.md", "DECISIONS.md"]) {
    test(`delete refused: ${p}`, () => assert.throws(() => assertCanDelete(p), GuardError));
}
test("delete allowed: notes/a.txt", () => assert.doesNotThrow(() => assertCanDelete("notes/a.txt")));
test("null byte refused", () => assert.throws(() => assertTextContent("a\0b"), GuardError));
test("plain text accepted", () => assert.doesNotThrow(() => assertTextContent("hello\n")));