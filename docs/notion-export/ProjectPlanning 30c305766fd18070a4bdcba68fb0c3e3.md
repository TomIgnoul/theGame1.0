# ProjectPlanning

### Projectdoelstellingen (MVP)

- Interactieve kaart met POI’s + filters (War, Museum, Streetart, Food, Culture).
- Detailpagina per POI met AI-story + basis praktische info (dataset-first).
- Route builder op basis van thema + tijd en/of km, met route-lijn en genummerde stops.
- End-to-end flow werkt stabiel: kaart → selectie → details → route → start wandeling.

### Mijlpalen & gates

- [ ]  **M0 (15–23 feb) — Kickoff & scope lock:** Scope IN/OUT + risk register + DoD-checklist + repo/werkafspraken.
- [ ]  **M1 (24 feb–09 mrt) — Thin slice:** 1 werkende flow end-to-end (al mag UI basic zijn).
- [ ]  **M2 (10–30 mrt) — MVP functional compleet:** filters + 5 POI seed data + route builder stabiel + AI guardrails (geen hallucinaties).
- [ ]  **M3 (31 mrt–20 apr) — Stabilisatie & QA:** bugfix, performance basics, fallback scenarios, demo flow “bulletproof”.
- [ ]  **M4 (21 apr–01 mei) — Oplevering:** portfolio (bewijs/screenshot/demo) + zelfreflectie (proces + techkeuzes + score-argumentatie).

### Resourceverdeling (owners)

- **Process/PM:** planning, scope bewaken, gates aftekenen, risico’s opvolgen.
- **Frontend:** map UI, filters, detailpagina, route rendering, UX flow.
- **Backend/Data:** POI import/cleaning, endpoints, routing integratie, caching.
- **AI:** prompting + guardrails (dataset-first), chat integratie, output quality.
- **QA:** smoke tests per milestone, DoD-checks, bug triage.

### Werkafspraken (controlemechanisme)

- **Wekelijkse gate review:** alleen “werkend” telt, niet “bijna”.
- **Scope freeze na M1:** daarna geen nieuwe features, enkel afwerken/stabiliseren.
- **AI policy:** AI versnelt, maar **human review + testen** verplicht (code én content).