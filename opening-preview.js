/* Full opening text and scene crops share the persistent top document. */
(() => {
  'use strict';
  const ids = ['plot1', 'plot2', 'plot3', 'plot4', 'plot5', 'plot6', 'plot_auto_intro'];
  const positions = ['0 0', '100% 0', '0 33.333333%', '100% 33.333333%', '0 66.666667%', '100% 66.666667%', '0 100%'];
  const atlas = 'https://cdn.imgchest.com/files/2ed4f694d582.png';
  const element = (tag, className, text) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
  };
  const markedText = (host, text) => text.split(/(\{\{user\}\})/g).forEach(chunk => {
    host.append(chunk === '{{user}}' ? element('mark', 'ig-opening-user', chunk) : document.createTextNode(chunk));
  });

  if (window.IG_FRAME_SHELL) {
    let dialog, title, content, close, opener, saved;
    function restore() {
      if (!saved) return;
      saved.forEach(item => { item.document.documentElement.style.overflow = item.html; item.document.body.style.overflow = item.body; });
      saved = null;
      if (opener?.isConnected) opener.focus({ preventScroll: true });
    }
    function dismiss() { if (dialog?.open) dialog.close(); restore(); }
    function create() {
      if (dialog) return;
      dialog = element('dialog', 'ig-opening-preview');
      dialog.setAttribute('aria-labelledby', 'ig-opening-preview-title');
      const header = element('header', 'ig-opening-preview-head');
      title = element('h2');
      title.id = 'ig-opening-preview-title';
      close = element('button', 'ig-opening-preview-close', '×');
      close.type = 'button';
      close.setAttribute('aria-label', '미리보기 닫기');
      close.addEventListener('click', dismiss);
      header.append(title, close);
      content = element('div', 'ig-opening-preview-content');
      dialog.append(header, content);
      document.body.append(dialog);
      dialog.addEventListener('cancel', event => { event.preventDefault(); dismiss(); });
      dialog.addEventListener('close', restore);
      dialog.addEventListener('click', event => {
        const box = dialog.getBoundingClientRect();
        if (event.target === dialog && (event.clientX < box.left || event.clientX > box.right || event.clientY < box.top || event.clientY > box.bottom)) dismiss();
      });
    }
    function open(index, name, trigger, photo = false) {
      if (!Number.isInteger(index) || !ids[index] || document.querySelector('dialog[open]')) return;
      const source = window.IGOpeningPreviews?.[ids[index]];
      if (!source) return;
      create();
      opener = trigger;
      title.textContent = name;
      dialog.classList.toggle('ig-opening-photo-preview', photo);
      content.replaceChildren();
      if (photo) {
        const crop = element('div', 'ig-opening-photo-crop');
        crop.setAttribute('role', 'img');
        crop.setAttribute('aria-label', name + ' 이미지');
        crop.style.backgroundImage = 'url("' + atlas + '")';
        crop.style.backgroundPosition = positions[index];
        content.append(crop);
      } else {
        const prose = element('div', 'ig-opening-preview-prose');
        // Render only the two explicitly supported canonical components.
        const text = source.replace(/<!--[\s\S]*?-->/g, '').replace(/(?:\r?\n)[ \t]*---[ \t]*\s*$/, '');
        const pattern = /<IGyeolIntroGuide\s*\/>|<Messenger\s+rawContent="[^"]*"\s*\/>/g;
        let cursor = 0, match;
        while ((match = pattern.exec(text))) {
          markedText(prose, text.slice(cursor, match.index));
          const frame = element('iframe', 'ig-opening-component');
          const intro = match[0].startsWith('<IGyeolIntroGuide');
          frame.title = intro ? '자율 도입부 안내 미리보기' : '메신저 미리보기';
          frame.src = 'component-preview/' + (intro ? 'intro' : 'messenger') + '.html?v=20261024-preview1';
          frame.setAttribute('scrolling', 'no');
          prose.append(frame);
          cursor = pattern.lastIndex;
        }
        markedText(prose, text.slice(cursor));
        content.append(prose);
      }
      const documents = new Set([document, trigger.ownerDocument]);
      saved = [...documents].map(doc => ({ document: doc, html: doc.documentElement.style.overflow, body: doc.body.style.overflow }));
      documents.forEach(doc => { doc.documentElement.style.overflow = 'hidden'; doc.body.style.overflow = 'hidden'; });
      dialog.showModal();
      dialog.scrollTop = 0;
      close.focus({ preventScroll: true });
    }
    window.addEventListener('message', event => {
      if (event.origin !== window.location.origin || event.data?.type !== 'ig-component-height') return;
      content?.querySelectorAll('iframe.ig-opening-component').forEach(frame => {
        if (event.source === frame.contentWindow && Number.isFinite(event.data.height)) frame.style.height = Math.max(100, Math.min(6000, event.data.height)) + 'px';
      });
    });
    window.IGOpeningPreview = { open };
    return;
  }

  const list = document.getElementById('opening-list');
  const data = window.IG_CONTENT?.openings;
  if (!list || data?.length !== 7 || list.children.length !== 7) return;
  let selected = 0;
  const cards = [...list.children].map((original, index) => {
    const card = element('article', original.className + ' ig-opening-card');
    card.dataset.plot = ids[index];
    card.dataset.igOpeningSelected = String(index === selected);
    card.setAttribute('aria-label', data[index].name);
    while (original.firstChild) card.append(original.firstChild);
    const photo = element('button', 'ig-opening-photo-button');
    photo.type = 'button';
    photo.setAttribute('aria-label', data[index].name + ' 이미지 크게 보기');
    photo.setAttribute('aria-haspopup', 'dialog');
    photo.addEventListener('click', event => { event.stopPropagation(); parent.IGOpeningPreview?.open(index, data[index].name, photo, true); });
    card.append(photo);
    const preview = element('button', 'ig-opening-preview-button', '전문 보기');
    preview.type = 'button';
    preview.setAttribute('aria-label', data[index].name + ' 전문 보기');
    preview.setAttribute('aria-haspopup', 'dialog');
    card.append(preview);
    const open = event => {
      const box = card.getBoundingClientRect();
      parent.IGClickHearts?.burst(event?.detail ? event.clientX : box.left + box.width / 2, event?.detail ? event.clientY : box.top + box.height / 2, true);
      selected = selected === index ? -1 : index;
      cards.forEach((item, i) => { item.dataset.igOpeningSelected = String(i === selected); });
      document.getElementById('opening-name').textContent = selected < 0 ? '어디에서 시작할까요?' : data[selected].name;
      document.getElementById('opening-copy').textContent = selected < 0 ? '도입부를 선택하면 자세한 상황을 확인할 수 있습니다.' : data[selected].description;
      parent.IGOpeningPreview?.open(index, data[index].name, preview);
    };
    preview.addEventListener('click', event => { event.stopPropagation(); open(event); });
    original.replaceWith(card);
    return card;
  });
})();
