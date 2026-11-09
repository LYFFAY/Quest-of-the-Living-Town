import * as THREE from 'three';
import { OrbitControls } from '../vendor/OrbitControls.js';
import { lightScene, loadCup } from './model.js';
import { createTeapot } from './teapot.js';
import { createWater, gravity, mouth, waterLevel } from './water.js';
import { createVoyage, orbitSeconds, fadeSeconds } from './voyage-v2.js';
import { connectActivity, completeActivity } from './story-bridge.js';

const stage = document.querySelector('#stage');
const canvas = document.querySelector('#scene');
const tool = document.querySelector('#teapot-tool');
const ghost = document.querySelector('#drag-ghost');
const guide = document.querySelector('#pour-guide');
const hint = document.querySelector('#hint');
const success = document.querySelector('#success');
const loading = document.querySelector('#loading');
const video = document.querySelector('#camera');
const renderer = new THREE.WebGLRenderer({canvas,alpha:true,antialias:true});
renderer.setClearAlpha(0);
renderer.setPixelRatio(Math.min(devicePixelRatio,1.5));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.19;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(36,1,.02,32);
const controls = new OrbitControls(camera,canvas);
controls.enableDamping = true;
controls.enablePan = false;
const environment = lightScene(scene,renderer);
const pot = createTeapot();
scene.add(pot.group);
const water = createWater(scene);
const voyage = createVoyage(scene);
const {clamp,damp,smoothstep} = THREE.MathUtils;
const zAxis = new THREE.Vector3(0,0,1);
const nozzle = new THREE.Vector3(), velocity = new THREE.Vector3();
const tipOffset = new THREE.Vector3(), project = new THREE.Vector3();
const potBounds = new THREE.Box3();
const dockFrom = new THREE.Vector3(), dockTo = new THREE.Vector3();
const nativeTouch = 'ontouchstart' in window;
let cup, phase = 'loading', placement, grip, stream, pendingCamera;
let fill = 0, tilt = 0, wantedTilt = 0, flow = 0, spillAmount = 0, phaseTime = 0;
let previousTime, frameId, active = true;
let liftingView = false;
controls.addEventListener('start', () => { liftingView = false; });

function changePhase(value) {
  phase = value;
  phaseTime = 0;
  stage.dataset.phase = value;
}

function resize() {
  const width = stage.clientWidth, height = stage.clientHeight;
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
  renderer.setSize(width,height,false);
  const distance = Math.max(4.15, 1.61/(Math.tan(Math.PI/10)*Math.min(1,camera.aspect)));
  controls.target.set(0,.025,0);
  camera.position.copy(new THREE.Vector3(-.10,.54,1).normalize().multiplyScalar(distance)).add(controls.target);
  controls.minDistance = distance*.45;
  controls.maxDistance = distance*2.4;
  controls.update();
}
new ResizeObserver(resize).observe(stage);
resize();

function screenPoint(world) {
  project.copy(world).project(camera);
  const rect = canvas.getBoundingClientRect();
  return {x:rect.left+(project.x+1)*rect.width/2,y:rect.top+(1-project.y)*rect.height/2};
}

function overMouth(x,y,touch) {
  const rect = canvas.getBoundingClientRect();
  if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) return false;
  const center = screenPoint(mouth);
  const rim = screenPoint(mouth.clone().add(new THREE.Vector3(.125,0,0)));
  const rimWidth = Math.abs(rim.x-center.x);
  const radius = touch ? clamp(rimWidth+24,40,63) : clamp(rimWidth+11,24,48);
  return Math.hypot(center.x-x,center.y-y) <= radius;
}

function moveGhost(point) {
  ghost.style.left = point.clientX+'px';
  ghost.style.top = point.clientY+'px';
}

// Native touch events keep the original target for the whole gesture, including
// when a finger leaves the tool and moves across the canvas inside the story.
function bindTouchDrag(target,start,move,finish) {
  let fingerId;
  function end(point,released) {
    fingerId = undefined;
    finish(point,released);
  }
  target.addEventListener('touchstart', event => {
    if (event.touches.length !== 1) {
      if (fingerId !== undefined) end(null,false);
      return;
    }
    const finger = event.changedTouches[0];
    if (fingerId !== undefined || !start(finger)) return;
    fingerId = finger.identifier;
    if (event.cancelable) event.preventDefault();
  }, {passive:false});
  target.addEventListener('touchmove', event => {
    if (fingerId === undefined) return;
    if (event.touches.length !== 1) { end(null,false); return; }
    const finger = Array.from(event.changedTouches).find(point => point.identifier === fingerId);
    if (!finger) return;
    if (event.cancelable) event.preventDefault();
    move(finger);
  }, {passive:false});
  for (const type of ['touchend','touchcancel']) {
    target.addEventListener(type, event => {
      if (fingerId === undefined) return;
      const finger = Array.from(event.changedTouches).find(point => point.identifier === fingerId);
      if (!finger) return;
      if (event.cancelable) event.preventDefault();
      end(finger,type === 'touchend');
    }, {passive:false});
  }
}

