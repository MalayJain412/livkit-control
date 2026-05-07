/**
 * UI Utilities for CreativeNest Admin Panel
 * Shared functions for rendering components and handling interactions
 */

/**
 * Show a toast notification
 */
function showToast(message, duration = 3000, type = 'success') {
    const toast = document.getElementById('toast');
    const toastMessage = document.getElementById('toast-message');
    
    if (!toast) return;

    toastMessage.textContent = message;
    toast.classList.remove('hidden');
    
    // Add type-specific styling
    toast.classList.remove('bg-gray-900', 'bg-green-600', 'bg-red-600');
    if (type === 'error') {
        toast.classList.add('bg-red-600');
    } else if (type === 'success') {
        toast.classList.add('bg-green-600');
    } else {
        toast.classList.add('bg-gray-900');
    }

    setTimeout(() => {
        toast.classList.add('hidden');
    }, duration);
}

/**
 * Copy text to clipboard
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Copied to clipboard!', 2000, 'success');
        return true;
    } catch (error) {
        console.error('Failed to copy:', error);
        showToast('Failed to copy to clipboard', 2000, 'error');
        return false;
    }
}

/**
 * Format date to readable string
 */
function formatDate(dateString) {
    if (!dateString) return 'N/A';
    
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    } catch (error) {
        return dateString;
    }
}

/**
 * Truncate text with ellipsis
 */
function truncateText(text, maxLength = 50) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

/**
 * Get the campaign direction badge color
 */
function getDirectionBadgeClass(direction) {
    if (direction === 'inbound') {
        return 'bg-blue-100 text-blue-800';
    } else if (direction === 'outbound') {
        return 'bg-green-100 text-green-800';
    }
    return 'bg-gray-100 text-gray-800';
}

/**
 * Get the campaign direction label
 */
function getDirectionLabel(direction) {
    if (direction === 'inbound') return 'Inbound';
    if (direction === 'outbound') return 'Outbound';
    return 'Unknown';
}

/**
 * Show loading state
 */
function showLoading(show = true, containerId = 'loading') {
    const element = document.getElementById(containerId);
    if (element) {
        element.classList.toggle('hidden', !show);
    }
}

/**
 * Show error state
 */
function showError(show = true, message = '', containerId = 'error-state') {
    const element = document.getElementById(containerId);
    if (element) {
        if (show && message) {
            const messageElement = document.getElementById('error-message');
            if (messageElement) {
                messageElement.textContent = message;
            }
        }
        element.classList.toggle('hidden', !show);
    }
}

/**
 * Show empty state
 */
function showEmpty(show = true, containerId = 'empty-state') {
    const element = document.getElementById(containerId);
    if (element) {
        element.classList.toggle('hidden', !show);
    }
}

/**
 * Show/hide element
 */
function toggleElement(elementId, show) {
    const element = document.getElementById(elementId);
    if (element) {
        element.classList.toggle('hidden', !show);
    }
}

/**
 * Debounce function for search and other events
 */
function debounce(func, delay = 300) {
    let timeoutId;
    return function (...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
}

/**
 * Parse campaign data and prepare for display
 */
function parseCampaignForDisplay(campaign) {
    return {
        id: campaign.id || 'N/A',
        name: campaign.name || 'Unnamed Campaign',
        direction: campaign.direction || 'unknown',
        campaign_number: campaign.campaign_number || 'N/A',
        created_at: campaign.created_at || new Date().toISOString()
    };
}

/**
 * Validate required fields in campaign data
 */
function validateCampaignData(data) {
    const errors = [];
    
    if (!data.name || data.name.trim() === '') {
        errors.push('Campaign name is required');
    }
    
    if (!data.direction || !['inbound', 'outbound'].includes(data.direction)) {
        errors.push('Valid direction (inbound/outbound) is required');
    }
    
    if (!data.campaign_number || data.campaign_number.trim() === '') {
        errors.push('Campaign number is required');
    }

    return {
        isValid: errors.length === 0,
        errors
    };
}

/**
 * Get mock or real timestamp
 */
function getTimestamp() {
    return new Date().toISOString();
}

/**
 * Initialize page with feather icons
 */
function initializeIcons() {
    if (typeof feather !== 'undefined') {
        feather.replace();
    }
}

/**
 * Reload page
 */
function reloadPage() {
    window.location.reload();
}

/**
 * Navigate to campaign edit page
 */
function navigateToCampaignEdit(campaignId) {
    const target = `/campaigns/edit.html?id=${campaignId}`;
    window.location.href = window.APP_CONFIG && typeof window.APP_CONFIG.frontendUrl === 'function'
        ? window.APP_CONFIG.frontendUrl(target)
        : target;
}

/**
 * Get campaign ID from URL parameters
 */
function getCampaignIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

/**
 * Get agent ID from URL parameters
 */
function getAgentIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

/**
 * Format phone number
 */
function formatPhoneNumber(number) {
    if (!number) return 'N/A';
    return number.toString().replace(/(\d{1})(\d{3})(\d{3})(\d{4})/, '+$1 ($2) $3-$4');
}
