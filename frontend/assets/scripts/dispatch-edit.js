let dispatchRuleId = null;
let currentDispatchRule = null;

document.addEventListener('DOMContentLoaded', () => {
    feather.replace();

    const params = new URLSearchParams(window.location.search);
    dispatchRuleId = params.get('id');

    const backBtn = document.getElementById('back-btn');
    const cancelBtn = document.getElementById('cancel-btn');
    const form = document.getElementById('dispatch-edit-form');
    const trunkAddBtn = document.getElementById('trunk-add-btn');
    const agentAddBtn = document.getElementById('agent-add-btn');
    const ruleTypeEl = document.getElementById('dispatch-rule-type');

    if (backBtn) backBtn.addEventListener('click', () => {
        const target = '/trunks/dispatch.html';
        window.location.href = window.APP_CONFIG && typeof window.APP_CONFIG.frontendUrl === 'function'
            ? window.APP_CONFIG.frontendUrl(target)
            : target;
    });
    if (cancelBtn) cancelBtn.addEventListener('click', () => {
        const target = '/trunks/dispatch.html';
        window.location.href = window.APP_CONFIG && typeof window.APP_CONFIG.frontendUrl === 'function'
            ? window.APP_CONFIG.frontendUrl(target)
            : target;
    });
    if (form) form.addEventListener('submit', handleSave);
    if (trunkAddBtn) trunkAddBtn.addEventListener('click', handleAddTrunk);
    if (agentAddBtn) agentAddBtn.addEventListener('click', handleAddAgent);
    if (ruleTypeEl) ruleTypeEl.addEventListener('change', syncRuleTypeVisibility);

    if (!dispatchRuleId) {
        showError('Missing dispatch rule id in URL');
        return;
    }

    loadAll();
});

async function loadAll() {
    setLoading(true);
    hideError();

    try {
        await Promise.all([
            loadDispatchRule(),
            loadInboundTrunksDropdown(),
        ]);
        setLoading(false);
        setFormVisible(true);
        initializeIcons();
    } catch (error) {
        console.error('Error loading dispatch edit page:', error);
        setLoading(false);
        showError(error.message || 'Failed to load dispatch rule');
        showToast('Error loading dispatch rule', 3000, 'error');
    }
}

async function loadDispatchRule() {
    const subtitle = document.getElementById('dispatch-subtitle');
    if (subtitle) subtitle.textContent = 'Loading...';

    const result = await campaignAPI.getDispatchRules();
    if (!result || !result.success || !result.data) {
        throw new Error('Invalid dispatch rules response');
    }

    const list = extractDispatchList(result.data || {});
    const found = list.find(r => (r.sip_dispatch_rule_id || r.id) === dispatchRuleId);
    if (!found) {
        throw new Error(`Dispatch rule not found: ${dispatchRuleId}`);
    }

    currentDispatchRule = found;
    populateForm(found);

    if (subtitle) subtitle.textContent = found.name ? found.name : dispatchRuleId;
}

function extractDispatchList(raw) {
    if (!raw || typeof raw !== 'object') return [];
    if (Array.isArray(raw.sip_dispatch_rules)) return raw.sip_dispatch_rules;
    if (Array.isArray(raw.rules)) return raw.rules;
    if (Array.isArray(raw.items)) return raw.items;
    return [];
}

