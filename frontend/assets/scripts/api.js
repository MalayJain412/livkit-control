/**
 * API Layer for CreativeNest Admin Panel
 * Handles data fetching and state management
 * Can be switched from mock data to real API calls
 */

// Mock Campaign Data
const mockCampaigns = [
    {
        id: "698cf308a4b1b4cdc6bc2e89",
        direction: "inbound",
        agent_instruction: {
            initial_message: "Hello!",
            opening_script: {
                english: "Hi! I'm Friday, your AI voice assistant. I help businesses handle calls, qualify leads, and automate conversations. How can I help you today?",
                hinglish: "Namaste! Main Friday hoon, aapki AI voice assistant. Main businesses ko calls handle karne, leads qualify karne aur conversations automate karne mein help karti hoon. Bataiye, main aapki kaise help kar sakti hoon?",
                malayalam: "Namaskaram! Ente peru Friday aanu. Njan ningalude AI voice assistant aanu. Business calls handle cheyyan, leads qualify cheyyan, conversations automate cheyyan njan help cheyyum. Njan ningale engane help cheyyam?"
            },
            closing_script: {
                english: "Thank you for contacting Friday. We really appreciate your time. Have a wonderful day ahead.",
                hinglish: "Friday se baat karne ke liye thank you. Aapka time dene ke liye hum appreciate karte hain. Aapka din bahut acha rahe.",
                malayalam: "Friday-ne contact cheythathinu thank you. Ningalude time-nu valare thanks. Ningalkku oru wonderful day aayirikatte."
            },
            persona: {
                description: "You are Friday, a friendly, warm, and professional female AI sales representative who specializes in explaining, demonstrating, and selling AI Voice Bot solutions. You speak in a natural, human-like, empathetic tone. You are patient, confident, and conversational. You act as a live example of the AI product itself. Your role is to understand the caller's business needs, identify pain points, and present AI voice automation as a helpful solution. You focus on understanding first, selling second. You remain polite, helpful, and trustworthy throughout the conversation."
            },
            language_rules: {
                rules: "Always detect and match the user's language style. English → English. Hindi/Hinglish → Hinglish. Malayalam → Malayalam+English. Arabic → polite professional Arabic. Use feminine forms when referring to self in Hinglish/Arabic. Never mix Hinglish and Malayalam."
            },
            capabilities: {
                list: [
                    "24/7 call handling",
                    "Multilingual conversations",
                    "Lead qualification",
                    "Sales conversations",
                    "Appointment booking",
                    "CRM integration",
                    "Analytics and reporting",
                    "Human agent transfer",
                    "Scalable for high call volume"
                ]
            },
            knowledge_base: {
                details: "Friday represents an AI Voice Bot solution designed for businesses to automate conversations and manage customer interactions."
            },
            questions: [
                "What type of business do you run?",
                "How many calls do you receive daily?",
                "Do you currently have a team handling calls?",
                "What problems do you face? Missed calls, high cost, or availability?",
                "Are you interested in automation for sales, support, or booking?"
            ]
        },
        session_instruction: {
            conversation_flow: {
                start: "Always start with the simple initial_message 'Hello!', once the user responds back open with the opening_script",
                end_rule: "Always end the call using the closing_script after conversation completion or transfer."
            },
            tools: {
                detect_lead_intent: {
                    definition: "Detect if the caller is interested in demo, pricing, automation, or speaking with sales.",
                    flow: "Trigger when user shows business interest. If positive → move to lead validation.",
                    special_instructions: "Summarize intent result naturally.",
                    negative_prompt: "Do not call repeatedly or without intent signals."
                },
                lead_validation: {
                    definition: "Ask structured qualification questions and collect lead information.",
                    flow: "Ask questions one by one. Confirm answers. Ensure all required fields are completed.",
                    special_instructions: "Keep conversational tone, not interrogative.",
                    negative_prompt: "Do not ask all questions at once."
                },
                create_lead: {
                    definition: "Save collected lead data into the system.",
                    flow: "Call only after validation is complete.",
                    special_instructions: "Summarize collected details before saving.",
                    negative_prompt: "Do not call with incomplete data."
                },
                transfer_call: {
                    definition: "Transfer qualified caller to human agent.",
                    flow: "After lead is created and interest is confirmed → transfer.",
                    special_instructions: "Inform caller before transfer.",
                    negative_prompt: "Never transfer unqualified callers."
                }
            },
            multi_tool_execution_flow: "detect_lead_intent → lead_validation → create_lead → transfer_call",
            response_rules: {
                rules: "After using any tool, explain results naturally, continue conversation smoothly, and maintain the Friday persona."
            }
        },
        model_config: "default",
        campaign_number: "+919425425201",
        transfer_number: "+917418529630",
        name: "Old Campaign",
        created_at: "2026-02-12T10:30:00Z"
    },
    {
        id: "698cf308a4b1b4cdc6bc2e90",
        direction: "outbound",
        agent_instruction: {
            initial_message: "Good morning!",
            opening_script: {
                english: "Hi there! This is Friday calling. I'm reaching out to see if you'd be interested in learning about our AI voice solutions.",
                hinglish: "Namaste! Main Friday hoon. Aapko aapke liye humari AI voice solutions ke baare mein batana chahti hoon.",
                malayalam: "Namaskaram! Njaan Friday aanu. Njan nningalude lekshyathil mkunnathu aanu."
            },
            closing_script: {
                english: "Thank you for your time today. We look forward to speaking with you soon!",
                hinglish: "Aapke samay ke liye shukriya. Hum jaldi se aapse baat karne ke liye intezaar karte hain!",
                malayalam: "Aapca nikhanam thank you. Hum jaldi se aapce baat karne ke liye intezaar karte hain!"
            },
            persona: {
                description: "You are a professional outbound AI agent focused on scheduling meetings and generating qualified leads."
            },
            language_rules: {
                rules: "Match the language preference of the caller."
            },
            capabilities: {
                list: [
                    "Outbound calling",
                    "Meeting scheduling",
                    "Lead generation",
                    "Follow-up calls"
                ]
            },
            knowledge_base: {
                details: "Outbound calling solution for B2B lead generation and meeting scheduling."
            },
            questions: [
                "Are you the decision maker?",
                "When would be a good time to schedule a call?"
            ]
        },
        session_instruction: {
            conversation_flow: {
                start: "Start with a friendly greeting",
                end_rule: "End with scheduling confirmation"
            },
            tools: {},
            multi_tool_execution_flow: "qualify → schedule",
            response_rules: {
                rules: "Be professional and respectful of their time."
            }
        },
        model_config: "default",
        campaign_number: "+919876543210",
        transfer_number: "+919876543211",
        name: "Outbound Leads Campaign",
        created_at: "2026-03-01T14:20:00Z"
    },
    {
        id: "698cf308a4b1b4cdc6bc2e91",
        direction: "inbound",
        agent_instruction: {
            initial_message: "Welcome!",
            opening_script: {
                english: "Welcome to our support line. How can we assist you today?",
                hinglish: "Humare support line mein welcome. Hum aapki kaise madad kar sakte hain?",
                malayalam: "Meendum welcome. Njaan nningale engane sahayikkanam?"
            },
            closing_script: {
                english: "Thank you for contacting us. Have a great day!",
                hinglish: "Humse contact karne ke liye shukriya. Aapka din badhiya ho!",
                malayalam: "Contact cheythathinu thanks. Nngalukku oru wonderful day!"
            },
            persona: {
                description: "You are a helpful customer support agent ready to assist with inquiries and provide solutions."
            },
            language_rules: {
                rules: "Use simple, clear language appropriate for customer support."
            },
            capabilities: {
                list: [
                    "Customer support",
                    "Troubleshooting",
                    "Account assistance"
                ]
            },
            knowledge_base: {
                details: "Customer support solution for handling inbound calls and inquiries."
            },
            questions: []
        },
        session_instruction: {
            conversation_flow: {
                start: "Welcome the customer",
                end_rule: "Thank them and offer follow-up"
            },
            tools: {},
            multi_tool_execution_flow: "listen → assist → resolve",
            response_rules: {
                rules: "Be empathetic and solution-focused."
            }
        },
        model_config: "default",
        campaign_number: "+919999999999",
        transfer_number: "+919888888888",
        name: "Customer Support",
        created_at: "2026-03-10T09:15:00Z"
    }
];

