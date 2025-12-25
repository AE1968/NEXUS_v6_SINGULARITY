/**
 * 🧠 NEXUS NEURAL MEMORY
 * Modul pentru învățare persistentă și stocarea informațiilor utilizatorului.
 * Permite asocieri de tipul: "Concept" -> "Informație".
 */

const NexusMemory = {
    storageKey: 'nexus_neural_data_v1',
    memoryBank: {},

    init: function () {
        this.loadMemory();
        console.log(`🧠 Nexus Memory Loaded: ${Object.keys(this.memoryBank).length} concepts stored.`);
    },

    loadMemory: function () {
        const data = localStorage.getItem(this.storageKey);
        if (data) {
            try {
                this.memoryBank = JSON.parse(data);
            } catch (e) {
                console.error('Memory corruption detected. Resetting neural banks.');
                this.memoryBank = {};
            }
        }
    },

    saveMemory: function () {
        localStorage.setItem(this.storageKey, JSON.stringify(this.memoryBank));
    },

    learn: function (concept, detail) {
        // Normalizare text
        const key = concept.toLowerCase().trim();
        const value = detail.trim();

        // Stocare
        this.memoryBank[key] = {
            value: value,
            timestamp: new Date().toISOString(),
            confidence: 1.0
        };

        this.saveMemory();

        // Feedback
        const responses = [
            `Am memorat: "${key}" este "${value}".`,
            `Informație salvată în Neural Core: ${key}.`,
            `Am notat asta despre ${key}.`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    },

    recall: function (query) {
        // Căutare fuzzy simplă
        const normalizedQuery = query.toLowerCase().trim();

        // 1. Căutare exactă
        if (this.memoryBank[normalizedQuery]) {
            return this.formatRecall(normalizedQuery, this.memoryBank[normalizedQuery].value);
        }

        // 2. Căutare parțială (dacă query-ul e conținut în cheie sau invers)
        const matches = Object.keys(this.memoryBank).filter(k => k.includes(normalizedQuery) || normalizedQuery.includes(k));

        if (matches.length > 0) {
            // Returnează cel mai bun match
            const bestMatch = matches[0]; // Simplificat
            return this.formatRecall(bestMatch, this.memoryBank[bestMatch].value);
        }

        return null; // Nu știu
    },

    formatRecall: function (key, value) {
        const responses = [
            `Din câte îmi amintesc, ${key} este ${value}.`,
            `Memoria mea indică faptul că ${key} este ${value}.`,
            `Iată ce știu despre ${key}: ${value}.`
        ];
        return responses[Math.floor(Math.random() * responses.length)];
    },

    forget: function (concept) {
        const key = concept.toLowerCase().trim();
        if (this.memoryBank[key]) {
            delete this.memoryBank[key];
            this.saveMemory();
            return `Am șters informațiile despre "${key}" din memorie.`;
        }
        return `Nu am găsit nicio informație despre "${key}" pentru a o șterge.`;
    },

    listAll: function () {
        const keys = Object.keys(this.memoryBank);
        if (keys.length === 0) return "Memoria mea este momentan goală.";
        return "Am informații stocate despre: " + keys.join(', ');
    },

    // Procesare limbaj natural pentru intenții de memorie
    processInput: function (text) {
        const lower = text.toLowerCase();

        // PATTERN: MEMORARE ("Reține că X este Y", "Ține minte X e Y")
        // Regex simplificat pentru a prinde structura "X... Y"
        if (lower.includes('reține că') || lower.includes('ține minte că') || lower.includes('memorează că')) {
            // Încercăm să spargem fraza
            let parts = null;
            if (lower.includes(' este ')) parts = lower.split(' este ');
            else if (lower.includes(' e ')) parts = lower.split(' e ');

            if (parts && parts.length >= 2) {
                // Curățăm partea stângă de trigger words
                let key = parts[0]
                    .replace('reține că', '')
                    .replace('ține minte că', '')
                    .replace('memorează că', '')
                    .replace('nexus', '')
                    .trim();

                let value = parts[1].trim();

                if (key && value) {
                    return this.learn(key, value);
                }
            }
        }

        // PATTERN: INTEROGARE ("Ce știi despre X", "Care e X-ul")
        if (lower.includes('ce știi despre') || lower.includes('care e') || lower.includes('care este')) {
            let key = lower
                .replace('ce știi despre', '')
                .replace('care este', '')
                .replace('care e', '')
                .replace('nexus', '')
                .replace('?', '')
                .trim();

            if (key) {
                const answer = this.recall(key);
                if (answer) return answer;
                // Dacă nu găsim, lăsăm brain-ul normal să răspundă (poate e o întrebare generală)
            }
        }

        // PATTERN: LISTARE
        if (lower.includes('ce ai memorat') || lower.includes('ce ți minte') || lower.includes('memoria ta')) {
            return this.listAll();
        }

        return null; // Nu e o comandă de memorie
    }
};

window.NexusMemory = NexusMemory;
window.addEventListener('load', () => NexusMemory.init());
