# VisaCheck — worldwide catalogue version

A GitHub Pages-ready static air-travel visa, passport and transit checker.

## What changed in v2

- Worldwide ISO country/territory catalogue for **both nationality and destination**
- Searchable browser-ready data model
- Destination-level rule modules rather than one hard-coded row per traveller pair
- Current UK ETA / visa-national logic for ordinary visitor travel
- UK airside vs landside transit logic with TWOV warnings/exemptions
- Schengen short-stay visa-exempt/visa-required logic
- Schengen passport validity rule (3 months after intended departure; issued within previous 10 years for relevant non-EU travellers)
- EU/EEA/Swiss passport / national-ID handling
- Official-source directory for important destinations
- Safe fallback for countries whose complete nationality-by-nationality rule module has not yet been curated

## Why the database is modular

A naïve 250 × 250 matrix already creates more than 62,000 country pairs before adding:

- passport types
- residence permits
- existing visas
- purpose
- trip duration
- airside / landside transit
- airport changes
- baggage collection
- onward destination
- effective dates and exceptions

The site therefore uses `data/rule-systems.json` for shared legal regimes and destination modules.

## Deploy

1. Create a GitHub repository.
2. Upload all files in this package.
3. Use `main` as the default branch.
4. Go to **Settings → Pages**.
5. Choose **GitHub Actions**.
6. Push to `main`; the included workflow deploys automatically.

## Local test

```bash
python3 -m http.server 8000
```

Open `http://localhost:8000`.

## Data files

- `data/countries.json` — worldwide destination catalogue
- `data/nationalities.json` — worldwide nationality catalogue
- `data/rule-systems.json` — Schengen and UK shared rule logic/lists
- `data/destination-sources.json` — official destination information portals
- `data/entry-rules.json` — retained for future explicit overrides
- `data/transit-rules.json` — retained for future airport-specific overrides

## Production note

This version intentionally does **not invent** visa or passport rules for destinations whose full official nationality-by-nationality module has not been curated. For a truly comprehensive live service, connect a licensed aviation/immigration dataset (for example Timatic) through a backend; do not expose commercial API credentials in GitHub Pages JavaScript.


## GitHub Actions / Node.js 24

This package uses the Node.js 24-compatible GitHub Pages action generations:

- `actions/checkout@v5`
- `actions/configure-pages@v6`
- `actions/upload-pages-artifact@v5`
- `actions/deploy-pages@v5`

The workflow also sets:

```yaml
FORCE_JAVASCRIPT_ACTIONS_TO_NODE24: "true"
```

This avoids the Node.js 20 deprecation warning during GitHub's runtime transition.

### First deployment

Before the first workflow run:

1. Open the repository on GitHub.
2. Go to **Settings → Pages**.
3. Under **Build and deployment**, set **Source** to **GitHub Actions**.
4. Go to **Actions** and run or re-run **Deploy VisaCheck to GitHub Pages**.


## Searchable country picker

The nationality, destination, and transit-country fields are now searchable comboboxes.

Examples:
- type `ger` → Germany appears
- type `uni` → United Kingdom, United States, etc.
- type `IN` → India and matching country codes
- use arrow keys + Enter, or click a result

## Expanded rule modules

Static curated modules now cover the project's priority destinations:
- Schengen area
- United Kingdom
- United States
- Canada
- Ireland
- Australia
- Japan
- South Korea
- Singapore
- Saudi Arabia
- China
- Thailand
- Vietnam
- Kosovo
- Tunisia
- South America (shared short-stay module with Brazil eVisa handling for selected passports)

The worldwide catalogue still contains 250 countries/territories. Destinations outside the curated modules intentionally display an official-source fallback rather than guessed visa advice.
