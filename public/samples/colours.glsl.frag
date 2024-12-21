// Swirl of colours

void main() {
  vec2 sp = screenPos(0.0);

  float r = abs(sin(u_time * 0.8)) * sp.x;
  float g = abs(sin(u_time * 0.5)) * sp.y;
  float b = abs(cos(u_time * 0.4)) * (sp.x/2.0) + (sp.y/2.0);
  
  fragColor = vec4(r, g, b, 1.0);
}