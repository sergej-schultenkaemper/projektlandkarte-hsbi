/**
 * Main Application Module
 * Initializes and coordinates all modules
 */

document.addEventListener('DOMContentLoaded', async function() {
    // Load graph data
    const graphData = await DataProcessor.loadGraphData('data/graph_structure_with_publications_20250130_095522.json');
    
    // Debug log for fachbereiche
    console.log('Available fachbereiche:', graphData.fachbereiche);
    
    // Ensure fachbereiche are properly initialized
    if (graphData.fachbereiche && graphData.fachbereiche.length > 0) {
        console.log('Fachbereiche found:', graphData.fachbereiche.length);
        console.log('Fachbereiche list:', JSON.stringify(graphData.fachbereiche));
    } else {
        console.error('No fachbereiche found in data!');
    }
    
    // Filter initial data for projects only
    const projectNodes = graphData.nodes.filter(node => node.data.type === 'project');
    const leaderIds = new Set();
    const projectEdges = [];
    
    // Get connected leaders
    for (const edge of graphData.edges) {
        if (edge.data.type === 'leads_project') {
            for (const node of projectNodes) {
                if (edge.data.target === node.data.id) {
                    projectEdges.push(edge);
                    leaderIds.add(edge.data.source);
                }
            }
        }
    }
    
    // Add connected leaders
    const leaderNodes = graphData.nodes.filter(
        node => node.data.type === 'leader' && leaderIds.has(node.data.id)
    );
    
    // Initialize network with filtered data
    Network.initNetwork('project-network', projectNodes.concat(leaderNodes, projectEdges));
    
    // Initialize filters
    Filters.initFilters(graphData);
    
    // Set up event listeners
    setupEventListeners();
    
    // Update statistics
    updateStatistics(graphData);
});

/**
 * Set up event listeners for UI controls
 */
function setupEventListeners() {
    // Reset view button
    const resetViewButton = document.getElementById('reset-view');
    if (resetViewButton) {
        resetViewButton.addEventListener('click', function() {
            Network.resetView();
        });
    }
    
    // Export PNG button
    const exportPngButton = document.getElementById('export-png');
    if (exportPngButton) {
        exportPngButton.addEventListener('click', function() {
            Network.exportAsPng();
        });
    }
}

/**
 * Update the network statistics display
 * @param {Object} data - The graph data
 */
function updateStatistics(data) {
    const statsContainer = document.getElementById('network-stats');
    if (!statsContainer) return;
    
    const stats = data.statistics;
    
    statsContainer.innerHTML = `
        <p><span style="color: var(--project-primary);">●</span> Projekte: ${stats.project_count}</p>
        <p><span style="color: var(--leader-primary);">●</span> Personen: ${stats.leader_count}</p>
        <p><span style="color: var(--edge-default);">●</span> Verbindungen: ${data.edges.length}</p>
    `;
}
