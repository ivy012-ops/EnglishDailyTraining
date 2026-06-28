<div align="center">

# SpeakFlow
### AI-Powered English Conversation Practice

**Practice real English conversations with AI — anytime, anywhere.**

[![Vercel](https://img.shields.io/badge/deployed%20on-Vercel-black?logo=vercel&logoColor=white)](https://english-daily-training.vercel.app/)
[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Firestore-FFCA28?logo=firebase&logoColor=black)](https://firebase.google.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

[Live App](https://english-daily-training.vercel.app/) · [Report Bug](https://github.com/ivy012-ops/EnglishDailyTraining/issues) · [Request Feature](https://github.com/ivy012-ops/EnglishDailyTraining/issues)

</div>

---

## Screenshots

| Scenario Selection | Live Conversation | Quota Bar |
|---|---|---|
| ![Scenario Selection](https://github.com/ivy012-ops/EnglishDailyTraining/assets/placeholder-scenarios.png) | ![Live Conversation](https://github.com/ivy012-ops/EnglishDailyTraining/assets/placeholder-conversation.png) | ![Quota Bar](https://github.com/ivy012-ops/EnglishDailyTraining/assets/placeholder-quota.png) |

> To update these: take a screenshot of each screen, upload them to this repo under `assets/`, and replace the URLs above.

---

## What is SpeakFlow?

SpeakFlow is a web app that helps intermediate and advanced English learners (B1–C1) build real speaking confidence through structured AI conversations, impromptu speech practice, and daily vocabulary drills.

Unlike passive learning apps, SpeakFlow puts you in the driver's seat — you talk, the AI responds, and you get instant feedback on fluency, pacing, and vocabulary use.

---

## Features

### AI Conversation Scenarios
Choose from curated real-world scenarios (job interviews, travel, negotiations, small talk) and have a live back-and-forth conversation with an AI partner. Get feedback on your response quality after each exchange.

### Daily Impromptu Practice
Receive a random topic and speak for 60–90 seconds. The app tracks your filler word frequency, response latency, and vocabulary range.

### Vocabulary Drills
Context-aware vocabulary sessions tailored to your proficiency level. Learn words in sentences, not isolation.

### Adaptive Proficiency Levels
Start with a quick level assessment. The app tracks your progress and adjusts difficulty across B1, B2, and C1 levels.

### Usage Quota + Progress Bar
Free users get 5 AI sessions per day with a visual quota bar that resets daily at midnight UTC.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| Styling | Tailwind CSS + Framer Motion |
| Auth | Firebase Auth (Google Sign-In) |
| Database | Firebase Firestore |
| AI | Google Gemini (via serverless proxy) |
| Speech | Web Speech API (browser built-in) |
| Hosting | Vercel |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Google Gemini API key ([get one here](https://aistudio.google.com/))
- A Firebase project with Auth + Firestore enabled

### Local Setup

```bash
# Clone the repo
git clone https://github.com/ivy012-ops/EnglishDailyTraining.git
cd EnglishDailyTraining

# Install dependencies
npm install

# Add your API key
echo "GEMINI_API_KEY=your_key_here" > .env.local

# Start the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Project Structure

```
src/
├── App.tsx              # Main app + state machine
├── firebase.ts          # Firebase config + helpers
├── components/
│   └── QuotaBar.tsx     # Animated daily quota progress bar
├── hooks/
│   └── useQuota.ts      # Quota state hook
├── services/
│   └── quotaService.ts  # Firestore quota CRUD
└── data/
    └── fallbacks.ts     # Offline fallback content
```

---

## Pricing

| Plan | Price | AI Sessions/Day |
|---|---|---|
| Free | $0 | 5 |
| Pro | $9.99/month | Unlimited |
| Premium | $99/year | Unlimited + exports |

---

## Roadmap

- [ ] Stripe subscription integration
- [ ] Pre-recorded scenarios (no API cost)
- [ ] Session history + playback
- [ ] Pronunciation scoring
- [ ] Mobile app

---

## License

MIT
