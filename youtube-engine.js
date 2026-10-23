/* YouTube playback shares the existing music toolbar. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;else root.RieYouTube=api;
})(typeof window==='undefined'?globalThis:window,function(){
  'use strict';
  let promise;
  function videoId(url){
    const parsed=new URL(url),id=parsed.hostname==='youtu.be'?parsed.pathname.slice(1):parsed.searchParams.get('v');
    if(!['youtu.be','youtube.com','www.youtube.com'].includes(parsed.hostname)||!/^[-\w]{11}$/.test(id||''))throw Error('유튜브 곡 주소를 확인해 주세요.');
    return id;
  }
  const characterAliases=[
    {title:'와이어트, 웨이드',keywords:['로즈','와이어트','웨이드','와이어트·웨이드']},
    {title:'식탁의 마녀',keywords:['미렐']},
    {title:'판결의 마녀',keywords:['이졸데']}
  ];
  const normalize=value=>String(value).normalize('NFKC').toLowerCase();
  function parseKeywords(value=[]){
    const list=typeof value==='string'?value.split(/[,\n]/):value;
    if(!Array.isArray(list)||list.some(v=>typeof v!=='string'))throw Error('검색 키워드를 쉼표로 구분해 주세요.');
    const seen=new Set(),result=[];
    for(const item of list){const word=item.trim();if(!word)continue;if(word.length>60)throw Error('검색 키워드는 하나당 60자까지 입력할 수 있어요.');const key=normalize(word);if(!seen.has(key)){seen.add(key);result.push(word);}}
    if(result.length>32)throw Error('검색 키워드는 32개까지 입력할 수 있어요.');return result;
  }
  function aliasesFor(track){
    const prefix=track.name.split(' | ')[0].trim();
    return characterAliases.filter(group=>[group.title,...group.keywords].some(word=>normalize(word)===normalize(prefix))).flatMap(group=>[group.title,...group.keywords]);
  }
  function filterTracks(tracks,query){
    const needle=normalize(query).trim();if(!needle)return tracks;
    return tracks.filter(track=>[track.name,track.url,...parseKeywords(track.keywords),...aliasesFor(track)].some(value=>normalize(value).includes(needle)));
  }
  function validate(tracks){
    if(!Array.isArray(tracks)||tracks.length>300)throw Error('최대 300곡까지 등록할 수 있어요.');
    const seen=new Set();return tracks.map(t=>{if(!t||typeof t.url!=='string'||typeof t.name!=='string')throw Error('곡 목록 형식을 확인해 주세요.');const url='https://www.youtube.com/watch?v='+videoId(t.url);if(seen.has(url))throw Error('이미 등록된 곡입니다.');seen.add(url);return {url,name:t.name.trim().slice(0,160),keywords:parseKeywords(t.keywords)};});
  }
  const decode=(value,fallback=[])=>!value||value.startsWith('[##_')?validate(fallback):validate(JSON.parse(decodeURIComponent(value)));
  const encode=tracks=>encodeURIComponent(JSON.stringify(validate(tracks)));
  function sdk(){
    if(window.YT?.Player)return Promise.resolve();
    if(!promise)promise=new Promise((resolve,reject)=>{
      const previous=window.onYouTubeIframeAPIReady;
      const timer=setTimeout(()=>{promise=null;reject(Error('YouTube 연결이 늦습니다. 캐릭터 버튼을 다시 눌러 주세요.'));},15000);
      window.onYouTubeIframeAPIReady=()=>{clearTimeout(timer);try{previous?.();}finally{resolve();}};
      const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;
      script.onerror=()=>{clearTimeout(timer);promise=null;reject(Error('YouTube를 불러오지 못했습니다.'));};document.head.append(script);
    });
    return promise;
  }
  function create(host,url,hooks){
    let dead=false,timer,current=url;
    const player=new window.YT.Player(host,{
      width:200,height:200,videoId:videoId(url),
      playerVars:{playsinline:1,autoplay:0,controls:1,origin:window.location.origin},
      events:{
        onReady:()=>{if(dead)return;hooks.ready();timer=setInterval(()=>{if(!dead){hooks.progress(player.getCurrentTime()*1000,player.getDuration()*1000);hooks.volume?.(player.getVolume(),player.isMuted());}},500);},
        onStateChange:event=>{if(dead)return;if(event.data===1)hooks.play();else if(event.data===2||event.data===5)hooks.pause();else if(event.data===0)hooks.finish();},
        onError:event=>{if(dead)return;hooks.pause();hooks.error(event.data);},
        onAutoplayBlocked:()=>{if(!dead){hooks.pause();hooks.blocked();}}
      }
    });
    const frame=player.getIframe?.();if(frame){frame.tabIndex=-1;frame.setAttribute('aria-hidden','true');frame.referrerPolicy='strict-origin-when-cross-origin';}
    return {
      play(){if(!dead)player.playVideo();},pause(){if(!dead&&player.pauseVideo)player.pauseVideo();},
      toggle(){if(dead)return;if(player.getPlayerState()===1)player.pauseVideo();else player.playVideo();},
      setVolume(value){if(!dead)player.setVolume(value);},
      setMuted(value){if(!dead){if(value)player.mute();else player.unMute();}},
      seekTo(ms){if(!dead)player.seekTo(ms/1000,true);},
      getDuration(callback){callback(dead?0:player.getDuration()*1000);},
      isPaused(callback){callback(dead||player.getPlayerState()!==1);},
      getCurrentSound(callback){callback({permalink_url:current});},
      load(next,options){if(dead)return;current=next;if(options.auto_play)player.loadVideoById(videoId(next));else player.cueVideoById(videoId(next));options.callback?.();},
      destroy(){if(dead)return;dead=true;clearInterval(timer);player.destroy();}
    };
  }
  return {videoId,validate,decode,encode,parseKeywords,filterTracks,characterAliases,sdk,create};
});