function populateForm(rule) {
    const idEl = document.getElementById('dispatch-id');
    const nameEl = document.getElementById('dispatch-name');
    const metadataEl = document.getElementById('dispatch-metadata');
    const ruleTypeEl = document.getElementById('dispatch-rule-type');
    const prefixEl = document.getElementById('dispatch-room-prefix');
    const roomNameEl = document.getElementById('dispatch-room-name');
    const pinEl = document.getElementById('dispatch-pin');

    const id = rule.sip_dispatch_rule_id || rule.id || dispatchRuleId;
    if (idEl) idEl.value = id;
    if (nameEl) nameEl.value = rule.name || '';
    if (metadataEl) metadataEl.value = rule.metadata || '';

    const isDirect = !!(rule.rule && rule.rule.dispatch_rule_direct);
    if (ruleTypeEl) ruleTypeEl.value = isDirect ? 'direct' : 'individual';

    if (prefixEl) {
        prefixEl.value = (rule.rule && rule.rule.dispatch_rule_individual && rule.rule.dispatch_rule_individual.room_prefix)
            ? rule.rule.dispatch_rule_individual.room_prefix
            : 'call-';
    }

    if (roomNameEl) {
        roomNameEl.value = (rule.rule && rule.rule.dispatch_rule_direct && rule.rule.dispatch_rule_direct.room_name)
            ? rule.rule.dispatch_rule_direct.room_name
            : '';
    }

    if (pinEl) {
        pinEl.value = (rule.rule && rule.rule.dispatch_rule_direct && rule.rule.dispatch_rule_direct.pin)
            ? rule.rule.dispatch_rule_direct.pin
            : '';
    }

    // trunk ids chips
    const trunkIds = Array.isArray(rule.trunk_ids) ? rule.trunk_ids : (rule.trunk_ids ? [rule.trunk_ids] : []);
    const trunkList = document.getElementById('trunk-ids-list');
    if (trunkList) {
        trunkList.innerHTML = '';
        trunkIds.forEach(addTrunkChip);
    }

    // agents chips
    const agents = (rule.room_config && Array.isArray(rule.room_config.agents)) ? rule.room_config.agents : [];
    const agentsList = document.getElementById('agents-list');
    if (agentsList) {
        agentsList.innerHTML = '';
        agents.forEach(a => {
            const agent_name = a.agent_name || a.name;
            const metadata = a.metadata || '';
            if (agent_name) addAgentChip({ agent_name, metadata });
        });
    }

    syncRuleTypeVisibility();
}

function syncRuleTypeVisibility() {
    const ruleTypeEl = document.getElementById('dispatch-rule-type');
    const individual = document.getElementById('individual-fields');
    const direct = document.getElementById('direct-fields');
    if (!ruleTypeEl || !individual || !direct) return;

    const type = ruleTypeEl.value;
    if (type === 'direct') {
        individual.classList.add('hidden');
        direct.classList.remove('hidden');
    } else {
        direct.classList.add('hidden');
        individual.classList.remove('hidden');
    }
}

async function loadInboundTrunksDropdown() {
    const select = document.getElementById('trunk-select');
    if (!select) return;

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
}

function extractInboundTrunkList(raw) {
    if (!raw || typeof raw !== 'object') return [];
    if (Array.isArray(raw.trunks)) return raw.trunks;
    if (Array.isArray(raw.items)) return raw.items;
    if (Array.isArray(raw.sip_trunks)) return raw.sip_trunks;
    if (Array.isArray(raw.inbound_trunks)) return raw.inbound_trunks;
    return [];
}

function handleAddTrunk() {
    const select = document.getElementById('trunk-select');
    const trunkId = select ? select.value : '';
    if (!trunkId) return;
    addTrunkChip(trunkId);
}

function addTrunkChip(trunkId) {
    const container = document.getElementById('trunk-ids-list');
    if (!container) return;
    const existing = getSelectedTrunkIds();
    if (existing.includes(trunkId)) return;

    const chip = document.createElement('span');
    chip.className = 'inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200';
    chip.setAttribute('data-trunk-id', trunkId);
    chip.innerHTML = `${escapeHtml(trunkId)} <button type="button" class="ml-1 text-gray-500 hover:text-gray-700" aria-label="Remove">×</button>`;
    const removeBtn = chip.querySelector('button');
    if (removeBtn) removeBtn.addEventListener('click', () => chip.remove());
    container.appendChild(chip);
}

function getSelectedTrunkIds() {
    const container = document.getElementById('trunk-ids-list');
    if (!container) return [];
    return Array.from(container.querySelectorAll('[data-trunk-id]'))
        .map(el => el.getAttribute('data-trunk-id'))
        .filter(Boolean);
}

function handleAddAgent() {
    const nameEl = document.getElementById('agent-name');
    const metadataEl = document.getElementById('agent-metadata');
    const agent_name = (nameEl && nameEl.value ? nameEl.value : '').trim();
    const metadata = (metadataEl && metadataEl.value ? metadataEl.value : '').trim();

    if (!agent_name) {
        showToast('Agent name is required', 2500, 'error');
        return;
    }

    addAgentChip({ agent_name, metadata: metadata || '' });
    if (nameEl) nameEl.value = '';
    if (metadataEl) metadataEl.value = '';
    if (nameEl) nameEl.focus();
}

