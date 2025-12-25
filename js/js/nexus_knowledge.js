/**
 * 📚 NEXUS KNOWLEDGE BASE
 * Modul cognitiv conectat la Wikipedia API și motor matematic.
 * Transformă Nexus într-o enciclopedie activă.
 */

const NexusKnowledge = {
    wikiApiUrl: 'https://ro.wikipedia.org/api/rest_v1/page/summary/',

    init: function () {
        console.log('📚 Nexus Knowledge Base: ONLINE');
    },

    processRequest: async function (text) {
        const lower = text.toLowerCase();

        // 1. MATH CHECK
        if (lower.startsWith('calculează') || lower.startsWith('cât fac') || lower.startsWith('socotește')) {
            const expression = text.replace(/calculează|cât fac|socotește/yi, '').trim();
            const result = this.calculate(expression);
            if (result !== null) {
                return `Rezultatul este: ${result}`;
            }
        }

        // 2. WIKI KNOWLEDGE CHECK
        // Trigger words: "Cine este", "Ce este", "Definește", "Povestește-mi despre"
        if (lower.startsWith('cine este') || lower.startsWith('ce este') || lower.startsWith('cine e') || lower.startsWith('ce e') || lower.startsWith('definește')) {
            const query = text
                .replace(/cine este|ce este|cine e|ce e|definește|povestește-mi despre/yi, '')
                .replace('?', '')
                .trim();

            if (query.length > 1) {
                return await this.searchWikipedia(query);
            }
        }

        return null; // Not a knowledge request
    },

    calculate: function (expr) {
        // Simple safe eval
        // Inlocuim cuvinte cu operatori
        let cleanExpr = expr.toLowerCase()
            .replace(/plus/g, '+')
            .replace(/minus/g, '-')
            .replace(/ori/g, '*')
            .replace(/împărțit la/g, '/')
            .replace(/x/g, '*')
            .replace(/radacină din/g, 'Math.sqrt(')
            .replace(/patratul lui/g, 'Math.pow(');

        // Curățăm caractere non-matematice (exceptie paranteze si punct)
        cleanExpr = cleanExpr.replace(/[^0-9+\-*/().Mathsqrtpow, ]/g, '');

        try {
            // Folosim Function constructor pt un mini-sandbox, e mai sigur decat eval direct, dar tot riskant. 
            // Fiind client-side si math only, e acceptabil.
            const result = new Function('return ' + cleanExpr)();

            // Formatare
            if (!isNaN(result)) {
                return Math.round(result * 100) / 100; // 2 zecimale
            }
        } catch (e) {
            console.warn('Math error:', e);
        }
        return null;
    },

    searchWikipedia: async function (query) {
        // Formatare pentru URL (Title Case aproximativ)
        // Wiki cere underscore in loc de spatiu
        const formattedQuery = query.split(' ')
            .map(w => w.charAt(0).toUpperCase() + w.slice(1))
            .join('_');

        try {
            const resp = await fetch(this.wikiApiUrl + formattedQuery);
            if (resp.status === 404) {
                // Try searching? Summary API needs exact title. 
                // Fallback: we could implement a search API call, but for now we report miss.
                return `Nu am găsit o definiție exactă pentru "${query}" în baza de date globală.`;
            }

            const data = await resp.json();

            if (data.type === 'disambiguation') {
                return `Termenul "${query}" este ambiguu. Te referi la o persoană, un loc sau un concept?`;
            }

            if (data.extract) {
                // Returnăm primele 2-3 fraze
                const summary = data.extract.split('.').slice(0, 3).join('.') + '.';
                return `Conform Wikipedia: ${summary}`;
            }

        } catch (e) {
            console.error('Wiki Error:', e);
            return "Nu pot accesa arhiva de cunoștințe momentan.";
        }
    },
};

window.NexusKnowledge = NexusKnowledge;
window.addEventListener('load', () => NexusKnowledge.init());
