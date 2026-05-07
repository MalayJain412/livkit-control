/**
 * Outbound Trunks Page Logic (card-style like campaigns/agents)
 */

let outboundTrunksAll = [];
let outboundTrunksFiltered = [];
let selectedOutboundTrunk = null;
let outboundEditMode = 'edit'; // 'edit' or 'create'

window.addEventListener('layout:ready', async () => {
    try {
        initializeIcons();
        setupOutboundEventListeners();
        await loadOutboundTrunks();
    } catch (error) {
        console.error('Error initializing outbound trunks page:', error);
    }
});

function setupOutboundEventListeners() {
    const outboundRetryBtn = document.getElementById('outbound-retry-btn');
    const searchInput = document.getElementById('search-input');
    const generalForm = document.getElementById('outbound-general-form');
    const numbersForm = document.getElementById('outbound-numbers-form');
    const cancelBtn = document.getElementById('outbound-edit-cancel');
    const createBtn = document.getElementById('outbound-create-btn');

    if (outboundRetryBtn) {
        outboundRetryBtn.addEventListener('click', loadOutboundTrunks);
    }
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleOutboundSearch, 300));
    }
    if (generalForm) {
        generalForm.addEventListener('submit', handleOutboundGeneralSubmit);
    }
    if (numbersForm) {
        numbersForm.addEventListener('submit', handleOutboundNumbersSubmit);
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', hideOutboundEditPanel);
    }
    if (createBtn) {
        createBtn.addEventListener('click', openOutboundCreatePanel);
    }
}

async function loadOutboundTrunks() {
    setOutboundLoading(true);
    hideOutboundEditPanel();

    try {
        const result = await campaignAPI.getOutboundTrunks();
        if (!result || !result.success || !result.data) {
            throw new Error('Invalid outbound trunks response');
        }

        const trunks = extractTrunkList(result.data || {});
        outboundTrunksAll = trunks;
        outboundTrunksFiltered = [...outboundTrunksAll];
        renderOutboundTrunks();
        setOutboundLoading(false);
    } catch (error) {
        console.error('Error loading outbound trunks:', error);
        setOutboundLoading(false);
        showOutboundError(error.message || 'Failed to load outbound trunks');
        showToast('Error loading outbound trunks', 3000, 'error');
    }
}

function extractTrunkList(raw) {
    if (!raw || typeof raw !== 'object') return [];
    if (Array.isArray(raw.trunks)) return raw.trunks;
    if (Array.isArray(raw.items)) return raw.items;
    return [];
}

function handleOutboundSearch(event) {
    const query = event.target.value.toLowerCase().trim();

    if (!query) {
        outboundTrunksFiltered = [...outboundTrunksAll];
    } else {
        outboundTrunksFiltered = outboundTrunksAll.filter(trunk => {
            const id = (trunk.trunk_id || trunk.sip_trunk_id || trunk.id || '').toLowerCase();
            const name = (trunk.name || '').toLowerCase();
            return id.includes(query) || name.includes(query);
        });
    }

    renderOutboundTrunks();
}

