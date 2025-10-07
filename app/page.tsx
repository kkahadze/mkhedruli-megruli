'use client'

import { useState, useEffect, useMemo } from 'react'
import { mkhedruliToLatinized, latinizedToMkhedruli, isGeorgianScript } from '@/utils/transliterate'
import Navbar from '@/components/Navbar'
import SettingsModal from '@/components/SettingsModal'
import { useLanguage } from '@/contexts/LanguageContext'

export default function Home() {
  const { t } = useLanguage()
  const [mingrelianInput, setMingrelianInput] = useState('')
  const [targetLanguage, setTargetLanguage] = useState<'english' | 'georgian'>('english')
  const [selectedModel, setSelectedModel] = useState('gpt-5-2025-08-07')
  const [openaiKey, setOpenaiKey] = useState('')
  const [anthropicKey, setAnthropicKey] = useState('')
  const [rememberOpenai, setRememberOpenai] = useState(false)
  const [rememberAnthropic, setRememberAnthropic] = useState(false)
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [result, setResult] = useState<{
    mingrelian_latinized: string
    mingrelian_mkhedruli: string
    georgian: string
    english: string
  } | null>(null)

  // Smart progress bar animation - very slow at start
  useEffect(() => {
    if (!loading) {
      setProgress(0)
      return
    }

    setProgress(0)
    let currentProgress = 0
    const interval = setInterval(() => {
      // Very slow exponential progress: adds only 0.3% of remaining distance
      // Takes ~60 seconds to reach 80%, then plateaus around 88-90%
      const increment = (90 - currentProgress) * 0.003
      currentProgress += Math.max(increment, 0.01)

      if (currentProgress >= 90) {
        currentProgress = 90 // Plateau at 90%
      }

      setProgress(Math.min(currentProgress, 90))
    }, 200) // Update every 200ms

    return () => clearInterval(interval)
  }, [loading])

  // Load saved preferences
  useEffect(() => {
    const savedOpenaiKey = localStorage.getItem('mingrelian_openai_key')
    const savedAnthropicKey = localStorage.getItem('mingrelian_anthropic_key')
    const savedModel = localStorage.getItem('mingrelian_model')
    const savedTargetLang = localStorage.getItem('mingrelian_target_lang')
    const rememberOpenai = localStorage.getItem('mingrelian_remember_openai_key') === 'true'
    const rememberAnthropic = localStorage.getItem('mingrelian_remember_anthropic_key') === 'true'

    if (savedOpenaiKey && rememberOpenai) {
      setOpenaiKey(savedOpenaiKey)
      setRememberOpenai(true)
    }
    if (savedAnthropicKey && rememberAnthropic) {
      setAnthropicKey(savedAnthropicKey)
      setRememberAnthropic(true)
    }
    if (savedModel) setSelectedModel(savedModel)
    if (savedTargetLang) setTargetLanguage(savedTargetLang as 'english' | 'georgian')
  }, [])

  // Save preferences when they change
  useEffect(() => {
    localStorage.setItem('mingrelian_model', selectedModel)
  }, [selectedModel])

  useEffect(() => {
    localStorage.setItem('mingrelian_target_lang', targetLanguage)
  }, [targetLanguage])

  useEffect(() => {
    localStorage.setItem('mingrelian_remember_openai_key', rememberOpenai.toString())
    if (rememberOpenai && openaiKey) {
      localStorage.setItem('mingrelian_openai_key', openaiKey)
    } else {
      localStorage.removeItem('mingrelian_openai_key')
    }
  }, [rememberOpenai, openaiKey])

  useEffect(() => {
    localStorage.setItem('mingrelian_remember_anthropic_key', rememberAnthropic.toString())
    if (rememberAnthropic && anthropicKey) {
      localStorage.setItem('mingrelian_anthropic_key', anthropicKey)
    } else {
      localStorage.removeItem('mingrelian_anthropic_key')
    }
  }, [rememberAnthropic, anthropicKey])

  const models = [
    { value: 'gpt-5-2025-08-07', label: 'GPT-5', provider: 'openai' },
    { value: 'gpt-5-pro-2025-10-06', label: 'GPT-5 Pro', provider: 'openai' },
    { value: 'claude-sonnet-4-5-20250929', label: 'Claude Sonnet 4.5', provider: 'anthropic' },
  ]

  const getProvider = () => {
    return models.find(m => m.value === selectedModel)?.provider || 'openai'
  }

  const hasApiKey = () => {
    return openaiKey.length > 0 || anthropicKey.length > 0
  }

  // Live transliteration for input
  const inputTransliteration = useMemo(() => {
    if (!mingrelianInput.trim()) return ''
    
    const isGeorgian = isGeorgianScript(mingrelianInput)
    if (isGeorgian) {
      return mkhedruliToLatinized(mingrelianInput)
    } else {
      return latinizedToMkhedruli(mingrelianInput)
    }
  }, [mingrelianInput])

  const handleTranslate = async () => {
    const provider = getProvider()
    const apiKey = provider === 'anthropic' ? anthropicKey : openaiKey

    console.log('Starting translation...', { provider, model: selectedModel, targetLanguage })

    if (!apiKey) {
      setError(`${t('noApiKey')} ${provider === 'anthropic' ? 'Anthropic' : 'OpenAI'} ${t('apiKey')}`)
      return
    }

    if (!mingrelianInput.trim()) {
      setError(t('enterMingrelian'))
      return
    }

    setError('')
    setLoading(true)

    const requestBody = {
      prompt: mingrelianInput,
      api_key: apiKey,
      target_language: targetLanguage,
      model: selectedModel,
      provider: provider
    }

    console.log('Request body:', { ...requestBody, api_key: '***' })

    try {
      console.log('Sending request to API...')
      
      // Create abort controller for timeout
      const controller = new AbortController()
      const timeoutId = setTimeout(() => {
        controller.abort()
        console.error('Request timed out after 4 minutes')
      }, 240000) // 4 minute timeout

      // Switch between local and production
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://argo-translator.onrender.com'
      
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
              
              if (event.progress) {
                // ✨ FIRST API CALL COMPLETE - Jump to 50%
                console.log('Progress update:', event.progress, event.message)
                setProgress(event.progress)
              } else if (event.result) {
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
        // Data received! Rush to 100% in ~1 second
        setTimeout(() => setProgress(100), 50)
        
        // Wait for animation to complete before showing result
        await new Promise(resolve => setTimeout(resolve, 1000))
        
        setResult(finalResult)
      } else {
        setError(t('noResult'))
      }
    } catch (err: any) {
      console.error('Network error:', err)
      if (err.name === 'AbortError') {
        setError(t('timeout'))
      } else {
        setError(`${t('networkError')}: ${err.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const clearSettings = () => {
    if (confirm('Clear all saved settings?')) {
      localStorage.clear()
      setOpenaiKey('')
      setAnthropicKey('')
      setRememberOpenai(false)
      setRememberAnthropic(false)
      setSelectedModel('gpt-5-2025-08-07')
      setTargetLanguage('english')
    }
  }

  return (
    <>
      <Navbar 
        onSettingsClick={() => setIsSettingsOpen(true)}
        hasApiKey={hasApiKey()}
      />
      
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        openaiKey={openaiKey}
        setOpenaiKey={setOpenaiKey}
        anthropicKey={anthropicKey}
        setAnthropicKey={setAnthropicKey}
        rememberOpenai={rememberOpenai}
        setRememberOpenai={setRememberOpenai}
        rememberAnthropic={rememberAnthropic}
        setRememberAnthropic={setRememberAnthropic}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
        models={models}
        onClearSettings={clearSettings}
      />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Show a notice if no API key is configured */}
        {!hasApiKey() && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 p-4 shadow-sm">
            <div className="flex items-start gap-3">
              <svg className="w-5 h-5 text-amber-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div>
                <h3 className="text-sm font-medium text-amber-900">{t('apiKeyRequired')}</h3>
                <p className="mt-1 text-sm text-amber-700">
                  {t('apiKeyRequiredMessage')}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Main Translation Interface */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Input Section */}
        <div className="space-y-4">
          <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('mingrelianText')}
            </label>
            <div className="relative">
              <textarea
                value={mingrelianInput}
                onChange={(e) => setMingrelianInput(e.target.value)}
                placeholder={t('mingrelianPlaceholder')}
                className="w-full h-64 rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 resize-none"
              />
              {inputTransliteration && (
                <div className="absolute bottom-2 left-2 right-2 px-2 py-1 bg-gray-50/90 backdrop-blur-sm rounded text-xs text-gray-500 italic pointer-events-none border border-gray-200/50">
                  {inputTransliteration}
                </div>
              )}
            </div>
          </div>
          
          <button
            onClick={handleTranslate}
            disabled={loading}
            className="w-full rounded-md bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t('translating') : t('translate')}
          </button>

          {/* Smart Progress Bar */}
          {loading && (
            <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden shadow-sm">
              <div
                className={`h-full bg-gradient-to-r from-blue-500 to-blue-600 transition-all ease-out ${
                  progress >= 95 ? 'duration-1000' : 'duration-300'
                }`}
                style={{ width: `${progress}%` }}
              />
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
          {/* Target Language Selector - Centered */}
          <div className="mb-4 rounded-lg border border-gray-200 bg-white p-4 shadow-sm flex justify-center">
            <div className="inline-flex rounded-lg border border-gray-200 p-1">
              <button
                onClick={() => setTargetLanguage('english')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  targetLanguage === 'english'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t('english')}
              </button>
              <button
                onClick={() => setTargetLanguage('georgian')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  targetLanguage === 'georgian'
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-700 hover:bg-gray-100'
                }`}
              >
                {t('georgian')}
              </button>
            </div>
          </div>

          {result && (
            <div className="space-y-4">
              <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                  {t('mingrelian')}
                </div>
                <div className="text-lg text-gray-900 leading-relaxed">
                  {result.mingrelian_mkhedruli}
                </div>
                <div className="text-sm text-gray-400 italic mt-1">
                  {result.mingrelian_latinized}
                </div>
              </div>

              {targetLanguage === 'english' ? (
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {t('english')}
                  </div>
                  <div className="text-lg text-gray-900 leading-relaxed">{result.english}</div>
                </div>
              ) : (
                <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-2">
                    {t('georgian')}
                  </div>
                  <div className="text-lg text-gray-900 leading-relaxed">
                    {result.georgian}
                  </div>
                  <div className="text-sm text-gray-400 italic mt-1">
                    {mkhedruliToLatinized(result.georgian)}
                  </div>
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
    </main>
    </>
  )
}

