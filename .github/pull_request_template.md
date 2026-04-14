# Pull Request - The Game

## 1. Summary

Describe the change, why it exists, and what part of the product it affects.

Linked issue / task:

---

## 2. PR Type

- [ ] New Feature (`FR-XX`)
- [ ] Bug Fix
- [ ] Refactor
- [ ] Performance Improvement (`NFR-XX`)
- [ ] Security Improvement (`NFR-XX`)
- [ ] Documentation
- [ ] Governance / Traceability Update

---

## 3. Linked Requirements (Mandatory)

### Functional Requirements

- [ ] `FR-XX`
- [ ] `FR-XX`

### Non-Functional Requirements

- [ ] `NFR-XX`
- [ ] `NFR-XX`

If no FR/NFR applies:

- [ ] This is maintenance, tooling, or process-only work

Explain why:

---

## 4. Traceability Matrix Updated

- [ ] Updated `docs/traceability.md`
- [ ] Requirement row created or updated
- [ ] API endpoint linked (if applicable)
- [ ] DB entity linked (if applicable)
- [ ] Frontend component linked (if applicable)
- [ ] Verification evidence added
- [ ] Status updated correctly

If not updated, explain why:

---

## 5. Given / When / Then Coverage

Reference source:

- `docs/notion-export/2 Specificaties 30c305766fd18093b050c454027604ab.md`

Checklist:

- [ ] Existing scenario(s) implemented
- [ ] New scenario added or proposed when behavior changed
- [ ] Scenario ID(s) referenced in code comments where required
- [ ] Scenario ID(s) referenced in tests or manual validation notes

Scenario ID(s):

---

## 6. Design Alignment

- [ ] Implementation matches the design documents
- [ ] API matches `docs/notion-export/3 7 API Contracts 30c305766fd1801ab208eb87bbc38778.md`
- [ ] UI matches `docs/notion-export/3 5 UI Design 30c305766fd180b8aa7ad8c2f14e9d78.md`
- [ ] DB matches `docs/notion-export/3 2 Database Design (PostgreSQL) 30c305766fd180e4b5f3e8bc3fb955f8.md`
- [ ] No design deviation without a decision log entry

If deviation exists:

- [ ] Added `DEC-YYYY-###` to `docs/decision-log.md`
- [ ] Updated `docs/traceability.md`

Decision ID(s):

---

## 7. Validation

### Automated

- [ ] `npm run lint`
- [ ] `npm run build`
- [ ] Backend tests added or updated (if test suite exists)
- [ ] Frontend tests added or updated (if test suite exists)
- [ ] Test case IDs listed below and mapped to touched FR / NFR / GH rows
- [ ] Coverage checked (if tooling exists)

### Manual

- [ ] Happy path validated
- [ ] Failure or edge case validated (if behavior changed)

Commands run:

```text
npm run lint
npm run build
```

Test case ID(s) / evidence:

Use IDs from `docs/traceability.md` when available (example: `TC-AN-API-01`).

Manual validation notes:

---

## 8. Non-Functional Validation (If Applicable)

### Performance

- [ ] Query or index impact reviewed
- [ ] Load-sensitive flow checked

### Security

- [ ] Auth enforced where required
- [ ] Input validation added or updated
- [ ] No sensitive data exposure introduced
- [ ] Rate limiting considered where required

---

## 9. Post-Signoff Change Control

If this PR changes requirements, architecture, or signed-off scope:

- [ ] Change documented
- [ ] `DEC-YYYY-###` added
- [ ] Impact analysis included (scope / time / risk)
- [ ] Reviewer approval requested before merge

If not applicable:

- [ ] No requirements or architecture changed

---

## 10. Milestone Gate Impact

This PR contributes to:

- [ ] M1 - Requirements Baseline
- [ ] M2 - Design Complete
- [ ] M3 - Build Complete
- [ ] M4 - Release Ready

Current milestone status not regressed:

- [ ] Confirmed

---

## 11. Final Governance Confirmation

I confirm:

- [ ] Every touched requirement has verification evidence
- [ ] No orphan endpoints introduced
- [ ] No orphan DB entities introduced
- [ ] No undocumented behavior introduced
- [ ] Traceability integrity maintained

---

## Reviewer Section

- [ ] Requirement traceability verified
- [ ] Design compliance verified
- [ ] Validation evidence reviewed
- [ ] Milestone gate not violated
- [ ] Approved for merge
