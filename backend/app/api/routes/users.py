"""
User profile routes for TOE AI Backend
"""

from fastapi import APIRouter, HTTPException, Depends, status, File, UploadFile
from typing import Optional
import os
import uuid
import logging
from datetime import datetime, timedelta

from app.core.auth import get_current_user
from app.core.database import DatabaseManager
from app.core.config import settings
from app.models.user import User, UserUpdate, UserProfile, UserStats, UserSearchResult

logger = logging.getLogger(__name__)

router = APIRouter()


@router.get("/profile", response_model=UserProfile)
async def get_user_profile(current_user: User = Depends(get_current_user)):
    """Get current user's profile with usage and subscription info"""
    db = DatabaseManager()
    
    try:
        # Get usage information
        usage = await db.get_user_usage(str(current_user.id))
        
        # Get subscription information
        subscription = await db.get_user_subscription(str(current_user.id))
        
        # Create user profile response
        profile_data = current_user.dict()
        profile_data["usage"] = usage
        profile_data["subscription"] = subscription
        
        return UserProfile(**profile_data)
        
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user profile"
        )


@router.put("/profile", response_model=User)
async def update_user_profile(
    user_data: UserUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update user profile"""
    db = DatabaseManager()
    
    try:
        # Prepare update data
        update_data = {}
        if user_data.full_name is not None:
            update_data["full_name"] = user_data.full_name
        if user_data.bio is not None:
            update_data["bio"] = user_data.bio
        if user_data.profile_picture_url is not None:
            update_data["profile_picture_url"] = user_data.profile_picture_url
        
        if not update_data:
            return current_user
        
        # Add updated_at timestamp
        update_data["updated_at"] = datetime.utcnow().isoformat()
        
        # Update user profile
        response = (
            db.client.table("user_profile")
            .update(update_data)
            .eq("id", str(current_user.id))
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Profile update failed"
            )
        
        return User(**response.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )


@router.post("/profile/picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload profile picture"""
    
    # Validate file type
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )
    
    # Check file extension
    file_extension = file.filename.split(".")[-1].lower()
    if file_extension not in settings.ALLOWED_IMAGE_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File type not allowed. Allowed types: {', '.join(settings.ALLOWED_IMAGE_EXTENSIONS)}"
        )
    
    # Check file size
    file_size = 0
    file_content = await file.read()
    file_size = len(file_content)
    
    if file_size > settings.MAX_FILE_SIZE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE / (1024*1024):.1f}MB"
        )
    
    try:
        # Generate unique filename
        filename = f"{uuid.uuid4()}.{file_extension}"
        file_path = os.path.join(settings.UPLOAD_DIR, "images", filename)
        
        # Save file
        with open(file_path, "wb") as buffer:
            buffer.write(file_content)
        
        # Generate URL
        file_url = f"/static/uploads/images/{filename}"
        
        # Update user profile with new picture URL
        db = DatabaseManager()
        response = (
            db.client.table("user_profile")
            .update({"profile_picture_url": file_url})
            .eq("id", str(current_user.id))
            .execute()
        )
        
        if not response.data:
            # Clean up uploaded file if database update fails
            if os.path.exists(file_path):
                os.remove(file_path)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update profile picture"
            )
        
        return {
            "message": "Profile picture uploaded successfully",
            "profile_picture_url": file_url
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error uploading profile picture: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload profile picture"
        )


