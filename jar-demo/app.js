import * as THREE from 'three';
import {GLTFLoader} from './vendor/GLTFLoader.js';
import {MindARThree} from './vendor/mindar-image-three.prod.js';
import {RoomEnvironment} from './vendor/RoomEnvironment.js';

const stage=document.getElementById('ar-stage'),status=document.getElementById('tracking-status'),guide=document.getElementById('scan-guide'),begin=document.getElementById('begin'),retry=document.getElementById('retry'),error=document.getElementById('error'),frame=document.getElementById('interaction');
let ar=null,anchor=null,starting=false,running=false,mode='ar',unlocked=false,epoch=0;
const notice=(zh,en)=>{status.replaceChildren(document.createTextNode(zh));const span=document.createElement('span');span.textContent=en;status.append(span);};
function showError(e){console.error(e);notice('AR暂时无法开启','AR could not start');error.hidden=false;error.textContent=e.name==='NotAllowedError'?'请允许摄像头访问，并通过HTTPS在Safari或Chrome中打开。 / Allow camera access and open over HTTPS in Safari or Chrome.':'请检查摄像头权限或关闭其他占用摄像头的应用，再重试。 / Check camera permissions, close other camera apps, then retry.';retry.hidden=false;}
async function setup(){
 ar=new MindARThree({container:stage,imageTargetSrc:'./target.mind',maxTrack:1,uiLoading:'no',uiScanning:'no',uiError:'no',warmupTolerance:5,missTolerance:5});
 ar.renderer.setPixelRatio(Math.min(devicePixelRatio,2));
 ar.renderer.toneMapping=THREE.ACESFilmicToneMapping;ar.renderer.toneMappingExposure=1.2;
 ar.scene.add(new THREE.AmbientLight(0xffffff,1.3));
 const light=new THREE.DirectionalLight(0xfff8e9,1.3);light.position.set(-2,3,5);ar.scene.add(light);
 const room=new RoomEnvironment(),pmrem=new THREE.PMREMGenerator(ar.renderer);ar.scene.environment=pmrem.fromScene(room,.04).texture;room.dispose();pmrem.dispose();
 anchor=ar.addAnchor(0);
 const gltf=await new GLTFLoader().loadAsync('./jar.glb');
 const texture=await new THREE.TextureLoader().loadAsync('./complete.jpg');texture.flipY=false;texture.colorSpace=THREE.SRGBColorSpace;
 gltf.scene.traverse(o=>{if(o.isMesh){for(const material of (Array.isArray(o.material)?o.material:[o.material])){material.map=texture;if('transmission' in material)material.transmission=0;material.roughness=.9;material.metalness=0;material.needsUpdate=true;}}});
 const bounds=new THREE.Box3().setFromObject(gltf.scene),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
 const centered=new THREE.Group();gltf.scene.position.sub(center);centered.add(gltf.scene);
 const root=new THREE.Group();root.add(centered);const scale=.85/Math.max(size.x,size.y);root.scale.setScalar(scale);root.rotation.x=Math.PI/2;root.position.set(0,0,size.y*scale/2+.025);anchor.group.add(root);stage.dataset.pose='upright';
 anchor.onTargetFound=()=>{if(mode!=='ar')return;stage.dataset.tracking='found';unlocked=true;begin.disabled=false;guide.hidden=true;notice('识别成功 · 移动手机观察文物','Target found · Move your phone to explore');};
 anchor.onTargetLost=()=>{if(mode!=='ar')return;stage.dataset.tracking='lost';guide.hidden=false;notice('请重新对准识别图片','Point your camera at the target image again');};
}
function stop(){epoch++;running=false;ar?.renderer.setAnimationLoop(null);if(ar?.controller)ar.controller.stopProcessVideo();const video=ar?.video;if(video){video.srcObject?.getTracks().forEach(t=>t.stop());video.remove();}if(anchor){anchor.group.visible=false;anchor.visible=false;}}
async function start(){if(starting||running||mode!=='ar'||document.hidden)return;starting=true;const token=epoch;error.hidden=true;retry.hidden=true;try{if(!isSecureContext||!navigator.mediaDevices?.getUserMedia)throw Error('HTTPS camera unavailable');notice('正在开启摄像头…','Starting camera…');if(!ar)await setup();if(mode!=='ar'||document.hidden||token!==epoch)return;await ar.start();if(mode!=='ar'||document.hidden||token!==epoch){stop();return;}running=true;notice('请对准识别图片','Point your camera at the target image');ar.renderer.setAnimationLoop(()=>ar.renderer.render(ar.scene,ar.camera));}catch(e){stop();showError(e);}finally{starting=false;}}
begin.addEventListener('click',()=>{if(!unlocked||mode!=='ar')return;mode='interaction';stop();ar.renderer.dispose();ar.renderer.forceContextLoss();window.location.assign('./interaction.html?v=jar1');});
retry.addEventListener('click',start);
document.addEventListener('visibilitychange',()=>{if(mode!=='ar')return;if(document.hidden)stop();else start();});window.addEventListener('pagehide',stop);window.addEventListener('pageshow',()=>{if(mode==='ar')start();});start();
