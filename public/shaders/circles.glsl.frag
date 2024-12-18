// Code borrowed from https://www.shadertoy.com/view/3tdSRn

void main() {
  vec2 pos = screenPos(true);

  float radius = 0.5;
  float width = 0.8;
  float power = 0.1;

  float h = mix(0.5, 2.5, length(pos));
  vec4 color = vec4(hsv2rgb(h, 1.0, 1.0), 1.0);

  float dist1 = length(pos);
  dist1 = fract((dist1 * 5.0) - fract(u_time));
  float dist2 = dist1 - radius;
  float intensity = pow(radius / abs(dist2), width); 
  vec3 finalColor = color.rgb * intensity * power * max((0.8- abs(dist2)), 0.0);

  fragColor = vec4(finalColor, 1.0);
}