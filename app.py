from fastapi import FastAPI, Request
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from fastapi.responses import HTMLResponse, RedirectResponse
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
import os

from config import settings
from models import Base
from routes import auth, diagnosis, consultation, communication, dashboard

app = FastAPI(title="Aut-o-Bridge", version="1.0.0")

app.mount("/static", StaticFiles(directory="static"), name="static")
templates = Jinja2Templates(directory="templates")

engine = create_async_engine(settings.DATABASE_URL, echo=False)
AsyncSessionLocal = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)

async def get_db():
    async with AsyncSessionLocal() as session:
        yield session

@app.on_event("startup")
async def startup():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    os.makedirs("static/uploads", exist_ok=True)

app.include_router(auth.router, prefix="/auth", tags=["Auth"])
app.include_router(diagnosis.router, prefix="/diagnosis", tags=["Diagnosis"])
app.include_router(consultation.router, prefix="/consultation", tags=["Consultation"])
app.include_router(communication.router, prefix="/communication", tags=["Communication"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard"])

@app.get("/", response_class=HTMLResponse)
async def root(request: Request):
    return templates.TemplateResponse(request, "landing.html")