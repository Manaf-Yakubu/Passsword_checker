// Password Forge - Main JavaScript File

class PasswordForge {
    constructor() {
        this.init();
        this.setupEventListeners();
        this.startTypingAnimation();
    }

    init() {
        // Character sets for password generation
        this.charSets = {
            uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            lowercase: 'abcdefghijklmnopqrstuvwxyz',
            numbers: '0123456789',
            symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
            ambiguous: 'il1Lo0O'
        };

        // Common words for passphrase generation
        this.commonWords = [
            'apple', 'brave', 'cloud', 'dance', 'eagle', 'flame', 'grace', 'heart',
            'image', 'jewel', 'knife', 'light', 'magic', 'night', 'ocean', 'peace',
            'quick', 'river', 'storm', 'tiger', 'unity', 'voice', 'water', 'youth',
            'zebra', 'amber', 'beach', 'coral', 'dream', 'earth', 'frost', 'green',
            'honey', 'ivory', 'jade', 'karma', 'lunar', 'maple', 'noble', 'opal'
        ];

        // Get DOM elements
        this.elements = {
            // Generator elements
            lengthSlider: document.getElementById('lengthSlider'),
            lengthValue: document.getElementById('lengthValue'),
            uppercase: document.getElementById('uppercase'),
            lowercase: document.getElementById('lowercase'),
            numbers: document.getElementById('numbers'),
            symbols: document.getElementById('symbols'),
            avoidAmbiguous: document.getElementById('avoidAmbiguous'),
            passphrase: document.getElementById('passphrase'),
            passphraseControls: document.getElementById('passphraseControls'),
            wordCount: document.getElementById('wordCount'),
            wordCountValue: document.getElementById('wordCountValue'),
            generatedPassword: document.getElementById('generatedPassword'),
            generateBtn: document.getElementById('generateBtn'),
            copyBtn: document.getElementById('copyBtn'),

            // Checker elements
            passwordToCheck: document.getElementById('passwordToCheck'),
            toggleVisibility: document.getElementById('toggleVisibility'),
            strengthFill: document.getElementById('strengthFill'),
            strengthLabel: document.getElementById('strengthLabel'),
            metricsGrid: document.getElementById('metricsGrid'),
            scoreValue: document.getElementById('scoreValue'),
            entropyValue: document.getElementById('entropyValue'),
            crackTimeValue: document.getElementById('crackTimeValue'),
            suggestions: document.getElementById('suggestions'),
            suggestionsList: document.getElementById('suggestionsList'),

            // Animation elements
            typedText: document.getElementById('typedText')
        };
    }

    setupEventListeners() {
        // Generator event listeners
        this.elements.lengthSlider.addEventListener('input', () => {
            this.elements.lengthValue.textContent = this.elements.lengthSlider.value;
        });

        this.elements.wordCount.addEventListener('input', () => {
            this.elements.wordCountValue.textContent = this.elements.wordCount.value;
        });

        this.elements.passphrase.addEventListener('change', () => {
            this.elements.passphraseControls.style.display = 
                this.elements.passphrase.checked ? 'block' : 'none';
        });

        this.elements.generateBtn.addEventListener('click', () => {
            this.generatePassword();
        });

        this.elements.copyBtn.addEventListener('click', () => {
            this.copyToClipboard();
        });

        // Checker event listeners
        this.elements.passwordToCheck.addEventListener('input', () => {
            this.checkPasswordStrength();
        });

        this.elements.toggleVisibility.addEventListener('click', () => {
            this.togglePasswordVisibility();
        });

        // No initial password generation - user must click generate
    }

    // Typing animation for header
    startTypingAnimation() {
        const text = 'Bitplas • Password Forge — Generated locally. Hardened for you.';
        let index = 0;
        
        const typeChar = () => {
            if (index < text.length) {
                this.elements.typedText.textContent += text.charAt(index);
                index++;
                setTimeout(typeChar, 50 + Math.random() * 50);
            }
        };
        
        typeChar();
    }

