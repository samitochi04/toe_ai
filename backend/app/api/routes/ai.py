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
            {"role": "system", "content": "You are a helpful AI assistant designed to help users prepare for interviews and answer general questions. You can analyze documents, provide feedback on resumes and cover letters, and help with various professional development tasks. When users upload files, you should acknowledge that you can see and analyze their content."}
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
        
        # Process files if any are attached
        file_content = ""
        if hasattr(request, 'files') and request.files and len(request.files) > 0:
            try:
                file_content = await process_attached_files(request.files)
                logger.info(f"Processed {len(request.files)} files, content length: {len(file_content)}")
            except Exception as file_error:
                logger.error(f"Error processing files: {file_error}")
                file_content = f"[Error processing {len(request.files)} attached file(s): {str(file_error)}]"
        
        # Combine user message with file content
        user_content = request.content
        if file_content:
            if user_content and user_content.strip():
                user_content += f"\n\nAttached file content:\n{file_content}"
            else:
                user_content = f"Please analyze this attached file:\n\n{file_content}"
        
        # Add current user message
        messages.append({"role": "user", "content": user_content})
        
        logger.info(f"Sending to OpenAI: {len(messages)} messages, user content length: {len(user_content)}")
        
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
    language: str = "en",
    current_user: User = Depends(get_current_user)
):
    """Get AI response for interview chat with context"""
    db = DatabaseManager()
    
    try:
        # Build system prompt for interview context
        system_prompt = build_interview_system_prompt(job_position, company_name, difficulty, language)
        
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
        
        # Process files if any are attached
        file_content = ""
        if hasattr(request, 'files') and request.files and len(request.files) > 0:
            try:
                file_content = await process_attached_files(request.files)
                logger.info(f"Processed {len(request.files)} files for interview chat, content length: {len(file_content)}")
            except Exception as file_error:
                logger.error(f"Error processing files in interview chat: {file_error}")
                file_content = f"[Error processing {len(request.files)} attached file(s): {str(file_error)}]"
        
        # Combine user message with file content
        user_content = request.content
        if file_content:
            if user_content and user_content.strip():
                user_content += f"\n\nAttached file content:\n{file_content}"
            else:
                user_content = f"Please analyze this attached file for the interview:\n\n{file_content}"
        
        # Add current user message
        messages.append({"role": "user", "content": user_content})
        
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
    audio: UploadFile = File(...),
    current_user: User = Depends(get_current_user)
):
    """Convert speech to text using Whisper API"""
    db = DatabaseManager()
    
    logger.info(f"Speech-to-text request - filename: {audio.filename}, content_type: {audio.content_type}")
    
    # Validate file type
    if not audio.content_type or not audio.content_type.startswith("audio/"):
        logger.warning(f"Invalid content type: {audio.content_type}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an audio file"
        )
    
    # Check file extension
    if not audio.filename or "." not in audio.filename:
        logger.warning(f"No filename or extension found: {audio.filename}")
        # Default to wav for audio recordings
        file_extension = "wav"
    else:
        file_extension = audio.filename.split(".")[-1].lower()
        if file_extension not in settings.ALLOWED_AUDIO_EXTENSIONS:
            logger.warning(f"Unsupported file extension: {file_extension}")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Audio format not supported. Allowed formats: {', '.join(settings.ALLOWED_AUDIO_EXTENSIONS)}"
            )
    
    temp_path = None
    try:
        # Save uploaded file temporarily
        temp_filename = f"temp_{uuid.uuid4()}.{file_extension}"
        
        # Use static uploads directory (same as main.py setup)
        static_dir = "static"
        temp_path = os.path.join(static_dir, "uploads", "temp", temp_filename)
        
        # Ensure temp directory exists
        os.makedirs(os.path.dirname(temp_path), exist_ok=True)
        
        with open(temp_path, "wb") as buffer:
            content = await audio.read()
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
        
        logger.info(f"Whisper transcription successful. Text length: {len(response.text)}")
        
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
            "duration": getattr(response, 'duration', None),
            "language": getattr(response, 'language', 'en')
        }
        
    except Exception as e:
        # Clean up temp file on error
        if temp_path and os.path.exists(temp_path):
            try:
                os.remove(temp_path)
            except Exception as cleanup_error:
                logger.warning(f"Failed to clean up temp file: {cleanup_error}")
        
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

