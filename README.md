# Viva Quest Website

Marketing and product-catalog website for **Viva Quest Private Limited** — a supplier of
pharmaceutical APIs, impurities, KSMs & intermediates, and CRO/CDMO/CRAMS services.

The product catalogs (Impurities, APIs, KSMs & Intermediates) are data-driven: the site
loads catalog records at runtime from JSON files under `assets/data/`, with an embedded
JavaScript fallback so a bad or missing file never takes the page down.

---

## 1. Hosting & live site

| Item | Value |
| --- | --- |
| Host | GitHub Pages |
| Repository | `vq-webtest/viva_web` |
| Branch | `main` |
| Primary domain | `https://vivaquest.co.in/` (see `sitemap.xml`) |
| `.nojekyll` | Present — tells Pages not to run Jekyll, so everything in `assets/` is served as-is |

Deployment model depends on the **Pages source** setting (Settings → Pages → Build and deployment):

- **GitHub Actions** (current): the `Build and deploy site` workflow (`.github/workflows/deploy.yml`)
  converts CSV → JSON and deploys the site in one step. No generated files are committed.
- **Deploy from a branch** (manual alternative): GitHub publishes `main` directly on every
  push; the client uploads pre-generated JSON/JS files. See section 6.

---

## 2. Tech stack

- **Plain static HTML** — no framework, no bundler, no build step for the site itself.
- **Tailwind CSS via CDN** (`https://cdn.tailwindcss.com`) with an inline `tailwind.config`
  in each page for the brand palette.
- **Vanilla JavaScript** — all catalog logic lives in `assets/js/catalog.js`.
- **Google Fonts** (Poppins, Inter, JetBrains Mono) and **Material Symbols** icons.
- **RFQ cart** stored in `localStorage`; quote requests are submitted through **Web3Forms**.
- **Catalog data pipeline** — a small Python 3 script (`scripts/csv_to_json.py`, standard
  library only) converts spreadsheets to JSON.

---

## 3. Repository structure

```
vivaquest/
├── *.html                     # All website pages (see section 4)
├── index.html                 # Home page
├── robots.txt                 # Search-engine crawler rules
├── sitemap.xml                # XML sitemap (canonical domain: vivaquest.co.in)
├── .nojekyll                  # Disables Jekyll processing on GitHub Pages
├── README.md                  # This file
│
├── .github/
│   └── workflows/
│       └── deploy.yml         # Build (CSV→JSON) + deploy to GitHub Pages (Option A)
│
├── scripts/
│   └── csv_to_json.py         # Generic CSV → JSON converter (stdlib only)
│
├── clinical_precision/
│   └── DESIGN.md              # Design-token reference for the "Clinical Precision" theme
│
└── assets/
    ├── js/
    │   └── catalog.js         # Catalog loading, search, pagination, RFQ cart
    ├── data/                  # Catalog source + generated data (see section 5)
    │   ├── Impurities.csv         # Source of truth (uploaded/edited)
    │   ├── impurities.json        # Generated: loaded by the browser
    │   ├── impurities-data.js     # Generated: embedded fallback (window.VQ_IMPURITIES)
    │   ├── intermediates.csv
    │   ├── intermediates.json
    │   └── intermediates-data.js
    └── images/
        ├── branding/          # Logo, favicon, mission/vision art
        ├── facility/          # Plant / facility photos
        ├── gallery/           # Gallery images
        ├── hero/              # Home-page hero images
        ├── lab/               # Laboratory imagery
        ├── lab-setup/         # Lab setup imagery
        ├── products/          # Product category imagery
        └── team/              # Management team photos
```

---

## 4. Website pages

| Page | Purpose |
| --- | --- |
| `index.html` | Home page |
| `about.html` | Business overview |
| `management_team.html` | Management team profiles |
| `impurities.html` | Impurities catalog (searchable, paginated) |
| `api.html` | APIs catalog (searchable, paginated) |
| `intermediates.html` | KSMs & Intermediates catalog (searchable, paginated) |
| `cro.html` | CRO services |
| `cdmo.html` | CDMO services |
| `crams.html` | CRAMS services |
| `rd.html` | R&D infrastructure |
| `manufacturing_facility.html` | Manufacturing facility |
| `quality.html` | Quality systems |
| `gallery.html` | Photo gallery |
| `certifications.html` | Certifications |
| `safety.html` | Safety information |
| `careers.html` | Careers |
| `contact.html` | Contact |

Shared: every page has an inline header/nav/footer and links to `assets/js/catalog.js` only
where a catalog is needed.

---

## 5. Product catalog architecture

### 5.1 Data flow

```
assets/data/<catalog>.csv          (source of truth — edited/uploaded)
        │
        │  scripts/csv_to_json.py  (generic converter, runs in CI or locally)
        ▼
assets/data/<catalog>.json         (what the browser fetches)
assets/data/<catalog>-data.js      (embedded fallback: window.VQ_IMPURITIES, etc.)
        │
        │  assets/js/catalog.js
        ▼
Browser: fetch JSON → normalize column names → search/filter → paginate → render table
         (if fetch/parse fails → use embedded <catalog>-data.js)
```

