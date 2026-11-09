import {SETTINGS,chapters,scenes} from './story-data-v4.js';
import {english} from './story-en.js';
import {collection,distractors} from './collection-data.js';
import {portraits} from './portrait-outlines.js';
import {localizeActivity} from './activity-text-v4-1.js';
const $=id=>document.getElementById(id),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let isEnglish=false, quizWrong=false, titleChapter=-1, selectedArtifact=null;
const tr=(zh,en)=>isEnglish?en:zh;
const person=name=>tr(name,english.people[name]??name);
const artifactName=id=>distractors[id]
 ? tr(...distractors[id])
 : tr(chapters.find(c=>c.id===id).name,collection[id].en);
const finalOptions=['he','raft','mirror'];
const fresh=(restored=[])=>({version:2,restored:[...restored],journey:[],chapter:0,started:false,ended:false,checkpoint:{screen:'dialogue',key:'intro',index:0}});
// A document owns its collection. Reloading/reopening starts a fresh visit.
// Clear the obsolete saved record so older releases cannot resurrect it.
let state=fresh();try{localStorage.removeItem(SETTINGS.storageKey);}catch{}
let screen='cover',currentKey='intro',currentIndex=0,typing=false,typedText='',typeTimer=0,activeQuiz=null,transit=0,boatFrame=0,boatProgress=0,run='',frameChapter=-1,lastPortrait=null,currentArt='elder';
const timers=new Set();function later(fn,ms){const n=setTimeout(()=>{timers.delete(n);fn();},ms);timers.add(n);return n;}
function cancelTransitions(){transit++;timers.forEach(clearTimeout);timers.clear();clearTimeout(typeTimer);cancelAnimationFrame(boatFrame);typing=false;}
function dialogsOpen(){return $('painting-dialog').open||$('collection-dialog').open||$('artifact-dialog').open;}
function setScreen(id){screen=id;document.querySelectorAll('#app>.screen').forEach(e=>e.hidden=e.id!==id);document.body.dataset.screen=id;window.scrollTo(0,0);}
function unloadActivity(){const f=$('activity');if(f.getAttribute('src')){try{f.contentWindow.postMessage({type:'wuzhong-stop',run},location.origin);}catch{}f.removeAttribute('src');}frameChapter=-1;}
function brushWrite(el,text,{delay=0,step=150,duration=650}={}){el.replaceChildren();el.setAttribute('aria-label',text);const units=isEnglish?text.split(' '):Array.from(text);units.forEach((char,i)=>{const glyph=document.createElement('span');glyph.className='brush-glyph';glyph.textContent=char+(isEnglish&&i<units.length-1?' ':'');glyph.setAttribute('aria-hidden','true');glyph.style.setProperty('--ink-delay',(delay+i*step)+'ms');glyph.style.setProperty('--ink-duration',duration+'ms');el.append(glyph);});}
function drawTitle(){brushWrite($('play-title'),tr(SETTINGS.title,english.title),{delay:250,step:tr(480,140),duration:1000});}
function drawChapter(index){const c=index<0?{number:'序章',short:'相遇'}:chapters[index];const [number,short]=isEnglish?(index<0?['Prologue','The Meeting']:english.chapters[index]):[c.number,c.short];brushWrite($('chapter-number'),number,{step:110,duration:520});brushWrite($('chapter-name'),short,{delay:260,step:170,duration:580});}
function chapterTitle(index,then){cancelTransitions();setScreen('chapter-screen');titleChapter=index;drawChapter(index);$('chapter-card').style.animation='none';void $('chapter-card').offsetWidth;$('chapter-card').style.animation='';later(then,2550);}
function cubic(a,b,c,d,t){const s=1-t;return s*s*s*a+3*s*s*t*b+3*s*t*t*c+t*t*t*d;}
function riverPoint(u){const t=u<.5?u*2:(u-.5)*2,bend=u<.5?cubic(0,.4,-.6,-.3,t):cubic(-.3,-.6,.5,.18,t),depth=1/(1+4*(1-u));return {x:.56+bend*depth*.32,y:.61+.24*depth,depth};}
function sail(direction,then){
 cancelTransitions();setScreen('boat-screen');
 const token=transit,started=performance.now(),duration=reduced?1600:8200,boat=$('boat'),water=$('boat-water'),wake=water.getContext('2d'),history=[];
 const width=innerWidth,height=innerHeight,dpr=Math.min(devicePixelRatio||1,1.5);water.width=width*dpr;water.height=height*dpr;wake.setTransform(dpr,0,0,dpr,0,0);boat.dataset.direction=direction;let lastSample=0;rings.length=0;ctx.clearRect(0,0,w,h);
 function step(now){
  if(token!==transit)return;
  const t=Math.min(1,(now-started)/duration),travel=t*t*(3-2*t),u=direction==='approach'?travel:1-travel,p=riverPoint(u),next=riverPoint(Math.min(1,u+.008)),yaw=Math.max(-5,Math.min(5,(next.x-p.x)*500));boatProgress=u;
  boat.style.left=p.x*100+'%';boat.style.top=p.y*100+'%';boat.style.opacity=String(.18+.76*Math.pow(u,.55));boat.style.filter='grayscale(.9) contrast('+(1.02+u*.2)+') blur('+((1-u)*1.25)+'px)';
  boat.style.transform='translate(-50%,-72%) scale('+p.depth+') rotate('+(yaw+Math.sin(now*.0018)*.4*p.depth)+'deg)';boat.style.setProperty('--near',p.depth);
  if(now-lastSample>40){history.push({x:p.x*width,y:p.y*height,depth:p.depth,t:now});lastSample=now;}while(history.length&&now-history[0].t>2200)history.shift();wake.clearRect(0,0,width,height);
  for(let i=1;i<history.length;i++){const a=history[i-1],b=history[i],fade=Math.max(0,1-(now-b.t)/2200),spread=(1-fade)*19*b.depth;wake.strokeStyle='rgba(57,69,61,'+(.16*fade*b.depth)+')';wake.lineWidth=.7;for(const side of [-1,1]){wake.beginPath();wake.moveTo(a.x+side*spread,a.y);wake.lineTo(b.x+side*(spread+3*b.depth),b.y);wake.stroke();}}
  for(let k=0;k<3;k++){const pulse=((now-started)/1900+k/3)%1;wake.strokeStyle='rgba(60,75,66,'+((1-pulse)*.2*p.depth)+')';wake.lineWidth=.7;wake.beginPath();wake.ellipse(p.x*width,p.y*height+3*p.depth,(30+pulse*40)*p.depth,(3+pulse*7)*p.depth,0,.1,Math.PI*2-.1);wake.stroke();}
  if(t<1)boatFrame=requestAnimationFrame(step);else then();
 }boatFrame=requestAnimationFrame(step);
}
function beginNew(){cancelTransitions();unloadActivity();state=fresh(state.restored);state.started=true;sail('approach',()=>chapterTitle(-1,()=>showDialogue('intro')));}
function returnToCover({clear=false}={}){cancelTransitions();unloadActivity();for(const id of ['artifact-dialog','painting-dialog','collection-dialog'])if($(id).open)$(id).close();state=fresh(clear?[]:state.restored);lastPortrait=null;activeQuiz=null;currentKey='intro';currentIndex=0;$('choices').hidden=true;setScreen('cover');drawTitle();}
// Starting the story always includes the arrival and complete prologue.
// Cumulative portraits/cards survive; a saved scene never skips the opening.
function startFromCover(){if(screen!=='cover')return;beginNew();}
function describeCharacter(){const name=currentArt==='elder'&&currentKey!=='farewell'?'老者':chapters.find(c=>c.art===currentArt).person;$('character').alt=tr(name+'的立绘','Portrait of '+person(name));}
function setCharacter(art){const img=$('character');if(currentArt===art)return;currentArt=art;img.classList.remove('changed');img.src='./assets/'+art+'.webp';void img.offsetWidth;img.classList.add('changed');}
$('character').addEventListener('animationend',()=>$('character').classList.remove('changed'));
function finishTyping(){clearTimeout(typeTimer);typing=false;$('dialogue-text').textContent=typedText;const line=scenes[currentKey]?.[currentIndex];if(line?.quiz!==undefined)showChoices(line.quiz);}
function reserveDialogue(text){const target=$('dialogue-text'),style=getComputedStyle(target),measure=document.createElement('p');measure.style.cssText='position:fixed;left:-10000px;top:0;visibility:hidden;margin:0;padding:0;pointer-events:none;';for(const name of ['font','lineHeight','letterSpacing','wordBreak','overflowWrap','whiteSpace'])measure.style[name]=style[name];measure.style.width=target.clientWidth+'px';measure.textContent=text;document.body.append(measure);const height=measure.getBoundingClientRect().height;measure.remove();target.style.height=height+'px';target.scrollTop=0;}
function positionChoices(){if(activeQuiz===null||screen!=='novel')return;const box=$('dialogue').getBoundingClientRect();$('choices').style.bottom=(innerHeight-box.top+16)+'px';}
new ResizeObserver(positionChoices).observe($('dialogue'));addEventListener('resize',()=>{if(screen==='novel'){reserveDialogue(typedText);positionChoices();}});
function writeLine(text,quiz){typedText=text;reserveDialogue(text);typing=true;let n=0;const token=transit;function tick(){if(token!==transit)return;n=Math.min(text.length,n+(reduced?text.length:2));$('dialogue-text').textContent=text.slice(0,n);if(n<text.length)typeTimer=setTimeout(tick,34);else{typing=false;if(quiz!==undefined)showChoices(quiz);}}$('dialogue-text').textContent='';tick();}
function lineText(line){return tr(line.text,english.scenes[currentKey]?.[currentIndex]??(currentKey.startsWith('go-')?'Let’s go and look.':line.text));}
function showDialogue(key,index=0){cancelTransitions();unloadActivity();setScreen('novel');const entries=scenes[key];if(!entries?.[index]){key='intro';index=0;}currentKey=key;currentIndex=index;activeQuiz=null;quizWrong=false;$('choices').hidden=true;$('choices').replaceChildren();$('advance').hidden=false;$('novel').classList.remove('has-choices');const line=scenes[key][index];state.checkpoint={screen:'dialogue',key,index};$('speaker').textContent=person(line.who);setCharacter(line.art);describeCharacter();$('memory-wash').hidden=!line.memory;$('novel').classList.toggle('in-memory',!!line.memory);if(line.memory)renderPainting($('memory-painting'));writeLine(lineText(line),line.quiz);}
function collect(id){if(!state.restored.includes(id)){state.restored.push(id);lastPortrait=id;}if(!state.journey.includes(id))state.journey.push(id);refreshOpenCollections();}
function advance(){if(screen!=='novel'||dialogsOpen())return;if(typing){finishTyping();return;}if(activeQuiz!==null)return;if(currentIndex+1<scenes[currentKey].length){showDialogue(currentKey,currentIndex+1);return;}const key=currentKey;
 if(key==='intro')showDialogue('riddle-0');
 else if(key.startsWith('go-')){const i=Number(key.slice(3));state.chapter=i;state.checkpoint={screen:'scan',chapter:i};chapterTitle(i,()=>showScan(i));}
 else if(key.startsWith('after-')){collect(key.slice(6));showScroll();}
 else if(key==='reveal'){state.chapter=4;state.checkpoint={screen:'scan',chapter:4};chapterTitle(4,()=>showScan(4));}
 else if(key==='farewell')sail('depart',()=>{collect('raft');state.ended=true;showScroll({final:true});});
}
function showChoices(quiz){activeQuiz=quiz;$('choices').hidden=false;$('choices').replaceChildren();$('advance').hidden=true;$('novel').classList.add('has-choices');const options=quiz==='final'?finalOptions:chapters[quiz].options;options.forEach((id,i)=>{const b=document.createElement('button');b.className='choice-button';b.dataset.choice=i;b.dataset.artifact=id;b.textContent=artifactName(id);b.onclick=()=>choose(quiz,id);$('choices').append(b);});positionChoices();}
function wrongChoice(quiz){$('speaker').textContent=person(quiz==='final'?'我':'老者');typedText=quiz==='final'?tr('不对，再想想。','That doesn’t fit. Think again.'):tr('不急，年轻人，再想想。','Take your time, young traveller. Think again.');reserveDialogue(typedText);$('dialogue-text').textContent=typedText;positionChoices();}
function choose(quiz,id){if(screen!=='novel'||activeQuiz!==quiz)return;const answer=quiz==='final'?'raft':chapters[quiz].id;if(id!==answer){quizWrong=true;wrongChoice(quiz);return;}activeQuiz=null;$('choices').hidden=true;if(quiz==='final')showDialogue('reveal');else showDialogue('go-'+quiz);}
function setActivityStatus(status){
 const label=$('frame-status');
 label.dataset.status=status;
 label.hidden=status==='ready';
 $('activity').setAttribute('aria-busy',String(status==='loading'));
 updateActivityStatus();
}
function updateActivityStatus(){
 const label=$('frame-status');
 label.textContent=label.dataset.status==='error'
  ?tr('互动页面加载失败。请返回后重试。','The activity could not load. Go back and try again.')
  :tr('正在载入…','Loading…');
}
function showScan(i){cancelTransitions();unloadActivity();state.chapter=i;state.checkpoint={screen:'scan',chapter:i};setActivityStatus('loading');setScreen('play-screen');const c=chapters[i];run=crypto.randomUUID?.()||Date.now()+'-'+Math.random();frameChapter=i;$('activity').src='./'+c.path+'/index.html?story=1&episode='+encodeURIComponent(c.id)+'&run='+encodeURIComponent(run);}
function translateFrame(){
 const chapter=chapters[frameChapter];
 if(chapter&&screen==='play-screen')return localizeActivity($('activity'),isEnglish,collection[chapter.id].en);
}
async function prepareFrame(){
 if(screen!=='play-screen'||frameChapter<0)return;
 const frame=$('activity'),documentRun=run,doc=translateFrame();
 if(!doc){
  if(frame.contentDocument?.URL!=='about:blank')setActivityStatus('error');
  return;
 }
 const begin=doc.getElementById('begin');
 // Capture before the scan page navigates, so its successor cannot paint unstyled.
 begin?.addEventListener('click',()=>{if(!begin.disabled)setActivityStatus('loading');},{capture:true});
 doc.querySelector('h1')?.getBoundingClientRect();
 await doc.fonts?.ready;
 if(screen==='play-screen'&&run===documentRun&&frame.contentDocument===doc)setActivityStatus('ready');
}
$('activity').addEventListener('load',prepareFrame);
window.addEventListener('message',e=>{const f=$('activity');if(e.origin!==location.origin||e.source!==f.contentWindow||screen!=='play-screen'||e.data?.run!==run)return;const c=chapters[frameChapter];if(!c||e.data.episode!==c.id)return;if(e.data.type==='wuzhong-complete'){unloadActivity();showDialogue(c.id==='raft'?'farewell':'after-'+c.id);}});
function svgElement(name,attributes={}){
 const node=document.createElementNS('http://www.w3.org/2000/svg',name);
 for(const [key,value] of Object.entries(attributes))node.setAttribute(key,value);
 return node;
}
function renderPainting(target,animate=true){
 const image='./assets/encounter-group.webp', prefix=target.id;
 const canvas=svgElement('svg',{class:'painting-art',viewBox:'0 0 1536 1024','aria-hidden':'true'});
 const defs=svgElement('defs');
 canvas.append(defs);
 for(const {id,outline} of portraits)defs.append(svgElement('path',{id:prefix+'-'+id,d:outline}));
 for(const {id,behind} of portraits){
  const shape='#'+prefix+'-'+id,maskId=prefix+'-mask-'+id;
  const mask=svgElement('mask',{id:maskId,maskUnits:'userSpaceOnUse',x:0,y:0,width:1536,height:1024});
  mask.append(svgElement('use',{href:shape,fill:'white'}));
  for(const inFront of behind)mask.append(svgElement('use',{href:'#'+prefix+'-'+inFront,fill:'black'}));
  defs.append(mask);
  const restored=state.restored.includes(id);
  const layer=svgElement('g',{'data-portrait':id,mask:'url(#'+maskId+')',class:restored?'painting-layer restored':'painting-silhouette'});
  if(restored){
   if(animate&&id===lastPortrait)layer.classList.add('newly-restored');
   layer.append(svgElement('image',{href:image,width:1536,height:1024}));
  }else layer.append(svgElement('use',{href:shape}));
  canvas.append(layer);
 }
 const complete=state.restored.length===portraits.length;
 target.classList.toggle('complete',complete);
 target.classList.toggle('final-reveal',complete&&animate&&lastPortrait==='raft');
 const all=new Image();all.src=image;all.alt='';all.className='painting-complete';
 target.replaceChildren(canvas,all);
 target.setAttribute('role','img');
 describePainting(target);
 const mount=target.closest('.painted-scroll');
 if(animate&&mount){mount.classList.remove('unrolling');void mount.offsetWidth;mount.classList.add('unrolling');}
}
function describePainting(target){
 const names=chapters.filter(c=>state.restored.includes(c.id)).map(c=>person(c.person));
 const summary=names.length?tr('已显影：','Restored: ')+names.join(tr('、',', ')) : tr('五道尚未显影的人影','Five silhouettes awaiting restoration');
 target.setAttribute('aria-label',summary);
}
function renderCollection(){
 const cards=chapters.map(c=>{
  const known=state.restored.includes(c.id);
  const card=document.createElement('button');
  card.type='button';
  card.className='collection-card'+(known?' collected':'');
  card.dataset.collection=c.id;
  card.disabled=!known;
  card.setAttribute('aria-label',known?artifactName(c.id):tr('尚未收集的文物','Artefact not yet collected'));
  const img=new Image();img.src='./assets/collection/'+c.id+'.webp';img.alt='';
  const title=document.createElement('span');title.className='collection-title';title.textContent=known?artifactName(c.id):'';
  card.append(img,title);
  if(known)card.addEventListener('click',()=>openArtifact(c.id));
  return card;
 });
 $('collection-cards').replaceChildren(...cards);
}
function renderArtifact(id){
 const facts=collection[id];
 const description=$('artifact-description');
 const scroll=description.scrollTop;
 $('artifact-title').textContent=artifactName(id);
 $('artifact-meta').textContent=tr(...facts.meta);
 const entries=facts.paragraphs.map(copy=>{
  const paragraph=document.createElement('p');paragraph.textContent=tr(...copy);return paragraph;
 });
 const source=document.createElement('a');
 source.className='artifact-source';source.href=facts.source;source.target='_blank';source.rel='noopener noreferrer';
 source.textContent=tr('吴文化博物馆藏品页 ↗','Wuzhong Museum collection ↗');
 description.replaceChildren(...entries,source);
 description.scrollTop=scroll;
}
function openArtifact(id){
 if(!state.restored.includes(id))return;
 selectedArtifact=id;
 renderArtifact(id);
 $('artifact-description').scrollTop=0;
 $('artifact-dialog').showModal();
 $('close-artifact').focus();
}
$('artifact-dialog').addEventListener('close',()=>{
 const card=document.querySelector('[data-collection="'+selectedArtifact+'"]');
 if($('collection-dialog').open)card?.focus();
 selectedArtifact=null;
});
function refreshOpenCollections(){if($('painting-dialog').open)renderPainting($('gallery-painting'));if($('collection-dialog').open)renderCollection();}
function showScroll({final=false}={}){cancelTransitions();setScreen('scroll-screen');state.checkpoint={screen:'scroll',final};renderPainting($('portrait-scroll'));lastPortrait=null;$('scroll-continue').onclick=()=>{if(final)showEnding();else if(state.chapter>=3)showDialogue('deduction');else showDialogue('riddle-'+(state.chapter+1));};if(final)later(showEnding,4300);}
function showEnding(){cancelTransitions();unloadActivity();setScreen('ending');state.ended=true;state.checkpoint={screen:'ending'};}
function openPainting(){if($('collection-dialog').open)$('collection-dialog').close();renderPainting($('gallery-painting'));if(!$('painting-dialog').open)$('painting-dialog').showModal();}
function openCollection(){if($('painting-dialog').open)$('painting-dialog').close();renderCollection();if(!$('collection-dialog').open)$('collection-dialog').showModal();}
$('open-scroll').onclick=openPainting;$('open-collection').onclick=openCollection;$('close-painting').onclick=()=>$('painting-dialog').close();$('close-collection').onclick=()=>$('collection-dialog').close();$('close-artifact').onclick=()=>$('artifact-dialog').close();$('start-story').onclick=e=>{e.stopPropagation();startFromCover();};$('restart-story').onclick=()=>returnToCover();$('leave-ar').onclick=()=>state.chapter===4?showDialogue('reveal',scenes.reveal.length-1):showDialogue('go-'+state.chapter);$('advance').onclick=e=>{e.stopPropagation();advance();};$('dialogue').onclick=e=>{if(!e.target.closest('button'))advance();};

