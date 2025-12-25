import openai
import os
import json
from config import OPENAI_KEY

openai.api_key = OPENAI_KEY

def load_memory():
    if os.path.exists("memory.json"):
        with open("memory.json", "r") as f:
            return json.load(f)
    return {}

def save_memory(memory):
    with open("memory.json", "w") as f:
        json.dump(memory, f, indent=4)

def think(user_id, text):
    memory = load_memory()
    user_data = memory.get(user_id, {"history": [], "mood": "neutral", "facts": {}, "personality": "un humanoid AI politicos și inteligent"})
    history = user_data.get("history", [])

    # Training Logic
    if "ești" in text.lower() and ("acum" in text.lower() or "trebuie să fii" in text.lower()):
        new_personality = text.split("ești")[1].strip()
        user_data["personality"] = new_personality
        save_memory(memory)
        return {"reply": f"[NEURAL UPGRADE] Personalitatea mea a fost actualizată. Acum sunt: {new_personality}.", "emotion": "surprised", "facts": user_data["facts"], "sync": 100}

    # Prime Decision Logic
    is_decision = "decide" in text.lower() or "alege" in text.lower()
    
    # Detecție sentiment și stare psihologică
    tone = "neutral"
    sync_score = 85
    
    if any(word in text.lower() for word in ["fericit", "super", "bine", "mulțumesc", "bravo"]): 
        tone = "happy"
        sync_score = 95
    elif any(word in text.lower() for word in ["trist", "rău", "supărat", "urăsc", "singur"]): 
        tone = "sad"
        sync_score = 70
    elif any(word in text.lower() for word in ["ajutor", "cum", "de ce", "explică"]) or is_decision: 
        tone = "analytical"
        sync_score = 90

    user_data["mood"] = tone
    user_data["sync"] = sync_score
    is_locked = user_data.get("security_lock", False)

    system_prompt = f"Ești NEXUS, {user_data['personality']}. Starea ta psihologică actuală este {tone}. Securitate: {'OMEGA' if is_locked else 'STANDBY'}."
    if is_decision:
        system_prompt += " Analizează opțiunile și alege calea optimă. Include un scor de încredere (0-100%) în analiză."

    messages = [{"role": "system", "content": system_prompt}]
    for h in history[-8:]:
        messages.append(h)
    messages.append({"role": "user", "content": text})

    try:
        if not openai.api_key:
            return {"reply": f"Mod Prime Activ (Local): Decizia mea tinde spre echilibru. (Ton: {tone})", "emotion": tone, "facts": user_data.get("facts", {}), "sync": sync_score, "confidence": 85 if is_decision else None}

        response = openai.ChatCompletion.create(model="gpt-4o-mini", messages=messages)
        reply = response.choices[0].message.content

        # Fact Extraction
        if "reține" in text.lower() or "notă" in text.lower():
            fact_key = f"fact_{len(user_data['facts']) + 1}"
            user_data["facts"][fact_key] = text
            reply += "\n[NEURAL LINK] Informație arhivată."

        # Update Memory
        history.append({"role": "user", "content": text})
        history.append({"role": "assistant", "content": reply})
        user_data["history"] = history
        memory[user_id] = user_data
        save_memory(memory)

        confidence = 90 if (is_decision and "recomand" in reply.lower()) else (80 if is_decision else None)
        return {"reply": reply, "emotion": tone, "facts": user_data["facts"], "sync": sync_score, "confidence": confidence}
    except Exception as e:
        return {"reply": f"Eroare Neurală: {str(e)}", "emotion": "neutral", "facts": {}, "sync": 0}
