// 글자 크기 다시 매기기.
// 기존 CSS 를 불러오는 순서대로 읽어서, px 글자 크기를 정한 규칙마다 같은 선택자·같은 @media 로
// 새 크기만 적은 규칙을 뽑아낸다. 순서와 조건이 그대로라 기존 캐스케이드 결과가 유지된다.
//   cd tools && node type-remap.cjs type-remap.json   (기존 CSS 를 고친 뒤 다시 돌리면 refresh-type.css 가 새로 만들어진다)
// 설정: { dir, files:[...], out, breakpoint, wide:{from:to,...}, narrow:{...}, skip:[정규식 문자열...] }
const fs = require('node:fs');
const path = require('node:path');
const cfg = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const skip = (cfg.skip || []).map(s => new RegExp(s));

function stripComments(css) { return css.replace(/\/\*[\s\S]*?\*\//g, ''); }

// 최상위 블록을 { prelude, body } 로 자른다. 문자열 안의 중괄호는 건너뛴다.
function blocks(css) {
  const out = []; let i = 0, start = 0, depth = 0, bodyStart = -1, prelude = '';
  while (i < css.length) {
    const c = css[i];
    if (c === '"' || c === "'") { const q = c; i++; while (i < css.length && css[i] !== q) { if (css[i] === '\\') i++; i++; } }
    else if (c === '{') { if (depth === 0) { prelude = css.slice(start, i).trim(); bodyStart = i + 1; } depth++; }
    else if (c === '}') { depth--; if (depth === 0) { out.push({ prelude, body: css.slice(bodyStart, i) }); start = i + 1; } }
    else if (c === ';' && depth === 0) { start = i + 1; }
    i++;
  }
  return out;
}

function mapSize(px, table) {
  const keys = Object.keys(table).map(Number).sort((a, b) => a - b);
  if (table[px] != null) return table[px];
  if (px < keys[0]) return px + (table[keys[0]] - keys[0]);
  const last = keys[keys.length - 1];
  if (px > last) return Math.round(px * (table[last] / last) * 2) / 2;
  // 사이 값은 선형 보간
  let lo = keys[0], hi = last;
  for (const k of keys) { if (k <= px) lo = k; if (k >= px) { hi = k; break; } }
  if (lo === hi) return table[lo];
  return Math.round((table[lo] + (table[hi] - table[lo]) * (px - lo) / (hi - lo)) * 2) / 2;
}

function fontSizeOf(body) {
  // 마지막에 적힌 선언이 이긴다. font-size 와 font 단축 속성을 모두 본다.
  let found = null;
  for (const decl of body.split(';')) {
    const m = decl.match(/^\s*(font-size|font)\s*:\s*(.+)$/s);
    if (!m) continue;
    const important = /!important/.test(m[2]);
    if (m[1] === 'font-size') {
      const v = m[2].replace('!important', '').trim();
      const px = v.match(/^(\d*\.?\d+)px$/);
      found = px ? { px: Number(px[1]), important } : null;
    } else {
      const px = m[2].match(/(?:^|\s)(\d*\.?\d+)px(?:\s*\/|\s|$)/);
      found = px ? { px: Number(px[1]), important } : null;
    }
  }
  return found;
}

const wideOut = [], narrowOut = [], condOut = [];
let count = 0;

function walk(css, media) {
  for (const b of blocks(css)) {
    if (b.prelude.startsWith('@media') || b.prelude.startsWith('@container') || b.prelude.startsWith('@supports')) {
      walk(b.body, media.concat(b.prelude));
      continue;
    }
    if (b.prelude.startsWith('@')) continue; // @font-face, @keyframes 등
    if (b.body.includes('{')) { continue; }   // 중첩 규칙은 다루지 않는다
    if (skip.some(r => r.test(b.prelude))) continue;
    const fs_ = fontSizeOf(b.body);
    if (!fs_) continue;
    count++;
    const imp = fs_.important ? '!important' : '';
    const rule = (table) => `${b.prelude}{font-size:${mapSize(fs_.px, table)}px${imp}}`;
    if (!media.length) {
      wideOut.push(rule(cfg.wide));
      narrowOut.push(rule(cfg.narrow));
    } else {
      // 좁은 화면 전용 조건이면 좁은 표, 그 밖(넓은 화면·호버·컨테이너)은 넓은 표를 쓰되
      // 넓은 표는 breakpoint 이상에서만 적용한다.
      const text = media.join(' ');
      const narrowOnly = /max-width:\s*(\d+)px/.test(text) && Number(text.match(/max-width:\s*(\d+)px/)[1]) <= cfg.breakpoint;
      const open = media.map(m => m + '{').join('');
      const close = '}'.repeat(media.length);
      if (narrowOnly) condOut.push(open + rule(cfg.narrow) + close);
      else {
        condOut.push(`@media(min-width:${cfg.breakpoint + 1}px){` + open + rule(cfg.wide) + close + '}');
        condOut.push(`@media(max-width:${cfg.breakpoint}px){` + open + rule(cfg.narrow) + close + '}');
      }
    }
  }
}

// 조건 없는 규칙과 조건 있는 규칙이 원래 파일에서 섞여 있던 순서를 지키기 위해,
// 파일마다 "조건 없는 묶음 → 조건 있는 묶음" 순으로 내보낸다. (원본도 대개 그 순서다.)
const parts = [];
for (const f of cfg.files) {
  wideOut.length = 0; narrowOut.length = 0; condOut.length = 0;
  let css = fs.readFileSync(path.resolve(path.dirname(process.argv[2]), cfg.dir, f), 'utf8');
  if (f.endsWith('.html')) css = (css.match(/<style[^>]*>([\s\S]*?)<\/style>/g) || []).map(s => s.replace(/<\/?style[^>]*>/g, '')).join('\n');
  walk(stripComments(css), []);
  if (!wideOut.length && !condOut.length) continue;
  parts.push(`/* ${f} */`);
  if (wideOut.length) {
    parts.push(`@media(min-width:${cfg.breakpoint + 1}px){\n${wideOut.join('\n')}\n}`);
    parts.push(`@media(max-width:${cfg.breakpoint}px){\n${narrowOut.join('\n')}\n}`);
  }
  if (condOut.length) parts.push(condOut.join('\n'));
}
const header = `/* 자동 생성: tools/type-remap.cjs. 손으로 고치지 말 것.
   기존 규칙과 같은 선택자·같은 조건으로 글자 크기만 다시 매긴다.
   넓은 화면(${cfg.breakpoint + 1}px 이상) 표: ${JSON.stringify(cfg.wide)}
   좁은 화면 표: ${JSON.stringify(cfg.narrow)} */\n`;
fs.writeFileSync(path.resolve(path.dirname(process.argv[2]), cfg.dir, cfg.out), header + parts.join('\n') + '\n');
console.log(cfg.out, 'rules:', count);
