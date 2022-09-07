import { fetchShaders, setOverlay } from '../lib/gl-utils.mjs'
import { buildInstances } from './world.mjs'
import { map, MAP_SIZE } from './map.mjs'
import * as twgl from 'https://cdnjs.cloudflare.com/ajax/libs/twgl.js/4.19.5/twgl-full.module.js'
import * as mat4 from 'https://cdn.jsdelivr.net/npm/gl-matrix@3.4.3/esm/mat4.js'

const VERSION = '0.0.28'
const FOV = 45
const FAR_CLIP = 300

let camera
let lightPos = [0, 0, 0]

let inputMap = {}

//
// Start here when the page is loaded.
//
window.onload = async () => {
  console.log(`🌍 Starting up... \n⚒️ v${VERSION}`)
  document.querySelector('#version').innerText = VERSION

  const gl = document.querySelector('canvas').getContext('webgl2')
  if (!gl) {
    setOverlay('Unable to initialize WebGL. Your browser or machine may not support it!')
    return
  }

  initInput(gl)

  // Use TWLG to set up the shaders and programs
  // We have two programs and two pairs of shaders, one for the world and one for the sprites
  let worldProg = null
  let spriteProg = null
  try {
    // Note, we load shaders from external files
    const { vertex: worldVert, fragment: worldFrag } = await fetchShaders('./world-vert.glsl', './world-frag.glsl')
    worldProg = twgl.createProgramInfo(gl, [worldVert, worldFrag])

    let { vertex: spriteVert, fragment: spriteFrag } = await fetchShaders('./sprite-vert.glsl', './sprite-frag.glsl')
    spriteProg = twgl.createProgramInfo(gl, [spriteVert, spriteFrag])

    console.log('🎨 Loaded all shaders, GL is ready')
  } catch (err) {
    console.error(err)
    setOverlay(err.message)
    // We give up, no point in continuing if we can't load the shaders
    return
  }

  const { instances, sprites } = buildInstances(gl)

  camera = mat4.create()
  mat4.targetTo(camera, [50, 0, 60], [40, 0, 30], [0, 1, 0])

  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)
  // gl.enable(gl.BLEND)
  // gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)

  // Draw the scene repeatedly every frame
  console.log('♻️ Starting render loop with', instances.length + sprites.length, 'instances')
  var prevTime = 0

  async function render(now) {
    now *= 0.001
    const deltaTime = now - prevTime // Get smoothed time difference
    prevTime = now

    handleInputs(gl, deltaTime)

    gl.clear(gl.COLOR_BUFFER_BIT)
    drawScene(gl, worldProg, instances, deltaTime)
    drawScene(gl, spriteProg, sprites, deltaTime, true)
    requestAnimationFrame(render)
  }

  // Start the render loop first time
  requestAnimationFrame(render)
}

//
// Draw the scene!
//
function drawScene(gl, programInfo, instances, deltaTime, billboard = false) {
  twgl.resizeCanvasToDisplaySize(gl.canvas)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

  const view = mat4.create()
  mat4.invert(view, camera)

  // Do this in every frame since the window and therefore the aspect ratio of projection matrix might change
  const perspective = mat4.create()
  mat4.perspective(perspective, (FOV * Math.PI) / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, FAR_CLIP)

  let uniforms = {
    u_viewInverse: camera, // Add the view inverse to the uniforms, we need it for shading
    u_lightWorldPos: lightPos,
  }

  for (let instance of instances) {
    let tex = instance.object.textures[instance.textureIndex]
    instance.animTime += deltaTime
    if (instance.animTime > instance.object.animSpeed) {
      instance.animTime = 0.0
      instance.textureIndex = (instance.textureIndex + 1) % instance.object.textures.length
      tex = instance.object.textures[instance.textureIndex]
    }

    uniforms = {
      ...uniforms,
      ...instance.object.uniforms,
      u_texture: tex,
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

    // World view before projection, intermediate step for billboarding
    const worldView = mat4.create()
    mat4.multiply(worldView, view, world)
    if (billboard === true) {
      worldView[0] = 1
      worldView[1] = 0
      worldView[2] = 0
      worldView[8] = 0
      worldView[9] = 0
      worldView[10] = 1
    }

    // Populate u_worldViewProjection which is pretty fundamental
    mat4.multiply(uniforms.u_worldViewProjection, perspective, worldView)

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
function initInput(gl) {
  window.addEventListener('keydown', (e) => {
    inputMap[e.key] = true
  })

  window.addEventListener('keyup', (e) => {
    delete inputMap[e.key]
  })

  function touchMouseHandler(e) {
    let x = -1
    let y = -1
    if (e.touches) {
      x = e.touches[0].clientX
      y = e.touches[0].clientY
    } else {
      x = e.clientX
      y = e.clientY
    }

    if (x < 0 || y < 0) return

    if (x < gl.canvas.clientWidth / 3) {
      inputMap['a'] = true
    }
    if (x > gl.canvas.clientWidth - gl.canvas.clientWidth / 3) {
      inputMap['d'] = true
    }
    if (y < gl.canvas.clientHeight / 3) {
      inputMap['w'] = true
    }
    if (y > gl.canvas.clientHeight - gl.canvas.clientHeight / 3) {
      inputMap['s'] = true
    }
  }

  const canvas = document.querySelector('canvas')
  canvas.addEventListener('touchstart', touchMouseHandler)
  canvas.addEventListener('mousedown', touchMouseHandler)

  canvas.addEventListener('touchend', (e) => {
    inputMap = {}
  })

  canvas.addEventListener('mouseup', (e) => {
    inputMap = {}
  })
}

//
// Handle any active input, called every frame
//
function handleInputs(gl, deltaTime) {
  const oldPosX = camera[12]
  const oldPosY = camera[14]
  let moveSpeed = 40 * deltaTime
  let turnSpeed = 3 * deltaTime

  if (inputMap['w'] || inputMap['ArrowUp']) {
    mat4.translate(camera, camera, [0, 0, -moveSpeed])
  }

  if (inputMap['s'] || inputMap['ArrowDown']) {
    mat4.translate(camera, camera, [0, 0, moveSpeed])
  }

  if (inputMap['q'] || inputMap['z']) {
    mat4.translate(camera, camera, [-moveSpeed / 2, 0, 0])
  }

  if (inputMap['e'] || inputMap['x']) {
    mat4.translate(camera, camera, [moveSpeed / 2, 0, 0])
  }

  if (inputMap['a'] || inputMap['ArrowLeft']) {
    mat4.rotateY(camera, camera, turnSpeed)
  }

  if (inputMap['d'] || inputMap['ArrowRight']) {
    mat4.rotateY(camera, camera, -turnSpeed)
  }

  const mapX = Math.floor(camera[12] / MAP_SIZE)
  const mapY = Math.floor(camera[14] / MAP_SIZE)
  if (map[mapY][mapX] == 1) {
    camera[12] = oldPosX
    camera[14] = oldPosY
  }

  // Move the light to the camera position
  lightPos = [camera[12], 0.6, camera[14]]
}
