(() => {
  'use strict';
  const sendOrigin = location.protocol === 'file:' ? '*' : location.origin;
  if (window.IG_FRAME_SHELL) {
    const dialog = document.createElement('dialog');
    dialog.className = 'ig-image-viewer';
    dialog.setAttribute('aria-label', '이미지 크게 보기');
    const close = document.createElement('button');
    close.type = 'button';
    close.className = 'ig-image-close';
    close.textContent = '닫기 ×';
    close.setAttribute('aria-label', '확대한 이미지 닫기');
    const image = document.createElement('img');
    dialog.append(close, image);
    document.body.append(dialog);
    close.addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => {
      const box = dialog.getBoundingClientRect();
      if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dialog.close();
    });
    dialog.addEventListener('close', () => {
      document.getElementById('ig-content-frame')?.contentWindow?.postMessage({ type: 'ig-image-closed' }, sendOrigin);
    });
    addEventListener('message', event => {
      const frame = document.getElementById('ig-content-frame');
      if (event.source !== frame?.contentWindow || (location.protocol !== 'file:' && event.origin !== location.origin) || event.data?.type !== 'ig-image-open') return;
      let url;
      try { url = new URL(event.data.src, location.href); } catch { return; }
      if (url.origin !== location.origin && url.origin !== 'https://cdn.imgchest.com') return;
      image.src = url.href;
      image.alt = String(event.data.alt || '이결 소개 이미지');
      if (!dialog.open) dialog.showModal();
      close.focus();
    });
    return;
  }

  let lastImage;
  function decorate() {
    document.querySelectorAll('main img:not([data-ig-zoom])').forEach(image => {
      if (image.closest('a,button,[role="button"]')) return;
      image.dataset.igZoom = '';
      image.tabIndex = 0;
      image.setAttribute('role', 'button');
      image.setAttribute('aria-label', (image.alt || '이미지') + ' 크게 보기');
    });
  }
  function open(image) {
    lastImage = image;
    parent.postMessage({ type: 'ig-image-open', src: image.currentSrc || image.src, alt: image.alt }, sendOrigin);
  }
  document.addEventListener('click', event => {
    const image = event.target.closest('img[data-ig-zoom]');
    if (image) open(image);
  });
  document.addEventListener('keydown', event => {
    if ((event.key === 'Enter' || event.key === ' ') && event.target.matches('img[data-ig-zoom]')) {
      event.preventDefault();
      open(event.target);
    }
  });
  addEventListener('message', event => {
    if (event.source === parent && (location.protocol === 'file:' || event.origin === location.origin) && event.data?.type === 'ig-image-closed') lastImage?.focus({ preventScroll: true });
  });
  decorate();
  new MutationObserver(decorate).observe(document.querySelector('main'), { childList: true, subtree: true });
})();