    // Password Generation
    generatePassword() {
        if (this.elements.passphrase.checked) {
            this.generatePassphrase();
        } else {
            this.generateRandomPassword();
        }
    }

    generateRandomPassword() {
        const length = parseInt(this.elements.lengthSlider.value);
        let charset = '';

        // Build character set based on selected options
        if (this.elements.uppercase.checked) charset += this.charSets.uppercase;
        if (this.elements.lowercase.checked) charset += this.charSets.lowercase;
        if (this.elements.numbers.checked) charset += this.charSets.numbers;
        if (this.elements.symbols.checked) charset += this.charSets.symbols;

        // Remove ambiguous characters if requested
        if (this.elements.avoidAmbiguous.checked) {
            for (const char of this.charSets.ambiguous) {
                charset = charset.replace(new RegExp(char, 'g'), '');
            }
        }

        if (charset.length === 0) {
            this.elements.generatedPassword.value = 'Please select at least one character type';
            return;
        }

        // Generate password using crypto.getRandomValues for security
        const array = new Uint8Array(length);
        crypto.getRandomValues(array);
        
        let password = '';
        for (let i = 0; i < length; i++) {
            password += charset[array[i] % charset.length];
        }

        this.elements.generatedPassword.value = password;
    }

    generatePassphrase() {
        const wordCount = parseInt(this.elements.wordCount.value);
        const words = [];
        
        // Use crypto.getRandomValues for secure random selection
        const array = new Uint8Array(wordCount);
        crypto.getRandomValues(array);
        
        for (let i = 0; i < wordCount; i++) {
            const randomIndex = array[i] % this.commonWords.length;
            words.push(this.commonWords[randomIndex]);
        }
        
        this.elements.generatedPassword.value = words.join('-');
    }

    // Password Strength Checking
    checkPasswordStrength() {
        const password = this.elements.passwordToCheck.value;
        
        if (!password) {
            this.resetStrengthMeter();
            return;
        }

        const analysis = this.analyzePassword(password);
        this.updateStrengthMeter(analysis);
        this.showMetrics(analysis);
        this.showSuggestions(analysis);
    }

    analyzePassword(password) {
        const length = password.length;
        const hasLower = /[a-z]/.test(password);
        const hasUpper = /[A-Z]/.test(password);
        const hasNumbers = /\d/.test(password);
        const hasSymbols = /[^a-zA-Z0-9]/.test(password);
        const hasRepeating = /(.)\1{2,}/.test(password);
        const hasSequential = this.hasSequentialChars(password);
        const hasCommonPatterns = this.hasCommonPatterns(password);

        // Calculate character space
        let charSpace = 0;
        if (hasLower) charSpace += 26;
        if (hasUpper) charSpace += 26;
        if (hasNumbers) charSpace += 10;
        if (hasSymbols) charSpace += 32;

        // Calculate entropy
        const entropy = length * Math.log2(charSpace);
        
        // Calculate crack time (simplified model)
        const guessesPerSecond = 1e9; // 1 billion guesses per second
        const totalCombinations = Math.pow(charSpace, length);
        const crackTimeSeconds = totalCombinations / (2 * guessesPerSecond);

        // Calculate score (0-100)
        let score = 0;
        
        // Length scoring
        if (length >= 8) score += 25;
        if (length >= 12) score += 25;
        if (length >= 16) score += 25;
        if (length >= 20) score += 25;

        // Character variety scoring
        if (hasLower) score += 5;
        if (hasUpper) score += 5;
        if (hasNumbers) score += 5;
        if (hasSymbols) score += 10;

        // Penalty for weaknesses
        if (hasRepeating) score -= 15;
        if (hasSequential) score -= 10;
        if (hasCommonPatterns) score -= 20;
        if (length < 8) score -= 25;

        score = Math.max(0, Math.min(100, score));

        return {
            score,
            entropy: Math.round(entropy * 10) / 10,
            crackTime: this.formatCrackTime(crackTimeSeconds),
            length,
            hasLower,
            hasUpper,
            hasNumbers,
            hasSymbols,
            hasRepeating,
            hasSequential,
            hasCommonPatterns,
            charSpace
        };
    }

