"""
Database connection and utilities for TOE AI Backend
"""

from supabase import create_client, Client
from typing import Optional
import asyncio
import logging
from datetime import datetime

from app.core.config import settings

logger = logging.getLogger(__name__)

# Global Supabase client
supabase: Optional[Client] = None


async def init_db() -> None:
    """Initialize database connection"""
    global supabase
    
    try:
        # Create Supabase client
        supabase = create_client(
            settings.SUPABASE_URL,
            settings.SUPABASE_ANON_KEY
        )
        
        # Test connection
        response = supabase.table("user_profile").select("count", count="exact").execute()
        logger.info(f"✅ Database connected successfully. User profiles count: {response.count}")
        
    except Exception as e:
        logger.error(f"❌ Failed to connect to database: {e}")
        raise


def get_supabase() -> Client:
    """Get Supabase client instance"""
    if supabase is None:
        raise RuntimeError("Database not initialized. Call init_db() first.")
    return supabase


def get_service_supabase() -> Client:
    """Get Supabase client with service role key (for admin operations)"""
    return create_client(
        settings.SUPABASE_URL,
        settings.SUPABASE_SERVICE_KEY
    )


class DatabaseError(Exception):
    """Custom database error"""
    pass


class DatabaseManager:
    """Database operations manager"""
    
    def __init__(self, use_service_role: bool = False):
        if use_service_role:
            self.client = get_service_supabase()
            logger.debug("Using service role client for database operations")
        else:
            self.client = get_supabase()
    
    async def execute_function(self, function_name: str, params: dict = None):
        """Execute a database function"""
        try:
            if params:
                response = self.client.rpc(function_name, params).execute()
            else:
                response = self.client.rpc(function_name).execute()
            
            if response.data is None and hasattr(response, 'error') and response.error:
                raise DatabaseError(f"Function {function_name} failed: {response.error}")
            
            return response.data
        except Exception as e:
            logger.error(f"Database function {function_name} error: {e}")
            raise DatabaseError(f"Database operation failed: {e}")
    
    async def get_user_by_auth_id(self, auth_user_id: str):
        """Get user profile by auth user ID"""
        try:
            response = self.client.table("user_profile").select("*").eq("auth_user_id", auth_user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error getting user by auth ID {auth_user_id}: {e}")
            return None
    
    async def get_user_by_alias(self, alias: str):
        """Get user profile by alias"""
        try:
            response = self.client.table("user_profile").select("*").eq("alias", alias).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error getting user by alias {alias}: {e}")
            return None
    
    async def get_user_usage(self, user_id: str):
        """Get user's current usage"""
        try:
            response = self.client.table("usage_tracking").select("*").eq("user_profile_id", user_id).execute()
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error getting user usage for {user_id}: {e}")
            return None
    
    async def get_user_subscription(self, user_id: str):
        """Get user's current subscription"""
        try:
            logger.debug(f"Getting subscription for user_profile_id: {user_id}")
            
            # Use service role to bypass RLS policies for subscription queries
            service_db = DatabaseManager(use_service_role=True)
            
            response = (
                service_db.client.table("user_subscriptions")
                .select("*, subscription_tiers(*)")
                .eq("user_profile_id", user_id)
                .in_("status", ["active", "free"])
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            
            logger.debug(f"Subscription query response: {response.data}")
            
            if response.data:
                logger.debug(f"Found subscription: {response.data[0]}")
                return response.data[0]
            else:
                logger.warning(f"No subscription found for user_profile_id: {user_id}")
                return None
                
        except Exception as e:
            logger.error(f"Error getting user subscription for {user_id}: {e}")
            return None
    
    async def check_usage_limit(self, user_id: str, chat_type: str) -> bool:
        """Check if user can create a new chat"""
        try:
            # In development mode with increased limits, always allow
            if settings.ENVIRONMENT == "development":
                logger.info(f"Development mode: Allowing chat creation for user {user_id}")
                return True
            
            # Use service role client for this check to avoid RLS issues
            service_db = DatabaseManager(use_service_role=True)
            
            # Get current usage
            usage_response = (
                service_db.client.table("usage_tracking")
                .select("*")
                .eq("user_profile_id", user_id)
                .execute()
            )
            
            if not usage_response.data:
                # No usage record, create one
                now = datetime.utcnow().isoformat()
                service_db.client.table("usage_tracking").insert({
                    "user_profile_id": user_id,
                    "normal_chats_used": 0,
                    "interview_chats_used": 0,
                    "reset_date": now,
                    "created_at": now,
                    "updated_at": now
                }).execute()
                return True
            
            usage = usage_response.data[0]
            
            # Get subscription limits
            subscription_response = (
                service_db.client.table("user_subscriptions")
                .select("*, subscription_tiers(*)")
                .eq("user_profile_id", user_id)
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            
            if subscription_response.data and subscription_response.data[0].get("subscription_tiers"):
                tier = subscription_response.data[0]["subscription_tiers"]
                normal_limit = tier.get("normal_chat_limit", 100)
                interview_limit = tier.get("interview_chat_limit", 50)
            else:
                # Default limits from settings
                normal_limit = settings.FREE_NORMAL_CHAT_LIMIT
                interview_limit = settings.FREE_INTERVIEW_CHAT_LIMIT
            
            # Check limits
            if chat_type == "normal":
                return usage.get("normal_chats_used", 0) < normal_limit
            elif chat_type == "interview":
                return usage.get("interview_chats_used", 0) < interview_limit
            
            return False
                
        except Exception as e:
            logger.error(f"Error checking usage limit for user {user_id}: {e}")
            # Return True in development mode when there's an error
            if settings.ENVIRONMENT == "development":
                logger.warning(f"Usage limit check failed, allowing in development mode")
                return True
            return False

    async def increment_usage(self, user_id: str, chat_type: str):
        """Increment user's usage count"""
        try:
            # Use service role for this operation
            service_db = DatabaseManager(use_service_role=True)
            
            if chat_type == "normal":
                # Use RPC function or proper SQL increment
                service_db.client.rpc('increment_usage_count', {
                    'user_id': user_id,
                    'chat_type': 'normal'
                }).execute()
            elif chat_type == "interview":
                # Use RPC function or proper SQL increment
                service_db.client.rpc('increment_usage_count', {
                    'user_id': user_id,
                    'chat_type': 'interview'
                }).execute()
            
            return True
        except Exception as e:
            logger.error(f"Error incrementing usage for user {user_id}: {e}")
            # Fallback: manually get and update
            try:
                usage_response = service_db.client.table("usage_tracking").select("*").eq("user_profile_id", user_id).execute()
                if usage_response.data:
                    current_usage = usage_response.data[0]
                    if chat_type == "normal":
                        new_count = current_usage.get("normal_chats_used", 0) + 1
                        service_db.client.table("usage_tracking").update({
                            "normal_chats_used": new_count,
                            "updated_at": datetime.utcnow().isoformat()
                        }).eq("user_profile_id", user_id).execute()
                    elif chat_type == "interview":
                        new_count = current_usage.get("interview_chats_used", 0) + 1
                        service_db.client.table("usage_tracking").update({
                            "interview_chats_used": new_count,
                            "updated_at": datetime.utcnow().isoformat()
                        }).eq("user_profile_id", user_id).execute()
                return True
            except Exception as fallback_error:
                logger.error(f"Fallback increment also failed: {fallback_error}")
                return False
    
    async def log_api_usage(self, user_id: str, provider: str, endpoint: str, tokens: int = None, cost: float = None):
        """Log API usage"""
        try:
            # Use service role client to bypass RLS policies for system logging
            service_client = get_service_supabase()
            
            # Insert directly into the table using service role
            response = service_client.table("api_usage_logs").insert({
                "user_profile_id": user_id,
                "api_provider": provider,
                "endpoint": endpoint,
                "tokens_used": tokens,
                "cost_usd": cost,
                "request_data": None,
                "response_data": None
            }).execute()
            
            # Check for errors in the modern Supabase client response
            if hasattr(response, 'error') and response.error:
                logger.error(f"Error inserting API usage log: {response.error}")
                return False
            elif not response.data:
                logger.warning(f"API usage log insert returned no data for user {user_id}")
                return False
                
            logger.info(f"Successfully logged API usage for user {user_id}: {provider}/{endpoint}")
            return True
        except Exception as e:
            logger.error(f"Error logging API usage for user {user_id}: {e}")
            return False