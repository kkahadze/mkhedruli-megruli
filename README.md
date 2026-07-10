# Mkhedruli - Mingrelian Translator

A modern Next.js application for translating Mingrelian text to Georgian and English using AI models, defaulting to GPT-5.6 Luna with low reasoning.

## Features

- 🌐 Translate Mingrelian to English or Georgian
- 🤖 Support for multiple AI models, including GPT-5.6 Luna, GPT-5.5, and Claude Sonnet 4.5
- 💾 Save API keys locally in browser
- 🎨 Clean, minimalist UI with two-column layout
- 📱 Responsive design
- 🔄 Automatic transliteration to latinized script

## Getting Started

### Installation

```bash
# Install dependencies
npm install
# or
yarn install
# or
pnpm install
```

### Running the Development Server

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

```bash
npm run build
npm start
```

## Usage

1. **Enter API Keys (Optional)**: Add your OpenAI, Anthropic, or Gemini API keys if you want to override the server-side defaults
2. **Select Model**: Choose between GPT-5.4 Nano (default), other GPT-5 variants, Claude Sonnet 4.5, or Gemini
3. **Input Text**: Enter Mingrelian text in the left panel (latinized or mkhedruli script)
4. **Choose Target**: Select English or Georgian as target language
5. **Translate**: Click the translate button
6. **View Results**: See the translation in the right panel

## Project Structure

```
mkhedruli-megruli/
├── app/
│   ├── layout.tsx       # Root layout with navbar
│   ├── page.tsx         # Main translator page
│   └── globals.css      # Global styles
├── components/
│   └── Navbar.tsx       # Navigation bar component
├── utils/
│   └── transliterate.ts # Transliteration utilities
└── public/
    └── mkhedruli-logo.png # Logo image
```

## Technologies

- **Next.js 14** - React framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **localStorage** - Client-side storage

## Backend API

The application connects to the Argo translator API hosted at:
`https://argo-translator.onrender.com/chat`

If the backend is configured with provider API keys in its environment, end users do not need to supply their own keys for the default experience.

The client also generates an anonymous `visitor_id` in `localStorage` and sends it with translation requests so backend analytics can group repeat visits without collecting account details.

## License

MIT
