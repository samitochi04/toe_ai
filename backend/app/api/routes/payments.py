"""
Payment routes for TOE AI Backend
Stripe integration for premium subscriptions
"""

from fastapi import APIRouter, HTTPException, Depends, status, Request
from typing import Optional
import logging
import stripe
import json
from datetime import datetime

from app.core.auth import get_current_user
from app.core.database import DatabaseManager
from app.core.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()

# Configure Stripe with proper error handling
try:
    if not settings.STRIPE_SECRET_KEY:
        logger.error("STRIPE_SECRET_KEY is not set in environment variables")
        stripe.api_key = None
    elif settings.STRIPE_SECRET_KEY.strip() == "":
        logger.error("STRIPE_SECRET_KEY is empty")
        stripe.api_key = None
    else:
        stripe.api_key = settings.STRIPE_SECRET_KEY.strip()
        logger.info(f"Stripe API key configured successfully")
        logger.info(f"Stripe key type: {'Live' if 'sk_live_' in settings.STRIPE_SECRET_KEY else 'Test' if 'sk_test_' in settings.STRIPE_SECRET_KEY else 'Unknown'}")
        
        # Test Stripe connection - use a simpler test
        try:
            # Try to list payment methods (safer test for restricted keys)
            test_response = stripe.PaymentMethod.list(limit=1, type="card")
            logger.info("Stripe connection test successful")
        except stripe.error.AuthenticationError as auth_error:
            logger.error(f"Stripe authentication failed: {auth_error}")
        except stripe.error.PermissionError as perm_error:
            logger.warning(f"Stripe permission limited (this is normal for restricted keys): {perm_error}")
            logger.info("Stripe API key is valid but has limited permissions")
        except Exception as stripe_test_error:
            logger.error(f"Stripe connection test failed: {stripe_test_error}")
            logger.error(f"Error type: {type(stripe_test_error)}")
            # Don't fail the startup for connection test failures
            pass
            
except Exception as e:
    logger.error(f"Error configuring Stripe: {e}")
    stripe.api_key = None


# ================================================
# SUBSCRIPTION MANAGEMENT
# ================================================

