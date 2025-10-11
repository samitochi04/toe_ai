"""
Database connection and utilities for TOE AI Backend
"""

from supabase import create_client, Client
from typing import Optional
import asyncio
import logging

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
        self.client = get_service_supabase() if use_service_role else get_supabase()
    
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
            response = (
                self.client.table("user_subscriptions")
                .select("*, subscription_tiers(*)")
                .eq("user_profile_id", user_id)
                .eq("status", "active")
                .or_("status.eq.free")
                .order("created_at", desc=True)
                .limit(1)
                .execute()
            )
            return response.data[0] if response.data else None
        except Exception as e:
            logger.error(f"Error getting user subscription for {user_id}: {e}")
            return None
    
    async def check_usage_limit(self, user_id: str, chat_type: str) -> bool:
        """Check if user can create a new chat"""
        try:
            result = await self.execute_function("check_usage_limit", {
                "user_id": user_id,
                "chat_type": chat_type
            })
            return result if result is not None else False
        except Exception as e:
            logger.error(f"Error checking usage limit for user {user_id}: {e}")
            return False
    
    async def increment_usage(self, user_id: str, chat_type: str):
        """Increment user's usage count"""
        try:
            await self.execute_function("increment_usage_count", {
                "user_id": user_id,
                "chat_type": chat_type
            })
            return True
        except Exception as e:
            logger.error(f"Error incrementing usage for user {user_id}: {e}")
            return False
    
    async def log_api_usage(self, user_id: str, provider: str, endpoint: str, tokens: int = None, cost: float = None):
        """Log API usage"""
        try:
            await self.execute_function("log_api_usage", {
                "user_id": user_id,
                "provider": provider,
                "endpoint_name": endpoint,
                "tokens": tokens,
                "cost": cost
            })
            return True
        except Exception as e:
            logger.error(f"Error logging API usage for user {user_id}: {e}")
            return False