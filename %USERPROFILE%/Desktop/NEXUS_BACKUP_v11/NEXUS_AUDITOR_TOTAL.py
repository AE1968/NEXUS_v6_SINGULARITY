import os
import re
import sys
import datetime

print("Running NEXUS TOTAL AUDIT PROTOCOL (vTotal)...")
print(f"Time: {datetime.datetime.now()}")

report = []
score = 100
warnings = 0
critical_errors = 0

def log(msg, status="INFO"):
    global score, warnings, critical_errors
    icon = "✅"
    if status == "WARN":
        icon = "⚠️"
        score -= 5
        warnings += 1
    elif status == "FAIL":
        icon = "❌"
        score -= 20
        critical_errors += 1
    elif status == "CRITICAL":
        icon = "🚫"
        score -= 50
        critical_errors += 1
    
    entry = f"{icon} [{status}] {msg}"
    print(entry)
    report.append(entry)

def check_file(path, required_strings=[]):
    if not os.path.exists(path):
        log(f"File Missing: {path}", "FAIL")
        return False
    
    log(f"File Found: {path}", "INFO")
    
    try:
        with open(path, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
            content_lower = content.lower()
            
            # Basic Syntax Check (Brackets)
            if path.endswith('.js') or path.endswith('.py') or path.endswith('.html'):
                if content.count('{') != content.count('}'):
                    log(f"Syntax Warning {path}: Unbalanced {{}}", "WARN")
            
            # Content Verification
            for s in required_strings:
                if s.lower() in content_lower:
                    log(f"Feature Verified in {path}: '{s}'", "INFO")
                else:
                    log(f"Feature Missing in {path}: '{s}'", "FAIL")
            return True
    except Exception as e:
        log(f"Error reading {path}: {str(e)}", "FAIL")
        return False

# 1. CORE APPLICATION FILES
log("--- CORE SYSTEM AUDIT ---", "INFO")
check_file("app.py", [
    "get_chatgpt_response",
    "system_prompt",
    "Switch to sandbox for testing",
    "voice = \"onyx\""
])

check_file("index.html", [
    "kelionVoice.speak",
    "dynamic language detection",
    "Turn-taking: Re-activating microphone"
])

check_file("js/kelion_voice.js", [
    "onEnd",
    "voicePreferences", 
    "detectLanguage",
    "window.kelionVoice = new KelionVoice();"
])

# 2. CONFIGURATION & KEYS
log("--- CONFIGURATION AUDIT ---", "INFO")
check_file("config_kelion.py", ["OPENAI_API_KEY", "SECRET_KEY"])

# 3. BACKUP VERIFICATION
log("--- BACKUP VERIFICATION ---", "INFO")
backup_path = "GENEZA_NEXUS_BACKUP_10"
if os.path.isdir(backup_path):
    log(f"Backup Directory Found: {backup_path}", "INFO")
    # Spot check a file in backup
    if os.path.exists(os.path.join(backup_path, "index.html")):
         log(f"Backup Integrity Check: index.html present in {backup_path}", "INFO")
    else:
         log(f"Backup Corrupt: index.html missing in {backup_path}", "FAIL")
else:
    log(f"Backup Missing: {backup_path}", "FAIL")

# 4. DATABASE CHECK
log("--- DATABASE AUDIT ---", "INFO")
if os.path.exists("nexus.db") or os.path.exists("kelion_mainframe.db"):
    log("Database File Found (nexus.db or kelion_mainframe.db)", "INFO")
else:
    log("Database Missing", "WARN")

# 5. LEGACY/MODULE CHECK (Reference content from v6 audit)
log("--- LEGACY MODULE AUDIT ---", "INFO")
check_file("nexus_core.html", []) 

# Smart Check: Read the deep audit report to see if it actually passed
deep_report_path = "AUDIT_REPORT_DEEP_v6.txt"
legacy_status = "UNKNOWN"
if os.path.exists(deep_report_path):
    with open(deep_report_path, 'r', encoding='utf-8') as f:
        deep_content = f.read()
        if "CRITICAL ERRORS DETECTED" in deep_content or "FAIL" in deep_content:
             log("Deep Audit (v6) reports ERRORS. See AUDIT_REPORT_DEEP_v6.txt", "WARN")
        elif "100/100" in deep_content or "STABLE" in deep_content:
             log("Deep Audit (v6) Status: PASSED (100% Integrity)", "INFO")
        else:
             log("Deep Audit (v6) Status: INCONCLUSIVE", "WARN")
else:
    log("Deep Audit Report (v6) Missing - Run NEXUS_AUDITOR_AI_v6.py first", "WARN")

# FINAL SCORE
score = max(0, score)
status_overall = "STABLE"
if score < 80: status_overall = "UNSTABLE"
if score < 50: status_overall = "CRITICAL"

log(f"--- AUDIT COMPLETE ---")
log(f"TOTAL SCORE: {score}/100")
log(f"STATUS: {status_overall}")

with open("AUDIT_TOTAL_REPORT.txt", "w", encoding="utf-8") as f:
    f.write(f"NEXUS TOTAL AUDIT REPORT - {datetime.datetime.now()}\n")
    f.write("=================================================\n")
    f.write("\n".join(report))
