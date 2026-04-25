# Serene

A student wellness web app that helps college students manage academic stress through deadline tracking, a 7-day stress forecast, campus resources, and an AI-powered support chat.

---

## Features

- **Google Authentication** — Sign in with Google via Firebase Auth
- **Stress Forecast** — 7-day bar chart showing predicted stress levels based on upcoming deadlines, assignment weights, and daily mood check-ins
- **Deadline Tracking** — All semester deadlines sorted and displayed with urgency indicators
- **Campus Resources** — Quick links to on-campus wellness and academic support services
- **AI Support Chat** — Conversational support powered by Gemini 2.5 Flash, with context-aware opening messages and a compassionate system prompt
- **Profile Page** — Displays user info pulled from Google Auth with editable university, major, and year fields

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite |
| Styling | Tailwind CSS 4 |
| Routing | React Router v7 |
| Auth | Firebase Auth (Google Sign-In) |
| AI Chat | Google Gemini API (`gemini-2.5-flash`) |
| Charts | Recharts |

---

## Getting Started

### Prerequisites

- A Firebase project with Google Sign-In enabled
- A Google AI Studio API key

### Running Locally

```bash
npm run dev
```

The app will be available at `http://localhost:5173`.

---

## Project Structure

```
src/
├── auth/
│   └── AuthContext.jsx       # Firebase Auth context and Google sign-in logic
├── components/
│   ├── GoogleSignInNavButton.jsx
│   ├── LandingSignInNav.jsx
│   └── Navbar.jsx
├── lib/
│   └── firebase.js           # Firebase initialization
├── pages/
│   ├── Landing.jsx           # Hero page with sign-in
│   ├── Dashboard.jsx         # Stress forecast + deadline overview
│   ├── Profile.jsx           # User profile and activity summary
│   ├── StressForecast.jsx    # Full stress forecast view
│   └── Support.jsx           # Campus resources + Gemini AI chat
└── data/
    └── mockCourses.js        # Mock semester course/deadline data
```

---

## Stress Score Algorithm

Each day's stress score (0–10) is calculated from:

1. **Proximity** — deadlines closer in time apply higher pressure (drops off sharply after day 2)
2. **Academic weight** — mapped from assignment percentage or type (exam > project > quiz > assignment)
3. **Clustering multiplier** — multiple deadlines in a 3-day window compound the score
4. **Mood modifier** — daily check-in (Overwhelmed, Anxious, Tired, Focused, Calm) shifts today's score

---

## Team

| Name | GitHub |
|---|---|
| Alameen Adeku, David Soboma Bestman, Sofiat Adeyemi

---

## Contributing

1. Create a feature branch off `main`
2. Open a pull request with a clear description of changes
3. Tag a teammate for review before merging
