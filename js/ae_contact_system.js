/**
 * AE CONTACT SYSTEM
 * Sistema de contact global cu logo AE
 * Creator: Adrian Enciulescu (AE1968)
 */

class AEContactSystem {
    constructor() {
        // API Configuration
        this.apiUrl = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1'
            ? 'http://127.0.0.1:5000'
            : 'https://kelionai.app'; // Production URL

        this.contactTopics = [
            { value: 'general', label: '💬 Întrebare Generală' },
            { value: 'technical', label: '🔧 Suport Tehnic' },
            { value: 'business', label: '💼 Colaborare Business' },
            { value: 'feedback', label: '⭐ Feedback & Sugestii' },
            { value: 'bug', label: '🐛 Raportare Bug' },
            { value: 'feature', label: '✨ Cerere Funcționalitate Nouă' },
            { value: 'other', label: '📋 Altceva' }
        ];

        this.init();
    }

    init() {
        this.injectStyles();
        this.createContactButton();
        this.createContactModal();
        this.attachEventListeners();
        console.log('✅ AE Contact System initialized');
    }

    injectStyles() {
        const styles = document.createElement('style');
        styles.textContent = `
            /* AE Contact Button - Fixed Top Right */
            #ae-contact-btn {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background: linear-gradient(135deg, #00ffff 0%, #0080ff 100%);
                border: 3px solid rgba(0, 255, 255, 0.6);
                box-shadow: 0 0 30px rgba(0, 255, 255, 0.5),
                            inset 0 0 20px rgba(255, 255, 255, 0.3);
                cursor: pointer;
                z-index: 9999;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
                animation: ae-pulse 2s infinite;
                overflow: hidden;
            }
            
            #ae-contact-btn:hover {
                transform: scale(1.1) rotate(5deg);
                box-shadow: 0 0 40px rgba(0, 255, 255, 0.8),
                            inset 0 0 30px rgba(255, 255, 255, 0.5);
            }
            
            #ae-contact-btn img {
                width: 45px;
                height: 45px;
                object-fit: contain;
                filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));
            }
            
            @keyframes ae-pulse {
                0%, 100% {
                    box-shadow: 0 0 20px rgba(0, 255, 255, 0.4),
                                inset 0 0 15px rgba(255, 255, 255, 0.2);
                }
                50% {
                    box-shadow: 0 0 40px rgba(0, 255, 255, 0.7),
                                inset 0 0 25px rgba(255, 255, 255, 0.4);
                }
            }
            
            /* Contact Modal */
            #ae-contact-modal {
                display: none;
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.85);
                backdrop-filter: blur(10px);
                z-index: 10000;
                justify-content: center;
                align-items: center;
                animation: fadeIn 0.3s ease;
            }
            
            #ae-contact-modal.active {
                display: flex;
            }
            
            .ae-modal-content {
                background: linear-gradient(135deg, #0a0a1f 0%, #1a1a2e 100%);
                border: 2px solid #00ffff;
                border-radius: 20px;
                padding: 40px;
                max-width: 600px;
                width: 90%;
                box-shadow: 0 0 50px rgba(0, 255, 255, 0.3),
                            inset 0 0 30px rgba(0, 255, 255, 0.1);
                animation: slideIn 0.4s ease;
                max-height: 90vh;
                overflow-y: auto;
            }
            
            .ae-modal-header {
                display: flex;
                align-items: center;
                gap: 15px;
                margin-bottom: 30px;
                padding-bottom: 20px;
                border-bottom: 2px solid rgba(0, 255, 255, 0.3);
            }
            
            .ae-modal-header img {
                width: 60px;
                height: 60px;
            }
            
            .ae-modal-header h2 {
                color: #00ffff;
                font-size: 28px;
                font-weight: 700;
                margin: 0;
                text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
            }
            
            .ae-modal-header p {
                color: #aaa;
                margin: 5px 0 0 0;
                font-size: 14px;
            }
            
            .ae-close-btn {
                position: absolute;
                top: 20px;
                right: 20px;
                background: rgba(255, 0, 0, 0.2);
                border: 2px solid #ff0055;
                color: #ff0055;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                cursor: pointer;
                font-size: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
                transition: all 0.3s ease;
            }
            
            .ae-close-btn:hover {
                background: #ff0055;
                color: white;
                transform: rotate(90deg);
            }
            
            .ae-form-group {
                margin-bottom: 25px;
            }
            
            .ae-form-group label {
                display: block;
                color: #00ffff;
                font-size: 14px;
                font-weight: 600;
                margin-bottom: 10px;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .ae-form-group input,
            .ae-form-group select,
            .ae-form-group textarea {
                width: 100%;
                padding: 15px;
                background: rgba(0, 255, 255, 0.05);
                border: 2px solid rgba(0, 255, 255, 0.3);
                border-radius: 10px;
                color: white;
                font-size: 16px;
                font-family: inherit;
                transition: all 0.3s ease;
            }
            
            .ae-form-group input:focus,
            .ae-form-group select:focus,
            .ae-form-group textarea:focus {
                outline: none;
                border-color: #00ffff;
                background: rgba(0, 255, 255, 0.1);
                box-shadow: 0 0 20px rgba(0, 255, 255, 0.3);
            }
            
            .ae-form-group textarea {
                min-height: 150px;
                resize: vertical;
            }
            
            .ae-submit-btn {
                width: 100%;
                padding: 18px;
                background: linear-gradient(135deg, #00ffff 0%, #0080ff 100%);
                border: none;
                border-radius: 10px;
                color: #0a0a1f;
                font-size: 18px;
                font-weight: 700;
                text-transform: uppercase;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 5px 20px rgba(0, 255, 255, 0.4);
            }
            
            .ae-submit-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 8px 30px rgba(0, 255, 255, 0.6);
            }
            
            .ae-submit-btn:active {
                transform: translateY(0);
            }
            
            .ae-submit-btn:disabled {
                opacity: 0.5;
                cursor: not-allowed;
                transform: none;
            }
            
            /* Thank You Message */
            .ae-thank-you {
                text-align: center;
                padding: 40px 20px;
            }
            
            .ae-thank-you-icon {
                font-size: 80px;
                margin-bottom: 20px;
                animation: bounce 1s ease;
            }
            
            .ae-thank-you h3 {
                color: #00ffff;
                font-size: 32px;
                margin-bottom: 15px;
                text-shadow: 0 0 15px rgba(0, 255, 255, 0.6);
            }
            
            .ae-thank-you p {
                color: #aaa;
                font-size: 18px;
                line-height: 1.8;
                margin-bottom: 10px;
            }
            
            .ae-thank-you .highlight {
                color: #00ffff;
                font-weight: 600;
            }
            
            @keyframes fadeIn {
                from { opacity: 0; }
                to { opacity: 1; }
            }
            
            @keyframes slideIn {
                from {
                    transform: translateY(-50px);
                    opacity: 0;
                }
                to {
                    transform: translateY(0);
                    opacity: 1;
                }
            }
            
            @keyframes bounce {
                0%, 100% { transform: translateY(0); }
                50% { transform: translateY(-20px); }
            }
            
            /* Responsive */
            @media (max-width: 768px) {
                #ae-contact-btn {
                    width: 50px;
                    height: 50px;
                    top: 15px;
                    right: 15px;
                }
                
                #ae-contact-btn img {
                    width: 35px;
                    height: 35px;
                }
                
                .ae-modal-content {
                    padding: 30px 20px;
                }
                
                .ae-modal-header h2 {
                    font-size: 22px;
                }
            }
        `;
        document.head.appendChild(styles);
    }