    hasSequentialChars(password) {
        const sequences = ['abc', '123', 'qwe', 'asd', 'zxc'];
        const lowerPassword = password.toLowerCase();
        
        for (const seq of sequences) {
            if (lowerPassword.includes(seq)) return true;
        }
        
        // Check for ascending/descending sequences
        for (let i = 0; i < password.length - 2; i++) {
            const char1 = password.charCodeAt(i);
            const char2 = password.charCodeAt(i + 1);
            const char3 = password.charCodeAt(i + 2);
            
            if ((char2 === char1 + 1 && char3 === char2 + 1) ||
                (char2 === char1 - 1 && char3 === char2 - 1)) {
                return true;
            }
        }
        
        return false;
    }

    hasCommonPatterns(password) {
        const commonPatterns = [
            /password/i, /123456/, /qwerty/i, /admin/i, /login/i,
            /welcome/i, /monkey/i, /letmein/i, /dragon/i, /master/i
        ];
        
        return commonPatterns.some(pattern => pattern.test(password));
    }

    formatCrackTime(seconds) {
        if (seconds < 1) return 'Instant';
        if (seconds < 60) return `${Math.round(seconds)} seconds`;
        if (seconds < 3600) return `${Math.round(seconds / 60)} minutes`;
        if (seconds < 86400) return `${Math.round(seconds / 3600)} hours`;
        if (seconds < 31536000) return `${Math.round(seconds / 86400)} days`;
        if (seconds < 31536000000) return `${Math.round(seconds / 31536000)} years`;
        return 'Centuries';
    }

    updateStrengthMeter(analysis) {
        const { score } = analysis;
        const percentage = score;
        
        this.elements.strengthFill.style.width = `${percentage}%`;
        
        let label, className;
        if (score < 20) {
            label = 'Very Weak';
            className = 'strength-weak';
        } else if (score < 40) {
            label = 'Weak';
            className = 'strength-weak';
        } else if (score < 60) {
            label = 'Fair';
            className = 'strength-fair';
        } else if (score < 80) {
            label = 'Good';
            className = 'strength-good';
        } else if (score < 95) {
            label = 'Strong';
            className = 'strength-strong';
        } else {
            label = 'Elite';
            className = 'strength-elite';
        }
        
        this.elements.strengthLabel.textContent = `${label} (${score}/100)`;
        this.elements.strengthLabel.className = `strength-label ${className}`;
    }

    showMetrics(analysis) {
        this.elements.metricsGrid.style.display = 'grid';
        this.elements.scoreValue.textContent = `${analysis.score}/100`;
        this.elements.entropyValue.textContent = `${analysis.entropy} bits`;
        this.elements.crackTimeValue.textContent = analysis.crackTime;
    }

    showSuggestions(analysis) {
        const suggestions = [];
        
        if (analysis.length < 12) {
            suggestions.push('Increase length to 12+ characters for better security');
        }
        if (analysis.length < 16) {
            suggestions.push('Consider 16+ characters for long-term resilience');
        }
        if (!analysis.hasUpper) {
            suggestions.push('Add uppercase letters (A-Z)');
        }
        if (!analysis.hasLower) {
            suggestions.push('Add lowercase letters (a-z)');
        }
        if (!analysis.hasNumbers) {
            suggestions.push('Include numbers (0-9)');
        }
        if (!analysis.hasSymbols) {
            suggestions.push('Add special symbols (!@#$%^&*)');
        }
        if (analysis.hasRepeating) {
            suggestions.push('Avoid repeating characters (aaa, 111)');
        }
        if (analysis.hasSequential) {
            suggestions.push('Avoid sequential patterns (abc, 123, qwe)');
        }
        if (analysis.hasCommonPatterns) {
            suggestions.push('Avoid common words and patterns');
        }
        if (analysis.score >= 95) {
            suggestions.push('Excellent! This password is very strong.');
        }

        if (suggestions.length > 0) {
            this.elements.suggestions.style.display = 'block';
            this.elements.suggestionsList.innerHTML = suggestions
                .map(suggestion => `<li>${suggestion}</li>`)
                .join('');
        } else {
            this.elements.suggestions.style.display = 'none';
        }
    }

