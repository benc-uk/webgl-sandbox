#version 300 es

precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform float u_aspect;
uniform int u_analyser[512];

out vec4 fragColor;

vec2 screenPos(bool centered) {
  vec2 screenPos = gl_FragCoord.xy / u_resolution.xy;
  screenPos.x = (screenPos.x * u_aspect) - ((u_aspect - 1.0) / 2.0);

  if (centered) {
    screenPos.x -= 0.5;
    screenPos.y -= 0.5;
  }

  return screenPos;
}

vec3 hsv2rgb(float h, float s, float v)
{
  vec4 t = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(vec3(h) + t.xyz) * 6.0 - vec3(t.w));
  return v * mix(vec3(t.x), clamp(p - vec3(t.x), 0.0, 1.0), s);
}

float audioFreqData(int binIndex) {
  return float(u_analyser[binIndex]) / 255.0;
}