//
// A collection of DOM utility functions, with a jQuery-like flavor
//

export const $ = document.querySelector.bind(document)

export const $$ = document.querySelectorAll.bind(document)

export function hide(selector) {
  $(selector).style.display = 'none'
}

export function show(selector) {
  $(selector).style.display = 'block'
}

export function toggle(selector) {
  const el = $(selector)
  if (el.style.display === 'none') {
    el.style.display = 'block'
  } else {
    el.style.display = 'none'
  }
}

export function setText(selector, text) {
  $(selector).innerText = text
}

export function setHtml(selector, html) {
  $(selector).innerHTML = html
}

export function onClick(selector, callback, once = false) {
  $(selector).addEventListener('click', callback, { once })
}

export function onKeyDown(selector, callback) {
  $(selector).addEventListener('keydown', callback)
}

export function onKeyDownWithCode(selector, code, callback) {
  $(selector).addEventListener('keydown', (e) => {
    if (e.code === code) {
      callback(e)
    }
  })
}

export function onFullscreenChange(selector, callback) {
  $(selector).addEventListener('fullscreenchange', callback)
}

export function onChange(selector, callback) {
  $(selector).addEventListener('change', callback)
}

export function disable(selector) {
  $(selector).disabled = true
}

export function enable(selector) {
  $(selector).disabled = false
}

export function floatValue(selector) {
  return parseFloat($(selector).value)
}
