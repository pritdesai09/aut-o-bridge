from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from sqlalchemy.future import select
import json

from models import User, Child, Appointment, DoctorAccess

router = APIRouter()

async def get_auth_user(request: Request):
    from routes.auth import get_current_user
    return await get_current_user(request)

@router.get("/home")
async def dashboard_home(request: Request):
    user = await get_auth_user(request)
    if not user:
        return JSONResponse({"detail": "Unauthorized"}, status_code=401)
    from app import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        ch = await db.execute(select(Child).where(Child.parent_id == user.id))
        children = [{"id":c.id,"full_name":c.full_name,"date_of_birth":c.date_of_birth,"gender":c.gender} for c in ch.scalars().all()]
        ap = await db.execute(select(Appointment).where(Appointment.parent_id == user.id))
        appointments = [{"id":a.id,"doctor_id":a.doctor_id,"mode":a.mode,"appointment_date":a.appointment_date,"appointment_time":a.appointment_time,"status":a.status} for a in ap.scalars().all()]
    return JSONResponse({"user":{"id":user.id,"full_name":user.full_name,"email":user.email},"children":children,"appointments":appointments})

@router.get("/access_control")
async def access_control(request: Request):
    user = await get_auth_user(request)
    if not user:
        return JSONResponse({"detail": "Unauthorized"}, status_code=401)
    from app import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        ch = await db.execute(select(Child).where(Child.parent_id == user.id))
        children = [{"id":c.id,"full_name":c.full_name} for c in ch.scalars().all()]
        ac = await db.execute(select(DoctorAccess))
        granted_ids = [a.doctor_id for a in ac.scalars().all() if a.granted]
    with open("data/doctors.json","r",encoding="utf-8") as f:
        doctors = json.load(f)
    return JSONResponse({"children":children,"doctors":doctors,"granted_ids":granted_ids})

@router.post("/access_control/toggle")
async def toggle_access(request: Request):
    user = await get_auth_user(request)
    if not user:
        return JSONResponse({"detail": "Unauthorized"}, status_code=401)
    data = await request.json()
    doctor_id = int(data.get("doctor_id"))
    child_id = int(data.get("child_id"))
    from app import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(DoctorAccess).where(DoctorAccess.doctor_id==doctor_id, DoctorAccess.child_id==child_id))
        access = result.scalar_one_or_none()
        if access:
            access.granted = not access.granted
        else:
            access = DoctorAccess(doctor_id=doctor_id, child_id=child_id, granted=True)
            db.add(access)
        await db.commit()
    return JSONResponse({"success": True})