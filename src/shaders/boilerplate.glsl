#version 300 es

precision highp float;

const float PHI = 1.61803398874989484820459; // Φ = Golden Ratio 

uniform vec2 u_resolution;  
uniform float u_time;
uniform float u_delta;
uniform float u_aspect;
uniform int u_analyser[512];
uniform sampler2D u_rand_tex; // Texture holding random values 256x256
uniform sampler2D u_noise_tex; // Texture holding simplex noise values 256x256

out vec4 fragColor;

vec2 screenPos(float offset) {
  vec2 screenPos = gl_FragCoord.xy / u_resolution.xy;
  screenPos.x = (screenPos.x * u_aspect) - ((u_aspect - 1.0) / 2.0);

  screenPos.y += offset;
  screenPos.x += offset;

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

float goldNoise(in vec2 xy, in float seed)
{
  return fract(tan(distance(xy*PHI, xy)*seed)*xy.x);
}

float randGold(float o) {
  float seed = u_time; 
  return goldNoise(gl_FragCoord.xy, seed+o);
}

float randTex(float o) {
  vec2 screenPos = gl_FragCoord.xy / u_resolution.xy;
  float seed = fract(u_time+o);
  return texture(u_rand_tex, screenPos+seed).r;
}