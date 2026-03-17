// da theme toggle
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

// main searcher class
class InesBotSearcher {
    constructor() {
        this.words = [];
        this.wordListUrl = 'https://raw.githubusercontent.com/inesbotv1/askari/refs/heads/main/lastletter.txt';
        
        this.initEventListeners();
        this.loadWordsFromURL();
    }

    initEventListeners() {
        document.getElementById('search-btn')?.addEventListener('click', () => this.performSearch());
        document.getElementById('clear-btn')?.addEventListener('click', () => this.clearSearch());
        
        document.getElementById('prefix-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
        
        document.getElementById('suffix-input')?.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.performSearch();
        });
    }

    async loadWordsFromURL() {
        const resultsBox = document.getElementById('results-box');
        resultsBox.innerHTML = '<div class="loading-message">⏳ Loading words from GitHub...</div>';
        
        try {
            const response = await fetch(`${this.wordListUrl}?t=${Date.now()}`);
            const text = await response.text();
            
            this.words = text.split(/\r?\n/)
                .map(word => word.trim())
                .filter(word => word.length > 0);
            
            this.words = [...new Set(this.words)];
            
            document.getElementById('word-count').textContent = this.words.length;
            document.getElementById('result-count').textContent = '0';
            
            resultsBox.innerHTML = `<div class="success-message">Successfully loaded ${this.words.length} words!</div>`;
            
        } catch (error) {
            resultsBox.innerHTML = '<div class="error-message">Failed to load words from GitHub</div>';
        }
    }

    performSearch() {
        if (this.words.length === 0) {
            this.showError('No words loaded');
            return;
        }

        const prefix = document.getElementById('prefix-input').value.toLowerCase().trim();
        const suffix = document.getElementById('suffix-input').value.toLowerCase().trim();
        
        let results = this.words.filter(word => {
            const wordLower = word.toLowerCase();
            if (prefix && !wordLower.startsWith(prefix)) return false;
            if (suffix && !wordLower.endsWith(suffix)) return false;
            return true;
        });
        
        let sortOption = 'none';
        document.querySelectorAll('input[name="sort"]').forEach(radio => {
            if (radio.checked) sortOption = radio.value;
        });
        
        if (sortOption === 'shortest') {
            results.sort((a, b) => a.length - b.length);
        } else if (sortOption === 'longest') {
            results.sort((a, b) => b.length - a.length);
        } else if (sortOption === 'alpha') {
            results.sort((a, b) => a.localeCompare(b));
        }
        
        document.getElementById('result-count').textContent = results.length;
        this.displayResults(results);
    }

    displayResults(results) {
        const resultsBox = document.getElementById('results-box');
        
        if (results.length === 0) {
            resultsBox.innerHTML = '<p class="placeholder-text">🔍 No words match your criteria</p>';
            return;
        }
        
        let html = `<div class="result-item" style="background: var(--highlight-bg); font-weight: bold;">
            Found ${results.length} words
        </div>`;
        
        results.slice(0, 1000).forEach((word, index) => {
            html += `
                <div class="result-item">
                    <span class="result-number">${index + 1}.</span>
                    <span class="result-word">${word}</span>
                    <span class="result-length">[${word.length}]</span>
                </div>
            `;
        });
        
        if (results.length > 1000) {
            html += `<div class="result-item">... and ${results.length - 1000} more</div>`;
        }
        
        resultsBox.innerHTML = html;
        makeWordsClickable();
    }

    clearSearch() {
        document.getElementById('prefix-input').value = '';
        document.getElementById('suffix-input').value = '';
        
        document.querySelectorAll('input[name="sort"]').forEach(radio => {
            if (radio.value === 'none') radio.checked = true;
        });
        
        document.getElementById('results-box').innerHTML = '<p class="placeholder-text">Enter search criteria and click Search...</p>';
        document.getElementById('result-count').textContent = '0';
    }

    showError(message) {
        document.getElementById('results-box').innerHTML = `<div class="error-message">❌ ${message}</div>`;
    }
}

// main searcher
const searcher = new InesBotSearcher();

