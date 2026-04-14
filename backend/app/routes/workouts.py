from flask import Blueprint, request, jsonify
from datetime import datetime
import os
import json
import re
import requests
from app import db
from app.models.workout import Workout
from app.models.user import User
from app.services.google_calendar_service import GoogleCalendarService

bp = Blueprint("workouts", __name__, url_prefix="/api")

@bp.route("/workouts", methods=["POST"])
def create_workout():
    try:
        data = request.get_json()
        required_fields = ["user_id", "exercise", "date", "status"]
        for field in required_fields:
            if data.get(field) is None:
                return jsonify({"error": f"{field} is required"}), 400

        user = User.query.get(data["user_id"])
        if not user:
            return jsonify({"error": "User not found"}), 404

        workout_date = datetime.fromisoformat(data["date"]).date()

        def parse_float(key):
            value = data.get(key)
            return float(value) if value not in (None, "", "null") else None

        def parse_int(key):
            value = data.get(key)
            return int(value) if value not in (None, "", "null") else None

        workout = Workout(
            user_id=data["user_id"],
            exercise=data["exercise"].strip(),
            sets=parse_int("sets") or 0,
            reps=parse_int("reps") or 0,
            weight=parse_float("weight") or 0.0,
            notes=data.get("notes", ""),
            date=workout_date,
            status=data["status"].strip().lower(),
            duration=parse_float("duration"),
            intensity=parse_float("intensity"),
            frequency=parse_float("frequency"),
            muscle_groups=data.get("muscle_groups"),
            distance=parse_float("distance"),
            speed=parse_float("speed"),
            calories=parse_float("calories"),
            heart_rate=parse_int("heart_rate"),
            pace=data.get("pace"),
            style=data.get("style"),
        )
        db.session.add(workout)
        db.session.commit()

        return jsonify({"workout": workout.to_dict()}), 201
    except ValueError:
        return jsonify({"error": "Invalid field type"}), 400
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] POST /workouts: {e}")
        return jsonify({"error": "Failed to save workout"}), 500

ALLOWED_IMAGE_MIMETYPES = {"image/jpeg", "image/png", "image/webp", "image/gif"}

@bp.route("/extract-workout-image", methods=["POST"])
def extract_workout_image():
    api_key = os.getenv("ANTHROPIC_API_KEY")
    if not api_key:
        return jsonify({"error": "Add API key to enable AI scanning"}), 400

    image = request.files.get("image")
    if not image:
        return jsonify({"error": "Image file is required"}), 400

    if image.mimetype not in ALLOWED_IMAGE_MIMETYPES:
        return jsonify({"error": "Only JPEG, PNG, WebP, or GIF images are allowed"}), 400

    # Read and size-check the stream (MAX_CONTENT_LENGTH handles this globally,
    # but we double-check here for a clear error message)
    image_bytes = image.read()
    if len(image_bytes) > 2 * 1024 * 1024:
        return jsonify({"error": "Image must be smaller than 2 MB"}), 413
    image.stream.seek(0)  # rewind so downstream code can re-read if needed

    try:
        prompt = (
            "Extract workout data from the uploaded fitness device screenshot. "
            "Return only valid JSON with keys: exercise, workout_type, duration, intensity, frequency, muscle_groups, distance, speed, calories, heart_rate, pace, style, notes. "
            "If a value is missing, omit it or set it to null."
        )

        url = "https://api.anthropic.com/v1/vision"
        headers = {
            "x-api-key": api_key,
        }
        files = {
            "image": (image.filename, image.stream, image.mimetype)
        }
        data = {
            "model": "claude-3.5-vision",
            "prompt": prompt,
            "format": "json"
        }

        response = requests.post(url, headers=headers, files=files, data=data, timeout=60)
        response.raise_for_status()

        try:
            result = response.json()
        except ValueError:
            return jsonify({"error": "Unable to parse response from Claude Vision API"}), 502

        extracted_text = result.get("completion") or result.get("output") or result.get("text") or json.dumps(result)
        extracted_data = parse_json_from_text(extracted_text)
        return jsonify({"extracted_data": extracted_data, "raw": extracted_text}), 200
    except requests.RequestException as e:
        print(f"[ERROR] extract-workout-image vision API: {e}")
        return jsonify({"error": "Failed to contact vision API"}), 502
    except Exception as e:
        print(f"[ERROR] extract-workout-image: {e}")
        return jsonify({"error": "Failed to extract workout data"}), 500


def parse_json_from_text(text):
    try:
        match = re.search(r"(\{.*\})", text, re.S)
        if not match:
            return {}
        return json.loads(match.group(1))
    except Exception:
        return {}

@bp.route("/workouts/<int:user_id>", methods=["GET"])
def get_workouts(user_id):
    try:
        workouts = Workout.query.filter_by(user_id=user_id).order_by(Workout.date.desc(), Workout.created_at.desc()).all()
        return jsonify({"workouts": [w.to_dict() for w in workouts]}), 200
    except Exception as e:
        print(f"[ERROR] GET /workouts/{user_id}: {e}")
        return jsonify({"error": "Failed to load workouts"}), 500

@bp.route("/workouts/<int:workout_id>", methods=["DELETE"])
def delete_workout(workout_id):
    try:
        data = request.get_json(silent=True) or {}
        requesting_user_id = data.get("user_id")

        workout = Workout.query.get(workout_id)
        if not workout:
            return jsonify({"error": "Workout not found"}), 404

        # Verify ownership when caller supplies user_id
        if requesting_user_id is not None and workout.user_id != int(requesting_user_id):
            return jsonify({"error": "Unauthorized"}), 403

        # If synced to calendar, remove from calendar too
        if workout.google_event_id:
            try:
                user = User.query.get(workout.user_id)
                if user and user.google_calendar_enabled:
                    calendar_service = GoogleCalendarService()
                    calendar_service.delete_calendar_event(user, workout)
            except Exception as e:
                # Log but don't fail the deletion
                print(f"Failed to delete calendar event: {e}")
        
        db.session.delete(workout)
        db.session.commit()
        return jsonify({"message": "Workout deleted"}), 200
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] DELETE /workouts/{workout_id}: {e}")
        return jsonify({"error": "Failed to delete workout"}), 500

