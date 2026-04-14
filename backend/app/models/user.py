from app import db
from datetime import datetime

class User(db.Model):
    """User model storing basic user information."""
    __tablename__ = "users"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    # Relationship to UserProfile
    profile = db.relationship("UserProfile", back_populates="user", uselist=False, cascade="all, delete-orphan")

    # Google Calendar OAuth
    google_id = db.Column(db.String(255), unique=True, nullable=True)
    google_access_token = db.Column(db.Text, nullable=True)
    google_refresh_token = db.Column(db.Text, nullable=True)
    google_token_expiry = db.Column(db.DateTime, nullable=True)
    calendar_id = db.Column(db.String(255), nullable=True, default="primary")
    google_calendar_enabled = db.Column(db.Boolean, default=False)

    # Goals
    calorie_goal = db.Column(db.Integer, default=2000)
    protein_goal = db.Column(db.Integer, default=120)
    weekly_workout_target = db.Column(db.Integer, default=3)

    # Preferences
    language = db.Column(db.String(10), default='en')
    units_weight = db.Column(db.String(10), default='kg')
    units_distance = db.Column(db.String(10), default='km')

    # Notifications
    notification_workout_reminder = db.Column(db.Boolean, default=False)
    notification_workout_time = db.Column(db.String(10), default='08:00')
    notification_daily_nutrition = db.Column(db.Boolean, default=False)
    notification_weekly_summary = db.Column(db.Boolean, default=False)

    def to_dict(self):
        """Convert user to dictionary."""
        return {
            "id": self.id,
            "name": self.name,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "google_calendar_enabled": self.google_calendar_enabled,
            "calendar_id": self.calendar_id,
            "calorie_goal": self.calorie_goal or 2000,
            "protein_goal": self.protein_goal or 120,
            "weekly_workout_target": self.weekly_workout_target or 3,
            "language": self.language or 'en',
            "units_weight": self.units_weight or 'kg',
            "units_distance": self.units_distance or 'km',
            "notification_workout_reminder": bool(self.notification_workout_reminder),
            "notification_workout_time": self.notification_workout_time or '08:00',
            "notification_daily_nutrition": bool(self.notification_daily_nutrition),
            "notification_weekly_summary": bool(self.notification_weekly_summary),
        }
