from flask import Blueprint, request, jsonify
from datetime import datetime, timedelta
from app import db
from app.models import NutritionEntry, Workout, UserBodyMetrics

nutrition_bp = Blueprint('nutrition', __name__)

# Body Metrics Calculator Routes
@nutrition_bp.route('/body-metrics', methods=['GET'])
def get_user_body_metrics():
    """Get user's body metrics for calculator."""
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400

    metrics = UserBodyMetrics.query.filter_by(user_id=user_id).first()
    if metrics:
        return jsonify(metrics.to_dict())
    return jsonify({})

@nutrition_bp.route('/body-metrics', methods=['POST'])
def update_user_body_metrics():
    """Update or create user's body metrics for calculator."""
    data = request.get_json() or {}
    user_id = data.get('user_id')
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400

    # Check if user already has body metrics
    existing = UserBodyMetrics.query.filter_by(user_id=user_id).first()

    if existing:
        # Update existing
        for field in ['height_cm', 'weight_kg', 'age', 'gender', 'activity_level']:
            if field in data:
                setattr(existing, field, data[field])
        db.session.commit()
        return jsonify(existing.to_dict())

    # Create new
    metrics = UserBodyMetrics(
        user_id=user_id,
        height_cm=data.get('height_cm'),
        weight_kg=data.get('weight_kg'),
        age=data.get('age'),
        gender=data.get('gender'),
        activity_level=data.get('activity_level')
    )
    db.session.add(metrics)
    db.session.commit()
    return jsonify(metrics.to_dict()), 201

@nutrition_bp.route('/entries', methods=['GET'])
def get_nutrition_entries():
    user_id = request.args.get('user_id', type=int)
    date_str = request.args.get('date')
    if not user_id or not date_str:
        return jsonify({'error': 'user_id and date are required'}), 400

    try:
        entry_date = datetime.fromisoformat(date_str).date()
    except ValueError:
        return jsonify({'error': 'Invalid date format, use YYYY-MM-DD'}), 400

    entries = NutritionEntry.query.filter_by(user_id=user_id, date=entry_date).order_by(NutritionEntry.meal_slot, NutritionEntry.created_at).all()
    return jsonify([entry.to_dict() for entry in entries])

@nutrition_bp.route('/entries', methods=['POST'])
def create_nutrition_entry():
    data = request.get_json() or {}
    required = ['user_id', 'date', 'meal_slot', 'food_name']
    if not all(data.get(field) is not None for field in required):
        return jsonify({'error': 'user_id, date, meal_slot and food_name are required'}), 400

    try:
        entry_date = datetime.fromisoformat(data['date']).date()
    except ValueError:
        return jsonify({'error': 'Invalid date format, use YYYY-MM-DD'}), 400

    entry = NutritionEntry(
        user_id=data['user_id'],
        date=entry_date,
        meal_slot=data['meal_slot'],
        food_name=data['food_name'],
        calories=int(data.get('calories', 0) or 0),
        protein=float(data.get('protein', 0) or 0.0)
    )
    db.session.add(entry)
    db.session.commit()

    return jsonify(entry.to_dict()), 201

@nutrition_bp.route('/entries/<int:entry_id>', methods=['DELETE'])
def delete_nutrition_entry(entry_id):
    entry = NutritionEntry.query.get(entry_id)
    if not entry:
        return jsonify({'error': 'Entry not found'}), 404

    # Require caller to supply their user_id and verify ownership
    requesting_user_id = request.args.get('user_id', type=int)
    if requesting_user_id is None:
        return jsonify({'error': 'user_id is required'}), 400
    if entry.user_id != requesting_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    try:
        db.session.delete(entry)
        db.session.commit()
        return jsonify({'message': 'Entry deleted'}), 200
    except Exception as e:
        db.session.rollback()
        print(f"[ERROR] DELETE /nutrition/entries/{entry_id}: {e}")
        return jsonify({'error': 'Failed to delete entry'}), 500

@nutrition_bp.route('/weekly', methods=['GET'])
def get_weekly_nutrition():
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400

    today = datetime.utcnow().date()
    start_date = today - timedelta(days=6)
    entries = NutritionEntry.query.filter(
        NutritionEntry.user_id == user_id,
        NutritionEntry.date >= start_date,
        NutritionEntry.date <= today
    ).all()

    summary = {}
    for i in range(7):
        day = start_date + timedelta(days=i)
        summary[day.isoformat()] = {'date': day.isoformat(), 'calories': 0, 'protein': 0}

    for entry in entries:
        day_key = entry.date.isoformat()
        if day_key in summary:
            summary[day_key]['calories'] += entry.calories or 0
            summary[day_key]['protein'] += entry.protein or 0

    return jsonify({'weekly': list(summary.values())})

@nutrition_bp.route('/tip', methods=['GET'])
def get_nutrition_tip():
    user_id = request.args.get('user_id', type=int)
    date_str = request.args.get('date')
    if not user_id or not date_str:
        return jsonify({'error': 'user_id and date are required'}), 400

    try:
        entry_date = datetime.fromisoformat(date_str).date()
    except ValueError:
        return jsonify({'error': 'Invalid date format, use YYYY-MM-DD'}), 400

    workouts = Workout.query.filter_by(user_id=user_id, date=entry_date, status='completed').all()
    if workouts:
        workout = workouts[-1]
        exercise = (workout.exercise or '').lower()
        style = (workout.style or '').lower()
        if 'ems' in exercise or 'ems' in style:
            tip = 'Great EMS session! Eat 30g protein within the next hour.'
        elif 'run' in exercise or 'running' in style or 'jog' in exercise:
            tip = 'Refuel with carbs and protein after your run.'
        elif 'strength' in exercise or 'lift' in exercise or 'weight' in exercise or 'power' in exercise:
            tip = 'Protein is key today - aim for 40g in your next meal.'
        else:
            tip = 'Great workout today! Keep your meals balanced with protein and carbs.'
    else:
        tip = 'Stay hydrated and keep your meals colorful with lean protein and veggies.'

    return jsonify({'tip': tip})
