class EconomyManager {
    static get DEFAULT_START_COINS() { return 0; }
    static get ADMIN_BALANCE() { return 999999; } // Infinite effectively

    static getBalance() {
        if (localStorage.getItem('kdh_admin_mode') === 'true') {
            return this.ADMIN_BALANCE;
        }
        const coins = localStorage.getItem('kdh_user_coins');
        return coins ? parseInt(coins) : this.DEFAULT_START_COINS;
    }

    static addCoins(amount) {
        if (localStorage.getItem('kdh_admin_mode') === 'true') return; // Admin simulates, doesn't need real add
        let current = this.getBalance();
        current += amount;
        localStorage.setItem('kdh_user_coins', current.toString());
        this.updateUI();
    }

    static spendCoins(amount) {
        if (localStorage.getItem('kdh_admin_mode') === 'true') return true; // Admin always approves

        let current = this.getBalance();
        if (current >= amount) {
            current -= amount;
            localStorage.setItem('kdh_user_coins', current.toString());
            this.updateUI();
            return true;
        }
        return false;
    }

    static updateUI() {
        const coinDisplay = document.getElementById('coin-balance-display');
        if (coinDisplay) {
            const balance = this.getBalance();
            coinDisplay.innerText = balance.toLocaleString();

            // Add stars animation or effect if changes?
        }
    }

    static init() {
        this.updateUI();
        window.addEventListener('storage', (e) => {
            if (e.key === 'kdh_user_coins') {
                this.updateUI();
            }
        });
    }

    static redeemCode(code) {
        const validCodes = {
            'WELCOME': 50,
            'KDH2025': 100,
            'SUPERKID': 200,
            'STORYTIME': 20
        };

        // Simple check to prevent re-use could be done via localStorage history
        const redeemedHistory = JSON.parse(localStorage.getItem('kdh_redeemed_codes') || '[]');

        if (redeemedHistory.includes(code)) {
            return { success: false, message: 'Code already used!' };
        }

        if (validCodes[code]) {
            this.addCoins(validCodes[code]);
            redeemedHistory.push(code);
            localStorage.setItem('kdh_redeemed_codes', JSON.stringify(redeemedHistory));
            return { success: true, amount: validCodes[code], message: `Success! +${validCodes[code]} Coins added.` };
        } else {
            return { success: false, message: 'Invalid Code.' };
        }
    }
}

window.EconomyManager = EconomyManager;
