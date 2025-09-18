// Prompt Library WebView Application
// This file implements a modern, component-based UI for the VSCode Prompt Library extension

// Global state management
class AppState {
    constructor() {
        this.articles = [];
        this.filteredArticles = [];
        this.searchTerm = '';
        this.activeFilter = 'all';
        this.viewMode = 'grid'; // 'grid' or 'list'
        this.isLoading = false;
        this.error = null;
    }

    setState(newState) {
        Object.assign(this, newState);
        this.notifyStateChange();
    }

    notifyStateChange() {
        // Trigger UI updates when state changes
        app.render();
    }
}

// Article data model
class Article {
    constructor(rawData) {
        this.id = rawData.articleId || rawData.id;
        this.title = rawData.articleName || rawData.title;
        this.description = this.extractDescription(rawData.description);
        this.category = rawData.category || 'General';
        this.tags = this.extractTags(rawData);
        this.publishedDate = rawData.publishedDate || new Date();
        this.rawData = rawData;
    }

    extractDescription(description) {
        if (!description) return 'No description available';
        
        try {
            if (typeof description === 'string' && description.startsWith('[')) {
                const parsed = JSON.parse(description);
                if (parsed.length > 0 && parsed[0].PromptDesc) {
                    return parsed[0].PromptDesc;
                }
            }
        } catch (e) {
            // Fallback to string description
        }
        
        return typeof description === 'string' ? description : 'No description available';
    }

    extractTags(rawData) {
        const tags = [];
        
        // Extract from title and description
        const text = `${this.title} ${this.description}`.toLowerCase();
        
        // Common programming languages and technologies
        const techKeywords = [
            'javascript', 'python', 'react', 'angular', 'vue', 'node',
            'typescript', 'css', 'html', 'java', 'c#', 'php', 'ruby',
            'swift', 'kotlin', 'go', 'rust', 'docker', 'kubernetes',
            'aws', 'azure', 'gcp', 'sql', 'mongodb', 'redis'
        ];
        
        techKeywords.forEach(keyword => {
            if (text.includes(keyword)) {
                tags.push(keyword.charAt(0).toUpperCase() + keyword.slice(1));
            }
        });
        
        return tags.slice(0, 3); // Limit to 3 tags
    }

    matchesSearch(searchTerm) {
        if (!searchTerm) return true;
        
        const term = searchTerm.toLowerCase();
        return (
            this.title.toLowerCase().includes(term) ||
            this.description.toLowerCase().includes(term) ||
            this.tags.some(tag => tag.toLowerCase().includes(term)) ||
            this.category.toLowerCase().includes(term)
        );
    }

    matchesFilter(filter) {
        if (filter === 'all') return true;
        
        return (
            this.title.toLowerCase().includes(filter.toLowerCase()) ||
            this.tags.some(tag => tag.toLowerCase().includes(filter.toLowerCase())) ||
            this.category.toLowerCase().includes(filter.toLowerCase())
        );
    }
}

// API Service for handling data fetching
class ApiService {
    constructor() {
        this.vscode = acquireVsCodeApi();
    }

    async fetchArticles() {
        return new Promise((resolve, reject) => {
            // Request articles from the extension
            this.vscode.postMessage({
                command: 'fetchArticles'
            });

            // Listen for response
            const handler = (event) => {
                const message = event.data;
                if (message.command === 'articlesResponse') {
                    window.removeEventListener('message', handler);
                    if (message.error) {
                        reject(new Error(message.error));
                    } else {
                        resolve(message.data);
                    }
                }
            };

            window.addEventListener('message', handler);

            // Timeout after 30 seconds
            setTimeout(() => {
                window.removeEventListener('message', handler);
                reject(new Error('Request timeout'));
            }, 30000);
        });
    }

