/* The header belongs to one document; only the content frame navigates. */
(() => {
  'use strict';
  const version = '20261023p';
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
    const frame = document.createElement('iframe');
    frame.id = 'ig-content-frame';
    frame.name = 'ig-content-frame';
    frame.title = '이결 소개 본문';
    frame.setAttribute('allow', 'autoplay; clipboard-write; fullscreen');
    frame.setAttribute('aria-busy', 'true');
    let active = route(location.href) || route('index.html');
    if (location.protocol === 'file:' && location.hash.startsWith('#page=')) active = route(location.hash.slice(6)) || active;
    const updateHeader = url => {
      const file = url.pathname.split('/').pop();
      const menuFile = file === 'guide-nody.html' ? 'guide.html' : file;
      shell.querySelectorAll('header nav a[href]').forEach(link => {
        if (new URL(link.href).pathname.endsWith('/' + menuFile)) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      frame.title = (labels[names.indexOf(file)] || '이결 소개') + ' 본문';
      document.title = (labels[names.indexOf(file)] || '이결 소개') + ' · 한이결.exe';
    };
    const record = (url, replace = false) => {
      const target = location.protocol === 'file:' ? '#page=' + url.pathname.split('/').pop() : url.href;
      try { history[replace ? 'replaceState' : 'pushState']({ ...history.state, igRoute: url.href }, '', target); } catch { /* File previews still retain the frame. */ }
    };
    function navigate(value, fromHistory = false) {
      const next = route(value);
      if (!next) return;
      if (next.pathname === active.pathname && next.hash === active.hash) {
        frame.contentWindow?.postMessage({ type: 'ig-frame-top' }, origin);
        return;
      }
      active = next;
      updateHeader(next);
      frame.setAttribute('aria-busy', 'true');
      if (!fromHistory) record(next);
      try { frame.contentWindow.location.replace(embedded(next)); }
      catch { frame.contentWindow?.postMessage({ type: 'ig-frame-replace', href: next.href }, origin); }
    }
    updateHeader(active);
    record(active, true);
    frame.src = embedded(active);
    addEventListener('message', event => {
      if (event.source !== frame.contentWindow || (location.protocol !== 'file:' && event.origin !== location.origin)) return;
      if (event.data?.type === 'ig-frame-navigate') navigate(event.data.href);
      if (event.data?.type === 'ig-frame-ready') {
        const loaded = route(event.data.href);
        if (loaded?.pathname === active.pathname) frame.setAttribute('aria-busy', 'false');
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
    document.body.append(frame);
  });
})();
