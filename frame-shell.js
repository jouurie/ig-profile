/* The header belongs to one document; only the content frame navigates. */
(() => {
  'use strict';
  const version = '20261102-nav-start';
  const names = ['index.html', 'world.html', 'starts.html', 'npc.html', 'guide.html', 'guide-nody.html', 'music.html'];
  const labels = ['소개·프로필', '세계관', '도입부', '주변 인물', '이용 가이드', '이용 가이드', '플레이리스트'];
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
      // Navigation owns one starting baseline inside the content frame.
      // The persistent header is outside this viewport: never subtract it twice.
      function alignRouteStart() {
        requestAnimationFrame(() => {
          const target = document.querySelector('.page-masthead h1') || document.querySelector('main > :first-child');
          const main = document.querySelector('main');
          if (!target || !main) return;
          const gap = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--route-start-gap')) || 0;
          main.style.minHeight = '0px';

          scrollTo({ top: document.body.classList.contains('page-world') ? 0 : Math.max(0, target.getBoundingClientRect().top + scrollY - gap), behavior: 'instant' });
        });
      }
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
        if (event.data?.type === 'ig-frame-top') alignRouteStart();
        if (event.data?.type === 'ig-frame-replace') {
          const next = route(event.data.href);
          if (next) location.replace(embedded(next));
        }
      });
      alignRouteStart();
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
    const pageMenu = shell.querySelector(':scope>header>nav[aria-label="페이지 메뉴"]');
    if (pageMenu) {
      const header = pageMenu.parentElement, mobileMenu = matchMedia('(max-width:700px)');
      const originalTabindex = pageMenu.getAttribute('tabindex');
      if (!pageMenu.id) pageMenu.id = 'ig-page-menu';
      const arrows = [-1, 1].map(direction => {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'ig-menu-arrow ' + (direction < 0 ? 'is-left' : 'is-right');
        button.setAttribute('aria-label', '페이지 메뉴 ' + (direction < 0 ? '왼쪽' : '오른쪽') + '으로 이동');
        button.setAttribute('aria-controls', pageMenu.id);
        button.addEventListener('click', () => moveMenu(direction));
        return button;
      });
      pageMenu.before(arrows[0]); pageMenu.after(arrows[1]);
      const maxMenuScroll = () => Math.max(0, pageMenu.scrollWidth - pageMenu.clientWidth);
      function refreshMenu() {
        const mobile = mobileMenu.matches, position = Math.max(0, pageMenu.scrollLeft);
        arrows[0].disabled = !mobile || position <= 2;
        arrows[1].disabled = !mobile || position >= maxMenuScroll() - 2;
        if (mobile) pageMenu.tabIndex = 0;
        else if (originalTabindex === null) pageMenu.removeAttribute('tabindex');
        else pageMenu.setAttribute('tabindex', originalTabindex);
        header.style.setProperty('--ig-menu-top', pageMenu.offsetTop + 'px');
        header.style.setProperty('--ig-menu-height', pageMenu.getBoundingClientRect().height + 'px');
      }
      function moveMenu(direction) {
        const items = [...pageMenu.children], origin = items[0]?.getBoundingClientRect().left;
        if (origin === undefined) return;
        const positions = items.map(item => item.getBoundingClientRect().left - origin);
        const position = Math.max(0, pageMenu.scrollLeft);
        const target = direction > 0 ? positions.find(value => value > position + 2) : positions.reverse().find(value => value < position - 2);
        pageMenu.scrollTo({ left: Math.max(0, Math.min(maxMenuScroll(), target ?? (direction > 0 ? maxMenuScroll() : 0))), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
      }
      pageMenu.addEventListener('scroll', refreshMenu, { passive: true });
      pageMenu.addEventListener('keydown', event => {
        if (!mobileMenu.matches || event.target !== pageMenu || event.defaultPrevented || event.altKey || event.ctrlKey || event.metaKey) return;
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          event.preventDefault(); moveMenu(event.key === 'ArrowLeft' ? -1 : 1);
        } else if (event.key === 'Home' || event.key === 'End') {
          event.preventDefault(); pageMenu.scrollLeft = event.key === 'Home' ? 0 : maxMenuScroll(); refreshMenu();
        }
      });
      const menuResize = new ResizeObserver(refreshMenu);
      menuResize.observe(pageMenu); menuResize.observe(header);
      mobileMenu.addEventListener('change', refreshMenu);
      document.fonts?.ready.then(refreshMenu);
      refreshMenu();
    }
    let contentFrame = null, musicFrame = null, activeFrame = null;
    let pendingFrame = null, leavingFrame = null, entrance = null;
    let active = route(location.href) || route('index.html');
    if (location.protocol === 'file:' && location.hash.startsWith('#page=')) active = route(location.hash.slice(6)) || active;
    window.IGActiveContentFrame = () => activeFrame;
    function createFrame(id) {
      const view = document.createElement('iframe');
      view.id = view.name = id;
      view.className = 'ig-route-frame';
      view.hidden = true;
      view.inert = true;
      view.addEventListener('load', () => {
        try {
          const loaded = route(view.contentWindow.location.href);
          if (loaded?.pathname === route(view.dataset.igRoute)?.pathname) frameReady(view);
        } catch { /* The ready message remains the file-preview fallback. */ }
      });
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
    function retire(view) {
      if (!view) return;
      view.hidden = true;
      view.inert = true;
      view.setAttribute('aria-hidden', 'true');
      view.classList.remove('ig-frame-entering');
      if (view !== musicFrame) {
        if (contentFrame === view) contentFrame = null;
        view.remove();
      }
    }
    function finishEntrance() {
      const running = entrance;
      entrance = null;
      running?.cancel();
      activeFrame?.classList.remove('ig-frame-entering');
      retire(leavingFrame);
      leavingFrame = null;
    }
    function present(view) {
      if (view !== pendingFrame) return;
      finishEntrance();
      const previous = activeFrame;
      pendingFrame = null;
      activeFrame = view;
      if (previous && previous !== musicFrame && previous !== view) previous.id = previous.name = 'ig-content-leaving';
      if (view !== musicFrame) {
        contentFrame = view;
        view.id = view.name = 'ig-content-frame';
      }
      view.hidden = false;
      view.inert = false;
      view.setAttribute('aria-hidden', 'false');
      view.contentWindow?.postMessage({ type: 'ig-frame-top' }, origin);
      if (!previous || previous === view || typeof view.animate !== 'function') {
        if (previous !== view) retire(previous);
        return;
      }
      // Keep the previous document until ready, then reveal only the new window.
      leavingFrame = previous;
      previous.hidden = true;
      previous.inert = true;
      previous.setAttribute('aria-hidden', 'true');
      view.classList.add('ig-frame-entering');
      entrance = view.animate([
        { opacity: .35, transform: 'translateY(7px) scale(.992)' },
        { opacity: 1, transform: 'translateY(0) scale(1)' }
      ], { duration: 80, easing: 'cubic-bezier(.16,1,.3,1)' });
      entrance.id = 'ig-window-switch';
      const running = entrance;
      running.finished.then(() => {
        if (entrance === running) finishEntrance();
      }, () => { /* A newer selection owns cleanup after cancellation. */ });
    }
    function frameReady(view) {
      view.dataset.igReady = 'true';
      view.setAttribute('aria-busy', 'false');
      present(view);
    }
    function display(url) {
      finishEntrance();
      if (pendingFrame) {
        if (pendingFrame !== activeFrame) retire(pendingFrame);
        pendingFrame = null;
      }
      // A rapid return to the visible page needs no second document load.
      if (activeFrame && route(activeFrame.dataset.igRoute)?.pathname === url.pathname) return;
      const music = url.pathname.endsWith('/music.html');
      let view = music ? musicFrame : null;
      const fresh = !view;
      if (fresh) {
        view = createFrame(music ? 'ig-music-frame' : 'ig-content-pending');
        if (music) musicFrame = view;
      }
      pendingFrame = view;
      view.title = (labels[names.indexOf(url.pathname.split('/').pop())] || '이결 소개') + ' 본문';
      // The playlist document and its player are created once for this shell.
      if (music && !fresh) {
        if (view.dataset.igReady === 'true') present(view);
        return;
      }
      view.dataset.igRoute = url.href;
      view.setAttribute('aria-busy', 'true');
      view.src = embedded(url);
      document.body.append(view);
    }
    const record = (url, replace = false) => {
      const visible = new URL(url);
      if (visible.pathname === base.pathname + 'index.html') { visible.pathname = base.pathname; visible.searchParams.delete('v'); }
      const target = location.protocol === 'file:' ? '#page=' + url.pathname.split('/').pop() : visible.href;
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
      const sender = [contentFrame, musicFrame, pendingFrame, leavingFrame].find(view => view && event.source === view.contentWindow);
      if (!sender || (location.protocol !== 'file:' && event.origin !== location.origin)) return;
      if (event.data?.type === 'ig-frame-navigate' && sender === activeFrame) navigate(event.data.href);
      if (event.data?.type === 'ig-frame-ready') {
        const loaded = route(event.data.href);
        if (loaded?.pathname === route(sender.dataset.igRoute)?.pathname) frameReady(sender);
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

/* Short, one-shot accents on the existing reading surfaces. */
(() => {
  const install = () => {
    if (!window.IG_FRAME_CONTENT) return;
    const main = document.querySelector('main');
    if (!main || !window.IntersectionObserver || !Element.prototype.animate) return;

    const observed = new Map();
    const seen = (window.parent.IG_CHAPTER_ACCENTS ||= new Set());
    const groups = [["rule",".page-masthead, .section-heading"],["label",".page-masthead > span, .section-heading > span, .window-caption"]];
    const routeKey = () => location.pathname;
    const ease = 'cubic-bezier(.22,.61,.36,1)';

    function play(element, frames, duration, delay, kind) {
      if (document.hidden) return;
      const animation = element.animate(frames, { duration, delay, easing: ease, fill: 'backwards' });
      animation.id = 'chapter-accent-' + kind;
    }

    function line(host) {
      const rule = document.createElement('span');
      rule.setAttribute('aria-hidden', 'true');
      rule.setAttribute('data-chapter-accent-line', '');
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      Object.assign(rule.style, {
        position: 'absolute', display: 'block', insetInlineStart: '0',
        insetBlockEnd: '-1px', inlineSize: 'min(42px, 16%)', blockSize: '2px',
        background: 'var(--ink)', pointerEvents: 'none', transformOrigin: 'left center'
      });
      host.append(rule);
      return rule;
    }

    const observer = new IntersectionObserver(entries => {
      const visible = entries.filter(entry => entry.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
      visible.forEach((entry, index) => {
        const host = entry.target;
        const record = observed.get(host);
        if (!record) return;
        observer.unobserve(host);
        observed.delete(host);
        const first = !seen.has(record.key);
        seen.add(record.key);
        const delay = Math.min(index * 38, 114);
        if (record.kind === 'rule') {
          const rule = line(host);
          if (first) play(rule, [
            { opacity: .2, transform: 'scaleX(.14)' },
            { opacity: 1, transform: 'scaleX(1)' }
          ], 260, delay, 'rule');
          return;
        }
        if (!first) return;
        if (record.kind === 'card') {
          play(host, [{ opacity: .76, translate: '0 10px' }, { opacity: 1, translate: '0 0' }], 245, delay + 48, 'card');
        } else {
          play(host, [{ opacity: .58 }, { opacity: 1 }], 190, delay + 55, 'label');
        }
      });
    }, { root: null, rootMargin: '0px 0px -8% 0px', threshold: .03 });

    const registered = new WeakSet();
    function scan() {
      for (const host of observed.keys()) {
        if (host.isConnected) continue;
        observer.unobserve(host);
        observed.delete(host);
      }
      for (const [kind, selector] of groups) {
        const counts = new Map();
        main.querySelectorAll(selector).forEach(host => {
          const route = routeKey(host);
          const index = counts.get(route) || 0;
          counts.set(route, index + 1);
          if (registered.has(host) || host.closest('a,button,summary,[role="button"]')) return;
          if (kind === 'card' && host.querySelector('a,button,summary,[role="button"],[tabindex],[data-image-viewer]')) return;
          registered.add(host);
          observed.set(host, { kind, key: route + ':' + kind + ':' + index });
          observer.observe(host);
        });
      }
    }

    scan();
    new MutationObserver(changes => {
      if (changes.some(change => [...change.addedNodes, ...change.removedNodes]
        .some(node => node.nodeType === 1 && !node.hasAttribute('data-chapter-accent-line')))) scan();
    }).observe(main, { childList: true, subtree: true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', install, { once: true });
  else install();
})();
