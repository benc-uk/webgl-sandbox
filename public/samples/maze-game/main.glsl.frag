// Maze game raycaster shader
#define STATE_ANGLE 0
#define STATE_X 1
#define STATE_Y 2
#define FIRST_RUN 3

#define maxDist 10
#define mapSize 10
#define mapSizeF 10.0
const int map[] = int[](
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1,
  1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
  1, 0, 1, 1, 1, 0, 0, 0, 0, 1,
  1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
  1, 0, 1, 0, 0, 0, 0, 0, 0, 1,
  1, 0, 0, 0, 0, 0, 0, 0, 0, 1,
  1, 0, 1, 0, 0, 0, 0, 0, 0, 1,
  1, 0, 1, 0, 0, 0, 0, 0, 0, 1,
  1, 0, 1, 0, 0, 0, 0, 0, 0, 1,
  1, 1, 1, 1, 1, 1, 1, 1, 1, 1
);
vec2 cameraPos = vec2(1.5, 1.5);
vec2 cameraDir = vec2(1.0, 0.0); 
vec2 cameraPlane = vec2(0.0, 0.4);

bool isWall(vec2 pos) {
  // Check if the position is out of bounds
  if (pos.x < 0.0 || pos.x >= mapSizeF || pos.y < 0.0 || pos.y >= mapSizeF) {
    return true;
  }

  // Check if the position is a wall
  int index = int(pos.y) * mapSize + int(pos.x);
  return map[index] == 1;
}

float rayCast(vec2 rayPos, vec2 rayDir) {
  float distance = 0.0;

  for (;;) {
    vec2 currentPos = rayPos + rayDir * distance;
    if (isWall(currentPos)) {
      return distance;
    }
    distance += 0.01;
    if(distance > float(maxDist)) return -1.0;
  }

  return -1.0;
}

void rotateCamera(float angle) {
  float cosAngle = cos(angle);
  float sinAngle = sin(angle);

  vec2 newDir = vec2(
    cameraDir.x * cosAngle - cameraDir.y * sinAngle,
    cameraDir.x * sinAngle + cameraDir.y * cosAngle
  );

  vec2 newPlane = vec2(
    cameraPlane.x * cosAngle - cameraPlane.y * sinAngle,
    cameraPlane.x * sinAngle + cameraPlane.y * cosAngle
  );

  cameraDir = newDir;
  cameraPlane = newPlane;
}

void main() {
  float angle = getState(STATE_ANGLE) * 6.28318530718; // 2 * PI
  rotateCamera(angle);
  
  cameraPos.x = getState(STATE_X) * mapSizeF;
  cameraPos.y = getState(STATE_Y) * mapSizeF;

  // sp is screen position in range -1.0 to 1.0
  vec2 sp = screenPos;
  sp.x = sp.x * u_aspect; // Aspect ratio
  sp = sp * 2.0 - 1.0;

  // Calculate ray direction
  vec2 rayDir = cameraDir + cameraPlane * sp.x;
  rayDir = normalize(rayDir);
  vec2 rayPos = cameraPos;

  float distance = rayCast(rayPos, rayDir);
  if(distance < 0.0) return;
  
  // compensate for distance fisheye effect
  distance *= abs(dot(rayDir, cameraDir));
  
  // Calculate color based on distance, max distance is 10.0
  float maxDistance = 2.0;
  // inverse square law for light intensity
  float intensity = maxDistance / (distance * distance);
  // clamp intensity to avoid too bright colors
  intensity = clamp(intensity, 0.0, 1.0);
  vec3 wallColor = vec3(0.6, 0.55, 0.5) * intensity;

  // Calculate wall height which is based on distance
  float wallHeight = 1.0 / distance;
  //wallHeight = clamp(wallHeight, 0.0, 1.0);
  float lineTop = -wallHeight / 2.0;
  float lineBottom = wallHeight / 2.0;
  
  // draw wall which is a vertical line the height of the wall
  vec3 outColor = vec3(0.0);
  if (sp.y >= lineTop && sp.y <= lineBottom) {
    outColor = wallColor;
  }

  fragColor = vec4(outColor, 1.0);
}