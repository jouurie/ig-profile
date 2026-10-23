(() => {
  'use strict';if(window.IG_FRAME_SHELL)return;
  const d = window.IG_CONTENT, extra = window.IG_SUPPLEMENT;
  const $ = s => document.querySelector(s);
  const make = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text !== undefined) n.textContent = text; return n; };
  const source = name => extra.find(x => x.name === name).text.replace(/\r/g, '');
  const guide = name => d.guides.find(x => x.name === name).lines;
  function labeledText(host, text) {
    text = text.replace(/^\s*(?:\[추천\]|추천\s*:)\s*/, '');
    const label = text.match(/^([^:\n]{1,32}:)(\s*)/);
    if (label && !/^https?:$/i.test(label[1])) { host.append(make('strong', 'guide-copy-label', label[1]), document.createTextNode(text.slice(label[1].length))); }
    else host.append(document.createTextNode(text));
  }
  const paragraphs = (host, text) => text.split(/\n+/).filter(Boolean).forEach(line => { const note = /^\s*↳/.test(line), p = make('p', note ? 'guide-subnote' : ''); labeledText(p, line.replace(/^\s*↳[\s\u00a0]*/, '')); host.append(p); });
  function card(title, text, cls = '') { const c = make('article', 'guide-card ' + cls); c.append(make('h3', '', title)); if (text) paragraphs(c, text); return c; }
  function list(host, items) { const ul = make('ul', 'guide-list'); items.forEach(text => { const note = /^\s*↳/.test(text), item = make(note ? 'p' : 'li', note ? 'guide-subnote' : ''); labeledText(item, text.replace(/^\s*↳[\s\u00a0]*/, '')); if (note && ul.lastElementChild) ul.lastElementChild.append(item); else ul.append(item); }); host.append(ul); }
  function disclosure(title, open = false) { const node = make('details', 'guide-disclosure'); node.open = open; node.append(make('summary', '', title)); const body = make('div', 'disclosure-body'); node.append(body); return { node, body }; }
  function copyBlock(title, content, badge = '') {
    const node = card(title, '', 'copy-card'), heading = node.querySelector('h3'), header = make('div', 'copy-card-header');
    const name = make('div', 'copy-card-name'); name.append(make('span', 'copy-field-label', '규칙 이름'), heading);
    if (badge) header.append(make('span', 'copy-card-badge' + (badge === '선택' ? ' is-optional' : ''), badge));
    header.append(name);
    const pre = make('pre', 'copy-content', content), button = make('button', 'copy-button', '내용 복사');
    button.type = 'button'; button.setAttribute('aria-label', title + ' 내용 복사');
    button.addEventListener('click', async () => { try { await navigator.clipboard.writeText(content); button.textContent = '복사됨'; } catch { const range = document.createRange(); range.selectNodeContents(pre); const selection = getSelection(); selection.removeAllRanges(); selection.addRange(range); button.textContent = '선택됨 · Ctrl+C'; } });
    header.append(button); node.append(header, make('span', 'copy-field-label copy-content-label', '내용'), pre); return node;
  }
  function settingsPath(text) {
    const path = make('ol', 'settings-path');
    text.split(' → ').forEach(step => path.append(make('li', '', step)));
    return path;
  }
  function externalLink(host, label, url) { const a = make('a', 'guide-link', label + ' ↗'); a.href = url; a.target = '_blank'; a.rel = 'noopener noreferrer'; host.append(a); }
  function disclosureLink(label, id) { const a = make('a', 'guide-inline-link', label); a.href = '#' + id; a.addEventListener('click', () => { const target = document.getElementById(id); if (target) { target.open = true; const summary = target.querySelector('summary'); if (summary) summary.focus(); } }); return a; }
  function settingsList(host, items) {
    const ul = make('ul', 'guide-list');
    items.forEach(raw => {
      const note = /^\s*↳/.test(raw), line = raw.replace(/^\s*↳[\s\u00a0]*/, ''), item = make(note ? 'p' : 'li', note ? 'guide-subnote' : '');
      if (line.includes('하단 [ ⭐ 출력 가이던스 ]를 참조하세요.')) { labeledText(item, line.replace('하단 [ ⭐ 출력 가이던스 ]를 참조하세요.', '')); item.append(disclosureLink('출력 가이던스 설정 열기', 'guide-output')); }
      else if (line.includes('하단 [ ⭐ 모델 추천 ]을 참고하세요.')) { labeledText(item, line.replace('하단 [ ⭐ 모델 추천 ]을 참고하세요.', '')); item.append(disclosureLink('모델 선택과 추론 조절 열기', 'guide-models')); }
      else labeledText(item, line);
      if (note && ul.lastElementChild) ul.lastElementChild.append(item); else ul.append(item);
    });
    host.append(ul);
  }
  function rowsFromBlock(block) {
    const lines = block.split('\n').slice(1), rows = [];
    lines.forEach(line => { if (!line.trim()) return; if (line.startsWith('↳')) { if (rows.length) rows[rows.length - 1].notes.push(line.slice(1).trim()); return; } const at = line.indexOf(':'); rows.push({ label: at >= 0 ? line.slice(0, at) : '', value: at >= 0 ? line.slice(at + 1).trim() : line, notes: [] }); });
    return rows;
  }
  function modelValue(value) {
    const separateAt = value.indexOf('별도 선택:');
    if (separateAt >= 0) {
      const group = make('div', 'model-value'), regular = value.slice(0, separateAt).replace(/\s*\/\s*$/, '').trim();
      if (regular) group.append(modelValue(regular));
      group.append(make('div', 'model-separate-choice', value.slice(separateAt).trim()));
      return group;
    }
    if (!value.includes('↔')) return make('div', '', value);
    const flow = make('div', 'model-flow');
    value.split('↔').forEach((part, i) => { if (i) flow.append(make('span', 'model-flow-arrow', ' ↔ ')); flow.append(make('span', 'model-flow-chip', part.trim())); });
    return flow;
  }
  function tableBlock(block) { const title = block.split('\n')[0], section = make('section', 'guide-model-section'), table = make('table', 'guide-table'), body = make('tbody'); section.append(make('h3', '', title)); rowsFromBlock(block).forEach(row => { const tr = make('tr'), th = make('th', '', row.label), td = make('td'); th.scope = 'row'; td.append(modelValue(row.value)); row.notes.forEach(n => td.append(make('small', '', n))); tr.append(th, td); body.append(tr); }); table.append(body); section.append(table); return section; }

  const world = $('#world-content');
  if (world) {
    const lead = make('div', 'world-lead'); paragraphs(lead, source('세계관')); world.append(lead);
    const grid = make('div', 'world-grid');
    ['이결의 방', '생활 돌봄', '숨은 기록', '가족 그림자'].forEach((name, i) => {
      const article = card(name, '', 'world-card'); article.prepend(make('span', 'world-number', '0' + (i + 1)));
      const blocks = source(name).split('\n\n');
      blocks.forEach(block => { const lines = block.split('\n'); if (lines[0].length < 14 && lines.length > 1 && !/[.!?。]$/.test(lines[0])) article.append(make('h4', '', lines.shift())); paragraphs(article, lines.join('\n')); }); grid.append(article);
    }); world.append(grid);
    const ideas = make('section', 'world-ideas'); ideas.append(make('h3', '', '진행 소재'));
    const ideasGrid = make('div', 'world-idea-grid'); source('진행 소재').split('\n\n').forEach(block => { const lines = block.split('\n'), item = make('article', 'world-idea-card'); item.append(make('h4', '', lines.shift())); paragraphs(item, lines.join('\n')); ideasGrid.append(item); }); ideas.append(ideasGrid); world.append(ideas);
  }

  const panel = $('#guide-panel'), tabBar = $('#guide-tabs');
  if (!panel || !tabBar) return;
  const platformSelections = { settings: null, recovery: null };
  function platformSection(section, title) {
    const selected = platformSelections[section], platforms = make('nav', 'settings-platforms');
    platforms.setAttribute('aria-label', title + ' 플랫폼');
    [['elyn', '엘린'], ['nody', '노디']].forEach(([key, label]) => {
      const button = make('button', '', label); button.type = 'button'; button.setAttribute('aria-pressed', String(key === selected));
      button.addEventListener('click', () => {
        platformSelections[section] = key;
        const badge = $('#guide-topic-' + section + ' .settings-platform-badge');
        badge.textContent = label; badge.setAttribute('aria-label', label + ' 선택됨'); select(active);
      });
      platforms.append(button);
    });
    panel.append(platforms);
    if (!selected) { panel.append(make('h2', 'settings-platform-title', '플랫폼 미선택'), make('p', 'guide-note', '엘린 또는 노디를 선택하세요.')); return false; }
    panel.append(make('h2', 'settings-platform-title', (selected === 'elyn' ? '엘린' : '노디') + ' ' + title));
    if (selected === 'nody') { const empty = make('div', 'guide-card settings-empty'); if (section === 'recovery') empty.append(make('p', '', '등록된 안내가 없습니다.')); panel.append(empty); return false; }
    return true;
  }
  const renderers = {
    settings() {
      if (!platformSection('settings', '설정')) return;
      const common = source('⭐ 모델 추천').split('\n\n')[0];
      const metrics = make('div', 'settings-metrics'); rowsFromBlock(common).slice(0, 3).forEach(row => { const metric = make('div', 'setting-metric'); metric.append(make('span', '', row.label), make('strong', '', row.value)); metrics.append(metric); }); panel.append(metrics, make('p', 'guide-note', rowsFromBlock(common).slice(3).map(x => x.value).join(' ')));
      const options = make('div', 'guide-card-grid'); source('⭐ 추천 설정값').split('\n\n').forEach(block => { const lines = block.split('\n'), c = card(lines.shift()); settingsList(c, lines); options.append(c); }); panel.append(options);
      const model = disclosure('모델 선택과 추론 조절'); model.node.id = 'guide-models'; source('⭐ 모델 추천').split('\n\n').slice(1).forEach(block => model.body.append(tableBlock(block))); panel.append(model.node);
      const budget = disclosure('로어북 예산'); settingsList(budget.body, source('로어북 예산 안내').split('\n')); panel.append(budget.node);
      const output = disclosure('출력 가이던스 설정');
      output.node.id = 'guide-output';
      const outputBlocks = source('⭐ 출력 가이던스').split('\n\n');
      output.body.append(settingsPath(outputBlocks[0])); const instructions = make('div', 'guide-instructions'); paragraphs(instructions, outputBlocks[1]); output.body.append(instructions);
      const codes = make('div', 'guidance-code-grid'); let optional = false, ruleNumber = 0;
      outputBlocks.slice(2).forEach(block => { const lines = block.split('\n'); if (lines[0] === '(선택 사항)') { optional = true; lines.shift(); } if (!lines.length) return; const title = lines.shift(); codes.append(copyBlock(title, lines.join('\n'), optional ? '선택' : String(++ruleNumber))); optional = false; }); output.body.append(codes); panel.append(output.node);
      const memory = disclosure('추가 요약 지침 설정'); const memoryBlocks = source('⭐ 추가 요약 지침').split('\n\n'); memory.body.append(settingsPath(memoryBlocks.shift()), copyBlock('추가 요약 지침', memoryBlocks.join('\n\n'))); panel.append(memory.node);
    },
    play() {
      const start = card('진행 방식'); list(start, guide('진행 안내')); panel.append(start);
      const tips = make('div', 'play-tip-grid'); guide('플레이 팁').forEach(line => { const pieces = line.split(' → '); tips.append(card(pieces[0], pieces.slice(1).join(' → '))); }); panel.append(tips);
      const examples = disclosure('상황 아이디어 · 16가지'); const grid = make('ol', 'play-ideas'); guide('추천 플레이').forEach(line => grid.append(make('li', '', line))); examples.body.append(grid); panel.append(examples.node);
    },
    commands() {
      const intro = card('상태창 읽는 법'); list(intro, guide('상태창 안내').concat(guide('명령어'))); panel.append(intro);
      const groups = [ ['장면 이어가기', ['!이어서', '!잠시후', '!사건', '!이벤트']], ['분위기 조절', ['!장면고조', '!장면완화', '!회복', '!스킵']], ['기록과 시간', ['!엿보기', '!기억조각', '!다음날', '!다음달']] ];
      const grid = make('div', 'command-guide-grid'); groups.forEach(([title, names]) => { const c = card(title); names.forEach(name => { const command = d.commands.find(x => x.command === name), row = make('div', 'command-explainer'); const variants = make('div', 'command-variants'); [['엘린', command.command], ['노디', '/' + command.command.slice(1)]].forEach(([platform, value]) => { const pair = make('div', 'command-platform-pair'); pair.append(make('span', 'command-platform-label', platform), make('code', '', value)); variants.append(pair); }); row.append(variants, make('span', 'command-description', command.description)); c.append(row); }); grid.append(c); }); panel.append(grid, make('p', 'guide-note', '실제 채팅에서는 클릭 시 1턴이 소모됩니다. 직접 입력도 가능합니다.'));
    },
    recovery() {
      if (!platformSection('recovery', '복원·이전')) return;
      const grid = make('div', 'guide-card-grid');
      const restore = card('상태창이 어긋났을 때'); restore.append(make('p', 'guide-note', '이럴 때 복원하세요.')); list(restore, guide('상태창 복원').filter(x => !x.startsWith('http') && !x.startsWith('🔗') && x !== '사용 시점')); externalLink(restore, '상태창 복원 지침 열기', guide('상태창 복원').find(x => x.startsWith('http'))); grid.append(restore);
      const move = card('새 채팅방으로 이어갈 때'), text = source('채팅방 이전 안내').split('\n').filter(Boolean); list(move, text.filter(x => !x.startsWith('http') && !x.startsWith('🔗') && x !== '이전 시점' && !x.startsWith('↳'))); move.append(make('p', 'guide-note', '새 채팅방으로 옮겨 이어가세요.')); externalLink(move, 'RP 인계 방법과 지침 열기', text.find(x => x.startsWith('http'))); grid.append(move); panel.append(grid);
    }
  };
  const choices = [['play', '플레이 방법'], ['settings', '시작 전 설정'], ['commands', '명령어·상태창'], ['recovery', '복원·이전']];
  let active = 0;
  const buttons = choices.map(([key, label], i) => { const b = make('button', '', label); if (key === 'settings' || key === 'recovery') { const badge = make('span', 'settings-platform-badge', '-'); badge.setAttribute('aria-label', '플랫폼 미선택'); b.append(badge); } b.type = 'button'; b.id = 'guide-topic-' + key; b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'guide-panel'); b.addEventListener('click', () => select(i)); tabBar.append(b); return b; });
  function select(index, focus) { active = index; panel.replaceChildren(); buttons.forEach((b, i) => { b.setAttribute('aria-selected', String(i === index)); b.tabIndex = i === index ? 0 : -1; }); panel.setAttribute('aria-labelledby', buttons[index].id); renderers[choices[index][0]](); const state = $('#status'); if (state) state.hidden = choices[index][0] !== 'commands'; if (focus) buttons[index].focus(); }
  tabBar.addEventListener('keydown', e => { let next = active; if (e.key === 'ArrowRight') next = (active + 1) % choices.length; else if (e.key === 'ArrowLeft') next = (active + choices.length - 1) % choices.length; else if (e.key === 'Home') next = 0; else if (e.key === 'End') next = choices.length - 1; else return; e.preventDefault(); select(next, true); });
  select(0);
})();
