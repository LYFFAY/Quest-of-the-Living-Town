import * as THREE from 'three';
import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { RoomEnvironment } from '../vendor/RoomEnvironment.js';

export async function loadCup() {
  const { scene } = await new GLTFLoader().loadAsync(new URL('./assets/cup.glb', import.meta.url).href);
  const bounds = new THREE.Box3().setFromObject(scene);
  const center = bounds.getCenter(new THREE.Vector3());
  const size = bounds.getSize(new THREE.Vector3());
  scene.position.sub(center);
  const cup = new THREE.Group();
  cup.add(scene);
  cup.scale.setScalar(2.28 / Math.max(size.x, size.y, size.z));
  cup.traverse(mesh => {
    if (!mesh.isMesh) return;
    for (const material of Array.isArray(mesh.material) ? mesh.material : [mesh.material]) {
      material.transmission = 0;
      material.opacity = 1;
      material.transparent = false;
      material.depthWrite = true;
      material.metalness = .22;
      material.roughness = .57;
      if ('specularIntensity' in material) material.specularIntensity = .55;
      material.envMapIntensity = .85;
      material.needsUpdate = true;
    }
  });
  cup.updateMatrixWorld(true);
  return cup;
}

export function lightScene(scene, renderer) {
  scene.add(new THREE.HemisphereLight(0xfff9eb, 0xa6b3a7, 1.65));
  const key = new THREE.DirectionalLight(0xfff4df, 2.6);
  key.position.set(-2, 4, 4);
  const rim = new THREE.DirectionalLight(0xe3f2f0, 1.25);
  rim.position.set(2, 2, -3);
  scene.add(key, rim);
  const room = new RoomEnvironment();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const environment = pmrem.fromScene(room, .045);
  scene.environment = environment.texture;
  room.dispose();
  pmrem.dispose();
  return environment;
}
