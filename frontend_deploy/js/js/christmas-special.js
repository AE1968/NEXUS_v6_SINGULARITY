// ============================================
// CHRISTMAS SPECIAL - AUTOMATIC PROMOTION
// Active: December 24-25 (00:00 - 23:59:59)
// ============================================

// Configuration
const PROMOTION_CONFIG = {
    startDate: { month: 11, day: 24 }, // December 24 (month is 0-indexed)
    endDate: { month: 11, day: 25, hour: 23, minute: 59, second: 59 }, // December 25, 23:59:59
    maxSelections: 2,
    storageKey: 'christmas_gifts_2024'
};

// Global state
let selectedProducts = [];
let allProducts = [];

// ============================================
// INITIALIZATION
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
    // Check if promotion is active
    if (!isPromotionActive()) {
        showPromotionClosed();
        return;
    }

    // Load products
    await loadProducts();

    // Render products
    renderProducts();

    // Start countdown
    startCountdown();

    // Setup event listeners
    setupEventListeners();

    // Check if user already downloaded
    checkPreviousDownload();
});

// ============================================
// PROMOTION TIMING
// ============================================

function isPromotionActive() {
    const now = new Date();
    const currentYear = now.getFullYear();

    // Create start and end dates for current year
    const startDate = new Date(currentYear, PROMOTION_CONFIG.startDate.month, PROMOTION_CONFIG.startDate.day, 0, 0, 0);
    const endDate = new Date(
        currentYear,
        PROMOTION_CONFIG.endDate.month,
        PROMOTION_CONFIG.endDate.day,
        PROMOTION_CONFIG.endDate.hour,
        PROMOTION_CONFIG.endDate.minute,
        PROMOTION_CONFIG.endDate.second
    );

    return now >= startDate && now <= endDate;
}

function getPromotionEndDate() {
    const now = new Date();
    const currentYear = now.getFullYear();

    return new Date(
        currentYear,
        PROMOTION_CONFIG.endDate.month,
        PROMOTION_CONFIG.endDate.day,
        PROMOTION_CONFIG.endDate.hour,
        PROMOTION_CONFIG.endDate.minute,
        PROMOTION_CONFIG.endDate.second
    );
}

// ============================================
// COUNTDOWN TIMER
// ============================================

function startCountdown() {
    updateCountdown(); // Initial update
    setInterval(updateCountdown, 1000); // Update every second
}

function updateCountdown() {
    const now = new Date();
    const endDate = getPromotionEndDate();
    const diff = endDate - now;

    if (diff <= 0) {
        // Promotion ended
        showPromotionClosed();
        return;
    }

    // Calculate time remaining
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    // Update display
    document.getElementById('hoursLeft').textContent = String(hours).padStart(2, '0');
    document.getElementById('minutesLeft').textContent = String(minutes).padStart(2, '0');
    document.getElementById('secondsLeft').textContent = String(seconds).padStart(2, '0');
}

// ============================================
// PRODUCTS LOADING
// ============================================

async function loadProducts() {
    try {
        const response = await fetch('data/products.json');
        const data = await response.json();
        allProducts = data.products || [];
    } catch (error) {
        console.error('Error loading products:', error);
        allProducts = [];
    }
}

function renderProducts() {
    const grid = document.getElementById('productsGrid');
    if (!grid) return;

    grid.innerHTML = allProducts.map(product => `
    <div class="christmas-product-card" data-product-id="${product.id}">
      <div class="product-image-wrapper">
        <img src="assets/images/${product.image}" 
             alt="${product.nameKey}" 
             onerror="this.src='assets/images/placeholder.png'">
      </div>
      <h3 class="product-name">${getProductName(product)}</h3>
      <p class="product-description">${getProductDescription(product)}</p>
      <div class="product-pricing">
        <span class="product-price-original">${product.price}</span>
        <span class="product-price-free">$0.00 🎁</span>
      </div>
      <div class="product-badge">Santa's Gift!</div>
    </div>
  `).join('');
}

