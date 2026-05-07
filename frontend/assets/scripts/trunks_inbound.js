/**
 * Inbound Trunks Page Logic (card-style like campaigns/agents)
 */

let inboundTrunksAll = [];
let inboundTrunksFiltered = [];
let selectedInboundTrunk = null;
let inboundEditMode = 'edit'; // 'edit' or 'create'

window.addEventListener('layout:ready', async () => {
    try {
        initializeIcons();
        setupInboundEventListeners();
        await loadInboundTrunks();
    } catch (error) {
        console.error('Error initializing inbound trunks page:', error);
    }
});

function setupInboundEventListeners() {
    const inboundRetryBtn = document.getElementById('inbound-retry-btn');
    const generalForm = document.getElementById('inbound-general-form');
    const numbersForm = document.getElementById('inbound-numbers-form');
    const allowedForm = document.getElementById('inbound-allowed-form');
    const allowedAddressesForm = document.getElementById('inbound-allowed-addresses-form');
    const cancelBtn = document.getElementById('inbound-edit-cancel');
    const searchInput = document.getElementById('search-input');
    const krispToggle = document.getElementById('edit-krisp-toggle');
    const createBtn = document.getElementById('inbound-create-btn');

    if (inboundRetryBtn) {
        inboundRetryBtn.addEventListener('click', loadInboundTrunks);
    }
    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            hideInboundEditPanel();
        });
    }
    if (generalForm) {
        generalForm.addEventListener('submit', handleInboundGeneralSubmit);
    }
    if (numbersForm) {
        numbersForm.addEventListener('submit', handleInboundNumbersSubmit);
    }
    if (allowedForm) {
        allowedForm.addEventListener('submit', handleInboundAllowedSubmit);
    }
    if (allowedAddressesForm) {
        allowedAddressesForm.addEventListener('submit', handleInboundAllowedAddressesSubmit);
    }
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleInboundSearch, 300));
    }
    if (krispToggle) {
        krispToggle.addEventListener('click', () => toggleKrispEnabled(krispToggle));
    }
    if (createBtn) {
        createBtn.addEventListener('click', () => openInboundCreatePanel());
    }
}

async function loadInboundTrunks() {
    setInboundLoading(true);
    hideInboundEditPanel();

    try {
        const result = await campaignAPI.getInboundTrunks();
        if (!result || !result.success || !result.data) {
            throw new Error('Invalid inbound trunks response');
        }

        const trunks = extractTrunkList(result.data || {});
        inboundTrunksAll = trunks;
        inboundTrunksFiltered = [...inboundTrunksAll];
        renderInboundTrunks();
        setInboundLoading(false);
    } catch (error) {
        console.error('Error loading inbound trunks:', error);
        setInboundLoading(false);
        showInboundError(error.message || 'Failed to load inbound trunks');
        showToast('Error loading inbound trunks', 3000, 'error');
    }
}

function extractTrunkList(raw) {
    if (!raw || typeof raw !== 'object') return [];
    if (Array.isArray(raw.trunks)) return raw.trunks;
    if (Array.isArray(raw.items)) return raw.items;
    return [];
}

function handleInboundSearch(event) {
    const query = event.target.value.toLowerCase().trim();

    if (!query) {
        inboundTrunksFiltered = [...inboundTrunksAll];
    } else {
        inboundTrunksFiltered = inboundTrunksAll.filter(trunk => {
            const id = (trunk.trunk_id || trunk.sip_trunk_id || trunk.id || '').toLowerCase();
            const name = (trunk.name || '').toLowerCase();
            return id.includes(query) || name.includes(query);
        });
    }

    renderInboundTrunks();
}

