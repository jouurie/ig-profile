/* The header belongs to one document; only the content frame navigates. */
(() => {
  'use strict';
  const version = '20261024r';
  const names = ['index.html', 'world.html', 'starts.html', 'npc.html', 'guide.html', 'guide-nody.html', 'music.html'];
  const labels = ['소개·프로필', '세계관', '시작 상황', '주변 인물', '이용 가이드', '이용 가이드', '플레이리스트'];
  const base = new URL('./', location.href);
  const contentMode = window.parent !== window && new URL(location.href).searchParams.get('frame') === '1';
  window.IG_FRAME_CONTENT = contentMode;
  window.IG_FRAME_SHELL = !contentMode;
  document.documentElement.classList.add(contentMode ? 'ig-frame-content' : 'ig-frame-shell');

  function route(value) {
    try {
      const url = new URL(value, base);
      if (url.origin !== base.origin || new URL('./', url).pathname !== base.pathname) return null;
      const name = url.pathname.slice(base.pathname.length) || 'index.html';
      if (!names.includes(name)) return null;
      url.pathname = base.pathname + name;
      url.searchParams.delete('frame');
      url.searchParams.set('v', version);
      return url;
    } catch { return null; }
  }
  function embedded(url) {
    const target = new URL(url);
    target.searchParams.set('frame', '1');
    return target.href;
  }
  const origin = location.protocol === 'file:' ? '*' : location.origin;
  const ready = callback => document.readyState === 'loading'
    ? document.addEventListener('DOMContentLoaded', callback, { once: true }) : callback();

  if (contentMode) {
    ready(() => {
      document.addEventListener('click', event => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        const link = event.target.closest('a[href]');
        if (!link || link.target === '_blank' || link.hasAttribute('download') || link.getAttribute('href').startsWith('#')) return;
        const next = route(link.href);
        if (!next) return;
        event.preventDefault();
        parent.postMessage({ type: 'ig-frame-navigate', href: next.href }, origin);
      });
      addEventListener('message', event => {
        if (event.source !== parent || (location.protocol !== 'file:' && event.origin !== location.origin)) return;
        if (event.data?.type === 'ig-frame-top') scrollTo({ top: 0, behavior: 'instant' });
        if (event.data?.type === 'ig-frame-replace') {
          const next = route(event.data.href);
          if (next) location.replace(embedded(next));
        }
      });
      parent.postMessage({ type: 'ig-frame-ready', href: route(location.href)?.href, title: document.title }, origin);
    });
    return;
  }

  ready(() => {
    const shell = document.querySelector('.site-shell');
    if (!shell) return;
    const measure = document.createElement('div');
    Object.assign(measure.style, { position: 'absolute', width: '100px', height: '100px', overflow: 'scroll', visibility: 'hidden', pointerEvents: 'none' });
    document.body.append(measure);
    document.documentElement.style.setProperty('--ig-content-gutter', (measure.offsetWidth - measure.clientWidth) + 'px');
    measure.remove();
    let contentFrame = null, musicFrame = null, activeFrame = null;
    let active = route(location.href) || route('index.html');
    if (location.protocol === 'file:' && location.hash.startsWith('#page=')) active = route(location.hash.slice(6)) || active;
    window.IGActiveContentFrame = () => activeFrame;
    function createFrame(id) {
      const view = document.createElement('iframe');
      view.id = view.name = id;
      view.hidden = true;
      view.setAttribute('aria-hidden', 'true');
      view.setAttribute('allow', 'autoplay; clipboard-write; fullscreen');
      view.setAttribute('aria-busy', 'true');
      return view;
    }
    const updateHeader = url => {
      const file = url.pathname.split('/').pop();
      const menuFile = file === 'guide-nody.html' ? 'guide.html' : file;
      shell.querySelectorAll('header nav a[href]').forEach(link => {
        if (new URL(link.href).pathname.endsWith('/' + menuFile)) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      document.title = (labels[names.indexOf(file)] || '이결 소개') + ' · 한이결.exe';
    };
    function display(url) {
      const music = url.pathname.endsWith('/music.html');
      let view = music ? musicFrame : contentFrame;
      const fresh = !view;
      if (fresh) {
        view = createFrame(music ? 'ig-music-frame' : 'ig-content-frame');
        if (music) musicFrame = view; else contentFrame = view;
      }
      activeFrame = view;
      for (const item of [contentFrame, musicFrame]) {
        if (!item) continue;
        item.hidden = item !== view;
        item.setAttribute('aria-hidden', String(item !== view));
      }
      view.title = (labels[names.indexOf(url.pathname.split('/').pop())] || '이결 소개') + ' 본문';
      // The playlist document and its player are created once for this shell.
      if (music && !fresh) return;
      view.dataset.igRoute = url.href;
      view.setAttribute('aria-busy', 'true');
      if (fresh) {
        view.src = embedded(url);
        document.body.append(view);
      } else {
        try { view.contentWindow.location.replace(embedded(url)); }
        catch { view.contentWindow?.postMessage({ type: 'ig-frame-replace', href: url.href }, origin); }
      }
    }
    const record = (url, replace = false) => {
      const target = location.protocol === 'file:' ? '#page=' + url.pathname.split('/').pop() : url.href;
      try { history[replace ? 'replaceState' : 'pushState']({ ...history.state, igRoute: url.href }, '', target); } catch { /* File previews still retain the frame. */ }
    };
    function navigate(value, fromHistory = false) {
      const next = route(value);
      if (!next) return;
      if (next.pathname === active.pathname && next.hash === active.hash) {
        activeFrame?.contentWindow?.postMessage({ type: 'ig-frame-top' }, origin);
        return;
      }
      active = next;
      updateHeader(next);
      if (!fromHistory) record(next);
      display(next);
    }
    updateHeader(active);
    record(active, true);
    addEventListener('message', event => {
      const sender = [contentFrame, musicFrame].find(view => view && event.source === view.contentWindow);
      if (!sender || (location.protocol !== 'file:' && event.origin !== location.origin)) return;
      if (event.data?.type === 'ig-frame-navigate' && sender === activeFrame) navigate(event.data.href);
      if (event.data?.type === 'ig-frame-ready') {
        const loaded = route(event.data.href);
        if (loaded?.pathname === route(sender.dataset.igRoute)?.pathname) sender.setAttribute('aria-busy', 'false');
      }
    });
    document.addEventListener('click', event => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest('header a[href]');
      if (!link || link.target === '_blank' || link.hasAttribute('download')) return;
      const next = route(link.href);
      if (!next) return;
      event.preventDefault();
      navigate(next.href);
    });
    addEventListener('popstate', event => navigate(event.state?.igRoute || location.href, true));
    const size = () => document.documentElement.style.setProperty('--ig-chrome-height', Math.ceil(shell.getBoundingClientRect().bottom) + 'px');
    const observer = new ResizeObserver(size);
    observer.observe(shell);
    addEventListener('resize', size, { passive: true });
    document.fonts?.ready.then(size);
    size();
    display(active);
  });
})();