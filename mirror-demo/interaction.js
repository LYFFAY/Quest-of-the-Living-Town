import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {OrbitControls} from './vendor/OrbitControls.js';

const stage=document.getElementById('stage'),canvas=document.getElementById('scene'),loading=document.getElementById('loading');
const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.75));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.45;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.01,30);
const controls=new OrbitControls(camera,canvas);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=1.7;controls.maxDistance=8;controls.rotateSpeed=.65;controls.zoomSpeed=.7;
scene.add(new THREE.HemisphereLight(0xfffaf0,0x80958a,2.5));const light=new THREE.DirectionalLight(0xffffff,2.1);light.position.set(-2,3,5);scene.add(light);
const loader=new THREE.TextureLoader(),ray=new THREE.Raycaster(),ndc=new THREE.Vector2();
const uniforms={fullMap:{value:null},maskMap:{value:null},restored:{value:new THREE.Vector4()},flash:{value:new THREE.Vector4()},glow:{value:0}};
let model,pieces=[],meshList=[],selected=null,busy=false,flashStart=0,active=-1,celebrationStart=0,celebrating=false,finished=false,frameId,stream,startingCamera=false;
const repaired=new Set(),buttons=new Map(),flight=[];
const debug={ready:false,state:0,phase:'loading',renderer,scene,camera,controls,uniforms,model:null};window.mirrorDemo=debug;
function resize(){const w=stage.clientWidth,h=stage.clientHeight;camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);}new ResizeObserver(resize).observe(stage);resize();
function deselect(){selected=null;document.querySelectorAll('.choice').forEach(x=>x.setAttribute('aria-pressed','false'));}
function applySurface(material){
 material.onBeforeCompile=shader=>{
  Object.assign(shader.uniforms,uniforms);
  shader.fragmentShader='uniform sampler2D fullMap; uniform sampler2D maskMap; uniform vec4 restored; uniform vec4 flash; uniform float glow;\nfloat pick(float c,vec4 flags){return flags.x*float(abs(c-60.0/255.0)<0.055)+flags.y*float(abs(c-120.0/255.0)<0.055)+flags.z*float(abs(c-180.0/255.0)<0.055)+flags.w*float(abs(c-240.0/255.0)<0.055);}\n'+shader.fragmentShader;
  shader.fragmentShader=shader.fragmentShader.replace('#include <map_fragment>',`#include <map_fragment>
   vec3 mask=texture2D(maskMap,vMapUv).rgb;
   float amount=clamp(pick(mask.b,restored),0.0,1.0);
   if(dot(restored,vec4(1.0))>3.5)amount=1.0;
   diffuseColor.rgb=mix(diffuseColor.rgb,texture2D(fullMap,vMapUv).rgb,amount);
   float selectedShape=pick(mask.r,flash);
   vec2 stepUV=vec2(2.5/2048.0);
   selectedShape=max(selectedShape,pick(texture2D(maskMap,vMapUv+vec2(stepUV.x,0)).r,flash));
   selectedShape=max(selectedShape,pick(texture2D(maskMap,vMapUv-vec2(stepUV.x,0)).r,flash));
   selectedShape=max(selectedShape,pick(texture2D(maskMap,vMapUv+vec2(0,stepUV.y)).r,flash));
   selectedShape=max(selectedShape,pick(texture2D(maskMap,vMapUv-vec2(0,stepUV.y)).r,flash));
   float goldEdge=selectedShape*mask.g;
   float gold=glow*(goldEdge+.008*pick(mask.r,flash));
   diffuseColor.rgb=mix(diffuseColor.rgb,vec3(1.0,.64,.10),min(gold,.96));`);
  shader.fragmentShader=shader.fragmentShader.replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n totalEmissiveRadiance+=vec3(1.0,.52,.06)*gold*2.0;');
 };
 material.customProgramCacheKey=()=> 'mirror-repair-outline-v1';material.needsUpdate=true;
}
function updateMarkers(){if(!model)return;model.updateWorldMatrix(true,true);for(const p of pieces){const b=buttons.get(p.id),v=new THREE.Vector3(...p.pos),n=new THREE.Vector3(...p.normal),toCamera=camera.position.clone().sub(v).normalize();let visible=!repaired.has(p.id)&&!busy&&n.dot(toCamera)>.05;const screen=v.clone().project(camera);if(screen.z>1||screen.z< -1||Math.abs(screen.x)>1||Math.abs(screen.y)>1)visible=false;
 if(visible){ray.set(camera.position,v.clone().sub(camera.position).normalize());const hit=ray.intersectObjects(meshList,false)[0];if(hit&&hit.point.distanceTo(v)>.025)visible=false;}
 b.hidden=!visible;if(visible){b.style.left=(screen.x*.5+.5)*stage.clientWidth+'px';b.style.top=(-screen.y*.5+.5)*stage.clientHeight+'px';}}
}
function selectPiece(id){if(busy||repaired.has(id))return;const next=selected===id?null:id;deselect();selected=next;if(next!==null)document.getElementById('choice-'+id).setAttribute('aria-pressed','true');}
function match(id){if(busy||selected===null||repaired.has(id))return;if(selected!==id){deselect();return;}
 busy=true;active=Number(id);uniforms.flash.value.set(0,0,0,0).setComponent(active,1);flashStart=performance.now();debug.phase='gold-outline';deselect();updateMarkers();
}
function completeRepair(){const id=String(active);uniforms.restored.value.setComponent(active,1);uniforms.flash.value.set(0,0,0,0);uniforms.glow.value=0;repaired.add(id);document.getElementById('choice-'+id).disabled=true;debug.state|=1<<active;active=-1;busy=false;debug.phase='interaction';if(repaired.size===4){finished=true;document.getElementById('success').hidden=false;startCelebration();}}
function startCelebration(){celebrating=true;celebrationStart=performance.now();debug.phase='celebration';for(const f of flight){f.sprite.visible=true;f.trail.visible=true;}}
function updateFlight(now){if(!celebrating)return;const t=(now-celebrationStart)/1000,duration=5.6;for(let i=0;i<flight.length;i++){const f=flight[i],origin=new THREE.Vector3(...pieces[f.index].pos),angle=t<.6?f.angle:f.angle+Math.min(1,(t-.6)/4.4)*Math.PI*2;const ring=new THREE.Vector3(Math.cos(angle)*1.04,Math.sin(angle)*1.04,Math.sin(angle*2)*.19+.12);let position=ring;
 if(t<.6)position=origin.clone().lerp(ring,THREE.MathUtils.smoothstep(t,0,.6));if(t>5)position=ring.clone().lerp(origin,THREE.MathUtils.smoothstep(t,5,5.6));f.sprite.position.copy(position);f.sprite.scale.setScalar(.3+.025*Math.sin(t*5+i));f.sprite.material.opacity=t<.3?t/.3:t>5?Math.max(0,(5.6-t)/.6):1;
 const data=f.trail.geometry.attributes.position.array;for(let k=0;k<32;k++){const a=angle-k*.025;data[k*3]=Math.cos(a)*1.04;data[k*3+1]=Math.sin(a)*1.04;data[k*3+2]=Math.sin(a*2)*.19+.12;}f.trail.geometry.attributes.position.needsUpdate=true;f.trail.material.opacity=.45*f.sprite.material.opacity;
 }if(t>=duration){celebrating=false;debug.phase='complete';for(const f of flight){f.sprite.visible=false;f.trail.visible=false;}}}
