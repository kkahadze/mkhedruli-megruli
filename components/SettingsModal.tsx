'use client'

import { useLanguage } from '@/contexts/LanguageContext'

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  openaiKey: string
  setOpenaiKey: (key: string) => void
  anthropicKey: string
  setAnthropicKey: (key: string) => void
  rememberOpenai: boolean
  setRememberOpenai: (remember: boolean) => void
  rememberAnthropic: boolean
  setRememberAnthropic: (remember: boolean) => void
  selectedModel: string
  setSelectedModel: (model: string) => void
  models: Array<{ value: string; label: string; provider: string }>
  onClearSettings: () => void
}

export default function SettingsModal({
  isOpen,
  onClose,
  openaiKey,
  setOpenaiKey,
  anthropicKey,
  setAnthropicKey,
  rememberOpenai,
  setRememberOpenai,
  rememberAnthropic,
  setRememberAnthropic,
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
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">{t('settingsTitle')}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* API Keys Section */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                {t('apiKeysSection')}
              </h3>
              <div className="space-y-4">
                {/* OpenAI Key */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('openaiApiKey')}
                  </label>
                  <input
                    type="password"
                    value={openaiKey}
                    onChange={(e) => setOpenaiKey(e.target.value)}
                    placeholder={t('openaiPlaceholder')}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                  <label className="mt-2 flex items-center text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={rememberOpenai}
                      onChange={(e) => setRememberOpenai(e.target.checked)}
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {t('rememberKey')}
                  </label>
                  <p className="mt-2 text-xs text-gray-500">
                    {t('getKeyAt')} <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">platform.openai.com</a>
                  </p>
                </div>

                {/* Anthropic Key */}
                <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {t('anthropicApiKey')}
                  </label>
                  <input
                    type="password"
                    value={anthropicKey}
                    onChange={(e) => setAnthropicKey(e.target.value)}
                    placeholder={t('anthropicPlaceholder')}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                  />
                  <label className="mt-2 flex items-center text-sm text-gray-600">
                    <input
                      type="checkbox"
                      checked={rememberAnthropic}
                      onChange={(e) => setRememberAnthropic(e.target.checked)}
                      className="mr-2 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    {t('rememberKey')}
                  </label>
                  <p className="mt-2 text-xs text-gray-500">
                    {t('getKeyAt')} <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">console.anthropic.com</a>
                  </p>
                </div>
              </div>
            </div>

            {/* Model Selection */}
            <div>
              <h3 className="text-sm font-semibold text-gray-900 mb-4 uppercase tracking-wide">
                {t('aiModelSection')}
              </h3>
              <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {t('selectModel')}
                </label>
                <select
                  value={selectedModel}
                  onChange={(e) => setSelectedModel(e.target.value)}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white"
                >
                  {models.map((model) => (
                    <option key={model.value} value={model.value}>
                      {model.label} ({model.provider === 'openai' ? 'OpenAI' : 'Anthropic'})
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-500">
                  {t('modelDescription')}
                </p>
              </div>
            </div>

            {/* Danger Zone */}
            <div>
              <h3 className="text-sm font-semibold text-red-700 mb-4 uppercase tracking-wide">
                {t('dangerZone')}
              </h3>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <button
                  onClick={() => {
                    if (confirm(t('clearConfirm'))) {
                      onClearSettings()
                      onClose()
                    }
                  }}
                  className="text-sm text-red-700 hover:text-red-800 font-medium underline"
                >
                  {t('clearAllSettings')}
                </button>
                <p className="mt-2 text-xs text-red-600">
                  {t('clearDescription')}
                </p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-500 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              {t('done')}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

