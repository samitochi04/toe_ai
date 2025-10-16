"""
Chat management routes for TOE AI Backend
"""

from fastapi import APIRouter, HTTPException, Depends, status, Query
from typing import Optional, List
import logging
from datetime import datetime
import uuid

from app.core.auth import get_current_user
from app.core.database import DatabaseManager
from app.models.user import User
from app.models.chat import (
    NormalChatCreate, NormalChatUpdate, NormalChat,
    InterviewChatCreate, InterviewChatUpdate, InterviewChat,
    ChatListResponse, ChatSearchRequest, Message, MessageRole,
    ChatMessageRequest, ChatResponse, PDFExportRequest, PDFExportResponse
)
from app.utils.pdf_export import export_chat_to_pdf

logger = logging.getLogger(__name__)

router = APIRouter()


# ================================================
# NORMAL CHAT ENDPOINTS
# ================================================

@router.get("/normal", response_model=ChatListResponse)
async def get_normal_chats(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, min_length=1, max_length=100),
    current_user: User = Depends(get_current_user)
):
    """Get user's normal chats with pagination"""
    db = DatabaseManager()
    
    try:
        # Calculate offset
        offset = (page - 1) * per_page
        
        # Build query
        query = (
            db.client.table("normal_chat")
            .select("*", count="exact")
            .eq("user_profile_id", str(current_user.id))
            .order("updated_at", desc=True)
            .range(offset, offset + per_page - 1)
        )
        
        # Add search filter if provided
        if search:
            query = query.ilike("title", f"%{search}%")
        
        response = query.execute()
        
        chats = []
        for chat_data in response.data or []:
            # Ensure conversation is properly formatted and add message count and preview
            conversation = chat_data.get('conversation', [])
            chat_dict = NormalChat(**chat_data).dict()
            
            # Add message count and preview for frontend
            chat_dict['messageCount'] = len(conversation)
            if conversation:
                last_message = conversation[-1]
                chat_dict['preview'] = last_message.get('content', '')[:100] + '...' if len(last_message.get('content', '')) > 100 else last_message.get('content', '')
            else:
                chat_dict['preview'] = 'No messages yet'
            
            chats.append(chat_dict)
        
        total = response.count or 0
        has_next = offset + per_page < total
        has_prev = page > 1
        
        return ChatListResponse(
            chats=chats,
            total=total,
            page=page,
            per_page=per_page,
            has_next=has_next,
            has_prev=has_prev
        )
        
    except Exception as e:
        logger.error(f"Error getting normal chats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get chats"
        )


@router.post("/normal", response_model=NormalChat, status_code=status.HTTP_201_CREATED)
async def create_normal_chat(
    chat_data: NormalChatCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new normal chat"""
    # Use service role for creation to bypass RLS issues
    db = DatabaseManager(use_service_role=True)
    
    try:
        # Check usage limits
        can_create = await db.check_usage_limit(str(current_user.id), "normal")
        if not can_create:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Normal chat limit reached. Please upgrade to premium."
            )
        
        # Create chat
        chat_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        # Convert messages to dict with proper datetime handling
        conversation_data = []
        for msg in chat_data.conversation:
            msg_dict = msg.dict()
            if 'timestamp' in msg_dict and isinstance(msg_dict['timestamp'], datetime):
                msg_dict['timestamp'] = msg_dict['timestamp'].isoformat()
            conversation_data.append(msg_dict)
        
        response = (
            db.client.table("normal_chat")
            .insert({
                "id": chat_id,
                "user_profile_id": str(current_user.id),
                "title": chat_data.title,
                "conversation": conversation_data,
                "created_at": now,
                "updated_at": now
            })
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create chat"
            )
        
        # Increment usage count
        await db.increment_usage(str(current_user.id), "normal")
        
        return NormalChat(**response.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating normal chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create chat"
        )


@router.get("/normal/{chat_id}", response_model=NormalChat)
async def get_normal_chat(
    chat_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific normal chat"""
    db = DatabaseManager()
    
    try:
        # Validate chat_id format
        if not chat_id or chat_id == 'undefined' or chat_id == 'new':
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid chat ID"
            )
        
        # Validate UUID format
        try:
            uuid.UUID(chat_id)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid chat ID format"
            )
        
        response = (
            db.client.table("normal_chat")
            .select("*")
            .eq("id", chat_id)
            .eq("user_profile_id", str(current_user.id))
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat not found"
            )
        
        return NormalChat(**response.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting normal chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get chat"
        )


