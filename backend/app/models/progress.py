from app import db
from datetime import datetime, date

class BodyMetrics(db.Model):
    """Body metrics model for tracking weight, measurements, and energy levels."""
    __tablename__ = "body_metrics"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    date = db.Column(db.Date, nullable=False, default=date.today)
    weight_kg = db.Column(db.Float, nullable=True)
    chest_cm = db.Column(db.Float, nullable=True)
    waist_cm = db.Column(db.Float, nullable=True)
    hips_cm = db.Column(db.Float, nullable=True)
    energy_level = db.Column(db.Integer, nullable=True)  # 1-10 scale
    notes = db.Column(db.Text, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "date": self.date.isoformat() if self.date else None,
            "weight_kg": self.weight_kg,
            "chest_cm": self.chest_cm,
            "waist_cm": self.waist_cm,
            "hips_cm": self.hips_cm,
            "energy_level": self.energy_level,
            "notes": self.notes,
            "created_at": self.created_at.isoformat() if self.created_at else None,
        }


class Challenge(db.Model):
    """Predefined challenges that users can participate in."""
    __tablename__ = "challenges"

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(150), nullable=False)
    description = db.Column(db.Text, nullable=True)
    type = db.Column(db.String(50), nullable=False)  # 'duration', 'count', 'streak'
    target_value = db.Column(db.Integer, nullable=False)
    unit = db.Column(db.String(50), nullable=False)  # 'days', 'workouts', 'sessions'
    duration_days = db.Column(db.Integer, nullable=True)  # For time-limited challenges
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "description": self.description,
            "type": self.type,
            "target_value": self.target_value,
            "unit": self.unit,
            "duration_days": self.duration_days,
            "is_active": self.is_active,
        }


class UserChallenge(db.Model):
    """User's progress on challenges."""
    __tablename__ = "user_challenges"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    challenge_id = db.Column(db.Integer, db.ForeignKey("challenges.id"), nullable=False)
    current_value = db.Column(db.Integer, default=0)
    is_completed = db.Column(db.Boolean, default=False)
    completed_at = db.Column(db.DateTime, nullable=True)
    started_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    expires_at = db.Column(db.DateTime, nullable=True)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "challenge_id": self.challenge_id,
            "current_value": self.current_value,
            "is_completed": self.is_completed,
            "completed_at": self.completed_at.isoformat() if self.completed_at else None,
            "started_at": self.started_at.isoformat() if self.started_at else None,
            "expires_at": self.expires_at.isoformat() if self.expires_at else None,
        }


class Achievement(db.Model):
    """User achievements and level system."""
    __tablename__ = "achievements"

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    type = db.Column(db.String(50), nullable=False)  # 'level', 'personal_record', 'streak'
    name = db.Column(db.String(150), nullable=False)
    value = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(50), nullable=True)
    achieved_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)

    def to_dict(self):
        return {
            "id": self.id,
            "user_id": self.user_id,
            "type": self.type,
            "name": self.name,
            "value": self.value,
            "unit": self.unit,
            "achieved_at": self.achieved_at.isoformat() if self.achieved_at else None,
        }