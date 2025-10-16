"""
Chat models for TOE AI Backend
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any, List
from datetime import datetime
from uuid import UUID
from enum import Enum


class ChatType(str, Enum):
    """Chat type enumeration"""
    NORMAL = "normal"
    INTERVIEW = "interview"


class MessageRole(str, Enum):
    """Message role enumeration"""
    USER = "user"
    ASSISTANT = "assistant"
    SYSTEM = "system"


class Message(BaseModel):
    """Chat message model"""
    role: MessageRole
    content: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    audio_url: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    
    class Config:
        json_encoders = {
            datetime: lambda v: v.isoformat()
        }


class ChatBase(BaseModel):
    """Base chat model"""
    title: str = Field(..., min_length=1, max_length=255)
    conversation: List[Message] = Field(default_factory=list)


class NormalChatCreate(ChatBase):
    """Normal chat creation model"""
    pass


class NormalChatUpdate(BaseModel):
    """Normal chat update model"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    conversation: Optional[List[Message]] = None
    is_shared: Optional[bool] = None


class NormalChat(ChatBase):
    """Normal chat response model"""
    id: UUID
    user_profile_id: UUID
    is_shared: bool = False
    shared_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class InterviewSettings(BaseModel):
    """Interview settings model"""
    voice_speed: float = Field(default=1.0, ge=0.5, le=2.0)
    voice_type: str = Field(default="alloy", pattern=r"^(alloy|echo|fable|onyx|nova|shimmer)$")
    language: str = Field(default="en", min_length=2, max_length=5)
    difficulty: str = Field(default="medium", pattern=r"^(easy|medium|hard)$")
    interview_type: str = Field(default="general", max_length=100)
    enable_video: bool = False
    max_duration_minutes: int = Field(default=60, ge=5, le=120)


class InterviewChatCreate(ChatBase):
    """Interview chat creation model"""
    job_position: Optional[str] = Field(None, max_length=255)
    company_name: Optional[str] = Field(None, max_length=255)
    language: str = Field(default="en", pattern="^(en|fr)$")
    interview_settings: Optional[InterviewSettings] = Field(default_factory=InterviewSettings)


class InterviewChatUpdate(BaseModel):
    """Interview chat update model"""
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    job_position: Optional[str] = Field(None, max_length=255)
    company_name: Optional[str] = Field(None, max_length=255)
    language: Optional[str] = Field(None, pattern="^(en|fr)$")
    conversation: Optional[List[Message]] = None
    interview_settings: Optional[InterviewSettings] = None
    duration_minutes: Optional[int] = None
    is_shared: Optional[bool] = None


class InterviewChat(ChatBase):
    """Interview chat response model"""
    id: UUID
    user_profile_id: UUID
    job_position: Optional[str] = None
    company_name: Optional[str] = None
    language: str = "en"
    interview_settings: InterviewSettings
    duration_minutes: int = 0
    is_shared: bool = False
    shared_at: Optional[datetime] = None
    created_at: datetime
    updated_at: datetime
    
    class Config:
        from_attributes = True


class ChatMessageRequest(BaseModel):
    """Chat message request model"""
    content: str = Field(..., min_length=1, max_length=4000)
    include_audio: bool = False
    conversation_history: Optional[List[Dict[str, Any]]] = Field(default_factory=list)
    files: Optional[List[Dict[str, Any]]] = Field(default_factory=list)


class AudioChatRequest(BaseModel):
    """Audio chat request model"""
    audio_data: bytes
    include_text_response: bool = True


class ChatResponse(BaseModel):
    """Chat response model"""
    message: Message
    usage: Optional[Dict[str, Any]] = None
    cost: Optional[float] = None


class SharedChatCreate(BaseModel):
    """Shared chat creation model"""
    chat_id: UUID
    chat_type: ChatType
    shared_with_alias: Optional[str] = None
    is_public: bool = False
    expires_at: Optional[datetime] = None


class SharedChatUpdate(BaseModel):
    """Shared chat update model"""
    shared_with_alias: Optional[str] = None
    is_public: Optional[bool] = None
    expires_at: Optional[datetime] = None


class SharedChat(BaseModel):
    """Shared chat response model"""
    id: UUID
    chat_id: UUID
    chat_type: ChatType
    owner_user_id: UUID
    shared_with_alias: Optional[str] = None
    share_token: UUID
    is_public: bool = False
    view_count: int = 0
    expires_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class SharedChatAccess(BaseModel):
    """Shared chat access model"""
    chat: Optional[Dict[str, Any]] = None
    owner_info: Optional[Dict[str, str]] = None
    is_expired: bool = False
    view_count: int = 0


class ChatListResponse(BaseModel):
    """Chat list response model"""
    chats: List[Dict[str, Any]]
    total: int
    page: int
    per_page: int
    has_next: bool
    has_prev: bool


class ChatSearchRequest(BaseModel):
    """Chat search request model"""
    query: str = Field(..., min_length=1, max_length=100)
    chat_type: Optional[ChatType] = None
    page: int = Field(default=1, ge=1)
    per_page: int = Field(default=20, ge=1, le=100)


class AudioFile(BaseModel):
    """Audio file model"""
    id: UUID
    chat_id: UUID
    message_index: int
    file_type: str  # 'tts' or 'stt'
    file_url: str
    file_size_bytes: Optional[int] = None
    duration_seconds: Optional[float] = None
    created_at: datetime
    
    class Config:
        from_attributes = True


class PDFExportRequest(BaseModel):
    """PDF export request model"""
    chat_id: UUID
    chat_type: ChatType
    include_metadata: bool = True
    include_audio_links: bool = False


class PDFExportResponse(BaseModel):
    """PDF export response model"""
    pdf_url: str
    filename: str
    file_size_bytes: int
    expires_at: datetime