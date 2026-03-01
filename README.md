# PM Metrics Tree

An interactive metrics tree web app for Product Managers — built with Django + D3.js.

Inspired by [sidorkin.dev/treem](https://sidorkin.dev/treem/), redesigned and extended in the [productdo.io](https://productdo.io/) color scheme with a comprehensive English-language metrics framework.

## Features

- **54 metric nodes** across 7 pillars: Growth, Activation, Retention, Engagement, Revenue, Satisfaction, Quality
- **Interactive D3.js tree** — click to expand/collapse, zoom/pan, animated transitions
- **Detail panel** — every node has a definition, formula, why it matters, how to improve, and industry benchmarks
- **Django Admin** — add/edit/reorder metrics without touching code
- **Seed command** — re-seed the entire tree from code at any time

## Quick Start

```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python manage.py makemigrations metrics
python manage.py migrate
python manage.py seed_metrics
python manage.py createsuperuser   # optional, for admin access
python manage.py runserver
```

Open http://127.0.0.1:8000 in your browser.

Admin panel: http://127.0.0.1:8000/admin/  
Default admin credentials (if created via setup): `admin` / `admin1234`

## Re-seeding Metrics

To reset all metrics to the defaults from code:

```bash
python manage.py seed_metrics
```

This clears all existing nodes and re-creates them from `metrics/management/commands/seed_metrics.py`.

---

## Deploying to GitHub Pages

The app can be exported as a fully self-contained static site (no server required) and hosted for free on GitHub Pages.

### Step 1 — Export the static site

**Option A — Management command (terminal):**

```bash
# Make sure the Django server is NOT required — export reads the DB directly
python manage.py export_static
```

This generates a `docs/` folder in the project root:

```
docs/
├── index.html          ← fully self-contained page with embedded tree data
└── static/
    ├── css/styles.css
    └── js/metrics_tree.js
```

**Option B — Django Admin button:**

1. Open `http://127.0.0.1:8000/admin/`
2. Go to **Metrics → Metric nodes**
3. Click the green **"⬇ Export for GitHub Pages"** button at the top right
4. A success message confirms the `docs/` folder was written

> Re-run the export any time you update metrics in the Admin — then commit and push.

---

### Step 2 — Push to GitHub

```bash
git add docs/
git commit -m "chore: update GitHub Pages export"
git push origin main
```

---

### Step 3 — Enable GitHub Pages

1. Open your repository on GitHub
2. Go to **Settings → Pages**
3. Under **Build and deployment → Source**, select **Deploy from a branch**
4. Set **Branch** to `main` (or your default branch) and **Folder** to `/docs`
5. Click **Save**

GitHub will publish your site at:
```
https://<your-username>.github.io/<repo-name>/
```

It usually goes live within 1–2 minutes. The URL appears at the top of the Pages settings page once ready.

---

### How the export works

- Tree data is serialized from the database and **embedded directly** in `index.html` as `window.METRICS_TREE_PRELOADED`.  
  The D3.js visualization detects this variable and skips the API fetch — so the page works with zero backend.
- Fonts and D3.js are loaded from CDN (requires internet).
- All app CSS and JS are copied locally into `docs/static/`.

---

## Project Structure

```
MetricsTree/
├── manage.py
├── requirements.txt
├── pm_metrics_tree/              Django project config
│   ├── settings.py
│   └── urls.py
├── metrics/                      Main app
│   ├── models.py                 MetricNode (recursive tree)
│   ├── views.py                  Tree page + JSON API
│   ├── admin.py                  Admin config + Export button
│   ├── export.py                 Static site export utility
│   └── management/commands/
│       ├── seed_metrics.py       Seed / re-seed the DB
│       └── export_static.py      CLI export command
├── templates/
│   ├── base.html
│   ├── metrics/tree.html
│   └── admin/metrics/metricnode/
│       └── change_list.html      Custom admin changelist (Export button)
├── static/
│   ├── css/styles.css            Dark theme styles
│   └── js/metrics_tree.js        D3.js v7 collapsible tree
└── docs/                         ← GitHub Pages output (git-tracked)
    ├── index.html
    └── static/
```

## Metrics Covered

| Pillar | Key Metrics |
|---|---|
| 📈 Growth | Unique Visitors, Traffic Mix, Sign-up CVR, CAC (Paid/Organic), K-Factor |
| ✅ Activation | Activation Rate, TTFV, Onboarding Completion, Aha Moment, PQL |
| 🔄 Retention | D1/D7/D30 Retention, DAU/MAU, Stickiness, Churn Rate, Resurrection Rate |
| 💡 Engagement | Sessions/Week, Feature Adoption/Retention, Breadth of Use, Core Action |
| 💰 Revenue | MRR/ARR (New/Expansion/Churned), LTV, LTV:CAC, Payback Period, ARPU |
| 😊 Satisfaction | NPS, CSAT, CES, Support Ticket Volume |
| 🔧 Quality | Uptime, Error Rate, Page Load P95, Core Web Vitals, MTTR, Deploy Frequency |
