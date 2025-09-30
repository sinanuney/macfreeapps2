// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.adminPassword = 'admin123'; // Güvenlik için değiştirin!
        this.currentEditingId = null;
        this.scraper = new AppStoreScraper();
        this.api = new AppStoreAPI();
        this.jsonpApi = new JSONPAppStoreAPI();
        this.aiAssistant = new AIAssistant();
        this.init();
    }

    init() {
        this.bindEvents();
        this.loadApps();
        this.updateStats();
    }

    bindEvents() {
        // Login form
        document.getElementById('loginForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleLogin();
        });

        // Logout
        document.getElementById('logoutBtn').addEventListener('click', () => {
            this.logout();
        });

        // Add app button
        document.getElementById('addAppBtn').addEventListener('click', () => {
            this.openAppModal();
        });

        // Modal events
        document.getElementById('closeModal').addEventListener('click', () => {
            this.closeAppModal();
        });

        document.getElementById('closeDeleteModal').addEventListener('click', () => {
            this.closeDeleteModal();
        });

        document.getElementById('cancelBtn').addEventListener('click', () => {
            this.closeAppModal();
        });

        document.getElementById('cancelDeleteBtn').addEventListener('click', () => {
            this.closeDeleteModal();
        });

        // App form
        document.getElementById('appForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.saveApp();
        });

        // Delete confirmation
        document.getElementById('confirmDeleteBtn').addEventListener('click', () => {
            this.confirmDelete();
        });

        // App Store scraper
        document.getElementById('scrapeBtn').addEventListener('click', () => {
            this.scrapeAppStore();
        });

        // AI Settings
        document.getElementById('aiSettingsBtn').addEventListener('click', () => {
            this.openAISettings();
        });

        document.getElementById('closeAiSettingsModal').addEventListener('click', () => {
            this.closeAISettings();
        });

        document.getElementById('testApiKeyBtn').addEventListener('click', () => {
            this.testApiKey();
        });

        document.getElementById('saveAiSettingsBtn').addEventListener('click', () => {
            this.saveAISettings();
        });

        // Temperature slider
        document.getElementById('aiTemperature').addEventListener('input', (e) => {
            document.getElementById('temperatureValue').textContent = e.target.value;
        });

        // Close modals on outside click
        document.getElementById('appModal').addEventListener('click', (e) => {
            if (e.target.id === 'appModal') {
                this.closeAppModal();
            }
        });

        document.getElementById('aiSettingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'aiSettingsModal') {
                this.closeAISettings();
            }
        });

        document.getElementById('deleteModal').addEventListener('click', (e) => {
            if (e.target.id === 'deleteModal') {
                this.closeDeleteModal();
            }
        });
    }

    handleLogin() {
        const password = document.getElementById('adminPassword').value;
        const errorDiv = document.getElementById('loginError');

        if (password === this.adminPassword) {
            document.getElementById('loginScreen').style.display = 'none';
            document.getElementById('adminPanel').style.display = 'block';
            errorDiv.style.display = 'none';
            document.getElementById('adminPassword').value = '';
        } else {
            errorDiv.textContent = 'Hatalı şifre!';
            errorDiv.style.display = 'block';
        }
    }

    logout() {
        document.getElementById('loginScreen').style.display = 'flex';
        document.getElementById('adminPanel').style.display = 'none';
        document.getElementById('adminPassword').value = '';
        document.getElementById('loginError').style.display = 'none';
    }

    loadApps() {
        const apps = this.getApps();
        const appsList = document.getElementById('appsList');
        
        if (apps.length === 0) {
            appsList.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-mobile-alt"></i>
                    <h3>Henüz uygulama yok</h3>
                    <p>İlk uygulamanızı eklemek için "Yeni Uygulama" butonuna tıklayın.</p>
                </div>
            `;
            return;
        }

        appsList.innerHTML = apps.map(app => `
            <div class="app-item" data-id="${app.id}">
                <div class="app-item-header">
                    <div class="app-item-info">
                        <div class="app-item-icon">${app.icon}</div>
                        <div class="app-item-details">
                            <h3>${app.name}</h3>
                            <p>${app.description}</p>
                            <small>Kategori: ${this.getCategoryName(app.category)}</small>
                        </div>
                    </div>
                    <div class="app-item-actions">
                        <button class="btn btn-small btn-edit" onclick="adminPanel.editApp('${app.id}')">
                            <i class="fas fa-edit"></i> Düzenle
                        </button>
                        <button class="btn btn-small btn-delete" onclick="adminPanel.deleteApp('${app.id}')">
                            <i class="fas fa-trash"></i> Sil
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }

    openAppModal(appId = null) {
        this.currentEditingId = appId;
        const modal = document.getElementById('appModal');
        const modalTitle = document.getElementById('modalTitle');
        const form = document.getElementById('appForm');

        if (appId) {
            modalTitle.textContent = 'Uygulamayı Düzenle';
            const app = this.getAppById(appId);
            if (app) {
                document.getElementById('appName').value = app.name;
                document.getElementById('appDescription').value = app.description;
                document.getElementById('appIcon').value = app.icon;
                document.getElementById('appDownloadUrl').value = app.downloadUrl || '';
                document.getElementById('appCategory').value = app.category;
            }
        } else {
            modalTitle.textContent = 'Yeni Uygulama Ekle';
            form.reset();
        }

        modal.classList.add('show');
    }

    closeAppModal() {
        document.getElementById('appModal').classList.remove('show');
        this.currentEditingId = null;
    }

    saveApp() {
        const formData = {
            name: document.getElementById('appName').value.trim(),
            description: document.getElementById('appDescription').value.trim(),
            icon: document.getElementById('appIcon').value.trim(),
            downloadUrl: document.getElementById('appDownloadUrl').value.trim(),
            category: document.getElementById('appCategory').value
        };

        // Validation
        if (!formData.name || !formData.description || !formData.icon) {
            alert('Lütfen tüm gerekli alanları doldurun!');
            return;
        }

        if (this.currentEditingId) {
            // Update existing app
            this.updateApp(this.currentEditingId, formData);
        } else {
            // Add new app
            this.addApp(formData);
        }

        this.closeAppModal();
        this.loadApps();
        this.updateStats();
        this.updateMainPage();
    }

    addApp(appData) {
        const apps = this.getApps();
        const newApp = {
            id: this.generateId(),
            ...appData,
            createdAt: new Date().toISOString(),
            views: 0
        };
        apps.push(newApp);
        this.saveApps(apps);
    }

    updateApp(appId, appData) {
        const apps = this.getApps();
        const index = apps.findIndex(app => app.id === appId);
        if (index !== -1) {
            apps[index] = { ...apps[index], ...appData };
            this.saveApps(apps);
        }
    }

    deleteApp(appId) {
        const app = this.getAppById(appId);
        if (app) {
            document.getElementById('deleteAppName').textContent = app.name;
            document.getElementById('deleteModal').classList.add('show');
            this.currentDeletingId = appId;
        }
    }

    confirmDelete() {
        if (this.currentDeletingId) {
            const apps = this.getApps();
            const filteredApps = apps.filter(app => app.id !== this.currentDeletingId);
            this.saveApps(filteredApps);
            this.closeDeleteModal();
            this.loadApps();
            this.updateStats();
            this.updateMainPage();
        }
    }

    closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('show');
        this.currentDeletingId = null;
    }

    editApp(appId) {
        this.openAppModal(appId);
    }

    getApps() {
        const apps = localStorage.getItem('macfreeapps_apps');
        return apps ? JSON.parse(apps) : [];
    }

    saveApps(apps) {
        localStorage.setItem('macfreeapps_apps', JSON.stringify(apps));
    }

    getAppById(id) {
        const apps = this.getApps();
        return apps.find(app => app.id === id);
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
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

    updateStats() {
        const apps = this.getApps();
        const totalViews = apps.reduce((sum, app) => sum + (app.views || 0), 0);
        
        document.getElementById('totalApps').textContent = apps.length;
        document.getElementById('totalViews').textContent = totalViews;
    }

    updateMainPage() {
        // This will be called to update the main page when apps are modified
        // For now, we'll just log it - in a real implementation, you might want to
        // trigger a refresh or send a message to the main page
        console.log('Apps updated, main page should be refreshed');
    }

    async scrapeAppStore() {
        const url = document.getElementById('appStoreUrl').value.trim();
        const errorDiv = document.getElementById('scraperError');
        const method = document.querySelector('input[name="scraperMethod"]:checked').value;

        if (!url) {
            this.showScraperError('Lütfen App Store URL\'si girin');
            return;
        }

        try {
            let appData;
            
            if (method === 'jsonp') {
                // Use JSONP API (fastest, no CORS issues)
                appData = await this.jsonpApi.getAppData(url);
            } else if (method === 'api') {
                // Use iTunes API with CORS proxies
                appData = await this.api.getAppData(url);
            } else {
                // Use web scraper (more detailed but slower)
                appData = await this.scraper.scrapeAppStore(url);
            }
            
            this.populateFormWithScrapedData(appData);
            this.hideScraperError();
        } catch (error) {
            // If web scraper fails, suggest alternatives
            if (method === 'scraper' && error.message.includes('CORS proxy')) {
                this.showScraperError(`
                    ${error.message}
                    
                    💡 Önerilen çözümler:
                    • JSONP API yöntemini deneyin (en hızlı)
                    • iTunes API yöntemini deneyin
                    • Manuel olarak bilgileri girin
                `);
                
                // Auto-suggest JSONP method
                this.suggestAlternativeMethod('jsonp');
            } else if (method === 'api' && error.message.includes('proxy')) {
                this.showScraperError(`
                    ${error.message}
                    
                    💡 Önerilen çözümler:
                    • JSONP API yöntemini deneyin (en hızlı)
                    • Manuel olarak bilgileri girin
                `);
                
                // Auto-suggest JSONP method
                this.suggestAlternativeMethod('jsonp');
            } else {
                this.showScraperError(error.message);
            }
        }
    }

    populateFormWithScrapedData(data) {
        // Fill form fields with scraped data
        document.getElementById('appName').value = data.name || '';
        document.getElementById('appDescription').value = data.description || '';
        
        // Use appropriate emoji method based on data source
        const emoji = data.icon || this.scraper.getAppEmoji(data.name, data.category) || this.api.getAppEmoji(data.name, data.category);
        document.getElementById('appIcon').value = emoji;
        
        document.getElementById('appDownloadUrl').value = data.downloadUrl || '';
        document.getElementById('appCategory').value = data.category || 'utilities';
        
        // Additional fields
        document.getElementById('appVersion').value = data.version || '';
        document.getElementById('appSize').value = data.size || '';
        document.getElementById('appDeveloper').value = data.developer || '';
        document.getElementById('appRating').value = data.rating || '';
        document.getElementById('appPrice').value = data.price || 'Ücretsiz';
        document.getElementById('appScreenshots').value = data.screenshots ? data.screenshots.join(', ') : '';
        document.getElementById('appRequirements').value = data.requirements ? data.requirements.join('\n') : '';

        // Show success message
        this.showScraperSuccess('App Store verileri başarıyla çekildi!');
    }

    showScraperError(message) {
        const errorDiv = document.getElementById('scraperError');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.style.color = '#e53e3e';
    }

    hideScraperError() {
        const errorDiv = document.getElementById('scraperError');
        errorDiv.style.display = 'none';
    }

    showScraperSuccess(message) {
        const errorDiv = document.getElementById('scraperError');
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        errorDiv.style.color = '#38a169';
        errorDiv.style.background = '#c6f6d5';
        errorDiv.style.borderLeftColor = '#38a169';
        
        // Hide success message after 3 seconds
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 3000);
    }

    suggestAlternativeMethod(method) {
        // Add a suggestion button
        const errorDiv = document.getElementById('scraperError');
        const suggestionBtn = document.createElement('button');
        suggestionBtn.textContent = `🔄 ${method.toUpperCase()} yöntemini dene`;
        suggestionBtn.className = 'btn btn-primary';
        suggestionBtn.style.marginTop = '10px';
        suggestionBtn.onclick = () => {
            // Switch to suggested method
            const radio = document.querySelector(`input[name="scraperMethod"][value="${method}"]`);
            if (radio) {
                radio.checked = true;
                // Auto-try the new method
                setTimeout(() => {
                    this.scrapeAppStore();
                }, 500);
            }
        };
        
        // Remove existing suggestion button if any
        const existingBtn = errorDiv.querySelector('.suggestion-btn');
        if (existingBtn) {
            existingBtn.remove();
        }
        
        suggestionBtn.className += ' suggestion-btn';
        errorDiv.appendChild(suggestionBtn);
    }

    // AI Settings Methods
    openAISettings() {
        const modal = document.getElementById('aiSettingsModal');
        modal.style.display = 'block';
        
        // Load current settings
        this.loadAISettings();
    }

    closeAISettings() {
        const modal = document.getElementById('aiSettingsModal');
        modal.style.display = 'none';
    }

    loadAISettings() {
        // Load current API key (masked)
        const currentKey = this.aiAssistant.deepSeekAI.apiKey;
        const maskedKey = currentKey ? currentKey.substring(0, 10) + '...' : '';
        document.getElementById('apiKeyInput').value = currentKey;
        
        // Load current model
        document.getElementById('aiModelSelect').value = this.aiAssistant.deepSeekAI.model;
        
        // Load current temperature
        document.getElementById('aiTemperature').value = this.aiAssistant.deepSeekAI.temperature;
        document.getElementById('temperatureValue').textContent = this.aiAssistant.deepSeekAI.temperature;
        
        // Load current max tokens
        document.getElementById('aiMaxTokens').value = this.aiAssistant.deepSeekAI.maxTokens;
    }

    async testApiKey() {
        const apiKey = document.getElementById('apiKeyInput').value.trim();
        const statusDiv = document.getElementById('apiKeyStatus');
        
        if (!apiKey) {
            this.showApiStatus('Lütfen API key girin.', 'error');
            return;
        }

        // Show testing status
        this.showApiStatus('API key test ediliyor...', 'warning');
        
        try {
            // Create temporary DeepSeek AI instance for testing
            const tempAI = new DeepSeekAI();
            tempAI.apiKey = apiKey;
            
            // Test the API key
            const response = await tempAI.sendMessage('test');
            
            if (response && !response.includes('AI yanıt veremedi')) {
                this.showApiStatus('✅ API key geçerli! DeepSeek AI kullanılabilir.', 'success');
            } else {
                this.showApiStatus('❌ API key geçersiz veya kullanılamıyor.', 'error');
            }
        } catch (error) {
            this.showApiStatus(`❌ API key test hatası: ${error.message}`, 'error');
        }
    }

    saveAISettings() {
        const apiKey = document.getElementById('apiKeyInput').value.trim();
        const model = document.getElementById('aiModelSelect').value;
        const temperature = parseFloat(document.getElementById('aiTemperature').value);
        const maxTokens = parseInt(document.getElementById('aiMaxTokens').value);

        if (!apiKey) {
            this.showApiStatus('Lütfen API key girin.', 'error');
            return;
        }

        // Update AI assistant settings
        this.aiAssistant.deepSeekAI.apiKey = apiKey;
        this.aiAssistant.deepSeekAI.model = model;
        this.aiAssistant.deepSeekAI.temperature = temperature;
        this.aiAssistant.deepSeekAI.maxTokens = maxTokens;
        
        // Re-validate API key
        this.aiAssistant.deepSeekAI.isValid = false;
        this.aiAssistant.deepSeekAI.validateApiKey();

        // Save to localStorage
        localStorage.setItem('aiSettings', JSON.stringify({
            apiKey: apiKey,
            model: model,
            temperature: temperature,
            maxTokens: maxTokens
        }));

        this.showApiStatus('✅ AI ayarları kaydedildi!', 'success');
        
        // Close modal after a short delay
        setTimeout(() => {
            this.closeAISettings();
        }, 1500);
    }

    showApiStatus(message, type) {
        const statusDiv = document.getElementById('apiKeyStatus');
        statusDiv.textContent = message;
        statusDiv.className = `api-status ${type}`;
    }
}

