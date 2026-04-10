import cv2
import numpy as np
import os
import tempfile
import subprocess
import shutil

def convert_webm_to_mp4(input_path: str) -> str:
    """Convert WebM to MP4 using ffmpeg for better OpenCV compatibility on Windows"""
    output_path = input_path.replace('.webm', '.mp4')
    try:
        result = subprocess.run([
            'ffmpeg', '-y', '-i', input_path,
            '-c:v', 'libx264', '-preset', 'fast',
            '-crf', '23', '-an',
            output_path
        ], capture_output=True, text=True, timeout=120)
        if result.returncode == 0 and os.path.exists(output_path):
            print(f"[EmotionAnalyzer] Converted to MP4: {output_path}")
            return output_path
        else:
            print(f"[EmotionAnalyzer] FFmpeg error: {result.stderr}")
            return input_path  # fallback to original
    except Exception as e:
        print(f"[EmotionAnalyzer] FFmpeg conversion failed: {e}")
        return input_path

def analyze_video_emotions(video_bytes: bytes) -> dict:
    emotion_counts = {
        "happy": 0, "sad": 0, "angry": 0,
        "surprise": 0, "fear": 0, "disgust": 0, "neutral": 0
    }
    timeline = []
    tmp_path = None
    mp4_path = None

    try:
        # Save WebM to temp file
        with tempfile.NamedTemporaryFile(delete=False, suffix=".webm") as tmp:
            tmp.write(video_bytes)
            tmp_path = tmp.name
        print(f"[EmotionAnalyzer] Saved WebM: {tmp_path}, size: {len(video_bytes)} bytes")

        # Convert to MP4 for OpenCV compatibility
        mp4_path = convert_webm_to_mp4(tmp_path)
        video_to_read = mp4_path if mp4_path != tmp_path else tmp_path

        cap = cv2.VideoCapture(video_to_read)
        if not cap.isOpened():
            print("[EmotionAnalyzer] ERROR: Could not open video")
            return _fallback(emotion_counts, "Could not open video file")

        raw_fps = cap.get(cv2.CAP_PROP_FPS)
        total_frames = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
        print(f"[EmotionAnalyzer] FPS: {raw_fps}, Total frames: {total_frames}")

        # Sanitize FPS — WebM often reports garbage values
        if raw_fps <= 0 or raw_fps > 120 or total_frames < 0:
            fps = 15.0
            print(f"[EmotionAnalyzer] Invalid FPS detected, using default: {fps}")
        else:
            fps = raw_fps

        # Sample 1 frame per second
        sample_every = max(int(fps), 1)
        frame_count = 0
        analysed_count = 0
        max_frames = 300  # never analyse more than 300 frames

        from deepface import DeepFace

        while cap.isOpened() and analysed_count < max_frames:
            ret, frame = cap.read()
            if not ret:
                break

            if frame_count % sample_every == 0:
                try:
                    # Resize for faster analysis
                    small = cv2.resize(frame, (320, 240))

                    result = DeepFace.analyze(
                        small,
                        actions=["emotion"],
                        enforce_detection=False,
                        silent=True
                    )
                    if isinstance(result, list):
                        result = result[0]

                    emotions = result.get("emotion", {})
                    dominant = result.get("dominant_emotion", "neutral").lower()

                    print(f"[EmotionAnalyzer] t={analysed_count}s: {dominant}")

                    timeline.append({
                        "second": analysed_count,
                        "dominant_emotion": dominant,
                        "scores": {k: round(v, 2) for k, v in emotions.items()}
                    })

                    emotion_counts[dominant] = emotion_counts.get(dominant, 0) + 1
                    analysed_count += 1

                except Exception as fe:
                    print(f"[EmotionAnalyzer] Frame error at t={analysed_count}s: {fe}")
                    timeline.append({
                        "second": analysed_count,
                        "dominant_emotion": "neutral",
                        "scores": {}
                    })
                    emotion_counts["neutral"] += 1
                    analysed_count += 1

            frame_count += 1

        cap.release()
        print(f"[EmotionAnalyzer] Done. {analysed_count} frames analysed. Counts: {emotion_counts}")

    except Exception as e:
        print(f"[EmotionAnalyzer] FATAL ERROR: {e}")
        import traceback
        traceback.print_exc()
        return _fallback(emotion_counts, str(e))

    finally:
        # Cleanup temp files
        for path in [tmp_path, mp4_path]:
            if path and path != tmp_path and os.path.exists(path):
                try:
                    os.unlink(path)
                except:
                    pass
        if tmp_path and os.path.exists(tmp_path):
            try:
                os.unlink(tmp_path)
            except:
                pass

    if not timeline:
        return _fallback(emotion_counts, "No frames could be analysed")

    dominant_overall = max(emotion_counts, key=emotion_counts.get)
    return {
        "timeline": timeline,
        "emotion_counts": emotion_counts,
        "dominant_overall": dominant_overall,
        "frames_analyzed": analysed_count,
        "error": None
    }

def _fallback(emotion_counts, reason):
    print(f"[EmotionAnalyzer] Fallback: {reason}")
    return {
        "timeline": [],
        "emotion_counts": emotion_counts,
        "dominant_overall": "neutral",
        "frames_analyzed": 0,
        "error": reason
    }