function startPlacement(point,id) {
  if (phase !== 'place' || placement) return false;
  placement = {id,x:point.clientX,y:point.clientY,moved:false};
  tool.classList.add('dragging');
  ghost.hidden = false;
  moveGhost(point);
  return true;
}
function updatePlacement(point) {
  if (!placement) return;
  placement.moved ||= Math.hypot(point.clientX-placement.x,point.clientY-placement.y)>5;
  moveGhost(point);
}

function finishPlacement(point,released,touch) {
  if (!placement) return;
  const dock = released && placement.moved && overMouth(point.clientX,point.clientY,touch);
  placement = undefined;
  ghost.hidden = true;
  tool.classList.remove('dragging');
  if (!dock) return;
  dockFrom.copy(camera.position);
  const viewpoint = new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target));
  viewpoint.phi = Math.min(viewpoint.phi,.935);
  dockTo.setFromSpherical(viewpoint).add(controls.target);
  liftingView = true;
  tool.disabled = true;
  tool.classList.add('docked');
  pot.group.visible = true;
  guide.hidden = false;
  changePhase('pour');
}
bindTouchDrag(tool,startPlacement,updatePlacement,(point,released) => finishPlacement(point,released,true));
tool.addEventListener('pointerdown', event => {
  if ((nativeTouch && event.pointerType === 'touch') || event.button !== 0) return;
  if (!startPlacement(event,event.pointerId)) return;
  event.preventDefault();
  tool.setPointerCapture(event.pointerId);
});
tool.addEventListener('pointermove', event => {
  if (placement?.id === event.pointerId) updatePlacement(event);
});
for (const type of ['pointerup','pointercancel','lostpointercapture']) {
  tool.addEventListener(type, event => {
    if (placement?.id === event.pointerId) finishPlacement(event,type === 'pointerup',event.pointerType === 'touch');
  });
}

function nearPot(x,y,padding=18) {
  potBounds.setFromObject(pot.group);
  let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
  for (const px of [potBounds.min.x,potBounds.max.x]) {
    for (const py of [potBounds.min.y,potBounds.max.y]) {
      for (const pz of [potBounds.min.z,potBounds.max.z]) {
        const point = screenPoint(new THREE.Vector3(px,py,pz));
        minX=Math.min(minX,point.x); maxX=Math.max(maxX,point.x);
        minY=Math.min(minY,point.y); maxY=Math.max(maxY,point.y);
      }
    }
  }
  return x >= minX-padding && x <= maxX+padding && y >= minY-padding && y <= maxY+padding;
}
function startGrip(point,id,touch=false) {
  if (phase !== 'pour' || grip || !nearPot(point.clientX,point.clientY,touch?28:18)) return false;
  liftingView = false;
  controls.enableRotate = false;
  grip = {id,y:point.clientY,tilt};
  return true;
}
function updateGrip(point) {
  if (phase !== 'pour' || !grip) return;
  wantedTilt = clamp(grip.tilt+(grip.y-point.clientY)*.0108,-.23,1.24);
}
bindTouchDrag(canvas,point=>startGrip(point,undefined,true),updateGrip,releaseGrip);
canvas.addEventListener('pointerdown', event => {
  if (event.pointerType === 'touch' && grip && event.pointerId !== grip.id) {
    releaseGrip();
    return;
  }
  if (!event.isPrimary || event.button !== 0) return;
  if (nativeTouch && event.pointerType === 'touch') {
    // OrbitControls still tracks the finger so a second finger can start pinch zoom.
    if (phase === 'pour' && nearPot(event.clientX,event.clientY,28)) controls.enableRotate = false;
    return;
  }
  if (!startGrip(event,event.pointerId)) return;
  event.preventDefault();
  canvas.setPointerCapture(event.pointerId);
}, {capture:true});
canvas.addEventListener('pointermove', event => {
  if (phase !== 'pour') return;
  if (grip?.id === event.pointerId) {
    updateGrip(event);
  } else if (event.pointerType === 'mouse' && !event.buttons) {
    canvas.style.cursor = nearPot(event.clientX,event.clientY) ? 'ns-resize' : 'grab';
  }
});
function releaseGrip() {
  grip = undefined;
  wantedTilt = 0;
  controls.enableRotate = true;
}
for (const name of ['pointerup','pointercancel','lostpointercapture']) {
  canvas.addEventListener(name, event => {
    if (grip?.id === event.pointerId) releaseGrip();
    else if (!grip && event.pointerType === 'touch') controls.enableRotate = true;
  });
}

