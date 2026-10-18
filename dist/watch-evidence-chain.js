import {matchSession} from './match-session.js';
import {pitchsideStory} from './pitchside-story.js';
import {matchStory} from './match-story.js';

const $=id=>document.getElementById(id);
const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
const copy={
 en:{title:'From frame to public line.',scope:'Only evidence reached by the playhead can support the explanation.',source:'SOURCE',observed:'OBSERVED',calculated:'CALCULATED',checked:'CHECKED',published:'PUBLISHED',reviewed:'Reviewed film notes',measured:'Synthetic events + tracking',records:'SOURCE RECORDS REACHED',empty:'Press play. Reviewed evidence will appear here as its timestamp is reached.',open:'Inspect the evidence chain'},
 es:{title:'Del fotograma a la línea pública.',scope:'Solo la evidencia alcanzada por el cabezal puede respaldar la explicación.',source:'FUENTE',observed:'OBSERVADO',calculated:'CALCULADO',checked:'VERIFICADO',published:'PUBLICADO',reviewed:'Notas de vídeo revisadas',measured:'Eventos y seguimiento sintéticos',records:'REGISTROS ALCANZADOS',empty:'Reproduce el vídeo. La evidencia aparecerá cuando llegue su momento.',open:'Examinar la cadena'},
 pt:{title:'Do quadro à linha pública.',scope:'Só a evidência alcançada pelo cursor pode sustentar a explicação.',source:'FONTE',observed:'OBSERVADO',calculated:'CALCULADO',checked:'VERIFICADO',published:'PUBLICADO',reviewed:'Notas de vídeo revisadas',measured:'Eventos e rastreamento sintéticos',records:'REGISTROS ALCANÇADOS',empty:'Reproduza o vídeo. A evidência aparecerá ao chegar ao seu momento.',open:'Examinar a cadeia'}
};

function recordTime(record){
 const value=[record.second,record.t,record.end,record.sequence_second].find(Number.isFinite);
 return Number.isFinite(value)?value:null;
}
function clock(value){const seconds=Math.max(0,Number(value)||0);return `${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(Math.floor(seconds%60)).padStart(2,'0')}`;}
function recordCopy(record){return record.observation||record.description||record.measurements||record.detail||record.type||'Evidence record';}
function render(state=matchSession.get()){
 const language=copy[state.language]?state.language:'en',words=copy[language],cinematic=state.source!=='match';
 const story=cinematic?pitchsideStory({time:state.clipTime,language,mode:state.mode,clipChallenge:state.clipChallenge}):matchStory(state);
 const evidence=story.evidence||[],decision=story.review?.decision||'hold';
 $('chain-count').textContent=String(evidence.length);
 $('chain-count').setAttribute('aria-label',`${evidence.length} evidence records reached`);
 $('watch-chain-title').textContent=words.title;
 $('watch-chain-scope').textContent=words.scope;
 const path=$('watch-chain-path');path.replaceChildren();
 const steps=[
  [words.source,cinematic?words.reviewed:words.measured,true],
  [words.observed,evidence.length?`${evidence.length} record${evidence.length===1?'':'s'} reached`:'Waiting for the first record',evidence.length>0],
  [words.calculated,story.equation|| (cinematic?'Physical metrics withheld':'No calculation at this cutoff'),!!story.equation],
  [words.checked,decision.toUpperCase(),decision!=='hold'],
  [words.published,story.title||'Waiting',!!story.resolved]
 ];
 steps.forEach(([label,value,ready],index)=>{const item=el('article',ready?'is-ready':'is-pending');item.append(el('b','',String(index+1).padStart(2,'0')),el('span','',label),el('strong','',value));path.append(item);});
 const records=$('watch-chain-records');records.replaceChildren();records.append(el('span','watch-chain-records__label',words.records));
 if(!evidence.length){records.append(el('p','watch-chain-empty',words.empty));return;}
 const list=el('div','watch-chain-list');
 for(const record of evidence.slice(-8).reverse()){
  const time=recordTime(record),item=el(time===null?'article':'button','watch-chain-record');
  if(time!==null){item.type='button';item.title='Replay this evidence moment';item.onclick=()=>matchSession.set(cinematic?{clipTime:time}:{time},'watch-evidence-chain');}
  const meta=el('span','watch-chain-record__meta');meta.append(el('time','',time===null?'RECORD':clock(time)),el('code','',record.id||record.record_type||'source'));
  item.append(meta,el('strong','',record.title||record.type||record.record_type||'Evidence'),el('p','',recordCopy(record)));
  list.append(item);
 }
 records.append(list);
}

$('chain-tab')?.setAttribute('title',copy.en.open);
matchSession.subscribe(render);
render();
