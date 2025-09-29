// Alternative App Store Data Fetcher using iTunes Search API
class AppStoreAPI {
    constructor() {
        this.baseUrl = 'https://itunes.apple.com/lookup';
    }

    async getAppData(appStoreUrl) {
        try {
            // Extract app ID from URL
            const appId = this.extractAppId(appStoreUrl);
            if (!appId) {
                throw new Error('App Store URL\'sinden uygulama ID\'si çıkarılamadı');
            }

            // Fetch from iTunes API
            const response = await fetch(`${this.baseUrl}?id=${appId}&country=tr&lang=tr`);
            if (!response.ok) {
                throw new Error('iTunes API\'sine erişilemedi');
            }

            const data = await response.json();
            if (!data.results || data.results.length === 0) {
                throw new Error('Uygulama bulunamadı');
            }

            const app = data.results[0];
            return this.formatAppData(app, appStoreUrl);

        } catch (error) {
            throw new Error(`API Hatası: ${error.message}`);
        }
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
        // Clean and truncate description
        return description
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/\s+/g, ' ') // Replace multiple spaces with single space
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
        if (app.supportedDevices) {
            requirements.push(`Desteklenen cihazlar: ${app.supportedDevices.join(', ')}`);
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

        // Check for specific app names
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
window.AppStoreAPI = AppStoreAPI;
