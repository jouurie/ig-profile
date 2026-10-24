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
  function disclosureLink(label, id) {
    const a = make('a', 'guide-inline-link', label); a.href = '#' + id;
    a.addEventListener('click', event => {
      event.preventDefault(); select(id === 'guide-output' ? 'output' : id === 'guide-recommended' ? 'recommended' : id === 'guide-memory' ? 'memory' : 'models');
      panel.focus({ preventScroll: true }); panel.scrollIntoView({ block: 'start' });
    });
    return a;
  }
  function settingsList(host, items) {
    const ul = make('ul', 'guide-list');
    items.forEach(raw => {
      const note = /^\s*↳/.test(raw), line = raw.replace(/^\s*↳[\s\u00a0]*/, ''), item = make(note ? 'p' : 'li', note ? 'guide-subnote' : '');
      if (line.includes('하단 [ ⭐ 출력 가이던스 ]를 참조하세요.')) { labeledText(item, line.replace('하단 [ ⭐ 출력 가이던스 ]를 참조하세요.', '')); item.append(disclosureLink('출력 가이던스', 'guide-output')); }
      else if (line.includes('하단 [ ⭐ 모델 추천 ]을 참고하세요.')) { labeledText(item, line.replace('권장 예산 · 모델 조합:', '권장 예산:').replace('하단 [ ⭐ 모델 추천 ]을 참고하세요.', '')); item.append(disclosureLink('추천 설정값', 'guide-recommended')); }
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
  function recommendedModelText(tag, className, text) {
    const node = make(tag, className), pattern = /3\.8 Flash|4 Argon|Opus|GPT[ -]5\.6 Sol/g;
    let end = 0;
    for (const match of text.matchAll(pattern)) {
      node.append(document.createTextNode(text.slice(end, match.index)));
      node.append(make('mark', 'model-recommended', match[0]));
      end = match.index + match[0].length;
    }
    node.append(document.createTextNode(text.slice(end)));
    return node;
  }

  function modelValue(value) {
    const separateAt = value.indexOf('별도 선택:');
    if (separateAt >= 0) {
      const group = make('div', 'model-value'), regular = value.slice(0, separateAt).replace(/\s*\/\s*$/, '').trim();
      if (regular) group.append(modelValue(regular));
      group.append(recommendedModelText('div', 'model-separate-choice', value.slice(separateAt).trim()));
      return group;
    }
    if (!value.includes('↔')) return recommendedModelText('div', '', value);
    const flow = make('div', 'model-flow');
    value.split('↔').forEach((part, i) => { if (i) flow.append(make('span', 'model-flow-arrow', ' ↔ ')); flow.append(recommendedModelText('span', 'model-flow-chip', part.trim())); });
    return flow;
  }
  function tableBlock(block) {
    const title = block.split('\n')[0], section = make('section', 'guide-model-section'), table = make('table', 'guide-table'), body = make('tbody'), notes = [];
    section.append(make('h3', '', title));
    rowsFromBlock(block).forEach(row => {
      if (title === '참고' && !row.label) { notes.push(row.value, ...row.notes); return; }
      const tr = make('tr'), th = recommendedModelText('th', '', row.label), td = make('td');
      th.scope = 'row';
      const labelGroups={'자동으로 요약하기':['자동으로','요약하기'],'원문 줄바꿈 그대로':['원문 줄바꿈','그대로'],'내 캐릭터 대신 하기 (사칭)':['내 캐릭터','대신 하기','(사칭)'],'적극적인 사칭 플레이':['적극적인','사칭 플레이']};
      if(labelGroups[row.label]){th.replaceChildren();labelGroups[row.label].forEach((part,index)=>{if(index)th.append(document.createTextNode(' '));th.append(make('span','guide-label-part',part));});}
      td.append(modelValue(row.value));
      if (title === '추론 조절') notes.push(...row.notes);
      else row.notes.forEach(n => td.append(make('small', '', n)));
      tr.append(th, td); body.append(tr);
    });
    table.append(body); section.append(table);
    if (notes.length) {
      const notice = make('aside', 'guide-model-notes');
      if (title === '추론 조절') notice.append(make('h4', '', '기본값'));
      notes.forEach(text => notice.append(make('p', '', text))); section.append(notice);
    }
    return section;
  }

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
      button.addEventListener('click', () => { platformSelections[section] = key; select(active); }); platforms.append(button);
    });
    panel.append(platforms);
    if (!selected) { panel.append(make('h2', 'settings-platform-title', '플랫폼 미선택'), make('p', 'guide-note', '엘린 또는 노디를 선택하세요.')); return false; }
    panel.append(make('h2', 'settings-platform-title', (selected === 'elyn' ? '엘린' : '노디') + ' ' + title));
    if (selected === 'nody' && section === 'settings') { renderNody(section); return false; }
    return true;
  }
  function renderNody(section) {
    const appendTableLink=(section,label,link)=>{const row=document.createElement('tr'),key=document.createElement('th'),value=document.createElement('td');key.scope='row';key.textContent=label;value.append(link);row.append(key,value);section.querySelector('tbody').append(row);};

    if (section === 'recovery') { panel.append(card('안내', '등록된 안내가 없습니다.')); return; }
    if (active === 'budget') {
      const budget = card('로어북 예산');
      settingsList(budget, ["로어북은 키워드가 나올 때만 꺼내 쓰는 설정입니다.","로어북 예산은 한 번의 답변에 가져올 수 있는 로어북 내용의 글자수 한도이며, 캐시 금액이 아닙니다.","내용이 예산 한도로 잘리지 않도록 최대로 설정하는 것을 권장합니다. 예산을 늘리면 더 많은 설정을 담는 대신 매 턴 캐시 사용량도 늘 수 있습니다.","권장 예산: 하단 [ ⭐ 모델 추천 ]을 참고하세요."]); panel.append(budget);
    } else if (active === 'recommended') {
      panel.append(settingsPath('채팅방 설정 → 대화'));
      const options = make('div', 'guide-card-grid');
      options.append(tableBlock("사칭 방지 플레이\n내 캐릭터 대신 하기 (사칭): 살짝"),tableBlock("사칭 플레이 (/이어서, *이어서* 위주)\n내 캐릭터 대신 하기 (사칭): 적극")); panel.append(options);
      panel.append(tableBlock("답변\n출력량: 길게\n최대 출력량: 6,000토큰\n응답 품질: 높음\n로어북 예산: 50,000자\n출력 속도: 즉시"));
      panel.append(make('p', 'guide-note', "응답 품질은 답변 전에 점검하는 항목 수입니다. 노디 안내 기준 낮음은 3개, 보통은 4개, 높음은 5개이며, 모델 자체의 추론 예산과 같은 수치로 볼 수는 없습니다. 설정과 앞선 대화를 더 챙기도록 모델 공통으로 높음을 권장합니다. 모델별 최적값이나 최저비용을 검증한 값은 아니며, 답변이 느려지고 캐시 사용량이 늘 수 있습니다. 높음도 상태창과 기억의 정확성을 보장하지는 않습니다."));
      panel.append(tableBlock("추천 답변 문체\n지문 표기: 안 씀\n인칭: 3인칭\n시제: 과거"));
      panel.append(tableBlock("문체\n문체: 노디 기본\n지문 별표 쓰기: 끔"));
      const guidance = tableBlock('출력 가이던스\n역할극 유지: 적용\n관계 진행: 적용'); appendTableLink(guidance,'입력 위치',disclosureLink('가이던스 내용과 입력 위치', 'guide-output')); panel.append(guidance);
      panel.append(tableBlock("AI 연기 방식\n사칭 방지 플레이: 살짝\n사칭 플레이: 적극\n이야기 전개: 차분하게 또는 적극적으로\n캐릭터 태도: 중립 또는 거칠게"));
      panel.append(tableBlock("기타\n상태창 표시: 켬"));
      panel.append(settingsPath('채팅방 설정 → 기억'));
      panel.append(tableBlock("대화 기억 범위\n최근 대화: 5턴"));
      const memorySettings=tableBlock("장기기억 설정\n요약 주기: 5턴\n요약 글자수: 6,000자\n자동으로 요약하기: 켬"); panel.append(memorySettings);
      appendTableLink(memorySettings,'요약 방식',disclosureLink('기억 지침', 'guide-memory'));
      panel.append(make('p', 'guide-note', '1턴은 내 말과 캐릭터 답변 한 쌍입니다. 최근 대화는 원문으로 기억할 범위이고, 요약 주기는 장기기억을 갱신할 간격입니다. 원문 비용을 줄이려면 최근 대화부터 조절하세요.'));
      panel.append(make('p', 'guide-note', '요약 주기를 줄이면 요약 횟수가 늘어납니다. 총비용은 답변 사용량과 실제 캐시 차감, 요약 요금의 포함 여부를 함께 확인하세요. DeepSeek Flash로 각 20턴을 시험했을 때는 별도 추가 요약 차감이 확인되지 않았습니다. 위 5턴 주기는 기억을 자주 갱신하기 위한 권장값이며, 최저비용 설정으로 검증된 값은 아닙니다.'));
      panel.append(settingsPath('채팅방 설정 → 화면 → 글자'));
      panel.append(tableBlock("글자\n원문 줄바꿈 그대로: 켬"));
    } else if (active === 'models') {
      const model = make('div', 'guide-models'); model.id = 'guide-models';
      ["운용\n가성비: 3.7 Flash / 3.8 Flash ↔ GLM 5.3\n일반: 3.7 Flash / 3.8 Flash ↔ 4 Argon / 2.5 Pro / 3.1 Pro / 별도 선택: GPT-6.1 Sol (SFW)\n고가: Opus 5.5 ↔ 4 Argon / 별도 선택: GPT-5.6 Sol · GPT-6.1 Sol (SFW)\nNSFW: 3.7 Flash / 3.8 Flash / 4 Argon / 2.5 Pro / 3.1 Pro ↔ GLM 5.3 / Opus 5.5","모델별 특징\n3.7 Flash / 3.8 Flash: 대사가 자연스럽고 진행이 능동적입니다. 3.7 Flash는 다소 긍정적이고, 3.8 Flash는 다소 부정적인 경향이 있습니다.\nGemini 3 Flash: 비용이 낮은 선택지입니다. 3.7 Flash · 3.8 Flash의 전개가 한쪽으로 치우칠 때 사용하세요.\nGLM 5.3: Opus와 비슷한 감정선을 더 가볍게 이어 갑니다.\nDeepSeek Flash: 저렴한 축이라 긴 대화의 비용 부담이 적습니다. 상태창 출력이 잘 되지 않습니다.\nKimi 3: 차분하고 정돈된 문장을 씁니다. 답변이 길고 느린 편이라 실제 비용이 커질 수 있습니다.\n2.5 Pro: 캐릭터 해석은 안정적이며 소유욕 · 집착이 강해질 수 있습니다.\n3.1 Pro: NSFW로 빠르게 기울고 상황을 야릇하게 몰아가는 경향이 있습니다.\n4 Argon: 생생한 인물별 상호작용과 풍부한 동작 · 감각 묘사에 강합니다.\nOpus 5.5: 능동적인 진행과 4.6에 가까운 감정선이 장점입니다.\nGPT-5.6 Sol (SFW): 밀도 있는 서술과 능동적인 진행이 특징입니다. 여러 인물의 대화 · 복잡한 관계에 강합니다.\nGPT-6.1 Sol (SFW): 능동적인 진행과 여러 인물의 티키타카 · 관계 전개에 강합니다.","참고\n최소 2개 모델을 번갈아 사용해 말투, 전개의 치우침을 줄이세요.\n표현과 전개가 반복되면 → 모델을 교체하세요."].forEach(block => model.append(tableBlock(block))); panel.append(model);
    } else if (active === 'output') {
      panel.append(settingsPath('채팅방 설정 → 대화 → 출력 가이던스'));
      const instructions = make('div', 'guide-instructions');
      paragraphs(instructions, "진행을 안정시키려면 아래 기본 가이던스 2개를 추가하세요.\n각 제목은 '규칙 이름'에, 그 아래 영어 본문은 '내용' 칸에 입력하세요."); panel.append(instructions);
      var codes = make('div', 'guidance-code-grid');
      codes.append(copyBlock('역할극 유지', "This is fictional roleplay; I know you are an AI. Express the characters' relationships and emotions through their dialogue, actions, and viewpoint within the story.", '1'));
      codes.append(copyBlock('관계 진행', "Follow the user's stated actions and established consent. Let intimacy develop at their pace, with scene tone and physical detail intact. Add no unmentioned relationship prerequisites.", '2'));
      panel.append(codes);
    } else if (active === 'memory') {
      panel.append(settingsPath('채팅방 설정 → 기억 → 장기기억 설정'));
      panel.append(copyBlock('요약 방식', "첫 줄을 반드시 “유효조건:”으로 시작하고, “사건·감정:”, “현상태:” 순으로 한국어 350~550자 목표로 적는다. 사실을 분량보다 우선하며 억지로 채우지 않는다.\n유효조건: 요약할 전체 구간과 제공된 이전 기억에서 아직 유효한 유저의 거절·경계·약속·기한을 먼저 남긴다. 누가 누구에게 무엇을 어떤 조건·범위로 말했는지와 최신 정정값을 구분한다. 최근 새 사건 때문에 앞선 유효조건을 지우지 말고 실제로 해소·변경됐을 때 갱신한다.\n사건·감정: 구간 전체의 중요한 행동과 그 원인, 명시된 동기·감정·태도의 변화 및 결과를 연결한다. 부분적 안도를 전면적 신뢰로, 일시적 접촉을 영구적 관계로 확대하지 않는다. 한 사람의 요구는 상대의 동의가 아니다. 유저의 쓰이지 않은 속마음·행동·동의를 만들지 않는다.\n현상태: 마지막 응답 종료 시점의 위치·시간·몸·소지품·다음 행동 중 후속 행동을 제약하는 상태와 확인 수준을 남긴다. 발언·문자·계획·추측·확인된 사실을 구별하고, 실제로 전달받은 인물만 아는 것으로 적는다. 이름·중요 수치를 보존하며 반복·긴 인용은 줄인다.\n이결의 돌봄·통제·회피, 연락과 디지털 증거, 가족·직장 압박, 숨긴 자원·자기방치·수리비는 후속 행동에 영향을 주는 것만 남긴다."));
      panel.append(make('p', 'guide-note', '요약 방식 입력란에 붙여 넣으세요. 다음 요약부터 적용되며, 구간별 요약이 장기기억에 덧붙습니다. 확정 사실은 별도 목록으로 쌓입니다.'));
      panel.append(make('p', 'guide-note', '요약 글자수는 매번 채우는 목표량이 아닙니다. 1,000자·3,000자 설정 시험에서는 한도를 넘자 오래된 구간이 빠지고 최근 구간이 원문 그대로 남았습니다. 지침의 분량과 형식도 항상 지켜지지는 않으므로, 중요한 약속·기한·조건은 확정 사실이나 노트에도 남겨두세요.'));
    }
  }
  const renderers = {
    progress() { const start = card('진행 방식'); list(start, guide('진행 안내')); panel.append(start); },
    tips() {
      const tips = make('div', 'play-tip-grid'); guide('플레이 팁').forEach(line => { const pieces = line.split(' → '); tips.append(card(pieces[0], pieces.slice(1).join(' → '))); }); panel.append(tips);
    },
    examples() {
      const examples = card('상황 아이디어 · 16가지'), grid = make('ol', 'play-ideas'); guide('추천 플레이').forEach(line => grid.append(make('li', '', line))); examples.append(grid); panel.append(examples);
    },
    budget() { if (!platformSection('settings', '로어북 예산')) return; const budget = card('로어북 예산'); settingsList(budget, source('로어북 예산 안내').split('\n')); panel.append(budget); },
    recommended() {
      if (!platformSection('settings', '추천 설정값')) return;
      panel.append(settingsPath('출력 탭'));
      const options = make('div', 'guide-card-grid'); source('⭐ 추천 설정값').split('\n\n').forEach(block => { const lines = block.split('\n'), c = card(lines.shift()); settingsList(c, lines); options.append(c); }); panel.append(options);
      const modelChoice = card('채팅 모델'); modelChoice.append(disclosureLink('모델 추천에서 선택', 'guide-models')); panel.append(modelChoice);
      panel.append(tableBlock('프롬프트\n프롬프트: 상단에서 고른 플레이 방식에 맞춰 선택'));
      panel.append(settingsPath('출력 탭 → 과금 방식 및 출력 설정'));
      const blocks = source('⭐ 모델 추천').split('\n\n'), common = rowsFromBlock(blocks[0]);
      const metrics = make('div', 'settings-metrics'); common.slice(0, 3).forEach(row => { const metric = make('div', 'setting-metric'); metric.append(make('span', '', row.label), make('strong', '', row.value)); metrics.append(metric); }); panel.append(make('p', 'guide-note', common.slice(3).map(x => x.value).join(' ')), metrics);
      const settings = make('div', 'guide-models');
      settings.append(tableBlock('모델별 추론값\n' + rowsFromBlock(blocks[2]).map(row => row.label + ': ' + row.value).join('\n')), tableBlock(blocks[3]));
      const settingsNotes = rowsFromBlock(blocks[4]).filter(row => row.label);
      settings.append(tableBlock('설정 참고\n' + settingsNotes.map(row => row.label + ': ' + row.value).join('\n'))); panel.append(settings);
      panel.append(make('p', 'guide-note', '모델별 추론값이 공통 기본값보다 우선합니다.'));
      const outputGuide = card('출력 가이던스'); outputGuide.append(disclosureLink('가이던스 내용과 입력 위치', 'guide-output')); panel.append(outputGuide);
      panel.append(tableBlock('응답 설정\n사칭 방지: OFF'));
      panel.append(settingsPath('기억 탭 → 세부 조정 → 추가 요약 지침'));
      const memoryGuide = card('추가 요약 지침'); memoryGuide.append(disclosureLink('기억 지침', 'guide-memory')); panel.append(memoryGuide);
    },
    models() {
      if (!platformSection('settings', '모델 추천')) return;
      const blocks = source('⭐ 모델 추천').split('\n\n');
      const model = make('div', 'guide-models'); model.id = 'guide-models'; model.append(tableBlock(blocks[1]));
      const features = rowsFromBlock(blocks[2]).map(row => row.label + ': ' + row.notes.join('\n↳ ')).join('\n');
      model.append(tableBlock('모델별 특징\n' + features));
      model.append(tableBlock('참고\n' + rowsFromBlock(blocks[4]).filter(row => !row.label).map(row => row.value).join('\n'))); panel.append(model);
      const link = make('p'); link.append(document.createTextNode('공통 기본값과 모델별 추론 조절: '), disclosureLink('추천 설정값', 'guide-recommended')); panel.append(link);
    },
    output() {
      if (!platformSection('settings', '출력 가이던스')) return;
      const output = make('section', 'guide-output'); output.id = 'guide-output'; const outputBlocks = source('⭐ 출력 가이던스').split('\n\n');
      output.append(settingsPath(outputBlocks[0])); const instructions = make('div', 'guide-instructions'); paragraphs(instructions, outputBlocks[1]); output.append(instructions);
      const codes = make('div', 'guidance-code-grid'); let optional = false, ruleNumber = 0;
      outputBlocks.slice(2).forEach(block => { const lines = block.split('\n'); if (lines[0] === '(선택 사항)') { optional = true; lines.shift(); } if (!lines.length) return; const title = lines.shift(); codes.append(copyBlock(title, lines.join('\n'), optional ? '선택' : String(++ruleNumber))); optional = false; }); output.append(codes); panel.append(output);
    },
    memory() {
      if (!platformSection('settings', platformSelections.settings === 'nody' ? '요약 방식' : '추가 요약 지침')) return;
      const memoryBlocks = source('⭐ 추가 요약 지침').split('\n\n'); panel.append(settingsPath(memoryBlocks.shift()), copyBlock('추가 요약 지침', memoryBlocks.join('\n\n')));
    },
    commands() {
      const intro = card('명령어'); list(intro, guide('명령어')); panel.append(intro);
      const groups = [ ['장면 이어가기', ['!이어서', '!잠시후', '!사건', '!이벤트']], ['분위기 조절', ['!장면고조', '!장면완화', '!회복', '!스킵']], ['기록과 시간', ['!엿보기', '!기억조각', '!다음날', '!다음달']] ];
      const grid = make('div', 'command-guide-grid'); groups.forEach(([title, names]) => { const c = card(title); names.forEach(name => { const command = d.commands.find(x => x.command === name), row = make('div', 'command-explainer'); const variants = make('div', 'command-variants'); [['엘린', command.command], ['노디', '/' + command.command.slice(1)]].forEach(([platform, value]) => { const pair = make('div', 'command-platform-pair'); pair.append(make('span', 'command-platform-label', platform), make('code', '', value)); variants.append(pair); }); row.append(variants, make('span', 'command-description', command.description)); c.append(row); }); grid.append(c); }); panel.append(grid, make('p', 'guide-note', '실제 채팅에서는 클릭 시 1턴이 소모됩니다. 직접 입력도 가능합니다.'));
    },
    status() { const intro = card('상태창 읽는 법'); list(intro, guide('상태창 안내')); panel.append(intro); },
    transfer() {
      if (!platformSection('recovery', '채팅방 이전 안내')) return;
      const when = card('사용 시점'); list(when, ["대화가 길어져 맥락이 흐려졌을 때","새 채팅방에서 이어가고 싶을 때"]);
      const more = card('RP 인계 방법 + 가이드');
      externalLink(more, '지침 보기', platformSelections.recovery === 'nody' ? 'https://rentry.co/rp-handoff-note-nody' : 'https://rentry.co/rp-handoff-note');
      panel.append(when, more);
    },
    restore() {
      if (!platformSection('recovery', '상태창 복원 안내')) return;
      const when = card('사용 시점');
      list(when, guide('상태창 복원').filter(x => !x.startsWith('http') && !x.startsWith('🔗') && x !== '사용 시점'));
      const more = card('상태창 복원 안내 + 가이드');
      externalLink(more, '지침 보기', platformSelections.recovery === 'nody' ? 'https://rentry.co/rp-status-recovery-igyeol-nody' : guide('상태창 복원').find(x => x.startsWith('http')));
      panel.append(when, more);
    }
  };
  const groups = [
    ['play', '플레이 방법', [['progress', '진행 안내'], ['tips', '플레이 팁'], ['examples', '추천 플레이']]],
    ['settings', '시작 전 설정', [['budget', '로어북 예산 안내'], ['recommended', '추천 설정값'], ['models', '모델 추천'], ['output', '출력 가이던스'], ['memory', '기억 지침']]],
    ['commands', '명령어·상태창', [['commands', '명령어'], ['status', '상태창']]],
    ['recovery', '복원·이전', [['transfer', '채팅방 이전 안내'], ['restore', '상태창 복원 안내']]]
  ];
  const choices = groups.flatMap(group => group[2]), buttons = []; let active = 'progress';
  tabBar.setAttribute('aria-label', '가이드 메뉴');
  groups.forEach(([key, label, items]) => {
    const group = make('div', 'guide-nav-group'), heading = make('h2', 'guide-nav-title', label), children = make('div', 'guide-nav-items');
    heading.id = 'guide-group-' + key; group.setAttribute('role', 'presentation'); group.append(heading, children);
    items.forEach(([id, text]) => {
      const b = make('button', '', text); b.type = 'button'; b.id = 'guide-topic-' + id; b.dataset.guideItem = id; b.setAttribute('role', 'tab'); b.setAttribute('aria-controls', 'guide-panel'); b.addEventListener('click', () => select(id)); children.append(b); buttons.push(b);
    }); tabBar.append(group);
  });
  const mobileTables=matchMedia('(max-width:650px)');
  function foldLongTables(){
    panel.querySelectorAll('.guide-model-section').forEach(section=>{
      const table=section.querySelector('table'),heading=section.querySelector(':scope>h3');
      if(!heading||!table||table.rows.length<3)return;
      const details=make('details','guide-table-disclosure'),summary=make('summary','',heading.textContent);
      heading.remove();details.open=!mobileTables.matches;summary.tabIndex=mobileTables.matches?0:-1;
      summary.addEventListener('click',event=>{if(!mobileTables.matches)event.preventDefault();});
      details.append(summary,...section.childNodes);section.append(details);
    });
  }
  mobileTables.addEventListener('change',()=>panel.querySelectorAll('.guide-table-disclosure').forEach(details=>{details.open=!mobileTables.matches;details.querySelector('summary').tabIndex=mobileTables.matches?0:-1;}));
  function packSettingTables(){
    if(active!=='recommended'||platformSelections.settings!=='nody')return;
    let group=null,unit=null;
    for(const child of [...panel.children]){
      if(child.matches('.guide-model-section')){
        if(!group){group=make('div','settings-table-grid');child.before(group);}
        unit=make('div','settings-table-unit');group.append(unit);unit.append(child);
      }else if(group&&child.matches('p')){unit.append(child);}
      else{group=null;unit=null;}
    }
    panel.querySelectorAll('.settings-table-grid').forEach(grid=>{
      const units=[...grid.children];
      const weights=units.map(item=>item.querySelectorAll('tr').length+2+[...item.querySelectorAll('p')].reduce((sum,p)=>sum+p.textContent.length/45+1,0));
      const total=weights.reduce((sum,n)=>sum+n,0);
      let split=1,best=Infinity,left=0;
      for(let i=1;i<units.length;i++){left+=weights[i-1];const difference=Math.abs(total-2*left);if(difference<best){best=difference;split=i;}}
      const columns=[make('div','settings-table-column'),make('div','settings-table-column')];
      units.forEach((item,i)=>columns[i<split?0:1].append(item));grid.replaceChildren(...columns);
    });
  }
  function select(key, focus) {
    active = key; panel.replaceChildren(); buttons.forEach(b => { const selected = b.dataset.guideItem === key; b.setAttribute('aria-selected', String(selected)); b.tabIndex = selected ? 0 : -1; });
    const selected = buttons.find(b => b.dataset.guideItem === key); panel.setAttribute('aria-labelledby', selected.id); renderers[key](); packSettingTables(); foldLongTables();
    const state = $('#status'); if (state) state.hidden = key !== 'status'; if (focus) selected.focus();
  }
  tabBar.addEventListener('keydown', e => {
    const index = choices.findIndex(choice => choice[0] === active); let next = index;
    if (e.key === 'ArrowRight') next = (index + 1) % choices.length; else if (e.key === 'ArrowLeft') next = (index + choices.length - 1) % choices.length; else if (e.key === 'Home') next = 0; else if (e.key === 'End') next = choices.length - 1; else return;
    e.preventDefault(); select(choices[next][0], true);
  });
  select('progress');
})();