@router.post("/create-checkout-session")
async def create_checkout_session(
    current_user: User = Depends(get_current_user)
):
    """Create Stripe checkout session for premium subscription"""
    db = DatabaseManager()
    
    try:
        # Debug: Check Stripe configuration
        logger.info(f"Creating checkout session for user: {current_user.email}")
        logger.info(f"Stripe secret key available: {'Yes' if stripe.api_key else 'No'}")
        
        if not stripe.api_key:
            logger.error("Stripe API key is not configured!")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Payment system not configured properly. Please check Stripe configuration."
            )
        
        if not settings.STRIPE_PRICE_ID_PREMIUM:
            logger.error("Stripe Price ID is not configured!")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Premium subscription price not configured"
            )
        # Check if user already has an active subscription
        subscription = await db.get_user_subscription(str(current_user.id))
        if subscription and subscription.get("status") == "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="User already has an active subscription"
            )
        
        # Get or create Stripe customer
        stripe_customer_id = None
        if subscription and subscription.get("stripe_customer_id"):
            stripe_customer_id = subscription["stripe_customer_id"]
        else:
            # Create new Stripe customer
            try:
                customer = stripe.Customer.create(
                    email=current_user.email,
                    name=current_user.full_name,
                    metadata={
                        "user_id": str(current_user.id),
                        "alias": current_user.alias
                    }
                )
                stripe_customer_id = customer.id
                logger.info(f"Created Stripe customer: {stripe_customer_id}")
            except stripe.error.StripeError as e:
                logger.error(f"Stripe customer creation error: {e}")
                raise HTTPException(
                    status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                    detail=f"Failed to create customer: {str(e)}"
                )
            
            # Update user subscription with customer ID
            if subscription:
                (
                    db.client.table("user_subscriptions")
                    .update({"stripe_customer_id": stripe_customer_id})
                    .eq("user_profile_id", str(current_user.id))
                    .execute()
                )
        
        # Create checkout session
        try:
            checkout_session = stripe.checkout.Session.create(
                customer=stripe_customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price': settings.STRIPE_PRICE_ID_PREMIUM,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=f"{settings.ALLOWED_ORIGINS[0]}/payment/success?session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{settings.ALLOWED_ORIGINS[0]}/payment/cancel",
                metadata={
                    "user_id": str(current_user.id),
                    "alias": current_user.alias
                }
            )
            logger.info(f"Created checkout session: {checkout_session.id}")
        except stripe.error.StripeError as e:
            logger.error(f"Stripe checkout session creation error: {e}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail=f"Failed to create checkout session: {str(e)}"
            )
        
        return {
            "checkout_url": checkout_session.url,
            "session_id": checkout_session.id
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stripe error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error creating checkout session: {e}")
        logger.error(f"Error type: {type(e)}")
        logger.error(f"Error args: {e.args}")
        import traceback
        logger.error(f"Traceback: {traceback.format_exc()}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create checkout session"
        )


@router.get("/subscription-status")
async def get_subscription_status(
    current_user: User = Depends(get_current_user)
):
    """Get user's current subscription status"""
    db = DatabaseManager()
    
    try:
        subscription = await db.get_user_subscription(str(current_user.id))
        usage = await db.get_user_usage(str(current_user.id))
        
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found"
            )
        
        # Get additional Stripe info if available
        stripe_info = None
        if subscription.get("stripe_subscription_id"):
            try:
                stripe_subscription = stripe.Subscription.retrieve(
                    subscription["stripe_subscription_id"]
                )
                stripe_info = {
                    "status": stripe_subscription.status,
                    "current_period_start": stripe_subscription.current_period_start,
                    "current_period_end": stripe_subscription.current_period_end,
                    "cancel_at_period_end": stripe_subscription.cancel_at_period_end
                }
            except stripe.error.StripeError as e:
                logger.warning(f"Could not retrieve Stripe subscription: {e}")
        
        return {
            "subscription": subscription,
            "usage": usage,
            "stripe_info": stripe_info
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting subscription status: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get subscription status"
        )


@router.post("/cancel-subscription")
async def cancel_subscription(
    current_user: User = Depends(get_current_user)
):
    """Cancel user's subscription (at end of current period)"""
    db = DatabaseManager()
    
    try:
        subscription = await db.get_user_subscription(str(current_user.id))
        
        if not subscription or subscription.get("status") != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No active subscription found"
            )
        
        stripe_subscription_id = subscription.get("stripe_subscription_id")
        if not stripe_subscription_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No Stripe subscription found"
            )
        
        # Cancel at period end
        stripe.Subscription.modify(
            stripe_subscription_id,
            cancel_at_period_end=True
        )
        
        return {"message": "Subscription will be cancelled at the end of the current billing period"}
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stripe error: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to cancel subscription"
        )


@router.post("/reactivate-subscription")
async def reactivate_subscription(
    current_user: User = Depends(get_current_user)
):
    """Reactivate a cancelled subscription"""
    db = DatabaseManager()
    
    try:
        subscription = await db.get_user_subscription(str(current_user.id))
        
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No subscription found"
            )
        
        stripe_subscription_id = subscription.get("stripe_subscription_id")
        if not stripe_subscription_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No Stripe subscription found"
            )
        
        # Remove cancellation
        stripe.Subscription.modify(
            stripe_subscription_id,
            cancel_at_period_end=False
        )
        
        return {"message": "Subscription reactivated successfully"}
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stripe error: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error reactivating subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to reactivate subscription"
        )


@router.get("/payment-history")
async def get_payment_history(
    current_user: User = Depends(get_current_user)
):
    """Get user's payment history"""
    db = DatabaseManager()
    
    try:
        # Get payments from database
        response = (
            db.client.table("stripe_payments")
            .select("*")
            .eq("user_profile_id", str(current_user.id))
            .order("created_at", desc=True)
            .execute()
        )
        
        payments = response.data or []
        
        # Get subscription info for additional context
        subscription = await db.get_user_subscription(str(current_user.id))
        
        return {
            "payments": payments,
            "subscription": subscription
        }
        
    except Exception as e:
        logger.error(f"Error getting payment history: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get payment history"
        )