### 5.2 Catalog definitions (`catalog.js`)

```js
const catalogConfig = {
    impurities:    { file: 'impurities.json',    title: 'Impurities' },
    api:           { file: 'api.json',           title: 'APIs' },
    intermediates: { file: 'intermediates.json', title: 'KSMs & Intermediates' }
};
```

The three catalog pages call `initializeCatalogSearch('<key>')`:

- `impurities.html` → `initializeCatalogSearch('impurities')`
- `api.html` → `initializeCatalogSearch('api')`
- `intermediates.html` → `initializeCatalogSearch('intermediates')`

### 5.3 Key functions in `catalog.js`

| Function | Role |
| --- | --- |
| `initializeCatalogSearch(key)` | Fetches `<catalog>.json` (cache-busted), validates, normalizes, falls back to embedded `.js` on failure |
| `normalizeCatalogRows(rows, key)` | Maps arbitrary column names to canonical fields; auto-generates `Product ID` when absent |
| `canonicalField(key)` | **Single source of truth** for column-name matching (exact aliases + fuzzy rules) |
| `filterAndDisplay(query, key)` | Text search across name/chemical name/synonym/CAS/formula/ID |
| `renderPage` / `renderPagination` / `goToPage` | Client-side pagination (10 rows/page) |
| `displayRows(rows, key)` | Builds the table HTML (layout differs for intermediates) |
| `addToCart` / `toggleCartDrawer` / `submitRFQRequest` | RFQ sourcing cart + Web3Forms submission |

### 5.4 Canonical fields

The site reads these field names after normalization:

`Product ID`, `Product Name`, `Chemical Name`, `Synonym`, `CAS Number`,
`Molecular Formula`, `Molecular Weight`, `Purity`, `Availability`,
`API Family`, `Packaging Size`, `Grade`, `Form`, `Packaging Type`, `Usage`, `MOQ`.

**Column names in the CSV do not need to match.** `canonicalField()` maps common wordings,
for example:

| Spreadsheet column | Canonical field |
| --- | --- |
| `COMMON NAME`, `Name of the Product`, `Product`, `Compound` | Product Name |
| `CHEMICAL NAME`, `IUPAC NAME` | Chemical Name |
| `CAS NO.`, `CAS No` | CAS Number |
| `CHEMICAL FORMULA` | Molecular Formula |
| `MOLECULAR WEIGHT` | Molecular Weight |
| `DELIVERY TIME`, `Availability`, `Lead Time` | Availability |
| `API usage`, `API Family` | API Family |
| `USAGE/ APPLICATION` | Usage |
| `MINIMUM ORDER QUANTITY`, `MOQ` | MOQ |

If a `Product ID` column is absent, IDs are auto-generated (`VQ-IMP-001`, `VQ-API-001`,
`VQ-INT-001`).

**To support a brand-new column wording**, add a rule in `canonicalField()` in
`assets/js/catalog.js` — this is the only place needed. The Python converter never maps
columns.

### 5.5 Table columns per catalog

- **Impurities / APIs**: Product ID · Compound Name · CAS Number · Formula · Mol. Weight · Purity · Availability · Actions
- **KSMs & Intermediates**: Product ID · Compound Name · CAS Number · API Family / Usage · Details · Purity · Availability · Actions

### 5.6 Resilient fallback (why the site never goes blank)

`initializeCatalogSearch()` loads in this order:

1. Fetch `assets/data/<catalog>.json` (with `?v=<timestamp>` to bypass cache).
2. If the response is missing, invalid, empty, or has no recognizable product name →
   use the embedded `window.VQ_*` data from `<catalog>-data.js`.
3. If that is also unavailable → render a friendly error block.

Result: a malformed or missing JSON file shows the last known-good data instead of breaking
the page.

### 5.7 Current data status

- **Impurities** — `Impurities.csv`, `impurities.json`, `impurities-data.js` present.
- **KSMs & Intermediates** — `intermediates.csv`, `intermediates.json`, `intermediates-data.js` present.
- **APIs** — ⚠️ only the page (`api.html`) exists; `api.json` / `api-data.js` (or `API.csv`)
  are **not yet in the repo**, so the APIs catalog currently has no data. Add `API.csv`
  (Option A) or `api.json` (Option B) to populate it.

---

## 6. Updating catalog data

There are two supported workflows. Pick one.

### Option A — Automatic via GitHub Actions (current)

**Files:** `.github/workflows/deploy.yml` + `scripts/csv_to_json.py`

1. Client uploads/replaces a CSV in `assets/data/` on GitHub (Add file → Upload files → Commit).
   No local Git knowledge required.
2. The `Build and deploy site` workflow runs:
   - `python scripts/csv_to_json.py` converts every `*.csv` to `*.json` + `*-data.js`
     (inside the runner only).
   - The site is packaged and deployed to GitHub Pages.
