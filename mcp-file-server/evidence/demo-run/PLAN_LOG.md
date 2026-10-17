# PLAN_LOG (append-only)
Entry format: ## <date> · session N · plan / actions / result

## Session 1 (worker) result
- Plan: read HANDOFF.md, PROJECT_STATE.md, git_status (clean), then source/notes.md; write kit/outline.md and kit/glossary.md from the notes only.
- Done: wrote projects/demo/kit/outline.md (7 sections; all 12 glossary terms appear) and projects/demo/kit/glossary.md (exactly 12 terms, as listed in the goal).
- Not done yet: quiz.md and README.md (session 3).
- For reviewer: check both files against source/notes.md and the definition of done.

## 2026-10-17 session 2 (reviewer): review of kit/outline.md and kit/glossary.md
Plan: read HANDOFF, PROJECT_STATE, git_status (clean, nothing uncommitted), then check both files against the Definition of done and source/notes.md.
Result: no issues found.
Checks passed:
- glossary.md has exactly 12 terms, matching the required list (host, client, server, tool, resource, prompt, JSON-RPC, stdio, Streamable HTTP, isError, N x M problem, shared workspace).
- Every glossary term appears in outline.md at least once.
- No claim in outline.md or glossary.md contradicts source/notes.md (numbers, roles, primitives, lifecycle, transports, tool design and orchestration all match).
- Nothing outside the source was introduced.
Not yet checkable (expected, not issues): quiz.md and README.md do not exist yet; session 3 must create them.
Reminder for session 3: quiz.md needs exactly 8 questions, each followed by an "Answer:" line and using at least one glossary term; README.md must link outline.md, glossary.md and quiz.md.

## 2026-10-17 session 3 (worker): reviewer findings, quiz.md, README.md
Plan: read HANDOFF, PROJECT_STATE, git_status/git_diff (only the expected reviewer appends in PLAN_LOG.md and CHECKPOINTS.md), act on the reviewer's entries, write quiz.md and README.md from source/notes.md, self-check the Definition of done, commit.
Reviewer findings: none, so no fixes were needed to outline.md or glossary.md.
Written: kit/quiz.md (exactly 8 questions, each followed by an "Answer:" line, each using glossary terms) and kit/README.md (links outline.md, glossary.md, quiz.md).
Definition of done self-check:
- All four files exist: yes.
- All 12 glossary terms defined: yes (12 numbered terms).
- Every glossary term appears in outline.md: yes (re-read the file).
- Quiz has exactly 8 questions, each with an answer: yes.
- No claim contradicts source/notes.md: yes (every quiz answer traces to the notes).
- Reviewer has no open issues: yes (session 2 logged none).
Result: Definition of done fully met. PROJECT_STATE.md set to done and committed.
