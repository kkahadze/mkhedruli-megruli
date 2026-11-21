const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const assert = require('node:assert/strict')

const root = path.resolve(__dirname, '..')
const read = (relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')

test('API keys are never persisted in browser storage', () => {
  const page = read('app/(translator)/layout.tsx')
  const settings = read('components/SettingsModal.tsx')

  assert.doesNotMatch(
    page,
    /localStorage\.(?:getItem|setItem)\(['"]mingrelian_(?:openai|anthropic)_key['"]/
  )
  assert.match(page, /localStorage\.removeItem\(key\)/)
  assert.doesNotMatch(settings, /rememberOpenai|rememberAnthropic|rememberKey/)
})

test('the static frontend declares a restrictive content security policy', () => {
  const layout = read('app/layout.tsx')

  assert.match(layout, /Content-Security-Policy/)
  assert.match(layout, /default-src 'self'/)
  assert.match(layout, /object-src 'none'/)
  assert.match(layout, /connect-src 'self' https:\/\/argo-translator\.onrender\.com/)
})

test('translation payloads are not written to the browser console', () => {
  const page = read('app/(translator)/layout.tsx')

  assert.doesNotMatch(page, /Translation successful:/)
  assert.doesNotMatch(page, /Request body:/)
})
