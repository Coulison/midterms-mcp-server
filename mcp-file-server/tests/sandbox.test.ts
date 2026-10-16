import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, mkdir, symlink, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { resolveSafe, SandboxError } from "../src/sandbox.js";

let base: string, root: string, outside: string;

before(async () => {
    base = await mkdtemp(path.join(os.tmpdir(), "sbx-"));
    root = path.join(base, "workspace");
    outside = path.join(base, "outside");
    await mkdir(root);
    await mkdir(outside);
    await mkdir(path.join(root, "demo"));
    await writeFile(path.join(outside, "secret.txt"), "secret");
    // A junction works on Windows without admin rights.
    await symlink(outside, path.join(root, "link"), "junction");
});

after(async () => {
    await rm(base, { recursive: true, force: true });
});

const bad = [
    "../outside/secret.txt",
    "..\\outside\\secret.txt",
    "demo/../../outside/secret.txt",
    "/etc/passwd",
    "C:\\Windows\\win.ini",
    "C:foo",
    "\\\\server\\share\\x",
    "a\0b",
    "file.txt:stream",
    "link/secret.txt",
    "link/newfile.txt",
    ".git/config",
    ".GIT/hooks/pre-commit",
    "demo/.git/config",
    ".git./config",
    "GIT~1/config",
    "PLAN_L~1.MD",
];
for (const p of bad) {
    test(`rejects ${JSON.stringify(p)}`, async () => {
        await assert.rejects(resolveSafe(p, root), SandboxError);
    });
}

for (const p of [
    ".",
    "",
    "demo",
    "demo/new.txt",
    "./a/b/c.txt",
    "..foo",
    ".gitignore",
    ".github/workflows/x.yml",
    "notes.git/readme.txt",
]) {
    test(`accepts ${JSON.stringify(p)}`, async () => {
        const abs = await resolveSafe(p, root);
        assert.ok(abs === root || abs.startsWith(root + path.sep));
    });
}

test("normalises inner ..", async () => {
    assert.equal(await resolveSafe("demo/../demo/x.txt", root), path.join(root, "demo", "x.txt"));
});