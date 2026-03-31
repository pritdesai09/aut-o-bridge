from fastapi import APIRouter, Request, Form, UploadFile, File
from fastapi.responses import HTMLResponse, RedirectResponse
from fastapi.templating import Jinja2Templates
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import shutil, os

from models import User, Child
from config import settings

router = APIRouter()
templates = Jinja2Templates(directory="templates")
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

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

async def get_current_user(request: Request, db: AsyncSession):
    token = get_token(request)
    if not token:
        return None
    payload = decode_token(token)
    if not payload:
        return None
    result = await db.execute(select(User).where(User.email == payload.get("sub")))
    return result.scalar_one_or_none()

@router.get("/register", response_class=HTMLResponse)
async def register_page(request: Request):
    return templates.TemplateResponse(request, "auth/register.html")

@router.get("/login", response_class=HTMLResponse)
async def login_page(request: Request):
    return templates.TemplateResponse(request, "auth/login.html")

@router.get("/child-profile", response_class=HTMLResponse)
async def child_profile_page(request: Request):
    return templates.TemplateResponse(request, "auth/child_profile.html")

@router.post("/register")
async def register(
    request: Request,
    full_name: str = Form(...),
    email: str = Form(...),
    phone: str = Form(...),
    password: str = Form(...),
    language: str = Form("en"),
):
    from app import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        if result.scalar_one_or_none():
            return templates.TemplateResponse(request, "auth/register.html", {
                "error": "Email already registered."
            })
        user = User(
            full_name=full_name, email=email, phone=phone,
            hashed_password=pwd_context.hash(password), language=language
        )
        db.add(user)
        await db.commit()
        token = create_token({"sub": email})
        response = RedirectResponse("/auth/child-profile", status_code=302)
        response.set_cookie("access_token", token, httponly=True)
        response.set_cookie("lang", language)
        return response

@router.post("/login")
async def login(
    request: Request,
    email: str = Form(...),
    password: str = Form(...),
):
    from app import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user or not pwd_context.verify(password, user.hashed_password):
            return templates.TemplateResponse(request, "auth/login.html", {
                "error": "Invalid email or password."
            })
        token = create_token({"sub": email})
        response = RedirectResponse("/dashboard/home", status_code=302)
        response.set_cookie("access_token", token, httponly=True)
        response.set_cookie("lang", user.language)
        return response

@router.post("/child-profile")
async def create_child(
    request: Request,
    full_name: str = Form(...),
    date_of_birth: str = Form(...),
    gender: str = Form(...),
    photo: UploadFile = File(None),
):
    from app import AsyncSessionLocal
    async with AsyncSessionLocal() as db:
        token = get_token(request)
        payload = decode_token(token)
        if not payload:
            return RedirectResponse("/auth/login", status_code=302)
        result = await db.execute(select(User).where(User.email == payload.get("sub")))
        user = result.scalar_one_or_none()
        photo_path = None
        if photo and photo.filename:
            os.makedirs("static/uploads/photos", exist_ok=True)
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

@router.get("/logout")
async def logout():
    response = RedirectResponse("/", status_code=302)
    response.delete_cookie("access_token")
    response.delete_cookie("lang")
    return response