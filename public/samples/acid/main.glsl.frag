// Acid trip

void main(){
  vec2 sp = screenPos(0.0);

  // Wobble zoom
  sp *= (sin(u_time * 0.8) * 0.01) + 0.05;

  // Wobble and scroll
  float offx = sin(u_time * 1.7) * 0.01;
  float offy = u_time * -0.01;
  sp += vec2(offx, offy);

  // Create octave noise with 3 layers
  float noise = octaveNoise(sp, 6);

  float t = sin01(u_time, 0.3) * 0.6 + 0.4;
  float f1 = (t * 13.0) + 2.2;
  float f2 = (t * 0.15) + 0.4;
  float hue = smoothstep(noise, noise * 2.0, f2) * f1;
  
  // convert hsv to rgb
  vec3 color = hsv2rgb(hue+sin(u_time * 0.05), 0.9, 2.0);

  // output the color
  fragColor = vec4(color, 1.0);
}