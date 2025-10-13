#!/usr/bin/env python3
"""
Test script to debug registration issues
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
from app.core.database import init_db, get_service_supabase, DatabaseManager
from app.core.auth import AuthManager

async def test_registration():
    """Test the registration process step by step"""
    print("🧪 Testing Registration Process...")
    
    # Initialize database
    await init_db()
    print("✅ Database initialized")
    
    # Test Supabase connection
    try:
        service_client = get_service_supabase()
        response = service_client.table("user_profile").select("count", count="exact").execute()
        print(f"✅ Supabase connection working. Current user profiles: {response.count}")
    except Exception as e:
        print(f"❌ Supabase connection failed: {e}")
        return
    
    # Test user registration with Supabase Auth
    auth_manager = AuthManager()
    test_email = "test@example.com"
    test_password = "testpassword123"
    test_name = "Test User"
    
    print(f"\n🔍 Testing registration for {test_email}...")
    
    try:
        # Step 1: Try to register with Supabase Auth
        print("Step 1: Registering with Supabase Auth...")
        result = await auth_manager.register_user(test_email, test_password, test_name)
        
        if result:
            print(f"✅ Supabase Auth registration successful")
            print(f"   User ID: {result['auth_user'].id}")
            print(f"   Email: {result['auth_user'].email}")
            
            # Step 2: Check if user profile was created by trigger
            print("\nStep 2: Checking if user profile was created by trigger...")
            
            # Wait a bit for trigger to execute
            await asyncio.sleep(2)
            
            user_profile = await auth_manager.db.get_user_by_auth_id(result['auth_user'].id)
            
            if user_profile:
                print("✅ User profile created successfully by trigger")
                print(f"   Profile ID: {user_profile['id']}")
                print(f"   Alias: {user_profile['alias']}")
                print(f"   Full Name: {user_profile['full_name']}")
            else:
                print("❌ User profile NOT created by trigger")
                
                # Try to check if user exists in auth.users table
                print("\nStep 3: Checking auth.users table directly...")
                try:
                    # Use service role to access auth schema
                    auth_response = service_client.table("auth.users").select("*").eq("id", result['auth_user'].id).execute()
                    if auth_response.data:
                        print("✅ User exists in auth.users table")
                        print(f"   Auth user data: {auth_response.data[0]}")
                    else:
                        print("❌ User not found in auth.users table")
                except Exception as e:
                    print(f"❌ Cannot access auth.users table: {e}")
                
                # Check if trigger exists
                print("\nStep 4: Checking if trigger exists...")
                try:
                    trigger_check = service_client.rpc("check_trigger_exists").execute()
                    print(f"Trigger check result: {trigger_check.data}")
                except Exception as e:
                    print(f"Cannot check trigger: {e}")
        else:
            print("❌ Supabase Auth registration failed")
            
    except Exception as e:
        print(f"❌ Registration test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(test_registration())