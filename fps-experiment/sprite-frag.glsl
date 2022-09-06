// =============================================================
// Fragment shader for billboarded sprites, with transparency
// and simplified distance based lighting 
// =============================================================

precision highp float;

varying vec4 v_position;
varying vec3 v_normal;
varying vec2 v_texCoord;
varying float v_lightDist;

uniform vec4 u_lightColor;
uniform vec4 u_lightAmbient;

uniform sampler2D u_texture;

void main(void) {
  vec4 texel = texture2D(u_texture, v_texCoord );

  // Magic to make transparent sprites work, without blending 
  if(texel.a < 0.5) {
    discard;
  }

  float attenuation = 1.0 / (1.0 + 8.00 * v_lightDist + 1.3 * (v_lightDist * v_lightDist));
  attenuation = clamp(attenuation * 1000.0, 0.0, 1.0);

  gl_FragColor = attenuation * texel; 
}
