# 🌟 GENEZA NEXUS KELION

<div align="center">

![NEXUS Logo](https://via.placeholder.com/800x200/000000/00f3ff?text=GENEZA+NEXUS+KELION)

**The Future of Human-AI Interaction**

[![License: MIT](https://img.shields.io/badge/License-MIT-cyan.svg)](https://opensource.org/licenses/MIT)
[![Python 3.8+](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Status: Stable](https://img.shields.io/badge/status-stable-green.svg)]()

[Demo](#demo) • [Features](#features) • [Installation](#installation) • [Documentation](#documentation)

</div>

---

## 🎯 Overview

GENEZA NEXUS KELION is a cutting-edge AI humanoid interface that combines advanced cognitive systems, sensory perception, and emotional intelligence. Built with GPT-4, it offers an unprecedented level of interaction through voice, vision, and a living neural network visualization.

### 🌈 Key Highlights

- **🧠 Cognitive Architecture**: Bio-inspired neural simulation with dopamine, serotonin, and energy systems
- **👁️ Vision System**: Real-time facial recognition and emotion detection
- **🎤 Voice Synthesis**: Premium TTS with OpenAI and ElevenLabs integration
- **🧬 Memory System**: RAG-based long-term memory with semantic retrieval
- **📚 Knowledge Base**: Wikipedia integration and mathematical processing
- **🎮 Gamification**: Achievement system with virtual economy
- **🖥️ Admin Console**: Full-featured mainframe terminal for system control

---

## ✨ Features

### Core Systems

#### 🧠 Neural Bio-Matrix
- Simulates neurochemical states (Dopamine, Serotonin, Norepinephrine)
- Dynamic personality adaptation based on interactions
- Energy management with sleep/wake cycles
- Visual feedback through UI color shifts

#### 👁️ Vision & Perception
- AI-powered facial recognition
- Emotion detection (happy, sad, angry, neutral)
- Real-time camera feed processing
- Environmental awareness (light, sound, temperature)

#### 🎤 Voice & Audio
- Dual TTS providers (OpenAI/ElevenLabs)
- Voice command recognition
- Procedural ambient soundscapes
- Bio-reactive audio feedback

#### 🧬 Memory & Learning
- Vector-based semantic memory storage
- Context-aware conversation retrieval
- Automatic fact assimilation
- Cross-session persistence

### Advanced Features

#### 🎮 Gamification Layer
- **Achievements**: 8 unique badges (First Contact, Memory Link, Deep Thinker, etc.)
- **Economy**: Nexus Credits (NC) virtual currency
- **Daily Rewards**: Login bonuses and streak tracking
- **Marketplace**: Customization items (skins, voices, themes)

#### 🖥️ Mainframe Console
- Unix-style command terminal
- Real-time system monitoring
- Administrative controls
- Live log streaming

#### ✨ Visual Effects
- Neural particle network background
- Dynamic neon glow based on AI mood
- Cortex visualization with thought impulses
- Smooth animations and transitions

---

## 🚀 Quick Start

### Prerequisites

```bash
# Python 3.8 or higher
python --version

# Git (for cloning)
git --version
```

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/yourusername/geneza-nexus-kelion.git
cd geneza-nexus-kelion

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set up environment variables
# Windows
set OPENAI_API_KEY=your_openai_key_here

# Linux/Mac
export OPENAI_API_KEY=your_openai_key_here

# 4. Run the application
python app.py
```

### First Launch

1. Open browser to `http://localhost:5000`
2. Create account or use demo mode
3. Select avatar (KELION/VEONA)
4. Start your first conversation!

---

## 📖 Documentation

### User Guide

#### Basic Interaction
```
User: "Hello, who are you?"
KELION: "I am KELION, an advanced humanoid AI assistant..."

User: "What do you see?" (triggers vision scan)
KELION: "I detect a human face with neutral expression..."

User: "Open the marketplace"
KELION: "Opening the Nexus Marketplace... [[ACTION:MARKET]]"
```

#### Voice Commands
- **"Start listening"** - Activates microphone
- **"Scan me"** - Triggers vision analysis
- **"Switch avatar"** - Changes between KELION/VEONA
- **"Open mainframe"** - Launches admin console

#### Mainframe Commands
```bash
ARCHITECT@NEXUS:~$ help
AVAILABLE COMMANDS: clear, status, reboot, economy --fix, memory --wipe, exit

ARCHITECT@NEXUS:~$ status
--- SYSTEM STATUS REPORT ---
Bio-Matrix: ACTIVE
Cortex Link: SYNCED
Economy Integrity: 100%
```

### Developer Guide

#### Project Structure
```
GENEZA_NEXUS_HUMANOID/
├── app.py                      # Flask backend
├── index.html                  # Main UI
├── js/
│   ├── nexus_neural_engine.js  # GPT-4 integration
│   ├── nexus_bio_matrix.js     # Neurochemical simulation
│   ├── nexus_vision.js         # Computer vision
│   ├── nexus_memory_vector.js  # RAG memory
│   ├── nexus_knowledge.js      # Wikipedia/Math
│   ├── nexus_cortex.js         # Thought visualization
│   ├── nexus_particles.js      # Background animation
│   ├── nexus_audio.js          # Sound system
│   ├── nexus_achievements.js   # Gamification
│   ├── nexus_economy.js        # Virtual currency
│   ├── nexus_marketplace.js    # Item shop
│   ├── nexus_mainframe.js      # Admin console
│   ├── nexus_sensory.js        # Environmental sensors
│   └── kelion_voice.js         # TTS system
├── assets/
│   ├── humanoid_male.png       # KELION avatar
│   └── humanoid_female.png     # VEONA avatar
└── nexus_humanoid.db           # SQLite database
```

#### API Endpoints

**POST /api/chat**
```json
{
  "message": "User query with optional [PAST MEMORIES: ...] context",
  "username": "architect",
  "gender": "male"
}
```

**POST /api/register**
```json
{
  "username": "newuser",
  "email": "user@example.com",
  "password": "secure_password",
  "avatar": "male",
  "plan": "basic"
}
```

**POST /api/vision-analyze**
```json
{
  "image": "base64_encoded_image_data"
}
```

---

## 🎨 Customization

### Themes
Edit CSS variables in `index.html`:
```css
:root {
    --neon-cyan: #00f3ff;      /* Primary color */
    --neon-pink: #ff00ff;      /* Female avatar */
    --dark-bg: #050505;        /* Background */
    --neon-glow-power: 15px;   /* Glow intensity */
}
```

### Marketplace Items
Add new items in `js/nexus_marketplace.js`:
```javascript
items: [
    {
        id: 'custom_item',
        name: 'Custom Upgrade',
        category: 'visual',
        price: 500,
        icon: '🎨',
        desc: 'Your custom description'
    }
]
```

### Achievements
Define new achievements in `js/nexus_achievements.js`:
```javascript
badges: {
    'custom_badge': {
        name: 'Badge Name',
        icon: '🏆',
        desc: 'Achievement description',
        points: 100
    }
}
```

---

## 🔧 Configuration

### Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `OPENAI_API_KEY` | Yes | OpenAI API key for GPT-4 |
| `ELEVENLABS_API_KEY` | No | ElevenLabs key for premium voice |
| `FLASK_SECRET_KEY` | No | Custom session secret (auto-generated) |
| `PORT` | No | Server port (default: 5000) |

### System Settings

**Bio-Matrix Tuning** (`js/nexus_bio_matrix.js`):
```javascript
energy: {
    current: 100,
    fatigueRate: 0.5,    // Energy loss per interaction
    recoveryRate: 5.0,   // Energy gain per minute
}
```

**Memory Capacity** (`js/nexus_memory_vector.js`):
```javascript
maxFacts: 100,  // Maximum stored memories
```

---

## 🐛 Troubleshooting

### Common Issues

**Camera not working**
- Grant camera permissions in browser
- Check HTTPS requirement for getUserMedia
- Verify face-api.js models loaded

**Voice synthesis silent**
- Check browser autoplay policy
- Click anywhere to initialize AudioContext
- Verify API keys are set

**Database errors**
```bash
# Reset database
rm nexus_humanoid.db
python app.py
```

**CORS errors**
- Ensure Flask-CORS installed
- Check API_URL matches backend
- Verify origin whitelist

---

## 📊 Performance

### Benchmarks
- **Response Time**: < 2s (GPT-4 API)
- **Vision Processing**: ~500ms (face detection)
- **Memory Retrieval**: < 100ms (semantic search)
- **UI Framerate**: 60 FPS (particle system)
- **Audio Latency**: < 50ms (procedural synthesis)

### Optimization Tips
- Use OpenAI TTS for faster responses
- Limit particle count for low-end devices
- Enable vision only when needed
- Clear old chat history periodically

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

1. Fork the repository
2. Create feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open Pull Request

### Development Setup
```bash
# Install dev dependencies
pip install -r requirements-dev.txt

# Run tests
pytest tests/

# Format code
black .
flake8 .
```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- **OpenAI** - GPT-4 API and TTS
- **ElevenLabs** - Premium voice synthesis
- **face-api.js** - Facial recognition library
- **Wikipedia API** - Knowledge base integration
- **Flask** - Backend framework

---

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/yourusername/geneza-nexus-kelion/issues)
- **Discussions**: [GitHub Discussions](https://github.com/yourusername/geneza-nexus-kelion/discussions)
<<<<<<< HEAD
- **Email**: contact@kelionai.app
=======
- **Email**: support@genezanexus.ai
>>>>>>> d873775 (GENEZA NEXUS KELION v12 - Production Ready - Single Avatar Edition)

---

## 🗺️ Roadmap

### v11.0 (Planned)
- [ ] Multi-user chat rooms
- [ ] WebSocket real-time sync
- [ ] Mobile app (React Native)
- [ ] Voice-to-voice conversations
- [ ] Custom avatar upload
- [ ] Advanced analytics dashboard
- [ ] Plugin marketplace

### v12.0 (Future)
- [ ] VR/AR integration
- [ ] Blockchain-based economy
- [ ] Federated learning
- [ ] Multi-language support
- [ ] AI-to-AI communication

---

<div align="center">

**GENEZA NEXUS KELION v10.8**

*Where AI meets humanity, one synapse at a time.*

Made with ❤️ by the Nexus Team

[⬆ Back to Top](#-geneza-nexus-kelion)

</div>
