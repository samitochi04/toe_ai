#!/usr/bin/env python3
"""
Reset user usage limits for testing
"""
import asyncio
import sys
import os
from dotenv import load_dotenv

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

# Load environment variables
load_dotenv()

from app.core.database import DatabaseManager
from datetime import datetime

async def reset_user_usage(email):
    """Reset usage for a specific user"""
    db = DatabaseManager(use_service_role=True)
    
    try:
        # Get user by email
        user_response = db.client.table("user_profile").select("id").eq("email", email).execute()
        
        if not user_response.data:
            print(f"❌ User with email {email} not found")
            return
        
        user_id = user_response.data[0]["id"]
        print(f"✅ Found user: {user_id}")
        
        # Reset usage tracking
        reset_response = db.client.table("usage_tracking").update({
            "normal_chats_used": 0,
            "interview_chats_used": 0,
            "reset_date": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }).eq("user_profile_id", user_id).execute()
        
        if reset_response.data:
            print(f"✅ Reset usage for user {email}")
            print(f"   Normal chats: 0/{10}")
            print(f"   Interview chats: 0/{5}")
        else:
            print(f"❌ Failed to reset usage for user {email}")
            
    except Exception as e:
        print(f"❌ Error resetting usage: {e}")

async def reset_all_usage():
    """Reset usage for all users"""
    db = DatabaseManager(use_service_role=True)
    
    try:
        reset_response = db.client.table("usage_tracking").update({
            "normal_chats_used": 0,
            "interview_chats_used": 0,
            "reset_date": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }).execute()
        
        print(f"✅ Reset usage for all users ({len(reset_response.data or [])} records)")
        
    except Exception as e:
        print(f"❌ Error resetting all usage: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        email = sys.argv[1]
        print(f"🔄 Resetting usage for {email}...")
        asyncio.run(reset_user_usage(email))
    else:
        print("🔄 Resetting usage for all users...")
        asyncio.run(reset_all_usage())
