// Main page JavaScript for loading apps dynamically
class AppLoader {
    constructor() {
        this.init();
    }

    init() {
        this.loadApps();
        this.setupDefaultApps();
    }

    loadApps() {
        const apps = this.getApps();
        const appsGrid = document.getElementById('appsGrid');
        
        if (apps.length === 0) {
            appsGrid.innerHTML = `
                <div class="empty-state">
                    <h3>Henüz uygulama yok</h3>
                    <p>Yakında harika uygulamalar eklenecek!</p>
                </div>
            `;
            return;
        }

        appsGrid.innerHTML = apps.map(app => `
            <div class="app-card" data-category="${app.category}">
                <div class="app-icon">${app.icon}</div>
                <h3>${app.name}</h3>
                <p>${app.description}</p>
                <a href="${app.downloadUrl || '#'}" class="download-btn" target="_blank" rel="noopener">
                    ${app.downloadUrl ? 'İndir' : 'Yakında'}
                </a>
            </div>
        `).join('');

        // Track views when app cards are clicked
        this.trackViews();
    }

    trackViews() {
        const appCards = document.querySelectorAll('.app-card');
        appCards.forEach(card => {
            const downloadBtn = card.querySelector('.download-btn');
            if (downloadBtn && downloadBtn.href !== '#') {
                downloadBtn.addEventListener('click', () => {
                    this.incrementViews(card);
                });
            }
        });
    }

    incrementViews(card) {
        // Find the app name to identify which app was clicked
        const appName = card.querySelector('h3').textContent;
        const apps = this.getApps();
        const appIndex = apps.findIndex(app => app.name === appName);
        
        if (appIndex !== -1) {
            apps[appIndex].views = (apps[appIndex].views || 0) + 1;
            this.saveApps(apps);
        }
    }

    getApps() {
        const apps = localStorage.getItem('macfreeapps_apps');
        return apps ? JSON.parse(apps) : [];
    }

    saveApps(apps) {
        localStorage.setItem('macfreeapps_apps', JSON.stringify(apps));
    }

    setupDefaultApps() {
        // Only add default apps if none exist
        const apps = this.getApps();
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
            this.saveApps(defaultApps);
            this.loadApps(); // Reload after adding defaults
        }
    }
}

// Initialize app loader when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new AppLoader();
});

// Add some CSS for empty state
const style = document.createElement('style');
style.textContent = `
    .empty-state {
        grid-column: 1 / -1;
        text-align: center;
        padding: 60px 20px;
        color: #718096;
    }
    
    .empty-state h3 {
        font-size: 1.5rem;
        margin-bottom: 10px;
        color: #4a5568;
    }
    
    .empty-state p {
        font-size: 1rem;
    }
`;
document.head.appendChild(style);
