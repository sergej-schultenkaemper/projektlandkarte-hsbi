/**
 * Data Processor Module
 * Handles loading and processing graph data
 */

const DataProcessor = (function() {
    // Private variables
    let graphData = null;
    
    /**
     * Load graph data from JSON file
     * @param {string} filePath - Path to the JSON file
     * @returns {Promise} - Promise that resolves with processed data
     */
    async function loadGraphData(filePath) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                throw new Error(`Failed to load data: ${response.status} ${response.statusText}`);
            }
            const data = await response.json();
            graphData = processGraphData(data);
            return graphData;
        } catch (error) {
            console.error('Error loading graph data:', error);
            return {
                nodes: [],
                edges: [],
                keywords: [],
                years: [],
                organizations: [],
                fachbereiche: [],
                statistics: {}
            };
        }
    }
    
    /**
     * Process the graph data from separate arrays into Cytoscape format
     * @param {Object} data - Raw data from JSON
     * @returns {Object} - Processed data in Cytoscape format
     */
    function processGraphData(data) {
        if (!data || typeof data !== 'object') {
            return {
                nodes: [],
                edges: [],
                keywords: [],
                years: [],
                organizations: [],
                fachbereiche: [],
                statistics: {}
            };
        }
        
        const nodes = [];
        const edges = [];
        const allKeywords = new Set();
        const allOrganizations = new Set();
        const allFachbereiche = new Set();
        
        // Process leaders
        if (Array.isArray(data.leaders)) {
            data.leaders.forEach(leader => {
                nodes.push({
                    data: {
                        id: leader.id,
                        label: leader.simplified_name,
                        type: 'leader',
                        node_size: 75,
                        details: {
                            name: leader.full_name,
                            simplified_name: leader.simplified_name,
                            full_name: leader.full_name,
                            contact_info: leader.contact_info || {},
                            publications_info: leader.publications_info || {
                                url: null,
                                orcid: null,
                                publication_count: 0
                            }
                        }
                    },
                    classes: 'leader'
                });
            });
        }
        
        // Process projects
        if (Array.isArray(data.projects)) {
            data.projects.forEach(project => {
                // Get fachbereich value
                let fachbereich = null;
                if (project.fachbereich) {
                    fachbereich = project.fachbereich.trim();
                    console.log('Project ID:', project.id, 'Fachbereich:', fachbereich);
                }
                
                nodes.push({
                    data: {
                        id: project.id,
                        label: project.short_name || project.id,
                        type: 'project',
                        full_title: project.title,
                        node_size: 50,
                        year: String(project.year || 'Unknown'),
                        details: {
                            description: project.description || '',
                            duration: `${project.duration?.von || 'N/A'} - ${project.duration?.bis || 'N/A'}`,
                            keywords: project.keywords || [],
                            fachbereich: fachbereich,
                            url: project.url || '',
                            funding: project.funding || '',
                            short_name: project.short_name || '',
                            participants: {
                                persons: project.participants?.persons || [],
                                organizations: project.participants?.organizations || []
                            }
                        }
                    },
                    classes: 'project'
                });
                
                // Collect keywords
                if (project.keywords) {
                    project.keywords.forEach(keyword => allKeywords.add(keyword));
                }
                
                // Collect organizations
                if (project.participants && project.participants.organizations) {
                    project.participants.organizations.forEach(org => allOrganizations.add(org));
                }
                
                // Collect fachbereiche
                if (project.fachbereich) {
                    allFachbereiche.add(fachbereich);
                    console.log('Adding fachbereich:', fachbereich);
                }
            });
        }
        
        // Process leader-project edges
        if (Array.isArray(data.leader_project_edges)) {
            data.leader_project_edges.forEach(edge => {
                edges.push({
                    data: {
                        id: `${edge.source}-${edge.target}`,
                        source: edge.source,
                        target: edge.target,
                        type: 'leads_project',
                        weight: 1
                    }
                });
            });
        }
        
        // Use statistics from the data if available, otherwise calculate them
        const statistics = data.statistics || {
            project_count: nodes.filter(n => n.data.type === 'project').length,
            leader_count: nodes.filter(n => n.data.type === 'leader').length,
            leaders_with_publications: nodes.filter(n => 
                n.data.type === 'leader' && 
                n.data.details.publications_info.publication_count > 0
            ).length,
            leaders_without_publications: nodes.filter(n => 
                n.data.type === 'leader' && 
                n.data.details.publications_info.publication_count === 0
            ).length
        };
        
        return {
            nodes: nodes,
            edges: edges,
            keywords: [...allKeywords].sort(),
            organizations: [...allOrganizations].sort(),
            fachbereiche: [...allFachbereiche].sort(),
            years: data.years || [],
            statistics: statistics
        };
    }
    
    /**
     * Get the current graph data
     * @returns {Object} - The processed graph data
     */
    function getGraphData() {
        return graphData;
    }
    
    // Public API
    return {
        loadGraphData,
        getGraphData
    };
})();
