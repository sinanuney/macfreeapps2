// AI Assistant for Mac Free Apps - Natural Language Data Extraction
class AIAssistant {
    constructor() {
        this.isActive = false;
        this.conversationHistory = [];
        this.currentContext = null;
        this.deepSeekAI = new DeepSeekAI();
        this.loadSettings();
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadConversationHistory();
    }

    loadSettings() {
        const savedSettings = localStorage.getItem('aiSettings');
        if (savedSettings) {
            try {
                const settings = JSON.parse(savedSettings);
                this.deepSeekAI.apiKey = settings.apiKey || this.deepSeekAI.apiKey;
                this.deepSeekAI.model = settings.model || this.deepSeekAI.model;
                this.deepSeekAI.temperature = settings.temperature || this.deepSeekAI.temperature;
                this.deepSeekAI.maxTokens = settings.maxTokens || this.deepSeekAI.maxTokens;
                
                // Re-validate API key
                this.deepSeekAI.isValid = false;
                this.deepSeekAI.validateApiKey();
            } catch (error) {
                console.warn('AI settings load error:', error);
            }
        }
    }

    bindEvents() {
        // AI toggle button
        document.getElementById('aiToggleBtn')?.addEventListener('click', () => {
            this.toggleAI();
        });

        // Send message
        document.getElementById('aiSendBtn')?.addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key to send
        document.getElementById('aiInput')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Clear conversation
        document.getElementById('aiClearBtn')?.addEventListener('click', () => {
            this.clearConversation();
        });
    }

    toggleAI() {
        this.isActive = !this.isActive;
        const aiPanel = document.getElementById('aiPanel');
        const aiToggleBtn = document.getElementById('aiToggleBtn');
        
        if (this.isActive) {
            aiPanel.style.display = 'block';
            aiToggleBtn.innerHTML = '<i class="fas fa-robot"></i> AI Kapat';
            aiToggleBtn.classList.add('active');
            this.addAIMessage('Merhaba! Ben Mac Free Apps AI asistanınızım. Size nasıl yardımcı olabilirim?');
        } else {
            aiPanel.style.display = 'none';
            aiToggleBtn.innerHTML = '<i class="fas fa-robot"></i> AI Aç';
            aiToggleBtn.classList.remove('active');
        }
    }

    async sendMessage() {
        const input = document.getElementById('aiInput');
        const message = input.value.trim();
        
        if (!message) return;

        // Add user message
        this.addUserMessage(message);
        input.value = '';

        // Show typing indicator
        this.showTypingIndicator();

        try {
            // Process message with AI
            const response = await this.processMessage(message);
            this.hideTypingIndicator();
            this.addAIMessage(response);
        } catch (error) {
            this.hideTypingIndicator();
            this.addAIMessage(`Üzgünüm, bir hata oluştu: ${error.message}`);
        }
    }

    async processMessage(message) {
        try {
            // Get current context
            const context = {
                apps: this.getApps(),
                currentTime: new Date().toLocaleString('tr-TR'),
                userAgent: navigator.userAgent
            };

            // Send to DeepSeek AI
            const aiResponse = await this.deepSeekAI.sendMessage(message, context);
            const parsedResponse = this.deepSeekAI.parseResponse(aiResponse);

            // Handle AI response
            switch (parsedResponse.action) {
                case 'add_app':
                    return await this.handleAddApp(parsedResponse, message);
                case 'search_app':
                    return await this.handleSearchApp(parsedResponse, message);
                case 'edit_app':
                    return await this.handleUpdateApp(parsedResponse, message);
                case 'delete_app':
                    return await this.handleDeleteApp(parsedResponse, message);
                case 'list_apps':
                    return await this.handleListApps(parsedResponse, message);
                case 'chat':
                default:
                    return parsedResponse.message || aiResponse;
            }
        } catch (error) {
            console.error('AI Processing Error:', error);
            return `Üzgünüm, bir hata oluştu: ${error.message}. Lütfen tekrar deneyin.`;
        }
    }

