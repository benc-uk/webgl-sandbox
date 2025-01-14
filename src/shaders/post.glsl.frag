// Default post-processing shader
      
void main() {
  // Simply output the pixel from the input image
  fragColor = texture(image, v_imgcoord);
}