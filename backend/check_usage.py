#!/usr/bin/env python3
"""
Check user usage limits
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

async def check_usage(email):
    """Check usage for a specific user"""
    db = DatabaseManager(use_service_role=True)
    
    try:
        # Get user by email
        user_response = db.client.table("user_profile").select("id, alias, email").eq("email", email).execute()
        
        if not user_response.data:
            print(f"❌ User with email {email} not found")
            return
        
        user = user_response.data[0]
        user_id = user["id"]
        
        print(f"👤 User: {user['alias']} ({user['email']})")
        print(f"📧 ID: {user_id}")
        
        # Get usage tracking
        usage_response = db.client.table("usage_tracking").select("*").eq("user_profile_id", user_id).execute()
        
        if usage_response.data:
            usage = usage_response.data[0]
            print(f"\n📊 Current Usage:")
            print(f"   Normal chats: {usage['normal_chats_used']}/10")
            print(f"   Interview chats: {usage['interview_chats_used']}/5")
            print(f"   Last reset: {usage['reset_date']}")
        else:
            print("❌ No usage tracking found")
        
        # Get subscription
        sub_response = db.client.table("user_subscriptions").select("*, subscription_tiers(name)").eq("user_profile_id", user_id).execute()
        
        if sub_response.data:
            sub = sub_response.data[0]
            print(f"\n💳 Subscription:")
            print(f"   Tier: {sub.get('subscription_tiers', {}).get('name', 'Unknown')}")
            print(f"   Status: {sub['status']}")
        
        # Get actual chat counts
        normal_count_response = db.client.table("normal_chat").select("id", count="exact").eq("user_profile_id", user_id).execute()
        interview_count_response = db.client.table("interview_chat").select("id", count="exact").eq("user_profile_id", user_id).execute()
        
        print(f"\n📝 Actual Chat Counts:")
        print(f"   Normal chats in DB: {normal_count_response.count or 0}")
        print(f"   Interview chats in DB: {interview_count_response.count or 0}")
        
    except Exception as e:
        print(f"❌ Error checking usage: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        email = sys.argv[1]
        asyncio.run(check_usage(email))
    else:
        print("Usage: python check_usage.py <email>")