function applyLanguage(){
 document.documentElement.lang=tr('zh-CN','en');
 document.title=tr(SETTINGS.title,english.title);
 const labels=[
  ['boat-screen','舟行转场','Boat transition'],['choices','选择文物','Choose an artefact'],
  ['dialogue','人物对话','Dialogue'],['advance','继续对话','Continue dialogue'],
  ['scroll-continue','收起画卷，继续故事','Close the scroll and continue'],
  ['story-tools','画卷与收藏','Scroll and collection'],['open-scroll','查看画卷','View the scroll'],
  ['open-collection','查看收藏','View the collection'],['painting-dialog','画卷','Scroll'],
  ['close-painting','关闭画卷','Close the scroll'],['collection-dialog','文物收藏','Artefact collection'],
  ['close-collection','关闭收藏','Close the collection'],['close-artifact','关闭文物介绍','Close the artefact details'],
 ];
 for(const [id,zh,en] of labels)$(id).setAttribute('aria-label',tr(zh,en));
 $('activity').title=tr('文物AR扫描与互动','Artefact AR scan and activity');
 document.querySelector('.boat-image').alt=tr('一叶小舟沿水路由远及近','A small boat approaches along the river');
 const copy=[
  ['#start-story span','点击开始故事','Begin the story'],['#open-scroll','画卷','Scroll'],
  ['#open-collection','收藏','Collection'],['#leave-ar','‹ 返回','‹ Back'],
  ['#ending h2','全剧终','The End'],['#restart-story','再赴此约 ↻','Begin again ↻'],
  ['#speak-artifact','与她对话','Speak with her'],
 ];
 for(const [selector,zh,en] of copy)document.querySelector(selector).textContent=tr(zh,en);
 document.querySelector('#ending p').replaceChildren(
  tr('人有归期，文脉无尽。','People return in time. Culture carries on.'),
  document.createElement('br'),
  tr('愿每一次凝望，都让历史被记得。','May every attentive look keep a little history alive.'),
 );
 for(const button of document.querySelectorAll('[data-language]')){
  button.lang=tr('en','zh-CN');
  button.textContent=tr('English','中文');
  button.setAttribute('aria-label',tr('Switch to English','切换到中文'));
 }
 describeCharacter();
 for(const id of ['memory-painting','portrait-scroll','gallery-painting'])describePainting($(id));
 if(screen==='cover')drawTitle();
 else if(screen==='chapter-screen')drawChapter(titleChapter);
 else if(screen==='novel'){
  const line=scenes[currentKey][currentIndex];
  clearTimeout(typeTimer);
  typing=false;
  if(quizWrong)wrongChoice(line.quiz);
  else{
   $('speaker').textContent=person(line.who);
   typedText=lineText(line);
   reserveDialogue(typedText);
   $('dialogue-text').textContent=typedText;
  }
  if(line.quiz!==undefined)showChoices(line.quiz);
 }
 if($('collection-dialog').open)renderCollection();
 if($('artifact-dialog').open)renderArtifact(selectedArtifact);
 updateActivityStatus();
 translateFrame();
}
for(const button of document.querySelectorAll('[data-language]')){
 button.addEventListener('click',()=>{isEnglish=!isEnglish;applyLanguage();});
}
applyLanguage();
const startButton=$('start-story');let touchHoverTimer=0;document.addEventListener('pointermove',e=>{if(screen!=='cover'||e.pointerType==='mouse')return;const r=startButton.getBoundingClientRect(),over=e.clientX>=r.left&&e.clientX<=r.right&&e.clientY>=r.top&&e.clientY<=r.bottom;startButton.classList.toggle('touched',over);clearTimeout(touchHoverTimer);if(over)touchHoverTimer=setTimeout(()=>startButton.classList.remove('touched'),650);},{passive:true});document.addEventListener('pointerup',()=>{clearTimeout(touchHoverTimer);startButton.classList.remove('touched');},{passive:true});document.addEventListener('pointercancel',()=>startButton.classList.remove('touched'),{passive:true});
let gesture=null,blockedClickUntil=0;const touches=new Set();document.addEventListener('pointerdown',e=>{if(screen!=='cover'||dialogsOpen()||e.pointerType==='mouse'&&e.button!==0)return;touches.add(e.pointerId);if(touches.size>1){if(gesture)gesture.cancel=true;return;}gesture={id:e.pointerId,x:e.clientX,y:e.clientY,t:performance.now(),moved:false,cancel:false,interactive:!!e.target.closest('button,a,dialog')};});
document.addEventListener('pointermove',e=>{if(gesture?.id===e.pointerId&&Math.hypot(e.clientX-gesture.x,e.clientY-gesture.y)>10)gesture.moved=true;});document.addEventListener('pointerup',e=>{touches.delete(e.pointerId);if(gesture?.id!==e.pointerId)return;const g=gesture;gesture=null;if(g.moved||g.cancel)blockedClickUntil=performance.now()+700;if(screen==='cover'&&!dialogsOpen()&&!g.interactive&&!g.moved&&!g.cancel&&performance.now()-g.t<650)startFromCover();});document.addEventListener('pointercancel',e=>{touches.delete(e.pointerId);if(gesture?.id===e.pointerId)gesture=null;});document.addEventListener('click',e=>{if(screen==='cover'&&performance.now()<blockedClickUntil){e.preventDefault();e.stopImmediatePropagation();}},true);
document.addEventListener('keydown',e=>{if(e.repeat||e.isComposing||e.ctrlKey||e.metaKey||e.altKey||dialogsOpen())return;if(screen==='cover'&&!['Shift','Control','Alt','Meta','CapsLock','Tab','Escape'].includes(e.key)){if(e.target.closest('button,a')&&['Enter',' '].includes(e.key))return;e.preventDefault();startFromCover();}else if(screen==='novel'&&['Enter',' '].includes(e.key)&&!e.target.closest('button,a,[tabindex]')){e.preventDefault();advance();}});
const canvas=$('ripples'),ctx=canvas.getContext('2d'),rings=[];let w=0,h=0,rippleFrame=0,lastRipple=0;function resizeRipples(){const d=Math.min(devicePixelRatio||1,1.5);w=innerWidth;h=innerHeight;canvas.width=w*d;canvas.height=h*d;ctx.setTransform(d,0,0,d,0,0);}resizeRipples();addEventListener('resize',resizeRipples);function drawRipples(now){ctx.clearRect(0,0,w,h);for(let i=rings.length-1;i>=0;i--){const r=rings[i],age=(now-r.t)/2200;if(age>=1){rings.splice(i,1);continue;}for(let k=0;k<3;k++){const radius=7+age*82+k*13;ctx.strokeStyle='rgba(45,77,64,'+((1-age)*(.38-k*.07))+')';ctx.lineWidth=1.05-k*.14;ctx.beginPath();ctx.ellipse(r.x,r.y,radius,radius*.43,0,0,Math.PI*2);ctx.stroke();ctx.strokeStyle='rgba(255,255,249,'+((1-age)*.58)+')';ctx.lineWidth=.7;ctx.beginPath();ctx.ellipse(r.x,r.y+1.2,radius+1.4,radius*.43+.8,0,0,Math.PI*2);ctx.stroke();}}rippleFrame=rings.length?requestAnimationFrame(drawRipples):0;}function addRipple(e){if(reduced||screen==='play-screen'||screen==='boat-screen'||dialogsOpen())return;const now=performance.now();if(e.type==='pointermove'&&now-lastRipple<140)return;lastRipple=now;rings.push({x:e.clientX,y:e.clientY,t:now});if(rings.length>12)rings.shift();if(!rippleFrame)rippleFrame=requestAnimationFrame(drawRipples);}document.addEventListener('pointermove',addRipple,{passive:true});document.addEventListener('pointerdown',addRipple,{passive:true});
addEventListener('pagehide',()=>{unloadActivity();clearTimeout(typeTimer);cancelAnimationFrame(rippleFrame);cancelAnimationFrame(boatFrame);});
// A page restored from the browser's back/forward cache is a reopened visit too.
addEventListener('pageshow',e=>{if(e.persisted)returnToCover({clear:true});});
window.storyApp={get screen(){return screen;},get state(){return structuredClone(state);},get dialogue(){return {key:currentKey,index:currentIndex,typing,quiz:activeQuiz};},get frameChapter(){return frameChapter;},get boatProgress(){return boatProgress;},get ripples(){return rings.length;}};
