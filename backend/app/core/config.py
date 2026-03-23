# Environment variables loader
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    database_url: str = ""
    secret_key: str = ""
    cf_account_id: str = ""
    cf_kv_namespace_id: str = ""
    cf_api_token: str = ""

    class Config:
        env_file = ".env"

settings = Settings()
