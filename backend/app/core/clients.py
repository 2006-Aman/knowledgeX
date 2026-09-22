import os
from pathlib import Path
from dotenv import load_dotenv
from typing import Optional
from supabase import create_client, Client
from openai import AzureOpenAI
from app.core.config import settings

_supabase_admin_instance: Optional[Client] = None

def get_supabase_client() -> Client:
    return create_client(settings.SUPABASE_URL, settings.SUPABASE_KEY)

def get_supabase_admin_client() -> Optional[Client]:
    global _supabase_admin_instance
    if _supabase_admin_instance is not None:
        return _supabase_admin_instance

    # Reload .env to capture runtime updates to service role key
    env_path = Path(__file__).resolve().parent.parent.parent / ".env"
    load_dotenv(dotenv_path=env_path, override=True)

    key = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "").strip() or getattr(settings, "SUPABASE_SERVICE_ROLE_KEY", "").strip()
    url = os.getenv("SUPABASE_URL", "").strip() or settings.SUPABASE_URL
    if key and url:
        try:
            _supabase_admin_instance = create_client(url, key)
            return _supabase_admin_instance
        except Exception as e:
            print(f"Notice: Failed to initialize Supabase admin client: {e}")
            return None
    return None

def get_azure_client() -> AzureOpenAI:
    return AzureOpenAI(
        azure_endpoint=settings.AZURE_ENDPOINT,
        api_key=settings.AZURE_API_KEY,
        api_version=settings.AZURE_API_VERSION
    )

# Shared singleton client instances
supabase: Client = get_supabase_client()
azure_openai: AzureOpenAI = get_azure_client()
