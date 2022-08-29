precision highp float;

varying vec4 v_position;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

uniform vec4 u_sphereColor;

uniform vec4 u_lightColor;
uniform vec4 u_lightAmbient;
uniform vec4 u_diffuseMult;
uniform vec4 u_specular;
uniform float u_shininess;
uniform float u_specularFactor;

vec2 lit(float NdotL, float NdotH, float shininess) {
  return vec2(
    abs(NdotL),                                            // Diffuse term in x
    (NdotL > 0.0) ? pow(max(0.0, NdotH), shininess) : 0.0  // Specular term in y
  );
}

void main(void) {
  vec4 diffuseColor = u_sphereColor * u_diffuseMult;

  vec3 a_normal = normalize(v_normal);
  vec3 surfaceToLight = normalize(v_surfaceToLight);
  vec3 surfaceToView = normalize(v_surfaceToView);
  vec3 halfVector = normalize(surfaceToLight + surfaceToView);

  vec2 lighting = lit(dot(a_normal, surfaceToLight), dot(a_normal, halfVector), u_shininess);
  
  vec4 outColor = vec4(
    (u_sphereColor * u_lightAmbient + (u_lightColor * (diffuseColor * lighting.x + u_specular * lighting.y * u_specularFactor))).rgb, 
    diffuseColor.a
  );

  gl_FragColor = outColor;
}
