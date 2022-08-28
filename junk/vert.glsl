    uniform mat4 u_worldViewProjectionx;
    uniform vec3 u_lightWorldPos;
    uniform mat4 u_world;
    uniform mat4 u_viewInverse;
    uniform mat4 u_worldInverseTranspose;

    attribute vec4 position;
    attribute vec4 color;
    attribute vec3 normal;
    attribute vec2 texcoord;

    varying vec4 v_position;
    varying vec2 v_texCoord;
    varying vec3 v_normal;
    varying vec3 v_surfaceToLight;
    varying vec3 v_surfaceToView;
    varying vec4 v_color;

    void main() {
      v_color = color;
      v_texCoord = texcoord;
      v_position = u_worldViewProjectionx * position;
      v_normal = (u_worldInverseTranspose * vec4(normal, 0)).xyz;
      v_surfaceToLight = u_lightWorldPos - (u_world * position).xyz;
      v_surfaceToView = (u_viewInverse[3] - (u_world * position)).xyz;
      gl_Position = v_position;
    }