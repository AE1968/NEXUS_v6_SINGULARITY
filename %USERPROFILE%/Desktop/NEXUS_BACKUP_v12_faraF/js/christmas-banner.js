// ============================================
// CHRISTMAS PROMOTION BANNER
// Automatic banner for Christmas promotion
// Active: Until December 24, 00:00
// Auto-disables: After December 25, 23:59:59
// ============================================

(function () {
    'use strict';

    // Configuration
    const BANNER_CONFIG = {
        showFrom: { month: 11, day: 24, hour: 0, minute: 0 }, // Show FROM Dec 24, 00:00
        hideAfter: { month: 11, day: 25, hour: 23, minute: 59, second: 59 }, // Hide after Dec 25, 23:59:59
        storageKey: 'christmas_banner_dismissed_2024'
    };

    // Check if banner should be shown
    function shouldShowBanner() {
        const now = new Date();
        const currentYear = now.getFullYear();

        // Create start date (Dec 24, 00:00)
        const showFromDate = new Date(
            currentYear,
            BANNER_CONFIG.showFrom.month,
            BANNER_CONFIG.showFrom.day,
            BANNER_CONFIG.showFrom.hour,
            BANNER_CONFIG.showFrom.minute,
            0
        );

        // Create end date (Dec 25, 23:59:59)
        const hideAfterDate = new Date(
            currentYear,
            BANNER_CONFIG.hideAfter.month,
            BANNER_CONFIG.hideAfter.day,
            BANNER_CONFIG.hideAfter.hour,
            BANNER_CONFIG.hideAfter.minute,
            BANNER_CONFIG.hideAfter.second
        );

        // Show only during Dec 24-25
        if (now >= showFromDate && now <= hideAfterDate) {
            // Check if user dismissed it
            const dismissed = localStorage.getItem(BANNER_CONFIG.storageKey);
            return !dismissed;
        }

        return false;
    }

    // Calculate hours until promotion ends
    function getHoursUntilEnd() {
        const now = new Date();
        const currentYear = now.getFullYear();
        const endDate = new Date(
            currentYear,
            BANNER_CONFIG.hideAfter.month,
            BANNER_CONFIG.hideAfter.day,
            BANNER_CONFIG.hideAfter.hour,
            BANNER_CONFIG.hideAfter.minute,
            BANNER_CONFIG.hideAfter.second
        );

        const diff = endDate - now;
        const hours = Math.ceil(diff / (1000 * 60 * 60));

        return hours > 0 ? hours : 0;
    }

    // Create and inject banner
    function createBanner() {
        const hoursLeft = getHoursUntilEnd();

        const banner = document.createElement('div');
        banner.className = 'christmas-promo-banner';
        banner.innerHTML = `
      <div class="christmas-banner-content">
        <div class="banner-santa">🎅</div>
        <div class="banner-text">
          <strong class="banner-title">🎄 Christmas Magic is HERE! 🎁</strong>
          <span class="banner-subtitle">
            Choose 2 FREE products from Santa! Only ${hoursLeft} hours left!
          </span>
        </div>
        <a href="christmas-magic.html" class="banner-cta">
          🎁 Get Your Gifts NOW!
        </a>
        <button class="banner-close" aria-label="Close banner">×</button>
      </div>
    `;

        // Insert at top of body
        document.body.insertBefore(banner, document.body.firstChild);

        // Add close functionality
        const closeBtn = banner.querySelector('.banner-close');
        closeBtn.addEventListener('click', () => {
            banner.style.animation = 'slideUp 0.3s ease';
            setTimeout(() => {
                banner.remove();
                localStorage.setItem(BANNER_CONFIG.storageKey, 'true');
            }, 300);
        });

        // Add animation
        setTimeout(() => {
            banner.classList.add('banner-visible');
        }, 500);
    }

    // Inject CSS
    function injectStyles() {
        const style = document.createElement('style');
        style.textContent = `
      .christmas-promo-banner {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        background: linear-gradient(135deg, #c41e3a 0%, #165b33 100%);
        color: white;
        z-index: 9999;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        transform: translateY(-100%);
        transition: transform 0.5s ease;
      }
      
      .christmas-promo-banner.banner-visible {
        transform: translateY(0);
      }
      
      .christmas-banner-content {
        max-width: 1400px;
        margin: 0 auto;
        padding: 15px 20px;
        display: flex;
        align-items: center;
        gap: 20px;
        flex-wrap: wrap;
      }
      
      .banner-santa {
        font-size: 3rem;
        animation: santa-bounce 2s ease-in-out infinite;
      }
      
      @keyframes santa-bounce {
        0%, 100% { transform: translateY(0); }
        50% { transform: translateY(-10px); }
      }
      
      .banner-text {
        flex: 1;
        min-width: 250px;
      }
      
      .banner-title {
        display: block;
        font-size: 1.3rem;
        font-weight: 700;
        margin-bottom: 5px;
        font-family: var(--font-heading, 'Fredoka', sans-serif);
      }
      
      .banner-subtitle {
        font-size: 1rem;
        opacity: 0.95;
      }
      
      .banner-cta {
        padding: 12px 30px;
        background: white;
        color: #c41e3a;
        text-decoration: none;
        border-radius: 50px;
        font-weight: 700;
        font-size: 1.1rem;
        transition: all 0.3s ease;
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        animation: pulse-cta 2s ease-in-out infinite;
      }
      
      .banner-cta:hover {
        transform: translateY(-3px) scale(1.05);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
      }
      
      @keyframes pulse-cta {
        0%, 100% {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        50% {
          box-shadow: 0 4px 20px rgba(255, 255, 255, 0.5);
        }
      }
      
      .banner-close {
        background: rgba(255, 255, 255, 0.2);
        border: none;
        color: white;
        font-size: 2rem;
        width: 40px;
        height: 40px;
        border-radius: 50%;
        cursor: pointer;
        transition: all 0.3s ease;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
      }
      
      .banner-close:hover {
        background: rgba(255, 255, 255, 0.3);
        transform: rotate(90deg);
      }
      
      @keyframes slideUp {
        to {
          transform: translateY(-100%);
          opacity: 0;
        }
      }
      
      /* Adjust body padding when banner is visible */
      body.has-christmas-banner {
        padding-top: 80px;
      }
      
      /* Mobile responsive */
      @media (max-width: 768px) {
        .christmas-banner-content {
          padding: 12px 15px;
          gap: 15px;
        }
        
        .banner-santa {
          font-size: 2rem;
        }
        
        .banner-title {
          font-size: 1.1rem;
        }
        
        .banner-subtitle {
          font-size: 0.9rem;
        }
        
        .banner-cta {
          padding: 10px 20px;
          font-size: 1rem;
        }
        
        .banner-close {
          width: 35px;
          height: 35px;
          font-size: 1.5rem;
        }
        
        body.has-christmas-banner {
          padding-top: 100px;
        }
      }
      
      @media (max-width: 480px) {
        .christmas-banner-content {
          flex-direction: column;
          text-align: center;
          gap: 10px;
        }
        
        .banner-close {
          position: absolute;
          top: 10px;
          right: 10px;
        }
        
        body.has-christmas-banner {
          padding-top: 140px;
        }
      }
    `;
        document.head.appendChild(style);
    }

    // Initialize
    function init() {
        // Don't show on christmas-magic.html page itself
        if (window.location.pathname.includes('christmas-magic.html')) {
            return;
        }

        if (shouldShowBanner()) {
            injectStyles();

            // Wait for DOM to be ready
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    createBanner();
                    document.body.classList.add('has-christmas-banner');
                });
            } else {
                createBanner();
                document.body.classList.add('has-christmas-banner');
            }
        }
    }

    // Run initialization
    init();

    // Auto-cleanup after Dec 25
    const now = new Date();
    const currentYear = now.getFullYear();
    const cleanupDate = new Date(
        currentYear,
        BANNER_CONFIG.hideAfter.month,
        BANNER_CONFIG.hideAfter.day + 1, // Dec 26
        0, 0, 0
    );

    if (now >= cleanupDate) {
        // Clear storage for next year
        localStorage.removeItem(BANNER_CONFIG.storageKey);
    }

})();
