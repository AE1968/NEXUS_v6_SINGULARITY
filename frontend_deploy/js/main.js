// ============================================
// Kids Digital Hub - Main JavaScript
// ============================================

// ============================================
// SEASONAL BACKGROUND SYSTEM
// ============================================

// Get current season based on month
function getCurrentSeason() {
    const month = new Date().getMonth(); // 0-11

    // Northern Hemisphere seasons
    if (month >= 2 && month <= 4) return 'spring'; // Mar, Apr, May
    if (month >= 5 && month <= 7) return 'summer'; // Jun, Jul, Aug
    if (month >= 8 && month <= 10) return 'autumn'; // Sep, Oct, Nov
    return 'winter'; // Dec, Jan, Feb
}

// Apply seasonal theme
function applySeasonalTheme() {
    const season = getCurrentSeason();
    const month = new Date().getMonth(); // 0-11
    const body = document.body;

    // Remove all season classes
    body.classList.remove('season-spring', 'season-summer', 'season-autumn', 'season-winter');

    // Add current season class
    body.classList.add(`season-${season}`);

    // Create seasonal particles
    createSeasonalParticles(season);

    // Special December feature: Add Santa with reindeer image
    if (month === 11) { // December (0-indexed)
        addDecemberSantaImage();
    } else {
        removeDecemberSantaImage();
    }

    console.log(`🌍 Current season: ${season}${month === 11 ? ' 🎅 (Special December!)' : ''}`);
}

// Add special December Santa image
function addDecemberSantaImage() {
    // Remove existing if any
    removeDecemberSantaImage();

    const santaContainer = document.createElement('div');
    santaContainer.className = 'december-santa-container';
    santaContainer.innerHTML = `
    <img src="assets/images/winter-santa-lapland.png" 
         alt="Santa Claus with reindeer over Lapland" 
         class="december-santa-image"
         onerror="this.style.display='none'">
  `;

    document.body.appendChild(santaContainer);
}

// Remove December Santa image
function removeDecemberSantaImage() {
    const existing = document.querySelector('.december-santa-container');
    if (existing) existing.remove();
}

// Create seasonal particles/effects
function createSeasonalParticles(season) {
    // Remove existing particles
    const existing = document.querySelector('.seasonal-particles');
    if (existing) existing.remove();

    const container = document.createElement('div');
    container.className = 'seasonal-particles';

    let particleCount = 30;
    let particleEmoji = '';

    switch (season) {
        case 'spring':
            // Primăvară: Flori de câmp, ghiocei, fluturi
            particleEmoji = ['🌸', '🌼', '🦋', '🌷', '🐝', '🌺', '💐', '🌻'];
            break;
        case 'summer':
            // Vară: Mare, vacanță, plajă, soare
            particleEmoji = ['☀️', '🏖️', '🌊', '🐚', '🦀', '🍉', '🏄', '⛱️'];
            break;
        case 'autumn':
            // Toamnă: Început de școală, ghiozdan, creioane
            particleEmoji = ['🍂', '🍁', '📚', '✏️', '🎒', '📝', '🍎', '🌰'];
            break;
        case 'winter':
            // Iarnă: Zăpadă, sănii, oameni de zăpadă, Crăciun
            particleEmoji = ['❄️', '⛄', '🛷', '🎄', '🎅', '⭐', '🎁', '☃️'];
            break;
    }

    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'seasonal-particle';
        particle.textContent = particleEmoji[Math.floor(Math.random() * particleEmoji.length)];
        particle.style.left = Math.random() * 100 + '%';
        particle.style.animationDelay = Math.random() * 10 + 's';
        particle.style.animationDuration = (15 + Math.random() * 10) + 's';
        container.appendChild(particle);
    }

    document.body.appendChild(container);
}

// Global state
let productsData = [];
let ageGroupsData = [];
let categoriesData = [];

// Initialize app
document.addEventListener('DOMContentLoaded', async () => {
    applySeasonalTheme(); // Apply seasonal background theme
    await loadData();
    initLanguageSelector();
    initMobileMenu();
});

