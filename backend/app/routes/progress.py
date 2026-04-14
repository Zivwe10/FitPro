from flask import Blueprint, request, jsonify
from app import db
from app.models import BodyMetrics, Challenge, UserChallenge, Achievement, Workout, User
from datetime import datetime, timedelta
from sqlalchemy import func, desc

progress_bp = Blueprint('progress', __name__)

# Body Metrics Routes
@progress_bp.route('/body-metrics', methods=['GET'])
def get_body_metrics():
    """Get user's body metrics history."""
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400

    metrics = BodyMetrics.query.filter_by(user_id=user_id).order_by(BodyMetrics.date).all()
    return jsonify([metric.to_dict() for metric in metrics])

@progress_bp.route('/body-metrics', methods=['POST'])
def create_body_metric():
    """Create a new body metrics entry."""
    data = request.get_json()
    required_fields = ['user_id']

    if not all(field in data for field in required_fields):
        return jsonify({'error': 'user_id is required'}), 400

    # Check if entry already exists for today
    today = datetime.utcnow().date()
    existing = BodyMetrics.query.filter_by(
        user_id=data['user_id'],
        date=today
    ).first()

    if existing:
        # Update existing entry
        for field in ['weight_kg', 'chest_cm', 'waist_cm', 'hips_cm', 'energy_level', 'notes']:
            if field in data:
                setattr(existing, field, data[field])
        db.session.commit()
        return jsonify(existing.to_dict())

    # Create new entry
    metric = BodyMetrics(
        user_id=data['user_id'],
        date=today,
        weight_kg=data.get('weight_kg'),
        chest_cm=data.get('chest_cm'),
        waist_cm=data.get('waist_cm'),
        hips_cm=data.get('hips_cm'),
        energy_level=data.get('energy_level'),
        notes=data.get('notes')
    )

    db.session.add(metric)
    db.session.commit()
    return jsonify(metric.to_dict()), 201

# Challenge Routes
@progress_bp.route('/challenges', methods=['GET'])
def get_challenges():
    """Get all active challenges."""
    challenges = Challenge.query.filter_by(is_active=True).all()
    return jsonify([challenge.to_dict() for challenge in challenges])

@progress_bp.route('/user-challenges', methods=['GET'])
def get_user_challenges():
    """Get user's challenges and progress."""
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400

    user_challenges = db.session.query(
        UserChallenge, Challenge
    ).join(Challenge).filter(UserChallenge.user_id == user_id).all()

    result = []
    for user_challenge, challenge in user_challenges:
        data = user_challenge.to_dict()
        data['challenge'] = challenge.to_dict()
        result.append(data)

    return jsonify(result)

@progress_bp.route('/user-challenges', methods=['POST'])
def join_challenge():
    """Join a challenge or update progress."""
    data = request.get_json()
    required_fields = ['user_id', 'challenge_id']

    if not all(field in data for field in required_fields):
        return jsonify({'error': 'user_id and challenge_id required'}), 400

    # Check if user already joined this challenge
    existing = UserChallenge.query.filter_by(
        user_id=data['user_id'],
        challenge_id=data['challenge_id']
    ).first()

    if existing:
        # Update progress
        if 'current_value' in data:
            existing.current_value = data['current_value']
            if existing.current_value >= existing.challenge.target_value:
                existing.is_completed = True
                existing.completed_at = datetime.utcnow()
        db.session.commit()
        return jsonify(existing.to_dict())

    # Join new challenge
    challenge = Challenge.query.get(data['challenge_id'])
    if not challenge:
        return jsonify({'error': 'Challenge not found'}), 404

    expires_at = None
    if challenge.duration_days:
        expires_at = datetime.utcnow() + timedelta(days=challenge.duration_days)

    user_challenge = UserChallenge(
        user_id=data['user_id'],
        challenge_id=data['challenge_id'],
        expires_at=expires_at
    )

    db.session.add(user_challenge)
    db.session.commit()
    return jsonify(user_challenge.to_dict()), 201

# Achievement Routes
@progress_bp.route('/achievements', methods=['GET'])
def get_achievements():
    """Get user's achievements."""
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400

    achievements = Achievement.query.filter_by(user_id=user_id).order_by(desc(Achievement.achieved_at)).all()
    return jsonify([achievement.to_dict() for achievement in achievements])

