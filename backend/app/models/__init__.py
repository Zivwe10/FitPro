# Import models to register them with SQLAlchemy
from .user import User
from .profile import UserProfile
from .workout import Workout
from .progress import BodyMetrics, Challenge, UserChallenge, Achievement
from .nutrition import NutritionEntry, UserBodyMetrics
