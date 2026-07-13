'use client'

import { useState, useEffect, useMemo, useRef, type KeyboardEvent } from 'react'
import { mkhedruliToLatinized, latinizedToMkhedruli, isGeorgianScript } from '@/utils/transliterate'
import Navbar from '@/components/Navbar'
import SettingsModal from '@/components/SettingsModal'
import { useLanguage } from '@/contexts/LanguageContext'
import {
  detectSiteDefaults,
  getDefaultSiteDefaults,
  isTranslationLanguage,
  type TranslationLanguage,
} from '@/utils/siteDefaults'

// Toggle this to show/hide settings UI (API keys will be handled server-side when false)
const SHOW_SETTINGS = true
const DEFAULT_MODEL = 'gpt-5.6-luna'
const DEFAULT_REASONING_EFFORT = 'low'
const SERVER_KEY_MODELS = new Set(['gpt-5.6-luna', 'gpt-5.5', 'gpt-5.4-nano', 'gemini-3.1-flash-lite-preview'])
const MODEL_MIGRATION_KEY = 'mingrelian_model_migration_gpt_5_6_luna_reasoning_low_v1'
const VISITOR_ID_STORAGE_KEY = 'mingrelian_visitor_id'
const VISITOR_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]{0,127}$/
const DEFAULT_SITE_DEFAULTS = getDefaultSiteDefaults()
const AUTO_TRANSLATE_DELAY_MS = 1000

const createAnonymousVisitorId = () => {
  if (window.crypto?.randomUUID) {
    return window.crypto.randomUUID()
  }

  return `visitor_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 12)}`
}

const getAnonymousVisitorId = () => {
  try {
    const savedVisitorId = localStorage.getItem(VISITOR_ID_STORAGE_KEY)
    if (savedVisitorId && VISITOR_ID_PATTERN.test(savedVisitorId)) {
      return savedVisitorId
    }

    const nextVisitorId = createAnonymousVisitorId()
    localStorage.setItem(VISITOR_ID_STORAGE_KEY, nextVisitorId)
    return nextVisitorId
  } catch {
    return createAnonymousVisitorId()
  }
}

