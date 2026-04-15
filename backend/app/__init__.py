from flask import Flask
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import inspect, text
from config import config

db = SQLAlchemy()

WORKOUTS_COLUMNS = {
    "google_event_id": "VARCHAR(255)",
    "calendar_synced": "INTEGER DEFAULT 0",
    "calendar_sync_error": "TEXT",
    "last_synced_at": "DATETIME",
    "duration": "FLOAT",
    "intensity": "FLOAT",
    "frequency": "FLOAT",
    "muscle_groups": "VARCHAR(255)",
    "distance": "FLOAT",
    "speed": "FLOAT",
    "calories": "FLOAT",
    "heart_rate": "INTEGER",
    "pace": "VARCHAR(50)",
    "style": "VARCHAR(100)",
}

USERS_COLUMNS = {
    "google_id": "VARCHAR(255)",
    "google_access_token": "TEXT",
    "google_refresh_token": "TEXT",
    "google_token_expiry": "DATETIME",
    "calendar_id": "VARCHAR(255) DEFAULT 'primary'",
    "google_calendar_enabled": "INTEGER DEFAULT 0",
    "calorie_goal": "INTEGER DEFAULT 2000",
    "protein_goal": "INTEGER DEFAULT 120",
    "weekly_workout_target": "INTEGER DEFAULT 3",
    "language": "VARCHAR(10) DEFAULT 'en'",
    "units_weight": "VARCHAR(10) DEFAULT 'kg'",
    "units_distance": "VARCHAR(10) DEFAULT 'km'",
    "notification_workout_reminder": "INTEGER DEFAULT 0",
    "notification_workout_time": "VARCHAR(10) DEFAULT '08:00'",
    "notification_daily_nutrition": "INTEGER DEFAULT 0",
    "notification_weekly_summary": "INTEGER DEFAULT 0",
}

BODY_METRICS_COLUMNS = {
    "weight_kg": "FLOAT",
    "chest_cm": "FLOAT",
    "waist_cm": "FLOAT",
    "hips_cm": "FLOAT",
    "energy_level": "INTEGER",
    "notes": "TEXT",
}

CHALLENGES_COLUMNS = {
    "description": "TEXT",
    "type": "VARCHAR(50)",
    "target_value": "INTEGER",
    "unit": "VARCHAR(50)",
    "duration_days": "INTEGER",
    "is_active": "INTEGER DEFAULT 1",
}

USER_CHALLENGES_COLUMNS = {
    "current_value": "INTEGER DEFAULT 0",
    "is_completed": "INTEGER DEFAULT 0",
    "completed_at": "DATETIME",
    "expires_at": "DATETIME",
}

ACHIEVEMENTS_COLUMNS = {
    "type": "VARCHAR(50)",
    "name": "VARCHAR(150)",
    "value": "FLOAT",
    "unit": "VARCHAR(50)",
}

def ensure_db_schema(app):
    """Ensure any new model columns exist in the current SQLite schema."""
    with app.app_context():
        inspector = inspect(db.engine)

        if inspector.has_table("workouts"):
            existing_columns = {col["name"] for col in inspector.get_columns("workouts")}
            for name, ddl_type in WORKOUTS_COLUMNS.items():
                if name not in existing_columns:
                    db.session.execute(text(f"ALTER TABLE workouts ADD COLUMN {name} {ddl_type}"))

        if inspector.has_table("users"):
            existing_columns = {col["name"] for col in inspector.get_columns("users")}
            for name, ddl_type in USERS_COLUMNS.items():
                if name not in existing_columns:
                    db.session.execute(text(f"ALTER TABLE users ADD COLUMN {name} {ddl_type}"))

        if inspector.has_table("body_metrics"):
            existing_columns = {col["name"] for col in inspector.get_columns("body_metrics")}
            for name, ddl_type in BODY_METRICS_COLUMNS.items():
                if name not in existing_columns:
                    db.session.execute(text(f"ALTER TABLE body_metrics ADD COLUMN {name} {ddl_type}"))

        if inspector.has_table("challenges"):
            existing_columns = {col["name"] for col in inspector.get_columns("challenges")}
            for name, ddl_type in CHALLENGES_COLUMNS.items():
                if name not in existing_columns:
                    db.session.execute(text(f"ALTER TABLE challenges ADD COLUMN {name} {ddl_type}"))

        if inspector.has_table("user_challenges"):
            existing_columns = {col["name"] for col in inspector.get_columns("user_challenges")}
            for name, ddl_type in USER_CHALLENGES_COLUMNS.items():
                if name not in existing_columns:
                    db.session.execute(text(f"ALTER TABLE user_challenges ADD COLUMN {name} {ddl_type}"))

        if inspector.has_table("achievements"):
            existing_columns = {col["name"] for col in inspector.get_columns("achievements")}
            for name, ddl_type in ACHIEVEMENTS_COLUMNS.items():
                if name not in existing_columns:
                    db.session.execute(text(f"ALTER TABLE achievements ADD COLUMN {name} {ddl_type}"))

        db.session.commit()


def seed_challenges(app):
    """Seed initial challenges if they don't exist."""
    from app.models import Challenge

    with app.app_context():
        # Check if challenges already exist
        if Challenge.query.count() > 0:
            return

        challenges = [
            {
                'name': '30 Days of EMS',
                'description': 'Complete 30 EMS workouts in 30 days',
                'type': 'count',
                'target_value': 30,
                'unit': 'workouts',
                'duration_days': 30
            },
            {
                'name': '20 Workouts This Month',
                'description': 'Complete 20 workouts this month',
                'type': 'count',
                'target_value': 20,
                'unit': 'workouts',
                'duration_days': 30
            },
            {
                'name': '7-Day Streak',
                'description': 'Work out for 7 consecutive days',
                'type': 'streak',
                'target_value': 7,
                'unit': 'days',
                'duration_days': 14
            }
        ]

        for challenge_data in challenges:
            challenge = Challenge(**challenge_data)
            db.session.add(challenge)

        db.session.commit()


def create_app():
    """Application factory function."""
    app = Flask(__name__)
    app.config.from_object(config)
    
    # Initialize extensions
    db.init_app(app)
    
    # Import models to ensure they're registered
    from app.models import user, profile, workout, progress, nutrition

    # Create database tables and update schema if needed
    with app.app_context():
        db.create_all()
        ensure_db_schema(app)
        seed_challenges(app)

    # Register blueprints
    from app.routes import auth, workouts, google_calendar, progress, nutrition, settings, coach
    app.register_blueprint(auth.bp)
    app.register_blueprint(workouts.bp)
    app.register_blueprint(google_calendar.bp)
    app.register_blueprint(progress.progress_bp, url_prefix='/api/progress')
    app.register_blueprint(nutrition.nutrition_bp, url_prefix='/api/nutrition')
    app.register_blueprint(settings.settings_bp, url_prefix='/api')
    app.register_blueprint(coach.coach_bp, url_prefix='/api')

    # Apply CORS after all blueprints are registered so it covers every route
    CORS(app, origins=["http://localhost:5173", "http://127.0.0.1:5173", r"https://.*\.vercel\.app"],
         methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
         allow_headers=["Content-Type", "Authorization"])

    @app.route("/api/health", methods=["GET"])
    def health_check():
        return {"status": "ok"}, 200

    return app
