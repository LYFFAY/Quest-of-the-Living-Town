import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {sparkCloud} from './effects.js';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';
import {whiteDragon} from './white-dragon.js?v=3';

const stage=document.getElementById('stage'),canvas=document.getElementById('scene'),loading=document.getElementById('loading');
const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.01,30);
const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=2.4;controls.maxDistance=8;controls.rotateSpeed=.65;controls.zoomSpeed=.7;
scene.add(new THREE.AmbientLight(0xffffff,2.0));const light=new THREE.DirectionalLight(0xffffff,1.6);light.position.set(-2,3,5);scene.add(light);const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer);scene.environment=pmrem.fromScene(room,.04).texture;room.dispose();pmrem.dispose();const dragon=whiteDragon(scene);
const loader=new THREE.TextureLoader(),ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
const uniforms={fullMap:{value:null},maskMap:{value:null},glowMap:{value:null},restored:{value:new THREE.Vector4(0,0,0,0)},flash:{value:new THREE.Vector4(0,0,0,0)},glow:{value:0},progress:{value:0},reveal:{value:0},flashCenter:{value:new THREE.Vector2()}};
let model,pieces=[],meshList=[],selected=null,busy=false,flashStart=0,active=-1,celebrationStart=0,celebrating=false,finished=false,frameId,stream,startingCamera=false;
const repaired=new Set(),buttons=new Map(),flight=[];
const repairDust=sparkCloud(96,4.5);scene.add(repairDust.points);
const debug={dragon,ready:false,state:0,phase:'loading',renderer,scene,camera,controls,uniforms,model:null};window.dragonDemo=debug;
function resize(){const w=stage.clientWidth,h=stage.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}new ResizeObserver(resize).observe(stage);resize();
function deselect(){selected=null;document.querySelectorAll('.choice').forEach(x=>x.setAttribute('aria-pressed','false'));}
function applySurface(material){
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.fragmentShader='uniform sampler2D fullMap; uniform sampler2D maskMap; uniform sampler2D glowMap; uniform vec4 restored; uniform vec4 flash; uniform float glow; uniform float progress; uniform float reveal; uniform vec2 flashCenter;\nfloat pick(float c,vec4 flags){return flags.x*float(abs(c-60.0/255.0)<0.055)+flags.y*float(abs(c-120.0/255.0)<0.055)+flags.z*float(abs(c-180.0/255.0)<0.055)+flags.w*float(abs(c-240.0/255.0)<0.055);}\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   vec3 mask=texture2D(maskMap,vMapUv).rgb;
   float amount=clamp(pick(mask.b,restored)+pick(mask.b,flash)*reveal,0.0,1.0);
   if(dot(restored,vec4(1.0))>3.5)amount=1.0;
   diffuseColor.rgb=mix(diffuseColor.rgb,texture2D(fullMap,vMapUv).rgb,amount);
   vec3 effect=texture2D(glowMap,vMapUv).rgb;
   float sweep=dot(vMapUv-flashCenter,vec2(6.,6.));
   float wave=exp(-pow((sweep-mix(-1.2,1.2,progress))*4.,2.));
   float gold=pick(effect.b,flash)*glow*(.28*effect.r+effect.g*(.38+.7*wave));
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(1.0,.63,.16),min(gold*.7,.8));`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance+=vec3(1.0,.55,.12)*gold*1.65;');
 };
 material.customProgramCacheKey=()=> 'dragon-repair-outline-v1';material.needsUpdate=true;
}
function updateMarkers(){if(!model)return;model.updateWorldMatrix(true,true);for(const p of pieces){const b=buttons.get(p.id),v=new THREE.Vector3(...p.pos),n=new THREE.Vector3(...p.normal),toCamera=camera.position.clone().sub(v).normalize();let visible=!repaired.has(p.id)&&!busy&&n.dot(toCamera)>.05;const screen=v.clone().project(camera);if(screen.z>1||screen.z< -1||Math.abs(screen.x)>1||Math.abs(screen.y)>1)visible=false;
 if(visible){ray.set(camera.position,v.clone().sub(camera.position).normalize());const hit=ray.intersectObjects(meshList,false)[0];if(hit&&hit.point.distanceTo(v)>.025)visible=false;}
 b.hidden=!visible;if(visible){b.style.left=(screen.x*.5+.5)*stage.clientWidth+'px';b.style.top=(-screen.y*.5+.5)*stage.clientHeight+'px';}}
}
function selectPiece(id){if(busy||repaired.has(id))return;const next=selected===id?null:id;deselect();selected=next;if(next!==null)document.getElementById('choice-'+id).setAttribute('aria-pressed','true');}
function match(id){if(busy||selected===null||repaired.has(id))return;if(selected!==id){deselect();return;}
 busy=true;active=Number(id);uniforms.flash.value.set(0,0,0,0).setComponent(active,1);uniforms.flashCenter.value.set(...pieces[active].uv);uniforms.reveal.value=0;flashStart=performance.now();repairDust.points.visible=true;debug.phase='gold-outline';deselect();updateMarkers();
}
function completeRepair(){const id=String(active);uniforms.restored.value.setComponent(active,1);uniforms.flash.value.set(0,0,0,0);uniforms.glow.value=0;uniforms.reveal.value=0;repairDust.points.visible=false;repaired.add(id);document.getElementById('choice-'+id).disabled=true;debug.state|=1<<active;active=-1;busy=false;debug.phase='interaction';if(repaired.size===4){finished=true;document.getElementById('success').hidden=false;startCelebration();}}
function startCelebration(){celebrating=true;celebrationStart=performance.now();debug.phase='celebration';document.getElementById('success').style.opacity=1;dragon.start();}
function updateRepair(now){if(active<0)return;const t=(now-flashStart)/1000;uniforms.progress.value=Math.min(t,1);uniforms.glow.value=THREE.MathUtils.smoothstep(t,0,.18)*(1-THREE.MathUtils.smoothstep(t,.83,1.28));uniforms.reveal.value=THREE.MathUtils.smoothstep(t,1,1.28);
 const contour=pieces[active].contour;for(let k=0;k<96;k++){const age=(t*1.5+k*.037)%1,point=contour[(k*7+Math.floor(t*60))%contour.length],phase=k*2.399;repairDust.positions[k*3]=point[0]+Math.cos(phase)*age*.025;repairDust.positions[k*3+1]=point[1]+age*.055;repairDust.positions[k*3+2]=point[2]+.015+Math.sin(phase)*age*.018;repairDust.fades[k]=Math.sin(age*Math.PI)*uniforms.glow.value*.8;}repairDust.commit();if(t>=1.28)completeRepair();}
function updateFlight(now){if(!celebrating)return;const t=(now-celebrationStart)/1000,result=dragon.update(t,new THREE.Vector3());document.getElementById('success').style.opacity=result.fade;if(result.done){celebrating=false;debug.phase='complete';document.getElementById('success').hidden=true;}}
function animate(now){frameId=requestAnimationFrame(animate);controls.update();updateRepair(now);updateFlight(now);updateMarkers();renderer.render(scene,camera);}
async function init(){try{
 const [gltf,full,missing,mask,glowMask,data]=await Promise.all([new GLTFLoader().loadAsync('./dragon-jar.glb?v=2'),loader.loadAsync('./complete.jpg?v=2'),loader.loadAsync('./missing.jpg?v=2'),loader.loadAsync('./surface-mask.png?v=2'),loader.loadAsync('./glow-mask.png?v=2'),fetch('./pieces.json?v=2').then(r=>{if(!r.ok)throw Error('pieces unavailable');return r.json();})]);
 pieces=data;for(const tex of [full,missing,mask,glowMask]){tex.flipY=false;tex.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());}full.colorSpace=missing.colorSpace=THREE.SRGBColorSpace;mask.minFilter=mask.magFilter=THREE.NearestFilter;uniforms.fullMap.value=full;uniforms.maskMap.value=mask;uniforms.glowMap.value=glowMask;
 model=gltf.scene;model.traverse(o=>{if(o.isMesh){meshList.push(o);for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map?.dispose();m.map=missing;m.metalness=0;m.roughness=.9;m.envMapIntensity=.8;applySurface(m);}}});scene.add(model);debug.model=model;
 camera.position.set(0,0,Math.max(3.5,1.52/(Math.tan(camera.fov*Math.PI/360)*Math.min(1,camera.aspect))));controls.maxDistance=Math.max(8,camera.position.z*1.6);controls.update();
 for(const p of pieces){const b=document.createElement('button');b.id='hotspot-'+p.id;b.className='dot';b.setAttribute('aria-label','将选中的龙纹拼回此处');b.hidden=true;b.onclick=()=>match(p.id);document.getElementById('markers').append(b);buttons.set(p.id,b);document.getElementById('choice-'+p.id).onclick=()=>selectPiece(p.id);}
 loading.hidden=true;debug.ready=true;debug.phase='interaction';debug.pieces=pieces;debug.finished=()=>finished;animate(performance.now());
 }catch(e){console.error(e);loading.textContent='模型加载失败，请刷新重试 / Could not load dragon jar. Please reload.';debug.error=String(e);}}
const video=document.getElementById('camera');async function startCamera(){if(stream||startingCamera||document.hidden)return;startingCamera=true;try{const next=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:960},height:{ideal:540}},audio:false});if(document.hidden){next.getTracks().forEach(t=>t.stop());return;}stream=next;video.srcObject=stream;await video.play();stage.classList.add('camera-on');document.getElementById('camera-message').hidden=true;}catch(e){document.getElementById('camera-message').hidden=false;}finally{startingCamera=false;}}
function stopCamera(){stream?.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;stage.classList.remove('camera-on');}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCamera();else startCamera();});window.addEventListener('pagehide',()=>{stopCamera();cancelAnimationFrame(frameId);});window.addEventListener('pageshow',e=>{if(e.persisted){startCamera();animate(performance.now());}});startCamera();init();
