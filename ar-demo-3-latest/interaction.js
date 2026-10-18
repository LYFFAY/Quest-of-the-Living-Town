import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {OrbitControls} from './vendor/OrbitControls.js';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';
import {lotusFlower,lotusGarden} from './lotus.js?v=1';
const stage=document.getElementById('stage'),canvas=document.getElementById('scene'),loading=document.getElementById('loading');
const renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.6));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;
const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(36,1,.01,30),controls=new OrbitControls(camera,canvas);
controls.enableDamping=true;controls.enablePan=false;controls.minDistance=1.65;controls.maxDistance=8;controls.rotateSpeed=.65;
scene.add(new THREE.HemisphereLight(0xf6ffff,0x618c9c,2.4));const key=new THREE.DirectionalLight(0xfff8ea,2.6);key.position.set(-2,3,5);scene.add(key);const rim=new THREE.DirectionalLight(0x8fe8f1,1.2);rim.position.set(2,0,2);scene.add(rim);
// Isolate neutral porcelain illumination from the colored flower lights.
camera.layers.enable(1);
const plateFill=new THREE.AmbientLight(0xffffff,2.4);plateFill.layers.set(1);scene.add(plateFill);
const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(renderer),plateEnvironment=pmrem.fromScene(room,.04);room.dispose();pmrem.dispose();
const bloom=lotusFlower(),garden=lotusGarden();scene.add(bloom.group,garden.group);bloom.group.visible=garden.group.visible=false;
let model,pieces=[],meshes=[],materials=[],selected=null,busy=false,state=0,frameId,stream,cameraPending=false,bloomStart=0,bloomEnd=0,gardenStart=0,ending=false;
const repaired=new Set(),markers=new Map(),textureCache=new Map(),texLoader=new THREE.TextureLoader(),ray=new THREE.Raycaster();ray.layers.enable(1);
const debug={ready:false,state:0,phase:'loading',scene,camera,renderer,controls,model:null,bloom,garden};window.plateDemo=debug;
function resize(){camera.aspect=stage.clientWidth/stage.clientHeight;camera.updateProjectionMatrix();renderer.setSize(stage.clientWidth,stage.clientHeight,false);}new ResizeObserver(resize).observe(stage);resize();
function clearSelection(){selected=null;document.querySelectorAll('.choice').forEach(b=>b.setAttribute('aria-pressed','false'));}
function getTexture(n){if(textureCache.has(n))return textureCache.get(n);let timer;const promise=Promise.race([texLoader.loadAsync('./textures/state-'+n+'.jpg'),new Promise((_,reject)=>timer=setTimeout(()=>reject(Error('Texture load timed out')),12000))]).then(t=>{t.flipY=false;t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());return t;}).catch(e=>{textureCache.delete(n);throw e;}).finally(()=>clearTimeout(timer));textureCache.set(n,promise);return promise;}
async function preload(){for(let i=1;i<8;i++){try{await getTexture(i);}catch(e){console.warn('Deferred texture',i);}}}
function updateMarkers(){if(!model)return;for(const p of pieces){const b=markers.get(p.id),v=new THREE.Vector3(...p.pos),n=new THREE.Vector3(...p.normal),screen=v.clone().project(camera);let visible=!busy&&!ending&&!repaired.has(p.id)&&n.dot(camera.position.clone().sub(v).normalize())>.05&&screen.z>-1&&screen.z<1&&Math.abs(screen.x)<1&&Math.abs(screen.y)<1;
 if(visible){ray.set(camera.position,v.clone().sub(camera.position).normalize());const hit=ray.intersectObjects(meshes,false)[0];if(hit&&hit.point.distanceTo(v)>.03)visible=false;}
 b.hidden=!visible;if(visible){b.style.left=(screen.x*.5+.5)*stage.clientWidth+'px';b.style.top=(-screen.y*.5+.5)*stage.clientHeight+'px';}}
}
function select(id){if(busy||ending||repaired.has(id))return;const next=selected===id?null:id;clearSelection();selected=next;if(next)document.getElementById('choice-'+next).setAttribute('aria-pressed','true');}
async function match(p,index){if(busy||ending||selected===null||repaired.has(p.id))return;if(selected!==p.id){clearSelection();return;}busy=true;clearSelection();const next=state|(1<<index),normal=new THREE.Vector3(...p.normal).normalize();
 bloom.group.position.set(...p.pos).addScaledVector(normal,.025);bloom.group.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),normal);bloom.group.visible=true;bloomStart=performance.now();bloomEnd=0;debug.phase='blooming';updateMarkers();
 try{const [texture]=await Promise.all([getTexture(next),new Promise(r=>setTimeout(r,1000))]);for(const m of materials){m.map=texture;m.needsUpdate=true;}state=next;debug.state=state;repaired.add(p.id);document.getElementById('choice-'+p.id).disabled=true;debug.phase='interaction';bloomEnd=performance.now();if(state===7)startGarden();}
 catch(e){console.error(e);bloomEnd=performance.now();debug.phase='interaction';}finally{busy=false;updateMarkers();}
}
function startGarden(){ending=true;gardenStart=performance.now();garden.group.visible=true;const screenUp=new THREE.Vector3(0,1,0).applyQuaternion(camera.quaternion),toward=camera.position.clone().normalize();garden.group.position.copy(screenUp.clone().multiplyScalar(-.32)).addScaledVector(toward,.10);garden.group.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),screenUp.clone().addScaledVector(toward,.4).normalize());debug.phase='growing';document.getElementById('success').hidden=false;}
function animate(now){frameId=requestAnimationFrame(animate);controls.update();if(bloom.group.visible){const t=(now-bloomStart)/1000;bloom.open(Math.min(1,t/.85));bloom.group.scale.setScalar(.73*THREE.MathUtils.smoothstep(t,0,.16));const fade=bloomEnd?1-THREE.MathUtils.smoothstep(now-bloomEnd,0,260):1;bloom.opacity(fade);if(fade<=0)bloom.group.visible=false;}
 if(ending){const t=(now-gardenStart)/1000,fade=garden.update(t),title=document.getElementById('success');title.style.opacity=THREE.MathUtils.smoothstep(t,0,.45)*fade;if(t>=5.5){ending=false;title.hidden=true;debug.phase='complete';}}
 updateMarkers();
 // Two light-isolated passes in ONE WebGL context; preserve plate depth for the flowers.
 renderer.autoClear=false;renderer.clear();camera.layers.set(1);renderer.render(scene,camera);camera.layers.set(0);renderer.render(scene,camera);camera.layers.enable(1);
}
async function init(){try{const [gltf,data]=await Promise.all([new GLTFLoader().loadAsync('./interaction-plate.glb'),fetch('./pieces.json').then(r=>{if(!r.ok)throw Error('Missing anchors');return r.json();})]);model=gltf.scene;pieces=data;scene.add(model);model.updateWorldMatrix(true,true);model.traverse(o=>{if(o.isMesh){o.layers.set(1);meshes.push(o);for(const m of Array.isArray(o.material)?o.material:[o.material]){materials.push(m);m.metalness=0;m.roughness=.8297061324119568;m.envMap=plateEnvironment.texture;m.envMapIntensity=1.05;if('transmission' in m)m.transmission=0;m.needsUpdate=true;}}});
 camera.position.set(0,.12,Math.max(3.7,1.17/(Math.tan(camera.fov*Math.PI/360)*Math.min(1,camera.aspect))));controls.maxDistance=Math.max(8,camera.position.length()*1.6);controls.update();
 for(let i=0;i<pieces.length;i++){const p=pieces[i],b=document.createElement('button');b.className='dot';b.id='hotspot-'+p.id;b.setAttribute('aria-label','将选中的花纹放回此处');b.hidden=true;b.onclick=()=>match(p,i);document.getElementById('markers').append(b);markers.set(p.id,b);document.getElementById('choice-'+p.id).onclick=()=>select(p.id);}
 loading.hidden=true;debug.ready=true;debug.model=model;debug.pieces=pieces;debug.meshes=meshes;debug.materials=materials;debug.updateMarkers=updateMarkers;debug.textureCache=textureCache;debug.phase='interaction';animate(performance.now());preload();
 }catch(e){console.error(e);loading.textContent='加载失败，请刷新重试 / Please reload to try again.';debug.error=String(e);}}
const video=document.getElementById('camera');function stopCamera(){stream?.getTracks().forEach(t=>t.stop());stream=null;video.srcObject=null;stage.classList.remove('camera-on');}
async function startCamera(){if(stream||cameraPending||document.hidden)return;cameraPending=true;try{const next=await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:960},height:{ideal:540}},audio:false});if(document.hidden){next.getTracks().forEach(t=>t.stop());return;}stream=next;video.srcObject=stream;await video.play();stage.classList.add('camera-on');document.getElementById('camera-message').hidden=true;}catch(e){document.getElementById('camera-message').hidden=false;}finally{cameraPending=false;}}
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopCamera();else startCamera();});window.addEventListener('pagehide',()=>{stopCamera();cancelAnimationFrame(frameId);});window.addEventListener('pageshow',e=>{if(e.persisted){startCamera();animate(performance.now());}});startCamera();init();
