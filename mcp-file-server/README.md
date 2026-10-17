# MCP File-Server Connector

A sandboxed MCP file server that lets several agent sessions share one workspace and hand work to each other through files. Built for CS 3A/3B, Week 6, Midterms Pt 1.

**Stack:** Node.js + TypeScript, official MCP TypeScript SDK (v1), Streamable HTTP, zod validation, ngrok static domain, pm2.

## How it works

```
Claude Desktop (worker / reviewer / admin connector)
   | HTTPS  /mcp/<role secret>
ngrok static domain  -->  127.0.0.1:3000  (Express + MCP server, stateless)
                              |
                         workspace/   (sandbox root, its own git repo)
```

Each role has its own secret URL and gets its own set of tools. Every tool call is written to `logs/calls.jsonl`, tagged with the role.

## Requirements

- Windows with PowerShell, Node.js 20 or newer, git
- A free ngrok account with a static domain
- Claude Desktop (custom connectors) or MCP Inspector for testing

## Setup

Run all commands from the `mcp-file-server` folder.

1. **Install, test, build**
```powershell
   npm install
   npm test
   npm run build
```
   All tests should pass.

2. **Configure.** Copy the template and fill it in:
```powershell
   Copy-Item .env.example .env
```
   Generate each of the three secrets with this command (run it three times):
```powershell
   $b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); ($b | ForEach-Object { $_.ToString("x2") }) -join ""
```

   | Variable | Meaning |
   |---|---|
   | `MCP_PATH_SECRET` | secret path for the admin role (all 11 tools) |
   | `MCP_SECRET_WORKER` | secret path for the worker role |
   | `MCP_SECRET_REVIEWER` | secret path for the reviewer role |
   | `NGROK_DOMAIN` | your ngrok static domain, for example `name.ngrok-free.dev` |
   | `PORT` | local port (default 3000) |

   The server refuses to start unless all three secrets are set, at least 32 characters, and different from each other. Never commit `.env`.

3. **Tunnel.** Install ngrok and add your authtoken:
```powershell
   winget install ngrok.ngrok
   ngrok config add-authtoken <your-authtoken>
```
   Open a new PowerShell window afterwards so `ngrok` is on the path.

4. **Run it** under pm2:
```powershell
   npm install -g pm2
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 status
```
   Both `mcp-server` and `mcp-tunnel` should say `online`.

5. **Check it from outside:**
```powershell
   curl.exe -i -X POST https://<your-domain>/mcp/wrongsecret
```
   Expect `404` with `Cannot POST` in the body. If the body is an ngrok error page (`ERR_NGROK_3200`), the tunnel is not running.

6. **Connect a client.**
   - Claude Desktop: Settings, Connectors, Add custom connector. URL: `https://<your-domain>/mcp/<role secret>`. Set authentication to **No sign-in** (the secret in the URL is the credential).
   - MCP Inspector: run `npx @modelcontextprotocol/inspector`, open the link it prints, add a server of type Streamable HTTP with the same URL.

After code changes: `npm test`, `npm run build`, `pm2 restart mcp-server`.

## Roles and tools

| Role | Tools |
|---|---|
| admin (11) | all |
| worker (10) | session_start, list_files, read_file, read_files, write_file, str_replace, append_file, git_status, git_diff, git_commit |
| reviewer (7) | session_start, list_files, read_file, read_files, append_file, git_status, git_diff |

| Tool | Purpose |
|---|---|
| session_start | one call: role protocol + the project's PROJECT_STATE.md + git status |
| list_files | list one folder (not recursive) |
| read_file | read up to 200 lines per call, with a "more" hint |
| read_files | read up to 5 files in one call |
| write_file | create a file; replacing an existing one needs `overwrite=true` |
| str_replace | replace one exact, unique occurrence |
| delete_file | admin only; needs `confirm=true` |
| append_file | add text to the end of a file |
| git_status, git_diff, git_commit | version control inside `workspace/` |

## Handoff protocol

Agents never talk directly. They share state through files in `workspace/projects/<name>/`:

- `PROJECT_STATE.md`: rewritten each session; the only file a new session must read to resume
- `PLAN_LOG.md`, `CHECKPOINTS.md`, `DECISIONS.md`: append-only, so sessions cannot erase each other's entries

A session starts with `session_start`. The reviewer role cannot write or commit, so it hands off through the append-only logs, and the next worker session acts on them and commits. The full protocol is in `workspace/HANDOFF.md`.

## Evidence

`evidence/README.md` indexes everything. In short:

- `evidence/demo-run/`: a three-session run of a small writing task (30 tool calls, 0 errors)
- `evidence/demo-run-v2/`: the same task after adding `session_start` and `read_files` (19 calls, 0 errors, 37% fewer)
- `evidence/command-output/`: live tool counts per role, the sandbox and guard refusals, the crash test, test results

## Security model

- Every path goes through one `resolveSafe()`: relative paths only, no drive letters or null bytes, a containment check, and a `realpath` check against symlinks and junctions.
- `.git` and Windows 8.3 short names are unreachable from every file tool.
- The public URL needs a secret that differs per role; any other path returns 404.
- The handoff logs cannot be overwritten or deleted; `delete_file` is admin-only and needs `confirm=true`.
- The server listens on 127.0.0.1 only. Secrets live in `.env`, never in the repo.
- Every call is logged to `logs/calls.jsonl` (arguments summarised, file contents never logged).

Known limits:
- A secret in a URL can leak through logs and screenshots. If one leaks: generate a new value, update `.env`, run `pm2 restart mcp-server`, and update the connector URL.
- A small gap exists between checking a path and using it.
- `append_file` can add text to any file in the workspace, not only the logs.
- pm2 does not start itself after a Windows reboot. Run `pm2 resurrect` after signing in.

## Design choices

| Choice | Why | Alternative |
|---|---|---|
| Streamable HTTP, stateless | one connection point for several clients; nothing is held in memory, so a restart loses nothing | stdio (local only) |
| Secret path per role | simplest authentication that keeps the public endpoint closed; the role is decided by the URL | OAuth or a bearer token header |
| ngrok static domain | stable URL for the connector | Cloudflare Tunnel, a small VPS |
| pm2 | restarts crashes and keeps the tunnel running | systemd or Docker |
| SDK v1 pinned | stable, well-documented API | v2 |
| zod on every input | invalid calls are rejected before any code runs | hand-written checks |

## Repo layout

```
src/            server, sandbox, guards, roles, protocol, audit, tools
tests/          automated tests (sandbox, guards, roles)
scripts/        collect-evidence.mjs
evidence/       proof of the demo runs
ecosystem.config.cjs   pm2 configuration
BUILD_LOG.md    build diary, milestone by milestone
```

## Troubleshooting

- Inspector says "unauthorized": open the full link with the token it printed.
- "Failed to fetch" in Inspector: the Inspector process is not running.
- Use `127.0.0.1`, not `localhost` (IPv6 on Windows).
- ngrok `ERR_NGROK_3200`: the tunnel is offline; check `pm2 status`.
- `pm2 jlist | ConvertFrom-Json` fails in Windows PowerShell; use `pm2 pid mcp-server`.
- Garbled table borders in pm2 output: run `[Console]::OutputEncoding = [System.Text.Encoding]::UTF8` first.