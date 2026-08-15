# GitHub Branch Protection Settings

**Last updated:** 2026-04-22  
**Context:** Solo developer project — rules focus on CI gates and accidental self-destruction prevention, not team review workflows.

---

## Branch Hierarchy

```
feature-branch → dev → staging → main
```

All changes must flow in this direction. Never PR directly into `staging` or `main` from a non-dev branch. If a hotfix lands directly on `staging`, cherry-pick it back to `dev` immediately to prevent divergence.

---

## Rulesets

### `dev` — integration gate

| Rule                   | Setting                                                    | Why                                                                     |
| ---------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------- |
| Require linear history | ✅ ON                                                      | Feature branches are squashed in — keeps dev history clean              |
| Allowed merge methods  | Squash, Rebase                                             | Squash condenses messy feature commits; rebase for clean single commits |
| Require a pull request | ✅ ON                                                      | Ensures CI runs before anything lands on dev                            |
| Required approvals     | 0                                                          | Solo dev — self-merge is intentional                                    |
| Required CI checks     | Lint & Typecheck, Unit & Integration Tests, contract_local | All three must pass                                                     |
| Block force pushes     | ✅ ON                                                      | Prevents accidental history rewrites                                    |
| Require signed commits | ❌ OFF                                                     | Unnecessary overhead for solo dev                                       |

### `staging` — promotion gate

| Rule                       | Setting                                                    | Why                                                                                       |
| -------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Require linear history** | **❌ OFF**                                                 | Must be OFF — merge commits are required for promotion branches to preserve git ancestry  |
| **Allowed merge methods**  | **Merge commit**                                           | Preserves shared history between dev and staging; prevents conflicts on future promotions |
| Require a pull request     | ✅ ON                                                      | Audit trail for every promotion                                                           |
| Required approvals         | 0                                                          | Solo dev                                                                                  |
| Required CI checks         | Lint & Typecheck, Unit & Integration Tests, contract_local | Same gate as dev                                                                          |
| Block force pushes         | ✅ ON                                                      |                                                                                           |
| Require signed commits     | ❌ OFF                                                     |                                                                                           |

### `main` — release gate

| Rule                           | Setting                                                    | Why                                                       |
| ------------------------------ | ---------------------------------------------------------- | --------------------------------------------------------- |
| Require linear history         | ❌ OFF                                                     | Same reason as staging — merge commits needed             |
| Allowed merge methods          | Merge commit                                               | Preserves ancestry from staging                           |
| Require a pull request         | ✅ ON                                                      |                                                           |
| Required approvals             | 0                                                          | Solo dev — 1 approval would permanently block self-merges |
| Required CI checks             | Lint & Typecheck, Unit & Integration Tests, contract_local |                                                           |
| Require branches up to date    | ✅ ON                                                      | Ensures main always tests against latest                  |
| Block force pushes             | ✅ ON                                                      |                                                           |
| Require signed commits         | ✅ ON                                                      | Main is the release branch — signed commits matter here   |
| Require deployments to succeed | ❌ OFF                                                     | No deployment environments configured yet                 |

---

## Key Design Decision: Squash for feature→dev, Merge commit for promotions

**Feature branches → dev:** Use squash. Condenses 10 WIP commits into 1 clean commit on dev. Linear history stays readable.

**dev → staging → main:** Use merge commit. This is critical — squash merge on a promotion branch erases the shared git ancestry between the two branches. Every subsequent promotion PR will show conflicts on all files that differ, even if the content is identical. Merge commits preserve the ancestry so git knows exactly what's already been merged.

**The symptom of getting this wrong:** Every `dev → staging` PR shows conflicts on docs files even though nothing actually changed. Requires a `conflict/` temp branch workaround for every single promotion. This was the original problem with the GPT-5.3-generated setup.

---

## Conflict Resolution (if it happens again)

If `dev` and `staging` diverge (e.g. a hotfix was applied directly to staging):

```bash
# Create a temp branch from staging
git checkout -b promote/dev-to-staging origin/staging

# Regular merge (not squash) — preserves ancestry
git merge origin/dev

# Resolve conflicts (keep dev's versions for docs)
git checkout --theirs <conflicting-files>
git add <conflicting-files>
git commit

# Push and open PR to staging
git push origin promote/dev-to-staging
```

Open PR: `promote/dev-to-staging → staging`. After merging, delete the temp branch.