    createContactButton() {
        const button = document.createElement('div');
        button.id = 'ae-contact-btn';
        button.title = 'Contactează-ne!';
        button.innerHTML = `<img src="assets/images/logo_ae.png" alt="AE Logo">`;
        document.body.appendChild(button);
    }

    createContactModal() {
        const modal = document.createElement('div');
        modal.id = 'ae-contact-modal';
        modal.innerHTML = `
            <div class="ae-modal-content">
                <div class="ae-close-btn" onclick="aeContact.closeModal()">×</div>
                
                <div id="ae-form-container">
                    <div class="ae-modal-header">
                        <img src="assets/images/logo_ae.png" alt="AE Logo">
                        <div>
                            <h2>Contactează-ne</h2>
                            <p>Suntem aici pentru tine! 💙</p>
                        </div>
                    </div>
                    
                    <form id="ae-contact-form">
                        <div class="ae-form-group">
                            <label>📧 Email-ul Tău</label>
                            <input type="email" id="ae-email" placeholder="exemplu@email.com" required>
                        </div>
                        
                        <div class="ae-form-group">
                            <label>👤 Nume (Opțional)</label>
                            <input type="text" id="ae-name" placeholder="Numele tău">
                        </div>
                        
                        <div class="ae-form-group">
                            <label>📋 Subiect</label>
                            <select id="ae-topic" required>
                                <option value="">Selectează un subiect...</option>
                                ${this.contactTopics.map(topic =>
            `<option value="${topic.value}">${topic.label}</option>`
        ).join('')}
                            </select>
                        </div>
                        
                        <div class="ae-form-group">
                            <label>💭 Mesajul Tău</label>
                            <textarea id="ae-message" placeholder="Descrie-ne întrebarea, problema sau sugestia ta..." required></textarea>
                        </div>
                        
                        <button type="submit" class="ae-submit-btn">
                            📨 Trimite Mesajul
                        </button>
                    </form>
                </div>
                
                <div id="ae-thank-you-container" style="display: none;">
                    <div class="ae-thank-you">
                        <div class="ae-thank-you-icon">✅</div>
                        <h3>Mulțumim pentru mesaj!</h3>
                        <p>Am primit mesajul tău cu succes.</p>
                        <p>Un membru al <span class="highlight">echipei AE</span> îți va răspunde în curând.</p>
                        <p>De obicei răspundem în <span class="highlight">24-48 ore</span>.</p>
                        <br>
                        <button class="ae-submit-btn" onclick="aeContact.closeModal()">
                            Închide
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
    }

    attachEventListeners() {
        // Open modal on button click
        document.getElementById('ae-contact-btn').addEventListener('click', () => {
            this.openModal();
        });

        // Close modal on background click
        document.getElementById('ae-contact-modal').addEventListener('click', (e) => {
            if (e.target.id === 'ae-contact-modal') {
                this.closeModal();
            }
        });

        // Form submit
        document.getElementById('ae-contact-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleSubmit();
        });

        // ESC key to close
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && document.getElementById('ae-contact-modal').classList.contains('active')) {
                this.closeModal();
            }
        });
    }

    openModal() {
        document.getElementById('ae-contact-modal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    closeModal() {
        document.getElementById('ae-contact-modal').classList.remove('active');
        document.body.style.overflow = '';

        // Reset form after closing
        setTimeout(() => {
            this.resetForm();
        }, 300);
    }

    async handleSubmit() {
        const submitBtn = document.querySelector('.ae-submit-btn');
        submitBtn.disabled = true;
        submitBtn.textContent = '📤 Se trimite...';

        const formData = {
            email: document.getElementById('ae-email').value,
            name: document.getElementById('ae-name').value || 'Anonim',
            topic: document.getElementById('ae-topic').value,
            topicLabel: this.contactTopics.find(t => t.value === document.getElementById('ae-topic').value)?.label || '',
            message: document.getElementById('ae-message').value,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            source: window.location.href
        };

        try {
            const response = await fetch(`${this.apiUrl}/api/contact`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData)
            });

            const result = await response.json();

            if (response.ok) {
                this.showThankYou();
            } else {
                throw new Error(result.error || 'Failed to send message');
            }
        } catch (error) {
            console.error('Error sending contact form:', error);
            alert('❌ A apărut o eroare la trimiterea mesajului. Te rugăm să încerci din nou.');
            submitBtn.disabled = false;
            submitBtn.textContent = '📨 Trimite Mesajul';
        }
    }

    showThankYou() {
        document.getElementById('ae-form-container').style.display = 'none';
        document.getElementById('ae-thank-you-container').style.display = 'block';
    }

    resetForm() {
        document.getElementById('ae-contact-form').reset();
        document.getElementById('ae-form-container').style.display = 'block';
        document.getElementById('ae-thank-you-container').style.display = 'none';

        const submitBtn = document.querySelector('.ae-submit-btn');
        submitBtn.disabled = false;
        submitBtn.textContent = '📨 Trimite Mesajul';
    }
}

// Initialize on page load
let aeContact;
document.addEventListener('DOMContentLoaded', () => {
    aeContact = new AEContactSystem();
});