    async fetchArticleContent(articleId) {
        return new Promise((resolve, reject) => {
            this.vscode.postMessage({
                command: 'fetchArticleContent',
                articleId: articleId
            });

            const handler = (event) => {
                const message = event.data;
                if (message.command === 'articleContentResponse' && message.articleId === articleId) {
                    window.removeEventListener('message', handler);
                    if (message.error) {
                        reject(new Error(message.error));
                    } else {
                        resolve(message.content);
                    }
                }
            };

            window.addEventListener('message', handler);

            setTimeout(() => {
                window.removeEventListener('message', handler);
                reject(new Error('Request timeout'));
            }, 30000);
        });
    }

    openInEditor(content) {
        this.vscode.postMessage({
            command: 'openInEditor',
            content: content
        });
    }
}

// UI Components
class UIComponents {
    static createArticleCard(article) {
        const card = document.createElement('div');
        card.className = `article-card fade-in`;
        card.dataset.articleId = article.id;
        
        const formattedDate = new Date(article.publishedDate).toLocaleDateString();
        
        card.innerHTML = `
            <div class="card-header">
                <h3 class="card-title">${this.escapeHtml(article.title)}</h3>
                <div class="card-meta">
                    <span class="meta-item">
                        📅 ${formattedDate}
                    </span>
                    <span class="meta-item">
                        📂 ${this.escapeHtml(article.category)}
                    </span>
                </div>
            </div>
            <div class="card-content">
                <p class="card-description">${this.escapeHtml(article.description)}</p>
                ${article.tags.length > 0 ? `
                    <div class="card-tags">
                        ${article.tags.map(tag => `<span class="tag">${this.escapeHtml(tag)}</span>`).join('')}
                    </div>
                ` : ''}
            </div>
            <div class="card-actions">
                <button class="btn btn-primary view-article" data-article-id="${article.id}">
                    View Details
                </button>
                <button class="btn btn-secondary quick-copy" data-article-id="${article.id}">
                    Quick Copy
                </button>
            </div>
        `;
        
        return card;
    }

    static createLoadingSpinner() {
        return `
            <div class="loading-container">
                <div class="spinner"></div>
                <p class="loading-text">Loading prompts...</p>
            </div>
        `;
    }

    static createErrorMessage(error) {
        return `
            <div class="error-container">
                <div class="error-content">
                    <span class="error-icon">⚠️</span>
                    <p class="error-message">${this.escapeHtml(error)}</p>
                    <button id="retryButton" class="retry-button">Retry</button>
                </div>
            </div>
        `;
    }

    static createEmptyState() {
        return `
            <div class="empty-state">
                <div class="empty-content">
                    <span class="empty-icon">📝</span>
                    <h3 class="empty-title">No prompts found</h3>
                    <p class="empty-description">Try adjusting your search terms or clearing filters</p>
                </div>
            </div>
        `;
    }

    static escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Main Application Class
class PromptLibraryApp {
    constructor() {
        this.state = new AppState();
        this.apiService = new ApiService();
        this.setupEventListeners();
        this.initialize();
    }

    async initialize() {
        this.state.setState({ isLoading: true, error: null });
        
        try {
            const articlesData = await this.apiService.fetchArticles();
            const articles = articlesData.map(data => new Article(data));
            
            this.state.setState({
                articles: articles,
                filteredArticles: articles,
                isLoading: false
            });
        } catch (error) {
            this.state.setState({
                isLoading: false,
                error: error.message
            });
        }
    }

