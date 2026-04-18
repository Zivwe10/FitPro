# FitPro — AI-Powered Personal Trainer

FitPro is a full-stack fitness web application that combines workout logging, nutrition tracking, progress analytics, and an AI coaching system. It supports English and Hebrew (with full RTL layout), syncs with Google Calendar, and uses the Claude AI API for coaching conversations and smart workout-image scanning.

**Live Demo:** [fit-pro-eight-eta.vercel.app](https://fit-pro-eight-eta.vercel.app) &nbsp;·&nbsp; **API:** [fitpro-vik3.onrender.com](https://fitpro-vik3.onrender.com/api/health)

---

## Features

### Workout Journal
- Log any workout type — EMS, running, weights, cycling, yoga
- Dynamic form fields that adapt to the selected exercise type (sets/reps, distance/pace, intensity/frequency, etc.)
- **AI device scan** — upload a photo of your fitness device or app screenshot; Claude Vision extracts workout data automatically
- Full history grouped by date with status badges: planned · completed · missed

### Weekly Planner
- 7-day calendar view with previous/next week navigation
- Schedule workouts per day and mark them complete or missed
- One-click sync to **Google Calendar** (individual or all planned workouts)

### Nutrition Tracker
- Daily food log split into Breakfast, Lunch, Dinner, Snack
- Calorie and protein progress bars vs. personalised goals
- **Body metrics calculator**: enter height / weight / age / gender / activity level → auto-computes BMI, BMR, and TDEE; TDEE becomes the daily calorie target
- Weekly calorie chart (last 7 days)
- Contextual nutrition tips that change based on the day's workout type

### Progress Dashboard
- At-a-glance stats: workouts this week/month, current streak, level progression
- **Personal records**: best EMS intensity, longest run, heaviest lift
- Four interactive charts: intensity trend, weekly volume, month-over-month comparison, body metrics over time
- **Active challenges** with live progress bars (30-day EMS, 20-workout month, 7-day streak)
- AI-generated insights: best training day, improvement percentage
- Body metrics log: weight, chest, waist, hips, energy level

### AI Coach
Choose one of four Claude-powered coach personalities:

| Coach | Personality |
|-------|-------------|
| **Sunny** | The Motivator — relentless positivity, celebrates every rep |
| **Rex** | The Drill Sergeant — zero excuses, blunt and demanding |
| **Dana** | The Realist — evidence-based, cuts through fitness myths |
| **Natasha** | The Soviet — cold precision, iron discipline |

Each coach has an animated SVG avatar that reacts during replies. Recent workout history is injected as context so advice stays relevant.

### Settings
- Profile: name, age, height, weight, gender
- Fitness goals: calorie target, protein target, weekly workout target
- Preferences: language (English / Hebrew), weight units (kg/lbs), distance units (km/miles)
- Notification toggles with custom reminder times
- Connected devices panel (Google Calendar live; Fitbit / Apple Health / Garmin coming soon)
- Account deletion with typed confirmation

---

## Tech Stack

### Frontend
| | |
|--|--|
| Framework | React 18 + Vite 5 |
| UI | Material-UI (MUI) v9 |
| Charts | Recharts 2 |
| Routing | React Router v6 |
| HTTP | Axios |
| i18n | i18next / react-i18next (EN + HE) |
| Auth | @react-oauth/google |

### Backend
| | |
|--|--|
| Framework | Flask 3.0 |
| ORM | Flask-SQLAlchemy 3 |
| Database | SQLite (dev) / PostgreSQL (prod via `DATABASE_URL`) |
| AI | Anthropic Claude API |
| Calendar | Google Calendar API (OAuth 2.0) |
| CORS | Flask-CORS |

### Deployment
| | |
|--|--|
| Frontend | Vercel (auto-deploy from `main`) |
| Backend | Render |

---

## Running Locally

### Prerequisites
- Node.js 18+
- Python 3.11+
- An [Anthropic API key](https://console.anthropic.com/) for AI coach and image scanning

### 1. Clone

```bash
git clone https://github.com/Zivwe10/FitPro.git
cd FitPro
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create **`backend/.env`**:

```env
ANTHROPIC_API_KEY=sk-ant-...
FLASK_ENV=development
SECRET_KEY=change-me
# Leave blank to use SQLite; set a Postgres URL for persistent storage
DATABASE_URL=
```

Start the API:

```bash
python run.py
# → http://localhost:5000
```

### 3. Frontend

```bash
cd frontend
npm install
```

Create **`frontend/.env.local`**:

```env
VITE_API_BASE_URL=http://localhost:5000
# Optional – required only for Google Calendar sync
VITE_GOOGLE_CLIENT_ID=your-google-oauth-client-id.apps.googleusercontent.com
```

Start the dev server:

```bash
npm run dev
# → http://localhost:5173
```

### 4. Open the app

Go to [http://localhost:5173](http://localhost:5173), complete onboarding, and start tracking.

---

## Project Structure

```
FitPro/
├── frontend/
│   ├── src/
│   │   ├── components/        # Header, Sidebar, GoogleCalendarSync
│   │   ├── context/           # AuthContext (userId, login, logout)
│   │   ├── i18n/              # en.json, he.json
│   │   └── pages/             # Dashboard, Workouts, Progress, Nutrition,
│   │                          #   Coach, Settings, Onboarding
│   ├── .env.production        # Points Vercel build → Render API
│   └── package.json
│
├── backend/
│   ├── app/
│   │   ├── models/            # User, Workout, NutritionEntry, UserBodyMetrics, …
│   │   └── routes/            # auth, workouts, progress, nutrition,
│   │                          #   coach, settings, google_calendar
│   ├── config.py
│   ├── requirements.txt
│   └── run.py
│
└── vercel.json                # Frontend build + SPA rewrite rules
```

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|----------|:--------:|-------------|
| `ANTHROPIC_API_KEY` | ✅ | Powers AI coach chat and workout image scanning |
| `FLASK_ENV` | | `development` or `production` (default: `development`) |
| `SECRET_KEY` | | Flask session secret — auto-generated at startup if omitted |
| `DATABASE_URL` | | Postgres connection string — falls back to SQLite if omitted |

### Frontend (`frontend/.env.local`)

| Variable | Required | Description |
|----------|:--------:|-------------|
| `VITE_API_BASE_URL` | ✅ | Backend base URL, e.g. `http://localhost:5000` |
| `VITE_GOOGLE_CLIENT_ID` | | Google OAuth client ID for Calendar sync |

---

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| `POST` | `/api/onboard` | Create user account during onboarding |
| `GET` | `/api/user/:id` | Fetch user + profile |
| `GET` | `/api/user/:id/settings` | Fetch all settings in one call |
| `PUT` | `/api/user/:id` | Update profile (name, age, height, weight, gender) |
| `PUT` | `/api/user/:id/goals` | Update fitness goals |
| `PUT` | `/api/user/:id/preferences` | Update preferences and notifications |
| `DELETE` | `/api/user/:id` | Delete account and all data |
| `POST` | `/api/workouts` | Log a workout |
| `POST` | `/api/extract-workout-image` | Extract workout data from image (Claude Vision) |
| `GET` | `/api/workouts/:user_id` | Get workout history |
| `PATCH` | `/api/workouts/:id` | Update workout status |
| `DELETE` | `/api/workouts/:id` | Delete workout |
| `POST` | `/api/workouts/:id/sync-calendar` | Sync workout to Google Calendar |
| `POST` | `/api/workouts/sync-all` | Sync all planned workouts to Google Calendar |
| `GET` | `/api/progress/stats` | Stats, streak, personal records, level |
| `GET` | `/api/progress/insights` | AI-generated training insights |
| `GET` | `/api/progress/challenges` | Active challenges |
| `POST` | `/api/progress/body-metrics` | Log body measurements |
| `GET` | `/api/nutrition/entries` | Food log for a specific date |
| `POST` | `/api/nutrition/entries` | Add food entry |
| `DELETE` | `/api/nutrition/entries/:id` | Delete food entry |
| `GET` | `/api/nutrition/weekly` | 7-day calorie/protein summary |
| `POST` | `/api/nutrition/body-metrics` | Save metrics for TDEE calculator |
| `POST` | `/api/coach/chat` | Send message to AI coach, receive reply |
| `GET` | `/api/health` | Health check |

---

## License

MIT
