// Realtime raytracer, how cool is this!

// Sphere data structure
struct Sphere {
  vec3 position;
  float radius;
  vec3 color;
  float hardness;
};

// Ray-sphere intersection function
float sphereHit(vec3 ro, vec3 rd, Sphere sph) {
  vec3 oc = ro - sph.position;
  float b = dot(oc, rd);
  float c = dot(oc, oc) - sph.radius * sph.radius;
  float h = b * b - c;
  if (h < 0.0) return -1.0;
  return -b - sqrt(h);
}

// Some global variables
vec3 bgColor = vec3(0.6, 0.9, 0.9);
float ambient = 0.06;

const int numSpheres = 3;
Sphere scene[numSpheres]; // The scene is composed of array of spheres

void main() {
  // Light position based on mouse
  vec2 mouse = vec2(u_mouse.x - u_resolution.x/2.0, -u_mouse.y + u_resolution.y/2.0);
  vec3 lightPos = vec3(mouse * 0.15, 17.0);

  int hitIndex = -1; // Negative means no hit

  // Unable to move this outside of main() for weird GLSL reasons
  scene[0] = Sphere(vec3(0.0, 0.0, 0.0), 5.2, vec3(0.3, 0.3, 1.0), 30.0);
  scene[1] = Sphere(vec3(0.0, 1.0, 0.0), 2.0, vec3(0.8, 0.25, 0.2), 100.0);
  scene[2] = Sphere(vec3(0.0, -1.0, 0.0), 1.2, vec3(0.1, 0.7, 0.1), 6.0);

  vec2 screenPos = screenPos(0.0);

  // Fire background effect using 3D noise for no good reson
  float z = abs(mod(u_time* 0.07, 2.0) - 1.0) ;
  bgColor *= octaveNoise3(vec3(screenPos * 0.7, z), 10) * 2.3;
  bgColor *= (1.2 - screenPos.y) * vec3(2.3, 0.2, 0.0);
  
  // Rotate spheres around center each frame
  scene[0].position.y = 1.5 * sin(u_time*2.0);
  scene[1].position.x = 12.5 * cos(u_time*0.8);
  scene[1].position.z = 12.5 * sin(u_time*0.8);
  scene[2].position.x = 7.5 * cos(-u_time*0.7);
  scene[2].position.z = 7.5 * sin(-u_time*0.7);
  scene[2].position.y = 0.5 * sin(-u_time*4.0);

  // Create a ray, with origin and direction
  vec3 ro = vec3(0.0, 0.0, 22.0); // Camera position
  vec3 rd = normalize(vec3(screenPos - 0.5, -0.9));
  
  // Find closest hit distance and index of hit sphere
  float minT = 1e9;
  for (int i = 0; i < numSpheres; i++) {
    float t = sphereHit(ro, rd, scene[i]);
    if (t > 0.0 && t < minT) {
      minT = t;
      hitIndex = i;
    }
  }

  // Background colour
  vec3 color = bgColor;

  // If we hit a sphere, calculate lighting and shading
  if (hitIndex >= 0) {
    Sphere hitSphere = scene[hitIndex];
    
    vec3 pos = ro + rd * minT;  // Position of hit in world space
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

    // Specular calculation
    float specular = 0.0;
    if (shadowT < 1e9) {
      diff *= 0.1;
    } else {
      specular = pow(max(dot(reflect(-lightDir, normal), -rd), 0.0), hitSphere.hardness);
    }

    // Final colour with classic Blinn-Phong shading & lighting model
    color = (hitSphere.color) * diff + ambient + specular;
  }

  fragColor = vec4(color, 1.0);
}