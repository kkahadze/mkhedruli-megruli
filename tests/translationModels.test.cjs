const assert = require('node:assert/strict')
const test = require('node:test')
const {
  DEFAULT_MODEL,
  getReasoningEffortForModel,
  loadSelectedModel,
  MODEL_MIGRATION_KEY,
  MODEL_STORAGE_KEY,
  models,
  SERVER_KEY_MODELS,
} = require('../coverage/model-tests/translationModels.js')

const previousDefault = 'gpt-5.6-sol'
const previousMigrationKey = 'mingrelian_model_migration_gpt_5_6_sol_reasoning_none_v1'
const otherModelIds = [
  'gpt-5.6-luna', 'gpt-5.5', 'gpt-5.4-nano', 'gpt-5.4-mini', 'gpt-5.4',
  'gpt-5-2025-08-07', 'gpt-5-pro-2025-10-06', 'gpt-5.2',
  'claude-sonnet-4-5-20250929', 'gemini-3-flash-preview', 'gemini-3.1-flash-lite-preview',
]

function createStorage(entries = []) {
  const values = new Map(entries)
  const writes = []
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      writes.push([key, value])
      values.set(key, value)
    },
    writes,
  }
}

test('GPT-6 Sol is the first selectable model and the previous choices remain', () => {
  assert.equal(DEFAULT_MODEL, 'gpt-6-sol')
  assert.deepEqual(models[0], { value: DEFAULT_MODEL, label: 'GPT-6 Sol (Reasoning None)', provider: 'openai' })
  assert.deepEqual(models[1], { value: previousDefault, label: 'GPT-5.6 Sol (Reasoning None)', provider: 'openai' })
  assert.deepEqual(models.slice(2).map(({ value }) => value), otherModelIds)
  assert.equal(new Set(models.map(({ value }) => value)).size, models.length)
})

test('the new model is server-key eligible and no previous eligibility changes', () => {
  assert.deepEqual([...SERVER_KEY_MODELS], [
    DEFAULT_MODEL, previousDefault, 'gpt-5.6-luna', 'gpt-5.5', 'gpt-5.4-nano', 'gemini-3.1-flash-lite-preview',
  ])
})

test('both Sol models explicitly request no reasoning while other request overrides stay unchanged', () => {
  assert.equal(getReasoningEffortForModel(DEFAULT_MODEL), 'none')
  assert.equal(getReasoningEffortForModel(previousDefault), 'none')
  for (const model of [...otherModelIds, 'unknown-model']) assert.equal(getReasoningEffortForModel(model), undefined)
})

test('new visitors get a persisted default and a migration marker', () => {
  const storage = createStorage()
  assert.notEqual(MODEL_MIGRATION_KEY, previousMigrationKey)
  assert.equal(loadSelectedModel(storage), DEFAULT_MODEL)
  assert.deepEqual(storage.writes, [[MODEL_STORAGE_KEY, DEFAULT_MODEL], [MODEL_MIGRATION_KEY, 'true']])
  assert.equal(loadSelectedModel(storage), DEFAULT_MODEL)
  assert.equal(storage.writes.length, 2)
})

test('the previous default migrates regardless of the old marker, without touching other preferences', () => {
  for (const priorMarker of [[], [[previousMigrationKey, 'true']]]) {
    const storage = createStorage([...priorMarker, [MODEL_STORAGE_KEY, previousDefault], ['mingrelian_source_lang', 'english']])
    assert.equal(loadSelectedModel(storage), DEFAULT_MODEL)
    assert.equal(storage.getItem(MODEL_STORAGE_KEY), DEFAULT_MODEL)
    assert.equal(storage.getItem(MODEL_MIGRATION_KEY), 'true')
    assert.equal(storage.getItem('mingrelian_source_lang'), 'english')
    assert.equal(storage.getItem(previousMigrationKey), priorMarker.length ? 'true' : null)
  }
})

test('saved alternatives are preserved and opting back into the previous default sticks after migration', () => {
  for (const model of [DEFAULT_MODEL, ...otherModelIds]) {
    const storage = createStorage([[MODEL_STORAGE_KEY, model]])
    assert.equal(loadSelectedModel(storage), model)
    assert.equal(storage.getItem(MODEL_STORAGE_KEY), model)
    assert.equal(storage.getItem(MODEL_MIGRATION_KEY), 'true')
  }

  const storage = createStorage()
  loadSelectedModel(storage)
  storage.setItem(MODEL_STORAGE_KEY, previousDefault)
  assert.equal(loadSelectedModel(storage), previousDefault)
  assert.equal(storage.writes.length, 3)

  const missingModel = createStorage([[MODEL_MIGRATION_KEY, 'true']])
  assert.equal(loadSelectedModel(missingModel), DEFAULT_MODEL)
})
