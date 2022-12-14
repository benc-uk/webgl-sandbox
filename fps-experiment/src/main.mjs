import { fetchShaders, setOverlay } from '../../lib/gl-utils.mjs'
import { buildInstances } from './world.mjs'
import * as twgl from '../lib/twgl/dist/4.x/twgl-full.module.js'
import { mat4 } from '../lib/gl-matrix/esm/index.js'

import * as Cannon from '../lib/cannon-es/dist/cannon-es.js'

const VERSION = '0.1.3'
const FOV = 45
const FAR_CLIP = 300

let camera

let inputMap = {}

let playerBody
let playerFacing = [0, 0, 0]
let playerLight = [0, 0, 0]

//
// Start here when the page is loaded.
//
window.onload = async () => {
  console.log(`๐ Starting up... \nโ๏ธ v${VERSION}`)
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
    const { vertex: worldVert, fragment: worldFrag } = await fetchShaders('shaders/world-vert.glsl', 'shaders/world-frag.glsl')
    worldProg = twgl.createProgramInfo(gl, [worldVert, worldFrag])

    let { vertex: spriteVert, fragment: spriteFrag } = await fetchShaders('shaders/sprite-vert.glsl', 'shaders/sprite-frag.glsl')
    spriteProg = twgl.createProgramInfo(gl, [spriteVert, spriteFrag])

    console.log('๐จ Loaded all shaders, GL is ready')
  } catch (err) {
    console.error(err)
    setOverlay(err.message)
    // We give up, no point in continuing if we can't load the shaders!
    return
  }

  const physWorld = new Cannon.World({})
  playerBody = new Cannon.Body({
    mass: 0.001,
    shape: new Cannon.Sphere(2),
    linearDamping: 0.999,
  })
  physWorld.addBody(playerBody)
  console.log('๐งช Physics initialized')

  // build everything we are going to render
  let { instances, sprites } = buildInstances(gl, physWorld)

  // Setup player position and camera
  const playerStart = { x: 50, y: 0.1, z: 65 }
  camera = mat4.targetTo(mat4.create(), [0, 0, 0], [0, 0, -1], [0, 1, 0])
  mat4.translate(camera, camera, [playerStart.x, playerStart.y, playerStart.z])
  mat4.rotateY(camera, camera, 0)
  playerBody.position.set(camera[12], camera[13], camera[14])
  playerFacing = [camera[8], camera[9], camera[10]]
  playerLight = [camera[12], camera[13], camera[14]]

  gl.enable(gl.DEPTH_TEST)
  gl.enable(gl.CULL_FACE)

  // Draw the scene repeatedly every frame
  console.log('โป๏ธ Starting render loop with', instances.length + sprites.length, 'instances')
  var prevTime = 0

  async function render(now) {
    now *= 0.001
    const deltaTime = now - prevTime // Get smoothed time difference
    prevTime = now

    setOverlay(`FPS: ${Math.round(1 / deltaTime)}`)

    // Process inputs and controls
    handleInputs(deltaTime)

    // Update physics
    physWorld.fixedStep()

    if (now % 2 < deltaTime) {
      //console.log(facing)
    }

    gl.clear(gl.COLOR_BUFFER_BIT)
    drawScene(gl, worldProg, instances, deltaTime)
    drawScene(gl, spriteProg, sprites, deltaTime, true)

    requestAnimationFrame(render)
  }

  // Start the render loop first time
  requestAnimationFrame(render)
}

let time = 0.0
//
// Draw the scene!
//
function drawScene(gl, programInfo, instances, deltaTime, billboard = false) {
  time += deltaTime
  twgl.resizeCanvasToDisplaySize(gl.canvas)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)

  const view = mat4.create()
  mat4.invert(view, camera)

  // Do this in every frame since the window and therefore the aspect ratio of projection matrix might change
  const perspective = mat4.perspective(mat4.create(), (FOV * Math.PI) / 180, gl.canvas.clientWidth / gl.canvas.clientHeight, 0.1, FAR_CLIP)

  let uniforms = {
    u_viewInverse: camera, // Add the view inverse to the uniforms, we need it for shading
    u_lightWorldPos: playerLight,
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
    e.preventDefault()

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

    return false
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
function handleInputs(deltaTime) {
  let moveSpeed = 64.0 // Don't understand why don't need to multiply by deltaTime here
  let turnSpeed = 3.8 * deltaTime

  if (inputMap['w'] || inputMap['ArrowUp']) {
    playerBody.velocity.set(-playerFacing[0] * moveSpeed, -playerFacing[1] * moveSpeed, -playerFacing[2] * moveSpeed)
  }

  if (inputMap['s'] || inputMap['ArrowDown']) {
    playerBody.velocity.set(playerFacing[0] * moveSpeed, playerFacing[1] * moveSpeed, playerFacing[2] * moveSpeed)
    playerBody.velocity.set(playerFacing[0] * moveSpeed, playerFacing[1] * moveSpeed, playerFacing[2] * moveSpeed)
  }

  if (inputMap['q'] || inputMap['z']) {
    playerBody.velocity.set((-playerFacing[2] * moveSpeed) / 2, 0, (playerFacing[0] * moveSpeed) / 2)
  }

  if (inputMap['e'] || inputMap['x']) {
    playerBody.velocity.set((playerFacing[2] * moveSpeed) / 2, 0, (-playerFacing[0] * moveSpeed) / 2)
  }

  if (inputMap['a'] || inputMap['ArrowLeft']) {
    mat4.rotateY(camera, camera, turnSpeed)

    // update facing
    playerFacing = [camera[8], camera[9], camera[10]]
  }

  if (inputMap['d'] || inputMap['ArrowRight']) {
    mat4.rotateY(camera, camera, -turnSpeed)

    // update facing
    playerFacing = [camera[8], camera[9], camera[10]]
  }

  // Move the camera & light to the player position
  playerLight = [playerBody.position.x, playerBody.position.y + 3, playerBody.position.z]
  camera[12] = playerBody.position.x
  camera[14] = playerBody.position.z
}
