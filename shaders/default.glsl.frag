#version 300 es

precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_aspect;
out vec4 fragColor;

struct Sphere {
  vec3 position;
  float radius;
  vec3 color;
  float hardness;
};

float sphereHit(vec3 ro, vec3 rd, Sphere sph) {
  vec3 oc = ro - sph.position;
  float b = dot(oc, rd);
  float c = dot(oc, oc) - sph.radius * sph.radius;
  float h = b * b - c;
  if (h < 0.0) return -1.0;
  return -b - sqrt(h);
}

vec3 lightPos = vec3(11.0, 8.0, 10.0);
vec3 bgColor = vec3(0.3, 0.3, 0.9);
float ambient = 0.04;

// The scene is composed of array of spheres
const int numSpheres = 20;
Sphere scene[numSpheres];

void initScene() {
  scene[0] = Sphere(vec3(0.0, 0.0, 0.0), 3.0, vec3(0.2, 0.1, 1.0), 30.0);
  scene[1] = Sphere(vec3(0.0, 1.0, 0.0), 1.2, vec3(0.9, 0.2, 0.1), 100.0);
  scene[2] = Sphere(vec3(0.0, -1.0, 0.0), 0.6, vec3(0.1, 0.7, 0.1), 6.0);
}

int hitIndex = -1;

void main() {
  initScene();

  vec2 screenPos = gl_FragCoord.xy / u_resolution.xy;
  // Fix aspect ratio
  screenPos.x = (screenPos.x * u_aspect) - ((u_aspect - 1.0) / 2.0);

  // Rotate spheres around center each frame
  scene[1].position.x = 5.0 * cos(u_time*0.8);
  scene[1].position.z = 5.0 * sin(u_time*0.8);
  scene[2].position.x = 4.0 * cos(-u_time*0.7);
  scene[2].position.z = 4.0 * sin(-u_time*0.7);

  vec3 ro = vec3(0.0, 0.0, 10.0);
  vec3 rd = normalize(vec3(screenPos - 0.5, -1.0));
  
  float minT = 1e9;
  for (int i = 0; i < numSpheres; i++) {
    float t = sphereHit(ro, rd, scene[i]);
    if (t > 0.0 && t < minT) {
      minT = t;
      hitIndex = i;
    }
  }

  vec3 color = bgColor * screenPos.y + ((1.0 - screenPos.y) * vec3(0.0, 0.2, 0.0));
  if (hitIndex >= 0) {
    Sphere hitSphere = scene[hitIndex];
    
    vec3 pos = ro + rd * minT;
    vec3 normal = normalize(pos - hitSphere.position);
    vec3 lightDir = normalize(lightPos - pos);

    // Diffuse
    float diff = max(dot(normal, lightDir), 0.0);

    // Cast shadow ray(s)
    float shadowT = 1e9;
    for (int i = 0; i < numSpheres; i++) {
      if (i == hitIndex) continue; // Skip current sphere, no self-shadowing
      float t = sphereHit(pos + normal * 0.001, lightDir, scene[i]);
      if (t > 0.0 && t < shadowT) {
        shadowT = t;
      }
    }

    float specular = 0.0;
    if (shadowT < 1e9) {
      diff *= 0.1;
    } else {
      specular = pow(max(dot(reflect(-lightDir, normal), -rd), 0.0), hitSphere.hardness);
    }

    // Final color with classic Blinn-Phong model
    color = hitSphere.color * diff + ambient + specular;
  }

  fragColor = vec4(color, 1.0);
}