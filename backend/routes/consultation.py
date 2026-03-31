from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
import json

from models import Appointment, User, Child
from routes.auth import get_current_user

router = APIRouter()

@router.get("/doctors")
async def doctors(request: Request):
    with open("data/doctors.json","r",encoding="utf-8") as f:
        doctors = json.load(f)
    specialty = request.query_params.get("specialty","")
    mode = request.query_params.get("mode","")
    lang_filter = request.query_params.get("lang_filter","")
    if specialty: doctors = [d for d in doctors if specialty.lower() in d["specialty"].lower()]
    if mode: doctors = [d for d in doctors if mode in d["available_modes"]]
    if lang_filter: doctors = [d for d in doctors if lang_filter in d["languages"]]
    return JSONResponse(doctors)

@router.get("/doctor/{doctor_id}")
async def doctor_profile(doctor_id: int):
    with open("data/doctors.json","r",encoding="utf-8") as f:
        doctors = json.load(f)
    doc = next((d for d in doctors if d["id"]==doctor_id), None)
    if not doc:
        return JSONResponse({"detail":"Not found"},status_code=404)
    return JSONResponse(doc)

@router.get("/booking/{doctor_id}")
async def booking_data(request: Request, doctor_id: int):
    user = await get_current_user(request)
    if not user:
        return JSONResponse({"detail":"Unauthorized"},status_code=401)
    with open("data/doctors.json","r",encoding="utf-8") as f:
        doctors = json.load(f)
    doc = next((d for d in doctors if d["id"]==doctor_id), None)
    from app import AsyncSessionLocal
    from sqlalchemy.future import select
    async with AsyncSessionLocal() as db:
        ch = await db.execute(select(Child).where(Child.parent_id==user.id))
        children = [{"id":c.id,"full_name":c.full_name} for c in ch.scalars().all()]
    return JSONResponse({"doctor":doc,"children":children})

@router.post("/booking/{doctor_id}")
async def book_appointment(request: Request, doctor_id: int):
    user = await get_current_user(request)
    if not user:
        return JSONResponse({"detail":"Unauthorized"},status_code=401)
    data = await request.json()
    from app import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        appt = Appointment(
            child_id=int(data.get("child_id",1)),
            doctor_id=doctor_id, parent_id=user.id,
            mode=data.get("mode","Online"),
            appointment_date=data.get("appointment_date",""),
            appointment_time=data.get("appointment_time",""),
            notes=data.get("notes",""), status="upcoming"
        )
        db.add(appt)
        await db.commit()
    return JSONResponse({"success":True})