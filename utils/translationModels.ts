export const DEFAULT_MODEL = 'gpt-6-astra'
const SOL_DEFAULT_MODEL = 'gpt-6.1-sol'
const PREVIOUS_DEFAULT_MODEL = 'gpt-6-sol'

export const MODEL_STORAGE_KEY = 'mingrelian_model'
const SOL_MODEL_MIGRATION_KEY = 'mingrelian_model_migration_gpt_6_1_sol_reasoning_low_v1'
export const MODEL_MIGRATION_KEY = 'mingrelian_model_migration_gpt_6_astra_ultrafast_reasoning_low_v1'

export const models = [
  { value: DEFAULT_MODEL, label: 'GPT-6 Astra (Ultrafast, Reasoning Low)', provider: 'openai' },
  { value: SOL_DEFAULT_MODEL, label: 'GPT-6.1 Sol (Reasoning Low)', provider: 'openai' },
  { value: PREVIOUS_DEFAULT_MODEL, label: 'GPT-6 Sol (Reasoning None)', provider: 'openai' },
  { value: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', provider: 'anthropic' },
]

export const SERVER_KEY_MODELS = new Set([
  DEFAULT_MODEL,
  SOL_DEFAULT_MODEL,
  PREVIOUS_DEFAULT_MODEL,
])

export const getReasoningEffortForModel = (model: string) => {
  if (model === DEFAULT_MODEL || model === SOL_DEFAULT_MODEL) return 'low'
  if (model === PREVIOUS_DEFAULT_MODEL) return 'none'
  return undefined
}

export const loadSelectedModel = (storage: Pick<Storage, 'getItem' | 'setItem'>): string => {
  const savedModel = storage.getItem(MODEL_STORAGE_KEY)

  // Removed or unknown models must fall back even after the default migration ran.
  if (savedModel && !models.some(({ value }) => value === savedModel)) {
    storage.setItem(MODEL_STORAGE_KEY, DEFAULT_MODEL)
    storage.setItem(MODEL_MIGRATION_KEY, 'true')
    return DEFAULT_MODEL
  }

  if (storage.getItem(MODEL_MIGRATION_KEY) === 'true') return savedModel || DEFAULT_MODEL

  // Migrate skipped defaults while preserving later explicit choices.
  const isUnmigratedPreviousDefault = savedModel === PREVIOUS_DEFAULT_MODEL && storage.getItem(SOL_MODEL_MIGRATION_KEY) !== 'true'
  const selectedModel = !savedModel || savedModel === SOL_DEFAULT_MODEL || isUnmigratedPreviousDefault ? DEFAULT_MODEL : savedModel
  storage.setItem(MODEL_STORAGE_KEY, selectedModel)
  storage.setItem(MODEL_MIGRATION_KEY, 'true')
  return selectedModel
}