function renderOutboundTrunks() {
    const grid = document.getElementById('outbound-grid');
    const emptyState = document.getElementById('outbound-empty-state');
    const errorState = document.getElementById('outbound-error-state');

    if (!grid || !emptyState || !errorState) return;

    // Hide error while rendering
    errorState.classList.add('hidden');

    if (!outboundTrunksFiltered.length) {
        if (!outboundTrunksAll.length) {
            // Real empty state (no trunks at all)
            grid.classList.add('hidden');
            emptyState.classList.remove('hidden');
            grid.innerHTML = '';
            initializeIcons();
        } else {
            // Search returned no results
            emptyState.classList.add('hidden');
            grid.innerHTML = `
                <div class="col-span-full text-center py-12">
                    <i data-feather="search" class="w-16 h-16 text-gray-300 mx-auto mb-4"></i>
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">No outbound trunks found</h3>
                    <p class="text-gray-600">Try adjusting your search criteria</p>
                </div>
            `;
            grid.classList.remove('hidden');
            initializeIcons();
        }
        return;
    }

    emptyState.classList.add('hidden');
    grid.innerHTML = outboundTrunksFiltered.map((trunk, index) => createOutboundTrunkCard(trunk, index)).join('');
    grid.classList.remove('hidden');
    initializeIcons();

    // Edit buttons
    document.querySelectorAll('.outbound-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            if (!id) {
                console.warn('Clicked outbound trunk missing id for edit');
                return;
            }
            const target = `/trunks/outbound-edit.html?id=${encodeURIComponent(id)}`;
            window.location.href = window.APP_CONFIG && typeof window.APP_CONFIG.frontendUrl === 'function'
                ? window.APP_CONFIG.frontendUrl(target)
                : target;
        });
    });

    // ID copy buttons
    document.querySelectorAll('.outbound-id-copy').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (id) {
                copyToClipboard(id);
                showToast('Outbound trunk ID copied', 2000, 'success');
            }
        });
    });

    // Delete buttons
    document.querySelectorAll('.outbound-delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (!id) return;

            const confirmed = window.confirm('Are you sure you want to delete this outbound trunk?');
            if (!confirmed) return;

            try {
                const result = await campaignAPI.deleteOutboundTrunk(id);
                if (result && result.success) {
                    showToast(result.message || 'Outbound trunk deleted', 3000, 'success');
                    await loadOutboundTrunks();
                } else {
                    throw new Error(result && result.message ? result.message : 'Delete failed');
                }
            } catch (error) {
                console.error('Error deleting outbound trunk:', error);
                showToast(error.message || 'Failed to delete outbound trunk', 4000, 'error');
            }
        });
    });
}

function createOutboundTrunkCard(trunk, index) {
    const id = trunk.trunk_id || trunk.sip_trunk_id || trunk.id || '';
    const name = trunk.name || 'Unnamed Outbound Trunk';
    const address = trunk.address || '-';
    const transport = trunk.transport || '-';
    const numbers = Array.isArray(trunk.numbers) ? trunk.numbers : (trunk.numbers ? [trunk.numbers] : []);
    const allowed = Array.isArray(trunk.allowed_numbers) ? trunk.allowed_numbers : (trunk.allowed_numbers ? [trunk.allowed_numbers] : []);
    const username = trunk.auth_username || '';

    const numbersText = numbers.length ? numbers.join(', ') : 'None';
    const allowedText = allowed.length ? allowed.join(', ') : 'None';

    return `
        <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 font-sans">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 group">
                    <span class="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded border-gray-100 truncate">ID: ${escapeHtml(id)}</span>
                    <button class="outbound-id-copy opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600" data-id="${escapeHtml(id)}" title="Copy ID">
                        <i data-feather="copy" class="w-3 h-3"></i>
                    </button>
                </div>
                <div class="flex items-center gap-2">
                    <button class="outbound-delete-btn p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600" data-id="${escapeHtml(id)}" title="Delete trunk">
                        <i data-feather="trash-2" class="w-4 h-4"></i>
                    </button>
                </div>
            </div>

            <h3 class="text-2xl font-bold text-gray-900 leading-tight tracking-tight">${escapeHtml(name)}</h3>

            <div class="space-y-3 mt-2">
                <div class="flex justify-between items-baseline border-b border-gray-50 pb-2">
                    <span class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Address</span>
                    <span class="text-sm font-medium text-gray-700 text-right ml-4">${escapeHtml(address)}</span>
                </div>
                <div class="flex justify-between items-baseline border-b border-gray-50 pb-2">
                    <span class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Transport</span>
                    <span class="text-sm font-medium text-gray-700 text-right ml-4">${escapeHtml(transport)}</span>
                </div>
                <div class="flex justify-between items-baseline border-b border-gray-50 pb-2">
                    <span class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Numbers</span>
                    <span class="text-sm font-medium text-gray-700 text-right ml-4">${escapeHtml(numbersText)}</span>
                </div>
                <div class="flex justify-between items-baseline border-b border-gray-50 pb-2">
                    <span class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Allowed Numbers</span>
                    <span class="text-sm font-medium text-gray-700 text-right ml-4">${escapeHtml(allowedText)}</span>
                </div>
                ${username ? `
                <div class="flex justify-between items-baseline border-b border-gray-50 pb-2">
                    <span class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Auth Username</span>
                    <span class="text-sm font-medium text-gray-700 text-right ml-4">${escapeHtml(username)}</span>
                </div>
                ` : ''}
            </div>

            <div class="mt-auto pt-4 flex justify-end">
                <button class="outbound-edit-btn inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all font-semibold text-sm border border-blue-100" data-id="${escapeHtml(id)}" data-index="${index}">
                    <i data-feather="edit-2" class="w-4 h-4"></i>
                    <span>Edit Trunk</span>
                </button>
            </div>
        </div>
    `;
}

