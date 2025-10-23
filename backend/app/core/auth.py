"""
Authentication utilities for TOE AI Backend
"""

from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from fastapi import HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext
import httpx
import logging

from app.core.config import settings
from app.core.database import DatabaseManager, get_supabase, get_service_supabase
from app.models.user import User

logger = logging.getLogger(__name__)

# Security
security = HTTPBearer()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# JWT Settings
ALGORITHM = "HS256"


class AuthenticationError(Exception):
    """Custom authentication error"""
    pass


class AuthManager:
    """Authentication manager"""
    
    def __init__(self):
        self.db = DatabaseManager()
        self.supabase = get_supabase()
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        """Verify password against hash"""
        return pwd_context.verify(plain_password, hashed_password)
    
    def get_password_hash(self, password: str) -> str:
        """Hash password"""
        return pwd_context.hash(password)
    
    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None):
        """Create JWT access token"""
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "access"
        })
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    def create_refresh_token(self, data: dict):
        """Create JWT refresh token"""
        to_encode = data.copy()
        expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
        
        to_encode.update({
            "exp": expire,
            "iat": datetime.utcnow(),
            "type": "refresh"
        })
        encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    def verify_token(self, token: str, token_type: str = "access") -> Dict[str, Any]:
        """Verify JWT token"""
        try:
            payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[ALGORITHM])
            
            # Verify token type
            if payload.get("type") != token_type:
                raise AuthenticationError(f"Invalid token type. Expected {token_type}")
            
            return payload
        except jwt.ExpiredSignatureError:
            raise AuthenticationError("Token has expired")
        except jwt.InvalidTokenError as e:
            logger.error(f"JWT verification failed: {e}")
            raise AuthenticationError("Invalid token")
    
    async def authenticate_user(self, email: str, password: str) -> Optional[Dict[str, Any]]:
        """Authenticate user with email and password"""
        try:
            # Use Supabase Auth for authentication
            response = self.supabase.auth.sign_in_with_password({
                "email": email,
                "password": password
            })
            
            if response.user:
                # Get user profile
                user_profile = await self.db.get_user_by_auth_id(response.user.id)
                if user_profile:
                    return {
                        "auth_user": response.user,
                        "profile": user_profile,
                        "session": response.session
                    }
            
            return None
        except Exception as e:
            logger.error(f"Authentication failed for {email}: {e}")
            return None
    
    async def register_user(self, email: str, password: str, full_name: str) -> Optional[Dict[str, Any]]:
        """Register new user with manual profile creation"""
        try:
            # Step 1: Use Supabase Auth for registration
            response = self.supabase.auth.sign_up({
                "email": email,
                "password": password,
                "options": {
                    "data": {
                        "full_name": full_name
                    }
                }
            })
            
            if not response.user:
                return None
            
            auth_user_id = response.user.id
            
            # Step 2: Manually create user profile (trigger is disabled)
            try:
                await self._create_user_profile_manually(auth_user_id, email, full_name)
                
                # Get the created profile
                user_profile = await self.db.get_user_by_auth_id(auth_user_id)
                
                return {
                    "auth_user": response.user,
                    "session": response.session,
                    "profile": user_profile
                }
                
            except Exception as profile_error:
                # If profile creation fails, clean up the auth user
                logger.error(f"Manual profile creation failed for {email}: {profile_error}")
                try:
                    service_supabase = get_service_supabase()
                    service_supabase.auth.admin.delete_user(auth_user_id)
                except Exception as cleanup_error:
                    logger.error(f"Failed to cleanup auth user {auth_user_id}: {cleanup_error}")
                
                raise Exception(f"Profile creation failed: {profile_error}")
            
        except Exception as e:
            logger.error(f"Registration failed for {email}: {e}")
            raise AuthenticationError(f"Registration failed: {e}")
    
    async def _create_user_profile_manually(self, auth_user_id: str, email: str, full_name: str):
        """Manually create user profile, usage tracking, and subscription"""
        from datetime import datetime
        import re
        
        service_db = DatabaseManager(use_service_role=True)
        
        # Generate alias
        username_part = email.split('@')[0].lower()
        username_part = re.sub(r'[^a-zA-Z0-9_]', '', username_part)
        username_part = username_part[:20]
        
        year_part = str(datetime.now().year)
        base_alias = f"{username_part}@{year_part}"
        
        # Check if alias exists and add counter if needed
        counter = 0
        final_alias = base_alias
        while True:
            existing = await service_db.get_user_by_alias(final_alias)
            if not existing:
                break
            counter += 1
            final_alias = f"{base_alias}_{counter}"
        
        now = datetime.utcnow().isoformat()
        
        # 1. Create user profile
        profile_data = {
            "auth_user_id": auth_user_id,
            "email": email,
            "full_name": full_name,
            "alias": final_alias,
            "created_at": now,
            "updated_at": now
        }
        
        profile_response = service_db.client.table("user_profile").insert(profile_data).execute()
        if not profile_response.data:
            raise Exception("Failed to create user profile")
        
        user_profile = profile_response.data[0]
        user_profile_id = user_profile["id"]
        
        # 2. Initialize usage tracking
        usage_data = {
            "user_profile_id": user_profile_id,
            "interview_chats_used": 0,
            "normal_chats_used": 0,
            "reset_date": now,
            "created_at": now,
            "updated_at": now
        }
        usage_response = service_db.client.table("usage_tracking").insert(usage_data).execute()
        if not usage_response.data:
            raise Exception("Failed to create usage tracking")
        
        # 3. Create free subscription
        tier_response = service_db.client.table("subscription_tiers").select("id").eq("name", "Free").limit(1).execute()
        if not tier_response.data:
            raise Exception("Free subscription tier not found")
        
        tier_id = tier_response.data[0]["id"]
        subscription_data = {
            "user_profile_id": user_profile_id,
            "tier_id": tier_id,
            "status": "free",
            "created_at": now,
            "updated_at": now
        }
        subscription_response = service_db.client.table("user_subscriptions").insert(subscription_data).execute()
        if not subscription_response.data:
            raise Exception("Failed to create free subscription")
        
        logger.info(f"Successfully created user profile manually for {email} (ID: {user_profile_id})")
    
    async def sign_in_with_google(self, token: str) -> Optional[Dict[str, Any]]:
        """Sign in with Google OAuth token"""
        try:
            # Verify Google token
            google_user = await self.verify_google_token(token)
            if not google_user:
                logger.error("Google token verification failed")
                return None
            
            # Extract user info from Google token
            google_id = google_user.get("sub")
            email = google_user.get("email")
            name = google_user.get("name", email)
            
            if not google_id or not email:
                logger.error("Missing required Google user data")
                return None
            
            # Check if user exists in our database
            user_profile = await self.db.get_user_by_auth_id(google_id)
            
            if user_profile:
                # Existing user - return profile
                return {
                    "auth_user": {"id": google_id, "email": email},
                    "profile": user_profile
                }
            else:
                # New user - create Supabase auth user and profile
                try:
                    # Create auth user in Supabase with Google ID as the user ID
                    # Since we can't directly create with custom ID, we'll create a profile manually
                    
                    # First, generate an alias for the user
                    from app.core.database import DatabaseManager
                    service_db = DatabaseManager(use_service_role=True)
                    
                    # Generate alias
                    async def generate_alias(email: str) -> str:
                        username_part = email.split('@')[0].lower()
                        # Clean username: remove special characters
                        import re
                        username_part = re.sub(r'[^a-zA-Z0-9_]', '', username_part)
                        username_part = username_part[:20]  # Limit length
                        
                        from datetime import datetime
                        year_part = str(datetime.now().year)
                        base_alias = f"{username_part}@{year_part}"
                        
                        # Check if alias exists and add counter if needed
                        counter = 0
                        final_alias = base_alias
                        while True:
                            existing = await service_db.get_user_by_alias(final_alias)
                            if not existing:
                                break
                            counter += 1
                            final_alias = f"{base_alias}_{counter}"
                        
                        return final_alias
                    
                    alias = await generate_alias(email)
                    
                    # Create user profile directly
                    from datetime import datetime
                    now = datetime.utcnow().isoformat()
                    
                    profile_data = {
                        "auth_user_id": google_id,
                        "email": email,
                        "full_name": name,
                        "alias": alias,
                        "avatar_url": google_user.get("picture"),
                        "created_at": now,
                        "updated_at": now
                    }
                    
                    # Insert user profile
                    response = service_db.client.table("user_profile").insert(profile_data).execute()
                    if not response.data:
                        raise Exception("Failed to create user profile")
                    
                    user_profile = response.data[0]
                    
                    # Initialize usage tracking
                    usage_data = {
                        "user_profile_id": user_profile["id"],
                        "interview_chats_used": 0,
                        "normal_chats_used": 0,
                        "reset_date": now,
                        "created_at": now,
                        "updated_at": now
                    }
                    service_db.client.table("usage_tracking").insert(usage_data).execute()
                    
                    # Create free subscription
                    # Get free tier ID
                    tier_response = service_db.client.table("subscription_tiers").select("id").eq("name", "Free").limit(1).execute()
                    if tier_response.data:
                        tier_id = tier_response.data[0]["id"]
                        subscription_data = {
                            "user_profile_id": user_profile["id"],
                            "tier_id": tier_id,
                            "status": "free",
                            "created_at": now,
                            "updated_at": now
                        }
                        service_db.client.table("user_subscriptions").insert(subscription_data).execute()
                    
                    return {
                        "auth_user": {"id": google_id, "email": email},
                        "profile": user_profile
                    }
                    
                except Exception as create_error:
                    logger.error(f"Failed to create Google user profile: {create_error}")
                    return None
        
        except Exception as e:
            logger.error(f"Google sign-in failed: {e}")
            return None
    
    async def verify_google_token(self, token: str) -> Optional[Dict[str, Any]]:
        """Verify Google OAuth ID token"""
        try:
            async with httpx.AsyncClient() as client:
                # Use tokeninfo endpoint for ID token verification
                response = await client.get(
                    f"https://www.googleapis.com/oauth2/v3/tokeninfo?id_token={token}"
                )
                
                if response.status_code == 200:
                    user_data = response.json()
                    # Verify the token is for our app
                    if user_data.get("aud") == settings.GOOGLE_CLIENT_ID:
                        return user_data
                    else:
                        logger.error(f"Token audience mismatch. Expected: {settings.GOOGLE_CLIENT_ID}, Got: {user_data.get('aud')}")
                else:
                    logger.error(f"Google token verification failed with status {response.status_code}: {response.text}")
                
            return None
        except Exception as e:
            logger.error(f"Google token verification failed: {e}")
            return None
    
    async def refresh_token(self, refresh_token: str) -> Optional[Dict[str, str]]:
        """Refresh access token using refresh token"""
        try:
            # Verify refresh token
            payload = self.verify_token(refresh_token, "refresh")
            user_id = payload.get("sub")
            
            if not user_id:
                return None
            
            # Verify user still exists
            user_profile = await self.db.get_user_by_auth_id(user_id)
            if not user_profile:
                return None
            
            # Create new access token
            access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
            new_access_token = self.create_access_token(
                data={"sub": user_id},
                expires_delta=access_token_expires
            )
            
            # Optionally create new refresh token (rotation)
            new_refresh_token = self.create_refresh_token(data={"sub": user_id})
            
            return {
                "access_token": new_access_token,
                "refresh_token": new_refresh_token,
                "token_type": "bearer",
                "expires_in": settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
            }
            
        except AuthenticationError as e:
            logger.error(f"Token refresh failed: {e}")
            return None
        except Exception as e:
            logger.error(f"Token refresh error: {e}")
            return None
    
    async def sign_out(self, token: str) -> bool:
        """Sign out user"""
        try:
            # Verify token first to ensure it's valid
            payload = self.verify_token(token, "access")
            user_id = payload.get("sub")
            
            if user_id:
                # Use Supabase to sign out
                try:
                    self.supabase.auth.sign_out()
                    return True
                except Exception as e:
                    logger.warning(f"Supabase sign out failed: {e}")
                    # Even if Supabase sign out fails, consider it successful
                    # since the token verification worked
                    return True
            
            return False
        except AuthenticationError:
            # If token is invalid/expired, consider sign out successful
            return True
        except Exception as e:
            logger.error(f"Sign out error: {e}")
            return False

    async def create_user_profile_from_oauth(
        self, 
        auth_user_id: str, 
        email: str, 
        full_name: str = None, 
        avatar_url: str = None
    ) -> Optional[Dict[str, Any]]:
        """Create user profile from OAuth data"""
        try:
            # Generate alias
            async def generate_alias(email: str) -> str:
                username_part = email.split('@')[0].lower()
                # Clean username: remove special characters
                import re
                username_part = re.sub(r'[^a-zA-Z0-9_]', '', username_part)
                username_part = username_part[:20]  # Limit length
                
                from datetime import datetime
                year_part = str(datetime.now().year)
                base_alias = f"{username_part}@{year_part}"
                
                # Check if alias exists and add counter if needed
                counter = 0
                final_alias = base_alias
                while True:
                    existing = await self.db.get_user_by_alias(final_alias)
                    if not existing:
                        break
                    counter += 1
                    final_alias = f"{base_alias}_{counter}"
                
                return final_alias
            
            alias = await generate_alias(email)
            
            # Create user profile directly using service role
            service_db = DatabaseManager(use_service_role=True)
            from datetime import datetime
            now = datetime.utcnow().isoformat()
            
            profile_data = {
                "auth_user_id": auth_user_id,
                "email": email,
                "full_name": full_name or email.split('@')[0],
                "alias": alias,
                "avatar_url": avatar_url,
                "created_at": now,
                "updated_at": now
            }
            
            # Insert user profile
            response = service_db.client.table("user_profile").insert(profile_data).execute()
            if not response.data:
                raise Exception("Failed to create user profile")
            
            user_profile = response.data[0]
            
            # Initialize usage tracking
            usage_data = {
                "user_profile_id": user_profile["id"],
                "interview_chats_used": 0,
                "normal_chats_used": 0,
                "reset_date": now,
                "created_at": now,
                "updated_at": now
            }
            service_db.client.table("usage_tracking").insert(usage_data).execute()
            
            # Create free subscription
            # Get free tier ID
            tier_response = service_db.client.table("subscription_tiers").select("id").eq("name", "Free").limit(1).execute()
            if tier_response.data:
                tier_id = tier_response.data[0]["id"]
                subscription_data = {
                    "user_profile_id": user_profile["id"],
                    "tier_id": tier_id,
                    "status": "free",
                    "created_at": now,
                    "updated_at": now
                }
                service_db.client.table("user_subscriptions").insert(subscription_data).execute()
            
            return user_profile
            
        except Exception as e:
            logger.error(f"Failed to create OAuth user profile: {e}")
            return None

    async def update_password(self, user_id: str, new_password: str) -> bool:
        """Update user password"""
        try:
            # Use Supabase Admin API to update password
            service_supabase = get_service_supabase()
            response = service_supabase.auth.admin.update_user_by_id(
                user_id,
                {"password": new_password}
            )
            return response.user is not None
        except Exception as e:
            logger.error(f"Password update failed: {e}")
            return False


# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> User:
    """Get current authenticated user"""
    auth_manager = AuthManager()
    
    try:
        # Verify token
        payload = auth_manager.verify_token(credentials.credentials, "access")
        user_id = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authentication credentials",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Get user profile
        user_profile = await auth_manager.db.get_user_by_auth_id(user_id)
        if user_profile is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        return User(**user_profile)
    
    except AuthenticationError as e:
        logger.error(f"Authentication failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )
    except Exception as e:
        logger.error(f"Authentication error: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed",
            headers={"WWW-Authenticate": "Bearer"},
        )


# Dependency to get current user (optional)
async def get_current_user_optional(credentials: Optional[HTTPAuthorizationCredentials] = Depends(security)) -> Optional[User]:
    """Get current authenticated user (optional for public endpoints)"""
    if credentials is None:
        return None
    
    try:
        return await get_current_user(credentials)
    except HTTPException:
        return None


# Dependency to check if user is admin
async def require_admin(current_user: User = Depends(get_current_user)) -> User:
    """Require user to be admin"""
    try:
        db = DatabaseManager()
        response = db.client.table("admin").select("*").eq("user_profile_id", current_user.id).eq("is_active", True).execute()
        
        if not response.data:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Admin access required"
            )
        
        return current_user
    except Exception as e:
        logger.error(f"Admin check failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )