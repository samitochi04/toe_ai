"""
Sharing routes for TOE AI Backend
Chat sharing functionality with aliases
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import Optional
import logging
import uuid
from datetime import datetime, timedelta

from app.core.auth import get_current_user, get_current_user_optional
from app.core.database import DatabaseManager
from app.models.user import User
from app.models.chat import (
    SharedChatCreate, SharedChatUpdate, SharedChat, SharedChatAccess,
    ChatType, NormalChat, InterviewChat
)

logger = logging.getLogger(__name__)

router = APIRouter()


@router.post("/create", response_model=SharedChat, status_code=status.HTTP_201_CREATED)
async def create_shared_chat(
    share_data: SharedChatCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a shared chat link"""
    db = DatabaseManager()
    
    try:
        # Verify that the chat exists and belongs to the user
        if share_data.chat_type == ChatType.NORMAL:
            table = "normal_chat"
        else:
            table = "interview_chat"
        
        chat_response = (
            db.client.table(table)
            .select("id, title")
            .eq("id", str(share_data.chat_id))
            .eq("user_profile_id", str(current_user.id))
            .execute()
        )
        
        if not chat_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat not found or access denied"
            )
        
        # Validate shared_with_alias if provided
        if share_data.shared_with_alias:
            target_user = await db.get_user_by_alias(share_data.shared_with_alias)
            if not target_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"User with alias '{share_data.shared_with_alias}' not found"
                )
        
        # Check if share already exists
        existing_share = (
            db.client.table("shared_chat")
            .select("*")
            .eq("chat_id", str(share_data.chat_id))
            .eq("chat_type", share_data.chat_type.value)
            .eq("owner_user_id", str(current_user.id))
            .execute()
        )
        
        if existing_share.data:
            # Update existing share
            update_data = {
                "shared_with_alias": share_data.shared_with_alias,
                "is_public": share_data.is_public,
                "expires_at": share_data.expires_at.isoformat() if share_data.expires_at else None
            }
            
            response = (
                db.client.table("shared_chat")
                .update(update_data)
                .eq("id", existing_share.data[0]["id"])
                .execute()
            )
            
            return SharedChat(**response.data[0])
        
        # Create new shared chat
        shared_chat_data = {
            "id": str(uuid.uuid4()),
            "chat_id": str(share_data.chat_id),
            "chat_type": share_data.chat_type.value,
            "owner_user_id": str(current_user.id),
            "shared_with_alias": share_data.shared_with_alias,
            "share_token": str(uuid.uuid4()),
            "is_public": share_data.is_public,
            "expires_at": share_data.expires_at.isoformat() if share_data.expires_at else None,
            "created_at": datetime.utcnow().isoformat()
        }
        
        response = (
            db.client.table("shared_chat")
            .insert(shared_chat_data)
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to create shared chat"
            )
        
        # Update the original chat's is_shared flag
        (
            db.client.table(table)
            .update({
                "is_shared": True,
                "shared_at": datetime.utcnow().isoformat()
            })
            .eq("id", str(share_data.chat_id))
            .execute()
        )
        
        return SharedChat(**response.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating shared chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create shared chat"
        )


