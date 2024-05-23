#version 300 es

precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_aspect;
out vec4 fragColor;

float PHI = 1.61803398874989484820459;  // Φ = Golden Ratio   

float gold_noise(vec2 xy, float seed){
  return fract(tan(distance(xy*PHI, xy)*seed)*xy.x);
}

struct Sphere {
  vec3 position;
  float radius;
  vec3 color;
  float hardness;
};

struct Ray {
  vec3 pos;
  vec3 dir;
};

struct Hit {
  vec3 pos;
  vec3 normal;
  int hitObject;
};

struct ScatterResult {
  Ray ray;
  vec3 color;
  bool didScatter;
};

float sphereHit(vec3 ro, vec3 rd, Sphere sph) {
  vec3 oc = ro - sph.position;
  float b = dot(oc, rd);
  float c = dot(oc, oc) - sph.radius * sph.radius;
  float h = b * b - c;
  if (h < 0.0) return -1.0;
  return -b - sqrt(h);
}


// The scene is composed of array of spheres
const int numSpheres = 20;
const int maxDepth = 5;
Sphere scene[numSpheres];
int sampleIndex = 0;

vec3 randomInUnitCube() {
  float seed = float(sampleIndex);
  return vec3(
    gold_noise(vec2(u_time, 0.0), seed),
    gold_noise(vec2(u_time, 0.0), seed),
    gold_noise(vec2(u_time, 0.0), seed)
  );
}

vec3 randomInUnitSphere() {
  vec3 p;
  do {
    p = 2.0 * randomInUnitCube() - vec3(1.0);
  } while (dot(p, p) >= 1.0);
  return p;
}


ScatterResult scatterDiffuse(Ray r, Hit h) {
  vec3 target = h.pos + h.normal + randomInUnitSphere();
  Ray scattered = Ray(h.pos, normalize(target - h.pos));
  return ScatterResult(scattered, scene[h.hitObject].color, true);
}

// vec3 lightPos = vec3(11.0, 8.0, 10.0);
vec3 bgColor = vec3(0.7);
float ambient = 0.04;
vec3 lightPos = vec3(11.0, 8.0, 10.0);

void initScene() {
  scene[0] = Sphere(vec3(4.0, 0.0, 0.0), 3.0, vec3(0.2, 0.1, 1.0), 30.0);
  scene[1] = Sphere(vec3(0.0, 1.0, 0.0), 1.2, vec3(0.9, 0.2, 0.1), 100.0);
  scene[2] = Sphere(vec3(-4.0, -1.0, 0.0), 0.6, vec3(0.1, 0.7, 0.1), 6.0);
}

vec3 shadeRay(Ray inRay) {
  
  int hitIndex = -1;
  vec3 colours[maxDepth];
  Ray r = inRay;
  for (int i = 0; i < maxDepth; i++) {
    float minT = 1e9;
    for (int i = 0; i < numSpheres; i++) {
      float t = sphereHit(r.pos, r.dir, scene[i]);
      if (t > 0.0 && t < minT) {
        minT = t;
        hitIndex = i;
      }
    }

    vec3 color = bgColor;
    if (hitIndex >= 0) {
      Sphere hitSphere = scene[hitIndex];
      vec3 pos = r.pos + r.dir * minT;
      vec3 normal = normalize(pos - hitSphere.position);
      Hit hit = Hit(pos, normal, hitIndex);
      ScatterResult scatter = scatterDiffuse(r, hit);
      if (scatter.didScatter) {
        r = scatter.ray;
        color = scatter.color;
      }
    }

    colours[i] = color;
  }

  vec3 color = vec3(0.0);
  for (int i = 0; i < maxDepth; i++) {
    color += colours[i];
  }

  return color;
}

void main() {
  initScene();

  int maxSamples = 32;
  float sampleAmount = 1.0 / float(maxSamples);
  vec3 color = vec3(0.0);
   
  for(sampleIndex = 0; sampleIndex < maxSamples; sampleIndex++) {
    vec2 screenPos = gl_FragCoord.xy / u_resolution.xy;
    screenPos.x = (screenPos.x * u_aspect) - ((u_aspect - 1.0) / 2.0);
    screenPos = screenPos * 2.0 - 1.0;

    // Random jitter
    screenPos.x += gold_noise(vec2(u_time, screenPos.x), float(sampleIndex)) / u_resolution.x;
    screenPos.y += gold_noise(vec2(u_time, screenPos.y), float(sampleIndex)) / u_resolution.y;

    vec3 ro = vec3(0.0, 0.0, 10.0);
    vec3 rd = normalize(vec3(screenPos, -1.0));
    
    Ray r = Ray(ro, rd);
    vec3 rayColor = shadeRay(r);
    color += rayColor * sampleAmount;
  }
  
  fragColor = vec4(color, 1.0);
}

