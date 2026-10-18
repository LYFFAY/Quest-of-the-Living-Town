import * as THREE from 'three';
// A single small draw call per trail: round, fading light grains, no image downloads.
export function sparkCloud(count,size=5){
 const geometry=new THREE.BufferGeometry();
 geometry.setAttribute('position',new THREE.BufferAttribute(new Float32Array(count*3),3));
 geometry.setAttribute('fade',new THREE.BufferAttribute(new Float32Array(count),1));
 geometry.setAttribute('scale',new THREE.BufferAttribute(Float32Array.from({length:count},(_,i)=>.35+.65*((i*37%97)/97)),1));
 const material=new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{opacity:{value:1},size:{value:size*Math.min(devicePixelRatio,1.75)}},vertexShader:`attribute float fade;attribute float scale;varying float vFade;uniform float size;void main(){vFade=fade;vec4 mv=modelViewMatrix*vec4(position,1.);gl_Position=projectionMatrix*mv;gl_PointSize=clamp(size*scale*3.7/-mv.z,1.,16.);}`,fragmentShader:`varying float vFade;uniform float opacity;void main(){float r=length(gl_PointCoord-vec2(.5))*2.;float a=exp(-r*r*4.)*(1.-smoothstep(.45,1.,r))*vFade*opacity;if(a<.005)discard;gl_FragColor=vec4(mix(vec3(1.,.58,.09),vec3(1.,.92,.59),exp(-r*r*14.)),a);}`});
 const points=new THREE.Points(geometry,material);points.frustumCulled=false;points.visible=false;
 return {points,positions:geometry.attributes.position.array,fades:geometry.attributes.fade.array,commit(){geometry.attributes.position.needsUpdate=true;geometry.attributes.fade.needsUpdate=true;}};
}
