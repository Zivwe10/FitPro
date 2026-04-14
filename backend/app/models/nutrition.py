from app import db
from datetime import datetime

class NutritionEntry(db.Model):
    __tablename__ = 'nutrition_entries'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    date = db.Column(db.Date, nullable=False)
    meal_slot = db.Column(db.String(50), nullable=False)
    food_name = db.Column(db.String(200), nullable=False)
    calories = db.Column(db.Integer, nullable=False, default=0)
    protein = db.Column(db.Float, nullable=False, default=0.0)
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'date': self.date.isoformat() if self.date else None,
            'meal_slot': self.meal_slot,
            'food_name': self.food_name,
            'calories': self.calories,
            'protein': self.protein,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }


class UserBodyMetrics(db.Model):
    """User body metrics for calculator (persistent across sessions)."""
    __tablename__ = 'user_body_metrics'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, unique=True)
    height_cm = db.Column(db.Float, nullable=True)
    weight_kg = db.Column(db.Float, nullable=True)
    age = db.Column(db.Integer, nullable=True)
    gender = db.Column(db.String(10), nullable=True)  # 'male', 'female'
    activity_level = db.Column(db.String(20), nullable=True)  # 'sedentary', 'lightly_active', 'moderately_active', 'very_active'
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'height_cm': self.height_cm,
            'weight_kg': self.weight_kg,
            'age': self.age,
            'gender': self.gender,
            'activity_level': self.activity_level,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
        }
