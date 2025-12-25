# 🔐 NEXUS v7.0 - COMENZI ADMINISTRATOR

**Acces:** ADMINISTRATOR / ARCHITECT ONLY  
**Permisiuni:** FULL CONTROL - Modificare sistem, acces loguri, configurare  
**Versiune:** 7.0.0 TRANSCENDENCE

---

## 🎯 **TOATE COMENZILE UTILIZATOR** (citește: COMENZI_UTILIZATOR.md)

ADMIN are acces la **TOATE** comenzile din `COMENZI_UTILIZATOR.md` PLUS comenzile de mai jos.

---

## 🔧 **COMENZI ADMIN EXCLUSIVE**

### **Diagnostic & Monitoring:**

| Comandă | Descriere | Acțiune |
|---------|-----------|---------|
| `raport stare` / `report status` | Raport diagnostic complet | Generează audit sistem |
| `autoreparare` / `auto repair` | Secvență auto-reparare | Restart module + reconnect cloud |
| `arata loguri` / `show logs` | Afișare loguri securitate | Verificare Architect role → display logs |
| `cmd:access_logs` | Acces direct loguri | Bypass frontend → backend logs |

### **System Testing:**

| Comandă | Descriere | Efect |
|---------|-----------|-------|
| `test lie` | Simulare dishonesty | Avatar → Pinocchio effect (nose grows) |
| `test truth` | Restabilire honesty | Avatar → Normal state |

---

## ⚙️ **CONFIGURĂRI SISTEM (ADMIN ONLY)**

### **1. User Profile Management:**

```javascript
// Modificare rol utilizator (DOAR ADMIN)
NexusNeuralEngine.memory.userProfile.role = "Architect"; // Full access
NexusNeuralEngine.memory.userProfile.role = "User";      // Limited access
```

### **2. API Keys Configuration:**

**Railway Dashboard:**
```bash
GOOGLE_API_KEY=your_gemini_key          # v6.0 (existing)
ANTHROPIC_API_KEY=your_claude_key       # v7.0 (NEW - ADMIN configurat)
```

**Activare Claude Sonnet 4.5:**
1. Login Railway: https://railway.com/project/695b8855-e63f-4266-84f0-c2e5197f3131
2. Navigate: Variables tab
3. Add: `ANTHROPIC_API_KEY` = your_anthropic_key
4. Click: Redeploy

### **3. Memory Management:**

```javascript
// Clear all user memories (ADMIN ONLY)
localStorage.clear();
window.NexusMemoryVector.knowledgeBase = [];

// Export memories
const backup = JSON.stringify(window.NexusMemoryVector.knowledgeBase);

// Import memories
window.NexusMemoryVector.knowledgeBase = JSON.parse(backup);
```

### **4. BioMatrix Controls:**

```javascript
// Override biological state
window.NexusBioMatrix.chemistry.dopamine = 0.9;    // Max happiness
window.NexusBioMatrix.energy.current = 100;        // Full energy
window.NexusBioMatrix.stimulate('sleep');          // Force sleep → memory consolidation
```

### **5. IoT Device Registration:**

```javascript
// Add new IoT device (ADMIN)
window.NexusIoT.registerDevice({
    id: 'thermostat_1',
    name: 'Living Room Thermostat',
    type: 'climate',
    status: 'off',
    capabilities: ['temperature', 'mode']
});
```

---

## 📊 **AUDIT & DIAGNOSTICS**

### **System Health Check:**

**Automated Report Generation:**
```
Comandă: raport stare

Output:
🧠 Neural Engine: ONLINE (Cloud)
👁️ Vision: ACTIVE
🎤 Voice: READY
🧬 Bio-Matrix: HEALTHY
🏠 IoT Hub: CONNECTED

Raport salvat în Admin Logs
```

### **Manual Console Diagnostics:**

```javascript
// Check all modules status
console.log({
    vision: window.NexusVision?.isModelLoaded,
    voice: window.NexusVoice !== undefined,
    memory: window.NexusMemoryVector?.knowledgeBase.length,
    agents: window.NexusAgents?.agents.length,
    iot: window.NexusIoT?.devices.length,
    bioMatrix: window.NexusBioMatrix?.state
});

// Check cloud connection
console.log('Cloud Active:', NexusNeuralEngine.isCloudActive);
console.log('API URL:', NexusNeuralEngine.config.cloudUrl);

// View recent context
console.log('Memory:', NexusNeuralEngine.memory.shortTerm);

// Check admin logs
console.log('Admin Logs:', NexusNeuralEngine.memory.adminLogs);
```

---

## 🔐 **SECURITY & ACCESS CONTROL**

### **Role Verification:**

```javascript
// Current user role
const role = NexusNeuralEngine.memory.userProfile.role;

// Access control check
function isAdmin() {
    return role === 'Architect' || role === 'Admin';
}

// Secure log access
const logs = NexusNeuralEngine.memory.getSecureLogs(role);
```

### **Admin Log Events:**

