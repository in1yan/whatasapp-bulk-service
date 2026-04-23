from typing import List

from pydantic.functional_validators import field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    APP_NAME: str = "Bulk Messaging Service"
    APP_VERSION: str = "1.0.0"
    FRONTEND_URL: str = "http://localhost:3000"
    WAHA_URL: str = "http://waha:3000/api"
    WAHA_API_KEY: str = "key"
    CORS_ORIGINS: List[str] = ["*"]

    @field_validator(
        "CORS_ORIGINS",
        mode="before",
    )
    @classmethod
    def split_comma_strings(cls, v):
        if isinstance(v, str):
            return [i.strip() for i in v.split(",")]
        return v

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", case_sensitive=True, extra="ignore"
    )


settings = Settings()
