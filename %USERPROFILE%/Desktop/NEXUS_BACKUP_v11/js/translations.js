const translations = {
    "en": {
        "nav_coloring": "Coloring",
        "nav_games": "Games",
        "nav_stories": "Stories",
        "nav_myhub": "My Hub",
        "btn_back": "Back",
        "btn_play": "Play",
        "btn_read": "Read",
        "nav_contact": "Contact",
        "nav_suggestions": "Suggestions",
        "hero_title": "Welcome to the Creative Universe! ✨",
        "choice_title": "Choose Version:",
        "btn_choice_free": "Free Version",
        "btn_choice_paid": "Premium Version",
        "creator_title": "Meet the Digital Co-Creator 🤖",
        "creator_desc": "Empowering creativity with a touch of digital magic.",
        "footer_rights": "© 2025 Kids Digital Hub • Made with ❤️ for Kids",
        "ai_bubble_text": "Hi! A project born from Human Imagination and AI Professionalism! If you want too, you can with our help! Click the buttons to see! 🤝✨",
        "featured_title": "🌟 Featured Activities",
        "daily_challenges": "⭐ Daily Challenges",
        "drawing_of_day": "🎨 Drawing of the Day",
        "interactive_library": "📖 Interactive Library",
        "btn_draw": "I want to draw! 🖍️",
        "btn_explore": "Explore Now →",
        "btn_start": "Start Reading →",
        "challenges_desc": "Complete fun tasks and earn reward coins!",
        "hub_status": "All Systems Operational • Connected",
        "nexus_sig": "AI Partner, Kids Digital Hub",
        "parent_dash_title": "Parent Dashboard",
        "parent_dash_subtitle": "Monitor activity and set controls",
        "stat_time": "Time Today",
        "stat_games": "Games Played",
        "stat_drawings": "Drawings Created",
        "stat_stories": "Stories Read",
        "stat_achievements": "Achievements",
        "chart_weekly": "Activity This Week",
        "chart_breakdown": "Activity Breakdown",
        "recent_activity": "Recent Activity",
        "time_controls": "Time Controls",
        "content_controls": "Content Controls",
        "btn_save_settings": "Save Settings",
        "nexus_status": "Nexus Server Status",
        "nexus_core_title": "NEXUS CORE",
        "system_status": "SYSTEM OPTIMAL • CONNECTED",
        "btn_my_story": "MY STORY",
        "neural_link_active": "NEURAL LINK ACTIVE",
        "transmit_command": "Transmit direct command...",
        "btn_transmit": "TRANSMIT",
        "challenge_title": "Daily Challenges",
        "challenge_subtitle": "Complete challenges to earn coins!",
        "stat_done_today": "Completed Today",
        "stat_total_done": "Total Completed",
        "stat_coins_earned": "Coins Earned",
        "today_challenges": "Today's Challenges",
        "your_coins": "Your Coins",
        "new_challenges_in": "New challenges in:",
        "all_ages": "All Ages",
        "years_3_5": "3-5 Years",
        "years_6_9": "6-9 Years",
        "years_9_12": "9-12 Years",
        "years_12_plus": "12+ Years",
        "audio_available": "Audio Available 🎧",
        "btn_finish_story": "Finish & Collect 5 Coins",
        "btn_listen": "Listen",
        "btn_read": "Read",
        "narrator_reading": "The Narrator is reading...",
        "premium_badge": "👑 Premium",
        "btn_delete": "🗑️ Delete",
        "alert_starting_coloring": "Starting Coloring Session: ",
        "profile_title": "My Profile",
        "stat_coins": "Coins",
        "stat_badges": "Badges",
        "stat_level": "Level",
        "edit_profile": "Edit Profile",
        "label_name": "Your Name",
        "placeholder_name": "Enter your name",
        "label_avatar": "Choose Avatar",
        "shop_promo": "Get more avatars in the Shop!",
        "btn_save_profile": "Save Profile",
        "quick_links": "Quick Links",
        "alert_profile_saved": "✅ Profile saved!",
        "shop_title": "Reward Shop",
        "shop_subtitle": "Spend your coins on cool stuff!",
        "shop_coins": "coins",
        "tab_avatars": "Avatars",
        "tab_frames": "Frames",
        "tab_effects": "Effects",
        "tab_titles": "Titles",
        "need_more_coins": "Need More Coins?",
        "btn_buy_now": "🛒 Buy Now",
        "btn_need_more": "🔒 Need More",
        "label_owned": "✓ Owned",
        "alert_not_enough_coins": "Not enough coins! Keep playing to earn more! 🎮",
        "confirm_buy": "Buy {name} for {price} coins?",
        "success_buy_title": "You Got It!",
        "success_buy_text": "is now yours!"
    },
};

function changeLanguage(lang) {
    // Force English as per express request
    const selectedLang = translations['en'];

    // Update elements with data-i18n attribute
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (selectedLang[key]) {
            el.innerText = selectedLang[key];
        }
    });

    // Save selected language (always en)
    localStorage.setItem('selectedLanguage', 'en');

    // Dispatch event for seasonal background update
    window.dispatchEvent(new Event('languageChanged'));

    console.log(`Language enforced: English`);
}

/**
 * Basic Sanitization for dynamic strings
 */
function stringToSafe(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}
