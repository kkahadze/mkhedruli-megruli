export type ModelProvider = 'openai' | 'anthropic' | 'gemini'

export interface ModelOption {
  value: string
  label: string
  provider: ModelProvider
  isPublic: boolean
  supportsServerKey?: boolean
  defaultReasoningEffort?: string
}

export const DEFAULT_MODEL = 'gpt-5.5'
export const DEFAULT_REASONING_EFFORT = 'none'

const GEMINI_FLASH_LITE_MODEL = 'gemini-3.1-flash-lite'
const MODEL_ALIASES: Record<string, string> = {
  'gemini-3.1-flash-lite-preview': GEMINI_FLASH_LITE_MODEL,
}

export const ALL_MODELS: readonly ModelOption[] = [
  {
    value: DEFAULT_MODEL,
    label: 'GPT-5.5',
    provider: 'openai',
    isPublic: true,
    supportsServerKey: true,
    defaultReasoningEffort: DEFAULT_REASONING_EFFORT,
  },
  {
    value: 'gpt-5.4-mini',
    label: 'GPT-5.4 Mini',
    provider: 'openai',
    isPublic: true,
    supportsServerKey: true,
  },
  {
    value: 'gpt-5.4-nano',
    label: 'GPT-5.4 Nano',
    provider: 'openai',
    isPublic: true,
    supportsServerKey: true,
  },
  {
    value: 'gpt-5.4',
    label: 'GPT-5.4',
    provider: 'openai',
    isPublic: false,
  },
  {
    value: 'gpt-5-2025-08-07',
    label: 'GPT-5',
    provider: 'openai',
    isPublic: false,
  },
  {
    value: 'gpt-5-pro-2025-10-06',
    label: 'GPT-5 Pro',
    provider: 'openai',
    isPublic: false,
  },
  {
    value: 'gpt-5.2',
    label: 'GPT-5.2',
    provider: 'openai',
    isPublic: false,
  },
  {
    value: 'claude-sonnet-4-5-20250929',
    label: 'Claude Sonnet 4.5',
    provider: 'anthropic',
    isPublic: false,
  },
  {
    value: 'gemini-3-flash-preview',
    label: 'Gemini 3 Flash Preview',
    provider: 'gemini',
    isPublic: false,
  },
  {
    value: GEMINI_FLASH_LITE_MODEL,
    label: 'Gemini 3.1 Flash Lite',
    provider: 'gemini',
    isPublic: false,
    supportsServerKey: true,
  },
]

export const PUBLIC_MODELS: readonly ModelOption[] = ALL_MODELS.filter((model) => model.isPublic)
export const PUBLIC_PROVIDERS: readonly ModelProvider[] = Array.from(
  new Set(PUBLIC_MODELS.map((model) => model.provider))
)

const MODEL_BY_VALUE = new Map(ALL_MODELS.map((model) => [model.value, model]))
const PUBLIC_MODEL_VALUES = new Set(PUBLIC_MODELS.map((model) => model.value))

export const normalizeSavedModel = (model: string | null | undefined) => {
  const normalizedModel = model ? MODEL_ALIASES[model] ?? model : DEFAULT_MODEL
  return PUBLIC_MODEL_VALUES.has(normalizedModel) ? normalizedModel : DEFAULT_MODEL
}

export const getProviderForModel = (model: string): ModelProvider => {
  return MODEL_BY_VALUE.get(model)?.provider ?? 'openai'
}

export const modelSupportsServerKey = (model: string) => {
  return MODEL_BY_VALUE.get(model)?.supportsServerKey === true
}

export const getReasoningEffortForModel = (model: string) => {
  return MODEL_BY_VALUE.get(model)?.defaultReasoningEffort
}

export const formatProviderName = (provider: ModelProvider) => {
  if (provider === 'openai') return 'OpenAI'
  if (provider === 'anthropic') return 'Anthropic'
  return 'Gemini'
}