    recognizeIntent(message) {
        // Add app patterns
        if (this.matchesPattern(message, ['ekle', 'yeni', 'ekleyebilir', 'ekleyelim', 'ekleme'])) {
            return { type: 'add_app', confidence: 0.9 };
        }
        
        // Search patterns
        if (this.matchesPattern(message, ['ara', 'bul', 'göster', 'listele', 'hangi'])) {
            return { type: 'search_app', confidence: 0.8 };
        }
        
        // Update patterns
        if (this.matchesPattern(message, ['güncelle', 'düzenle', 'değiştir', 'güncelleme'])) {
            return { type: 'update_app', confidence: 0.8 };
        }
        
        // Delete patterns
        if (this.matchesPattern(message, ['sil', 'kaldır', 'çıkar', 'silme'])) {
            return { type: 'delete_app', confidence: 0.8 };
        }
        
        // List patterns
        if (this.matchesPattern(message, ['listele', 'göster', 'tüm', 'hepsi', 'kategoriler'])) {
            return { type: 'list_apps', confidence: 0.7 };
        }
        
        // Help patterns
        if (this.matchesPattern(message, ['yardım', 'help', 'nasıl', 'ne yapabilir', 'komutlar'])) {
            return { type: 'help', confidence: 0.9 };
        }
        
        // Greeting patterns
        if (this.matchesPattern(message, ['merhaba', 'selam', 'hello', 'hi', 'hey'])) {
            return { type: 'greeting', confidence: 0.9 };
        }
        
        return { type: 'unknown', confidence: 0.1 };
    }

    matchesPattern(message, patterns) {
        return patterns.some(pattern => message.includes(pattern));
    }

    async handleAddApp(parsedResponse, message) {
        const appName = parsedResponse.appName;
        
        if (!appName) {
            return `Hangi uygulamayı eklemek istiyorsunuz? Lütfen uygulama adını belirtin. Örnek: "Canva uygulamasını ekle"`;
        }

        // Try to find app in App Store
        try {
            const appData = await this.searchAppStore(appName);
            if (appData) {
                // Auto-fill form
                this.autoFillForm(appData);
                return `✅ "${appData.name}" uygulaması bulundu ve forma otomatik olarak eklendi! Formu kontrol edip kaydedebilirsiniz.`;
            } else {
                return `❌ "${appName}" uygulaması App Store'da bulunamadı. Lütfen uygulama adını kontrol edin veya manuel olarak ekleyin.`;
            }
        } catch (error) {
            return `❌ Uygulama aranırken bir hata oluştu: ${error.message}`;
        }
    }

    async handleSearchApp(parsedResponse, message) {
        const searchTerm = parsedResponse.searchTerm;
        const apps = this.getApps();
        
        if (!searchTerm) {
            return `Hangi uygulamayı arıyorsunuz? Örnek: "Canva uygulamasını ara"`;
        }

        const results = apps.filter(app => 
            app.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.category.toLowerCase().includes(searchTerm.toLowerCase())
        );

        if (results.length === 0) {
            return `❌ "${searchTerm}" için uygulama bulunamadı.`;
        }

        let response = `🔍 "${searchTerm}" için ${results.length} uygulama bulundu:\n\n`;
        results.forEach((app, index) => {
            response += `${index + 1}. **${app.name}**\n`;
            response += `   📝 ${app.description}\n`;
            response += `   🏷️ Kategori: ${this.getCategoryName(app.category)}\n`;
            response += `   ⭐ Değerlendirme: ${app.rating || 'N/A'}/5\n\n`;
        });

        return response;
    }

    async handleUpdateApp(parsedResponse, message) {
        const appName = parsedResponse.appName;
        const apps = this.getApps();
        const app = apps.find(a => a.name.toLowerCase().includes(appName.toLowerCase()));

        if (!app) {
            return `❌ "${appName}" uygulaması bulunamadı.`;
        }

        // Open edit modal
        this.openEditModal(app.id);
        return `✅ "${app.name}" uygulaması düzenleme modunda açıldı.`;
    }

    async handleDeleteApp(parsedResponse, message) {
        const appName = parsedResponse.appName;
        const apps = this.getApps();
        const app = apps.find(a => a.name.toLowerCase().includes(appName.toLowerCase()));

        if (!app) {
            return `❌ "${appName}" uygulaması bulunamadı.`;
        }

        // Confirm deletion
        this.currentContext = { action: 'delete', appId: app.id, appName: app.name };
        return `⚠️ "${app.name}" uygulamasını silmek istediğinizden emin misiniz? "Evet" yazın.`;
    }

