# PLAN_LOG: MCP File-Server Connector (Midterms Pt 1)

Format: date · milestone · what was done · decisions and why · evidence · next.

---

## M1 Skeleton Done

**Done**
- Project scaffolded: Node.js + TypeScript, official MCP TypeScript SDK (pinned to v1), express, zod.
- Streamable HTTP endpoint at `POST /mcp`; GET and DELETE return 405.
- One tool, `list_files`, lists the workspace root (no arguments).
- Layout split into `config.ts`, `server.ts`, `tools/` and `index.ts`.

**Decisions**
- SDK v1 pinned: a v2 line exists, but v1 has stable, well-documented APIs. Revisit v2 as a stretch.
- Stateless transport (new server and transport per request): no in-memory state, so it survives a process restart.
- Bind to 127.0.0.1 only: the tunnel reaches it locally, the LAN cannot.
- `list_files` took no path argument in M1, so it could not leave the workspace. Path input comes with the M2 sandbox.
- `workspace/` is git-ignored: it is agent working data, not source.

**Evidence**
- MCP Inspector v2.11.0 connected over Streamable HTTP; `list_files` returned `dir demo` and `file hello.txt`.
![m1 mcp inspector part 4.png](log-images/m1%20mcp%20inspector%20part%204.png)
- Issue hit: Inspector showed "unauthorized" until opened with its auth token. Used 127.0.0.1 rather than localhost to avoid IPv6 resolution problems on Windows.
![m1 mcp inspector part 2.png](log-images/m1%20mcp%20inspector%20part%202.png)


## 10-17-2026 · M2 Sandbox · DONE

**Plan**
- All paths go through one `resolveSafe()` choke point, so no tool can forget the check.
- Layers: reject absolute paths, drive letters (`:`) and null bytes; resolve against the root; check containment; `realpath` check on the path or its nearest existing parent to catch symlinks and junctions.
- Tools: list_files (now with path), read_file, write_file, str_replace, delete_file.
- Efficiency by design: read_file returns max 200 lines per call with a "more" hint; write_file refuses to overwrite unless overwrite=true, so agents read before writing.
- Errors returned via isError with short messages; no absolute paths or stack traces.

**Progress**
- Part 1 DONE: `resolveSafe` and `tests/sandbox.test.ts` written and committed.
- Part 2 IN PROGRESS: five tools and registration in `server.ts`.

