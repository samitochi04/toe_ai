"""
Admin routes for TOE AI Backend
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import Optional, List
import logging
from datetime import datetime, timedelta

from app.core.auth import get_current_user, require_admin
from app.core.database import DatabaseManager
from app.models.user import User, AdminUser

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/stats")
async def get_admin_stats(
    current_user: User = Depends(require_admin)
):
    """Get admin dashboard statistics"""
    db = DatabaseManager()
    
    try:
        # Get user statistics
        users_response = (
            db.client.table("user_profile")
            .select("id", count="exact")
            .eq("is_active", True)
            .execute()
        )
        
        # Get chat statistics
        normal_chats_response = (
            db.client.table("normal_chat")
            .select("id", count="exact")
            .execute()
        )
        
        interview_chats_response = (
            db.client.table("interview_chat")
            .select("id", count="exact")
            .execute()
        )
        
        # Get subscription statistics
        active_subscriptions_response = (
            db.client.table("user_subscriptions")
            .select("id", count="exact")
            .eq("status", "active")
            .execute()
        )
        
        # Get recent registrations (last 30 days)
        thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
        recent_users_response = (
            db.client.table("user_profile")
            .select("id", count="exact")
            .gte("created_at", thirty_days_ago)
            .execute()
        )
        
        # Get API usage summary
        api_usage_response = (
            db.client.table("api_usage_logs")
            .select("api_provider, tokens_used, cost_usd")
            .gte("created_at", thirty_days_ago)
            .execute()
        )
        
        # Process API usage
        api_summary = {}
        total_cost = 0.0
        total_tokens = 0
        
        for log in api_usage_response.data or []:
            provider = log["api_provider"]
            tokens = log.get("tokens_used", 0) or 0
            cost = float(log.get("cost_usd", 0) or 0)
            
            if provider not in api_summary:
                api_summary[provider] = {"tokens": 0, "cost": 0.0, "requests": 0}
            
            api_summary[provider]["tokens"] += tokens
            api_summary[provider]["cost"] += cost
            api_summary[provider]["requests"] += 1
            total_tokens += tokens
            total_cost += cost
        
        return {
            "users": {
                "total": users_response.count or 0,
                "recent": recent_users_response.count or 0
            },
            "chats": {
                "normal": normal_chats_response.count or 0,
                "interview": interview_chats_response.count or 0,
                "total": (normal_chats_response.count or 0) + (interview_chats_response.count or 0)
            },
            "subscriptions": {
                "active": active_subscriptions_response.count or 0
            },
            "api_usage": {
                "total_cost": total_cost,
                "total_tokens": total_tokens,
                "by_provider": api_summary
            }
        }
        
    except Exception as e:
        logger.error(f"Error getting admin stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get admin statistics"
        )


@router.get("/users")
async def get_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(50, ge=1, le=100),
    search: Optional[str] = Query(None),
    current_user: User = Depends(require_admin)
):
    """Get users list with pagination"""
    db = DatabaseManager()
    
    try:
        offset = (page - 1) * per_page
        
        query = (
            db.client.table("user_profile")
            .select("*, user_subscriptions(status, subscription_tiers(name))", count="exact")
            .order("created_at", desc=True)
            .range(offset, offset + per_page - 1)
        )
        
        if search:
            query = query.or_(f"full_name.ilike.%{search}%,email.ilike.%{search}%,alias.ilike.%{search}%")
        
        response = query.execute()
        
        return {
            "users": response.data or [],
            "total": response.count or 0,
            "page": page,
            "per_page": per_page,
            "has_next": offset + per_page < (response.count or 0),
            "has_prev": page > 1
        }
        
    except Exception as e:
        logger.error(f"Error getting users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get users"
        )


@router.get("/system-settings")
async def get_system_settings(
    current_user: User = Depends(require_admin)
):
    """Get system settings"""
    db = DatabaseManager()
    
    try:
        response = (
            db.client.table("system_settings")
            .select("*")
            .order("setting_key")
            .execute()
        )
        
        return {"settings": response.data or []}
        
    except Exception as e:
        logger.error(f"Error getting system settings: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get system settings"
        )


@router.put("/system-settings/{setting_key}")
async def update_system_setting(
    setting_key: str,
    setting_value: dict,
    current_user: User = Depends(require_admin)
):
    """Update system setting"""
    db = DatabaseManager()
    
    try:
        response = (
            db.client.table("system_settings")
            .update({
                "setting_value": setting_value,
                "updated_at": datetime.utcnow().isoformat()
            })
            .eq("setting_key", setting_key)
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Setting not found"
            )
        
        return {"message": "Setting updated successfully", "setting": response.data[0]}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating system setting: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update setting"
        )


@router.get("/api-usage")
async def get_api_usage(
    days: int = Query(30, ge=1, le=365),
    provider: Optional[str] = Query(None),
    current_user: User = Depends(require_admin)
):
    """Get API usage statistics"""
    db = DatabaseManager()
    
    try:
        start_date = (datetime.utcnow() - timedelta(days=days)).isoformat()
        
        query = (
            db.client.table("api_usage_logs")
            .select("*")
            .gte("created_at", start_date)
            .order("created_at", desc=True)
            .limit(1000)
        )
        
        if provider:
            query = query.eq("api_provider", provider)
        
        response = query.execute()
        
        # Aggregate data
        daily_usage = {}
        provider_usage = {}
        user_usage = {}
        
        for log in response.data or []:
            date = log["created_at"][:10]  # Extract date part
            provider_name = log["api_provider"]
            user_id = log["user_profile_id"]
            tokens = log.get("tokens_used", 0) or 0
            cost = float(log.get("cost_usd", 0) or 0)
            
            # Daily usage
            if date not in daily_usage:
                daily_usage[date] = {"tokens": 0, "cost": 0.0, "requests": 0}
            daily_usage[date]["tokens"] += tokens
            daily_usage[date]["cost"] += cost
            daily_usage[date]["requests"] += 1
            
            # Provider usage
            if provider_name not in provider_usage:
                provider_usage[provider_name] = {"tokens": 0, "cost": 0.0, "requests": 0}
            provider_usage[provider_name]["tokens"] += tokens
            provider_usage[provider_name]["cost"] += cost
            provider_usage[provider_name]["requests"] += 1
            
            # User usage
            if user_id not in user_usage:
                user_usage[user_id] = {"tokens": 0, "cost": 0.0, "requests": 0}
            user_usage[user_id]["tokens"] += tokens
            user_usage[user_id]["cost"] += cost
            user_usage[user_id]["requests"] += 1
        
        return {
            "period_days": days,
            "daily_usage": daily_usage,
            "provider_usage": provider_usage,
            "top_users": dict(sorted(user_usage.items(), key=lambda x: x[1]["cost"], reverse=True)[:10]),
            "total_logs": len(response.data or [])
        }
        
    except Exception as e:
        logger.error(f"Error getting API usage: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get API usage"
        )