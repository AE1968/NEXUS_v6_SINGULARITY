import os
import re
import json

class NexusAuditor:
    def __init__(self, project_path):
        self.path = project_path
        self.report = []
        self.score = 100
        self.critical_errors = 0

    def log(self, type, message):
        icon = "✅" if type == "INFO" else "⚠️" if type == "WARN" else "❌"
        if type == "ERROR": 
            self.score -= 10
            self.critical_errors += 1
        elif type == "WARN":
            self.score -= 2
        
        entry = f"{icon} [{type}] {message}"
        print(entry)
        self.report.append(entry)

    def audit_html_integrity(self, file_path):
        if not os.path.exists(file_path):
            self.log("ERROR", f"Missing File: {file_path}")
            return
        
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Check Structure
        if "<!DOCTYPE html>" not in content: self.log("WARN", f"{file_path}: Missing DOCTYPE")
        if "</html>" not in content: self.log("ERROR", f"{file_path}: Unclosed html tag")
        
        # Check Critical IDs
        required_ids = ['chatLog', 'neuralMsg', 'thought-stream']
        for rid in required_ids:
            if f'id="{rid}"' not in content and f"id='{rid}'" not in content:
                self.log("WARN", f"{file_path}: Missing critical UI element #{rid}")

        # Check Script integrity (simple bracket matching)
        open_scripts = content.count("<script")
        close_scripts = content.count("</script>")
        if open_scripts != close_scripts:
            self.log("ERROR", f"{file_path}: Mismatched SCRIPT tags ({open_scripts} vs {close_scripts})")
        else:
            self.log("INFO", f"{file_path}: HTML Structure Integrity Verified")

    def audit_js_logic(self, file_path):
        if not os.path.exists(file_path): return

        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Check Llama Config
        if "Llama-3-8B-Instruct" in content:
            self.log("INFO", "Neural Engine: Llama-3 Configuration Detected")
        else:
            self.log("WARN", "Neural Engine: Llama-3 Config MISSING or Modified")

        # Check Syntax (Basic)
        if content.count("{") != content.count("}"):
             self.log("WARN", f"{file_path}: Possible Unbalanced Brackets ({{}})")

    def audit_security(self):
        toml_path = os.path.join(self.path, "netlify.toml")
        if os.path.exists(toml_path):
            with open(toml_path, 'r') as f:
                content = f.read()
            if "Cross-Origin-Opener-Policy" in content and "Cross-Origin-Embedder-Policy" in content:
                self.log("INFO", "Security: WebGPU Headers are ACTIVE")
            else:
                self.log("ERROR", "Security: WebGPU Headers MSSING in netlify.toml (AI will fail)")
        else:
             self.log("WARN", "Security: netlify.toml missing")

    def run_full_scan(self):
        output = []
        output.append("\n🔎 STARTING NEXUS AI AUDIT...\n")
        
        # Capture logs by overriding print or just appending to list
        # We will reconstruct for simplicity
        
        # 1. Core Files
        self.audit_html_integrity(os.path.join(self.path, "nexus_core.html"))
        self.audit_html_integrity(os.path.join(self.path, "nexus_mobile.html"))
        
        # 2. Brain Logic
        self.audit_js_logic(os.path.join(self.path, "js/nexus_neural_engine.js"))
        
        # 3. Security
        self.audit_security()
        
        # Result
        final_msg = f"\n{'='*30}\n🧬 SYSTEM HEALTH SCORE: {self.score}/100\n"
        if self.critical_errors == 0:
            final_msg += "✅ STATUS: STABLE - READY FOR DEPLOY\n"
        else:
            final_msg += f"❌ STATUS: UNSTABLE ({self.critical_errors} Critical Errors)\n"
        final_msg += f"{'='*30}\n"
        
        # Save to file
        with open("AUDIT_REPORT_FINAL.txt", "w", encoding="utf-8") as f:
            f.write("\n".join(self.report))
            f.write(final_msg)
            
        print("Audit Complete. Report saved to AUDIT_REPORT_FINAL.txt")

# Run
if __name__ == "__main__":
    auditor = NexusAuditor(".")
    auditor.run_full_scan()
