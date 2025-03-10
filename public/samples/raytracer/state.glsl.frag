// Raytracer state shader
#define SPHERE_X 1
#define SPHERE_Y 2
#define FIRST_RUN 3

void main() {
  stateSetup; 
  
  if(getState(FIRST_RUN) != 1.0) {
    setState(SPHERE_Y, 0.5); 
    setState(SPHERE_X, 0.5); 
    setState(FIRST_RUN, 1.0);
  }
  
  float spY = getState(SPHERE_Y);
  float spX = getState(SPHERE_X);

  if(keyIsPressed(83)) {
    setState(SPHERE_Y, spY-0.02); 
  }
  if(keyIsPressed(87)) { 
    setState(SPHERE_Y, spY+0.02); 
  }
  
  if(keyIsPressed(65)) { 
    setState(SPHERE_X, spX-0.02); 
  } 
  if(keyIsPressed(68)) { 
    setState(SPHERE_X, spX+0.02); 
  }
}