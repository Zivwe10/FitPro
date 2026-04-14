from app import db
from datetime import datetime
import json

class UserProfile(db.Model):
    """User profile model storing fitness goals and level."""
    __tablename__ = "user_profiles"
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False, unique=True)
    fitness_level = db.Column(db.String(50), nullable=False)  # beginner, intermediate, advanced
    goals = db.Column(db.Text, nullable=True)  # JSON string of goals list
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship to User
    user = db.relationship("User", back_populates="profile")
    
    def set_goals(self, goals_list):
        """Set goals as JSON string."""
        self.goals = json.dumps(goals_list)
    
    def get_goals(self):
        """Get goals as list."""
        if self.goals:
            return json.loads(self.goals)
        return []
    
    def to_dict(self):
        """Convert profile to dictionary."""
        return {
            "id": self.id,
            "user_id": self.user_id,
            "fitness_level": self.fitness_level,
            "goals": self.get_goals(),
            "created_at": self.created_at.isoformat() if self.created_at else None,
            "updated_at": self.updated_at.isoformat() if self.updated_at else None
        }
