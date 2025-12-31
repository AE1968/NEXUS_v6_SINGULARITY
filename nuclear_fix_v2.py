import os
import re

def sanitize_file(filepath, mapping):
    print(f"Sanitizing {filepath}...")
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        for k, v in mapping.items():
            content = content.replace(k, v)
        
        # Also handle any remaining non-ascii in JS specifically
        if filepath.endswith('.js'):
            def replacer(match):
                return f"\\u{ord(match.group(0)):04x}"
            # Protect existing \u escapes, then replace all other non-ascii
            content = re.sub(r'[^\x00-\x7f]+', lambda m: "".join(f"\\u{ord(c):04x}" for c in m.group(0)), content)

        with open(filepath, 'w', encoding='ascii') as f:
            f.write(content)
        print(f"Successfully sanitized {filepath}")
    except Exception as e:
        print(f"Error sanitizing {filepath}: {e}")

# HTML Entity mapping for common emojis
html_mapping = {
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
    "🎧": "&#127911;",
    "📱": "&#128241;",
    "📍": "&#128205;",
}

files_to_sanitize = [
    'index.html',
    'js/main.js',
    'js/3d-systems.js',
    'js/hologram.js',
    'app.py'
]

# app.py should stay utf-8 but we use escaping for strings where possible
# Actually per TODO mandate, we force ASCII safety everywhere.

for f in files_to_sanitize:
    abspath = os.path.join(os.getcwd(), f)
    if os.path.exists(abspath):
        sanitize_file(abspath, html_mapping)
    else:
        print(f"Skipping {f} - not found")

print("\n--- NUCLEAR ENCODING FIX COMPLETED ---")