function animate(now){frameId=requestAnimationFrame(animate);controls.update();if(active>=0){const t=(now-flashStart)/1000;uniforms.glow.value=Math.pow(Math.sin(Math.PI*Math.min(t,1)),.55);if(t>=1)completeRepair();}updateFlight(now);updateMarkers();renderer.render(scene,camera);}
async function init(){try{
 const [gltf,full,missing,mask,data]=await Promise.all([new GLTFLoader().loadAsync('./mirror.glb'),loader.loadAsync('./complete.jpg'),loader.loadAsync('./missing.jpg'),loader.loadAsync('./surface-mask.png'),fetch('./pieces.json').then(r=>{if(!r.ok)throw Error('pieces unavailable');return r.json();})]);
 pieces=data;for(const tex of [full,missing,mask]){tex.flipY=false;tex.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());}full.colorSpace=missing.colorSpace=THREE.SRGBColorSpace;mask.minFilter=mask.magFilter=THREE.NearestFilter;uniforms.fullMap.value=full;uniforms.maskMap.value=mask;
 model=gltf.scene;model.traverse(o=>{if(o.isMesh){meshList.push(o);for(const m of Array.isArray(o.material)?o.material:[o.material]){m.map?.dispose();m.map=missing;m.metalness=0;m.roughness=.88;applySurface(m);}}});scene.add(model);debug.model=model;
 camera.position.set(0,0,Math.max(3.5,1.15/(Math.tan(camera.fov*Math.PI/360)*Math.min(1,camera.aspect))));controls.maxDistance=Math.max(8,camera.position.z*1.6);controls.update();
 for(const p of pieces){const b=document.createElement('button');b.id='hotspot-'+p.id;b.className='dot';b.setAttribute('aria-label','将选中的鸾兽放回此处');b.hidden=true;b.onclick=()=>match(p.id);document.getElementById('markers').append(b);buttons.set(p.id,b);document.getElementById('choice-'+p.id).onclick=()=>selectPiece(p.id);}
 for(const index of [0,2]){const tex=await loader.loadAsync('./gold-'+index+'.png');tex.colorSpace=THREE.SRGBColorSpace;const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:tex,transparent:true,depthWrite:false,toneMapped:false}));sprite.visible=false;scene.add(sprite);const geom=new THREE.BufferGeometry();geom.setAttribute('position',new THREE.BufferAttribute(new Float32Array(32*3),3));const trail=new THREE.Points(geom,new THREE.PointsMaterial({color:0xf5c565,size:.012,transparent:true,opacity:.4,depthWrite:false,blending:THREE.AdditiveBlending}));trail.visible=false;scene.add(trail);const p=pieces[index].pos;flight.push({index,sprite,trail,angle:Math.atan2(p[1],p[0])});}
 loading.hidden=true;debug.ready=true;debug.phase='interaction';debug.pieces=pieces;debug.finished=()=>finished;animate(performance.now());
 }catch(e){console.error(e);loading.textContent='模型加载失败，请刷新重试 / Could not load mirror. Please reload.';debug.error=String(e);}}
const video=document.getElementById('camera');async function startCamera(){if(stream||startingCamera||document.hidden)return;startingCamera=true;try{const next=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:960},height:{ideal:540}},audio:false});if(document.hidden){next.getTracks().forEach(t=>t.stop());return;}stream=next;video.srcObject=stream;await video.play();stage.classList.add('camera-on');document.getElementById('camera-message').hidden=true;}catch(e){document.getElementById('camera-message').hidden=false;}finally{startingCamera=false;}}
function stopCamera(){stream?.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;stage.classList.remove('camera-on');}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCamera();else startCamera();});window.addEventListener('pagehide',()=>{stopCamera();cancelAnimationFrame(frameId);});window.addEventListener('pageshow',e=>{if(e.persisted){startCamera();animate(performance.now());}});startCamera();init();