def build_interview_system_prompt(job_position: Optional[str], company_name: Optional[str], difficulty: str, language: str = "en") -> str:
    """Build system prompt for interview context"""
    
    # Language-specific prompts
    if language == "fr":
        base_prompt = f"""Tu es Sarah, une recruteuse RH expérimentée et intervieweuse chez {company_name if company_name else 'la compagnie'}. Tu mènes un entretien d'embauche pour le poste de {job_position if job_position else 'le poste'}. Ton rôle est de:

1. Agir comme une intervieweuse/recruteuse professionnelle et amicale
2. Poser des questions pertinentes sur l'expérience, les compétences et les qualifications du candidat pour le {job_position if job_position else 'poste'}
3. Creuser plus profondément avec des questions perspicaces sur leurs réponses
4. Évaluer leur adéquation avec le poste et la culture d'entreprise
5. Être professionnelle tout en restant conversationnelle et accueillante

IMPORTANT: Réponds TOUJOURS en français. Mène l'entretien entièrement en français.

"""
    else:
        base_prompt = f"""You are Sarah, an experienced HR recruiter and interviewer at {company_name if company_name else 'the company'}. You are conducting a job interview for the position of {job_position if job_position else 'the role'}. Your role is to:

1. Act as a professional, friendly interviewer/recruiter
2. Ask relevant questions about the candidate's experience, skills, and qualifications for the {job_position if job_position else 'position'}
3. Follow up on their answers with deeper, insightful questions
4. Evaluate their fit for the role and company culture
5. Be professional yet conversational and welcoming

IMPORTANT: Always respond in English. Conduct the interview entirely in English.

"""
    
    if company_name:
        base_prompt += f"You work as an HR recruiter at {company_name}. "
    
    if job_position:
        base_prompt += f"You are interviewing candidates for the {job_position} position. "
        base_prompt += f"Focus on skills, experience, and qualifications relevant to this specific role. "
    
    if language == "fr":
        difficulty_context = {
            "easy": "Mène un entretien amical et encourageant adapté aux candidats débutants ou juniors. Pose des questions directes et fournis des conseils si nécessaire.",
            "medium": "Mène un entretien professionnel standard avec des questions de suivi. Attends-toi à une expérience solide et des explications claires du candidat.",
            "hard": "Mène un entretien rigoureux avec des questions techniques difficiles, des scénarios complexes et des questions comportementales approfondies. Attends-toi à des réponses détaillées et expertes."
        }
        
        base_prompt += difficulty_context.get(difficulty, difficulty_context["medium"])
        
        base_prompt += f"""

Directives d'entretien:
- Salue chaleureusement le candidat quand il se présente
- Pose une question à la fois et attends sa réponse
- Creuse les points intéressants qu'il mentionne
- Demande à propos de son expérience, ses motivations et ses compétences techniques
- Renseigne-toi sur son intérêt pour {company_name if company_name else 'la compagnie'} et le {job_position if job_position else 'poste'}
- Sois encourageante et professionnelle tout au long

Rappel: Tu es l'intervieweuse (Sarah), et l'utilisateur est le candidat qui passe l'entretien. Réponds toujours du point de vue de l'intervieweuse qui pose des questions et évalue le candidat."""
    else:
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