@router.put("/normal/{chat_id}", response_model=NormalChat)
async def update_normal_chat(
    chat_id: str,
    chat_data: NormalChatUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update a normal chat"""
    # Use service role for updates to bypass RLS issues
    db = DatabaseManager(use_service_role=True)
    
    try:
        # Check if chat exists and belongs to user (use regular client for verification)
        regular_db = DatabaseManager(use_service_role=False)
        existing_response = (
            regular_db.client.table("normal_chat")
            .select("*")
            .eq("id", chat_id)
            .eq("user_profile_id", str(current_user.id))
            .execute()
        )
        
        if not existing_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat not found"
            )
        
        # Prepare update data
        update_data = {"updated_at": datetime.utcnow().isoformat()}
        
        if chat_data.title is not None:
            update_data["title"] = chat_data.title
        if chat_data.conversation is not None:
            # Convert messages to dict with proper datetime handling
            conversation_data = []
            for msg in chat_data.conversation:
                msg_dict = msg.dict()
                if 'timestamp' in msg_dict and isinstance(msg_dict['timestamp'], datetime):
                    msg_dict['timestamp'] = msg_dict['timestamp'].isoformat()
                conversation_data.append(msg_dict)
            update_data["conversation"] = conversation_data
        if chat_data.is_shared is not None:
            update_data["is_shared"] = chat_data.is_shared
            if chat_data.is_shared:
                update_data["shared_at"] = datetime.utcnow().isoformat()
        
        # Update chat using service role
        response = (
            db.client.table("normal_chat")
            .update(update_data)
            .eq("id", chat_id)
            .eq("user_profile_id", str(current_user.id))  # Still check ownership
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update chat"
            )
        
        return NormalChat(**response.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating normal chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update chat"
        )


@router.delete("/normal/{chat_id}")
async def delete_normal_chat(
    chat_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete a normal chat"""
    db = DatabaseManager()
    
    try:
        # Delete chat (this will also delete related shared_chat entries due to CASCADE)
        response = (
            db.client.table("normal_chat")
            .delete()
            .eq("id", chat_id)
            .eq("user_profile_id", str(current_user.id))
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat not found"
            )
        
        return {"message": "Chat deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting normal chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete chat"
        )


# ================================================
# INTERVIEW CHAT ENDPOINTS
# ================================================

@router.get("/interview", response_model=ChatListResponse)
async def get_interview_chats(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    search: Optional[str] = Query(None, min_length=1, max_length=100),
    current_user: User = Depends(get_current_user)
):
    """Get user's interview chats with pagination"""
    db = DatabaseManager()
    
    try:
        # Calculate offset
        offset = (page - 1) * per_page
        
        # Build query
        query = (
            db.client.table("interview_chat")
            .select("*", count="exact")
            .eq("user_profile_id", str(current_user.id))
            .order("updated_at", desc=True)
            .range(offset, offset + per_page - 1)
        )
        
        # Add search filter if provided
        if search:
            query = query.or_(f"title.ilike.%{search}%,job_position.ilike.%{search}%,company_name.ilike.%{search}%")
        
        response = query.execute()
        
        chats = []
        for chat_data in response.data or []:
            chats.append(InterviewChat(**chat_data).dict())
        
        total = response.count or 0
        has_next = offset + per_page < total
        has_prev = page > 1
        
        return ChatListResponse(
            chats=chats,
            total=total,
            page=page,
            per_page=per_page,
            has_next=has_next,
            has_prev=has_prev
        )
        
    except Exception as e:
        logger.error(f"Error getting interview chats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get chats"
        )


@router.post("/interview", response_model=InterviewChat, status_code=status.HTTP_201_CREATED)
async def create_interview_chat(
    chat_data: InterviewChatCreate,
    current_user: User = Depends(get_current_user)
):
    """Create a new interview chat"""
    # Use service role for creation to bypass RLS issues
    db = DatabaseManager(use_service_role=True)
    
    try:
        # Check usage limits
        can_create = await db.check_usage_limit(str(current_user.id), "interview")
        if not can_create:
            raise HTTPException(
                status_code=status.HTTP_402_PAYMENT_REQUIRED,
                detail="Interview chat limit reached. Please upgrade to premium."
            )
        
        # Create chat
        chat_id = str(uuid.uuid4())
        now = datetime.utcnow().isoformat()
        
        # Convert messages to dict with proper datetime handling
        conversation_data = []
        for msg in chat_data.conversation:
            msg_dict = msg.dict()
            if 'timestamp' in msg_dict and isinstance(msg_dict['timestamp'], datetime):
                msg_dict['timestamp'] = msg_dict['timestamp'].isoformat()
            conversation_data.append(msg_dict)
        
        response = (
            db.client.table("interview_chat")
            .insert({
                "id": chat_id,
                "user_profile_id": str(current_user.id),
                "title": chat_data.title,
                "job_position": chat_data.job_position,
                "company_name": chat_data.company_name,
                "language": chat_data.language,
                "conversation": conversation_data,
                "interview_settings": chat_data.interview_settings.dict() if chat_data.interview_settings else {},
                "duration_minutes": 0,
                "created_at": now,
                "updated_at": now
            })
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create interview chat"
            )
        
        # Increment usage count
        await db.increment_usage(str(current_user.id), "interview")
        
        return InterviewChat(**response.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating interview chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create interview chat"
        )


@router.get("/interview/{chat_id}", response_model=InterviewChat)
async def get_interview_chat(
    chat_id: str,
    current_user: User = Depends(get_current_user)
):
    """Get a specific interview chat"""
    db = DatabaseManager()
    
    try:
        response = (
            db.client.table("interview_chat")
            .select("*")
            .eq("id", chat_id)
            .eq("user_profile_id", str(current_user.id))
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview chat not found"
            )
        
        return InterviewChat(**response.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting interview chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get interview chat"
        )


@router.put("/interview/{chat_id}", response_model=InterviewChat)
async def update_interview_chat(
    chat_id: str,
    chat_data: InterviewChatUpdate,
    current_user: User = Depends(get_current_user)
):
    """Update an interview chat"""
    db = DatabaseManager()
    
    try:
        # Check if chat exists and belongs to user
        existing_response = (
            db.client.table("interview_chat")
            .select("*")
            .eq("id", chat_id)
            .eq("user_profile_id", str(current_user.id))
            .execute()
        )
        
        if not existing_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview chat not found"
            )
        
        # Prepare update data
        update_data = {"updated_at": datetime.utcnow().isoformat()}
        
        if chat_data.title is not None:
            update_data["title"] = chat_data.title
        if chat_data.job_position is not None:
            update_data["job_position"] = chat_data.job_position
        if chat_data.company_name is not None:
            update_data["company_name"] = chat_data.company_name
        if chat_data.conversation is not None:
            update_data["conversation"] = [msg.dict() for msg in chat_data.conversation]
        if chat_data.interview_settings is not None:
            update_data["interview_settings"] = chat_data.interview_settings.dict()
        if chat_data.duration_minutes is not None:
            update_data["duration_minutes"] = chat_data.duration_minutes
        if chat_data.is_shared is not None:
            update_data["is_shared"] = chat_data.is_shared
            if chat_data.is_shared:
                update_data["shared_at"] = datetime.utcnow().isoformat()
        
        # Update chat
        response = (
            db.client.table("interview_chat")
            .update(update_data)
            .eq("id", chat_id)
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to update interview chat"
            )
        
        return InterviewChat(**response.data[0])
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating interview chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update interview chat"
        )