// ============================================
// DICTIONARY PANEL
// ============================================

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
    `;

    const header = document.createElement('div');
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
        <div>
            <span style="cursor: pointer; font-size: 16px; color: var(--text-secondary); margin-right: 8px;" id="minimize-panel">−</span>
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
    content.innerHTML = `<div style="text-align: center; padding: 20px; color: var(--text-secondary);">Click any word to see its definition</div>`;

    panel.appendChild(header);
    panel.appendChild(content);
    document.body.appendChild(panel);
    
    dictionaryPanel = panel;
    
    // drag
    header.addEventListener('mousedown', (e) => {
        if (e.target.id === 'close-panel' || e.target.id === 'minimize-panel') return;
        
        isDragging = true;
        dragOffset.x = e.clientX - panel.offsetLeft;
        dragOffset.y = e.clientY - panel.offsetTop;
        panel.style.cursor = 'grabbing';
    });

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return;
        
        let newLeft = e.clientX - dragOffset.x;
        let newTop = e.clientY - dragOffset.y;
        
        newLeft = Math.max(0, Math.min(newLeft, window.innerWidth - panel.offsetWidth));
        newTop = Math.max(0, Math.min(newTop, window.innerHeight - panel.offsetHeight));
        
        panel.style.left = newLeft + 'px';
        panel.style.top = newTop + 'px';
        panelPosition = { top: newTop, left: newLeft };
    });

    document.addEventListener('mouseup', () => {
        isDragging = false;
        panel.style.cursor = '';
    });
    
    document.getElementById('close-panel').addEventListener('click', () => {
        panel.remove();
        dictionaryPanel = null;
    });
    
    document.getElementById('minimize-panel').addEventListener('click', () => {
        const content = document.getElementById('dictionary-content');
        content.style.display = content.style.display === 'none' ? 'block' : 'none';
    });
    
    return panel;
}

function updatePanelContent(content) {
    if (!dictionaryPanel) dictionaryPanel = createDictionaryPanel();
    document.getElementById('dictionary-content').innerHTML = content;
}

function showLoadingInPanel(word) {
    updatePanelContent(`<div style="text-align: center; padding: 20px;">🔍 Loading "${word}"...</div>`);
}

function showDefinitionInPanel(data) {
    let html = `<div style="font-size: 18px; font-weight: 500; color: var(--text-primary);">${data.word}</div>`;
    data.meanings.forEach(m => {
        html += `<div style="margin: 10px 0; padding: 8px; background: var(--highlight-bg); border-radius: 6px;">
            <div style="font-weight: 600; color: var(--text-tertiary); text-transform: uppercase;">${m.partOfSpeech}</div>
            <div style="color: var(--text-primary);">${m.definition}</div>
        </div>`;
    });
    updatePanelContent(html);
}

function showNoDefinitionInPanel() {
    updatePanelContent(`<div style="text-align: center; padding: 20px;">It just works twin, don't worry about the definition</div>`);
}

async function fetchFromWiktionary(word) {
    try {
        const response = await fetch(`https://en.wiktionary.org/api/rest_v1/page/definition/${encodeURIComponent(word)}`);
        if (!response.ok) return null;
        const data = await response.json();
        if (!data.en) return null;
        
        const result = { word, meanings: [] };
        data.en.forEach(entry => {
            if (entry.definitions) {
                entry.definitions.slice(0, 1).forEach(def => {
                    result.meanings.push({
                        partOfSpeech: entry.partOfSpeech,
                        definition: def.definition.replace(/<[^>]*>/g, '').trim()
                    });
                });
            }
        });
        return result.meanings.length > 0 ? result : null;
    } catch {
        return null;
    }
}

function makeWordsClickable() {
    document.querySelectorAll('.result-word').forEach(wordElement => {
        const newElement = wordElement.cloneNode(true);
        wordElement.parentNode.replaceChild(newElement, wordElement);
        
        newElement.style.cursor = 'pointer';
        newElement.style.textDecoration = 'underline';
        newElement.style.textUnderlineOffset = '2px';
        
        newElement.addEventListener('click', async () => {
            const word = newElement.textContent;
            showLoadingInPanel(word);
            
            if (definitionCache.has(word)) {
                showDefinitionInPanel(definitionCache.get(word));
            } else {
                const definition = await fetchFromWiktionary(word);
                if (definition) {
                    definitionCache.set(word, definition);
                    showDefinitionInPanel(definition);
                } else {
                    showNoDefinitionInPanel();
                }
            }
        });
    });
}

// ============================================
// RARE PREFIX FINDER - LAZY LOADING VERSION
// ============================================

