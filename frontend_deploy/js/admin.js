// ============================================
// Kids Digital Hub - Admin Dashboard JavaScript
// ============================================

// Sample data for demonstration
const sampleProducts = [
  {
    id: 1,
    name: 'Pokémon Coloring Book',
    category: 'Coloring',
    ageGroup: 'Preschool (4-6)',
    price: '$4.99',
    status: 'active',
    views: 1234,
    sales: 89,
    image: 'pokemon.png'
  },
  {
    id: 2,
    name: 'My Hero Academia Activity Pack',
    category: 'Games',
    ageGroup: 'Elementary (8-10)',
    price: '$7.99',
    status: 'active',
    views: 987,
    sales: 67,
    image: 'mha.png'
  },
  {
    id: 3,
    name: 'Bluey Interactive Story',
    category: 'Stories',
    ageGroup: 'Preschool (4-6)',
    price: '$5.99',
    status: 'active',
    views: 1456,
    sales: 102,
    image: 'bluey.png'
  }
];

const trendingThemes = [
  { id: 1, name: 'Pokémon', icon: '⚡', products: 12, trending: true },
  { id: 2, name: 'Bluey', icon: '🐶', products: 8, trending: true },
  { id: 3, name: 'Frozen', icon: '❄️', products: 15, trending: true },
  { id: 4, name: 'My Hero Academia', icon: '🦸', products: 6, trending: true },
  { id: 5, name: 'Paw Patrol', icon: '🐾', products: 10, trending: false },
  { id: 6, name: 'Spider-Man', icon: '🕷️', products: 9, trending: true },
  { id: 7, name: 'Mario', icon: '🍄', products: 7, trending: false },
  { id: 8, name: 'Sonic', icon: '💨', products: 5, trending: false }
];

const contentCalendar = [
  { month: 'January 2025', theme: 'New Year / Winter', status: 'Planned' },
  { month: 'February 2025', theme: 'Valentine\'s Day / Love', status: 'Planned' },
  { month: 'March 2025', theme: 'Spring / Easter', status: 'Planned' },
  { month: 'April 2025', theme: 'Earth Day / Nature', status: 'In Progress' },
  { month: 'May 2025', theme: 'Mother\'s Day / Family', status: 'Not Started' },
  { month: 'June 2025', theme: 'Summer / Beach', status: 'Not Started' }
];

// Initialize dashboard
document.addEventListener('DOMContentLoaded', () => {
  loadDashboardData();
  loadProductsTable();
  loadTrendingThemes();
  loadContentCalendar();
  loadUserRequests();
  loadTopProducts();
});

// Show section
function showSection(sectionName) {
  // Hide all sections
  document.querySelectorAll('.admin-section').forEach(section => {
    section.classList.remove('active');
  });

  // Show selected section
  const section = document.getElementById(`${sectionName}-section`);
  if (section) {
    section.classList.add('active');
  }

  // Update nav links
  document.querySelectorAll('.admin-nav-link').forEach(link => {
    link.classList.remove('active');
    if (link.getAttribute('href') === `#${sectionName}`) {
      link.classList.add('active');
    }
  });
}

// Load dashboard data
function loadDashboardData() {
  // Simulate real-time data updates
  updateStat('totalViews', 5234);
  updateStat('totalRevenue', '$1,245');
  updateStat('totalSales', 156);
  updateStat('activeUsers', 1023);
}

// Update stat
function updateStat(id, value) {
  const element = document.getElementById(id);
  if (element) {
    element.textContent = value;
  }
}

// Load products table
function loadProductsTable() {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;

  tbody.innerHTML = sampleProducts.map(product => `
    <tr>
      <td>#${product.id}</td>
      <td>
        <img src="../assets/images/${product.image}" 
             alt="${product.name}" 
             class="product-image-thumb"
             onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><rect fill=%22%2387CEEB%22 width=%22100%22 height=%22100%22/><text x=%2250%25%22 y=%2250%25%22 dominant-baseline=%22middle%22 text-anchor=%22middle%22 font-size=%2240%22>🎨</text></svg>'">
      </td>
      <td><strong>${product.name}</strong></td>
      <td>${product.category}</td>
      <td>${product.ageGroup}</td>
      <td><strong>${product.price}</strong></td>
      <td>
        <span class="status-badge ${product.status}">
          ${product.status}
        </span>
      </td>
      <td>${product.views.toLocaleString()}</td>
      <td>${product.sales}</td>
      <td class="table-actions">
        <button class="action-btn" onclick="editProduct(${product.id})" title="Edit">
          ✏️
        </button>
        <button class="action-btn" onclick="deleteProduct(${product.id})" title="Delete">
          🗑️
        </button>
      </td>
    </tr>
  `).join('');
}

