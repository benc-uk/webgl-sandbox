// Spectrum analyser and audio visualizer

void main() {
  vec2 sp = gl_FragCoord.xy / u_resolution.xy;
  sp.x = floor(sp.x * 45.0) / 45.0;
  
  float val = audioFreqData(int(sp.x * 512.0));
  float line = 1.0 - step(val, sp.y);

  float t = clamp(sp.y, 0.0, 1.0) * 3.0;
  vec3 c = mix(vec3(1.0, 0.0, 0.0), vec3(1.0, 1.0, 0.0), min(t, 1.0));
  c = mix(
    c,
    mix(vec3(1.0, 1.0, 0.0), vec3(0.0, 1.0, 0.0), t - 1.0),
    step(1.0, t)
  );
  
  float r = c.r * line;
  float g = c.g * line;
  float b = c.b * line;
  
  fragColor = vec4(r, g, b, 1.0);
}