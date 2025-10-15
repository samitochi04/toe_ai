#!/usr/bin/env python3
"""Quick debug script to check the subscription query directly"""

import asyncio
import sys
import os
from dotenv import load_dotenv

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

# Load environment variables
load_dotenv()

from app.core.database import DatabaseManager, init_db

async def debug_subscription():
    """Debug the subscription query directly"""
    print("=== Debugging Subscription Query ===")
    
    # Initialize database
    await init_db()
    db = DatabaseManager()
    service_db = DatabaseManager(use_service_role=True)
    user_profile_id = '9f6cbd57-c7f4-4d64-a3f2-355f9c091904'
    
    print(f"Looking for subscription for user_profile_id: {user_profile_id}")
    
    try:
        # Check if the user profile exists
        print("\n1. Checking if user profile exists...")
        profile_response = db.client.table("user_profile").select("*").eq("id", user_profile_id).execute()
        if profile_response.data:
            profile = profile_response.data[0]
            print(f"   ✅ User profile found:")
            print(f"      ID: {profile['id']}")
            print(f"      Auth ID: {profile['auth_user_id']}")
            print(f"      Email: {profile.get('email', 'N/A')}")
        else:
            print(f"   ❌ No user profile found with id: {user_profile_id}")
            return
        
        # Check subscriptions with regular role
        print(f"\n2a. Checking subscriptions with REGULAR ROLE for user_profile_id: {user_profile_id}")
        all_user_subs = db.client.table("user_subscriptions").select("*").eq("user_profile_id", user_profile_id).execute()
        if all_user_subs.data:
            print(f"   ✅ Found {len(all_user_subs.data)} subscription(s):")
            for sub in all_user_subs.data:
                print(f"      - ID: {sub['id']}")
                print(f"        Status: {sub['status']}")
                print(f"        Created: {sub.get('created_at', 'N/A')}")
                print(f"        Tier ID: {sub.get('tier_id', 'N/A')}")
        else:
            print(f"   ❌ No subscriptions found with regular role for user_profile_id: {user_profile_id}")
            
        # Check subscriptions with service role
        print(f"\n2b. Checking subscriptions with SERVICE ROLE for user_profile_id: {user_profile_id}")
        service_subs = service_db.client.table("user_subscriptions").select("*").eq("user_profile_id", user_profile_id).execute()
        if service_subs.data:
            print(f"   ✅ Found {len(service_subs.data)} subscription(s) with service role:")
            for sub in service_subs.data:
                print(f"      - ID: {sub['id']}")
                print(f"        Status: {sub['status']}")
                print(f"        Created: {sub.get('created_at', 'N/A')}")
                print(f"        Tier ID: {sub.get('tier_id', 'N/A')}")
        else:
            print(f"   ❌ No subscriptions found with service role for user_profile_id: {user_profile_id}")
        
        # Check the exact query used by get_user_subscription
        print(f"\n3. Testing the exact query from get_user_subscription...")
        response = (
            db.client.table("user_subscriptions")
            .select("*, subscription_tiers(*)")
            .eq("user_profile_id", user_profile_id)
            .in_("status", ["active", "free"])
            .order("created_at", desc=True)
            .limit(1)
            .execute()
        )
        if response.data:
            print(f"   ✅ Query successful, found: {response.data[0]}")
        else:
            print(f"   ❌ Query returned no results")
            
        # Check all subscriptions to see what statuses exist
        print(f"\n4. Checking all subscription statuses...")
        all_subs = db.client.table("user_subscriptions").select("user_profile_id, status").execute()
        status_counts = {}
        for sub in all_subs.data:
            status = sub['status']
            status_counts[status] = status_counts.get(status, 0) + 1
        print(f"   Status distribution: {status_counts}")
        
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(debug_subscription())