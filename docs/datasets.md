# Open Data Brussels — Dataset Reference

## Primary dataset: Cultural places (bruxelles_lieux_culturels)

- **Name**: Cultural places located on the territory of the City of Brussels
- **Source URL**: https://opendata.brussels.be/explore/dataset/bruxelles_lieux_culturels/
- **API URL**: `https://opendata.brussels.be/api/explore/v2.0/catalog/datasets/bruxelles_lieux_culturels/records`
- **License**: CC BY 4.0 — https://creativecommons.org/licenses/by/4.0/deed.en
- **Records**: ~29 cultural venues (museums, theatres, cultural centres)
- **Theme mapping**: All records map to theme `Culture`

### API response structure

Each record has:
- `record.id` — external ID
- `record.fields.description` — name (EN/FR)
- `record.fields.adresse` — address (FR)
- `record.fields.coordonnees_geographiques` — `{ lat, lon }`

Rows without valid `coordonnees_geographiques` are skipped during sync.