# Stats and Analytics Routes
@progress_bp.route('/stats', methods=['GET'])
def get_stats():
    """Get comprehensive stats for the progress dashboard."""
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400

    now = datetime.utcnow()
    today = now.date()
    week_start = today - timedelta(days=today.weekday())  # Monday
    month_start = today.replace(day=1)

    # Workouts this week
    workouts_this_week = Workout.query.filter(
        Workout.user_id == user_id,
        Workout.date >= week_start,
        Workout.status == 'completed'
    ).count()

    # Workouts this month
    workouts_this_month = Workout.query.filter(
        Workout.user_id == user_id,
        Workout.date >= month_start,
        Workout.status == 'completed'
    ).count()

    # Current streak
    streak = 0
    check_date = today
    while True:
        has_workout = Workout.query.filter(
            Workout.user_id == user_id,
            Workout.date == check_date,
            Workout.status == 'completed'
        ).first() is not None

        if has_workout:
            streak += 1
            check_date -= timedelta(days=1)
        else:
            break

    # Personal records
    personal_records = {}

    # Best EMS intensity
    max_intensity = db.session.query(func.max(Workout.intensity)).filter(
        Workout.user_id == user_id,
        Workout.intensity.isnot(None)
    ).scalar()
    if max_intensity:
        personal_records['max_intensity'] = max_intensity

    # Longest run distance
    max_distance = db.session.query(func.max(Workout.distance)).filter(
        Workout.user_id == user_id,
        Workout.distance.isnot(None)
    ).scalar()
    if max_distance:
        personal_records['max_distance'] = max_distance

    # Heaviest weight
    max_weight = db.session.query(func.max(Workout.weight)).filter(
        Workout.user_id == user_id
    ).scalar()
    if max_weight:
        personal_records['max_weight'] = max_weight

    # Level calculation (based on total workouts)
    total_workouts = Workout.query.filter(
        Workout.user_id == user_id,
        Workout.status == 'completed'
    ).count()

    levels = [
        {'name': 'Beginner', 'min_workouts': 0, 'max_workouts': 10},
        {'name': 'Intermediate', 'min_workouts': 11, 'max_workouts': 50},
        {'name': 'Advanced', 'min_workouts': 51, 'max_workouts': 150},
        {'name': 'Elite', 'min_workouts': 151, 'max_workouts': float('inf')}
    ]

    current_level = None
    next_level = None
    level_progress = 0

    for i, level in enumerate(levels):
        if total_workouts >= level['min_workouts']:
            current_level = level
            if i + 1 < len(levels):
                next_level = levels[i + 1]
                if level['max_workouts'] != float('inf'):
                    level_progress = ((total_workouts - level['min_workouts']) /
                                    (level['max_workouts'] - level['min_workouts'])) * 100
                else:
                    level_progress = 100  # Elite level
            else:
                level_progress = 100

    # Body metrics change
    first_metric = BodyMetrics.query.filter_by(user_id=user_id).order_by(BodyMetrics.date).first()
    latest_metric = BodyMetrics.query.filter_by(user_id=user_id).order_by(desc(BodyMetrics.date)).first()

    weight_change = None
    if first_metric and latest_metric and first_metric.weight_kg and latest_metric.weight_kg:
        weight_change = latest_metric.weight_kg - first_metric.weight_kg

    return jsonify({
        'workouts_this_week': workouts_this_week,
        'workouts_this_month': workouts_this_month,
        'current_streak': streak,
        'personal_records': personal_records,
        'level': {
            'current': current_level,
            'next': next_level,
            'progress': level_progress,
            'total_workouts': total_workouts
        },
        'weight_change': weight_change
    })

@progress_bp.route('/insights', methods=['GET'])
def get_insights():
    """Get smart insights for the user."""
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400

    insights = []

    # Best training day/time analysis
    workouts = Workout.query.filter(
        Workout.user_id == user_id,
        Workout.status == 'completed'
    ).all()

    if workouts:
        # Analyze workout days
        day_counts = {}
        for workout in workouts:
            day_name = workout.date.strftime('%A')
            day_counts[day_name] = day_counts.get(day_name, 0) + 1

        if day_counts:
            best_day = max(day_counts.items(), key=lambda x: x[1])
            insights.append(f"You train best on {best_day[0]}s")

        # EMS intensity improvement
        recent_workouts = sorted(workouts, key=lambda x: x.date, reverse=True)[:30]  # Last 30 workouts
        ems_workouts = [w for w in recent_workouts if w.intensity is not None]

        if len(ems_workouts) >= 2:
            first_half = ems_workouts[len(ems_workouts)//2:]
            second_half = ems_workouts[:len(ems_workouts)//2]

            first_avg = sum(w.intensity for w in first_half) / len(first_half)
            second_avg = sum(w.intensity for w in second_half) / len(second_half)

            if second_avg > first_avg:
                improvement = ((second_avg - first_avg) / first_avg) * 100
                insights.append(f"Your EMS intensity has improved {improvement:.1f}% this month")

    return jsonify({'insights': insights})

@progress_bp.route('/social-proof', methods=['GET'])
def get_social_proof():
    """Get social proof statistics."""
    # This would typically aggregate data from all users
    # For now, return sample data
    return jsonify({
        'average_workouts_per_week': 3.2,
        'message': 'Users like you trained an average of 3 times this week'
    })

@progress_bp.route('/countdown', methods=['GET'])
def get_countdown():
    """Get countdown to next planned workout."""
    user_id = request.args.get('user_id', type=int)
    if not user_id:
        return jsonify({'error': 'user_id required'}), 400

    # Find next planned EMS workout
    next_workout = Workout.query.filter(
        Workout.user_id == user_id,
        Workout.date >= datetime.utcnow().date(),
        Workout.status == 'planned'
    ).order_by(Workout.date).first()

    if next_workout:
        days_until = (next_workout.date - datetime.utcnow().date()).days
        return jsonify({
            'message': f'Next planned {next_workout.exercise} workout in {days_until} days',
            'days_until': days_until,
            'workout': next_workout.exercise
        })

    return jsonify({
        'message': 'No upcoming workouts planned',
        'days_until': None
    })