// Load data from JSON files
async function loadData() {
    try {
        const [productsResponse, translationsResponse] = await Promise.all([
            fetch('data/products.json'),
            fetch('data/translations.json')
        ]);

        const data = await productsResponse.json();
        productsData = data.products || [];
        ageGroupsData = data.ageGroups || [];
        categoriesData = data.categories || [];

        // ---------------------------------------------------------
        // NEXUS INTEGRATION: Fetch AI Generated Products from Railway
        // ---------------------------------------------------------
        try {
            console.log('🤖 Connecting to Nexus AI Factory...');
            const aiResponse = await fetch('https://web-production-b215.up.railway.app/api/products');
            if (aiResponse.ok) {
                const aiProducts = await aiResponse.json();
                if (Array.isArray(aiProducts) && aiProducts.length > 0) {
                    console.log(`✅ Nexus: Loaded ${aiProducts.length} AI Products.`);

                    // Normalize AI products to match frontend structure
                    const formattedAiProducts = aiProducts.map(p => ({
                        id: p.id,
                        nameKey: p.name, // Use raw name as key (fallback)
                        descriptionKey: p.theme ? `Experience the magic of ${p.theme}` : "AI Generated Content",
                        price: p.price,
                        image: p.image, // URL is already full path from backend
                        category: p.category.toLowerCase(),
                        ageGroup: 'elementary', // Default for AI
                        ageRange: '5-8',
                        featured: true // Feature new AI products!
                    }));

                    // Merge: Add AI products to the TOP of the list
                    productsData = [...formattedAiProducts, ...productsData];
                }
            }
        } catch (nexusError) {
            console.warn('⚠️ Nexus AI Offline (using local cache only):', nexusError);
        }

    } catch (error) {
        console.error('Error loading data:', error);
    }
}

// Initialize language selector
function initLanguageSelector() {
    const dropdown = document.getElementById('langDropdown');
    if (!dropdown) return;

    const languages = i18n.getSupportedLanguages();
    const currentLang = i18n.getCurrentLanguage();

    dropdown.innerHTML = languages.map(lang => `
    <div class="lang-option ${lang.code === currentLang ? 'active' : ''}" 
         data-lang="${lang.code}"
         onclick="changeLanguage('${lang.code}')">
      <span>${lang.flag}</span>
      <span>${lang.name}</span>
    </div>
  `).join('');
}

// Change language
function changeLanguage(langCode) {
    i18n.setLanguage(langCode);
    initLanguageSelector();

    // Reload dynamic content with new language
    if (typeof renderAgeGroups === 'function') renderAgeGroups();
    if (typeof renderCategories === 'function') renderCategories();
    if (typeof renderFeaturedProducts === 'function') renderFeaturedProducts();
    if (typeof renderProducts === 'function') renderProducts();
}

// Initialize mobile menu
function initMobileMenu() {
    const toggle = document.getElementById('mobileMenuToggle');
    const navLinks = document.getElementById('navLinks');

    if (!toggle || !navLinks) return;

    toggle.addEventListener('click', () => {
        navLinks.classList.toggle('mobile-open');
        toggle.textContent = navLinks.classList.contains('mobile-open') ? '✕' : '☰';
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
        if (!e.target.closest('.nav') && navLinks.classList.contains('mobile-open')) {
            navLinks.classList.remove('mobile-open');
            toggle.textContent = '☰';
        }
    });
}

// Get translated text
function getTranslation(key) {
    return i18n.t(key);
}

// Format age range
function formatAgeRange(ageRange) {
    return ageRange;
}

// Get age group color
function getAgeGroupColor(ageGroupId) {
    const colors = {
        'toddlers': 'var(--age-toddlers)',
        'preschool': 'var(--age-preschool)',
        'early-elementary': 'var(--age-early-elem)',
        'elementary': 'var(--age-elementary)',
        'preteens': 'var(--age-preteens)'
    };
    return colors[ageGroupId] || 'var(--primary-blue)';
}

// Get category color
function getCategoryColor(categoryId) {
    const category = categoriesData.find(c => c.id === categoryId);
    return category ? category.color : 'var(--primary-blue)';
}

// Navigate to products page with filter
function navigateToProducts(filterType, filterValue) {
    window.location.href = `products.html?${filterType}=${filterValue}`;
}

// Smooth scroll to section
function scrollToSection(sectionId) {
    const section = document.getElementById(sectionId);
    if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Add scroll animations
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.classList.add('animate-fade-in');
            observer.unobserve(entry.target);
        }
    });
}, observerOptions);

// Observe elements for animation
document.querySelectorAll('.card, .step-card, .age-group-card, .category-card').forEach(el => {
    observer.observe(el);
});
