# Issue Spec Index

Date: 2026-02-03
Scope: 001-mvp-merchant-ftl-quote

This folder tracks production-impacting issues found during Docker Compose smoke testing.

1. ISSUE-001: Registration approval creates users that cannot log in. File: `specs/001-mvp-merchant-ftl-quote/issues/issue-001-registration-approval-double-hash.md`
2. ISSUE-002: CSRF blocks bearer-token API calls to state-changing endpoints. File: `specs/001-mvp-merchant-ftl-quote/issues/issue-002-csrf-bearer-blocks-api.md`

Shared test script (post-fix): `scripts/smoke-docker.sh`
