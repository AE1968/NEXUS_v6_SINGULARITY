#!/usr/bin/env python3
"""
Strict Project Packager for USER REQUEST
Output: project_full.zip, project_manifest.json
"""

import os, sys, re, json, time, zipfile, hashlib
from pathlib import Path

# We keep .git and __pycache__ excluded as they are not "project files" but version control/runtime artifacts.
# However, we will include ALMOST EVERYTHING else.
DEFAULT_HUGE_DIRS = {".git", ".svn", ".hg", "__pycache__", ".pytest_cache", ".mypy_cache", "node_modules", "venv", ".venv"}
# User asked for "everything", but usually node_modules is too big and reproducible. 
# We'll list them as excluded in manifest.

SECRET_FILENAMES = {
    ".env", ".env.local", ".env.production", ".env.development",
    "id_rsa", "id_ed25519", "secrets.json", "service-account.json"
}

# New request: Exclude images/pictures to save space
IMAGE_SUFFIXES = {
    ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".webp", ".bmp", ".tiff", ".tif", ".psd"
}

TEXT_EXTENSIONS = {
    ".py",".js",".ts",".tsx",".jsx",".json",".yml",".yaml",".toml",".ini",".cfg",".md",".txt",".html",".css",
    ".sh",".bat",".ps1",".sql",".env",".php", ".rb", ".java", ".c", ".cpp", ".h"
}

SECRET_PATTERNS = [
    (re.compile(r"AKIA[0-9A-Z]{16}"), "AWS Access Key"),
    (re.compile(r"sk-[A-Za-z0-9]{20,}"), "OpenAI/Stripe Key"),
    (re.compile(r"(?i)(api[_-]?key|secret)\s*[:=]\s*['\"][^'\"]{8,}['\"]"), "Generic Secret Assignment"),
]

def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    try:
        with path.open("rb") as f:
            for chunk in iter(lambda: f.read(1024 * 1024), b""):
                h.update(chunk)
        return h.hexdigest()
    except Exception:
        return "error_hashing"

def read_text_safe(path: Path) -> str:
    try:
        return path.read_text(encoding="utf-8", errors="ignore")
    except Exception:
        return ""

def make_env_template(root: Path) -> tuple[str, list[str]]:
    vars_found = set()
    sources = []
    for p in root.rglob(".env*"):
        if p.is_dir(): continue
        txt = read_text_safe(p)
        for line in txt.splitlines():
            line = line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            k = line.split("=", 1)[0].strip()
            if re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", k):
                vars_found.add(k)
                sources.append(str(p.relative_to(root)))
    
    tpl = ["# TEMPLATE GENERATED TO PROTECT SECRETS", "# Fill these values manually\n"]
    for k in sorted(vars_found):
        tpl.append(f"{k}=")
    return "\n".join(tpl), sorted(set(sources))

def get_app_info():
    return {
        "description": "GENEZA_NEXUS_HUMANOID / KELION. A web-based AI humanoid interface combining Flask backend, holographic visuals (Three.js/GLB), and voice interaction capabilities.",
        "how_to_start": "1. Install requirements: pip install -r requirements.txt\n2. Configure .env from .env.template\n3. Run backend: python app.py\n4. Access at http://localhost:5000"
    }

def main():
    root = Path.cwd()
    zip_name = "project_full.zip"
    manifest_name = "project_manifest.json"
    
    print(f"Packing {root} into {zip_name}...")

    files_added = []
    files_skipped = []
    hashes = {}
    
    env_template, env_sources = make_env_template(root)
    
    with zipfile.ZipFile(zip_name, "w", compression=zipfile.ZIP_DEFLATED) as z:
        # Add env template
        z.writestr(".env.template", env_template)
        
        for path in root.rglob("*"):
            if path.is_dir():
                continue
            
            rel = path.relative_to(root)
            
            # Exclusions
            if any(p in DEFAULT_HUGE_DIRS for p in rel.parts):
                files_skipped.append({"path": str(rel), "reason": "Excluded directory (git/cache/lib)"})
                continue
                
            if rel.name in SECRET_FILENAMES:
                files_skipped.append({"path": str(rel), "reason": "SECURITY: Potential secret file"})
                continue
                
            if rel.name == zip_name or rel.name == manifest_name:
                continue

            if rel.suffix.lower() in IMAGE_SUFFIXES:
                files_skipped.append({"path": str(rel), "reason": "Excluded image/picture"})
                continue

            # Add file
            try:
                z.write(path, arcname=str(rel))
                files_added.append(str(rel))
                hashes[str(rel)] = sha256_file(path)
            except Exception as e:
                files_skipped.append({"path": str(rel), "reason": f"Read Error: {e}"})

    # Manifest
    app_info = get_app_info()
    manifest = {
        "project_name": root.name,
        "export_date": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "description": app_info["description"],
        "startup_instructions": app_info["how_to_start"],
        "stats": {
            "total_files": len(files_added),
            "skipped_files": len(files_skipped)
        },
        "security_notes": {
            "excluded_secrets": env_sources,
            "generated_template": ".env.template"
        },
        "inventory": {
            "included": files_added,
            "skipped": files_skipped
        },
        "file_hashes_sha256": hashes
    }
    
    Path(manifest_name).write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print("Success.")

if __name__ == "__main__":
    main()
