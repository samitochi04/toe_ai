"""
AI integration routes for TOE AI Backend
OpenAI, Whisper, and Coqui TTS integration
"""

from fastapi import APIRouter, HTTPException, Depends, status, File, UploadFile
from typing import Optional
import logging
from openai import OpenAI
import os
import uuid
import json
import asyncio
from datetime import datetime

from app.core.auth import get_current_user
from app.core.database import DatabaseManager
from app.core.config import settings
from app.models.user import User
from app.models.chat import (
    ChatMessageRequest, ChatResponse, AudioChatRequest,
    Message, MessageRole
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Initialize OpenAI client
client = OpenAI(api_key=settings.OPENAI_API_KEY)


# ================================================
# OPENAI CHAT COMPLETION
# ================================================

@router.post("/chat/completion", response_model=ChatResponse)
async def chat_completion(
    request: ChatMessageRequest,
    current_user: User = Depends(get_current_user)
):
    """Get AI response for normal chat"""
    db = DatabaseManager()
    
    try:
        # Prepare messages for OpenAI with conversation history
        messages = [
            {"role": "system", "content": "You are a helpful AI assistant designed to help users prepare for interviews and answer general questions."}
        ]
        
        # Add conversation history if provided
        if hasattr(request, 'conversation_history') and request.conversation_history:
            # Add last 10 messages for context
            for msg in request.conversation_history[-10:]:
                if isinstance(msg, dict):
                    role = "user" if msg.get("role") == "user" else "assistant"
                    content = msg.get("content", "")
                    if content:
                        messages.append({"role": role, "content": content})
        
        # Add current user message
        messages.append({"role": "user", "content": request.content})
        
        # Make OpenAI API call
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=settings.OPENAI_MODEL,
            messages=messages,
            max_tokens=settings.OPENAI_MAX_TOKENS,
            temperature=settings.OPENAI_TEMPERATURE
        )
        
        # Extract response data
        ai_message = response.choices[0].message.content
        usage_data = response.usage
        
        # Calculate cost (approximate) - only if cost calculation function exists
        cost = 0.0
        try:
            cost = calculate_openai_cost(usage_data, settings.OPENAI_MODEL)
        except NameError:
            # Cost calculation function not implemented, use default
            cost = (usage_data.total_tokens / 1000) * 0.002  # Approximate cost
        
        # Log API usage - only if log function exists
        try:
            await db.log_api_usage(
                user_id=str(current_user.id),
                provider="openai",
                endpoint="chat_completion",
                tokens=usage_data.total_tokens,
                cost=cost
            )
        except Exception as log_error:
            logger.warning(f"Failed to log API usage: {log_error}")
        
        # Create response message
        message = Message(
            role=MessageRole.ASSISTANT,
            content=ai_message,
            timestamp=datetime.utcnow()
        )
        
        return ChatResponse(
            message=message,
            usage=usage_data.model_dump() if hasattr(usage_data, 'model_dump') else usage_data.__dict__,
            cost=cost
        )
        
    except Exception as e:
        logger.error(f"OpenAI chat completion error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get AI response"
        )


