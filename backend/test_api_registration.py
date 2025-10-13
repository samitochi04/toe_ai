#!/usr/bin/env python3
"""
Test API registration directly
"""
import requests
import json

def test_api_registration():
    url = "http://localhost:8000/api/v1/auth/register"
    data = {
        "email": "test-api@example.com",
        "password": "testpassword123",
        "full_name": "Test API User"
    }
    
    print("🧪 Testing API Registration...")
    print(f"URL: {url}")
    print(f"Data: {data}")
    
    try:
        response = requests.post(url, json=data)
        print(f"Status Code: {response.status_code}")
        
        if response.status_code == 201:
            print("✅ Registration successful!")
            result = response.json()
            print(f"Response: {json.dumps(result, indent=2)}")
        else:
            print("❌ Registration failed!")
            print(f"Error: {response.text}")
            
    except Exception as e:
        print(f"❌ Request failed: {e}")

if __name__ == "__main__":
    test_api_registration()