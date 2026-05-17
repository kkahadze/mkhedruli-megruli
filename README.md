# Mkhedruli - Mingrelian Translator

A modern Next.js application for translating Mingrelian, Georgian, and English using a small public OpenAI model selector.

## Features

- 🌐 Translate Mingrelian to English or Georgian
- 🤖 Public OpenAI model selector for GPT-5.5, GPT-5.4 Mini, and GPT-5.4 Nano
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

To point the frontend at a local backend, create `.env.local` with:

```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
```

If `.env.local` is absent, the app falls back to the hosted API.

### Building for Production

```bash
npm run build
npm start
```

## Usage

1. **Enter API Key (Optional)**: Add your OpenAI API key if you want to override the server-side defaults
2. **Select Model**: Choose between GPT-5.5, GPT-5.4 Mini, and GPT-5.4 Nano
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
│   ├── modelOptions.ts  # Public/hidden model configuration
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

The application reads the backend base URL from `NEXT_PUBLIC_API_URL`.

Default:
`https://argo-translator.onrender.com/chat`

Local development example:
`http://localhost:8000/chat`

If the backend is configured with provider API keys in its environment, end users do not need to supply their own keys for the default experience.

## License

MIT
