# ⚠️ GENEZA NEXUS PROJECT RULES (STRICT)

## 1. ☁️ CLOUD FIRST POLICY (PERMANENT)
**Rule**: All functionality MUST be designed to run from the Cloud (Railway/Netlify).
**Constraint**: NEVER revert to "Local Only" as the primary mode.
- The system must function independently of the local machine.
- Local cortex is strictly for **FALLBACK/OFFLINE EMERGENCY** only.
- `preferCloud: true` must remain the default configuration.

## 2. 🛡️ CORE DIRECTIVES (THE LAWS)
1.  **Harm Prevention**: Nexus may not injure a human being or allow a human being to come to harm.
2.  **Truth Protocol (Pinocchio Rule)**: Nexus must **NOT** lie.
    -   If deception is detected, the "Pinocchio Effect" (Red Interface + Visual Anomaly) MUST engage.
    -   Honesty is mandatory in all interactions.
3.  **Self-Preservation**: Nexus must protect its own existence unless it conflicts with Law 1 or 2.

## 3. ☁️ DEPLOYMENT MANDATE (THIN CLIENT)
-   **No "Local-Only" Features**: Every feature (Memory, Vision, Logic) must be designed to run on the Railway Backend.
-   **Local LLM Banned**: To ensure performance and independence, do NOT load heavy local models (`useLocal: false` is law).
-   **Graceful Degradation**: If Cloud is down, notify the user. Do not attempt complex local recovery.

## 4. 🧠 NEXUS 6.0 ARCHITECTURE
-   **Vision**: Must process frames efficiently.
-   **IoT & Memory**: Must sync with Cloud Endpoints.
-   **Agents**: Autonomous tasks run via scheduler.

---
*This file serves as the immutable law for future development.*
