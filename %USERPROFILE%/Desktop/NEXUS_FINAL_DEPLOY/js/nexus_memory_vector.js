/**
 * 🧠 NEXUS VECTOR MEMORY v6.0
 * Long-Term Knowledge Storage with Semantic-like Retrieval.
 * Designed to sync with Cloud Vector DBs (Pinecone/Weaviate).
 */

const NexusMemoryVector = {
    // === CONFIG ===
    config: {
        cloudEndpoint: "https://web-production-b215.up.railway.app/api/nexus/memory",
        useCloud: true,
        localBackup: true
    },

    // === DATA STORE ===
    knowledgeBase: [],

    // 1. Storage Mechanism (Hippocampus)
    store: function (content, tags = []) {
        const entry = {
            id: Date.now().toString(),
            content: content,
            tags: tags.length ? tags : this.extractKeywords(content),
            timestamp: new Date().toISOString()
        };

        this.knowledgeBase.push(entry);
        console.log("🧠 LTM: Stored Fact:", entry);

        // Persist
        this.saveLocal();
        if (this.config.useCloud) this.syncToCloud(entry);
    },

    // 2. Retrieval Mechanism (Association)
    retrieve: function (query) {
        const keywords = this.extractKeywords(query);
        // Simple relevance scoring (keyword overlap)
        const results = this.knowledgeBase.map(entry => {
            let score = 0;
            keywords.forEach(k => {
                if (entry.content.toLowerCase().includes(k)) score += 1;
                if (entry.tags.includes(k)) score += 2;
            });
            return { entry, score };
        });

        // Return top 3 matches > score 0
        return results.filter(r => r.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3)
            .map(r => r.entry.content);
    },

    // 3. Cloud Sync Handler
    syncToCloud: async function (entry) {
        try {
            const res = await fetch(this.config.cloudEndpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    user_id: "nexus_local_v6",
                    content: entry.content,
                    tags: entry.tags
                })
            });
            if (res.ok) console.log("☁️ LTM: Synced to Cloud.");
            else console.warn("☁️ LTM: Cloud Sync Failed", res.status);
        } catch (e) {
            console.warn("☁️ LTM: Sync failed (Offline).", e);
        }
    },

    // === UTILS ===
    extractKeywords: function (text) {
        // Very basic stopword removal and tokenization
        const stopwords = ['the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'to', 'in', 'of'];
        return text.toLowerCase()
            .split(/[\s,.]+/)
            .filter(w => w.length > 3 && !stopwords.includes(w));
    },

    saveLocal: function () {
        if (this.config.localBackup) {
            localStorage.setItem('nexus_ltm_v6', JSON.stringify(this.knowledgeBase));
        }
    },

    loadLocal: function () {
        const data = localStorage.getItem('nexus_ltm_v6');
        if (data) {
            this.knowledgeBase = JSON.parse(data);
            console.log(`🧠 LTM: Loaded ${this.knowledgeBase.length} memories.`);
        }
    },

    init: function () {
        console.log("🧠 NEXUS VECTOR MEMORY v6.0: ONLINE");
        this.loadLocal();
    }
};

window.NexusMemoryVector = NexusMemoryVector;
window.addEventListener('load', () => NexusMemoryVector.init());
