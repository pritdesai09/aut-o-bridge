from fastapi import APIRouter, Request
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.future import select

from models import User, Child

router = APIRouter()
templates = Jinja2Templates(directory="templates")

@router.get("/home", response_class=HTMLResponse)
async def dashboard_home(request: Request):
    from app import AsyncSessionLocal
    from routes.auth import get_token, decode_token
    token = get_token(request)
    if not token:
        return RedirectResponse("/auth/login", status_code=302)
    payload = decode_token(token)
    if not payload:
        return RedirectResponse("/auth/login", status_code=302)
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == payload.get("sub")))
        user = result.scalar_one_or_none()
        if not user:
            return RedirectResponse("/auth/login", status_code=302)
        children_result = await db.execute(select(Child).where(Child.parent_id == user.id))
        children = children_result.scalars().all()
    lang = request.cookies.get("lang", "en")
    return templates.TemplateResponse(request, "dashboard/home.html", {
        "user": user, "children": children, "lang": lang
    })

@router.get("/access_control", response_class=HTMLResponse)
async def access_control(request: Request):
    from app import AsyncSessionLocal
    from routes.auth import get_token, decode_token
    token = get_token(request)
    if not token:
        return RedirectResponse("/auth/login", status_code=302)
    payload = decode_token(token)
    if not payload:
        return RedirectResponse("/auth/login", status_code=302)
    lang = request.cookies.get("lang", "en")
    return templates.TemplateResponse(request, "dashboard/access_control.html", {
        "lang": lang
    })