3. If a CSV is unreadable, the step fails, **no deployment happens**, and the previously
   deployed site stays live. The reason appears as an annotation on the failed run.

**Prerequisite:** Settings → Pages → Source = **GitHub Actions**.

**Filename mapping** (prefix inference is tolerant; exact names win):

| CSV filename | Output |
| --- | --- |
| `Impurities.csv` / `Impurities list.csv` | `impurities.json` + `impurities-data.js` |
| `API.csv` / `APIs.csv` / `List of APIs.csv` | `api.json` + `api-data.js` |
| `Intermediates.csv` / `KSMs.csv` | `intermediates.json` + `intermediates-data.js` |

### Option B — Manual (desktop utility / no Action)

**Files:** the separate `csv_to_json` utility (e.g. `E:\Projects\csv_to_json\csv_to_json_converter.py`).

1. Remove/disable `.github/workflows/deploy.yml`.
2. Settings → Pages → Source = **Deploy from a branch** (otherwise nothing publishes).
3. Client converts the spreadsheet with the utility → gets `<name>.json`.
4. Client uploads the JSON into `assets/data/` on GitHub and commits.
   - Optionally upload the matching `<name>-data.js` too (see notes below).
5. GitHub Pages rebuilds from the branch and the site serves the new JSON.

**Requirements / gotchas**

- The output filename **must match exactly** (lowercase): `impurities.json`, `api.json`,
  `intermediates.json`. GitHub Pages is case-sensitive — `Impurities.json` will 404.
  The utility lowercases known base names, but a differently named CSV yields a different
  output name.
- The desktop utility outputs **only `.json`**, not the `-data.js` fallback. The fallback is
  optional, but keeping it updated preserves the "last known-good data" safety net.
- Column names are handled in `catalog.js`, so the utility can stay fully generic.

### Option A vs Option B

| | Option A (Actions) | Option B (manual) |
| --- | --- | --- |
| Client effort | Upload CSV only | Convert + upload JSON (+ JS) |
| Reliability | Depends on Actions running | Depends only on Pages branch build |
| Generated files in repo | No | Yes (uploaded) |
| Build-time validation | Yes (bad CSV → no deploy, site stays up) | No (bad JSON → fallback or error) |
| Filename mistakes | Handled by the script's mapping | Client must name files exactly |

---

## 7. Adding a new catalog

1. Add the catalog to `catalogConfig` in `assets/js/catalog.js` (e.g. `solvents: { file: 'solvents.json', title: 'Solvents' }`).
2. Add a page that includes:
   ```html
   <script src="assets/data/solvents-data.js"></script>
   <script src="assets/js/catalog.js"></script>
   <script>initializeCatalogSearch('solvents');</script>
   ```
3. Add a `CATALOG_ID_PREFIX` entry (e.g. `solvents: 'VQ-SLV'`) and, if needed, an
   `OUTPUT_NAMES` entry in `scripts/csv_to_json.py` (Option A) or just name the CSV/JSON
   `solvents.*` (both options).
4. Drop the CSV in `assets/data/` (Option A) or upload the JSON (Option B).

---

## 8. Local development & testing

Because the pages fetch JSON, opening the HTML via `file://` will not load catalog data
(browsers block local `fetch`); the embedded `*-data.js` fallback is used instead.

Run a local web server from the repo root:

```bash
python3 -m http.server 8000
# then open http://localhost:8000/index.html
```

Regenerate catalog JSON locally (standard-library Python only):

```bash
python scripts/csv_to_json.py
# Impurities.csv     -> impurities.json, impurities-data.js (17 rows)
# intermediates.csv  -> intermediates.json, intermediates-data.js (57 rows)
```

If a CSV is missing required structure the script exits non-zero and **writes nothing**, so
existing data is preserved.

---

## 9. Troubleshooting

| Symptom | Cause / fix |
| --- | --- |
| Catalog page shows "Failed to load chemical database" | No JSON **and** no `<catalog>-data.js`, or the JSON is empty/invalid and no fallback exists. Add/repair the data files. |
| New data uploaded but page shows old data | Browser/CDN cache — page fetches with a cache-buster; hard-refresh. In Option B, confirm the filename matches exactly (case-sensitive). |
| Action fails with "Process completed with exit code 1" | A CSV could not be read; see the run's error annotation. The live site keeps the previous deployment. |
| Fields showing `N/A` / `Inquire` | The corresponding CSV column is missing or its wording is not mapped. Add a rule in `canonicalField()` (`assets/js/catalog.js`). |
| Local preview shows old data | You're opening `file://`; run a local server (section 8) so `fetch` can read the JSON. |

---

## 10. Security notes

- **Do not commit secrets.** Git remote URLs and tokens must never be embedded in files in
  this repository. If a Personal Access Token (PAT) is ever placed in a remote URL or a
  committed file, rotate/revoke it immediately and re-clone with a clean URL.
- The `WEB3FORMS_KEY` in `catalog.js` is a public form access key by design; it is safe to
  expose in client-side code.
- Catalog JSON/CSV contain only product data — no credentials.
