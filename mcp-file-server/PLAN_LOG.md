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
- Issue hit: Inspector showed "unauthorized" until opened with its auth token. Used 127.0.0.1 rather than localhost to avoid IPv6 resolution problems on Windows.