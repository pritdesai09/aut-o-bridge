import json

def calculate_questionnaire_score(answers: dict) -> dict:
    """
    answers: {question_id: value} where value is 0-3
    0 = Always, 1 = Sometimes, 2 = Rarely, 3 = Never
    Categories: social, communication, play, behavior, sensory
    """
    category_map = {
        1: "social", 2: "social", 6: "social", 12: "social",
        3: "communication", 5: "communication", 11: "communication",
        4: "play",
        7: "behavior", 8: "behavior", 10: "behavior",
        9: "sensory"
    }

    # Questions where low response = concern (eye contact, name response etc.)
    concern_on_low = {1, 2, 3, 4, 6, 11, 12}
    # Questions where high response = concern (repetitive behavior etc.)
    concern_on_high = {5, 7, 8, 9, 10}

    category_scores = {
        "social": [], "communication": [], "play": [],
        "behavior": [], "sensory": []
    }

    for qid_str, val in answers.items():
        qid = int(qid_str)
        val = int(val)
        cat = category_map.get(qid, "social")
        if qid in concern_on_low:
            # Lower answer = more concern = higher risk score
            risk = (3 - val) / 3.0
        else:
            # Higher answer = more concern = higher risk score
            risk = val / 3.0
        category_scores[cat].append(risk)

    category_averages = {}
    for cat, scores in category_scores.items():
        if scores:
            category_averages[cat] = round(sum(scores) / len(scores), 3)
        else:
            category_averages[cat] = 0.0

    overall = sum(category_averages.values()) / len(category_averages)
    return {
        "category_scores": category_averages,
        "overall_score": round(overall, 3)
    }


def calculate_emotion_scores(emotion_timeline: list) -> dict:
    """
    emotion_timeline: list of {second, dominant_emotion, scores}
    Returns alignment score and variability score
    """
    if not emotion_timeline:
        return {"alignment_score": 0.5, "variability_score": 0.5}

    expected_emotions = ["happy", "surprise", "sad", "happy", "surprise"]
    detected = [frame.get("dominant_emotion", "neutral").lower()
                for frame in emotion_timeline]

    # Alignment: how often child showed any non-neutral emotion
    non_neutral = sum(1 for e in detected if e != "neutral")
    alignment = non_neutral / max(len(detected), 1)

    # Variability: how many unique emotions detected (more = better social mirroring)
    unique_emotions = len(set(detected) - {"neutral"})
    variability = min(unique_emotions / 4.0, 1.0)

    return {
        "alignment_score": round(alignment, 3),
        "variability_score": round(variability, 3)
    }


def calculate_final_confidence(questionnaire_score: float,
                                alignment_score: float,
                                variability_score: float) -> dict:
    """
    Weighted formula:
    Questionnaire: 50%
    Emotion Alignment: 30%
    Variability: 20%
    """
    final = (
        questionnaire_score * 0.50 +
        alignment_score * 0.30 +
        variability_score * 0.20
    )
    final = round(final, 3)

    if final >= 0.65:
        level = "High"
        color = "red"
        message = "Strong indicators observed. We strongly recommend consulting a specialist for a comprehensive evaluation."
    elif final >= 0.40:
        level = "Moderate"
        color = "orange"
        message = "Some indicators observed. A consultation with a specialist is recommended for further assessment."
    else:
        level = "Low"
        color = "green"
        message = "Few indicators observed at this time. Continue monitoring development and consult a specialist if concerns arise."

    return {
        "final_score": final,
        "confidence_level": level,
        "color": color,
        "message": message,
        "percentage": round(final * 100, 1)
    }