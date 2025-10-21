"""
Payment models for TOE AI Backend
"""

from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from uuid import UUID


class PaymentMethodBase(BaseModel):
    """Base payment method model"""
    card_brand: str
    card_last4: str = Field(..., min_length=4, max_length=4)
    card_exp_month: int = Field(..., ge=1, le=12)
    card_exp_year: int = Field(..., ge=2024)
    cardholder_name: Optional[str] = None
    is_default: bool = False


class PaymentMethodCreate(BaseModel):
    """Payment method creation model"""
    stripe_payment_method_id: str


class PaymentMethodUpdate(BaseModel):
    """Payment method update model"""
    cardholder_name: Optional[str] = None
    is_default: Optional[bool] = None


class PaymentMethod(PaymentMethodBase):
    """Payment method response model"""
    id: UUID
    user_profile_id: UUID
    stripe_payment_method_id: str
    is_active: bool = True
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class SetupIntentResponse(BaseModel):
    """Setup intent response for adding payment methods"""
    client_secret: str
    setup_intent_id: str
