// Raytracer state shader
#define STATE_ANGLE 0
#define STATE_X 1
#define STATE_Y 2
#define ROT_SPEED 0.006
#define mapSize 10
#define mapSizeF 10.0

void main() {
  stateSetup; 
  
  if(u_time < 0.5) {
    setState(STATE_ANGLE, 0.0); 
    setState(STATE_X, 1.5/mapSizeF); 
    setState(STATE_Y, 2.8/mapSizeF);  
  }
  
  float angle = getState(STATE_ANGLE);
  
  if(keyIsPressed(65)) { 
    angle = angle - ROT_SPEED;
    if(angle < 0.0) {
      angle = 1.0;
    }
    setState(STATE_ANGLE, angle); 
  } 

  if(keyIsPressed(68)) { 
    angle = angle + ROT_SPEED;
    if(angle > 1.0) {
      angle = 0.0;
    }
    setState(STATE_ANGLE, angle); 
  }
}