(()=>{'use strict';const d=window.IG_CONTENT,$=s=>document.querySelector(s),el=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n};function lines(host,copy){const ul=el('ul','lines');copy.forEach(x=>ul.append(el('li','',x)));host.append(ul)}function tabs(host,items,panel,prefix,render){let current=0;const buttons=items.map((item,i)=>{const b=el('button','',item.name);b.type='button';b.id=prefix+i;b.setAttribute('role','tab');b.setAttribute('aria-controls',panel.id);b.addEventListener('click',()=>select(i));host.append(b);return b});function select(i,focus=false){current=i;buttons.forEach((b,j)=>{b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1});panel.setAttribute('aria-labelledby',buttons[i].id);panel.replaceChildren();render(items[i],i);if(focus)buttons[i].focus()}host.addEventListener('keydown',e=>{let next=current;if(e.key==='ArrowRight'||e.key==='ArrowDown')next=(current+1)%items.length;else if(e.key==='ArrowLeft'||e.key==='ArrowUp')next=(current+items.length-1)%items.length;else if(e.key==='Home')next=0;else if(e.key==='End')next=items.length-1;else return;e.preventDefault();select(next,true)});select(0)}

if($("#intro-copy")){
d.intro.forEach(x=>$('#intro-copy').append(el('p','',x)));$('#tw-copy').textContent=d.tw;$('#door-open').addEventListener('click',()=>{$('#profile-title').focus({preventScroll:true});$('#profile').scrollIntoView({behavior:matchMedia('(prefers-reduced-motion:reduce)').matches?'instant':'smooth'})});

}

if($("#profile-tabs")){
tabs($('#profile-tabs'),[...d.profile,{name:'관계',lines:[d.intro[0]]}],$('#profile-panel'),'profile-tab-',(item,i)=>{const panel=$('#profile-panel');panel.append(el('h3','',item.name));if(i===0){const dl=el('dl');[['이름','한이결'],['나이','23세'],['성별','남성'],['국적','대한민국'],['키','194cm'],['소속','휴학생'],['생활','자발적 히키코모리'],['관계','오래된 소꿉친구']].forEach(([k,v])=>{const row=el('div');row.append(el('dt','',k),el('dd','',v));dl.append(row)});panel.append(dl)}else if(i===6){panel.append(el('small','relation-label','이결 ↔ 당신'),el('p','relation-copy',item.lines[0]))}else lines(panel,item.lines)});
const records=[{name:'삭제한 메시지 캡처',doc:['메시지','보냈다가 지운 메시지'],copy:'이결의 휴대폰에는 보냈다가 지운 메시지의 캡처가 남아 있습니다.'},{name:'택시 호출 내역',doc:['택시 호출','당신을 태워 보낸 기록'],copy:'이결의 휴대폰에는 당신을 태워 보낸 택시 호출 내역이 남아 있습니다.'},{name:'약국 영수증',doc:['약국 영수증','당신 대신 결제한 약값'],copy:'이결의 휴대폰에는 당신 대신 결제한 약국 영수증이 남아 있습니다.'}];records.forEach((r,i)=>{const b=el('button','record-toggle');b.type='button';b.setAttribute('aria-expanded','false');b.setAttribute('aria-label',r.name+' 뒤집어 보기');const front=el('span','record-front');front.append(el('b','',r.name),el('span','record-doc',r.doc[0]),el('span','',r.doc[1]),el('small','record-flip','뒤집기 ↗'));const back=el('span','record-back',r.copy);back.id='record-copy-'+i;b.setAttribute('aria-controls',back.id);back.setAttribute('aria-hidden','true');b.append(front,back);b.addEventListener('click',()=>{const on=b.getAttribute('aria-expanded')!=='true';b.setAttribute('aria-expanded',String(on));back.setAttribute('aria-hidden',String(!on));b.setAttribute('aria-label',r.name+(on?' 돌려놓기':' 뒤집어 보기'))});$('#record-list').append(b)});

}

if($("#opening-list")){
let opening=0;const openings=d.openings.map((x,i)=>{const b=el('button','opening-card');b.type='button';b.setAttribute('aria-controls','opening-copy');b.append(el('small','',i===6?'FREE START':'SCENE 0'+(i+1)),el('b','',x.name),el('span','hint',x.hint));b.addEventListener('click',()=>selectOpening(i));$('#opening-list').append(b);return b});function selectOpening(i){opening=i;openings.forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));$('#opening-name').textContent=i<0?'어디에서 시작할까요?':d.openings[i].name;$('#opening-copy').textContent=i<0?'도입부를 선택하면 자세한 상황을 확인할 수 있습니다.':d.openings[i].description;$('#opening-clear').hidden=i<0}$('#opening-clear').addEventListener('click',()=>{const old=opening;selectOpening(-1);if(old>=0)openings[old].focus()});selectOpening(0);

}

