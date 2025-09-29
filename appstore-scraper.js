// App Store Scraper for Mac Free Apps
class AppStoreScraper {
    constructor() {
        // Multiple CORS proxies for better reliability
        this.corsProxies = [
            'https://cors-anywhere.herokuapp.com/',
            'https://api.allorigins.win/raw?url=',
            'https://corsproxy.io/?',
            'https://thingproxy.freeboard.io/fetch/'
        ];
        this.currentProxyIndex = 0;
    }

    async scrapeAppStore(url) {
        try {
            // Validate URL
            if (!this.isValidAppStoreUrl(url)) {
                throw new Error('Geçersiz App Store URL\'si');
            }

            // Show loading state
            this.showLoading(true);

            // Try multiple proxies
            let lastError = null;
            for (let i = 0; i < this.corsProxies.length; i++) {
                try {
                    const proxyUrl = this.corsProxies[i] + encodeURIComponent(url);
                    const response = await fetch(proxyUrl, {
                        method: 'GET',
                        headers: {
                            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
                            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
                        }
                    });

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}`);
                    }

                    const html = await response.text();
                    const appData = this.parseAppData(html, url);

                    this.showLoading(false);
                    return appData;

                } catch (error) {
                    lastError = error;
                    console.log(`Proxy ${i + 1} failed:`, error.message);
                    continue;
                }
            }

            // If all proxies failed, try a different approach
            throw new Error('Tüm CORS proxy\'leri başarısız oldu. Lütfen daha sonra tekrar deneyin.');

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

        // Debug information
        console.log('Extracted app data:', appData);
        
        // Validate that we got at least basic information
        if (!appData.name) {
            console.warn('No app name found, checking HTML structure...');
            console.log('Available h1 elements:', doc.querySelectorAll('h1').length);
            console.log('Available product-header elements:', doc.querySelectorAll('.product-header').length);
        }

        return appData;
    }

    extractAppName(doc) {
        const nameSelectors = [
            'h1[data-testid="product-title"]',
            '.product-header__title',
            'h1.product-header__title',
            '.product-header h1',
            'h1'
        ];

        for (const selector of nameSelectors) {
            const nameElement = doc.querySelector(selector);
            if (nameElement) {
                const name = nameElement.textContent.trim();
                if (name && name.length > 0) {
                    return name;
                }
            }
        }
        return '';
    }

    extractDescription(doc) {
        const descSelectors = [
            '[data-testid="product-description"]',
            '.product-description',
            '.what-is-new__content',
            '.product-header__description',
            '.l-column.small-12.medium-12.large-12 p',
            '.product-description p'
        ];

        for (const selector of descSelectors) {
            const descElement = doc.querySelector(selector);
            if (descElement) {
                const description = descElement.textContent.trim();
                if (description && description.length > 10) {
                    return description.substring(0, 200) + '...';
                }
            }
        }
        return '';
    }

    extractIcon(doc) {
        const iconSelectors = [
            '.product-header__icon img',
            '.artwork img',
            '[data-testid="product-icon"] img',
            '.product-header img',
            '.we-artwork--app-icon img'
        ];

        for (const selector of iconSelectors) {
            const iconElement = doc.querySelector(selector);
            if (iconElement && iconElement.src && !iconElement.src.includes('screenshot')) {
                return iconElement.src;
            }
        }
        return '';
    }

    extractVersion(doc) {
        // Try multiple selectors for version
        const versionSelectors = [
            '.whats-new__latest__version',
            '[data-testid="version-info"]',
            '.version',
            '.l-column.small-6.medium-12.whats-new__latest__version'
        ];

        for (const selector of versionSelectors) {
            const versionElement = doc.querySelector(selector);
            if (versionElement) {
                const versionText = versionElement.textContent.trim();
                // Extract version number from text like "Version 1.116.0"
                const versionMatch = versionText.match(/Version\s+([\d.]+)/i) || 
                                    versionText.match(/Sürüm\s+([\d.]+)/i) ||
                                    versionText.match(/([\d.]+)/);
                if (versionMatch) {
                    return versionMatch[1];
                }
            }
        }
        return '';
    }

    extractSize(doc) {
        const sizeSelectors = [
            '[data-testid="file-size"]',
            '.file-size',
            '.l-column.small-6.medium-12 .information-list__item__definition',
            '.information-list__item__definition'
        ];

        for (const selector of sizeSelectors) {
            const sizeElement = doc.querySelector(selector);
            if (sizeElement) {
                const sizeText = sizeElement.textContent;
                const sizeMatch = sizeText.match(/([\d.]+)\s*(MB|GB|KB)/i);
                if (sizeMatch) {
                    return sizeMatch[0];
                }
            }
        }
        return '';
    }

    extractScreenshots(doc) {
        const screenshots = [];
        
        // Try multiple selectors for screenshots
        const screenshotSelectors = [
            '.we-artwork--screenshot-platform-mac picture source[srcset]',
            '.screenshot img',
            '.artwork img',
            '.l-column.small-4.medium-4.large-4 picture source[srcset]',
            'picture.we-artwork--screenshot-platform-mac source[srcset]'
        ];

        for (const selector of screenshotSelectors) {
            const elements = doc.querySelectorAll(selector);
            
            elements.forEach(element => {
                if (element.tagName === 'SOURCE' && element.srcset) {
                    // Extract the highest resolution image from srcset
                    const srcset = element.srcset;
                    const urls = srcset.split(',').map(src => src.trim().split(' ')[0]);
                    // Get the highest resolution (usually the last one)
                    const highestRes = urls[urls.length - 1];
                    if (highestRes && !highestRes.includes('icon') && !highestRes.includes('logo')) {
                        screenshots.push(highestRes);
                    }
                } else if (element.tagName === 'IMG' && element.src) {
                    if (!element.src.includes('icon') && !element.src.includes('logo') && !element.src.includes('gif')) {
                        screenshots.push(element.src);
                    }
                }
            });
        }

        // Remove duplicates and limit to 5
        const uniqueScreenshots = [...new Set(screenshots)];
        return uniqueScreenshots.slice(0, 5);
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
        const devSelectors = [
            '[data-testid="developer-name"]',
            '.product-header__identity .product-header__identity__name',
            '.product-header__identity__name',
            '.l-column.small-6.medium-12 .information-list__item__definition a',
            '.information-list__item__definition a'
        ];

        for (const selector of devSelectors) {
            const devElement = doc.querySelector(selector);
            if (devElement) {
                const developer = devElement.textContent.trim();
                if (developer && developer.length > 0) {
                    return developer;
                }
            }
        }
        return '';
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