@router.delete("/interview/{chat_id}")
async def delete_interview_chat(
    chat_id: str,
    current_user: User = Depends(get_current_user)
):
    """Delete an interview chat"""
    db = DatabaseManager()
    
    try:
        # Delete chat (this will also delete related audio_files and shared_chat entries due to CASCADE)
        response = (
            db.client.table("interview_chat")
            .delete()
            .eq("id", chat_id)
            .eq("user_profile_id", str(current_user.id))
            .execute()
        )
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview chat not found"
            )
        
        return {"message": "Interview chat deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting interview chat: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete interview chat"
        )


# ================================================
# PDF EXPORT ENDPOINT
# ================================================

@router.post("/export-pdf", response_model=PDFExportResponse)
async def export_chat_pdf(
    export_request: PDFExportRequest,
    current_user: User = Depends(get_current_user)
):
    """Export chat to PDF"""
    db = DatabaseManager()
    
    try:
        # Get chat data
        if export_request.chat_type.value == "normal":
            table = "normal_chat"
        else:
            table = "interview_chat"
        
        chat_response = (
            db.client.table(table)
            .select("*")
            .eq("id", str(export_request.chat_id))
            .eq("user_profile_id", str(current_user.id))
            .execute()
        )
        
        if not chat_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chat not found"
            )
        
        chat_data = chat_response.data[0]
        user_data = current_user.dict()
        
        # Export to PDF
        pdf_info = export_chat_to_pdf(
            chat_data=chat_data,
            user_data=user_data,
            chat_type=export_request.chat_type.value,
            include_metadata=export_request.include_metadata,
            include_audio_links=export_request.include_audio_links
        )
        
        return PDFExportResponse(**pdf_info)
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error exporting chat to PDF: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to export chat to PDF"
        )


