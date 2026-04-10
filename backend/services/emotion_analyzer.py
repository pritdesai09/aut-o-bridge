import cv2
import numpy as np
import os
import tempfile

def analyze_video_emotions(video_bytes: bytes) -> dict:
    """
    Takes raw video bytes, extracts frames, runs DeepFace emotion analysis.
    Returns emotion timeline and summary.
    """
    emotion_counts = {
        "happy": 0, "sad": 0, "angry": 0,
        "surprise": 0, "fear": 0, "disgust": 0, "neutral": 0
    }
    timeline = []

    # Write to temp file
    suffix = ".webm"
    tmp_path = None
    try:
        with tempfile.NamedTemporaryFile(delete=False, suffix=suffix) as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name

        print(f"[EmotionAnalyzer] Temp file: {tmp_path}, size: {len(video_bytes)} bytes")

        cap = cv2.VideoCapture(tmp_path)

        if not cap.isOpened():
            print("[EmotionAnalyzer] ERROR: Could not open video file")
            return _fallback(emotion_counts, "Could not open video")

        fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        print(f"[EmotionAnalyzer] FPS: {fps}, Total frames: {total_frames}")

        if fps <= 0 or fps > 120:
            fps = 15  # safe default

        sample_every = max(int(fps), 1)  # analyse 1 frame per second
        frame_count = 0
        analysed_count = 0

        from deepface import DeepFace

        while cap.isOpened():
            ret, frame = cap.read()
            if not ret:
                break

            if frame_count % sample_every == 0:
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
                    dominant = result.get("dominant_emotion", "neutral").lower()

                    print(f"[EmotionAnalyzer] Frame {frame_count} ({analysed_count}s): {dominant} — {emotions}")

                    timeline.append({
                        "second": analysed_count,
                        "dominant_emotion": dominant,
                        "scores": {k: round(v, 2) for k, v in emotions.items()}
                    })

                    if dominant in emotion_counts:
                        emotion_counts[dominant] += 1
                    else:
                        emotion_counts["neutral"] += 1

                    analysed_count += 1

                except Exception as frame_err:
                    print(f"[EmotionAnalyzer] Frame {frame_count} analysis error: {frame_err}")
                    timeline.append({
                        "second": analysed_count,
                        "dominant_emotion": "neutral",
                        "scores": {}
                    })
                    emotion_counts["neutral"] += 1
                    analysed_count += 1

            frame_count += 1

        cap.release()
        print(f"[EmotionAnalyzer] Complete. Analysed {analysed_count} frames. Counts: {emotion_counts}")

    except Exception as e:
        print(f"[EmotionAnalyzer] FATAL ERROR: {e}")
        return _fallback(emotion_counts, str(e))

    finally:
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)

    if not timeline:
        print("[EmotionAnalyzer] No frames analysed — returning fallback")
        return _fallback(emotion_counts, "No frames analysed")

    dominant_overall = max(emotion_counts, key=emotion_counts.get)

    return {
        "timeline": timeline,
        "emotion_counts": emotion_counts,
        "dominant_overall": dominant_overall,
        "frames_analyzed": analysed_count,
        "error": None
    }


def _fallback(emotion_counts, reason):
    """Return a neutral fallback result when analysis fails"""
    print(f"[EmotionAnalyzer] Fallback reason: {reason}")
    return {
        "timeline": [],
        "emotion_counts": emotion_counts,
        "dominant_overall": "neutral",
        "frames_analyzed": 0,
        "error": reason
    }