# Personal Trainer App – Phase 1

A modern web application for personal fitness training with React frontend and Flask backend.

## Phase 1 Features
- ✅ User onboarding with name, goals, and fitness level
- ✅ SQLite database with user profiles
- ✅ Dashboard with user information display
- ✅ Bilingual support (English & Hebrew)
- ✅ Mobile-friendly Material-UI design

## Tech Stack
- **Frontend**: Vite + React + React Router + Material-UI
- **Backend**: Flask + Flask-SQLAlchemy + SQLite
- **Internationalization**: react-i18next
- **API Communication**: Axios

## Project Structure

```
personal-trainer-app/
├── frontend/
│   ├── src/
│   │   ├── components/     # Reusable components (Header, etc.)
│   │   ├── context/        # React Context (AuthContext)
│   │   ├── i18n/           # Translations (en.json, he.json)
│   │   ├── pages/          # Page components (Onboarding, Dashboard)
│   │   ├── App.jsx         # Main app with routing
│   │   ├── main.jsx        # Entry point
│   │   └── index.css       # Global styles
│   ├── vite.config.js      # Vite configuration
│   ├── index.html          # HTML template
│   ├── package.json        # Dependencies
│   └── .env.local          # Environment variables
│
├── backend/
│   ├── app/
│   │   ├── models/
│   │   │   ├── user.py      # User model
│   │   │   └── profile.py   # UserProfile model
│   │   ├── routes/
│   │   │   └── auth.py      # API endpoints
│   │   └── __init__.py      # Flask app factory
│   ├── config.py            # Flask configuration
│   ├── run.py               # Entry point
│   ├── requirements.txt     # Python dependencies
│   └── .env                 # Environment variables
│
├── .gitignore
└── README.md
```

## Installation & Setup

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Git

### Backend Setup

1. **Create Python virtual environment**:
   ```bash
   cd backend
   python -m venv venv
   ```

2. **Activate virtual environment**:
   - Windows: `venv\Scripts\activate`
   - Mac/Linux: `source venv/bin/activate`

3. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

4. **Run the server**:
   ```bash
   python run.py
   ```
   Flask server will start on `http://localhost:5000`

### Frontend Setup

1. **Install dependencies**:
   ```bash
   cd frontend
   npm install
   ```

2. **Start development server**:
   ```bash
   npm run dev
   ```
   Vite server will start on `http://localhost:5173`

3. **Build for production**:
   ```bash
   npm run build
   ```

## API Endpoints (Phase 1)

### `POST /api/onboard`
Create a new user with profile information.

**Request**:
```json
{
  "name": "John Doe",
  "fitness_level": "beginner",
  "goals": ["weight_loss", "strength"]
}
```

**Response**:
```json
{
  "user_id": 1,
  "message": "User onboarded successfully",
  "user": {
    "id": 1,
    "name": "John Doe",
    "created_at": "2024-01-15T10:30:00"
  },
  "profile": {
    "id": 1,
    "user_id": 1,
    "fitness_level": "beginner",
    "goals": ["weight_loss", "strength"],
    "created_at": "2024-01-15T10:30:00",
    "updated_at": "2024-01-15T10:30:00"
  }
}
```

### `GET /api/user/<user_id>`
Fetch user and profile information.

**Response**:
```json
{
  "user": {
    "id": 1,
    "name": "John Doe",
    "created_at": "2024-01-15T10:30:00"
  },
  "profile": {
    "id": 1,
    "user_id": 1,
    "fitness_level": "beginner",
    "goals": ["weight_loss", "strength"],
    "created_at": "2024-01-15T10:30:00",
    "updated_at": "2024-01-15T10:30:00"
  }
}
```

### `GET /api/health`
Health check endpoint.

## Usage

1. **Open the app** at `http://localhost:5173`
2. **Select language** (English or Hebrew) – RTL automatically applied for Hebrew
3. **Fill in the onboarding form**:
   - Enter your name
   - Select fitness level (Beginner, Intermediate, Advanced)
   - Select one or more fitness goals
4. **Submit** and you'll be redirected to the dashboard
5. **Toggle language** in the header to switch between English and Hebrew
6. **Logout** to return to onboarding

## Database

**User Table**:
- id (Primary Key)
- name (String, required)
- created_at (DateTime)

**UserProfile Table**:
- id (Primary Key)
- user_id (Foreign Key → User.id)
- fitness_level (String: beginner, intermediate, advanced)
- goals (JSON stored as Text)
- created_at (DateTime)
- updated_at (DateTime)

Database is auto-created on first Flask app startup as `backend/app.db` (SQLite).

## Bilingual Support

All UI text strings support both English and Hebrew with full RTL support for Hebrew:
- Language toggle in the header
- Automatic RTL layout switching via CSS `direction: rtl`
- Translations in `frontend/src/i18n/en.json` and `frontend/src/i18n/he.json`

## Next Steps (Upcoming Phases)

- **Phase 2**: Workout Journal – Manual workout logging with exercise tracking
- **Phase 3**: Smart Image Data Extraction – Claude Vision API integration
- **Phase 4**: AI Coach – Chat interface with Claude as personal trainer
- **Phase 5**: Dashboard & Progress – Graphs and body tracking

## Environment Variables

### Frontend (`.env.local`)
```
VITE_API_BASE_URL=http://localhost:5000
```

### Backend (`.env`)
```
FLASK_ENV=development
FLASK_DEBUG=True
DATABASE_URL=sqlite:///app.db
```

## Troubleshooting

### Backend Not Starting
- Ensure Python 3.9+ is installed: `python --version`
- Verify virtual environment is activated
- Check port 5000 is not in use

### Frontend Not Connecting to Backend
- Verify backend is running on `http://localhost:5000`
- Check `VITE_API_BASE_URL` in `.env.local`
- Check CORS is enabled (should be by default)

### Database Issues
- Delete `backend/app.db` to reset database
- Re-run `python run.py` to recreate tables

## License
MIT
