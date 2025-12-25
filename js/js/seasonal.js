// Seasonal Background System with Month Names in Selected Language
const seasonalBackgrounds = {
    months: {
        1: { image: 'january.png', theme: 'winter' },
        2: { image: 'february.png', theme: 'winter' },
        3: { image: 'march.png', theme: 'spring' },
        4: { image: 'april.png', theme: 'spring' },
        5: { image: 'may.png', theme: 'spring' },
        6: { image: 'june.png', theme: 'summer' },
        7: { image: 'july.png', theme: 'summer' },
        8: { image: 'august.png', theme: 'summer' },
        9: { image: 'september.png', theme: 'autumn' },
        10: { image: 'october.png', theme: 'autumn' },
        11: { image: 'november.png', theme: 'autumn' },
        12: { image: 'december.png', theme: 'winter' }
    },

    monthNames: {
        en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
        ro: ['Ianuarie', 'Februarie', 'Martie', 'Aprilie', 'Mai', 'Iunie', 'Iulie', 'August', 'Septembrie', 'Octombrie', 'Noiembrie', 'Decembrie'],
        fr: ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'],
        de: ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'],
        es: ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'],
        zh: ['一月', '二月', '三月', '四月', '五月', '六月', '七月', '八月', '九月', '十月', '十一月', '十二月'],
        ja: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'],
        ko: ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월']
    }
};

function setSeasonalBackground() {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // 1-12
    const monthData = seasonalBackgrounds.months[currentMonth];

    if (!monthData) return;

    // Set background image
    // Set background image
    const targetElement = document.body; // Changed from .hero-section to body
    if (targetElement) {
        targetElement.style.backgroundImage = `url('assets/images/seasonal/${monthData.image}')`;
        targetElement.style.backgroundSize = 'cover'; // Cover full page
        targetElement.style.backgroundPosition = 'center top'; // Start from top
        targetElement.style.backgroundRepeat = 'no-repeat';
        targetElement.style.backgroundAttachment = 'fixed'; // Keep background fixed while scrolling
    }

    // Month display removed - now shown in calendar widget
}

// Update month display when language changes
function updateMonthDisplay() {
    const monthDisplay = document.getElementById('current-month-display');
    if (monthDisplay) {
        const currentDate = new Date();
        const currentMonth = currentDate.getMonth() + 1;
        const monthName = seasonalBackgrounds.monthNames['en'][currentMonth - 1];
        monthDisplay.textContent = `📅 ${monthName}`;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', setSeasonalBackground);

// Update when language changes
window.addEventListener('languageChanged', updateMonthDisplay);
