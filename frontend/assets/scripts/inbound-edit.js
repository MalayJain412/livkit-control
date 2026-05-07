/**
 * Inbound Trunk Edit Page Logic
 * Uses unified update endpoint with local diffing
 */

let originalTrunk = null;
let currentTrunk = null;

document.addEventListener('DOMContentLoaded', async () => {
    initializeIcons();
    setupInboundEditEventListeners();
    await loadInboundTrunk();
});

function setupInboundEditEventListeners() {
    const backBtn = document.getElementById('back-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const form = document.getElementById('inbound-edit-form');

    if (backBtn) {
        backBtn.addEventListener('click', () => window.history.back());
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => window.history.back());
    }
    if (form) {
        form.addEventListener('submit', handleSave);
    }

    const numbersAddBtn = document.getElementById('numbers-add-btn');
    const allowedNumbersAddBtn = document.getElementById('allowed-numbers-add-btn');
    const allowedAddressesAddBtn = document.getElementById('allowed-addresses-add-btn');

    if (numbersAddBtn) {
        numbersAddBtn.addEventListener('click', () => handleAddValues('numbers'));
    }
    if (allowedNumbersAddBtn) {
        allowedNumbersAddBtn.addEventListener('click', () => handleAddValues('allowed_numbers'));
    }
    if (allowedAddressesAddBtn) {
        allowedAddressesAddBtn.addEventListener('click', () => handleAddValues('allowed_addresses'));
    }
}

async function loadInboundTrunk() {
    const trunkId = getTrunkIdFromUrl();
    if (!trunkId) {
        showLoading(false);
        showError(true, 'Missing trunk ID in URL.');
        return;
    }

    try {
        showLoading(true);
        showError(false);

        const result = await campaignAPI.getInboundTrunks();
        if (!result || !result.success || !result.data) {
            throw new Error('Invalid inbound trunks response');
        }

        const trunks = extractTrunkList(result.data || {});
        const trunk = trunks.find(item => getTrunkId(item) === trunkId);
        if (!trunk) {
            throw new Error('Inbound trunk not found');
        }

        originalTrunk = normalizeTrunk(trunk);
        currentTrunk = cloneTrunk(originalTrunk);

        renderTrunk();
        showLoading(false);
        toggleElement('form-container', true);
    } catch (error) {
        console.error('Error loading inbound trunk:', error);
        showLoading(false);
        showError(true, error.message || 'Failed to load inbound trunk');
        showToast('Error loading inbound trunk', 3000, 'error');
    }
}

function renderTrunk() {
    if (!currentTrunk) return;

    const subtitle = document.getElementById('trunk-subtitle');
    if (subtitle) {
        subtitle.textContent = currentTrunk.name || currentTrunk.trunk_id || 'Inbound Trunk';
    }

    const idInput = document.getElementById('trunk-id');
    if (idInput) idInput.value = currentTrunk.trunk_id || '';

    const nameInput = document.getElementById('trunk-name');
    if (nameInput) nameInput.value = currentTrunk.name || '';

    renderList('numbers-list', currentTrunk.numbers, 'No numbers configured.', 'numbers');
    renderList('allowed-numbers-list', currentTrunk.allowed_numbers, 'All callers allowed.', 'allowed_numbers');
    renderList('allowed-addresses-list', currentTrunk.allowed_addresses, 'All addresses allowed.', 'allowed_addresses');

    initializeIcons();
}

function renderList(containerId, values, emptyLabel, listKey) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (!values || !values.length) {
        container.innerHTML = `<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600">${escapeHtml(emptyLabel)}</span>`;
        return;
    }

    container.innerHTML = values.map(value => `
        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-800">
            <span>${escapeHtml(value)}</span>
            <button type="button" class="text-gray-400 hover:text-red-600 list-remove-btn" data-list="${escapeHtml(listKey)}" data-value="${escapeHtml(value)}" title="Remove">
                <i data-feather="x" class="w-3 h-3"></i>
            </button>
        </span>
    `).join('');

    container.querySelectorAll('.list-remove-btn').forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            const listName = btn.getAttribute('data-list');
            const value = btn.getAttribute('data-value');
            if (!listName || !value) return;
            removeValue(listName, value);
        });
    });
}

function handleAddValues(listKey) {
    if (!currentTrunk) return;

    const input = getInputForList(listKey);
    if (!input) return;

    const rawValues = splitValues(input.value || '');
    if (!rawValues.length) {
        showToast('Enter at least one value', 2500, 'error');
        return;
    }

    const currentValues = Array.isArray(currentTrunk[listKey]) ? currentTrunk[listKey] : [];
    const nextValues = appendUniqueValues(currentValues, rawValues);
    currentTrunk[listKey] = nextValues;

    input.value = '';
    renderTrunk();
}

function removeValue(listKey, value) {
    if (!currentTrunk || !Array.isArray(currentTrunk[listKey])) return;

    currentTrunk[listKey] = currentTrunk[listKey].filter(item => item !== value);
    renderTrunk();
}

