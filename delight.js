/* Decorative symbols stay inside a reserved strip above the navigation. */
(() => {
  'use strict';
  if (window.IG_FRAME_CONTENT) return;
  const shell = document.querySelector('.site-shell');
  const header = shell && shell.querySelector('header');
  if (!header || shell.querySelector('.ig-delight-ribbon')) return;
  const ribbon = document.createElement('div');
  ribbon.className = 'ig-delight-ribbon';
  ribbon.setAttribute('aria-hidden', 'true');
  const track = document.createElement('div');
  track.className = 'ig-ribbon-track';
  for (let i = 0; i < 2; i++) {
    const copy = document.createElement('span');
    copy.textContent = '✦  ♡  ·  ✧  ·  ♡  ✦  ·  '.repeat(8);
    track.append(copy);
  }
  ribbon.append(track);
  header.before(ribbon);
})();

/* Click hearts live above the persistent header and survive content navigation. */
(() => {
  'use strict';
  const inContent = window.IG_FRAME_CONTENT === true;
  let burst;
  if (!inContent) {
    const layer = document.createElement('div');
    layer.className = 'ig-click-hearts';
    layer.setAttribute('aria-hidden', 'true');
    document.body.append(layer);
    let last = -Infinity;
    burst = (x, y, fromContent = false) => {
      if (document.hidden || !Number.isFinite(x) || !Number.isFinite(y)) return;
      const now = performance.now();
      if (now - last < 100) return;
      last = now;
      if (fromContent) {
        const box = (window.IGActiveContentFrame?.() || document.getElementById('ig-content-frame'))?.getBoundingClientRect();
        if (!box) return;
        x += box.left; y += box.top;
      }
      for (let i = 0; i < 9; i++) {
        if (layer.childElementCount >= 36) layer.firstElementChild.remove();
        const particle = document.createElement('span');
        const angle = i * 137.5 * Math.PI / 180;
        const distance = 36 + (i % 3) * 15;
        particle.textContent = ['♥', '✦', '♡', '✧'][i % 4];
        particle.style.left = x + 'px'; particle.style.top = y + 'px';
        particle.style.setProperty('--dx', Math.cos(angle) * distance + 'px');
        particle.style.setProperty('--dy', Math.sin(angle) * distance - 20 + 'px');
        particle.style.setProperty('--spin', (i % 2 ? 42 : -42) + 'deg');
        particle.style.setProperty('--tone', ['var(--pink)', 'var(--blue)', 'var(--muted)'][i % 3]);
        particle.style.setProperty('--size', 16 + i % 3 * 3 + 'px');
        particle.addEventListener('animationend', () => particle.remove(), { once: true });
        layer.append(particle);
      }
    };
    window.IGClickHearts = { burst };
    addEventListener('message', event => {
      const frame = (window.IGActiveContentFrame?.() || document.getElementById('ig-content-frame'));
      if (event.source !== frame?.contentWindow || (location.protocol !== 'file:' && event.origin !== location.origin)) return;
      if (event.data?.type === 'ig-click-hearts') burst(event.data.x, event.data.y, true);
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) layer.replaceChildren(); });
  }
  document.addEventListener('click', event => {
    if (!event.isTrusted || !(event.target instanceof Element)) return;
    const control = event.target.closest('button,a[href],summary,[role="button"],[role="tab"]');
    if (!control || control.matches(':disabled') || control.closest('[aria-disabled="true"],[hidden],[inert]')) return;
    const box = control.getBoundingClientRect();
    const x = event.detail ? event.clientX : box.left + box.width / 2;
    const y = event.detail ? event.clientY : box.top + box.height / 2;
    if (!inContent) { burst(x, y); return; }
    try { if (parent.IGClickHearts) { parent.IGClickHearts.burst(x, y, true); return; } } catch {}
    parent.postMessage({ type: 'ig-click-hearts', x, y }, location.protocol === 'file:' ? '*' : location.origin);
  }, { capture: true, passive: true });
})();

/* Persistent pointer feedback for controls and readable content, without moving layout. */
(() => {
  'use strict';
  const shell = document.querySelector('.site-shell');
  if (!shell) return;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const controls = 'button,a[href],summary,input,select,textarea,[role="button"],[role="tab"],[role="link"],.platform-option';
  const surfaces = [
    'p','li','h1','h2','h3','h4','h5','h6','small','pre','code','blockquote','tr','figcaption','img',
    '.profile-fact','.profile-detail-line','.profile-group-title','.profile-relation',
    '.record-doc','.npc-trait','.npc-note-label','.npc-original','.npc-note',
    '.model-flow-chip','.model-separate-choice','.setting-metric','.command-explainer',
    '.command-platform-label','.copy-card-badge','.copy-field-label','.guide-copy-label',
    '.titlebar','.section-heading','.page-masthead','.world-lead','.world-idea-card',
    '.guide-card','.guide-model-section','.guide-instructions','.settings-path',
    '.tags > span','.relation-label','.records-heading','.opening-detail','.player',
    '.track-timeline','.track-volume','.track-options','.track-original',
    'figure','.window','header','footer'
  ].join(',');
  let current = null, point = null, frame = 0;
  function clear() {
    if (current) { current.removeAttribute('data-ig-hover'); current.removeAttribute('data-ig-tone'); current.removeAttribute('data-ig-fill'); }
    current = null;
  }
  function show(node) {
    let next = null;
    if (fine.matches && node instanceof Element && shell.contains(node)) {
      next = node.closest(controls) || (document.body.matches('.page-guide') ? null : node.closest(surfaces));
      if (next && (!shell.contains(next) || next.closest('[hidden],[inert],[aria-hidden="true"]'))) next = null;
    }
    if (next === current) return;
    clear();
    if (next) {
      current = next;
      const appearance = getComputedStyle(current);
      current.setAttribute('data-ig-tone', appearance.color === 'rgb(117, 105, 140)' ? 'ink' : 'muted');
      current.setAttribute('data-ig-fill', appearance.backgroundColor === 'rgb(255, 240, 247)' ? 'blue' : 'pink');
      current.setAttribute('data-ig-hover', current.matches(controls) ? 'control' : 'content');
    }
  }
  function refresh() {
    frame = 0;
    if (point) show(document.elementFromPoint(point.x, point.y));
  }
  function schedule() { if (point && !frame) frame = requestAnimationFrame(refresh); }
  function follow(event) {
    if (!fine.matches || event.pointerType === 'touch') return;
    point = { x: event.clientX, y: event.clientY };
    show(event.target);
  }
  function leave() { point = null; clear(); }
  document.addEventListener('pointerover', follow, { passive: true });
  document.addEventListener('pointermove', follow, { passive: true });
  document.addEventListener('pointerout', event => { if (!event.relatedTarget) leave(); }, { passive: true });
  document.addEventListener('click', schedule, { passive: true });
  document.addEventListener('keydown', event => { if (event.key === 'Tab') leave(); });
  document.addEventListener('visibilitychange', () => { if (document.hidden) leave(); });
  addEventListener('scroll', schedule, { passive: true, capture: true });
  addEventListener('resize', schedule, { passive: true });
  addEventListener('blur', leave);
  fine.addEventListener('change', () => { if (!fine.matches) leave(); });
  addEventListener('pagehide', () => { leave(); if (frame) cancelAnimationFrame(frame); frame = 0; });
})();
