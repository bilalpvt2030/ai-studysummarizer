# AI Study Summarizer

Turn study material into revision notes. Upload a PDF or a photo of your notes, or paste text, and get a summary, flashcards and a multiple-choice quiz.

Live: https://ai-studysummarizer.ai-studysummarizer.workers.dev

## Features

- **Summaries** with an overview, key points, key terms and revision questions, at short, standard or detailed length
- **Flashcards** built from the key terms and questions
- **Quiz mode** with five multiple-choice questions per document, marked with explanations
- **Input** as PDF (including scanned pages), PNG / JPG / WebP images, or pasted text, up to 20 MB
- **History**: every summary is saved to your account and can be reopened, renamed or deleted
- **Export** to a Word document, Markdown, or PDF (through the browser's print dialog)
- **Accounts**: Google sign-in or email and password, password reset, and account deletion
- **Fair use**: 20 summaries per user per 24 hours

## How it works

| Part | Technology |
| --- | --- |
| App | Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS 4 |
| Sign-in and database | Supabase (Auth, Postgres with row level security) |
| AI | Google Gemini API, called from the server |
| Hosting | Cloudflare Workers through the OpenNext adapter |

A document is sent from the browser to `POST /api/summarize`, which checks the session, the file type and size, and the user's daily allowance. Files are uploaded to Gemini's Files API, summarized into a fixed JSON shape, and deleted from Gemini's storage afterwards. Only the resulting summary is stored. Flashcards and quizzes are built in the browser from that summary.

The app tries several Gemini models in order and moves to the next one when a model is busy, out of its daily free quota, or stops responding.

## Running it locally

Requirements: Node.js 20 or newer, a Supabase project, and a Gemini API key.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Fill in `.env.local`:

| Variable | Where it comes from |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase dashboard, Settings, API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase dashboard, Settings, API |
| `GEMINI_API_KEY` | Google AI Studio |
| `GEMINI_MODEL` | Optional. A model to try before the built-in list |
| `NEXT_PUBLIC_CONTACT_EMAIL` | Optional. Shown on the privacy and terms pages |

Then open http://localhost:3000.

### Database

Run the SQL files in `supabase/migrations/` in order, in the Supabase SQL editor. They create:

- `summaries`: saved summaries, readable and writable only by their owner
- `summary_usage`: one row per summary generated, used for the daily limit
- `delete_own_account()`: lets a signed-in user delete their own account

### Sign-in

- In Supabase, under Authentication, URL Configuration, add `http://localhost:3000/**` and your deployed address to the redirect URLs.
- For Google sign-in, create an OAuth client in Google Cloud with the redirect URI `https://<your-project>.supabase.co/auth/v1/callback`, and enter its client ID and secret in Supabase under Authentication, Providers, Google.

## Deploying

```bash
npm run deploy
```

This builds the app with OpenNext and publishes it to Cloudflare Workers using the settings in `wrangler.jsonc`. It needs `npx wrangler login` once.

## Project layout

```
src/app/                  Pages and routes
  api/summarize/          The summarize endpoint
  auth/callback/          Sign-in callback
  dashboard/              Upload, summary view, flashcards, quiz, history
  account/                Account details and deletion
src/lib/gemini.ts         Gemini calls and model fallback
src/lib/summaries.ts      Saved summaries and the daily limit
src/lib/study.ts          Flashcard and quiz builders
src/lib/export.ts         Word and Markdown export
src/proxy.ts              Session refresh and route protection
supabase/migrations/      Database schema
```

## Limits to know about

- The Gemini free tier allows a fixed number of requests per model per day. When every model has run out, the app says so and works again after the daily reset.
- On the free tier, Google may use submitted content to improve its products. Do not upload confidential documents.
- Summaries are written by AI and can be wrong. Check anything important against the source.
