# TechSonance Chatbot Setup & Operations Guide

## 1. Quick Start

### 1.1 Install Dependencies
```bash
npm install
```

### 1.2 Configure Environment Variables
Copy `.env.example` to `.env.local`:
```bash
cp .env.example .env.local
```
Add at least two LLM provider keys and your email settings in `.env.local`.

### 1.3 Verify Provider Health
```bash
npm run check:env
```
To test email sending:
```bash
npm run check:env -- --send-test
```

### 1.4 Build Knowledge Base Index
```bash
npm run build:kb
```

### 1.5 Run Development Server
```bash
npm run dev
```

---

## 2. API Keys Acquisition Guide

| Provider | Direct Link | Instructions |
|---|---|---|
| **Groq** | [console.groq.com/keys](https://console.groq.com/keys) | Create free account, click "Create API Key", copy key to `GROQ_API_KEY`. |
| **Google Gemini** | [aistudio.google.com/apikey](https://aistudio.google.com/apikey) | Click "Create API key", copy key to `GEMINI_API_KEY`. |
| **OpenRouter** | [openrouter.ai/keys](https://openrouter.ai/keys) | Create account, generate API key, copy to `OPENROUTER_API_KEY` (accesses free `:free` models). |
| **Cerebras** | [cloud.cerebras.ai](https://cloud.cerebras.ai) | Sign up for free developer access, copy key to `CEREBRAS_API_KEY`. |
| **Mistral AI** | [console.mistral.ai](https://console.mistral.ai) | Go to API Keys in console, copy key to `MISTRAL_API_KEY`. |
| **Cloudflare Workers AI** | [dash.cloudflare.com](https://dash.cloudflare.com) | Copy Account ID and create an API Token with Workers AI permissions. |
| **Gmail SMTP** | [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords) | Enable 2-Step Verification, generate an "App password", paste in `SMTP_PASS`. |
| **Resend** | [resend.com](https://resend.com) | Create API Key and verify your sending domain (alternative to SMTP). |
| **Upstash Redis** | [console.upstash.com](https://console.upstash.com) | Create a free Serverless Redis database and copy REST URL and token. |

---

## 3. Knowledge Base Maintenance

1. Edit markdown files in `data/kb/*.md` (`company.md`, `services.md`, `pricing.md`, `team.md`, `process.md`, `experience.md`, `policies.md`, `projects-ideas.md`).
2. Edit direct questions and aliases in `data/faq.json`.
3. Re-generate index:
   ```bash
   npm run build:kb
   ```
4. For production validation (ensures no unconfirmed `{{...}}` placeholders):
   ```bash
   npm run build:kb -- --strict
   ```

---

## 4. Production Deployment Checklist (Vercel)

1. Add environment variables in **Vercel > Project > Settings > Environment Variables**:
   - `GROQ_API_KEY`, `GEMINI_API_KEY`, etc.
   - `ADMIN_EMAIL`, `FROM_EMAIL`, `SMTP_HOST`, `SMTP_USER`, `SMTP_PASS` (or `RESEND_API_KEY`)
   - `NEXT_PUBLIC_SITE_URL=https://www.techsonance.co.in`
   - `ALLOWED_ORIGINS=https://www.techsonance.co.in,https://techsonance.co.in`
   - `ALLOW_PLACEHOLDERS=false`
   - `UPSTASH_REDIS_REST_URL` & `UPSTASH_REDIS_REST_TOKEN` (recommended for shared rate limits and health states across serverless instances)
2. Deploy. The build script runs `npm run build:kb` automatically.
