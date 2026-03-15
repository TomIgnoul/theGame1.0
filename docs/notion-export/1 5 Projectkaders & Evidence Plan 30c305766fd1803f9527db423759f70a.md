# 1.5 Projectkaders & Evidence Plan

### Doel

Dit project is een **experiment-first** traject (“The Game”). We worden niet enkel beoordeeld op resultaat, maar vooral op **innovatie, iteratie, en het continu verantwoorden van keuzes** (“waarom”). Daarom leggen we expliciet vast welke nieuwe technologieën we inzetten en hoe we bewijs verzamelen.

---

## Projectkaders (constraints)

### Nieuwe technologieën (verplicht toe te passen)

- **LLM:** GPT (ChatGPT) voor story generation, route-context en assistentie in development (“vibe coding”).
- **Automation:** **n8n** voor proceslogica en automatisering tussen tools.
- **Dev platform (stack):** Docker + Python + Poetry + GitHub (CI/versiebeheer), plus integratie met Notion/Trello waar mogelijk.

### Mindblowing target (ambitieniveau)

We streven naar een demo die “mindblowing” is door **live personalisatie**:

- **AI route + audio + realtime story per stop**, gebaseerd op user voorkeuren (thema + tijd/afstand) en context van de gekozen locatie.
- Daarnaast bouwen we een **geautomatiseerd ontwikkelplatform** waar tooling samenwerkt (Docker/Poetry/GitHub/n8n/Notion/Trello) om de workflow te versnellen en te professionaliseren.

### Experiment > resultaat

We optimaliseren voor:

- zichtbare experimenten (prototypes, iteraties),
- duidelijke learnings (wat werkte / wat faalde / waarom),
- herhaalbaar proces (niet “één lucky demo”).

---

## Evidence plan (hoe we bewijzen dat we dit echt gedaan hebben)

### 1) Evidence repositories

- **GitHub**: codebase, commits, branches, PR’s, issues.
- **Notion**: experiment-log, beslissingslog (waarom), screenshots, demo-notities.

### 2) Vibe coding bewijs

We leveren per feature minimaal:

- **Prompt log** (copy/paste van de belangrijkste prompts + korte context “wat wilden we”).
- **Before/after**: wat kwam eruit, wat hebben we aangepast (human edits).
- **Commit links**: commit(s) waarin de AI-output verwerkt werd.
- **Korte evaluatie**: “wat was correct / wat was fout / wat hebben we geleerd”.

> Belangrijk: AI is assistent. Wij blijven verantwoordelijk voor kwaliteit, integratie en eindresultaat.
> 

### 3) Experiment-log (structureel)

Voor elk experiment registreren we:

- Hypothese (wat verwachten we?)
- Setup (tools, data, flow)
- Resultaat (wat gebeurde er echt?)
- Lesson learned (wat nemen we mee?)
- Next step (stoppen / verbeteren / integreren)

### 4) “Waarom” als doorlopende discipline (Tech Decision Log)

Elke belangrijke keuze krijgt een mini-verantwoording:

- **Omdat** (constraint/requirement/risico)
- **Dit betekent** (impact op product, planning, kwaliteit)
- Alternatief overwogen (1 zin)
- Beslissing (final)

---

## Automatiseringsdoelen (n8n)

n8n gebruiken we voor proceslogica en integraties, bv.:

- auto-post van experiment logs / status naar Notion
- sync van tasks tussen Trello en GitHub issues
- triggers bij commits/PR’s om checklist/DoD status te updaten
- pipeline voor content (POI → story → opslag → publicatie)

---

## Ownership & accountability

- Wij garanderen: consistent loggen + bewijs per milestone (M1–M4).