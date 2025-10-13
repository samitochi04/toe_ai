"""
Authentication routes for TOE AI Backend
"""

from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPAuthorizationCredentials
from datetime import timedelta
import logging

from app.core.auth import AuthManager, get_current_user, security
from app.core.config import settings
from app.models.user import (
    UserCreate, LoginRequest, LoginResponse, GoogleAuthRequest,
    RefreshTokenRequest, UserPasswordUpdate, User
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/register", response_model=LoginResponse, status_code=status.HTTP_201_CREATED)
async def register(user_data: UserCreate):
    """Register a new user"""
    auth_manager = AuthManager()
    
    try:
        # Register user with Supabase Auth
        result = await auth_manager.register_user(
            email=user_data.email,
            password=user_data.password,
            full_name=user_data.full_name
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Registration failed. Email might already be in use."
            )
        
        # The user profile is now created manually and returned in the result
        user_profile = result.get("profile")
        if not user_profile:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Database error saving new user"
            )
        
        # Create tokens
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth_manager.create_access_token(
            data={"sub": result["auth_user"].id},
            expires_delta=access_token_expires
        )
        refresh_token = auth_manager.create_refresh_token(
            data={"sub": result["auth_user"].id}
        )
        
        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=User(**user_profile)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Registration error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Registration failed"
        )


@router.post("/login", response_model=LoginResponse)
async def login(login_data: LoginRequest):
    """Login with email and password"""
    auth_manager = AuthManager()
    
    try:
        # Authenticate user
        result = await auth_manager.authenticate_user(
            email=login_data.email,
            password=login_data.password
        )
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Create tokens
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth_manager.create_access_token(
            data={"sub": result["auth_user"].id},
            expires_delta=access_token_expires
        )
        refresh_token = auth_manager.create_refresh_token(
            data={"sub": result["auth_user"].id}
        )
        
        return LoginResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=User(**result["profile"])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Login error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Login failed"
        )


@router.post("/google", response_model=LoginResponse)
async def google_auth(google_data: GoogleAuthRequest):
    """Login/Register with Google OAuth"""
    auth_manager = AuthManager()
    
    try:
        result = await auth_manager.sign_in_with_google(google_data.token)
        
        if not result:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Google authentication failed"
            )
        
        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth_manager.create_access_token(
            data={"sub": result["auth_user"]["sub"]},
            expires_delta=access_token_expires
        )
        
        return LoginResponse(
            access_token=access_token,
            refresh_token="",  # Google OAuth doesn't provide refresh token
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=User(**result["profile"])
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Google auth error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Google authentication failed"
        )


@router.post("/refresh")
async def refresh_token(refresh_data: RefreshTokenRequest):
    """Refresh access token"""
    auth_manager = AuthManager()
    
    try:
        tokens = await auth_manager.refresh_token(refresh_data.refresh_token)
        
        if not tokens:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        return tokens
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Token refresh error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Token refresh failed"
        )


@router.post("/logout")
async def logout(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Logout user"""
    auth_manager = AuthManager()
    
    try:
        success = await auth_manager.sign_out(credentials.credentials)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Logout failed"
            )
        
        return {"message": "Successfully logged out"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Logout error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Logout failed"
        )


@router.put("/password")
async def update_password(
    password_data: UserPasswordUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update user password"""
    auth_manager = AuthManager()
    
    try:
        # First verify current password
        auth_result = await auth_manager.authenticate_user(
            email=current_user.email,
            password=password_data.current_password
        )
        
        if not auth_result:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Current password is incorrect"
            )
        
        # Update password
        success = await auth_manager.update_password(
            user_id=str(current_user.auth_user_id),
            new_password=password_data.new_password
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Password update failed"
            )
        
        return {"message": "Password updated successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Password update error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Password update failed"
        )


@router.get("/me", response_model=User)
async def get_current_user_info(current_user: User = Depends(get_current_user)):
    """Get current user information"""
    return current_user


@router.get("/verify")
async def verify_token(current_user: User = Depends(get_current_user)):
    """Verify if token is valid"""
    return {
        "valid": True,
        "user_id": str(current_user.id),
        "email": current_user.email
    }