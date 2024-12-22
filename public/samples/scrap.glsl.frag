void main(){
  vec2 sp = screenPos(0.0);
  sp *= 0.1;

  float off = u_time * 0.002;
  float offy = u_time * 0.003;

  sp += vec2(off, offy);
  float noise1 = texture(u_noise_tex, vec2(sp.x, sp.y)).r;
  float noise2 = texture(u_noise_tex, vec2(sp.x*0.5, sp.y*0.5)).r;
  float noise3 = texture(u_noise_tex, vec2(sp.x*0.25, sp.y*0.25)).r;
  float noise4 = texture(u_noise_tex, vec2(sp.x*0.1, sp.y*0.1)).r;

  float noise = (noise1 + noise2 + noise3 + noise4) / 5.0;

  // convert noise to a color

  float tt = (sin(u_time*0.9) * 0.5) + 0.5;
  float t = tt*0.3+0.3;
  float w = (tt*0.15)+0.3;
  float h = (tt*0.5)+0.5;
  float hue = step(noise, w) * t;
  
  // convert hsv to rgb
  vec3 color = hsv2rgb(hue, h, 0.8);

  // output the color
  fragColor = vec4(color, 1.0);
}