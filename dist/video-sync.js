// The video is the playback clock in Match film mode. Buffering never advances the story.
export function syncFilm(video,state,scenario){
 const path=`assets/${scenario.id}-film.mp4`;
 if(video.getAttribute('src')!==path){video.pause();video.src=path;video.poster=`assets/${scenario.id}-poster.jpg`;video.load();return;}
 if(video.readyState<1)return;
 if(Math.abs(video.currentTime-state.t)>.35)video.currentTime=Math.min(state.t,Number.isFinite(video.duration)?video.duration:scenario.duration);
 video.playbackRate=state.speed;
 if(state.playing&&state.view==='cinematic'){
  if(video.paused)video.play().catch(()=>{});
 }else video.pause();
}
