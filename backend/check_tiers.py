#!/usr/bin/env python3
"""Check if subscription tiers exist"""

import asyncio
import sys
import os
from dotenv import load_dotenv

# Add the app directory to the path
sys.path.append(os.path.join(os.path.dirname(__file__), 'app'))

# Load environment variables
load_dotenv()

from app.core.database import DatabaseManager, init_db

async def check_subscription_tiers():
    """Check if subscription tiers exist"""
    print("=== Checking Subscription Tiers ===")
    
    # Initialize database
    await init_db()
    db = DatabaseManager()
    
    try:
        # Check subscription tiers
        tiers_response = db.client.table("subscription_tiers").select("*").execute()
        
        if tiers_response.data:
            print("✅ Subscription tiers found:")
            for tier in tiers_response.data:
                print(f"   - {tier['name']}: {tier['id']}")
                print(f"     Normal limit: {tier.get('normal_chat_limit', 'N/A')}")
                print(f"     Interview limit: {tier.get('interview_chat_limit', 'N/A')}")
        else:
            print("❌ No subscription tiers found!")
            print("   You need to run the 04_initial_data.sql script")
            
    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    asyncio.run(check_subscription_tiers())