function setOutboundLoading(isLoading) {
    const loading = document.getElementById('outbound-loading');
    const grid = document.getElementById('outbound-grid');
    const emptyState = document.getElementById('outbound-empty-state');
    const errorState = document.getElementById('outbound-error-state');
    if (!loading || !grid || !emptyState || !errorState) return;

    loading.classList.toggle('hidden', !isLoading);
    if (isLoading) {
        grid.classList.add('hidden');
        emptyState.classList.add('hidden');
        errorState.classList.add('hidden');
    }
}

function showOutboundError(message) {
    const errorState = document.getElementById('outbound-error-state');
    const messageEl = document.getElementById('outbound-error-message');
    const grid = document.getElementById('outbound-grid');
    const emptyState = document.getElementById('outbound-empty-state');
    if (!errorState || !messageEl || !grid || !emptyState) return;

    messageEl.textContent = message;
    errorState.classList.remove('hidden');
    grid.classList.add('hidden');
    emptyState.classList.add('hidden');
}

function openOutboundEditPanel(trunk) {
    const id = trunk && (trunk.trunk_id || trunk.sip_trunk_id || trunk.id);
    if (id) {
        const target = `/trunks/outbound-edit.html?id=${encodeURIComponent(id)}`;
        window.location.href = window.APP_CONFIG && typeof window.APP_CONFIG.frontendUrl === 'function'
            ? window.APP_CONFIG.frontendUrl(target)
            : target;
        return;
    }

    showToast('Unable to determine trunk ID for editing', 4000, 'error');
}

function openOutboundCreatePanel() {
    outboundEditMode = 'create';
    selectedOutboundTrunk = null;

    const panel = document.getElementById('outbound-edit-panel');
    const nameInput = document.getElementById('outbound-edit-name');
    const addressInput = document.getElementById('outbound-edit-address');
    const transportSelect = document.getElementById('outbound-edit-transport');
    const authUserInput = document.getElementById('outbound-edit-auth-username');
    const authPassInput = document.getElementById('outbound-edit-auth-password');
    const metadataInput = document.getElementById('outbound-edit-metadata');
    const numbersInput = document.getElementById('outbound-edit-numbers-to-add');
    const numbersList = document.getElementById('outbound-numbers-list');

    if (!panel || !nameInput || !addressInput || !transportSelect || !numbersInput || !numbersList) return;

    nameInput.value = '';
    addressInput.value = '';
    transportSelect.value = '';
    if (authUserInput) authUserInput.value = '';
    if (authPassInput) authPassInput.value = '';
    if (metadataInput) metadataInput.value = '';
    numbersInput.value = '';
    numbersList.innerHTML = '';

    panel.classList.remove('hidden');
}

function hideOutboundEditPanel() {
    const panel = document.getElementById('outbound-edit-panel');
    if (panel) {
        panel.classList.add('hidden');
    }
    selectedOutboundTrunk = null;
}

// Normalize helper (trim + dedupe)
function normalizeList(arr) {
    const seen = new Set();
    const result = [];
    for (const v of arr || []) {
        const val = String(v).trim();
        if (!val || seen.has(val)) continue;
        seen.add(val);
        result.push(val);
    }
    return result;
}

