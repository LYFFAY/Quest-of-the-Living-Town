import * as THREE from 'three';
export function makeCloth(){const group=new THREE.Group(),geometry=new THREE.PlaneGeometry(.27,.22,16,12),v=geometry.attributes.position;for(let i=0;i<v.count;i++){const x=v.getX(i),y=v.getY(i);v.setZ(i,.007*Math.sin(x*75+y*8)+.004*Math.cos(y*55));}geometry.computeVertexNormals();const mat=new THREE.MeshStandardMaterial({color:0xe4d5b8,roughness:.98,metalness:0,side:THREE.DoubleSide,transparent:true}),cloth=new THREE.Mesh(geometry,mat);group.add(cloth);const points=[];for(let i=0;i<=64;i++){const a=i/64*Math.PI*2;const x=Math.cos(a)*.124,y=Math.sin(a)*.098;points.push(new THREE.Vector3(x,y,.010));}const hem=new THREE.LineLoop(new THREE.BufferGeometry().setFromPoints(points),new THREE.LineBasicMaterial({color:0xa58c6a,transparent:true}));group.add(hem);group.visible=false;return {group,opacity(a){mat.opacity=hem.material.opacity=a;}};}
// Stylised traces of the four original marks, not translations of their meaning.
const traces=[
 [[[-.07,-.1],[-.07,.1],[.07,-.1],[.07,.1],[-.10,.03],[.11,.03],[-.1,-.06],[.11,-.06],[-.07,-.1],[.07,.1]]],
 [[[-.06,.07],[.07,.09]],[[.02,.12],[.02,-.12],[-.025,-.085]],[[-.055,.065],[-.055,-.03],[.02,-.03]],[[-.06,.025],[.015,.03]]],
 [[[-.055,.12],[.07,.09],[-.08,-.12],[.05,-.12],[-.055,.12]],[[.07,.09],[.05,-.12],[-.08,-.12]]],
 [[[0,-.11],[0,.10],[-.055,.055]],[[0,.10],[.06,.065]]]
];
export function makeGlyph(index){const group=new THREE.Group(),mat=new THREE.MeshStandardMaterial({color:0xe8c594,emissive:0x8e633b,emissiveIntensity:.28,roughness:.65,transparent:true});for(const path of traces[index%4]){const curve=new THREE.CatmullRomCurve3(path.map(([x,y])=>new THREE.Vector3(x,y,0)),false,'catmullrom',.02);const tube=new THREE.TubeGeometry(curve,Math.max(12,path.length*4),.006,5,false);group.add(new THREE.Mesh(tube,mat));}group.visible=false;return {group,mat};}
