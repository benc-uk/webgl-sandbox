import * as twgl from '../lib/twgl/dist/4.x/twgl-full.module.js'
import { vec3 } from '../lib/gl-matrix/esm/index.js'

//
// wallBufferInfo - creates a rectangle, how hard can that be?!
// Returns a twgl BufferInfo https://twgljs.org/docs/module-twgl.html#.BufferInfo
//
export function wallBufferInfo(gl, p1, p2, floorHeight, ceilingHeight) {
  // prettier-ignore
  const positions = [
     p1.x, ceilingHeight, p1.y,
     p2.x, ceilingHeight, p2.y,
     p1.x, floorHeight, p1.y,
     p2.x, floorHeight, p2.y,
  ];
  const positionBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer)
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW)

  // Work out normal with classic cross product method
  let v1 = vec3.fromValues(positions[0] - positions[3], positions[1] - positions[4], positions[2] - positions[5])
  let v2 = vec3.fromValues(positions[0] - positions[6], positions[1] - positions[7], positions[2] - positions[8])
  let n = vec3.normalize(vec3.create(), vec3.cross(vec3.create(), v2, v1))
  const normals = [n[0], n[1], n[2], n[0], n[1], n[2], n[0], n[1], n[2], n[0], n[1], n[2]]

  // prettier-ignore
  const indices = [
    0, 2, 1,
    1, 2, 3
  ];
  const indexBuffer = gl.createBuffer()
  gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuffer)
  gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(indices), gl.STATIC_DRAW)

  var arrays = {
    position: { data: positions },
    normal: { numComponents: 3, data: normals },
    indices: { numComponents: 3, data: indices },
  }

  return twgl.createBufferInfoFromArrays(gl, arrays)
}
