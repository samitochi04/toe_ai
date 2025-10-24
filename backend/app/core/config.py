"""
Core configuration settings for TOE AI Backend
"""

from pydantic_settings import BaseSettings
from typing import List, Optional
import os
from pathlib import Path


class Settings(BaseSettings):
    """Application settings"""
    
    # App Info
    APP_NAME: str = "TOE AI Backend"
    VERSION: str = "1.0.0"
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    
    # Server
    HOST: str = "0.0.0.0"
    PORT: int = 8000
    
    # SSL Configuration for Production
    SSL_CERT_PATH: Optional[str] = None
    SSL_KEY_PATH: Optional[str] = None
    
    # Security
    SECRET_KEY: str = "your-super-secret-key-change-in-production"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    REFRESH_TOKEN_EXPIRE_DAYS: int = 7
    
    # CORS
    ALLOWED_ORIGINS: str = "*"
    
    # Production CORS (Update with your actual domains)
    @property
    def production_cors_origins(self) -> List[str]:
        """Get production CORS origins"""
        if self.ENVIRONMENT == "production":
            return [
                "https://toe.diversis.site",
                "https://www.toe.diversis.site"
            ]
        return self.cors_origins
    
    @property
    def cors_origins(self) -> List[str]:
        """Parse ALLOWED_ORIGINS into a list"""
        if self.ALLOWED_ORIGINS == "*":
            return ["*"]
        return [origin.strip() for origin in self.ALLOWED_ORIGINS.split(",") if origin.strip()]
    
    # Supabase
    SUPABASE_URL: str = ""
    SUPABASE_ANON_KEY: str = ""
    SUPABASE_SERVICE_KEY: str = ""
    
    # Database
    DATABASE_URL: Optional[str] = None
    
    # OpenAI
    OPENAI_API_KEY: str = ""
    OPENAI_MODEL: str = "gpt-3.5-turbo"
    OPENAI_MAX_TOKENS: int = 2000
    OPENAI_TEMPERATURE: float = 0.7
    
    # Whisper (OpenAI Speech-to-Text)
    WHISPER_MODEL: str = "whisper-1"
    
    # Text-to-Speech
    TTS_MODEL: str = "tts-1"
    TTS_VOICE: str = "alloy"
    
    # Coqui TTS (Alternative TTS)
    COQUI_TTS_MODEL: str = "tts_models/en/ljspeech/tacotron2-DDC"
    
    # Stripe
    STRIPE_PUBLISHABLE_KEY: str = ""
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    STRIPE_PRICE_ID_PREMIUM: str = ""  # Monthly subscription price ID
    STRIPE_PRICE_ID_PREMIUM_YEARLY: str = ""  # Yearly subscription price ID
    
    # Stripe Environment Detection
    @property
    def is_stripe_live_mode(self) -> bool:
        """Check if Stripe is in live mode based on secret key"""
        return self.STRIPE_SECRET_KEY.startswith('sk_live_')
    
    @property
    def stripe_environment(self) -> str:
        """Get Stripe environment (test/live)"""
        return "live" if self.is_stripe_live_mode else "test"
    
    # File Storage
    UPLOAD_DIR: str = "static/uploads"
    MAX_FILE_SIZE: int = 10 * 1024 * 1024  # 10MB
    ALLOWED_AUDIO_EXTENSIONS: List[str] = ["mp3", "wav", "m4a", "ogg"]
    ALLOWED_IMAGE_EXTENSIONS: List[str] = ["jpg", "jpeg", "png", "gif", "webp"]
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS_PER_MINUTE: int = 60
    RATE_LIMIT_TOKENS_PER_DAY: int = 10000
    RATE_LIMIT_AUDIO_MINUTES_PER_DAY: int = 120
    
    # Redis (for caching and rate limiting)
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Email (for notifications)
    SMTP_HOST: str = ""
    SMTP_PORT: int = 587
    SMTP_USERNAME: str = ""
    SMTP_PASSWORD: str = ""
    SMTP_USE_TLS: bool = True
    FROM_EMAIL: str = "noreply@toeai.com"
    
    # Google OAuth
    GOOGLE_CLIENT_ID: str = ""
    GOOGLE_CLIENT_SECRET: str = ""
    GOOGLE_REDIRECT_URI: str = "http://localhost:3000/auth/callback/google"
    
    # Logging
    LOG_LEVEL: str = "INFO"
    LOG_FORMAT: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    
    # Feature Flags
    ENABLE_PDF_EXPORT: bool = True
    ENABLE_VOICE_CHAT: bool = True
    ENABLE_VIDEO_RECORDING: bool = False
    ENABLE_ANALYTICS: bool = True
    ENABLE_SHARING: bool = True
    
    # Usage Limits (Free Tier)
    FREE_NORMAL_CHAT_LIMIT: int = 10
    FREE_INTERVIEW_CHAT_LIMIT: int = 5
    
    # Premium Features
    PREMIUM_PRICE_MONTHLY: float = 5.00
    PREMIUM_NORMAL_CHAT_LIMIT: int = 999999
    PREMIUM_INTERVIEW_CHAT_LIMIT: int = 999999
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


# Create settings instance
settings = Settings()


# Create upload directories if they don't exist
def create_upload_dirs():
    """Create necessary upload directories"""
    upload_dir = Path(settings.UPLOAD_DIR)
    upload_dir.mkdir(exist_ok=True, parents=True)
    
    # Create subdirectories
    (upload_dir / "audio").mkdir(exist_ok=True)
    (upload_dir / "images").mkdir(exist_ok=True)
    (upload_dir / "pdfs").mkdir(exist_ok=True)
    (upload_dir / "temp").mkdir(exist_ok=True)
    (upload_dir / "user_files").mkdir(exist_ok=True)
    
    # Set proper permissions (readable/writable)
    try:
        import stat
        upload_dir.chmod(stat.S_IRWXU | stat.S_IRWXG | stat.S_IROTH | stat.S_IXOTH)
    except Exception as e:
        print(f"Warning: Could not set directory permissions: {e}")


# Create directories on import
create_upload_dirs()