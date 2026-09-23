export const DEFAULT_MODEL = 'gpt-6-sol'
const PREVIOUS_DEFAULT_MODEL = 'gpt-5.6-sol'
const DEFAULT_REASONING_EFFORT = 'none'

export const MODEL_STORAGE_KEY = 'mingrelian_model'
export const MODEL_MIGRATION_KEY = 'mingrelian_model_migration_gpt_6_sol_reasoning_none_v1'

export const models = [
  { value: DEFAULT_MODEL, label: 'GPT-6 Sol (Reasoning None)', provider: 'openai' },
  { value: PREVIOUS_DEFAULT_MODEL, label: 'GPT-5.6 Sol (Reasoning None)', provider: 'openai' },
  { value: 'gpt-5.6-luna', label: 'GPT-5.6 Luna (Reasoning Low)', provider: 'openai' },
  { value: 'gpt-5.5', label: 'GPT-5.5 (Reasoning None)', provider: 'openai' },
  { value: 'gpt-5.4-nano', label: 'GPT-5.4 Nano', provider: 'openai' },
  { value: 'gpt-5.4-mini', label: 'GPT-5.4 Mini', provider: 'openai' },
  { value: 'gpt-5.4', label: 'GPT-5.4', provider: 'openai' },
  { value: 'gpt-5-2025-08-07', label: 'GPT-5', provider: 'openai' },
  { value: 'gpt-5-pro-2025-10-06', label: 'GPT-5 Pro', provider: 'openai' },
  { value: 'gpt-5.2', label: 'GPT-5.2', provider: 'openai' },
  { value: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', provider: 'anthropic' },
  { value: 'gemini-3-flash-preview', label: 'Gemini 3 Flash Preview', provider: 'gemini' },
  { value: 'gemini-3.1-flash-lite-preview', label: 'Gemini 3.1 Flash Lite', provider: 'gemini' },
]

export const SERVER_KEY_MODELS = new Set([
  DEFAULT_MODEL,
  PREVIOUS_DEFAULT_MODEL,
  'gpt-5.6-luna',
  'gpt-5.5',
  'gpt-5.4-nano',
  'gemini-3.1-flash-lite-preview',
])

export const getReasoningEffortForModel = (model: string) => {
  return model === DEFAULT_MODEL || model === PREVIOUS_DEFAULT_MODEL ? DEFAULT_REASONING_EFFORT : undefined
}

export const loadSelectedModel = (storage: Pick<Storage, 'getItem' | 'setItem'>): string => {
  const savedModel = storage.getItem(MODEL_STORAGE_KEY)

  if (storage.getItem(MODEL_MIGRATION_KEY) === 'true') return savedModel || DEFAULT_MODEL

  const selectedModel = !savedModel || savedModel === PREVIOUS_DEFAULT_MODEL ? DEFAULT_MODEL : savedModel
  storage.setItem(MODEL_STORAGE_KEY, selectedModel)
  storage.setItem(MODEL_MIGRATION_KEY, 'true')
  return selectedModel
}
