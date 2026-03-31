from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.future import select
import json

from models import User, Child, Doctor, DoctorAccess, Appointment

router = APIRouter()
templates = Jinja2Templates(directory="templates")

async def get_auth_user(request: Request):
    from routes.auth import get_token, decode_token
    from app import AsyncSessionLocal
    token = get_token(request)
    if not token:
        return None
    payload = decode_token(token)
    if not payload:
        return None
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == payload.get("sub")))
        return result.scalar_one_or_none()

@router.get("/home", response_class=HTMLResponse)
async def dashboard_home(request: Request):
    user = await get_auth_user(request)
    if not user:
        return RedirectResponse("/auth/login", status_code=302)
    from app import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        children_result = await db.execute(select(Child).where(Child.parent_id == user.id))
        children = children_result.scalars().all()
        appt_result = await db.execute(select(Appointment).where(Appointment.parent_id == user.id))
        appointments = appt_result.scalars().all()
    lang = request.cookies.get("lang", "en")
    return templates.TemplateResponse(request, "dashboard/home.html", {
        "user": user, "children": children,
        "appointments": appointments, "lang": lang
    })

@router.get("/access_control", response_class=HTMLResponse)
async def access_control(request: Request):
    user = await get_auth_user(request)
    if not user:
        return RedirectResponse("/auth/login", status_code=302)
    from app import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        children_result = await db.execute(select(Child).where(Child.parent_id == user.id))
        children = children_result.scalars().all()
        with open("data/doctors.json", "r", encoding="utf-8") as f:
            doctors = json.load(f)
        access_result = await db.execute(select(DoctorAccess))
        accesses = access_result.scalars().all()
        granted_ids = {a.doctor_id for a in accesses if a.granted}
    lang = request.cookies.get("lang", "en")
    return templates.TemplateResponse(request, "dashboard/access_control.html", {
        "user": user, "children": children, "doctors": doctors,
        "granted_ids": granted_ids, "lang": lang
    })

@router.post("/access_control/toggle")
async def toggle_access(request: Request):
    user = await get_auth_user(request)
    if not user:
        return RedirectResponse("/auth/login", status_code=302)
    form = await request.form()
    doctor_id = int(form.get("doctor_id"))
    child_id = int(form.get("child_id"))
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
    return RedirectResponse("/dashboard/access_control", status_code=302)