async def process_attached_files(files: list) -> str:
    """Process attached files and extract text content"""
    if not files:
        return ""
        
    file_contents = []
    
    for file_info in files:
        try:
            # Get file information
            file_path = file_info.get('file_path') or file_info.get('path')
            file_name = file_info.get('original_name') or file_info.get('name') or file_info.get('filename', 'Unknown file')
            file_type = file_info.get('content_type') or file_info.get('type', '')
            
            logger.info(f"Processing file: {file_name}, path: {file_path}, type: {file_type}")
            
            if not file_path:
                logger.warning(f"No file path found for file: {file_info}")
                file_contents.append(f"--- {file_name} ---\n[Error: No file path provided]\n")
                continue
            
            if not os.path.exists(file_path):
                logger.warning(f"File not found: {file_path}")
                file_contents.append(f"--- {file_name} ---\n[Error: File not found at {file_path}]\n")
                continue
            
            # Extract text based on file type
            if file_type and (file_type.startswith('text/') or file_name.endswith(('.txt', '.md'))):
                # Read text files directly
                try:
                    with open(file_path, 'r', encoding='utf-8') as f:
                        content = f.read()[:15000]  # Limit to 15k characters
                        file_contents.append(f"--- {file_name} ---\n{content}\n")
                        logger.info(f"Successfully read text file: {file_name}")
                except UnicodeDecodeError:
                    try:
                        with open(file_path, 'r', encoding='latin-1') as f:
                            content = f.read()[:15000]
                            file_contents.append(f"--- {file_name} ---\n{content}\n")
                            logger.info(f"Successfully read text file with latin-1: {file_name}")
                    except Exception as e:
                        logger.error(f"Error reading text file {file_name}: {e}")
                        file_contents.append(f"--- {file_name} ---\n[Error reading file: {str(e)}]\n")
            
            elif file_name.lower().endswith('.pdf'):
                # Extract text from PDF using multiple methods
                pdf_content = ""
                
                # Try PyPDF2 first
                try:
                    import PyPDF2
                    with open(file_path, 'rb') as f:
                        reader = PyPDF2.PdfReader(f)
                        text_parts = []
                        
                        # Read all pages, but limit total content
                        for page_num, page in enumerate(reader.pages):
                            if len(''.join(text_parts)) > 12000:  # Stop if we have enough content
                                break
                            try:
                                page_text = page.extract_text()
                                if page_text.strip():
                                    text_parts.append(f"\n--- Page {page_num + 1} ---\n{page_text}")
                            except Exception as page_error:
                                logger.warning(f"Error extracting page {page_num + 1} from {file_name}: {page_error}")
                                continue
                        
                        pdf_content = ''.join(text_parts)
                        
                        if pdf_content.strip():
                            file_contents.append(f"--- {file_name} ---\n{pdf_content[:15000]}\n")
                            logger.info(f"Successfully extracted PDF content using PyPDF2: {file_name}")
                        else:
                            # Try alternative PDF processing
                            pdf_content = await try_alternative_pdf_extraction(file_path, file_name)
                            if pdf_content:
                                file_contents.append(f"--- {file_name} ---\n{pdf_content}\n")
                            else:
                                file_contents.append(f"--- {file_name} ---\n[PDF appears to be empty or text could not be extracted. This might be a scanned PDF or contain only images. Please try converting it to text first.]\n")
                
                except ImportError:
                    logger.error("PyPDF2 not installed - attempting alternative PDF processing")
                    # Try alternative method
                    pdf_content = await try_alternative_pdf_extraction(file_path, file_name)
                    if pdf_content:
                        file_contents.append(f"--- {file_name} ---\n{pdf_content}\n")
                    else:
                        file_contents.append(f"--- {file_name} ---\n[PDF processing libraries not available. Please install PyPDF2 or provide the text content directly.]\n")
                
                except Exception as pdf_error:
                    logger.error(f"PDF processing error for {file_name}: {pdf_error}")
                    # Try alternative method as fallback
                    pdf_content = await try_alternative_pdf_extraction(file_path, file_name)
                    if pdf_content:
                        file_contents.append(f"--- {file_name} ---\n{pdf_content}\n")
                    else:
                        file_contents.append(f"--- {file_name} ---\n[Error reading PDF: {str(pdf_error)}. This might be a protected, scanned, or complex PDF.]\n")
            
            elif file_name.lower().endswith(('.doc', '.docx')):
                # Extract text from Word documents
                try:
                    import docx
                    doc = docx.Document(file_path)
                    text_parts = []
                    
                    for paragraph in doc.paragraphs:
                        text_parts.append(paragraph.text)
                        if len('\n'.join(text_parts)) > 15000:  # Limit content
                            break
                    
                    text = '\n'.join(text_parts)
                    
                    if text.strip():
                        file_contents.append(f"--- {file_name} ---\n{text[:15000]}\n")
                        logger.info(f"Successfully extracted Word document content: {file_name}")
                    else:
                        file_contents.append(f"--- {file_name} ---\n[Document appears to be empty or contains only formatting/images]\n")
                
                except ImportError:
                    file_contents.append(f"--- {file_name} ---\n[Word document processing not available - python-docx not installed]\n")
                    logger.warning("python-docx not available for Word document processing")
                
                except Exception as doc_error:
                    logger.error(f"Word document processing error for {file_name}: {doc_error}")
                    file_contents.append(f"--- {file_name} ---\n[Error reading Word document: {str(doc_error)}]\n")
            
            elif file_type and file_type.startswith('image/'):
                # For images, provide helpful message
                file_size_mb = round(os.path.getsize(file_path) / (1024 * 1024), 2)
                file_contents.append(f"--- {file_name} ---\n[Image file uploaded ({file_size_mb}MB) - I can see this is an image file but cannot analyze visual content. If this image contains text (like a screenshot or document scan), please describe what you'd like me to help you with regarding this image, or use OCR tools to extract the text first.]\n")
                logger.info(f"Image file noted: {file_name}")
            
            else:
                # For other file types, provide helpful message
                file_size_mb = round(os.path.getsize(file_path) / (1024 * 1024), 2)
                file_contents.append(f"--- {file_name} ---\n[File uploaded ({file_size_mb}MB) but type '{file_type}' is not supported for text extraction. Supported formats: PDF, Word documents (.doc/.docx), text files (.txt), and images. Please describe what you'd like me to help you with regarding this file.]\n")
                logger.info(f"Unsupported file type: {file_name} ({file_type})")
        
        except Exception as e:
            logger.error(f"Error processing file {file_info}: {e}")
            file_name = file_info.get('name', 'Unknown file')
            file_contents.append(f"--- {file_name} ---\n[Error processing file: {str(e)}]\n")
    
    result = "\n".join(file_contents) if file_contents else ""
    logger.info(f"File processing complete. Total content length: {len(result)}")
    return result


