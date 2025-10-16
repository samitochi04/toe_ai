"""
File upload routes for TOE AI Backend
"""

from fastapi import APIRouter, HTTPException, Depends, status, File, UploadFile
from typing import List
import logging
import os
import uuid
from datetime import datetime

from app.core.auth import get_current_user
from app.core.config import settings
from app.models.user import User

logger = logging.getLogger(__name__)

router = APIRouter()

# Allowed file extensions and MIME types
ALLOWED_EXTENSIONS = {'.pdf', '.txt', '.doc', '.docx', '.jpg', '.jpeg', '.png', '.gif'}
ALLOWED_MIME_TYPES = {
    'application/pdf',
    'text/plain',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'image/jpeg',
    'image/png',
    'image/gif'
}

MAX_FILE_SIZE = 10 * 1024 * 1024  # 10MB


@router.post("/upload")
async def upload_files(
    files: List[UploadFile] = File(...),
    current_user: User = Depends(get_current_user)
):
    """Upload multiple files"""
    
    if len(files) > 5:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 5 files allowed"
        )
    
    uploaded_files = []
    
    try:
        # Ensure upload directory exists
        upload_dir = os.path.join(settings.UPLOAD_DIR, "user_files", str(current_user.id))
        os.makedirs(upload_dir, exist_ok=True)
        
        for file in files:
            # Validate file
            if not file.filename:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="No filename provided"
                )
            
            # Check file extension
            file_ext = os.path.splitext(file.filename)[1].lower()
            if file_ext not in ALLOWED_EXTENSIONS:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File type {file_ext} not allowed. Allowed types: {', '.join(ALLOWED_EXTENSIONS)}"
                )
            
            # Read file content and check size
            content = await file.read()
            if len(content) > MAX_FILE_SIZE:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail=f"File {file.filename} too large. Maximum size: {MAX_FILE_SIZE // (1024*1024)}MB"
                )
            
            # Generate unique filename
            file_id = str(uuid.uuid4())
            safe_filename = f"{file_id}{file_ext}"
            file_path = os.path.join(upload_dir, safe_filename)
            
            # Save file
            with open(file_path, "wb") as f:
                f.write(content)
            
            # Create file info
            file_info = {
                "id": file_id,
                "name": file.filename,
                "original_name": file.filename,
                "filename": safe_filename,
                "file_path": file_path,
                "relative_path": f"user_files/{current_user.id}/{safe_filename}",
                "content_type": file.content_type or 'application/octet-stream',
                "type": file.content_type or 'application/octet-stream',
                "size": len(content),
                "uploaded_at": datetime.utcnow().isoformat()
            }
            
            uploaded_files.append(file_info)
            
            logger.info(f"File uploaded: {file.filename} -> {safe_filename} by user {current_user.id}")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"File upload error: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to upload files"
        )
    
    return {
        "message": f"Successfully uploaded {len(uploaded_files)} file(s)",
        "files": uploaded_files
    }


@router.get("/download/{file_id}")
async def download_file(
    file_id: str,
    current_user: User = Depends(get_current_user)
):
    """Download a file by ID"""
    
    # Construct file path
    user_dir = os.path.join(settings.UPLOAD_DIR, "user_files", str(current_user.id))
    
    # Find file with this ID (check all extensions)
    file_path = None
    original_name = None
    
    for ext in ALLOWED_EXTENSIONS:
        potential_path = os.path.join(user_dir, f"{file_id}{ext}")
        if os.path.exists(potential_path):
            file_path = potential_path
            # You might want to store original names in database
            original_name = f"file{ext}"
            break
    
    if not file_path or not os.path.exists(file_path):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    from fastapi.responses import FileResponse
    return FileResponse(
        path=file_path,
        filename=original_name,
        media_type='application/octet-stream'
    )
