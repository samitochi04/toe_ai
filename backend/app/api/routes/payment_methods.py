"""
Payment methods routes for TOE AI Backend
"""

from fastapi import APIRouter, HTTPException, Depends, status
from typing import List
import logging
import stripe

from app.core.auth import get_current_user
from app.core.database import DatabaseManager
from app.core.config import settings
from app.models.user import User
from app.models.payment import (
    PaymentMethod,
    PaymentMethodCreate,
    PaymentMethodUpdate,
    SetupIntentResponse
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Configure Stripe
stripe.api_key = settings.STRIPE_SECRET_KEY


@router.post("/setup-intent", response_model=SetupIntentResponse)
async def create_setup_intent(
    current_user: User = Depends(get_current_user)
):
    """Create a setup intent for adding a new payment method"""
    db = DatabaseManager()
    
    try:
        # Get or create Stripe customer
        subscription = await db.get_user_subscription(str(current_user.id))
        
        customer_id = None
        if subscription and subscription.get("stripe_customer_id"):
            customer_id = subscription["stripe_customer_id"]
        else:
            # Create new customer
            customer = stripe.Customer.create(
                email=current_user.email,
                name=current_user.full_name,
                metadata={"user_id": str(current_user.id)}
            )
            customer_id = customer.id
            
            # Update subscription with customer ID
            if subscription:
                db.client.table("user_subscriptions").update({
                    "stripe_customer_id": customer_id
                }).eq("user_profile_id", str(current_user.id)).execute()
        
        # Create setup intent
        setup_intent = stripe.SetupIntent.create(
            customer=customer_id,
            payment_method_types=['card'],
        )
        
        return {
            "client_secret": setup_intent.client_secret,
            "setup_intent_id": setup_intent.id
        }
        
    except Exception as e:
        # Handle all Stripe errors and other exceptions
        if "stripe" in str(type(e)).lower():
            logger.error(f"Stripe error creating setup intent: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to create setup intent: {str(e)}"
            )
        else:
            logger.error(f"Unexpected error creating setup intent: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Internal server error"
            )
        logger.error(f"Error creating setup intent: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create setup intent"
        )


@router.post("/", response_model=PaymentMethod)
async def add_payment_method(
    payment_method_data: PaymentMethodCreate,
    current_user: User = Depends(get_current_user)
):
    """Add a new payment method"""
    db = DatabaseManager(use_service_role=True)  # Use service role for payment operations
    
    try:
        # Retrieve payment method from Stripe
        stripe_pm = stripe.PaymentMethod.retrieve(
            payment_method_data.stripe_payment_method_id
        )
        
        # Verify payment method belongs to user's customer
        subscription = await db.get_user_subscription(str(current_user.id))
        if not subscription or not subscription.get("stripe_customer_id"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No Stripe customer found"
            )
        
        # Attach payment method to customer if not already attached
        if stripe_pm.customer != subscription["stripe_customer_id"]:
            stripe.PaymentMethod.attach(
                payment_method_data.stripe_payment_method_id,
                customer=subscription["stripe_customer_id"]
            )
        
        # Check if this is the first payment method
        existing_methods = db.client.table("payment_methods").select("id").eq(
            "user_profile_id", str(current_user.id)
        ).eq("is_active", True).execute()
        
        is_first_method = len(existing_methods.data or []) == 0
        
        # Store payment method in database
        payment_method_record = {
            "user_profile_id": str(current_user.id),
            "stripe_payment_method_id": payment_method_data.stripe_payment_method_id,
            "card_brand": stripe_pm.card.brand,
            "card_last4": stripe_pm.card.last4,
            "card_exp_month": stripe_pm.card.exp_month,
            "card_exp_year": stripe_pm.card.exp_year,
            "cardholder_name": stripe_pm.billing_details.name,
            "is_default": is_first_method,  # First method is default
            "is_active": True
        }
        
        response = db.client.table("payment_methods").insert(
            payment_method_record
        ).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to save payment method"
            )
        
        return response.data[0]
        
    except HTTPException:
        # Re-raise HTTPException as is
        raise
    except Exception as e:
        # Handle all other errors (including Stripe errors)
        if "stripe" in str(type(e)).lower():
            logger.error(f"Stripe error adding payment method: {e}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Failed to add payment method: {str(e)}"
            )
        else:
            logger.error(f"Error adding payment method: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to add payment method"
            )


@router.get("/", response_model=List[PaymentMethod])
async def get_payment_methods(
    current_user: User = Depends(get_current_user)
):
    """Get user's payment methods"""
    db = DatabaseManager()
    
    try:
        response = db.client.table("payment_methods").select("*").eq(
            "user_profile_id", str(current_user.id)
        ).eq("is_active", True).order("created_at", desc=True).execute()
        
        return response.data or []
        
    except Exception as e:
        logger.error(f"Error getting payment methods: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get payment methods"
        )


@router.put("/{payment_method_id}", response_model=PaymentMethod)
async def update_payment_method(
    payment_method_id: str,
    update_data: PaymentMethodUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a payment method"""
    db = DatabaseManager(use_service_role=True)  # Use service role for update operations
    
    try:
        # Verify ownership
        pm_response = db.client.table("payment_methods").select("*").eq(
            "id", payment_method_id
        ).eq("user_profile_id", str(current_user.id)).execute()
        
        if not pm_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment method not found"
            )
        
        # Update payment method
        update_dict = update_data.dict(exclude_unset=True)
        
        response = db.client.table("payment_methods").update(
            update_dict
        ).eq("id", payment_method_id).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update payment method"
            )
        
        # If setting as default, update Stripe customer's default payment method
        if update_data.is_default:
            pm = pm_response.data[0]
            subscription = await db.get_user_subscription(str(current_user.id))
            
            if subscription and subscription.get("stripe_customer_id"):
                stripe.Customer.modify(
                    subscription["stripe_customer_id"],
                    invoice_settings={
                        'default_payment_method': pm["stripe_payment_method_id"]
                    }
                )
        
        return response.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating payment method: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update payment method"
        )


@router.delete("/{payment_method_id}")
async def delete_payment_method(
    payment_method_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a payment method"""
    db = DatabaseManager(use_service_role=True)  # Use service role for delete operations
    
    try:
        # Verify ownership
        pm_response = db.client.table("payment_methods").select("*").eq(
            "id", payment_method_id
        ).eq("user_profile_id", str(current_user.id)).execute()
        
        if not pm_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Payment method not found"
            )
        
        pm = pm_response.data[0]
        
        # Detach from Stripe
        try:
            stripe.PaymentMethod.detach(pm["stripe_payment_method_id"])
        except Exception as e:
            # Handle Stripe errors gracefully
            logger.warning(f"Failed to detach from Stripe: {e}")
        
        # Soft delete in database
        db.client.table("payment_methods").update({
            "is_active": False
        }).eq("id", payment_method_id).execute()
        
        return {"message": "Payment method deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting payment method: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete payment method"
        )
