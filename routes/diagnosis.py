from fastapi import APIRouter, Request, Form, UploadFile, File, BackgroundTasks
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.future import select
import json
import uuid

from models import Child, DiagnosticReport, User
from services.score_calculator import (
    calculate_questionnaire_score,
    calculate_emotion_scores,
    calculate_final_confidence
)

router = APIRouter()
templates = Jinja2Templates(directory="templates")

# In-memory job store for background analysis tasks
analysis_jobs = {}


# ── Step 1: Questionnaire ─────────────────────────────────────────────────────

@router.get("/questionnaire", response_class=HTMLResponse)
async def questionnaire(request: Request):
    lang = request.cookies.get("lang", "en")
    with open("data/questionnaire.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    questions = data.get(lang, data["en"])
    return templates.TemplateResponse(request, "diagnosis/questionnaire.html", {
        "questions": questions, "lang": lang
    })


@router.post("/questionnaire/submit")
async def submit_questionnaire(request: Request):
    form = await request.form()
    lang = request.cookies.get("lang", "en")

    answers = {}
    child_id = form.get("child_id", "1")
    for key, val in form.items():
        if key.startswith("q_"):
            qid = key.replace("q_", "")
            answers[qid] = val

    result = calculate_questionnaire_score(answers)

    # Store in session-like cookie (simplified for hackathon)
    response = RedirectResponse("/diagnosis/video", status_code=302)
    response.set_cookie("q_score", str(result["overall_score"]))
    response.set_cookie("q_categories", json.dumps(result["category_scores"]))
    response.set_cookie("child_id", str(child_id))
    return response


# ── Step 2: Video Player ──────────────────────────────────────────────────────

@router.get("/video", response_class=HTMLResponse)
async def video_player(request: Request):
    from routes.auth import get_token, decode_token
    from app import AsyncSessionLocal

    lang = request.cookies.get("lang", "en")
    child_id = request.cookies.get("child_id", None)
    child = None
    age_group = "5-8"  # default

    if child_id:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Child).where(Child.id == int(child_id)))
            child = result.scalar_one_or_none()
            if child:
                from datetime import date
                dob = child.date_of_birth
                try:
                    birth_year = int(dob.split("-")[0])
                    age = date.today().year - birth_year
                    if age <= 4:
                        age_group = "2-4"
                    elif age <= 8:
                        age_group = "5-8"
                    else:
                        age_group = "9-12"
                except:
                    age_group = "5-8"

    return templates.TemplateResponse(request, "diagnosis/video_player.html", {
        "lang": lang,
        "child": child,
        "age_group": age_group
    })


# ── Step 3: Video Upload & Analysis ──────────────────────────────────────────

@router.post("/analyze-video")
async def analyze_video(
    request: Request,
    background_tasks: BackgroundTasks,
    video: UploadFile = File(...)
):
    job_id = str(uuid.uuid4())
    analysis_jobs[job_id] = {"status": "processing", "result": None}

    video_bytes = await video.read()

    def run_analysis(job_id: str, video_bytes: bytes, request: Request):
        try:
            from services.emotion_analyzer import analyze_video_emotions
            emotion_result = analyze_video_emotions(video_bytes)
            emotion_scores = calculate_emotion_scores(emotion_result["timeline"])

            q_score = float(request.cookies.get("q_score", "0.5"))
            final = calculate_final_confidence(
                q_score,
                emotion_scores["alignment_score"],
                emotion_scores["variability_score"]
            )

            analysis_jobs[job_id] = {
                "status": "complete",
                "result": {
                    "emotion_result": emotion_result,
                    "emotion_scores": emotion_scores,
                    "final": final,
                    "q_score": q_score
                }
            }
        except Exception as e:
            analysis_jobs[job_id] = {
                "status": "error",
                "error": str(e)
            }

    background_tasks.add_task(run_analysis, job_id, video_bytes, request)
    return JSONResponse({"job_id": job_id})


@router.get("/job-status/{job_id}")
async def job_status(job_id: str):
    job = analysis_jobs.get(job_id)
    if not job:
        return JSONResponse({"status": "not_found"})
    return JSONResponse(job)


# ── Step 4: Report ────────────────────────────────────────────────────────────

@router.get("/processing", response_class=HTMLResponse)
async def processing_page(request: Request):
    lang = request.cookies.get("lang", "en")
    job_id = request.query_params.get("job_id", "")
    return templates.TemplateResponse(request, "diagnosis/processing.html", {
        "lang": lang, "job_id": job_id
    })


@router.get("/report", response_class=HTMLResponse)
async def report_page(request: Request):
    lang = request.cookies.get("lang", "en")
    job_id = request.query_params.get("job_id", "")
    job = analysis_jobs.get(job_id, {})

    if not job or job.get("status") != "complete":
        # Fallback: generate a demo report from questionnaire score only
        q_score = float(request.cookies.get("q_score", "0.5"))
        categories_str = request.cookies.get("q_categories", "{}")
        try:
            categories = json.loads(categories_str)
        except:
            categories = {}

        final = calculate_final_confidence(q_score, 0.5, 0.5)
        result = {
            "final": final,
            "q_score": q_score,
            "category_scores": categories,
            "emotion_result": {"emotion_counts": {}, "timeline": []},
            "emotion_scores": {"alignment_score": 0.5, "variability_score": 0.5}
        }
    else:
        result = job["result"]
        categories_str = request.cookies.get("q_categories", "{}")
        try:
            result["category_scores"] = json.loads(categories_str)
        except:
            result["category_scores"] = {}

    return templates.TemplateResponse(request, "diagnosis/report.html", {
        "lang": lang,
        "result": result,
        "job_id": job_id
    })