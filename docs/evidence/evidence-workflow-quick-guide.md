cat > docs/evidence/evidence-workflow-quick-guide.md <<'EOF'
# Evidence Workflow — Quick Guide

## Purpose

This guide explains how to use the project evidence workflow after finishing a feature.

The goal is to make sure every relevant feature has proof linked to it.

The evidence workflow supports:

- traceability
- milestone validation
- Definition of Done checks
- teacher review
- team accountability
- AI/vibe-coding transparency

## Core Idea

When a feature is finished, we do not only commit the code.

We also create an evidence file that explains:

- what was built
- why it was built
- which requirement it supports
- how it was validated
- where the implementation can be found

The evidence file is stored in:

    docs/evidence/

## Workflow Overview

    Feature completed
    → Feature validated
    → Feature committed
    → Evidence payload sent to n8n
    → n8n generates Markdown evidence
    → n8n writes evidence file to docs/evidence/
    → Evidence file is reviewed
    → Evidence file is committed
    → PR / traceability / Notion can link to the evidence

## When To Create Evidence

Create evidence when:

- a feature is completed
- a milestone gate is being closed
- an automation workflow is added or changed
- a technical decision needs proof
- a test or validation result is important
- AI/Cursor/Codex was used for implementation and the output needs to be documented

Do not create evidence for random notes or unfinished work unless it is part of an experiment log.

## Step 1 — Validate The Feature

Before generating evidence, validate the feature.

For frontend work, use:

    npm run test -w frontend
    npm run lint -w frontend
    npm run build -w frontend

For backend work, use the relevant backend test or API validation commands.

For UI work, also perform a manual browser check.

## Step 2 — Commit The Feature Code

Commit only the files that belong to the feature.

Example:

    git add frontend/src/components/route-config/RouteConfigPanel.tsx
    git add frontend/src/components/route-config/RouteConfigPanel.test.tsx
    git commit -m "Add M3-B route proof helper UI"

Do not commit unrelated files.

## Step 3 — Start The Local Runtime

Start Docker Compose:

    docker compose up -d

Check that services are running:

    docker compose ps

n8n should be reachable at:

    http://localhost:5678

## Step 4 — Make Sure The n8n Workflow Is Active

Open n8n:

    http://localhost:5678

Open the workflow:

    Feature Evidence Logger v0.1

Make sure the workflow is active.

The production webhook is:

    http://localhost:5678/webhook/feature-evidence

Important:

    The production webhook only works with POST requests and only when the workflow is active.

## Step 5 — Send The Evidence Payload

Use the payload template:

    docs/evidence/evidence-payload-template.json

Example request:

    curl -X POST http://localhost:5678/webhook/feature-evidence \
      -H "Content-Type: application/json" \
      -d '{
        "feature": "M3-B Route Proof Helper UI",
        "milestone": "M3-B",
        "fr_ids": ["FR-11", "FR-12"],
        "nfr_ids": [],
        "summary": "Added a small frontend helper text that makes the M3-B route rendering proof visible: the route is shown as a line with numbered stops.",
        "result": "PASS",
        "evidence_type": "frontend implementation + tests",
        "evidence_url": "frontend/src/components/route-config/RouteConfigPanel.tsx",
        "commit_url": "local commit or GitHub commit URL",
        "lesson_learned": "A small UI proof helper makes the acceptance criteria easier to validate."
      }'

## Step 6 — Check The Generated Evidence File

n8n writes the generated Markdown file to:

    docs/evidence/

List the evidence files:

    ls -lah docs/evidence

Open the generated file:

    cat docs/evidence/<generated-evidence-file>.md

Check that the file clearly explains:

- feature name
- milestone
- linked requirements
- validation result
- implementation reference
- lesson learned

## Step 7 — Commit The Evidence File

Commit the generated evidence file:

    git add docs/evidence/<generated-evidence-file>.md
    git commit -m "Add evidence for <feature-name>"

If the feature was already committed, this creates a second commit that documents the proof.

This is acceptable because it keeps implementation and evidence clearly separated.

## Step 8 — Link The Evidence

Use the evidence file in:

- PR description
- traceability matrix
- milestone gate notes
- Notion evidence page
- teacher review notes

Example traceability chain:

    FR-11 / FR-12
    → Route proof helper UI
    → frontend/src/components/route-config/RouteConfigPanel.tsx
    → frontend tests/build validation
    → docs/evidence/2026-05-10-m3-b-m3-b-route-proof-helper-ui.md

## What n8n Does

The n8n workflow performs this process:

    Webhook
    → Code
    → Read/Write Files from Disk
    → Respond to Webhook

The workflow:

- receives the JSON payload
- validates required fields
- generates Markdown evidence
- creates a filename
- writes the file into docs/evidence/
- returns the generated file path

## What n8n Does Not Do

The workflow does not automatically:

- create Git commits
- push to GitHub
- create PRs
- update Notion
- update the traceability matrix

Those steps are still manual for control and review.

## Git Safety Rule

Always check Git status before committing:

    git status

Do not accidentally commit unrelated files.

Example of an unrelated file that should stay out of evidence commits:

    docs/codex-handoff-chatbot.md

Stage only the relevant evidence file:

    git add docs/evidence/<generated-evidence-file>.md

## Good Evidence Checklist

A good evidence file answers:

    What was done?
    Why was it needed?
    Which requirement does it support?
    How was it validated?
    Where is the implementation?
    What was learned?

If the evidence file does not answer these questions, improve it before using it for sign-off.

## Recommended Usage In Notion

Notion should be used as an evidence index, not as the main source of truth.

The source of truth remains:

    GitHub repository
    docs/evidence/

In Notion, link to:

- the evidence file
- the PR
- the commit
- the milestone
- the related requirements

This keeps Notion readable for review while keeping the actual evidence version-controlled in Git.

## Summary

The evidence workflow turns completed work into auditable proof.

Use it after finishing a feature to create a clear trail:

    Requirement
    → Implementation
    → Validation
    → Evidence
    → Commit / PR

This makes the project easier to review, easier to defend, and more professional.
EOF
