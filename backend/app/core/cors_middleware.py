"""
Custom CORS middleware to ensure all responses have proper CORS headers
"""
from starlette.middleware.base import BaseHTTPMiddleware
from fastapi import Request
from starlette.responses import Response

class AllowAllCORSMiddleware(BaseHTTPMiddleware):
    """
    Middleware to add CORS headers to all responses during development
    Should be disabled in production with proper CORS configuration
    """
    async def dispatch(self, request: Request, call_next):
        # Process the request
        response = await call_next(request)
        
        # Add CORS headers to all responses
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS, PATCH"
        response.headers["Access-Control-Allow-Headers"] = "*"
        
        return response