(function() {
    console.log('🔧 Initializing Rare Prefix Finder...');
    
    let rareWords = [];
    let isLoading = false;
    let searchState = null; // Store search state for lazy loading
    
    // get elements
    const normalBtn = document.getElementById('mode-normal');
    const rareBtn = document.getElementById('mode-rare');
    const normalSection = document.getElementById('normal-search-section');
    const rareSection = document.getElementById('rare-finder-section');
    const searchFilters = document.querySelector('.search-filters');
    
// mode switching with separate state INCLUDING RESULTS
if (normalBtn && rareBtn && normalSection && rareSection) {
    // Store values for each mode
    let normalState = {
        prefix: '',
        suffix: '',
        sort: 'none',
        results: '<p class="placeholder-text">Enter search criteria and click Search...</p>',
        resultCount: '0'
    };
    
    let rareState = {
        prefix: '',
        prefixLength: '2',
        maxWords: '2',
        filterMode: 'max-words',
        sort: 'count-asc',
        results: '<p class="placeholder-text">Click Search to find rare prefixes</p>',
        resultCount: '0'
    };
    
    normalBtn.addEventListener('click', () => {
        // Save rare state before switching (including results)
        rareState = {
            prefix: document.getElementById('rare-prefix').value,
            prefixLength: document.getElementById('rare-prefix-length').value,
            maxWords: document.getElementById('rare-max-words').value,
            filterMode: document.querySelector('input[name="filter-mode"]:checked')?.value || 'max-words',
            sort: document.querySelector('input[name="rare-sort"]:checked')?.value || 'count-asc',
            results: document.getElementById('results-box').innerHTML,
            resultCount: document.getElementById('result-count').textContent
        };
        
        // Restore normal state
        document.getElementById('prefix-input').value = normalState.prefix;
        document.getElementById('suffix-input').value = normalState.suffix;
        
        document.querySelectorAll('input[name="sort"]').forEach(radio => {
            if (radio.value === normalState.sort) radio.checked = true;
        });
        
        // Restore normal results
        document.getElementById('results-box').innerHTML = normalState.results;
        document.getElementById('result-count').textContent = normalState.resultCount;
        
        normalBtn.classList.add('mode-active');
        rareBtn.classList.remove('mode-active');
        normalSection.style.display = 'block';
        rareSection.style.display = 'none';
        if (searchFilters) searchFilters.style.display = 'grid';
    });
    
    rareBtn.addEventListener('click', () => {
        // Save normal state before switching (including results)
        normalState = {
            prefix: document.getElementById('prefix-input').value,
            suffix: document.getElementById('suffix-input').value,
            sort: document.querySelector('input[name="sort"]:checked')?.value || 'none',
            results: document.getElementById('results-box').innerHTML,
            resultCount: document.getElementById('result-count').textContent
        };
        
        // Restore rare state
        document.getElementById('rare-prefix').value = rareState.prefix;
        document.getElementById('rare-prefix-length').value = rareState.prefixLength;
        document.getElementById('rare-max-words').value = rareState.maxWords;
        
        // Restore filter mode radio
        const filterRadio = document.querySelector(`input[name="filter-mode"][value="${rareState.filterMode}"]`);
        if (filterRadio) {
            filterRadio.checked = true;
            filterRadio.dispatchEvent(new Event('change'));
        }
        
        // Restore sort radio
        const sortRadio = document.querySelector(`input[name="rare-sort"][value="${rareState.sort}"]`);
        if (sortRadio) sortRadio.checked = true;
        
        // Restore rare results
        document.getElementById('results-box').innerHTML = rareState.results;
        document.getElementById('result-count').textContent = rareState.resultCount;
        
        normalBtn.classList.remove('mode-active');
        rareBtn.classList.add('mode-active');
        normalSection.style.display = 'none';
        rareSection.style.display = 'block';
        if (searchFilters) searchFilters.style.display = 'none';
        loadRareWords();
    });
}
    
    // load words
    async function loadRareWords() {
        if (isLoading || rareWords.length > 0) return;
        
        isLoading = true;
        const resultsBox = document.getElementById('results-box');
        resultsBox.innerHTML = '<div class="loading-message">⏳ Loading words for Rare Finder...</div>';
        
        try {
            const response = await fetch('https://raw.githubusercontent.com/inesbotv1/askari/refs/heads/main/lastletter.txt?t=' + Date.now());
            const text = await response.text();
            
            rareWords = [...new Set(text.split(/\r?\n/)
                .map(w => w.trim())
                .filter(w => w.length > 0))];
            
            resultsBox.innerHTML = `<div class="success-message">Loaded ${rareWords.length} words! Ready to search.</div>`;
            document.getElementById('result-count').textContent = '0';
            
        } catch (error) {
            resultsBox.innerHTML = '<div class="error-message">Failed to load words</div>';
        } finally {
            isLoading = false;
        }
    }
    
// NEW: Create the filter mode UI - IMPROVED DESIGN
function createFilterModeUI() {
    const rareSection = document.getElementById('rare-finder-section');
    if (!rareSection) return;
    
    // Check if controls already exist
    if (document.getElementById('filter-mode-controls')) return;
    
    // Create filter mode controls with better styling
    const filterControls = document.createElement('div');
    filterControls.id = 'filter-mode-controls';
    filterControls.style.margin = '20px 0';
    filterControls.style.padding = '15px';
    filterControls.style.background = 'var(--bg-secondary)';
    filterControls.style.borderRadius = '8px';
    filterControls.style.border = '1px solid var(--border-color)';
    filterControls.innerHTML = `
        <div style="margin-bottom: 12px; font-weight: 600; color: var(--text-primary); font-size: 0.95rem;">Filter Mode:</div>
        <div style="display: flex; gap: 20px; flex-wrap: wrap;">
            <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px 16px; background: var(--bg-tertiary); border-radius: 30px; border: 1px solid var(--border-color); transition: all 0.2s ease;" 
                   onmouseover="this.style.background='var(--bg-hover)'" 
                   onmouseout="this.style.background='var(--bg-tertiary)'">
                <input type="radio" name="filter-mode" value="max-words" checked style="accent-color: var(--text-primary); width: 16px; height: 16px; margin: 0;"> 
                <span style="font-weight: 500; color: var(--text-primary);">Max Words: <span id="mode-max-words-indicator" style="background: var(--text-secondary); color: var(--bg-primary); padding: 2px 8px; border-radius: 20px; margin-left: 4px;">2</span></span>
            </label>
            <label style="display: inline-flex; align-items: center; gap: 8px; cursor: pointer; padding: 8px 16px; background: var(--bg-tertiary); border-radius: 30px; border: 1px solid var(--border-color); transition: all 0.2s ease;"
                   onmouseover="this.style.background='var(--bg-hover)'" 
                   onmouseout="this.style.background='var(--bg-tertiary)'">
                <input type="radio" name="filter-mode" value="longer-than" style="accent-color: var(--text-primary); width: 16px; height: 16px; margin: 0;"> 
                <span style="font-weight: 500; color: var(--text-primary);">Longer Than 6 Letters</span>
            </label>
        </div>
    `;
    
    // Insert after the existing filters
    const existingFilters = rareSection.querySelector('.search-filters');
    if (existingFilters) {
        existingFilters.parentNode.insertBefore(filterControls, existingFilters.nextSibling);
    } else {
        rareSection.insertBefore(filterControls, document.getElementById('rare-search-btn').parentNode);
    }
    
    // Add event listeners to radio buttons
    const modeRadios = document.querySelectorAll('input[name="filter-mode"]');
    const maxWordsSelect = document.getElementById('rare-max-words');
    
    modeRadios.forEach(radio => {
        radio.addEventListener('change', function() {
            // Reset all labels to default state
            document.querySelectorAll('#filter-mode-controls label').forEach(label => {
                label.style.background = 'var(--bg-tertiary)';
                label.style.borderColor = 'var(--border-color)';
                
                // Reset text color
                const spans = label.querySelectorAll('span');
                spans.forEach(span => {
                    if (span.id !== 'mode-max-words-indicator') {
                        span.style.color = 'var(--text-primary)';
                    }
                });
                
                // Reset indicator if present
                const indicator = label.querySelector('#mode-max-words-indicator');
                if (indicator) {
                    indicator.style.background = 'var(--text-secondary)';
                    indicator.style.color = 'var(--bg-primary)';
                }
            });
            
            // Style the selected label
            const selectedLabel = this.closest('label');
            selectedLabel.style.background = 'var(--text-primary)';
            selectedLabel.style.borderColor = 'var(--text-primary)';
            
            // Set text color for selected label
            const selectedSpans = selectedLabel.querySelectorAll('span');
            selectedSpans.forEach(span => {
                if (span.id !== 'mode-max-words-indicator') {
                    span.style.color = 'var(--bg-primary)';
                }
            });
            
            // Style indicator if it's the max-words label
            const selectedIndicator = selectedLabel.querySelector('#mode-max-words-indicator');
            if (selectedIndicator) {
                selectedIndicator.style.background = 'var(--bg-primary)';
                selectedIndicator.style.color = 'var(--text-primary)';
            }
            
            if (this.value === 'max-words') {
                // Enable max words select
                maxWordsSelect.disabled = false;
                maxWordsSelect.style.opacity = '1';
                maxWordsSelect.style.pointerEvents = 'auto';
                // Update indicator
                document.getElementById('mode-max-words-indicator').textContent = maxWordsSelect.value;
            } else {
                // Disable max words select
                maxWordsSelect.disabled = true;
                maxWordsSelect.style.opacity = '0.5';
                maxWordsSelect.style.pointerEvents = 'none';
            }
        });
    });
    
    // Update indicator when max words changes
    maxWordsSelect.addEventListener('change', function() {
        document.getElementById('mode-max-words-indicator').textContent = this.value;
    });
    
    // Set initial state
    setTimeout(() => {
        const checkedRadio = document.querySelector('input[name="filter-mode"]:checked');
        if (checkedRadio) {
            const selectedLabel = checkedRadio.closest('label');
            selectedLabel.style.background = 'var(--text-primary)';
            selectedLabel.style.borderColor = 'var(--text-primary)';
            
            const selectedSpans = selectedLabel.querySelectorAll('span');
            selectedSpans.forEach(span => {
                if (span.id !== 'mode-max-words-indicator') {
                    span.style.color = 'var(--bg-primary)';
                }
            });
            
            const selectedIndicator = selectedLabel.querySelector('#mode-max-words-indicator');
            if (selectedIndicator) {
                selectedIndicator.style.background = 'var(--bg-primary)';
                selectedIndicator.style.color = 'var(--text-primary)';
            }
        }
    }, 50);
}
    
    // Call this after DOM is ready
    setTimeout(createFilterModeUI, 100);
    
    // search button - LAZY LOADING VERSION WITH NEW FILTER MODE
    document.getElementById('rare-search-btn')?.addEventListener('click', () => {
        if (rareWords.length === 0) {
            if (isLoading) {
                document.getElementById('results-box').innerHTML = '<div class="loading-message">⏳ Still loading...</div>';
            } else {
                loadRareWords();
            }
            return;
        }
        
        const prefixFilter = document.getElementById('rare-prefix').value.toLowerCase().trim();
        const prefixLength = parseInt(document.getElementById('rare-prefix-length').value);
        
        // Get filter mode
        const filterMode = document.querySelector('input[name="filter-mode"]:checked')?.value || 'max-words';
        const maxWords = filterMode === 'max-words' ? parseInt(document.getElementById('rare-max-words').value) : null;
        
        // validate input
        if (prefixFilter && !/^[a-z]+$/.test(prefixFilter)) {
            document.getElementById('results-box').innerHTML = '<div class="error-message">❌ Use only letters A-Z</div>';
            return;
        }
        
        if (prefixFilter.length > prefixLength) {
            document.getElementById('results-box').innerHTML = `<div class="error-message">❌ Filter too long for ${prefixLength}-letter prefixes</div>`;
            return;
        }
        
        // Show loading
        document.getElementById('results-box').innerHTML = '<div class="loading-message">⏳ Counting prefixes...</div>';
        
        // Use setTimeout to prevent UI freeze
        setTimeout(() => {
            // Count prefixes (lightweight operation)
            const prefixCounts = new Map();
            const wordSet = new Set(rareWords.map(w => w.toLowerCase()));
            
            rareWords.forEach(word => {
                if (word.length >= prefixLength) {
                    const prefix = word.slice(0, prefixLength).toLowerCase();
                    if (prefixFilter && !prefix.startsWith(prefixFilter)) return;
                    prefixCounts.set(prefix, (prefixCounts.get(prefix) || 0) + 1);
                }
            });
            
            // Get sort option
            const sortOption = document.querySelector('input[name="rare-sort"]:checked')?.value || 'count-asc';
            
            // Convert to array and filter based on filter mode
            const validPrefixes = [];
            
            if (filterMode === 'max-words') {
                // Original behavior: filter by count range (2 to maxWords)
                prefixCounts.forEach((count, prefix) => {
                    if (count >= 2 && count <= maxWords) {
                        validPrefixes.push({ prefix, count });
                    }
                });
} else {
    // OPTIMIZED: Longer Than 6 Letters mode - ALL words must be >6 letters
    // First, group words by their prefix
    const wordsByPrefix = new Map();
    
    // Group all words by their prefix, applying the prefix filter
    for (let word of rareWords) {
        if (word.length >= prefixLength) {
            const prefix = word.slice(0, prefixLength).toLowerCase();
            
            // Apply the prefix filter here
            if (prefixFilter && !prefix.startsWith(prefixFilter)) continue;
            
            if (!wordsByPrefix.has(prefix)) {
                wordsByPrefix.set(prefix, []);
            }
            wordsByPrefix.get(prefix).push(word);
        }
    }
    
    // Now check each prefix that has at least 2 words
    wordsByPrefix.forEach((words, prefix) => {
        if (words.length >= 2) {
            // Check if ALL words for this prefix are longer than 6 letters
            const allWordsLong = words.every(word => word.length > 6);
            
            if (allWordsLong) {
                // Count is the number of words for this prefix
                validPrefixes.push({ prefix, count: words.length });
            }
        }
    });
}
            
            // Sort prefixes
            validPrefixes.sort((a, b) => {
                if (sortOption === 'count-asc') return a.count - b.count || a.prefix.localeCompare(b.prefix);
                if (sortOption === 'count-desc') return b.count - a.count || a.prefix.localeCompare(b.prefix);
                return a.prefix.localeCompare(b.prefix);
            });
            
            // Store search state
            searchState = {
                prefixFilter,
                prefixLength,
                maxWords,
                filterMode,
                wordSet,
                allPrefixes: validPrefixes,
                currentIndex: 0, // Track our position in allPrefixes
                pageSize: 10,
                totalCount: validPrefixes.length,
                sortOption,
                validResults: [] // Store verified results
            };
            
            // Update result count
            document.getElementById('result-count').textContent = validPrefixes.length;
            
            // Clear results box
            document.getElementById('results-box').innerHTML = '';
            
            // Start loading verified results
            if (validPrefixes.length > 0) {
                loadVerifiedResults(true);
            } else {
                let message = '';
                if (filterMode === 'max-words') {
                    message = `No ${prefixLength}-letter prefixes with 2-${maxWords} words found`;
                } else {
                    message = `No ${prefixLength}-letter prefixes with words longer than 6 letters found`;
                }
                document.getElementById('results-box').innerHTML = `<div class="status-message">${message}</div>`;
            }
        }, 10);
    });
    
    // clear button - UPDATED
    document.getElementById('rare-clear-btn')?.addEventListener('click', () => {
        document.getElementById('rare-prefix').value = '';
        document.getElementById('rare-prefix-length').value = '2';
        document.getElementById('rare-max-words').value = '2';
        
        // Reset filter mode to max-words
        const maxWordsRadio = document.querySelector('input[name="filter-mode"][value="max-words"]');
        if (maxWordsRadio) {
            maxWordsRadio.checked = true;
            document.getElementById('rare-max-words').disabled = false;
            document.getElementById('rare-max-words').style.opacity = '1';
        }
        
        document.querySelectorAll('input[name="rare-sort"]')[0].checked = true;
        document.getElementById('results-box').innerHTML = '<p class="placeholder-text">Filters cleared</p>';
        document.getElementById('result-count').textContent = '0';
        searchState = null; // Clear search state
    });
    
    // enter key
    document.getElementById('rare-prefix')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('rare-search-btn').click();
    });
    
    // Function to load verified results (keeps loading until we have pageSize valid ones)
    function loadVerifiedResults(isFirstLoad = false) {
        if (!searchState) return;
        
        const { allPrefixes, currentIndex, pageSize, wordSet, totalCount } = searchState;
        
        if (currentIndex >= totalCount) return;
        
        // Show loading indicator (but not for first load since we already showed one)
        if (!isFirstLoad) {
            const resultsBox = document.getElementById('results-box');
            
            // Remove any existing loading indicator
            const existingLoader = document.getElementById('loading-indicator');
            if (existingLoader) existingLoader.remove();
            
            const loadingDiv = document.createElement('div');
            loadingDiv.className = 'loading-message';
            loadingDiv.id = 'loading-indicator';
            loadingDiv.innerHTML = '⏳ Loading more prefixes...';
            resultsBox.appendChild(loadingDiv);
        }
        
        // Use setTimeout to prevent UI freeze
        setTimeout(() => {
            let verified = [];
            let newIndex = currentIndex;
            
            // Keep loading prefixes until we have pageSize valid ones or run out
            while (verified.length < pageSize && newIndex < allPrefixes.length) {
                const p = allPrefixes[newIndex];
                newIndex++;
                
                // Get words for this prefix
                const words = [];
                for (let w of rareWords) {
                    if (w.toLowerCase().startsWith(p.prefix)) {
                        words.push(w);
                        if (words.length === p.count) break;
                    }
                }
                
                // Verify if prefix is valid (is a word or appears as ending)
                let isValid = wordSet.has(p.prefix);
                if (!isValid) {
                    for (let word of rareWords) {
                        if (word.length > p.prefix.length && word.toLowerCase().endsWith(p.prefix)) {
                            isValid = true;
                            break;
                        }
                    }
                }
                
                // Only keep valid prefixes
                if (isValid) {
                    verified.push({
                        prefix: p.prefix,
                        count: p.count,
                        words: words
                    });
                }
            }
            
            // Update search state with new index
            searchState.currentIndex = newIndex;
            
            // If we don't have enough valid ones AND there are more prefixes to check,
            // continue collecting BEFORE displaying
            if (verified.length < pageSize && newIndex < allPrefixes.length) {
                // Add these to a temporary collection and keep going
                setTimeout(() => loadVerifiedResults(isFirstLoad), 10);
                return;
            }
            
            // Remove loading indicator
            if (!isFirstLoad) {
                document.getElementById('loading-indicator')?.remove();
            }
            
            // NOW display results only when we have a full batch or no more data
            if (verified.length > 0) {
                displayVerifiedResults(verified, isFirstLoad);
            }
            
            // Add "Load More" button if there are more prefixes to check
            if (searchState.currentIndex < totalCount) {
                // Remove existing load more button if present
                document.getElementById('load-more-container')?.remove();
                addLoadMoreButton();
            } else {
                // No more prefixes to check
                document.getElementById('load-more-container')?.remove();
            }
        }, 10);
    }
    
    // Function to display verified results
    function displayVerifiedResults(results, isFirstLoad = false) {
        const resultsBox = document.getElementById('results-box');
        const { filterMode, maxWords, totalCount, wordSet, validResults } = searchState;
        
        // Add new results to our stored valid results
        searchState.validResults = [...searchState.validResults, ...results];
        
        let modeDescription = '';
        if (filterMode === 'max-words') {
            modeDescription = `2-${maxWords} words`;
        } else {
            modeDescription = `words longer than 6 letters`;
        }
        
        // If this is the first batch, show the stats
        if (isFirstLoad || searchState.validResults.length === results.length) {
            // Remove existing stats if any
            const existingStats = document.getElementById('rare-stats');
            if (existingStats) existingStats.remove();
            
            const statsDiv = document.createElement('div');
            statsDiv.className = 'rare-stats';
            statsDiv.id = 'rare-stats';
            statsDiv.innerHTML = `Found ${totalCount} total prefixes, showing ${searchState.validResults.length} verified with ${modeDescription}`;
            
            // Insert stats at the beginning
            if (resultsBox.firstChild) {
                resultsBox.insertBefore(statsDiv, resultsBox.firstChild);
            } else {
                resultsBox.appendChild(statsDiv);
            }
        } else {
            // Update existing stats
            const statsDiv = document.getElementById('rare-stats');
            if (statsDiv) {
                statsDiv.innerHTML = `Found ${totalCount} total prefixes, showing ${searchState.validResults.length} verified with ${modeDescription}`;
            }
        }
        
        // Add each new result
        results.forEach(r => {
            const isWord = wordSet.has(r.prefix);
            const badge = isWord 
                ? '<span style="background:#4CAF50; color:white; padding:2px 6px; border-radius:4px; font-size:0.7em; margin-left:8px;">word</span>' 
                : '<span style="background:#FF9800; color:white; padding:2px 6px; border-radius:4px; font-size:0.7em; margin-left:8px;">ends with</span>';
            
            // Store words data for this prefix
            const wordsData = encodeURIComponent(JSON.stringify(r.words));
            
            const itemDiv = document.createElement('div');
            itemDiv.className = 'rare-prefix-item';
            itemDiv.setAttribute('data-words', wordsData);
            itemDiv.innerHTML = `
                <div class="rare-prefix-header">
                    <span class="rare-prefix-badge">${r.count} words</span>
                    <span class="rare-prefix-value">"${r.prefix}" ${badge}</span>
                    <span class="rare-prefix-toggle" onclick="window.toggleWords(this)">Show</span>
                </div>
                <div class="rare-prefix-words" style="display:none; margin-top:10px; padding:10px; background:var(--bg-tertiary); border-radius:4px;"></div>
            `;
            
            resultsBox.appendChild(itemDiv);
        });
    }
    
    // Function to add "Load More" button
    function addLoadMoreButton() {
        const resultsBox = document.getElementById('results-box');
        const { currentIndex, totalCount, validResults } = searchState;
        
        // Remove any existing load more container
        const existingContainer = document.getElementById('load-more-container');
        if (existingContainer) existingContainer.remove();
        
        // Create container for button and counter
        const container = document.createElement('div');
        container.id = 'load-more-container';
        container.style.cssText = 'display: flex; justify-content: center; margin: 20px 0; flex-direction: column; align-items: center; gap: 10px;';
        
        // Add counter
        const counter = document.createElement('div');
        counter.style.cssText = 'color: var(--text-secondary); font-size: 0.9em;';
        counter.textContent = `Showing ${validResults.length} verified prefixes of ${totalCount} total matches`;
        
        // Add button
        const button = document.createElement('button');
        button.className = 'btn btn-search';
        button.style.cssText = 'width: auto; padding: 8px 30px;';
        button.textContent = 'Load More ▼';
        button.onclick = function() {
            this.disabled = true;
            this.textContent = 'Loading...';
            loadVerifiedResults(false);
        };
        
        container.appendChild(counter);
        container.appendChild(button);
        resultsBox.appendChild(container);
    }
    
    // toggleWords - made more efficient
    window.toggleWords = function(element) {
        const currentItem = element.closest('.rare-prefix-item');
        const currentWordsDiv = currentItem.querySelector('.rare-prefix-words');
        const allItems = document.querySelectorAll('.rare-prefix-item');
        const wordsData = currentItem.getAttribute('data-words');
        
        if (currentWordsDiv.style.display === 'block') {
            currentWordsDiv.style.display = 'none';
            currentWordsDiv.innerHTML = '';
            element.textContent = 'Show';
            return;
        }
        
        // Close others efficiently
        for (let item of allItems) {
            if (item !== currentItem) {
                const wordsDiv = item.querySelector('.rare-prefix-words');
                const toggleBtn = item.querySelector('.rare-prefix-toggle');
                if (wordsDiv.style.display === 'block') {
                    wordsDiv.style.display = 'none';
                    wordsDiv.innerHTML = '';
                    toggleBtn.textContent = 'Show';
                }
            }
        }
        
        // Parse and display words
        const words = JSON.parse(decodeURIComponent(wordsData));
        currentWordsDiv.innerHTML = words.map(w => 
            `<span style="display:inline-block; background:var(--bg-secondary); padding:2px 8px; margin:2px; border-radius:4px;">${w}</span>`
        ).join('');
        
        currentWordsDiv.style.display = 'block';
        element.textContent = 'Hide';
    };
    
    // da dropdown
    const maxSelect = document.getElementById('rare-max-words');
    if (maxSelect) {
        maxSelect.innerHTML = `
            <option value="2" selected>2 words</option>
            <option value="3">3 words</option>
            <option value="4">4 words</option>
            <option value="5">5 words</option>
            <option value="6">6 words</option>
            <option value="7">7 words</option>
            <option value="8">8 words</option>
            <option value="9">9 words</option>
            <option value="10">10 words</option>
        `;
    }
})();
