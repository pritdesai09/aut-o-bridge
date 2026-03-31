from fastapi import APIRouter, Request, Form
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
import json

from models import Appointment

router = APIRouter()
templates = Jinja2Templates(directory="templates")

def require_auth(request: Request):
    from routes.auth import get_token, decode_token
    token = get_token(request)
    return bool(token and decode_token(token))

@router.get("/doctors", response_class=HTMLResponse)
async def doctors_page(request: Request):
    if not require_auth(request):
        return RedirectResponse("/auth/login", status_code=302)
    with open("data/doctors.json", "r", encoding="utf-8") as f:
        doctors = json.load(f)
    lang = request.cookies.get("lang", "en")
    specialty = request.query_params.get("specialty", "")
    mode = request.query_params.get("mode", "")
    lang_filter = request.query_params.get("lang_filter", "")
    filtered = doctors
    if specialty:
        filtered = [d for d in filtered if specialty.lower() in d["specialty"].lower()]
    if mode:
        filtered = [d for d in filtered if mode in d["available_modes"]]
    if lang_filter:
        filtered = [d for d in filtered if lang_filter in d["languages"]]
    return templates.TemplateResponse(request, "consultation/doctors.html", {
        "doctors": filtered, "all_doctors": doctors, "lang": lang,
        "specialty": specialty, "mode": mode, "lang_filter": lang_filter
    })

@router.get("/doctor/{doctor_id}", response_class=HTMLResponse)
async def doctor_profile(request: Request, doctor_id: int):
    if not require_auth(request):
        return RedirectResponse("/auth/login", status_code=302)
    with open("data/doctors.json", "r", encoding="utf-8") as f:
        doctors = json.load(f)
    doctor = next((d for d in doctors if d["id"] == doctor_id), None)
    lang = request.cookies.get("lang", "en")
    return templates.TemplateResponse(request, "consultation/doctor_profile.html", {
        "doctor": doctor, "lang": lang
    })

@router.get("/booking/{doctor_id}", response_class=HTMLResponse)
async def booking_page(request: Request, doctor_id: int):
    if not require_auth(request):
        return RedirectResponse("/auth/login", status_code=302)
    with open("data/doctors.json", "r", encoding="utf-8") as f:
        doctors = json.load(f)
    doctor = next((d for d in doctors if d["id"] == doctor_id), None)
    lang = request.cookies.get("lang", "en")
    from routes.auth import get_token, decode_token
    from app import AsyncSessionLocal
    from sqlalchemy.future import select
    from models import User, Child
    token = get_token(request)
    payload = decode_token(token)
    children = []
    async with AsyncSessionLocal() as db:
        user_result = await db.execute(select(User).where(User.email == payload.get("sub")))
        user = user_result.scalar_one_or_none()
        if user:
            ch_result = await db.execute(select(Child).where(Child.parent_id == user.id))
            children = ch_result.scalars().all()
    return templates.TemplateResponse(request, "consultation/booking.html", {
        "doctor": doctor, "lang": lang, "children": children
    })

@router.post("/booking/{doctor_id}")
async def book_appointment(
    request: Request,
    doctor_id: int,
    child_id: str = Form(...),
    appointment_date: str = Form(...),
    appointment_time: str = Form(...),
    mode: str = Form(...),
    notes: str = Form(""),
):
    if not require_auth(request):
        return RedirectResponse("/auth/login", status_code=302)
    from routes.auth import get_token, decode_token
    from app import AsyncSessionLocal
    from sqlalchemy.future import select
    from models import User
    token = get_token(request)
    payload = decode_token(token)
    async with AsyncSessionLocal() as db:
        user_result = await db.execute(select(User).where(User.email == payload.get("sub")))
        user = user_result.scalar_one_or_none()
        appt = Appointment(
            child_id=int(child_id), doctor_id=doctor_id,
            parent_id=user.id, mode=mode,
            appointment_date=appointment_date,
            appointment_time=appointment_time,
            notes=notes, status="upcoming"
        )
        db.add(appt)
        await db.commit()
    return RedirectResponse("/dashboard/home", status_code=302)