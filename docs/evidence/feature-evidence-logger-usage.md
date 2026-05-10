# Feature Evidence Logger — Usage Guide

## Purpose

The Feature Evidence Logger is an n8n workflow that turns structured feature evidence into a Markdown evidence file.

Flow:

~~~text
Feature completed
→ Evidence payload sent to n8n
→ Markdown evidence generated
→ Evidence file written to docs/evidence/
→ Evidence file committed to Git
~~~

## Prerequisites

Start the local Docker runtime:

~~~bash
docker compose up -d
~~~

Verify that n8n is running:

~~~bash
docker compose ps
~~~

n8n should be reachable at:

~~~text
http://localhost:5678
~~~

## Workflow

Workflow file:

~~~text
n8n/workflows/feature-evidence-logger-v0.1.json
~~~

Workflow structure:

~~~text
Webhook
→ Code
→ Read/Write Files from Disk
→ Respond to Webhook
~~~

## Test URL

While developing or testing the workflow, use:

~~~text
http://localhost:5678/webhook-test/feature-evidence
~~~

Before sending the request, click this in n8n:

~~~text
Listen for test event
~~~

## Production URL

When the workflow is activated, use:

~~~text
http://localhost:5678/webhook/feature-evidence
~~~

Important:

~~~text
The production URL only works with POST requests and only when the workflow is active.
~~~

## Payload Template

Use:

~~~text
docs/evidence/evidence-payload-template.json
~~~

## Curl Example

~~~bash
curl -X POST http://localhost:5678/webhook-test/feature-evidence \
  -H "Content-Type: application/json" \
  -d @docs/evidence/evidence-payload-template.json
~~~

## Expected Output

The workflow writes a Markdown file to:

~~~text
docs/evidence/
~~~

Filename format:

~~~text
YYYY-MM-DD-<milestone>-<feature-name>.md
~~~

## After Evidence Is Generated

Check the generated file:

~~~bash
ls -lah docs/evidence
cat docs/evidence/<generated-file>.md
~~~

Then commit it:

~~~bash
git add docs/evidence/<generated-file>.md
git commit -m "Add evidence for <feature-name>"
~~~

## Scope

This workflow writes evidence files locally through the mounted Docker workspace.

It does not automatically:

- create Git commits
- push to GitHub
- create PRs
- update Notion
- update the traceability matrix