@router.get("/my-shares")
async def get_my_shared_chats(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """Get user's shared chats"""
    db = DatabaseManager()
    
    try:
        offset = (page - 1) * per_page
        
        response = (
            db.client.table("shared_chat")
            .select("*", count="exact")
            .eq("owner_user_id", str(current_user.id))
            .order("created_at", desc=True)
            .range(offset, offset + per_page - 1)
            .execute()
        )
        
        shares = []
        for share_data in response.data or []:
            # Get chat details
            table = "normal_chat" if share_data["chat_type"] == "normal" else "interview_chat"
            chat_response = (
                db.client.table(table)
                .select("title, conversation, created_at")
                .eq("id", share_data["chat_id"])
                .execute()
            )
            
            share_info = {
                "id": share_data["id"],
                "chat_id": share_data["chat_id"],
                "chat_type": share_data["chat_type"],
                "title": "Untitled",
                "description": None,
                "share_token": share_data["share_token"],
                "is_public": share_data["is_public"],
                "view_count": share_data["view_count"],
                "expires_at": share_data.get("expires_at"),
                "created_at": share_data["created_at"]
            }
            
            if chat_response.data:
                chat = chat_response.data[0]
                share_info["title"] = chat.get("title", "Untitled")
                # Count messages from conversation array
                conversation = chat.get("conversation", [])
                share_info["message_count"] = len(conversation) if conversation else 0
                share_info["chat_created_at"] = chat.get("created_at")
            
            shares.append(share_info)
        
        total = response.count or 0
        
        return {
            "shares": shares,
            "total": total,
            "page": page,
            "per_page": per_page,
            "has_next": offset + per_page < total,
            "has_prev": page > 1
        }
        
    except Exception as e:
        logger.error(f"Error getting shared chats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get shared chats"
        )


@router.get("/token/{share_token}", response_model=SharedChatAccess)
async def access_shared_chat(
    share_token: str,
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """Access a shared chat by token"""
    db = DatabaseManager()
    
    try:
        # Get shared chat info
        share_response = (
            db.client.table("shared_chat")
            .select("*")
            .eq("share_token", share_token)
            .execute()
        )
        
        if not share_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shared chat not found"
            )
        
        share_info = share_response.data[0]
        
        # Check if expired
        if share_info["expires_at"]:
            expires_at = datetime.fromisoformat(share_info["expires_at"].replace("Z", "+00:00"))
            if datetime.utcnow().replace(tzinfo=expires_at.tzinfo) > expires_at:
                return SharedChatAccess(
                    is_expired=True,
                    view_count=share_info["view_count"]
                )
        
        # Check access permissions
        has_access = False
        
        if share_info["is_public"]:
            has_access = True
        elif share_info["shared_with_alias"] and current_user:
            if current_user.alias == share_info["shared_with_alias"]:
                has_access = True
        elif current_user and str(current_user.id) == share_info["owner_user_id"]:
            has_access = True
        
        if not has_access:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access denied to this shared chat"
            )
        
        # Get chat data
        table = "normal_chat" if share_info["chat_type"] == "normal" else "interview_chat"
        chat_response = (
            db.client.table(table)
            .select("*")
            .eq("id", share_info["chat_id"])
            .execute()
        )
        
        if not chat_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Original chat not found"
            )
        
        chat_data = chat_response.data[0]
        
        # Get owner info
        owner_response = (
            db.client.table("user_profile")
            .select("alias, full_name, profile_picture_url")
            .eq("id", share_info["owner_user_id"])
            .execute()
        )
        
        owner_info = None
        if owner_response.data:
            owner_data = owner_response.data[0]
            owner_info = {
                "alias": owner_data["alias"],
                "full_name": owner_data["full_name"],
                "profile_picture_url": owner_data.get("profile_picture_url")
            }
        
        # Increment view count (only for non-owners)
        if not current_user or str(current_user.id) != share_info["owner_user_id"]:
            (
                db.client.table("shared_chat")
                .update({"view_count": share_info["view_count"] + 1})
                .eq("id", share_info["id"])
                .execute()
            )
        
        # Format the response with proper structure
        formatted_chat = {
            "id": chat_data["id"],
            "title": chat_data.get("title", "Untitled"),
            "conversation": chat_data.get("conversation", []),
            "created_at": chat_data.get("created_at"),
            "updated_at": chat_data.get("updated_at"),
            "chat_type": share_info["chat_type"],
            "shared_at": share_info["created_at"],
            "shared_by_alias": owner_info["alias"] if owner_info else "Anonymous"
        }
        
        # Add interview-specific fields if applicable
        if share_info["chat_type"] == "interview":
            formatted_chat["job_position"] = chat_data.get("job_position")
            formatted_chat["company_name"] = chat_data.get("company_name")
        
        return SharedChatAccess(
            chat=formatted_chat,
            owner_info=owner_info,
            is_expired=False,
            view_count=share_info["view_count"] + 1
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error accessing shared chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to access shared chat"
        )


