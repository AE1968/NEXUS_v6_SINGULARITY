function detectLanguage(text) {
    if (/[ăâîșț]/i.test(text)) return "ro-RO";
    if (/[ñáéíóú]/i.test(text)) return "es-ES";
    if (/[äöüß]/i.test(text)) return "de-DE";
    if (/[éèêàç]/i.test(text)) return "fr-FR";
    return "en-US";
}

function setLanguage(lang) {
    currentLang = lang;
    recognition.lang = lang;
    console.log("Language changed to:", lang);
}