function renderInboundTrunks() {
    const grid = document.getElementById('inbound-grid');
    const emptyState = document.getElementById('inbound-empty-state');
    const errorState = document.getElementById('inbound-error-state');

    if (!grid || !emptyState || !errorState) return;

    // Hide error while rendering
    errorState.classList.add('hidden');

    if (!inboundTrunksFiltered.length) {
        if (!inboundTrunksAll.length) {
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
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">No inbound trunks found</h3>
                    <p class="text-gray-600">Try adjusting your search criteria</p>
                </div>
            `;
            grid.classList.remove('hidden');
            initializeIcons();
        }
        return;
    }

    emptyState.classList.add('hidden');
    grid.innerHTML = inboundTrunksFiltered.map((trunk, index) => createInboundTrunkCard(trunk, index)).join('');
    grid.classList.remove('hidden');
    initializeIcons();

    // Edit buttons
    document.querySelectorAll('.inbound-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const indexAttr = btn.getAttribute('data-index');
            const index = indexAttr ? parseInt(indexAttr, 10) : -1;
            const trunk = index >= 0 && index < inboundTrunksFiltered.length ? inboundTrunksFiltered[index] : null;
            if (trunk) {
                const trunkId = trunk.trunk_id || trunk.sip_trunk_id || trunk.id;
                if (!trunkId) {
                    showToast('Unable to open edit page: missing trunk ID', 3000, 'error');
                    return;
                }
                const target = `/trunks/inbound-edit.html?id=${encodeURIComponent(trunkId)}`;
                window.location.href = window.APP_CONFIG && typeof window.APP_CONFIG.frontendUrl === 'function'
                    ? window.APP_CONFIG.frontendUrl(target)
                    : target;
            } else {
                console.warn('Clicked inbound trunk not found for edit');
            }
        });
    });

    // ID copy buttons
    document.querySelectorAll('.inbound-id-copy').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (id) {
                copyToClipboard(id);
                showToast('Inbound trunk ID copied', 2000, 'success');
            }
        });
    });

    // Delete buttons
    document.querySelectorAll('.inbound-delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (!id) return;

            const confirmed = window.confirm('Are you sure you want to delete this inbound trunk?');
            if (!confirmed) return;

            try {
                const result = await campaignAPI.deleteInboundTrunk(id);
                if (result && result.success) {
                    showToast(result.message || 'Inbound trunk deleted', 3000, 'success');
                    await loadInboundTrunks();
                } else {
                    throw new Error(result && result.message ? result.message : 'Delete failed');
                }
            } catch (error) {
                console.error('Error deleting inbound trunk:', error);
                showToast(error.message || 'Failed to delete inbound trunk', 4000, 'error');
            }
        });
    });
}

function createInboundTrunkCard(trunk, index) {
    const id = trunk.trunk_id || trunk.sip_trunk_id || trunk.id || '';
    const name = trunk.name || 'Unnamed Inbound Trunk';
    const numbers = Array.isArray(trunk.numbers) ? trunk.numbers : (trunk.numbers ? [trunk.numbers] : []);
    const allowed = Array.isArray(trunk.allowed_numbers) ? trunk.allowed_numbers : (trunk.allowed_numbers ? [trunk.allowed_numbers] : []);
    const krispEnabled = typeof trunk.krisp_enabled === 'boolean' ? trunk.krisp_enabled : null;

    const numbersText = numbers.length ? numbers.join(', ') : 'None';
    const allowedText = allowed.length ? allowed.join(', ') : 'All (*)';

    return `
        <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 font-sans">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 group">
                    <span class="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 truncate">ID: ${escapeHtml(id)}</span>
                    <button class="inbound-id-copy opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600" data-id="${escapeHtml(id)}" title="Copy ID">
                        <i data-feather="copy" class="w-3 h-3"></i>
                    </button>
                </div>
                <button class="inbound-delete-btn p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600" data-id="${escapeHtml(id)}" title="Delete trunk">
                    <i data-feather="trash-2" class="w-4 h-4"></i>
                </button>
            </div>

            <h3 class="text-2xl font-bold text-gray-900 leading-tight tracking-tight">${escapeHtml(name)}</h3>

            <div class="space-y-3 mt-2">
                <div class="flex justify-between items-baseline border-b border-gray-50 pb-2">
                    <span class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Numbers</span>
                    <span class="text-sm font-medium text-gray-700 text-right ml-4">${escapeHtml(numbersText)}</span>
                </div>
                <div class="flex justify-between items-baseline border-b border-gray-50 pb-2">
                    <span class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Allowed Numbers</span>
                    <span class="text-sm font-medium text-gray-700 text-right ml-4">${escapeHtml(allowedText)}</span>
                </div>
                ${krispEnabled === null ? '' : `
                <div class="flex justify-between items-baseline border-b border-gray-50 pb-2">
                    <span class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Noise Reduction</span>
                    <span class="text-sm font-medium text-gray-700">${krispEnabled ? 'Enabled' : 'Disabled'}</span>
                </div>
                `}
            </div>

            <div class="mt-auto pt-4 flex justify-end">
                <button class="inbound-edit-btn inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all font-semibold text-sm border border-blue-100" data-id="${escapeHtml(id)}" data-index="${index}">
                    <i data-feather="edit-2" class="w-4 h-4"></i>
                    <span>Edit Trunk</span>
                </button>
            </div>
        </div>
    `;
}

function openInboundEditPanel(trunk) {
    inboundEditMode = 'edit';
    selectedInboundTrunk = trunk;

    const panel = document.getElementById('inbound-edit-panel');
    const nameInput = document.getElementById('edit-trunk-name');
    const numbersInput = document.getElementById('edit-numbers-to-add');
    const allowedInput = document.getElementById('edit-allowed-numbers');
    const allowedAddressesInput = document.getElementById('edit-allowed-addresses');
    const krispToggle = document.getElementById('edit-krisp-toggle');
    const authUserInput = document.getElementById('edit-auth-username');
    const authPassInput = document.getElementById('edit-auth-password');
    const metadataInput = document.getElementById('edit-metadata');
    const numbersList = document.getElementById('inbound-numbers-list');
    const allowedList = document.getElementById('inbound-allowed-numbers-list');
    const allowedAddressesList = document.getElementById('inbound-allowed-addresses-list');

    if (!panel || !nameInput || !numbersInput || !allowedInput || !krispToggle || !numbersList || !allowedList || !allowedAddressesList) return;

    const numbers = Array.isArray(trunk.numbers) ? trunk.numbers : (trunk.numbers ? [trunk.numbers] : []);
    const allowed = Array.isArray(trunk.allowed_numbers) ? trunk.allowed_numbers : [];
    const allowedAddresses = Array.isArray(trunk.allowed_addresses) ? trunk.allowed_addresses : [];
    const krispEnabled = typeof trunk.krisp_enabled === 'boolean' ? trunk.krisp_enabled : false;

    nameInput.value = trunk.name || '';
    numbersInput.value = '';
    allowedInput.value = allowed.length ? allowed.join(', ') : '*';
    if (allowedAddressesInput) {
        allowedAddressesInput.value = allowedAddresses.length ? allowedAddresses.join(', ') : '*';
    }

    if (authUserInput) authUserInput.value = trunk.auth_username || '';
    if (authPassInput) authPassInput.value = trunk.auth_password || '';
    if (metadataInput) metadataInput.value = trunk.metadata || '';

    // Render current numbers as removable chips
    numbersList.innerHTML = numbers.map(num => `
        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-800">
            <span>${escapeHtml(num)}</span>
            <button type="button" class="text-gray-400 hover:text-red-600 inbound-number-remove" data-number="${escapeHtml(num)}" title="Remove number">
                <i data-feather="x" class="w-3 h-3"></i>
            </button>
        </span>
    `).join('');

    // Render current allowed numbers as chips with remove buttons
    allowedList.innerHTML = allowed.length ? allowed.map(num => `
        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-800">
            <span>${escapeHtml(num)}</span>
            <button type="button" class="text-gray-400 hover:text-red-600 inbound-allowed-remove" data-number="${escapeHtml(num)}" title="Remove allowed number">
                <i data-feather="x" class="w-3 h-3"></i>
            </button>
        </span>
    `).join('') : '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-800">* (All)</span>';

    // Render current allowed addresses as chips with remove buttons
    allowedAddressesList.innerHTML = allowedAddresses.length ? allowedAddresses.map(addr => `
        <span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-50 text-purple-800">
            <span>${escapeHtml(addr)}</span>
            <button type="button" class="text-gray-400 hover:text-red-600 inbound-allowed-address-remove" data-address="${escapeHtml(addr)}" title="Remove allowed address">
                <i data-feather="x" class="w-3 h-3"></i>
            </button>
        </span>
    `).join('') : '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-50 text-purple-800">* (All)</span>';

    // Remember original allowed numbers so we can compute add/remove diffs on save
    selectedInboundTrunk._originalAllowed = allowed.slice();

    // Set Krisp toggle visual state based on current value
    setKrispToggleState(krispToggle, krispEnabled);

    // Ensure feather icons are rendered for newly added buttons
    if (typeof initializeIcons === 'function') {
        initializeIcons();
    }

    panel.classList.remove('hidden');

    // Wire up remove handlers for numbers chips
    document.querySelectorAll('.inbound-number-remove').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const num = btn.getAttribute('data-number');
            const trunkId = selectedInboundTrunk && (selectedInboundTrunk.trunk_id || selectedInboundTrunk.sip_trunk_id || selectedInboundTrunk.id);
            if (!trunkId || !num) return;

            try {
                await campaignAPI.updateInboundTrunkUnified({
                    trunk_id: trunkId,
                    remove_numbers: [num],
                });
                showToast('Number removed', 2500, 'success');
                await loadInboundTrunks();
            } catch (error) {
                console.error('Error removing number:', error);
                showToast(error.message || 'Failed to remove number', 3000, 'error');
            }
        });
    });

    // Wire up remove handlers for allowed numbers chips
    document.querySelectorAll('.inbound-allowed-remove').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const num = btn.getAttribute('data-number');
            const trunkId = selectedInboundTrunk && (selectedInboundTrunk.trunk_id || selectedInboundTrunk.sip_trunk_id || selectedInboundTrunk.id);
            if (!trunkId || !num) return;

            try {
                await campaignAPI.updateInboundTrunkUnified({
                    trunk_id: trunkId,
                    remove_allowed_numbers: [num],
                });
                showToast('Allowed number removed', 2500, 'success');
                await loadInboundTrunks();
            } catch (error) {
                console.error('Error removing allowed number:', error);
                showToast(error.message || 'Failed to remove allowed number', 3000, 'error');
            }
        });
    });

    // Wire up remove handlers for allowed addresses chips
    document.querySelectorAll('.inbound-allowed-address-remove').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const addr = btn.getAttribute('data-address');
            const trunkId = selectedInboundTrunk && (selectedInboundTrunk.trunk_id || selectedInboundTrunk.sip_trunk_id || selectedInboundTrunk.id);
            if (!trunkId || !addr) return;

            try {
                await campaignAPI.updateInboundTrunkUnified({
                    trunk_id: trunkId,
                    remove_allowed_addresses: [addr],
                });
                showToast('Allowed address removed', 2500, 'success');
                await loadInboundTrunks();
            } catch (error) {
                console.error('Error removing allowed address:', error);
                showToast(error.message || 'Failed to remove allowed address', 3000, 'error');
            }
        });
    });
}

function openInboundCreatePanel() {
    inboundEditMode = 'create';
    selectedInboundTrunk = { allowed_numbers: [], _originalAllowed: [] };

    const panel = document.getElementById('inbound-edit-panel');
    const nameInput = document.getElementById('edit-trunk-name');
    const numbersInput = document.getElementById('edit-numbers-to-add');
    const allowedInput = document.getElementById('edit-allowed-numbers');
    const krispToggle = document.getElementById('edit-krisp-toggle');
    const authUserInput = document.getElementById('edit-auth-username');
    const authPassInput = document.getElementById('edit-auth-password');
    const metadataInput = document.getElementById('edit-metadata');
    const numbersList = document.getElementById('inbound-numbers-list');
    const allowedList = document.getElementById('inbound-allowed-numbers-list');
    const allowedAddressesList = document.getElementById('inbound-allowed-addresses-list');

    if (!panel || !nameInput || !numbersInput || !allowedInput || !krispToggle || !numbersList || !allowedList || !allowedAddressesList) return;
    nameInput.value = '';
    numbersInput.value = '';
    allowedInput.value = '*';
    if (authUserInput) authUserInput.value = '';
    if (authPassInput) authPassInput.value = '';
    if (metadataInput) metadataInput.value = '';
    numbersList.innerHTML = '';
    allowedList.innerHTML = '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-blue-50 text-blue-800">* (All)</span>';
    allowedAddressesList.innerHTML = '<span class="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-purple-50 text-purple-800">* (All)</span>';

    // Default Krisp to enabled for new trunks
    setKrispToggleState(krispToggle, true);

    panel.classList.remove('hidden');
}

function hideInboundEditPanel() {
    const panel = document.getElementById('inbound-edit-panel');
    if (panel) {
        panel.classList.add('hidden');
    }
    selectedInboundTrunk = null;
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

async function handleInboundGeneralSubmit(event) {
    event.preventDefault();
    const mode = inboundEditMode || 'edit';

    const nameInput = document.getElementById('edit-trunk-name');
    const authUserInput = document.getElementById('edit-auth-username');
    const authPassInput = document.getElementById('edit-auth-password');
    const metadataInput = document.getElementById('edit-metadata');

    const name = nameInput.value || null;
    const auth_username = authUserInput && authUserInput.value ? authUserInput.value : null;
    const auth_password = authPassInput && authPassInput.value ? authPassInput.value : null;
    const metadata = metadataInput && metadataInput.value ? metadataInput.value : null;

    try {
        if (mode === 'create') {
            // For creation, we only use name + numbers via the numbers form.
            // Here we just validate name so the user gets feedback early.
            if (!name) {
                throw new Error('Name is required to create an inbound trunk');
            }
            showToast('Now add at least one number, then use the Numbers section to create the trunk.', 4000, 'info');
            return;
        }

        if (!selectedInboundTrunk) {
            throw new Error('No inbound trunk selected');
        }
        const trunkId = selectedInboundTrunk.trunk_id || selectedInboundTrunk.sip_trunk_id || selectedInboundTrunk.id;
        if (!trunkId) {
            throw new Error('Unable to determine trunk ID for update');
        }

        const payload = { trunk_id: trunkId };
        if (name !== null) payload.name = name;
        if (auth_username !== null) payload.auth_username = auth_username;
        if (auth_password !== null) payload.auth_password = auth_password;
        if (metadata !== null) payload.metadata = metadata;

        const result = await campaignAPI.updateInboundTrunk(payload);
        if (result && result.success) {
            showToast(result.message || 'General settings updated', 3000, 'success');
            await loadInboundTrunks();
        } else {
            throw new Error(result && result.message ? result.message : 'Update failed');
        }
    } catch (error) {
        console.error('Error updating general inbound trunk settings:', error);
        showToast(error.message || 'Failed to update settings', 4000, 'error');
    }
}

async function handleInboundNumbersSubmit(event) {
    event.preventDefault();
    const numbersInput = document.getElementById('edit-numbers-to-add');
    const mode = inboundEditMode || 'edit';

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
            const nameInput = document.getElementById('edit-trunk-name');
            const krispToggle = document.getElementById('edit-krisp-toggle');
            const name = nameInput.value || null;
            const krispEnabled = krispToggle ? krispToggle.getAttribute('aria-pressed') === 'true' : true;

            if (!name) {
                throw new Error('Name is required to create an inbound trunk');
            }

            const createPayload = {
                name,
                numbers,
                krisp_enabled: krispEnabled,
            };

            const result = await campaignAPI.createInboundTrunk(createPayload);
            if (result && result.success) {
                showToast(result.message || 'Inbound trunk created successfully', 3000, 'success');
                hideInboundEditPanel();
                inboundEditMode = 'edit';
                await loadInboundTrunks();
            } else {
                throw new Error(result && result.message ? result.message : 'Create failed');
            }
            return;
        }

        if (!selectedInboundTrunk) {
            throw new Error('No inbound trunk selected');
        }
        const trunkId = selectedInboundTrunk.trunk_id || selectedInboundTrunk.sip_trunk_id || selectedInboundTrunk.id;
        if (!trunkId) {
            throw new Error('Unable to determine trunk ID for update');
        }

        await campaignAPI.updateInboundTrunkUnified({
            trunk_id: trunkId,
            add_numbers: numbers,
        });
        numbersInput.value = '';
        showToast('Numbers added', 2500, 'success');
        await loadInboundTrunks();
    } catch (error) {
        console.error('Error updating inbound numbers:', error);
        showToast(error.message || 'Failed to update numbers', 4000, 'error');
    }
}

async function handleInboundAllowedSubmit(event) {
    event.preventDefault();
    if (!selectedInboundTrunk && inboundEditMode !== 'create') return;

    const allowedInput = document.getElementById('edit-allowed-numbers');
    const raw = (allowedInput.value || '')
        .split(',')
        .map(n => n.trim())
        .filter(Boolean);
    const allowedNumbers = normalizeList(raw);

    // If user enters "*", treat as all (empty list)
    const finalNumbers = (allowedNumbers.length === 1 && allowedNumbers[0] === '*') ? [] : allowedNumbers;

    try {
        if (inboundEditMode === 'create') {
            // For now, allowed numbers are not part of the create payload; user can set them after creation.
            showToast('Create the trunk first, then configure allowed numbers.', 4000, 'info');
            return;
        }

        if (!selectedInboundTrunk) {
            throw new Error('No inbound trunk selected');
        }
        const trunkId = selectedInboundTrunk.trunk_id || selectedInboundTrunk.sip_trunk_id || selectedInboundTrunk.id;
        if (!trunkId) {
            throw new Error('Unable to determine trunk ID for update');
        }

        const currentAllowed = normalizeList(selectedInboundTrunk.allowed_numbers || []);
        const nextAllowed = normalizeList(finalNumbers);
        const addAllowed = nextAllowed.filter(value => !currentAllowed.includes(value));
        const removeAllowed = currentAllowed.filter(value => !nextAllowed.includes(value));

        if (!addAllowed.length && !removeAllowed.length) {
            showToast('No changes to allowed numbers', 2500, 'info');
            return;
        }

        await campaignAPI.updateInboundTrunkUnified({
            trunk_id: trunkId,
            add_allowed_numbers: addAllowed,
            remove_allowed_numbers: removeAllowed,
        });
        showToast('Allowed numbers updated', 2500, 'success');
        await loadInboundTrunks();
    } catch (error) {
        console.error('Error updating allowed numbers:', error);
        showToast(error.message || 'Failed to update allowed numbers', 4000, 'error');
    }
}

async function handleInboundAllowedAddressesSubmit(event) {
    event.preventDefault();
    if (!selectedInboundTrunk && inboundEditMode !== 'create') return;

    const allowedInput = document.getElementById('edit-allowed-addresses');
    const raw = (allowedInput.value || '')
        .split(',')
        .map(n => n.trim())
        .filter(Boolean);
    const allowedAddresses = normalizeList(raw);

    // If user enters "*", treat as all (empty list)
    const finalAddresses = (allowedAddresses.length === 1 && allowedAddresses[0] === '*') ? [] : allowedAddresses;

    try {
        if (inboundEditMode === 'create') {
            // For now, allowed addresses are not part of the create payload; user can set them after creation.
            showToast('Create the trunk first, then configure allowed addresses.', 4000, 'info');
            return;
        }

        if (!selectedInboundTrunk) {
            throw new Error('No inbound trunk selected');
        }
        const trunkId = selectedInboundTrunk.trunk_id || selectedInboundTrunk.sip_trunk_id || selectedInboundTrunk.id;
        if (!trunkId) {
            throw new Error('Unable to determine trunk ID for update');
        }

        const currentAddresses = normalizeList(selectedInboundTrunk.allowed_addresses || []);
        const nextAddresses = normalizeList(finalAddresses);
        const addAddresses = nextAddresses.filter(value => !currentAddresses.includes(value));
        const removeAddresses = currentAddresses.filter(value => !nextAddresses.includes(value));

        if (!addAddresses.length && !removeAddresses.length) {
            showToast('No changes to allowed addresses', 2500, 'info');
            return;
        }

        await campaignAPI.updateInboundTrunkUnified({
            trunk_id: trunkId,
            add_allowed_addresses: addAddresses,
            remove_allowed_addresses: removeAddresses,
        });
        showToast('Allowed addresses updated', 2500, 'success');
        await loadInboundTrunks();
    } catch (error) {
        console.error('Error updating allowed addresses:', error);
        showToast(error.message || 'Failed to update allowed addresses', 4000, 'error');
    }
}

function setKrispToggleState(toggleEl, enabled) {
    if (!toggleEl) return;
    const knob = toggleEl.querySelector('span.inline-block');
    const isOn = !!enabled;
    toggleEl.setAttribute('aria-pressed', isOn ? 'true' : 'false');
    toggleEl.classList.toggle('bg-blue-600', isOn);
    toggleEl.classList.toggle('bg-gray-200', !isOn);
    if (knob) {
        knob.classList.toggle('translate-x-5', isOn);
        knob.classList.toggle('translate-x-0', !isOn);
    }
}

function toggleKrispEnabled(toggleEl) {
    if (!toggleEl) return;
    const current = toggleEl.getAttribute('aria-pressed') === 'true';
    setKrispToggleState(toggleEl, !current);
}

function setInboundLoading(isLoading) {
    const loading = document.getElementById('inbound-loading');
    const grid = document.getElementById('inbound-grid');
    const emptyState = document.getElementById('inbound-empty-state');
    const errorState = document.getElementById('inbound-error-state');
    if (!loading || !grid || !emptyState || !errorState) return;

    loading.classList.toggle('hidden', !isLoading);
    if (isLoading) {
        grid.classList.add('hidden');
        emptyState.classList.add('hidden');
        errorState.classList.add('hidden');
    }
}

function showInboundError(message) {
    const errorState = document.getElementById('inbound-error-state');
    const messageEl = document.getElementById('inbound-error-message');
    const grid = document.getElementById('inbound-grid');
    const emptyState = document.getElementById('inbound-empty-state');
    if (!errorState || !messageEl || !grid || !emptyState) return;

    messageEl.textContent = message;
    errorState.classList.remove('hidden');
    grid.classList.add('hidden');
    emptyState.classList.add('hidden');
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