if($("#npc-list")){
const npcPhotos=new Map();let activeNPC=-1;
const photoDialog=el('dialog','photo-lightbox npc-lightbox'),photoImage=el('img'),photoTitle=el('h2','npc-photo-title'),photoClose=el('button','photo-close','닫기 ×');let photoTrigger;
photoTitle.id='npc-photo-title';photoDialog.setAttribute('aria-labelledby',photoTitle.id);photoClose.type='button';photoClose.autofocus=true;photoClose.addEventListener('click',()=>photoDialog.close());photoDialog.append(photoTitle,photoClose,photoImage);document.body.append(photoDialog);
photoDialog.addEventListener('click',e=>{if(e.target===photoDialog){const r=photoDialog.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)photoDialog.close()}});
photoDialog.addEventListener('close',()=>{photoImage.removeAttribute('src');if(photoTrigger&&photoTrigger.isConnected)photoTrigger.focus()});
function readNPCPhoto(npc){if(npcPhotos.has(npc.name))return npcPhotos.get(npc.name);try{const stored=localStorage.getItem('ig-page-npc-photo:'+npc.name);if(stored)return stored}catch{}return npc.image||''}
function renderNPC(npc){
const panel=$('#npc-detail');panel.replaceChildren();const layout=el('div','npc-preview'),figure=el('figure','npc-photo'),photo=el('button','npc-photo-button'),placeholder=el('span','npc-photo-placeholder','사진 추가'),img=el('img'),input=el('input'),status=el('p','npc-photo-status muted','사진은 이 브라우저에만 저장됩니다.');
photo.type='button';img.alt=npc.name+' 사진';input.type='file';input.accept='image/*';input.hidden=true;status.setAttribute('role','status');
const change=el('button','npc-photo-change','사진 변경');change.type='button';change.setAttribute('aria-label',npc.name+' 사진 변경');change.addEventListener('click',()=>input.click());
const update=src=>{img.hidden=!src;placeholder.hidden=!!src;change.hidden=!src;photo.setAttribute('aria-label',npc.name+(src?' 사진 크게 보기':' 사진 추가'));if(src){photo.setAttribute('aria-haspopup','dialog');img.src=src}else{photo.removeAttribute('aria-haspopup');img.removeAttribute('src')}};
img.addEventListener('error',()=>{npcPhotos.set(npc.name,'');update('');status.textContent='사진을 불러오지 못했습니다. 다른 사진을 선택해 주세요.'});update(readNPCPhoto(npc));photo.append(img,placeholder);
photo.addEventListener('click',()=>{const src=readNPCPhoto(npc);if(src){photoTrigger=photo;photoImage.src=src;photoImage.alt=npc.name+' 사진 확대';photoTitle.textContent=npc.name+' 사진';photoDialog.showModal()}else input.click()});
input.addEventListener('change',()=>{const file=input.files&&input.files[0];input.value='';if(!file)return;if(!file.type.startsWith('image/')){status.textContent='이미지 파일을 선택해 주세요.';return}const reader=new FileReader();reader.addEventListener('error',()=>{status.textContent='사진을 읽지 못했습니다. 다시 선택해 주세요.'});reader.addEventListener('load',()=>{const src=String(reader.result),probe=new Image();probe.onload=()=>{npcPhotos.set(npc.name,src);update(src);try{localStorage.setItem('ig-page-npc-photo:'+npc.name,src);status.textContent='이 브라우저에 저장했습니다. 사진을 누르면 크게 볼 수 있습니다.'}catch{status.textContent='사진을 표시했습니다. 저장 공간 부족으로 새로고침하면 사라집니다.'}};probe.onerror=()=>{status.textContent='열 수 없는 이미지입니다. 다른 사진을 선택해 주세요.'};probe.src=src});reader.readAsDataURL(file)});
figure.append(photo,change,input);const copy=el('div','npc-intro');copy.append(el('h3','',npc.name));npc.lines.filter(x=>x!=='·  ·  ·  ·').forEach(x=>copy.append(el('p','',x)));layout.append(figure,copy);panel.append(layout,status)
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
