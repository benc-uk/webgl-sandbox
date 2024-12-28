#version 300 es

precision highp float;
precision highp int;
precision highp sampler3D;

const float PHI = 1.61803398874989484820459; // Φ = Golden Ratio 

uniform vec2 u_resolution;  
uniform float u_time;
uniform float u_delta;
uniform float u_aspect;
uniform int u_analyser[512];
uniform sampler2D u_rand_tex; // Texture holding random values 256x256
uniform sampler2D u_midi_tex; // Texture holding 16x128 MIDI data
uniform sampler2D u_noise_tex; // Texture holding simplex noise values 256x256
uniform sampler3D u_noise_tex3; // Texture holding simplex noise values 256x256

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

float goldNoise(in vec2 xy, in float seed) {
  return fract(tan(distance(xy*PHI, xy)*seed)*xy.x);
}

float randGold(float r) {
  float seed = u_time; 
  return goldNoise(gl_FragCoord.xy, seed + r);
}

float randTex(float r) {
  vec2 screenPos = gl_FragCoord.xy / u_resolution.xy;
  float seed = fract(u_time + r);
  return texture(u_rand_tex, screenPos+seed).r;
}

float octaveNoise(vec2 pos, int octaves) {
  float value = 0.0;
  
  for (int i = 0; i < octaves; i++) {
    float fact = 1.0 / float(i+1);
    value += texture(u_noise_tex, pos * fact).r;
  }

  return value /= float(octaves);
}

float octaveNoise3(vec3 pos, int octaves) {
  float value = 0.0;
  
  for (int i = 0; i < octaves; i++) {
    float fact = 1.0 / float(i+1);
    value += texture(u_noise_tex3, pos * fact).r;
  }

  return value /= float(octaves);
}

float midiNote(int chan, int note) {
  vec2 m = vec2(float(note)/128.0, float(chan-1)/16.0);
  return texture(u_midi_tex, m).r;
}

float midiNoteAny(int chan) {
  // Warning here be loops & conditionals, not shader friendly
  for (int i = 127; i >= 0; i--) {
    if (midiNote(chan, i) > 0.0) {
      return float(i);
    }
  }
}

float midiCC(int chan, int cc) {
  vec2 m = vec2(float(cc)/128.0, float(chan-1)/16.0);
  return texture(u_midi_tex, m).g;
}

float sin01(float x, float scale) {
  return sin(x * scale) * 0.5 + 0.5;
}

float cos01(float x, float scale) {
  return cos(x * scale) * 0.5 + 0.5;
}

float tan01(float x, float scale) {
  return tan(x * scale) * 0.5 + 0.5;
}