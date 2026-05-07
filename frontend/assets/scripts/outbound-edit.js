/**
 * Outbound Trunk Edit Page Logic
 * Uses unified update endpoint with local diffing
 */

let originalTrunk = null;
let currentTrunk = null;

document.addEventListener('DOMContentLoaded', async () => {
    initializeIcons();
    setupOutboundEditEventListeners();
    await loadOutboundTrunk();
});

function setupOutboundEditEventListeners() {
    const backBtn = document.getElementById('back-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const form = document.getElementById('outbound-edit-form');

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
    if (numbersAddBtn) {
        numbersAddBtn.addEventListener('click', handleAddNumbers);
    }
}

async function loadOutboundTrunk() {
    const trunkId = getTrunkIdFromUrl();
    if (!trunkId) {
        showLoading(false);
        showError(true, 'Missing trunk ID in URL.');
        return;
    }

    try {
        showLoading(true);
        showError(false);

        const result = await campaignAPI.getOutboundTrunks();
        if (!result || !result.success || !result.data) {
            throw new Error('Invalid outbound trunks response');
        }

        const trunks = extractTrunkList(result.data || {});
        const trunk = trunks.find(item => getTrunkId(item) === trunkId);
        if (!trunk) {
            throw new Error('Outbound trunk not found');
        }

        originalTrunk = normalizeTrunk(trunk);
        currentTrunk = cloneTrunk(originalTrunk);

        renderTrunk();
        showLoading(false);
        toggleElement('form-container', true);
    } catch (error) {
        console.error('Error loading outbound trunk:', error);
        showLoading(false);
        showError(true, error.message || 'Failed to load outbound trunk');
        showToast('Error loading outbound trunk', 3000, 'error');
    }
}

function renderTrunk() {
    if (!currentTrunk) return;

    const subtitle = document.getElementById('trunk-subtitle');
    if (subtitle) {
        subtitle.textContent = currentTrunk.name || currentTrunk.trunk_id || 'Outbound Trunk';
    }

    const idInput = document.getElementById('trunk-id');
    if (idInput) idInput.value = currentTrunk.trunk_id || '';

    const nameInput = document.getElementById('trunk-name');
    if (nameInput) nameInput.value = currentTrunk.name || '';

    const addressInput = document.getElementById('trunk-address');
    if (addressInput) addressInput.value = currentTrunk.address || '';

    const transportSelect = document.getElementById('trunk-transport');
    if (transportSelect) transportSelect.value = currentTrunk.transport || '';

    const metadataInput = document.getElementById('trunk-metadata');
    if (metadataInput) metadataInput.value = currentTrunk.metadata || '';

    const authUserInput = document.getElementById('trunk-auth-username');
    if (authUserInput) authUserInput.value = currentTrunk.auth_username || '';

    const authPassInput = document.getElementById('trunk-auth-password');
    if (authPassInput) authPassInput.value = currentTrunk.auth_password || '';

    renderNumbersList();
    initializeIcons();
}

function renderNumbersList() {
    const container = document.getElementById('numbers-list');
    if (!container) return;

    const values = Array.isArray(currentTrunk.numbers) ? currentTrunk.numbers : [];
    if (!values.length) {
        container.innerHTML = '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-600">No numbers configured.</span>';
        return;
    }

    container.innerHTML = values.map(value => `
        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-800">
            <span>${escapeHtml(value)}</span>
            <button type="button" class="text-gray-400 hover:text-red-600 list-remove-btn" data-value="${escapeHtml(value)}" title="Remove">
                <i data-feather="x" class="w-3 h-3"></i>
            </button>
        </span>
    `).join('');

    container.querySelectorAll('.list-remove-btn').forEach(btn => {
        btn.addEventListener('click', (event) => {
            event.preventDefault();
            const value = btn.getAttribute('data-value');
            if (!value) return;
            removeNumber(value);
        });
    });
}

function handleAddNumbers() {
    if (!currentTrunk) return;

    const input = document.getElementById('numbers-input');
    if (!input) return;

    const rawValues = splitValues(input.value || '');
    if (!rawValues.length) {
        showToast('Enter at least one number', 2500, 'error');
        return;
    }

    const currentValues = Array.isArray(currentTrunk.numbers) ? currentTrunk.numbers : [];
    currentTrunk.numbers = appendUniqueValues(currentValues, rawValues);

    input.value = '';
    renderTrunk();
}

function removeNumber(value) {
    if (!currentTrunk || !Array.isArray(currentTrunk.numbers)) return;

    currentTrunk.numbers = currentTrunk.numbers.filter(item => item !== value);
    renderTrunk();
}

async function handleSave(event) {
    event.preventDefault();
    if (!currentTrunk || !originalTrunk) return;

    const payload = buildDiffPayload();
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
        const result = await campaignAPI.updateOutboundTrunkUnified(payload);
        if (result && result.success) {
            showToast(result.message || 'Outbound trunk updated', 3000, 'success');

            const serverTrunk = result.trunk ? normalizeTrunk(result.trunk) : null;
            if (serverTrunk) {
                originalTrunk = cloneTrunk(serverTrunk);
                currentTrunk = cloneTrunk(serverTrunk);
            } else {
                originalTrunk = cloneTrunk(currentTrunk);
            }

            renderTrunk();
            const target = '/trunks/outbound.html';
            window.location.href = window.APP_CONFIG && typeof window.APP_CONFIG.frontendUrl === 'function'
                ? window.APP_CONFIG.frontendUrl(target)
                : target;
        } else {
            throw new Error(result && result.message ? result.message : 'Update failed');
        }
    } catch (error) {
        console.error('Error saving outbound trunk:', error);
        showToast(error.message || 'Failed to update outbound trunk', 4000, 'error');
    } finally {
        if (saveBtn) {
            saveBtn.innerHTML = originalContent;
            saveBtn.disabled = false;
            initializeIcons();
        }
    }
}

