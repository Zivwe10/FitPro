from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from app.models.profile import UserProfile

bp = Blueprint("auth", __name__, url_prefix="/api")

@bp.route("/onboard", methods=["POST"])
def onboard():
    """Onboard a new user with profile information."""
    try:
        data = request.get_json()
        
        # Validate required fields
        if not data.get("name"):
            return jsonify({"error": "Name is required"}), 400
        if not data.get("fitness_level"):
            return jsonify({"error": "Fitness level is required"}), 400
        if not data.get("goals"):
            return jsonify({"error": "Goals are required"}), 400
        
        # Create user
        user = User(name=data["name"])
        db.session.add(user)
        db.session.flush()  # Flush to get the user ID without committing
        
        # Create user profile
        profile = UserProfile(
            user_id=user.id,
            fitness_level=data["fitness_level"]
        )
        profile.set_goals(data["goals"])
        db.session.add(profile)
        
        # Commit transaction
        db.session.commit()
        
        return jsonify({
            "user_id": user.id,
            "message": "User onboarded successfully",
            "user": user.to_dict(),
            "profile": profile.to_dict()
        }), 201
    
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] /onboard: {e}")
        return jsonify({"error": "Failed to create account"}), 500

@bp.route("/user/<int:user_id>", methods=["GET"])
def get_user(user_id):
    """Fetch user and profile information."""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        profile = UserProfile.query.filter_by(user_id=user_id).first()

        return jsonify({
            "user": user.to_dict(),
            "profile": profile.to_dict() if profile else None
        }), 200

    except Exception as e:
        print(f"[ERROR] /user/{user_id}: {e}")
        return jsonify({"error": "Failed to load user"}), 500
