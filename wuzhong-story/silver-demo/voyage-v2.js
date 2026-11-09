import * as THREE from 'three';

const radius = 1.31;
const waterY = -.695;
const turn = 2*Math.PI;
export const orbitSeconds = 4.8;
export const fadeSeconds = .65;

function createBoat() {
  const boat = new THREE.Group();
  const ink = new THREE.MeshStandardMaterial({color:0x14201a,roughness:.96});
  const wood = new THREE.MeshStandardMaterial({color:0x25342b,roughness:1});
  const reed = new THREE.MeshStandardMaterial({color:0x3b4940,side:THREE.DoubleSide,roughness:.98});
  const outline = new THREE.Shape();
  outline.moveTo(-.254,0);
  outline.quadraticCurveTo(-.104,.085,.143,.059);
  outline.quadraticCurveTo(.239,.036,.268,0);
  outline.quadraticCurveTo(.208,-.049,.103,-.065);
  outline.quadraticCurveTo(-.11,-.084,-.254,0);
  const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(outline,{
    depth:.036,bevelEnabled:true,bevelSegments:2,steps:1,bevelSize:.012,bevelThickness:.013,curveSegments:12,
  }),ink);
  hull.rotation.x = -Math.PI/2;
  hull.position.y = -.013;
  const floor = new THREE.Mesh(new THREE.ShapeGeometry(outline,12),wood);
  floor.rotation.x = -Math.PI/2;
  floor.position.y = .027;
  floor.scale.set(.85,.82,1);
  const roof = new THREE.Mesh(new THREE.CylinderGeometry(.064,.072,.181,20,1,true,0,Math.PI),reed);
  roof.rotation.z = Math.PI/2;
  roof.position.set(.017,.045,0);
  boat.add(hull,floor,roof);
  const rib = new THREE.TorusGeometry(.067,.004,5,21,Math.PI);
  for (const x of [-.074,-.023,.026,.074,.107]) {
    const bow = new THREE.Mesh(rib,ink);
    bow.rotation.y = Math.PI/2;
    bow.position.set(x,.048,0);
    boat.add(bow);
  }
  const prow = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(.12,.018,0),new THREE.Vector3(.236,.03,0),new THREE.Vector3(.273,.056,0),
  ]),12,.013,7,false),ink);
  boat.add(prow);
  return boat;
}

export function createVoyage(scene) {
  const boat = createBoat();
  const steps = 72;
  const geometry = new THREE.BufferGeometry();
  const position = new THREE.BufferAttribute(new Float32Array((steps+1)*6),3).setUsage(THREE.DynamicDrawUsage);
  const uv = [], indices = [];
  for (let i=0; i<=steps; i++) {
    uv.push(i/steps,0,i/steps,1);
    if (i<steps) {
      const a=i*2;
      indices.push(a,a+1,a+2,a+1,a+3,a+2);
    }
  }
  geometry.setAttribute('position',position);
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.setIndex(indices);
  const material = new THREE.ShaderMaterial({
    uniforms:{time:{value:0},fade:{value:1}},
    transparent:true,depthWrite:false,side:THREE.DoubleSide,
    vertexShader:'varying vec2 q; void main(){q=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}',
    fragmentShader:[
      'varying vec2 q;',
      'uniform float time, fade;',
      'void main(){',
      'float edge=abs(q.y-.5)*2.0;',
      'float wash=sin(q.x*72.0+q.y*8.0)*.11+sin(q.x*109.0-q.y*17.0)*.075;',
      'float body=1.0-smoothstep(.23,.96+wash,edge);',
      'float stroke=sin(q.y*41.0+q.x*13.0-time*2.8)*.5+.5;',
      'float tail=smoothstep(0.0,.38,q.x)*(1.0-smoothstep(.91,1.0,q.x));',
      'vec3 ink=mix(vec3(.055,.086,.073),vec3(.25,.33,.28),.29*stroke+.28*edge);',
      'gl_FragColor=vec4(ink,body*tail*fade*(.61+.16*stroke));',
      '}',
    ].join('\n'),
  });
  const river = new THREE.Mesh(geometry,material);
  river.frustumCulled = false;
  scene.add(river,boat);

  function hide() { boat.visible = river.visible = false; }
  function update(elapsed) {
    boat.visible = river.visible = true;
    const angle = Math.PI*.53 + Math.min(1,elapsed/orbitSeconds)*turn;
    const fade = 1-THREE.MathUtils.smoothstep(elapsed,orbitSeconds,orbitSeconds+fadeSeconds);
    boat.position.set(Math.cos(angle)*radius,waterY+.035,Math.sin(angle)*radius);
    boat.rotation.y = -angle-Math.PI/2;
    boat.scale.setScalar(Math.max(.01,Math.min(1,elapsed*4)*Math.sqrt(fade)));
    material.uniforms.time.value = elapsed;
    material.uniforms.fade.value = fade;
    const length = Math.min(1.51,.28+elapsed*1.18);
    for (let i=0;i<=steps;i++) {
      const u=i/steps, a=angle+.10-(1-u)*length;
      const width=.151*(.57+.43*Math.sin(u*Math.PI))*(1+.12*Math.sin(u*16+elapsed*2));
      for (let side=0;side<2;side++) {
        const r=radius+(side?1:-1)*width;
        position.setXYZ(i*2+side,Math.cos(a)*r,waterY,Math.sin(a)*r);
      }
    }
    position.needsUpdate=true;
  }
  hide();
  return {update,hide};
}
