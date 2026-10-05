# R3 staging accepted recovery reference

R4-02 was independently reviewed and accepted by Control Tower on 2026-10-05 (Asia/Kuala_Lumpur). This document is the operational recovery reference. Persistence is valid only when the develop documentation commit is verified at its expected ref and the canonical origin tag object and peeled commit are verified against their expected refs. This does not authorize deployment, database restore or production action. This operational reference complements the existing [Public Beta Backup and Recovery](../operations/public-beta-backup-recovery.md). [R4-01 canonical record](../../superpowers/plans/2026-10-02-owner-staging-convergence-r3.md) remains the governance / acceptance authority; this document is an operational recovery reference, not another R3 history.

## Baseline identity and Git relationship

- Baseline: `CYBERLY_R3_STAGING_ACCEPTED_BASELINE`.
- Exact commit: `f76195d76fd44be5f1bed5e0ef7b33dd997f449b`.
- Canonical annotated tag: `r3-staging-accepted-2026-10-03`.
- State: **R3 CLOSED / FROZEN; STAGING ACCEPTED; PRODUCTION NOT CERTIFIED**.
- Before every recovery, verify that the canonical origin tag `r3-staging-accepted-2026-10-03` resolves to `f76195d76fd44be5f1bed5e0ef7b33dd997f449b`. If the remote tag is unavailable, conflicting, moved or resolves elsewhere, STOP and report it. Do not recreate, move, force-update or silently substitute it. Use the exact commit fallback only through the documented controlled recovery procedure.

The tag has immutable intent: **DO NOT MOVE, FORCE-UPDATE OR DELETE without explicit Project Owner authorization**. Its name records the accepted release date; local tag preparation occurred on 2026-10-05.

At this reference's preparation, remote `master` = the accepted commit above; remote `develop` = `e8258fe770693f339aa2199ce5a37d301ff9d249` (R4-01 governance commit). `master` represents the frozen R3 staging release; `develop` is the Post-R3 development line. This difference is intentional, not drift requiring reconciliation. Future develop movement does not redefine the baseline. Do not advance master or deploy develop as part of recovery-reference preparation.

## Accepted staging deployment evidence

The following are Owner / Control Tower accepted historical results recorded in R4-01, not freshly queried Render results in R4-02:

| Component | Service | Service ID | Accepted deploy ID |
| --- | --- | --- | --- |
| Web | cyberly-staging-web | srv-d9tj5hu5djic73a0auk0 | dep-davth4rtqb8s73dohbdg |
| API | cyberly-staging-api | srv-d9tiop942hec738b3org | dep-davtgkrtqb8s73doflk0 |

Both accepted deployments: LIVE / VERIFIED at `f76195d76fd44be5f1bed5e0ef7b33dd997f449b`; API health PASS. R3 RF01 PASS; final client baseline **118/118 suites and 1412/1412 tests PASS**. These historical tests were not rerun in R4-02. Documentation commits require no staging redeploy.

## Database recovery evidence and limits

Private custody: `backups/private/`.

- Backup: `cyberly-staging-20261003-000012Z.sql.gz`.
- Known and locally measured size: **118061 bytes**.
- Sidecar: `cyberly-staging-20261003-000012Z.sql.gz.sha256`.
- SHA-256: `4a6109cf15c496669ca1a91db06c4498361412061f2c556b298c0b19aacf2bc9`.
- Previous independent verification: MATCH / PASS.
- R4-02 local verification on 2026-10-05: backup and sidecar present; computed SHA-256 matches sidecar: **PASS**. Only metadata, sidecar and hash were inspected; no SQL content was opened or published.

Accepted post-migration staging authority: **001–033 applied**, including `033_repair_verified_resource_sources.sql` APPLIED. This is the accepted staging migration state, not a claim that the earlier backup contains every post-migration change. Backup integrity does not prove restoration success or its precise migration/content state; inspect migration status in a confirmed isolated recovery target before using it operationally.

