"""
Newsletter and Contact form routes for TOE AI Backend
"""

from fastapi import APIRouter, HTTPException, Depends, status, Request
from typing import Optional
import logging
from datetime import datetime
from pydantic import BaseModel, EmailStr, validator
import ipaddress

from app.core.database import DatabaseManager
from app.core.config import settings

logger = logging.getLogger(__name__)

router = APIRouter()


# ================================================
# MODELS
# ================================================

class NewsletterSubscription(BaseModel):
    name: str
    email: EmailStr
    language: Optional[str] = "en"
    
    @validator('name')
    def validate_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters long')
        if len(v) > 255:
            raise ValueError('Name must be less than 255 characters')
        return v.strip()


class ContactSubmission(BaseModel):
    name: str
    email: EmailStr
    subject: Optional[str] = None
    message: str
    language: Optional[str] = "en"
    
    @validator('name')
    def validate_name(cls, v):
        if not v or len(v.strip()) < 2:
            raise ValueError('Name must be at least 2 characters long')
        if len(v) > 255:
            raise ValueError('Name must be less than 255 characters')
        return v.strip()
    
    @validator('message')
    def validate_message(cls, v):
        if not v or len(v.strip()) < 10:
            raise ValueError('Message must be at least 10 characters long')
        if len(v) > 5000:
            raise ValueError('Message must be less than 5000 characters')
        return v.strip()
    
    @validator('subject')
    def validate_subject(cls, v):
        if v and len(v) > 500:
            raise ValueError('Subject must be less than 500 characters')
        return v.strip() if v else None


# ================================================
# NEWSLETTER ROUTES
# ================================================

@router.post("/newsletter/subscribe")
async def subscribe_newsletter(
    subscription: NewsletterSubscription,
    request: Request
):
    """Subscribe to newsletter"""
    db = DatabaseManager(use_service_role=True)
    
    try:
        # Get client IP and user agent
        client_ip = request.client.host
        user_agent = request.headers.get("user-agent", "")
        
        # Validate IP address format
        try:
            ipaddress.ip_address(client_ip)
        except ValueError:
            client_ip = None
        
        # Check if email already exists
        existing = (
            db.client.table("newsletter_subscriptions")
            .select("id, is_active")
            .eq("email", subscription.email)
            .execute()
        )
        
        if existing.data:
            # If already subscribed and active, return success
            if existing.data[0].get("is_active", False):
                return {
                    "message": "Email already subscribed to newsletter",
                    "status": "already_subscribed"
                }
            else:
                # Reactivate subscription
                response = (
                    db.client.table("newsletter_subscriptions")
                    .update({
                        "is_active": True,
                        "name": subscription.name,
                        "language": subscription.language,
                        "ip_address": client_ip,
                        "user_agent": user_agent,
                        "updated_at": datetime.utcnow().isoformat()
                    })
                    .eq("email", subscription.email)
                    .execute()
                )
                
                return {
                    "message": "Newsletter subscription reactivated successfully",
                    "status": "reactivated"
                }
        
        # Create new subscription
        response = (
            db.client.table("newsletter_subscriptions")
            .insert({
                "name": subscription.name,
                "email": subscription.email,
                "language": subscription.language,
                "ip_address": client_ip,
                "user_agent": user_agent,
                "source": "about_page"
            })
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to subscribe to newsletter"
            )
        
        logger.info(f"Newsletter subscription created: {subscription.email}")
        
        return {
            "message": "Successfully subscribed to newsletter",
            "status": "subscribed"
        }
        
    except Exception as e:
        logger.error(f"Newsletter subscription error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to subscribe to newsletter"
        )


@router.post("/newsletter/unsubscribe")
async def unsubscribe_newsletter(email: EmailStr):
    """Unsubscribe from newsletter"""
    db = DatabaseManager(use_service_role=True)
    
    try:
        response = (
            db.client.table("newsletter_subscriptions")
            .update({"is_active": False})
            .eq("email", email)
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Email not found in newsletter subscriptions"
            )
        
        return {
            "message": "Successfully unsubscribed from newsletter",
            "status": "unsubscribed"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Newsletter unsubscribe error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to unsubscribe from newsletter"
        )


# ================================================
# CONTACT FORM ROUTES
# ================================================

@router.post("/contact/submit")
async def submit_contact_form(
    contact: ContactSubmission,
    request: Request
):
    """Submit contact form"""
    db = DatabaseManager(use_service_role=True)
    
    try:
        # Get client IP and user agent
        client_ip = request.client.host
        user_agent = request.headers.get("user-agent", "")
        
        # Validate IP address format
        try:
            ipaddress.ip_address(client_ip)
        except ValueError:
            client_ip = None
        
        # Create contact submission
        response = (
            db.client.table("contact_submissions")
            .insert({
                "name": contact.name,
                "email": contact.email,
                "subject": contact.subject,
                "message": contact.message,
                "language": contact.language,
                "ip_address": client_ip,
                "user_agent": user_agent
            })
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to submit contact form"
            )
        
        logger.info(f"Contact form submitted: {contact.email} - {contact.subject}")
        
        return {
            "message": "Contact form submitted successfully",
            "status": "submitted",
            "id": response.data[0]["id"]
        }
        
    except Exception as e:
        logger.error(f"Contact form submission error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to submit contact form"
        )