export default function Home() {
  const { language, setLanguage, t } = useLanguage()
  const [inputText, setInputText] = useState('')
  const [sourceLanguage, setSourceLanguage] = useState<TranslationLanguage>(DEFAULT_SITE_DEFAULTS.sourceLanguage)
  const [targetLanguage, setTargetLanguage] = useState<TranslationLanguage>(DEFAULT_SITE_DEFAULTS.targetLanguage)
  const [selectedModel, setSelectedModel] = useState(DEFAULT_MODEL)
  const [openaiKey, setOpenaiKey] = useState('')
  const [anthropicKey, setAnthropicKey] = useState('')
  const [geminiKey, setGeminiKey] = useState('')
  const [rememberOpenai, setRememberOpenai] = useState(false)
  const [rememberAnthropic, setRememberAnthropic] = useState(false)
  const [rememberGemini, setRememberGemini] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const activeRequestRef = useRef<AbortController | null>(null)
  const requestIdRef = useRef(0)
  const translateRef = useRef<() => void>(() => {})
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [preferencesReady, setPreferencesReady] = useState(false)
  const [result, setResult] = useState<{
    mingrelian_latinized: string
    mingrelian_mkhedruli: string
    georgian: string
    english: string
  } | null>(null)

  const languageOptions = useMemo(
    () =>
      [
        { value: 'mingrelian' as TranslationLanguage, label: t('mingrelian') },
        { value: 'georgian' as TranslationLanguage, label: t('georgian') },
        { value: 'english' as TranslationLanguage, label: t('english') },
      ],
    [t]
  )

  const setSourceLanguageSafe = (next: TranslationLanguage) => {
    if (next === targetLanguage) {
      // Pick the first different language as the new target to avoid source==target
      const fallback = (['mingrelian', 'georgian', 'english'] as const).find(l => l !== next)
      if (fallback) setTargetLanguage(fallback)
    }
    setSourceLanguage(next)
  }

  const setTargetLanguageSafe = (next: TranslationLanguage) => {
    if (next === sourceLanguage) {
      const fallback = (['mingrelian', 'georgian', 'english'] as const).find(l => l !== next)
      if (fallback) setSourceLanguage(fallback)
    }
    setTargetLanguage(next)
  }

  // Load saved preferences
  useEffect(() => {
    let cancelled = false

    const loadPreferences = async () => {
      const savedOpenaiKey = localStorage.getItem('mingrelian_openai_key')
      const savedAnthropicKey = localStorage.getItem('mingrelian_anthropic_key')
      const savedGeminiKey = localStorage.getItem('mingrelian_gemini_key')
      const savedModel = localStorage.getItem('mingrelian_model')
      const modelMigrationApplied = localStorage.getItem(MODEL_MIGRATION_KEY) === 'true'
      const savedSourceLang = localStorage.getItem('mingrelian_source_lang')
      const savedTargetLang = localStorage.getItem('mingrelian_target_lang')
      const rememberOpenai = localStorage.getItem('mingrelian_remember_openai_key') === 'true'
      const rememberAnthropic = localStorage.getItem('mingrelian_remember_anthropic_key') === 'true'
      const rememberGemini = localStorage.getItem('mingrelian_remember_gemini_key') === 'true'

      if (savedOpenaiKey && rememberOpenai) {
        setOpenaiKey(savedOpenaiKey)
        setRememberOpenai(true)
      }
      if (savedAnthropicKey && rememberAnthropic) {
        setAnthropicKey(savedAnthropicKey)
        setRememberAnthropic(true)
      }
      if (savedGeminiKey && rememberGemini) {
        setGeminiKey(savedGeminiKey)
        setRememberGemini(true)
      }
      if (!modelMigrationApplied) {
        setSelectedModel(DEFAULT_MODEL)
        localStorage.setItem('mingrelian_model', DEFAULT_MODEL)
        localStorage.setItem(MODEL_MIGRATION_KEY, 'true')
      } else if (savedModel) {
        setSelectedModel(savedModel)
      }

      let nextSourceLanguage = DEFAULT_SITE_DEFAULTS.sourceLanguage
      let nextTargetLanguage = DEFAULT_SITE_DEFAULTS.targetLanguage

      if (
        isTranslationLanguage(savedSourceLang) &&
        isTranslationLanguage(savedTargetLang) &&
        savedSourceLang !== savedTargetLang
      ) {
        nextSourceLanguage = savedSourceLang
        nextTargetLanguage = savedTargetLang
      } else {
        const geoDefaults = await detectSiteDefaults()
        if (cancelled) return
        nextSourceLanguage = geoDefaults.sourceLanguage
        nextTargetLanguage = geoDefaults.targetLanguage
      }

      if (cancelled) return

      setSourceLanguage(nextSourceLanguage)
      setTargetLanguage(nextTargetLanguage)
      setPreferencesReady(true)
    }

    void loadPreferences()

    return () => {
      cancelled = true
    }
  }, [])

  // Save preferences when they change
  useEffect(() => {
    if (!preferencesReady) return
    localStorage.setItem('mingrelian_model', selectedModel)
  }, [preferencesReady, selectedModel])

  useEffect(() => {
    if (!preferencesReady) return
    localStorage.setItem('mingrelian_source_lang', sourceLanguage)
  }, [preferencesReady, sourceLanguage])

  useEffect(() => {
    if (!preferencesReady) return
    localStorage.setItem('mingrelian_target_lang', targetLanguage)
  }, [preferencesReady, targetLanguage])

  useEffect(() => {
    if (!preferencesReady) return
    localStorage.setItem('mingrelian_remember_openai_key', rememberOpenai.toString())
    if (rememberOpenai && openaiKey) {
      localStorage.setItem('mingrelian_openai_key', openaiKey)
    } else {
      localStorage.removeItem('mingrelian_openai_key')
    }
  }, [preferencesReady, rememberOpenai, openaiKey])

  useEffect(() => {
    if (!preferencesReady) return
    localStorage.setItem('mingrelian_remember_anthropic_key', rememberAnthropic.toString())
    if (rememberAnthropic && anthropicKey) {
      localStorage.setItem('mingrelian_anthropic_key', anthropicKey)
    } else {
      localStorage.removeItem('mingrelian_anthropic_key')
    }
  }, [preferencesReady, rememberAnthropic, anthropicKey])

  useEffect(() => {
    if (!preferencesReady) return
    localStorage.setItem('mingrelian_remember_gemini_key', rememberGemini.toString())
    if (rememberGemini && geminiKey) {
      localStorage.setItem('mingrelian_gemini_key', geminiKey)
    } else {
      localStorage.removeItem('mingrelian_gemini_key')
    }
  }, [preferencesReady, rememberGemini, geminiKey])

  const models = [
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

  const getProvider = () => {
    return models.find(m => m.value === selectedModel)?.provider || 'openai'
  }

  const getApiKeyForProvider = (provider: string) => {
    if (provider === 'anthropic') return anthropicKey
    if (provider === 'gemini') return geminiKey
    return openaiKey
  }

  const selectedModelSupportsServerKey = () => {
    return SERVER_KEY_MODELS.has(selectedModel)
  }

  const getReasoningEffortForModel = (model: string) => {
    return model === DEFAULT_MODEL ? DEFAULT_REASONING_EFFORT : undefined
  }

  const hasApiKey = () => {
    if (selectedModelSupportsServerKey()) return true
    return getApiKeyForProvider(getProvider()).length > 0
  }

  // Live transliteration for input (only for Georgian/Mingrelian)
  const inputTransliteration = useMemo(() => {
    if (!inputText.trim()) return ''
    if (sourceLanguage === 'english') return ''
    
    const isGeorgian = isGeorgianScript(inputText)
    if (isGeorgian) {
      return mkhedruliToLatinized(inputText)
    } else {
      return latinizedToMkhedruli(inputText)
    }
  }, [inputText, sourceLanguage])

  const handleTranslate = async () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
      debounceTimerRef.current = null
    }

    activeRequestRef.current?.abort()
    activeRequestRef.current = null
    const requestId = ++requestIdRef.current
    const startTime = performance.now()
    const provider = getProvider()
    const userApiKey = getApiKeyForProvider(provider)
    
    // Use an empty api_key when the user has not provided one; the backend can fall back to server-side credentials.
    const apiKey = SHOW_SETTINGS 
      ? userApiKey
      : ''

    console.log('🚀 Starting translation...', { provider, model: selectedModel, sourceLanguage, targetLanguage })

    if (SHOW_SETTINGS && !selectedModelSupportsServerKey() && !userApiKey) {
      const providerName = provider === 'anthropic' ? 'Anthropic' : provider === 'gemini' ? 'Gemini' : 'OpenAI'
      setError(`${t('noApiKey')} ${providerName} ${t('apiKey')}`)
      return
    }

    if (!inputText.trim()) {
      setError(t('enterSourceText'))
      return
    }

    if (inputText.length > 100) {
      setError(
        language === 'ka'
          ? `ტექსტი ძალიან გრძელია (${inputText.length} ${t('characters')}). გთხოვთ შეზღუდოთ შეყვანა 100 სიმბოლომდე უკეთესი თარგმანის ხარისხისთვის.`
          : `Text is too long (${inputText.length} ${t('characters')}). Please limit your input to 100 characters for better translation quality.`
      )
      return
    }

    if (sourceLanguage === targetLanguage) {
      setError(t('sourceAndTargetMustDiffer'))
      return
    }

    setError('')
    setLoading(true)

    const controller = new AbortController()
    activeRequestRef.current = controller

    const reasoningEffort = getReasoningEffortForModel(selectedModel)
    const requestBody = {
      prompt: inputText,
      api_key: apiKey,
      source_language: sourceLanguage,
      target_language: targetLanguage,
      model: selectedModel,
      provider: provider,
      visitor_id: getAnonymousVisitorId(),
      ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {})
    }

    console.log('Request body:', { ...requestBody, api_key: '***', visitor_id: '***' })

    const timeoutId = setTimeout(() => {
      controller.abort()
      console.error('Request timed out after 1 minute')
    }, 60000) // 1 minute timeout

    try {
      console.log('Sending request to API...')

      // Switch between local and production
      const apiUrl = 'https://argo-translator.onrender.com'
      
      const response = await fetch(`${apiUrl}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
        signal: controller.signal
      })

      clearTimeout(timeoutId)
      console.log('Response received:', response.status, response.statusText)

      if (!response.ok) {
        const errorData = await response.json()
        console.error('API error:', errorData)
        setError(`${t('apiError')}: ${errorData.detail || response.statusText}`)
        setLoading(false)
        return
      }

      // Read streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (!reader) {
        setError(t('noResult'))
        setLoading(false)
        return
      }

      let buffer = ''
      let finalResult = null

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break
        
        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        
        // Process complete lines, keep incomplete line in buffer
        buffer = lines.pop() || ''
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const jsonStr = line.slice(6) // Remove 'data: ' prefix
            try {
              const event = JSON.parse(jsonStr)
              
              if (event.result) {
                // Final result received
                console.log('Translation successful:', event.result)
                finalResult = event.result
              } else if (event.error) {
                console.error('API error:', event.error)
                setError(`${t('apiError')}: ${event.error}`)
                setLoading(false)
                return
              }
            } catch (e) {
              console.error('Failed to parse event:', jsonStr, e)
            }
          }
        }
      }

      if (finalResult) {
        const endTime = performance.now()
        const duration = ((endTime - startTime) / 1000).toFixed(2)
        console.log(`✅ Translation completed in ${duration}s`)
        console.log(`⏱️  Total time: ${duration} seconds (${Math.round(endTime - startTime)}ms)`)
        if (requestId === requestIdRef.current) {
          setResult(finalResult)
        }
      } else {
        if (requestId === requestIdRef.current) {
          setError(t('noResult'))
        }
      }
    } catch (err: any) {
      if (requestId !== requestIdRef.current) return

      const endTime = performance.now()
      const duration = ((endTime - startTime) / 1000).toFixed(2)
      console.error(`❌ Translation failed after ${duration}s:`, err)
      if (err.name === 'AbortError') {
        setError(t('timeout'))
      } else {
        setError(`${t('networkError')}: ${err.message}`)
      }
    } finally {
      clearTimeout(timeoutId)
      if (requestId === requestIdRef.current) {
        activeRequestRef.current = null
        setLoading(false)
      }
    }
  }

  translateRef.current = () => {
    void handleTranslate()
  }

  useEffect(() => {
    if (!preferencesReady) return

    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current)
    }
    activeRequestRef.current?.abort()
    activeRequestRef.current = null
    requestIdRef.current += 1
    setLoading(false)
    setError('')
    setResult(null)

    if (!inputText.trim() || inputText.length > 100 || sourceLanguage === targetLanguage) {
      debounceTimerRef.current = null
      return
    }

    debounceTimerRef.current = setTimeout(() => {
      debounceTimerRef.current = null
      translateRef.current()
    }, AUTO_TRANSLATE_DELAY_MS)

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current)
        debounceTimerRef.current = null
      }
    }
  }, [inputText, preferencesReady, selectedModel, sourceLanguage, targetLanguage])

  useEffect(() => {
    return () => {
      activeRequestRef.current?.abort()
    }
  }, [])

  const handleInputKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Enter' || event.shiftKey || event.nativeEvent.isComposing) return

    event.preventDefault()
    if (!loading) {
      translateRef.current()
    }
  }

  const clearSettings = async () => {
    localStorage.clear()

    const defaults = await detectSiteDefaults()

    setOpenaiKey('')
    setAnthropicKey('')
    setGeminiKey('')
    setRememberOpenai(false)
    setRememberAnthropic(false)
    setRememberGemini(false)
    setSelectedModel(DEFAULT_MODEL)
    setInputText('')
    setError('')
    setResult(null)
    setSourceLanguage(defaults.sourceLanguage)
    setTargetLanguage(defaults.targetLanguage)
    setLanguage(defaults.uiLanguage)
  }

  return (
    <>
      <Navbar 
        onSettingsClick={SHOW_SETTINGS ? () => setIsSettingsOpen(true) : undefined}
        hasApiKey={hasApiKey()}
        showSettings={SHOW_SETTINGS}
      />
      
      {SHOW_SETTINGS && (
        <SettingsModal
          isOpen={isSettingsOpen}
          onClose={() => setIsSettingsOpen(false)}
          openaiKey={openaiKey}
          setOpenaiKey={setOpenaiKey}
          anthropicKey={anthropicKey}
          setAnthropicKey={setAnthropicKey}
          geminiKey={geminiKey}
          setGeminiKey={setGeminiKey}
          rememberOpenai={rememberOpenai}
          setRememberOpenai={setRememberOpenai}
          rememberAnthropic={rememberAnthropic}
          setRememberAnthropic={setRememberAnthropic}
          rememberGemini={rememberGemini}
          setRememberGemini={setRememberGemini}
          selectedModel={selectedModel}
          setSelectedModel={setSelectedModel}
          models={models}
          onClearSettings={clearSettings}
        />
      )}

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* SEO intro (visible, non-spammy) */}
        <div id="about" className="mb-4 scroll-mt-24 text-sm text-gray-600">
          <h1 className="inline font-medium text-gray-900">{t('introTitle')}</h1>
          {' — '}
          {t('introDescription')}
        </div>

        {/* Language Selector Bar */}
        <div className="mb-6 flex flex-col items-stretch justify-center gap-3 rounded-lg border border-gray-200/70 bg-white/90 backdrop-blur-sm p-3 shadow-md sm:flex-row sm:items-center">
          {/* Source language tabs */}
          <div className="w-full sm:flex-1">
            <div className="flex flex-wrap items-center justify-center gap-3 px-1 sm:justify-start">
              {languageOptions.map((opt) => (
                <button
                  key={`src-${opt.value}`}
                  type="button"
                  onClick={() => setSourceLanguageSafe(opt.value)}
                  className={[
                    'whitespace-nowrap pb-1 text-sm font-semibold transition-colors',
                    sourceLanguage === opt.value
                      ? 'text-blue-700 border-b-2 border-blue-600'
                      : 'text-gray-700 hover:text-gray-900 border-b-2 border-transparent',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => {
              // Swap languages
              const tempLang = sourceLanguage
              setSourceLanguage(targetLanguage)
              setTargetLanguage(tempLang)
              
              // Swap text content if there's a result
              if (result) {
                let outputText = ''
                
                // Get the output text based on current target language
                if (targetLanguage === 'mingrelian') {
                  outputText = result.mingrelian_mkhedruli || result.mingrelian_latinized
                } else if (targetLanguage === 'georgian') {
                  outputText = result.georgian
                } else if (targetLanguage === 'english') {
                  outputText = result.english
                }
                
                // Swap: output becomes new input
                setInputText(outputText)
                // Clear result so user can translate again
                setResult(null)
              }
            }}
            className="self-center shrink-0 rounded-full p-2 text-gray-600 hover:bg-gray-100 hover:text-blue-600 transition-colors"
            title={t('swapLanguages')}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>

          {/* Target language tabs */}
          <div className="w-full sm:flex-1">
            <div className="flex flex-wrap items-center justify-center gap-3 px-1 sm:justify-end">
              {languageOptions.map((opt) => (
                <button
                  key={`tgt-${opt.value}`}
                  type="button"
                  onClick={() => setTargetLanguageSafe(opt.value)}
                  className={[
                    'whitespace-nowrap pb-1 text-sm font-semibold transition-colors',
                    targetLanguage === opt.value
                      ? 'text-blue-700 border-b-2 border-blue-600'
                      : 'text-gray-700 hover:text-gray-900 border-b-2 border-transparent',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Translation Interface */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-4">

          <div className="rounded-lg border border-gray-200/70 bg-white/90 backdrop-blur-sm p-4 shadow-md">
            <div className="relative">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={t('sourceTextPlaceholder')}
                className="w-full h-40 md:h-64 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
              {inputTransliteration && (
                <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-gray-50/90 backdrop-blur-sm rounded text-xs text-gray-500 italic pointer-events-none border border-gray-200/50">
                  {inputTransliteration}
                </div>
              )}
            </div>
            {/* Character counter */}
            <div className="mt-2 text-right">
              <span className={`text-xs ${inputText.length > 100 ? 'text-red-600 font-semibold' : 'text-gray-500'}`}>
                {inputText.length}/100 {t('characters')}
              </span>
            </div>
          </div>
          
          {loading && (
            <div className="flex items-center justify-center gap-3 py-4 rounded-md bg-gray-50 border border-gray-200">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-blue-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-gray-600 text-sm font-medium">
                {t('translating')}...
              </span>
            </div>
          )}

          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-800 border border-red-200">
              {error}
            </div>
          )}
        </div>

        {/* Output Section */}
        <div>
          {result && (
            <div className="space-y-4">
              {/* Show result based on target language */}
              {targetLanguage === 'mingrelian' && (
                <div className="rounded-lg border border-gray-200/70 bg-white/90 backdrop-blur-sm p-4 shadow-md">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {t('mingrelian')}
                  </div>
                  <div className="relative">
                    <div className="text-lg text-gray-900 leading-relaxed min-h-[120px] pb-8">
                      {result.mingrelian_mkhedruli || (result.mingrelian_latinized && latinizedToMkhedruli(result.mingrelian_latinized))}
                    </div>
                    {result.mingrelian_latinized && (
                      <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gray-50/90 backdrop-blur-sm rounded text-xs text-gray-500 italic border border-gray-200/50">
                        {result.mingrelian_latinized}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {targetLanguage === 'georgian' && (
                <div className="rounded-lg border border-gray-200/70 bg-white/90 backdrop-blur-sm p-4 shadow-md">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {t('georgian')}
                  </div>
                  <div className="relative">
                    <div className="text-lg text-gray-900 leading-relaxed min-h-[120px] pb-8">
                      {result.georgian}
                    </div>
                    {result.georgian && (
                      <div className="absolute bottom-0 left-0 right-0 px-2 py-1 bg-gray-50/90 backdrop-blur-sm rounded text-xs text-gray-500 italic border border-gray-200/50">
                        {mkhedruliToLatinized(result.georgian)}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {targetLanguage === 'english' && (
                <div className="rounded-lg border border-gray-200/70 bg-white/90 backdrop-blur-sm p-4 shadow-md">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {t('english')}
                  </div>
                  <div className="text-lg text-gray-900 leading-relaxed">{result.english}</div>
                </div>
              )}
            </div>
          )}

          {!result && !loading && (
            <div className="h-64 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 flex items-center justify-center">
              <p className="text-sm text-gray-500">{t('translationWillAppear')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Section */}
      <div id="feedback" className="mt-24 scroll-mt-24 border-t border-gray-200 pt-8">
        <div className="rounded-lg border border-blue-100 bg-blue-50/50 backdrop-blur-sm p-6 shadow-sm">
          <h3 className="text-lg font-semibold text-blue-900 mb-2">
            {t('contactTitle')}
          </h3>
          <p className="text-sm text-gray-700 mb-3">
            {t('contactMessage')}
          </p>
          <a 
            href="mailto:konstantinekahadze@gmail.com"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium transition-colors break-all sm:break-normal"
          >
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            <span className="break-all">konstantinekahadze@gmail.com</span>
          </a>
        </div>
      </div>
    </main>
    </>
  )
}
