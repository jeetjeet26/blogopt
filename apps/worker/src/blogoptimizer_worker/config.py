from pydantic import AnyHttpUrl, Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    supabase_url: AnyHttpUrl = Field(alias="SUPABASE_URL")
    supabase_service_role_key: str = Field(alias="SUPABASE_SERVICE_ROLE_KEY")
    worker_api_token: str = Field(default="dev-worker-token", alias="WORKER_API_TOKEN")
    openai_api_key: str = Field(alias="OPENAI_API_KEY")
    openai_model: str = Field(default="gpt-5", alias="OPENAI_MODEL")
    semrush_api_key: str | None = Field(default=None, alias="SEMRUSH_API_KEY")
    screaming_frog_api_url: AnyHttpUrl | None = Field(default=None, alias="SCREAMING_FROG_API_URL")
    screaming_frog_api_key: str | None = Field(default=None, alias="SCREAMING_FROG_API_KEY")
    web_search_api_url: AnyHttpUrl | None = Field(default=None, alias="WEB_SEARCH_API_URL")
    web_search_api_key: str | None = Field(default=None, alias="WEB_SEARCH_API_KEY")


settings = Settings()
