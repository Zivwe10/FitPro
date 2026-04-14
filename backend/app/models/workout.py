from app import db
from datetime import datetime

class Workout(db.Model):
    """Workout model for logged and planned exercise entries."""
    __tablename__ = "workouts"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    exercise = db.Column(db.String(150), nullable=False)
    sets = db.Column(db.Integer, nullable=False, default=1)
    reps = db.Column(db.Integer, nullable=False, default=1)
    weight = db.Column(db.Float, nullable=False, default=0.0)
    notes = db.Column(db.Text, nullable=True)
    date = db.Column(db.Date, nullable=False)
    status = db.Column(db.String(50), nullable=False, default="planned")
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Smart workout fields
    duration = db.Column(db.Float, nullable=True)
    intensity = db.Column(db.Float, nullable=True)
    frequency = db.Column(db.Float, nullable=True)
    muscle_groups = db.Column(db.String(255), nullable=True)
    distance = db.Column(db.Float, nullable=True)
    speed = db.Column(db.Float, nullable=True)
    calories = db.Column(db.Float, nullable=True)
    heart_rate = db.Column(db.Integer, nullable=True)
    pace = db.Column(db.String(50), nullable=True)
    style = db.Column(db.String(100), nullable=True)

    # Google Calendar integration
    google_event_id = db.Column(db.String(255), nullable=True, unique=True)
    calendar_synced = db.Column(db.Boolean, default=False)
    calendar_sync_error = db.Column(db.Text, nullable=True)
    last_synced_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "exercise": self.exercise,
            "sets": self.sets,
            "reps": self.reps,
            "weight": self.weight,
            "notes": self.notes,
            "date": self.date.isoformat() if self.date else None,
            "status": self.status,
            "duration": self.duration,
            "intensity": self.intensity,
            "frequency": self.frequency,
            "muscle_groups": self.muscle_groups,
            "distance": self.distance,
            "speed": self.speed,
            "calories": self.calories,
            "heart_rate": self.heart_rate,
            "pace": self.pace,
            "style": self.style,
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None,
            "google_event_id": self.google_event_id,
            "calendar_synced": self.calendar_synced,
            "calendar_sync_error": self.calendar_sync_error,
            "last_synced_at": self.last_synced_at.isoformat() if self.last_synced_at else None,
        }