**Evidence**
- `npm test`: 18 of 18 passing. Rejected: `../` and `..\` traversal, `demo/../../` tricks, absolute paths, `C:\` and `C:foo`, UNC paths, null bytes, NTFS stream syntax (`file.txt:stream`), and a junction escape (existing and not-yet-created files). Accepted: `.`, `demo/new.txt`, `./a/b/c.txt`, and `..foo` (a valid filename, not traversal).
![m2 path traversal test pass.png](log-images/m2%20path%20traversal%20test%20pass.png)

- Inspector: ___ tools listed (expect 5); blocked calls tested: `..`, `C:\`, `../package.json` (results: ___)

- list_files
![m2 mcp inspector list_files.png](log-images/m2%20mcp%20inspector%20list_files.png)

- read_file
![m2 mcp inspector read_file.png](log-images/m2%20mcp%20inspector%20read_file.png)

- write_file
![m2 mcp inspector write_file 1.png](log-images/m2%20mcp%20inspector%20write_file%201.png)
![m2 mcp inspector write_file 2.png](log-images/m2%20mcp%20inspector%20write_file%202.png)

- str_replace
![m2 mcp inspector str_replace.png](log-images/m2%20mcp%20inspector%20str_replace.png)

- delete_file
![m2 mcp inspector delete_file.png](log-images/m2%20mcp%20inspector%20delete_file.png)


**Known limit (for threat notes)**
- Small time-of-check/time-of-use gap between the path check and the file operation. Accepted for this project; noted in the report.

**Issues hit**
- `New-Item` failed because the tool files already existed. No code was lost, and I pasted the code into the existing files without using `-Force`.

**Next**
- Finish Part 2: Inspector verification, then commit.
- M3: ngrok static domain, pm2, connect a real client.

## 10-17-2026 · M3 Deploy · DONE

**Plan**
- Secret path segment `/mcp/<64 hex chars>` loaded from `.env`; server refuses to boot without a secret of at least 32 characters; the secret is never printed in logs.
- ngrok static domain (`try-relish-trimester.ngrok-free.dev`) forwarding to 127.0.0.1:3000.
- pm2 runs the server and the tunnel with autorestart (`ecosystem.config.cjs`).
- Real client: Claude Desktop custom connector.

**Progress**
- Secret-path guard added and committed; config moved to `.env` (git-ignored), `.env.example` holds placeholders only.
- ngrok tunnel online; server and tunnel both running under pm2.
- Claude Desktop connected with sign-in set to "No sign-in"; it lists all 5 tools.
- `app.disable("x-powered-by")` added to stop advertising Express.

**Decisions**
- Secret path chosen over OAuth: the simplest option that meets "public endpoint needs a secret or token". Tradeoff: the secret is part of the URL, so it can leak via logs, screenshots or connector settings. Upgrade path: bearer token in an `Authorization` header, or OAuth (stretch).
- Claude connector authentication set to "No sign-in", because the server has no OAuth flow and uses the secret path like an API key.
- Server bound to 127.0.0.1 only; the tunnel is the only way in from outside.
- Client-side tool permissions in Claude Desktop: list_files and read_file set to always allow (read-only, fewer approval clicks); write_file, str_replace and delete_file set to needs approval (they change files). Server-side guards come in M4.

**Evidence**
- Wrong-secret request through the public URL: HTTP 404 with Express's own `Cannot POST /mcp/wrongsecret` page (`X-Powered-By: Express`, no ngrok error code), so the request reached my server and was rejected there.
- pm2 status: `mcp-server` and `mcp-tunnel` both online; manual stop/start of mcp-server worked; `pm2 save` stored the process list.
- Crash test: killed mcp-server (PID 19808) with `Stop-Process -Force`. pm2 restarted it within 3 s: new PID 24160, restart count 1. mcp-tunnel was unaffected (0 restarts).
- Claude Desktop connector `ascent-files` connected; 5 tools shown (delete_file, list_files, read_file, str_replace, write_file).
- Multi-step test in Claude Desktop (free plan): list_files, write_file (notes/ folder created automatically), read_file, str_replace, read_file. Final content verified as "hello".
- Public endpoint verified with curl and with Claude Desktop; not separately tested in Inspector.

**Issues hit and fixes**
- Inspector returned a 404 because the connection URL still contained placeholder text instead of the real secret from `.env`. Fix: copy the actual value from `.env` into the URL.
- First public curl test used a placeholder domain instead of my real ngrok domain and got `ERR_NGROK_3200`. Always substitute the real domain from the ngrok dashboard.
- Second curl test also returned `ERR_NGROK_3200` because the tunnel was not running. After starting it, the request reached Express (404 `Cannot POST`).
- Inspector showed "Failed to fetch" because the Inspector process itself was not running, not because of the server or the tunnel.
- `pm2 jlist | ConvertFrom-Json` failed in Windows PowerShell (duplicate `username`/`USERNAME` keys). Fix: use `pm2 pid mcp-server`.
- Secret exposure: a real secret value was pasted into `.env.example` and into a chat. Treated as burned and rotated (see Security notes).

**Security notes (for report)**
- Secret rotated on 2026-10-17 after the original was exposed (pasted into `.env.example` and into a chat). The new value lives only in `.env`.
- Rotation procedure: generate a new value, update `.env` only, `pm2 restart mcp-server`, update the Claude connector URL, confirm the old URL returns 404.
- Git history check for the old secret (`git log -S`): not run. Open item.
- Secret-in-URL risk: visible in the connector screen, ngrok request viewer, and any screenshot. Blur it in all evidence.
- Public surface limited to the workspace root through `resolveSafe()`; the TOCTOU gap from M2 still applies.

## 10-17-2026 · M4 Hardening, Audit & Git-Lite · DONE

**Plan**
- Guards: append-only files (`PLAN_LOG.md`, `CHECKPOINTS.md`, `DECISIONS.md`), handoff files protected from deletion (`PROJECT_STATE.md` + append-only), null-byte check (`assertTextContent`).
- Block `.git` access and Windows 8.3 short names (`NAME~1`) in `resolveSafe`.
- Audit log: wrap MCP server tools to log timestamp, tool name, sanitized args (bulky content truncated to character count), success/failure status, execution time in ms, and error messages to `logs/calls.jsonl` outside the workspace.
- Tools: `append_file`, `git_status`, `git_diff` (truncated at 8000 chars, supports `--stat`), and `git_commit` (`--no-verify`).
- Server startup auto-initializes workspace git repository (`ensureRepo`).
- Handoff protocol specification and template files in `workspace/`.

**Progress**
- `src/guards.ts` implemented with `assertCanRewrite`, `assertCanDelete`, and `assertTextContent`.
- `src/sandbox.ts` updated with `assertNotReserved` blocking `.git` and 8.3 short names.
- `src/tools/util.ts` updated with `toToolError` mapping `GuardError`, `SandboxError`, and `GitError`.
- `src/tools/writeFile.ts`, `src/tools/strReplace.ts`, `src/tools/deleteFile.ts`, and `src/tools/listFiles.ts` tightened with guards and `.git` hiding.
- `src/audit.ts` added and integrated into `src/server.ts` via `withAudit`.
- `src/git.ts` and `src/tools/gitTools.ts` implemented and registered in `server.ts`.
- `src/index.ts` calls `ensureRepo()` prior to starting the HTTP server.
- Workspace git repo initialized with baseline and clean demo handoff files.

**Evidence**
- `npm test`: 41 of 41 tests passing (`tests/sandbox.test.ts` and `tests/guards.test.ts`).
  - Guards tested: rewrites refused for append-only files, deletes refused for handoff files, null-bytes refused for content.
  - Sandbox tested: traversal escapes rejected, `.git` paths rejected (`.git/config`, `.GIT/hooks/pre-commit`, `demo/.git/config`, `.git./config`), 8.3 names rejected (`GIT~1/config`, `PLAN_L~1.MD`), valid paths accepted (`.gitignore`, `.github/workflows/x.yml`, `notes.git/readme.txt`).
- `npm run build`: `tsc` compiles with 0 errors.
- `pm2 status`: both `mcp-server` and `mcp-tunnel` online.
- `git -C workspace status --short --branch`: clean (`## main`).
- `git -C workspace log --oneline`: shows commits `M4 baseline` and `reset demo handoff files before M5`.
- `logs/calls.jsonl`: verified lines record `tool`, `args` (`<N chars>`), `ok`, `ms`, and errors without leaking secrets or file contents.
- Repo hygiene: `git status` clean; no secrets found in `BUILD_LOG.md`; no `.env`, `logs/`, or `workspace/` files tracked.

**Decisions**
- Workspace has an independent git repo isolated from the outer project git repo.
- Commit operations use `--no-verify` as defense-in-depth alongside sandbox `.git` blocking.
- `logs/` directory placed outside `workspace/` and ignored in `.gitignore` so agent sessions cannot alter or delete the audit log.

---

## 2026-10-17 · M5 Prove it · IN PROGRESS

**Plan**
- Role-scoped endpoints: one secret URL per role, tool sets enforced by the server (worker 8 tools, reviewer 5, admin 9). Audit log entries carry the role.
- Multi-session demo task across worker and reviewer sessions; evidence copied to `evidence/demo-run/`.

**Decisions**
- Roles are enforced server-side, so a client cannot enable a tool its role does not have. Only admin has delete_file.

**Known limit (threat notes)**
- The reviewer's append_file can still add text to any workspace file. Narrowing it to log files is a stretch item.

**Evidence**
- Inspector: worker URL lists 8 tools (all except delete_file), reviewer URL lists 5 tools (list_files, read_file, append_file, git_status, git_diff), admin URL lists all 9 tools.
- `npm test`: 45 of 45 passing.


