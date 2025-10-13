#!/usr/bin/env python3
"""
Test script to check database schema and triggers
"""
import asyncio
import os
import sys
from dotenv import load_dotenv

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

# Load environment variables
load_dotenv()

from app.core.config import settings
from app.core.database import init_db, get_service_supabase

async def check_database_setup():
    """Check if database tables and triggers are properly set up"""
    print("🔍 Checking Database Setup...")
    
    # Initialize database
    await init_db()
    print("✅ Database initialized")
    
    # Get service client for admin operations
    service_client = get_service_supabase()
    
    # 1. Check if user_profile table exists and structure
    print("\n1. Checking user_profile table...")
    try:
        response = service_client.table("user_profile").select("*").limit(1).execute()
        print("✅ user_profile table exists and accessible")
        
        # Check table structure by attempting to insert a test record (then delete it)
        test_profile = {
            "auth_user_id": "test-uuid-12345",
            "email": "test-structure@example.com",
            "full_name": "Test Structure",
            "alias": "test@2025"
        }
        
        try:
            # Try to insert
            insert_response = service_client.table("user_profile").insert(test_profile).execute()
            if insert_response.data:
                print("✅ user_profile table structure is correct")
                # Clean up - delete the test record
                service_client.table("user_profile").delete().eq("auth_user_id", "test-uuid-12345").execute()
            else:
                print("❌ user_profile table insert failed")
        except Exception as e:
            print(f"❌ user_profile table structure issue: {e}")
            
    except Exception as e:
        print(f"❌ user_profile table not accessible: {e}")
    
    # 2. Check if subscription_tiers table exists
    print("\n2. Checking subscription_tiers table...")
    try:
        response = service_client.table("subscription_tiers").select("*").execute()
        print(f"✅ subscription_tiers table exists with {len(response.data)} tiers")
        if response.data:
            for tier in response.data:
                print(f"   - {tier.get('name', 'Unknown')} tier (ID: {tier.get('id', 'Unknown')})")
    except Exception as e:
        print(f"❌ subscription_tiers table issue: {e}")
    
    # 3. Check if usage_tracking table exists
    print("\n3. Checking usage_tracking table...")
    try:
        response = service_client.table("usage_tracking").select("*").limit(1).execute()
        print("✅ usage_tracking table exists and accessible")
    except Exception as e:
        print(f"❌ usage_tracking table issue: {e}")
    
    # 4. Check if user_subscriptions table exists
    print("\n4. Checking user_subscriptions table...")
    try:
        response = service_client.table("user_subscriptions").select("*").limit(1).execute()
        print("✅ user_subscriptions table exists and accessible")
    except Exception as e:
        print(f"❌ user_subscriptions table issue: {e}")
    
    # 5. Try to check database functions
    print("\n5. Checking database functions...")
    try:
        # Try to call the generate_user_alias function
        alias_result = service_client.rpc("generate_user_alias", {"email_input": "test@example.com"}).execute()
        if alias_result.data:
            print(f"✅ generate_user_alias function works: {alias_result.data}")
        else:
            print("❌ generate_user_alias function failed")
    except Exception as e:
        print(f"❌ generate_user_alias function issue: {e}")
    
    # 6. Check if we can query auth schema (might not be possible with anon key)
    print("\n6. Checking auth schema access...")
    try:
        # This might fail due to RLS, but let's try
        auth_response = service_client.rpc("auth.users").execute()
        print("✅ Can access auth schema")
    except Exception as e:
        print(f"❌ Cannot access auth schema (expected): {e}")
    
    print("\n📝 Database Setup Summary:")
    print("   - If all tables exist and are accessible, the issue is likely in the trigger")
    print("   - The 'Database error saving new user' suggests the trigger is failing")
    print("   - This could be due to:")
    print("     1. Missing subscription tier data")
    print("     2. RLS policies blocking the trigger")
    print("     3. Trigger function permissions")
    print("     4. Database function errors")

if __name__ == "__main__":
    asyncio.run(check_database_setup())