@router.get("/stats", response_model=UserStats)
async def get_user_stats(current_user: User = Depends(get_current_user)):
    """Get user statistics"""
    db = DatabaseManager()
    
    try:
        # Get chat counts
        normal_chats_response = (
            db.client.table("normal_chat")
            .select("id", count="exact")
            .eq("user_profile_id", str(current_user.id))
            .execute()
        )
        
        interview_chats_response = (
            db.client.table("interview_chat")
            .select("id", count="exact")
            .eq("user_profile_id", str(current_user.id))
            .execute()
        )
        
        shared_chats_response = (
            db.client.table("shared_chat")
            .select("id", count="exact")
            .eq("owner_user_id", str(current_user.id))
            .execute()
        )
        
        # Get usage information
        usage = await db.get_user_usage(str(current_user.id))
        
        # Get subscription information
        subscription = await db.get_user_subscription(str(current_user.id))
        
        # Get API usage summary (last 30 days)
        thirty_days_ago = (datetime.utcnow() - timedelta(days=30)).isoformat()
        
        api_usage_response = (
            db.client.table("api_usage_logs")
            .select("api_provider, tokens_used, cost_usd")
            .eq("user_profile_id", str(current_user.id))
            .gte("created_at", thirty_days_ago)
            .execute()
        )
        
        # Aggregate API usage
        api_summary = {}
        total_tokens = 0
        total_cost = 0.0
        
        for log in api_usage_response.data or []:
            provider = log["api_provider"]
            tokens = log.get("tokens_used", 0) or 0
            cost = float(log.get("cost_usd", 0) or 0)
            
            if provider not in api_summary:
                api_summary[provider] = {"tokens": 0, "cost": 0.0}
            
            api_summary[provider]["tokens"] += tokens
            api_summary[provider]["cost"] += cost
            total_tokens += tokens
            total_cost += cost
        
        api_summary["total"] = {"tokens": total_tokens, "cost": total_cost}
        
        return UserStats(
            total_normal_chats=normal_chats_response.count or 0,
            total_interview_chats=interview_chats_response.count or 0,
            total_shared_chats=shared_chats_response.count or 0,
            current_month_usage=usage,
            subscription_info=subscription,
            api_usage_summary=api_summary
        )
        
    except Exception as e:
        logger.error(f"Error getting user stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user statistics"
        )


@router.get("/search")
async def search_users(
    query: str,
    current_user: User = Depends(get_current_user)
):
    """Search users by alias or name (for sharing functionality)"""
    if len(query) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query must be at least 2 characters long"
        )
    
    db = DatabaseManager()
    
    try:
        # Search by alias or full name
        response = (
            db.client.table("user_profile")
            .select("id, alias, full_name, profile_picture_url, created_at")
            .or_(f"alias.ilike.%{query}%,full_name.ilike.%{query}%")
            .eq("is_active", True)
            .neq("id", str(current_user.id))  # Exclude current user
            .limit(10)
            .execute()
        )
        
        results = []
        for user_data in response.data or []:
            results.append(UserSearchResult(**user_data))
        
        return {"users": results}
        
    except Exception as e:
        logger.error(f"Error searching users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search users"
        )


@router.get("/alias/{alias}", response_model=UserSearchResult)
async def get_user_by_alias(alias: str):
    """Get user information by alias (public endpoint for sharing)"""
    db = DatabaseManager()
    
    try:
        user = await db.get_user_by_alias(alias)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        
        return UserSearchResult(
            id=user["id"],
            alias=user["alias"],
            full_name=user["full_name"],
            profile_picture_url=user.get("profile_picture_url"),
            created_at=user["created_at"]
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user by alias: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user information"
        )


@router.get("/usage")
async def get_user_usage(current_user: User = Depends(get_current_user)):
    """Get user's current usage statistics"""
    db = DatabaseManager()
    
    try:
        # Get usage tracking
        usage = await db.get_user_usage(str(current_user.id))
        
        # Get subscription info
        subscription = await db.get_user_subscription(str(current_user.id))
        
        # Set default values if no usage record exists
        if not usage:
            usage = {
                "normal_chats_used": 0,
                "interview_chats_used": 0,
                "normal_chat_limit": 10, 
                "interview_chat_limit": 5,  
                "reset_date": datetime.utcnow().isoformat()
            }
        
        # Add limits from subscription or use defaults
        if subscription and subscription.get("subscription_tiers"):
            tier = subscription["subscription_tiers"]
            usage["normal_chat_limit"] = tier.get("normal_chat_limit", 10)  # Changed back to 10
            usage["interview_chat_limit"] = tier.get("interview_chat_limit", 5)  # Changed back to 5
        else:
            usage["normal_chat_limit"] = 10  # Changed back to 10
            usage["interview_chat_limit"] = 5  # Changed back to 5
        
        return usage
        
    except Exception as e:
        logger.error(f"Error getting user usage: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get usage information"
        )