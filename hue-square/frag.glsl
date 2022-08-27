precision highp float;

varying lowp vec4 vColor;

uniform float uHueShift;

// RGB hue shifter for GLSL
// Taken from https://gist.github.com/mairod/a75e7b44f68110e1576d77419d608786
vec3 hueShift( vec3 color, float hueAdjust ){
  const vec3  kRGBToYPrime = vec3 (0.299, 0.587, 0.114);
  const vec3  kRGBToI      = vec3 (0.596, -0.275, -0.321);
  const vec3  kRGBToQ      = vec3 (0.212, -0.523, 0.311);

  const vec3  kYIQToR      = vec3 (1.0, 0.956, 0.621);
  const vec3  kYIQToG      = vec3 (1.0, -0.272, -0.647);
  const vec3  kYIQToB      = vec3 (1.0, -1.107, 1.704);

  float   YPrime  = dot (color, kRGBToYPrime);
  float   I       = dot (color, kRGBToI);
  float   Q       = dot (color, kRGBToQ);
  float   hue     = atan (Q, I);
  float   chroma  = sqrt (I * I + Q * Q);

  hue += hueAdjust;
  Q = chroma * sin (hue);
  I = chroma * cos (hue);
  vec3 yIQ = vec3 (YPrime, I, Q);

  return vec3( dot (yIQ, kYIQToR), dot (yIQ, kYIQToG), dot (yIQ, kYIQToB) );
}

void main(void) {
  // Simple form, just take the color from the varrying and output it
  // gl_FragColor = vColor;

  // Fancy form: add some dynamic hue shifting to the vColor
  gl_FragColor = vec4(hueShift(vColor.xyz, uHueShift), 1.0);
}
