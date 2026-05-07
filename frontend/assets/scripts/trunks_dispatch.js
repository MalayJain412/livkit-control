/**
 * Dispatch Rules Page Logic (card-style like campaigns/agents)
 */

let dispatchRulesAll = [];
let dispatchRulesFiltered = [];

window.addEventListener('layout:ready', async () => {
    try {
        initializeIcons();
        setupDispatchEventListeners();
        await loadDispatchRules();
    } catch (error) {
        console.error('Error initializing dispatch rules page:', error);
    }
});

function setupDispatchEventListeners() {
    const retryBtn = document.getElementById('dispatch-retry-btn');
    const searchInput = document.getElementById('search-input');
    const createBtn = document.getElementById('dispatch-create-btn');
    const createCancelBtn = document.getElementById('dispatch-create-cancel');
    const createForm = document.getElementById('dispatch-create-form');
    const trunkAddBtn = document.getElementById('dispatch-create-trunk-add-btn');
    const agentAddBtn = document.getElementById('dispatch-create-agent-add-btn');

    if (retryBtn) {
        retryBtn.addEventListener('click', loadDispatchRules);
    }
    if (searchInput) {
        searchInput.addEventListener('input', debounce(handleDispatchSearch, 300));
    }

    if (createBtn) {
        createBtn.addEventListener('click', async () => {
            const panel = document.getElementById('dispatch-create-panel');
            if (!panel) return;
            panel.classList.remove('hidden');

            const prefixEl = document.getElementById('dispatch-create-room-prefix');
            if (prefixEl && !prefixEl.value) {
                prefixEl.value = 'call-';
            }

            await loadInboundTrunksIntoCreateDropdown();
            const nameEl = document.getElementById('dispatch-create-name');
            if (nameEl) nameEl.focus();
            initializeIcons();
        });
    }

    if (createCancelBtn) {
        createCancelBtn.addEventListener('click', () => {
            const panel = document.getElementById('dispatch-create-panel');
            if (!panel) return;
            panel.classList.add('hidden');
        });
    }

    if (trunkAddBtn) {
        trunkAddBtn.addEventListener('click', () => {
            const select = document.getElementById('dispatch-create-trunk-select');
            const trunkId = select ? select.value : '';
            if (!trunkId) return;
            addCreateTrunkId(trunkId);
        });
    }

    if (agentAddBtn) {
        agentAddBtn.addEventListener('click', () => {
            const nameEl = document.getElementById('dispatch-create-agent-name');
            const metadataEl = document.getElementById('dispatch-create-agent-metadata');
            const agentName = (nameEl && nameEl.value ? nameEl.value : '').trim();
            const metadata = (metadataEl && metadataEl.value ? metadataEl.value : '').trim();
            if (!agentName) {
                showToast('Agent name is required', 2500, 'error');
                return;
            }

            addCreateAgent({ agent_name: agentName, metadata: metadata || undefined });
            if (nameEl) nameEl.value = '';
            if (metadataEl) metadataEl.value = '';
            if (nameEl) nameEl.focus();
        });
    }

    if (createForm) {
        createForm.addEventListener('submit', handleDispatchCreateSubmit);
    }
}

async function loadDispatchRules() {
    setDispatchLoading(true);

    try {
        const result = await campaignAPI.getDispatchRules();
        if (!result || !result.success || !result.data) {
            throw new Error('Invalid dispatch rules response');
        }

        const rules = extractDispatchList(result.data || {});
        dispatchRulesAll = rules;
        dispatchRulesFiltered = [...dispatchRulesAll];
        renderDispatchRules();
        setDispatchLoading(false);
    } catch (error) {
        console.error('Error loading dispatch rules:', error);
        setDispatchLoading(false);
        showDispatchError(error.message || 'Failed to load dispatch rules');
        showToast('Error loading dispatch rules', 3000, 'error');
    }
}

function extractDispatchList(raw) {
    if (!raw || typeof raw !== 'object') return [];
    if (Array.isArray(raw.items)) return raw.items;
    if (Array.isArray(raw.rules)) return raw.rules;
    if (Array.isArray(raw.sip_dispatch_rules)) return raw.sip_dispatch_rules;
    return [];
}

