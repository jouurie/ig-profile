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
    const node = make(tag, className), pattern = /3\.8 Flash|4 Argon|Opus|GPT 5\.6 Sol/g;
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
      th.scope = 'row'; td.append(modelValue(row.value));
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
    if (section === 'recovery') { panel.append(card('안내', '등록된 안내가 없습니다.')); return; }
    if (active === 'budget') {
      const budget = card('로어북 예산');
      paragraphs(budget, '로어북은 키워드가 나올 때만 꺼내 쓰는 설정입니다.\n로어북 예산은 한 번의 답변에 가져올 수 있는 로어북 내용의 글자수 한도이며, 캐시 금액이 아닙니다.\n내용이 예산 한도로 잘리지 않도록 최대로 설정하는 것을 권장합니다. 예산을 늘리면 더 많은 설정을 담는 대신 매 턴 캐시 사용량도 늘 수 있습니다.');
      const link = make('p'); link.append(document.createTextNode('권장 예산: '), disclosureLink('추천 설정값', 'guide-recommended')); budget.append(link); panel.append(budget);
    } else if (active === 'recommended') {
      const options = make('div', 'guide-card-grid');
      const prevention = card('사칭 방지 플레이'); settingsList(prevention, ['내 캐릭터 대신 하기 (사칭): 안 함']);
      const impersonation = card('사칭 플레이 (/이어서, *이어서* 위주)'); settingsList(impersonation, ['내 캐릭터 대신 하기 (사칭): 기본 살짝', '적극적인 사칭 플레이: 적극']);
      options.append(prevention, impersonation); panel.append(options);
      panel.append(settingsPath('채팅방 설정 → 대화'));
      panel.append(tableBlock("답변\n출력량: 길게\n최대 출력량: 6,000토큰\n응답 품질: 아래 모델별 권장값 적용\n로어북 예산: 50,000자\n출력 속도: 즉시"));
      panel.append(tableBlock("모델별 응답 품질\nGemini 3.8 Flash / Gemini 3 Flash: 높음\nGemini 4 Argon: 보통\nGemini 3.1 Pro: 낮음\nGLM 5.3: 보통\nOpus 5.5 / Sonnet 5: 보통\nGPT-6.1 Sol (SFW): 보통\nDeepSeek Flash / Kimi 3: 보통"));
      panel.append(tableBlock("추천 답변 문체\n지문 표기: 안 씀\n인칭: 3인칭\n시제: 과거"));
      panel.append(tableBlock("문체\n문체: 노디 기본\n지문 별표 쓰기: 끔"));
      const guidance = card('출력 가이던스'); settingsList(guidance, ['역할극 유지: 적용', '관계 진행: 적용']); guidance.append(disclosureLink('가이던스 내용과 입력 위치', 'guide-output')); panel.append(guidance);
      panel.append(tableBlock("AI 연기 방식\n내 캐릭터 대신 하기 (사칭): 상단에서 고른 플레이 방식에 맞춰 안 함 / 살짝 / 적극\n이야기 전개: 차분하게 또는 적극적으로\n캐릭터 태도: 중립 또는 거칠게"));
      panel.append(tableBlock("기타\n상태창 표시: 켬"));
      panel.append(settingsPath('채팅방 설정 → 기억'));
      panel.append(tableBlock("대화 기억 범위\n최근 대화: 10턴"));
      panel.append(tableBlock("장기기억 설정\n요약 주기: 10턴\n요약 글자수: 6,000자\n자동으로 요약하기: 켬"));
      const memoryLink = make('p'); memoryLink.append(document.createTextNode('요약 방식 입력: '), disclosureLink('기억 지침', 'guide-memory')); panel.append(memoryLink);
      panel.append(make('p', 'guide-note', '노디의 1턴은 내 말과 캐릭터 답변 한 쌍입니다. 최근 대화는 원문으로 기억할 범위이고, 요약 주기는 장기기억을 갱신할 간격입니다.'));
      panel.append(settingsPath('채팅방 설정 → 화면 → 글자'));
      panel.append(tableBlock("글자\n원문 줄바꿈 그대로: 켬"));
    } else if (active === 'models') {
      const model = make('div', 'guide-models'); model.id = 'guide-models';
      ["운용\n가성비: 3.8 Flash ↔ GLM 5.3 / DeepSeek Flash\n일반: 3.8 Flash ↔ 4 Argon / 3.1 Pro / Sonnet 5 / 별도 선택: GPT-6.1 Sol (SFW)\n고가: Opus 5.5 ↔ 4 Argon / Kimi 3\nNSFW: 3.8 Flash / 4 Argon / 3.1 Pro ↔ GLM 5.3 / Opus 5.5","모델별 특징\n3.8 Flash: 대사가 자연스럽고 진행이 능동적입니다. 다소 부정적인 전개로 기울 수 있습니다.\nGemini 3 Flash: 가볍고 빠른 대화에 맞는 저비용 선택지입니다.\nGLM 5.3: GLM 계열 최신 모델입니다. 노디에서는 표현이 안정적이고 비용이 낮은 라이트급으로 안내합니다.\n3.1 Pro: 추론이 깊은 Pro 계열입니다. 장면이 야릇한 방향으로 빠르게 기울 수 있습니다.\n4 Argon: 생생한 인물별 상호작용과 풍부한 동작 · 감각 묘사에 강합니다.\nOpus 5.5: 능동적인 진행과 감정선이 장점입니다. 비용은 높은 편입니다.\nSonnet 5: 감정 묘사와 앞 대화의 맥락 유지에 맞는 선택지입니다. 노디 기준 비용은 중상위권입니다.\nGPT-6.1 Sol (SFW): 성능과 속도의 균형을 갖춘 최신 Sol입니다. 노디 기준 비용은 중간대입니다.\nDeepSeek Flash: 저렴하게 긴 대화를 이어 갈 때의 선택지입니다. 노디에서는 평일 낮 시간대의 캐시 소모가 더 커질 수 있다고 안내합니다.\nKimi 3: 차분하고 정돈된 문장을 선호할 때의 선택지입니다. 답이 길고 느려 실제 비용이 커질 수 있습니다.","참고\n최소 2개 모델을 번갈아 사용해 말투와 전개의 치우침을 줄이세요.\n표현과 전개가 반복되면 모델을 교체하세요."].forEach(block => model.append(tableBlock(block))); panel.append(model);
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
      panel.append(copyBlock('요약 방식', "Use only supplied evidence. Summarize in natural Korean within the summary length selected in NODY, including spaces. Prioritize what still affects later actions; merge repeats and omit filler.\nStart with the last scene's short [time band, established place]. Carry supported anchors from supplied context/memory within the same scene; retain identifying place names. Update on evidenced transitions, without guessing or carrying anchors across scene/POV/flashback breaks. Distinguish multiple scenes in prose. If formatting varies, retain the anchors in prose.\nName who did what and the supported result, without invented causes. Preserve explicit motives, promises, agreements, refusals and boundaries with their conditions/scope. Attribute claims/beliefs/knowledge with source certainty; update only holders reached by evidence. Retain active constraints and unresolved matters from supplied memory with confirmed corrections/resolutions.\nKeep supported relationship changes; local emotion, intimacy or roles alone do not establish formal status, permanent traits or first onset. For {{user}}, retain supplied words/actions and visible state; leave unwritten thoughts/reactions open.\nUse indirect speech with useful names/nicknames, terms and recurring motifs; omit full quotes, bilingual pairs, speech wrappers and HTML entities. Keep consequential NPC roles, arrivals/exits, last state/place, leverage and evidence/debt ownership. Keep relevant priorities below, respecting exact terms/values/archive formats.\nFor I-Gyeol, preserve established place, his evidenced stance toward {{user}}, visible body/contact/exit state, consequential care/control/avoidance/surveillance and relationship change, domestic/digital evidence, messages/calls, family/office pressure, hidden resources/self-neglect, and unresolved access or repair cost."));
      panel.append(make('p', 'guide-note', '요약 방식 입력란에 붙여 넣으세요. 엘린의 200/400/600자 제한을 노디의 요약 글자수 설정에 맞게 바꿨습니다. 이미 저장된 요약은 그대로 두고 다음 요약부터 적용됩니다.'));
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
      const options = make('div', 'guide-card-grid'); source('⭐ 추천 설정값').split('\n\n').forEach(block => { const lines = block.split('\n'), c = card(lines.shift()); settingsList(c, lines); options.append(c); }); panel.append(options);
      panel.append(settingsPath('출력 탭'));
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
      if (!platformSection('recovery', '채팅방 이전')) return;
      const move = card('새 채팅방으로 이어갈 때'), text = source('채팅방 이전 안내').split('\n').filter(Boolean); list(move, text.filter(x => !x.startsWith('http') && !x.startsWith('🔗') && x !== '이전 시점' && !x.startsWith('↳'))); move.append(make('p', 'guide-note', '새 채팅방으로 옮겨 이어가세요.')); externalLink(move, 'RP 인계 방법과 지침 열기', text.find(x => x.startsWith('http'))); panel.append(move);
    },
    restore() {
      if (!platformSection('recovery', '상태창 복원')) return;
      const restore = card('상태창이 어긋났을 때'); restore.append(make('p', 'guide-note', '이럴 때 복원하세요.')); list(restore, guide('상태창 복원').filter(x => !x.startsWith('http') && !x.startsWith('🔗') && x !== '사용 시점')); externalLink(restore, '상태창 복원 지침 열기', guide('상태창 복원').find(x => x.startsWith('http'))); panel.append(restore);
    }
  };
  const groups = [
    ['play', '플레이 방법', [['progress', '진행 안내'], ['tips', '플레이 팁'], ['examples', '추천 플레이']]],
    ['settings', '시작 전 설정', [['budget', '로어북 예산 안내'], ['recommended', '추천 설정값'], ['models', '모델 추천'], ['output', '출력 가이던스'], ['memory', '기억 지침']]],
    ['commands', '명령어·상태창', [['commands', '명령어'], ['status', '상태창']]],
    ['recovery', '복원·이전', [['transfer', '채팅방 이전 안내'], ['restore', '상태창 복원 지침']]]
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
  function select(key, focus) {
    active = key; panel.replaceChildren(); buttons.forEach(b => { const selected = b.dataset.guideItem === key; b.setAttribute('aria-selected', String(selected)); b.tabIndex = selected ? 0 : -1; });
    const selected = buttons.find(b => b.dataset.guideItem === key); panel.setAttribute('aria-labelledby', selected.id); renderers[key]();
    const state = $('#status'); if (state) state.hidden = key !== 'status'; if (focus) selected.focus();
  }
  tabBar.addEventListener('keydown', e => {
    const index = choices.findIndex(choice => choice[0] === active); let next = index;
    if (e.key === 'ArrowRight') next = (index + 1) % choices.length; else if (e.key === 'ArrowLeft') next = (index + choices.length - 1) % choices.length; else if (e.key === 'Home') next = 0; else if (e.key === 'End') next = choices.length - 1; else return;
    e.preventDefault(); select(choices[next][0], true);
  });
  select('progress');
})();
