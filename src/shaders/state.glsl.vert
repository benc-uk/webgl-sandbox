#version 300 es

precision highp float;
in vec4 position;
in vec2 img_coord;
out vec2 v_imgcoord;

void main() {
  v_imgcoord = img_coord;
  gl_Position = position;
}