VALID_STATUSES = {"planned", "completed", "missed"}

@bp.route("/workouts/<int:workout_id>", methods=["PATCH"])
def update_workout_status(workout_id):
    try:
        data = request.get_json()
        if not data.get("status"):
            return jsonify({"error": "Status is required"}), 400

        new_status = data["status"].strip().lower()
        if new_status not in VALID_STATUSES:
            return jsonify({"error": "Invalid status value"}), 400

        workout = Workout.query.get(workout_id)
        if not workout:
            return jsonify({"error": "Workout not found"}), 404

        # Verify ownership when caller supplies user_id
        requesting_user_id = data.get("user_id")
        if requesting_user_id is not None and workout.user_id != int(requesting_user_id):
            return jsonify({"error": "Unauthorized"}), 403

        workout.status = new_status
        db.session.commit()

        return jsonify({"workout": workout.to_dict()}), 200
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] PATCH /workouts/{workout_id}: {e}")
        return jsonify({"error": "Failed to update workout"}), 500

@bp.route("/workouts/<int:workout_id>/sync-calendar", methods=["POST"])
def sync_workout_to_calendar(workout_id):
    """Sync a single workout to Google Calendar."""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        
        user = User.query.get(user_id)
        workout = Workout.query.get(workout_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        if not workout:
            return jsonify({"error": "Workout not found"}), 404
        if workout.user_id != user_id:
            return jsonify({"error": "Unauthorized"}), 403
        
        if not user.google_calendar_enabled:
            return jsonify({"error": "Calendar not connected"}), 400
        
        calendar_service = GoogleCalendarService()
        
        try:
            if workout.google_event_id:
                # Update existing event
                event = calendar_service.update_calendar_event(user, workout)
            else:
                # Create new event
                event = calendar_service.create_calendar_event(user, workout)
                workout.google_event_id = event['id']
            
            workout.calendar_synced = True
            workout.calendar_sync_error = None
            workout.last_synced_at = datetime.utcnow()
            
            db.session.commit()
            
            return jsonify({
                "message": "Workout synced to calendar",
                "event_id": event['id']
            }), 200
            
        except Exception as e:
            workout.calendar_synced = False
            workout.calendar_sync_error = "Sync failed"
            db.session.commit()
            print(f"[ERROR] sync-calendar workout {workout_id}: {e}")
            return jsonify({"error": "Failed to sync to calendar"}), 500

    except Exception as e:
        print(f"[ERROR] sync-calendar outer {workout_id}: {e}")
        return jsonify({"error": "Failed to sync to calendar"}), 500

@bp.route("/workouts/<int:workout_id>/unsync-calendar", methods=["POST"])
def unsync_workout_from_calendar(workout_id):
    """Remove workout from Google Calendar."""
    try:
        data = request.get_json()
        user_id = data.get('user_id')

        user = User.query.get(user_id)
        workout = Workout.query.get(workout_id)

        if not user or not workout or workout.user_id != user_id:
            return jsonify({"error": "Unauthorized"}), 403

        calendar_service = GoogleCalendarService()

        try:
            calendar_service.delete_calendar_event(user, workout)

            workout.google_event_id = None
            workout.calendar_synced = False
            workout.last_synced_at = datetime.utcnow()

            db.session.commit()

            return jsonify({"message": "Workout removed from calendar"}), 200

        except Exception as e:
            print(f"[ERROR] unsync-calendar workout {workout_id}: {e}")
            return jsonify({"error": "Failed to remove from calendar"}), 500

    except Exception as e:
        print(f"[ERROR] unsync-calendar outer {workout_id}: {e}")
        return jsonify({"error": "Failed to remove from calendar"}), 500

@bp.route("/workouts/sync-all", methods=["POST"])
def sync_all_workouts():
    """Sync all planned workouts to calendar."""
    try:
        data = request.get_json()
        user_id = data.get('user_id')
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
        if not user.google_calendar_enabled:
            return jsonify({"error": "Calendar not connected"}), 400
        
        calendar_service = GoogleCalendarService()
        
        # Get all planned/upcoming workouts
        workouts = Workout.query.filter_by(
            user_id=user_id,
            status='planned'
        ).filter(Workout.date >= datetime.now().date()).all()
        
        synced = 0
        failed = []
        
        for workout in workouts:
            try:
                if workout.google_event_id:
                    calendar_service.update_calendar_event(user, workout)
                else:
                    event = calendar_service.create_calendar_event(user, workout)
                    workout.google_event_id = event['id']
                
                workout.calendar_synced = True
                workout.calendar_sync_error = None
                workout.last_synced_at = datetime.utcnow()
                synced += 1
                
            except Exception as e:
                workout.calendar_sync_error = "Sync failed"
                print(f"[ERROR] sync-all workout {workout.id}: {e}")
                failed.append({"workout_id": workout.id, "error": "Sync failed"})

        db.session.commit()

        return jsonify({
            "synced": synced,
            "failed": failed,
            "total": len(workouts)
        }), 200

    except Exception as e:
        print(f"[ERROR] sync-all: {e}")
        return jsonify({"error": "Failed to sync workouts"}), 500
