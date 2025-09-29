// Admin Panel JavaScript
class AdminPanel {
    constructor() {
        this.adminPassword = 'admin123'; // Güvenlik için değiştirin!
        this.currentEditingId = null;
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

        // Close modals on outside click
        document.getElementById('appModal').addEventListener('click', (e) => {
            if (e.target.id === 'appModal') {
                this.closeAppModal();
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
