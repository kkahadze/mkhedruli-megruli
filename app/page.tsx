'use client'

import { useState, useEffect, useMemo } from 'react'
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
const DEFAULT_MODEL = 'gpt-5.5'
const DEFAULT_REASONING_EFFORT = 'none'
const SERVER_KEY_MODELS = new Set(['gpt-5.5', 'gpt-5.4-nano', 'gemini-3.1-flash-lite-preview'])
const MODEL_MIGRATION_KEY = 'mingrelian_model_migration_gpt_5_5_reasoning_none_v1'
const DEFAULT_SITE_DEFAULTS = getDefaultSiteDefaults()
const DEFAULT_API_URL = 'https://argo-translator.onrender.com'
const API_URL = (process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_URL).replace(/\/+$/, '')

type TranslationError =
  | { type: 'missingApiKey'; providerName: string }
  | { type: 'emptyInput' }
  | { type: 'tooLong'; count: number }
  | { type: 'sameLanguage' }
  | { type: 'apiError'; message: string }
  | { type: 'noResult' }
  | { type: 'timeout' }
  | { type: 'networkError'; message: string }

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
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<TranslationError | null>(null)
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
  const selectorGridClass = language === 'en' ? 'grid-cols-[48px_1fr]' : 'grid-cols-[64px_1fr]'
  const selectorDividerClass = language === 'en' ? 'pl-[48px]' : 'pl-[64px]'
  const selectorLabelClass = language === 'en' ? 'text-[1.05rem]' : 'text-[0.95rem]'
  const selectorButtonTextClass = language === 'en' ? 'text-[0.9rem]' : 'text-[0.7rem]'

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

  const errorMessage = useMemo(() => {
    if (!error) return ''

    switch (error.type) {
      case 'missingApiKey':
        return `${t('noApiKey')} ${error.providerName} ${t('apiKey')}`
      case 'emptyInput':
        return t('enterSourceText')
      case 'tooLong':
        return language === 'ka'
          ? `ტექსტი ძალიან გრძელია (${error.count} ${t('characters')}). გთხოვთ შეზღუდოთ შეყვანა 100 სიმბოლომდე უკეთესი თარგმანის ხარისხისთვის.`
          : `Text is too long (${error.count} ${t('characters')}). Please limit your input to 100 characters for better translation quality.`
      case 'sameLanguage':
        return t('sourceAndTargetMustDiffer')
      case 'apiError':
        return `${t('apiError')}: ${error.message}`
      case 'noResult':
        return t('noResult')
      case 'timeout':
        return t('timeout')
      case 'networkError':
        return `${t('networkError')}: ${error.message}`
    }
  }, [error, language, t])

  const showError = (nextError: TranslationError) => {
    setResult(null)
    setError(nextError)
  }

  const resultText = useMemo(() => {
    if (!result) return ''
    if (targetLanguage === 'mingrelian') {
      return result.mingrelian_mkhedruli || (result.mingrelian_latinized && latinizedToMkhedruli(result.mingrelian_latinized)) || ''
    }
    if (targetLanguage === 'georgian') return result.georgian
    return result.english
  }, [result, targetLanguage])

  const resultTransliteration = useMemo(() => {
    if (!result) return ''
    if (targetLanguage === 'mingrelian') return result.mingrelian_latinized
    if (targetLanguage === 'georgian' && result.georgian) return mkhedruliToLatinized(result.georgian)
    return ''
  }, [result, targetLanguage])

  const handleTranslate = async () => {
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
      showError({ type: 'missingApiKey', providerName })
      return
    }

    if (!inputText.trim()) {
      showError({ type: 'emptyInput' })
      return
    }

    if (inputText.length > 100) {
      showError({ type: 'tooLong', count: inputText.length })
      return
    }

    if (sourceLanguage === targetLanguage) {
      showError({ type: 'sameLanguage' })
      return
    }

    setError(null)
    setLoading(true)

    const reasoningEffort = getReasoningEffortForModel(selectedModel)
    const requestBody = {
      prompt: inputText,
      api_key: apiKey,
      source_language: sourceLanguage,
      target_language: targetLanguage,
      model: selectedModel,
      provider: provider,
      ...(reasoningEffort ? { reasoning_effort: reasoningEffort } : {})
    }

    console.log('Request body:', { ...requestBody, api_key: '***' })

    try {
      console.log('Sending request to API...')
      
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
        console.error('Request timed out after 1 minute')
      }, 60000) // 1 minute timeout

      const response = await fetch(`${API_URL}/chat`, {
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
        showError({ type: 'apiError', message: errorData.detail || response.statusText })
        setLoading(false)
        return
      }

      // Read streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (!reader) {
        showError({ type: 'noResult' })
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
                showError({ type: 'apiError', message: event.error })
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
        setResult(finalResult)
      } else {
        showError({ type: 'noResult' })
      }
    } catch (err: any) {
      const endTime = performance.now()
      const duration = ((endTime - startTime) / 1000).toFixed(2)
      console.error(`❌ Translation failed after ${duration}s:`, err)
      if (err.name === 'AbortError') {
        showError({ type: 'timeout' })
      } else {
        showError({ type: 'networkError', message: err.message })
      }
    } finally {
      setLoading(false)
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
    setError(null)
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

      <main className="mx-auto max-w-3xl px-4 py-7 sm:px-6 sm:py-10">
        {/* SEO intro (visible, non-spammy) */}
        <div className="mb-6 text-[1.02rem] leading-7 text-gray-600 sm:text-lg">
          <span className="font-bold text-gray-950">{t('introTitle')}</span>
          {' — '}
          {t('introDescription')}
        </div>

        {/* Language Selector Bar */}
        <div className="mb-7 rounded-xl border border-gray-200 bg-white px-3 py-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:px-6">
          <div className={['grid items-center gap-2 sm:grid-cols-[76px_1fr] sm:gap-4', selectorGridClass].join(' ')}>
            <div className={['font-semibold leading-tight text-gray-950 sm:text-lg', selectorLabelClass].join(' ')}>
              {t('fromLanguage')}
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {languageOptions.map((opt) => (
                <button
                  key={`src-${opt.value}`}
                  type="button"
                  onClick={() => setSourceLanguageSafe(opt.value)}
                  className={[
                    'h-12 min-w-0 overflow-hidden rounded-xl border px-1 font-semibold leading-tight transition-colors sm:h-[52px] sm:px-2 sm:text-base',
                    selectorButtonTextClass,
                    sourceLanguage === opt.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-[0_0_0_1px_rgba(37,99,235,0.08)]'
                      : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className={['my-4 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:my-5 sm:pl-[76px]', selectorDividerClass].join(' ')}>
            <div className="h-px bg-gray-200" />
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
              className="flex h-9 w-9 items-center justify-center rounded-full text-gray-700 transition-colors hover:bg-gray-50 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              title={t('swapLanguages')}
            >
              <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7l4-4m0 0l4 4m-4-4v18m4-4l-4 4m0 0l-4-4" />
              </svg>
            </button>
            <div className="h-px bg-gray-200" />
          </div>

          <div className={['grid items-center gap-2 sm:grid-cols-[76px_1fr] sm:gap-4', selectorGridClass].join(' ')}>
            <div className={['font-semibold leading-tight text-gray-950 sm:text-lg', selectorLabelClass].join(' ')}>
              {t('toLanguage')}
            </div>
            <div className="grid grid-cols-3 gap-2 sm:gap-4">
              {languageOptions.map((opt) => (
                <button
                  key={`tgt-${opt.value}`}
                  type="button"
                  onClick={() => setTargetLanguageSafe(opt.value)}
                  className={[
                    'h-12 min-w-0 overflow-hidden rounded-xl border px-1 font-semibold leading-tight transition-colors sm:h-[52px] sm:px-2 sm:text-base',
                    selectorButtonTextClass,
                    targetLanguage === opt.value
                      ? 'border-blue-600 bg-blue-50 text-blue-700 shadow-[0_0_0_1px_rgba(37,99,235,0.08)]'
                      : 'border-gray-200 bg-white text-gray-800 hover:border-gray-300 hover:bg-gray-50',
                  ].join(' ')}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Main Translation Interface */}
      <div className="space-y-5 sm:space-y-7">
        {/* Input Section */}
        <div className="space-y-5">

          <div className="relative min-h-[300px] rounded-xl border border-gray-300 bg-white shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:min-h-[420px]">
              <textarea
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder={t('sourceTextPlaceholder')}
                className="h-full min-h-[300px] w-full resize-none rounded-xl bg-transparent px-4 py-5 text-lg leading-relaxed text-gray-950 placeholder:text-gray-500 focus:outline-none sm:min-h-[420px] sm:px-6"
              />
              {inputTransliteration && (
                <div className="pointer-events-none absolute bottom-12 left-4 right-4 rounded-md border border-gray-200 bg-gray-50/95 px-3 py-2 text-xs italic text-gray-500 sm:left-6 sm:right-6">
                  {inputTransliteration}
                </div>
              )}
            {/* Character counter */}
            <div className="absolute bottom-4 right-4 sm:right-6">
              <span className={`text-sm ${inputText.length > 100 ? 'font-semibold text-red-600' : 'text-gray-500'}`}>
                {inputText.length}/100 {t('characters')}
              </span>
            </div>
          </div>
          
          {!loading ? (
            <button
              onClick={handleTranslate}
              className="h-14 w-full rounded-lg bg-blue-700 px-4 text-lg font-bold text-white shadow-[0_1px_2px_rgba(37,99,235,0.18)] transition-colors hover:bg-blue-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              {t('translate')}
            </button>
          ) : (
            <div className="flex h-14 items-center justify-center gap-3 rounded-lg border border-gray-200 bg-gray-50">
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

          {errorMessage && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              {errorMessage}
            </div>
          )}
        </div>

        {/* Output Section */}
        <div className="min-h-[230px] rounded-xl border border-gray-300 bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:min-h-[300px] sm:p-6">
          {result ? (
            <div className="space-y-4">
              <div className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                {t(targetLanguage)}
              </div>
              <div className="text-xl leading-relaxed text-gray-950">
                {resultText}
              </div>
              {resultTransliteration && (
                <div className="rounded-md border border-gray-200 bg-gray-50 px-3 py-2 text-sm italic text-gray-500">
                  {resultTransliteration}
                </div>
              )}
            </div>
          ) : (
            <div className="flex min-h-[190px] items-center justify-center sm:min-h-[250px]">
              <p className="text-base text-gray-500">{t('translationWillAppear')}</p>
            </div>
          )}
        </div>
      </div>

      {/* Contact Section */}
      <div className="mt-24 pt-8 border-t border-gray-200">
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