@router.put("/{share_id}", response_model=SharedChat)
async def update_shared_chat(
    share_id: str,
    share_data: SharedChatUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a shared chat"""
    db = DatabaseManager()
    
    try:
        # Check if share exists and belongs to user
        existing_response = (
            db.client.table("shared_chat")
            .select("*")
            .eq("id", share_id)
            .eq("owner_user_id", str(current_user.id))
            .execute()
        )
        
        if not existing_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shared chat not found"
            )
        
        # Validate shared_with_alias if provided
        if share_data.shared_with_alias:
            target_user = await db.get_user_by_alias(share_data.shared_with_alias)
            if not target_user:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail=f"User with alias '{share_data.shared_with_alias}' not found"
                )
        
        # Prepare update data
        update_data = {}
        if share_data.shared_with_alias is not None:
            update_data["shared_with_alias"] = share_data.shared_with_alias
        if share_data.is_public is not None:
            update_data["is_public"] = share_data.is_public
        if share_data.expires_at is not None:
            update_data["expires_at"] = share_data.expires_at.isoformat()
        
        if not update_data:
            return SharedChat(**existing_response.data[0])
        
        # Update shared chat
        response = (
            db.client.table("shared_chat")
            .update(update_data)
            .eq("id", share_id)
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update shared chat"
            )
        
        return SharedChat(**response.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating shared chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update shared chat"
        )


@router.delete("/{share_id}")
async def delete_shared_chat(
    share_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a shared chat (stop sharing)"""
    db = DatabaseManager()
    
    try:
        # Get share info before deleting
        share_response = (
            db.client.table("shared_chat")
            .select("*")
            .eq("id", share_id)
            .eq("owner_user_id", str(current_user.id))
            .execute()
        )
        
        if not share_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Shared chat not found"
            )
        
        share_info = share_response.data[0]
        
        # Delete shared chat
        delete_response = (
            db.client.table("shared_chat")
            .delete()
            .eq("id", share_id)
            .execute()
        )
        
        if not delete_response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to delete shared chat"
            )
        
        # Update original chat's is_shared flag if no other shares exist
        remaining_shares = (
            db.client.table("shared_chat")
            .select("id", count="exact")
            .eq("chat_id", share_info["chat_id"])
            .eq("chat_type", share_info["chat_type"])
            .execute()
        )
        
        if remaining_shares.count == 0:
            table = "normal_chat" if share_info["chat_type"] == "normal" else "interview_chat"
            (
                db.client.table(table)
                .update({"is_shared": False})
                .eq("id", share_info["chat_id"])
                .execute()
            )
        
        return {"message": "Shared chat deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting shared chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete shared chat"
        )


@router.get("/shared-with-me")
async def get_chats_shared_with_me(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    current_user: User = Depends(get_current_user)
):
    """Get chats shared with current user"""
    db = DatabaseManager()
    
    try:
        offset = (page - 1) * per_page
        
        # Get shares where user is the target
        response = (
            db.client.table("shared_chat")
            .select("*", count="exact")
            .eq("shared_with_alias", current_user.alias)
            .order("created_at", desc=True)
            .range(offset, offset + per_page - 1)
            .execute()
        )
        
        shared_chats = []
        for share_data in response.data or []:
            # Check if not expired
            if share_data["expires_at"]:
                expires_at = datetime.fromisoformat(share_data["expires_at"].replace("Z", "+00:00"))
                if datetime.utcnow().replace(tzinfo=expires_at.tzinfo) > expires_at:
                    continue
            
            # Get chat details
            table = "normal_chat" if share_data["chat_type"] == "normal" else "interview_chat"
            chat_response = (
                db.client.table(table)
                .select("title, created_at")
                .eq("id", share_data["chat_id"])
                .execute()
            )
            
            # Get owner info
            owner_response = (
                db.client.table("user_profile")
                .select("alias, full_name, profile_picture_url")
                .eq("id", share_data["owner_user_id"])
                .execute()
            )
            
            share_info = SharedChat(**share_data).dict()
            if chat_response.data:
                share_info["chat_title"] = chat_response.data[0]["title"]
                share_info["chat_created_at"] = chat_response.data[0]["created_at"]
            if owner_response.data:
                share_info["owner_info"] = owner_response.data[0]
            
            shared_chats.append(share_info)
        
        total = len(shared_chats)
        
        return {
            "shared_chats": shared_chats,
            "total": total,
            "page": page,
            "per_page": per_page,
            "has_next": offset + per_page < total,
            "has_prev": page > 1
        }
        
    except Exception as e:
        logger.error(f"Error getting chats shared with me: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get shared chats"
        )