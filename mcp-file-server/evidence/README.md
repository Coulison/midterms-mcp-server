# Evidence index

| Path | What it shows |
|---|---|
| demo-run/ | Baseline three-session run (project demo): agents' handoff files, the kit, calls-demo-run.jsonl, workspace git log |
| demo-run-v2/ | Same task after adding session_start and read_files (project demo2) |
| command-output/tools-and-guards.txt | Live tools per role (11/10/7), sandbox and guard refusals, role separation, public endpoint check |
| command-output/session-summaries.txt | Per-session and per-call tables for both runs (30 vs 19 calls) |
| command-output/npm-test.txt | Automated tests |
| command-output/wrong-secret-public.txt | Request with a wrong secret through the public URL (Express 404) |
| command-output/crash-test.txt, pm2-status.txt | Process manager restarts a killed server; tunnel unaffected |
| command-output/*git-log.txt, tags.txt | Project and workspace history, baseline and demo2 tags |
| calls-all.jsonl | Complete audit log. It also contains refused guard probes and earlier test calls tagged admin/worker/reviewer, not only the demo runs |
| transcripts/ | Chat transcripts of the six sessions |
| screenshots/ | Inspector, connector and role-separation screenshots (secrets blurred) |
