/**
 * Filters Module
 * Handles the filtering functionality for the network
 */

const Filters = (function() {
    // Private variables
    let graphData = null;
    let yearSlider = null;
    let currentFilters = {
        leader: null,
        keywords: [],
        organizations: [],
        fachbereiche: [],
        years: [null, null]
    };
    
    // Debug log for filter initialization
    console.log('Initial currentFilters:', currentFilters);
    
    /**
     * Initialize the filters
     * @param {Object} data - The graph data
     */
    function initFilters(data) {
        graphData = data;
        
        // Get all leaders
        const leaders = graphData.nodes
            .filter(node => node.data.type === 'leader')
            .map(node => ({
                id: node.data.id,
                label: node.data.label
            }))
            .sort((a, b) => a.label.localeCompare(b.label));
        
        // Initialize leader filter
        initLeaderTagFilter(leaders);
        
        // Initialize keyword filter
        initTagFilter('keyword', graphData.keywords);
        
        // Initialize organization filter
        initTagFilter('organization', graphData.organizations);
        
        // Initialize fachbereich filter
        initTagFilter('fachbereich', graphData.fachbereiche);
        
        // Initialize year slider
        initYearSlider();
        
        // Set initial filter values
        resetFilters();
    }
    
    /**
     * Initialize the leader filter as a tag-based filter
     * @param {Array} leaders - Array of leader objects with id and label
     */
    function initLeaderTagFilter(leaders) {
        const container = document.getElementById('leader-filter-container');
        const input = document.getElementById('leader-filter-input');
        const dropdown = document.getElementById('leader-filter-dropdown');
        const clearBtn = document.getElementById('leader-filter-clear');
        
        if (!container || !input || !dropdown || !clearBtn) return;
        
        // Position the dropdown correctly
        dropdown.style.top = `${container.offsetTop + container.offsetHeight}px`;
        dropdown.style.left = `${container.offsetLeft}px`;
        
        // Populate dropdown options
        dropdown.innerHTML = '';
        leaders.forEach(leader => {
            const optionElement = document.createElement('div');
            optionElement.className = 'tag-filter-option';
            optionElement.textContent = leader.label;
            optionElement.dataset.value = leader.id;
            optionElement.dataset.label = leader.label;
            dropdown.appendChild(optionElement);
            
            // Add click event to option
            optionElement.addEventListener('click', function() {
                addLeaderTag(this.dataset.value, this.dataset.label);
                input.value = '';
                dropdown.classList.remove('show');
                input.focus();
            });
        });
        
        // Function to reset dropdown options
        function resetDropdownOptions() {
            const dropdownOptions = dropdown.querySelectorAll('.tag-filter-option');
            dropdownOptions.forEach(option => {
                option.style.display = 'block';
            });
        }
        
        // Add event listeners
        input.addEventListener('focus', function() {
            // Update dropdown position when focused
            dropdown.style.top = `${container.getBoundingClientRect().bottom}px`;
            dropdown.style.left = `${container.getBoundingClientRect().left}px`;
            dropdown.classList.add('show');
            
            // Reset dropdown options when focused
            if (!this.value) {
                resetDropdownOptions();
            }
        });
        
        input.addEventListener('input', function() {
            const searchText = this.value.toLowerCase();
            const dropdownOptions = dropdown.querySelectorAll('.tag-filter-option');
            
            dropdownOptions.forEach(option => {
                const optionText = option.textContent.toLowerCase();
                if (optionText.includes(searchText)) {
                    option.style.display = 'block';
                } else {
                    option.style.display = 'none';
                }
            });
            
            // Update placeholder visibility
            updatePlaceholder('leader');
            
            dropdown.classList.add('show');
        });
        
        // Reset dropdown options when input loses focus
        input.addEventListener('blur', function() {
            // Use setTimeout to allow click events on dropdown options to fire first
            setTimeout(() => {
                if (!dropdown.classList.contains('show')) {
                    this.value = '';
                    resetDropdownOptions();
                    updatePlaceholder('leader');
                }
            }, 200);
        });
        
        // Hide dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!container.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
        
        // Clear button
        clearBtn.addEventListener('click', function() {
            clearLeaderTag();
        });
        
        // Container click focuses input
        container.addEventListener('click', function(e) {
            if (e.target === container) {
                input.focus();
            }
        });
    }
    
    /**
     * Add a leader tag to the filter
     * @param {string} id - Leader ID
     * @param {string} label - Leader label to display
     */
    function addLeaderTag(id, label) {
        // Remove any existing leader tag first (since we only allow one leader at a time)
        clearLeaderTag();
        
        // Set current filter
        currentFilters.leader = id;
        
        // Create tag element
        const container = document.getElementById('leader-filter-container');
        const input = document.getElementById('leader-filter-input');
        
        const tag = document.createElement('div');
        tag.className = 'filter-tag';
        tag.dataset.value = id;
        tag.innerHTML = `
            ${label}
            <span class="filter-tag-remove">×</span>
        `;
        
        // Add remove event
        tag.querySelector('.filter-tag-remove').addEventListener('click', function() {
            clearLeaderTag();
        });
        
        // Insert before input
        container.insertBefore(tag, input);
        
        // Clear input value
        input.value = '';
        
        // Update placeholder visibility
        updatePlaceholder('leader');
        
        // Highlight leader connections
        Network.highlightLeaderConnections(id);
    }
    
    /**
     * Clear the leader tag
     */
    function clearLeaderTag() {
        // Clear current filter
        currentFilters.leader = null;
        
        // Remove tag element
        const container = document.getElementById('leader-filter-container');
        const tags = container.querySelectorAll('.filter-tag');
        tags.forEach(tag => container.removeChild(tag));
        
        // Update placeholder visibility
        updatePlaceholder('leader');
        
        // Reset highlighting
        Network.highlightLeaderConnections(null);
    }
    
    /**
     * Initialize a tag-based filter
     * @param {string} filterType - Type of filter (keyword, organization, fachbereich)
     * @param {Array} options - Array of options for the filter
     */
    function initTagFilter(filterType, options) {
        const container = document.getElementById(`${filterType}-filter-container`);
        const input = document.getElementById(`${filterType}-filter-input`);
        const dropdown = document.getElementById(`${filterType}-filter-dropdown`);
        const clearBtn = document.getElementById(`${filterType}-filter-clear`);
        
        if (!container || !input || !dropdown || !clearBtn) {
            console.error(`Missing elements for ${filterType} filter`);
            return;
        }
        
        // Debug log for filter initialization
        console.log(`Initializing ${filterType} filter with options:`, options);
        
        // Position the dropdown correctly
        dropdown.style.top = `${container.offsetTop + container.offsetHeight}px`;
        dropdown.style.left = `${container.offsetLeft}px`;
        
        // Populate dropdown options
        dropdown.innerHTML = '';
        options.forEach(option => {
            const optionElement = document.createElement('div');
            optionElement.className = 'tag-filter-option';
            optionElement.textContent = option;
            optionElement.dataset.value = option;
            dropdown.appendChild(optionElement);
            
            // Add click event to option
            optionElement.addEventListener('click', function() {
                addTag(filterType, this.dataset.value);
                input.value = '';
                dropdown.classList.remove('show');
                input.focus();
            });
        });
        
        // Function to reset dropdown options
        function resetDropdownOptions() {
            const dropdownOptions = dropdown.querySelectorAll('.tag-filter-option');
            dropdownOptions.forEach(option => {
                option.style.display = 'block';
            });
        }
        
        // Add event listeners
        input.addEventListener('focus', function() {
            // Update dropdown position when focused
            dropdown.style.top = `${container.getBoundingClientRect().bottom}px`;
            dropdown.style.left = `${container.getBoundingClientRect().left}px`;
            dropdown.classList.add('show');
            
            // Reset dropdown options when focused
            if (!this.value) {
                resetDropdownOptions();
            }
        });
        
        input.addEventListener('input', function() {
            const searchText = this.value.toLowerCase();
            const dropdownOptions = dropdown.querySelectorAll('.tag-filter-option');
            
            dropdownOptions.forEach(option => {
                const optionText = option.textContent.toLowerCase();
                if (optionText.includes(searchText)) {
                    option.style.display = 'block';
                } else {
                    option.style.display = 'none';
                }
            });
            
            // Update placeholder visibility
            updatePlaceholder(filterType);
            
            dropdown.classList.add('show');
        });
        
        // Reset dropdown options when input loses focus
        input.addEventListener('blur', function() {
            // Use setTimeout to allow click events on dropdown options to fire first
            setTimeout(() => {
                if (!dropdown.classList.contains('show')) {
                    this.value = '';
                    resetDropdownOptions();
                    updatePlaceholder(filterType);
                }
            }, 200);
        });
        
        // Hide dropdown when clicking outside
        document.addEventListener('click', function(e) {
            if (!container.contains(e.target) && !dropdown.contains(e.target)) {
                dropdown.classList.remove('show');
            }
        });
        
        // Clear button
        clearBtn.addEventListener('click', function() {
            clearTags(filterType);
        });
        
        // Container click focuses input
        container.addEventListener('click', function(e) {
            if (e.target === container) {
                input.focus();
            }
        });
    }
    
    /**
     * Add a tag to a filter
     * @param {string} filterType - Type of filter (keyword, organization, fachbereich)
     * @param {string} value - Value to add
     */
    function addTag(filterType, value) {
        // Get the correct filter property name
        let filterProp;
        if (filterType === 'fachbereich') {
            filterProp = 'fachbereiche';
        } else {
            filterProp = filterType + 's';
        }
        
        // Check if tag already exists
        if (currentFilters[filterProp].includes(value)) return;
        
        // Add to current filters
        currentFilters[filterProp].push(value);
        
        // Debug log for adding filter
        console.log(`Added ${filterType} filter:`, value);
        console.log('Current filters:', currentFilters);
        
        // Create tag element
        const container = document.getElementById(`${filterType}-filter-container`);
        const input = document.getElementById(`${filterType}-filter-input`);
        
        const tag = document.createElement('div');
        tag.className = 'filter-tag';
        tag.dataset.value = value;
        tag.innerHTML = `
            ${value}
            <span class="filter-tag-remove">×</span>
        `;
        
        // Add remove event
        tag.querySelector('.filter-tag-remove').addEventListener('click', function() {
            removeTag(filterType, value);
        });
        
        // Insert before input
        container.insertBefore(tag, input);
        
        // Clear input value
        input.value = '';
        
        // Update placeholder visibility
        updatePlaceholder(filterType);
        
        // Apply filters
        applyFilters();
    }
    
    /**
     * Remove a tag from a filter
     * @param {string} filterType - Type of filter (keyword, organization, fachbereich)
     * @param {string} value - Value to remove
     */
    function removeTag(filterType, value) {
        // Get the correct filter property name
        let filterProp;
        if (filterType === 'fachbereich') {
            filterProp = 'fachbereiche';
        } else {
            filterProp = filterType + 's';
        }
        
        // Remove from current filters
        currentFilters[filterProp] = currentFilters[filterProp].filter(v => v !== value);
        
        // Debug log for removing filter
        console.log(`Removed ${filterType} filter:`, value);
        console.log('Current filters:', currentFilters);
        
        // Remove tag element
        const container = document.getElementById(`${filterType}-filter-container`);
        const tag = container.querySelector(`.filter-tag[data-value="${value}"]`);
        if (tag) {
            container.removeChild(tag);
        }
        
        // Update placeholder visibility
        updatePlaceholder(filterType);
        
        // Apply filters
        applyFilters();
    }
    
    /**
     * Clear all tags from a filter
     * @param {string} filterType - Type of filter (keyword, organization, fachbereich)
     */
    function clearTags(filterType) {
        // Get the correct filter property name
        let filterProp;
        if (filterType === 'fachbereich') {
            filterProp = 'fachbereiche';
        } else {
            filterProp = filterType + 's';
        }
        
        // Clear current filters
        currentFilters[filterProp] = [];
        
        // Debug log for clearing filter
        console.log(`Cleared ${filterType} filters`);
        console.log('Current filters:', currentFilters);
        
        // Remove all tag elements
        const container = document.getElementById(`${filterType}-filter-container`);
        const tags = container.querySelectorAll('.filter-tag');
        tags.forEach(tag => container.removeChild(tag));
        
        // Update placeholder visibility
        updatePlaceholder(filterType);
        
        // Apply filters
        applyFilters();
    }
    
    /**
     * Update the placeholder visibility based on whether there are tags or input
     * @param {string} filterType - Type of filter (keyword, organization, fachbereich)
     */
    function updatePlaceholder(filterType) {
        const input = document.getElementById(`${filterType}-filter-input`);
        const container = document.getElementById(`${filterType}-filter-container`);
        
        if (!input || !container) return;
        
        const hasTags = container.querySelectorAll('.filter-tag').length > 0;
        
        if (hasTags || input.value) {
            // Hide placeholder by setting it to empty
            input.placeholder = '';
        } else {
            // Show placeholder
            switch (filterType) {
                case 'keyword':
                    input.placeholder = 'Themen auswählen …';
                    break;
                case 'organization':
                    input.placeholder = 'Organisationen auswählen …';
                    break;
                case 'fachbereich':
                    input.placeholder = 'Fachbereiche auswählen …';
                    break;
                case 'leader':
                    input.placeholder = 'Personen auswählen …';
                    break;
            }
        }
    }
    
    /**
     * Initialize the year slider
     */
    function initYearSlider() {
        const yearSliderContainer = document.getElementById('year-slider');
        if (!yearSliderContainer) return;
        
        // Get min and max years
        const years = graphData.years
            .filter(year => !isNaN(parseInt(year)))
            .map(year => parseInt(year));
        
        const minYear = Math.min(...years) || 2000;
        const maxYear = Math.max(...years) || 2025;
        
        // Update year labels
        document.getElementById('year-min').textContent = minYear;
        document.getElementById('year-max').textContent = maxYear;
        
        // Initialize noUiSlider
        if (yearSlider) {
            yearSlider.destroy();
        }
        
        yearSlider = noUiSlider.create(yearSliderContainer, {
            start: [minYear, maxYear],
            connect: true,
            step: 1,
            range: {
                'min': minYear,
                'max': maxYear
            },
            format: {
                to: value => Math.round(value),
                from: value => Math.round(value)
            }
        });
        
        // Add update event listener
        yearSlider.on('update', function(values) {
            document.getElementById('year-min').textContent = values[0];
            document.getElementById('year-max').textContent = values[1];
            
            currentFilters.years = values;
            applyFilters();
        });
    }
    
    /**
     * Apply all filters to the network
     */
    function applyFilters() {
        if (!graphData) return;
        
        let filteredNodes = [];
        let filteredEdges = [];
        let filteredLeaders = new Set();
        
        // Filter nodes based on type, year, keywords, organizations, and fachbereiche
        graphData.nodes.forEach(node => {
            const nodeType = node.data.type;
            
            if (nodeType === 'project') {
                const year = node.data.year;
                const nodeKeywords = node.data.details.keywords;
                const nodeOrganizations = node.data.details.participants.organizations;
                const nodeFachbereich = node.data.details.fachbereich;
                
                // Check if node passes all filters
                const includeByYear = (
                    year === 'Unknown' ||
                    (year && !isNaN(parseInt(year)) && 
                     parseInt(year) >= currentFilters.years[0] && 
                     parseInt(year) <= currentFilters.years[1])
                );
                
                const includeByKeywords = (
                    currentFilters.keywords.length === 0 ||
                    nodeKeywords.some(keyword => currentFilters.keywords.includes(keyword))
                );
                
                const includeByOrganizations = (
                    currentFilters.organizations.length === 0 ||
                    nodeOrganizations.some(org => currentFilters.organizations.includes(org))
                );
                
                // Simple check for fachbereich filter
                const includeByFachbereich = (
                    currentFilters.fachbereiche.length === 0 || 
                    (nodeFachbereich && currentFilters.fachbereiche.includes(nodeFachbereich))
                );
                
                if (includeByYear && includeByKeywords && includeByOrganizations && includeByFachbereich) {
                    filteredNodes.push(node);
                    
                    // Find connected leaders
                    graphData.edges.forEach(edge => {
                        if (edge.data.target === node.data.id) {
                            filteredEdges.push(edge);
                            filteredLeaders.add(edge.data.source);
                        }
                    });
                }
            }
        });
        
        // Add filtered leaders
        graphData.nodes.forEach(node => {
            if (node.data.type === 'leader' && filteredLeaders.has(node.data.id)) {
                filteredNodes.push(node);
            }
        });
        
        // Update network with filtered elements
        Network.updateElements(filteredNodes.concat(filteredEdges));
        
        // Update statistics
        updateStatistics(filteredNodes, filteredEdges);
    }
    
    /**
     * Update the network statistics display
     * @param {Array} nodes - Filtered nodes
     * @param {Array} edges - Filtered edges
     */
    function updateStatistics(nodes, edges) {
        const statsContainer = document.getElementById('network-stats');
        if (!statsContainer) return;
        
        const projectCount = nodes.filter(n => n.data.type === 'project').length;
        const leaderCount = nodes.filter(n => n.data.type === 'leader').length;
        const connectionCount = edges.length;
        
        statsContainer.innerHTML = `
            <p><span style="color: var(--project-primary);">●</span> Projekte: ${projectCount}</p>
            <p><span style="color: var(--leader-primary);">●</span> Personen: ${leaderCount}</p>
            <p><span style="color: var(--edge-default);">●</span> Verbindungen: ${connectionCount}</p>
        `;
    }
    
    /**
     * Reset all filters to their default values
     */
    function resetFilters() {
        // Reset leader filter
        clearLeaderTag();
        
        // Reset tag filters
        clearTags('keyword');
        clearTags('organization');
        clearTags('fachbereich');
        
        // Reset year slider
        if (yearSlider) {
            const years = graphData.years
                .filter(year => !isNaN(parseInt(year)))
                .map(year => parseInt(year));
            
            const minYear = Math.min(...years) || 2000;
            const maxYear = Math.max(...years) || 2025;
            
            yearSlider.set([minYear, maxYear]);
            currentFilters.years = [minYear, maxYear];
        }
        
        // Reset network highlighting
        Network.highlightLeaderConnections(null);
        
        // Apply filters (which will show all elements)
        applyFilters();
    }
    
    // Public API
    return {
        initFilters,
        applyFilters,
        resetFilters
    };
})();
