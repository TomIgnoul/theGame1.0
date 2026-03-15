# 1.4 Projectdoelstellingen

## Beeldvorming — Projectplan (doelstellingen, mijlpalen, resources, tijdslijn)

**Doel:** een gedetailleerd plan dat het team als leidraad gebruikt voor uitvoering en opvolging. Focus: MVP scope halen zonder scope creep.

---

## 1) Projectdoelstellingen

1. **Routeplanner**: gebruiker kiest thema + tijd/afstand en krijgt een werkende wandelroute op de kaart.
2. **Content per stop**: per POI is er een detailpagina met AI-story + basis praktische info (dataset-first).
3. **Filters**: 5 thema’s (War, Museum, Streetart, Food, Culture) filteren POI’s correct.
4. **Stabiele end-to-end flow**: kaart → selectie → detail → route → start wandeling.

**Succescriteria (KPI’s)**

- Van open app naar start wandeling: **< 2 min**
- Routegeneratie: **< 10 sec**
- MVP dataset: **5 POI’s**, consistente filters, geen dead ends.

---

## 2) Mijlpalen

### M0 — Kickoff & scope freeze

- Scope IN/OUT bevestigd
- Risk register klaar
- Repo + branching + Definition of Done checklist klaar

### M1 — Thin slice (1 werkende flow)

- Kaart toont POI pins
- Detailpagina werkt voor 1 POI
- Route lijn + stops zichtbaar (basic)
- Demo: end-to-end, al is het nog “lelijk”

### M2 — MVP functional compleet

- Filters werken (5 thema’s)
- Route op basis van tijd/afstand werkt stabiel
- 5 POI’s in dataset + data validatie
- Chat/story werkt met guardrails (no hallucinations)

### M3 — Stabilisatie & demo-ready

- Smoke tests + bugfix sprint
- Performance basis (caching/limieten)
- Documentatie + screenshots voor portfolio

### M4 — Portfolio + zelfreflectie

- Portfolio van applicaties/features met bewijs
- Zelfreflectie: proces + techkeuzes + DoD-score verwachting

---

## 3) Resourceverdeling

**Project lead / proces-owner**

- Planning, scope bewaken, risk review, milestone gates

**Frontend/UX**

- Map UI, filters, detailpagina, route rendering, flow usability

**Backend/API & Data**

- POI data import/cleaning, endpoints, routing integratie, caching

**AI-integratie**

- Prompting, guardrails (dataset-first), chat integratie, content quality

**QA/Test**

- Smoke tests per milestone, checklist DoD gates, bug triage

> Belangrijk: elke milestone heeft een “owner” die de gate aftekent. Geen owner = geen accountability.
> 

---

## 4) Tijdslijn

*(Pas de weken/dagen aan aan jullie echte deadline — structuur blijft hetzelfde.)*

**Week 1 — Fundament + Thin slice**

- Scope IN/OUT + risk register
- Maps setup + 1 POI detail
- Eerste route visualisatie (basic)

**Week 2 — Core features**

- Filters + dataset cap (5 POI’s)
- Route builder op tijd/afstand
- AI chat met guardrails

**Week 3 — Stabilisatie**

- Bugfixing, performance, fallback scenarios
- Demo-script en screenshots

**Week 4 — Oplevering**

- Portfolio afwerken
- Zelfreflectie schrijven + DoD-score argumenteren

---

## 5) Werkafspraken

- **Weekly milestone gate**: “wat werkt” > “wat staat in progress”
- **Scope freeze** na M1: geen nieuwe features, enkel stabiliseren
- **Definition of Done** checklist verplicht per feature
- **AI policy**: AI helpt, maar code/content altijd reviewen + testen