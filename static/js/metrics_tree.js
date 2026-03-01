/* ============================================================
   PM Metrics Tree — D3.js v7 Interactive Collapsible Tree
============================================================ */

(function () {
  'use strict';

  // ── Constants ──────────────────────────────────────────────
  const NODE_WIDTH  = 160;
  const NODE_HEIGHT = 52;
  const H_GAP       = 48;   // horizontal gap between levels
  const V_GAP       = 14;   // vertical gap between siblings
  const ROOT_W      = 180;
  const ROOT_H      = 60;

  const CAT_COLORS = {
    root:         '#26d15f',
    growth:       '#26d15f',
    activation:   '#3b82f6',
    retention:    '#8b5cf6',
    engagement:   '#f59e0b',
    revenue:      '#ec4899',
    satisfaction: '#06b6d4',
    quality:      '#64748b',
  };

  const CAT_BG = {
    root:         'rgba(38,209,95,0.18)',
    growth:       'rgba(38,209,95,0.14)',
    activation:   'rgba(59,130,246,0.14)',
    retention:    'rgba(139,92,246,0.14)',
    engagement:   'rgba(245,158,11,0.14)',
    revenue:      'rgba(236,72,153,0.14)',
    satisfaction: 'rgba(6,182,212,0.14)',
    quality:      'rgba(100,116,139,0.14)',
  };

  // ── State ───────────────────────────────────────────────────
  let root, tree, svg, gMain, zoom, activeNode = null;

  // ── Init ────────────────────────────────────────────────────
  function init() {
    showLoading();

    fetch('/api/tree/')
      .then(r => r.json())
      .then(data => {
        hideLoading();
        buildTree(data[0]);   // single root
        bindControls();
        bindPanel();
      })
      .catch(err => {
        console.error('Failed to load metrics tree:', err);
        showError();
      });
  }

  // ── Loading states ──────────────────────────────────────────
  function showLoading() {
    const wrapper = document.getElementById('tree-wrapper');
    wrapper.innerHTML = `
      <div class="tree-loading">
        <div class="tree-loading-spinner"></div>
        <span>Loading metrics tree…</span>
      </div>`;
  }

  function hideLoading() {
    const wrapper = document.getElementById('tree-wrapper');
    wrapper.innerHTML = `
      <svg id="tree-svg">
        <defs>
          <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" flood-color="rgba(0,0,0,0.5)" flood-opacity="1"/>
          </filter>
          <filter id="shadow-hover" x="-30%" y="-30%" width="160%" height="160%">
            <feDropShadow dx="0" dy="4" stdDeviation="8" flood-color="rgba(0,0,0,0.7)" flood-opacity="1"/>
          </filter>
        </defs>
        <g id="tree-root-g"></g>
      </svg>`;
  }

  function showError() {
    const wrapper = document.getElementById('tree-wrapper');
    wrapper.innerHTML = `
      <div class="tree-loading">
        <span style="font-size:32px">⚠️</span>
        <span style="color:#ef4444">Failed to load. Please refresh the page.</span>
      </div>`;
  }

  // ── Build D3 tree ────────────────────────────────────────────
  function buildTree(rawData) {
    const wrapper = document.getElementById('tree-wrapper');
    const W = wrapper.clientWidth  || 1200;
    const H = wrapper.clientHeight || 620;

    svg = d3.select('#tree-svg')
      .attr('width', W)
      .attr('height', H);

    gMain = d3.select('#tree-root-g');

    // D3 hierarchy
    root = d3.hierarchy(rawData, d => d.children);

    // Collapse everything except root
    root.descendants().forEach(d => {
      if (d.depth > 0) {
        d._children = d.children;
        d.children  = null;
      }
    });

    // Tree layout — horizontal (left→right), swap x/y
    tree = d3.tree()
      .nodeSize([NODE_HEIGHT + V_GAP, NODE_WIDTH + H_GAP])
      .separation((a, b) => (a.parent === b.parent ? 1 : 1.4));

    // Zoom — wheel only (no mouse-drag pan)
    zoom = d3.zoom()
      .filter(event => event.type === 'wheel' || event.type === 'touchstart' || event.type === 'touchmove')
      .scaleExtent([0.1, 3])
      .on('zoom', e => gMain.attr('transform', e.transform));

    svg.call(zoom);

    // Initial render
    update(root);

    // Show North Star details by default
    showPanel(root.data);

    // Fit after transition completes (duration = 320ms)
    setTimeout(() => fitView(wrapper.clientWidth, wrapper.clientHeight), 440);

    // Resize handler
    const ro = new ResizeObserver(() => {
      const nw = wrapper.clientWidth || 1200;
      const nh = wrapper.clientHeight || 620;
      svg.attr('width', nw).attr('height', nh);
    });
    ro.observe(wrapper);
  }

  // ── Update (re-render) ───────────────────────────────────────
  function update(source) {
    const wrapper  = document.getElementById('tree-wrapper');
    const W        = wrapper.clientWidth  || 1200;
    const H        = wrapper.clientHeight || 620;
    const duration = 320;

    // Compute layout
    const treeData = tree(root);
    const nodes    = treeData.descendants();
    const links    = treeData.links();

    // ── Links ────────────────────────────────────────────────
    const link = gMain.selectAll('path.link')
      .data(links, d => d.target.data.slug);

    // Enter links
    const linkEnter = link.enter()
      .insert('path', 'g')
      .attr('class', 'link')
      .attr('stroke', d => CAT_COLORS[d.target.data.category] || '#26d15f')
      .attr('d', () => {
        const o = { x: source.x0 ?? source.x, y: source.y0 ?? source.y };
        return diagonal(o, o);
      });

    // Update + enter links
    link.merge(linkEnter)
      .transition().duration(duration)
      .attr('stroke', d => CAT_COLORS[d.target.data.category] || '#26d15f')
      .attr('d', d => diagonal(d.source, d.target));

    // Exit links
    link.exit()
      .transition().duration(duration)
      .attr('d', () => {
        const o = { x: source.x, y: source.y };
        return diagonal(o, o);
      })
      .remove();

    // ── Nodes ────────────────────────────────────────────────
    const node = gMain.selectAll('g.node-group')
      .data(nodes, d => d.data.slug);

    // Enter nodes
    const nodeEnter = node.enter()
      .append('g')
      .attr('class', 'node-group')
      .attr('transform', () => {
        const sx = source.x0 ?? source.x;
        const sy = source.y0 ?? source.y;
        return `translate(${sy},${sx})`;
      })
      .attr('opacity', 0)
      .on('click', (event, d) => {
        event.stopPropagation();
        handleNodeClick(d);
      })
      .on('mouseenter', function (event, d) {
        d3.select(this).select('rect.node-rect')
          .attr('stroke-width', d.depth === 0 ? 3 : 2.5)
          .attr('filter', 'url(#shadow-hover)');
      })
      .on('mouseleave', function (event, d) {
        const isActive = activeNode && activeNode.data.slug === d.data.slug;
        d3.select(this).select('rect.node-rect')
          .attr('stroke-width', isActive ? 2.5 : (d.depth === 0 ? 2 : 1.5))
          .attr('filter', isActive ? 'url(#shadow-hover)' : 'url(#shadow)');
      });

    // Determine node dims
    const nw = (d) => d.depth === 0 ? ROOT_W : NODE_WIDTH;
    const nh = (d) => d.depth === 0 ? ROOT_H : NODE_HEIGHT;

    // Background rect
    nodeEnter.append('rect')
      .attr('class', 'node-rect')
      .attr('x', d => -nw(d) / 2)
      .attr('y', d => -nh(d) / 2)
      .attr('width',  d => nw(d))
      .attr('height', d => nh(d))
      .attr('rx', d => d.depth === 0 ? 14 : 10)
      .attr('ry', d => d.depth === 0 ? 14 : 10)
      .attr('fill', d => CAT_BG[d.data.category] || 'rgba(38,209,95,0.14)')
      .attr('stroke', d => CAT_COLORS[d.data.category] || '#26d15f')
      .attr('stroke-width', d => d.depth === 0 ? 2 : 1.5)
      .attr('filter', 'url(#shadow)');

    // Icon circle (left side)
    nodeEnter.append('circle')
      .attr('cx', d => -nw(d) / 2 + 18)
      .attr('cy', 0)
      .attr('r', 13)
      .attr('fill', d => CAT_COLORS[d.data.category] || '#26d15f')
      .attr('opacity', 0.2);

    // Icon text
    nodeEnter.append('text')
      .attr('class', 'node-icon')
      .attr('x', d => -nw(d) / 2 + 18)
      .attr('y', 1)
      .attr('font-size', d => d.depth === 0 ? '16px' : '13px')
      .text(d => d.data.icon || '📊');

    // Label (main)
    nodeEnter.append('text')
      .attr('class', 'node-label')
      .attr('x', d => -nw(d) / 2 + 38)
      .attr('y', 0)
      .attr('fill', '#ffffff')
      .attr('font-size', d => d.depth === 0 ? '13px' : '11.5px')
      .attr('font-weight', '600')
      .attr('dominant-baseline', 'middle')
      .attr('font-family', "'Inter', sans-serif")
      .each(function (d) {
        const el   = d3.select(this);
        const text = d.data.name;
        const maxW = nw(d) - 52;
        wrapText(el, text, maxW, d.depth === 0 ? 13 : 11.5);
      });

    // Expand/collapse badge
    nodeEnter.append('circle')
      .attr('class', 'node-expand-btn')
      .attr('cx', d => nw(d) / 2 - 10)
      .attr('cy', 0)
      .attr('r', 7)
      .attr('fill', d => CAT_COLORS[d.data.category] || '#26d15f')
      .attr('opacity', d => (d.children || d._children) ? 0.85 : 0)
      .attr('stroke', '#111')
      .attr('stroke-width', 1);

    nodeEnter.append('text')
      .attr('class', 'node-toggle-text')
      .attr('x', d => nw(d) / 2 - 10)
      .attr('y', 1)
      .attr('text-anchor', 'middle')
      .attr('dominant-baseline', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', '700')
      .attr('fill', '#111')
      .attr('pointer-events', 'none')
      .attr('opacity', d => (d.children || d._children) ? 1 : 0)
      .text(d => d.children ? '−' : '+');

    // Update + enter
    const nodeUpdate = node.merge(nodeEnter)
      .transition().duration(duration)
      .attr('transform', d => `translate(${d.y},${d.x})`)
      .attr('opacity', 1);

    // Active-node fill brightener: multiply opacity by 2.5×
    const CAT_BG_ACTIVE = {
      root:         'rgba(38,209,95,0.40)',
      growth:       'rgba(38,209,95,0.36)',
      activation:   'rgba(59,130,246,0.36)',
      retention:    'rgba(139,92,246,0.36)',
      engagement:   'rgba(245,158,11,0.36)',
      revenue:      'rgba(236,72,153,0.36)',
      satisfaction: 'rgba(6,182,212,0.36)',
      quality:      'rgba(100,116,139,0.36)',
    };

    // Update rects
    nodeUpdate.select('rect.node-rect')
      .attr('fill', d => {
        if (activeNode && activeNode.data.slug === d.data.slug) {
          return CAT_BG_ACTIVE[d.data.category] || 'rgba(38,209,95,0.36)';
        }
        return CAT_BG[d.data.category] || 'rgba(38,209,95,0.14)';
      })
      .attr('stroke-width', d => {
        if (activeNode && activeNode.data.slug === d.data.slug) return 2.5;
        return d.depth === 0 ? 2 : 1.5;
      })
      .attr('filter', d => {
        if (activeNode && activeNode.data.slug === d.data.slug) return 'url(#shadow-hover)';
        return 'url(#shadow)';
      });

    // Update expand badge
    nodeUpdate.select('.node-expand-btn')
      .attr('opacity', d => (d.children || d._children) ? 0.85 : 0);

    nodeUpdate.select('text.node-toggle-text')
      .text(d => d.children ? '−' : '+')
      .attr('opacity', d => (d.children || d._children) ? 1 : 0);

    // Exit nodes
    node.exit()
      .transition().duration(duration)
      .attr('transform', () => `translate(${source.y},${source.x})`)
      .attr('opacity', 0)
      .remove();

    // Save positions for transitions
    nodes.forEach(d => { d.x0 = d.x; d.y0 = d.y; });
  }

  // ── Node click handler ───────────────────────────────────────
  function handleNodeClick(d) {
    // Toggle expand/collapse
    if (d.children) {
      d._children = d.children;
      d.children  = null;
    } else if (d._children) {
      d.children  = d._children;
      d._children = null;
    }

    // Update active node for highlight
    activeNode = d;
    update(d);

    // Auto-fit after transition
    setTimeout(() => {
      const wrapper = document.getElementById('tree-wrapper');
      fitView(wrapper.clientWidth, wrapper.clientHeight);
    }, 440);

    // Show detail panel
    showPanel(d.data);
  }

  // ── Diagonal link path ───────────────────────────────────────
  function diagonal(s, d) {
    // Horizontal (y = depth axis, x = breadth axis)
    const sx = s.y, sy = s.x;
    const dx = d.y, dy = d.x;
    const midX = (sx + dx) / 2;
    return `M ${sx} ${sy}
            C ${midX} ${sy},
              ${midX} ${dy},
              ${dx} ${dy}`;
  }

  // ── Text wrapping ────────────────────────────────────────────
  function wrapText(el, text, maxWidth, fontSize) {
    const words     = text.split(/\s+/);
    const lineH     = fontSize * 1.25;
    let line        = [];
    let lineNum     = 0;
    const tspans    = [];

    // Estimate character width (rough)
    const charW = fontSize * 0.55;

    words.forEach(word => {
      line.push(word);
      const lineStr = line.join(' ');
      if (lineStr.length * charW > maxWidth && line.length > 1) {
        line.pop();
        tspans.push(line.join(' '));
        line    = [word];
        lineNum++;
      }
    });
    tspans.push(line.join(' '));

    const totalH = tspans.length * lineH;
    const startY = -totalH / 2 + lineH * 0.5;

    el.text(null);
    tspans.forEach((t, i) => {
      el.append('tspan')
        .attr('x', el.attr('x'))
        .attr('dy', i === 0 ? startY + 'px' : lineH + 'px')
        .text(t);
    });
  }

  // ── Fit view ─────────────────────────────────────────────────
  function fitView(W, H) {
    const bounds = gMain.node().getBBox();
    if (!bounds.width || !bounds.height) return;

    const pad  = 60;
    const scaleX = (W - pad * 2) / bounds.width;
    const scaleY = (H - pad * 2) / bounds.height;
    const scale  = Math.min(scaleX, scaleY, 1.0);

    const tx = (W - bounds.width  * scale) / 2 - bounds.x * scale;
    const ty = (H - bounds.height * scale) / 2 - bounds.y * scale;

    svg.transition().duration(500)
      .call(zoom.transform, d3.zoomIdentity.translate(tx, ty).scale(scale));
  }

  // ── Controls ─────────────────────────────────────────────────
  const ZOOM_STEP = 1.35;
  const PAN_STEP  = 120;

  function bindControls() {
    const wrapper = () => document.getElementById('tree-wrapper');

    document.getElementById('btn-expand-all').addEventListener('click', () => {
      root.descendants().forEach(d => {
        if (d._children) { d.children = d._children; d._children = null; }
      });
      update(root);
      setTimeout(() => fitView(wrapper().clientWidth, wrapper().clientHeight), 440);
    });

    document.getElementById('btn-collapse-all').addEventListener('click', () => {
      root.descendants().forEach(d => {
        if (d.depth > 0 && d.children) { d._children = d.children; d.children = null; }
      });
      update(root);
      setTimeout(() => fitView(wrapper().clientWidth, wrapper().clientHeight), 440);
    });

    document.getElementById('btn-reset-view').addEventListener('click', () => {
      fitView(wrapper().clientWidth, wrapper().clientHeight);
    });

    // Zoom in / out
    document.getElementById('btn-zoom-in').addEventListener('click', () => {
      svg.transition().duration(280).call(zoom.scaleBy, ZOOM_STEP);
    });
    document.getElementById('btn-zoom-out').addEventListener('click', () => {
      svg.transition().duration(280).call(zoom.scaleBy, 1 / ZOOM_STEP);
    });

    // Directional pan
    document.getElementById('btn-nav-up').addEventListener('click', () => {
      svg.transition().duration(200).call(zoom.translateBy, 0, PAN_STEP);
    });
    document.getElementById('btn-nav-down').addEventListener('click', () => {
      svg.transition().duration(200).call(zoom.translateBy, 0, -PAN_STEP);
    });
    document.getElementById('btn-nav-left').addEventListener('click', () => {
      svg.transition().duration(200).call(zoom.translateBy, PAN_STEP, 0);
    });
    document.getElementById('btn-nav-right').addEventListener('click', () => {
      svg.transition().duration(200).call(zoom.translateBy, -PAN_STEP, 0);
    });
  }

  // ── Detail Panel ─────────────────────────────────────────────
  function bindPanel() {
    // Click on SVG background resets panel to North Star
    document.getElementById('tree-svg').addEventListener('click', () => {
      activeNode = null;
      update(root);
      showPanel(root.data);
    });
  }

  function showPanel(data) {
    const content = document.getElementById('panel-content');
    const color   = CAT_COLORS[data.category] || '#26d15f';
    const bg      = CAT_BG[data.category]    || 'rgba(38,209,95,0.14)';

    const catLabel = {
      root: 'Root', growth: 'Growth', activation: 'Activation',
      retention: 'Retention', engagement: 'Engagement',
      revenue: 'Revenue', satisfaction: 'Satisfaction', quality: 'Quality',
    }[data.category] || data.category;

    const sections = [];

    if (data.full_description) {
      sections.push(`
        <div class="panel-section">
          <div class="panel-section-title">What is it?</div>
          <div class="panel-section-body">${esc(data.full_description)}</div>
        </div>`);
    }

    if (data.formula) {
      sections.push(`
        <div class="panel-section">
          <div class="panel-section-title">Formula / Calculation</div>
          <div class="panel-formula">${esc(data.formula)}</div>
        </div>`);
    }

    if (data.why_it_matters) {
      sections.push(`
        <div class="panel-section">
          <div class="panel-section-title">Why it matters for PMs</div>
          <div class="panel-section-body">${esc(data.why_it_matters)}</div>
        </div>`);
    }

    if (data.how_to_improve) {
      const tips = data.how_to_improve.split(/\.\s+/).filter(t => t.trim().length > 4);
      const listItems = tips.map(t => `<li>${esc(t.trim().replace(/\.$/, ''))}</li>`).join('');
      sections.push(`
        <div class="panel-section">
          <div class="panel-section-title">How to improve</div>
          <ul class="improve-list">${listItems}</ul>
        </div>`);
    }

    if (data.benchmark) {
      sections.push(`
        <div class="panel-section">
          <div class="panel-section-title">Industry Benchmark</div>
          <div class="panel-benchmark">${esc(data.benchmark)}</div>
        </div>`);
    }

    content.innerHTML = `
      <div class="panel-header">
        <div class="panel-category-badge"
             style="background:${bg};border-color:${color}20;color:${color}">
          ${esc(catLabel)}
        </div>
        <div class="panel-icon">${esc(data.icon || '📊')}</div>
        <div class="panel-name">${esc(data.name)}</div>
        <div class="panel-short-desc">${esc(data.short_description)}</div>
      </div>
      ${sections.join('')}
    `;

    content.scrollTop = 0;
  }

  function closePanel() {
    if (root) showPanel(root.data);
  }

  // ── Utilities ─────────────────────────────────────────────────
  function esc(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/\n/g, '<br>');
  }

  // ── Boot ──────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