@router.get("/checkout-session/{session_id}")
async def get_checkout_session(
    session_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get checkout session status"""
    try:
        session = stripe.checkout.Session.retrieve(session_id)
        
        return {
            "status": session.status,
            "payment_status": session.payment_status,
            "customer": session.customer,
            "subscription": session.subscription,
            "success_url": session.success_url,
            "cancel_url": session.cancel_url
        }
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stripe error: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Error getting checkout session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get checkout session"
        )


@router.get("/billing-portal")
async def create_billing_portal_session(
    return_url: str = "http://localhost:3000/billing",
    current_user: User = Depends(get_current_user)
):
    """Create Stripe billing portal session"""
    db = DatabaseManager()
    
    try:
        subscription = await db.get_user_subscription(str(current_user.id))
        
        if not subscription or not subscription.get("stripe_customer_id"):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No Stripe customer found"
            )
        
        # Create billing portal session
        portal_session = stripe.billing_portal.Session.create(
            customer=subscription["stripe_customer_id"],
            return_url=return_url,
        )
        
        return {"url": portal_session.url}
        
    except stripe.error.StripeError as e:
        logger.error(f"Stripe error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Stripe error: {str(e)}"
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating billing portal session: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create billing portal session"
        )


# ================================================
# STRIPE WEBHOOKS
# ================================================

@router.post("/webhook")
async def stripe_webhook(request: Request):
    """Handle Stripe webhooks"""
    db = DatabaseManager(use_service_role=True)
    
    try:
        payload = await request.body()
        sig_header = request.headers.get('stripe-signature')
        
        if not sig_header:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Missing Stripe signature"
            )
        
        # Verify webhook signature
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, settings.STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid payload"
            )
        except stripe.error.SignatureVerificationError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid signature"
            )
        
        # Handle different event types
        if event['type'] == 'checkout.session.completed':
            await handle_checkout_completed(event['data']['object'], db)
        
        elif event['type'] == 'customer.subscription.created':
            await handle_subscription_created(event['data']['object'], db)
        
        elif event['type'] == 'customer.subscription.updated':
            await handle_subscription_updated(event['data']['object'], db)
        
        elif event['type'] == 'customer.subscription.deleted':
            await handle_subscription_deleted(event['data']['object'], db)
        
        elif event['type'] == 'invoice.payment_succeeded':
            await handle_payment_succeeded(event['data']['object'], db)
        
        elif event['type'] == 'invoice.payment_failed':
            await handle_payment_failed(event['data']['object'], db)
        
        return {"status": "success"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Webhook processing failed"
        )


# ================================================
# WEBHOOK HANDLERS
# ================================================

async def handle_checkout_completed(session, db: DatabaseManager):
    """Handle successful checkout session"""
    user_id = session['metadata'].get('user_id')
    customer_id = session['customer']
    subscription_id = session['subscription']
    
    if user_id:
        # Update user subscription
        (
            db.client.table("user_subscriptions")
            .update({
                "stripe_customer_id": customer_id,
                "stripe_subscription_id": subscription_id,
                "status": "active",
                "updated_at": datetime.utcnow().isoformat()
            })
            .eq("user_profile_id", user_id)
            .execute()
        )


async def handle_subscription_created(subscription, db: DatabaseManager):
    """Handle subscription creation"""
    customer_id = subscription['customer']
    
    # Get user by customer ID
    user_response = (
        db.client.table("user_subscriptions")
        .select("user_profile_id")
        .eq("stripe_customer_id", customer_id)
        .execute()
    )
    
    if user_response.data:
        user_id = user_response.data[0]["user_profile_id"]
        
        # Get premium tier
        tier_response = (
            db.client.table("subscription_tiers")
            .select("id")
            .eq("name", "Premium")
            .execute()
        )
        
        if tier_response.data:
            tier_id = tier_response.data[0]["id"]
            
            # Update subscription
            (
                db.client.table("user_subscriptions")
                .update({
                    "tier_id": tier_id,
                    "stripe_subscription_id": subscription['id'],
                    "status": "active",
                    "current_period_start": datetime.fromtimestamp(subscription['current_period_start']).isoformat(),
                    "current_period_end": datetime.fromtimestamp(subscription['current_period_end']).isoformat(),
                    "updated_at": datetime.utcnow().isoformat()
                })
                .eq("user_profile_id", user_id)
                .execute()
            )


async def handle_subscription_updated(subscription, db: DatabaseManager):
    """Handle subscription updates"""
    subscription_id = subscription['id']
    
    # Update subscription status
    status_map = {
        'active': 'active',
        'canceled': 'cancelled',
        'past_due': 'past_due',
        'unpaid': 'past_due'
    }
    
    new_status = status_map.get(subscription['status'], subscription['status'])
    
    (
        db.client.table("user_subscriptions")
        .update({
            "status": new_status,
            "current_period_start": datetime.fromtimestamp(subscription['current_period_start']).isoformat(),
            "current_period_end": datetime.fromtimestamp(subscription['current_period_end']).isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        })
        .eq("stripe_subscription_id", subscription_id)
        .execute()
    )


async def handle_subscription_deleted(subscription, db: DatabaseManager):
    """Handle subscription cancellation"""
    subscription_id = subscription['id']
    
    # Get free tier
    tier_response = (
        db.client.table("subscription_tiers")
        .select("id")
        .eq("name", "Free")
        .execute()
    )
    
    if tier_response.data:
        tier_id = tier_response.data[0]["id"]
        
        # Downgrade to free tier
        (
            db.client.table("user_subscriptions")
            .update({
                "tier_id": tier_id,
                "status": "free",
                "current_period_start": None,
                "current_period_end": None,
                "updated_at": datetime.utcnow().isoformat()
            })
            .eq("stripe_subscription_id", subscription_id)
            .execute()
        )


async def handle_payment_succeeded(invoice, db: DatabaseManager):
    """Handle successful payment"""
    customer_id = invoice['customer']
    amount = invoice['amount_paid'] / 100  # Convert from cents
    
    # Get user by customer ID
    user_response = (
        db.client.table("user_subscriptions")
        .select("user_profile_id")
        .eq("stripe_customer_id", customer_id)
        .execute()
    )
    
    if user_response.data:
        user_id = user_response.data[0]["user_profile_id"]
        
        # Record payment
        (
            db.client.table("stripe_payments")
            .insert({
                "user_profile_id": user_id,
                "stripe_payment_intent_id": invoice.get('payment_intent'),
                "stripe_customer_id": customer_id,
                "amount": amount,
                "currency": invoice['currency'].upper(),
                "status": "succeeded",
                "description": "Premium subscription payment",
                "created_at": datetime.utcnow().isoformat()
            })
            .execute()
        )


async def handle_payment_failed(invoice, db: DatabaseManager):
    """Handle failed payment"""
    customer_id = invoice['customer']
    amount = invoice['amount_due'] / 100  # Convert from cents
    
    # Get user by customer ID
    user_response = (
        db.client.table("user_subscriptions")
        .select("user_profile_id")
        .eq("stripe_customer_id", customer_id)
        .execute()
    )
    
    if user_response.data:
        user_id = user_response.data[0]["user_profile_id"]
        
        # Record failed payment
        (
            db.client.table("stripe_payments")
            .insert({
                "user_profile_id": user_id,
                "stripe_customer_id": customer_id,
                "amount": amount,
                "currency": invoice['currency'].upper(),
                "status": "failed",
                "description": "Premium subscription payment failed",
                "created_at": datetime.utcnow().isoformat()
            })
            .execute()
        )
        
        # Update subscription status
        (
            db.client.table("user_subscriptions")
            .update({
                "status": "past_due",
                "updated_at": datetime.utcnow().isoformat()
            })
            .eq("stripe_customer_id", customer_id)
            .execute()
        )