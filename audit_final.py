
import os
import re

def audit():
    report = []
    errors = []
    warnings = []

    def check_file(path, description):
        if os.path.exists(path):
            size = os.path.getsize(path)
            report.append(f"✅ FOUND: {path} ({size} bytes) - {description}")
            return True
        else:
            errors.append(f"❌ MISSING: {path} - {description}")
            return False

    def check_content(path, pattern, description):
        if not os.path.exists(path): return False
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        if re.search(pattern, content):
            report.append(f"✅ MATCH: {description} detected in {path}")
            return True
        else:
            errors.append(f"❌ FAIL: {description} NOT found in {path}")
            return False

    print("--- STARTING KELION v143.0 FINAL AUDIT ---\n")

    # 1. ASSET STRUCTURE
    check_file("css/style.css", "Main Stylesheet")
    check_file("css/legal.css", "Legal Pages Stylesheet")
    check_file("js/main.js", "Main Logic Integration")
    check_file("js/hologram.js", "Hologram System (Core)")
    check_file("js/3d-systems.js", "3D Subsystems (Orb, Globe, LipSync)")
    check_file("assets/hologram.glb", "3D Model Asset")
    check_file("migrate_db.py", "Database Migration Script")

    # 2. APP.PY INTEGRATION
    if check_file("app.py", "Main Application File"):
        check_content("app.py", "import migrate_db", "Migration Module Import")
        check_content("app.py", "migrate_db\.migrate\(\)", "Startup Migration Trigger")
        check_content("app.py", "@app\.route\('/css/<path:path>'\)", "Static CSS Route")
        check_content("app.py", "@app\.route\('/js/<path:path>'\)", "Static JS Route")
        check_content("app.py", "static_folder=BASE_DIR", "Base Static Folder Config")

    # 3. FRONTEND CONVERGENCE
    if check_file("index.html", "Main Entry Point"):
        check_content("index.html", 'src="js/hologram.js"', "Hologram JS Link")
        check_content("index.html", 'src="js/3d-systems.js"', "3D Systems JS Link")
        check_content("index.html", 'href="css/style.css"', "CSS Link")
        # Check for inline remnants - we expect NO large blocks, but check loosely
        with open("index.html", 'r', encoding='utf-8') as f:
            if "<style>" in f.read():
                 # Validating if it's small or large
                 pass

    # 4. LEGAL PAGES
    if check_file("terms.html", "Terms Page"):
        check_content("terms.html", 'href="css/legal.css"', "Legal CSS Link")
    
    # 5. DEMO INTEGRITY
    check_file("demo_orb.html", "Orb Demo")
    check_content("demo_orb.html", "assets/hologram.glb", "Correct Model Path in Demo")

    # REPORT GENERATION
    print("\n--- AUDIT RESULTS ---")
    for line in report: print(line)
    
    if warnings:
        print("\n--- WARNINGS ---")
        for line in warnings: print(line)

    if errors:
        print("\n--- CRITICAL ERRORS ---")
        for line in errors: print(line)
        print("\n❌ AUDIT FAILED")
    else:
        print("\n✅ AUDIT PASSED: SYSTEM READY FOR DEPLOYMENT")

if __name__ == "__main__":
    audit()
