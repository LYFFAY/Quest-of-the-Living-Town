import * as THREE from 'three';

// The rim polygon was sampled from the top view of the supplied GLB.
export const mouth = new THREE.Vector3(-.997,-.338,.155);
const rimOutline = [[119,314],[127,307],[142,307],[152,312],[166,316],[182,320],[186,334],[181,350],[172,368],[160,382],[151,386],[138,381],[129,371],[123,356],[122,342],[117,326]];
const spillLip = new THREE.Vector3(-.993,-.378,.288);
const {clamp,lerp} = THREE.MathUtils;
export const gravity = 7.2;
export function waterLevel(fill) {
  return lerp(-.495,-.374,Math.sqrt(clamp(fill,0,1)));
}

function makeTube(material, segments=32, sides=10) {
  const geometry = new THREE.BufferGeometry();
  const positions = new THREE.BufferAttribute(new Float32Array((segments+1)*sides*3),3).setUsage(THREE.DynamicDrawUsage);
  const indices = [];
  for (let i=0; i<segments; i++) {
    for (let j=0; j<sides; j++) {
      const a=i*sides+j, b=i*sides+(j+1)%sides;
      indices.push(a,b,a+sides,b,b+sides,a+sides);
    }
  }
  geometry.setAttribute('position',positions);
  geometry.setIndex(indices);
  const mesh = new THREE.Mesh(geometry,material);
  mesh.frustumCulled = false;
  mesh.visible = false;
  const center = new THREE.Vector3(), next = new THREE.Vector3(), tangent = new THREE.Vector3();
  const sideways = new THREE.Vector3(), upright = new THREE.Vector3(), reference = new THREE.Vector3(0,0,1);
  function update(sample,radius) {
    for (let i=0; i<=segments; i++) {
      const u=i/segments;
      sample(u,center);
      sample(u+.001,next);
      tangent.subVectors(next,center).normalize();
      sideways.crossVectors(tangent,reference).normalize();
      upright.crossVectors(tangent,sideways);
      const r=radius(u);
      for (let j=0; j<sides; j++) {
        const angle=2*Math.PI*j/sides;
        const c=r*Math.cos(angle), s=r*Math.sin(angle);
        positions.setXYZ(i*sides+j,center.x+sideways.x*c+upright.x*s,center.y+sideways.y*c+upright.y*s,center.z+sideways.z*c+upright.z*s);
      }
    }
    positions.needsUpdate = true;
    geometry.computeVertexNormals();
    mesh.visible = true;
  }
  return {mesh,update};
}

export function createWater(scene) {
  const material = new THREE.MeshPhysicalMaterial({
    color:0xa4c8c4,roughness:.08,metalness:.15,ior:1.333,
    transmission:.18,thickness:.018,transparent:true,opacity:.52,
    depthWrite:false,side:THREE.DoubleSide,envMapIntensity:1.23,
  });
  const stream = makeTube(material), spill = makeTube(material.clone(),21,8);
  const shape = new THREE.Shape();
  for (const [i,[px,py]] of rimOutline.entries()) {
    const x=(px-450)/300-mouth.x, z=(py-300)/300-mouth.z;
    if(i) shape.lineTo(x,-z); else shape.moveTo(x,-z);
  }
  shape.closePath();
  const level = new THREE.Mesh(new THREE.ShapeGeometry(shape),material.clone());
  level.rotation.x = -Math.PI/2;
  level.material.color.set(0xaacbc7);
  level.material.opacity = .82;
  level.material.roughness = .17;
  level.renderOrder = 1;
  level.visible = false;
  const rings = Array.from({length:3},()=>{
    const ring = new THREE.Mesh(new THREE.RingGeometry(.94,1,48),new THREE.MeshBasicMaterial({
      color:0xe1f1eb,transparent:true,opacity:.1,depthWrite:false,side:THREE.DoubleSide,
    }));
    ring.rotation.x = -Math.PI/2;
    ring.renderOrder = 2;
    ring.visible = false;
    return ring;
  });
  const droplets = new THREE.InstancedMesh(new THREE.SphereGeometry(1,7,5),material,24);
  droplets.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  droplets.frustumCulled = false;
  droplets.count = 0;
  const drop = new THREE.Object3D();
  scene.add(level,...rings,stream.mesh,spill.mesh,droplets);
  function update({nozzle,velocity,fill,flow,spillAmount,now}) {
    const y=waterLevel(fill), spread=lerp(.50,.965,Math.sqrt(clamp(fill,0,1)));
    level.visible = fill>.025;
    level.position.set(mouth.x,y,mouth.z);
    level.scale.set(spread,spread,1);
    for (const [i,ring] of rings.entries()) {
      const age=(now*(.74+.65*flow)+i/3)%1;
      ring.visible=level.visible;
      ring.position.set(mouth.x,y+.0018+i*.00035,mouth.z);
      ring.scale.set(.107*spread*(.25+.71*age),.121*spread*(.25+.71*age),1);
      ring.material.opacity=(1-age)*(.09+.31*flow);
    }
    stream.mesh.visible = spill.mesh.visible = false;
    if (flow>.012) {
      const fall=(velocity.y+Math.sqrt(velocity.y**2+2*gravity*(nozzle.y-y)))/gravity;
      stream.update((u,out)=>{
        const t=u*fall;
        out.copy(nozzle).addScaledVector(velocity,t);
        out.y-=.5*gravity*t*t;
        out.z+=Math.sin(u*26-now*22)*.003*u;
      },u=>(.010+.017*Math.sqrt(flow))*lerp(1,.69,u)*(1+.08*Math.sin(u*27-now*37)));
    }
    if (spillAmount>.012) {
      spill.update((u,out)=>{
        out.set(spillLip.x-.045*u,spillLip.y-.26*u*u,spillLip.z+.10*u);
      },u=>.0125*Math.sqrt(spillAmount)*lerp(1,.56,u));
    }
    const splash=Math.max(flow,spillAmount*.8);
    droplets.count=splash>.04?Math.floor(10+splash*10):0;
    for (let i=0; i<droplets.count; i++) {
      const angle=i*2.39996, age=(now*(1.9+(i%5)*.24)+i*.137)%1;
      const radius=(.035+.037*splash)*age, origin=spillAmount>flow?spillLip:mouth;
      drop.position.set(origin.x+Math.cos(angle)*radius,(origin===mouth?y:spillLip.y)+.058*4*age*(1-age),origin.z+Math.sin(angle)*radius);
      drop.scale.setScalar((.004+(i%3)*.0016)*Math.sqrt(splash)*(1-age*.5));
      drop.updateMatrix();
      droplets.setMatrixAt(i,drop.matrix);
    }
    droplets.instanceMatrix.needsUpdate=true;
  }
  return {update};
}
