const themeToggle = document.getElementById('theme-toggle');
const htmlElement = document.documentElement;

const savedTheme = localStorage.getItem('theme') || 'light';
htmlElement.setAttribute('data-theme', savedTheme);

themeToggle.addEventListener('click', () => {
    document.documentElement.classList.add('theme-transitioning');
    
    const currentTheme = htmlElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    
    htmlElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    
    setTimeout(() => {
        document.documentElement.classList.remove('theme-transitioning');
    }, 20);
});

class InesBotSearcher {
    constructor() {
        this.words = [];
        this.wordListUrl = 'https://raw.githubusercontent.com/inesbotv1/askari/refs/heads/main/lastletter.txt';
        
        this.checkRequiredElements();
        
        this.initEventListeners();
        setTimeout(() => {
            this.loadWordsFromURL();
        }, 100);
    }

    checkRequiredElements() {
        const requiredIds = [
            'results-box', 'word-count', 'result-count', 
            'prefix-input', 'suffix-input', 'search-btn', 'clear-btn'
        ];
        
        let missingElements = [];
        
        requiredIds.forEach(id => {
            if (!document.getElementById(id)) {
                missingElements.push(id);
                console.error(`❌ Required element with id "${id}" not found in HTML!`);
            }
        });
        
        if (missingElements.length > 0) {
            console.warn(`Missing elements: ${missingElements.join(', ')}. The app may not function correctly.`);
            
            const resultsBox = document.getElementById('results-box');
            if (resultsBox) {
                resultsBox.innerHTML = `<div class="error-message">❌ Critical error: Missing HTML elements: ${missingElements.join(', ')}. Please check the console.</div>`;
            } else {
                alert(`Error: Missing required elements: ${missingElements.join(', ')}`);
            }
        } else {
            console.log('✅ All required elements found');
        }
    }

