import requests

try:
    print("🌐 HEADERS CHECK for https://kelionai.app (Checking for .htaccess effect)")
    r = requests.head("https://kelionai.app", allow_redirects=True)
    
    headers_to_check = ['Cache-Control', 'Pragma', 'Expires', 'Server']
    
    for h in headers_to_check:
        val = r.headers.get(h, "MISSING")
        print(f"{h}: {val}")
        
    if "no-store" in r.headers.get('Cache-Control', ''):
        print("\n✅ NUCLEAR HEADERS CONFIRMED.")
    else:
        print("\n❌ STANDARD HEADERS DETECTED (Server might be ignoring .htaccess or Nginx overriding)")

except Exception as e:
    print(f"Error: {e}")
