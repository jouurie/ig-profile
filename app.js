(()=>{'use strict';const d=window.IG_CONTENT,$=s=>document.querySelector(s),el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};function lines(host,copy){const ul=el('ul','lines');copy.forEach(x=>ul.append(el('li','',x)));host.append(ul)}function tabs(host,items,panel,prefix,render){let current=0;const buttons=items.map((item,i)=>{const b=el('button','',item.name);b.type='button';b.id=prefix+i;b.setAttribute('role','tab');b.setAttribute('aria-controls',panel.id);b.addEventListener('click',()=>select(i));host.append(b);return b});function select(i,focus=false){current=i;buttons.forEach((b,j)=>{b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1});panel.setAttribute('aria-labelledby',buttons[i].id);panel.replaceChildren();render(items[i],i);if(focus)buttons[i].focus()}host.addEventListener('keydown',e=>{let next=current;if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(current+1)%items.length;else if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(current+items.length-1)%items.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=items.length-1;else return;e.preventDefault();select(next,true)});select(0)}

if($("#intro-copy")){
d.intro.forEach(x=>$('#intro-copy').append(el('p','',x)));$('#tw-copy').textContent=d.tw;const platformDialog=$('#platform-dialog'),doorButton=$('#door-open');doorButton.addEventListener('click',()=>platformDialog.showModal());$('#platform-close').addEventListener('click',()=>platformDialog.close());platformDialog.addEventListener('click',event=>{if(event.target===platformDialog){const r=platformDialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)platformDialog.close()}});platformDialog.addEventListener('close',()=>doorButton.focus({preventScroll:true}));

}

