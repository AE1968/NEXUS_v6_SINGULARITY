"""
🔑 NEXUS v7.0 - Claude API Key Auto-Configuration
Automatically checks and configures ANTHROPIC_API_KEY for Railway deployment
"""

import os
import requests
import json

def check_claude_status():
    """Check if Claude is configured on Railway"""
    try:
        response = requests.get('https://web-production-b215.up.railway.app/api/nexus/status/enhanced', timeout=10)
        if response.status_code == 200:
            data = response.json()
            claude_available = data.get('capabilities', {}).get('claude_sonnet_4.5', False)
            return claude_available
        return False
    except Exception as e:
        print(f"⚠️ Could not check Claude status: {e}")
        return False

def get_api_key_instructions():
    """Display instructions for getting Claude API key"""
    print("""
╔══════════════════════════════════════════════════════════╗
║     CLAUDE SONNET 4.5 API KEY CONFIGURATION              ║
╚══════════════════════════════════════════════════════════╝

📝 STEPS TO GET YOUR API KEY:

1. Go to: https://console.anthropic.com/
2. Sign up or login
3. Navigate to: Settings → API Keys
4. Click: "Create Key"
5. Copy the key (starts with 'sk-ant-...')

⚠️  IMPORTANT: Keep your API key secure!

─────────────────────────────────────────────────────────────
""")

def configure_railway_api_key(api_key):
    """
    Save API key to Railway via CLI
    Note: This requires Railway CLI to be installed and authenticated
    """
    print("\n🔧 CONFIGURING RAILWAY...")
    print("""
MANUAL RAILWAY CONFIGURATION REQUIRED:

1. Go to: https://railway.com/project/695b8855-e63f-4266-84f0-c2e5197f3131
2. Click on your service (web)
3. Navigate to: Variables tab
4. Click: + New Variable
5. Name: ANTHROPIC_API_KEY
6. Value: [paste your API key]
7. Click: Add
8. Railway will auto-redeploy (30-60s)

OR use Railway CLI:
    railway variables --set ANTHROPIC_API_KEY=[your_key]
    railway up

─────────────────────────────────────────────────────────────
    """)
    
    # Save to local .env for development
    env_file = '.env'
    try:
        with open(env_file, 'a') as f:
            f.write(f"\nANTHROPIC_API_KEY={api_key}\n")
        print(f"✅ API key saved to {env_file} for local development")
    except Exception as e:
        print(f"⚠️ Could not save to .env: {e}")

def test_claude_connection(api_key):
    """Test if Claude API key works"""
    print("\n🧪 TESTING CLAUDE CONNECTION...")
    
    try:
        # Try to import anthropic
        import anthropic
        
        client = anthropic.Anthropic(api_key=api_key)
        
        # Simple test message
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=100,
            messages=[
                {"role": "user", "content": "Say 'Hello from Nexus v7.0'"}
            ]
        )
        
        response_text = message.content[0].text
        print(f"✅ CLAUDE TEST SUCCESSFUL!")
        print(f"📥 Response: {response_text}")
        return True
        
    except ImportError:
        print("⚠️ anthropic package not installed")
        print("   Run: pip install anthropic")
        return False
    except Exception as e:
        print(f"❌ CLAUDE TEST FAILED: {e}")
        return False

def main():
    print("""
╔══════════════════════════════════════════════════════════╗
║   NEXUS v7.0 TRANSCENDENCE - Claude Auto-Configuration   ║
╚══════════════════════════════════════════════════════════╝
    """)
    
    # Check current status
    print("🔍 Checking Claude status on Railway...")
    claude_active = check_claude_status()
    
    if claude_active:
        print("✅ Claude Sonnet 4.5 is ALREADY CONFIGURED and ACTIVE!")
        print("   No action needed.")
        return
    
    print("⚠️  Claude Sonnet 4.5 is NOT configured")
    print("   API key is missing or invalid\n")
    
    # Show instructions
    get_api_key_instructions()
    
    # Ask if user wants to configure now
    configure_now = input("Do you have your Claude API key ready? (y/n): ").lower()
    
    if configure_now == 'y':
        api_key = input("\n🔑 Paste your Claude API key: ").strip()
        
        if not api_key:
            print("❌ No API key provided. Exiting.")
            return
        
        # Validate format
        if not api_key.startswith('sk-ant-'):
            print("⚠️  Warning: API key should start with 'sk-ant-'")
            confirm = input("   Continue anyway? (y/n): ").lower()
            if confirm != 'y':
                print("❌ Configuration cancelled.")
                return
        
        # Test locally
        test_result = test_claude_connection(api_key)
        
        if test_result:
            # Show Railway configuration instructions
            configure_railway_api_key(api_key)
            
            print("\n✅ CONFIGURATION COMPLETE!")
            print("\n📝 NEXT STEPS:")
            print("   1. Follow the Railway configuration steps above")
            print("   2. Wait 30-60s for Railway to redeploy")
            print("   3. Test with: nexus:think How does consciousness emerge?")
            print("\n🔗 Live URL: https://chipper-melba-0f3b83.netlify.app")
        else:
            print("\n❌ API key test failed. Please check your key and try again.")
    else:
        print("\n📖 Follow the instructions above to get your API key.")
        print("   Then run this script again: python configure_claude.py")

if __name__ == "__main__":
    main()
