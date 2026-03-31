import cv2
import numpy as np
import base64
import os
import tempfile
from deepface import DeepFace

def analyze_video_emotions(video_bytes: bytes) -> dict:
    """
    Takes raw video bytes, extracts frames, runs DeepFace emotion analysis.
    Returns emotion timeline and summary.
    """
    # Save video to temp file
    with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
        tmp.write(video_bytes)
        tmp_path = tmp.name

    timeline = []
    emotion_counts = {
        "happy": 0, "sad": 0, "angry": 0,
        "surprise": 0, "fear": 0, "disgust": 0, "neutral": 0
    }

    try:
        cap = cv2.VideoCapture(tmp_path)
        fps = cap.get(cv2.CAP_PROP_FPS) or 15
        frame_count = 0
        analyzed_count = 0

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            # Analyze every 15 frames (~1 per second)
            if frame_count % int(fps) == 0:
                try:
                    result = DeepFace.analyze(
                        frame,
                        actions=["emotion"],
                        enforce_detection=False,
                        silent=True
                    )
                    if isinstance(result, list):
                        result = result[0]

                    emotions = result.get("emotion", {})
                    dominant = result.get("dominant_emotion", "neutral")

                    timeline.append({
                        "second": analyzed_count,
                        "dominant_emotion": dominant,
                        "scores": {k: round(v, 2) for k, v in emotions.items()}
                    })

                    if dominant in emotion_counts:
                        emotion_counts[dominant] += 1
                    analyzed_count += 1

                except Exception:
                    timeline.append({
                        "second": analyzed_count,
                        "dominant_emotion": "neutral",
                        "scores": {}
                    })
                    analyzed_count += 1

            frame_count += 1

        cap.release()

    except Exception as e:
        return {
            "timeline": [],
            "emotion_counts": emotion_counts,
            "dominant_overall": "neutral",
            "error": str(e)
        }
    finally:
        os.unlink(tmp_path)

    dominant_overall = max(emotion_counts, key=emotion_counts.get) if any(emotion_counts.values()) else "neutral"

    return {
        "timeline": timeline,
        "emotion_counts": emotion_counts,
        "dominant_overall": dominant_overall,
        "frames_analyzed": analyzed_count
    }


def analyze_image_emotion(image_bytes: bytes) -> dict:
    """Fallback: analyze a single image frame"""
    nparr = np.frombuffer(image_bytes, np.uint8)
    frame = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    try:
        result = DeepFace.analyze(
            frame, actions=["emotion"],
            enforce_detection=False, silent=True
        )
        if isinstance(result, list):
            result = result[0]
        return {
            "dominant_emotion": result.get("dominant_emotion", "neutral"),
            "scores": result.get("emotion", {})
        }
    except Exception as e:
        return {"dominant_emotion": "neutral", "scores": {}, "error": str(e)}