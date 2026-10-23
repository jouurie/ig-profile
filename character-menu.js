/* Keep the same character order on every introduction site. */
(() => {
  const header = document.querySelector('.site-shell > header');
  if (!header || header.querySelector('.character-switcher')) return;
  const menu = document.createElement('details');
  menu.className = 'character-switcher';
  const trigger = document.createElement('summary');
  trigger.append(document.createTextNode('다른 캐릭터 '));
  const mark = document.createElement('span');
  mark.className = 'character-switch-mark'; mark.setAttribute('aria-hidden', 'true'); mark.textContent = '+';
  trigger.append(mark);
  const list = document.createElement('ul'); list.className = 'character-switch-list';
  const characters = [
    { id: 'ww', name: '와이어트, 웨이드', href: 'https://jouurie.github.io/ww-profile/WW/' },
    { id: 'ig', name: '이결', href: 'index.html' }
  ];
  characters.forEach(character => {
    const item = document.createElement('li');
    const current = character.id === 'ig';
    const row = document.createElement(current ? 'span' : 'a');
    row.className = 'character-switch-row' + (current ? ' is-current' : '');
    if (current) row.setAttribute('aria-current', 'true'); else row.href = character.href;
    const name = document.createElement('span'); name.textContent = character.name;
    const state = document.createElement('small'); state.textContent = current ? '현재 소개' : '소개 바로가기 ↗';
    row.append(name, state); item.append(row); list.append(item);
  });
  menu.append(trigger, list); header.append(menu);
  document.addEventListener('click', event => { if (!menu.contains(event.target)) menu.open = false; });
  document.addEventListener('keydown', event => { if (event.key === 'Escape' && menu.open) { menu.open = false; trigger.focus(); } });
})();
