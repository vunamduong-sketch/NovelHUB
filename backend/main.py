from fastapi import FastAPI


app = FastAPI(
    title="NovelHub API",
    version="0.1.0",
)


@app.get("/health", tags=["system"])
def health_check() -> dict[str, str]:
    return {"status": "healthy"}
