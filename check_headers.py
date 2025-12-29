import requests

try:
    print("🌐 HEADERS CHECK for https://kelionai.app")
    r = requests.head("https://kelionai.app")
    for k, v in r.headers.items():
        print(f"{k}: {v}")
except Exception as e:
    print(f"Error: {e}")
