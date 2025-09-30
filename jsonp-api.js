// JSONP-based iTunes API fetcher to bypass CORS
class JSONPAppStoreAPI {
    constructor() {
        this.callbacks = new Map();
        this.callbackCounter = 0;
    }

    async getAppData(appStoreUrl) {
        return new Promise((resolve, reject) => {
            try {
                const appId = this.extractAppId(appStoreUrl);
                if (!appId) {
                    reject(new Error('App Store URL\'sinden uygulama ID\'si çıkarılamadı'));
                    return;
                }

                // Create unique callback function
                const callbackName = `jsonp_callback_${++this.callbackCounter}`;
                const callback = (data) => {
                    this.cleanup(callbackName);
                    if (!data.results || data.results.length === 0) {
                        reject(new Error('Uygulama bulunamadı'));
                        return;
                    }
                    const app = data.results[0];
                    resolve(this.formatAppData(app, appStoreUrl));
                };

                // Store callback
                this.callbacks.set(callbackName, callback);
                window[callbackName] = callback;

                // Create script tag for JSONP
                const script = document.createElement('script');
                script.src = `https://itunes.apple.com/lookup?id=${appId}&country=tr&lang=tr&callback=${callbackName}`;
                script.onerror = () => {
                    this.cleanup(callbackName);
                    reject(new Error('iTunes API\'sine erişilemedi'));
                };

                // Set timeout
                setTimeout(() => {
                    this.cleanup(callbackName);
                    reject(new Error('API zaman aşımı'));
                }, 10000);

                document.head.appendChild(script);

            } catch (error) {
                reject(new Error(`API Hatası: ${error.message}`));
            }
        });
    }

    cleanup(callbackName) {
        // Remove callback
        if (this.callbacks.has(callbackName)) {
            this.callbacks.delete(callbackName);
        }
        if (window[callbackName]) {
            delete window[callbackName];
        }

        // Remove script tag
        const scripts = document.querySelectorAll(`script[src*="callback=${callbackName}"]`);
        scripts.forEach(script => script.remove());
    }

    extractAppId(url) {
        const match = url.match(/\/id(\d+)/);
        return match ? match[1] : null;
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
}

// Make it globally available
window.JSONPAppStoreAPI = JSONPAppStoreAPI;