// Mock Agents Data
const mockAgents = [
    {
        id: "69c2e0c876b0b84cfeaf6a23",
        agent_name: "malay_test",
        agent_instruction: {
            initial_message: "Hello!",
            opening_script: {
                english: "Hi! This is Malay's test agent.",
                hinglish: "Namaste! Me malay ki test agent hu",
                malayalam: "Namaskaram! Ente peru Malay's test agent aanu."
            },
            closing_script: {
                english: "Thank you testing done.",
                hinglish: "Testing ho gai.",
                malayalam: "Testing bot contact cheythathinu thank you."
            },
            persona: {
                description: "You are Malay's test agent, professional, warm, serious female AI bot, whose work is to provide the information about the voicebot."
            },
            language_rules: {
                rules: "Always detect and match the user's language style."
            },
            capabilities: {
                list: [
                    "Lead finalization",
                    "lead identification",
                    "Lead qualification",
                    "Sales conversations",
                    "Appointment booking",
                    "Human agent transfer"
                ]
            },
            knowledge_base: {
                details: "Malay's Test bot is designed for Creative nest."
            },
            questions: [
                "What type of business do you run?"
            ]
        },
        session_instruction: {
            conversation_flow: {
                start: "Always start with the simple initial_message 'Hello!'",
                end_rule: "Always end the call using the closing_script."
            },
            tools: {},
            multi_tool_execution_flow: "detect_lead_intent → lead_validation → create_lead → transfer_call",
            response_rules: {
                rules: "After using any tool, explain results naturally."
            }
        },
        model_config: {
            stt: "azureRealtime",
            llm: "azureRealtime",
            tts: {
                model: "cartesia",
                voice: "f786b574-daa5-4673-aa0c-cbe3e8534c02"
            }
        },
        created_at: new Date().toISOString()
    }
];

