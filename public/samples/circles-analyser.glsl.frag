void main() {
  float radius = 0.5;
  float width = 1.3 * audioFreqData(102) * 5.0;
  float power = 0.1 * audioFreqData(2) * 2.0;

  vec4 color = vec4(0.7, 1.0-abs(sin(u_time * 0.5)), abs(sin(u_time * 0.8)), 1.0);

  float dist1 = length(screenPos(true));
  dist1 = fract((dist1 * 12.0) - u_time * audioFreqData(200) * 1.0);
  float dist2 = dist1 - radius;
  float intensity = pow(radius / abs(dist2), width); 
  vec3 finalColor = color.rgb * intensity * power * max((0.8- abs(dist2)), 0.0);

  fragColor = vec4(finalColor, 1.0);
}