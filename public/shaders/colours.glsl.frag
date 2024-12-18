void main() {
  vec2 screenPos = gl_FragCoord.xy / u_resolution.xy;

  float r = abs(sin(u_time * 0.8)) * screenPos.x;
  float g = abs(sin(u_time * 0.5)) * screenPos.y;
  float b = abs(cos(u_time * 0.4)) * (screenPos.x/2.0) + (screenPos.y/2.0);
  
  fragColor = vec4(r, g, b, 1.0);
}