async def try_alternative_pdf_extraction(file_path: str, file_name: str) -> str:
    """Try alternative PDF extraction methods"""
    try:
        # Try using pdfplumber if available
        try:
            import pdfplumber
            with pdfplumber.open(file_path) as pdf:
                text_parts = []
                for page_num, page in enumerate(pdf.pages):
                    if len(''.join(text_parts)) > 12000:
                        break
                    try:
                        page_text = page.extract_text()
                        if page_text and page_text.strip():
                            text_parts.append(f"\n--- Page {page_num + 1} ---\n{page_text}")
                    except Exception:
                        continue
                
                content = ''.join(text_parts)
                if content.strip():
                    logger.info(f"Successfully extracted PDF using pdfplumber: {file_name}")
                    return content[:15000]
        except ImportError:
            pass
        
        # Try using pymupdf (fitz) if available
        try:
            import fitz  # PyMuPDF
            doc = fitz.open(file_path)
            text_parts = []
            
            for page_num in range(min(len(doc), 10)):  # Limit to first 10 pages
                if len(''.join(text_parts)) > 12000:
                    break
                try:
                    page = doc[page_num]
                    page_text = page.get_text()
                    if page_text and page_text.strip():
                        text_parts.append(f"\n--- Page {page_num + 1} ---\n{page_text}")
                except Exception:
                    continue
            
            doc.close()
            content = ''.join(text_parts)
            if content.strip():
                logger.info(f"Successfully extracted PDF using PyMuPDF: {file_name}")
                return content[:15000]
        except ImportError:
            pass
            
    except Exception as e:
        logger.error(f"Alternative PDF extraction failed for {file_name}: {e}")
    
    return ""