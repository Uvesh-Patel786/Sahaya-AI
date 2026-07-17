from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=("../.env", ".env"), extra="ignore")

    gemini_api_key: str = ""
    gemini_model: str = "gemini-2.0-flash"
    openrouter_base_url: str = ""
    chroma_url: str = "http://localhost:8001"
    chroma_collection: str = "gov_knowledge"
    knowledge_dir: str = "knowledge"


settings = Settings()
