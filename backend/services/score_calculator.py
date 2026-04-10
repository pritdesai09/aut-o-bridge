def calculate_emotion_scores(emotion_timeline: list) -> dict:
    """
    emotion_timeline: list of {second, dominant_emotion, scores}
    Returns alignment score and variability score.
    """
    if not emotion_timeline:
        # No video analysed — use neutral defaults, not 0.5
        return {
            "alignment_score": 0.0,
            "variability_score": 0.0,
            "note": "No video data — emotion scores set to 0"
        }

    detected = [
        frame.get("dominant_emotion", "neutral").lower()
        for frame in emotion_timeline
    ]

    total = len(detected)
    if total == 0:
        return {"alignment_score": 0.0, "variability_score": 0.0}

    # Alignment: % of frames with non-neutral emotion
    non_neutral = sum(1 for e in detected if e != "neutral")
    alignment = non_neutral / total

    # Variability: unique non-neutral emotions / 4
    unique_emotions = len(set(detected) - {"neutral"})
    variability = min(unique_emotions / 4.0, 1.0)

    print(f"[ScoreCalc] Detected emotions: {set(detected)}")
    print(f"[ScoreCalc] Non-neutral frames: {non_neutral}/{total}")
    print(f"[ScoreCalc] Alignment: {alignment:.3f}, Variability: {variability:.3f}")

    return {
        "alignment_score": round(alignment, 3),
        "variability_score": round(variability, 3)
    }


def calculate_final_confidence(
    questionnaire_score: float,
    alignment_score: float,
    variability_score: float
) -> dict:
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
    percentage = round(final * 100, 1)

    if final >= 0.65:
        level = "High"
        message = "Strong indicators observed. We strongly recommend consulting a specialist for a comprehensive evaluation."
    elif final >= 0.40:
        level = "Moderate"
        message = "Some indicators observed. A consultation with a specialist is recommended for further assessment."
    else:
        level = "Low"
        message = "Few indicators observed at this time. Continue monitoring development and consult a specialist if concerns arise."

    print(f"[ScoreCalc] Final: {final} ({percentage}%) — {level}")

    return {
        "final_score": final,
        "confidence_level": level,
        "percentage": percentage,
        "message": message
    }


def calculate_questionnaire_score(answers: dict) -> dict:
    """
    answers: {question_id: value} where value is 0-3
    0=Always, 1=Sometimes, 2=Rarely, 3=Never
    """
    concern_on_low = {1, 2, 3, 4, 6, 11, 12}
    concern_on_high = {5, 7, 8, 9, 10}

    category_map = {
        1: "social", 2: "social", 6: "social", 12: "social",
        3: "communication", 5: "communication", 11: "communication",
        4: "play",
        7: "behavior", 8: "behavior", 10: "behavior",
        9: "sensory"
    }

    category_scores = {
        "social": [], "communication": [], "play": [],
        "behavior": [], "sensory": []
    }

    for qid_str, val in answers.items():
        qid = int(qid_str)
        val = int(val)
        cat = category_map.get(qid, "social")

        if qid in concern_on_low:
            risk = val / 3.0
        else:
            risk = (3 - val) / 3.0

        category_scores[cat].append(risk)
        print(f"[ScoreCalc] Q{qid} ({cat}): val={val}, risk={risk:.3f}")

    category_averages = {}
    for cat, scores in category_scores.items():
        if scores:
            category_averages[cat] = round(sum(scores) / len(scores), 3)
        else:
            category_averages[cat] = 0.0

    overall = sum(category_averages.values()) / len(category_averages)
    print(f"[ScoreCalc] Categories: {category_averages}")
    print(f"[ScoreCalc] Overall Q score: {overall:.3f}")

    return {
        "category_scores": category_averages,
        "overall_score": round(overall, 3)
    }