from pathlib import Path
from urllib.parse import urlparse
import uuid

from fastapi import UploadFile

from app.core.config import Settings


class AvatarValidationError(Exception):
    pass


class AvatarTooLargeError(AvatarValidationError):
    pass


class UnsupportedAvatarTypeError(AvatarValidationError):
    pass


class AvatarStorageError(Exception):
    pass


class AvatarStorage:
    CONTENT_TYPE_TO_EXTENSION = {
        "image/jpeg": ".jpg",
        "image/png": ".png",
        "image/webp": ".webp",
    }

    def __init__(self, settings: Settings) -> None:
        public_prefix = settings.avatar_public_url_prefix.strip()
        if not public_prefix.startswith("/"):
            public_prefix = f"/{public_prefix}"
        self.public_prefix = public_prefix.rstrip("/")
        self.max_size_bytes = settings.avatar_max_size_bytes
        self.root = Path(settings.avatar_upload_dir).resolve()
        self.root.mkdir(parents=True, exist_ok=True)

    def save_upload(self, user_id: str, upload: UploadFile) -> tuple[str, Path]:
        extension = self._extension_for_content_type(upload.content_type)
        file_name = f"{user_id}-{uuid.uuid4().hex}{extension}"
        file_path = (self.root / file_name).resolve()
        if file_path.parent != self.root:
            raise AvatarStorageError("Invalid avatar path")

        total_bytes = 0
        try:
            with file_path.open("wb") as output:
                while True:
                    chunk = upload.file.read(1024 * 1024)
                    if not chunk:
                        break
                    total_bytes += len(chunk)
                    if total_bytes > self.max_size_bytes:
                        raise AvatarTooLargeError("Avatar file is too large")
                    output.write(chunk)
        except AvatarValidationError:
            self.delete_file(file_path)
            raise
        except OSError as exc:
            self.delete_file(file_path)
            raise AvatarStorageError("Failed to save avatar file") from exc

        if total_bytes == 0:
            self.delete_file(file_path)
            raise AvatarValidationError("Avatar file is empty")

        return f"{self.public_prefix}/{file_name}", file_path

    def delete_file(self, file_path: Path) -> None:
        try:
            if file_path.exists() and file_path.is_file():
                file_path.unlink()
        except OSError:
            # Do not block user flows on best-effort cleanup failures.
            return

    def delete_if_managed_url(self, avatar_url: str | None) -> None:
        managed_path = self.managed_path_from_url(avatar_url)
        if managed_path is None:
            return
        self.delete_file(managed_path)

    def managed_path_from_url(self, avatar_url: str | None) -> Path | None:
        if not avatar_url:
            return None

        parsed_path = urlparse(avatar_url).path or avatar_url
        prefix = f"{self.public_prefix}/"
        if not parsed_path.startswith(prefix):
            return None

        file_name = parsed_path[len(prefix):]
        if not file_name or "/" in file_name or "\\" in file_name:
            return None

        candidate = (self.root / file_name).resolve()
        if candidate.parent != self.root:
            return None
        return candidate

    def _extension_for_content_type(self, content_type: str | None) -> str:
        if content_type is None:
            raise UnsupportedAvatarTypeError("Missing avatar content type")
        extension = self.CONTENT_TYPE_TO_EXTENSION.get(content_type.lower())
        if extension is None:
            raise UnsupportedAvatarTypeError("Unsupported avatar file type")
        return extension
