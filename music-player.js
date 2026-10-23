(() => {
  'use strict';
  const tracks = window.IG_CONTENT.tracks;
  // Resolved from the original twelve h1.nu links, in their approved order.
  const videoIds = ['G6Kspj3OO0s', 'wUL8NklXDsw', '6uEZjKtv_i8', 'MjQjaB-HedA', 'p3NZn0mA_XI', '5soixb2U6xM', '4YR_Mft7yIM', 'oZF3Z7oj1eQ', 'XfMBdq5iFnw', 'CKI8iQTgZKU', 'WPpDyIJdasg', '6cucosmPj-A'];
  const $ = id => document.getElementById(id);
  const play = $('track-play'), status = $('player-status');
  let selected = 0, player, ready = false, playing = false, failed = false, pendingPlay = false;
  const setStatus = text => { status.textContent = text; };
  function showPlaying(value) {
    playing = value;
    play.textContent = value ? '일시정지' : '재생';
    play.setAttribute('aria-label', tracks[selected].title + (value ? ' 일시정지' : ' 재생'));
  }
  function failure(message) {
    failed = true;
    pendingPlay = false;
    showPlaying(false);
    setStatus(message + ' 원본 링크에서 들어 주세요.');
  }
  const buttons = tracks.map((track, index) => {
    const li = document.createElement('li'), button = document.createElement('button');
    const text = document.createElement('span'), title = document.createElement('b'), artist = document.createElement('small');
    button.type = 'button';
    button.className = 'track-button';
    title.textContent = track.title;
    artist.textContent = track.artist;
    text.append(title, artist);
    button.append(text);
    button.addEventListener('click', () => select(index));
    li.append(button);
    $('track-list').append(li);
    return button;
  });
  function select(index) {
    const resume = playing || pendingPlay;
    selected = (index + tracks.length) % tracks.length;
    failed = false;
    pendingPlay = resume;
    const track = tracks[selected];
    buttons.forEach((button, i) => button.setAttribute('aria-pressed', String(i === selected)));
    $('track-title').textContent = track.title;
    $('track-artist').textContent = track.artist;
    $('track-link').href = track.url;
    $('track-link').setAttribute('aria-label', track.artist + ' - ' + track.title + ' 원본에서 듣기 (새 탭)');
    showPlaying(false);
    if (ready) {
      if (resume) player.loadVideoById(videoIds[selected]);
      else player.cueVideoById(videoIds[selected]);
      setStatus(resume ? '재생을 요청했습니다.' : '재생 버튼을 눌러 주세요.');
    }
  }
  $('track-prev').addEventListener('click', () => select(selected - 1));
  $('track-next').addEventListener('click', () => select(selected + 1));
  play.addEventListener('click', () => {
    if (!ready) {
      if (!failed) pendingPlay = !pendingPlay;
      setStatus(failed ? '플레이어를 불러오지 못했습니다. 원본 링크에서 들어 주세요.' : pendingPlay ? '플레이어를 준비하고 있습니다.' : '재생 버튼을 눌러 주세요.');
      return;
    }
    pendingPlay = false;
    if (playing) player.pauseVideo();
    else {
      if (failed) { failed = false; player.loadVideoById(videoIds[selected]); }
      else player.playVideo();
      setStatus('재생을 요청했습니다. 시작되지 않으면 영상의 재생 버튼을 눌러 주세요.');
    }
  });
  select(0);
  const timeout = window.setTimeout(() => {
    if (!ready) failure('플레이어 연결이 지연되고 있습니다.');
  }, 15000);
  window.onYouTubeIframeAPIReady = () => {
    const vars = { autoplay: 0, playsinline: 1, controls: 1 };
    if (/^https?:$/.test(window.location.protocol)) vars.origin = window.location.origin;
    player = new window.YT.Player('youtube-player', {
      width: '480', height: '270', videoId: videoIds[selected], playerVars: vars,
      events: {
        onReady(event) {
          window.clearTimeout(timeout);
          ready = true;
          failed = false;
          event.target.getIframe().title = '선택한 음악의 YouTube 영상';
          if (pendingPlay) {
            pendingPlay = false;
            event.target.loadVideoById(videoIds[selected]);
            setStatus('재생을 요청했습니다.');
          } else {
            event.target.cueVideoById(videoIds[selected]);
            setStatus('재생 버튼을 눌러 주세요.');
          }
        },
        onStateChange(event) {
          showPlaying(event.data === 1);
          if (event.data === 1) { failed = false; pendingPlay = false; setStatus('재생 중'); }
          else if (event.data === 2) setStatus('일시정지');
          else if (event.data === 3) setStatus('음악을 불러오고 있습니다.');
          else if (event.data === 0) setStatus('재생이 끝났습니다. 다른 곡을 선택해 주세요.');
          else if (event.data === 5 && !failed) setStatus('재생 버튼을 눌러 주세요.');
        },
        onError(event) { failure('이 영상은 페이지에서 재생할 수 없습니다. (YouTube ' + event.data + ')'); },
        onAutoplayBlocked() { pendingPlay = false; showPlaying(false); setStatus('브라우저가 재생을 보류했습니다. 영상의 재생 버튼을 눌러 주세요.'); }
      }
    });
  };
  const api = document.createElement('script');
  api.src = 'https://www.youtube.com/iframe_api';
  api.addEventListener('error', () => { window.clearTimeout(timeout); failure('YouTube 플레이어를 불러오지 못했습니다.'); });
  document.head.append(api);
})();