function addAgentChip(agent) {
    const container = document.getElementById('agents-list');
    if (!container) return;
    const existing = getSelectedAgents();
    if (existing.some(a => a.agent_name === agent.agent_name)) return;

    const chip = document.createElement('span');
    chip.className = 'inline-flex items-center gap-1 px-2 py-1 rounded-full bg-gray-100 text-gray-800 border border-gray-200';
    chip.setAttribute('data-agent-name', agent.agent_name);
    chip.setAttribute('data-agent-metadata', agent.metadata || '');

    const metaSuffix = agent.metadata ? ` (${agent.metadata})` : '';
    chip.innerHTML = `${escapeHtml(agent.agent_name)}${escapeHtml(metaSuffix)} <button type="button" class="ml-1 text-gray-500 hover:text-gray-700" aria-label="Remove">×</button>`;
    const removeBtn = chip.querySelector('button');
    if (removeBtn) removeBtn.addEventListener('click', () => chip.remove());
    container.appendChild(chip);
}

function getSelectedAgents() {
    const container = document.getElementById('agents-list');
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

async function handleSave(e) {
    e.preventDefault();
    if (!dispatchRuleId) return;

    const saveBtn = document.getElementById('save-btn');
    const nameEl = document.getElementById('dispatch-name');
    const metadataEl = document.getElementById('dispatch-metadata');
    const ruleTypeEl = document.getElementById('dispatch-rule-type');
    const prefixEl = document.getElementById('dispatch-room-prefix');
    const roomNameEl = document.getElementById('dispatch-room-name');
    const pinEl = document.getElementById('dispatch-pin');

    const name = (nameEl && nameEl.value ? nameEl.value : '').trim();
    const metadata = metadataEl && typeof metadataEl.value === 'string' ? metadataEl.value : '';
    const trunk_ids = getSelectedTrunkIds();
    const agents = getSelectedAgents();
    const type = ruleTypeEl ? ruleTypeEl.value : 'individual';

    if (!name) {
        showToast('Name is required', 2500, 'error');
        return;
    }
    if (!trunk_ids.length) {
        showToast('Select at least one inbound trunk', 2500, 'error');
        return;
    }
    if (!agents.length) {
        showToast('Add at least one agent', 2500, 'error');
        return;
    }

    const payload = {
        name,
        metadata,
        trunk_ids,
        agents,
    };

    if (type === 'direct') {
        const room_name = (roomNameEl && roomNameEl.value ? roomNameEl.value : '').trim();
        const pin = (pinEl && pinEl.value ? pinEl.value : '').trim();
        if (!room_name) {
            showToast('Room name is required for direct rules', 2500, 'error');
            return;
        }
        payload.room_name = room_name;
        if (pin) payload.pin = pin;
    } else {
        const room_prefix = (prefixEl && prefixEl.value ? prefixEl.value : '').trim();
        if (!room_prefix) {
            showToast('Room prefix is required for individual rules', 2500, 'error');
            return;
        }
        payload.room_prefix = room_prefix;
    }

    try {
        if (saveBtn) {
            saveBtn.disabled = true;
            saveBtn.classList.add('opacity-60');
        }

        const result = await campaignAPI.updateDispatchRule(dispatchRuleId, payload);
        if (result && result.success) {
            showToast(result.message || 'Dispatch rule updated', 3000, 'success');
            const target = '/trunks/dispatch.html';
            window.location.href = window.APP_CONFIG && typeof window.APP_CONFIG.frontendUrl === 'function'
                ? window.APP_CONFIG.frontendUrl(target)
                : target;
        } else {
            throw new Error(result && result.message ? result.message : 'Update failed');
        }
    } catch (error) {
        console.error('Error updating dispatch rule:', error);
        showToast(error.message || 'Failed to update dispatch rule', 4000, 'error');
    } finally {
        if (saveBtn) {
            saveBtn.disabled = false;
            saveBtn.classList.remove('opacity-60');
        }
    }
}

function setLoading(isLoading) {
    const loading = document.getElementById('loading');
    if (!loading) return;
    loading.classList.toggle('hidden', !isLoading);
}

function setFormVisible(isVisible) {
    const container = document.getElementById('form-container');
    if (!container) return;
    container.classList.toggle('hidden', !isVisible);
}

function showError(message) {
    const errorState = document.getElementById('error-state');
    const messageEl = document.getElementById('error-message');
    if (!errorState || !messageEl) return;
    messageEl.textContent = message;
    errorState.classList.remove('hidden');
}

function hideError() {
    const errorState = document.getElementById('error-state');
    if (!errorState) return;
    errorState.classList.add('hidden');
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
