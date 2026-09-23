from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.core.config import settings
from app.api import chat, documents, workflows, analytics, auth

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# CORS Middleware to allow requests from frontend Vite dev server (ports 5173, 3000, 8501, etc.)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register API Routers (Support both '/api' and root prefixes for seamless Vercel / proxy routing)
for prefix in [settings.API_V1_STR, ""]:
    app.include_router(auth.router, prefix=f"{prefix}/auth" if prefix else "/auth", tags=["auth"])
    app.include_router(chat.router, prefix=f"{prefix}/chat" if prefix else "/chat", tags=["chat"])
    app.include_router(documents.router, prefix=f"{prefix}/documents" if prefix else "/documents", tags=["documents"])
    app.include_router(workflows.router, prefix=f"{prefix}/workflows" if prefix else "/workflows", tags=["workflows"])
    app.include_router(analytics.router, prefix=f"{prefix}/analytics" if prefix else "/analytics", tags=["analytics"])

@app.get("/health")
async def health_check():
    return {
        "status": "online",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "engine": "Azure OpenAI GPT-4.1 + Supabase Vector"
    }

@app.get("/")
async def root():
    return {
        "message": "KnowledgeX API Server running.",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }
