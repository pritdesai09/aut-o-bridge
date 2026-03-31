from fastapi import APIRouter, Request, Form, UploadFile, File
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.future import select
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import shutil, os

from models import User, Child
from config import settings

router = APIRouter()
templates = Jinja2Templates(directory="templates")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto", bcrypt__rounds=12, bcrypt__ident="2b")

def create_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def get_token(request: Request):
    return request.cookies.get("access_token")

def decode_token(token: str):
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except:
        return None

async def get_current_user(request: Request):
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

def require_auth(request: Request):
    token = get_token(request)
    if not token or not decode_token(token):
        return False
    return True

@router.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    if require_auth(request):
        return RedirectResponse("/dashboard/home", status_code=302)
    return templates.TemplateResponse(request, "auth/register.html", {})

@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    if require_auth(request):
        return RedirectResponse("/dashboard/home", status_code=302)
    return templates.TemplateResponse(request, "auth/login.html", {})

@router.get("/child-profile", response_class=HTMLResponse)
async def child_profile_page(request: Request):
    if not require_auth(request):
        return RedirectResponse("/auth/login", status_code=302)
    return templates.TemplateResponse(request, "auth/child_profile.html", {})

@router.post("/register")
async def register(
    request: Request,
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
):
    from app import AsyncSessionLocal
    try:
        # Truncate password to 72 bytes max for bcrypt
        password_bytes = password.encode("utf-8")[:72].decode("utf-8", errors="ignore")
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.email == email))
            if result.scalar_one_or_none():
                return templates.TemplateResponse(request, "auth/register.html", {
                    "error": "Email already registered."
                })
            user = User(
                full_name=full_name, email=email, phone=phone,
                hashed_password=pwd_context.hash(password_bytes),
                language="en"
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            token = create_token({"sub": email})
            response = RedirectResponse("/auth/child-profile", status_code=302)
            response.set_cookie("access_token", token, httponly=True, samesite="lax")
            response.set_cookie("lang", "en", samesite="lax")
            return response
    except Exception as e:
        return templates.TemplateResponse(request, "auth/register.html", {
            "error": f"Registration failed: {str(e)}"
        })

@router.post("/login")
async def login(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
):
    from app import AsyncSessionLocal
    try:
        password_bytes = password.encode("utf-8")[:72].decode("utf-8", errors="ignore")
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()
            if not user or not pwd_context.verify(password_bytes, user.hashed_password):
                return templates.TemplateResponse(request, "auth/login.html", {
                    "error": "Invalid email or password."
                })
            token = create_token({"sub": email})
            response = RedirectResponse("/dashboard/home", status_code=302)
            response.set_cookie("access_token", token, httponly=True, samesite="lax")
            response.set_cookie("lang", user.language, samesite="lax")
            return response
    except Exception as e:
        return templates.TemplateResponse(request, "auth/login.html", {
            "error": f"Login failed: {str(e)}"
        })

@router.post("/child-profile")
async def create_child(
    request: Request,
    full_name: str = Form(...),
    date_of_birth: str = Form(...),
    gender: str = Form(...),
    photo: UploadFile = File(None),
):
    from app import AsyncSessionLocal
    token = get_token(request)
    payload = decode_token(token)
    if not payload:
        return RedirectResponse("/auth/login", status_code=302)
    try:
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.email == payload.get("sub")))
            user = result.scalar_one_or_none()
            if not user:
                return RedirectResponse("/auth/login", status_code=302)
            photo_path = None
            if photo and photo.filename:
                photo_path = f"static/uploads/photos/{user.id}_{photo.filename}"
                with open(photo_path, "wb") as f:
                    shutil.copyfileobj(photo.file, f)
            child = Child(
                parent_id=user.id, full_name=full_name,
                date_of_birth=date_of_birth, gender=gender, photo_path=photo_path
            )
            db.add(child)
            await db.commit()
            return RedirectResponse("/dashboard/home", status_code=302)
    except Exception as e:
        return templates.TemplateResponse(request, "auth/child_profile.html", {
            "error": f"Failed to save: {str(e)}"
        })

@router.get("/logout")
async def logout():
    response = RedirectResponse("/", status_code=302)
    response.delete_cookie("access_token")
    response.delete_cookie("lang")
    return response