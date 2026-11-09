import * as THREE from 'three';
import { MindARThree } from '../vendor/mindar-image-three.prod.js';
import { lightScene, loadCup } from './model.js';
import { connectActivity, enterInteraction } from './story-bridge.js';

const stage = document.querySelector('#ar-stage');
const begin = document.querySelector('#begin');
const retry = document.querySelector('#retry');
const status = document.querySelector('#tracking-status');
const guide = document.querySelector('#scan-guide');
const error = document.querySelector('#error');
let tracker, anchor, startPending, running = false, unlocked = false, leaving = false;

async function setup() {
  const cup = await loadCup();
  tracker = new MindARThree({
    container: stage, imageTargetSrc: './assets/target.mind', maxTrack: 1,
    uiLoading: 'no', uiScanning: 'no', uiError: 'no', warmupTolerance: 5, missTolerance: 5,
  });
  tracker.renderer.setPixelRatio(Math.min(devicePixelRatio, 1.5));
  tracker.renderer.toneMapping = THREE.ACESFilmicToneMapping;
  tracker.renderer.toneMappingExposure = 1.13;
  lightScene(tracker.scene, tracker.renderer);
  anchor = tracker.addAnchor(0);
  const pose = new THREE.Group();
  pose.rotation.x = .32;
  pose.scale.setScalar((stage.clientWidth < 600 ? .54 : .66) / 2.28);
  pose.position.set(0, 0, .12);
  pose.add(cup);
  anchor.group.add(pose);
  anchor.onTargetFound = () => {
    if (leaving) return;
    unlocked = true;
    begin.disabled = false;
    guide.hidden = true;
    status.textContent = '识别成功';
    stage.dataset.tracking = 'found';
  };
  anchor.onTargetLost = () => {
    stage.dataset.tracking = 'lost';
    guide.hidden = unlocked;
    status.textContent = unlocked ? '已识别，可开始互动' : '请对准银槎杯识别图';
  };
}

function stop() {
  tracker?.renderer.setAnimationLoop(null);
  tracker?.controller?.stopProcessVideo();
  const video = tracker?.video;
  video?.srcObject?.getTracks().forEach(track => track.stop());
  video?.remove();
  if (anchor) anchor.group.visible = false;
  running = false;
}

function start() {
  if (startPending || running || leaving || document.hidden) return;
  startPending = (async () => {
    retry.hidden = true;
    error.hidden = true;
    try {
      if (!isSecureContext || !navigator.mediaDevices?.getUserMedia) throw new Error('secure camera required');
      if (!tracker) await setup();
      if (leaving || document.hidden) return;
      await tracker.start();
      if (leaving || document.hidden) { stop(); return; }
      running = true;
      status.textContent = unlocked ? '已识别，可开始互动' : '请对准银槎杯识别图';
      tracker.renderer.setAnimationLoop(() => tracker.renderer.render(tracker.scene, tracker.camera));
    } catch (cause) {
      stop();
      console.error(cause);
      status.textContent = '摄像头未开启';
      error.textContent = '请在 HTTPS 页面允许摄像头访问后重试。';
      error.hidden = false;
      retry.hidden = false;
    }
  })().finally(() => { startPending = null; });
}

begin.addEventListener('click', () => {
  if (!unlocked || leaving) return;
  leaving = true;
  stop();
  tracker.renderer.dispose();
  enterInteraction();
});
retry.addEventListener('click', start);
document.addEventListener('visibilitychange', () => document.hidden ? stop() : start());
addEventListener('pagehide', stop);
addEventListener('pageshow', event => {
  if (event.persisted) {
    leaving = false;
    tracker = null;
    start();
  }
});
connectActivity(() => { leaving = true; stop(); });
start();
