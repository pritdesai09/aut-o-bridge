from fastapi import APIRouter, Request, Form, UploadFile, File
from fastapi.responses import JSONResponse
from sqlalchemy.future import select
from passlib.context import CryptContext
from jose import jwt
from datetime import datetime, timedelta
import shutil, os

from models import User, Child
from config import settings

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def create_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)

def decode_token(token: str):
    try:
        return jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    except:
        return None

def get_token(request: Request):
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:]
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

@router.post("/register")
async def register(request: Request):
    from app import AsyncSessionLocal
    try:
        data = await request.json()
        full_name = data.get("full_name","").strip()
        email = data.get("email","").strip().lower()
        phone = data.get("phone","").strip()
        password = data.get("password","")
        # Safely truncate to 72 bytes
        pw_bytes = password.encode("utf-8")
        if len(pw_bytes) > 72:
            pw_bytes = pw_bytes[:72]
        pw_safe = pw_bytes.decode("utf-8", errors="ignore")
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.email == email))
            if result.scalar_one_or_none():
                return JSONResponse({"detail": "Email already registered."}, status_code=400)
            user = User(
                full_name=full_name, email=email, phone=phone,
                hashed_password=pwd_context.hash(pw_safe), language="en"
            )
            db.add(user)
            await db.commit()
            await db.refresh(user)
            token = create_token({"sub": email})
            return JSONResponse({
                "token": token,
                "user": {"id": user.id, "full_name": user.full_name, "email": user.email}
            })
    except Exception as e:
        return JSONResponse({"detail": str(e)}, status_code=500)

@router.post("/login")
async def login(request: Request):
    from app import AsyncSessionLocal
    try:
        data = await request.json()
        email = data.get("email","").strip().lower()
        password = data.get("password","")
        pw_bytes = password.encode("utf-8")
        if len(pw_bytes) > 72:
            pw_bytes = pw_bytes[:72]
        pw_safe = pw_bytes.decode("utf-8", errors="ignore")
        async with AsyncSessionLocal() as db:
            result = await db.execute(select(User).where(User.email == email))
            user = result.scalar_one_or_none()
            if not user or not pwd_context.verify(pw_safe, user.hashed_password):
                return JSONResponse({"detail": "Invalid email or password."}, status_code=401)
            token = create_token({"sub": email})
            return JSONResponse({
                "token": token,
                "user": {"id": user.id, "full_name": user.full_name, "email": user.email}
            })
    except Exception as e:
        return JSONResponse({"detail": str(e)}, status_code=500)

@router.post("/child-profile")
async def create_child(request: Request, full_name: str = Form(...), date_of_birth: str = Form(...), gender: str = Form(...), photo: UploadFile = File(None)):
    from app import AsyncSessionLocal
    user = await get_current_user(request)
    if not user:
        return JSONResponse({"detail": "Unauthorized"}, status_code=401)
    try:
        photo_path = None
        if photo and photo.filename:
            os.makedirs("static/uploads/photos", exist_ok=True)
            photo_path = f"static/uploads/photos/{user.id}_{photo.filename}"
            with open(photo_path, "wb") as f:
                shutil.copyfileobj(photo.file, f)
        async with AsyncSessionLocal() as db:
            child = Child(parent_id=user.id, full_name=full_name, date_of_birth=date_of_birth, gender=gender, photo_path=photo_path)
            db.add(child)
            await db.commit()
            await db.refresh(child)
            return JSONResponse({"id": child.id, "full_name": child.full_name})
    except Exception as e:
        return JSONResponse({"detail": str(e)}, status_code=500)