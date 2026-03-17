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
            
            resultsBox.innerHTML = `<div class="success-message">✅ Successfully loaded ${this.words.length} words!</div>`;
            
        } catch (error) {
            resultsBox.innerHTML = '<div class="error-message">❌ Failed to load words from GitHub</div>';
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
// RARE PREFIX FINDER - DROPDOWN LOADING VERSION
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
    
    // mode switching
    if (normalBtn && rareBtn && normalSection && rareSection) {
        normalBtn.addEventListener('click', () => {
            normalBtn.classList.add('mode-active');
            rareBtn.classList.remove('mode-active');
            normalSection.style.display = 'block';
            rareSection.style.display = 'none';
            if (searchFilters) searchFilters.style.display = 'grid';
        });
        
        rareBtn.addEventListener('click', () => {
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
            
            resultsBox.innerHTML = `<div class="success-message">✅ Loaded ${rareWords.length} words! Ready to search.</div>`;
            document.getElementById('result-count').textContent = '0';
            
        } catch (error) {
            resultsBox.innerHTML = '<div class="error-message">❌ Failed to load words</div>';
        } finally {
            isLoading = false;
        }
    }
    
    // Create the filter mode UI (nicer version)
    function createFilterModeUI() {
        const rareSection = document.getElementById('rare-finder-section');
        if (!rareSection) return;
        
        // Check if controls already exist
        if (document.getElementById('filter-mode-container')) return;
        
        // Create filter mode container
        const filterContainer = document.createElement('div');
        filterContainer.id = 'filter-mode-container';
        filterContainer.style.margin = '15px 0';
        filterContainer.style.padding = '10px';
        filterContainer.style.background = 'var(--bg-secondary)';
        filterContainer.style.borderRadius = '4px';
        filterContainer.style.display = 'flex';
        filterContainer.style.alignItems = 'center';
        filterContainer.style.flexWrap = 'wrap';
        filterContainer.style.gap = '15px';
        
        filterContainer.innerHTML = `
            <span style="font-weight: bold; color: var(--text-primary);">Filter mode:</span>
            <div style="display: flex; gap: 20px; flex-wrap: wrap;">
                <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; padding: 5px 10px; background: var(--bg-primary); border-radius: 4px;">
                    <input type="radio" name="filter-mode" value="max-words" checked> 
                    <span>Max Words: <span id="mode-max-words-indicator" style="font-weight: bold; color: #4CAF50;">2</span></span>
                </label>
                <label style="display: flex; align-items: center; gap: 5px; cursor: pointer; padding: 5px 10px; background: var(--bg-primary); border-radius: 4px;">
                    <input type="radio" name="filter-mode" value="longer-than"> 
                    <span>Longer Than 6 Letters</span>
                </label>
            </div>
        `;
        
        // Insert after the search filters
        const searchFilters = rareSection.querySelector('.search-filters');
        if (searchFilters) {
            searchFilters.parentNode.insertBefore(filterContainer, searchFilters.nextSibling);
        }
        
        // Add event listeners to radio buttons
        const modeRadios = document.querySelectorAll('input[name="filter-mode"]');
        const maxWordsSelect = document.getElementById('rare-max-words');
        
        modeRadios.forEach(radio => {
            radio.addEventListener('change', function() {
                if (this.value === 'max-words') {
                    // Enable max words select
                    maxWordsSelect.disabled = false;
                    maxWordsSelect.style.opacity = '1';
                    maxWordsSelect.style.cursor = 'pointer';
                    // Update indicator
                    document.getElementById('mode-max-words-indicator').textContent = maxWordsSelect.value;
                } else {
                    // Disable max words select
                    maxWordsSelect.disabled = true;
                    maxWordsSelect.style.opacity = '0.5';
                    maxWordsSelect.style.cursor = 'not-allowed';
                }
            });
        });
        
        // Update indicator when max words changes
        maxWordsSelect.addEventListener('change', function() {
            document.getElementById('mode-max-words-indicator').textContent = this.value;
        });
    }
    
    // search button 
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
                // Longer Than 6 Letters mode
                // Find prefixes where at least one word is longer than 6 letters
                prefixCounts.forEach((count, prefix) => {
                    if (count >= 2) { // Still need at least 2 words for rare prefix
                        // Check if any word with this prefix is longer than 6 letters
                        let hasLongWord = false;
                        for (let word of rareWords) {
                            if (word.toLowerCase().startsWith(prefix) && word.length > 6) {
                                hasLongWord = true;
                                break;
                            }
                        }
                        if (hasLongWord) {
                            validPrefixes.push({ prefix, count });
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
                loadedPages: 0,
                pageSize: 10,
                totalCount: validPrefixes.length,
                sortOption
            };
            
            // Update result count
            document.getElementById('result-count').textContent = validPrefixes.length;
            
            // Clear results box
            const resultsBox = document.getElementById('results-box');
            resultsBox.innerHTML = '';
            
            // Add stats header
            if (validPrefixes.length > 0) {
                let modeDescription = '';
                if (filterMode === 'max-words') {
                    modeDescription = `2-${maxWords} words`;
                } else {
                    modeDescription = `words longer than 6 letters`;
                }
                
                const statsDiv = document.createElement('div');
                statsDiv.className = 'rare-stats';
                statsDiv.id = 'rare-stats-header';
                statsDiv.style.marginBottom = '15px';
                statsDiv.style.padding = '10px';
                statsDiv.style.background = 'var(--bg-secondary)';
                statsDiv.style.borderRadius = '4px';
                statsDiv.innerHTML = `<strong>Found ${validPrefixes.length} prefixes</strong> with ${modeDescription}`;
                resultsBox.appendChild(statsDiv);
            }
            
            // Load first page
            if (validPrefixes.length > 0) {
                loadMorePrefixes();
            } else {
                let message = '';
                if (filterMode === 'max-words') {
                    message = `No ${prefixLength}-letter prefixes with 2-${maxWords} words found`;
                } else {
                    message = `No ${prefixLength}-letter prefixes with words longer than 6 letters found`;
                }
                resultsBox.innerHTML = `<div class="status-message" style="padding: 20px; text-align: center;">${message}</div>`;
            }
            
        }, 10);
    });
    
    // Load more prefixes (dropdown style - appends to existing)
    function loadMorePrefixes() {
        if (!searchState) return;
        
        const { allPrefixes, loadedPages, pageSize, wordSet } = searchState;
        const resultsBox = document.getElementById('results-box');
        
        // Remove any existing load more button or no more message
        const existingLoadMore = document.querySelector('.load-more-container');
        const existingNoMore = document.querySelector('.no-more-message');
        if (existingLoadMore) existingLoadMore.remove();
        if (existingNoMore) existingNoMore.remove();
        
        // Calculate page range
        const start = loadedPages * pageSize;
        const end = Math.min(start + pageSize, allPrefixes.length);
        const pagePrefixes = allPrefixes.slice(start, end);
        
        if (pagePrefixes.length === 0) return;
        
        // Show loading indicator
        const loadingDiv = document.createElement('div');
        loadingDiv.className = 'loading-more';
        loadingDiv.style.textAlign = 'center';
        loadingDiv.style.padding = '15px';
        loadingDiv.style.background = 'var(--bg-secondary)';
        loadingDiv.style.borderRadius = '4px';
        loadingDiv.style.margin = '10px 0';
        loadingDiv.innerHTML = '⏳ Loading more prefixes...';
        resultsBox.appendChild(loadingDiv);
        
        // Use setTimeout to prevent UI freeze
        setTimeout(() => {
            // Remove loading indicator
            loadingDiv.remove();
            
            // Process current batch of prefixes
            pagePrefixes.forEach(p => {
                // Get words for this prefix
                const words = [];
                for (let w of rareWords) {
                    if (w.toLowerCase().startsWith(p.prefix)) {
                        words.push(w);
                        if (words.length === p.count) break;
                    }
                }
                
                // Quick validity check
                let isValid = searchState.wordSet.has(p.prefix);
                if (!isValid) {
                    for (let word of rareWords) {
                        if (word.length > p.prefix.length && word.toLowerCase().endsWith(p.prefix)) {
                            isValid = true;
                            break;
                        }
                    }
                }
                
                if (isValid) {
                    const isWord = searchState.wordSet.has(p.prefix);
                    const badge = isWord 
                        ? '<span style="background:#4CAF50; color:white; padding:2px 6px; border-radius:4px; font-size:0.7em; margin-left:8px;">word</span>' 
                        : '<span style="background:#FF9800; color:white; padding:2px 6px; border-radius:4px; font-size:0.7em; margin-left:8px;">ends with</span>';
                    
                    const wordsData = encodeURIComponent(JSON.stringify(words));
                    
                    const itemDiv = document.createElement('div');
                    itemDiv.className = 'rare-prefix-item';
                    itemDiv.setAttribute('data-words', wordsData);
                    itemDiv.style.marginBottom = '10px';
                    itemDiv.style.border = '1px solid var(--border-color)';
                    itemDiv.style.borderRadius = '4px';
                    itemDiv.style.overflow = 'hidden';
                    
                    itemDiv.innerHTML = `
                        <div class="rare-prefix-header" style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: var(--bg-secondary); cursor: pointer;" onclick="event.stopPropagation(); window.toggleWords(this.parentNode.querySelector('.rare-prefix-toggle'))">
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <span class="rare-prefix-badge" style="background: var(--accent); color: white; padding: 2px 8px; border-radius: 4px; font-size: 0.8em;">${p.count} words</span>
                                <span class="rare-prefix-value" style="font-weight: bold;">"${p.prefix}" ${badge}</span>
                            </div>
                            <span class="rare-prefix-toggle" style="color: var(--accent); cursor: pointer; padding: 5px 10px;" onclick="event.stopPropagation(); window.toggleWords(this)">Show</span>
                        </div>
                        <div class="rare-prefix-words" style="display:none; padding: 15px; background: var(--bg-tertiary); border-top: 1px solid var(--border-color);"></div>
                    `;
                    
                    resultsBox.appendChild(itemDiv);
                }
            });
            
            // Update loaded pages count
            searchState.loadedPages++;
            
            // Add "Load More" button if there are more
            const nextStart = searchState.loadedPages * pageSize;
            if (nextStart < allPrefixes.length) {
                const loadMoreDiv = document.createElement('div');
                loadMoreDiv.className = 'load-more-container';
                loadMoreDiv.style.textAlign = 'center';
                loadMoreDiv.style.margin = '20px 0';
                loadMoreDiv.style.padding = '10px';
                
                const remainingCount = allPrefixes.length - nextStart;
                const nextBatchSize = Math.min(pageSize, remainingCount);
                
                loadMoreDiv.innerHTML = `
                    <button class="btn btn-search" onclick="window.loadMorePrefixes()" style="width: auto; padding: 10px 25px; background: var(--accent); color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 1em;">
                        Load Next ${nextBatchSize} Prefixes (${remainingCount} remaining) ▼
                    </button>
                `;
                resultsBox.appendChild(loadMoreDiv);
            } else {
                // All loaded
                const finishedDiv = document.createElement('div');
                finishedDiv.className = 'no-more-message';
                finishedDiv.style.textAlign = 'center';
                finishedDiv.style.padding = '20px';
                finishedDiv.style.color = 'var(--text-secondary)';
                finishedDiv.style.fontStyle = 'italic';
                finishedDiv.style.background = 'var(--bg-secondary)';
                finishedDiv.style.borderRadius = '4px';
                finishedDiv.style.margin = '10px 0';
                finishedDiv.innerHTML = '🏁 All ${allPrefixes.length} prefixes loaded';
                resultsBox.appendChild(finishedDiv);
            }
            
        }, 10);
    }
    
    // Make loadMorePrefixes available globally
    window.loadMorePrefixes = loadMorePrefixes;
    
    // clear button 
    document.getElementById('rare-clear-btn')?.addEventListener('click', () => {
        document.getElementById('rare-prefix').value = '';
        document.getElementById('rare-prefix-length').value = '3';
        document.getElementById('rare-max-words').value = '2';
        
        // Reset filter mode to max-words
        const maxWordsRadio = document.querySelector('input[name="filter-mode"][value="max-words"]');
        if (maxWordsRadio) {
            maxWordsRadio.checked = true;
            document.getElementById('rare-max-words').disabled = false;
            document.getElementById('rare-max-words').style.opacity = '1';
            document.getElementById('rare-max-words').style.cursor = 'pointer';
        }
        
        document.querySelectorAll('input[name="rare-sort"]')[0].checked = true;
        document.getElementById('results-box').innerHTML = '<p class="placeholder-text" style="padding: 20px; text-align: center; color: var(--text-secondary);">Filters cleared</p>';
        document.getElementById('result-count').textContent = '0';
        searchState = null;
    });
    
    // enter key
    document.getElementById('rare-prefix')?.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') document.getElementById('rare-search-btn').click();
    });
    
    // toggleWords function
    window.toggleWords = function(element) {
        const currentItem = element.closest('.rare-prefix-item');
        if (!currentItem) return;
        
        const currentWordsDiv = currentItem.querySelector('.rare-prefix-words');
        const allItems = document.querySelectorAll('.rare-prefix-item');
        const wordsData = currentItem.getAttribute('data-words');
        
        if (currentWordsDiv.style.display === 'block') {
            currentWordsDiv.style.display = 'none';
            currentWordsDiv.innerHTML = '';
            element.textContent = 'Show';
            return;
        }
        
        // Close others
        allItems.forEach(item => {
            if (item !== currentItem) {
                const wordsDiv = item.querySelector('.rare-prefix-words');
                const toggleBtn = item.querySelector('.rare-prefix-toggle');
                if (wordsDiv && wordsDiv.style.display === 'block') {
                    wordsDiv.style.display = 'none';
                    wordsDiv.innerHTML = '';
                    if (toggleBtn) toggleBtn.textContent = 'Show';
                }
            }
        });
        
        // Parse and display words
        try {
            const words = JSON.parse(decodeURIComponent(wordsData));
            currentWordsDiv.innerHTML = words.map(w => 
                `<span style="display:inline-block; background:var(--bg-secondary); padding:4px 10px; margin:3px; border-radius:4px; border:1px solid var(--border-color);">${w}</span>`
            ).join('');
            
            currentWordsDiv.style.display = 'block';
            element.textContent = 'Hide';
        } catch (e) {
            console.error('Error parsing words data:', e);
        }
    };
    
    // Initialize everything when DOM is ready
    document.addEventListener('DOMContentLoaded', function() {
        createFilterModeUI();
        
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
    });
})();
