
import os
import re

def to_safe_ascii(filepath):
    print(f"Purging non-ASCII from {filepath}...")
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        # Replace common entities first (manual overrides)
        mapping = {
            "♿": "&#9855;",
            "🚀": "&#128640;",
            "✅": "&#9989;",
            "❌": "&#10060;",
            "📧": "&#128231;",
            "👤": "&#128100;",
            "📋": "&#128203;",
            "🕒": "&#128354;",
            "💬": "&#128172;",
            "🔑": "&#128273;",
            "🔐": "&#128274;",
            "🤖": "&#129302;",
            "😄": "&#128516;",
            "⏳": "&#8987;",
            "🌙": "&#127769;",
            "☀️": "&#9728;",
            "🎤": "&#127908;",
            "ð": "?", # Kill the heroglife prefix
            "Ÿ": "?",
        }
        for k, v in mapping.items():
            content = content.replace(k, v)

        # Force all remaining non-ascii to either html entity (if html) or unicode escape (if js)
        is_js = filepath.endswith('.js')
        
        def replacer(match):
            char = match.group(0)
            if is_js:
                return f"\\u{ord(char):04x}"
            else:
                return f"&#{ord(char)};"

        new_content = re.sub(r'[^\x00-\x7f]', replacer, content)

        with open(filepath, 'w', encoding='ascii') as f:
            f.write(new_content)
        return True
    except Exception as e:
        print(f"Error: {e}")
        return False

# Target files
targets = [
    'index.html',
    'js/main.js',
    'js/3d-systems.js',
    'js/hologram.js',
    'css/style.css'
]

for t in targets:
    if os.path.exists(t):
        to_safe_ascii(t)

print("\n--- FINAL ASCII PURGE COMPLETE ---")