if($("#profile-tabs")){
tabs($('#profile-tabs'),[...d.profile,{name:'관계',lines:[d.intro[0]]}],$('#profile-panel'),'profile-tab-',(item,i)=>{
const panel=$('#profile-panel'),detail=el('div','profile-detail profile-detail--'+i);
const keywords=['한이결','23세','194cm','소꿉친구','흑발','다크서클','회색 후드티','먼저 사과함','몸을 낮춤','질투','답장 시간','귀가 시간','밥','우산','약 봉투','후드 소매','택시 시간','막차 시간','낮게 잠긴 목소리','사과','아니… 아니야','삭제한 메시지','약값 · 택시비 · 편의점 계산','비누와 섬유유연제','화면빛','답장 흔적','작은 돌봄','머뭇거리는 허락','타인과의 약속','집안 얘기','기록과 거짓말'];
function richText(host,text){
let cursor=0;
while(cursor<text.length){
let start=text.length,word='';
keywords.forEach(key=>{const at=text.indexOf(key,cursor);if(at>=0&&(at<start||(at===start&&key.length>word.length))){start=at;word=key}});
if(start>cursor)host.append(document.createTextNode(text.slice(cursor,start)));
if(!word)break;
host.append(el('span','profile-keyword',word));cursor=start+word.length;
}
}
detail.append(el('h3','profile-detail-title',item.name));
if(i===0){
const list=el('dl','profile-facts');
[['이름','한이결'],['나이','23세'],['성별','남성'],['국적','대한민국'],['키','194cm'],['소속','휴학생'],['생활','자발적 히키코모리'],['관계','오래된 소꿉친구']].forEach(([label,text])=>{const row=el('div','profile-fact'),value=el('dd');richText(value,text);row.append(el('dt','',label),value);list.append(row)});
detail.append(list);
}else if(i===6){
const card=el('div','profile-relation'),copy=el('p','profile-relation-copy');
richText(copy,item.lines[0]);card.append(el('small','profile-relation-label','이결 ↔ 당신'),copy);detail.append(card);
}else{
const groups=el('div','profile-detail-groups');let list;
item.lines.forEach(text=>{
if(text==='성격'||text==='버릇'||text==='선호'||text==='불호'){
const section=el('section','profile-detail-group');section.append(el('h4','profile-group-title',text));list=el('ul','profile-detail-lines');section.append(list);groups.append(section);
}else{
if(!list){list=el('ul','profile-detail-lines');groups.append(list)}
const row=el('li','profile-detail-line');richText(row,text);list.append(row);
}
});
detail.append(groups);
}
panel.append(detail);panel.scrollTop=0;
});
const records=[{name:'삭제한 메시지 캡처',doc:['메시지','보냈다가 지운 메시지'],copy:'이결의 휴대폰에는 보냈다가 지운 메시지의 캡처가 남아 있습니다.'},{name:'택시 호출 내역',doc:['택시 호출','당신을 태워 보낸 기록'],copy:'이결의 휴대폰에는 당신을 태워 보낸 택시 호출 내역이 남아 있습니다.'},{name:'약국 영수증',doc:['약국 영수증','당신 대신 결제한 약값'],copy:'이결의 휴대폰에는 당신 대신 결제한 약국 영수증이 남아 있습니다.'}];records.forEach((r,i)=>{const b=el('button','record-toggle');b.type='button';b.setAttribute('aria-expanded','false');b.setAttribute('aria-label',r.name+' 뒤집어 보기');const front=el('span','record-front');front.append(el('b','',r.name),el('span','record-doc',r.doc[0]),el('span','',r.doc[1]),el('small','record-flip','뒤집기 ↗'));const back=el('span','record-back',r.copy);back.id='record-copy-'+i;b.setAttribute('aria-controls',back.id);back.setAttribute('aria-hidden','true');b.append(front,back);b.addEventListener('click',()=>{const on=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',String(on));back.setAttribute('aria-hidden',String(!on));b.setAttribute('aria-label',r.name+(on?' 돌려놓기':' 뒤집어 보기'))});$('#record-list').append(b)});

}

if($("#opening-list")){
let opening=0;const openings=d.openings.map((x,i)=>{const b=el('button','opening-card');b.type='button';b.setAttribute('aria-controls','opening-copy');b.append(el('small','',i===6?'FREE START':'SCENE 0'+(i+1)),el('b','',x.name),el('span','hint',x.hint));b.addEventListener('click',()=>selectOpening(i));$('#opening-list').append(b);return b});function selectOpening(i){opening=i;openings.forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));$('#opening-name').textContent=i<0?'어디에서 시작할까요?':d.openings[i].name;$('#opening-copy').textContent=i<0?'도입부를 선택하면 자세한 상황을 확인할 수 있습니다.':d.openings[i].description;$('#opening-clear').hidden=i<0}$('#opening-clear').addEventListener('click',()=>{const old=opening;selectOpening(-1);if(old>=0)openings[old].focus()});selectOpening(0);

}

if($("#npc-list")){
let activeNPC=-1;
function renderNPC(npc){
const panel=$('#npc-detail');panel.replaceChildren();const layout=el('div','npc-preview'),figure=el('figure','npc-photo'),slot=el('div','npc-photo-slot');
slot.setAttribute('role','img');slot.setAttribute('aria-label',npc.name+' 사진 자리');
if(npc.image){const img=el('img');img.src=npc.image;img.alt=npc.name+' 사진';slot.removeAttribute('role');slot.removeAttribute('aria-label');slot.append(img)}
figure.append(slot);const copy=el('div','npc-intro');copy.append(el('h3','npc-name',npc.name));
const extra=window.IG_NPC_DETAILS&&window.IG_NPC_DETAILS[npc.name];
if(extra&&extra.tags){const tags=el('div','npc-traits');extra.tags.forEach(tag=>tags.append(el('span','npc-trait',tag)));copy.append(tags)}
const original=el('div','npc-original');npc.lines.filter(x=>x!=='·  ·  ·  ·').forEach(x=>original.append(el('p','',x)));copy.append(original);
if(extra){const notes=el('div','npc-notes');[['고집',extra.stubborn],['관계의 면모',extra.detail]].forEach(([label,text])=>{if(!text)return;const note=el('div','npc-note');note.append(el('span','npc-note-label',label),el('p','',text));notes.append(note)});copy.append(notes)}
layout.append(figure,copy);panel.append(layout)
}
const npcs=d.npcs.map((npc,i)=>{const b=el('button','npc-folder',npc.name);b.type='button';b.setAttribute('aria-pressed','false');b.setAttribute('aria-controls','npc-detail');b.addEventListener('click',()=>{activeNPC=activeNPC===i?-1:i;npcs.forEach((x,j)=>x.setAttribute('aria-pressed',String(activeNPC===j)));if(activeNPC<0){$('#npc-detail').replaceChildren(el('p','muted','폴더를 선택하면 사진과 인물 소개를 확인할 수 있습니다.'));return}renderNPC(npc)});$('#npc-list').append(b);return b});
$('#npc-list').addEventListener('keydown',e=>{const i=npcs.indexOf(document.activeElement);if(i<0)return;let j=i;if(e.key==='ArrowRight'||e.key==='ArrowDown')j=(i+1)%npcs.length;else if(e.key==='ArrowLeft'||e.key==='ArrowUp')j=(i+npcs.length-1)%npcs.length;else if(e.key==='Home')j=0;else if(e.key==='End')j=npcs.length-1;else return;e.preventDefault();npcs[j].focus()});

}

if($("#state-frame")){
const frame=$('#state-frame');window.addEventListener('message',event=>{if(event.source!==frame.contentWindow||!event.data||typeof event.data!=='object')return;if(event.data.type==='ig-state-size'&&Number.isFinite(event.data.height)){frame.style.height=Math.max(1,Math.ceil(event.data.height))+'px'}if(event.data.type==='ig-state-command'&&typeof event.data.command==='string'){$('#command-feedback').textContent=event.data.command+' 선택 · 로컬 미리보기'}});

}

if($("#track-list")){
let track=0;const tracks=d.tracks.map((x,i)=>{const li=el('li'),b=el('button','track-button'),text=el('span');b.type='button';text.append(el('b','',x.title),el('small','',x.artist));b.append(text);b.addEventListener('click',()=>selectTrack(i));li.append(b);$('#track-list').append(li);return b});function selectTrack(i){track=(i+d.tracks.length)%d.tracks.length;const t=d.tracks[track];tracks.forEach((b,j)=>b.setAttribute('aria-pressed',String(track===j)));$('#track-title').textContent=t.title;$('#track-artist').textContent=t.artist;$('#track-link').href=t.url;$('#track-link').setAttribute('aria-label',t.artist+' - '+t.title+' 원본에서 듣기 (새 탭)')}$('#track-prev').addEventListener('click',()=>selectTrack(track-1));$('#track-next').addEventListener('click',()=>selectTrack(track+1));selectTrack(0);

}
})();