function handleDispatchSearch(event) {
    const query = event.target.value.toLowerCase().trim();

    if (!query) {
        dispatchRulesFiltered = [...dispatchRulesAll];
    } else {
        dispatchRulesFiltered = dispatchRulesAll.filter(rule => {
            const id = (rule.sip_dispatch_rule_id || rule.id || '').toLowerCase();
            const name = (rule.name || '').toLowerCase();
            return id.includes(query) || name.includes(query);
        });
    }

    renderDispatchRules();
}

function renderDispatchRules() {
    const grid = document.getElementById('dispatch-grid');
    const emptyState = document.getElementById('dispatch-empty-state');
    const errorState = document.getElementById('dispatch-error-state');

    if (!grid || !emptyState || !errorState) return;

    // Hide error while rendering
    errorState.classList.add('hidden');

    if (!dispatchRulesFiltered.length) {
        if (!dispatchRulesAll.length) {
            // Real empty state (no rules at all)
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
                    <h3 class="text-lg font-semibold text-gray-900 mb-2">No dispatch rules found</h3>
                    <p class="text-gray-600">Try adjusting your search criteria</p>
                </div>
            `;
            grid.classList.remove('hidden');
            initializeIcons();
        }
        return;
    }

    emptyState.classList.add('hidden');
    grid.innerHTML = dispatchRulesFiltered.map(createDispatchRuleCard).join('');
    grid.classList.remove('hidden');
    initializeIcons();

    // Edit buttons
    document.querySelectorAll('.dispatch-edit-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            const id = btn.getAttribute('data-id');
            if (!id) {
                showToast('Missing dispatch rule ID', 2500, 'error');
                return;
            }
            const target = `/trunks/dispatch-edit.html?id=${encodeURIComponent(id)}`;
            window.location.href = window.APP_CONFIG && typeof window.APP_CONFIG.frontendUrl === 'function'
                ? window.APP_CONFIG.frontendUrl(target)
                : target;
        });
    });

    // ID copy buttons
    document.querySelectorAll('.dispatch-id-copy').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (id) {
                copyToClipboard(id);
                showToast('Dispatch rule ID copied', 2000, 'success');
            }
        });
    });

    // Delete buttons
    document.querySelectorAll('.dispatch-delete-btn').forEach(btn => {
        btn.addEventListener('click', async (e) => {
            e.preventDefault();
            e.stopPropagation();
            const id = btn.getAttribute('data-id');
            if (!id) return;

            const confirmed = window.confirm('Are you sure you want to delete this dispatch rule?');
            if (!confirmed) return;

            try {
                const result = await campaignAPI.deleteDispatchRule(id);
                if (result && result.success) {
                    showToast(result.message || 'Dispatch rule deleted', 3000, 'success');
                    await loadDispatchRules();
                } else {
                    throw new Error(result && result.message ? result.message : 'Delete failed');
                }
            } catch (error) {
                console.error('Error deleting dispatch rule:', error);
                showToast(error.message || 'Failed to delete dispatch rule', 4000, 'error');
            }
        });
    });
}

function createDispatchRuleCard(rule) {
    const id = rule.sip_dispatch_rule_id || rule.id || '';
    const name = rule.name || 'Unnamed Rule';

    const trunkIds = Array.isArray(rule.trunk_ids) ? rule.trunk_ids : (rule.trunk_ids ? [rule.trunk_ids] : []);
    const trunkIdsText = trunkIds.length ? trunkIds.join(', ') : 'None';

    const roomPrefix = rule.rule && rule.rule.dispatch_rule_individual && rule.rule.dispatch_rule_individual.room_prefix
        ? rule.rule.dispatch_rule_individual.room_prefix
        : '';

    const roomName = rule.rule && rule.rule.dispatch_rule_direct && rule.rule.dispatch_rule_direct.room_name
        ? rule.rule.dispatch_rule_direct.room_name
        : '';

    const routingText = roomName ? `Direct: ${roomName}` : (roomPrefix ? `Prefix: ${roomPrefix}` : '-');

    const agents = (rule.room_config && Array.isArray(rule.room_config.agents))
        ? rule.room_config.agents.map(a => a.agent_name || a.name || '').filter(Boolean)
        : [];
    const agentsText = agents.length ? agents.join(', ') : 'None';

    return `
        <div class="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all flex flex-col gap-4 font-sans">
            <div class="flex items-center justify-between">
                <div class="flex items-center gap-2 group">
                    <span class="text-[10px] font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded border border-gray-100 truncate">ID: ${escapeHtml(id)}</span>
                    <button class="dispatch-id-copy opacity-0 group-hover:opacity-100 transition-opacity p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-blue-600" data-id="${escapeHtml(id)}" title="Copy ID">
                        <i data-feather="copy" class="w-3 h-3"></i>
                    </button>
                </div>
                <button class="dispatch-delete-btn p-1 rounded hover:bg-red-50 text-gray-400 hover:text-red-600" data-id="${escapeHtml(id)}" title="Delete rule">
                    <i data-feather="trash-2" class="w-4 h-4"></i>
                </button>
            </div>

            <h3 class="text-2xl font-bold text-gray-900 leading-tight tracking-tight">${escapeHtml(name)}</h3>

            <div class="space-y-3 mt-2">
                <div class="flex justify-between items-baseline border-b border-gray-50 pb-2">
                    <span class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Room Prefix</span>
                    <span class="text-sm font-medium text-gray-700 text-right ml-4">${escapeHtml(routingText)}</span>
                </div>
                <div class="flex justify-between items-baseline border-b border-gray-50 pb-2">
                    <span class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Trunk IDs</span>
                    <span class="text-sm font-medium text-gray-700 text-right ml-4">${escapeHtml(trunkIdsText)}</span>
                </div>
                <div class="flex justify-between items-baseline border-b border-gray-50 pb-2">
                    <span class="text-[11px] font-semibold text-gray-400 uppercase tracking-wider">Agents</span>
                    <span class="text-sm font-medium text-gray-700 text-right ml-4">${escapeHtml(agentsText)}</span>
                </div>
            </div>

            <div class="mt-auto pt-4 flex justify-end">
                <button class="dispatch-edit-btn inline-flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white rounded-lg transition-all font-semibold text-sm border border-blue-100" data-id="${escapeHtml(id)}">
                    <i data-feather="edit-2" class="w-4 h-4"></i>
                    <span>Edit Rule</span>
                </button>
            </div>
        </div>
    `;
}

async function loadInboundTrunksIntoCreateDropdown() {
    const select = document.getElementById('dispatch-create-trunk-select');
    if (!select) return;

    try {
        select.innerHTML = '<option value="">Loading inbound trunks...</option>';
        const result = await campaignAPI.getInboundTrunks();
        if (!result || !result.success || !result.data) {
            throw new Error('Invalid inbound trunks response');
        }

        const trunks = extractInboundTrunkList(result.data || {});
        const options = trunks
            .map(t => {
                const id = t.trunk_id || t.sip_trunk_id || t.id;
                if (!id) return null;
                const label = t.name ? `${t.name} (${id})` : id;
                return { id, label };
            })
            .filter(Boolean);

        if (!options.length) {
            select.innerHTML = '<option value="">No inbound trunks found</option>';
            return;
        }

        select.innerHTML = '<option value="">Select inbound trunk...</option>';
        options.forEach(opt => {
            const el = document.createElement('option');
            el.value = opt.id;
            el.textContent = opt.label;
            select.appendChild(el);
        });
    } catch (error) {
        console.error('Error loading inbound trunks for dropdown:', error);
        select.innerHTML = '<option value="">Failed to load inbound trunks</option>';
    }
}

function extractInboundTrunkList(raw) {
    if (!raw || typeof raw !== 'object') return [];
    if (Array.isArray(raw.trunks)) return raw.trunks;
    if (Array.isArray(raw.items)) return raw.items;
    if (Array.isArray(raw.sip_trunks)) return raw.sip_trunks;
    if (Array.isArray(raw.inbound_trunks)) return raw.inbound_trunks;
    return [];
}

function addCreateTrunkId(trunkId) {
    const container = document.getElementById('dispatch-create-trunk-ids');
    if (!container) return;

    const existing = getCreateTrunkIds();
    if (existing.includes(trunkId)) return;

    const chip = document.createElement('span');
    chip.className = 'inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200';
    chip.setAttribute('data-trunk-id', trunkId);
    chip.innerHTML = `${escapeHtml(trunkId)} <button type="button" class="ml-1 text-gray-500 hover:text-gray-700" aria-label="Remove">×</button>`;
    const removeBtn = chip.querySelector('button');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => chip.remove());
    }
    container.appendChild(chip);
}

function getCreateTrunkIds() {
    const container = document.getElementById('dispatch-create-trunk-ids');
    if (!container) return [];
    return Array.from(container.querySelectorAll('[data-trunk-id]'))
        .map(el => el.getAttribute('data-trunk-id'))
        .filter(Boolean);
}

function addCreateAgent(agent) {
    const container = document.getElementById('dispatch-create-agents');
    if (!container) return;

    const existing = getCreateAgents();
    if (existing.some(a => a.agent_name === agent.agent_name)) return;

    const chip = document.createElement('span');
    chip.className = 'inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200';
    chip.setAttribute('data-agent-name', agent.agent_name);
    chip.setAttribute('data-agent-metadata', agent.metadata || '');
    const metaSuffix = agent.metadata ? ` (${agent.metadata})` : '';
    chip.innerHTML = `${escapeHtml(agent.agent_name)}${escapeHtml(metaSuffix)} <button type="button" class="ml-1 text-gray-500 hover:text-gray-700" aria-label="Remove">×</button>`;
    const removeBtn = chip.querySelector('button');
    if (removeBtn) {
        removeBtn.addEventListener('click', () => chip.remove());
    }
    container.appendChild(chip);
}

function getCreateAgents() {
    const container = document.getElementById('dispatch-create-agents');
    if (!container) return [];
    return Array.from(container.querySelectorAll('[data-agent-name]'))
        .map(el => {
            const agent_name = el.getAttribute('data-agent-name');
            const metadata = el.getAttribute('data-agent-metadata') || '';
            const obj = { agent_name };
            if (metadata) obj.metadata = metadata;
            return obj;
        })
        .filter(a => !!a.agent_name);
}

async function handleDispatchCreateSubmit(e) {
    e.preventDefault();

    const nameEl = document.getElementById('dispatch-create-name');
    const prefixEl = document.getElementById('dispatch-create-room-prefix');
    const saveBtn = document.getElementById('dispatch-create-save');

    const name = (nameEl && nameEl.value ? nameEl.value : '').trim();
    const roomPrefix = (prefixEl && prefixEl.value ? prefixEl.value : '').trim();
    const trunkIds = getCreateTrunkIds();
    const agents = getCreateAgents();

    if (!name) {
        showToast('Name is required', 2500, 'error');
        return;
    }
    if (!roomPrefix) {
        showToast('Room prefix is required', 2500, 'error');
        return;
    }
    if (!trunkIds.length) {
        showToast('Select at least one inbound trunk', 2500, 'error');
        return;
    }
    if (!agents.length) {
        showToast('Add at least one agent', 2500, 'error');
        return;
    }

    try {
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.classList.add('opacity-60');
        }

        const result = await campaignAPI.createDispatchRule({
            name,
            trunk_ids: trunkIds,
            room_prefix: roomPrefix,
            agents,
        });

        if (result && result.success) {
            showToast(result.message || 'Dispatch rule created', 3000, 'success');
        } else {
            throw new Error(result && result.message ? result.message : 'Create failed');
        }

        const panel = document.getElementById('dispatch-create-panel');
        if (panel) panel.classList.add('hidden');
        const form = document.getElementById('dispatch-create-form');
        if (form) form.reset();
        const trunkContainer = document.getElementById('dispatch-create-trunk-ids');
        const agentContainer = document.getElementById('dispatch-create-agents');
        if (trunkContainer) trunkContainer.innerHTML = '';
        if (agentContainer) agentContainer.innerHTML = '';

        await loadDispatchRules();
    } catch (error) {
        console.error('Error creating dispatch rule:', error);
        showToast(error.message || 'Failed to create dispatch rule', 4000, 'error');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.classList.remove('opacity-60');
        }
    }
}

function setDispatchLoading(isLoading) {
    const loading = document.getElementById('dispatch-loading');
    const grid = document.getElementById('dispatch-grid');
    const emptyState = document.getElementById('dispatch-empty-state');
    const errorState = document.getElementById('dispatch-error-state');
    if (!loading || !grid || !emptyState || !errorState) return;

    loading.classList.toggle('hidden', !isLoading);
    if (isLoading) {
        grid.classList.add('hidden');
        emptyState.classList.add('hidden');
        errorState.classList.add('hidden');
    }
}

function showDispatchError(message) {
    const errorState = document.getElementById('dispatch-error-state');
    const messageEl = document.getElementById('dispatch-error-message');
    const grid = document.getElementById('dispatch-grid');
    const emptyState = document.getElementById('dispatch-empty-state');
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
