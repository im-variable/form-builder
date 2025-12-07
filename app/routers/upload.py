"""
File Upload Router
Handles file uploads for multimedia fields (image, video, audio)
"""
import os
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session
from typing import Optional
from app.database import get_db

router = APIRouter()

# Create uploads directory if it doesn't exist
UPLOAD_DIR = Path("uploads")
UPLOAD_DIR.mkdir(exist_ok=True)

# Create subdirectories for different media types
IMAGE_DIR = UPLOAD_DIR / "images"
VIDEO_DIR = UPLOAD_DIR / "videos"
AUDIO_DIR = UPLOAD_DIR / "audio"
FILE_DIR = UPLOAD_DIR / "files"

for directory in [IMAGE_DIR, VIDEO_DIR, AUDIO_DIR, FILE_DIR]:
    directory.mkdir(exist_ok=True)

# Allowed file extensions
ALLOWED_IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".webp", ".svg", ".bmp"}
ALLOWED_VIDEO_EXTENSIONS = {".mp4", ".webm", ".ogg", ".mov", ".avi", ".mkv"}
ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".ogg", ".m4a", ".aac", ".flac"}
ALLOWED_FILE_EXTENSIONS = {".pdf", ".doc", ".docx", ".txt", ".csv", ".xlsx", ".xls"}

# Max file sizes (in bytes)
MAX_IMAGE_SIZE = 10 * 1024 * 1024  # 10MB
MAX_VIDEO_SIZE = 100 * 1024 * 1024  # 100MB
MAX_AUDIO_SIZE = 50 * 1024 * 1024  # 50MB
MAX_FILE_SIZE = 50 * 1024 * 1024  # 50MB


def get_upload_directory(file_type: str) -> Path:
    """Get the appropriate upload directory based on file type"""
    if file_type == "image":
        return IMAGE_DIR
    elif file_type == "video":
        return VIDEO_DIR
    elif file_type == "audio":
        return AUDIO_DIR
    else:
        return FILE_DIR


def get_allowed_extensions(file_type: str) -> set:
    """Get allowed file extensions based on file type"""
    if file_type == "image":
        return ALLOWED_IMAGE_EXTENSIONS
    elif file_type == "video":
        return ALLOWED_VIDEO_EXTENSIONS
    elif file_type == "audio":
        return ALLOWED_AUDIO_EXTENSIONS
    else:
        return ALLOWED_FILE_EXTENSIONS


def get_max_size(file_type: str) -> int:
    """Get max file size based on file type"""
    if file_type == "image":
        return MAX_IMAGE_SIZE
    elif file_type == "video":
        return MAX_VIDEO_SIZE
    elif file_type == "audio":
        return MAX_AUDIO_SIZE
    else:
        return MAX_FILE_SIZE


@router.post("/upload/{file_type}")
async def upload_file(
    file_type: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db)
):
    """
    Upload a file for a multimedia field
    
    file_type: image, video, audio, or file
    """
    # Validate file type
    if file_type not in ["image", "video", "audio", "file"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid file type. Must be one of: image, video, audio, file"
        )
    
    # Get file extension
    file_extension = Path(file.filename).suffix.lower()
    allowed_extensions = get_allowed_extensions(file_type)
    
    if file_extension not in allowed_extensions:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File extension {file_extension} not allowed. Allowed extensions: {', '.join(allowed_extensions)}"
        )
    
    # Read file content to check size
    content = await file.read()
    file_size = len(content)
    max_size = get_max_size(file_type)
    
    if file_size > max_size:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"File size {file_size} bytes exceeds maximum allowed size of {max_size} bytes"
        )
    
    # Generate unique filename
    unique_filename = f"{uuid.uuid4()}{file_extension}"
    upload_dir = get_upload_directory(file_type)
    file_path = upload_dir / unique_filename
    
    # Save file
    with open(file_path, "wb") as f:
        f.write(content)
    
    # Return file URL/path
    return {
        "filename": unique_filename,
        "original_filename": file.filename,
        "file_type": file_type,
        "file_size": file_size,
        "file_url": f"/api/v1/upload/file/{file_type}/{unique_filename}"
    }


@router.get("/file/{file_type}/{filename}")
async def get_file(file_type: str, filename: str):
    """
    Retrieve an uploaded file
    
    file_type: image, video, audio, or file
    filename: The unique filename returned from upload
    """
    # Validate file type
    if file_type not in ["image", "video", "audio", "file"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file type"
        )
    
    upload_dir = get_upload_directory(file_type)
    file_path = upload_dir / filename
    
    if not file_path.exists():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="File not found"
        )
    
    # Determine media type
    media_type_map = {
        "image": "image",
        "video": "video",
        "audio": "audio",
        "file": "application/octet-stream"
    }
    
    return FileResponse(
        path=str(file_path),
        media_type=media_type_map.get(file_type, "application/octet-stream")
    )

