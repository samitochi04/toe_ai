"""
User models for TOE AI Backend
"""

from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID
import re


class UserBase(BaseModel):
    """Base user model"""
    email: EmailStr
    full_name: str = Field(..., min_length=1, max_length=255)
    bio: Optional[str] = Field(None, max_length=500)
    profile_picture_url: Optional[str] = None


class UserCreate(UserBase):
    """User creation model"""
    password: str = Field(..., min_length=8, max_length=128)
    
    @validator('password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('Password must contain at least one letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v


class UserUpdate(BaseModel):
    """User update model"""
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    bio: Optional[str] = Field(None, max_length=500)
    profile_picture_url: Optional[str] = None


class UserPasswordUpdate(BaseModel):
    """User password update model"""
    current_password: str
    new_password: str = Field(..., min_length=8, max_length=128)
    
    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('Password must contain at least one letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one digit')
        return v


class User(UserBase):
    """User response model"""
    id: UUID
    auth_user_id: UUID
    alias: str
    created_at: datetime
    updated_at: datetime
    is_active: bool = True
    
    class Config:
        from_attributes = True


class UserProfile(User):
    """Extended user profile model"""
    usage: Optional[Dict[str, Any]] = None
    subscription: Optional[Dict[str, Any]] = None


class GoogleAuthRequest(BaseModel):
    """Google OAuth authentication request"""
    token: str


class LoginRequest(BaseModel):
    """Login request model"""
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    """Login response model"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: User


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str


class UsageTracking(BaseModel):
    """Usage tracking model"""
    id: UUID
    user_profile_id: UUID
    interview_chats_used: int = 0
    normal_chats_used: int = 0
    reset_date: datetime
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SubscriptionTier(BaseModel):
    """Subscription tier model"""
    id: UUID
    name: str
    price_monthly: float
    interview_chat_limit: int
    normal_chat_limit: int
    features: Dict[str, Any]
    is_active: bool = True
    created_at: datetime
    
    class Config:
        from_attributes = True


class UserSubscription(BaseModel):
    """User subscription model"""
    id: UUID
    user_profile_id: UUID
    tier_id: UUID
    stripe_customer_id: Optional[str] = None
    stripe_subscription_id: Optional[str] = None
    status: str = "free"
    current_period_start: Optional[datetime] = None
    current_period_end: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    tier: Optional[SubscriptionTier] = None
    
    class Config:
        from_attributes = True


class AdminUser(BaseModel):
    """Admin user model"""
    id: UUID
    user_profile_id: UUID
    role: str = "admin"
    permissions: Dict[str, Any] = {}
    created_at: datetime
    created_by: Optional[UUID] = None
    is_active: bool = True
    user_profile: Optional[User] = None
    
    class Config:
        from_attributes = True


class UserStats(BaseModel):
    """User statistics model"""
    total_normal_chats: int
    total_interview_chats: int
    total_shared_chats: int
    current_month_usage: UsageTracking
    subscription_info: UserSubscription
    api_usage_summary: Dict[str, Any]


class UserSearchResult(BaseModel):
    """User search result for sharing"""
    id: UUID
    alias: str
    full_name: str
    profile_picture_url: Optional[str] = None
    created_at: datetime