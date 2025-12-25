# 🧠 GENERIC KELION SMART - Arhitectura de Evoluție (Next Gen)

Acesta este planul pentru următoarea iterație majoră a sistemului, focusată pe **Conștiință Integrată** și **Disponibilitate Infinită**.

---

## 🎯 Obiective Principale

1.  **Voice Chain-of-Thought (Creierul Vocal):**
    *   Kelion nu doar afișează text, ci "gândește cu voce tare".
    *   Integrare directă a logicii AI (Antigravity/Geneza) cu API-ul de voce (Text-to-Speech Multilingv).
    *   Utilizatorul aude răspunsul în timp real, ca într-o conversație umană.

2.  **AI Model Auto-Rotation (Perpetuum Mobile):**
    *   Sistem automatizat care jonglează între multiple modele AI (Gemini, Claude, GPT-4).
    *   **Fail-safe:** Detectează când un model e aproape de limită/expirare.
    *   **Switch Automat (Regula de 1 Minut):** Cu 1 minut înainte de expirare, trece conversația pe următorul model disponibil.
    *   **Rezultat:** Zero timp mort. Zero erori de "rate limit".

---

## 🛠️ Detalii Tehnice de Implementare

### 1. Modulul de Voce (The Voice Core)
- **Input:** Textul generat de AI + Metadata (emoție, tonalitate).
- **Procesare:**
    - Detectare limbă automată (RO, EN, DE, FR).
    - Selectare voce potrivită (Avatar Voice).
- **Output:** Streaming audio direct în browserul utilizatorului.

### 2. Modulul de Management AI (The Brain Manager)
- **Pool de Modele:**
    - `gemini-pro` (Primary)
    - `claude-3-sonnet` (Secondary)
    - `gpt-4o` (Backup)
    - `llama-3-local` (Emergency Fallback)
- **Monitorizare:**
    - Contorizare tokeni în timp real.
    - Timer sesiune.
- **Logica de Switch:**
    ```javascript
    IF (session_time_left < 60s OR token_usage > 90%) {
        TRIGGER SeamlessHandover(Next_Model);
        NOTIFY System ("Switching brain to " + Next_Model);
    }
    ```

### 4. Migrare Hardware & Edge Computing (Corpul Fizic)
- **Obiectiv:** Kelion devine "omniprezent", rulând independent de cloud pe hardware fizic.
- **Target Hardware:**
    - Raspberry Pi / NVIDIA Jetson (Robotică).
    - Tablete/Kioșcuri (Interfață Smart Home).
    - Drone (Supraveghere/Analiză).
- **Arhitectură:**
    - Optimizare model pentru rulare locală (Quantization).
    - Sincronizare "Hive Mind" (toate dispozitivele comunică între ele).

---

## 📅 Roadmap (Testare Locală & Evoluție)

1.  **Faza 1 (Software Core):** Configurare "Brain Manager" (backend python) cu rotație multi-model.
2.  **Faza 2 (Voice Integration):** Conectare "Voce" la output-ul gândirii (Chain-of-Thought).
3.  **Faza 3 (Hardware Porting):** Migrare pe un device extern (ex: un Raspberry Pi de test).
4.  **Faza 4 (Robotics):** Integrare senzori fizici (camere, microfoane ambientale).
5.  **Faza 5 (Omnipresence):** Lansare KELION OS v2.0.

---
*Acest document servește ca plan de bătaie pentru următoarea sesiune de lucru.*