@router.post("/interview/chat", response_model=ChatResponse)
async def interview_chat(
    request: ChatMessageRequest,
    job_position: Optional[str] = None,
    company_name: Optional[str] = None,
    difficulty: str = "medium",
    current_user: User = Depends(get_current_user)
):
    """Get AI response for interview chat with context"""
    db = DatabaseManager()
    
    try:
        # Build system prompt for interview context
        system_prompt = build_interview_system_prompt(job_position, company_name, difficulty)
        
        # Prepare messages for OpenAI with conversation history
        messages = [
            {"role": "system", "content": system_prompt}
        ]
        
        # Add conversation history if provided
        if hasattr(request, 'conversation_history') and request.conversation_history:
            # Add last 10 messages for context
            for msg in request.conversation_history[-10:]:
                if isinstance(msg, dict):
                    role = "user" if msg.get("role") == "user" else "assistant"
                    content = msg.get("content", "")
                    if content:
                        messages.append({"role": role, "content": content})
        
        # Add current user message
        messages.append({"role": "user", "content": request.content})
        
        # Make OpenAI API call
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model=settings.OPENAI_MODEL,
            messages=messages,
            max_tokens=settings.OPENAI_MAX_TOKENS,
            temperature=0.8  # Slightly higher for more natural interview conversation
        )
        
        # Extract response data
        ai_message = response.choices[0].message.content
        usage_data = response.usage
        
        # Calculate cost
        cost = calculate_openai_cost(usage_data, settings.OPENAI_MODEL)
        
        # Always generate audio for interview responses
        audio_url = None
        try:
            audio_url = await generate_tts_audio(ai_message, str(current_user.id))
        except Exception as tts_error:
            logger.error(f"TTS generation failed: {tts_error}")
            # Don't fail the whole request if TTS fails
        
        # Log API usage
        try:
            await db.log_api_usage(
                user_id=str(current_user.id),
                provider="openai",
                endpoint="interview_chat",
                tokens=usage_data.total_tokens,
                cost=cost
            )
        except Exception as log_error:
            logger.warning(f"Failed to log API usage: {log_error}")
        
        # Create response message
        message = Message(
            role=MessageRole.ASSISTANT,
            content=ai_message,
            timestamp=datetime.utcnow(),
            audio_url=audio_url
        )
        
        return ChatResponse(
            message=message,
            usage=usage_data.model_dump() if hasattr(usage_data, 'model_dump') else usage_data.__dict__,
            cost=cost
        )
        
    except Exception as e:
        logger.error(f"Interview chat error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get interview response"
        )


# ================================================
# SPEECH-TO-TEXT (WHISPER)
# ================================================