**Git rollback is not database rollback.** Checking out this code baseline does not reverse later migrations or learner-data changes. Do not infer a safe database rollback from a Git ref.

Backups contain sensitive learner data. Keep dump files private and Git-excluded. Do not include database credentials, provider secrets, Render tokens or connection URIs in recovery records.

## Safe source recovery into a new path

The 2026-10-01 recursive-deletion incident requires preserving the current/damaged workspace for evidence until separately reviewed. Do not overwrite, delete or clean that workspace. Do not use destructive reset, cleanup or recursive deletion as a recovery strategy.

1. Preserve the current workspace and evidence; establish a new, unused safe destination outside it. The placeholder below must be replaced with a reviewed absolute path; do not reuse an existing operational path.
2. From a healthy repository, fetch the origin and tags without force. Stop and report conflicting tags or unexpected authority; do not move the accepted tag.
3. Resolve the accepted tag from origin and verify its peeled commit equals the exact baseline; check the origin tag object and peeled ref with `git ls-remote origin 'refs/tags/r3-staging-accepted-2026-10-03*'` and compare the fetched local tag object and commit. If the tag is unavailable or conflicting, stop and report the condition. The exact commit procedure below remains the fallback for a controlled recovery into a new safe path; do not silently substitute it.
4. Create a detached worktree in the new destination, or a fresh clone into another new destination; preserve the original workspace.
5. Verify recovered HEAD, then run appropriate project checks before considering replacement of any operational workspace. These verification steps are future recovery work, not commands executed by R4-02.

Healthy-repository / tag pattern (PowerShell; `<NEW_SAFE_PATH>` is an unused reviewed absolute-path placeholder):

```powershell
git fetch origin --tags
git rev-parse 'r3-staging-accepted-2026-10-03^{commit}'
# STOP unless the result is f76195d76fd44be5f1bed5e0ef7b33dd997f449b.
git worktree add --detach '<NEW_SAFE_PATH>' r3-staging-accepted-2026-10-03
git -C '<NEW_SAFE_PATH>' rev-parse HEAD
# STOP unless HEAD is the exact accepted baseline.
```

If the original repository is damaged, use a fresh clone (PowerShell; `<NEW_SAFE_CLONE_PATH>` is another unused reviewed absolute-path placeholder):

```powershell
git clone --no-checkout https://github.com/AustarPZ/cyberly-main.git '<NEW_SAFE_CLONE_PATH>'
git -C '<NEW_SAFE_CLONE_PATH>' fetch origin --tags
git -C '<NEW_SAFE_CLONE_PATH>' cat-file -t f76195d76fd44be5f1bed5e0ef7b33dd997f449b
# STOP unless the exact object exists and is a commit.
git -C '<NEW_SAFE_CLONE_PATH>' checkout --detach f76195d76fd44be5f1bed5e0ef7b33dd997f449b
git -C '<NEW_SAFE_CLONE_PATH>' rev-parse HEAD
# STOP unless HEAD is the exact accepted baseline.
```

Do not copy private environments or learner-data backups into a shared recovery path. Source reconstruction alone is not a completed operational recovery.

## Staging, backup restoration and production Gates

Code recovery does not authorize Render deployment, database restore, migration rollback or production activation. Each requires a separate Control Tower / Project Owner Gate. No actual restoration or deployment is performed by R4-02.

Any future backup restoration test must first confirm a **CONFIRMED ISOLATED TEST DATABASE**, separate from current staging and production. Verify checksum before import; follow the existing separate-target recovery procedure, inspect restored migration status, and validate application/data compatibility before any separately authorized business or staging restoration action. Preserve the original database and workspace evidence.

Legacy production `cyberly` and `cyberly-api` remain **SUSPENDED / NOT CERTIFIED**. R4-01/R4-02 documentation and tag preparation do not authorize activation or production certification.
