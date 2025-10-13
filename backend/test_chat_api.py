#!/usr/bin/env python3
"""
Test chat completion API endpoint
"""
import requests
import json
import sys
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

def test_chat_api():
    # First, let's register a test user
    base_url = "http://localhost:8000/api/v1"
    
    # Test data
    user_data = {
        "email": "chattest@example.com",
        "password": "testpassword123",
        "full_name": "Chat Test User"
    }
    
    print("🧪 Testing Chat API...")
    
    # Step 1: Register user
    print("\n1. Registering test user...")
    register_response = requests.post(f"{base_url}/auth/register", json=user_data)
    print(f"Registration Status: {register_response.status_code}")
    
    if register_response.status_code == 201:
        print("✅ User registered successfully")
        register_data = register_response.json()
        print(f"User ID: {register_data.get('user', {}).get('id')}")
    else:
        print(f"❌ Registration failed: {register_response.text}")
        # Try to login if user already exists
        print("\n🔄 Attempting to login...")
        login_response = requests.post(f"{base_url}/auth/login", json={
            "email": user_data["email"],
            "password": user_data["password"]
        })
        
        if login_response.status_code == 200:
            print("✅ Login successful")
            register_data = login_response.json()
        else:
            print(f"❌ Login failed: {login_response.text}")
            return
    
    # Get access token
    access_token = register_data.get("access_token")
    if not access_token:
        print("❌ No access token received")
        return
    
    # Step 2: Test chat completion
    print("\n2. Testing chat completion...")
    chat_data = {
        "content": "Hello! Can you help me prepare for a software engineering interview?"
    }
    
    headers = {
        "Authorization": f"Bearer {access_token}",
        "Content-Type": "application/json"
    }
    
    chat_response = requests.post(f"{base_url}/ai/chat/completion", json=chat_data, headers=headers)
    print(f"Chat Status: {chat_response.status_code}")
    
    if chat_response.status_code == 200:
        print("✅ Chat completion successful")
        chat_result = chat_response.json()
        print(f"AI Response: {chat_result.get('message', {}).get('content', 'No content')[:100]}...")
        print(f"Usage: {chat_result.get('usage')}")
        print(f"Cost: ${chat_result.get('cost', 0):.4f}")
    else:
        print(f"❌ Chat completion failed: {chat_response.text}")
        return
    
    print("\n✅ All tests completed successfully!")

if __name__ == "__main__":
    test_chat_api()