# 1.3 Risico’s inschatten

## Beeldvorming — Risico’s inschatten (Risk Register)

**Doel:** risico’s identificeren die het project kunnen beïnvloeden (technologie, resources, veranderende vereisten) en per risico een concrete beheersstrategie vastleggen.

### Schaal (simpel en bruikbaar)

- **Kans (K):** Laag / Middel / Hoog
- **Impact (I):** Laag / Middel / Hoog
- **Score:** K × I (L/M/H) → focus op **Hoog**

---

## 1) Top risico’s (met beheersstrategie)

| ID | Risico | Oorzaak | Effect | K | I | Beheersstrategie (mitigatie) | Fallback (als het toch gebeurt) | Owner |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| R1 | **Tijdstekort / scope creep** | Te veel features + polish | MVP niet af, stress, rommelige demo | Hoog | Hoog | Hard **Scope IN/OUT**, weekly gate check, “no new features” na freeze | Snijden: geen extra POI’s, geen polish, enkel kernflow demo | PM/Team |
| R2 | **Integratiecomplexiteit** (Maps + routing + AI + data) | Veel dependencies | Blokkades laat in project | Hoog | Hoog | Start vroeg met end-to-end “thin slice” (1 route) + iteratief uitbreiden | Simpele route: vaste stops of beperkte routing | Backend |
| R3 | **API quota / key issues (Google Maps)** | Quota, billing, misconfig | Routing/kaart faalt | Middel | Hoog | Keys early testen, quota monitor, caching, minimal calls | Alternatief: OpenStreetMap/Leaflet of mock routing | Backend |
| R4 | **Datakwaliteit OpenData** | Missing/dirty fields | Foute filters, incomplete POI info | Hoog | Middel | Data cleaning + validatieregels, vaste dataset van 5 POI’s (cap) | Handmatig curated dataset voor demo | Data/Backend |
| R5 | **AI hallucinations (praktische info)** | Model “verzint” | Onbetrouwbare output, slechte score | Hoog | Hoog | Dataset-first: facts alleen uit data; anders label “onzeker/niet gevonden”; prompt guardrails | Praktische info uitzetten in MVP, alleen storytelling | AI/Backend |
| R6 | **AI genereert foutieve code** | Blind copy-paste | Bugs, security issues, tijdverlies | Middel | Hoog | AI als assistent, niet als autoriteit: code review + tests + kleine increments | Revert naar laatste werkende versie; features schrappen | Dev |
| R7 | **Performance issues (route/kaart traag)** | Te veel calls/geen caching | Slechte UX, demo faalt | Middel | Middel | Caching, debouncing, limit POI’s, loading states | Toon precomputed route voor demo | Frontend |
| R8 | **Veranderende vereisten** | Docent feedback / team bijsturing | Herwerk, planning breekt | Middel | Middel | Change log + impact check; alleen changes die MVP gate versterken | Parkeren in OUT-scope roadmap | PM |
| R9 | **Team resource-beperking** | Werk/studie, onbeschikbaarheid | Taken blijven liggen | Middel | Hoog | Duidelijke owners, kleine tickets, weekly check-in, “bus factor” docs | Scope cut + focus kernflow | PM |
| R10 | **Onvoldoende test/QA** | Alles op het einde | Onstabiele demo | Middel | Hoog | Definition-of-Done gates + smoke tests per feature | Reduceer features tot stabiele flow | QA/Team |

---

## 2) Strategieën om risico’s te beheersen (samenvatting)

- **Thin-slice aanpak:** zo snel mogelijk één werkende end-to-end flow: kaart → select → detail → route → start.
- **Scope discipline:** hard cap op POI’s en geen UX polish in MVP.
- **AI guardrails:** facts uit dataset, anders “onzeker”; AI-code altijd reviewen + testen.
- **Vroeg integreren:** API keys, routing en data validatie in week 1–2 checken.

---

## 3) Risico’s opvolgen (proces)

- Elke week 10 min “risk review”: scores updaten + mitigatie checken.
- Als een risico “Hoog” wordt: **scope snijden** of **fallback activeren** binnen dezelfde week.