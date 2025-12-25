# Contributing to NEXUS v7.0

Thank you for your interest in contributing to the GENEZA NEXUS project! 🧠

---

## 📋 Table of Contents

1. [Code of Conduct](#code-of-conduct)
2. [Getting Started](#getting-started)
3. [Development Setup](#development-setup)
4. [Making Changes](#making-changes)
5. [Testing](#testing)
6. [Submitting Changes](#submitting-changes)
7. [Coding Standards](#coding-standards)
8. [Architecture Guidelines](#architecture-guidelines)

---

## 🤝 Code of Conduct

This is a personal AI assistant project by Adrian Enciulescu. While contributions are appreciated, please note:

- **Respectful communication**: Be professional and constructive
- **Quality over quantity**: Focus on meaningful improvements
- **Follow guidelines**: Adhere to project architecture and rules
- **Security first**: Never commit sensitive data or API keys

---

## 🚀 Getting Started

### **Prerequisites:**
- Git installed
- Python 3.11+ for backend
- Modern web browser for frontend
- Basic knowledge of:
  - JavaScript (ES6+)
  - Python (Flask)
  - HTML/CSS
  - RESTful APIs

### **Project Structure:**
```
GENEZA_NEXUS_v2_GOLD/
├── backend.py              # Flask API server
├── nexus_core.html         # Main frontend interface
├── js/                     # JavaScript modules
│   ├── nexus_neural_engine.js    # Dual-brain AI core
│   ├── nexus_memory_vector.js    # Long-term memory
│   ├── nexus_agents.js           # Autonomous workers
│   ├── nexus_voice_core.js       # TTS/STT
│   ├── nexus_bio_matrix.js       # Neurochemistry simulation
│   ├── nexus_vision.js           # Face recognition
│   ├── nexus_iot.js              # Smart device control
│   └── nexus_bridge.js           # Auth & diagnostics
├── css/                    # Stylesheets
├── assets/                 # Images, icons
├── requirements.txt        # Python dependencies
└── netlify.toml           # Deployment config
```

---

## 💻 Development Setup

### **1. Clone the Repository**
```bash
git clone https://github.com/AE1968/NEXUS_v7_TRANSCENDENCE.git
cd NEXUS_v7_TRANSCENDENCE
```

### **2. Backend Setup**
```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
# Create .env file (see .env.example)
GOOGLE_API_KEY=your_gemini_key
ANTHROPIC_API_KEY=your_claude_key

# Run backend
python backend.py
```

### **3. Frontend Setup**
```bash
# Option 1: Simple file server
python -m http.server 8000

# Option 2: Live Server (VS Code extension)
# Right-click nexus_core.html → "Open with Live Server"

# Access at: http://localhost:8000/nexus_core.html
```

---

## 🔧 Making Changes

### **Branch Strategy:**
```bash
# Create feature branch
git checkout -b feature/your-feature-name

# Or for bug fixes
git checkout -b fix/bug-description
```

### **Types of Changes:**
- **feat**: New feature
- **fix**: Bug fix
- **docs**: Documentation changes
- **style**: Code formatting (no logic changes)
- **refactor**: Code restructuring
- **perf**: Performance improvements
- **test**: Adding/updating tests
- **chore**: Maintenance tasks

---

## 🧪 Testing

### **Before Submitting:**

1. **Run Test Suite**
   ```bash
   # Open in browser
   test_suite.html
   
   # Run all tests and verify all modules are ✅ ACTIVE
   ```

2. **Manual Testing Checklist**
   - [ ] All modules initialize correctly
   - [ ] Cloud connection works (`raport stare`)
   - [ ] Voice output functional (both EN and RO)
   - [ ] Memory storage/retrieval works
   - [ ] Admin commands execute (`test lie`, `test truth`)
   - [ ] No console errors (F12 Developer Tools)
   - [ ] UI responsive on different screen sizes

3. **Backend Testing**
   ```bash
   # Test health endpoint
   curl http://localhost:5000/health
   
   # Test Gemini endpoint
   curl -X POST http://localhost:5000/api/nexus/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "test", "user_id": "test"}'
   ```

4. **Code Quality**
   - No duplicate code
   - Functions properly documented
   - Clear variable names
   - Error handling implemented

---

## 📤 Submitting Changes

### **Commit Messages:**
Follow conventional commits format:
```
type(scope): brief description

Detailed explanation of changes (if needed)

Fixes #issue_number (if applicable)
```

**Examples:**
```bash
git commit -m "feat(neural-engine): add Claude Sonnet 4.5 routing"
git commit -m "fix(voice): resolve Romanian language detection"
git commit -m "docs(readme): update installation instructions"
```

### **Pull Request Process:**

1. **Update Documentation**
   - Update README.md if needed
   - Add entry to CHANGELOG.md
   - Update MODULE_STATUS_REPORT.md if applicable

2. **Create Pull Request**
   - Clear title and description
   - Reference related issues
   - List all changes made
   - Include screenshots/videos if UI changes

3. **Code Review**
   - Respond to feedback promptly
   - Make requested changes
   - Keep discussion professional

4. **Merge Requirements**
   - All tests passing
   - No merge conflicts
   - Documentation updated
   - Approved by project owner

---

## 📏 Coding Standards

### **JavaScript:**
```javascript
// Use ES6+ features
const myFunction = async (param) => {
    // Use const/let, not var
    const result = await someAsyncOperation();
    
    // Use template literals
    console.log(`Processed: ${result}`);
    
    // Proper error handling
    try {
        return processData(result);
    } catch (e) {
        console.error('Error:', e);
        return null;
    }
};

// Module pattern
const MyModule = {
    config: { /* settings */ },
    
    init: function() {
        console.log('Module initialized');
    },
    
    publicMethod: function() {
        return this._privateMethod();
    },
    
    _privateMethod: function() {
        return 'private';
    }
};

window.MyModule = MyModule;
```

### **Python:**
```python
"""Module docstring."""

import os
from typing import Dict, List
from flask import Flask, request, jsonify

app = Flask(__name__)

@app.route('/api/endpoint', methods=['POST'])
def my_endpoint() -> Dict:
    """
    Endpoint description.
    
    Returns:
        Dict: Response data
    """
    try:
        data = request.json
        result = process_data(data)
        return jsonify({'status': 'success', 'data': result})
    except Exception as e:
        return jsonify({'error': str(e)}), 500

def process_data(data: Dict) -> Dict:
    """Process input data."""
    # Implementation
    return {'processed': True}
```

### **CSS:**
```css
/* Use CSS variables */
:root {
    --neon-blue: #00f3ff;
    --deep-space: #050a14;
}

/* Clear selectors */
.nexus-container {
    background: var(--deep-space);
    border-radius: 10px;
    padding: 20px;
}

/* Responsive design */
@media (max-width: 768px) {
    .nexus-container {
        padding: 10px;
    }
}
```

---

## 🏗️ Architecture Guidelines

### **CRITICAL RULES:**
1. **Cloud First Policy**: All functionality must work with cloud backend
2. **No Local-Only Features**: Everything syncs to Railway
3. **Prime Directives**: Never modify core safety protocols
4. **Module Independence**: Each module should function standalone

### **Adding New Modules:**

```javascript
/**
 * 🆕 NEXUS MODULE NAME v7.0
 * Brief description of module purpose.
 */

const NexusModuleName = {
    // === CONFIGURATION ===
    config: {
        cloudUrl: "https://web-production-b215.up.railway.app",
        enabled: true
    },

    // === STATE ===
    state: {
        initialized: false
    },

    // === PUBLIC API ===
    publicMethod: function() {
        // Implementation
    },

    // === INITIALIZATION ===
    init: function() {
        console.log("🆕 MODULE NAME v7.0: ONLINE");
        this.state.initialized = true;
    }
};

// Expose to window
window.NexusModuleName = NexusModuleName;

// Auto-initialize on load
window.addEventListener('load', () => NexusModuleName.init());
```

### **Updating Existing Modules:**
1. Check `MODULE_STATUS_REPORT.md` for current status
2. Review existing code structure
3. Maintain backward compatibility
4. Update version comments
5. Add to CHANGELOG.md

---

## 🐛 Bug Reports

### **Before Reporting:**
1. Check existing issues
2. Verify on latest version
3. Test in clean environment
4. Check browser console for errors

### **Bug Report Template:**
```markdown
**Description:**
Clear description of the bug

**Steps to Reproduce:**
1. Go to '...'
2. Click on '...'
3. See error

**Expected Behavior:**
What should happen

**Actual Behavior:**
What actually happens

**Environment:**
- Browser: Chrome 120
- OS: Windows 11
- NEXUS Version: 7.0.0

**Console Errors:**
```
[Error messages from F12 console]
```

**Screenshots:**
[If applicable]
```

---

## 💡 Feature Requests

### **Template:**
```markdown
**Feature Description:**
What feature do you want?

**Use Case:**
Why is this needed?

**Proposed Implementation:**
How could this work?

**Alternatives Considered:**
Other approaches?

**Additional Context:**
Any other information?
```

---

## 📚 Resources

- **Project Documentation**: See all `.md` files in root
- **Architecture**: `PROJECT_RULES.md`
- **Admin Commands**: `COMENZI_ADMIN.md`
- **User Commands**: `COMENZI_UTILIZATOR.md`
- **Module Status**: `MODULE_STATUS_REPORT.md`
- **API Docs**: Comments in `backend.py`

---

## 🙏 Thank You!

Your contributions help make NEXUS better for everyone!

**Questions?** 
- Check documentation first
- Open an issue for discussion
- Contact project owner: Adrian Enciulescu

---

**Last Updated**: 2025-12-20  
**Version**: 7.0.0 TRANSCENDENCE  
**Maintainer**: Adrian Enciulescu
