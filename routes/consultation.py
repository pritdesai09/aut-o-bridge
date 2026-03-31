from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
import json

router = APIRouter()
templates = Jinja2Templates(directory="templates")

@router.get("/doctors", response_class=HTMLResponse)
async def doctors_page(request: Request):
    with open("data/doctors.json", "r", encoding="utf-8") as f:
        doctors = json.load(f)
    lang = request.cookies.get("lang", "en")
    return templates.TemplateResponse(request, "consultation/doctors.html", {
        "doctors": doctors, "lang": lang
    })

@router.get("/doctor/{doctor_id}", response_class=HTMLResponse)
async def doctor_profile(request: Request, doctor_id: int):
    with open("data/doctors.json", "r", encoding="utf-8") as f:
        doctors = json.load(f)
    doctor = next((d for d in doctors if d["id"] == doctor_id), None)
    lang = request.cookies.get("lang", "en")
    return templates.TemplateResponse(request, "consultation/doctor_profile.html", {
        "doctor": doctor, "lang": lang
    })

@router.get("/booking/{doctor_id}", response_class=HTMLResponse)
async def booking_page(request: Request, doctor_id: int):
    with open("data/doctors.json", "r", encoding="utf-8") as f:
        doctors = json.load(f)
    doctor = next((d for d in doctors if d["id"] == doctor_id), None)
    lang = request.cookies.get("lang", "en")
    return templates.TemplateResponse(request, "consultation/booking.html", {
        "doctor": doctor, "lang": lang
    })