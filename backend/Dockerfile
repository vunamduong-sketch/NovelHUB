FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1
ENV AVATAR_UPLOAD_DIR=/app/uploads/avatars

WORKDIR /app

RUN addgroup --system novelhub \
    && adduser --system --ingroup novelhub novelhub

RUN mkdir -p /app/uploads/avatars \
    && chown -R novelhub:novelhub /app/uploads

COPY requirements.txt .
RUN pip install --upgrade pip \
    && pip install -r requirements.txt

COPY --chown=novelhub:novelhub . .

USER novelhub

EXPOSE 8000

CMD ["sh", "-c", "alembic upgrade head && uvicorn main:app --host 0.0.0.0 --port 8000"]

