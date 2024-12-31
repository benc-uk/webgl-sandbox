// ===============================================================================
// App entry point and initialisation of all DOM to JS bindings
// ===============================================================================

import '../css/style.css'
import '../lib/fontawesome/css/solid.css'
import '../lib/fontawesome/css/fontawesome.css'
import Alpine from 'alpinejs'

import * as audio from './audio.js'
import * as midi from './midi.js'

import { getGl, resize as resizeGL } from '../lib/gl.js'
import { execPressed, pauseOrResume, rewind, videoCapture } from './render.js'
import { editor, initEditor, resizeEditor, selector } from './editor.js'
import { loadExampleCode } from './storage.js'
import { cfg } from './config.js'

Alpine.data('app', () => ({
  version: `v${import.meta.env.PACKAGE_VERSION}`,

  showCode: true,
  isFullscreen: false,

  audioDevices: [],
  selectedAudioDeviceId: '-1',
  disableAudioSelect: false,
  audioSmoothing: 0.5,
  audioOutput: true,
  audioGain: 1.0,

  midiDevices: [],
  selectedMidiDeviceId: '-1',

  samples: [
    { title: 'Blank', name: 'blank' },
    { title: 'Hypno circles', name: 'circles' },
    { title: 'Acid trip', name: 'acid' },
    { title: 'Colour Wave', name: 'colours' },
    { title: 'Raytracer', name: 'raytracer' },
    { title: 'Scrap', name: 'scrap' },
    { title: 'Spectrum analyser', name: 'analyser' },
    { title: 'Circles analyser', name: 'circles-analyser' },
    { title: 'MIDI debug', name: 'midi-debug' },
  ],

  config: cfg(),

  init() {
    console.log('🚦 Initialising...')
    getGl(selector) // We call this early to make sure we have a GL context, but we don't need it yet

    // Get 'f' from the URL query string to load a file at startup
    const urlParams = new URLSearchParams(window.location.search)
    const fileLoad = urlParams.get('f')

    if (fileLoad) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }

    // Initialise the Monaco text editor, and then run the shader when it's ready
    initEditor(execPressed, fileLoad)

    Alpine.store('error', '')
    Alpine.store('mouseX', this.$refs.outputWrap.clientWidth / 1.7)
    Alpine.store('mouseY', this.$refs.outputWrap.clientHeight / 3)

    // Watch for resizing of the window
    window.addEventListener('resize', () => {
      resizeGL()
      resizeEditor()
    })

    // Watch for resizing of the output wrapper div (it has a resize handle)
    new MutationObserver(() => {
      resizeGL()
      resizeEditor()
    }).observe(this.$refs.outputWrap, { attributeFilter: ['style'] })

    // Add a listener for all dialogs when they open to clear the error message
    document.querySelectorAll('dialog').forEach((dialog) => {
      new MutationObserver(() => {
        Alpine.store('error', '')
      }).observe(dialog, { attributeFilter: ['open'] })
    })
  },

  loadClicked() {
    this.$refs.fileDialog.showModal()
  },

  async loadSample(file) {
    this.$refs.fileDialog.close()

    try {
      const code = await loadExampleCode(file)
      editor.setValue(code)
      rewind()
      execPressed()
    } catch (err) {
      Alpine.store('error', err.message)
    }
  },

  async showAudioDialog() {
    this.$refs.audioDialog.showModal()

    this.audioDisabled = false
    this.audioDevices = await audio.listInputDevices()

    if (this.audioDevices === null) {
      // If access is denied, we get null back so put a dummy device in the list
      this.audioDevices = [{ label: 'Input audio access denied', deviceId: '-1' }]
      this.disableAudioSelect = true
    } else {
      this.disableAudioSelect = false
      this.audioDevices.unshift({ label: '--- Select Device ---', deviceId: '-1' })
      const activeAudioDevice = audio.getActiveDevice()

      // Disable the select dropdown if we have an active device
      if (activeAudioDevice) {
        this.audioDevices = [activeAudioDevice]
        this.disableAudioSelect = true
      }
    }
  },

  async audioOpen() {
    this.$refs.audioDialog.close()
    const device = this.audioDevices.find((d) => d.deviceId === this.selectedAudioDeviceId)

    Alpine.store('audioDeviceName', device.label)
    await audio.initInput(device, this.audioOutput, this.audioSmoothing, this.audioGain)
  },

  audioClose() {
    audio.stopInput()
    Alpine.store('audioDeviceName', '')
    this.selectedAudioDeviceId = '-1'

    this.$refs.audioDialog.close()
  },

  async showMIDIDialog() {
    this.$refs.midiDialog.showModal()

    this.midiDevices = await midi.listInputDevices()
    if (this.midiDevices === null) {
      this.midiDevices = [{ name: 'MIDI access denied', id: '-1' }]
    } else {
      this.midiDevices.unshift({ name: '--- Select Device ---', id: '-1' })
    }
  },

  async midiOpen() {
    await midi.initInput(this.selectedMidiDeviceId)
    Alpine.store('midiDeviceName', midi.getActiveDeviceName())
    this.$refs.midiDialog.close()
  },

  async midiClose() {
    midi.stopInput()
    Alpine.store('midiDeviceName', '')
    this.selectedMidiDeviceId = '-1'
    this.$refs.midiDialog.close()
  },

  fullscreen() {
    if (this.isFullscreen) {
      document.exitFullscreen()
      this.isFullscreen = false
      return
    }

    this.$refs.output.requestFullscreen()
    this.isFullscreen = true
    setTimeout(() => {
      resizeGL()
      resizeEditor()
    }, 200)
  },

  toggleCode() {
    this.showCode = !this.showCode
    this.$refs.outputWrap.style.height = this.showCode ? `${window.innerHeight - window.innerHeight / 2.6}px` : `${window.innerHeight - 60}px`
    resizeGL()
    resizeEditor()
  },

  mouseMove(evt) {
    Alpine.store('mouseBut', evt.buttons)

    if (evt.buttons <= 0) return

    Alpine.store('mouseX', evt.clientX)
    Alpine.store('mouseY', evt.clientY)
  },

  pauseOrResume,
  execPressed,
  rewind,
  videoCapture,
}))

Alpine.start()
