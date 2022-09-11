precision highp float;

uniform mat4 u_worldViewProjection;
uniform mat4 u_world;
uniform vec3 u_lightWorldPos;
uniform vec4 u_lightColor;

attribute vec4 position;
attribute vec2 texcoord;

varying vec4 v_position;
varying vec2 v_texCoord;
varying float v_lightDist;

void main() {
  v_texCoord = texcoord;

  v_position = (u_worldViewProjection * position);
  vec3 surfaceToLight = u_lightWorldPos - (u_world * position).xyz;
  v_lightDist = length(surfaceToLight);

  gl_Position = v_position;
}