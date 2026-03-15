// Theme management
const themeToggle = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;

// Check for saved theme preference
const savedTheme = localStorage.getItem('theme') || 'light';
htmlElement.setAttribute('data-theme', savedTheme);

// Theme toggle handler
themeToggle.addEventListener('click', () => {
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
});

// InesBot Searcher Class
class InesBotSearcher {
    constructor() {
        this.words = [];
        // Using raw.githubusercontent.com for direct file access
        this.wordListUrl = 'https://raw.githubusercontent.com/inesbotv1/askari/refs/heads/main/lastletter.txt';
        
        this.initEventListeners();
    }

    initEventListeners() {
        document.getElementById('search-btn').addEventListener('click', () => this.performSearch());
        document.getElementById('load-words-btn').addEventListener('click', () => this.loadWordsFromURL());
        document.getElementById('clear-btn').addEventListener('click', () => this.clearAll());
        
        document.getElementById('prefix-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        document.getElementById('suffix-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
    }

    async loadWordsFromURL() {
        this.showLoading('Loading words from GitHub...');
        
        try {
            console.log('Fetching from:', this.wordListUrl);
            
            // Add cache-busting parameter to avoid cached responses
            const urlWithCache = `${this.wordListUrl}?t=${Date.now()}`;
            
            const response = await fetch(urlWithCache, {
                method: 'GET',
                headers: {
                    'Accept': 'text/plain, text/plain;charset=utf-8',
                },
                mode: 'cors',
                credentials: 'omit'
            });
            
            console.log('Response status:', response.status);
            console.log('Response headers:', {
                'content-type': response.headers.get('content-type'),
                'content-length': response.headers.get('content-length')
            });
            
            if (!response.ok) {
                throw new Error(`Failed to load: ${response.status} ${response.statusText}`);
            }
            
            const text = await response.text();
            console.log('First 200 chars:', text.substring(0, 200));
            console.log('Total length:', text.length);
            
            if (!text || text.length === 0) {
                throw new Error('Word list file is empty');
            }
            
            // Split by new lines and clean up - handle different line endings
            const words = text.split(/\r?\n/)
                .map(word => word.trim())
                .filter(word => word.length > 0);
            
            console.log('Words found:', words.length);
            console.log('First 10 words:', words.slice(0, 10));
            
            if (words.length === 0) {
                throw new Error('No words found in the file');
            }
            
            // Remove duplicates and sort
            this.words = [...new Set(words)];
            
            // Update word count
            document.getElementById('word-count').textContent = this.words.length;
            
            // Show success message
            this.showSuccess(`✅ Successfully loaded ${this.words.length} words!`);
            document.getElementById('result-count').textContent = '0';
            
        } catch (error) {
            console.error('Error loading words:', error);
            
            // Provide more specific error messages
            if (error.message.includes('Failed to fetch')) {
                this.showError('Network error: Cannot reach GitHub. Check your internet connection.');
            } else if (error.message.includes('404')) {
                this.showError('File not found on GitHub. Check if the URL is correct: <br>' + this.wordListUrl);
            } else if (error.message.includes('CORS')) {
                this.showError('CORS error. This should not happen with GitHub raw files. Try a different browser.');
            } else {
                this.showError(`Failed to load words: ${error.message}`);
            }
            
            this.words = [];
            document.getElementById('word-count').textContent = '0';
        }
    }

    performSearch() {
        if (this.words.length === 0) {
            this.showError('No words loaded. Click "Load Words" first.');
            return;
        }

        const prefix = document.getElementById('prefix-input').value.toLowerCase().trim();
        const suffix = document.getElementById('suffix-input').value.toLowerCase().trim();
        
        const sortOption = document.querySelector('input[name="sort"]:checked').value;
        
        let criteria = [];
        if (prefix) criteria.push(`starts with '${prefix}'`);
        if (suffix) criteria.push(`ends with '${suffix}'`);
        
        // Filter words based ONLY on current filters
        let results = this.words.filter(word => {
            const wordLower = word.toLowerCase();
            
            if (prefix && !wordLower.startsWith(prefix)) return false;
            if (suffix && !wordLower.endsWith(suffix)) return false;
            
            return true;
        });
        
        // Sort results based on selected option
        if (sortOption === 'shortest') {
            results.sort((a, b) => a.length - b.length);
        } else if (sortOption === 'longest') {
            results.sort((a, b) => b.length - a.length);
        } else if (sortOption === 'alpha') {
            results.sort((a, b) => a.localeCompare(b));
        }
        // 'none' keeps original order (as loaded from file)
        
        // Update result count
        document.getElementById('result-count').textContent = results.length;
        
        // Display results
        this.displayResults(results, criteria);
    }

    displayResults(results, criteria) {
        const resultsBox = document.getElementById('results-box');
        
        if (results.length === 0) {
            let message = 'No words match your criteria';
            if (criteria.length > 0) {
                message += ` (${criteria.join(' and ')})`;
            }
            resultsBox.innerHTML = `<p class="placeholder-text">🔍 ${message}</p>`;
            return;
        }
        
        let html = '';
        const displayResults = results.slice(0, 50); // Show top 50 for better visibility
        
        // Add summary header
        if (criteria.length > 0) {
            html += `<div class="result-item" style="background: #e3f2fd; font-weight: bold; border-radius: 8px; margin-bottom: 10px;">
                Found ${results.length} words matching: ${criteria.join(' and ')}
            </div>`;
        } else {
            html += `<div class="result-item" style="background: #f5f5f5; font-weight: bold; border-radius: 8px; margin-bottom: 10px;">
                Showing first ${Math.min(50, results.length)} of ${results.length} words
            </div>`;
        }
        
        displayResults.forEach((word, index) => {
            const prefix = document.getElementById('prefix-input').value.toLowerCase().trim();
            const suffix = document.getElementById('suffix-input').value.toLowerCase().trim();
            
            let matches = [];
            if (prefix && word.toLowerCase().startsWith(prefix)) {
                matches.push(`starts with '${prefix}'`);
            }
            if (suffix && word.toLowerCase().endsWith(suffix)) {
                matches.push(`ends with '${suffix}'`);
            }
            
            const matchInfo = matches.length > 0 ? `<span class="result-highlight"> (${matches.join(', ')})</span>` : '';
            
            html += `
                <div class="result-item">
                    <span class="result-number">${index + 1}.</span>
                    ${word}${matchInfo}
                    <span class="result-length">[${word.length}]</span>
                </div>
            `;
        });
        
        if (results.length > 50) {
            html += `
                <div class="result-item" style="color: #6c757d; font-style: italic; background: #f8f9fa;">
                    ... and ${results.length - 50} more results (showing top 50 only)
                </div>
            `;
        }
        
        resultsBox.innerHTML = html;
    }

    showSuccess(message) {
        const resultsBox = document.getElementById('results-box');
        resultsBox.innerHTML = `<div class="success-message">${message}</div>`;
    }

    showError(message) {
        const resultsBox = document.getElementById('results-box');
        resultsBox.innerHTML = `<div class="error-message">❌ ${message}</div>`;
    }

    showLoading(message) {
        const resultsBox = document.getElementById('results-box');
        resultsBox.innerHTML = `<div class="loading-message">⏳ ${message}</div>`;
    }

    clearAll() {
        document.getElementById('results-box').innerHTML = '<p class="placeholder-text">Click "Load Words" to begin...</p>';
        document.getElementById('prefix-input').value = '';
        document.getElementById('suffix-input').value = '';
        document.querySelector('input[name="sort"][value="none"]').checked = true;
        document.getElementById('result-count').textContent = '0';
        // Clear loaded words as well
        this.words = [];
        document.getElementById('word-count').textContent = '0';
    }
}

// Initialize the app when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new InesBotSearcher();
});
