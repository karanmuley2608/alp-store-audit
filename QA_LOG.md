# QA Log

Universal QA run history across all projects.
Auto-updated by the QA Agent after every run.
Never edit manually — the agent owns this file.

---

## Run History

| Date | Project | Branch | Scope | Generated | Passed | Failed | Critical | High | Bug IDs | QA_AGENT updated |
|------|---------|--------|-------|-----------|--------|--------|----------|------|---------|-----------------|
| 2026-03-18 | alp-store-audit | main | smoke (10 highest-risk) | 10 | 10 | 0 | 0 | 0 | — | Yes (+17 TCs) |
| 2026-03-18 | alp-store-audit | main | design fix (manual report) | 2 | 0 | 2 | 0 | 1 | BUG-001, BUG-002 | Yes (+20 design TCs, +2 LEARNED) |

---

## Defect History

All bugs found across all projects and all runs.

| Bug ID | Project | Title | Severity | Found date | Fixed date | Status | Missed by QA | QA updated |
|--------|---------|-------|----------|------------|------------|--------|--------------|------------|
| BUG-001 | alp-store-audit | Table wrapped in Card = double border on 8 pages | High | 2026-03-18 | 2026-03-18 | Fixed | Yes — manual | TC-L1 |
| BUG-002 | alp-store-audit | NSO stores page misaligned columns, sparse layout | Medium | 2026-03-18 | 2026-03-18 | Fixed | Yes — manual | TC-L2 |
| NOTE-001 | alp-store-audit | SM-001 has 2 audits for same store (seed artifact) | Medium | 2026-03-18 | — | Open | N/A | TC-P013 |

---

## Learning History

Every time a bug was reported manually that QA missed — recorded here.

| Date | Project | What was missed | Why it was missed | TC added |
|------|---------|----------------|-------------------|----------|
| 2026-03-18 | alp-store-audit | Double border from Table inside Card | QA had zero design tests — only functional | TC-L1 |
| 2026-03-18 | alp-store-audit | No design QA phase existed at all | Smoke test was purely functional | TC-L2 + DESIGN-001 to DESIGN-020 |

---

## Agent Growth Metrics

| Date | Project | [LEARNED] count | Total TCs | Pass rate |
|------|---------|----------------|-----------|-----------|
| 2026-03-18 | alp-store-audit | 0 | 17 | 100% |
| 2026-03-18 | alp-store-audit | 2 | 39 (17 project + 20 design + 2 learned) | — |
