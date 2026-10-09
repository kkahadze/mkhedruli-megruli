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

const solDefault = 'gpt-6.1-sol'
const solMigrationKey = 'mingrelian_model_migration_gpt_6_1_sol_reasoning_low_v1'
const previousDefault = 'gpt-6-sol'
const previousMigrationKey = 'mingrelian_model_migration_gpt_6_sol_reasoning_none_v1'
const legacyDefault = 'gpt-5.6-sol'
const legacyMigrationKey = 'mingrelian_model_migration_gpt_5_6_sol_reasoning_none_v1'
const otherModelIds = [
  'gpt-5.6-luna', 'gpt-5.5', 'gpt-5.4-nano', 'gpt-5.4-mini', 'gpt-5.4',
  'gpt-5-2025-08-07', 'gpt-5-pro-2025-10-06', 'gpt-5.2',
  'claude-sonnet-4-5-20250929',
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

test('GPT-6 Astra is the first selectable model and the supported alternatives remain', () => {
  assert.equal(DEFAULT_MODEL, 'gpt-6-astra')
  assert.deepEqual(models[0], { value: DEFAULT_MODEL, label: 'GPT-6 Astra (Ultrafast, Reasoning Low)', provider: 'openai' })
  assert.deepEqual(models[1], { value: solDefault, label: 'GPT-6.1 Sol (Reasoning Low)', provider: 'openai' })
  assert.deepEqual(models[2], { value: previousDefault, label: 'GPT-6 Sol (Reasoning None)', provider: 'openai' })
  assert.deepEqual(models[3], { value: legacyDefault, label: 'GPT-5.6 Sol (Reasoning None)', provider: 'openai' })
  assert.deepEqual(models.slice(4).map(({ value }) => value), otherModelIds)
  assert.equal(new Set(models.map(({ value }) => value)).size, models.length)
})

test('supported OpenAI models remain server-key eligible', () => {
  assert.deepEqual([...SERVER_KEY_MODELS], [
    DEFAULT_MODEL, solDefault, previousDefault, legacyDefault, 'gpt-5.6-luna', 'gpt-5.5', 'gpt-5.4-nano',
  ])
})

test('GPT-6 Astra explicitly requests low reasoning while all previous overrides stay unchanged', () => {
  assert.equal(getReasoningEffortForModel(DEFAULT_MODEL), 'low')
  assert.equal(getReasoningEffortForModel(solDefault), 'low')
  assert.equal(getReasoningEffortForModel(previousDefault), 'none')
  assert.equal(getReasoningEffortForModel(legacyDefault), 'none')
  for (const model of [...otherModelIds, 'unknown-model']) assert.equal(getReasoningEffortForModel(model), undefined)
})

test('new visitors get a persisted default and a migration marker', () => {
  const storage = createStorage()
  assert.notEqual(MODEL_MIGRATION_KEY, previousMigrationKey)
  assert.equal(MODEL_MIGRATION_KEY, 'mingrelian_model_migration_gpt_6_astra_ultrafast_reasoning_low_v1')
  assert.equal(loadSelectedModel(storage), DEFAULT_MODEL)
  assert.deepEqual(storage.writes, [[MODEL_STORAGE_KEY, DEFAULT_MODEL], [MODEL_MIGRATION_KEY, 'true']])
  assert.equal(loadSelectedModel(storage), DEFAULT_MODEL)
  assert.equal(storage.writes.length, 2)
})

test('the previous default migrates regardless of the old marker, without touching other preferences', () => {
  for (const priorMarker of [[], [[solMigrationKey, 'true']]]) {
    const storage = createStorage([...priorMarker, [MODEL_STORAGE_KEY, solDefault], ['mingrelian_source_lang', 'english']])
    assert.equal(loadSelectedModel(storage), DEFAULT_MODEL)
    assert.equal(storage.getItem(MODEL_STORAGE_KEY), DEFAULT_MODEL)
    assert.equal(storage.getItem(MODEL_MIGRATION_KEY), 'true')
    assert.equal(storage.getItem('mingrelian_source_lang'), 'english')
    assert.equal(storage.getItem(solMigrationKey), priorMarker.length ? 'true' : null)
  }
})

test('the legacy default follows a skipped migration but an intentional choice made after it is preserved', () => {
  for (const olderMarker of [[], [[legacyMigrationKey, 'true']]]) {
    const storage = createStorage([...olderMarker, [MODEL_STORAGE_KEY, legacyDefault]])
    assert.equal(loadSelectedModel(storage), DEFAULT_MODEL)
    assert.equal(storage.getItem(MODEL_STORAGE_KEY), DEFAULT_MODEL)
    assert.equal(storage.getItem(MODEL_MIGRATION_KEY), 'true')
    assert.equal(storage.getItem(legacyMigrationKey), olderMarker.length ? 'true' : null)
    assert.equal(storage.getItem(previousMigrationKey), null)
  }

  const intentionalChoice = createStorage([[MODEL_STORAGE_KEY, legacyDefault], [previousMigrationKey, 'true']])
  assert.equal(loadSelectedModel(intentionalChoice), legacyDefault)
  assert.equal(intentionalChoice.getItem(MODEL_STORAGE_KEY), legacyDefault)
  assert.equal(intentionalChoice.getItem(MODEL_MIGRATION_KEY), 'true')
})

test('saved alternatives are preserved and opting back into older defaults sticks after migration', () => {
  for (const model of [DEFAULT_MODEL, ...otherModelIds]) {
    const storage = createStorage([[MODEL_STORAGE_KEY, model]])
    assert.equal(loadSelectedModel(storage), model)
    assert.equal(storage.getItem(MODEL_STORAGE_KEY), model)
    assert.equal(storage.getItem(MODEL_MIGRATION_KEY), 'true')
  }

  for (const model of [solDefault, previousDefault, legacyDefault]) {
    const storage = createStorage()
    loadSelectedModel(storage)
    storage.setItem(MODEL_STORAGE_KEY, model)
    assert.equal(loadSelectedModel(storage), model)
    assert.equal(storage.writes.length, 3)
  }

  const missingModel = createStorage([[MODEL_MIGRATION_KEY, 'true']])
  assert.equal(loadSelectedModel(missingModel), DEFAULT_MODEL)
})

test('GPT-6 Sol migrates when its successor was skipped, preserving a later explicit choice', () => {
  const skipped = createStorage([[MODEL_STORAGE_KEY, previousDefault], [previousMigrationKey, 'true']])
  assert.equal(loadSelectedModel(skipped), DEFAULT_MODEL)
  const intentional = createStorage([[MODEL_STORAGE_KEY, previousDefault], [solMigrationKey, 'true']])
  assert.equal(loadSelectedModel(intentional), previousDefault)
})


test('removed Google selections fall back before or after the default migration', () => {
  for (const removed of ['gemini-3-flash-preview', 'gemini-3.1-flash-lite-preview', 'unknown-model']) {
    for (const marker of [[], [[MODEL_MIGRATION_KEY, 'true']]]) {
      const storage = createStorage([...marker, [MODEL_STORAGE_KEY, removed], ['mingrelian_source_lang', 'english']])
      assert.equal(loadSelectedModel(storage), DEFAULT_MODEL)
      assert.equal(storage.getItem(MODEL_STORAGE_KEY), DEFAULT_MODEL)
      assert.equal(storage.getItem('mingrelian_source_lang'), 'english')
      const writes = storage.writes.length
      assert.equal(loadSelectedModel(storage), DEFAULT_MODEL)
      assert.equal(storage.writes.length, writes)
    }
  }
})
