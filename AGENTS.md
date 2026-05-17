# Mkhedruli Frontend

Next.js 14 static-export frontend for the Mingrelian translator. It renders the browser UI, stores local preferences, and calls the Argo backend `/chat` SSE endpoint.

## Working Rules

- Check `git status --short --branch` before editing. Do not revert user work.
- Do not commit `.env.local`, API keys, `.next/`, `out/`, `node_modules/`, or generated TypeScript build info.
- Keep this app static-export compatible. `next.config.js` uses `output: 'export'`, so avoid server-only Next.js features unless deployment strategy changes.
- Keep provider/model/request changes synchronized with the backend `argo` repo.
- Preserve English/Georgian UI copy coverage when adding visible text.

## Key Files

- `app/page.tsx`: Main translator UI, model list, server-key model allowlist, validation, request body, SSE parser, result rendering, saved preferences.
- `app/layout.tsx`: Metadata, global layout, Google Analytics script, language provider.
- `app/not-found.tsx`: Static-export-friendly not-found page.
- `app/globals.css`: Tailwind/global styles.
- `components/Navbar.tsx`: Logo, app title, language toggle, settings button.
- `components/SettingsModal.tsx`: API keys, remember-key flags, model picker, clear-settings flow.
- `contexts/LanguageContext.tsx`: English/Georgian UI language state and `t()` helper.
- `utils/translations.ts`: UI strings for English and Georgian.
- `utils/transliterate.ts`: Mkhedruli/latinized transliteration helpers.
- `utils/siteDefaults.ts`: Geo-based UI/source/target defaults.
- `public/mkhedruli-logo.png`: Logo used by Next image/static export.

## Backend Contract

The app posts to `${API_URL}/chat`, where `API_URL` is `NEXT_PUBLIC_API_URL` with trailing slashes removed, or `https://argo-translator.onrender.com` by default.

Local backend:

```bash
printf 'NEXT_PUBLIC_API_URL=http://localhost:8000\n' > .env.local
```

Request body currently includes:

- `prompt`
- `api_key`
- `source_language`
- `target_language`
- `model`
- `provider`
- `reasoning_effort` when required by the selected model

The frontend expects SSE lines beginning with `data: `. The final event must contain `result` with `mingrelian_latinized`, `mingrelian_mkhedruli`, `georgian`, and `english`.

## Models And Keys

Model/provider choices live in `app/page.tsx`. Keep these aligned with `argo/src/provider_config.py`.

- Default model: `gpt-5.5`
- Default reasoning effort for the default model: `none`
- Server-key-capable frontend models: `gpt-5.5`, `gpt-5.4-nano`, `gemini-3.1-flash-lite`
- Legacy Gemini preview id is migrated to `gemini-3.1-flash-lite`

User API keys are kept in browser `localStorage` only when the user enables the remember option. Do not introduce server-side key handling in this repo.

## Local Commands

Install:

```bash
npm install
```

Run:

```bash
npm run dev
```

Verify:

```bash
npm run build
npm run lint
```

## UI State And Persistence

Local storage keys use the `mingrelian_*` prefix. Important ones include provider keys, remember-key flags, selected model, source/target languages, UI language, and model migration markers.

Input is limited to 100 characters in `app/page.tsx`; update UI copy and validation together if that changes.

Language options are exactly `mingrelian`, `georgian`, and `english`. If the backend language set changes, update `utils/siteDefaults.ts`, `utils/translations.ts`, `app/page.tsx`, and result rendering.

## Design Notes

- This is the actual translator app, not a landing page. Keep the first screen task-focused.
- Maintain responsive behavior across mobile and desktop, especially language tabs, text areas, result panel, and settings modal.
- Use existing Tailwind patterns and components before inventing new structure.
- Keep text inside buttons and compact controls from wrapping awkwardly in Georgian.
