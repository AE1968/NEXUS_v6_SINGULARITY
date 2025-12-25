// ============================================
// Kids Digital Hub - Home Page JavaScript
// ============================================

// Initialize home page
document.addEventListener('DOMContentLoaded', async () => {
    // Wait for data to load
    await new Promise(resolve => {
        const checkData = setInterval(() => {
            if (productsData.length > 0) {
                clearInterval(checkData);
                resolve();
            }
        }, 100);
    });

    renderAgeGroups();
    renderCategories();
    renderFeaturedProducts();
    initProductRequestForm();
});

// Render age groups
function renderAgeGroups() {
    const container = document.getElementById('ageGroupsGrid');
    if (!container) return;

    container.innerHTML = ageGroupsData.map(group => `
    <div class="age-group-card" 
         style="color: ${getAgeGroupColor(group.id)}"
         onclick="navigateToProducts('age', '${group.id}')">
      <span class="age-group-icon">${group.icon}</span>
      <div class="age-group-name" data-i18n="${group.nameKey}">
        ${getTranslation(group.nameKey)}
      </div>
      <div class="age-group-range">${group.ageRange} years</div>
    </div>
  `).join('');
}

// Render categories
function renderCategories() {
    const container = document.getElementById('categoriesGrid');
    if (!container) return;

    container.innerHTML = categoriesData.map(category => `
    <div class="category-card" 
         style="color: ${category.color}"
         onclick="navigateToProducts('category', '${category.id}')">
      <span class="category-icon">${category.icon}</span>
      <div class="category-name" data-i18n="${category.nameKey}">
        ${getTranslation(category.nameKey)}
      </div>
    </div>
  `).join('');
}

// Render featured products
function renderFeaturedProducts() {
    const container = document.getElementById('featuredProducts');
    if (!container) return;

    const featuredProducts = productsData.filter(p => p.featured);

    container.innerHTML = featuredProducts.map(product => {
        const ageGroup = ageGroupsData.find(ag => ag.id === product.ageGroup);
        const category = categoriesData.find(c => c.id === product.category);

        return `
      <div class="product-card">
        <div class="product-image-wrapper">
          <img src="assets/images/${product.image}" 
               alt="${getTranslation(product.nameKey)}"
               class="product-image"
               onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 400 300%22><rect fill=%22%2387CEEB%22 width=%22400%22 height=%22300%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2260%22>${category ? category.icon : '🎨'}</text></svg>'">
          <div class="product-badges">
            <span class="badge badge-age" style="background: ${getAgeGroupColor(product.ageGroup)}">
              ${ageGroup ? ageGroup.icon : ''} ${product.ageRange}
            </span>
            ${product.price === 'free' ? '<span class="badge badge-free">FREE</span>' : ''}
          </div>
        </div>
        <div class="product-content">
          <h3 class="product-title" data-i18n="${product.nameKey}">
            ${getTranslation(product.nameKey)}
          </h3>
          <p class="product-description" data-i18n="${product.descriptionKey}">
            ${getTranslation(product.descriptionKey)}
          </p>
          <div class="product-actions">
            ${product.demoUrl ? `
              <a href="${product.demoUrl}" class="btn btn-primary" data-i18n="buttons.tryDemo">
                Try Demo
              </a>
            ` : ''}
            <a href="product-detail.html?id=${product.id}" class="btn btn-secondary" data-i18n="buttons.learnMore">
              Learn More
            </a>
          </div>
        </div>
      </div>
    `;
    }).join('');
}

// Initialize product request form
function initProductRequestForm() {
    const form = document.getElementById('productRequestForm');
    const descriptionField = document.getElementById('requestDescription');
    const charCount = document.getElementById('charCount');

    if (!form) return;

    // Character counter
    if (descriptionField && charCount) {
        descriptionField.addEventListener('input', () => {
            charCount.textContent = descriptionField.value.length;
        });
    }

    // Form submission
    form.addEventListener('submit', async (e) => {
        e.preventDefault();

        const formData = {
            name: form.name.value.trim(),
            email: form.email.value.trim(),
            category: form.category.value,
            ageGroup: form.ageGroup.value,
            description: form.description.value.trim()
        };

        // Validate content
        if (!validateProductRequest(formData)) {
            return;
        }

        // Simulate submission (in production, send to backend)
        await submitProductRequest(formData);
    });
}

