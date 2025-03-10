// Swirling colors

void main(){
  vec2 sp = screenPos(0.0);

  // Each four corners of the screen has a different hue and the hue changes over time
  float cornerHue1 = (sp.x + sp.y) * 0.2 + u_time * 0.1;
  float cornerHue2 = (sp.x - sp.y) * 0.1 + u_time * 0.1;
  float cornerHue3 = (-sp.x + sp.y) * 0.3 + u_time * 0.1;
  float cornerHue4 = (-sp.x - sp.y) * 0.15 + u_time * 0.1;

  // Wobbles
  cornerHue1 -= sin01(u_time, 0.41);
  cornerHue3 -= sin01(u_time, 0.73);

  // Interpolate between the four hues based on the position of the pixel
  float hue = mix(mix(cornerHue1, cornerHue2, sp.x), mix(cornerHue3, cornerHue4, sp.x), sp.y);
  
  // Convert hue to rgb
  fragColor = vec4(hsv2rgb(hue, 0.7, 0.99), 1.0);
}