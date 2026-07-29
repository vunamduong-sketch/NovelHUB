"""Runs against an explicitly supplied disposable PostgreSQL database."""
import os
import uuid

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import delete

if not os.getenv("NOVELHUB_TEST_DATABASE_URL"):
    pytest.skip("Set NOVELHUB_TEST_DATABASE_URL to run PostgreSQL integration tests", allow_module_level=True)

os.environ["DATABASE_URL"] = os.environ["NOVELHUB_TEST_DATABASE_URL"]

from app.database.session import SessionLocal  # noqa: E402
from main import app  # noqa: E402
from app.models.user import User  # noqa: E402


@pytest.fixture
def api():
    email = f"auth-{uuid.uuid4().hex}@example.com"
    with TestClient(app) as test_client:
        yield test_client, email
    with SessionLocal() as session:
        session.execute(delete(User).where(User.email == email))
        session.commit()


def test_register_login_refresh_logout_and_reset_password(api) -> None:
    client, email = api
    password = "StrongPassword1!"
    register = client.post("/api/v1/auth/register", json={"email": email, "username": f"reader{uuid.uuid4().hex[:12]}", "password": password})
    assert register.status_code == 201
    assert register.json()["roles"] == ["reader"]
    assert client.post("/api/v1/auth/register", json={"email": email, "username": "anotherreader", "password": password}).status_code == 409

    login = client.post("/api/v1/auth/login", json={"identity": email, "password": password})
    assert login.status_code == 200
    refresh_token = login.json()["refresh_token"]
    refreshed = client.post("/api/v1/auth/refresh", json={"refresh_token": refresh_token})
    assert refreshed.status_code == 200
    assert client.post("/api/v1/auth/logout", json={"refresh_token": refreshed.json()["refresh_token"]}).status_code == 200
    assert client.post("/api/v1/auth/refresh", json={"refresh_token": refreshed.json()["refresh_token"]}).status_code == 401

    reset = client.post("/api/v1/auth/password-reset/request", json={"email": email})
    assert reset.status_code == 202
    token = reset.json()["debug_reset_token"]
    assert token
    assert client.post("/api/v1/auth/password-reset/confirm", json={"token": token, "new_password": "ChangedPassword1!"}).status_code == 200
    assert client.post("/api/v1/auth/login", json={"identity": email, "password": "ChangedPassword1!"}).status_code == 200
