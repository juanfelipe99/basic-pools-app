from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    DATABASE_URL: str = "sqlite:///./polls.db"
    CORS_ORIGINS: str = "http://localhost:5173,http://localhost:5174"
    IP_HASH_SECRET: str = "change-me"
    STATIC_DIR: str = ""

    @property
    def cors_origins_list(self) -> list[str]:
        return [origin.strip() for origin in self.CORS_ORIGINS.split(",") if origin.strip()]

    @property
    def static_dir(self) -> Path | None:
        if self.STATIC_DIR:
            path = Path(self.STATIC_DIR)
            return path if path.is_dir() else None
        here = Path(__file__).resolve()
        for candidate in (here.parents[2] / "static", here.parents[3] / "frontend" / "dist"):
            if candidate.is_dir():
                return candidate
        return None


settings = Settings()
