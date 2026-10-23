/* Additive, input-transparent decoration. Never wraps or edits source content. */
(() => {
  'use strict';
  if (document.getElementById('ig-delight-layer')) return;
  const motion = matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  const layer = document.createElement('div');
  layer.id = 'ig-delight-layer';
  layer.className = 'ig-delight-layer';
  layer.setAttribute('aria-hidden', 'true');
  document.body.append(layer);

  const MAX_PARTICLES = 38;
  const MAX_TRAIL = 10;
  const particles = new Set();
  const timers = new Set();
  const anchors = [];
  const colors = ['var(--pink)', 'var(--blue)', 'var(--muted)'];
  const controls = 'button:not(:disabled), a[href], summary';
  // The complete folder subtree is intentionally excluded, in every state.
  const forbidden = '.npc-folder, .npc-folders';
  let frame = 0;
  let lastTrail = 0;
  let lastBurst = 0;
  let lastHover = 0;
  let lastX = -1000;
  let lastY = -1000;

  function later(fn, ms) {
    const id = setTimeout(() => { timers.delete(id); fn(); }, ms);
    timers.add(id);
  }
  function remove(node) { particles.delete(node); node.remove(); }
  function clearTransient() {
    timers.forEach(clearTimeout);
    timers.clear();
    particles.forEach(node => node.remove());
    particles.clear();
  }
  function active() { return !motion.matches && !document.hidden; }
  function allowed(target) {
    return target instanceof Element && !target.closest(forbidden);
  }
  function particle(x, y, index, trail = false) {
    if (!active() || particles.size >= MAX_PARTICLES) return;
    if (trail && layer.querySelectorAll('.ig-delight-particle--trail').length >= MAX_TRAIL) return;
    const node = document.createElement('span');
    const angle = (index * 137.5 + Math.random() * 36) * Math.PI / 180;
    const distance = trail ? 20 : 36 + Math.random() * 39;
    const life = trail ? 680 : 820 + Math.random() * 260;
    node.className = 'ig-delight-particle' + (trail ? ' ig-delight-particle--trail' : '');
    node.textContent = trail ? '\u2726' : ['\u2665', '\u2726', '\u2661', '\u2727'][index % 4];
    node.style.left = `${x}px`;
    node.style.top = `${y}px`;
    node.style.setProperty('--dx', `${Math.cos(angle) * distance}px`);
    node.style.setProperty('--dy', `${Math.sin(angle) * distance - (trail ? 0 : 24)}px`);
    node.style.setProperty('--spin', `${Math.round(Math.random() * 150 - 75)}deg`);
    node.style.setProperty('--life', `${life}ms`);
    node.style.setProperty('--size', `${trail ? 12 : 16 + index % 3 * 3}px`);
    node.style.setProperty('--tone', colors[index % colors.length]);
    particles.add(node);
    layer.append(node);
    later(() => remove(node), life + 60);
  }
  function burst(x, y, count = 9) {
    if (!active()) return;
    for (let i = 0; i < count; i++) particle(x, y, i);
  }
  function glint(target) {
    if (!active() || particles.size >= MAX_PARTICLES) return;
    const rect = target.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const node = document.createElement('span');
    node.className = 'ig-delight-glint';
    Object.assign(node.style, {
      left: `${rect.left}px`, top: `${rect.top}px`,
      width: `${rect.width}px`, height: `${rect.height}px`
    });
    particles.add(node);
    layer.append(node);
    later(() => remove(node), 650);
  }
  function positionAnchors() {
    frame = 0;
    for (const { source, slot, side } of anchors) {
      const rect = source.getBoundingClientRect();
      const visible = active() && rect.bottom > 0 && rect.top < innerHeight && rect.width > 0;
      slot.hidden = !visible;
      if (!visible) continue;
      // Clamp each complete decoration box to the viewport, never its host.
      const x = side === 'left' ? rect.left - 31 : rect.right - 49;
      slot.style.left = `${Math.max(0, Math.min(innerWidth - 82, x))}px`;
      slot.style.top = `${Math.max(0, Math.min(innerHeight - 66, rect.top - 24))}px`;
    }
  }
  function schedule() { if (!frame) frame = requestAnimationFrame(positionAnchors); }
  function setupAnchors() {
    // No profile-panel or folder observers; tab rerenders never replay effects.
    const sources = document.querySelectorAll('.brand-heart, .notebook figure, .player > img, .page-masthead, .titlebar, .section-heading');
    Array.from(sources).slice(0, 8).forEach((source, i) => {
      const slot = document.createElement('div');
      slot.className = 'ig-delight-anchor';
      slot.style.setProperty('--delay', `${-i * .73}s`);
      ['\u2661', '\u2726', '\u2727'].forEach((glyph, j) => {
        const charm = document.createElement('span');
        charm.className = 'ig-delight-charm' + (j === 1 ? ' ig-delight-charm--star' : j === 2 ? ' ig-delight-charm--tiny' : '');
        charm.textContent = glyph;
        slot.append(charm);
      });
      anchors.push({ source, slot, side: i % 2 ? 'right' : 'left' });
      layer.append(slot);
    });
    positionAnchors();
  }

  document.addEventListener('click', event => {
    if (!active() || !allowed(event.target)) return;
    const control = event.target.closest(controls);
    if (!control || control.getAttribute('aria-disabled') === 'true') return;
    const now = performance.now();
    if (now - lastBurst < 140) return;
    lastBurst = now;
    const rect = control.getBoundingClientRect();
    // Keyboard activation and touch receive the same visible response.
    const x = event.detail === 0 ? rect.left + rect.width / 2 : event.clientX;
    const y = event.detail === 0 ? rect.top + rect.height / 2 : event.clientY;
    burst(x, y);
    glint(control);
  }, { passive: true });
  document.addEventListener('pointerover', event => {
    if (!active() || !finePointer.matches || !allowed(event.target)) return;
    const control = event.target.closest(controls);
    if (!control || (event.relatedTarget instanceof Node && control.contains(event.relatedTarget))) return;
    const now = performance.now();
    if (now - lastHover < 230) return;
    lastHover = now;
    const rect = control.getBoundingClientRect();
    burst(rect.right - 5, rect.top + 4, 4);
    glint(control);
  }, { passive: true });
  document.addEventListener('pointermove', event => {
    if (!active() || !finePointer.matches || event.pointerType !== 'mouse' || !allowed(event.target)) return;
    const now = performance.now();
    if (now - lastTrail < 100 || Math.hypot(event.clientX - lastX, event.clientY - lastY) < 20) return;
    lastTrail = now;
    lastX = event.clientX;
    lastY = event.clientY;
    particle(lastX, lastY, Math.floor(now / 100), true);
  }, { passive: true });
  addEventListener('scroll', schedule, { passive: true, capture: true });
  addEventListener('resize', schedule, { passive: true });
  addEventListener('load', schedule, { once: true });
  document.addEventListener('visibilitychange', () => { clearTransient(); schedule(); });
  motion.addEventListener('change', () => { clearTransient(); schedule(); });
  addEventListener('pagehide', () => {
    clearTransient();
    if (frame) cancelAnimationFrame(frame);
    frame = 0;
  });
  addEventListener('pageshow', schedule);
  setupAnchors();
})();
