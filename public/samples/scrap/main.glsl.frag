const float size = 20.0;

void main() {
  vec2 mouseBox = vec2(0.0, 0.0);
  float mouseY = u_resolution.y - u_mouse.y;
  float mouseX = u_mouse.x;
  float mouseBut = u_mouse.z/4.0; 

  // Create a box around the mouse position using gl_FragCoord
  if (mouseX > gl_FragCoord.x && mouseX < gl_FragCoord.x + size && mouseY > gl_FragCoord.y && mouseY < gl_FragCoord.y + size) {
    mouseBox = vec2(1.0);
  }

  // Colorize the box area
  vec3 color = vec3(0.0, 0.0, 0.0);
  color += mouseBox.x * mouseBox.y * vec3(mouseBut, 0.0, 0.6);

  // Output to screen
  fragColor = vec4(color, 1.0);
}