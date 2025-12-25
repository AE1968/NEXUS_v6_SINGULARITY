// Speech-to-Text
const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
const recognition = new SpeechRecognition();

recognition.continuous = true;
recognition.interimResults = false;
recognition.lang = "ro-RO";

let currentLang = "ro-RO";
let currentGender = "male"; // Default to male

recognition.onresult = (event) => {
    const text = event.results[event.results.length - 1][0].transcript;
    handleUserInput(text);
};

recognition.onerror = (event) => {
    console.error("Speech Recognition Error:", event.error);
};

function startListening() {
    try {
        recognition.start();
        console.log("Voice recognition active...");
    } catch (e) {
        console.log("Recognition already started or failed.");
    }
}

// Global function to set gender
window.setVoiceGender = function (gender) {
    if (gender === 'male' || gender === 'female') {
        currentGender = gender;
        console.log(`Voice set to: ${currentGender}`);
    }
}

// Text-to-Speech
function speak(text, lang = currentLang) {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = lang;

    const voices = speechSynthesis.getVoices();
    let preferredVoice = null;

    // Simplistic heuristic for gendered voices
    if (currentGender === 'male') {
        preferredVoice = voices.find(v =>
            v.lang.startsWith(lang.split("-")[0]) &&
            (v.name.toLowerCase().includes("male") || v.name.toLowerCase().includes("david") || v.name.toLowerCase().includes("mark"))
        );
    } else {
        // Female
        preferredVoice = voices.find(v =>
            v.lang.startsWith(lang.split("-")[0]) &&
            (v.name.toLowerCase().includes("female") || v.name.toLowerCase().includes("ioana") || v.name.toLowerCase().includes("monica") || v.name.toLowerCase().includes("zira"))
        );
    }

    // Fallback if specific gender not found, just get any voice for the lang
    if (!preferredVoice) {
        preferredVoice = voices.find(v => v.lang.startsWith(lang.split("-")[0]));
    }

    if (preferredVoice) utter.voice = preferredVoice;

    // Pitch adjustments for effect
    if (currentGender === 'male') {
        utter.pitch = 0.9;
        utter.rate = 0.95;
    } else {
        utter.pitch = 1.1;
        utter.rate = 1.0;
    }

    speechSynthesis.speak(utter);
}
