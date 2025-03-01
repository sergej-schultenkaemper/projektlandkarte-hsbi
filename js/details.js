/**
 * Details Module
 * Handles displaying details for selected nodes
 */

const Details = (function() {
    /**
     * Show details for a selected node
     * @param {Object} nodeData - Data for the selected node
     */
    function showNodeDetails(nodeData) {
        if (!nodeData) {
            setDefaultDetails();
            return;
        }
        
        const detailsContainer = document.getElementById('element-details');
        if (!detailsContainer) return;
        
        if (nodeData.type === 'leader') {
            showLeaderDetails(nodeData, detailsContainer);
        } else if (nodeData.type === 'project') {
            showProjectDetails(nodeData, detailsContainer);
        } else {
            setDefaultDetails();
        }
    }
    
    /**
     * Show details for a leader node
     * @param {Object} nodeData - Data for the leader node
     * @param {HTMLElement} container - Container element for the details
     */
    function showLeaderDetails(nodeData, container) {
        const details = nodeData.details || {};
        const contactInfo = details.contact_info || {};
        const publicationsInfo = details.publications_info || {};
        
        // Count connected projects
        const cy = Network.getInstance();
        const projectCount = cy ? 
            cy.edges(`[source = "${nodeData.id}"][type = "leads_project"]`).length : 0;
        
        // Create contact info section
        let contactSection = '';
        if (Object.values(contactInfo).some(val => val)) {
            if (contactInfo.email) {
                contactSection += `
                    <p style="margin-top: 5px">
                        <strong>Email: </strong>
                        <a href="mailto:${contactInfo.email}">${contactInfo.email}</a>
                    </p>
                `;
            }
            
            if (contactInfo.phone) {
                contactSection += `
                    <p style="margin-top: 5px">
                        <strong>Telefon: </strong>
                        ${contactInfo.phone}
                    </p>
                `;
            }
        }
        
        // Create publication info section
        let publicationSection = '';
        if (publicationsInfo) {
            if (publicationsInfo.publication_count > 0) {
                publicationSection += `
                    <p style="margin-top: 10px">
                        <strong>Publikationen: </strong>
                        ${publicationsInfo.publication_count}
                    </p>
                `;
            }
            
            if (publicationsInfo.url) {
                publicationSection += `
                    <p style="margin-top: 5px">
                        <strong>Publikationsprofil: </strong>
                        <a href="${publicationsInfo.url}" target="_blank">Link</a>
                    </p>
                `;
            }
            
            if (publicationsInfo.orcid) {
                publicationSection += `
                    <p style="margin-top: 5px">
                        <strong>ORCID: </strong>
                        <a href="https://orcid.org/${publicationsInfo.orcid}" target="_blank">${publicationsInfo.orcid}</a>
                    </p>
                `;
            }
        }
        
        // Set the HTML content
        container.innerHTML = `
            <h4 style="color: var(--leader-primary)">${details.full_name || nodeData.id}</h4>
            <p style="margin-top: 10px">Projekte: ${projectCount}</p>
            ${contactSection}
            ${publicationSection}
        `;
    }
    
    /**
     * Show details for a project node
     * @param {Object} nodeData - Data for the project node
     * @param {HTMLElement} container - Container element for the details
     */
    function showProjectDetails(nodeData, container) {
        const details = nodeData.details || {};
        
        // Create URL link if available
        const urlElement = details.url ? 
            `<a href="${details.url}" target="_blank" style="margin-left: 10px">Projekt-URL</a>` : '';
        
        // Create participants section
        let participantsSection = '';
        const participants = details.participants || {};
        const persons = participants.persons || [];
        const organizations = participants.organizations || [];
        
        if (persons.length > 0) {
            participantsSection += `
                <p style="margin-top: 10px; font-weight: bold">Beteiligte Personen:</p>
                <p style="font-size: 0.9em">${persons.join(', ')}</p>
            `;
        }
        
        if (organizations.length > 0) {
            participantsSection += `
                <p style="margin-top: 10px; font-weight: bold">Beteiligte Organisationen:</p>
                <p style="font-size: 0.9em">${organizations.join(', ')}</p>
            `;
        }
        
        // Set the HTML content
        container.innerHTML = `
            <div>
                <h4 style="color: var(--project-primary); display: inline">${nodeData.full_title}</h4>
                ${details.short_name ? `<span style="color: #666"> (${details.short_name})</span>` : ''}
                ${urlElement}
            </div>
            
            <p style="margin-top: 10px">Laufzeit: ${details.duration || 'N/A'}</p>
            <p style="margin-top: 5px">Fachbereich: ${details.fachbereich || 'N/A'}</p>
            
            <p style="margin-top: 10px; font-weight: bold">Beschreibung:</p>
            <p style="font-size: 0.9em">${details.description || 'Keine Beschreibung verfügbar'}</p>
            
            <p style="margin-top: 10px; font-weight: bold">Schlüsselwörter:</p>
            <p style="font-size: 0.9em">${(details.keywords || []).join(', ') || 'Keine Schlüsselwörter'}</p>
            
            <p style="margin-top: 10px; font-weight: bold">Förderung:</p>
            <p style="font-size: 0.9em">${details.funding || 'Keine Angabe'}</p>
            
            ${participantsSection}
        `;
    }
    
    /**
     * Set default details message
     */
    function setDefaultDetails() {
        const detailsContainer = document.getElementById('element-details');
        if (detailsContainer) {
            detailsContainer.innerHTML = 'Klicken Sie auf einen Knoten, um Details anzuzeigen';
        }
    }
    
    // Public API
    return {
        showNodeDetails,
        setDefaultDetails
    };
})();
