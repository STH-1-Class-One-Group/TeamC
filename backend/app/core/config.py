# Environment variables loader
from pathlib import Path
from urllib.parse import urlparse

from pydantic import field_validator, model_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


BACKEND_ENV_PATH = Path(__file__).resolve().parents[2] / ".env"


def infer_supabase_url(database_url: str) -> str:
    if not database_url:
        return ""

    parsed = urlparse(database_url)
    hostname = parsed.hostname or ""
    prefix = "db."
    suffix = ".supabase.co"

    if hostname.startswith(prefix) and hostname.endswith(suffix):
        project_ref = hostname[len(prefix) : -len(suffix)]
        if project_ref:
            return f"https://{project_ref}.supabase.co"

    return ""


class Settings(BaseSettings):
    database_url: str = ""
    secret_key: str = ""
    cf_account_id: str = ""
    cf_kv_namespace_id: str = ""
    cf_api_token: str = ""

    # Naver API
    naver_client_id: str = ""
    naver_client_secret: str = ""

    # Supabase
    supabase_url: str = ""
    supabase_anon_key: str = ""
    supabase_service_role_key: str = ""

    model_config = SettingsConfigDict(
        env_file=str(BACKEND_ENV_PATH),
        extra="ignore",
    )

    @field_validator("*", mode="before")
    @classmethod
    def clean_string_value(cls, value: str) -> str:
        if isinstance(value, str):
            return value.strip()
        return value

    @model_validator(mode="after")
    def populate_derived_settings(self) -> "Settings":
        if not self.supabase_url:
            self.supabase_url = infer_supabase_url(self.database_url)
        return self


settings = Settings()
