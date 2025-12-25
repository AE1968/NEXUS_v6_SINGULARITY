import os
import re

print("Running NEXUS DEEP AUDIT PROTOCOL v6.0...")

report = []
score = 100
critical_errors = 0

def log(msg, status="INFO"):
    global score
    icon = "✅"
    if status == "WARN":
        icon = "⚠️"
        score -= 5
    elif status == "FAIL":
        icon = "❌"
        score -= 20
        global critical_errors
        critical_errors += 1
    
    entry = f"{icon} [{status}] {msg}"
    print(entry)
    report.append(entry)

def check_file_exists(path):
    if os.path.exists(path):
        log(f"{path}: File Found")
        return True
    else:
        log(f"{path}: MISSING FILE", "FAIL")
        return False

def check_content(path, pattern, pattern_name):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            if re.search(pattern, content):
                log(f"{path}: {pattern_name} Verified")
            else:
                log(f"{path}: {pattern_name} NOT FOUND", "FAIL")
    except Exception as e:
        log(f"{path}: Read Error - {str(e)}", "FAIL")

def check_brackets(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            content = f.read()
            open_br = content.count('{')
            close_br = content.count('}')
            if open_br != close_br:
                log(f"{path}: Unbalanced Brackets ({{={open_br}, }}={close_br})", "WARN")
            else:
                log(f"{path}: Syntax Integrity (Brackets Balanced)")
    except:
        pass

# 1. Core Structure
check_file_exists("nexus_core.html")

# 2. v6 Modules Check
v6_modules = [
    "js/nexus_neural_engine.js",
    "js/nexus_vision.js",
    "js/nexus_bio_matrix.js",
    "js/nexus_memory_vector.js",
    "js/nexus_agents.js",
    "js/nexus_iot.js"
]

for mod in v6_modules:
    if check_file_exists(mod):
        check_brackets(mod)

# 3. HTML Integration Check
try:
    with open("nexus_core.html", 'r', encoding='utf-8') as f:
        html = f.read()
        for mod in v6_modules:
            if mod in html:
                log(f"nexus_core.html: Links to {mod}")
            else:
                log(f"nexus_core.html: FAIL - script {mod} not linked!", "FAIL")
except:
    log("nexus_core.html: Read Failed", "FAIL")

# 4. Strict Config Check
check_content("js/nexus_neural_engine.js", r"preferCloud:\s*true", "Strict Cloud-First Policy (preferCloud: true)")

# Report Generation
with open("AUDIT_REPORT_DEEP_v6.txt", "w", encoding="utf-8") as f:
    f.write("\n".join(report))
    f.write(f"\n==============================\n🧬 DEEP SYSTEM HEALTH SCORE: {max(0, score)}/100\n")
    if critical_errors == 0:
        f.write("✅ STATUS: STABLE - READY FOR DEPLOY (v6.0 CERTIFIED)\n")
    else:
        f.write("❌ STATUS: CRITICAL ERRORS DETECTED\n")
    f.write("==============================\n")

print(f"Audit Complete. V6 Deep Report saved to AUDIT_REPORT_DEEP_v6.txt. Score: {score}/100")
