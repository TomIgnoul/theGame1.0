# Agent Index (NL → EN)

### Doel

Deze pagina dient als “vertalinglaag” tussen onze Nederlandstalige projectdocumentatie (Notion) en Engelstalige technische output (repo/docs). De AI-agents sturen op **IDs en structuur**, niet op taal.

---

## 1) Lifecycle mapping (NL → EN)

| Notion (NL) | Equivalent (EN) | Betekenis |
| --- | --- | --- |
| Beeldvorming | Vision / Initiation | Probleem, doelgroep, scope, risico’s, high-level plan |
| Specificatie | Requirements | FR/NFR + acceptatiecriteria (Gherkin) als baseline |
| Ontwerpfase | Design | Architectuur, databank, API contracten, UI ontwerp, security ontwerp |
| Implementatie | Build / Implementation | Code + integratie volgens design en DoD |
| Integratie & Test | Integration & Testing | End-to-end testen, bugfix, stabilisatie |
| Oplevering | Release / Delivery | Demo-ready, portfolio, reflectie, documentatie |

---

## 2) Canonical IDs (taal-onafhankelijk = leidend)

Agents gebruiken altijd deze IDs als “single source of truth”:

- **FR-XX** = Functionele vereisten
- **NFR-XX** = Niet-functionele vereisten
- **Gherkin Scenario’s** = Acceptatiecriteria (Given/When/Then)
- **DEC-YYYY-###** = Tech Decision Log (Waarom)
- **EXP-YYYY-###** = Experiment Log
- **M0–M4** = Milestones / gates
- **2.1 / 2.2 / 2.3 / 2.4** = structuur in Specificatie
- **3.1 / 3.2 / …** = structuur in Ontwerp

---

## 3) Agent Rules (output language + gedrag)

### Output language policy

- **Notion/rapport**: **Nederlands**
- **Repo (README, docs, comments, API docs)**: **Engels**

### Parsing rule (geen free-text gokken)

Agents mogen niet “gissen” op losse zinnen. Ze werken op:

- headings (2.x, 3.x)
- IDs (FR/NFR/DEC/EXP)
- templates (vaste invulstructuur)

### Change policy (na sign-off)

Na **2.4 Sign-off** geldt:

- geen wijzigingen aan requirements zonder **Change Log**
- elke wijziging bevat: *wat*, *waarom*, *impact (scope/tijd/risico)*, *beslissing*

---

## 4) Agent roles (kort)

- **Master Agent**: orchestreert, bewaakt gates, checkt consistentie met FR/NFR/Gherkin
- **DB Agent**: schema/migrations/ETL volgens 3.2
- **API Agent**: endpoints/contracts/rate limiting volgens 3.x
- **Frontend Agent**: UI flows volgens wireframes + acceptatiecriteria
- **QA Agent (optioneel)**: smoke tests + checks tegen Gherkin baseline