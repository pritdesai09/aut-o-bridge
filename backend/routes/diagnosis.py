from fastapi import APIRouter, Request, UploadFile, File, BackgroundTasks
from fastapi.responses import JSONResponse
from sqlalchemy.future import select
import json, uuid

from models import Child
from routes.auth import get_current_user
from services.score_calculator import calculate_questionnaire_score, calculate_emotion_scores, calculate_final_confidence

router = APIRouter()
analysis_jobs = {}

@router.get("/questionnaire")
async def questionnaire(request: Request):
    user = await get_current_user(request)
    if not user:
        return JSONResponse({"detail":"Unauthorized"},status_code=401)
    lang = request.query_params.get("lang","en")
    with open("data/questionnaire.json","r",encoding="utf-8") as f:
        data = json.load(f)
    questions = data.get(lang, data["en"])
    from app import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        ch = await db.execute(select(Child).where(Child.parent_id==user.id))
        children = [{"id":c.id,"full_name":c.full_name} for c in ch.scalars().all()]
    return JSONResponse({"questions":questions,"children":children})

@router.post("/questionnaire/submit")
async def submit_questionnaire(request: Request):
    user = await get_current_user(request)
    if not user:
        return JSONResponse({"detail":"Unauthorized"},status_code=401)
    data = await request.json()
    answers = data.get("answers",{})
    result = calculate_questionnaire_score(answers)
    return JSONResponse(result)

@router.post("/analyze-video")
async def analyze_video(request: Request, background_tasks: BackgroundTasks, video: UploadFile = File(...)):
    job_id = str(uuid.uuid4())
    analysis_jobs[job_id] = {"status":"processing"}
    video_bytes = await video.read()
    q_score = float(request.headers.get("X-QScore","0.5"))

    def run(job_id, video_bytes, q_score):
        try:
            from services.emotion_analyzer import analyze_video_emotions
            er = analyze_video_emotions(video_bytes)
            es = calculate_emotion_scores(er["timeline"])
            final = calculate_final_confidence(q_score, es["alignment_score"], es["variability_score"])
            analysis_jobs[job_id] = {"status":"complete","result":{"emotion_result":er,"emotion_scores":es,"final":final,"q_score":q_score}}
        except Exception as e:
            analysis_jobs[job_id] = {"status":"error","error":str(e)}

    background_tasks.add_task(run, job_id, video_bytes, q_score)
    return JSONResponse({"job_id":job_id})

@router.get("/job-status/{job_id}")
async def job_status(job_id: str):
    return JSONResponse(analysis_jobs.get(job_id,{"status":"not_found"}))

@router.get("/report")
async def report(request: Request):
    job_id = request.query_params.get("job_id","")
    job = analysis_jobs.get(job_id,{})
    if job.get("status")=="complete":
        return JSONResponse(job["result"])
    q_score = 0.5
    final = calculate_final_confidence(q_score,0.5,0.5)
    return JSONResponse({"final":final,"q_score":q_score,"emotion_scores":{"alignment_score":0.5,"variability_score":0.5},"emotion_result":{"emotion_counts":{}}})