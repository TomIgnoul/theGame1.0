# Evidence Directory

## Purpose

The `docs/evidence/` directory stores proof artifacts for the project.

This folder is used to document and preserve evidence that a feature, workflow, experiment, or milestone was actually implemented, tested, and validated.

Evidence in this folder supports the project traceability chain:

~~~text
Goal
→ Requirement
→ Design
→ Implementation
→ Validation
→ Evidence
```

## What Belongs Here

This directory can contain:

* Generated evidence logs from the n8n Feature Evidence Logger.
* Manual evidence notes for implemented features.
* Screenshots or references to screenshots.
* Test results or curl output summaries.
* Milestone proof files.
* Small README files explaining specific evidence packages.
* Payload templates used to generate evidence.

## Current Evidence Workflow

The main evidence workflow uses n8n.

```text
Feature completed
→ Evidence payload sent to n8n
→ Markdown evidence generated
→ Evidence file written to docs/evidence/
→ Evidence file committed to Git
```

The workflow is documented in:

```text
docs/evidence/feature-evidence-logger-usage.md
```

The payload template is stored in:

```text
docs/evidence/evidence-payload-template.json
```

## Naming Convention

Generated evidence files should use this format:

```text
YYYY-MM-DD-<milestone>-<feature-name>.md
```

Example:

```text
2026-05-10-m3-b-m3-b-route-proof-helper-ui.md
```

## Evidence File Structure

A good evidence file should include:

* Feature name
* Milestone
* Linked functional requirements
* Linked non-functional requirements, if applicable
* Result: `PASS`, `FAIL`, or `PARTIAL`
* Summary of what was implemented or verified
* Evidence source, such as a code file, screenshot, PR, or test output
* Lesson learned
* Creation timestamp

## How To Use This Folder

When a feature is completed:

1. Run or validate the feature.
2. Generate an evidence file using the n8n workflow.
3. Check the generated Markdown file.
4. Commit the evidence file together with, or shortly after, the feature implementation.
5. Link the evidence file in the PR, traceability matrix, or milestone sign-off notes.

Example commit:

```bash
git add docs/evidence/<generated-evidence-file>.md
git commit -m "Add evidence for <feature-name>"
```

## What Does Not Belong Here

Do not store:

* Raw secrets or API keys.
* Full chat logs with personal data.
* Large binary files unless required for proof.
* Random notes that are not linked to a feature, requirement, milestone, or experiment.
* Unreviewed AI output without human validation.

## Quality Rule

An evidence file only has value if it helps answer:

```text
What was done?
Why was it needed?
Which requirement does it prove?
How was it validated?
Where is the implementation?
```

If an evidence file does not answer those questions, it should be improved before being used for milestone sign-off.

## Relation To Traceability

Evidence files should support the traceability chain:

```text
Goal
→ Functional / non-functional requirement
→ Design element
→ Implementation file
→ Test or validation
→ Evidence file
```

Example:

```text
FR-11 / FR-12
→ Route rendering UI
→ frontend/src/components/route-config/RouteConfigPanel.tsx
→ frontend test/build validation
→ docs/evidence/2026-05-10-m3-b-m3-b-route-proof-helper-ui.md
```

## Relation To Definition of Done

A feature is not considered fully proven unless there is evidence that shows:

* The feature was implemented.
* The feature was tested or manually validated.
* The feature is linked to requirements.
* The result is documented.
* The evidence is committed to the repository.

## Scope

This folder is part of the project governance and delivery workflow.

It supports:

* Traceability
* Milestone validation
* Definition of Done checks
* Teacher review
* Team accountability
* AI/vibe-coding evidence
* Experiment logging

It does not replace actual implementation, testing, or review.

## Maintenance Rules

Keep this directory clean:

* Use clear filenames.
* Avoid duplicate evidence files for the same validation unless there is a reason.
* Prefer Markdown for readable evidence.
* Keep generated files linked to a requirement, milestone, or experiment.
* Do not commit temporary test output unless it proves something useful.
* Update or replace weak evidence if better proof becomes available.

## Summary

The `docs/evidence/` directory is the project’s audit trail.

It proves what was built, why it matters, how it was validated, and where the implementation can be found.


