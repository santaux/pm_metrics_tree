"""
Static site export utility for GitHub Pages deployment.
Renders the full metrics tree as a self-contained HTML site in docs/.
"""
import json
import os
import shutil

from django.conf import settings
from django.template.loader import render_to_string


def get_tree_data():
    """Query DB and return full recursive tree as a list of dicts."""
    from metrics.models import MetricNode
    roots = MetricNode.objects.filter(parent=None).prefetch_related(
        'children__children__children__children'
    )
    return [node.to_dict() for node in roots]


def export_static(output_dir=None):
    """
    Generate a static HTML site ready for GitHub Pages.

    Args:
        output_dir: Destination directory. Defaults to <project_root>/docs.

    Returns:
        dict with keys:
            output_dir  – absolute path to the output directory
            files       – list of files written
    """
    if output_dir is None:
        output_dir = os.path.join(settings.BASE_DIR, 'docs')
    output_dir = os.path.abspath(str(output_dir))

    # ── 1. Fetch tree data ──────────────────────────────────────
    tree_data = get_tree_data()
    tree_json = json.dumps(tree_data, ensure_ascii=False, separators=(',', ':'))

    # ── 2. Create output directory structure ────────────────────
    css_out = os.path.join(output_dir, 'static', 'css')
    js_out  = os.path.join(output_dir, 'static', 'js')
    os.makedirs(css_out, exist_ok=True)
    os.makedirs(js_out,  exist_ok=True)

    # ── 3. Copy static assets ───────────────────────────────────
    base = str(settings.BASE_DIR)
    src_css = os.path.join(base, 'static', 'css', 'styles.css')
    src_js  = os.path.join(base, 'static', 'js',  'metrics_tree.js')
    dst_css = os.path.join(css_out, 'styles.css')
    dst_js  = os.path.join(js_out,  'metrics_tree.js')
    shutil.copy2(src_css, dst_css)
    shutil.copy2(src_js,  dst_js)

    # ── 4. Render HTML template ─────────────────────────────────
    html = render_to_string('metrics/tree.html', {})

    # Rewrite absolute static URLs to relative paths
    html = html.replace('href="/static/', 'href="./static/')
    html = html.replace('src="/static/',  'src="./static/')

    # Fix navigation links so they don't 404 on GitHub Pages
    html = html.replace('href="/"',       'href="./index.html"')
    html = html.replace('href="/admin/"', 'href="#"')

    # Inject preloaded data before the D3 CDN <script> tag so the
    # exported page works without a Django backend.
    preload_tag = (
        f'<script>window.METRICS_TREE_PRELOADED={tree_json};</script>\n  '
    )
    html = html.replace(
        '<script src="https://cdn.jsdelivr.net/npm/d3@7',
        preload_tag + '<script src="https://cdn.jsdelivr.net/npm/d3@7',
    )

    # ── 5. Write index.html ─────────────────────────────────────
    index_path = os.path.join(output_dir, 'index.html')
    with open(index_path, 'w', encoding='utf-8') as fh:
        fh.write(html)

    return {
        'output_dir': output_dir,
        'files': [index_path, dst_css, dst_js],
    }