async function handleSave(event) {
    event.preventDefault();
    if (!currentTrunk || !originalTrunk) return;

    const nameInput = document.getElementById('trunk-name');
    const name = nameInput ? nameInput.value.trim() : '';

    const payload = buildDiffPayload(name);
    if (!payload) {
        showToast('No changes to save', 2500, 'info');
        return;
    }

    const saveBtn = document.getElementById('save-btn');
    const originalContent = saveBtn ? saveBtn.innerHTML : '';
    if (saveBtn) {
        saveBtn.innerHTML = '<i data-feather="loader" class="w-5 h-5 animate-spin"></i><span>Saving...</span>';
        saveBtn.disabled = true;
        initializeIcons();
    }

    try {
        const result = await campaignAPI.updateInboundTrunkUnified(payload);
        if (result && result.success) {
            showToast(result.message || 'Inbound trunk updated', 3000, 'success');
            originalTrunk = cloneTrunk({
                ...currentTrunk,
                name: name,
            });
            currentTrunk.name = name;
            renderTrunk();
            const target = '/trunks/inbound.html';
            window.location.href = window.APP_CONFIG && typeof window.APP_CONFIG.frontendUrl === 'function'
                ? window.APP_CONFIG.frontendUrl(target)
                : target;
        } else {
            throw new Error(result && result.message ? result.message : 'Update failed');
        }
    } catch (error) {
        console.error('Error saving inbound trunk:', error);
        showToast(error.message || 'Failed to update inbound trunk', 4000, 'error');
    } finally {
        if (saveBtn) {
            saveBtn.innerHTML = originalContent;
            saveBtn.disabled = false;
            initializeIcons();
        }
    }
}

function buildDiffPayload(name) {
    const payload = { trunk_id: currentTrunk.trunk_id };

    if (name !== (originalTrunk.name || '')) {
        payload.name = name;
    }

    const numbersDiff = diffLists(originalTrunk.numbers, currentTrunk.numbers);
    const allowedNumbersDiff = diffLists(originalTrunk.allowed_numbers, currentTrunk.allowed_numbers);
    const allowedAddressesDiff = diffLists(originalTrunk.allowed_addresses, currentTrunk.allowed_addresses);

    if (numbersDiff.add.length) payload.add_numbers = numbersDiff.add;
    if (numbersDiff.remove.length) payload.remove_numbers = numbersDiff.remove;
    if (allowedNumbersDiff.add.length) payload.add_allowed_numbers = allowedNumbersDiff.add;
    if (allowedNumbersDiff.remove.length) payload.remove_allowed_numbers = allowedNumbersDiff.remove;
    if (allowedAddressesDiff.add.length) payload.add_allowed_addresses = allowedAddressesDiff.add;
    if (allowedAddressesDiff.remove.length) payload.remove_allowed_addresses = allowedAddressesDiff.remove;

    const keys = Object.keys(payload).filter(key => key !== 'trunk_id');
    if (!keys.length) {
        return null;
    }

    return payload;
}

function diffLists(original, current) {
    const originalList = Array.isArray(original) ? original : [];
    const currentList = Array.isArray(current) ? current : [];

    const originalSet = new Set(originalList);
    const currentSet = new Set(currentList);

    const add = currentList.filter(item => !originalSet.has(item));
    const remove = originalList.filter(item => !currentSet.has(item));

    return { add, remove };
}

function getTrunkIdFromUrl() {
    const params = new URLSearchParams(window.location.search);
    return params.get('id');
}

function getTrunkId(trunk) {
    return trunk.trunk_id || trunk.sip_trunk_id || trunk.id || '';
}

function extractTrunkList(raw) {
    if (!raw || typeof raw !== 'object') return [];
    if (Array.isArray(raw.trunks)) return raw.trunks;
    if (Array.isArray(raw.items)) return raw.items;
    return [];
}

function normalizeTrunk(trunk) {
    return {
        trunk_id: getTrunkId(trunk),
        name: trunk.name || '',
        numbers: normalizeArray(trunk.numbers),
        allowed_numbers: normalizeArray(trunk.allowed_numbers),
        allowed_addresses: normalizeArray(trunk.allowed_addresses),
    };
}

function cloneTrunk(trunk) {
    return JSON.parse(JSON.stringify(trunk || {}));
}

function normalizeArray(value) {
    if (Array.isArray(value)) {
        return normalizeValues(value);
    }
    if (value === null || value === undefined || value === '') {
        return [];
    }
    return normalizeValues([value]);
}

function normalizeValues(values) {
    const seen = new Set();
    const normalized = [];

    values.forEach(item => {
        const val = String(item || '').trim();
        if (!val || seen.has(val)) return;
        seen.add(val);
        normalized.push(val);
    });

    return normalized;
}

function splitValues(raw) {
    return normalizeValues((raw || '')
        .split(',')
        .map(item => item.trim())
        .filter(Boolean));
}

function appendUniqueValues(existing, additions) {
    const current = Array.isArray(existing) ? existing.slice() : [];
    const seen = new Set(current);

    additions.forEach(item => {
        if (!seen.has(item)) {
            current.push(item);
            seen.add(item);
        }
    });

    return current;
}

function getInputForList(listKey) {
    if (listKey === 'numbers') return document.getElementById('numbers-input');
    if (listKey === 'allowed_numbers') return document.getElementById('allowed-numbers-input');
    if (listKey === 'allowed_addresses') return document.getElementById('allowed-addresses-input');
    return null;
}

function escapeHtml(text) {
    if (!text) return '';
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.toString().replace(/[&<>"']/g, match => map[match]);
}