function buildDiffPayload() {
    const payload = { trunk_id: currentTrunk.trunk_id };

    const name = readValue('trunk-name');
    const address = readValue('trunk-address');
    const transport = readValue('trunk-transport');
    const metadata = readValue('trunk-metadata');
    const auth_username = readValue('trunk-auth-username');
    const auth_password = readValue('trunk-auth-password');

    if (name !== (originalTrunk.name || '')) payload.name = name;
    if (address !== (originalTrunk.address || '')) payload.address = address;
    if (transport !== (originalTrunk.transport || '')) payload.transport = transport;
    if (metadata !== (originalTrunk.metadata || '')) payload.metadata = metadata;

    const originalUser = originalTrunk.auth_username || '';
    if (auth_username !== originalUser) payload.auth_username = auth_username;

    const originalPass = originalTrunk.auth_password || '';
    if (auth_password !== originalPass) payload.auth_password = auth_password;

    const numbersDiff = diffLists(originalTrunk.numbers, currentTrunk.numbers);
    if (numbersDiff.add.length) payload.add_numbers = numbersDiff.add;
    if (numbersDiff.remove.length) payload.remove_numbers = numbersDiff.remove;

    const keys = Object.keys(payload).filter(key => key !== 'trunk_id');
    if (!keys.length) return null;

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

function readValue(id) {
    const el = document.getElementById(id);
    return el ? (el.value || '').trim() : '';
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
    const numbers = Array.isArray(trunk.numbers) ? trunk.numbers : (trunk.numbers ? [trunk.numbers] : []);

    const rawTransport = (trunk.transport || '').toString().toLowerCase();
    let transport = '';
    if (rawTransport.includes('udp')) transport = 'udp';
    else if (rawTransport.includes('tcp')) transport = 'tcp';
    else if (rawTransport.includes('tls')) transport = 'tls';

    return {
        trunk_id: getTrunkId(trunk),
        name: trunk.name || '',
        address: trunk.address || '',
        transport,
        auth_username: trunk.auth_username || '',
        auth_password: trunk.auth_password || '',
        metadata: trunk.metadata || '',
        numbers: appendUniqueValues([], numbers.map(String)),
    };
}

function cloneTrunk(trunk) {
    return JSON.parse(JSON.stringify(trunk));
}

function splitValues(raw) {
    return (raw || '')
        .split(',')
        .map(v => v.trim())
        .filter(Boolean);
}

function appendUniqueValues(existing, incoming) {
    const seen = new Set(Array.isArray(existing) ? existing : []);
    const result = Array.isArray(existing) ? [...existing] : [];

    for (const value of incoming || []) {
        const v = String(value).trim();
        if (!v || seen.has(v)) continue;
        seen.add(v);
        result.push(v);
    }

    return result;
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
    return text.toString().replace(/[&<>"']/g, m => map[m]);
}