    resetStrengthMeter() {
        this.elements.strengthFill.style.width = '0%';
        this.elements.strengthLabel.textContent = 'Enter password to analyze';
        this.elements.strengthLabel.className = 'strength-label';
        this.elements.metricsGrid.style.display = 'none';
        this.elements.suggestions.style.display = 'none';
    }

    // Utility Functions
    async copyToClipboard() {
        const password = this.elements.generatedPassword.value;
        
        if (!password || password.includes('Please select')) {
            return;
        }

        try {
            await navigator.clipboard.writeText(password);
            this.showCopySuccess();
        } catch (err) {
            // Fallback for older browsers
            this.elements.generatedPassword.select();
            document.execCommand('copy');
            this.showCopySuccess();
        }
    }

    showCopySuccess() {
        this.elements.copyBtn.classList.add('copy-success');
        
        // Change icon to checkmark temporarily
        const originalHTML = this.elements.copyBtn.innerHTML;
        this.elements.copyBtn.innerHTML = `
            <svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <polyline points="20,6 9,17 4,12"/>
            </svg>
        `;
        
        setTimeout(() => {
            this.elements.copyBtn.classList.remove('copy-success');
            this.elements.copyBtn.innerHTML = originalHTML;
        }, 1500);
    }

    togglePasswordVisibility() {
        const input = this.elements.passwordToCheck;
        const isPassword = input.type === 'password';
        
        input.type = isPassword ? 'text' : 'password';
        
        // Update icon
        const icon = this.elements.toggleVisibility.querySelector('.eye-icon');
        if (isPassword) {
            // Show eye-off icon
            icon.innerHTML = `
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
                <path d="M21 2L3 20"/>
            `;
        } else {
            // Show eye icon
            icon.innerHTML = `
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                <circle cx="12" cy="12" r="3"/>
            `;
        }
    }
}

// Matrix Rain Animation (Optional - Low CPU)
class MatrixRain {
    constructor() {
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.zIndex = '-1';
        this.canvas.style.opacity = '0.1';
        this.canvas.style.pointerEvents = 'none';
        
        document.body.appendChild(this.canvas);
        
        this.resize();
        this.init();
        
        window.addEventListener('resize', () => this.resize());
        
        // Respect reduced motion preference
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            this.animate();
        }
    }
    
    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }
    
    init() {
        this.columns = Math.floor(this.canvas.width / 20);
        this.drops = new Array(this.columns).fill(1);
        this.chars = '01アイウエオカキクケコサシスセソタチツテトナニヌネノハヒフヘホマミムメモヤユヨラリルレロワヲン';
    }
    
    animate() {
        this.ctx.fillStyle = 'rgba(10, 10, 15, 0.05)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.fillStyle = '#00f5ff';
        this.ctx.font = '15px monospace';
        
        for (let i = 0; i < this.drops.length; i++) {
            const text = this.chars[Math.floor(Math.random() * this.chars.length)];
            this.ctx.fillText(text, i * 20, this.drops[i] * 20);
            
            if (this.drops[i] * 20 > this.canvas.height && Math.random() > 0.975) {
                this.drops[i] = 0;
            }
            this.drops[i]++;
        }
        
        setTimeout(() => requestAnimationFrame(() => this.animate()), 50);
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    new PasswordForge();
    
    // Add matrix rain effect if user doesn't prefer reduced motion
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        new MatrixRain();
    }
});

// Service Worker Registration for PWA (Optional)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('SW registered'))
            .catch(error => console.log('SW registration failed'));
    });
}
