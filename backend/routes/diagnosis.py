from fastapi import APIRouter, Request, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.future import select
import json, uuid
from datetime import datetime

from models import Child, DiagnosticReport, User
from routes.auth import get_current_user
from services.score_calculator import (
    calculate_questionnaire_score,
    calculate_emotion_scores,
    calculate_final_confidence
)

router = APIRouter()
analysis_jobs = {}

@router.get("/questionnaire")
async def questionnaire(request: Request):
    user = await get_current_user(request)
    if not user:
        return JSONResponse({"detail": "Unauthorized"}, status_code=401)
    lang = request.query_params.get("lang", "en")
    with open("data/questionnaire.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    questions = data.get(lang, data["en"])
    from app import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        ch = await db.execute(select(Child).where(Child.parent_id == user.id))
        children = [{"id": c.id, "full_name": c.full_name} for c in ch.scalars().all()]
    return JSONResponse({"questions": questions, "children": children})

@router.post("/questionnaire/submit")
async def submit_questionnaire(request: Request):
    user = await get_current_user(request)
    if not user:
        return JSONResponse({"detail": "Unauthorized"}, status_code=401)
    data = await request.json()
    answers = data.get("answers", {})
    result = calculate_questionnaire_score(answers)
    return JSONResponse(result)

@router.post("/analyze-video")
async def analyze_video(
    request: Request,
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...)
):
    user = await get_current_user(request)
    job_id = str(uuid.uuid4())
    analysis_jobs[job_id] = {"status": "processing"}
    video_bytes = await video.read()
    q_score = float(request.headers.get("X-QScore", "0.5"))
    child_id = request.headers.get("X-ChildId", None)
    user_id = user.id if user else None

    def run(job_id, video_bytes, q_score, child_id, user_id):
        try:
            from services.emotion_analyzer import analyze_video_emotions
            er = analyze_video_emotions(video_bytes)
            es = calculate_emotion_scores(er["timeline"])
            final = calculate_final_confidence(
                q_score,
                es["alignment_score"],
                es["variability_score"]
            )
            result = {
                "emotion_result": er,
                "emotion_scores": es,
                "final": final,
                "q_score": q_score
            }
            analysis_jobs[job_id] = {"status": "complete", "result": result}

            # Save to DB
            if child_id and user_id:
                import asyncio
                from app import AsyncSessionLocal
                from models import DiagnosticReport
                import json as js

                async def save_report():
                    async with AsyncSessionLocal() as db:
                        report = DiagnosticReport(
                            child_id=int(child_id),
                            questionnaire_score=q_score,
                            emotion_alignment_score=es["alignment_score"],
                            emotion_variability_score=es["variability_score"],
                            final_confidence=final["final_score"],
                            confidence_level=final["confidence_level"],
                            category_scores=js.dumps({}),
                            emotion_timeline=js.dumps(er.get("timeline", []))
                        )
                        db.add(report)
                        await db.commit()

                asyncio.run(save_report())

        except Exception as e:
            analysis_jobs[job_id] = {"status": "error", "error": str(e)}

    background_tasks.add_task(run, job_id, video_bytes, q_score, child_id, user_id)
    return JSONResponse({"job_id": job_id})

@router.post("/save-report")
async def save_report(request: Request):
    """Save report after questionnaire-only (no video) flow"""
    user = await get_current_user(request)
    if not user:
        return JSONResponse({"detail": "Unauthorized"}, status_code=401)
    data = await request.json()
    from app import AsyncSessionLocal
    import json as js
    async with AsyncSessionLocal() as db:
        report = DiagnosticReport(
            child_id=int(data.get("child_id", 0)),
            questionnaire_score=data.get("q_score", 0.5),
            emotion_alignment_score=data.get("alignment_score", 0.5),
            emotion_variability_score=data.get("variability_score", 0.5),
            final_confidence=data.get("final_score", 0.5),
            confidence_level=data.get("confidence_level", "Moderate"),
            category_scores=js.dumps(data.get("category_scores", {})),
            emotion_timeline=js.dumps([])
        )
        db.add(report)
        await db.commit()
    return JSONResponse({"success": True})

@router.get("/job-status/{job_id}")
async def job_status(job_id: str):
    return JSONResponse(analysis_jobs.get(job_id, {"status": "not_found"}))

@router.get("/report")
async def report(request: Request):
    job_id = request.query_params.get("job_id", "")
    job = analysis_jobs.get(job_id, {})
    if job.get("status") == "complete":
        return JSONResponse(job["result"])
    q_score = 0.5
    final = calculate_final_confidence(q_score, 0.5, 0.5)
    return JSONResponse({
        "final": final,
        "q_score": q_score,
        "emotion_scores": {"alignment_score": 0.5, "variability_score": 0.5},
        "emotion_result": {"emotion_counts": {}}
    })