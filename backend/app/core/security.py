import base64
import hashlib
import hmac
import json
import secrets
from datetime import datetime, timedelta, timezone
from typing import Any

from app.core.config import Settings

_PASSWORD_HASH_ITERATIONS = 600_000


def _b64encode(value: bytes) -> str:
    return base64.urlsafe_b64encode(value).rstrip(b"=").decode("ascii")


def _b64decode(value: str) -> bytes:
    return base64.urlsafe_b64decode(value + "=" * (-len(value) % 4))


def _digest_for(algorithm: str) -> str:
    digests = {
        "HS256": "sha256",
        "HS384": "sha384",
        "HS512": "sha512",
    }
    if algorithm not in digests:
        raise ValueError("Unsupported JWT algorithm")
    return digests[algorithm]


def _encode_token(payload: dict[str, Any], settings: Settings) -> str:
    header = _b64encode(json.dumps({"alg": settings.jwt_algorithm, "typ": "JWT"}, separators=(",", ":")).encode())
    body = _b64encode(json.dumps(payload, separators=(",", ":")).encode())
    unsigned = f"{header}.{body}"
    signature = hmac.new(settings.jwt_secret_key.encode(), unsigned.encode(), _digest_for(settings.jwt_algorithm)).digest()
    return f"{unsigned}.{_b64encode(signature)}"


def _decode_token(token: str, settings: Settings) -> dict[str, Any]:
    try:
        header_part, body_part, signature_part = token.split(".")
        header = json.loads(_b64decode(header_part))
        payload = json.loads(_b64decode(body_part))
        if header.get("alg") != settings.jwt_algorithm:
            raise ValueError("Invalid token")
        expected = hmac.new(
            settings.jwt_secret_key.encode(),
            f"{header_part}.{body_part}".encode(),
            _digest_for(settings.jwt_algorithm),
        ).digest()
        if not hmac.compare_digest(expected, _b64decode(signature_part)):
            raise ValueError("Invalid token")
        if not isinstance(payload, dict) or float(payload["exp"]) < datetime.now(timezone.utc).timestamp():
            raise ValueError("Invalid or expired token")
        return payload
    except (KeyError, TypeError, ValueError, json.JSONDecodeError, UnicodeDecodeError) as exc:
        raise ValueError("Invalid or expired token") from exc


def hash_password(password: str) -> str:
    salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac(
        "sha256",
        password.encode("utf-8"),
        salt,
        _PASSWORD_HASH_ITERATIONS,
    )
    return "$".join(
        (
            "pbkdf2_sha256",
            str(_PASSWORD_HASH_ITERATIONS),
            _b64encode(salt),
            _b64encode(digest),
        )
    )


def verify_password(password: str, password_hash: str) -> bool:
    try:
        algorithm, iterations_text, encoded_salt, encoded_digest = password_hash.split("$", 3)
        iterations = int(iterations_text)
        if algorithm != "pbkdf2_sha256" or iterations <= 0:
            return False
        salt = _b64decode(encoded_salt)
        expected = _b64decode(encoded_digest)
        actual = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
        return hmac.compare_digest(actual, expected)
    except (TypeError, ValueError, UnicodeError):
        return False


def create_access_token(subject: str, roles: list[str], settings: Settings) -> tuple[str, datetime]:
    expires_at = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    token = _encode_token({"sub": subject, "roles": roles, "type": "access", "exp": expires_at.timestamp()}, settings)
    return token, expires_at


def create_reset_token(subject: str, settings: Settings) -> str:
    issued_at = datetime.now(timezone.utc)
    expires_at = issued_at + timedelta(minutes=settings.password_reset_expire_minutes)
    return _encode_token(
        {"sub": subject, "type": "password_reset", "iat": issued_at.timestamp(), "issued_at_exact": issued_at.timestamp(), "exp": expires_at.timestamp(), "jti": secrets.token_urlsafe(16)},
        settings,
    )


def decode_token(token: str, expected_type: str, settings: Settings) -> dict[str, Any]:
    try:
        payload = _decode_token(token, settings)
    except ValueError as exc:
        raise ValueError("Invalid or expired token") from exc
    if payload.get("type") != expected_type or not isinstance(payload.get("sub"), str):
        raise ValueError("Invalid token")
    return payload


def create_refresh_token() -> str:
    return secrets.token_urlsafe(48)


def hash_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
