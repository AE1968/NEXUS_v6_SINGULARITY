
import os
import re

def fix_file(filepath):
    print(f"Repairing {filepath}...")
    try:
        with open(filepath, 'r', encoding='ascii') as f:
            content = f.read()
        
        # 1. Fix double-encoded patterns (common mojibake in this project)
        # â\x8f\xb3 (\u00e2\u008f\u00b3) -> ⏳ (\u23f3)
        content = content.replace(r'\u00e2\u008f\u00b3', r'\u23f3')
        # âœ… (\u00e2\u009c\u0085) -> ✅ (\u2705)
        content = content.replace(r'\u00e2\u009c\u0085', r'\u2705')
        # â\x9d\x8c (\u00e2\u009d\u008c) -> ❌ (\u274c)
        content = content.replace(r'\u00e2\u009d\u008c', r'\u274c')
        # ð\x9f\x9a\x80 (\u00f0\u009f\u009a\u0080) -> 🚀 (\ud83d\ude80)
        content = content.replace(r'\u00f0\u009f\u009a\u0080', r'\ud83d\ude80')
        # ð\x9f\x93\xa7 (\u00f0\u009f\u0093\u00a7) -> 📧 (\ud83d\udce7)
        content = content.replace(r'\u00f0\u009f\u0093\u00a7', r'\ud83d\udce7')
        
        # Generic catch-all for remaining heroglife prefixes
        content = re.sub(r'\\u00e2', '', content)
        content = re.sub(r'\\u00f0', '', content)

        with open(filepath, 'w', encoding='ascii') as f:
            f.write(content)
        return True
    except Exception as e:
        print(f"Error fix_file {filepath}: {e}")
        return False

targets = ['js/main.js', 'js/3d-systems.js', 'js/hologram.js', 'app.py']
for t in targets:
    if os.path.exists(t):
        fix_file(t)
