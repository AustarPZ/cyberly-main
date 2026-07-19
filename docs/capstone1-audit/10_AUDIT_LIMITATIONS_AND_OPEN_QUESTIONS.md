# 10. Audit Limitations and Open Questions

## Limitations

- This was a read-only audit. No browser session, live provider call, deployment, database query, RAG ingestion, or migration execution was performed.
- No secret values were read or printed. Environment analysis is based on example files and code references only.
- Repository claims cite files/modules, but detailed runtime behavior may still depend on the current local database state.
- Existing tests were inspected as evidence only; they were not run for this audit.
- The audit did not inspect generated folders such as `node_modules`, build output, or coverage.
- Root `src/` and root `public/` exist but are documented as legacy in `README.md`; this audit treats `client/` as the official frontend.
- Admin/CMS capabilities are partially implemented. Full Admin governance modules such as FAQ/Safety Summary management, Malaysia Guidance Management, AI Safety Evaluation workflow, Content Relationship editor, and workbook import workflow remain future-only.
- RAG currently centers on Resource content. FAQ, Safety Summary, Malaysia Guidance, and vector/hybrid retrieval are future-only.
- Learner-controlled action proposals currently use in-memory pending proposal storage. This is a known limitation for backend restarts or multi-instance deployment.
- Public deployment feasibility was assessed from code and configuration, not from an actual hosted deployment.

## Open Questions

1. Which managed MySQL provider will be used for the public demo or pilot?
2. Will frontend and backend share one domain/subdomain strategy, or use separate domains?
3. Should action proposals be persisted before any public pilot, or is a single-instance backend acceptable for Capstone demonstration?
4. What is the final Admin provisioning process for creating the first admin user without public self-registration?
5. Which AI providers will be enabled for the final demo: OpenAI only, or OpenAI plus diagnostic-only Gemini/ILMU?
6. Which Resource sources should remain RAG-ready after educator/source review?
7. When should FAQ, Safety Summary, and Malaysia Guidance tables be added?
8. Should future Learning Path versioning be implemented before adding more Scenarios?
9. What deployment logging policy is acceptable without exposing prompts, learner private data, provider diagnostics, or secrets?
10. Which manual browser acceptance checklist should be frozen for the final Capstone 1 demo?

## What Not To Claim Yet

- Do not claim the system is production-ready.
- Do not claim full autonomous Agentic AI.
- Do not claim exact source-level citation parsing; current citations show persisted reviewed sources provided to the model.
- Do not claim all Admin governance workflows are complete.
- Do not claim Malaysia-specific emergency/reporting guidance is fully governed unless reviewed official content is added and maintained.
- Do not claim Resource completion tracking exists.
- Do not claim public deployment has been performed as part of this audit.