async function handleOutboundGeneralSubmit(event) {
    event.preventDefault();
    const mode = outboundEditMode || 'edit';

    if (mode === 'edit') {
        const trunkId = selectedOutboundTrunk && (selectedOutboundTrunk.trunk_id || selectedOutboundTrunk.sip_trunk_id || selectedOutboundTrunk.id);
        if (trunkId) {
            const target = `/trunks/outbound-edit.html?id=${encodeURIComponent(trunkId)}`;
            window.location.href = window.APP_CONFIG && typeof window.APP_CONFIG.frontendUrl === 'function'
                ? window.APP_CONFIG.frontendUrl(target)
                : target;
            return;
        }
        showToast('Unable to determine trunk ID for editing', 4000, 'error');
        return;
    }

    const nameInput = document.getElementById('outbound-edit-name');
    const addressInput = document.getElementById('outbound-edit-address');
    const transportSelect = document.getElementById('outbound-edit-transport');
    const authUserInput = document.getElementById('outbound-edit-auth-username');
    const authPassInput = document.getElementById('outbound-edit-auth-password');
    const metadataInput = document.getElementById('outbound-edit-metadata');

    const name = nameInput.value || null;
    const address = addressInput.value || null;
    const transport = transportSelect.value || null;
    const auth_username = authUserInput && authUserInput.value ? authUserInput.value : null;
    const auth_password = authPassInput && authPassInput.value ? authPassInput.value : null;
    const metadata = metadataInput && metadataInput.value ? metadataInput.value : null;

    try {
        if (mode === 'create') {
            if (!name) {
                throw new Error('Name is required to create an outbound trunk');
            }
            if (!address) {
                throw new Error('SIP address is required to create an outbound trunk');
            }
            if (!transport) {
                throw new Error('Transport is required to create an outbound trunk');
            }
            showToast('Now add at least one number, then use the Numbers section to create the trunk.', 4000, 'info');
            return;
        }

        showToast('Use the outbound edit page to edit trunks', 3500, 'info');
    } catch (error) {
        console.error('Error updating general outbound trunk settings:', error);
        showToast(error.message || 'Failed to update settings', 4000, 'error');
    }
}

async function handleOutboundNumbersSubmit(event) {
    event.preventDefault();
    const numbersInput = document.getElementById('outbound-edit-numbers-to-add');
    const mode = outboundEditMode || 'edit';

    if (mode === 'edit') {
        const trunkId = selectedOutboundTrunk && (selectedOutboundTrunk.trunk_id || selectedOutboundTrunk.sip_trunk_id || selectedOutboundTrunk.id);
        if (trunkId) {
            const target = `/trunks/outbound-edit.html?id=${encodeURIComponent(trunkId)}`;
            window.location.href = window.APP_CONFIG && typeof window.APP_CONFIG.frontendUrl === 'function'
                ? window.APP_CONFIG.frontendUrl(target)
                : target;
            return;
        }
        showToast('Unable to determine trunk ID for editing', 4000, 'error');
        return;
    }

    const raw = (numbersInput.value || '')
        .split(',')
        .map(n => n.trim())
        .filter(Boolean);
    const numbers = normalizeList(raw);

    try {
        if (!numbers.length) {
            throw new Error('Enter at least one number');
        }

        if (mode === 'create') {
            const nameInput = document.getElementById('outbound-edit-name');
            const addressInput = document.getElementById('outbound-edit-address');
            const transportSelect = document.getElementById('outbound-edit-transport');
            const authUserInput = document.getElementById('outbound-edit-auth-username');
            const authPassInput = document.getElementById('outbound-edit-auth-password');

            const name = nameInput.value || null;
            const address = addressInput.value || null;
            const transport = transportSelect.value || null;
            const auth_username = authUserInput && authUserInput.value ? authUserInput.value : null;
            const auth_password = authPassInput && authPassInput.value ? authPassInput.value : null;

            if (!name) {
                throw new Error('Name is required to create an outbound trunk');
            }
            if (!address) {
                throw new Error('SIP address is required to create an outbound trunk');
            }
            if (!transport) {
                throw new Error('Transport is required to create an outbound trunk');
            }

            const createPayload = {
                name,
                address,
                numbers,
                transport,
                auth_username,
                auth_password,
            };

            const result = await campaignAPI.createOutboundTrunk(createPayload);
            if (result && result.success) {
                showToast(result.message || 'Outbound trunk created successfully', 3000, 'success');
                hideOutboundEditPanel();
                outboundEditMode = 'edit';
                await loadOutboundTrunks();
            } else {
                throw new Error(result && result.message ? result.message : 'Create failed');
            }
            return;
        }

        showToast('Use the outbound edit page to edit trunks', 3500, 'info');
    } catch (error) {
        console.error('Error updating outbound numbers:', error);
        showToast(error.message || 'Failed to update numbers', 4000, 'error');
    }
}

// Simple HTML escape helper (mirrors campaigns page)
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
