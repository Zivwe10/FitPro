import os
import secrets
from dotenv import load_dotenv

load_dotenv()

class Config:
    """Base configuration."""
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ECHO = False
    # Use SECRET_KEY from env; fall back to a random key (not persistent across restarts)
    SECRET_KEY = os.getenv("SECRET_KEY") or secrets.token_hex(32)
    MAX_CONTENT_LENGTH = 2 * 1024 * 1024  # 2 MB upload limit

class DevelopmentConfig(Config):
    """Development configuration."""
    DEBUG = True
    FLASK_ENV = "development"
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///app.db")
    SQLALCHEMY_ECHO = False  # Avoid printing SQL with user data to console

class ProductionConfig(Config):
    """Production configuration."""
    DEBUG = False
    FLASK_ENV = "production"
    SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL", "sqlite:///app.db")

# Select config based on environment
import os as _os
_env = _os.getenv("FLASK_ENV", "development")
config = ProductionConfig() if _env == "production" else DevelopmentConfig()
