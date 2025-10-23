"""
Authentication routes
"""

from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import timedelta
import logging

from app.core.auth import AuthManager, get_current_user, security
from app.core.config import settings
from app.models.user import (
    UserCreate, LoginRequest, LoginResponse, OAuthCallbackRequest,
    RefreshTokenRequest, UserPasswordUpdate, User
)

logger = logging.getLogger(__name__)

router = APIRouter()

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class RegisterRequest(BaseModel):
    email: EmailStr
    password: str
    full_name: str

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: dict


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


@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest):
    """Login with email and password"""
    auth_manager = AuthManager()
    
    result = await auth_manager.authenticate_user(request.email, request.password)
    
    if not result:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )
    
    # Create tokens
    access_token = auth_manager.create_access_token(
        data={"sub": result["auth_user"].id}
    )
    refresh_token = auth_manager.create_refresh_token(
        data={"sub": result["auth_user"].id}
    )
    
    return {
        "access_token": access_token,
        "refresh_token": refresh_token,
        "token_type": "bearer",
        "user": result["profile"]
    }


@router.post("/oauth/callback", response_model=LoginResponse)
async def oauth_callback(session_data: OAuthCallbackRequest):
    """Handle OAuth callback from Supabase"""
    auth_manager = AuthManager()
    
    try:
        # Extract session data from Supabase OAuth callback
        access_token = session_data.access_token
        refresh_token = session_data.refresh_token
        user_data = session_data.user
        
        if not access_token or not user_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid session data from OAuth provider"
            )
        
        # Get or create user profile in our database
        auth_user_id = user_data.get("id")
        email = user_data.get("email")
        full_name = user_data.get("user_metadata", {}).get("full_name") or user_data.get("user_metadata", {}).get("name")
        
        if not auth_user_id or not email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing required user data from OAuth provider"
            )
        
        # Check if user profile exists in our database
        user_profile = await auth_manager.db.get_user_by_auth_id(auth_user_id)
        
        if not user_profile:
            # Create new user profile
            result = await auth_manager.create_user_profile_from_oauth(
                auth_user_id=auth_user_id,
                email=email,
                full_name=full_name,
                avatar_url=user_data.get("user_metadata", {}).get("avatar_url")
            )
            if not result:
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail="Failed to create user profile"
                )
            user_profile = result
        
        # Create our own access token for the API
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        api_access_token = auth_manager.create_access_token(
            data={"sub": auth_user_id},
            expires_delta=access_token_expires
        )
        
        # Create refresh token
        api_refresh_token = auth_manager.create_refresh_token(
            data={"sub": auth_user_id}
        )
        
        return LoginResponse(
            access_token=api_access_token,
            refresh_token=api_refresh_token,
            token_type="bearer",
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=User(**user_profile)
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"OAuth callback error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="OAuth authentication failed"
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
async def logout(current_user: User = Depends(get_current_user)):
    """Logout current user"""
    return {"message": "Successfully logged out"}


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