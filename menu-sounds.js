/* Short synthesized mechanical clicks. The persistent outer frame owns both audio voices. */
(() => {
  'use strict';
  const inContent = window.IG_FRAME_CONTENT === true;
  const key = 'ig-menu-sounds-enabled';
  const selector = 'button,a[href],summary,[role="button"],[role="tab"]';
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
  let controller;

  if (!inContent) {
    let enabled = true, unlocked = false, lastHoverAt = -Infinity, lastClickAt = -Infinity;
    try { enabled = localStorage.getItem(key) !== 'false'; } catch {}
    const voices = {};
    for (const [kind, rate, volume] of [['click', 1, .20], ['hover', 1, .09]]) {
      const audio = new Audio(new URL('ui-menu-' + kind + '.wav?v=20261024c', document.baseURI).href);
      audio.preload = 'auto';
      audio.hidden = true;
      audio.setAttribute('aria-hidden', 'true');
      audio.dataset.igUiSound = kind;
      audio.volume = volume;
      audio.playbackRate = rate;
      if ('preservesPitch' in audio) audio.preservesPitch = false;
      document.body.append(audio);
      voices[kind] = audio;
    }
    const stop = audio => { audio.pause(); try { audio.currentTime = 0; } catch {} };
    const stopAll = () => Object.values(voices).forEach(stop);
    function emit(kind) {
      if (kind === 'unlock') { unlocked = true; return; }
      if (!enabled || !unlocked || document.hidden || !voices[kind]) return;
      const now = performance.now();
      if (kind === 'hover') {
        if (now - lastHoverAt < 45 || now - lastClickAt < 90) return;
        lastHoverAt = now;
      } else {
        if (now - lastClickAt < 30) return;
        lastClickAt = now;
        stop(voices.hover);
      }
      const voice = voices[kind];
      stop(voice);
      const playing = voice.play();
      playing?.catch(error => { if (error.name === 'NotAllowedError') unlocked = false; });
    }
    controller = window.IGMenuSound = { emit };
    addEventListener('storage', event => {
      if (event.key !== key) return;
      enabled = event.newValue !== 'false';
      if (!enabled) stopAll();
    });
    addEventListener('message', event => {
      const frame = (window.IGActiveContentFrame?.() || document.getElementById('ig-content-frame'));
      if (event.source !== frame?.contentWindow || (location.protocol !== 'file:' && event.origin !== location.origin)) return;
      if (event.data?.type === 'ig-menu-sound') emit(event.data.kind);
    });
    document.addEventListener('visibilitychange', () => { if (document.hidden) stopAll(); });
    addEventListener('pagehide', stopAll);
  }

  function send(kind) {
    if (!inContent) { controller?.emit(kind); return; }
    try { if (parent.IGMenuSound) { parent.IGMenuSound.emit(kind); return; } } catch {}
    parent.postMessage({ type: 'ig-menu-sound', kind }, location.protocol === 'file:' ? '*' : location.origin);
  }
  function control(target) {
    const element = target instanceof Element ? target.closest(selector) : null;
    if (!element || element.matches('[data-ig-sound-toggle],:disabled') || element.closest('[aria-disabled="true"],[hidden],[inert]')) return null;
    return element;
  }
  let hovered = null, keyboard = false;
  document.addEventListener('pointerdown', event => {
    if (!event.isTrusted) return;
    keyboard = false; send('unlock');
  }, { capture: true, passive: true });
  document.addEventListener('keydown', event => {
    if (!event.isTrusted) return;
    keyboard = true; send('unlock');
  }, { capture: true });
  document.addEventListener('pointerover', event => {
    if (!event.isTrusted || event.pointerType === 'touch' || !finePointer.matches) return;
    const element = control(event.target);
    if (!element || element === hovered || element.contains(event.relatedTarget)) return;
    hovered = element; send('hover');
  }, { passive: true });
  document.addEventListener('pointerout', event => {
    if (hovered && !hovered.contains(event.relatedTarget)) hovered = null;
  }, { passive: true });
  document.addEventListener('focusin', event => { if (keyboard && control(event.target)) send('hover'); });
  document.addEventListener('click', event => {
    if (!event.isTrusted || !control(event.target)) return;
    send('unlock'); send('click');
  }, { capture: true });
})();
