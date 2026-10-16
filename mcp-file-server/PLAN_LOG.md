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


## 2026-10-17 · M2 Sandbox · DONE

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

