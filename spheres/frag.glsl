precision mediump float;

uniform vec4 u_sphereColor;
varying vec3 v_lighting;
varying vec4 v_pos;

void main(void) {
  float s = sin(v_pos.x*2.0) ;
  float y = sin(v_pos.z/3.0) ;
  gl_FragColor = vec4(s, 0.1, y, 1) * vec4(v_lighting, 1.0);
}
