precision mediump float;

uniform vec4 u_sphereColor;
varying highp vec3 v_lighting;

void main(void) {
  gl_FragColor = u_sphereColor * vec4(v_lighting, 1.0);
}
