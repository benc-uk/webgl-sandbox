import { map, MAP_SIZE } from './map.mjs'
import * as twgl from 'https://cdnjs.cloudflare.com/ajax/libs/twgl.js/4.19.5/twgl-full.module.js'
import * as mat4 from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/mat4.js'

const baseUniforms = {
  u_lightColor: [1, 1, 1, 1],

  u_lightAmbient: [0.3, 0.3, 0.3, 1],
  u_specular: [1, 1, 1, 1],
  u_shininess: 150,
  u_specularFactor: 0.5,
}

export function buildInstances(gl) {
  const wallsBufferInfo = twgl.primitives.createCubeBufferInfo(gl, MAP_SIZE)
  const floorBufferInfo = twgl.primitives.createPlaneBufferInfo(gl, MAP_SIZE, MAP_SIZE)

  const ceilTransform = mat4.create()
  mat4.rotateZ(ceilTransform, ceilTransform, Math.PI)
  const ceilBufferInfo = twgl.primitives.createPlaneBufferInfo(gl, MAP_SIZE, MAP_SIZE, 1, 1, ceilTransform)

  const spriteTransform = mat4.create()
  mat4.scale(spriteTransform, spriteTransform, [0.6, 0.6, 0.6])
  mat4.rotateX(spriteTransform, spriteTransform, Math.PI / 2)
  const spriteBufferInfo = twgl.primitives.createPlaneBufferInfo(gl, MAP_SIZE, MAP_SIZE, 1, 1, spriteTransform)

  const wallTexture = twgl.createTexture(gl, {
    src: 'textures/STARG2.png',
  })
  const floorTexture = twgl.createTexture(gl, {
    src: 'textures/FLOOR4_8.png',
  })
  const ceilTexture = twgl.createTexture(gl, {
    src: 'textures/FLOOR5_4.png',
  })
  const spriteTexture1 = twgl.createTexture(gl, {
    src: 'sprites/TROOA1.png',
    mag: gl.NEAREST,
  })
  const spriteTexture2 = twgl.createTexture(gl, {
    src: 'sprites/TROOB1.png',
    mag: gl.NEAREST,
  })
  const spriteTexture3 = twgl.createTexture(gl, {
    src: 'sprites/TROOC1.png',
    mag: gl.NEAREST,
  })
  const spriteTexture4 = twgl.createTexture(gl, {
    src: 'sprites/TROOD1.png',
    mag: gl.NEAREST,
  })
  const spriteTextures = [spriteTexture1, spriteTexture2, spriteTexture3, spriteTexture4]
  console.log('🖼️ Textures loaded')

  const wallObj = createObject('wall', baseUniforms, wallsBufferInfo, [wallTexture], 0.0)
  const floorObj = createObject('floor', baseUniforms, floorBufferInfo, [floorTexture], 0.0)
  const ceilObj = createObject('ceil', baseUniforms, ceilBufferInfo, [ceilTexture], 0.0)
  const spriteObj = createObject('sprite', baseUniforms, spriteBufferInfo, spriteTextures, 0.4)
  console.log('📦 Built all object buffers')

  const instances = []
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      const type = map[y][x]

      switch (type) {
        case 1:
          instances.push({
            object: wallObj,
            location: [x * MAP_SIZE + MAP_SIZE / 2, 0, y * MAP_SIZE + MAP_SIZE / 2],
            textureIndex: 0,
          })
          break
        case 2:
        case 0:
          instances.push({
            object: floorObj,
            location: [x * MAP_SIZE + MAP_SIZE / 2, -5, y * MAP_SIZE + MAP_SIZE / 2],
            textureIndex: 0,
          })
          instances.push({
            object: ceilObj,
            location: [x * MAP_SIZE + MAP_SIZE / 2, 5, y * MAP_SIZE + MAP_SIZE / 2],
            textureIndex: 0,
          })
          break
      }
    }
  }

  const sprites = []
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      const type = map[y][x]

      switch (type) {
        case 2:
          sprites.push({
            object: spriteObj,
            location: [x * MAP_SIZE + MAP_SIZE / 2, -2.0, y * MAP_SIZE + MAP_SIZE / 2],
            animTime: Math.random() * spriteObj.animSpeed,
            textureIndex: 0,
          })
      }
    }
  }

  return {
    instances,
    sprites,
  }
}

//
// Create an object with the given name, uniforms, buffers and texture
//
function createObject(name, uniforms, buffers, textures, animSpeed) {
  return {
    name,
    uniforms,
    buffers,
    textures,
    animSpeed,
  }
}
