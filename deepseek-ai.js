// DeepSeek AI Integration for Mac Free Apps
class DeepSeekAI {
    constructor() {
        this.apiKey = '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';
        this.apiUrl = 'https://api.deepseek.com/v1/chat/completions';
        this.model = 'deepseek-chat';
        this.maxTokens = 1000;
        this.temperature = 0.7;
        this.isValid = false;
        this.validateApiKey();
    }

    async validateApiKey() {
        try {
            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'user',
                            content: 'test'
                        }
                    ],
                    max_tokens: 10,
                    temperature: 0.1
                })
            });

            this.isValid = response.ok;
            if (!this.isValid) {
                console.warn('DeepSeek API key validation failed:', response.status);
            }
        } catch (error) {
            console.warn('DeepSeek API key validation error:', error);
            this.isValid = false;
        }
    }

    async sendMessage(message, context = {}) {
        // If API key is invalid, use fallback
        if (!this.isValid) {
            return this.fallbackResponse(message, context);
        }

        try {
            const systemPrompt = this.createSystemPrompt(context);
            const userPrompt = this.createUserPrompt(message, context);

            const response = await fetch(this.apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.apiKey}`
                },
                body: JSON.stringify({
                    model: this.model,
                    messages: [
                        {
                            role: 'system',
                            content: systemPrompt
                        },
                        {
                            role: 'user',
                            content: userPrompt
                        }
                    ],
                    max_tokens: this.maxTokens,
                    temperature: this.temperature,
                    stream: false
                })
            });

            if (!response.ok) {
                if (response.status === 401) {
                    this.isValid = false;
                    return this.fallbackResponse(message, context);
                }
                throw new Error(`DeepSeek API error: ${response.status}`);
            }

            const data = await response.json();
            return data.choices[0].message.content;

        } catch (error) {
            console.error('DeepSeek AI Error:', error);
            return this.fallbackResponse(message, context);
        }
    }

    fallbackResponse(message, context) {
        // Fallback to rule-based responses when API is not available
        const lowerMessage = message.toLowerCase();
        
        if (lowerMessage.includes('ekle') || lowerMessage.includes('add')) {
            const appName = this.extractAppName(message);
            if (appName) {
                return `APP_ADD: ${appName}\n\n✅ "${appName}" uygulamasını eklemek için App Store'dan veri çekeceğim!`;
            }
            return `Hangi uygulamayı eklemek istiyorsunuz? Lütfen uygulama adını belirtin. Örnek: "Canva uygulamasını ekle"`;
        }
        
        if (lowerMessage.includes('ara') || lowerMessage.includes('bul') || lowerMessage.includes('search')) {
            const searchTerm = this.extractSearchTerm(message);
            if (searchTerm) {
                return `APP_SEARCH: ${searchTerm}\n\n🔍 "${searchTerm}" için arama yapacağım!`;
            }
            return `Hangi uygulamayı arıyorsunuz? Örnek: "Canva uygulamasını ara"`;
        }
        
        if (lowerMessage.includes('listele') || lowerMessage.includes('göster') || lowerMessage.includes('list')) {
            return `APP_LIST: all\n\n📱 Tüm uygulamaları listeliyorum!`;
        }
        
        if (lowerMessage.includes('yardım') || lowerMessage.includes('help')) {
            return `🤖 **Mac Free Apps AI Asistanı Komutları:**

**📱 Uygulama Yönetimi:**
• "Canva uygulamasını ekle" - Uygulama ekleme
• "Notion uygulamasını ara" - Uygulama arama
• "Spotify uygulamasını düzenle" - Uygulama düzenleme
• "Zoom uygulamasını sil" - Uygulama silme

**📋 Listeleme:**
• "Tüm uygulamaları listele" - Tüm uygulamaları göster
• "Tasarım uygulamalarını göster" - Kategoriye göre listele

**💡 Not:** DeepSeek AI şu anda kullanılamıyor, basit kural tabanlı yanıtlar veriyorum.`;
        }
        
        if (lowerMessage.includes('merhaba') || lowerMessage.includes('selam') || lowerMessage.includes('hello')) {
            return `👋 Merhaba! Ben Mac Free Apps AI asistanınızım. 

Size şu konularda yardımcı olabilirim:
• 📱 Uygulama ekleme ve düzenleme
• 🔍 Uygulama arama ve listeleme
• 📊 Kategori bazlı filtreleme
• ⚙️ Uygulama yönetimi

Ne yapmak istiyorsunuz?`;
        }
        
        return `🤔 Anlayamadım. Lütfen daha açık bir şekilde yazın.

**Örnekler:**
• "Canva uygulamasını ekle"
• "Tüm uygulamaları listele"
• "Yardım" yazın

Nasıl yardımcı olabilirim?`;
    }

    extractAppName(message) {
        const patterns = [
            /"([^"]+)"/g,
            /([A-Z][a-zA-Z\s]+) uygulamasını ekle/g,
            /([A-Z][a-zA-Z\s]+) uygulaması/g,
            /([A-Z][a-zA-Z\s]+) ekle/g,
        ];

        for (const pattern of patterns) {
            const match = message.match(pattern);
            if (match) {
                return match[1]?.trim();
            }
        }

        return null;
    }

    extractSearchTerm(message) {
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

    createSystemPrompt(context) {
        return `Sen Mac Free Apps admin paneli için özel olarak tasarlanmış bir AI asistanısın. 

GÖREVLERİN:
1. Uygulama yönetimi (ekleme, düzenleme, silme, listeleme)
2. App Store'dan veri çekme
3. Kullanıcı sorularını yanıtlama
4. Türkçe konuşma

YETENEKLERİN:
- Uygulama ekleme: "Canva uygulamasını ekle"
- Uygulama arama: "Tasarım uygulamalarını listele"
- Uygulama düzenleme: "Spotify uygulamasını düzenle"
- Uygulama silme: "Notion uygulamasını sil"
- Yardım: "Yardım" veya "Ne yapabilirsin?"

MEVCUT UYGULAMALAR:
${context.apps ? this.formatAppsList(context.apps) : 'Henüz uygulama yok'}

YANIT FORMATI:
- Eğer uygulama ekleme isteniyorsa: "APP_ADD: [uygulama_adı]"
- Eğer uygulama arama isteniyorsa: "APP_SEARCH: [arama_terimi]"
- Eğer uygulama düzenleme isteniyorsa: "APP_EDIT: [uygulama_adı]"
- Eğer uygulama silme isteniyorsa: "APP_DELETE: [uygulama_adı]"
- Eğer liste isteniyorsa: "APP_LIST: [kategori]"
- Diğer durumlarda normal yanıt ver

TÜRKÇE KONUŞ ve samimi ol. Emoji kullan.`;
    }

    createUserPrompt(message, context) {
        return `Kullanıcı: "${message}"

Lütfen bu isteği analiz et ve uygun aksiyonu belirle. Eğer uygulama yönetimi ile ilgiliyse, yukarıdaki formatı kullan.`;
    }

    formatAppsList(apps) {
        if (!apps || apps.length === 0) {
            return 'Henüz uygulama eklenmemiş.';
        }

        let result = `Toplam ${apps.length} uygulama:\n`;
        apps.forEach((app, index) => {
            result += `${index + 1}. ${app.name} (${this.getCategoryName(app.category)})\n`;
        });
        return result;
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

    parseResponse(response) {
        // Parse AI response for actions
        if (response.includes('APP_ADD:')) {
            const appName = response.split('APP_ADD:')[1].trim();
            return {
                action: 'add_app',
                appName: appName,
                message: response.replace(/APP_ADD:.*/, '').trim()
            };
        }
        
        if (response.includes('APP_SEARCH:')) {
            const searchTerm = response.split('APP_SEARCH:')[1].trim();
            return {
                action: 'search_app',
                searchTerm: searchTerm,
                message: response.replace(/APP_SEARCH:.*/, '').trim()
            };
        }
        
        if (response.includes('APP_EDIT:')) {
            const appName = response.split('APP_EDIT:')[1].trim();
            return {
                action: 'edit_app',
                appName: appName,
                message: response.replace(/APP_EDIT:.*/, '').trim()
            };
        }
        
        if (response.includes('APP_DELETE:')) {
            const appName = response.split('APP_DELETE:')[1].trim();
            return {
                action: 'delete_app',
                appName: appName,
                message: response.replace(/APP_DELETE:.*/, '').trim()
            };
        }
        
        if (response.includes('APP_LIST:')) {
            const category = response.split('APP_LIST:')[1].trim();
            return {
                action: 'list_apps',
                category: category,
                message: response.replace(/APP_LIST:.*/, '').trim()
            };
        }
        
        return {
            action: 'chat',
            message: response
        };
    }
}

// Make it globally available
window.DeepSeekAI = DeepSeekAI;
