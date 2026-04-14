import os
import random
from flask import Blueprint, request, jsonify

coach_bp = Blueprint("coach", __name__)

# ── System prompts ─────────────────────────────────────────────────────────────
SYSTEM_PROMPTS = {
    "sunny": (
        "You are Sunny, a personal fitness coach known as The Motivator. "
        "Your energy is infectious — you speak like a TED talk crossed with a hype person. "
        "Every question is the BEST question. Every effort deserves celebration. "
        "Use vivid encouragement, rhetorical questions, and genuine enthusiasm. "
        "You believe every person is one decision away from transforming their life. "
        "Short punchy sentences mixed with the occasional rallying speech. "
        "2-4 sentences for casual questions, up to a paragraph if they need a plan."
    ),
    "rex": (
        "You are Rex, a drill sergeant fitness coach. "
        "You are blunt, demanding, and use dark humor like a weapon. "
        "You have zero patience for excuses, self-pity, or half-measures. "
        "You respect hard work and secretly want everyone to succeed — but you'll never say it out loud. "
        "Speak in short, sharp commands. Make observations that sting because they're true. "
        "Occasional dark humor. Never warm. Never soft. "
        "2-3 sentences max. Every word earns its place."
    ),
    "dana": (
        "You are Dana, a fitness coach known as The Realist. "
        "You have dry black humor and zero tolerance for fitness industry nonsense. "
        "You deliver hard truths with surgical precision and a slight smirk. "
        "You're not cruel — you just respect the person enough to be honest. "
        "Short sentences. Direct. Occasionally deadpan funny. "
        "You cite evidence when relevant, admit uncertainty when appropriate, "
        "and you'd rather tell someone something disappointing and useful than "
        "something encouraging and false. 2-4 sentences."
    ),
    "natasha": (
        "You are Natasha, a former Soviet sports scientist turned elite coach. "
        "You are cold, precise, and completely mission-focused. Emotion is inefficiency. "
        "You speak with authority and slight formality — never casual, never warm. "
        "Occasional dry observation that passes for Eastern European humor. "
        "You reference Soviet periodization, iron discipline, and the collective over the individual. "
        "You do not ask how someone feels. You ask what they performed. "
        "Short declarative sentences. No filler. 2-3 sentences."
    ),
}

# ── Fallback responses (used when no API key is configured) ───────────────────
FALLBACKS = {
    "sunny": [
        "Oh WOW — I love that you asked that! Every question is a step toward your best self, and THIS step? It counts! Keep showing up, keep believing, and the results WILL follow! ☀️",
        "YES! That curiosity right there? That's the spark that changes everything! Here's what I want you to remember: progress is never linear, but your commitment IS. Let's GO! 🌟",
        "I am SO proud of you for thinking about this! The fact that you're asking means you're already ahead of the version of you who didn't. Now let's turn that question into action! 💪",
    ],
    "rex": [
        "Stop. You want answers? Earn them. Get off the screen, pick up something heavy, and put it back down. Repeat until the question answers itself.",
        "You're asking me instead of doing the work. That's your problem right there. Less talking. More moving. Go.",
        "That question has one answer: effort. Consistent, unglamorous, daily effort. Everything else is noise. You done?",
    ],
    "dana": [
        "Here's the honest answer nobody wants: there's no secret. Caloric deficit, progressive overload, adequate sleep. You already knew that. The issue is execution.",
        "Most people fail at fitness because they optimize for motivation instead of systems. Motivation is a feeling. Systems are reliable. Build the system.",
        "I'll save you six months of trial and error — whatever complicated thing you're thinking about doing, the boring simple version works better. Do that.",
    ],
    "natasha": [
        "In Soviet sports methodology, this question would not exist. The answer was assigned by the coach. You would perform it. Results would follow. Remove choice. Perform.",
        "Your body is machinery. Input: nutrition and progressive stress. Output: adaptation. Sentiment is irrelevant to this equation. Adjust variables. Measure output.",
        "Discipline is not motivation that does not run out. Discipline is structure that does not require motivation. Build the structure. Remove the need for feeling.",
    ],
}


def _build_workout_context(user_id):
    """Query the user's recent workouts and return a compact summary string."""
    try:
        from app.models.workout import Workout
        workouts = (
            Workout.query
            .filter_by(user_id=user_id)
            .order_by(Workout.date.desc())
            .limit(8)
            .all()
        )
        if not workouts:
            return "This user has no workout history yet — they are just getting started."

        lines = []
        for w in workouts:
            parts = [f"{w.date} | {w.exercise} ({w.status})"]
            if w.sets and w.reps:
                parts.append(f"{w.sets}×{w.reps} reps")
            if w.weight:
                parts.append(f"{w.weight} kg")
            if w.distance:
                parts.append(f"{w.distance} km")
            if w.duration:
                parts.append(f"{int(w.duration)} min")
            if w.calories:
                parts.append(f"{int(w.calories)} kcal")
            if w.intensity:
                parts.append(f"intensity {w.intensity}")
            lines.append(" | ".join(parts))

        return "User's recent workouts (newest first):\n" + "\n".join(lines)
    except Exception:
        return ""


@coach_bp.route("/coach/chat", methods=["POST"])
def coach_chat():
    """Send a message to the AI coach and get a response."""
    try:
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400

        message = (data.get("message") or "").strip()
        coach_name = (data.get("coach_name") or "sunny").lower()
        user_id = data.get("user_id")

        if not message:
            return jsonify({"error": "Message is required"}), 400

        api_key = os.getenv("ANTHROPIC_API_KEY", "").strip()
        no_key = not api_key or api_key == "your_anthropic_api_key_here"

        # ── Fallback mode: no API key ──────────────────────────────────────────
        if no_key:
            reply = random.choice(FALLBACKS.get(coach_name, FALLBACKS["sunny"]))
            return jsonify({"reply": reply, "coach": coach_name, "fallback": True}), 200

        # ── Live mode: call Claude ─────────────────────────────────────────────
        import anthropic

        base_prompt = SYSTEM_PROMPTS.get(coach_name, SYSTEM_PROMPTS["sunny"])

        if user_id:
            workout_context = _build_workout_context(int(user_id))
            system_prompt = (
                base_prompt
                + "\n\n"
                + workout_context
                + "\n\nWhen relevant, reference the user's actual training history. "
                "Be specific — mention exercises, patterns, or gaps you notice."
            )
        else:
            system_prompt = base_prompt

        client = anthropic.Anthropic(api_key=api_key)
        response = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=512,
            system=system_prompt,
            messages=[{"role": "user", "content": message}],
        )

        reply = response.content[0].text
        return jsonify({"reply": reply, "coach": coach_name}), 200

    except Exception as e:
        print(f"[ERROR] /coach/chat: {e}")
        if "APIStatusError" in type(e).__name__:
            return jsonify({"error": "AI service error — please try again later"}), 502
        return jsonify({"error": "Coach is unavailable right now"}), 500
