from flask import Blueprint, request, jsonify, redirect, url_for
from datetime import datetime
import os

bp = Blueprint("google_calendar", __name__, url_prefix="/api/auth/google")
from app import db
from app.models.user import User
from app.models.workout import Workout
from app.services.google_calendar_service import GoogleCalendarService

calendar_service = GoogleCalendarService()

@bp.route("/authorize", methods=["POST"])
def authorize():
    """Generate authorization URL for Google Calendar."""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        if not user_id:
            return jsonify({"error": "user_id required"}), 400
        
        # Generate callback URL
        redirect_uri = os.getenv('GOOGLE_CALLBACK_URL', 
                                 'http://localhost:5000/api/auth/google/callback')
        
        auth_url, state = calendar_service.get_auth_url(redirect_uri)
        
        return jsonify({
            "auth_url": auth_url,
            "state": state
        }), 200
        
    except Exception as e:
        print(f"[ERROR] /auth/google/authorize: {e}")
        return jsonify({"error": "Failed to start Google authorization"}), 500

@bp.route("/callback", methods=["GET"])
def callback():
    """Handle Google OAuth callback."""
    try:
        code = request.args.get('code')
        state = request.args.get('state')
        user_id = request.args.get('user_id')
        
        if not code or not user_id:
            return jsonify({"error": "Missing authorization code or user_id"}), 400
        
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Exchange code for tokens
        redirect_uri = os.getenv('GOOGLE_CALLBACK_URL', 
                                 'http://localhost:5000/api/auth/google/callback')
        
        tokens = calendar_service.exchange_code_for_tokens(code, redirect_uri)
        
        # Store tokens in user
        user.google_access_token = tokens['access_token']
        user.google_refresh_token = tokens['refresh_token']
        user.google_token_expiry = tokens['expiry']
        user.google_calendar_enabled = True
        
        db.session.commit()
        
        # Redirect to frontend with success
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        return redirect(f"{frontend_url}/dashboard?calendar=connected")
        
    except Exception as e:
        print(f"[ERROR] /auth/google/callback: {e}")
        frontend_url = os.getenv('FRONTEND_URL', 'http://localhost:5173')
        return redirect(f"{frontend_url}/dashboard?calendar=failed")

@bp.route("/disconnect", methods=["POST"])
def disconnect():
    """Disconnect Google Calendar."""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        
        # Clear tokens
        user.google_access_token = None
        user.google_refresh_token = None
        user.google_token_expiry = None
        user.google_calendar_enabled = False
        
        db.session.commit()
        
        return jsonify({"message": "Calendar disconnected"}), 200
        
    except Exception as e:
        print(f"[ERROR] /auth/google/disconnect: {e}")
        return jsonify({"error": "Failed to disconnect calendar"}), 500

@bp.route("/status", methods=["GET"])
def status():
    """Check calendar connection status."""
    try:
        user_id = request.args.get('user_id')
        user = User.query.get(user_id)

        if not user:
            return jsonify({"error": "User not found"}), 404

        return jsonify({
            "connected": user.google_calendar_enabled,
            "calendar_id": user.calendar_id,
            "token_expiry": user.google_token_expiry.isoformat() if user.google_token_expiry else None
        }), 200

    except Exception as e:
        print(f"[ERROR] /auth/google/status: {e}")
        return jsonify({"error": "Failed to check calendar status"}), 500