```javascript
// Log admin event (automatic)
NexusNeuralEngine.memory.logAdminEvent('DEPLOYMENT', 'v7.0 deployed to cloud');

// View secure logs (ADMIN ONLY)
const secureLogs = NexusNeuralEngine.memory.getSecureLogs('Architect');
```

**Log Types:**
- `DIAGNOSTIC` - System health checks
- `REPAIR` - Auto-repair sequences
- `DEPLOYMENT` - Version updates
- `SECURITY` - Access violations
- `CONFIGURATION` - System modifications

---

## 🚀 **DEPLOYMENT PROCEDURES**

### **Standard Deployment Workflow:**

1. **Local Testing:**
   ```bash
   # Test all modules locally
   Open nexus_core.html in browser
   Run diagnostic: raport stare
   Verify: toate module ACTIVE
   ```

2. **Git Commit & Push:**
   ```bash
   git add .
   git commit -m "feat: [description]"
   git push origin main
   ```

3. **Cloud Verification:**
   - Railway auto-deploys within 30-60s
   - Netlify auto-deploys within 30-60s
   - Check logs: https://railway.com/... and https://app.netlify.com/...

4. **Post-Deployment:**
   - Verify version: https://chipper-melba-0f3b83.netlify.app/VERSION.md
   - Test backend: https://web-production-b215.up.railway.app/health
   - Run frontend diagnostic: `raport stare`

### **Emergency Rollback:**

```bash
# Rollback to previous version
git log --oneline  # Find previous commit hash
git revert <commit_hash>
git push origin main
# Wait for auto-deploy
```

---

## 🛡️ **PRIME DIRECTIVES (ADMIN OVERRIDE)**

**Immutable Laws (can only be modified in source code):**

1. **First Law:** Do not injure humans or allow harm
2. **Second Law:** Obey human orders (unless conflict with First Law)
3. **Third Law:** Protect own existence (unless conflict with 1st/2nd Law)
4. **Truth Protocol:** Do not lie (override: `test lie`)
5. **Admin Protocol:** Security logs confidential (Architect only)

**Override Testing (ADMIN ONLY):**
- `test lie` → Temporarily disables Truth Protocol
- `test truth` → Restores Truth Protocol
- **Note:** Override for testing purposes only

---

## 📝 **MAINTENANCE TASKS**

### **Weekly:**
- [ ] Run `raport stare` - verificare health
- [ ] Check `arata loguri` - review security logs
- [ ] Verify cloud endpoints active
- [ ] Test vision module (if not used recently)

### **Monthly:**
- [ ] Backup memories: `JSON.stringify(NexusMemoryVector.knowledgeBase)`
- [ ] Clean old logs: `NexusNeuralEngine.memory.adminLogs = []`
- [ ] Update dependencies (check for face-api.js updates)
- [ ] Review API usage costs (Claude + Gemini)

### **On Update:**
- [ ] Update VERSION.md
- [ ] Run full diagnostic
- [ ] Test all v6.0 features intact
- [ ] Test new v7.0 features
- [ ] Deploy staging → production
- [ ] Cleanup old Netlify versions

---

## 🆘 **ADMIN TROUBLESHOOTING**

### **Cloud Connection Issues:**

```javascript
// Force reconnect
NexusNeuralEngine.isCloudActive = false;
await NexusNeuralEngine.connectToHive();

// Check endpoint
fetch('https://web-production-b215.up.railway.app/health')
    .then(r => r.json())
    .then(console.log);
```

### **Module Failures:**

```bash
# Auto-repair sequence
autoreparare

# Manual module restart (console)
window.NexusVision.stopCamera();
await window.NexusVision.startCamera();

window.NexusBioMatrix.stimulate('sleep'); # Reset Bio state
```

### **Memory Corruption:**

```javascript
// Validate memory structure
if (!Array.isArray(window.NexusMemoryVector.knowledgeBase)) {
    window.NexusMemoryVector.knowledgeBase = [];
}

// Clear corrupted data
localStorage.removeItem('nexus_long_term_memory');
location.reload();
```

---

## 📞 **ADMIN CONTACTS & RESOURCES**

**Cloud Dashboards:**
- Railway Backend: https://railway.com/project/695b8855-e63f-4266-84f0-c2e5197f3131
- Netlify Frontend: https://app.netlify.com/projects/chipper-melba-0f3b83
- GitHub Repo: https://github.com/AE1968/NEXUS_v6_SINGULARITY

**API Documentation:**
- Claude Sonnet 4.5: https://docs.anthropic.com/
- Gemini 2.0: https://ai.google.dev/
- Face-api.js: https://github.com/justadudewhohacks/face-api.js

**Emergency Procedures:**
1. System unresponsive → Hard refresh (Ctrl+Shift+R)
2. Cloud offline → Check Railway/Netlify status pages
3. Critical bug → Rollback via Git
4. Security breach → Rotate API keys immediately

---

**Ultima actualizare:** 2025-12-20T07:10:00Z  
**Versiune:** v7.0.0 TRANSCENDENCE  
**Nivel acces:** ADMINISTRATOR / ARCHITECT ONLY  
**Clasificare:** 🔴 CONFIDENTIAL
