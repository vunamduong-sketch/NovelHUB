from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

from app.admin.api.routers.categories import router as admin_categories_router
from app.admin.api.routers.novels import router as admin_novels_router
from app.admin.api.routers.tags import router as admin_tags_router
from app.admin.api.routers.users import router as admin_users_router
from app.api.routers.auth import router as auth_router
from app.api.routers.novels import router as novels_router
from app.api.routers.users import router as users_router
from app.api.routers.chapters import router as chapters_router
from app.core.config import settings


app = FastAPI(
    title="NovelHub API",
    version="0.1.0",
)

app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(novels_router, prefix="/api/v1")
app.include_router(chapters_router, prefix="/api/v1")
app.include_router(admin_users_router, prefix="/api/v1")
app.include_router(admin_novels_router, prefix="/api/v1")
app.include_router(admin_categories_router, prefix="/api/v1")
app.include_router(admin_tags_router, prefix="/api/v1")

avatar_root = Path(settings.avatar_upload_dir).resolve()
avatar_root.mkdir(parents=True, exist_ok=True)
avatar_public_prefix = settings.avatar_public_url_prefix.strip()
if not avatar_public_prefix.startswith("/"):
    avatar_public_prefix = f"/{avatar_public_prefix}"
app.mount(avatar_public_prefix.rstrip("/"), StaticFiles(directory=str(avatar_root)), name="avatars")


@app.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    return {"status": "healthy"}