// Load trending themes
function loadTrendingThemes() {
  const grid = document.getElementById('themesGrid');
  if (!grid) return;

  grid.innerHTML = trendingThemes.map(theme => `
    <div class="theme-card ${theme.trending ? 'trending' : ''}">
      <div class="theme-icon">${theme.icon}</div>
      <div class="theme-name">${theme.name}</div>
      <div class="theme-count">${theme.products} products</div>
      ${theme.trending ? '<div style="color: #EF4444; font-weight: 700; font-size: 0.75rem;">🔥 TRENDING</div>' : ''}
    </div>
  `).join('');
}

// Load content calendar
function loadContentCalendar() {
  const calendar = document.getElementById('trendingCalendar');
  if (!calendar) return;

  calendar.innerHTML = contentCalendar.map(item => `
    <div class="calendar-item">
      <div class="calendar-month">${item.month}</div>
      <div class="calendar-theme">${item.theme}</div>
      <div class="calendar-status">Status: ${item.status}</div>
    </div>
  `).join('');
}

// Load user requests
function loadUserRequests() {
  const requestsList = document.getElementById('requestsList');
  if (!requestsList) return;

  // Get requests from localStorage
  const requests = JSON.parse(localStorage.getItem('productRequests') || '[]');

  if (requests.length === 0) {
    requestsList.innerHTML = `
      <div style="text-align: center; padding: 3rem; color: var(--text-light);">
        <div style="font-size: 4rem; margin-bottom: 1rem;">📭</div>
        <p>No product requests yet.</p>
      </div>
    `;
    return;
  }

  // 🛡️ SECURITY: Escape HTML to prevent XSS attacks
  const escapeHtml = (unsafe) => {
    return (unsafe || '').toString()
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  requestsList.innerHTML = requests.reverse().map(request => `
    <div class="request-card">
      <div class="request-header">
        <div>
          <strong>${escapeHtml(request.name)}</strong>
          <div class="request-meta">
            ${escapeHtml(request.email)} • ${new Date(request.timestamp).toLocaleDateString()}
          </div>
        </div>
        <span class="status-badge ${escapeHtml(request.status || 'pending')}">
          ${escapeHtml(request.status || 'pending')}
        </span>
      </div>
      <div class="request-description">
        <strong>Category:</strong> ${escapeHtml(request.category)}<br>
        <strong>Age Group:</strong> ${escapeHtml(request.ageGroup)}<br>
        <strong>Description:</strong> ${escapeHtml(request.description)}
      </div>
      <div class="request-actions">
        <button class="btn btn-primary btn-sm" onclick="approveRequest(${request.id})">
          ✅ Approve
        </button>
        <button class="btn btn-secondary btn-sm" onclick="rejectRequest(${request.id})">
          ❌ Reject
        </button>
      </div>
    </div>
  `).join('');
}

// Load top products
function loadTopProducts() {
  const list = document.getElementById('topProductsList');
  if (!list) return;

  const topProducts = [...sampleProducts]
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);

  list.innerHTML = topProducts.map((product, index) => `
    <div class="top-product-item">
      <div class="top-product-rank">#${index + 1}</div>
      <div class="top-product-info">
        <div class="top-product-name">${product.name}</div>
        <div class="top-product-sales">${product.sales} sales • ${product.views} views</div>
      </div>
    </div>
  `).join('');
}

// Filter requests
function filterRequests(status) {
  // Update active button
  document.querySelectorAll('.filter-buttons .btn').forEach(btn => {
    btn.classList.remove('active');
  });
  event.target.classList.add('active');

  // Filter logic here
  console.log('Filtering by:', status);
}

// Approve request
function approveRequest(id) {
  const requests = JSON.parse(localStorage.getItem('productRequests') || '[]');
  const index = requests.findIndex(r => r.id === id);
  if (index !== -1) {
    requests[index].status = 'approved';
    localStorage.setItem('productRequests', JSON.stringify(requests));
    loadUserRequests();
    alert('Request approved! ✅');
  }
}

// Reject request
function rejectRequest(id) {
  const requests = JSON.parse(localStorage.getItem('productRequests') || '[]');
  const index = requests.findIndex(r => r.id === id);
  if (index !== -1) {
    requests[index].status = 'rejected';
    localStorage.setItem('productRequests', JSON.stringify(requests));
    loadUserRequests();
    alert('Request rejected. ❌');
  }
}

// Edit product
function editProduct(id) {
  alert(`Edit product #${id} - Feature coming soon!`);
}

// Delete product
function deleteProduct(id) {
  if (confirm('Are you sure you want to delete this product?')) {
    alert(`Product #${id} deleted!`);
    // Implement delete logic
  }
}

// Export report
function exportReport() {
  alert('Exporting analytics report... 📥');
  // Implement export logic
}

// Logout
function logout() {
  if (confirm('Are you sure you want to logout?')) {
    window.location.href = '../index.html';
  }
}

// Open modals (placeholders)
function openAddProductModal() {
  alert('Add Product Modal - Coming soon! ➕');
}

function openAddTrendingModal() {
  alert('Add Trending Theme Modal - Coming soon! 🔥');
}