    async handleListApps(parsedResponse, message) {
        const apps = this.getApps();
        const category = parsedResponse.category;
        
        if (apps.length === 0) {
            return `📱 Henüz uygulama eklenmemiş.`;
        }

        let filteredApps = apps;
        if (category && category !== 'all') {
            filteredApps = apps.filter(app => 
                app.category.toLowerCase().includes(category.toLowerCase()) ||
                this.getCategoryName(app.category).toLowerCase().includes(category.toLowerCase())
            );
        }

        if (filteredApps.length === 0) {
            return `❌ "${category}" kategorisinde uygulama bulunamadı.`;
        }

        let response = `📱 ${category ? `"${category}" kategorisinde` : 'Toplam'} ${filteredApps.length} uygulama:\n\n`;
        
        // Group by category
        const categories = {};
        filteredApps.forEach(app => {
            if (!categories[app.category]) {
                categories[app.category] = [];
            }
            categories[app.category].push(app);
        });

        Object.keys(categories).forEach(cat => {
            response += `**${this.getCategoryName(cat)}** (${categories[cat].length} uygulama):\n`;
            categories[cat].forEach(app => {
                response += `• ${app.name}\n`;
            });
            response += `\n`;
        });

        return response;
    }

    handleHelp(intent, message) {
        return `🤖 **Mac Free Apps AI Asistanı Komutları:**

**📱 Uygulama Yönetimi:**
• "Canva uygulamasını ekle" - Uygulama ekleme
• "Canva uygulamasını ara" - Uygulama arama
• "Canva uygulamasını düzenle" - Uygulama düzenleme
• "Canva uygulamasını sil" - Uygulama silme

**📋 Listeleme:**
• "Tüm uygulamaları listele" - Tüm uygulamaları göster
• "Verimlilik uygulamalarını göster" - Kategoriye göre listele

**🔍 Arama:**
• "Tasarım uygulamaları" - Kategori arama
• "Ücretsiz uygulamalar" - Fiyat arama

**💡 Örnekler:**
• "Notion uygulamasını ekle"
• "Tasarım uygulamalarını listele"
• "Spotify uygulamasını düzenle"

Nasıl yardımcı olabilirim?`;
    }

    handleGreeting(intent, message) {
        return `👋 Merhaba! Ben Mac Free Apps AI asistanınızım. 

Size şu konularda yardımcı olabilirim:
• 📱 Uygulama ekleme ve düzenleme
• 🔍 Uygulama arama ve listeleme
• 📊 Kategori bazlı filtreleme
• ⚙️ Uygulama yönetimi

Ne yapmak istiyorsunuz?`;
    }

    handleUnknown(intent, message) {
        return `🤔 Anlayamadım. Lütfen daha açık bir şekilde yazın.

**Örnekler:**
• "Canva uygulamasını ekle"
• "Tüm uygulamaları listele"
• "Yardım" yazın

Nasıl yardımcı olabilirim?`;
    }

    extractAppInfo(message) {
        // Extract app name from message
        const appName = this.extractAppName(message);
        const category = this.extractCategory(message);
        
        return {
            name: appName,
            category: category
        };
    }

