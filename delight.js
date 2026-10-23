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
    '.tags','.relation-label','.records-heading','.opening-detail','.player',
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
      next = node.closest(controls) || node.closest(surfaces);
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
