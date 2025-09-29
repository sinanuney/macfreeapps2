// App Store Scraper for Mac Free Apps
class AppStoreScraper {
    constructor() {
        this.corsProxy = 'https://api.allorigins.win/raw?url=';
    }

    async scrapeAppStore(url) {
        try {
            // Validate URL
            if (!this.isValidAppStoreUrl(url)) {
                throw new Error('Geçersiz App Store URL\'si');
            }

            // Show loading state
            this.showLoading(true);

            // Fetch the page content
            const response = await fetch(this.corsProxy + encodeURIComponent(url));
            if (!response.ok) {
                throw new Error('Sayfa yüklenemedi');
            }

            const html = await response.text();
            const appData = this.parseAppData(html, url);

            this.showLoading(false);
            return appData;

        } catch (error) {
            this.showLoading(false);
            throw error;
        }
    }

    isValidAppStoreUrl(url) {
        const appStoreRegex = /^https:\/\/apps\.apple\.com\/.*\/app\/.*\/id\d+/;
        return appStoreRegex.test(url);
    }

    parseAppData(html, originalUrl) {
        // Create a temporary DOM parser
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');

        // Extract app information
        const appData = {
            name: this.extractAppName(doc),
            description: this.extractDescription(doc),
            icon: this.extractIcon(doc),
            version: this.extractVersion(doc),
            size: this.extractSize(doc),
            screenshots: this.extractScreenshots(doc),
            requirements: this.extractRequirements(doc),
            developer: this.extractDeveloper(doc),
            category: this.extractCategory(doc),
            rating: this.extractRating(doc),
            price: this.extractPrice(doc),
            downloadUrl: originalUrl,
            lastUpdated: this.extractLastUpdated(doc)
        };

        return appData;
    }

    extractAppName(doc) {
        const nameElement = doc.querySelector('h1[data-testid="product-title"]') || 
                           doc.querySelector('.product-header__title') ||
                           doc.querySelector('h1');
        return nameElement ? nameElement.textContent.trim() : '';
    }

    extractDescription(doc) {
        const descElement = doc.querySelector('[data-testid="product-description"]') ||
                           doc.querySelector('.product-description') ||
                           doc.querySelector('.what-is-new__content');
        return descElement ? descElement.textContent.trim().substring(0, 200) + '...' : '';
    }

    extractIcon(doc) {
        const iconElement = doc.querySelector('.product-header__icon img') ||
                           doc.querySelector('.artwork img') ||
                           doc.querySelector('[data-testid="product-icon"] img');
        return iconElement ? iconElement.src : '';
    }

    extractVersion(doc) {
        const versionElement = doc.querySelector('[data-testid="version-info"]') ||
                              doc.querySelector('.version');
        if (versionElement) {
            const versionText = versionElement.textContent;
            const versionMatch = versionText.match(/Sürüm\s+([\d.]+)/i) || 
                                versionText.match(/Version\s+([\d.]+)/i);
            return versionMatch ? versionMatch[1] : '';
        }
        return '';
    }

    extractSize(doc) {
        const sizeElement = doc.querySelector('[data-testid="file-size"]') ||
                           doc.querySelector('.file-size');
        if (sizeElement) {
            const sizeText = sizeElement.textContent;
            const sizeMatch = sizeText.match(/([\d.]+)\s*(MB|GB|KB)/i);
            return sizeMatch ? sizeMatch[0] : '';
        }
        return '';
    }

    extractScreenshots(doc) {
        const screenshots = [];
        const screenshotElements = doc.querySelectorAll('.screenshot img, .artwork img');
        
        screenshotElements.forEach(img => {
            if (img.src && !img.src.includes('icon') && !img.src.includes('logo')) {
                screenshots.push(img.src);
            }
        });

        return screenshots.slice(0, 5); // Max 5 screenshots
    }

    extractRequirements(doc) {
        const requirements = [];
        const reqElements = doc.querySelectorAll('.requirements li, .system-requirements li');
        
        reqElements.forEach(req => {
            const text = req.textContent.trim();
            if (text && text.length > 0) {
                requirements.push(text);
            }
        });

        return requirements;
    }

    extractDeveloper(doc) {
        const devElement = doc.querySelector('[data-testid="developer-name"]') ||
                          doc.querySelector('.product-header__identity .product-header__identity__name');
        return devElement ? devElement.textContent.trim() : '';
    }

    extractCategory(doc) {
        const categoryElement = doc.querySelector('[data-testid="category"]') ||
                              doc.querySelector('.category');
        if (categoryElement) {
            const categoryText = categoryElement.textContent.trim();
            // Map App Store categories to our categories
            return this.mapCategory(categoryText);
        }
        return 'utilities';
    }

    mapCategory(appStoreCategory) {
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
            if (appStoreCategory.includes(key)) {
                return value;
            }
        }
        return 'utilities';
    }

    extractRating(doc) {
        const ratingElement = doc.querySelector('[data-testid="rating"]') ||
                             doc.querySelector('.rating');
        if (ratingElement) {
            const ratingText = ratingElement.textContent;
            const ratingMatch = ratingText.match(/([\d.]+)/);
            return ratingMatch ? parseFloat(ratingMatch[1]) : 0;
        }
        return 0;
    }

    extractPrice(doc) {
        const priceElement = doc.querySelector('[data-testid="price"]') ||
                           doc.querySelector('.price');
        if (priceElement) {
            const priceText = priceElement.textContent;
            if (priceText.includes('Ücretsiz') || priceText.includes('Free')) {
                return 'Ücretsiz';
            }
            return priceText.trim();
        }
        return 'Ücretsiz';
    }

    extractLastUpdated(doc) {
        const updateElement = doc.querySelector('[data-testid="last-updated"]') ||
                             doc.querySelector('.last-updated');
        return updateElement ? updateElement.textContent.trim() : '';
    }

    showLoading(show) {
        const loadingElement = document.getElementById('scraperLoading');
        if (loadingElement) {
            loadingElement.style.display = show ? 'block' : 'none';
        }
    }

    // Helper method to get emoji based on app name or category
    getAppEmoji(appName, category) {
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
            'firefox': '🦊'
        };

        const lowerName = appName.toLowerCase();
        for (const [key, emoji] of Object.entries(nameEmojis)) {
            if (lowerName.includes(key)) {
                return emoji;
            }
        }

        return emojiMap[category] || '📱';
    }
}

// Make it globally available
window.AppStoreScraper = AppStoreScraper;
