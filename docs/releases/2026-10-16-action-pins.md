# GitHub Actions SHA pinning — 16/10/2026

Roadmap R14; application version remains **0.5.0**.

Seven external action references in CI and Pages now use full commit SHAs from the official `actions` repositories. The former major tags resolved to these exact release commits when checked on 16/10/2026:

| Action | Release | Commit |
|---|---|---|
| actions/checkout | v6.1.0 | d23441a48e516b6c34aea4fa41551a30e30af803 |
| actions/setup-node | v6.5.0 | 249970729cb0ef3589644e2896645e5dc5ba9c38 |
| actions/configure-pages | v5.0.0 | 983d7736d9b0ae728b81ab479565c72886d7745b |
| actions/upload-pages-artifact | v4.0.0 | 7b1f4a764d45c48632c6b24a0339c27f5614fb0b |
| actions/deploy-pages | v4.0.5 | d6db90164ac5ed86f2b6aed7e0febac5b3c0c03e |

Validation before publishing: parsed both workflows and compared their complete YAML semantics with baseline `356c83e`, normalizing only these seven action references. Triggers, inputs, permissions, environment variables, job dependencies and local reusable CI reference match. `git diff --check` passes.

Scoped security review checked official provenance and action manifests, unchanged token scopes, QA gating and OIDC isolation. The upload-pages composite action also pins its nested upload-artifact action. No new confirmed finding in this change. Four local simplify passes found no further change needed. Existing AGENTS routing already covers the workflows and README, so no agent-doc refresh was needed.

The existing production CI/Pages run will verify lint, all application tests, embedded SQL tests, audit, build and deployment after the non-force push. Exact run outcomes are recorded in the canonical execution tracker after delivery. No database migration, user-data change, credential change or application-code update.

Maintenance and rollback: follow README “Updating GitHub Actions”; replace pins only with reviewed commits from official action repositories and verify CI/Pages. Revert the workflow change if necessary. Pinning top-level actions does not lock runner images, downloaded tooling or every transitive build dependency.