    initEventListeners() {
        const searchBtn = document.getElementById('search-btn');
        if (searchBtn) {
            searchBtn.addEventListener('click', () => this.performSearch());
        } else {
            console.error('Search button not found');
        }
        
        const clearBtn = document.getElementById('clear-btn');
        if (clearBtn) {
            clearBtn.addEventListener('click', () => this.clearSearch());
        } else {
            console.error('Clear button not found');
        }
        
        const prefixInput = document.getElementById('prefix-input');
        if (prefixInput) {
            prefixInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.performSearch();
            });
        } else {
            console.error('Prefix input not found');
        }
        
        const suffixInput = document.getElementById('suffix-input');
        if (suffixInput) {
            suffixInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.performSearch();
            });
        } else {
            console.error('Suffix input not found');
        }
    }

    async loadWordsFromURL() {
        console.log('📥 loadWordsFromURL started');
        console.log('Current words array length:', this.words.length);
        
        const resultsBox = document.getElementById('results-box');
        const wordCountElement = document.getElementById('word-count');
        const resultCountElement = document.getElementById('result-count');
        
        if (!resultsBox) {
            console.error('❌ results-box element not found! Cannot display loading message.');
            return;
        }
        
        resultsBox.innerHTML = '<div class="loading-message">⏳ Loading words from GitHub...</div>';
        
        try {
            console.log('Fetching from:', this.wordListUrl);
            
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
            
            if (!response.ok) {
                throw new Error(`Failed to load: ${response.status} ${response.statusText}`);
            }
            
            const text = await response.text();
            console.log('Raw text length:', text.length);
            
            if (!text || text.length === 0) {
                throw new Error('Word list file is empty');
            }
            
            const words = text.split(/\r?\n/)
                .map(word => word.trim())
                .filter(word => word.length > 0);
            
            console.log('Words found:', words.length);
            console.log('First 5 words:', words.slice(0, 5));
            
            if (words.length === 0) {
                throw new Error('No words found in the file');
            }
            
            this.words = [...new Set(words)];
            
            if (wordCountElement) {
                wordCountElement.textContent = this.words.length;
                console.log('Updated word count to:', this.words.length);
            } else {
                console.error('word-count element not found');
            }
            
            if (resultCountElement) {
                resultCountElement.textContent = '0';
            }
            
            this.showSuccess(`Successfully loaded ${this.words.length} words!`);
            
        } catch (error) {
            console.error('❌ Error loading words:', error);
            
            if (error.message.includes('Failed to fetch')) {
                this.showError('Network error: Cannot reach GitHub. Check your internet connection.');
            } else if (error.message.includes('404')) {
                this.showError('File not found on GitHub. Check if the URL is correct: <br>' + this.wordListUrl);
            } else {
                this.showError(`Failed to load words: ${error.message}`);
            }
            
            this.words = [];
            
            if (wordCountElement) {
                wordCountElement.textContent = '0';
            }
        }
    }

    performSearch() {
        console.log('Performing search. Words loaded:', this.words.length);
        
        if (this.words.length === 0) {
            this.showError('No words loaded. Please refresh the page to try again.');
            return;
        }

        const prefixInput = document.getElementById('prefix-input');
        const suffixInput = document.getElementById('suffix-input');
        const sortRadios = document.querySelectorAll('input[name="sort"]');
        
        if (!prefixInput || !suffixInput) {
            console.error('Search inputs not found');
            this.showError('Error: Search inputs not found in HTML');
            return;
        }
        
        if (sortRadios.length === 0) {
            console.error('Sort radio buttons not found');
            this.showError('Error: Sort options not found in HTML');
            return;
        }
        
        const prefix = prefixInput.value.toLowerCase().trim();
        const suffix = suffixInput.value.toLowerCase().trim();
        
        let checkedRadio = null;
        for (let radio of sortRadios) {
            if (radio.checked) {
                checkedRadio = radio;
                break;
            }
        }
        
        const sortOption = checkedRadio ? checkedRadio.value : 'none';
        
        let criteria = [];
        if (prefix) criteria.push(`starts with '${prefix}'`);
        if (suffix) criteria.push(`ends with '${suffix}'`);
        
        let results = this.words.filter(word => {
            const wordLower = word.toLowerCase();
            
            if (prefix && !wordLower.startsWith(prefix)) return false;
            if (suffix && !wordLower.endsWith(suffix)) return false;
            
            return true;
        });
        
        if (sortOption === 'shortest') {
            results.sort((a, b) => a.length - b.length);
        } else if (sortOption === 'longest') {
            results.sort((a, b) => b.length - a.length);
        } else if (sortOption === 'alpha') {
            results.sort((a, b) => a.localeCompare(b));
        }
        
        const resultCountElement = document.getElementById('result-count');
        if (resultCountElement) {
            resultCountElement.textContent = results.length;
        }
        
        this.displayResults(results, criteria);
    }

    displayResults(results, criteria) {
        const resultsBox = document.getElementById('results-box');
        
        if (!resultsBox) {
            console.error('results-box element not found!');
            return;
        }
        
        const MAX_DISPLAY = 1000;
        
        if (results.length === 0) {
            let message = 'No words match your criteria';
            if (criteria.length > 0) {
                message += ` (${criteria.join(' and ')})`;
            }
            resultsBox.innerHTML = `<p class="placeholder-text">🔍 ${message}</p>`;
            return;
        }
        
        let html = '';
        const displayResults = results.slice(0, MAX_DISPLAY);
        
        if (criteria.length > 0) {
            html += `<div class="result-item" style="background: var(--highlight-bg); font-weight: bold; border-radius: 8px; margin-bottom: 10px; color: var(--text-primary);">
                Found ${results.length} words matching: ${criteria.join(' and ')}
            </div>`;
        } else {
            html += `<div class="result-item" style="background: var(--highlight-bg); font-weight: bold; border-radius: 8px; margin-bottom: 10px; color: var(--text-primary);">
                Showing first ${Math.min(MAX_DISPLAY, results.length)} of ${results.length} words
            </div>`;
        }
        
        displayResults.forEach((word, index) => {
            const prefix = document.getElementById('prefix-input')?.value.toLowerCase().trim() || '';
            const suffix = document.getElementById('suffix-input')?.value.toLowerCase().trim() || '';
            
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
                    <span class="result-word">${word}</span>${matchInfo}
                    <span class="result-length">[${word.length}]</span>
                </div>
            `;
        });
        
        if (results.length > MAX_DISPLAY) {
            html += `
                <div class="result-item" style="color: var(--text-secondary); font-style: italic; background: var(--highlight-bg);">
                    ... and ${results.length - MAX_DISPLAY} more results (showing first ${MAX_DISPLAY} only)
                </div>
            `;
        }
        
        resultsBox.innerHTML = html;
    }

    showSuccess(message) {
        const resultsBox = document.getElementById('results-box');
        if (resultsBox) {
            resultsBox.innerHTML = `<div class="success-message">${message}</div>`;
            console.log('✅ Success:', message);
        } else {
            console.error('Cannot show success message - results-box not found');
        }
    }

    showError(message) {
        const resultsBox = document.getElementById('results-box');
        if (resultsBox) {
            resultsBox.innerHTML = `<div class="error-message">❌ ${message}</div>`;
            console.error('❌ Error displayed:', message);
        } else {
            console.error('Cannot show error message - results-box not found. Error:', message);
        }
    }

    showLoading(message) {
        const resultsBox = document.getElementById('results-box');
        if (resultsBox) {
            resultsBox.innerHTML = `<div class="loading-message">⏳ ${message}</div>`;
        }
    }

    clearSearch() {
        const resultsBox = document.getElementById('results-box');
        const prefixInput = document.getElementById('prefix-input');
        const suffixInput = document.getElementById('suffix-input');
        const sortRadios = document.querySelectorAll('input[name="sort"]');
        const resultCountElement = document.getElementById('result-count');
        
        if (resultsBox) {
            resultsBox.innerHTML = '<p class="placeholder-text">Enter search criteria and click Search...</p>';
        }
        
        if (prefixInput) prefixInput.value = '';
        if (suffixInput) suffixInput.value = '';
        
        sortRadios.forEach(radio => {
            if (radio.value === 'none') {
                radio.checked = true;
            } else {
                radio.checked = false;
            }
        });
        
        if (resultCountElement) {
            resultCountElement.textContent = '0';
        }
        
        console.log('Search cleared');
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded, initializing InesBotSearcher...');
    new InesBotSearcher();
});
(function() {
    if (typeof InesBotSearcher === 'undefined') {
        console.error('InesBotSearcher not found!');
        return;
    }

    console.log('📚 Initializing Persistent Dictionary Panel...');

    const originalDisplayResults = InesBotSearcher.prototype.displayResults;

    InesBotSearcher.prototype.displayResults = function(results, criteria) {
        originalDisplayResults.call(this, results, criteria);
        
        setTimeout(() => {
            makeWordsClickable();
        }, 50);
    };

    const definitionCache = new Map();
    
    let dictionaryPanel = null;
    let panelPosition = { top: 100, left: 100 }; 
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };

    function createDictionaryPanel() {
        if (dictionaryPanel) return dictionaryPanel;
        
        const panel = document.createElement('div');
        panel.id = 'dictionary-panel';
        
        panel.style.cssText = `
            position: fixed;
            background: var(--bg-secondary);
            border: 1px solid var(--border-primary);
            border-radius: 8px;
            padding: 0;
            width: 320px;
            max-height: 400px;
            overflow: hidden;
            box-shadow: 0 4px 15px var(--shadow-color);
            z-index: 10000;
            font-size: 13px;
            line-height: 1.5;
            top: ${panelPosition.top}px;
            left: ${panelPosition.left}px;
            display: flex;
            flex-direction: column;
            resize: both;
            min-width: 250px;
            min-height: 200px;
            transition: box-shadow 0.2s ease;
        `;

        const header = document.createElement('div');
        header.id = 'dictionary-header';
        header.style.cssText = `
            padding: 10px 12px;
            background: var(--bg-tertiary);
            border-bottom: 1px solid var(--border-primary);
            cursor: move;
            user-select: none;
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-weight: 500;
            color: var(--text-primary);
        `;
        
        header.innerHTML = `
            <span>📖 Dictionary</span>
            <div style="display: flex; gap: 8px;">
                <span style="cursor: pointer; font-size: 16px; color: var(--text-secondary);" id="minimize-panel">−</span>
                <span style="cursor: pointer; font-size: 16px; color: var(--text-secondary);" id="close-panel">×</span>
            </div>
        `;

        const content = document.createElement('div');
        content.id = 'dictionary-content';
        content.style.cssText = `
            padding: 15px;
            overflow-y: auto;
            flex: 1;
            color: var(--text-primary);
        `;
        content.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                Click any word to see its definition here
            </div>
        `;

        panel.appendChild(header);
        panel.appendChild(content);
        document.body.appendChild(panel);
        
        dictionaryPanel = panel;
        
        setupDragHandlers(panel, header);
        
        document.getElementById('close-panel').addEventListener('click', (e) => {
            e.stopPropagation();
            panel.remove();
            dictionaryPanel = null;
        });
        
        document.getElementById('minimize-panel').addEventListener('click', (e) => {
            e.stopPropagation();
            const content = document.getElementById('dictionary-content');
            if (content.style.display === 'none') {
                content.style.display = 'block';
                e.target.textContent = '−';
            } else {
                content.style.display = 'none';
                e.target.textContent = '+';
            }
        });
        
        return panel;
    }

    function setupDragHandlers(panel, header) {
        header.addEventListener('mousedown', (e) => {
            if (e.target.closest('#close-panel') || e.target.closest('#minimize-panel')) return;
            
            isDragging = true;
            dragOffset.x = e.clientX - panel.offsetLeft;
            dragOffset.y = e.clientY - panel.offsetTop;
            panel.style.cursor = 'grabbing';
            panel.style.transition = 'none';
            panel.style.boxShadow = '0 8px 25px var(--shadow-color)';
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            e.preventDefault();
            
            let newLeft = e.clientX - dragOffset.x;
            let newTop = e.clientY - dragOffset.y;
            
            newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - panel.offsetWidth));
            newTop = Math.max(0, Math.min(newTop, window.innerHeight - panel.offsetHeight));
            
            panel.style.left = newLeft + 'px';
            panel.style.top = newTop + 'px';
            
            panelPosition = { top: newTop, left: newLeft };
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                panel.style.cursor = '';
                panel.style.transition = 'box-shadow 0.2s ease';
                panel.style.boxShadow = '0 4px 15px var(--shadow-color)';
            }
        });
    }

    function updatePanelContent(content) {
        if (!dictionaryPanel) {
            dictionaryPanel = createDictionaryPanel();
        }
        
        const contentDiv = document.getElementById('dictionary-content');
        if (contentDiv) {
            contentDiv.innerHTML = content;
        }
    }

    function showLoadingInPanel(word) {
        const content = `
            <div style="text-align: center; padding: 20px;">
                <div style="color: var(--text-primary); margin-bottom: 8px;">🔍 Loading "${word}"</div>
            </div>
        `;
        updatePanelContent(content);
    }

    function showDefinitionInPanel(data) {
        let html = `
            <div style="border-bottom: 1px solid var(--border-primary); padding-bottom: 8px; margin-bottom: 10px;">
                <div style="font-size: 18px; font-weight: 500; color: var(--text-primary);">${data.word}</div>
        `;
        
        if (data.phonetic) {
            html += `<div style="font-family: monospace; color: var(--text-secondary); font-size: 12px; margin-top: 2px;">/${data.phonetic}/</div>`;
        }
        
        html += `</div>`;

        data.meanings.forEach((meaning) => {
            html += `
                <div style="margin-bottom: 10px; padding: 8px; background: var(--highlight-bg); border-radius: 6px;">
                    <div style="font-weight: 600; color: var(--text-tertiary); margin-bottom: 3px; font-size: 11px; text-transform: uppercase;">
                        ${meaning.partOfSpeech}
                    </div>
                    <div style="color: var(--text-primary); line-height: 1.4; font-size: 13px;">
                        ${meaning.definition}
                    </div>
            `;
            
            if (meaning.example) {
                html += `
                    <div style="color: var(--text-secondary); font-style: italic; margin-top: 5px; font-size: 12px; border-left: 2px solid var(--border-secondary); padding-left: 8px;">
                        "${meaning.example}"
                    </div>
                `;
            }
            
            html += `</div>`;
        });

        updatePanelContent(html);
    }

    function showNoDefinitionInPanel(word) {
        const content = `
            <div style="text-align: center; padding: 20px;">
                <div style="color: var(--text-primary); font-size: 14px; line-height: 1.5;">
                    It just works twin, don't worry about the definition
                </div>
            </div>
        `;
        updatePanelContent(content);
    }

    function makeWordsClickable() {
        const resultWords = document.querySelectorAll('.result-word');
        
        resultWords.forEach((wordElement) => {
            const newElement = wordElement.cloneNode(true);
            wordElement.parentNode.replaceChild(newElement, wordElement);
            
            newElement.style.cursor = 'pointer';
            newElement.style.display = 'inline-block';
            newElement.style.padding = '0 2px';
            newElement.style.color = 'var(--result-word)';
            newElement.style.textDecoration = 'none'; 
            
            newElement.addEventListener('mouseenter', () => {
                newElement.style.backgroundColor = 'var(--highlight-bg)';
                newElement.style.borderRadius = '4px';
            });
            
            newElement.addEventListener('mouseleave', () => {
                newElement.style.backgroundColor = 'transparent';
            });
            
            newElement.addEventListener('click', async (event) => {
                event.stopPropagation();
                event.preventDefault();
                
                const word = newElement.textContent;
                
                showLoadingInPanel(word);
                
                if (definitionCache.has(word)) {
                    showDefinitionInPanel(definitionCache.get(word));
                    return;
                }
                
                const definition = await fetchFromWiktionary(word);
                
                if (definition) {
                    definitionCache.set(word, definition);
                    showDefinitionInPanel(definition);
                } else {
                    showNoDefinitionInPanel(word);
                }
            });
        });
    }

    async function fetchFromWiktionary(word) {
        try {
            const url = `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`;
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) throw new Error('Not found');
            const data = await response.json();
            return parseWiktionaryResponse(word, data);
        } catch (error) {
            return null;
        }
    }

    function parseWiktionaryResponse(word, data) {
        if (!data || !data.en) return null;

        const result = {
            word: word,
            phonetic: '',
            meanings: []
        };

        data.en.forEach(entry => {
            if (entry.partOfSpeech && entry.definitions) {
                entry.definitions.slice(0, 2).forEach(def => {
                    let definition = def.definition
                        .replace(/\[.*?\]/g, '')
                        .replace(/\{.*?\}/g, '')
                        .replace(/<[^>]*>/g, '') 
                        .trim();
                    
                    if (definition) {
                        result.meanings.push({
                            partOfSpeech: entry.partOfSpeech,
                            definition: definition,
                            example: def.examples ? def.examples[0] : null
                        });
                    }
                });
            }
        });

        if (result.meanings.length > 0) {
            result.meanings.forEach(m => {
                if (m.example) {
                    m.example = m.example.replace(/<[^>]*>/g, '').trim();
                }
            });
        }

        return result.meanings.length > 0 ? result : null;
    }

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            if (dictionaryPanel) {
                dictionaryPanel.style.opacity = '0.99';
                setTimeout(() => {
                    dictionaryPanel.style.opacity = '1';
                }, 10);
            }
        });
    }

    console.log('✅ Persistent Dictionary Panel Ready!');
    console.log('📌 Drag the header to move it around');
})();;
(function() {
    if (typeof InesBotSearcher === 'undefined') {
        console.error('InesBotSearcher not found!');
        return;
    }

    console.log('📚 Initializing Persistent Dictionary Panel (Mobile Ready)...');

    const originalDisplayResults = InesBotSearcher.prototype.displayResults;

    InesBotSearcher.prototype.displayResults = function(results, criteria) {
        originalDisplayResults.call(this, results, criteria);
        
        setTimeout(() => {
            makeWordsClickable();
        }, 50);
    };

    const definitionCache = new Map();
    
    let dictionaryPanel = null;
    let panelPosition = { top: 100, left: 100 };
    let isDragging = false;
    let dragOffset = { x: 0, y: 0 };
    let currentTouchId = null;

    function isMobile() {
        return window.innerWidth <= 768;
    }

    function createDictionaryPanel() {
        if (dictionaryPanel) return dictionaryPanel;
        
        const panel = document.createElement('div');
        panel.id = 'dictionary-panel';
        
        if (isMobile()) {
            panel.style.cssText = `
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: var(--bg-secondary);
                border-top: 2px solid var(--border-primary);
                border-radius: 16px 16px 0 0;
                padding: 0;
                max-height: 50vh;
                overflow: hidden;
                box-shadow: 0 -4px 15px var(--shadow-color);
                z-index: 10000;
                font-size: 14px;
                line-height: 1.5;
                display: flex;
                flex-direction: column;
                transform: translateY(0);
                transition: transform 0.3s ease;
                animation: slideUp 0.3s ease;
            `;

            const pullHandle = document.createElement('div');
            pullHandle.style.cssText = `
                width: 40px;
                height: 5px;
                background: var(--border-secondary);
                border-radius: 3px;
                margin: 8px auto;
                cursor: grab;
            `;
            panel.appendChild(pullHandle);

            let startY = 0;
            let startHeight = 0;
            
            pullHandle.addEventListener('touchstart', (e) => {
                startY = e.touches[0].clientY;
                startHeight = panel.offsetHeight;
                pullHandle.style.cursor = 'grabbing';
            }, { passive: true });
            
            pullHandle.addEventListener('touchmove', (e) => {
                e.preventDefault();
                const deltaY = e.touches[0].clientY - startY;
                const newHeight = Math.max(200, Math.min(400, startHeight - deltaY));
                panel.style.maxHeight = newHeight + 'px';
            }, { passive: false });
            
            pullHandle.addEventListener('touchend', () => {
                pullHandle.style.cursor = 'grab';
            });

            const mobileHeader = document.createElement('div');
            mobileHeader.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 8px 15px;
                border-bottom: 1px solid var(--border-primary);
                background: var(--bg-tertiary);
            `;
            mobileHeader.innerHTML = `
                <span style="font-weight: 500; color: var(--text-primary);">📖 Dictionary</span>
                <span style="cursor: pointer; font-size: 24px; color: var(--text-secondary); padding: 0 8px;" id="close-panel-mobile">×</span>
            `;
            panel.appendChild(mobileHeader);

        } else {
            panel.style.cssText = `
                position: fixed;
                background: var(--bg-secondary);
                border: 1px solid var(--border-primary);
                border-radius: 8px;
                padding: 0;
                width: 320px;
                max-height: 400px;
                overflow: hidden;
                box-shadow: 0 4px 15px var(--shadow-color);
                z-index: 10000;
                font-size: 13px;
                line-height: 1.5;
                top: ${panelPosition.top}px;
                left: ${panelPosition.left}px;
                display: flex;
                flex-direction: column;
                resize: both;
                min-width: 250px;
                min-height: 200px;
                transition: box-shadow 0.2s ease;
            `;

            const header = document.createElement('div');
            header.id = 'dictionary-header';
            header.style.cssText = `
                padding: 10px 12px;
                background: var(--bg-tertiary);
                border-bottom: 1px solid var(--border-primary);
                cursor: move;
                user-select: none;
                display: flex;
                justify-content: space-between;
                align-items: center;
                font-weight: 500;
                color: var(--text-primary);
                touch-action: none;
            `;
            
            header.innerHTML = `
                <span>📖 Dictionary</span>
                <div style="display: flex; gap: 8px;">
                    <span style="cursor: pointer; font-size: 16px; color: var(--text-secondary);" id="minimize-panel">−</span>
                    <span style="cursor: pointer; font-size: 16px; color: var(--text-secondary);" id="close-panel">×</span>
                </div>
            `;
            panel.appendChild(header);

            setupDragHandlers(panel, header);
        }

        const content = document.createElement('div');
        content.id = 'dictionary-content';
        content.style.cssText = `
            padding: 15px;
            overflow-y: auto;
            flex: 1;
            color: var(--text-primary);
            -webkit-overflow-scrolling: touch;
        `;
        content.innerHTML = `
            <div style="text-align: center; padding: 20px; color: var(--text-secondary);">
                Click any word to see its definition
            </div>
        `;

        panel.appendChild(content);
        document.body.appendChild(panel);
        
        dictionaryPanel = panel;
        
        const closeBtn = document.getElementById('close-panel') || document.getElementById('close-panel-mobile');
        if (closeBtn) {
            closeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                closeDictionaryPanel();
            });
        }
        
        const minimizeBtn = document.getElementById('minimize-panel');
        if (minimizeBtn) {
            minimizeBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                const content = document.getElementById('dictionary-content');
                if (content.style.display === 'none') {
                    content.style.display = 'block';
                    e.target.textContent = '−';
                } else {
                    content.style.display = 'none';
                    e.target.textContent = '+';
                }
            });
        }
        
        return panel;
    }

    function setupDragHandlers(panel, header) {
        header.addEventListener('mousedown', startDrag);
        
        header.addEventListener('touchstart', handleTouchStart, { passive: false });
        header.addEventListener('touchmove', handleTouchMove, { passive: false });
        header.addEventListener('touchend', handleTouchEnd);
        header.addEventListener('touchcancel', handleTouchEnd);

        function startDrag(e) {
            if (e.target.closest('#close-panel') || e.target.closest('#minimize-panel')) return;
            
            isDragging = true;
            dragOffset.x = e.clientX - panel.offsetLeft;
            dragOffset.y = e.clientY - panel.offsetTop;
            panel.style.cursor = 'grabbing';
            panel.style.transition = 'none';
            panel.style.boxShadow = '0 8px 25px var(--shadow-color)';
            
            document.addEventListener('mousemove', onDrag);
            document.addEventListener('mouseup', stopDrag);
        }

        function handleTouchStart(e) {
            if (e.target.closest('#close-panel') || e.target.closest('#minimize-panel')) return;
            
            e.preventDefault();
            const touch = e.touches[0];
            currentTouchId = touch.identifier;
            
            isDragging = true;
            dragOffset.x = touch.clientX - panel.offsetLeft;
            dragOffset.y = touch.clientY - panel.offsetTop;
            panel.style.transition = 'none';
            panel.style.boxShadow = '0 8px 25px var(--shadow-color)';
        }

        function handleTouchMove(e) {
            if (!isDragging) return;
            e.preventDefault();
            
            const touch = Array.from(e.touches).find(t => t.identifier === currentTouchId);
            if (!touch) return;
            
            let newLeft = touch.clientX - dragOffset.x;
            let newTop = touch.clientY - dragOffset.y;
            
            newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - panel.offsetWidth));
            newTop = Math.max(0, Math.min(newTop, window.innerHeight - panel.offsetHeight));
            
            panel.style.left = newLeft + 'px';
            panel.style.top = newTop + 'px';
            
            panelPosition = { top: newTop, left: newLeft };
        }

        function handleTouchEnd(e) {
            if (isDragging) {
                e.preventDefault();
                stopDrag();
            }
            currentTouchId = null;
        }

        function onDrag(e) {
            if (!isDragging) return;
            
            e.preventDefault();
            
            let newLeft = e.clientX - dragOffset.x;
            let newTop = e.clientY - dragOffset.y;
            
            newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - panel.offsetWidth));
            newTop = Math.max(0, Math.min(newTop, window.innerHeight - panel.offsetHeight));
            
            panel.style.left = newLeft + 'px';
            panel.style.top = newTop + 'px';
            
            panelPosition = { top: newTop, left: newLeft };
        }

        function stopDrag() {
            if (isDragging) {
                isDragging = false;
                panel.style.cursor = '';
                panel.style.transition = 'box-shadow 0.2s ease';
                panel.style.boxShadow = '0 4px 15px var(--shadow-color)';
                
                document.removeEventListener('mousemove', onDrag);
                document.removeEventListener('mouseup', stopDrag);
            }
        }
    }

    function closeDictionaryPanel() {
        if (dictionaryPanel) {
            if (isMobile()) {
                dictionaryPanel.style.transform = 'translateY(100%)';
                setTimeout(() => {
                    if (dictionaryPanel) {
                        dictionaryPanel.remove();
                        dictionaryPanel = null;
                    }
                }, 300);
            } else {
                dictionaryPanel.remove();
                dictionaryPanel = null;
            }
        }
    }

    function updatePanelContent(content) {
        if (!dictionaryPanel) {
            dictionaryPanel = createDictionaryPanel();
        }
        
        const contentDiv = document.getElementById('dictionary-content');
        if (contentDiv) {
            contentDiv.innerHTML = content;
            contentDiv.scrollTop = 0;
        }
    }

    function showLoadingInPanel(word) {
        const content = `
            <div style="text-align: center; padding: 20px;">
                <div style="color: var(--text-primary); margin-bottom: 8px;">🔍 Loading "${word}"</div>
            </div>
        `;
        updatePanelContent(content);
    }

    function showDefinitionInPanel(data) {
        let html = `
            <div style="border-bottom: 1px solid var(--border-primary); padding-bottom: 8px; margin-bottom: 10px;">
                <div style="font-size: ${isMobile() ? '20px' : '18px'}; font-weight: 500; color: var(--text-primary);">${data.word}</div>
        `;
        
        if (data.phonetic) {
            html += `<div style="font-family: monospace; color: var(--text-secondary); font-size: ${isMobile() ? '13px' : '12px'}; margin-top: 2px;">/${data.phonetic}/</div>`;
        }
        
        html += `</div>`;

        data.meanings.forEach((meaning) => {
            html += `
                <div style="margin-bottom: 12px; padding: ${isMobile() ? '10px' : '8px'}; background: var(--highlight-bg); border-radius: 6px;">
                    <div style="font-weight: 600; color: var(--text-tertiary); margin-bottom: 4px; font-size: ${isMobile() ? '12px' : '11px'}; text-transform: uppercase;">
                        ${meaning.partOfSpeech}
                    </div>
                    <div style="color: var(--text-primary); line-height: 1.5; font-size: ${isMobile() ? '14px' : '13px'};">
                        ${meaning.definition}
                    </div>
            `;
            
            if (meaning.example) {
                html += `
                    <div style="color: var(--text-secondary); font-style: italic; margin-top: 6px; font-size: ${isMobile() ? '13px' : '12px'}; border-left: 2px solid var(--border-secondary); padding-left: 8px;">
                        "${meaning.example}"
                    </div>
                `;
            }
            
            html += `</div>`;
        });

        updatePanelContent(html);
    }

    function showNoDefinitionInPanel(word) {
        const content = `
            <div style="text-align: center; padding: ${isMobile() ? '30px' : '20px'};">
                <div style="color: var(--text-primary); font-size: ${isMobile() ? '16px' : '14px'}; line-height: 1.5;">
                    It just works twin, don't worry about the definition
                </div>
            </div>
        `;
        updatePanelContent(content);
    }

    function makeWordsClickable() {
        const resultWords = document.querySelectorAll('.result-word');
        
        resultWords.forEach((wordElement) => {
            const newElement = wordElement.cloneNode(true);
            wordElement.parentNode.replaceChild(newElement, wordElement);
            
            newElement.style.cursor = 'pointer';
            newElement.style.display = 'inline-block';
            newElement.style.padding = '2px 4px';
            newElement.style.color = 'var(--result-word)';
            newElement.style.textDecoration = 'none';
            newElement.style.touchAction = 'manipulation'; 
            
            if (!isMobile()) {
                newElement.addEventListener('mouseenter', () => {
                    newElement.style.backgroundColor = 'var(--highlight-bg)';
                    newElement.style.borderRadius = '4px';
                });
                
                newElement.addEventListener('mouseleave', () => {
                    newElement.style.backgroundColor = 'transparent';
                });
            }
            
            newElement.addEventListener('click', async (event) => {
                event.stopPropagation();
                event.preventDefault();
                
                const word = newElement.textContent;
            
                showLoadingInPanel(word);
                
                if (definitionCache.has(word)) {
                    showDefinitionInPanel(definitionCache.get(word));
                    return;
                }
                
                const definition = await fetchFromWiktionary(word);
                
                if (definition) {
                    definitionCache.set(word, definition);
                    showDefinitionInPanel(definition);
                } else {
                    showNoDefinitionInPanel(word);
                }
            });
        });
    }

    async function fetchFromWiktionary(word) {
        try {
            const url = `https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`;
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json' }
            });
            
            if (!response.ok) throw new Error('Not found');
            const data = await response.json();
            return parseWiktionaryResponse(word, data);
        } catch (error) {
            return null;
        }
    }

    function parseWiktionaryResponse(word, data) {
        if (!data || !data.en) return null;

        const result = {
            word: word,
            phonetic: '',
            meanings: []
        };

        data.en.forEach(entry => {
            if (entry.partOfSpeech && entry.definitions) {
                entry.definitions.slice(0, 2).forEach(def => {
                    let definition = def.definition
                        .replace(/\[.*?\]/g, '')
                        .replace(/\{.*?\}/g, '')
                        .replace(/<[^>]*>/g, '')
                        .trim();
                    
                    if (definition) {
                        result.meanings.push({
                            partOfSpeech: entry.partOfSpeech,
                            definition: definition,
                            example: def.examples ? def.examples[0] : null
                        });
                    }
                });
            }
        });

        if (result.meanings.length > 0) {
            result.meanings.forEach(m => {
                if (m.example) {
                    m.example = m.example.replace(/<[^>]*>/g, '').trim();
                }
            });
        }

        return result.meanings.length > 0 ? result : null;
    }

    const style = document.createElement('style');
    style.textContent = `
        @keyframes slideUp {
            from { transform: translateY(100%); }
            to { transform: translateY(0); }
        }
        
        .result-word {
            -webkit-tap-highlight-color: transparent;
        }
        
        /* Mobile improvements */
        @media (max-width: 768px) {
            #dictionary-content {
                font-size: 14px;
                padding: 15px;
            }
            
            .result-word {
                padding: 4px 6px !important;
                margin: -2px 0;
            }
        }
    `;
    document.head.appendChild(style);

    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', () => {
            if (dictionaryPanel) {
                dictionaryPanel.style.opacity = '0.99';
                setTimeout(() => {
                    dictionaryPanel.style.opacity = '1';
                }, 10);
            }
        });
    }

    window.addEventListener('resize', () => {
        if (dictionaryPanel && isMobile()) {
            const wasOpen = dictionaryPanel;
            closeDictionaryPanel();
            if (wasOpen) {
                setTimeout(() => {
                    dictionaryPanel = createDictionaryPanel();
                    const contentDiv = document.getElementById('dictionary-content');
                    if (contentDiv) {
                        contentDiv.innerHTML = 'Click any word to see its definition';
                    }
                }, 50);
            }
        }
    });

    console.log('✅ Persistent Dictionary Panel Ready!');
    console.log('📱 Mobile compatible - drag handle to resize, swipe down to close');
})();
(function() {
    const style = document.createElement('style');
    style.textContent = '.result-word { text-decoration: underline !important; text-underline-offset: 2px; text-decoration-thickness: 1px; text-decoration-color: var(--text-secondary) !important; }';
    document.head.appendChild(style);
})();
// ============================================
// RARE PREFIX FINDER FEATURE
// ============================================

(function() {
    console.log('🔍 Initializing Rare Prefix Finder...');
    
    // Check if InesBotSearcher exists and has words
    function getWords() {
        // Try to get words from the main searcher instance
        if (window.inesBotSearcher && window.inesBotSearcher.words) {
            return window.inesBotSearcher.words;
        }
        
        // Fallback: look for any InesBotSearcher instance
        for (let key in window) {
            if (key.toLowerCase().includes('ines') && window[key] && window[key].words) {
                return window[key].words;
            }
        }
        
        return null;
    }
    
    // Store reference to the main searcher
    window.inesBotSearcher = window.inesBotSearcher || new InesBotSearcher();
    
    // Toggle panel function (make it global)
    window.toggleRarePrefixPanel = function() {
        const panel = document.getElementById('rare-prefix-panel');
        const icon = document.querySelector('.toggle-icon');
        
        if (panel) {
            if (panel.style.display === 'none') {
                panel.style.display = 'block';
                icon.textContent = '▼';
            } else {
                panel.style.display = 'none';
                icon.textContent = '▶';
            }
        }
    };
    
    // Function to find rare prefixes
    function findRarePrefixes(words, prefixLength, maxWords, minWords = 1) {
        const prefixCounts = new Map();
        
        // Count words for each prefix
        words.forEach(word => {
            if (word.length >= prefixLength) {
                const prefix = word.slice(0, prefixLength).toLowerCase();
                prefixCounts.set(prefix, (prefixCounts.get(prefix) || 0) + 1);
            }
        });
        
        // Filter and sort
        const rarePrefixes = [];
        prefixCounts.forEach((count, prefix) => {
            if (count >= minWords && count <= maxWords) {
                // Get example words
                const examples = words
                    .filter(w => w.toLowerCase().startsWith(prefix))
                    .slice(0, 5);
                
                rarePrefixes.push({
                    prefix: prefix,
                    count: count,
                    examples: examples
                });
            }
        });
        
        // Sort by count (ascending), then alphabetically
        rarePrefixes.sort((a, b) => {
            if (a.count !== b.count) return a.count - b.count;
            return a.prefix.localeCompare(b.prefix);
        });
        
        return rarePrefixes;
    }
    
    // Function to display results
    function displayRarePrefixes(prefixes, prefixLength, maxWords) {
        const resultsDiv = document.getElementById('rare-prefix-results');
        if (!resultsDiv) return;
        
        if (prefixes.length === 0) {
            resultsDiv.innerHTML = `
                <div class="status-message" style="margin: 0;">
                    No ${prefixLength}-letter prefixes found with ≤${maxWords} words
                </div>
            `;
            return;
        }
        
        let html = `
            <div class="rare-prefix-stats">
                Found ${prefixes.length} rare ${prefixLength}-letter prefixes (${prefixes[0].count} to ${prefixes[prefixes.length-1].count} words)
            </div>
        `;
        
        prefixes.forEach(item => {
            const exampleText = item.examples.slice(0, 3).join(', ');
            const moreCount = item.examples.length > 3 ? item.examples.length - 3 : 0;
            
            html += `
                <div class="rare-prefix-item">
                    <span class="rare-prefix-badge">${item.count} words</span>
                    <span class="rare-prefix-word">"${item.prefix}"</span>
                    <span class="rare-prefix-examples" onclick="toggleExamples(this)">
                        📋 ${item.count} words
                    </span>
                    <div class="rare-prefix-words-list">
                        ${item.examples.map(w => `<span>${w}</span>`).join('')}
                        ${moreCount > 0 ? `<span>... and ${moreCount} more</span>` : ''}
                    </div>
                </div>
            `;
        });
        
        resultsDiv.innerHTML = html;
    }
    
    // Make toggleExamples function global
    window.toggleExamples = function(element) {
        const wordsList = element.nextElementSibling;
        if (wordsList && wordsList.classList.contains('rare-prefix-words-list')) {
            wordsList.classList.toggle('show');
            element.textContent = wordsList.classList.contains('show') ? '🔽 Hide words' : `📋 ${element.closest('.rare-prefix-item').querySelector('.rare-prefix-badge').textContent}`;
        }
    };
    
    // Add click handler for the find button
    function setupRarePrefixFinder() {
        const findBtn = document.getElementById('find-rare-prefixes-btn');
        if (!findBtn) {
            console.error('Rare prefix button not found!');
            return;
        }
        
        findBtn.addEventListener('click', () => {
            const words = getWords();
            
            if (!words || words.length === 0) {
                const resultsDiv = document.getElementById('rare-prefix-results');
                if (resultsDiv) {
                    resultsDiv.innerHTML = `
                        <div class="error-message" style="margin: 0;">
                            ⚠️ No words loaded yet. Please wait for the word list to load.
                        </div>
                    `;
                }
                return;
            }
            
            const prefixLength = parseInt(document.getElementById('prefix-length').value);
            const maxWords = parseInt(document.getElementById('max-words').value);
            const minWords = parseInt(document.getElementById('min-words').value);
            
            const rarePrefixes = findRarePrefixes(words, prefixLength, maxWords, minWords);
            displayRarePrefixes(rarePrefixes, prefixLength, maxWords);
        });
    }
    
    // Add keyboard shortcut (Ctrl+Shift+P) to open rare prefix finder
    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.shiftKey && e.key === 'P') {
            e.preventDefault();
            const panel = document.getElementById('rare-prefix-panel');
            if (panel && panel.style.display === 'none') {
                toggleRarePrefixPanel();
            }
            document.getElementById('find-rare-prefixes-btn')?.click();
        }
    });
    
    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupRarePrefixFinder);
    } else {
        setupRarePrefixFinder();
    }
    
    // Also run after each search to ensure we can access words
    const originalSearch = InesBotSearcher.prototype.performSearch;
    InesBotSearcher.prototype.performSearch = function() {
        originalSearch.call(this);
        // Update reference to words
        window.inesBotSearcher = this;
    };
    
    console.log('✅ Rare Prefix Finder ready! Press Ctrl+Shift+P to quickly open it.');
})();
