#!/usr/bin/env python3
"""Create missing subscription for the user"""

import asyncio
import sys
import os
from dotenv import load_dotenv

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

# Load environment variables
load_dotenv()

from app.core.database import DatabaseManager, init_db

async def create_missing_subscription():
    """Create the missing subscription"""
    print("=== Creating Missing Subscription ===")
    
    # Initialize database
    await init_db()
    db = DatabaseManager(use_service_role=True)  # Use service role to bypass RLS
    
    user_profile_id = '9f6cbd57-c7f4-4d64-a3f2-355f9c091904'
    free_tier_id = '3d95a428-0e22-4ed3-9038-2bf4f2f723af'
    
    try:
        # Check if subscription already exists (just in case)
        existing = db.client.table("user_subscriptions").select("*").eq("user_profile_id", user_profile_id).execute()
        
        if existing.data:
            print(f"✅ Subscription already exists: {existing.data[0]}")
            return existing.data[0]
        
        print(f"Creating free subscription for user: {user_profile_id}")
        
        # Create the free subscription
        new_subscription = db.client.table("user_subscriptions").insert({
            "user_profile_id": user_profile_id,
            "tier_id": free_tier_id,
            "status": "free",
        }).execute()
        
        if new_subscription.data:
            print(f"✅ Successfully created subscription: {new_subscription.data[0]}")
            return new_subscription.data[0]
        else:
            print("❌ Failed to create subscription")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(create_missing_subscription())