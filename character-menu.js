/* Keep the same character order on every introduction site. */
(() => {
  if (window.IG_FRAME_CONTENT) return;
  const header = document.querySelector('.site-shell > header');
  if (!header || header.querySelector('.character-switcher')) return;
  const menu = document.createElement('details');
  menu.className = 'character-switcher';
  const trigger = document.createElement('summary');
  trigger.setAttribute('aria-label','다른 캐릭터'); trigger.title='다른 캐릭터'; trigger.innerHTML="<svg viewBox=\"0 0 24 24\" width=\"18\" height=\"18\" aria-hidden=\"true\"><circle cx=\"9\" cy=\"8\" r=\"3\"/><path d=\"M3 20v-2a6 6 0 0 1 12 0v2M16 5a3 3 0 0 1 0 6m2 3a5 5 0 0 1 3 4v2\"/></svg>";
  const mark = document.createElement('span');
  mark.className = 'character-switch-mark'; mark.setAttribute('aria-hidden', 'true'); mark.innerHTML = "<svg viewBox=\"0 0 12 12\" width=\"10\" height=\"10\" aria-hidden=\"true\"><path d=\"M6 1v10M1 6h10\"/></svg>";
  trigger.append(mark);
  const list = document.createElement('ul'); list.className = 'character-switch-list';
  const characters = [
    { id: 'home', name: '소개 페이지', href: 'https://jouurie.github.io/' },
    { id: 'ww', name: '와이어트, 웨이드', href: 'https://jouurie.github.io/ww-profile/' },
    { id: 'ig', name: '이결', href: 'index.html' },
    { id: 'sh', name: '세혁', href: 'https://jouurie.github.io/sh-profile/' }
  ];
  characters.forEach(character => {
    const item = document.createElement('li');
    const current = character.id === 'ig';
    const row = document.createElement(current ? 'span' : 'a');
    row.className = 'character-switch-row' + (current ? ' is-current' : '');
    if (character.id === 'home') row.classList.add('is-hub');
    if (current) row.setAttribute('aria-current', 'true'); else row.href = character.href;
    const name = document.createElement('span'); name.textContent = character.name;
    const state = document.createElement('small'); state.textContent = current ? '현재 소개' : character.id === 'home' ? '전체 캐릭터 ↗' : '소개 바로가기 ↗';
    row.append(name, state); item.append(row); list.append(item);
  });
  const compactStyle = document.createElement('style'); compactStyle.id='character-switcher-shared-style'; compactStyle.textContent=".character-switcher{flex:0 0 42px;width:42px;min-width:42px}.character-switcher>summary{box-sizing:border-box;display:flex;align-items:center;justify-content:center;width:42px;height:36px;min-height:36px;padding:6px 4px;gap:3px}.character-switcher>summary>svg{display:block;flex:0 0 18px;width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.5;pointer-events:none}.character-switcher>summary .character-switch-mark{display:grid;place-items:center;flex:0 0 10px;width:10px;height:10px}.character-switcher>summary .character-switch-mark svg{display:block;width:10px;height:10px;fill:none;stroke:currentColor;stroke-width:1.4;pointer-events:none}.character-switch-row.is-hub{background:var(--blue);color:var(--ink)}.character-switch-row.is-hub small{color:inherit}.character-switch-row.is-hub:is(:hover,:active,:focus-visible){background:var(--blue);color:var(--ink);outline:1px solid currentColor;outline-offset:-3px}@media(max-width:540px){.character-switcher{flex-basis:36px;width:36px;min-width:36px}.character-switcher>summary{width:36px;height:32px;min-height:32px;padding:4px}}@media(max-width:360px){.character-switcher>summary>svg{width:14px;height:14px;flex-basis:14px}.character-switcher>summary .character-switch-mark{width:8px;height:8px;flex-basis:8px}.character-switcher>summary .character-switch-mark svg{width:8px;height:8px}}"; document.head.append(compactStyle);
  menu.append(trigger, list); header.append(menu);
  document.addEventListener('click', event => { if (!menu.contains(event.target)) menu.open = false; });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.open) { menu.open = false; trigger.focus(); } });
})();
