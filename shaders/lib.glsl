vec2 screenPos() {
  vec2 screenPos = gl_FragCoord.xy / u_resolution.xy;
  screenPos.x = (screenPos.x * u_aspect) - ((u_aspect - 1.0) / 2.0);
  return screenPos;
}