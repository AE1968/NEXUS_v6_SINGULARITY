import json
import os

MEM_FILE = "memory.json"

def load_memory():
    if not os.path.exists(MEM_FILE):
        return {}
    with open(MEM_FILE, "r") as f:
        try:
            return json.load(f)
        except:
            return {}

def save_memory(mem):
    with open(MEM_FILE, "w") as f:
        json.dump(mem, f, indent=2)
