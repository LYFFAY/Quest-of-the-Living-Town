import * as THREE from 'three';
import {sparkCloud} from './effects.js';

// An original procedural light sculpture: no photographic card or model swap.
export function whiteDragon(scene){
 const root=new THREE.Group();root.visible=false;scene.add(root);
 const ivory=new THREE.MeshStandardMaterial({color:0xfffbec,roughness:.38,metalness:.08,emissive:0x908b7d,emissiveIntensity:.38,transparent:true});
 const gold=new THREE.MeshStandardMaterial({color:0xe5c88d,roughness:.42,metalness:.2,emissive:0x9c7541,emissiveIntensity:.25,transparent:true});
 const eye=new THREE.MeshStandardMaterial({color:0x833c31,roughness:.3,emissive:0x4f1912,transparent:true});
 const sphere=new THREE.SphereGeometry(1,12,9);
 function orb(group,pos,scale,material=ivory){const m=new THREE.Mesh(sphere,material);m.position.set(...pos);m.scale.set(...scale);group.add(m);return m;}
 function line(group,points,r,material=ivory){const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),m=new THREE.Mesh(new THREE.TubeGeometry(curve,24,r,6,false),material);group.add(m);return m;}
 const rings=70,sides=10,positions=new Float32Array((rings+1)*(sides+1)*3),indices=[];
 for(let i=0;i<rings;i++)for(let k=0;k<sides;k++){const a=i*(sides+1)+k,b=a+sides+1;indices.push(a,b,a+1,b,b+1,a+1);}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setIndex(indices);const body=new THREE.Mesh(geometry,ivory);body.frustumCulled=false;root.add(body);
 const head=new THREE.Group();root.add(head);
 orb(head,[.04,.02,0],[.15,.115,.12]);orb(head,[.19,-.025,0],[.17,.065,.08]);orb(head,[.19,-.085,0],[.12,.025,.07]);
 for(const sign of [-1,1]){
  orb(head,[.10,.055,sign*.10],[.035,.025,.015],gold);orb(head,[.115,.057,sign*.111],[.013,.016,.009],eye);
  orb(head,[.29,.002,sign*.044],[.014,.01,.012],eye);
  line(head,[[-.025,.095,sign*.07],[-.07,.23,sign*.11],[-.17,.28,sign*.14]],.014,gold);
  line(head,[[-.065,.20,sign*.105],[-.025,.29,sign*.16],[-.07,.34,sign*.18]],.008,gold);
  line(head,[[.27,-.015,sign*.06],[.31,.03,sign*.15],[.20,.08,sign*.27],[.02,.06,sign*.32]],.006);
  line(head,[[-.07,.06,sign*.09],[-.17,.10,sign*.16],[-.25,.06,sign*.14]],.009);
 }
 line(head,[[.19,-.09,0],[.10,-.18,.01],[-.06,-.19,.03],[-.19,-.13,.02]],.012);
 const limbs=[];
 for(const [x,sign] of [[.12,-1],[.12,1],[-.72,-1],[-.72,1]]){
  const g=new THREE.Group();root.add(g);g.position.x=x;g.userData.sign=sign;
  line(g,[[0,-.02,sign*.045],[-.03,-.12,sign*.15],[.07,-.20,sign*.22]],.024);
  orb(g,[.07,-.20,sign*.22],[.055,.022,.035]);
  for(let k=0;k<3;k++)line(g,[[.07,-.20,sign*(.20+k*.022)],[.15,-.20,sign*(.20+k*.028)],[.17,-.18,sign*(.20+k*.03)]],.008,gold);
  limbs.push(g);
 }
 const fins=[];for(let i=0;i<20;i++){const f=new THREE.Mesh(new THREE.ConeGeometry(.026,.09,3),gold);root.add(f);fins.push(f);}
 const dust=sparkCloud(160,4);dust.points.material.fragmentShader=dust.points.material.fragmentShader.replace('vec3(1.,.58,.09)','vec3(.7,.83,1.)').replace('vec3(1.,.92,.59)','vec3(1.,.98,.88)');scene.add(dust.points);
 const history=[];root.scale.setScalar(.68);
 function center(u,t){return new THREE.Vector3(.45-u*1.65,.07*Math.sin(u*7-t*4),.095*Math.sin(u*8-t*3));}
 function pose(t){
  for(let i=0;i<=rings;i++){const u=i/rings,c=center(u,t),r=.066*Math.pow(1-u,.65)+.003;for(let k=0;k<=sides;k++){const a=k/sides*Math.PI*2,o=(i*(sides+1)+k)*3;positions[o]=c.x;positions[o+1]=c.y+Math.cos(a)*r;positions[o+2]=c.z+Math.sin(a)*r;}}
  geometry.attributes.position.needsUpdate=true;geometry.computeVertexNormals();
  head.position.copy(center(0,t));head.rotation.y=.13*Math.cos(t*3);
  limbs.forEach((g,i)=>{const u=i<2?.2:.7,c=center(u,t);g.position.copy(c);g.rotation.x=.2*Math.sin(t*5+i);g.rotation.z=.12*Math.sin(t*5+i);});
  fins.forEach((f,i)=>{const u=(i+1)/22,c=center(u,t);f.position.copy(c);f.position.y+=.06*Math.pow(1-u,.65)+.02;f.scale.setScalar(1-u*.7);f.rotation.z=-.5;});
 }
 return {root,dust,start(){root.visible=true;dust.points.visible=true;history.length=0;},update(t,origin){
  const duration=4.7,p=THREE.MathUtils.smoothstep(t,.35,4.35),a=-Math.PI/2+p*Math.PI*2,fade=THREE.MathUtils.smoothstep(t,0,.3)*(1-THREE.MathUtils.smoothstep(t,4.2,duration));
  root.position.set(Math.cos(a)*1.04,.40+.20*Math.sin(a*2),Math.sin(a)*1.04);root.position.add(origin);
  root.rotation.y=-a-Math.PI/2;pose(t);for(const m of [ivory,gold,eye])m.opacity=fade;
  root.updateMatrixWorld(true);const tail=center(.95,t).applyMatrix4(root.matrixWorld);history.unshift(tail);if(history.length>65)history.pop();
  for(let k=0;k<160;k++){const q=history[Math.min(history.length-1,Math.floor(k/3))],j=.008+k*.00015;dust.positions[k*3]=q.x+Math.sin(k*7.13+t*4)*j;dust.positions[k*3+1]=q.y+Math.sin(k*3.7+t*6)*j;dust.positions[k*3+2]=q.z+Math.cos(k*2.1+t*5)*j;dust.fades[k]=(1-k/160)**1.8*fade*(.4+.6*Math.sin(t*8+k)**2);}dust.commit();
  if(t>=duration){root.visible=false;dust.points.visible=false;}return {fade,done:t>=duration};
 }};
}
