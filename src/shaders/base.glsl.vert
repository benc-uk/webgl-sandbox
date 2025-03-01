#version 300 es

in vec4 position;
out vec2 fragCoord;

void main() {
  gl_Position = position;
  fragCoord = position.xy;
}