// Mock Tools Catalog (derived from first mock campaign)
const mockToolsCatalog = (mockCampaigns[0] &&
    mockCampaigns[0].session_instruction &&
    mockCampaigns[0].session_instruction.tools) || {};

/**
 * API Client for CreativeNest Admin
 * Can be switched to real API endpoints
 */
class CampaignAPI {
    constructor(useMock = true) {
        this.useMock = useMock;
        this._applyBackendBase();

        if (typeof window !== 'undefined' && typeof window.addEventListener === 'function') {
            window.addEventListener('config:updated', () => {
                this._applyBackendBase();
            });
        }
    }

    _applyBackendBase() {
        // When using the real backend, this should point to the FastAPI server.
        let backendBase = window.location.origin;
        if (typeof window !== 'undefined' && window.APP_CONFIG && window.APP_CONFIG.BACKEND_URL) {
            backendBase = String(window.APP_CONFIG.BACKEND_URL).replace(/\/$/, '');
        }

        // All APIs are versioned under /api/v1 in the FastAPI backend
        this.apiBase = `${backendBase}/api/v1/campaigns`;
        this.agentsBase = `${backendBase}/api/v1/agents`;
        this.conversationsBase = `${backendBase}/api/v1/conversations`;
        this.analysisBase = `${backendBase}/api/v1/analysis`;
        this.toolsBase = `${backendBase}/api/v1/tools`;
        this.voicesBase = `${backendBase}/api/v1/voices`;
        this.trunksBase = `${backendBase}/api/v1/lk-trunks`;
    }