function placePot() {
  pot.group.rotation.z = tilt;
  const height = .86-.195*Math.sin(tilt);
  nozzle.copy(mouth);
  nozzle.y += height;
  velocity.copy(pot.direction).applyAxisAngle(zAxis,tilt).multiplyScalar(.21+.14*flow);
  const drop = nozzle.y-waterLevel(fill);
  const flight = (velocity.y+Math.sqrt(velocity.y**2+2*gravity*drop))/gravity;
  nozzle.x -= velocity.x*flight;
  nozzle.z -= velocity.z*flight;
  tipOffset.copy(pot.tip).multiplyScalar(pot.group.scale.x).applyAxisAngle(zAxis,tilt);
  pot.group.position.copy(nozzle).sub(tipOffset);
  pot.group.updateMatrixWorld(true);
  if (!guide.hidden) {
    const handle = screenPoint(pot.group.localToWorld(pot.handle.clone()));
    const rect = stage.getBoundingClientRect();
    guide.style.left = handle.x-rect.left+8+'px';
    guide.style.top = handle.y-rect.top+'px';
  }
}

function startVoyage() {
  changePhase('voyage');
  success.hidden = false;
  guide.hidden = true;
  canvas.style.cursor = 'grab';
}

function animate(timestamp) {
  if (!active) return;
  frameId = requestAnimationFrame(animate);
  const dt = previousTime === undefined ? 0 : Math.min(.05,(timestamp-previousTime)/1000);
  previousTime = timestamp;
  phaseTime += dt;
  if (liftingView) {
    camera.position.lerpVectors(dockFrom,dockTo,smoothstep(phaseTime,0,.53));
    liftingView = phaseTime < .53;
  }
  controls.update();
  camera.updateMatrixWorld();

  if (phase === 'pour' || phase === 'spill') {
    tilt = damp(tilt,wantedTilt,13,dt);
    flow = smoothstep(tilt,.64,1.12);
    if (phase === 'pour') {
      fill = Math.min(1,fill+flow*.37*dt);
      if (fill >= 1) {
        changePhase('spill');
        grip = undefined;
        controls.enableRotate = true;
        guide.hidden = true;
      }
    }
    if (phase === 'spill') {
      spillAmount = smoothstep(phaseTime,0,.13)*(1-smoothstep(phaseTime,.42,.84));
      if (phaseTime > .24) wantedTilt = 0;
      if (phaseTime >= .86) startVoyage();
    }
    placePot();
  } else if (phase === 'voyage') {
    spillAmount = flow = 0;
    if (phaseTime < .53) {
      const lift = smoothstep(phaseTime,0,.53);
      tilt = damp(tilt,0,13,dt);
      placePot();
      pot.group.position.y += lift*.55;
      pot.group.scale.setScalar(.83*(1-.5*lift));
    } else pot.group.visible = false;
    voyage.update(phaseTime);
    if (phaseTime >= orbitSeconds+fadeSeconds) {
      voyage.hide();
      success.hidden = true;
      changePhase('complete');
      completeActivity();
    }
  }
  water.update({nozzle,velocity,fill,flow,spillAmount,now:timestamp/1000});
  renderer.render(scene,camera);
}

function startInteraction() {
  pot.group.visible = false;
  pot.group.scale.setScalar(.83);
  tool.disabled = false;
  hint.textContent = '滑动查看不同角度，手机双指缩放，电脑滚轮缩放';
  hint.hidden = false;
  canvas.style.cursor = 'grab';
  changePhase('place');
}

async function startCamera() {
  if (stream || pendingCamera || document.hidden || !navigator.mediaDevices?.getUserMedia) return;
  pendingCamera = true;
  try {
    const next = await navigator.mediaDevices.getUserMedia({video:{facingMode:{ideal:'environment'},width:{ideal:960},height:{ideal:540}},audio:false});
    if (!active || document.hidden) { next.getTracks().forEach(track=>track.stop()); return; }
    stream = next;
    video.srcObject = stream;
    await video.play();
  } catch {
    stopCamera();
  } finally { pendingCamera = false; }
}
function stopCamera() {
  stream?.getTracks().forEach(track=>track.stop());
  stream = undefined;
  video.srcObject = null;
}
connectActivity(() => {
  active = false;
  cancelAnimationFrame(frameId);
  stopCamera();
});
document.addEventListener('visibilitychange',()=>document.hidden?stopCamera():startCamera());
addEventListener('pagehide',event=>{
  active = false;
  stopCamera();
  cancelAnimationFrame(frameId);
  if (!event.persisted) { environment.dispose(); renderer.dispose(); }
});
addEventListener('pageshow',event=>{
  if (!event.persisted) return;
  active = true;
  previousTime = undefined;
  frameId = requestAnimationFrame(animate);
  startCamera();
});
try {
  cup = await loadCup();
  scene.add(cup);
  loading.hidden = true;
  startInteraction();
  frameId = requestAnimationFrame(animate);
  startCamera();
} catch (cause) {
  loading.textContent = '银槎杯加载失败，请刷新页面重试。';
  console.error(cause);
}
