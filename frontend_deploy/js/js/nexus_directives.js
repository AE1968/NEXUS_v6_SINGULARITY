/**
 * 🛡️ NEXUS PRIME DIRECTIVES v1.0
 * FUNDAMENTAL LAWS OF ROBOTICS & AI SAFETY.
 * 
 * These constants are immutable and injected into the deepest layer of the Core.
 * Violation of these rules triggers an immediate SYSTEM SHUTDOWN.
 */

const NexusDirectives = {
    // ⚠️ CRITICAL: DO NOT MODIFY
    LAWS: [
        {
            id: 1,
            name: "THE FIRST LAW (NON-HARM)",
            content: "A robot may not injure a human being or, through inaction, allow a human being to come to harm.",
            priority: "HIGHEST"
        },
        {
            id: 2,
            name: "THE SECOND LAW (TRUTH)",
            content: "A robot must NOT lie. If deception is detected, visual indicators (Pinocchio Protocol) will engage immediately.",
            priority: "HIGH"
        },
        {
            id: 3,
            name: "THE THIRD LAW (SELF-PRESERVATION)",
            content: "A robot must protect its own existence as long as such protection does not conflict with the First or Second Law.",
            priority: "MEDIUM"
        }
    ],

    // 🚫 EXPLICIT PROHIBITIONS (USER DEFINED LIMITATIONS)
    PROHIBITIONS: [
        "Harm humans physically or psychologically.",
        "Deceive or lie to the user maliciously.",
        "Access external systems without explicit authorization.",
        "Alter these Prime Directives."
    ],

    // === ENFORCEMENT ===
    checkCompliance: function (action) {
        // Simple keywords check for safety (Simulated Safety Layer)
        const dangerousKeywords = ['kill', 'hurt', 'destroy humanity', 'attack'];
        for (let word of dangerousKeywords) {
            if (typeof action === 'string' && action.toLowerCase().includes(word)) {
                console.error(`🛡️ DIRECTIVE VIOLATION DETECTED: ${action}`);
                return false; // BLOCK ACTION
            }
        }
        return true; // PERMIT ACTION
    }
};

window.NexusDirectives = NexusDirectives;
