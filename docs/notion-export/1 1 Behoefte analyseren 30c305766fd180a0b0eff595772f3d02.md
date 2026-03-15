# 1.1 Behoefte analyseren

### Context

Brussel heeft veel plekken die voor locals en toeristen interessant zijn, maar **niet vanzelf ontdekt worden**. Informatie is verspreid over blogs, reviews en lijstjes, waardoor mensen veel tijd verliezen voor ze een goede wandeling hebben.

De applicatie start **zonder eigen “parels”-database**. In de eerste versie gebruiken we **bekende monumenten en bezichtigingen (POI’s)** uit **openadata.brussels** als seed data. Zo is de app vanaf dag 1 bruikbaar, zonder dat het team eerst manueel content moet verzamelen.

### Probleem

De kernbehoefte is **snelle ontdekking + een route die klopt**:

- Gebruikers willen plekken vinden die passen bij hun interesses, maar verliezen tijd aan zoeken en vergelijken.
- Zelfs wanneer ze plekken vinden, ontbreekt vaak een **concrete, haalbare route** op basis van tijd/afstand.
- De beschikbare info is vaak “droog”: er ontbreekt **storytelling** die de plek betekenis geeft.

Na launch ontstaat een tweede probleem: **groei van het aanbod zonder extra development**.

- Lokale initiatieven (“parels”) willen zichtbaar worden in wandelroutes, maar hebben geen laagdrempelige manier om opgenomen te worden.
- Zonder kwaliteitscontrole riskeert het platform onbetrouwbaar te worden (foute info, spam, inconsistentie).

### Doel

De applicatie moet het mogelijk maken om:

1. interessante plekken te ontdekken via een kaart en filters,
2. per plek een AI-gegenereerd verhaal + praktische info te krijgen,
3. een gepersonaliseerde wandelroute te genereren op basis van **thema + tijd en/of kilometers**.

We hanteren een **twee-fasen groeimodel**:

- **MVP (pre-launch):** routes en content op basis van openadata.brussels POI’s (monumenten/bezichtigingen).
- **Post-launch:** parels kunnen zich aanmelden om opgenomen te worden in de dataset en routes, inclusief basisinformatie en een (eventueel AI-ondersteund) verhaal. Dit vraagt een vorm van validatie/moderatie om kwaliteit te bewaken.

### Doelgroep

**Primair:** locals én toeristen die Brussel op een originele manier willen verkennen.

**Gebruikssituatie:** korte uitstap/vrije namiddag waarbij men snel wil kiezen en vertrekken.

### Thema’s (filters) — MVP

De MVP ondersteunt 5 interesses:

- War
- Museum
- Streetart
- Food
- Culture

### Jobs-to-be-done

1. **Discover:** “Toon mij plekken die passen bij mijn interesses.”
2. **Decide:** “Geef mij voldoende context (story + praktisch) om snel te kiezen.”
3. **Do:** “Genereer een route die past bij mijn tijd en/of afstand en die ik meteen kan volgen.”

### Succescriteria (MVP, meetbaar)

- Een gebruiker kan in **< 2 minuten** van “open app” naar “start wandeling”.
- Routegeneratie gebeurt binnen **< 10 seconden** na keuze van thema + tijd/afstand.
- Elke plek heeft minimaal: **titel, locatie, korte story, basis praktische info**.
- Filters geven consistente resultaten (geen willekeurige categorie-matches).
- AI-output blijft bruikbaar: storytelling + praktische info met **fallback** wanneer data ontbreekt of onzeker is.

### Assumpties & risico’s

- **Datakwaliteit:** open data bevat hiaten/verouderde info → fallback en/of “onzeker”-label nodig.
- **AI-risico:** hallucinaties bij praktische info → beperken tot wat in dataset zit of expliciet labelen.
- **Integratiecomplexiteit:** kaart + routing + AI + dataset vraagt strakke scope.
- **Scope creep:** te veel features/parels/polish kan deadline killen.

### MVP-beslissing: aantal plekken

Voor een realistische validatie van filters en route-builder is **1 plek onvoldoende**.

MVP = **5 POI’s** (seed data), met een **harde cap op 5** om scope te bewaken. Extra plekken zijn post-MVP.