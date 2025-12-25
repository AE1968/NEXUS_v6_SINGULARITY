
import os
import re

files_to_scan = [
    'backend_url.txt', 'frontend_url.txt',
    'backend_serveo.txt', 'frontend_serveo.txt',
    'backend_pinggy.txt', 'frontend_pinggy.txt',
    'CREDENTIALE_ADMIN_SI_RESURSE.txt',
    'public_url.txt'
]

# Local temp file
temp_file = 'temp_api_list.txt'
# Desktop file
desktop_path = os.path.join(os.path.expanduser('~'), 'Desktop', 'NEXUS_API_SERVERS.txt')

found_info = []
unique_urls = set()

url_pattern = re.compile(r'(https?://[^\s]+)')

print("Scanning files...")

for fname in files_to_scan:
    if os.path.exists(fname):
        print(f"Reading {fname}...")
        try:
            content = ""
            # Try utf-8
            try:
                with open(fname, 'r', encoding='utf-8') as f:
                    content = f.read()
            except UnicodeDecodeError:
                # Try utf-16
                try:
                    with open(fname, 'r', encoding='utf-16') as f:
                        content = f.read()
                except:
                    pass
            
            # Extract URLs
            urls = url_pattern.findall(content)
            if urls:
                # found_info.append(f"=== FROM {fname} ===")
                for url in urls:
                    clean_url = url.strip().rstrip('.,;)"\'')
                    if clean_url not in unique_urls:
                         unique_urls.add(clean_url)
                         found_info.append(f"SOURCE: {fname} -> {clean_url}")
            
            if 'CREDENTIALE' in fname:
                 found_info.append("\n=== CREDENTIALE ===")
                 found_info.append(content)
                 found_info.append("===================\n")

        except Exception as e:
            print(f"Error extracting from {fname}: {e}")

final_content = "NEXUS API SERVERS & CREDENTIALS\n================================\n\n" + "\n".join(found_info)

# Write to temp file
with open(temp_file, 'w', encoding='utf-8') as f:
    f.write(final_content)

print(f"Wrote to {temp_file}")

# Write to Desktop
try:
    with open(desktop_path, 'w', encoding='utf-8') as f:
        f.write(final_content)
    print(f"Successfully copied to {desktop_path}")
except Exception as e:
    print(f"Error writing to desktop: {e}")