// Initialize admin panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.adminPanel = new AdminPanel();
});

// Add some default apps if none exist
document.addEventListener('DOMContentLoaded', () => {
    const apps = JSON.parse(localStorage.getItem('macfreeapps_apps') || '[]');
    if (apps.length === 0) {
        const defaultApps = [
            {
                id: '1',
                name: 'Notion',
                description: 'Notlar, görevler ve projelerinizi organize edin',
                icon: '📝',
                downloadUrl: 'https://www.notion.so/',
                category: 'productivity',
                createdAt: new Date().toISOString(),
                views: 0
            },
            {
                id: '2',
                name: 'GIMP',
                description: 'Ücretsiz ve güçlü görsel düzenleme aracı',
                icon: '🎨',
                downloadUrl: 'https://www.gimp.org/',
                category: 'design',
                createdAt: new Date().toISOString(),
                views: 0
            },
            {
                id: '3',
                name: 'Visual Studio Code',
                description: 'Microsoft\'un ücretsiz kod editörü',
                icon: '💻',
                downloadUrl: 'https://code.visualstudio.com/',
                category: 'development',
                createdAt: new Date().toISOString(),
                views: 0
            },
            {
                id: '4',
                name: 'Spotify',
                description: 'Müzik dinleme ve keşfetme platformu',
                icon: '🎵',
                downloadUrl: 'https://www.spotify.com/',
                category: 'entertainment',
                createdAt: new Date().toISOString(),
                views: 0
            },
            {
                id: '5',
                name: 'LibreOffice',
                description: 'Microsoft Office\'e ücretsiz alternatif',
                icon: '📊',
                downloadUrl: 'https://www.libreoffice.org/',
                category: 'productivity',
                createdAt: new Date().toISOString(),
                views: 0
            },
            {
                id: '6',
                name: '1Password',
                description: 'Şifre yöneticisi ve güvenlik aracı',
                icon: '🔒',
                downloadUrl: 'https://1password.com/',
                category: 'security',
                createdAt: new Date().toISOString(),
                views: 0
            }
        ];
        localStorage.setItem('macfreeapps_apps', JSON.stringify(defaultApps));
    }
});
