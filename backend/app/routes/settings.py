from flask import Blueprint, request, jsonify
from app import db
from app.models.user import User
from app.models.nutrition import UserBodyMetrics

settings_bp = Blueprint("settings", __name__)


@settings_bp.route("/user/<int:user_id>/settings", methods=["GET"])
def get_settings(user_id):
    """Fetch all settings for a user in one call."""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        body = UserBodyMetrics.query.filter_by(user_id=user_id).first()

        return jsonify({
            "profile": {
                "name": user.name,
                "age": body.age if body else None,
                "height_cm": body.height_cm if body else None,
                "weight_kg": body.weight_kg if body else None,
                "gender": body.gender if body else None,
            },
            "goals": {
                "calorie_goal": user.calorie_goal or 2000,
                "protein_goal": user.protein_goal or 120,
                "weekly_workout_target": user.weekly_workout_target or 3,
            },
            "preferences": {
                "language": user.language or "en",
                "units_weight": user.units_weight or "kg",
                "units_distance": user.units_distance or "km",
            },
            "notifications": {
                "workout_reminder": bool(user.notification_workout_reminder),
                "workout_reminder_time": user.notification_workout_time or "08:00",
                "daily_nutrition": bool(user.notification_daily_nutrition),
                "weekly_summary": bool(user.notification_weekly_summary),
            },
            "google_calendar_enabled": bool(user.google_calendar_enabled),
        }), 200

    except Exception as e:
        print(f"[ERROR] GET /user/{user_id}/settings: {e}")
        return jsonify({"error": "Failed to load settings"}), 500


VALID_GENDERS = {"male", "female", "other", "prefer_not_to_say", ""}
VALID_LANGUAGES = {"en", "he"}
VALID_UNITS_WEIGHT = {"kg", "lbs"}
VALID_UNITS_DISTANCE = {"km", "miles"}


@settings_bp.route("/user/<int:user_id>", methods=["PUT"])
def update_profile(user_id):
    """Update user name, age, height, weight, gender."""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.get_json() or {}

        if "name" in data:
            name = str(data["name"]).strip()[:100]
            if name:
                user.name = name

        body = UserBodyMetrics.query.filter_by(user_id=user_id).first()
        if not body:
            body = UserBodyMetrics(user_id=user_id)
            db.session.add(body)

        if "age" in data and data["age"] is not None:
            age = int(data["age"])
            if not (1 <= age <= 120):
                return jsonify({"error": "Age must be between 1 and 120"}), 400
            body.age = age
        if "height_cm" in data and data["height_cm"] is not None:
            h = float(data["height_cm"])
            if not (50.0 <= h <= 300.0):
                return jsonify({"error": "Height must be between 50 and 300 cm"}), 400
            body.height_cm = h
        if "weight_kg" in data and data["weight_kg"] is not None:
            w = float(data["weight_kg"])
            if not (1.0 <= w <= 500.0):
                return jsonify({"error": "Weight must be between 1 and 500 kg"}), 400
            body.weight_kg = w
        if "gender" in data and data["gender"] is not None:
            gender = str(data["gender"]).lower()
            if gender not in VALID_GENDERS:
                return jsonify({"error": "Invalid gender value"}), 400
            body.gender = gender

        db.session.commit()

        return jsonify({
            "message": "Profile updated successfully",
            "user": user.to_dict(),
        }), 200

    except (ValueError, TypeError):
        db.session.rollback()
        return jsonify({"error": "Invalid field type"}), 400
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] PUT /user/{user_id}: {e}")
        return jsonify({"error": "Failed to update profile"}), 500


@settings_bp.route("/user/<int:user_id>/goals", methods=["PUT"])
def update_goals(user_id):
    """Update calorie goal, protein goal, weekly workout target."""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.get_json() or {}

        if "calorie_goal" in data and data["calorie_goal"] is not None:
            cal = int(data["calorie_goal"])
            if not (500 <= cal <= 10000):
                return jsonify({"error": "Calorie goal must be between 500 and 10000"}), 400
            user.calorie_goal = cal
        if "protein_goal" in data and data["protein_goal"] is not None:
            prot = int(data["protein_goal"])
            if not (10 <= prot <= 500):
                return jsonify({"error": "Protein goal must be between 10 and 500 g"}), 400
            user.protein_goal = prot
        if "weekly_workout_target" in data and data["weekly_workout_target"] is not None:
            wt = int(data["weekly_workout_target"])
            if not (1 <= wt <= 14):
                return jsonify({"error": "Weekly workout target must be between 1 and 14"}), 400
            user.weekly_workout_target = wt

        db.session.commit()

        return jsonify({
            "message": "Goals updated successfully",
            "goals": {
                "calorie_goal": user.calorie_goal,
                "protein_goal": user.protein_goal,
                "weekly_workout_target": user.weekly_workout_target,
            },
        }), 200

    except (ValueError, TypeError):
        db.session.rollback()
        return jsonify({"error": "Invalid field type"}), 400
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] PUT /user/{user_id}/goals: {e}")
        return jsonify({"error": "Failed to update goals"}), 500


@settings_bp.route("/user/<int:user_id>/preferences", methods=["PUT"])
def update_preferences(user_id):
    """Update language, units, and notification settings."""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        data = request.get_json() or {}

        if "language" in data:
            if data["language"] not in VALID_LANGUAGES:
                return jsonify({"error": "Invalid language"}), 400
            user.language = data["language"]
        if "units_weight" in data:
            if data["units_weight"] not in VALID_UNITS_WEIGHT:
                return jsonify({"error": "Invalid weight unit"}), 400
            user.units_weight = data["units_weight"]
        if "units_distance" in data:
            if data["units_distance"] not in VALID_UNITS_DISTANCE:
                return jsonify({"error": "Invalid distance unit"}), 400
            user.units_distance = data["units_distance"]
        if "notification_workout_reminder" in data:
            user.notification_workout_reminder = bool(data["notification_workout_reminder"])
        if "notification_workout_time" in data:
            # Validate HH:MM format
            import re as _re
            t = str(data["notification_workout_time"])
            if not _re.match(r"^\d{2}:\d{2}$", t):
                return jsonify({"error": "Invalid time format, use HH:MM"}), 400
            user.notification_workout_time = t
        if "notification_daily_nutrition" in data:
            user.notification_daily_nutrition = bool(data["notification_daily_nutrition"])
        if "notification_weekly_summary" in data:
            user.notification_weekly_summary = bool(data["notification_weekly_summary"])

        db.session.commit()

        return jsonify({"message": "Preferences updated successfully"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] PUT /user/{user_id}/preferences: {e}")
        return jsonify({"error": "Failed to update preferences"}), 500


@settings_bp.route("/user/<int:user_id>", methods=["DELETE"])
def delete_account(user_id):
    """Delete user account and all associated data."""
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404

        db.session.delete(user)
        db.session.commit()

        return jsonify({"message": "Account deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] DELETE /user/{user_id}: {e}")
        return jsonify({"error": "Failed to delete account"}), 500
