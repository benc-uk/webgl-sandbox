precision mediump float;

varying lowp vec4 v_color;
varying highp vec3 v_lighting;

void main(void) {
  gl_FragColor = v_color * vec4(v_lighting, 1.0);
}