// Validate product request
function validateProductRequest(data) {
    // Check for inappropriate content
    const bannedWords = [
        'porn', 'sex', 'nude', 'naked', 'xxx', 'adult',
        'violence', 'violent', 'kill', 'murder', 'death', 'blood',
        'bully', 'bullying', 'hate', 'racist', 'discrimination',
        'drug', 'drugs', 'alcohol', 'cigarette', 'smoking',
        'weapon', 'gun', 'knife', 'bomb', 'explosive'
    ];

    const contentToCheck = `${data.description} ${data.name}`.toLowerCase();

    for (const word of bannedWords) {
        if (contentToCheck.includes(word)) {
            showAlert(
                'Inappropriate Content Detected',
                'Your request contains content that violates our community guidelines. Please revise your description and try again.',
                'error'
            );
            return false;
        }
    }

    // Check minimum description length
    if (data.description.length < 20) {
        showAlert(
            'Description Too Short',
            'Please provide a more detailed description of your product idea (at least 20 characters).',
            'warning'
        );
        return false;
    }

    return true;
}

// Submit product request
async function submitProductRequest(data) {
    // Show loading state
    const submitBtn = document.querySelector('#productRequestForm button[type="submit"]');
    const originalText = submitBtn.innerHTML;
    submitBtn.innerHTML = '⏳ Submitting...';
    submitBtn.disabled = true;

    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));

    // In production, send to backend:
    // const response = await fetch('/api/product-requests', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify(data)
    // });

    // Store in localStorage for demo purposes
    const requests = JSON.parse(localStorage.getItem('productRequests') || '[]');
    requests.push({
        ...data,
        id: Date.now(),
        timestamp: new Date().toISOString(),
        status: 'pending'
    });
    localStorage.setItem('productRequests', JSON.stringify(requests));

    // Show success message
    document.getElementById('productRequestForm').style.display = 'none';
    document.getElementById('requestSuccess').style.display = 'block';

    // Reset button
    submitBtn.innerHTML = originalText;
    submitBtn.disabled = false;

    // Scroll to success message
    document.getElementById('requestSuccess').scrollIntoView({
        behavior: 'smooth',
        block: 'center'
    });
}

// Reset request form
function resetRequestForm() {
    document.getElementById('productRequestForm').reset();
    document.getElementById('charCount').textContent = '0';
    document.getElementById('productRequestForm').style.display = 'block';
    document.getElementById('requestSuccess').style.display = 'none';
}

// Show alert
function showAlert(title, message, type = 'info') {
    // Create alert element
    const alert = document.createElement('div');
    alert.className = `alert alert-${type}`;
    alert.style.cssText = `
    position: fixed;
    top: 100px;
    right: 20px;
    max-width: 400px;
    background: white;
    padding: 20px;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.2);
    z-index: 10000;
    animation: slideInRight 0.3s ease;
    border-left: 5px solid ${type === 'error' ? '#FF6B6B' : type === 'warning' ? '#FFE66D' : '#4ECDC4'};
  `;

    alert.innerHTML = `
    <div style="display: flex; align-items: start; gap: 12px;">
      <div style="font-size: 24px;">
        ${type === 'error' ? '❌' : type === 'warning' ? '⚠️' : 'ℹ️'}
      </div>
      <div style="flex: 1;">
        <h4 style="margin: 0 0 8px 0; font-family: var(--font-heading); color: var(--text-dark);">
          ${title}
        </h4>
        <p style="margin: 0; color: var(--text-light); font-size: 0.95rem;">
          ${message}
        </p>
      </div>
      <button onclick="this.parentElement.parentElement.remove()" 
              style="background: none; border: none; font-size: 20px; cursor: pointer; color: var(--text-light);">
        ✕
      </button>
    </div>
  `;

    document.body.appendChild(alert);

    // Auto remove after 5 seconds
    setTimeout(() => {
        alert.style.animation = 'slideOutRight 0.3s ease';
        setTimeout(() => alert.remove(), 300);
    }, 5000);
}

// Add CSS for alert animations
const style = document.createElement('style');
style.textContent = `
  @keyframes slideInRight {
    from {
      transform: translateX(400px);
      opacity: 0;
    }
    to {
      transform: translateX(0);
      opacity: 1;
    }
  }
  
  @keyframes slideOutRight {
    from {
      transform: translateX(0);
      opacity: 1;
    }
    to {
      transform: translateX(400px);
      opacity: 0;
    }
  }
`;
document.head.appendChild(style);
