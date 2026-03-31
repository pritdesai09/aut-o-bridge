import os
from dotenv import load_dotenv

load_dotenv()

class Settings:
    APP_NAME: str = "Aut-o-Bridge"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "aut-o-bridge-super-secret-key-2024")
    DATABASE_URL: str = "sqlite+aiosqlite:///./autbridge.db"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    UPLOAD_DIR: str = "static/uploads"
    SUPPORTED_LANGUAGES: list = ["en", "hi", "mr"]
    DEFAULT_LANGUAGE: str = "en"

settings = Settings()