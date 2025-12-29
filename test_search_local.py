
import os
import requests
import json

# Set Key Manually for Test
SERPER_API_KEY = "0dd93022fa63c96b23b13a102323b10df7b205c4"

def search_web(query):
    print(f"Testing search for: {query}")
    if not SERPER_API_KEY:
        return "No Key"
    
    try:
        response = requests.post(
            "https://google.serper.dev/search",
            headers={
                "X-API-KEY": SERPER_API_KEY,
                "Content-Type": "application/json"
            },
            json={
                "q": query,
                "gl": "ro",
                "hl": "ro",
                "num": 3
            },
            timeout=10
        )
        
        if response.status_code != 200:
            return f"Error: {response.status_code} - {response.text}"
            
        data = response.json()
        print("Search successful!")
        if data.get('organic'):
            return f"First Result: {data['organic'][0]['title']}"
        else:
            return "No organic results"
            
    except Exception as e:
        return f"Exception: {e}"

print(search_web("pret bitcoin azi"))
