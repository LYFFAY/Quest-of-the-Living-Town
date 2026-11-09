import * as THREE from 'three';

function clayMaterial() {
  const canvas = document.createElement('canvas');
  canvas.width = canvas.height = 192;
  const ctx = canvas.getContext('2d');
  const image = ctx.createImageData(192,192);
  let seed = 1947;
  for (let y=0; y<192; y++) {
    for (let x=0; x<192; x++) {
      seed = (Math.imul(seed,1664525)+1013904223)>>>0;
      const wear = 4*Math.sin(x*.071+y*.058)+3*Math.sin(x*.41-y*.38)+(seed/4294967296-.5)*19;
      image.data.set([83+wear,65+wear*.83,52+wear*.64,255], (y*192+x)*4);
    }
  }
  ctx.putImageData(image,0,0);
  const map = new THREE.CanvasTexture(canvas);
  map.colorSpace = THREE.SRGBColorSpace;
  return new THREE.MeshStandardMaterial({map,roughness:.72,metalness:.08});
}

export function createTeapot() {
  const group = new THREE.Group();
  const clay = clayMaterial();
  const seam = new THREE.MeshStandardMaterial({color:0x4b372e,roughness:.81});
  const edge = new THREE.MeshStandardMaterial({color:0x604a38,roughness:.64,metalness:.12});
  function lathe(points, material=clay) {
    const profile = points.map(([r,y])=>new THREE.Vector2(r,y));
    group.add(new THREE.Mesh(new THREE.LatheGeometry(profile,56),material));
  }
  lathe([[0,-.265],[.17,-.265],[.194,-.253],[.253,-.22],[.296,-.174],[.323,-.11],[.331,-.035],[.321,.041],[.296,.104],[.25,.149],[.199,.178],[.191,.201],[0,.201]]);
  lathe([[.164,-.277],[.192,-.276],[.20,-.265],[.199,-.252],[.167,-.249]],edge);
  lathe([[0,.187],[.204,.187],[.210,.196],[.207,.209],[.188,.225],[.147,.242],[.089,.251],[0,.253]]);
  lathe([[0,.247],[.03,.247],[.038,.262],[.054,.274],[.054,.292],[.042,.308],[.021,.313],[0,.314]]);
  lathe([[.193,.18],[.204,.18],[.207,.188],[.205,.195],[.194,.196]],seam);
  lathe([[.299,-.173],[.300,-.17],[.303,-.165],[.303,-.161],[.299,-.161]],edge);

  const path = new THREE.CatmullRomCurve3([[-.243,-.124],[-.377,-.085],[-.48,.036],[-.568,.176],[-.667,.249]].map(([x,y])=>new THREE.Vector3(x,y,0)));
  const spout = new THREE.TubeGeometry(path,28,.075,16,false);
  const positions = spout.attributes.position, point = new THREE.Vector3();
  for (let ring=0; ring<=28; ring++) {
    const center = path.getPointAt(ring/28);
    const radius = THREE.MathUtils.lerp(1.12,.48,ring/28);
    for (let side=0; side<=16; side++) {
      const index = ring*17+side;
      point.fromBufferAttribute(positions,index).sub(center).multiplyScalar(radius).add(center);
      positions.setXYZ(index,point.x,point.y,point.z);
    }
  }
  spout.computeVertexNormals();
  group.add(new THREE.Mesh(spout,clay));
  const tip = path.getPointAt(1), direction = path.getTangentAt(1);
  const lip = new THREE.Mesh(new THREE.TorusGeometry(.032,.0048,8,28),edge);
  lip.position.copy(tip);
  lip.quaternion.setFromUnitVectors(new THREE.Vector3(0,0,1),direction);
  const opening = new THREE.Mesh(new THREE.CircleGeometry(.030,24),seam);
  opening.position.copy(tip).addScaledVector(direction,-.007);
  opening.quaternion.copy(lip.quaternion);
  group.add(lip,opening);
  const handle = new THREE.CatmullRomCurve3([[.267,.095],[.438,.178],[.571,.11],[.565,-.048],[.437,-.172],[.281,-.166]].map(([x,y])=>new THREE.Vector3(x,y,0)));
  group.add(new THREE.Mesh(new THREE.TubeGeometry(handle,32,.037,12,false),clay));
  group.scale.setScalar(.83);
  group.visible = false;
  return {group,tip,direction,handle:new THREE.Vector3(.57,.045,0)};
}
