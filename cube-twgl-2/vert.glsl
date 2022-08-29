precision mediump float;

uniform mat4 u_worldViewProjection;
uniform mat4 u_worldInverseTranspose;

uniform vec3 u_lightWorldPos;
uniform vec3 u_lightColor;
uniform vec3 u_lightAmbient;

attribute vec4 position;
attribute vec4 color;
attribute vec3 normal;

// varying to pass to fragment shader
varying lowp vec4 v_color;
varying highp vec3 v_lighting;

void main() {
  // Standard diffuse directional lighting
  vec3 lightVector = normalize(u_lightWorldPos);
  vec4 normalWorld = u_worldInverseTranspose * vec4(normal, 1.0);
  float intensity = clamp(dot(normalWorld.xyz, lightVector), 0.0, 1.0);

  v_lighting = u_lightAmbient + (u_lightColor * intensity);
  v_color = color;
  gl_Position = u_worldViewProjection * position;
}