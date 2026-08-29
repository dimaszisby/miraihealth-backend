# Workflow & Task Management

## Plan Mode Default

- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

## Branching Convention

- **Always create new branches off `dev`**, never off `main`
- Branch promotion order: `feature/* → dev → staging → main`
- Every subagent prompt for implementation must instruct: `branch off dev`

## Commit & PR Ownership

- **Claude does not commit, push, or open PRs.** Only the user does these — manually.
- This overrides any prior "commit when asked" guidance. If the user says "commit it," surface the suggested message and exact commands instead of running them.
- Branch creation (`git checkout -b`) and read-only git ops (`git status`, `git log`, `git diff`) are permitted.
- At the end of every completed task/ticket, **always provide a ready-to-use PR message** — title (Conventional Commits prefix) + body (what/why/how summary).
- **Hand over the message as a file, never as a pasted heredoc.** Write it to a path and give the user `git commit -F <path>`. Long `git commit -F- <<'EOF'` blocks look near-identical at the prompt and are recalled wholesale from shell history — that is how three commits on `dev` ended up sharing the subject `chore(dev-env): make local setup work from a fresh clone`, each carrying the wrong body. `squash_merge_commit_title` is `COMMIT_OR_PR_TITLE`, so a wrong subject propagates into the PR title and onto `dev`.
- A `commit-msg` hook runs commitlint against `commitlint.config.mjs`. It catches _malformed_ messages, not _wrong_ ones — every message in that incident was a valid Conventional Commit.

## Subagent Strategy

- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

## Self-Improvement Loop

- After ANY correction from the user: update `.claude/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review `.claude/lessons.md` at session start for relevant project

## Verification Before Done

- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

## Demand Elegance (Balanced)

- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

## Autonomous Bug Fixing

- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management Process

1. **Plan First**: Write plan to `docs/internal/todos/YYYY-MM-DD-todo-<title>.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to the same `docs/internal/todos/...` file
6. **Capture Lessons**: Update `.claude/lessons.md` after corrections

## Graphify Usage in Feature Implementation

When generating a prompt or implementing a feature from a plan/doc:

- Always mention **what concepts to query**, not just "use Graphify"
- Run `graphify query` on relevant concepts **before writing any code**
- Typical queries: how the target feature's use cases are structured, how repositories are wired in DI, how similar existing features are organized

**Template:**

```
Implement <feature> following the plan at <path/to/plan.md>.
Before writing any code, query the Graphify graph:
- graphify query "<concept A>"
- graphify query "<concept B>"
```

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Only touch what's necessary. No side effects with new bugs.
