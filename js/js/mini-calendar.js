// Mini Calendar Widget - Simple approach with CSS max-height
function createMiniCalendar() {
  const today = new Date();
  const currentDay = today.getDate();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();

  const monthNames = {
    en: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
    ro: ['Ian', 'Feb', 'Mar', 'Apr', 'Mai', 'Iun', 'Iul', 'Aug', 'Sep', 'Oct', 'Noi', 'Dec'],
    fr: ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'],
    de: ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'],
    es: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
  };

  const currentLang = localStorage.getItem('selectedLanguage') || 'en';
  const monthName = monthNames[currentLang]?.[currentMonth] || monthNames['en'][currentMonth];
  const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
  const firstDay = new Date(currentYear, currentMonth, 1).getDay();

  // Calculate exact height needed
  const headerHeight = 25; // Header approx
  const weekdaysHeight = 15; // Weekdays approx
  const rows = Math.ceil((firstDay + daysInMonth) / 7); // Calculate actual rows needed (usually 5 or 6)
  const rowHeight = 22; // 20px cell + 2px gap
  const totalContentHeight = headerHeight + weekdaysHeight + (rows * rowHeight) + 15; // + padding

  // Create calendar with EXPLICIT sizing
  const calendar = document.createElement('div');
  calendar.id = 'mini-calendar-widget';
  calendar.style.cssText = `
    position: absolute;
    top: 50%;
    left: 7px;
    transform: translateY(-50%) scale(1);
    transform-origin: left center;
    background: #ffffff; /* Solid white for maximum readability */
    border-radius: 8px;
    padding: 5px;
    box-shadow: 0 5px 15px rgba(0, 0, 0, 0.4); /* Stronger shadow */
    z-index: 10;
    backdrop-filter: blur(10px);
    border: 2px solid #667eea;
    font-family: 'Fredoka', sans-serif;
    width: 160px;
    height: ${totalContentHeight}px; /* EXPLICIT HEIGHT - NO AUTO */
    display: block;
    box-sizing: border-box;
    overflow: hidden; /* Contain everything nicely */
  `;

  // Header
  const header = document.createElement('div');
  header.style.cssText = `
    text-align: center;
    font-size: 0.75rem;
    font-weight: 700;
    color: #667eea;
    margin-bottom: 3px;
    padding-bottom: 3px;
    border-bottom: 1px solid #667eea;
  `;
  header.textContent = `${monthName} ${currentYear}`;
  calendar.appendChild(header);

  // Weekdays
  const weekdays = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  const weekdayRow = document.createElement('div');
  weekdayRow.style.cssText = `
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    margin-bottom: 2px;
  `;

  weekdays.forEach(day => {
    const cell = document.createElement('div');
    cell.style.cssText = `
      text-align: center;
      font-size: 0.6rem;
      font-weight: 600;
      color: #999;
    `;
    cell.textContent = day;
    weekdayRow.appendChild(cell);
  });
  calendar.appendChild(weekdayRow);

  // Days grid
  const daysGrid = document.createElement('div');
  daysGrid.style.cssText = `
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: 2px;
    flex-grow: 1; /* Take up remaining space */
  `;

  // Empty cells
  for (let i = 0; i < firstDay; i++) {
    const empty = document.createElement('div');
    empty.style.cssText = 'height: 20px; width: 100%;';
    daysGrid.appendChild(empty);
  }

  // Days
  for (let day = 1; day <= daysInMonth; day++) {
    const isToday = day === currentDay;
    const cell = document.createElement('div');

    cell.style.cssText = `
      width: 100%; /* Ensure full width */
      height: 20px; /* FIXED HEIGHT instead of aspect-ratio */
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      font-size: ${isToday ? '0.85rem' : '0.6rem'};
      font-weight: ${isToday ? '900' : '500'};
      color: ${isToday ? 'white' : '#333'};
      background: ${isToday ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' : 'transparent'};
      cursor: pointer;
      transition: all 0.3s ease;
      transform: ${isToday ? 'scale(1.1)' : 'scale(1)'};
      box-shadow: ${isToday ? '0 2px 8px rgba(102, 126, 234, 0.5)' : 'none'};
    `;

    cell.textContent = day;

    if (!isToday) {
      cell.addEventListener('mouseenter', () => {
        cell.style.background = '#e8f0fe';
        cell.style.transform = 'scale(1.05)';
      });
      cell.addEventListener('mouseleave', () => {
        cell.style.background = 'transparent';
        cell.style.transform = 'scale(1)';
      });
    }

    if (isToday) {
      const style = document.createElement('style');
      style.textContent = `@keyframes pulse { 0%, 100% { transform: scale(1.1); } 50% { transform: scale(1.15); } }`;
      if (!document.getElementById('calendar-pulse')) {
        style.id = 'calendar-pulse';
        document.head.appendChild(style);
      }
      cell.style.animation = 'pulse 2s ease-in-out infinite';
    }

    daysGrid.appendChild(cell);
  }

  calendar.appendChild(daysGrid);

  // Add to footer
  const footer = document.querySelector('footer');
  if (footer) {
    footer.appendChild(calendar);

    // Use JS to measure and scale
    setTimeout(() => {
      // 1. Get natural height of the calendar
      const calHeight = calendar.offsetHeight;

      // 2. Get available height in footer (minus margins)
      const footerHeight = footer.offsetHeight;
      const availableHeight = footerHeight - 14; // 7px margin top + bottom

      // 3. Scale if needed
      if (calHeight > availableHeight && availableHeight > 0) {
        const scale = availableHeight / calHeight;
        calendar.style.transform = `translateY(-50%) scale(${scale})`;
      } else {
        calendar.style.transform = `translateY(-50%) scale(1)`;
      }

      console.log(`Calendar adjusted: Natural ${calHeight}px, Available ${availableHeight}px, Scale ${calHeight > availableHeight ? (availableHeight / calHeight).toFixed(2) : 1}`);
    }, 100);
  }

  console.log('Calendar created with CSS-based sizing');
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(createMiniCalendar, 500);
});

// Update on language change
window.addEventListener('languageChanged', () => {
  const existing = document.getElementById('mini-calendar-widget');
  if (existing) existing.remove();
  createMiniCalendar();
});

// Recreate on resize
window.addEventListener('resize', () => {
  const existing = document.getElementById('mini-calendar-widget');
  if (existing) existing.remove();
  setTimeout(createMiniCalendar, 100);
});