@router.post("/speech-to-text")
async def speech_to_text(
    audio_file: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Convert speech to text using Whisper API"""
    db = DatabaseManager()
    
    # Validate file type
    if not audio_file.content_type or not audio_file.content_type.startswith("audio/"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an audio file"
        )
    
    # Check file extension
    file_extension = audio_file.filename.split(".")[-1].lower()
    if file_extension not in settings.ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Audio format not supported. Allowed formats: {', '.join(settings.ALLOWED_AUDIO_EXTENSIONS)}"
        )
    
    try:
        # Save uploaded file temporarily
        temp_filename = f"temp_{uuid.uuid4()}.{file_extension}"
        temp_path = os.path.join(settings.UPLOAD_DIR, "temp", temp_filename)
        
        with open(temp_path, "wb") as buffer:
            content = await audio_file.read()
            buffer.write(content)
        
        # Check file size
        if len(content) > settings.MAX_FILE_SIZE:
            os.remove(temp_path)
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"File too large. Maximum size: {settings.MAX_FILE_SIZE / (1024*1024):.1f}MB"
            )
        
        # Transcribe with Whisper
        with open(temp_path, "rb") as audio:
            response = await asyncio.to_thread(
                client.audio.transcriptions.create,
                model=settings.WHISPER_MODEL,
                file=audio,
                response_format="json"
            )
        
        # Clean up temp file
        os.remove(temp_path)
        
        # Log API usage
        await db.log_api_usage(
            user_id=str(current_user.id),
            provider="openai",
            endpoint="whisper_transcribe",
            tokens=None,  # Whisper doesn't use tokens
            cost=0.006 * (len(content) / (1024 * 1024))  # Approximate cost per MB
        )
        
        return {
            "text": response.text,
            "duration": response.get("duration"),
            "language": response.get("language", "en")
        }
        
    except Exception as e:
        # Clean up temp file on error
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        logger.error(f"Speech-to-text error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to transcribe audio"
        )


# ================================================
# TEXT-TO-SPEECH (OPENAI TTS)
# ================================================

@router.post("/text-to-speech")
async def text_to_speech(
    text: str,
    voice: str = "alloy",
    speed: float = 1.0,
    current_user: User = Depends(get_current_user)
):
    """Convert text to speech using OpenAI TTS"""
    db = DatabaseManager()
    
    if len(text) > 4000:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Text too long. Maximum 4000 characters."
        )
    
    # Validate voice
    valid_voices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"]
    if voice not in valid_voices:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid voice. Valid voices: {', '.join(valid_voices)}"
        )
    
    # Validate speed
    if not 0.25 <= speed <= 4.0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Speed must be between 0.25 and 4.0"
        )
    
    try:
        # Generate audio with OpenAI TTS
        response = await asyncio.to_thread(
            client.audio.speech.create,
            model=settings.TTS_MODEL,
            voice=voice,
            input=text,
            speed=speed
        )
        
        # Save audio file
        audio_filename = f"tts_{uuid.uuid4()}.mp3"
        audio_path = os.path.join(settings.UPLOAD_DIR, "audio", audio_filename)
        
        with open(audio_path, "wb") as audio_file:
            audio_file.write(response.content)
        
        # Get file size and generate URL
        file_size = os.path.getsize(audio_path)
        audio_url = f"/static/uploads/audio/{audio_filename}"
        
        # Log API usage
        await db.log_api_usage(
            user_id=str(current_user.id),
            provider="openai",
            endpoint="tts",
            tokens=None,
            cost=0.015 * (len(text) / 1000)  # $0.015 per 1K characters
        )
        
        return {
            "audio_url": audio_url,
            "file_size_bytes": file_size,
            "voice": voice,
            "speed": speed
        }
        
    except Exception as e:
        logger.error(f"Text-to-speech error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to generate audio"
        )


# ================================================
# AUDIO CHAT (STT + CHAT + TTS)
# ================================================

@router.post("/audio-chat")
async def audio_chat(
    audio_file: UploadFile = File(...),
    include_text_response: bool = True,
    job_position: Optional[str] = None,
    company_name: Optional[str] = None,
    voice: str = "alloy",
    current_user: User = Depends(get_current_user)
):
    """Complete audio chat workflow: STT -> Chat -> TTS"""
    
    try:
        # Step 1: Convert speech to text
        stt_result = await speech_to_text(audio_file, current_user)
        user_text = stt_result["text"]
        
        # Step 2: Get AI response
        if job_position or company_name:
            # Interview chat
            chat_request = ChatMessageRequest(content=user_text, include_audio=True)
            ai_response = await interview_chat(
                chat_request, 
                job_position, 
                company_name, 
                "medium", 
                current_user
            )
        else:
            # Normal chat
            chat_request = ChatMessageRequest(content=user_text, include_audio=True)
            ai_response = await chat_completion(chat_request, current_user)
        
        # Step 3: Generate TTS (if not already included)
        if not ai_response.message.audio_url:
            tts_result = await text_to_speech(
                ai_response.message.content, 
                voice, 
                1.0, 
                current_user
            )
            ai_response.message.audio_url = tts_result["audio_url"]
        
        # Build response
        response = {
            "user_text": user_text,
            "ai_message": ai_response.message,
            "usage": ai_response.usage,
            "cost": ai_response.cost
        }
        
        if include_text_response:
            response["ai_text"] = ai_response.message.content
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Audio chat error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process audio chat"
        )


# ================================================
# HELPER FUNCTIONS
# ================================================

def build_interview_system_prompt(job_position: Optional[str], company_name: Optional[str], difficulty: str) -> str:
    """Build system prompt for interview context"""
    base_prompt = f"""You are Sarah, an experienced HR recruiter and interviewer at {company_name if company_name else 'the company'}. You are conducting a job interview for the position of {job_position if job_position else 'the role'}. Your role is to:

1. Act as a professional, friendly interviewer/recruiter
2. Ask relevant questions about the candidate's experience, skills, and qualifications for the {job_position if job_position else 'position'}
3. Follow up on their answers with deeper, insightful questions
4. Evaluate their fit for the role and company culture
5. Be professional yet conversational and welcoming

"""
    
    if company_name:
        base_prompt += f"You work as an HR recruiter at {company_name}. "
    
    if job_position:
        base_prompt += f"You are interviewing candidates for the {job_position} position. "
        base_prompt += f"Focus on skills, experience, and qualifications relevant to this specific role. "
    
    difficulty_context = {
        "easy": "Conduct a friendly, encouraging interview suitable for entry-level or junior candidates. Ask straightforward questions and provide guidance when needed.",
        "medium": "Conduct a standard professional interview with follow-up questions. Expect solid experience and clear explanations from the candidate.",
        "hard": "Conduct a rigorous interview with challenging technical questions, complex scenarios, and deep behavioral questions. Expect detailed, expert-level responses."
    }
    
    base_prompt += difficulty_context.get(difficulty, difficulty_context["medium"])
    
    base_prompt += f"""

Interview Guidelines:
- Greet the candidate warmly when they introduce themselves
- Ask one question at a time and wait for their response
- Follow up on interesting points they mention
- Ask about their experience, motivations, and technical skills
- Inquire about their interest in {company_name if company_name else 'the company'} and the {job_position if job_position else 'role'}
- Be encouraging and professional throughout

Remember: You are the interviewer (Sarah), and the user is the candidate being interviewed. Always respond from the perspective of the interviewer asking questions and evaluating the candidate."""

    return base_prompt


def calculate_openai_cost(usage_data, model: str) -> float:
    """Calculate approximate cost for OpenAI API usage"""
    # Pricing as of 2024 (prices may change)
    pricing = {
        "gpt-3.5-turbo": {"input": 0.0015, "output": 0.002},  # per 1K tokens
        "gpt-4": {"input": 0.03, "output": 0.06},
        "gpt-4-turbo": {"input": 0.01, "output": 0.03}
    }
    
    if model not in pricing:
        return 0.0
    
    input_cost = (usage_data.prompt_tokens / 1000) * pricing[model]["input"]
    output_cost = (usage_data.completion_tokens / 1000) * pricing[model]["output"]
    
    return input_cost + output_cost


async def generate_tts_audio(text: str, user_id: str) -> Optional[str]:
    """Generate TTS audio and return URL"""
    try:
        # Ensure audio directory exists
        audio_dir = os.path.join(settings.UPLOAD_DIR, "audio")
        os.makedirs(audio_dir, exist_ok=True)
        
        # Generate audio filename
        audio_filename = f"tts_{user_id}_{uuid.uuid4()}.mp3"
        audio_path = os.path.join(audio_dir, audio_filename)
        
        # Generate audio with OpenAI TTS
        response = await asyncio.to_thread(
            client.audio.speech.create,
            model=settings.TTS_MODEL,
            voice="alloy",  # Professional voice for interviews
            input=text[:4000],  # Truncate if too long
            speed=1.0
        )
        
        # Save audio file
        with open(audio_path, "wb") as audio_file:
            audio_file.write(response.content)
        
        # Return full URL for the audio file
        return f"http://localhost:8000/static/uploads/audio/{audio_filename}"
        
    except Exception as e:
        logger.error(f"TTS generation error: {e}")
        return None


@router.post("/interview/message")
async def send_interview_message(
    request: ChatMessageRequest,
    job_position: Optional[str] = None,
    company_name: Optional[str] = None,
    difficulty: str = "medium",
    voice_type: str = "alloy",
    voice_speed: float = 1.0,
    current_user: User = Depends(get_current_user)
):
    """Send message in interview context and get audio response"""
    db = DatabaseManager()
    
    try:
        # Get AI response with interview context
        chat_response = await interview_chat(
            request, 
            job_position, 
            company_name, 
            difficulty, 
            current_user
        )
        
        # Generate audio for the AI response
        if chat_response.message.content:
            try:
                tts_result = await text_to_speech(
                    chat_response.message.content,
                    voice_type,
                    voice_speed,
                    current_user
                )
                chat_response.message.audio_url = tts_result["audio_url"]
            except Exception as tts_error:
                logger.warning(f"TTS generation failed: {tts_error}")
                # Continue without audio if TTS fails
        
        return {
            "message": chat_response.message,
            "usage": chat_response.usage,
            "cost": chat_response.cost,
            "interview_context": {
                "job_position": job_position,
                "company_name": company_name,
                "difficulty": difficulty
            }
        }
        
    except Exception as e:
        logger.error(f"Interview message error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to process interview message"
        )