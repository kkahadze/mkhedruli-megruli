export type Language = 'en' | 'ka'

export const translations = {
  en: {
    // Navbar
    settings: 'Settings',
    
    // Main page - Input section
    mingrelianText: 'Mingrelian Text',
    mingrelianPlaceholder: 'Enter Mingrelian text (latinized or mkhedruli)...',
    translate: 'Translate',
    translating: 'Translating...',
    translationWillAppear: 'Translation will appear here',
    
    // Main page - Output section
    mingrelian: 'Mingrelian',
    english: 'English',
    georgian: 'Georgian',
    
    // Main page - Warning
    apiKeyRequired: 'API Key Required',
    apiKeyRequiredMessage: 'Click the Settings button in the top right to add your OpenAI or Anthropic API key.',
    
    // Settings Modal - Header
    settingsTitle: 'Settings',
    
    // Settings Modal - API Keys
    apiKeysSection: 'API Keys',
    openaiApiKey: 'OpenAI API Key',
    openaiPlaceholder: 'sk-...',
    anthropicApiKey: 'Anthropic API Key',
    anthropicPlaceholder: 'sk-ant-...',
    rememberKey: 'Remember this key in browser',
    getKeyAt: 'Get your key at',
    
    // Settings Modal - Model
    aiModelSection: 'AI Model',
    selectModel: 'Select Model',
    modelDescription: 'Different models may produce different translation quality and speed',
    
    // Settings Modal - Danger Zone
    dangerZone: 'Danger Zone',
    clearAllSettings: 'Clear all saved settings',
    clearConfirm: 'Clear all saved settings? This will remove all stored API keys and preferences.',
    clearDescription: 'This will remove all API keys and preferences from your browser',
    
    // Settings Modal - Footer
    done: 'Done',
    
    // Errors
    noApiKey: 'Please enter your',
    apiKey: 'API key',
    enterMingrelian: 'Please enter Mingrelian text to translate',
    timeout: 'Request timed out after 4 minutes. The AI model may be taking too long. Try a shorter text or different model.',
    networkError: 'Network error',
    apiError: 'API error',
    noResult: 'No result received from server',
  },
  ka: {
    // Navbar
    settings: 'პარამეტრები',
    
    // Main page - Input section
    mingrelianText: 'მეგრული ტექსტი',
    mingrelianPlaceholder: 'შეიყვანეთ მეგრული ტექსტი (ლათინური ან მხედრული)...',
    translate: 'თარგმნა',
    translating: 'თარგმნა მიმდინარეობს...',
    translationWillAppear: 'თარგმანი გამოჩნდება აქ',
    
    // Main page - Output section
    mingrelian: 'მეგრული',
    english: 'ინგლისური',
    georgian: 'ქართული',
    
    // Main page - Warning
    apiKeyRequired: 'საჭიროა API გასაღები',
    apiKeyRequiredMessage: 'დააჭირეთ პარამეტრები ღილაკს ზემოთ მარჯვნივ, რომ დაამატოთ თქვენი OpenAI ან Anthropic API გასაღები.',
    
    // Settings Modal - Header
    settingsTitle: 'პარამეტრები',
    
    // Settings Modal - API Keys
    apiKeysSection: 'API გასაღებები',
    openaiApiKey: 'OpenAI API გასაღები',
    openaiPlaceholder: 'sk-...',
    anthropicApiKey: 'Anthropic API გასაღები',
    anthropicPlaceholder: 'sk-ant-...',
    rememberKey: 'დამახსოვრება ბრაუზერში',
    getKeyAt: 'მიიღეთ გასაღები',
    
    // Settings Modal - Model
    aiModelSection: 'AI მოდელი',
    selectModel: 'აირჩიეთ მოდელი',
    modelDescription: 'სხვადასხვა მოდელმა შეიძლება განსხვავებული თარგმანის ხარისხი და სიჩქარე გამოიღოს',
    
    // Settings Modal - Danger Zone
    dangerZone: 'საშიში ზონა',
    clearAllSettings: 'ყველა შენახული პარამეტრის წაშლა',
    clearConfirm: 'წაიშალოს ყველა შენახული პარამეტრი? ეს წაშლის ყველა დამახსოვრებულ API გასაღებს და პარამეტრებს.',
    clearDescription: 'ეს წაშლის ყველა API გასაღებს და პარამეტრებს თქვენი ბრაუზერიდან',
    
    // Settings Modal - Footer
    done: 'დასრულება',
    
    // Errors
    noApiKey: 'გთხოვთ შეიყვანოთ თქვენი',
    apiKey: 'API გასაღები',
    enterMingrelian: 'გთხოვთ შეიყვანოთ მეგრული ტექსტი თარგმნისთვის',
    timeout: 'მოთხოვნის დრო ამოიწურა 4 წუთის შემდეგ. AI მოდელს შეიძლება დიდი დრო სჭირდება. სცადეთ უფრო მოკლე ტექსტი ან სხვა მოდელი.',
    networkError: 'ქსელის შეცდომა',
    apiError: 'API შეცდომა',
    noResult: 'სერვერიდან პასუხი არ მიღებულა',
  },
}

export type TranslationKey = keyof typeof translations.en

