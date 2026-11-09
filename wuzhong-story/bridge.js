(()=>{
 const params=new URLSearchParams(location.search),id=params.get('episode'),run=params.get('run'),embedded=window.parent!==window;
 if(!embedded)return;
 if(params.get('story')==='1'&&id&&run)sessionStorage.setItem('wuzhong-active-episode',JSON.stringify({id,run}));
 let current;try{current=JSON.parse(sessionStorage.getItem('wuzhong-active-episode'));}catch{}if(!current?.id||!current?.run)return;
 const emit=type=>parent.postMessage({type,episode:current.id,run:current.run},location.origin);let sent=false;emit('wuzhong-ready');
 const debug=()=>window.mirrorDemo||window.plateDemo||window.jarDemo||window.dragonDemo||window.silverDemo;
 function stop(){const d=debug();d?.renderer?.setAnimationLoop?.(null);document.querySelectorAll('video').forEach(v=>v.srcObject?.getTracks().forEach(t=>t.stop()));}
 const poll=setInterval(()=>{const d=debug();if(!sent&&d?.phase==='complete'){sent=true;clearInterval(poll);emit('wuzhong-complete');}},180);
 addEventListener('message',e=>{if(e.source===parent&&e.origin===location.origin&&e.data?.type==='wuzhong-stop'&&e.data.run===current.run){clearInterval(poll);stop();}});
 addEventListener('pagehide',()=>{clearInterval(poll);stop();});
})();
