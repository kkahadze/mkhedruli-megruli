'use client'

import { useLanguage } from '@/contexts/LanguageContext'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  openaiKey: string
  setOpenaiKey: (key: string) => void
  anthropicKey: string
  setAnthropicKey: (key: string) => void
  geminiKey: string
  setGeminiKey: (key: string) => void
  rememberOpenai: boolean
  setRememberOpenai: (remember: boolean) => void
  rememberAnthropic: boolean
  setRememberAnthropic: (remember: boolean) => void
  rememberGemini: boolean
  setRememberGemini: (remember: boolean) => void
  selectedModel: string
  setSelectedModel: (model: string) => void
  models: Array<{ value: string; label: string; provider: string }>
  onClearSettings: () => void | Promise<void>
}

export default function SettingsModal({
  isOpen,
  onClose,
  openaiKey,
  setOpenaiKey,
  anthropicKey,
  setAnthropicKey,
  geminiKey,
  setGeminiKey,
  rememberOpenai,
  setRememberOpenai,
  rememberAnthropic,
  setRememberAnthropic,
  rememberGemini,
  setRememberGemini,
  selectedModel,
  setSelectedModel,
  models,
  onClearSettings,
}: SettingsModalProps) {
  const { t } = useLanguage()
  
  if (!isOpen) return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="flex max-h-[90vh] w-full max-w-xl flex-col overflow-hidden rounded-lg border border-[color:var(--border)] bg-[var(--surface)] shadow-[0_18px_60px_rgba(32,37,34,0.16)]"
          role="dialog"
          aria-modal="true"
          aria-labelledby="settings-title"
        >
          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-[color:var(--border)] px-6 py-5">
            <h2 id="settings-title" className="text-lg font-semibold text-[var(--foreground)]">
              {t('settingsTitle')}
            </h2>
            <button
              onClick={onClose}
              className="flex h-9 w-9 items-center justify-center rounded-md text-[var(--muted)] transition-colors hover:bg-[var(--surface-muted)] hover:text-[var(--foreground)]"
              aria-label={t('done')}
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="space-y-8 overflow-y-auto px-6 py-6">
            {/* API Keys Section */}
            <div>
              <h3 className="mb-5 text-sm font-semibold text-[var(--foreground)]">
                {t('apiKeysSection')}
              </h3>
              <div className="space-y-5">
                {/* OpenAI Key */}
                <div className="border-b border-[color:var(--border)] pb-5">
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                    {t('openaiApiKey')}
                  </label>
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder={t('openaiPlaceholder')}
                    className="h-10 w-full rounded-md border border-[color:var(--border)] bg-white px-3 text-sm outline-none transition-colors focus:border-[var(--accent)]"
                  />
                  <label className="mt-3 flex items-center text-sm text-[var(--muted)]">
                    <input
                      type="checkbox"
                      checked={rememberOpenai}
                      onChange={(e) => setRememberOpenai(e.target.checked)}
                      className="mr-2 h-4 w-4 rounded border-[color:var(--border)] accent-[var(--accent)]"
                    />
                    {t('rememberKey')}
                  </label>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {t('getKeyAt')} <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">platform.openai.com</a>
                  </p>
                </div>

                {/* Anthropic Key */}
                <div className="border-b border-[color:var(--border)] pb-5">
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                    {t('anthropicApiKey')}
                  </label>
                  <input
                    type="password"
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    placeholder={t('anthropicPlaceholder')}
                    className="h-10 w-full rounded-md border border-[color:var(--border)] bg-white px-3 text-sm outline-none transition-colors focus:border-[var(--accent)]"
                  />
                  <label className="mt-3 flex items-center text-sm text-[var(--muted)]">
                    <input
                      type="checkbox"
                      checked={rememberAnthropic}
                      onChange={(e) => setRememberAnthropic(e.target.checked)}
                      className="mr-2 h-4 w-4 rounded border-[color:var(--border)] accent-[var(--accent)]"
                    />
                    {t('rememberKey')}
                  </label>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {t('getKeyAt')} <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">console.anthropic.com</a>
                  </p>
                </div>

                {/* Gemini Key */}
                <div>
                  <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                    {t('geminiApiKey')}
                  </label>
                  <input
                    type="password"
                    value={geminiKey}
                    onChange={(e) => setGeminiKey(e.target.value)}
                    placeholder={t('geminiPlaceholder')}
                    className="h-10 w-full rounded-md border border-[color:var(--border)] bg-white px-3 text-sm outline-none transition-colors focus:border-[var(--accent)]"
                  />
                  <label className="mt-3 flex items-center text-sm text-[var(--muted)]">
                    <input
                      type="checkbox"
                      checked={rememberGemini}
                      onChange={(e) => setRememberGemini(e.target.checked)}
                      className="mr-2 h-4 w-4 rounded border-[color:var(--border)] accent-[var(--accent)]"
                    />
                    {t('rememberKey')}
                  </label>
                  <p className="mt-2 text-xs text-[var(--muted)]">
                    {t('getKeyAt')} <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-[var(--accent)] hover:underline">aistudio.google.com</a>
                  </p>
                </div>
              </div>
            </div>

            {/* Model Selection */}
            <div className="border-t border-[color:var(--border)] pt-6">
              <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
                {t('aiModelSection')}
              </h3>
              <div>
                <label className="mb-2 block text-sm font-medium text-[var(--foreground)]">
                  {t('selectModel')}
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="h-10 w-full rounded-md border border-[color:var(--border)] bg-white px-3 text-sm outline-none transition-colors focus:border-[var(--accent)]"
                >
                  {models.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label} ({
                        model.provider === 'openai' ? 'OpenAI' : 
                        model.provider === 'anthropic' ? 'Anthropic' : 
                        'Gemini'
                      })
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {t('modelDescription')}
                </p>
              </div>
            </div>

            {/* Danger Zone */}
            <div className="border-t border-[color:var(--border)] pt-6">
              <h3 className="mb-4 text-sm font-semibold text-[var(--foreground)]">
                {t('dangerZone')}
              </h3>
              <div>
                <button
                  onClick={() => {
                    if (confirm(t('clearConfirm'))) {
                      onClearSettings()
                      onClose()
                    }
                  }}
                  className="text-sm font-medium text-[var(--accent)] transition-colors hover:text-[var(--accent-hover)]"
                >
                  {t('clearAllSettings')}
                </button>
                <p className="mt-2 text-xs text-[var(--muted)]">
                  {t('clearDescription')}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex shrink-0 justify-end border-t border-[color:var(--border)] px-6 py-4">
            <button
              onClick={onClose}
              className="h-10 rounded-md bg-[var(--accent)] px-5 text-sm font-medium text-white transition-colors hover:bg-[var(--accent-hover)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              {t('done')}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