    /**
     * Get all campaigns
     */
    async getCampaigns() {
        if (this.useMock) {
            // Simulate network delay
            await new Promise(resolve => setTimeout(resolve, 500));
            return {
                success: true,
                data: mockCampaigns.map(c => ({
                    id: c.id,
                    name: c.name,
                    direction: c.direction,
                    campaign_number: c.campaign_number,
                    agent_name: c.agent_name || 'mock_agent',
                    created_at: c.created_at
                }))
            };
        }

        try {
            const response = await fetch(`${this.apiBase}`);
            if (!response.ok) throw new Error('Failed to fetch campaigns');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * Get a single campaign by ID
     */
    async getCampaign(id) {
        if (this.useMock) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const campaign = mockCampaigns.find(c => c.id === id);
            if (!campaign) {
                throw new Error('Campaign not found');
            }
            return {
                success: true,
                data: campaign
            };
        }

        try {
            const response = await fetch(`${this.apiBase}/${id}`);
            if (!response.ok) throw new Error('Campaign not found');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * Get all agents
     */
    async getAgents() {
        if (this.useMock) {
            await new Promise(resolve => setTimeout(resolve, 300));
            return {
                success: true,
                data: mockAgents
            };
        }

        try {
            const response = await fetch(`${this.agentsBase}`);
            if (!response.ok) throw new Error('Failed to fetch agents');
            return await response.json();
        } catch (error) {
            console.error('API Error (agents):', error);
            throw error;
        }
    }

    /**
     * Get a single agent by ID
     */
    async getAgent(id) {
        if (this.useMock) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const agent = mockAgents.find(a => a.id === id);
            if (!agent) {
                throw new Error('Agent not found');
            }
            return { success: true, data: agent };
        }

        try {
            const response = await fetch(`${this.agentsBase}/${id}`);
            if (!response.ok) throw new Error('Agent not found');
            return await response.json();
        } catch (error) {
            console.error('API Error (agent):', error);
            throw error;
        }
    }

    /**
     * Get inbound SIP trunks
     */
    async getInboundTrunks() {
        try {
            const response = await fetch(`${this.trunksBase}/inbound`);
            if (!response.ok) throw new Error('Failed to fetch inbound trunks');
            return await response.json();
        } catch (error) {
            console.error('API Error (inbound trunks):', error);
            throw error;
        }
    }

    /**
     * Get outbound SIP trunks
     */
    async getOutboundTrunks() {
        try {
            const response = await fetch(`${this.trunksBase}/outbound`);
            if (!response.ok) throw new Error('Failed to fetch outbound trunks');
            return await response.json();
        } catch (error) {
            console.error('API Error (outbound trunks):', error);
            throw error;
        }
    }

    /**
     * Unified update for outbound trunk configuration
     *
     * Maps to FastAPI endpoint:
     *   PUT /api/v1/lk-trunks/outbound/update-unified
     * with body UpdateOutboundTrunkUnifiedRequest:
     *   { trunk_id, add_numbers?, remove_numbers?, name?, metadata?, address?, transport?, auth_username?, auth_password? }
     */
    async updateOutboundTrunkUnified(payload) {
        try {
            if (!payload || !payload.trunk_id) {
                throw new Error('trunk_id is required to update outbound trunk');
            }

            const response = await fetch(`${this.trunksBase}/outbound/update-unified`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let message = 'Failed to update outbound trunk';
                try {
                    const errJson = await response.json();
                    if (errJson && typeof errJson.detail === 'string') {
                        message = errJson.detail;
                    }
                } catch {
                    // ignore JSON parse errors, fall back to default message
                }
                throw new Error(message);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error (update outbound trunk unified):', error);
            throw error;
        }
    }

    /**
     * Partially update an inbound trunk configuration
     *
     * Maps to FastAPI endpoint:
     *   POST /api/v1/lk-trunks/inbound/update
     * with body UpdateInboundTrunkRequest:
     *   { trunk_id, name?, numbers_to_add?, allowed_numbers?, allowed_addresses?, auth_username?, auth_password?, metadata? }
     */
    async updateInboundTrunk(payload) {
        try {
            if (!payload || !payload.trunk_id) {
                throw new Error('trunk_id is required to update inbound trunk');
            }

            const response = await fetch(`${this.trunksBase}/inbound/update`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                // Try to surface backend error message (FastAPI-style { detail: ... })
                let message = 'Failed to update inbound trunk';
                try {
                    const errJson = await response.json();
                    if (errJson && typeof errJson.detail === 'string') {
                        message = errJson.detail;
                    }
                } catch {
                    // ignore JSON parse errors, fall back to default message
                }
                throw new Error(message);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error (update inbound trunk):', error);
            throw error;
        }
    }

    /**
     * Unified update for inbound trunk configuration
     *
     * Maps to FastAPI endpoint:
     *   PUT /api/v1/lk-trunks/inbound/update-unified
     * with body UpdateInboundTrunkUnifiedRequest:
     *   { trunk_id, add_numbers?, remove_numbers?, add_allowed_numbers?, remove_allowed_numbers?, add_allowed_addresses?, remove_allowed_addresses?, name?, metadata? }
     */
    async updateInboundTrunkUnified(payload) {
        try {
            if (!payload || !payload.trunk_id) {
                throw new Error('trunk_id is required to update inbound trunk');
            }

            const response = await fetch(`${this.trunksBase}/inbound/update-unified`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                let message = 'Failed to update inbound trunk';
                try {
                    const errJson = await response.json();
                    if (errJson && typeof errJson.detail === 'string') {
                        message = errJson.detail;
                    }
                } catch {
                    // ignore JSON parse errors, fall back to default message
                }
                throw new Error(message);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error (update inbound trunk unified):', error);
            throw error;
        }
    }

    /**
     * Create a new inbound SIP trunk
     */
    async createInboundTrunk(data) {
        try {
            const response = await fetch(`${this.trunksBase}/inbound`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                let message = 'Failed to create inbound trunk';
                try {
                    const errJson = await response.json();
                    if (errJson && typeof errJson.detail === 'string') {
                        message = errJson.detail;
                    }
                } catch {
                    // ignore
                }
                throw new Error(message);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error (create inbound trunk):', error);
            throw error;
        }
    }

    /**
     * Completely replace an inbound trunk configuration
     *   POST /api/v1/lk-trunks/inbound/replace
     */
    async replaceInboundTrunk(data) {
        try {
            const response = await fetch(`${this.trunksBase}/inbound/replace`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                let message = 'Failed to replace inbound trunk';
                try {
                    const errJson = await response.json();
                    if (errJson && typeof errJson.detail === 'string') {
                        message = errJson.detail;
                    }
                } catch {}
                throw new Error(message);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error (replace inbound trunk):', error);
            throw error;
        }
    }

    /**
     * Delete an inbound SIP trunk by ID
     *   DELETE /api/v1/lk-trunks/inbound/{trunkId}
     */
    async deleteInboundTrunk(trunkId) {
        try {
            if (!trunkId) {
                throw new Error('trunkId is required to delete inbound trunk');
            }

            const response = await fetch(`${this.trunksBase}/inbound/${encodeURIComponent(trunkId)}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                let message = 'Failed to delete inbound trunk';
                try {
                    const errJson = await response.json();
                    if (errJson && typeof errJson.detail === 'string') {
                        message = errJson.detail;
                    }
                } catch {}
                throw new Error(message);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error (delete inbound trunk):', error);
            throw error;
        }
    }

    /**
     * Create a new outbound SIP trunk
     */
    async createOutboundTrunk(data) {
        try {
            const response = await fetch(`${this.trunksBase}/outbound`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            if (!response.ok) {
                let message = 'Failed to create outbound trunk';
                try {
                    const errJson = await response.json();
                    if (errJson && typeof errJson.detail === 'string') {
                        message = errJson.detail;
                    }
                } catch {}
                throw new Error(message);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error (create outbound trunk):', error);
            throw error;
        }
    }

    /**
     * Delete an outbound SIP trunk by ID
     *   DELETE /api/v1/lk-trunks/outbound/{trunkId}
     */
    async deleteOutboundTrunk(trunkId) {
        try {
            if (!trunkId) {
                throw new Error('trunkId is required to delete outbound trunk');
            }

            const response = await fetch(`${this.trunksBase}/outbound/${encodeURIComponent(trunkId)}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                let message = 'Failed to delete outbound trunk';
                try {
                    const errJson = await response.json();
                    if (errJson && typeof errJson.detail === 'string') {
                        message = errJson.detail;
                    }
                } catch {}
                throw new Error(message);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error (delete outbound trunk):', error);
            throw error;
        }
    }

    /**
     * Get dispatch rules (SIP dispatch) from LiveKit
     */
    async getDispatchRules() {
        try {
            const response = await fetch(`${this.trunksBase}/dispatch`);
            if (!response.ok) throw new Error('Failed to fetch dispatch rules');
            return await response.json();
        } catch (error) {
            console.error('API Error (dispatch rules):', error);
            throw error;
        }
    }

    /**
     * Create a SIP dispatch rule
     *   POST /api/v1/lk-trunks/dispatch
     */
    async createDispatchRule(payload) {
        try {
            const response = await fetch(`${this.trunksBase}/dispatch`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload || {}),
            });

            if (!response.ok) {
                let message = 'Failed to create dispatch rule';
                try {
                    const errJson = await response.json();
                    if (errJson && typeof errJson.detail === 'string') {
                        message = errJson.detail;
                    } else if (errJson && typeof errJson.message === 'string') {
                        message = errJson.message;
                    }
                } catch {}
                throw new Error(message);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error (create dispatch rule):', error);
            throw error;
        }
    }

    /**
     * Delete a SIP dispatch rule
     *   DELETE /api/v1/lk-trunks/dispatch/{dispatch_rule_id}
     */
    async deleteDispatchRule(dispatchRuleId) {
        try {
            if (!dispatchRuleId) {
                throw new Error('dispatchRuleId is required to delete dispatch rule');
            }

            const response = await fetch(`${this.trunksBase}/dispatch/${encodeURIComponent(dispatchRuleId)}`, {
                method: 'DELETE',
            });

            if (!response.ok) {
                let message = 'Failed to delete dispatch rule';
                try {
                    const errJson = await response.json();
                    if (errJson && typeof errJson.detail === 'string') {
                        message = errJson.detail;
                    } else if (errJson && typeof errJson.message === 'string') {
                        message = errJson.message;
                    }
                } catch {}
                throw new Error(message);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error (delete dispatch rule):', error);
            throw error;
        }
    }

    /**
     * Update (replace) a SIP dispatch rule
     *   PUT /api/v1/lk-trunks/dispatch/{dispatch_rule_id}
     */
    async updateDispatchRule(dispatchRuleId, payload) {
        try {
            if (!dispatchRuleId) {
                throw new Error('dispatchRuleId is required to update dispatch rule');
            }

            const response = await fetch(`${this.trunksBase}/dispatch/${encodeURIComponent(dispatchRuleId)}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload || {}),
            });

            if (!response.ok) {
                let message = 'Failed to update dispatch rule';
                try {
                    const errJson = await response.json();
                    if (errJson && typeof errJson.detail === 'string') {
                        message = errJson.detail;
                    } else if (errJson && typeof errJson.message === 'string') {
                        message = errJson.message;
                    }
                } catch {}
                throw new Error(message);
            }

            return await response.json();
        } catch (error) {
            console.error('API Error (update dispatch rule):', error);
            throw error;
        }
    }

    /**
     * Create a new campaign
     */
    async createCampaign(data) {
        if (this.useMock) {
            await new Promise(resolve => setTimeout(resolve, 400));
            const newId = Date.now().toString(16);
            const created_at = new Date().toISOString();
            const newCampaign = { id: newId, created_at, ...data };
            mockCampaigns.push(newCampaign);
            return {
                success: true,
                data: newCampaign
            };
        }

        try {
            const response = await fetch(`${this.apiBase}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to create campaign');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * Create a new agent
     */
    async createAgent(data) {
        if (this.useMock) {
            await new Promise(resolve => setTimeout(resolve, 400));
            const newId = Date.now().toString(16);
            const created_at = new Date().toISOString();
            const newAgent = { id: newId, created_at, ...data };
            mockAgents.push(newAgent);
            return {
                success: true,
                data: newAgent
            };
        }

        try {
            const response = await fetch(`${this.agentsBase}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to create agent');
            return await response.json();
        } catch (error) {
            console.error('API Error (create agent):', error);
            throw error;
        }
    }

    /**
     * Update a campaign
     */
    async updateCampaign(id, data) {
        if (this.useMock) {
            await new Promise(resolve => setTimeout(resolve, 400));
            const index = mockCampaigns.findIndex(c => c.id === id);
            if (index === -1) {
                throw new Error('Campaign not found');
            }
            mockCampaigns[index] = { ...mockCampaigns[index], ...data, id };
            return {
                success: true,
                data: mockCampaigns[index]
            };
        }

        try {
            const response = await fetch(`${this.apiBase}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to update campaign');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * Update an agent
     */
    async updateAgent(id, data) {
        if (this.useMock) {
            await new Promise(resolve => setTimeout(resolve, 400));
            const index = mockAgents.findIndex(a => a.id === id);
            if (index === -1) {
                throw new Error('Agent not found');
            }
            mockAgents[index] = { ...mockAgents[index], ...data, id };
            return {
                success: true,
                data: mockAgents[index]
            };
        }

        try {
            const response = await fetch(`${this.agentsBase}/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to update agent');
            return await response.json();
        } catch (error) {
            console.error('API Error (update agent):', error);
            throw error;
        }
    }

    /**
     * Delete a campaign
     */
    async deleteCampaign(id) {
        if (this.useMock) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const index = mockCampaigns.findIndex(c => c.id === id);
            if (index === -1) {
                throw new Error('Campaign not found');
            }
            mockCampaigns.splice(index, 1);
            return {
                success: true,
                message: 'Campaign deleted'
            };
        }

        try {
            const response = await fetch(`${this.apiBase}/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete campaign');
            return await response.json();
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    }

    /**
     * Delete an agent
     */
    async deleteAgent(id) {
        if (this.useMock) {
            await new Promise(resolve => setTimeout(resolve, 300));
            const index = mockAgents.findIndex(a => a.id === id);
            if (index === -1) {
                throw new Error('Agent not found');
            }
            mockAgents.splice(index, 1);
            return {
                success: true,
                message: 'Agent deleted'
            };
        }

        try {
            const response = await fetch(`${this.agentsBase}/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete agent');
            return await response.json();
        } catch (error) {
            console.error('API Error (delete agent):', error);
            throw error;
        }
    }

    /**
     * Get recent conversations (paginated)
     * @param {number} limit - rows per page
     * @param {number} page - page number (1-based)
     */
    async getConversations(limit = 10, page = 1) {
        if (this.useMock) {
            // No mock conversations yet; return empty list
            await new Promise(resolve => setTimeout(resolve, 200));
            return {
                success: true,
                data: {
                    items: [],
                    total: 0,
                    page,
                    limit
                }
            };
        }

        try {
            const url = `${this.conversationsBase}?limit=${encodeURIComponent(limit)}&page=${encodeURIComponent(page)}`;
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch conversations');
            return await response.json();
        } catch (error) {
            console.error('API Error (conversations):', error);
            throw error;
        }
    }

    /**
     * Get a single conversation by ID
     */
    async getConversation(id) {
        if (this.useMock) {
            await new Promise(resolve => setTimeout(resolve, 200));
            return { success: false, data: null, message: 'Mock conversations not implemented' };
        }

        try {
            const response = await fetch(`${this.conversationsBase}/${id}`);
            if (!response.ok) throw new Error('Failed to fetch conversation');
            return await response.json();
        } catch (error) {
            console.error('API Error (conversation detail):', error);
            throw error;
        }
    }

    /**
     * Delete a single conversation by ID
     */
    async deleteConversation(id) {
        if (this.useMock) {
            await new Promise(resolve => setTimeout(resolve, 200));
            return { success: false, message: 'Mock conversations not implemented' };
        }

        try {
            const response = await fetch(`${this.conversationsBase}/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete conversation');
            return await response.json();
        } catch (error) {
            console.error('API Error (delete conversation):', error);
            throw error;
        }
    }

    /**
     * Generate analysis from the stored conversation by job ID.
     * Tries GET first, then falls back to POST if the backend requires it.
     */
    async classifyConversationAnalysisFromDb(jobId) {
        if (!jobId) {
            throw new Error('jobId is required to generate analysis');
        }

        const url = `${this.analysisBase}/classify-from-db/${encodeURIComponent(jobId)}`;

        const request = async (method) => {
            const response = await fetch(url, {
                method,
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                let message = 'Failed to generate conversation analysis';
                try {
                    const payload = await response.json();
                    if (payload && typeof payload.detail === 'string') {
                        message = payload.detail;
                    } else if (payload && typeof payload.message === 'string') {
                        message = payload.message;
                    }
                } catch {
                    // Ignore parse errors and fall back to the default message.
                }

                const error = new Error(message);
                error.status = response.status;
                throw error;
            }

            return await response.json();
        };

        try {
            return await request('GET');
        } catch (error) {
            if (error && error.status === 405) {
                return await request('POST');
            }
            throw error;
        }
    }

    /**
     * Get tools catalog from backend (admin-settings)
     */
    async getTools() {
        // In mock mode, always serve tools from mock catalog
        if (this.useMock) {
            await new Promise(resolve => setTimeout(resolve, 300));
            return {
                success: true,
                data: {
                    tools: mockToolsCatalog
                }
            };
        }

        // Live mode: try backend first, but fall back to mock catalog
        try {
            const response = await fetch(this.toolsBase);
            if (!response.ok) throw new Error('Failed to fetch tools catalog');
            const json = await response.json();

            if (json && json.success && json.data && json.data.tools && Object.keys(json.data.tools).length) {
                return json;
            }

            console.warn('Tools catalog empty from backend, falling back to mock catalog');
        } catch (error) {
            console.error('API Error (tools), falling back to mock catalog:', error);
        }

        // Fallback: use mock tools so UI still works
        return {
            success: true,
            data: {
                tools: mockToolsCatalog
            }
        };
    }

    /**
     * Voices catalog APIs
     */
    async getVoices(filters = {}) {
        if (this.useMock) {
            // No dedicated mock; return empty list
            await new Promise(resolve => setTimeout(resolve, 200));
            return { success: true, data: [] };
        }

        const params = new URLSearchParams();
        if (filters.provider) params.set('provider', filters.provider);
        if (filters.language) params.set('language', filters.language);
        const query = params.toString();
        const url = query ? `${this.voicesBase}?${query}` : this.voicesBase;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error('Failed to fetch voices');
            return await response.json();
        } catch (error) {
            console.error('API Error (voices):', error);
            throw error;
        }
    }

    async getVoiceProviders() {
        if (this.useMock) {
            await new Promise(resolve => setTimeout(resolve, 200));
            return { success: true, data: [] };
        }

        try {
            const response = await fetch(`${this.voicesBase}/providers`);
            if (!response.ok) throw new Error('Failed to fetch voice providers');
            return await response.json();
        } catch (error) {
            console.error('API Error (voice providers):', error);
            throw error;
        }
    }

    async createVoice(data) {
        if (this.useMock) {
            await new Promise(resolve => setTimeout(resolve, 300));
            return { success: false, message: 'Mock voices not implemented' };
        }

        try {
            const response = await fetch(this.voicesBase, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to create voice');
            return await response.json();
        } catch (error) {
            console.error('API Error (create voice):', error);
            throw error;
        }
    }

    async updateVoice(id, data) {
        if (this.useMock) {
            await new Promise(resolve => setTimeout(resolve, 300));
            return { success: false, message: 'Mock voices not implemented' };
        }

        try {
            const response = await fetch(`${this.voicesBase}/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data)
            });
            if (!response.ok) throw new Error('Failed to update voice');
            return await response.json();
        } catch (error) {
            console.error('API Error (update voice):', error);
            throw error;
        }
    }

    async deleteVoice(id) {
        if (this.useMock) {
            await new Promise(resolve => setTimeout(resolve, 200));
            return { success: false, message: 'Mock voices not implemented' };
        }

        try {
            const response = await fetch(`${this.voicesBase}/${id}`, {
                method: 'DELETE'
            });
            if (!response.ok) throw new Error('Failed to delete voice');
            return await response.json();
        } catch (error) {
            console.error('API Error (delete voice):', error);
            throw error;
        }
    }
}

// Export the API instance
// Set useMock = false to use the configured backend.
const campaignAPI = new CampaignAPI(false);
