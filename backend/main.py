"""
TOE AI - TopOneEmployee AI Interview Application
FastAPI Backend Main Application
"""

from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer
from fastapi.staticfiles import StaticFiles
import os
from contextlib import asynccontextmanager

from app.core.config import settings
from app.core.database import init_db
from app.api.main import api_router
from app.core.cors_middleware import AllowAllCORSMiddleware  # Import the custom CORS middleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    print("🚀 Starting TOE AI Backend...")
    await init_db()
    print("✅ Database initialized")
    
    yield
    
    # Shutdown
    print("👋 Shutting down TOE AI Backend...")


# Create FastAPI app
app = FastAPI(
    title="TOE AI Backend",
    description="TopOneEmployee AI Interview Application Backend API",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
    lifespan=lifespan
)

# Security
security = HTTPBearer()

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,  # Changed from settings.ALLOWED_ORIGINS
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=600,  # Cache preflight results for 10 minutes
)

# Add the custom CORS middleware for development mode only
if settings.ENVIRONMENT == "development":
    app.add_middleware(AllowAllCORSMiddleware)

# Serve static files (for audio files, profile pictures, etc.)
if not os.path.exists("static"):
    os.makedirs("static")
    os.makedirs("static/uploads", exist_ok=True)
    os.makedirs("static/uploads/audio", exist_ok=True)
    os.makedirs("static/uploads/images", exist_ok=True)
    os.makedirs("static/uploads/pdfs", exist_ok=True)

app.mount("/static", StaticFiles(directory="static"), name="static")

# Add middleware for CORS on static files
@app.middleware("http")
async def add_cors_header(request, call_next):
    response = await call_next(request)
    if request.url.path.startswith("/static"):
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "*"
    return response


# Include API router
app.include_router(api_router, prefix="/api/v1")


@app.get("/")
async def root():
    """Root endpoint - Health check"""
    return {
        "message": "TOE AI Backend is running!",
        "version": "1.0.0",
        "status": "healthy",
        "environment": settings.ENVIRONMENT
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": "2024-01-01T00:00:00Z",
        "version": "1.0.0"
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True if settings.ENVIRONMENT == "development" else False
    )