from fastapi import APIRouter, Request, Form, UploadFile, File, BackgroundTasks
from fastapi.responses import HTMLResponse, RedirectResponse, JSONResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.future import select
import json, uuid

from models import Child
from services.score_calculator import (
    calculate_questionnaire_score,
    calculate_emotion_scores,
    calculate_final_confidence
)

router = APIRouter()
templates = Jinja2Templates(directory="templates")
analysis_jobs = {}

def require_auth(request: Request):
    from routes.auth import get_token, decode_token
    token = get_token(request)
    return bool(token and decode_token(token))

@router.get("/questionnaire", response_class=HTMLResponse)
async def questionnaire(request: Request):
    if not require_auth(request):
        return RedirectResponse("/auth/login", status_code=302)
    lang = request.cookies.get("lang", "en")
    with open("data/questionnaire.json", "r", encoding="utf-8") as f:
        data = json.load(f)
    questions = data.get(lang, data["en"])
    from app import AsyncSessionLocal
    from routes.auth import get_token, decode_token
    from models import User
    token = get_token(request)
    payload = decode_token(token)
    children = []
    async with AsyncSessionLocal() as db:
        user_result = await db.execute(select(User).where(User.email == payload.get("sub")))
        user = user_result.scalar_one_or_none()
        if user:
            ch_result = await db.execute(select(Child).where(Child.parent_id == user.id))
            children = ch_result.scalars().all()
    return templates.TemplateResponse(request, "diagnosis/questionnaire.html", {
        "questions": questions, "lang": lang, "children": children
    })

@router.post("/questionnaire/submit")
async def submit_questionnaire(request: Request):
    if not require_auth(request):
        return RedirectResponse("/auth/login", status_code=302)
    form = await request.form()
    answers = {}
    child_id = form.get("child_id", "1")
    for key, val in form.items():
        if key.startswith("q_"):
            qid = key.replace("q_", "")
            answers[qid] = val
    result = calculate_questionnaire_score(answers)
    response = RedirectResponse("/diagnosis/video", status_code=302)
    response.set_cookie("q_score", str(result["overall_score"]), samesite="lax")
    response.set_cookie("q_categories", json.dumps(result["category_scores"]), samesite="lax")
    response.set_cookie("child_id", str(child_id), samesite="lax")
    return response

@router.get("/video", response_class=HTMLResponse)
async def video_player(request: Request):
    if not require_auth(request):
        return RedirectResponse("/auth/login", status_code=302)
    lang = request.cookies.get("lang", "en")
    child_id = request.cookies.get("child_id", None)
    age_group = "5-8"
    child = None
    if child_id:
        from app import AsyncSessionLocal
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(Child).where(Child.id == int(child_id)))
            child = result.scalar_one_or_none()
            if child:
                from datetime import date
                try:
                    birth_year = int(child.date_of_birth.split("-")[0])
                    age = date.today().year - birth_year
                    age_group = "2-4" if age <= 4 else ("9-12" if age > 8 else "5-8")
                except:
                    age_group = "5-8"
    return templates.TemplateResponse(request, "diagnosis/video_player.html", {
        "lang": lang, "child": child, "age_group": age_group
    })

@router.post("/analyze-video")
async def analyze_video(request: Request, background_tasks: BackgroundTasks, video: UploadFile = File(...)):
    job_id = str(uuid.uuid4())
    analysis_jobs[job_id] = {"status": "processing", "result": None}
    video_bytes = await video.read()
    q_score = float(request.cookies.get("q_score", "0.5"))

    def run_analysis(job_id, video_bytes, q_score):
        try:
            from services.emotion_analyzer import analyze_video_emotions
            emotion_result = analyze_video_emotions(video_bytes)
            emotion_scores = calculate_emotion_scores(emotion_result["timeline"])
            final = calculate_final_confidence(q_score, emotion_scores["alignment_score"], emotion_scores["variability_score"])
            analysis_jobs[job_id] = {
                "status": "complete",
                "result": {"emotion_result": emotion_result, "emotion_scores": emotion_scores, "final": final, "q_score": q_score}
            }
        except Exception as e:
            analysis_jobs[job_id] = {"status": "error", "error": str(e)}

    background_tasks.add_task(run_analysis, job_id, video_bytes, q_score)
    return JSONResponse({"job_id": job_id})

@router.get("/job-status/{job_id}")
async def job_status(job_id: str):
    return JSONResponse(analysis_jobs.get(job_id, {"status": "not_found"}))

@router.get("/processing", response_class=HTMLResponse)
async def processing_page(request: Request):
    if not require_auth(request):
        return RedirectResponse("/auth/login", status_code=302)
    lang = request.cookies.get("lang", "en")
    job_id = request.query_params.get("job_id", "")
    return templates.TemplateResponse(request, "diagnosis/processing.html", {
        "lang": lang, "job_id": job_id
    })

@router.get("/report", response_class=HTMLResponse)
async def report_page(request: Request):
    if not require_auth(request):
        return RedirectResponse("/auth/login", status_code=302)
    lang = request.cookies.get("lang", "en")
    job_id = request.query_params.get("job_id", "")
    job = analysis_jobs.get(job_id, {})
    q_score = float(request.cookies.get("q_score", "0.5"))
    categories_str = request.cookies.get("q_categories", "{}")
    try:
        categories = json.loads(categories_str)
    except:
        categories = {}
    if job.get("status") == "complete":
        result = job["result"]
        result["category_scores"] = categories
    else:
        final = calculate_final_confidence(q_score, 0.5, 0.5)
        result = {
            "final": final, "q_score": q_score, "category_scores": categories,
            "emotion_result": {"emotion_counts": {}, "timeline": []},
            "emotion_scores": {"alignment_score": 0.5, "variability_score": 0.5}
        }
    return templates.TemplateResponse(request, "diagnosis/report.html", {
        "lang": lang, "result": result, "job_id": job_id
    })