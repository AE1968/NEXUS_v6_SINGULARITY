#!/usr/bin/env python3
"""
AI Full Handoff Packager (no lies edition)
- Packs nearly everything from a project into a ZIP
- Still protects you by excluding real secrets (but creates .env.template)
- Produces a manifest with full inventory and warnings
"""

import os, sys, re, json, time, zipfile, hashlib
from pathlib import Path

# Default exclusions that are usually unnecessary or huge.
DEFAULT_HUGE_DIRS = {".git", ".svn", ".hg", "__pycache__", ".pytest_cache", ".mypy_cache"}
OPTIONAL_HUGE_DIRS = {"node_modules", ".venv", "venv", "env", "dist", "build", ".next", "out"}

# Files that are very likely secrets; we exclude but we can template them
SECRET_FILENAMES = {
    ".env", ".env.local", ".env.production", ".env.development",
    "id_rsa", "id_ed25519", "id_dsa",
    "secrets.json", "secret.json",
    "service-account.json", "service_account.json",
}

# Detect likely secrets inside files (best-effort, not perfect)
SECRET_PATTERNS = [
    (re.compile(r"AKIA[0-9A-Z]{16}"), "Looks like AWS Access Key ID"),
    (re.compile(r"-----BEGIN (RSA|OPENSSH|EC|DSA) PRIVATE KEY-----"), "Private key block"),
    (re.compile(r"sk-[A-Za-z0-9]{20,}"), "Looks like an API key (sk-...)"),
    (re.compile(r"(?i)(api[_-]?key|secret|token|password)\s*[:=]\s*['\"][^'\"]{8,}['\"]"), "Key/secret assignment"),
    (re.compile(r"(?i)bearer\s+[A-Za-z0-9\.\-_]{20,}"), "Bearer token"),
]

# We still include config files, but exclude binary junk by default unless user says so
DEFAULT_EXCLUDE_SUFFIXES = {".pyc", ".pyo", ".pyd", ".log", ".tmp", ".bak", ".zip", ".7z", ".rar"}

TEXT_EXTENSIONS = {
    ".py",".js",".ts",".tsx",".jsx",".json",".yml",".yaml",".toml",".ini",".cfg",".md",".txt",".html",".css",
    ".sh",".bat",".ps1",".sql",".env",".gitignore",".dockerignore",".xml",".csv"
}

def sha256_file(path: Path) -> str:
    h = hashlib.sha256()
    with path.open("rb") as f:
        for chunk in iter(lambda: f.read(1024 * 1024), b""):
            h.update(chunk)
    return h.hexdigest()

def is_text_file(path: Path) -> bool:
    if path.suffix.lower() in TEXT_EXTENSIONS:
        return True
    # fallback: try small decode
    try:
        data = path.read_bytes()[:4096]
        data.decode("utf-8")
        return True
    except Exception:
        return False

def read_text_safe(path: Path, limit=200_000) -> str:
    try:
        b = path.read_bytes()
        if len(b) > limit:
            b = b[:limit]
        return b.decode("utf-8", errors="ignore")
    except Exception:
        return ""

def make_env_template(root: Path) -> tuple[str, list[str]]:
    """
    Searches for .env* files and extracts variable names into .env.template
    """
    vars_found = set()
    sources = []
    for p in root.rglob(".env*"):
        if p.is_dir():
            continue
        # ignore very large
        if p.stat().st_size > 2_000_000:
            continue
        txt = read_text_safe(p)
        for line in txt.splitlines():
            line = line.strip()
            if not line or line.startswith("#"):
                continue
            if "=" in line:
                k = line.split("=", 1)[0].strip()
                if re.match(r"^[A-Za-z_][A-Za-z0-9_]*$", k):
                    vars_found.add(k)
                    sources.append(str(p.relative_to(root)))
    template_lines = ["# Fill these values on your machine/server", "# DO NOT commit real secrets\n"]
    for k in sorted(vars_found):
        template_lines.append(f"{k}=\n")
    return "\n".join(template_lines), sorted(set(sources))

def prompt(text: str, default: str | None = None) -> str:
    if default is not None:
        ans = input(f"{text} [{default}]: ").strip()
        return ans if ans else default
    return input(f"{text}: ").strip()

def main():
    root = Path.cwd()
    print("\nAI Full Handoff Packager")
    print(f"Project root: {root}\n")

    include_optional_huge = prompt("Include huge dirs (node_modules/venv/build)? (yes/no)", "no").lower().startswith("y")
    include_binaries = prompt("Include binary files (images, pdf, etc.)? (yes/no)", "yes").lower().startswith("y")

    zip_name = prompt("Output zip", "handoff_full.zip")
    manifest_name = prompt("Manifest", "handoff_full_manifest.json")

    excludes = set(DEFAULT_HUGE_DIRS)
    if not include_optional_huge:
        excludes |= set(OPTIONAL_HUGE_DIRS)

    files_added, files_skipped = [], []
    warnings = []
    hashes = {}

    env_template, env_sources = make_env_template(root)

    with zipfile.ZipFile(zip_name, "w", compression=zipfile.ZIP_DEFLATED) as z:
        # add env template
        z.writestr(".env.template", env_template)

        for path in root.rglob("*"):
            if path.is_dir():
                continue
            rel = path.relative_to(root)

            # skip excluded directories
            if any(part in excludes for part in rel.parts):
                files_skipped.append(str(rel) + " (excluded dir)")
                continue

            # skip obvious suffixes
            if rel.suffix.lower() in DEFAULT_EXCLUDE_SUFFIXES:
                files_skipped.append(str(rel) + " (suffix excluded)")
                continue

            # exclude secret-named files, but warn
            if rel.name in SECRET_FILENAMES:
                files_skipped.append(str(rel) + " (secret file excluded)")
                warnings.append(f"Excluded likely secret file: {rel}")
                continue

            # optionally exclude binaries
            if not include_binaries and not is_text_file(path):
                files_skipped.append(str(rel) + " (binary excluded)")
                continue

            # size cap safety (100MB per file)
            try:
                size = path.stat().st_size
            except OSError:
                files_skipped.append(str(rel) + " (stat failed)")
                continue
            if size > 100 * 1024 * 1024:
                files_skipped.append(str(rel) + " (too large >100MB)")
                warnings.append(f"Skipped very large file (>100MB): {rel}")
                continue

            # scan text for possible secrets (warn only)
            if is_text_file(path):
                txt = read_text_safe(path)
                for rx, msg in SECRET_PATTERNS:
                    if rx.search(txt):
                        warnings.append(f"Possible secret in {rel}: {msg}")
                        break

            z.write(path, arcname=str(rel))
            files_added.append(str(rel))
            try:
                hashes[str(rel)] = sha256_file(path)
            except Exception:
                hashes[str(rel)] = None

    manifest = {
        "created_utc": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "root": str(root),
        "include_optional_huge_dirs": include_optional_huge,
        "include_binaries": include_binaries,
        "excluded_dirs": sorted(list(excludes)),
        "excluded_secret_filenames": sorted(list(SECRET_FILENAMES)),
        "env_template_generated_from": env_sources,
        "files_added_count": len(files_added),
        "files_skipped_count": len(files_skipped),
        "files_added": files_added[:4000],
        "files_skipped": files_skipped[:4000],
        "sha256": hashes,
        "warnings": warnings[:2000],
        "how_to_use": [
            "Upload the ZIP + manifest to ChatGPT.",
            "Do not upload real .env / private keys.",
            "If warnings mention secrets, rotate keys if necessary and replace with placeholders.",
        ],
    }

    Path(manifest_name).write_text(json.dumps(manifest, indent=2), encoding="utf-8")

    print("\nDone ✅")
    print(f"- Created: {zip_name}")
    print(f"- Created: {manifest_name}")
    if warnings:
        print("\nWARNINGS (review before sharing):")
        for w in warnings[:20]:
            print(" -", w)
        if len(warnings) > 20:
            print(f" ... and {len(warnings)-20} more warnings in manifest.")
    print("\nNext:")
    print("1) Review warnings in manifest.")
    print("2) Upload BOTH files here (zip + manifest).")
    print("3) Tell me what changes you want; I return a patch/zip back.\n")

if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\nCancelled.")
        sys.exit(1)
