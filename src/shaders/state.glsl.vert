#version 300 es

precision highp float;
in vec4 position;
in vec2 state_coord;
out vec2 v_imgcoord;

void main() {
  v_imgcoord = state_coord;
  gl_Position = position;
}