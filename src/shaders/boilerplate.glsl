#version 300 es

precision highp float;
precision highp int;
precision highp sampler3D;

uniform vec2 u_resolution;  
uniform float u_time;
uniform float u_delta;
uniform float u_aspect;
uniform vec3 u_mouse;
uniform sampler2D u_analyser_tex; // Texture holding audio analyser data
uniform int u_analyser_size;      // Size of audio analyser data
uniform sampler2D u_rand_tex;     // Texture holding random values 256x256
uniform sampler2D u_midi_tex;     // Texture holding 16x128 MIDI data
uniform sampler2D u_keys_tex;     // Input texture holding key presses
uniform sampler2D u_noise_tex;    // Texture holding 2D simplex noise values 256x256
uniform sampler3D u_noise_tex3;   // Texture holding 3D simplex noise values 256x256

// We share boilerplate code between shaders, so these only exist in some shaders passes
in vec2 v_imgcoord;            // Used in state and post
uniform sampler2D image;       // Used in post
uniform sampler2D u_state_tex; // Used in state

out vec4 fragColor;

#define stateSize 256.0
#define getState(INDEX) texture(u_state_tex, vec2(float(INDEX) / stateSize, 0.0)).r

// Only works in state shader
#define stateSetup fragColor = texture(u_state_tex, v_imgcoord)
// Only works in state shader
#define setState(INDEX, VAL) if(int(v_imgcoord.x * stateSize) == INDEX) fragColor = vec4(VAL) 

// Other functions below

#define screenPos gl_FragCoord.xy / u_resolution.xy
#define screenPosAspect gl_FragCoord.xy / u_resolution.xy * vec2(u_aspect, 1.0) - vec2(0.5, 0.0)

#define audioFreqData(INDEX) texture(u_analyser_tex, vec2(float(INDEX) / float(u_analyser_size), 0.0)).r

vec3 hsv2rgb(float h, float s, float v)
{
  vec4 t = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
  vec3 p = abs(fract(vec3(h) + t.xyz) * 6.0 - vec3(t.w));
  return v * mix(vec3(t.x), clamp(p - vec3(t.x), 0.0, 1.0), s);
}

float randTex(float r) {
  vec2 sp = screenPos;
  float seed = fract(u_time + r);
  return texture(u_rand_tex, sp + seed).r;
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

bool keyIsPressed(int key) {
  vec2 keyPos = vec2(float(key) / 256.0, 0.0);
  return texture(u_keys_tex, keyPos).r > 0.0;
}