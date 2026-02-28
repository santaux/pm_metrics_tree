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

## Project Structure

```
pm-metrics-tree/
├── manage.py
├── requirements.txt
├── pm_metrics_tree/         Django project config
│   ├── settings.py
│   └── urls.py
├── metrics/                 Main app
│   ├── models.py            MetricNode (recursive tree)
│   ├── views.py             Tree page + JSON API
│   ├── admin.py             Admin config
│   └── management/commands/seed_metrics.py
├── templates/
│   ├── base.html
│   └── metrics/tree.html
└── static/
    ├── css/styles.css       productdo.io color scheme
    └── js/metrics_tree.js   D3.js v7 collapsible tree
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
