"""
Authentication utilities for TOE AI Backend
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
import httpx
import logging

from app.core.config import settings
from app.core.database import DatabaseManager, get_supabase
from app.models.user import User

logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Settings
ALGORITHM = "HS256"


class AuthenticationError(Exception):
    """Custom authentication error"""
    pass


class AuthManager:
    """Authentication manager"""
    
    def __init__(self):
        self.db = DatabaseManager()
        self.supabase = get_supabase()
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        """Hash password"""
        return pwd_context.hash(password)
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    def verify_token(self, token: str) -> Dict[str, Any]:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
            return payload
        except JWTError as e:
            logger.error(f"JWT verification failed: {e}")
            raise AuthenticationError("Invalid token")
    
    async def authenticate_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate user with email and password"""
        try:
            # Use Supabase Auth for authentication
            response = self.supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if response.user:
                # Get user profile
                user_profile = await self.db.get_user_by_auth_id(response.user.id)
                if user_profile:
                    return {
                        "auth_user": response.user,
                        "profile": user_profile,
                        "session": response.session
                    }
            
            return None
        except Exception as e:
            logger.error(f"Authentication failed for {email}: {e}")
            return None
    
    async def register_user(self, email: str, password: str, full_name: str) -> Optional[Dict[str, Any]]:
        """Register new user"""
        try:
            # Use Supabase Auth for registration
            response = self.supabase.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "full_name": full_name
                    }
                }
            })
            
            if response.user:
                return {
                    "auth_user": response.user,
                    "session": response.session
                }
            
            return None
        except Exception as e:
            logger.error(f"Registration failed for {email}: {e}")
            raise AuthenticationError(f"Registration failed: {e}")
    
    async def sign_in_with_google(self, token: str) -> Optional[Dict[str, Any]]:
        """Sign in with Google OAuth token"""
        try:
            # Verify Google token
            google_user = await self.verify_google_token(token)
            if not google_user:
                return None
            
            # Check if user exists
            user_profile = await self.db.get_user_by_auth_id(google_user["sub"])
            
            if user_profile:
                # User exists, create session
                return {
                    "auth_user": google_user,
                    "profile": user_profile
                }
            else:
                # New user, register with Supabase
                response = self.supabase.auth.sign_in_with_oauth({
                    "provider": "google",
                    "options": {
                        "redirect_to": settings.GOOGLE_REDIRECT_URI
                    }
                })
                
                return response
        
        except Exception as e:
            logger.error(f"Google sign-in failed: {e}")
            return None
    
    async def verify_google_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify Google OAuth token"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.get(
                    f"https://www.googleapis.com/oauth2/v3/tokeninfo?access_token={token}"
                )
                
                if response.status_code == 200:
                    user_data = response.json()
                    # Verify the token is for our app
                    if user_data.get("aud") == settings.GOOGLE_CLIENT_ID:
                        return user_data
                
            return None
        except Exception as e:
            logger.error(f"Google token verification failed: {e}")
            return None
    
    async def refresh_token(self, refresh_token: str) -> Optional[str]:
        """Refresh access token"""
        try:
            response = self.supabase.auth.refresh_session(refresh_token)
            if response.session:
                return response.session.access_token
            return None
        except Exception as e:
            logger.error(f"Token refresh failed: {e}")
            return None
    
    async def sign_out(self, token: str) -> bool:
        """Sign out user"""
        try:
            # Set token in client and sign out
            self.supabase.auth.set_session(token, "")
            response = self.supabase.auth.sign_out()
            return True
        except Exception as e:
            logger.error(f"Sign out failed: {e}")
            return False
    
    async def update_password(self, user_id: str, new_password: str) -> bool:
        """Update user password"""
        try:
            response = self.supabase.auth.update_user({
                "password": new_password
            })
            return response.user is not None
        except Exception as e:
            logger.error(f"Password update failed for user {user_id}: {e}")
            return False


# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current authenticated user"""
    auth_manager = AuthManager()
    
    try:
        # Verify token
        payload = auth_manager.verify_token(credentials.credentials)
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get user profile
        user_profile = await auth_manager.db.get_user_by_auth_id(user_id)
        if user_profile is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return User(**user_profile)
    
    except AuthenticationError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Dependency to get current user (optional)
async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[User]:
    """Get current authenticated user (optional for public endpoints)"""
    if credentials is None:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


# Dependency to check if user is admin
async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require user to be admin"""
    try:
        db = DatabaseManager()
        response = db.client.table("admin").select("*").eq("user_profile_id", current_user.id).eq("is_active", True).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        
        return current_user
    except Exception as e:
        logger.error(f"Admin check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )