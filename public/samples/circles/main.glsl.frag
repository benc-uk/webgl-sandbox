// Hypno circles

void main() {
  float radius = 0.5;
  float width = 1.8;
  float power = 0.2;

  vec4 color = vec4(abs(sin(u_time * 3.9)), 1.0-abs(sin(u_time * 2.5)), abs(sin(u_time * 2.9)), 1.0);

  float dist1 = length(screenPos(-0.5)) * 0.5;
  dist1 = fract((dist1 * 12.0) - u_time *0.7);
  float dist2 = dist1 - radius;
  float intensity = pow(radius / abs(dist2), width); 
  vec3 finalColor = color.rgb * intensity * power * max((0.8- abs(dist2)), 0.0);

  fragColor = vec4(finalColor, 1.0);
}