import os
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = BASE_DIR.parent
INSTANCE_DIR = BASE_DIR / "instance"
INSTANCE_DIR.mkdir(parents=True, exist_ok=True)

class Config:
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-secret-key-change-in-production-microtask-2026")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "dev-jwt-secret-key-change-in-production-2026")
    JWT_ACCESS_TOKEN_EXPIRES_HOURS = int(os.environ.get("JWT_EXPIRES_HOURS", 24))
    DATABASE_PATH = os.environ.get("DATABASE_PATH", str(INSTANCE_DIR / "microtask.db"))
    CORS_ORIGINS = os.environ.get("CORS_ORIGINS", "http://localhost:5173,http://127.0.0.1:5173,http://localhost:3000").split(",")
    TESTING = False

class TestConfig(Config):
    TESTING = True
    DATABASE_PATH = ":memory:"
    JWT_SECRET_KEY = "test-jwt-secret-key-at-least-32-bytes-long-super-secure!"
