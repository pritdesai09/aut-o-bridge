from fastapi import APIRouter, Request
from fastapi.responses import JSONResponse
from sqlalchemy.future import select
import json
from datetime import datetime

from models import User, Child, Appointment, DoctorAccess, DiagnosticReport

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
        # Children
        ch = await db.execute(select(Child).where(Child.parent_id == user.id))
        children_raw = ch.scalars().all()
        children = [{"id": c.id, "full_name": c.full_name, "date_of_birth": c.date_of_birth, "gender": c.gender} for c in children_raw]
        children_map = {c.id: c.full_name for c in children_raw}

        # Appointments
        ap = await db.execute(select(Appointment).where(Appointment.parent_id == user.id))
        appts_raw = ap.scalars().all()

        # Reports — get all reports for all children
        child_ids = [c.id for c in children_raw]
        reports = []
        for cid in child_ids:
            rp = await db.execute(
                select(DiagnosticReport)
                .where(DiagnosticReport.child_id == cid)
                .order_by(DiagnosticReport.created_at.desc())
            )
            for r in rp.scalars().all():
                try:
                    cat_scores = json.loads(r.category_scores) if r.category_scores else {}
                except:
                    cat_scores = {}
                reports.append({
                    "id": r.id,
                    "child_name": children_map.get(cid, "Child"),
                    "confidence_level": r.confidence_level or "Moderate",
                    "percentage": round((r.final_confidence or 0.5) * 100, 1),
                    "q_score": r.questionnaire_score or 0.5,
                    "alignment_score": r.emotion_alignment_score or 0.5,
                    "variability_score": r.emotion_variability_score or 0.5,
                    "final_score": r.final_confidence or 0.5,
                    "category_scores": cat_scores,
                    "created_at": r.created_at.strftime("%d %b %Y, %I:%M %p") if r.created_at else ""
                })

    # Doctor names
    with open("data/doctors.json", "r", encoding="utf-8") as f:
        doctors_list = json.load(f)
    doctors_map = {d["id"]: d["name"] for d in doctors_list}

    appointments = [{
        "id": a.id,
        "doctor_id": a.doctor_id,
        "doctor_name": doctors_map.get(a.doctor_id, f"Doctor #{a.doctor_id}"),
        "mode": a.mode,
        "appointment_date": a.appointment_date,
        "appointment_time": a.appointment_time,
        "status": a.status
    } for a in appts_raw]

    return JSONResponse({
        "user": {"id": user.id, "full_name": user.full_name, "email": user.email},
        "children": children,
        "appointments": appointments,
        "reports": reports
    })

@router.get("/access_control")
async def access_control(request: Request):
    user = await get_auth_user(request)
    if not user:
        return JSONResponse({"detail": "Unauthorized"}, status_code=401)
    from app import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        ch = await db.execute(select(Child).where(Child.parent_id == user.id))
        children = [{"id": c.id, "full_name": c.full_name} for c in ch.scalars().all()]
        ac = await db.execute(select(DoctorAccess))
        granted_ids = [a.doctor_id for a in ac.scalars().all() if a.granted]
    with open("data/doctors.json", "r", encoding="utf-8") as f:
        doctors = json.load(f)
    return JSONResponse({"children": children, "doctors": doctors, "granted_ids": granted_ids})

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
        result = await db.execute(
            select(DoctorAccess).where(
                DoctorAccess.doctor_id == doctor_id,
                DoctorAccess.child_id == child_id
            )
        )
        access = result.scalar_one_or_none()
        if access:
            access.granted = not access.granted
        else:
            access = DoctorAccess(doctor_id=doctor_id, child_id=child_id, granted=True)
            db.add(access)
        await db.commit()
    return JSONResponse({"success": True})