Shader.source[document.currentScript.src.split('js/shaders/')[1]]=`#version 300 es
precision highp float;

#define INFF 999999.0
#define INFI 999999

out vec4 fragmentColor;
in vec4 rayDir;

uniform struct{
  samplerCube envTexture;
}material;

uniform struct{
  mat4 viewProjMatrix;
  mat4 rayDirMatrix;
  vec3 position;
}camera;

uniform struct{
  mat4 surface;
  mat4 clipper1;
  mat4 clipper2;
  float reflectance;
  float eta;
  vec3 solidColor;
  float materialType;
}clippedQuadrics[20];

uniform struct{
  vec4 position;
  vec3 powerDensity;
}lights[8];

vec3 shadeDiffuse(vec3 normal,vec3 lightDir,vec3 powerDensity,vec3 materialColor){
  float cosa=clamp(dot(lightDir,normal),0.,1.);
  return powerDensity*materialColor*cosa;
}

vec3 noiseGrad(vec3 r){
  vec3 s = vec3(7502, 22777, 4767);
  vec3 f = vec3(0.0, 0.0, 0.0);
  for(int i=0; i<16; i++){
    f += cos(dot(s-vec3(32768, 32768, 32768), r*40.0)/65536.0)*(s-vec3(32768,32768,32768))*40.0;
    s = mod(s, 32768.0)*2.0+floor(s/32768.0);
  }
  return f/65536.0;
}

float intersectQuadric(mat4 A,vec4 e,vec4 d){
  float a=dot(d*A,d);
  float b=dot(d*A,e)+dot(e*A,d);
  float c=dot(e*A,e);
  float discriminant=b*b-4.*a*c;
  if(discriminant<0.){
    return-1.;
  }
  float t1=(-b+sqrt(discriminant))/(2.*a);
  float t2=(-b-sqrt(discriminant))/(2.*a);
  return(t1<0.)?t2:((t2<0.)?t1:min(t1,t2));
}
vec3 shadePhongBlinn(vec3 normal,vec3 lightDir,vec3 viewDir,vec3 powerDensity,vec3 materialColor,vec3 specularColor,float shininess){
  float cosa=clamp(dot(lightDir,normal),0.,1.);
  vec3 halfway=normalize(viewDir+lightDir);
  float cosDelta=clamp(dot(halfway,normal),0.,1.);
  return powerDensity*materialColor*cosa+powerDensity*specularColor*pow(cosDelta,shininess);
}


float intersectClippedQuadric(mat4 A,mat4 B,vec4 e,vec4 d){
  float a=dot(d*A,d);
  float b=dot(d*A,e)+dot(e*A,d);
  float c=dot(e*A,e);
  float discriminant=b*b-4.*a*c;
  if(discriminant<0.){
    return-1.;
  }
  float t1=(-b+sqrt(discriminant))/(2.*a);
  float t2=(-b-sqrt(discriminant))/(2.*a);
  
  vec4 r1=e+d*t1;
  vec4 r2=e+d*t2;
  
  if(dot(r1*B,r1)>0.){
    t1=-1.;
  }
  if(dot(r2*B,r2)>0.){
    t2=-1.;
  }
  return(t1<0.)?t2:((t2<0.)?t1:min(t1,t2));
}
float intersectDoubleClippedQuadric(mat4 A, mat4 B, mat4 C, vec4 e, vec4 d){
  float a=dot(d*A,d);
  float b=dot(d*A,e)+dot(e*A,d);
  float c=dot(e*A,e);
  float discriminant=b*b-4.*a*c;
  if(discriminant<0.){
    return-1.;
  }
  float t1=(-b+sqrt(discriminant))/(2.*a);
  float t2=(-b-sqrt(discriminant))/(2.*a);
  
  vec4 r1=e+d*t1;
  vec4 r2=e+d*t2;
  
  if(dot(r1*B,r1)>0.){
    t1=-1.;
  }
  if(dot(r2*B,r2)>0.){
    t2=-1.;
  }
  if(dot(r1*C, r1)>0.){
    t1=-1.;
  }
  if(dot(r2*C, r2)>0.){
    t2=-1.;
  }
  return(t1<0.)?t2:((t2<0.)?t1:min(t1,t2));
}

bool findBestHit(vec4 e,vec4 d,out float bestT,out int bestIndex){
  bestT=INFF;
  bestIndex=INFI;
  float curT=-1.;
  for(int i=0;i<16;i++){
    //curT=intersectClippedQuadric(clippedQuadrics[i].surface,clippedQuadrics[i].clipper,e,d);
    curT=intersectDoubleClippedQuadric(clippedQuadrics[i].surface,clippedQuadrics[i].clipper1, clippedQuadrics[i].clipper2,e,d);
    //update bestT
    if(curT>0.&&curT<bestT){
      bestT=curT;
      bestIndex=i;
    }
  }
  //check if bestT is not the initial value
  if(bestT<INFF){
    return true;
  }else{
    return false;
  }
}

void main(void){
  vec4 e=vec4(camera.position,1);//< ray origin
  vec4 d=vec4(normalize(rayDir).xyz,0);//< ray direction
  
  vec3 w=vec3(1,1,1); // product of reflectances so far

  for(int j = 0; j<3; j++){
    // break out if w (reflectance) is small enough
    if(length(w)<0.1){
      break;
    }
    float bestT=INFF;
    int bestIndex=INFI;
    
    bool isHit=findBestHit(e,d,bestT,bestIndex);
    if(isHit){ // hit something
      // find the normal
      vec4 hit=e+d*bestT;

      // set depth of hit
      if(j==0){
        vec4 ndcHit=hit*camera.viewProjMatrix;
        gl_FragDepth=ndcHit.z/ndcHit.w*.5+.5;
      }
      
      vec3 normal=normalize((hit*clippedQuadrics[bestIndex].surface+clippedQuadrics[bestIndex].surface*hit).xyz);
      // invert normal if ray hit from inside the object
      if (dot(normal, d.xyz) > 0.0){
        normal = -1.0* normal;
      }
      
      //add light contributions
      for(int i=0;i<1;i++){ // number of lights have to be changed manually
        vec3 lightDiff=lights[i].position.xyz-hit.xyz*lights[i].position.w;
        vec3 lightDir=normalize(lightDiff);

        if(clippedQuadrics[bestIndex].materialType == 0.0){ // type chessboard
          //reflect
          //find if lightsource is visible from the hit position
          float bestShadowT = INFF;
          int bestShadowIndex = INFI;
          bool shadowRayHitSomething = findBestHit(hit+vec4(normal, 0)*0.001, vec4(lightDir, 0), bestShadowT, bestShadowIndex);
          if( !shadowRayHitSomething || bestShadowT * lights[i].position.w > sqrt(dot(lightDiff, lightDiff)) ) {
            // add light source contribution
            float distanceSquared=dot(lightDiff,lightDiff);
            vec3 powerDensity=lights[i].powerDensity/distanceSquared;
            //vec3 boardColor = vec3(0.2, 0.1, 0.1);
            vec3 boardColor = vec3(0.1, 0.1, 0.1);
            if(hit.x - 8.0*floor(hit.x/8.0) <= 4.0 && hit.z - 8.0*floor(hit.z/8.0) <= 4.0){
              //boardColor = vec3(0.48,0.42,0.46);
              boardColor = vec3(0.68,0.62,0.66);
            }else if(hit.x - 8.0*floor(hit.x/8.0) >= 4.0 && hit.z - 8.0*floor(hit.z/8.0) >= 4.0){
              //boardColor = vec3(0.48,0.42,0.46);
              boardColor = vec3(0.68,0.62,0.66);
            }
            fragmentColor.rbg+=shadeDiffuse(normal,lightDir,powerDensity, boardColor) * w;

            //reflect
            e = hit + vec4(normal, 0)*0.0005;
            d.xyz = reflect(d.xyz, normal);
            w *= clippedQuadrics[bestIndex].reflectance;
          }else{
            if(clippedQuadrics[bestShadowIndex].materialType == 1.0){
              float distanceSquared=dot(lightDiff,lightDiff);
              vec3 powerDensity=lights[i].powerDensity/distanceSquared;
              //vec3 boardColor = vec3(0.2, 0.1, 0.1);
              vec3 boardColor = vec3(0.1, 0.1, 0.1);
              if(hit.x - 8.0*floor(hit.x/8.0) <= 4.0 && hit.z - 8.0*floor(hit.z/8.0) <= 4.0){
                //boardColor = vec3(0.48,0.42,0.46);
                boardColor = vec3(0.68,0.62,0.66);
              }else if(hit.x - 8.0*floor(hit.x/8.0) >= 4.0 && hit.z - 8.0*floor(hit.z/8.0) >= 4.0){
                //boardColor = vec3(0.48,0.42,0.46);
                boardColor = vec3(0.68,0.62,0.66);
              }
              fragmentColor.rbg+=shadeDiffuse(normal,lightDir,powerDensity, boardColor) * w;
              fragmentColor.rbg+=shadeDiffuse(normal,lightDir,powerDensity, 
                clippedQuadrics[bestShadowIndex].solidColor) 
                *vec3(clippedQuadrics[bestShadowIndex].reflectance, clippedQuadrics[bestShadowIndex].reflectance, clippedQuadrics[bestShadowIndex].reflectance );
              e = hit - vec4(normal, 0)*0.001;
              d.xyz = refract(d.xyz, normal, clippedQuadrics[bestIndex].eta);
              w *= (1.0-clippedQuadrics[bestIndex].reflectance);
            }
          }
        }else if(clippedQuadrics[bestIndex].materialType == 1.0){ // type clipped
          // refract
          float distanceSquared=dot(lightDiff,lightDiff);
          vec3 powerDensity=lights[i].powerDensity/distanceSquared;
          fragmentColor.rbg+=shadeDiffuse(normal,lightDir,powerDensity, clippedQuadrics[bestIndex].solidColor) * w;
          float bestShadowT = INFF;
          int bestShadowIndex = INFI;
          bool shadowRayHitSomething = findBestHit(hit+vec4(normal, 0)*0.001, vec4(lightDir, 0), bestShadowT, bestShadowIndex);
          if( !shadowRayHitSomething || bestShadowT * lights[i].position.w > sqrt(dot(lightDiff, lightDiff)) ) {
            //refract
            e = hit - vec4(normal, 0)*0.001;
            d.xyz = refract(d.xyz, normal, clippedQuadrics[bestIndex].eta);
            w *= (1.0-clippedQuadrics[bestIndex].reflectance);
          }else{
            if(clippedQuadrics[bestShadowIndex].materialType == 1.0){
              float distanceSquared=dot(lightDiff,lightDiff);
              vec3 powerDensity=lights[i].powerDensity/distanceSquared;
              fragmentColor.rbg+=shadeDiffuse(normal,lightDir,powerDensity, clippedQuadrics[bestShadowIndex].solidColor) * vec3(0.1,0.1,0.1);
              e = hit - vec4(normal, 0)*0.001;
              d.xyz = refract(d.xyz, normal, clippedQuadrics[bestIndex].eta);
              w *= (1.0-clippedQuadrics[bestIndex].reflectance);
            }
          }
        }else if(clippedQuadrics[bestIndex].materialType == 2.0){
          //reflect
          //find if lightsource is visible from the hit position
          float bestShadowT = INFF;
          int bestShadowIndex = INFI;
          bool shadowRayHitSomething = findBestHit(hit+vec4(normal, 0)*0.001, vec4(lightDir, 0), bestShadowT, bestShadowIndex);
          if( !shadowRayHitSomething || bestShadowT * lights[i].position.w > sqrt(dot(lightDiff, lightDiff)) ) {
            // add light source contribution
            float distanceSquared=dot(lightDiff,lightDiff);
            vec3 powerDensity=lights[i].powerDensity/distanceSquared;
            fragmentColor.rbg+=shadeDiffuse(normal,lightDir,powerDensity, clippedQuadrics[bestIndex].solidColor) * w;

            //reflect
            e = hit + vec4(normal, 0)*0.0005;
            d.xyz = reflect(d.xyz, normal);
            w *= clippedQuadrics[bestIndex].reflectance;
          }else{
            if(clippedQuadrics[bestShadowIndex].materialType == 1.0){
              float distanceSquared=dot(lightDiff,lightDiff);
              vec3 powerDensity=lights[i].powerDensity/distanceSquared;
              fragmentColor.rbg+=shadeDiffuse(normal,lightDir,powerDensity, clippedQuadrics[bestShadowIndex].solidColor) * vec3(0.1,0.1,0.1);
              e = hit - vec4(normal, 0)*0.001;
              d.xyz = refract(d.xyz, normal, clippedQuadrics[bestIndex].eta);
              w *= (1.0-clippedQuadrics[bestIndex].reflectance);
            }
          }
        }else if(clippedQuadrics[bestIndex].materialType == 3.0){
          //reflect
          //find if lightsource is visible from the hit position
          float bestShadowT = INFF;
          int bestShadowIndex = INFI;
          bool shadowRayHitSomething = findBestHit(hit+vec4(normal, 0)*0.001, vec4(lightDir, 0), bestShadowT, bestShadowIndex);
          if( !shadowRayHitSomething || bestShadowT * lights[i].position.w > sqrt(dot(lightDiff, lightDiff)) ) {
            // add light source contribution
            float distanceSquared=dot(lightDiff,lightDiff);
            vec3 powerDensity=lights[i].powerDensity/distanceSquared;
            vec3 viewDir=normalize(camera.position.xyz-hit.xyz);
            fragmentColor.rbg+=shadePhongBlinn(normal,lightDir, viewDir,powerDensity, clippedQuadrics[bestIndex].solidColor, vec3(0.3, 0.3, 0.3), 15.0) * w;

            //reflect
            e = hit + vec4(normal, 0)*0.0005;
            d.xyz = reflect(d.xyz, normal);
            w *= clippedQuadrics[bestIndex].reflectance;
          }else{
            if(clippedQuadrics[bestShadowIndex].materialType == 1.0){
              float distanceSquared=dot(lightDiff,lightDiff);
              vec3 powerDensity=lights[i].powerDensity/distanceSquared;
              fragmentColor.rbg+=shadeDiffuse(normal,lightDir,powerDensity, clippedQuadrics[bestShadowIndex].solidColor) * vec3(0.1,0.1,0.1);
              e = hit - vec4(normal, 0)*0.001;
              d.xyz = refract(d.xyz, normal, clippedQuadrics[bestIndex].eta);
              w *= (1.0-clippedQuadrics[bestIndex].reflectance);
            }
          }
        }else if(clippedQuadrics[bestIndex].materialType == 4.0){ //proceadural normal
          //reflect
          //find if lightsource is visible from the hit position
          float bestShadowT = INFF;
          int bestShadowIndex = INFI;
          bool shadowRayHitSomething = findBestHit(hit+vec4(normal, 0)*0.001, vec4(lightDir, 0), bestShadowT, bestShadowIndex);
          if( !shadowRayHitSomething || bestShadowT * lights[i].position.w > sqrt(dot(lightDiff, lightDiff)) ) {
            // add light source contribution
            float distanceSquared=dot(lightDiff,lightDiff);
            vec3 powerDensity=lights[i].powerDensity/distanceSquared;
            vec3 viewDir=normalize(camera.position.xyz-hit.xyz);
            fragmentColor.rbg+=shadePhongBlinn(normalize(normal + noiseGrad(normal)),lightDir, viewDir,powerDensity, clippedQuadrics[bestIndex].solidColor, vec3(0.3, 0.3, 0.3), 15.0) * w;

            //reflect
            e = hit + vec4(normal, 0)*0.0005;
            d.xyz = reflect(d.xyz, normal);
            w *= clippedQuadrics[bestIndex].reflectance;
          }else{
            if(clippedQuadrics[bestShadowIndex].materialType == 1.0){
              float distanceSquared=dot(lightDiff,lightDiff);
              vec3 powerDensity=lights[i].powerDensity/distanceSquared;
              fragmentColor.rbg+=shadeDiffuse(normal,lightDir,powerDensity, clippedQuadrics[bestShadowIndex].solidColor) * vec3(0.1,0.1,0.1);
              e = hit - vec4(normal, 0)*0.001;
              d.xyz = refract(d.xyz, normal, clippedQuadrics[bestIndex].eta);
              w *= (1.0-clippedQuadrics[bestIndex].reflectance);
            }
          }
        }
        
      }
    }else{ // hit nothing
      fragmentColor+=texture(material.envTexture,d.xyz) * vec4(w,0);
      w = vec3(0,0,0);
    }
  }
}
`;