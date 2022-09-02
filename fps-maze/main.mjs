import { fetchShaders, setOverlay } from '../lib/gl-utils.mjs'
import * as twgl from 'https://cdnjs.cloudflare.com/ajax/libs/twgl.js/4.19.5/twgl-full.module.js'
import * as mat4 from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/mat4.js'

import { map } from './map.mjs'

const FOV = 45
const FAR_CLIP = 300
let camera
let lightPos = [0, 0, 0]
const MAP_SIZE = 10
let inputMap = {}

const baseUniforms = {
  u_lightColor: [1, 1, 1, 1],

  u_diffuseMult: [0.8, 0.8, 0.8, 1],
  u_lightAmbient: [0.3, 0.3, 0.3, 1],
  u_specular: [1, 1, 1, 1],
  u_shininess: 150,
  u_specularFactor: 0.5,
}

//
// Start here when the page is loaded.
//
window.onload = async () => {
  const gl = document.querySelector('canvas').getContext('webgl2')
  if (!gl) {
    setOverlay('Unable to initialize WebGL. Your browser or machine may not support it!')
    return
  }

  initInput()

  // Load shaders from external files
  const { vertShaderSource, fragShaderSource } = await fetchShaders('./vert.glsl', './frag.glsl')

  // Use TWLG to set up the shaders and program
  let programInfo = null
  try {
    programInfo = twgl.createProgramInfo(gl, [vertShaderSource, fragShaderSource])
  } catch (err) {
    setOverlay(err.message)
    return
  }

  const wallsBufferInfo = twgl.primitives.createCubeBufferInfo(gl, MAP_SIZE)
  const floorBufferInfo = twgl.primitives.createPlaneBufferInfo(gl, MAP_SIZE, MAP_SIZE)

  const wallTexture = twgl.createTexture(gl, {
    src: 'textures/STARG2.png',
    mag: gl.NEAREST_MIPMAP_LINEAR,
  })
  const floorTexture = twgl.createTexture(gl, {
    src: 'textures/FLOOR5_4.png',
    mag: gl.NEAREST_MIPMAP_LINEAR,
  })

  const wallObj = createObject('wall', baseUniforms, wallsBufferInfo, wallTexture)
  const floorObj = createObject('floor', baseUniforms, floorBufferInfo, floorTexture)

  const instances = []
  for (let y = 0; y < map.length; y++) {
    for (let x = 0; x < map[y].length; x++) {
      const type = map[y][x]
      const h = type == 0 ? -5 : 0
      instances.push({
        object: type ? wallObj : floorObj,
        location: [x * MAP_SIZE, h, y * MAP_SIZE],
      })
    }
  }

  camera = mat4.create()
  mat4.targetTo(camera, [30, 0, 30], [40, 0, 30], [0, 1, 0])

  // Draw the scene repeatedly every frame
  var prevTime = 0
  async function render(now) {
    now *= 0.001
    const deltaTime = now - prevTime // Get smoothed time difference
    prevTime = now

    handleInputs()
    gl.enable(gl.DEPTH_TEST)
    gl.enable(gl.CULL_FACE)
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT)

    drawScene(gl, programInfo, instances, deltaTime)
    requestAnimationFrame(render)
  }

  // Start the render loop first time
  requestAnimationFrame(render)
}

//
// Draw the scene!
//
function drawScene(gl, programInfo, instances) {
  twgl.resizeCanvasToDisplaySize(gl.canvas)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

  const view = mat4.create()
  mat4.invert(view, camera)

  // Do this in every frame since the window and therefore the aspect ratio of projection matrix might change
  const perspective = mat4.create()
  mat4.perspective(perspective, (FOV * Math.PI) / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, FAR_CLIP)
  const viewProjection = mat4.create()
  mat4.multiply(viewProjection, perspective, view)

  let uniforms = {
    u_viewInverse: camera, // Add the view inverse to the uniforms, we need it for shading
    u_lightWorldPos: lightPos,
  }

  for (let instance of instances) {
    uniforms = {
      ...uniforms,
      ...instance.object.uniforms,
      u_texture: instance.object.texture,
      u_worldInverseTranspose: mat4.create(), // For transforming normals
      u_worldViewProjection: mat4.create(), // Main transformation matrix for vetices
    }

    // Move object into the world
    const world = mat4.create()
    mat4.translate(world, world, [instance.location[0], instance.location[1], instance.location[2]])
    uniforms.u_world = world

    // Populate u_worldInverseTranspose - used for normals & shading
    mat4.invert(uniforms.u_worldInverseTranspose, world)
    mat4.transpose(uniforms.u_worldInverseTranspose, uniforms.u_worldInverseTranspose)

    // Populate u_worldViewProjection which is pretty fundamental
    mat4.multiply(uniforms.u_worldViewProjection, viewProjection, world)

    // Actual drawing
    gl.useProgram(programInfo.program)
    twgl.setBuffersAndAttributes(gl, programInfo, instance.object.buffers)
    twgl.setUniforms(programInfo, uniforms)
    twgl.drawBufferInfo(gl, instance.object.buffers)
  }
}

//
// Initialize the input handling
//
function initInput() {
  window.addEventListener('keydown', (e) => {
    inputMap[e.key] = true
  })
  window.addEventListener('keyup', (e) => {
    delete inputMap[e.key]
  })
}

//
// Handle any active input, called every frame
//
function handleInputs() {
  const oldPosX = camera[12]
  const oldPosY = camera[14]

  if (inputMap['w']) {
    mat4.translate(camera, camera, [0, 0, -0.7])
  }

  if (inputMap['s']) {
    mat4.translate(camera, camera, [0, 0, 0.7])
  }

  if (inputMap['q']) {
    mat4.translate(camera, camera, [-0.5, 0, 0])
  }

  if (inputMap['e']) {
    mat4.translate(camera, camera, [0.5, 0, 0])
  }

  if (inputMap['a']) {
    mat4.rotate(camera, camera, 0.04, [0, 1, 0])
  }

  if (inputMap['d']) {
    mat4.rotate(camera, camera, -0.04, [0, 1, 0])
  }

  const x = Math.floor(camera[12] / MAP_SIZE) + 1
  const y = Math.floor(camera[14] / MAP_SIZE) + 1
  if (map[x][y] == 1) {
    camera[12] = oldPosX
    camera[14] = oldPosY
  }

  // Move the light to the camera position
  lightPos = [camera[12], 0.6, camera[14]]
}

//
//
//
function createObject(name, uniforms, buffers, texture) {
  return {
    name,
    uniforms,
    buffers,
    texture,
  }
}