    extractAppName(message) {
        // Common patterns for app names
        const patterns = [
            /"([^"]+)"/g,  // Quoted names
            /([A-Z][a-zA-Z\s]+) uygulamasını/g,  // "AppName uygulamasını"
            /([A-Z][a-zA-Z\s]+) uygulaması/g,    // "AppName uygulaması"
            /([A-Z][a-zA-Z\s]+) ekle/g,          // "AppName ekle"
        ];

        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match) {
                return match[1]?.trim();
            }
        }

        return null;
    }

    extractCategory(message) {
        const categories = {
            'verimlilik': 'productivity',
            'tasarım': 'design',
            'geliştirme': 'development',
            'eğlence': 'entertainment',
            'araçlar': 'utilities',
            'güvenlik': 'security'
        };

        for (const [tr, en] of Object.entries(categories)) {
            if (message.includes(tr)) {
                return en;
            }
        }

        return null;
    }

    extractSearchTerm(message) {
        // Extract search term from message
        const patterns = [
            /"([^"]+)"/g,
            /([A-Z][a-zA-Z\s]+) uygulamasını ara/g,
            /([A-Z][a-zA-Z\s]+) ara/g,
        ];

        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match) {
                return match[1]?.trim();
            }
        }

        return null;
    }

    async searchAppStore(appName) {
        // Use JSONP API to search for app
        const jsonpApi = new JSONPAppStoreAPI();
        
        // Try to construct App Store URL
        const searchUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(appName)}&country=tr&entity=software&limit=1`;
        
        try {
            const response = await fetch(`https://api.allorigins.win/raw?url=${encodeURIComponent(searchUrl)}`);
            const data = await response.json();
            
            if (data.results && data.results.length > 0) {
                const app = data.results[0];
                return this.formatAppData(app, `https://apps.apple.com/tr/app/id${app.trackId}`);
            }
        } catch (error) {
            console.error('App Store search failed:', error);
        }
        
        return null;
    }

    formatAppData(app, originalUrl) {
        return {
            name: app.trackName || '',
            description: this.cleanDescription(app.description || ''),
            icon: this.getAppEmoji(app.trackName, app.primaryGenreName),
            version: app.version || '',
            size: this.formatFileSize(app.fileSizeBytes),
            screenshots: this.getScreenshots(app),
            requirements: this.getRequirements(app),
            developer: app.artistName || '',
            category: this.mapCategory(app.primaryGenreName),
            rating: app.averageUserRating || 0,
            price: this.formatPrice(app.price),
            downloadUrl: originalUrl,
            lastUpdated: this.formatDate(app.lastUpdated),
            releaseDate: this.formatDate(app.releaseDate),
            minimumOsVersion: app.minimumOsVersion || '',
            supportedDevices: this.getSupportedDevices(app)
        };
    }

    autoFillForm(appData) {
        // Fill form with app data
        document.getElementById('appName').value = appData.name || '';
        document.getElementById('appDescription').value = appData.description || '';
        document.getElementById('appIcon').value = appData.icon || '📱';
        document.getElementById('appDownloadUrl').value = appData.downloadUrl || '';
        document.getElementById('appCategory').value = appData.category || 'utilities';
        document.getElementById('appVersion').value = appData.version || '';
        document.getElementById('appSize').value = appData.size || '';
        document.getElementById('appDeveloper').value = appData.developer || '';
        document.getElementById('appRating').value = appData.rating || '';
        document.getElementById('appPrice').value = appData.price || 'Ücretsiz';
        document.getElementById('appScreenshots').value = appData.screenshots ? appData.screenshots.join(', ') : '';
        document.getElementById('appRequirements').value = appData.requirements ? appData.requirements.join('\n') : '';

        // Show success message
        this.showFormSuccess('Form otomatik olarak dolduruldu!');
    }

    openEditModal(appId) {
        // Trigger edit modal
        if (window.adminPanel) {
            window.adminPanel.editApp(appId);
        }
    }

    getApps() {
        const apps = localStorage.getItem('macfreeapps_apps');
        return apps ? JSON.parse(apps) : [];
    }

    getCategoryName(category) {
        const categories = {
            productivity: 'Verimlilik',
            design: 'Tasarım',
            development: 'Geliştirme',
            entertainment: 'Eğlence',
            utilities: 'Araçlar',
            security: 'Güvenlik'
        };
        return categories[category] || category;
    }

    addUserMessage(message) {
        this.addMessage(message, 'user');
        this.conversationHistory.push({ type: 'user', message, timestamp: new Date() });
    }

    addAIMessage(message) {
        this.addMessage(message, 'ai');
        this.conversationHistory.push({ type: 'ai', message, timestamp: new Date() });
        
        // Check if DeepSeek AI is available
        if (this.deepSeekAI && !this.deepSeekAI.isValid) {
            this.addMessage('⚠️ DeepSeek AI şu anda kullanılamıyor. Basit kural tabanlı yanıtlar veriyorum.', 'ai');
        }
    }

    addMessage(message, type) {
        const chatContainer = document.getElementById('aiChatContainer');
        const messageDiv = document.createElement('div');
        messageDiv.className = `ai-message ${type}`;
        
        const messageContent = document.createElement('div');
        messageContent.className = 'ai-message-content';
        messageContent.innerHTML = this.formatMessage(message);
        
        messageDiv.appendChild(messageContent);
        chatContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    formatMessage(message) {
        // Format message with markdown-like syntax
        return message
            .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
            .replace(/\*(.*?)\*/g, '<em>$1</em>')
            .replace(/\n/g, '<br>')
            .replace(/✅/g, '<span class="emoji">✅</span>')
            .replace(/❌/g, '<span class="emoji">❌</span>')
            .replace(/⚠️/g, '<span class="emoji">⚠️</span>')
            .replace(/🔍/g, '<span class="emoji">🔍</span>')
            .replace(/📱/g, '<span class="emoji">📱</span>')
            .replace(/🤖/g, '<span class="emoji">🤖</span>')
            .replace(/💡/g, '<span class="emoji">💡</span>');
    }

    showTypingIndicator() {
        const chatContainer = document.getElementById('aiChatContainer');
        const typingDiv = document.createElement('div');
        typingDiv.className = 'ai-message ai typing-indicator';
        typingDiv.id = 'typingIndicator';
        
        const typingContent = document.createElement('div');
        typingContent.className = 'ai-message-content';
        typingContent.innerHTML = '<i class="fas fa-circle"></i><i class="fas fa-circle"></i><i class="fas fa-circle"></i> AI yazıyor...';
        
        typingDiv.appendChild(typingContent);
        chatContainer.appendChild(typingDiv);
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }

    hideTypingIndicator() {
        const typingIndicator = document.getElementById('typingIndicator');
        if (typingIndicator) {
            typingIndicator.remove();
        }
    }

    clearConversation() {
        const chatContainer = document.getElementById('aiChatContainer');
        chatContainer.innerHTML = '';
        this.conversationHistory = [];
        this.addAIMessage('Konuşma temizlendi. Size nasıl yardımcı olabilirim?');
    }

    loadConversationHistory() {
        // Load conversation history from localStorage
        const history = localStorage.getItem('ai_conversation_history');
        if (history) {
            this.conversationHistory = JSON.parse(history);
        }
    }

    saveConversationHistory() {
        // Save conversation history to localStorage
        localStorage.setItem('ai_conversation_history', JSON.stringify(this.conversationHistory));
    }

    // Helper methods (same as in other classes)
    cleanDescription(description) {
        return description
            .replace(/<[^>]*>/g, '')
            .replace(/\s+/g, ' ')
            .trim()
            .substring(0, 200) + '...';
    }

    formatFileSize(bytes) {
        if (!bytes) return '';
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(1024));
        return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
    }

    getScreenshots(app) {
        const screenshots = [];
        for (let i = 1; i <= 5; i++) {
            const screenshot = app[`screenshot${i}Url`];
            if (screenshot) {
                screenshots.push(screenshot);
            }
        }
        return screenshots;
    }

    getRequirements(app) {
        const requirements = [];
        if (app.minimumOsVersion) {
            requirements.push(`macOS ${app.minimumOsVersion} veya üzeri`);
        }
        if (app.fileSizeBytes) {
            requirements.push(`En az ${this.formatFileSize(app.fileSizeBytes)} boş alan`);
        }
        return requirements;
    }

    mapCategory(genre) {
        const categoryMap = {
            'Productivity': 'productivity',
            'Business': 'productivity',
            'Graphics & Design': 'design',
            'Photo & Video': 'design',
            'Developer Tools': 'development',
            'Utilities': 'utilities',
            'Entertainment': 'entertainment',
            'Music': 'entertainment',
            'Games': 'entertainment',
            'Security': 'security',
            'Finance': 'utilities',
            'Education': 'utilities',
            'Lifestyle': 'utilities'
        };

        for (const [key, value] of Object.entries(categoryMap)) {
            if (genre && genre.includes(key)) {
                return value;
            }
        }
        return 'utilities';
    }

    formatPrice(price) {
        if (price === 0) return 'Ücretsiz';
        return `${price} ₺`;
    }

    formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('tr-TR');
    }

    getSupportedDevices(app) {
        const devices = [];
        if (app.supportedDevices) {
            app.supportedDevices.forEach(device => {
                if (device.includes('Mac')) {
                    devices.push(device);
                }
            });
        }
        return devices;
    }

    getAppEmoji(appName, genre) {
        const emojiMap = {
            'productivity': '📝',
            'design': '🎨',
            'development': '💻',
            'entertainment': '🎵',
            'utilities': '🔧',
            'security': '🔒'
        };

        const nameEmojis = {
            'canva': '🎨',
            'davinci': '🎬',
            'resolve': '🎬',
            'photoshop': '🖼️',
            'illustrator': '✏️',
            'sketch': '🎨',
            'figma': '🎨',
            'notion': '📝',
            'slack': '💬',
            'spotify': '🎵',
            'vscode': '💻',
            'xcode': '💻',
            'safari': '🌐',
            'chrome': '🌐',
            'firefox': '🦊',
            'zoom': '📹',
            'teams': '👥',
            'discord': '💬',
            'whatsapp': '💬',
            'telegram': '✈️'
        };

        const lowerName = (appName || '').toLowerCase();
        for (const [key, emoji] of Object.entries(nameEmojis)) {
            if (lowerName.includes(key)) {
                return emoji;
            }
        }

        return emojiMap[this.mapCategory(genre)] || '📱';
    }

    showFormSuccess(message) {
        // Show success message in form
        const successDiv = document.createElement('div');
        successDiv.className = 'ai-success-message';
        successDiv.textContent = message;
        successDiv.style.cssText = `
            background: #c6f6d5;
            color: #38a169;
            padding: 10px;
            border-radius: 4px;
            margin: 10px 0;
            border-left: 4px solid #38a169;
        `;
        
        const form = document.querySelector('.app-form');
        form.insertBefore(successDiv, form.firstChild);
        
        setTimeout(() => {
            successDiv.remove();
        }, 5000);
    }
}

// Make it globally available
window.AIAssistant = AIAssistant;
