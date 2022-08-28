attribute vec4 aVertexPosition;
attribute vec4 aVertexColor;

uniform mat4 uModelViewMatrix;
uniform mat4 uProjectionMatrix;

// varying to pass to fragment shader
varying lowp vec4 vColor;

void main(void) {
  // transform vertex position using model view and projection matrices
  gl_Position = uProjectionMatrix * uModelViewMatrix * aVertexPosition;

  // Set the varrying to the vertex color
  vColor = aVertexColor;
}