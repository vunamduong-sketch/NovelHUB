from fastapi import FastAPI

from app.api.routers.auth import router as auth_router


app = FastAPI(
    title="NovelHub API",
    version="0.1.0",
)

app.include_router(auth_router, prefix="/api/v1")


@app.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    return {"status": "healthy"}
