precision mediump float;

uniform mat4 u_worldViewProjection;
uniform mat4 u_world;
uniform mat4 u_viewInverse;
uniform mat4 u_worldInverseTranspose;

uniform vec3 u_lightWorldPos;
uniform vec4 u_lightColor;
uniform vec3 u_lightAmbient;

attribute vec4 position;
attribute vec3 normal;

// varying to pass to fragment shader
//varying highp vec3 v_lighting;
varying vec4 v_position;
varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

void main() {
  // Standard diffuse directional lighting
  // vec3 lightVector = normalize(u_lightWorldPos);
  // vec4 normalWorld = u_worldInverseTranspose * vec4(normal, 1.0);
  // float intensity = clamp(dot(normalWorld.xyz, lightVector), 0.0, 1.0);

  // v_lighting = u_lightAmbient + (u_lightColor * intensity);
  // gl_Position = u_worldViewProjection * position;

  v_position = (u_worldViewProjection * position);
  v_normal = (u_worldInverseTranspose * vec4(normal, 0)).xyz;
  v_surfaceToLight = u_lightWorldPos - (u_world * position).xyz;
  v_surfaceToView = (u_viewInverse[3] - (u_world * position)).xyz;
  gl_Position = v_position;
}