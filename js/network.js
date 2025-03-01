/**
 * Network Module
 * Handles the Cytoscape network visualization
 */

const Network = (function() {
    // Private variables
    let cy = null;
    let layoutConfig = {
        name: 'fcose',
        quality: 'proof',  // Higher quality but slower
        nodeSpacing: 50,  // More spacing for better separation
        idealEdgeLength: 200,  // Increased for wider edge distribution
        nodeRepulsion: 30000,  // Stronger repulsion for more spacing
        gravityRange: 60,  // Slightly increased for controlled pull
        edgeLength: 50,  // Longer edges for clarity
        gravityRange: 80,
        gravityCompensation: 0.4,
        animate: true,
        fit: true,
        zoom: 0.5,
        pan: {x: 0, y: 0},
        key: Date.now().toString()
    };
    
    // Default stylesheet for the network
    const defaultStylesheet = [
        {
            selector: 'node',
            style: {
                'label': 'data(label)',
                'font-size': '14px',
                'font-weight': 'bold',
                'text-outline-width': '2px',
                'text-outline-color': '#ffffff',
                'text-valign': 'center',
                'text-halign': 'center',
                'width': 'data(node_size)',
                'height': 'data(node_size)',
                'background-color': '#ffffff'
            }
        },
        {
            selector: '.project',
            style: {
                'background-color': '#c8a591',
                'border-color': '#c0392b',
                'border-width': 2,
                'color': '#333333'
            }
        },
        {
            selector: '.leader',
            style: {
                'background-color': '#6eafc8',
                'border-color': '#2980b9',
                'border-width': 2,
                'color': '#333333'
            }
        },
        {
            selector: 'edge[type = "leads_project"]',
            style: {
                'width': 'data(weight)',
                'line-color': '#c0392b',
                'curve-style': 'bezier',
                'opacity': 0.7,
                'line-style': 'solid',
                'transition-property': 'none'
            }
        }
    ];
    
    /**
     * Initialize the Cytoscape network
     * @param {string} containerId - ID of the container element
     * @param {Array} elements - Elements to add to the network
     * @returns {Object} - The Cytoscape instance
     */
    function initNetwork(containerId, elements) {
        cy = cytoscape({
            container: document.getElementById(containerId),
            elements: elements,
            style: defaultStylesheet,
            layout: layoutConfig,
            minZoom: 0.1,
            maxZoom: 3,
            zoomingEnabled: true
        });
        
        // Add tap event for node selection
        cy.on('tap', 'node', function(evt) {
            const node = evt.target;
            Details.showNodeDetails(node.data());
        });
        
        return cy;
    }
    
    /**
     * Update the network with new elements
     * @param {Array} elements - New elements to display
     */
    function updateElements(newElements) {
        if (!cy) return;

        // Preserve existing positions
        const positions = new Map();
        cy.nodes().forEach(node => positions.set(node.id(), node.position()));

        // Remove obsolete elements
        const newIds = new Set(newElements.map(e => e.data.id));
        cy.elements().forEach(elem => {
            if (!newIds.has(elem.id())) elem.remove();
        });

        // Add new elements
        const existingIds = new Set(cy.elements().map(e => e.id()));
        const elementsToAdd = newElements.filter(e => !existingIds.has(e.data.id));
        cy.add(elementsToAdd);

        // Restore positions
        cy.nodes().forEach(node => {
            if (positions.has(node.id())) {
                node.position(positions.get(node.id()));
            }
        });

        // Gradual layout for new nodes only
        cy.layout({
            ...layoutConfig,
            animate: 'end',
            fit: true,
            padding: 50,
            nodeDimensionsIncludeLabels: true,
            idealEdgeLength: (edge) => 150,
            numIter: 2500, // Fewer iterations for faster settling
            boundingBox: { x1: 0, y1: 0, w: cy.container().offsetWidth, h: cy.container().offsetHeight }
        }).run();
    }
    
    /**
     * Reset the network view
     */
    function resetView() {
        if (!cy) return;
        
        // Create a new layout with updated key to force re-layout
        const newLayout = Object.assign({}, layoutConfig, {
            key: Date.now().toString()
        });
        
        cy.layout(newLayout).run();
    }
    
    /**
     * Update the network stylesheet
     * @param {Array} stylesheet - New stylesheet to apply
     */
    function updateStylesheet(stylesheet) {
        if (!cy) return;
        cy.style(stylesheet || defaultStylesheet);
    }
    
    /**
     * Highlight a leader and its connections
     * @param {string} leaderId - ID of the leader to highlight
     */
    function highlightLeaderConnections(leaderId) {
        if (!cy) return;
        
        if (!leaderId) {
            // Reset to default stylesheet if no leader selected
            updateStylesheet(defaultStylesheet);
            return;
        }
        
        // Find connected nodes and edges
        const connectedNodes = new Set();
        const connectedEdges = new Set();
        
        cy.edges().forEach(edge => {
            if (edge.data('source') === leaderId) {
                connectedNodes.add(edge.data('target'));
                connectedEdges.add(edge.data('id'));
            }
        });
        
        // Create new stylesheet
        const newStylesheet = defaultStylesheet.slice();
        
        // Add highlighting for leader
        newStylesheet.push({
            selector: `[id = "${leaderId}"]`,
            style: {
                'background-color': '#9BAF87',
                'opacity': 1,
                'z-index': 9999
            }
        });
        
        // Add highlighting for connected nodes
        connectedNodes.forEach(nodeId => {
            newStylesheet.push({
                selector: `[id = "${nodeId}"]`,
                style: {
                    'background-color': '#9BAF87',
                    'opacity': 1,
                    'z-index': 9999
                }
            });
        });
        
        // Add highlighting for connected edges
        connectedEdges.forEach(edgeId => {
            newStylesheet.push({
                selector: `[id = "${edgeId}"]`,
                style: {
                    'line-color': '#9BAF87',
                    'opacity': 1,
                    'z-index': 9998,
                    'width': 4
                }
            });
        });
        
        // Add dimming for non-highlighted elements
        const allNodeIds = new Set(cy.nodes().map(node => node.data('id')));
        const nonHighlightedNodes = new Set([...allNodeIds].filter(id => id !== leaderId && !connectedNodes.has(id)));
        
        nonHighlightedNodes.forEach(nodeId => {
            newStylesheet.push({
                selector: `[id = "${nodeId}"]`,
                style: {
                    'opacity': 0.2
                }
            });
        });
        
        const allEdgeIds = new Set(cy.edges().map(edge => edge.data('id')));
        const nonHighlightedEdges = new Set([...allEdgeIds].filter(id => !connectedEdges.has(id)));
        
        nonHighlightedEdges.forEach(edgeId => {
            newStylesheet.push({
                selector: `[id = "${edgeId}"]`,
                style: {
                    'opacity': 0.1
                }
            });
        });
        
        updateStylesheet(newStylesheet);
    }
    
    /**
     * Export the network as a PNG image
     */
    function exportAsPng() {
        if (!cy) return;
        
        const png = cy.png({
            output: 'blob',
            bg: '#ffffff',
            full: true
        });
        
        // Create a download link
        const downloadLink = document.createElement('a');
        downloadLink.href = URL.createObjectURL(png);
        downloadLink.download = `hsbi_network_${new Date().toISOString().replace(/:/g, '-').replace(/\..+/, '')}.png`;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);
    }
    
    /**
     * Get the Cytoscape instance
     * @returns {Object} - The Cytoscape instance
     */
    function getInstance() {
        return cy;
    }
    
    // Public API
    return {
        initNetwork,
        updateElements,
        resetView,
        updateStylesheet,
        highlightLeaderConnections,
        exportAsPng,
        getInstance
    };
})();
