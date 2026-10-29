(() => {
  'use strict';
  const sendOrigin = location.protocol === 'file:' ? '*' : location.origin;
  if (window.IG_FRAME_SHELL) {
    const dialog = document.createElement('dialog');
    dialog.className = 'ig-image-viewer';
    dialog.setAttribute('aria-label', '이미지 크게 보기');
    const close = document.createElement('button');
    close.type = 'button';close.className = 'ig-image-close';close.textContent = '×';
    close.setAttribute('aria-label', '확대한 이미지 닫기');
    let closePress=null;
    const clearClosePress=()=>{close.classList.remove('is-pressed');closePress=null};
    close.addEventListener('pointerdown',e=>{if(e.pointerType!=='mouse'){closePress={x:e.clientX,y:e.clientY};close.classList.add('is-pressed')}});
    document.addEventListener('pointermove',e=>{if(closePress&&Math.hypot(e.clientX-closePress.x,e.clientY-closePress.y)>8)clearClosePress()},{passive:true});
    for(const type of ['pointerup','pointercancel'])document.addEventListener(type,clearClosePress,{passive:true});
    document.addEventListener('scroll',clearClosePress,{passive:true,capture:true});
    window.addEventListener('blur',clearClosePress);
    const image = document.createElement('img'), crop = document.createElement('div');
    crop.hidden=true;crop.style.display='none';
    let directOpener=null;
    dialog.append(close,image,crop);document.body.append(dialog);
    close.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('click',event=>{const box=dialog.getBoundingClientRect();if(event.target===dialog&&(event.clientX<box.left||event.clientX>box.right||event.clientY<box.top||event.clientY>box.bottom))dialog.close()});
    const activeFrame=()=>window.IGActiveContentFrame?.()||document.getElementById('ig-content-frame');
    dialog.addEventListener('close',()=>{clearClosePress();const target=directOpener;directOpener=null;if(target?.isConnected)target.focus({preventScroll:true});else activeFrame()?.contentWindow?.postMessage({type:'ig-image-closed'},sendOrigin)});
    function show(payload,trigger=null){
      let url;try{url=new URL(payload.src,location.href)}catch{return}
      if(url.origin!==location.origin&&url.origin!=='https://cdn.imgchest.com')return;
      image.src=url.href;image.alt=String(payload.alt||'이결 소개 이미지');
      const isCrop=typeof payload.crop==='string';image.hidden=isCrop;image.style.display=isCrop?'none':'';crop.hidden=!isCrop;
      crop.style.cssText=payload.scene?'width:min(1000px,calc(100vw - 58px),calc((100dvh - 116px)*1.5));aspect-ratio:3/2;background-size:200% 400%;background-repeat:no-repeat':'width:min(450px,70vw,calc((100dvh - 116px)*2/3));aspect-ratio:2/3;background-size:300% 200%;background-repeat:no-repeat';
      crop.style.display=isCrop?'block':'none';
      if(isCrop){crop.style.backgroundImage='url("'+url.href+'")';crop.style.backgroundPosition=payload.crop;crop.setAttribute('role','img');crop.setAttribute('aria-label',image.alt)}
      directOpener=trigger;if(!dialog.open)dialog.showModal();dialog.scrollTop=0;close.focus({preventScroll:true});
    }
    window.IGImageViewer={openScene(src,alt,trigger,position){if(trigger?.ownerDocument?.defaultView!==activeFrame()?.contentWindow)return;show({src,alt,crop:position,scene:true},trigger)}};
    addEventListener('message',event=>{if(event.source!==activeFrame()?.contentWindow||(location.protocol!=='file:'&&event.origin!==location.origin)||event.data?.type!=='ig-image-open')return;show(event.data)});
    return;
  }

  let lastImage;
  function decorate() {
    document.querySelectorAll('main img:not([data-ig-zoom])').forEach(image => {
      if (image.matches('.player > img') || image.closest('a,button,[role="button"]')) return;
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
