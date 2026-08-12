# Public Beta Backup and Recovery

## Status and Purpose

This is the operational baseline for independent Cyberly MySQL logical backups during the bounded Public Beta. It complements Aiven-managed backups; it does not replace provider disaster recovery or point-in-time recovery.

Logical dumps are **high-sensitivity learner data**. They may contain names, email addresses, profiles, assessment and progress history, chat content, verification state, and account state.

## PB-OPS-3D Acceptance Record

**PB-OPS-3D - Public Beta Backup and Recovery Baseline:** ACCEPTED on 12 August 2026.

- MySQL Community Server `mysqldump` 8.4.11 was available to the owner.
- The staging backup prerequisite check passed with verified TLS configuration.
- The first independent staging logical backup completed successfully with a size of 89,806 bytes.
- Its SHA-256 companion was generated and independently verified as a match.
- The backup and checksum remained under the Git-ignored `backups/private/` path and were not inspected for SQL content.
- Staging health returned `{"ok":true}`.
- Migration status confirmed migrations `001` through `027` applied, with 27 of 27 applied.
- Content verification passed: 12 Assessment questions across four topics, eight published Scenario definitions with 24 steps, and nine published Resources including six RAG-eligible Resources.
- RAG remained populated with 18 documents and 90 chunks.
- The backup performed a read from Aiven. It did not run migrations, ingest RAG, restore a database, or mutate learner data.

This acceptance proves independent logical-backup tooling, one successful staging logical backup, checksum integrity, safe Git exclusion, and a documented separate-target recovery policy. It does not prove point-in-time recovery, a successful logical restore, multi-region disaster recovery, production deployment, or unlimited retention.

## Recovery Classes

Reconstructable system data includes the schema from numbered migrations, deterministic seed content, and derived RAG documents/chunks. RAG can be rebuilt from reviewed Resource content with the existing deterministic ingestion process.

Irreplaceable persistent data includes users, learner profiles, assessment attempts/results, Scenario attempts/results, progress, recommendations, chat history/messages, email verification state, Agentic execution traces, and other learner-owned state. Independent backups primarily protect this class. Seed scripts must not be run over learner data as an improvised recovery procedure.

## Backup Contract

The owner-invoked command creates:

```text
backups/private/cyberly-staging-YYYYMMDD-HHMMSSZ.sql.gz
backups/private/cyberly-staging-YYYYMMDD-HHMMSSZ.sql.gz.sha256
```

The directory is Git-ignored. Filenames use UTC and contain no host, username, or credential. The dump includes schema, data, migration history, triggers, and routines. It uses `--single-transaction`, `--quick`, UTF-8, and `--set-gtid-purged=OFF`. Compression streams through Node's built-in gzip implementation rather than loading the database into memory.

## Prerequisites and Backup Procedure

1. Install a MySQL 8-compatible client providing `mysqldump`.
2. Maintain the private `server/.env.staging.local` file described by the staging configuration contract. Never print or commit it.
3. Require `NODE_ENV=production`, `DB_SSL_MODE=required`, a non-empty `DB_SSL_CA`, and `DB_SSL_REJECT_UNAUTHORIZED=true`.
4. Run the offline prerequisite check:

   ```powershell
   npm --prefix server run backup:staging:check
   ```

5. Run the owner-invoked backup:

   ```powershell
   npm --prefix server run backup:staging
   ```

The script supplies credentials through a temporary restrictive MySQL option file, supplies the CA through a temporary restrictive file, and uses `VERIFY_IDENTITY`. Both temporary files are removed in cleanup. The password and certificate are not command-line arguments or summary output.

If `mysqldump`, TLS validation, compression, or output fails, the command exits unsuccessfully and removes incomplete dump/checksum files. Preserve the error category privately; never publish credentials or environment contents.

The command refuses to overwrite an existing backup or checksum with the same timestamp.

## Integrity Verification

The `.sha256` companion detects corruption or incomplete transfer; it is not encryption. Verify the checksum after copying a backup to private storage and again before recovery. On Windows, an owner may use:

```powershell
$expected = (Get-Content '<backup>.sha256').Split()[0]
$actual = (Get-FileHash '<backup>.sql.gz' -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actual -ne $expected) { throw 'Backup checksum mismatch.' }
```

## Private Storage and Retention

| Option | Public Beta assessment |
| --- | --- |
| Owner-controlled encrypted local drive | Best primary option for the first approximately 50 learners: simple recovery access, no public sharing surface, and clear physical/account ownership. Device loss must be covered by a secondary copy. |
| Private Google Drive | Operationally simple, but accidental link sharing and inherited folder permissions require careful review. Use only with a private owner account, multi-factor authentication, and no shared folder. |
| Private cloud object storage | Strong secondary option with explicit access control and future retention automation, but setup and recovery are more complex. Public access must remain disabled. |
| Another private owner-controlled location | Acceptable only after documenting encryption, access ownership, retention, and recovery access. |

Primary recommendation for the first approximately 50 learners: an owner-controlled encrypted local drive with OS account protection and restricted access. Keep a secondary copy in private cloud object storage with access restricted to the owner and multi-factor authentication. Do not use public links or shared folders.

Start with one daily independent backup retained for seven days. Add four weekly copies only after storage size and operational effort are measured. Retention deletion is intentionally not automated yet. Never delete the newest valid backup, and do not delete any backup until a later dry-run cleanup process is tested.

Backup files must never be committed to Git, attached to public issues, pasted into ChatGPT/Codex, sent through ordinary public links, or stored in a publicly accessible folder.

## Separate-Target Recovery Procedure

1. Stop learner writes or make an explicit maintenance decision.
2. Preserve the affected database; do not overwrite or delete it.
3. Provision a separate recovery MySQL target.
4. Confirm the target is not the current staging or production database and require verified TLS.
5. Verify the backup SHA-256 before decompression/import.
6. Restore the logical dump only into the separate recovery target using a MySQL 8-compatible client and a private temporary option-file strategy.
7. Run migration status and content verification against the recovery target.
8. Compare safe table counts and selected owner-controlled learner records without publishing private data.
9. Verify authentication implications. Restored sessions may be invalid if `SESSION_SECRET` differs; do not rotate that secret casually.
10. Point the application at the recovered database only after explicit owner approval and a configuration review.
11. Retain the original affected database until recovery is accepted.

No automated restore command is provided because an ambiguous target or confirmation mistake could overwrite the only staging copy.

## Known Limitations

- A logical backup is not point-in-time recovery.
- Backup age determines potential data loss.
- Backup success and checksum validity do not prove that restoration succeeds.
- A future controlled recovery exercise must target a separate database.
- The owner must periodically verify that backups exist, have non-zero size, and pass checksum verification.
- Independent logical backup does not replace Aiven infrastructure recovery.
- The current baseline does not encrypt backup files itself; privacy depends on encrypted, access-controlled storage.
- POSIX file modes are requested for temporary credentials and output; on Windows, effective protection also depends on the owner account and inherited NTFS permissions.