function getProductName(product) {
    // Try to get translated name, fallback to ID
    const key = product.nameKey;
    return i18n.t(key) || product.id.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

function getProductDescription(product) {
    // Try to get translated description
    const key = product.descriptionKey;
    return i18n.t(key) || 'Amazing digital product for kids!';
}

// ============================================
// PRODUCT SELECTION
// ============================================

function setupEventListeners() {
    // Product card clicks
    document.getElementById('productsGrid').addEventListener('click', (e) => {
        const card = e.target.closest('.christmas-product-card');
        if (card) {
            toggleProductSelection(card);
        }
    });

    // Download button
    document.getElementById('downloadBtn').addEventListener('click', downloadGifts);
}

function toggleProductSelection(card) {
    const productId = card.dataset.productId;
    const isSelected = card.classList.contains('selected');

    if (isSelected) {
        // Deselect
        card.classList.remove('selected');
        selectedProducts = selectedProducts.filter(id => id !== productId);
    } else {
        // Check if max selections reached
        if (selectedProducts.length >= PROMOTION_CONFIG.maxSelections) {
            alert(i18n.t('christmas.maxSelectionReached') || `You can only select ${PROMOTION_CONFIG.maxSelections} products!`);
            return;
        }

        // Select
        card.classList.add('selected');
        selectedProducts.push(productId);
    }

    updateSelectionCounter();
    updateDownloadButton();
}

function updateSelectionCounter() {
    document.getElementById('selectedCount').textContent = selectedProducts.length;
}

function updateDownloadButton() {
    const downloadSection = document.getElementById('downloadSection');

    if (selectedProducts.length === PROMOTION_CONFIG.maxSelections) {
        downloadSection.style.display = 'block';
    } else {
        downloadSection.style.display = 'none';
    }
}

// ============================================
// DOWNLOAD GIFTS
// ============================================

function downloadGifts() {
    // Save to localStorage to prevent multiple downloads
    const downloadData = {
        products: selectedProducts,
        timestamp: new Date().toISOString(),
        year: new Date().getFullYear()
    };

    localStorage.setItem(PROMOTION_CONFIG.storageKey, JSON.stringify(downloadData));

    // In a real implementation, this would:
    // 1. Generate download tokens for selected products
    // 2. Send email with download links
    // 3. Track the download in database

    // For now, show thank you message
    showThankYouMessage();

    // Log for admin
    console.log('Christmas gifts downloaded:', selectedProducts);
}

function checkPreviousDownload() {
    const savedData = localStorage.getItem(PROMOTION_CONFIG.storageKey);

    if (savedData) {
        try {
            const data = JSON.parse(savedData);
            const currentYear = new Date().getFullYear();

            // Check if download was this year
            if (data.year === currentYear) {
                // User already downloaded this year
                showThankYouMessage();
            }
        } catch (error) {
            console.error('Error checking previous download:', error);
        }
    }
}

// ============================================
// UI MESSAGES
// ============================================

function showThankYouMessage() {
    document.getElementById('thankYouMessage').style.display = 'flex';
}

function showPromotionClosed() {
    document.getElementById('promotionClosed').style.display = 'flex';
}

// ============================================
// AUTOMATIC REDIRECT (Optional)
// ============================================

// Automatically redirect to homepage if promotion is not active
// Uncomment if you want automatic redirect
/*
if (!isPromotionActive()) {
  setTimeout(() => {
    window.location.href = 'index.html';
  }, 5000); // Redirect after 5 seconds
}
*/

// ============================================
// SNOWFLAKES ANIMATION
// ============================================

function createSnowflakes() {
    const snowflakesContainer = document.querySelector('.snowflakes');
    if (!snowflakesContainer) return;

    const snowflakeEmojis = ['❄️', '⛄', '🎄', '⭐', '🎁'];
    const count = 30;

    for (let i = 0; i < count; i++) {
        const snowflake = document.createElement('div');
        snowflake.className = 'snowflake-particle';
        snowflake.textContent = snowflakeEmojis[Math.floor(Math.random() * snowflakeEmojis.length)];
        snowflake.style.left = Math.random() * 100 + '%';
        snowflake.style.animationDelay = Math.random() * 10 + 's';
        snowflake.style.animationDuration = (15 + Math.random() * 10) + 's';
        snowflake.style.fontSize = (1 + Math.random() * 1.5) + 'rem';
        snowflakesContainer.appendChild(snowflake);
    }
}

// Create snowflakes on load
if (isPromotionActive()) {
    createSnowflakes();
}

// ============================================
// ANALYTICS (Optional)
// ============================================

function trackChristmasEvent(action, label) {
    // Track with Google Analytics if available
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            event_category: 'Christmas Promotion',
            event_label: label
        });
    }

    console.log('Christmas Event:', action, label);
}

// Track page view
if (isPromotionActive()) {
    trackChristmasEvent('page_view', 'Christmas Magic Page');
}
