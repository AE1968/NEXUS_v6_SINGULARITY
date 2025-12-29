import codecs

# Read the file
with open('app.py', 'r', encoding='utf-8') as f:
    content = f.read()

# Fix the malformed detect_response_language function
old_text = r"""# 🌐 LANGUAGE DETECTION HELPER\r\ndef detect_response_language(text):\r\n    \"\"\"Detect language from text using word patterns\"\"\"\r\n    if not text:\r\n        return 'auto'\r\n    \r\n    lower_text = f\" {text.lower()} \"\r\n    \r\n    # Romanian indicators\r\n    ro_words = ['și', 'este', 'sunt', 'pentru', 'care', 'acest', 'bună', 'despre']\r\n    ro_count = sum(1 for w in ro_words if f' {w}' in lower_text or f'{w} ' in lower_text)\r\n    \r\n    # English indicators\r\n    en_words = ['the', 'is', 'are', 'this', 'that', 'have', 'with', 'from', 'they', 'will']\r\n    en_count = sum(1 for w in en_words if f' {w} ' in lower_text)\r\n    \r\n    # German indicators\r\n    de_words = ['ich', 'sie', 'ist', 'und', 'das', 'nicht', 'mit', 'auch']\r\n    de_count = sum(1 for w in de_words if f' {w} ' in lower_text)\r\n    \r\n    # French indicators\r\n    fr_words = ['est', 'sont', 'avec', 'pour', 'dans', 'les', 'des', 'que']\r\n    fr_count = sum(1 for w in fr_words if f' {w} ' in lower_text)\r\n    \r\n    counts = {'ro': ro_count, 'en': en_count, 'de': de_count, 'fr': fr_count}\r\n    max_lang = max(counts, key=counts.get)\r\n    \r\n    if counts[max_lang] >= 2:\r\n        return max_lang\r\n    return 'auto'\r\n\r\n# 🧠 PERSISTENT NEURAL MEMORY: Retrieval logic with WEB SEARCH"""

new_text = '''# 🌐 LANGUAGE DETECTION HELPER
def detect_response_language(text):
    """Detect language from text using word patterns"""
    if not text:
        return 'auto'
    
    lower_text = f" {text.lower()} "
    
    # Romanian indicators
    ro_words = ['și', 'este', 'sunt', 'pentru', 'care', 'acest', 'bună', 'despre']
    ro_count = sum(1 for w in ro_words if f' {w}' in lower_text or f'{w} ' in lower_text)
    
    # English indicators
    en_words = ['the', 'is', 'are', 'this', 'that', 'have', 'with', 'from', 'they', 'will']
    en_count = sum(1 for w in en_words if f' {w} ' in lower_text)
    
    # German indicators
    de_words = ['ich', 'sie', 'ist', 'und', 'das', 'nicht', 'mit', 'auch']
    de_count = sum(1 for w in de_words if f' {w} ' in lower_text)
    
    # French indicators
    fr_words = ['est', 'sont', 'avec', 'pour', 'dans', 'les', 'des', 'que']
    fr_count = sum(1 for w in fr_words if f' {w} ' in lower_text)
    
    counts = {'ro': ro_count, 'en': en_count, 'de': de_count, 'fr': fr_count}
    max_lang = max(counts, key=counts.get)
    
    if counts[max_lang] >= 2:
        return max_lang
    return 'auto'

# 🧠 PERSISTENT NEURAL MEMORY: Retrieval logic with WEB SEARCH'''

if old_text in content:
    content = content.replace(old_text, new_text)
    print("Found and replaced malformed block")
else:
    # Try finding by partial match
    lines = content.split('\n')
    new_lines = []
    i = 0
    while i < len(lines):
        if '# 🌐 LANGUAGE DETECTION HELPER' in lines[i] and 'detect_response_language' in lines[i]:
            # This is the malformed single line - replace it
            new_lines.append('# 🌐 LANGUAGE DETECTION HELPER')
            new_lines.append('def detect_response_language(text):')
            new_lines.append('    """Detect language from text using word patterns"""')
            new_lines.append('    if not text:')
            new_lines.append("        return 'auto'")
            new_lines.append('    ')
            new_lines.append('    lower_text = f" {text.lower()} "')
            new_lines.append('    ')
            new_lines.append('    # Romanian indicators')
            new_lines.append("    ro_words = ['și', 'este', 'sunt', 'pentru', 'care', 'acest', 'bună', 'despre']")
            new_lines.append("    ro_count = sum(1 for w in ro_words if f' {w}' in lower_text or f'{w} ' in lower_text)")
            new_lines.append('    ')
            new_lines.append('    # English indicators')
            new_lines.append("    en_words = ['the', 'is', 'are', 'this', 'that', 'have', 'with', 'from', 'they', 'will']")
            new_lines.append("    en_count = sum(1 for w in en_words if f' {w} ' in lower_text)")
            new_lines.append('    ')
            new_lines.append('    # German indicators')
            new_lines.append("    de_words = ['ich', 'sie', 'ist', 'und', 'das', 'nicht', 'mit', 'auch']")
            new_lines.append("    de_count = sum(1 for w in de_words if f' {w} ' in lower_text)")
            new_lines.append('    ')
            new_lines.append('    # French indicators')
            new_lines.append("    fr_words = ['est', 'sont', 'avec', 'pour', 'dans', 'les', 'des', 'que']")
            new_lines.append("    fr_count = sum(1 for w in fr_words if f' {w} ' in lower_text)")
            new_lines.append('    ')
            new_lines.append("    counts = {'ro': ro_count, 'en': en_count, 'de': de_count, 'fr': fr_count}")
            new_lines.append('    max_lang = max(counts, key=counts.get)')
            new_lines.append('    ')
            new_lines.append('    if counts[max_lang] >= 2:')
            new_lines.append('        return max_lang')
            new_lines.append("    return 'auto'")
            new_lines.append('')
            new_lines.append('# 🧠 PERSISTENT NEURAL MEMORY: Retrieval logic with WEB SEARCH')
            print("Fixed malformed line by splitting")
        else:
            new_lines.append(lines[i])
        i += 1
    content = '\n'.join(new_lines)

# Write back
with open('app.py', 'w', encoding='utf-8') as f:
    f.write(content)
    
print('Done fixing app.py')
