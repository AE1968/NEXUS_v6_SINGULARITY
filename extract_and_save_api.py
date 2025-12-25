
import os
import re

files_to_scan = [
    'backend_url.txt', 'frontend_url.txt',
    'backend_serveo.txt', 'frontend_serveo.txt',
    'backend_pinggy.txt', 'frontend_pinggy.txt',
    'CREDENTIALE_ADMIN_SI_RESURSE.txt',
    'public_url.txt'
]

output_file = r'C:\Users\adria\Desktop\NEXUS_API_SERVERS.txt'
found_info = []

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
                found_info.append(f"=== FROM {fname} ===")
                for url in urls:
                    # Clean up URL (sometimes attached noise)
                    clean_url = url.strip().rstrip('.,;)"\'')
                    found_info.append(clean_url)
                found_info.append("")
            
            # If it's the credentials file, try to keep more context
            if 'CREDENTIALE' in fname:
                found_info.append(f"=== FULL CONTENT OF {fname} ===")
                found_info.append(content)
                found_info.append("==============================\n")

        except Exception as e:
            print(f"Error extracting from {fname}: {e}")

# Write to desktop
try:
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write("\n".join(found_info))
    print(f"Successfully wrote to {output_file}")
except Exception as e:
    print(f"Error writing to desktop: {e}")

# Print what we found to stdout for the agent to see
print("\n--- CONTENT GENERATED ---\n")
print("\n".join(found_info))
