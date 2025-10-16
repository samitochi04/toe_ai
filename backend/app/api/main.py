"""
Main API Router for TOE AI Backend
"""

from fastapi import APIRouter

# Import route modules
from app.api.routes import auth, users, chats, ai, payments, sharing, admin
from app.api.routes import files  # Add this import

# Create main API router
api_router = APIRouter()

# Include all route modules
api_router.include_router(auth.router, prefix="/auth", tags=["Authentication"])
api_router.include_router(users.router, prefix="/users", tags=["Users"])
api_router.include_router(chats.router, prefix="/chats", tags=["Chats"])
api_router.include_router(ai.router, prefix="/ai", tags=["AI"])
api_router.include_router(payments.router, prefix="/payments", tags=["Payments"])
api_router.include_router(sharing.router, prefix="/share", tags=["Sharing"])
api_router.include_router(admin.router, prefix="/admin", tags=["Admin"])
api_router.include_router(files.router, prefix="/files", tags=["Files"])  # Add this line