    setupEventListeners() {
        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const clearSearch = document.getElementById('clearSearch');
        
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.handleSearch(e.target.value);
            });
        }
        
        if (clearSearch) {
            clearSearch.addEventListener('click', () => {
                searchInput.value = '';
                this.handleSearch('');
            });
        }

        // Filter chips
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('chip')) {
                this.handleFilterChange(e.target.dataset.filter);
            }
        });

        // View toggle
        const gridView = document.getElementById('gridView');
        const listView = document.getElementById('listView');
        
        if (gridView) {
            gridView.addEventListener('click', () => this.setViewMode('grid'));
        }
        if (listView) {
            listView.addEventListener('click', () => this.setViewMode('list'));
        }

        // Article interactions
        document.addEventListener('click', async (e) => {
            if (e.target.classList.contains('view-article') || e.target.closest('.article-card')) {
                const articleId = e.target.dataset.articleId || 
                                e.target.closest('.article-card').dataset.articleId;
                if (articleId) {
                    await this.showArticleModal(articleId);
                }
            }
            
            if (e.target.classList.contains('quick-copy')) {
                e.stopPropagation();
                const articleId = e.target.dataset.articleId;
                await this.quickCopyArticle(articleId);
            }
        });

        // Modal interactions
        const closeModal = document.getElementById('closeModal');
        const modalBackdrop = document.querySelector('.modal-backdrop');
        const openInEditor = document.getElementById('openInEditor');
        const copyContent = document.getElementById('copyContent');
        
        if (closeModal) {
            closeModal.addEventListener('click', () => this.hideModal());
        }
        if (modalBackdrop) {
            modalBackdrop.addEventListener('click', () => this.hideModal());
        }
        if (openInEditor) {
            openInEditor.addEventListener('click', () => this.openCurrentArticleInEditor());
        }
        if (copyContent) {
            copyContent.addEventListener('click', () => this.copyCurrentArticleContent());
        }

        // Retry button
        document.addEventListener('click', (e) => {
            if (e.target.id === 'retryButton') {
                this.initialize();
            }
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.hideModal();
            }
            if (e.ctrlKey && e.key === 'f') {
                e.preventDefault();
                if (searchInput) {
                    searchInput.focus();
                }
            }
        });
    }

    handleSearch(searchTerm) {
        this.state.setState({ searchTerm });
        this.filterArticles();
    }

    handleFilterChange(filter) {
        // Update active filter chip
        document.querySelectorAll('.chip').forEach(chip => {
            chip.classList.toggle('active', chip.dataset.filter === filter);
        });
        
        this.state.setState({ activeFilter: filter });
        this.filterArticles();
    }

    filterArticles() {
        const { articles, searchTerm, activeFilter } = this.state;
        
        const filtered = articles.filter(article => 
            article.matchesSearch(searchTerm) && article.matchesFilter(activeFilter)
        );
        
        this.state.setState({ filteredArticles: filtered });
    }

    setViewMode(mode) {
        const gridBtn = document.getElementById('gridView');
        const listBtn = document.getElementById('listView');
        const container = document.getElementById('articlesContainer');
        
        if (gridBtn) {
            gridBtn.classList.toggle('active', mode === 'grid');
        }
        if (listBtn) {
            listBtn.classList.toggle('active', mode === 'list');
        }
        if (container) {
            container.classList.toggle('list-view', mode === 'list');
        }
        
        this.state.setState({ viewMode: mode });
    }

    async showArticleModal(articleId) {
        const article = this.state.articles.find(a => a.id == articleId);
        if (!article) return;

        const modal = document.getElementById('articleModal');
        const modalTitle = document.getElementById('modalTitle');
        const modalContent = document.getElementById('modalContent');
        
        modalTitle.textContent = article.title;
        modalContent.innerHTML = '<div class="loading-container"><div class="spinner"></div></div>';
        modal.style.display = 'block';
        modal.classList.add('scale-in');

        try {
            const content = await this.apiService.fetchArticleContent(articleId);
            modalContent.innerHTML = this.formatArticleContent(content, article);
            this.currentModalContent = content;
        } catch (error) {
            modalContent.innerHTML = `
                <div class="error-content">
                    <p>Failed to load article content: ${error.message}</p>
                </div>
            `;
        }
    }

    hideModal() {
        const modal = document.getElementById('articleModal');
        modal.style.display = 'none';
        modal.classList.remove('scale-in');
        this.currentModalContent = null;
    }

    formatArticleContent(content, article) {
        // If content is a string, assume it's already formatted
        if (typeof content === 'string') {
            return content;
        }

        // If content is an object, format it
        let formatted = `<h1>${article.title}</h1>\n\n`;
        
        if (content.description) {
            try {
                const descriptions = JSON.parse(content.description);
                descriptions.forEach(desc => {
                    if (desc.Prompt) {
                        formatted += `<h2>Prompt</h2>\n<p><strong>${desc.Prompt}</strong></p>\n\n`;
                    }
                    if (desc.PromptDesc) {
                        formatted += `<h3>Description</h3>\n<p>${desc.PromptDesc}</p>\n\n`;
                    }
                    if (desc.Code) {
                        formatted += `<h3>Code</h3>\n<pre><code>${desc.Code}</code></pre>\n\n`;
                    }
                });
            } catch (e) {
                formatted += `<p>${content.description}</p>\n\n`;
            }
        }

        return formatted;
    }

    async quickCopyArticle(articleId) {
        try {
            const content = await this.apiService.fetchArticleContent(articleId);
            await navigator.clipboard.writeText(typeof content === 'string' ? content : JSON.stringify(content, null, 2));
            
            // Show temporary success message
            this.showToast('Content copied to clipboard!', 'success');
        } catch (error) {
            this.showToast('Failed to copy content', 'error');
        }
    }

    openCurrentArticleInEditor() {
        if (this.currentModalContent) {
            this.apiService.openInEditor(this.currentModalContent);
            this.hideModal();
        }
    }

    copyCurrentArticleContent() {
        if (this.currentModalContent) {
            navigator.clipboard.writeText(
                typeof this.currentModalContent === 'string' 
                    ? this.currentModalContent 
                    : JSON.stringify(this.currentModalContent, null, 2)
            );
            this.showToast('Content copied to clipboard!', 'success');
        }
    }

    showToast(message, type = 'info') {
        // Create toast notification
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        toast.textContent = message;
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 24px;
            background: var(--${type === 'success' ? 'success' : 'danger'}-color);
            color: white;
            border-radius: 6px;
            z-index: 10000;
            animation: slideIn 0.3s ease-out;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }

    render() {
        this.renderContent();
        this.renderResultsCount();
    }

    renderContent() {
        const container = document.getElementById('articlesContainer');
        const loadingSpinner = document.getElementById('loadingSpinner');
        const errorContainer = document.getElementById('errorContainer');
        const emptyState = document.getElementById('emptyState');
        
        if (!container) return;

        // Handle loading state
        if (this.state.isLoading) {
            loadingSpinner.style.display = 'block';
            errorContainer.style.display = 'none';
            emptyState.style.display = 'none';
            container.innerHTML = '';
            return;
        }

        loadingSpinner.style.display = 'none';

        // Handle error state
        if (this.state.error) {
            errorContainer.style.display = 'block';
            errorContainer.innerHTML = UIComponents.createErrorMessage(this.state.error);
            emptyState.style.display = 'none';
            container.innerHTML = '';
            return;
        }

        errorContainer.style.display = 'none';

        // Handle empty state
        if (this.state.filteredArticles.length === 0) {
            emptyState.style.display = 'block';
            container.innerHTML = '';
            return;
        }

        emptyState.style.display = 'none';

        // Render articles
        container.innerHTML = '';
        this.state.filteredArticles.forEach(article => {
            const card = UIComponents.createArticleCard(article, this.state.viewMode);
            container.appendChild(card);
        });
    }

    renderResultsCount() {
        const resultsCount = document.getElementById('resultsCount');
        if (resultsCount) {
            const count = this.state.filteredArticles.length;
            const total = this.state.articles.length;
            resultsCount.textContent = `${count} of ${total} prompts`;
        }
    }
}

// Initialize the application when DOM is loaded
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new PromptLibraryApp();
});

// Handle messages from the extension
window.addEventListener('message', (event) => {
    const message = event.data;
    
    switch (message.command) {
        case 'refresh':
            if (app) {
                app.initialize();
            }
            break;
        case 'focus-search':
            const searchInput = document.getElementById('searchInput');
            if (searchInput) {
                searchInput.focus();
            }
            break;
    }
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
`;
document.head.appendChild(style);