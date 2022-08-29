precision mediump float;

uniform mat4 u_modelViewMatrix;
uniform mat4 u_projectionMatrix;
uniform mat4 u_normalMatrix;
uniform vec3 u_lightWorldPos;
uniform vec3 u_lightColor;
uniform vec3 u_lightAmbient;
uniform mat4 u_worldMatrix;
uniform float u_hueShift;

attribute vec4 position;
attribute vec4 color;
attribute vec3 normal;

// varying to pass to fragment shader
varying lowp vec4 v_color;
varying highp vec3 v_lighting;

void main() {
  // Standard diffuse directional lighting
  highp vec3 lightVector = normalize(u_lightWorldPos);
  highp vec4 transformedNormal = u_normalMatrix * vec4(normal, 1.0);
  highp float intensity = clamp(dot(transformedNormal.xyz, lightVector), 0.0, 1.0);

  v_lighting = u_lightAmbient + (u_lightColor * intensity);
  v_color = color;
  gl_Position = u_projectionMatrix * u_worldMatrix * u_modelViewMatrix * position;
}