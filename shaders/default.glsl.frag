#version 300 es
precision highp float;
uniform vec2 u_resolution;
uniform float u_time;
uniform float u_aspect;
out vec4 fragColor;

float sphereIntersection(vec3 ro, vec3 rd, vec3 sphPos, float sphRad) {
  vec3 oc = ro - sphPos;
  float b = dot(oc, rd);
  float c = dot(oc, oc) - sphRad * sphRad;
  float h = b * b - c;
  if (h < 0.0) return -1.0;
  return -b - sqrt(h);
}

struct Sphere {
  vec3 position;
  float radius;
  vec3 color;
};

vec3 lightPos = vec3(17.0, 2.0, 8.0);
vec3 bgColor = vec3(0.0);

// Array of spheres
const int numSpheres = 3;
Sphere spheres[numSpheres] = Sphere[numSpheres](
  Sphere(vec3(-3.4, 0.0, -5.0), 2.5, vec3(0.8, 0.1, 0.0)),
  Sphere(vec3(3.4, 1.0, -5.5), 1.0, vec3(0.1, 0.8, 0.1)),
  Sphere(vec3(0.0, 0.0, -8.0), 2.5, vec3(0.3, 0.2, 1.0))
);

int hitIndex = -1;

void main() {
  vec2 screenPos = gl_FragCoord.xy / u_resolution.xy;
  // Fix aspect ratio
  screenPos.x = (screenPos.x * u_aspect) - ((u_aspect - 1.0) / 2.0);

  // modulate light position with time
  lightPos.x = 30.0 * cos(u_time * 0.5);
  lightPos.y = 9.0 * sin(u_time * 1.9);

  vec3 ro = vec3(0.0, 0.0, 3.0);
  vec3 rd = normalize(vec3(screenPos - 0.5, -1.0));
  
  float minT = 1e9;
  for (int i = 0; i < numSpheres; i++) {
    float t = sphereIntersection(ro, rd, spheres[i].position, spheres[i].radius);
    if (t > 0.0 && t < minT) {
      minT = t;
      hitIndex = i;
    }
  }

  vec3 color = bgColor;
  if (hitIndex >= 0) {
    Sphere hitSphere = spheres[hitIndex];
    
    vec3 pos = ro + rd * minT;
    vec3 normal = normalize(pos - hitSphere.position);
    vec3 lightDir = normalize(lightPos - pos);

    // Diffuse
    float diff = max(dot(normal, lightDir), 0.0);

    // Phong
    float ambient = 0.04;
    float specular = pow(max(dot(reflect(-lightDir, normal), -rd), 0.0), 11.0);

    // Cast shadow ray
    float shadowT = 1e9;
    for (int i = 0; i < numSpheres; i++) {
      if (i == hitIndex) continue; // Skip current sphere, no self-shadowing
      float t = sphereIntersection(pos + normal * 0.001, lightDir, spheres[i].position, spheres[i].radius);
      if (t > 0.0 && t < shadowT) {
        shadowT = t;
      }
    }
    if (shadowT < 1e8) {
      diff *= 0.1;
      specular = 0.0;
    }

    // Final color with classic Blinn-Phong model
    color = hitSphere.color * diff + ambient + specular;
  }

  fragColor = vec4(color, 1.0);
}