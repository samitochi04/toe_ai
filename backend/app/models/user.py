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
    phone: Optional[str] = Field(None, max_length=20)
    alias: str = Field(..., min_length=3, max_length=255)
    
    @validator('phone', 'bio', 'profile_picture_url', pre=True)
    def empty_str_to_none(cls, v):
        """Convert empty strings to None for optional fields"""
        if v == "":
            return None
        return v


class UserCreate(BaseModel):
    """User creation model"""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=255)
    alias: Optional[str] = Field(None, min_length=3, max_length=255)
    bio: Optional[str] = Field(None, max_length=500)
    profile_picture_url: Optional[str] = None
    phone: Optional[str] = Field(None, max_length=20)
    
    @validator('alias', pre=True, always=True)
    def generate_alias_if_missing(cls, v, values):
        """Auto-generate alias from full_name if not provided"""
        if v is None or v == "":
            # Generate alias from full_name (remove spaces, lowercase)
            full_name = values.get('full_name', '')
            if full_name:
                # Create alias from full_name: remove spaces, special chars, lowercase
                import re
                alias = re.sub(r'[^a-zA-Z0-9]', '', full_name).lower()
                # If alias is too short, use email prefix
                if len(alias) < 3:
                    email = values.get('email', '')
                    if email:
                        alias = email.split('@')[0].lower()
                return alias[:255]  # Limit to max length
            return "user"  # Fallback
        return v
    
    @validator('phone', 'bio', 'profile_picture_url', pre=True)
    def empty_str_to_none(cls, v):
        """Convert empty strings to None for optional fields"""
        if v == "":
            return None
        return v
    
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
    """User profile update model"""
    full_name: Optional[str] = Field(None, min_length=1, max_length=255)
    bio: Optional[str] = Field(None, max_length=1000)
    phone: Optional[str] = Field(None, max_length=20)  # Added phone field
    profile_picture_url: Optional[str] = None
    
    @validator('phone', 'bio', 'profile_picture_url', pre=True)
    def empty_str_to_none(cls, v):
        """Convert empty strings to None for optional fields"""
        if v == "":
            return None
        return v
    
    @validator('full_name', pre=True)
    def validate_full_name(cls, v):
        """Validate full_name is not empty if provided"""
        if v is not None and v.strip() == "":
            raise ValueError('Full name cannot be empty')
        return v


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
    """User model with all fields"""
    id: UUID
    auth_user_id: UUID
    profile_picture_url: Optional[str] = None
    bio: Optional[str] = None
    phone: Optional[str] = None  # Added phone field
    created_at: datetime
    updated_at: datetime
    is_active: bool = True
    
    class Config:
        from_attributes = True


class UserProfile(User):
    """Extended user profile with usage and subscription"""
    usage: Optional[Dict[str, Any]] = None
    subscription: Optional[Dict[str, Any]] = None


class OAuthCallbackRequest(BaseModel):
    """OAuth callback request model"""
    access_token: str
    refresh_token: Optional[str] = None
    user: Dict[str, Any]


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
    current_month_usage: Optional[Dict[str, Any]]
    subscription_info: Optional[Dict[str, Any]]
    api_usage_summary: Dict[str, Any]


class UserSearchResult(BaseModel):
    """User search result for sharing"""
    id: UUID
    alias: str
    full_name: str
    profile_picture_url: Optional[str] = None
    created_at: datetime
    
    class Config:
        from_attributes = True