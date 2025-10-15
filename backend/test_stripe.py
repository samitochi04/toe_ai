#!/usr/bin/env python3
"""
Test script to isolate Stripe configuration issues
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.core.config import settings
import stripe

print(f"Python version: {sys.version}")
try:
    print(f"Stripe version: {stripe.version.VERSION}")
except AttributeError:
    print("Stripe version: Unable to determine")
print(f"STRIPE_SECRET_KEY loaded: {'Yes' if settings.STRIPE_SECRET_KEY else 'No'}")

if settings.STRIPE_SECRET_KEY:
    print(f"Key starts with: {settings.STRIPE_SECRET_KEY[:10]}...")
    print(f"Key length: {len(settings.STRIPE_SECRET_KEY)}")
    print(f"Key type: {'Test' if 'sk_test_' in settings.STRIPE_SECRET_KEY else 'Live' if 'sk_live_' in settings.STRIPE_SECRET_KEY else 'Unknown'}")
    
    # Set the API key
    stripe.api_key = settings.STRIPE_SECRET_KEY
    print("✅ Stripe API key set")
    
    # Test different Stripe operations
    try:
        print("\n🧪 Testing Stripe operations...")
        
        # Test 1: Simple list operation
        print("Test 1: List payment methods...")
        payment_methods = stripe.PaymentMethod.list(limit=1, type="card")
        print("✅ Payment methods list successful")
        
        # Test 2: Account retrieval (this might be the problematic one)
        print("Test 2: Account retrieval...")
        try:
            account = stripe.Account.retrieve()
            print("✅ Account retrieval successful")
        except Exception as e:
            print(f"❌ Account retrieval failed: {e}")
            print(f"Error type: {type(e)}")
        
        # Test 3: Customer creation (what we actually need)
        print("Test 3: Customer creation...")
        try:
            customer = stripe.Customer.create(
                email="test@example.com",
                name="Test User"
            )
            print("✅ Customer creation successful")
            print(f"Customer ID: {customer.id}")
            
            # Clean up
            stripe.Customer.delete(customer.id)
            print("✅ Customer deleted")
            
        except Exception as e:
            print(f"❌ Customer creation failed: {e}")
            print(f"Error type: {type(e)}")
        
        # Test 4: Price retrieval
        print("Test 4: Price retrieval...")
        try:
            if settings.STRIPE_PRICE_ID_PREMIUM:
                price = stripe.Price.retrieve(settings.STRIPE_PRICE_ID_PREMIUM)
                print(f"✅ Price retrieval successful: {price.id}")
            else:
                print("❌ No price ID configured")
        except Exception as e:
            print(f"❌ Price retrieval failed: {e}")
            print(f"Error type: {type(e)}")
            
    except Exception as e:
        print(f"❌ General Stripe error: {e}")
        print(f"Error type: {type(e)}")
        import traceback
        print(f"Traceback:\n{traceback.format_exc()}")

else:
    print("❌ No Stripe secret key found")