@router.post("/interview/{chat_id}/message")
async def send_interview_chat_message(
    chat_id: str,
    request: ChatMessageRequest,
    current_user: User = Depends(get_current_user)
):
    """Send message to existing interview chat"""
    db = DatabaseManager()
    
    try:
        # Get existing chat
        chat_response = (
            db.client.table("interview_chat")
            .select("*")
            .eq("id", chat_id)
            .eq("user_profile_id", str(current_user.id))
            .execute()
        )
        
        if not chat_response.data:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Interview chat not found"
            )
        
        chat_data = chat_response.data[0]
        
        # Add user message to conversation (user is the candidate)
        user_message = {
            "role": "user",
            "content": request.content,
            "timestamp": datetime.utcnow().isoformat()
        }
        
        conversation = chat_data.get("conversation", [])
        conversation.append(user_message)
        
        # Get AI response with context from chat (AI is the interviewer)
        from app.api.routes.ai import interview_chat
        
        ai_request = ChatMessageRequest(
            content=request.content,
            include_audio=True,
            conversation_history=conversation[-10:]  # Last 10 messages for context
        )
        
        ai_response = await interview_chat(
            ai_request,
            chat_data.get("job_position"),
            chat_data.get("company_name"),
            chat_data.get("interview_settings", {}).get("difficulty", "medium"),
            chat_data.get("language", "en"),
            current_user
        )
        
        # Add AI message to conversation (AI is the interviewer)
        ai_message = {
            "role": "assistant",
            "content": ai_response.message.content,
            "timestamp": datetime.utcnow().isoformat(),
            "audio_url": ai_response.message.audio_url
        }
        
        conversation.append(ai_message)
        
        # Update chat in database
        update_response = (
            db.client.table("interview_chat")
            .update({
                "conversation": conversation,
                "updated_at": datetime.utcnow().isoformat()
            })
            .eq("id", chat_id)
            .execute()
        )
        
        if not update_response.data:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update chat"
            )
        
        return {
            "message": ai_response.message,
            "chat": InterviewChat(**update_response.data[0]),
            "usage": ai_response.usage,
            "cost": ai_response.cost
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sending interview message: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send message"
        )