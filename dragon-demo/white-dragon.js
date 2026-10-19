import * as THREE from 'three';
import {sparkCloud} from './effects.js';

// A long volumetric dragon follows a continuous curve around the vessel. Its
// head, scales, four limbs and tail all use the same delayed flight frame.
export function whiteDragon(scene){
 const root=new THREE.Group();root.visible=false;scene.add(root);
 const pearl=new THREE.MeshStandardMaterial({color:0xd8dfdf,roughness:.5,metalness:.16,emissive:0x10191c,emissiveIntensity:.16,transparent:true});
 const ridge=new THREE.MeshStandardMaterial({color:0xaebfc2,roughness:.46,metalness:.30,transparent:true});
 const horn=new THREE.MeshStandardMaterial({color:0xd4cbb6,roughness:.55,metalness:.08,transparent:true});
 const dark=new THREE.MeshStandardMaterial({color:0x222f32,roughness:.7,transparent:true});
 const iris=new THREE.MeshStandardMaterial({color:0x9a6632,roughness:.4,metalness:.2,transparent:true});
 const materials=[pearl,ridge,horn,dark,iris];
 function tapered(points,radii,material=pearl){
  const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments=28,sides=7,geo=new THREE.TubeGeometry(curve,segments,1,sides,false),pa=geo.attributes.position;
  for(let i=0;i<=segments;i++){const u=i/segments,c=curve.getPointAt(u),k=u*(radii.length-1),lo=Math.floor(k),r=THREE.MathUtils.lerp(radii[lo],radii[Math.min(lo+1,radii.length-1)],k-lo);for(let s=0;s<=sides;s++){const j=i*(sides+1)+s;pa.setXYZ(j,c.x+(pa.getX(j)-c.x)*r,c.y+(pa.getY(j)-c.y)*r,c.z+(pa.getZ(j)-c.z)*r);}}
  geo.computeVertexNormals();return new THREE.Mesh(geo,material);
 }
 function strand(group,points,radii,material=pearl){const m=tapered(points,radii,material);group.add(m);return m;}
 // Angular cross sections give a raised brow and elongated, closed muzzle.
 function loft(sections,material){
  const points=[],indices=[],profile=[[1,.5],[.6,1],[-.5,1],[-1,.65],[-1,-.65],[-.5,-1],[.6,-1],[1,-.5]];
  sections.forEach(([x,y,ry,rz])=>profile.forEach(([a,b])=>points.push(x,y+a*ry,b*rz)));
  for(let i=0;i<sections.length-1;i++)for(let k=0;k<8;k++){const a=i*8+k,b=i*8+(k+1)%8,c=a+8,d=b+8;indices.push(a,b,c,b,d,c);}
  for(let k=1;k<7;k++){indices.push(0,k+1,k);const b=(sections.length-1)*8;indices.push(b,b+k,b+k+1);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));g.setIndex(indices);g.computeVertexNormals();return new THREE.Mesh(g,material);
 }
 const head=new THREE.Group();root.add(head);
 head.add(loft([[-.19,0,.057,.065],[-.10,.035,.092,.10],[.015,.038,.088,.088],[.095,.005,.049,.068],[.26,-.004,.036,.060],[.31,.006,.024,.053]],pearl));
 head.add(loft([[-.06,-.073,.015,.07],[.12,-.072,.018,.058],[.285,-.062,.014,.048]],ridge));
 strand(head,[[.01,.09,0],[.13,.057,0],[.26,.045,0],[.31,.026,0]],[.018,.016,.006],ridge);
 const tinySphere=new THREE.SphereGeometry(1,10,7);
 for(const sign of [-1,1]){
  const geo=new THREE.BufferGeometry(),z=sign*.087;geo.setAttribute('position',new THREE.Float32BufferAttribute([-.005,.054,z,.065,.041,z*.94,.052,.025,z*.96,.008,.031,z],3));geo.setIndex(sign>0?[0,1,2,0,2,3]:[2,1,0,3,2,0]);geo.computeVertexNormals();head.add(new THREE.Mesh(geo,dark));
  const pupil=new THREE.Mesh(tinySphere,iris);pupil.position.set(.035,.039,sign*.088);pupil.scale.set(.010,.006,.003);head.add(pupil);
  strand(head,[[-.02,.075,sign*.078],[.02,.071,sign*.097],[.08,.054,sign*.074]],[.019,.017,.004],ridge);
  strand(head,[[.14,-.047,sign*.064],[.23,-.041,sign*.058],[.295,-.038,sign*.047]],[.003,.003,.001],dark);
  const nostril=new THREE.Mesh(tinySphere,dark);nostril.position.set(.266,.027,sign*.045);nostril.scale.set(.018,.006,.004);head.add(nostril);
  strand(head,[[-.09,.10,sign*.065],[-.14,.22,sign*.09],[-.26,.32,sign*.11],[-.38,.36,sign*.13]],[.027,.018,.008,.001],horn);
  strand(head,[[-.18,.255,sign*.098],[-.15,.34,sign*.15],[-.21,.405,sign*.16]],[.013,.008,.001],horn);
  strand(head,[[-.28,.33,sign*.115],[-.32,.43,sign*.14],[-.39,.46,sign*.17]],[.009,.005,.001],horn);
  strand(head,[[.26,-.012,sign*.06],[.30,.01,sign*.14],[.11,.02,sign*.25],[-.19,.055,sign*.29],[-.46,.08,sign*.26]],[.009,.007,.004,.001]);
  for(let k=0;k<6;k++){const z=sign*(.065+k*.009),y=.045-k*.019;strand(head,[[-.09,y,z],[-.24,y+.07,z+sign*.045],[-.39-k*.022,y+.04,z+sign*.02],[-.49-k*.03,y+.015,z]],[.014,.017,.008,.0008],k%2?ridge:pearl);}
 }
 for(let k=0;k<5;k++)strand(head,[[.08,-.083,(k-2)*.017],[-.02,-.18,(k-2)*.026],[-.23,-.22,(k-2)*.032],[-.40,-.17,(k-2)*.025]],[.009,.012,.006,.0007],k%2?ridge:pearl);
 const segments=180,sides=12,positions=new Float32Array((segments+1)*(sides+1)*3),normals=new Float32Array(positions.length),colours=new Float32Array(positions.length),indices=[];
 for(let i=0;i<segments;i++)for(let k=0;k<sides;k++){const a=i*(sides+1)+k,b=a+sides+1;indices.push(a,b,a+1,b,b+1,a+1);}
 const geo=new THREE.BufferGeometry();geo.setAttribute('position',new THREE.BufferAttribute(positions,3));geo.setAttribute('normal',new THREE.BufferAttribute(normals,3));geo.setAttribute('color',new THREE.BufferAttribute(colours,3));geo.setIndex(indices);
 const bodyMaterial=pearl.clone();bodyMaterial.vertexColors=true;materials.push(bodyMaterial);const body=new THREE.Mesh(geo,bodyMaterial);body.frustumCulled=false;root.add(body);
 const finShape=new THREE.Shape();finShape.moveTo(-.045,0);finShape.bezierCurveTo(-.13,.065,-.15,.13,-.09,.15);finShape.bezierCurveTo(-.055,.11,.035,.10,.045,0);finShape.closePath();
 const finGeo=new THREE.ExtrudeGeometry(finShape,{depth:.010,bevelEnabled:true,bevelSegments:1,steps:1,bevelSize:.004,bevelThickness:.004,curveSegments:5});
 const fins=new THREE.InstancedMesh(finGeo,ridge,58);fins.instanceMatrix.setUsage(THREE.DynamicDrawUsage);fins.frustumCulled=false;root.add(fins);
 // Individual scales share one instanced draw call for mobile devices.
 const scaleGeo=new THREE.BufferGeometry();scaleGeo.setAttribute('position',new THREE.Float32BufferAttribute([0,.18,0,1,0,0,.3,0,1,-.5,0,.85,-1,0,0,-.5,0,-.85,.3,0,-1],3));const si=[];for(let k=0;k<6;k++)si.push(0,(k+1)%6+1,k+1);scaleGeo.setIndex(si);scaleGeo.computeVertexNormals();const scaleMaterial=pearl.clone();scaleMaterial.color.setHex(0xc8d3d5);materials.push(scaleMaterial);
 const scales=new THREE.InstancedMesh(scaleGeo,scaleMaterial,120*8);scales.instanceMatrix.setUsage(THREE.DynamicDrawUsage);scales.frustumCulled=false;root.add(scales);
 const limbs=[];
 for(const [u,sign] of [[.12,-1],[.12,1],[.52,-1],[.52,1]]){
  const g=new THREE.Group();root.add(g);
  strand(g,[[0,-.01,sign*.04],[-.08,-.085,sign*.145],[-.035,-.21,sign*.19],[.05,-.24,sign*.21]],[.038,.032,.023,.018]);
  const paw=loft([[.015,-.235,.024,.028],[.09,-.24,.019,.033]],pearl);paw.position.z=sign*.21;g.add(paw);
  for(let k=0;k<4;k++)strand(g,[[.07,-.24,sign*(.17+k*.022)],[.135,-.245,sign*(.15+k*.034)],[.17,-.22,sign*(.15+k*.034)]],[.011,.008,.0008],horn);
  limbs.push({g,u,sign});
 }
 const tailTuft=new THREE.Group();root.add(tailTuft);for(let k=0;k<7;k++)strand(tailTuft,[[0,0,0],[-.13,.04+(k-3)*.018,(k-3)*.023],[-.29,.06+(k-3)*.02,(k-3)*.027],[-.43,.035+(k-3)*.018,(k-3)*.02]],[.009,.014,.006,.0005],k%2?ridge:pearl);
 const dust=sparkCloud(220,3.6);dust.points.material.fragmentShader=dust.points.material.fragmentShader.replace('vec3(1.,.58,.09)','vec3(.65,.80,.86)').replace('vec3(1.,.92,.59)','vec3(.96,.98,1.)');scene.add(dust.points);
 const mist=sparkCloud(54,12);mist.points.material.fragmentShader=mist.points.material.fragmentShader.replace('vec3(1.,.58,.09)','vec3(.68,.77,.80)').replace('vec3(1.,.92,.59)','vec3(.91,.95,.96)');scene.add(mist.points);
 const dummy=new THREE.Object3D(),up=new THREE.Vector3(0,1,0),history=[];
 const c=new THREE.Vector3(),next=new THREE.Vector3(),tangent=new THREE.Vector3(),side=new THREE.Vector3(),vertical=new THREE.Vector3(),basis=new THREE.Matrix4(),quat=new THREE.Quaternion();let headAngle=0;
 function path(u,t,target){const a=headAngle-u*Math.PI*1.73,r=1.065+.075*Math.sin(u*8-t*.55);return target.set(Math.cos(a)*r,.20+.44*Math.sin(a+.35)+.13*Math.sin(u*9-t*.7),Math.sin(a)*r);}
 function frame(u,t){path(u,t,c);path(Math.min(1.002,u+.002),t,next);tangent.copy(c).sub(next).normalize();side.crossVectors(tangent,up).normalize();vertical.crossVectors(side,tangent).normalize();basis.makeBasis(tangent,vertical,side);quat.setFromRotationMatrix(basis);}
 function radius(u){return (.072+.022*Math.sin(Math.min(u/.75,1)*Math.PI))*Math.pow(1-u,.48)+.003;}
 function pose(t){
  let index=0;
  for(let i=0;i<=segments;i++){
   const u=i/segments;frame(u,t);const r=radius(u);
   for(let k=0;k<=sides;k++){
    const a=k/sides*Math.PI*2,sy=Math.cos(a),sz=Math.sin(a),o=(i*(sides+1)+k)*3;
    positions[o]=c.x+vertical.x*sy*r+side.x*sz*r;positions[o+1]=c.y+vertical.y*sy*r+side.y*sz*r;positions[o+2]=c.z+vertical.z*sy*r+side.z*sz*r;
    normals[o]=vertical.x*sy+side.x*sz;normals[o+1]=vertical.y*sy+side.y*sz;normals[o+2]=vertical.z*sy+side.z*sz;
    const belly=THREE.MathUtils.smoothstep(-sy,-.15,.7),band=.025*Math.cos(u*segments*Math.PI*1.5);colours[o]=.89-belly*.18+band;colours[o+1]=.94-belly*.14+band;colours[o+2]=.95-belly*.12+band;
   }
  }
  for(const name of ['position','normal','color'])geo.attributes[name].needsUpdate=true;
  frame(0,t);head.position.copy(c);head.quaternion.copy(quat);
  for(let i=0;i<58;i++){const u=.025+i/60*.93;frame(u,t);dummy.position.copy(c).addScaledVector(vertical,radius(u)*.93);dummy.quaternion.copy(quat);dummy.scale.setScalar(.8*(1-u*.73));dummy.updateMatrix();fins.setMatrixAt(i,dummy.matrix);}fins.instanceMatrix.needsUpdate=true;
  for(let row=0;row<120;row++){const u=.045+row/122*.90;frame(u,t);const r=radius(u);for(let col=0;col<8;col++){
   const a=col/8*Math.PI*2+(row%2)*.16,sy=Math.cos(a),sz=Math.sin(a);dummy.position.copy(c).addScaledVector(vertical,sy*r*1.005).addScaledVector(side,sz*r*1.005);dummy.quaternion.copy(quat);dummy.rotateX(a);dummy.scale.set(.034*(1-u*.5),.025,.034*(1-u*.55));dummy.updateMatrix();scales.setMatrixAt(index++,dummy.matrix);
  }}scales.instanceMatrix.needsUpdate=true;
  for(const limb of limbs){frame(limb.u,t);limb.g.position.copy(c);limb.g.quaternion.copy(quat);limb.g.rotateX(.05*Math.sin(t*.9+limb.u*5)*limb.sign);}
  frame(.985,t);tailTuft.position.copy(c);tailTuft.quaternion.copy(quat);
 }
 return {root,dust,mist,length:5.8,duration:6.4,start(){root.visible=true;dust.points.visible=true;mist.points.visible=true;history.length=0;},update(t,origin){
  const duration=6.4,p=THREE.MathUtils.smoothstep(t,.45,5.9),fade=THREE.MathUtils.smoothstep(t,0,.55)*(1-THREE.MathUtils.smoothstep(t,5.85,duration));headAngle=-Math.PI*.6+p*Math.PI*2;root.position.copy(origin);pose(t);materials.forEach(m=>m.opacity=fade);
  const tail=path(.96,t,new THREE.Vector3()).add(origin);history.unshift(tail);if(history.length>85)history.pop();
  for(let k=0;k<220;k++){const q=history[Math.min(history.length-1,Math.floor(k/3))],j=.006+k*.00012;dust.positions[k*3]=q.x+Math.sin(k*7.13+t)*j;dust.positions[k*3+1]=q.y+Math.sin(k*3.7+t)*j;dust.positions[k*3+2]=q.z+Math.cos(k*2.1+t)*j;dust.fades[k]=(1-k/220)**1.7*fade*.55;}dust.commit();
  for(let k=0;k<54;k++){const u=k/54,q=path(u,t,new THREE.Vector3()).add(origin);mist.positions[k*3]=q.x+.035*Math.sin(k*5+t*.4);mist.positions[k*3+1]=q.y-.06+.035*Math.sin(k*2.9+t*.5);mist.positions[k*3+2]=q.z+.03*Math.cos(k*4+t*.4);mist.fades[k]=fade*.15*Math.sin(u*Math.PI)**2;}mist.commit();
  if(t>=duration){root.visible=false;dust.points.visible=false;mist.points.visible=false;}return {fade,done:t>=duration};
 }};
}
