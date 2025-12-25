// ============================================
// CURRENCY CONVERSION SYSTEM
// Automatic currency based on selected language
// Base currency: USD
// ============================================

const CURRENCY_CONFIG = {
    // Exchange rates (updated periodically)
    // Base: 1 USD
    rates: {
        USD: 1.00,      // US Dollar (English - US)
        GBP: 0.79,      // British Pound (English - UK)
        RON: 4.65,      // Romanian Leu (Română)
        EUR: 0.92,      // Euro (Español, Français, Deutsch)
    },

    // Currency symbols
    symbols: {
        USD: '$',
        GBP: '£',
        RON: 'lei',
        EUR: '€'
    },

    // Language to currency mapping
    languageToCurrency: {
        'en': 'USD',       // English (US)
        'en-US': 'USD',    // English (US)
        'en-GB': 'GBP',    // English (UK)
        'ro': 'RON',       // Română
        'es': 'EUR',       // Español
        'fr': 'EUR',       // Français
        'de': 'EUR'        // Deutsch
    },

    // Currency display format
    formats: {
        USD: 'symbol_before',  // $4.99
        GBP: 'symbol_before',  // £3.94
        RON: 'symbol_after',   // 23,19 lei
        EUR: 'symbol_before'   // €4,59
    }
};

// ============================================
// CURRENCY FUNCTIONS
// ============================================

/**
 * Get currency for current language
 */
function getCurrentCurrency() {
    const currentLang = i18n.getCurrentLanguage() || 'en';
    return CURRENCY_CONFIG.languageToCurrency[currentLang] || 'USD';
}

/**
 * Get currency symbol
 */
function getCurrencySymbol(currency) {
    return CURRENCY_CONFIG.symbols[currency] || '$';
}

/**
 * Convert USD price to target currency
 */
function convertPrice(usdPrice, targetCurrency) {
    if (typeof usdPrice === 'string') {
        // Handle "free" or "$X.XX" format
        if (usdPrice.toLowerCase() === 'free') {
            return 0;
        }
        // Extract number from "$X.XX"
        usdPrice = parseFloat(usdPrice.replace(/[^0-9.]/g, ''));
    }

    const rate = CURRENCY_CONFIG.rates[targetCurrency] || 1;
    return usdPrice * rate;
}

/**
 * Format price with currency symbol
 */
function formatPrice(price, currency) {
    const symbol = getCurrencySymbol(currency);
    const format = CURRENCY_CONFIG.formats[currency] || 'symbol_before';

    // Round to 2 decimals
    let formattedNumber;

    if (currency === 'RON') {
        // Romanian format: 23,19 (comma as decimal separator)
        formattedNumber = price.toFixed(2).replace('.', ',');
    } else {
        // Standard format: 4.99
        formattedNumber = price.toFixed(2);
    }

    // Apply symbol position
    if (format === 'symbol_before') {
        return `${symbol}${formattedNumber}`;
    } else {
        return `${formattedNumber} ${symbol}`;
    }
}

/**
 * Get formatted price for current language
 */
function getLocalizedPrice(usdPrice) {
    const currency = getCurrentCurrency();

    // Handle "free" products
    if (typeof usdPrice === 'string' && usdPrice.toLowerCase() === 'free') {
        return i18n.t('price.free') || 'FREE';
    }

    const convertedPrice = convertPrice(usdPrice, currency);
    return formatPrice(convertedPrice, currency);
}

/**
 * Get price object with all details
 */
function getPriceDetails(usdPrice) {
    const currency = getCurrentCurrency();
    const isFree = typeof usdPrice === 'string' && usdPrice.toLowerCase() === 'free';

    return {
        original: usdPrice,
        currency: currency,
        symbol: getCurrencySymbol(currency),
        converted: isFree ? 0 : convertPrice(usdPrice, currency),
        formatted: isFree ? (i18n.t('price.free') || 'FREE') : formatPrice(convertPrice(usdPrice, currency), currency),
        isFree: isFree
    };
}

// ============================================
// UPDATE PRICES ON LANGUAGE CHANGE
// ============================================

/**
 * Update all prices on page when language changes
 */
function updateAllPrices() {
    // Update product prices
    document.querySelectorAll('[data-price-usd]').forEach(element => {
        const usdPrice = element.getAttribute('data-price-usd');
        const priceDetails = getPriceDetails(usdPrice);
        element.textContent = priceDetails.formatted;
    });

    // Update Christmas promotion prices
    document.querySelectorAll('.product-price-original').forEach(element => {
        const usdPrice = element.getAttribute('data-price-usd');
        if (usdPrice) {
            const priceDetails = getPriceDetails(usdPrice);
            element.textContent = priceDetails.formatted;
        }
    });
}

/**
 * Initialize currency system
 */
function initCurrencySystem() {
    // Update prices on page load
    updateAllPrices();

    // Listen for language changes
    document.addEventListener('languageChanged', () => {
        updateAllPrices();
    });
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCurrencySystem);
} else {
    initCurrencySystem();
}

// ============================================
// EXPORT FOR USE IN OTHER SCRIPTS
// ============================================

window.Currency = {
    getCurrentCurrency,
    getCurrencySymbol,
    convertPrice,
    formatPrice,
    getLocalizedPrice,
    getPriceDetails,
    updateAllPrices
};
