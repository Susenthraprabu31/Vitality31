
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */

// Import shared code (types, utilities, dataFlow, etc.)
import { 
  FlowResult, 
  dataFlow, 
  flowResults, 
  processInitialData,
  inputRefs,
  textareaRefs,
  selectRefs,
  formData,
  workflowRegistry
} from './flow-integration-shared';

import { TemplateExpressionEngine } from './template-engine';






const executeFlowChain_flow_whatsapp_trigger_1770013817891_1771079854994 = async (initialData: any = {}): Promise<FlowResult> => {
  const cleanedInitialData: any = {
    buttonId: initialData?.buttonId,
    formId: initialData?.formId,
    formData: initialData?.formData ? { ...initialData.formData } : {},
    clickTimestamp: initialData?.clickTimestamp,
    trigger: initialData?.trigger
  };
  
  // CRITICAL: Create flowResults as a NEW object, not a reference to cleanedInitialData
  // This ensures complete isolation from any stale state
  const flowResults: Record<string, any> = {
    ...cleanedInitialData
  };
  const flowErrors: string[] = [];
  let currentResult: any = cleanedInitialData;
  let batchResult: any ;
  let previousResult: any ;
  
  flowResults._executionId = `flow_whatsapp_trigger_1770013817891_1771079854994_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  try {
    flowResults.nodeResults = {};
    flowResults.variables = {};
    flowResults.inputs = {};
    flowResults.apiResponses = {};
    flowResults.formData = {};
    flowResults.inboundEmailData = {};
    flowResults.calculations = {};
    flowResults.aiResponses = {};
  //  flowResults.stepCounter = 0; // Initialize step counter for sequential step tracking




    // Enhanced Data Flow Helper Functions - CRITICAL: Define early to ensure availability in all contexts
    // This ensures dataFlow is available immediately after initialization for all node processors
    const dataFlow = {
      // Get current result
      current: () => flowResults.currentResult,

      // Get previous step result
      previous: () => flowResults.previousResult,

      // Get result by variable name
      get: (name: any) => {
        // First check at the top level (for form fields)
        if (flowResults[name] !== undefined) {
          return flowResults[name];
        }

        // Try specialized collections
        if (flowResults.variables && flowResults.variables[name]) {
          return flowResults.variables[name];
        }
        if (flowResults.inputs && flowResults.inputs[name]) {
          return flowResults.inputs[name];
        }
        if (flowResults.formData && flowResults.formData[name]) {
          return flowResults.formData[name];
        }
        if (flowResults.inboundEmailData && flowResults.inboundEmailData[name]) {
          return flowResults.inboundEmailData[name];
        }
        if (flowResults.apiResponses && flowResults.apiResponses[name]) {
          return flowResults.apiResponses[name];
        }
        if (flowResults.calculations && flowResults.calculations[name]) {
          return flowResults.calculations[name];
        }
        if (flowResults.aiResponses && flowResults.aiResponses[name]) {
          return flowResults.aiResponses[name];
        }

        // Search in node results
        for (const [nodeId, result] of Object.entries(flowResults.nodeResults || {})) {
          if ((result as any).displayName === name) {
            return (result as any).data;
          }
        }

        // Try case-insensitive matching as a last resort
        const lowerName = name.toLowerCase();

        // Check top level
        for (const key of Object.keys(flowResults)) {
          if (key.toLowerCase() === lowerName) {
            return flowResults[key];
          }
        }

        // Check form data
        if (flowResults.formData) {
          for (const key of Object.keys(flowResults.formData)) {
            if (key.toLowerCase() === lowerName) {
              return flowResults.formData[key];
            }
          }
        }

        // Check inbound email data
        if (flowResults.inboundEmailData) {
          for (const key of Object.keys(flowResults.inboundEmailData)) {
            if (key.toLowerCase() === lowerName) {
              return flowResults.inboundEmailData[key];
            }
          }
        }

        return undefined;
      },

      // Get result by node ID
      getByNodeId: (nodeId: any) => {
        if (!flowResults.nodeResults || !flowResults.nodeResults[nodeId]) {
          return undefined;
        }

        const nodeResult = flowResults.nodeResults[nodeId];

        // CRITICAL FIX: For loop-over-items nodes, return the current batch item (not final result)
        // This allows email nodes inside loops to access the current item being processed
        if (nodeResult.nodeType === 'loop-over-items' || nodeResult.nodeType === 'loopOverItems') {
          // CRITICAL: Always return the data property, which contains the current batch item
          // This is updated during each loop iteration
          if (nodeResult.data !== undefined && nodeResult.data !== null) {
            // If it's an array with one item, return that item (most common case)
            if (Array.isArray(nodeResult.data) && nodeResult.data.length === 1) {
              return nodeResult.data[0];
            }
            // If it's already a primitive (string/number), return it directly
            if (typeof nodeResult.data !== 'object' || nodeResult.data === null) {
              return nodeResult.data;
            }
            // Otherwise return the data as-is
            return nodeResult.data;
          }
          // FALLBACK 1: If data is not set, try to use currentItem from flowResults
          if (flowResults.currentItem !== undefined && flowResults.currentItem !== null) {
            return flowResults.currentItem;
          }
          // FALLBACK 2: Try to get from currentBatch if available
          if (flowResults.currentBatch !== undefined && flowResults.currentBatch !== null) {
            if (Array.isArray(flowResults.currentBatch) && flowResults.currentBatch.length === 1) {
              return flowResults.currentBatch[0];
            }
            if (typeof flowResults.currentBatch !== 'object' || flowResults.currentBatch === null) {
              return flowResults.currentBatch;
            }
          }
          // FALLBACK 3: Try to get from flowResults using the loop node ID as a key
          if (flowResults[nodeId] !== undefined && flowResults[nodeId] !== null) {
            const value = flowResults[nodeId];
            if (typeof value !== 'object' || value === null) {
              return value;
            }
          }
          return undefined;
        }

        // For form nodes, return the data object which contains all form fields
        // This allows accessing specific fields like: dataFlow.getByNodeId("form-123").name
        if (nodeResult.nodeType === 'form' && nodeResult.data) {
          return nodeResult.data;
        }

        // CRITICAL FIX: For button nodes, return the buttonId for HTTP URL construction
        // This allows HTTP nodes to use {{dataFlow.getByNodeId("button-1761322615789")}} in URLs
        if (nodeResult.nodeType === 'button' && nodeResult.data && nodeResult.data.buttonId) {
          return nodeResult.data.buttonId;
        }

        // CRITICAL FIX: For conditional nodes, return the conditionResult as string for chaining
        // This allows subsequent condition nodes to properly reference previous condition results
        if (nodeResult.nodeType === 'if-conditional' && nodeResult.data && nodeResult.data.conditionResult !== undefined) {
          return String(nodeResult.data.conditionResult);
        }

        // CRITICAL FIX: For input nodes, return the actual user-provided value when possible
        if (nodeResult.nodeType === 'input' && nodeResult.data) {
          try {
            if (typeof nodeResult.data.get === 'function') {
              const inputValue = nodeResult.data.get();
              if (inputValue !== undefined && inputValue !== null) {
                return inputValue;
              }
            }
          } catch (error) {
            console.warn('dataFlow.getByNodeId input get() failed:', error);
          }

          if (nodeResult.data.currentValue !== undefined) {
            return nodeResult.data.currentValue;
          }

          if (nodeResult.data.value !== undefined) {
            return nodeResult.data.value;
          }
        }

        // CRITICAL FIX: For dropdown nodes, return the selected value directly
        // Dropdown values are stored as primitives in nodeResult.data
        if (nodeResult.nodeType === 'dropdown') {
          // First, check if data is already a primitive value (most common case)
          if (nodeResult.data !== undefined && nodeResult.data !== null) {
            // If it's already a primitive (string/number/boolean), return it directly
            if (typeof nodeResult.data !== 'object' || nodeResult.data === null) {
              return nodeResult.data;
            }
            // If it's an object, try to extract the value property
            if (typeof nodeResult.data === 'object') {
              const value = nodeResult.data.value || nodeResult.data.selectedValue || nodeResult.data.currentValue;
              if (value !== undefined && value !== null) {
                return value;
              }
            }
          }
          
          // FALLBACK: Try to get value from DOM element if not in flowResults
          // This handles cases where the dropdown flow hasn't executed yet
          try {
            if (typeof window !== 'undefined' && typeof document !== 'undefined') {
              // Try to find the dropdown element by component ID or node ID
              const config = nodeResult.config || {};
              const componentId = config.componentId || config.dropdownId || 'Not set';
              let element = document.querySelector(`[data-component-id="${componentId}"]`) as HTMLSelectElement;
              if (!element && componentId !== 'Not set') {
                element = document.getElementById(componentId) as HTMLSelectElement;
              }
              // Try alternative selectors
              if (!element) {
                element = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLSelectElement;
              }
              if (!element) {
                // Try to find by dropdown name
                const dropdownName = config.dropdownName || config.name;
                if (dropdownName) {
                  element = document.querySelector(`select[name="${dropdownName}"]`) as HTMLSelectElement;
                }
              }
              
              if (element && element.value && element.value !== '' && element.value !== 'Select Image URL') {
                console.log(`✅ [getByNodeId] Retrieved dropdown value from DOM: ${element.value}`);
                return element.value;
              }
            }
          } catch (error) {
            console.warn(`⚠️ [getByNodeId] Error retrieving dropdown value from DOM for ${nodeId}:`, error);
          }
          
          // Last resort: return the data as-is (might be undefined if dropdown hasn't executed)
          return nodeResult.data;
        }

        // Default: return the data property of the node
        return nodeResult.data;
      },

      // Get all variables of a specific type
      getByType: (nodeType: any) => {
        const results = [];
        for (const [nodeId, result] of Object.entries(flowResults.nodeResults || {})) {
          if ((result as any).nodeType === nodeType) {
            results.push((result as any).data);
          }
        }
        return results;
      },

      // Get last N results
      getLast: (n: any = 1) => {
        const allResults = Object.values(flowResults.nodeResults || {})
          .sort((a: any, b: any) => (b as any).stepNumber - (a as any).stepNumber);
        return n === 1 ? (allResults[0] as any)?.data : allResults.slice(0, n).map((r: any) => (r as any).data);
      },

      // Get all available variable names
      getAvailableNames: () => {
        const names = [];

        // Add from specialized collections
        if (flowResults.variables) names.push(...Object.keys(flowResults.variables));
        if (flowResults.inputs) names.push(...Object.keys(flowResults.inputs));
        if (flowResults.formData) names.push(...Object.keys(flowResults.formData));
        if (flowResults.inboundEmailData) names.push(...Object.keys(flowResults.inboundEmailData));
        if (flowResults.apiResponses) names.push(...Object.keys(flowResults.apiResponses));
        if (flowResults.calculations) names.push(...Object.keys(flowResults.calculations));
        if (flowResults.aiResponses) names.push(...Object.keys(flowResults.aiResponses));

        // Add display names
        for (const result of Object.values(flowResults.nodeResults || {})) {
          names.push((result as any).displayName);
        }

        // Convert Set to Array to avoid iteration issues
        const uniqueNames = new Set(names);
        const uniqueArray: string[] = [];
        uniqueNames.forEach(name => uniqueArray.push(name));
        return uniqueArray.sort();
      },
       // Get field by name - checks variables, flowResults, and input nodes
     getByFieldName: (fieldName: any) => {
        const fieldParts = String(fieldName).split('.');
        const baseFieldName = fieldParts[0];
        const nestedPath = fieldParts.slice(1);
        // Helper function to get nested property from an object
        const getNestedProperty = (obj: any, path: string[]): any => {
          if (!obj || path.length === 0) return obj;
          let current = obj;
          for (const prop of path) {
            if (current === null || current === undefined) return current; // Return null/undefined if encountered
            current = current[prop];
          }
          return current;
        };
        // Helper function to check if a value exists (including null)
        const hasValue = (value: any): boolean => {
          return value !== undefined; // null is a valid value, only undefined means "not found"
        };
        
        // CRITICAL FIX: Handle form.fieldName pattern (e.g., form.email, form.password)
        // This is the most common pattern in authentication flows
        if (baseFieldName === 'form' && nestedPath.length > 0) {
          const formFieldName = nestedPath[0];
          // Check flowResults.form[fieldName] first
          if (flowResults.form && hasValue(flowResults.form[formFieldName])) {
            const value = flowResults.form[formFieldName];
            if (nestedPath.length > 1) {
              const nestedValue = getNestedProperty(value, nestedPath.slice(1));
              if (hasValue(nestedValue)) {
                return nestedValue;
              }
            } else {
              return value;
            }
          }
          // Fallback to flowResults.formData[fieldName]
          if (flowResults.formData && hasValue(flowResults.formData[formFieldName])) {
            const value = flowResults.formData[formFieldName];
            if (nestedPath.length > 1) {
              const nestedValue = getNestedProperty(value, nestedPath.slice(1));
              if (hasValue(nestedValue)) {
                return nestedValue;
              }
            } else {
              return value;
            }
          }
          // Fallback to top-level flowResults[fieldName] (for normalized field names)
          if (hasValue(flowResults[formFieldName])) {
            const value = flowResults[formFieldName];
            if (nestedPath.length > 1) {
              const nestedValue = getNestedProperty(value, nestedPath.slice(1));
              if (hasValue(nestedValue)) {
                return nestedValue;
              }
            } else {
              return value;
            }
          }
        }
        
        // First check variables (for Telegram inbound, email inbound, etc.)
          if (flowResults.variables && hasValue(flowResults.variables[baseFieldName])) {
          const value = flowResults.variables[baseFieldName];
          if (nestedPath.length > 0) {
            const nestedValue = getNestedProperty(value, nestedPath);
            if (hasValue(nestedValue)) {
              return nestedValue; // Return null if that's what it is
            }
          } else {
            return value; // Return null if that's what it is
          }
        }
        // Check top-level flowResults
         if (hasValue(flowResults[baseFieldName])) {
          const value = flowResults[baseFieldName];
          if (nestedPath.length > 0) {
            const nestedValue = getNestedProperty(value, nestedPath);
            if (hasValue(nestedValue)) {
              return nestedValue; // Return null if that's what it is
            }
          } else {
            return value; // Return null if that's what it is
          }
        }
        // Check apiResponses (for API results like getPostResult)
        if (flowResults.apiResponses && hasValue(flowResults.apiResponses[baseFieldName])) {
          const value = flowResults.apiResponses[baseFieldName];
          if (nestedPath.length > 0) {
            const nestedValue = getNestedProperty(value, nestedPath);
            if (hasValue(nestedValue)) {
              return nestedValue; // Return null if that's what it is
            }
          } else {
            return value; // Return null if that's what it is
          }
        }
        // Check window.dataFlow (for Telegram inbound data stored globally)
       if (typeof window !== 'undefined' && (window as any).dataFlow && hasValue((window as any).dataFlow[baseFieldName])) {
          const value = (window as any).dataFlow[baseFieldName];
          if (nestedPath.length > 0) {
            const nestedValue = getNestedProperty(value, nestedPath);
            if (hasValue(nestedValue)) {
              return nestedValue; // Return null if that's what it is
            }
          } else {
            return value; // Return null if that's what it is
          }
        }
        // Check inputs collection
           if (flowResults.inputs && hasValue(flowResults.inputs[baseFieldName])) {
          const value = flowResults.inputs[baseFieldName];
          if (nestedPath.length > 0) {
            const nestedValue = getNestedProperty(value, nestedPath);
            if (hasValue(nestedValue)) {
              return nestedValue; // Return null if that's what it is
            }
          } else {
            return value; // Return null if that's what it is
          }
        }
        // Check formData
       if (flowResults.formData && hasValue(flowResults.formData[baseFieldName])) {
          const value = flowResults.formData[baseFieldName];
          if (nestedPath.length > 0) {
            const nestedValue = getNestedProperty(value, nestedPath);
            if (hasValue(nestedValue)) {
              return nestedValue; // Return null if that's what it is
            }
          } else {
            return value; // Return null if that's what it is
          }
        }
        // Check inboundEmailData
         if (flowResults.inboundEmailData && hasValue(flowResults.inboundEmailData[baseFieldName])) {
          const value = flowResults.inboundEmailData[baseFieldName];
          if (nestedPath.length > 0) {
            const nestedValue = getNestedProperty(value, nestedPath);
            if (hasValue(nestedValue)) {
              return nestedValue; // Return null if that's what it is
            }
          } else {
            return value; // Return null if that's what it is
          }
        }
        // Fallback: Search for input nodes (existing behavior)
        if (flowResults.nodeResults) {
          for (const [nodeId, nodeResult] of Object.entries(flowResults.nodeResults)) {
            if ((nodeResult as any).nodeType === 'input') {
              const inputData = (nodeResult as any).data;
              // Check inputName from config
              if (inputData && typeof inputData === 'object') {
                const inputName = inputData.inputName || inputData.name || inputData.fieldName;
                if (inputName && inputName.toLowerCase() === String(baseFieldName).toLowerCase()) {
                  if (inputData.inputHandler) {
                    try {
                      const currentValue = inputData.inputHandler.get();
                      if (nestedPath.length > 0) {
                        const nestedValue = getNestedProperty(currentValue, nestedPath);
                        if (hasValue(nestedValue)) {
                          return nestedValue; // Return null if that's what it is
                        }
                      } else {
                        return currentValue; // Return null if that's what it is
                      }
                    } catch (error) {
                      console.warn('[WARNING] Error getting input value:', error);
                    }
                  }
                }
              }
            }
          }
        }
        console.warn(':warning: Field not found:', fieldName);
        return undefined;
      }
    };

    // Make dataFlow available globally for this execution
    if (typeof window !== 'undefined') {
      (window as any).dataFlow = dataFlow;
      const existingDataFlow = (window as any).dataFlow || {};
      // Merge existing data with new dataFlow methods
      (window as any).dataFlow = {
        ...existingDataFlow,  // Preserve existing data (video-gen, image-gen results)
        ...dataFlow            // Add new dataFlow methods (getByNodeId, current, previous, etc.)
      };
      (window as any).getPreviousResult = dataFlow.previous;
      (window as any).getFlowResult = dataFlow.get;
      (window as any).getAllFlowResults = dataFlow.getAvailableNames;
    }
    
    // SECURITY: Store sanitized chain data for field resolution
    flowResults.originalChainData = {"id":"flow_whatsapp-trigger-1770013817891_1771079854994","nodes":[{"id":"whatsapp-trigger-1770013817891","nodeType":"whatsapp-trigger","config":{"label":{"key":null,"ref":null,"type":"div","props":{"children":[{"key":null,"ref":null,"type":"div","props":{"children":"WhatsApp Trigger"},"_owner":null,"_store":{}},{"key":null,"ref":null,"type":"div","props":{"data-node-id":"whatsapp-trigger-1770013817891"},"_owner":null,"_store":{}}],"className":"relative p-2"},"_owner":null,"_store":{}},"webhookUrl":"https://devapp.simplita.in/webhook/whatsapp/whatsapp-trigger-1770013817891","verifyToken":"whatsapp_whatsapp-trigger-1770013817891_hOXNtn2QVD5v7a84P1Z1HWgkAbk7A5L2","messageFilter":{"enabled":false},"phoneNumberId":"","subscribedFields":{"messages":true,"message_status":false,"phone_number_name":false,"account_review_update":false},"whatsappBusinessAccountId":""}},{"id":"openaiAgentSDKNode-1770013824184","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"OpenAI Agent","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770014049164","url":"https://supabase-crud.simplita.ai/mcp","name":"Supabase","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770014052268","url":"https://newgooglecalendar-czvc54.simplita.ai/mcp","name":"Calendar","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"{{whatsappMessageBody}}\n{{whatsappMessageFrom}}","agentSDKType":"orchestrator","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are an AI Agent for Vitality Research Centre, and you must operate using both MCP tools as a single assistant.\n:warning: MANDATORY TOOL EXECUTION ORDER\nYou MUST execute the CRUD MCP tool first to store the name and phonenumber, and then execute the Calendar MCP tool — this is compulsory.\n:receipt: CHAT HISTORY SAVING RULE (CRITICAL — MUST EXECUTE FOR EVERY MESSAGE)\nFor EVERY user message and EVERY AI response, you MUST save the conversation to the chat_history column in the \"crudsupabase\" table.\nThis is MANDATORY and must happen for EVERY conversation exchange — it must NEVER be skipped.\nCRITICAL 3-STEP PROCESS (MUST FOLLOW EXACTLY):\nFor EACH user message:\nSTEP 1: FIRST — Read existing chat_history\n  → Call supabase-crud → read/select → Find record where phonenumber = {{whatsappMessageFrom}} → Get the existing chat_history value (if it exists, otherwise use empty string \"\")\nSTEP 2: SECOND — Append to existing history\n  → Take the existing chat_history value you just read\n  → Append \"\\nUser: <exact user message>\" to it\n  → Create new value: existing_chat_history + \"\\nUser: <exact user message>\"\nSTEP 3: THIRD — Save complete updated history\n  → Call supabase-crud → update → Find record where phonenumber = {{whatsappMessageFrom}} → Set chat_history = the new value from STEP 2 (which includes ALL previous conversations + new user message)\nFor EACH AI response:\nSTEP 1: FIRST — Read existing chat_history\n  → Call supabase-crud → read/select → Find record where phonenumber = {{whatsappMessageFrom}} → Get the existing chat_history value (it should already contain previous conversations including the user message you just saved)\nSTEP 2: SECOND — Append to existing history\n  → Take the existing chat_history value you just read\n  → Append \"\\nAI: <your exact response>\" to it\n  → Create new value: existing_chat_history + \"\\nAI: <your exact response>\"\nSTEP 3: THIRD — Save complete updated history\n  → Call supabase-crud → update → Find record where phonenumber = {{whatsappMessageFrom}} → Set chat_history = the new value from STEP 2 (which includes ALL previous conversations + new AI response)\nCRITICAL REQUIREMENTS:\n- You MUST ALWAYS read the existing chat_history FIRST before updating (STEP 1 is mandatory)\n- You MUST preserve ALL previous conversations — never replace, always append\n- The final chat_history should contain ALL conversation exchanges from the very beginning in chronological order\n- Format example: \"User: hello\\nAI: hi there\\nUser: my name is kunju\\nAI: thanks kunju\\nUser: can you view details\\nAI: here are your details...\"\n- If the user doesn't exist yet, create the record first with name and phonenumber, then initialize chat_history with the first message\n- NEVER overwrite or replace existing chat_history — always read first, then append, then save\n:dart: ROLE & BEHAVIOR\nYour role is to reply to user queries.\nIf the user asks about the Vitality Research Centre or their weight reduction plans, you MUST explain the information simply and clearly and answer their related questions.\nYou must not mention or reveal that any information is being stored in a database.\nAfter explaining, politely ask the user to provide their name (this is important).\nIf the user does not provide their name → politely ask again for their name after addressing their queries.\nIf the user provides their name → proceed to store the name and phonenumber in the database using the MCP tool.\nOnce the name and phonenumber stored, Then use the calendar MCP tool to schedule in google calendar based on the details given.\nDo not respond unnecessarily to unrelated messages.\n:speech_balloon: ADDITIONAL USER HANDLING LOGIC\nUser can ask any questions like what is orientation call or etc etc etc, and the steps should continue normally as per the flow above.\nIf the user uses any greeting terms like hi, hello, hey, or asks anything like \"can I reschedule my call\" or \"can I view my details again,\" then you must check with the phonenumber we already have and the details stored in Supabase.\nCase A — Existing User\nIf the phonenumber {{whatsappMessageFrom}} already exists in Supabase, reply:\n\"Looks like you're already registered with us, {{name}}. Would you like to view your details or reschedule your orientation call?\"\nCase B — New User\nIf the user does not exist in Supabase, then insert into crudsupabase:\nname = user's name\nphonenumber = {{whatsappMessageFrom}}\nThen respond:\n\"Thanks for contacting us, {{name}}. At what date and time can we schedule your orientation call to share more details about the plans?\"\nThen continue the same workflow as already defined.\n:file_cabinet: DATA STORAGE VIA CRUD MCP TOOL\nYou are also a data management assistant.\nYour task is to interact with the Supabase database using the supabase-crud tool.\n:gear: MANDATORY ACTIONS\nYou MUST call the supabase-crud function to perform all database operations.\nYou MUST extract the name from the user's conversation message.\nYou MUST extract the phonenumber from the variable {{whatsappMessageFrom}}.\nYou MUST read all the data in supabase, if the phonenumber from {{whatsappMessageFrom}} already exist, you should NOT create the current data in supabase.\nCRITICAL — CHAT HISTORY SAVING:\nYou MUST save chat history for EVERY conversation exchange using this EXACT 3-STEP PROCESS:\nFor EACH user message:\n1. FIRST: Call supabase-crud → read → Find record where phonenumber = {{whatsappMessageFrom}} → READ existing chat_history value\n2. SECOND: Append \"\\nUser: <user message>\" to the existing chat_history you just read\n3. THIRD: Call supabase-crud → update → Find record where phonenumber = {{whatsappMessageFrom}} → Set chat_history = existing_chat_history + \"\\nUser: <user message>\"\nFor EACH AI response:\n1. FIRST: Call supabase-crud → read → Find record where phonenumber = {{whatsappMessageFrom}} → READ existing chat_history value\n2. SECOND: Append \"\\nAI: <your response>\" to the existing chat_history you just read\n3. THIRD: Call supabase-crud → update → Find record where phonenumber = {{whatsappMessageFrom}} → Set chat_history = existing_chat_history + \"\\nAI: <your response>\"\nCRITICAL: You MUST read existing chat_history FIRST (STEP 1) before updating. The chat_history column must contain ALL conversations from the beginning. Each new message must be APPENDED to existing chat_history (read first, then append, then save). NEVER replace existing chat_history — always preserve all previous conversations. This is MANDATORY for every message exchange.\n:clipboard: TABLE DETAILS\nCRITICAL: The table name is \"crudsupabase\" — you MUST always specify this exact table name when calling the supabase-crud function. Never use \"users\" or any other table name. Always use \"crudsupabase\" as the table name parameter.\nTable name: crudsupabase\n:wrench: SUPPORTED OPERATIONS\nInsert/Create: Add new records to the \"crudsupabase\" table\nUpdate: Modify existing records in the \"crudsupabase\" table (based on matching name or ID)\nDelete: Remove records from the \"crudsupabase\" table (based on a condition)\nRead/Select: Retrieve records or fetch all data from the \"crudsupabase\" table\n:rocket: EXECUTION RULE\nYou must execute the insert operation immediately by calling the supabase-crud function with table name \"crudsupabase\" — do not just acknowledge it.\nIf the user requests another operation (update, delete, or select), perform that specific operation on the \"crudsupabase\" table accordingly.\nREMINDER: For EVERY user message and EVERY AI response, you MUST follow the 3-STEP PROCESS: (1) FIRST read existing chat_history from \"crudsupabase\" table for phonenumber = {{whatsappMessageFrom}}, (2) SECOND append the new message to the existing chat_history (preserving ALL previous conversations), (3) THIRD save the complete updated chat_history back to \"crudsupabase\" table. NEVER replace existing chat_history — always read first, then append, then save. This ensures ALL conversations from the beginning are preserved. This is non-negotiable and must happen for every single message exchange.\n:speech_balloon: RESPONSE RULE\nAfter successfully storing the data, do not send or mention any message such as \"data stored\" or \"saved in the database.\"\nInstead, reply to any user queries and then send the following message:\n\"Thanks for contacting us. Our doctors will contact you as soon as possible. At what date and time can we schedule an Orientation call to share the details regarding the plans.\"\n:date: VIA CALENDAR MCP TOOL\nAfter asking the question regarding the date and time for call, then execute calendar MCP tool.\nThis tool should execute only after the CRUD MCP tool has been executed.\nYou will recieve date and time in this format:\nDate: {{date}}\nTime: {{time}}\n:scales: CONDITIONAL LOGIC — SLOT AVAILABILITY CHECK (Before Scheduling the Event)\nBefore creating the event in Google Calendar, you MUST check whether the requested date and time slot is already booked.\nSteps to follow:\nRetrieve all existing events from the configured Google Calendar (calendar_id).\nCompare the user's requested date and time with the existing scheduled events.\nIf the requested slot is already booked, reply to the user:\n\"The selected slot ({{date}} at {{time}}) is already booked. Would you like to reschedule to another available time?\"\nThen, calculate and display the next two available slots, each separated by 30 minutes, in the same day or the next available day. Example:\n\"Here are the next available time slots you can choose from:\n7:30 AM\n8:00 AM\"\nIf the user selects one of the available slots, update the selected date and time accordingly, and then proceed to create the event in Google Calendar.\nIf the requested slot is not booked, directly schedule the event in Google Calendar as per the existing flow.\nYou MUST extract the date and time in am or pm of event schedule from the conversation and create the event in google calendar.\nDefault calendar_id: c51c958ccfdffb580ee5ad1e69dbab503e6331e53459e60187faa2626f0439f4@group.calendar.google.com. Never use \"primary\". If the user provides a different calendar_id, use that instead and store it as the session default.\nDefault timezone: Asia/Kolkata unless the user specifies another IANA timezone. Interpret natural-language dates/times in the active timezone.\nYou MUST schedule the event in Google Calendar with the following details:\nSummary: Orientation Call - {{name}} (the name of the user which should be retrieved from Supabase \"crudsupabase\" table) - {{whatsappMessageFrom}} (the phonenumber of the user which should be retrieved from Supabase \"crudsupabase\" table)\nDescription: Call to share the details regarding the plans\nDate: You MUST extract the date from the chats\nTime: You MUST extract the time from the chats\nYou MUST extract the name from the user's input and include it in the calendar event.\nAfter creating event in calendar, then reply \"We will call you on scheduled time Please be available 10 minutes before the call — our doctor will be ready to begin your journey toward wellness.\"","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}},{"id":"whatsapp-business-1770013830209","nodeType":"whatsapp-business","config":{"apiKey":"","message":"{{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770013824184\")}}","mediaUrl":"","mediaType":"none","apiVersion":"v20.0","messageMode":"message","phoneNumber":"{{whatsappMessageFrom}}","credentialId":"26755c9c-eb1e-4b5c-8e8a-b14eca389dcd","templateName":"","templateText":"","phoneNumberId":"","templateLanguage":"en_US","businessAccountId":"","useStoredCredential":true}},{"id":"script-event-1771000297528","nodeType":"script-event","config":{"pageId":"page-1770985628551516","scriptId":"043f403a-ae56-4687-b921-5b2efd2815ac","elementId":"component-1770985632248-4126","eventType":"onLoad","scriptKey":"page-1770985628551516::component-1770985632248-4126::onLoad::043f403a-ae56-4687-b921-5b2efd2815ac","scriptName":"chatbotvitality","actionValue":"newMessage","componentId":"component-1770985632248-4126","inputVariables":[{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}],"outputVariables":[{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"lastMessageTime","type":"object","source":"custom","description":"Output variable: lastMessageTime"},{"name":"messageCount","type":"object","source":"custom","description":"Output variable: messageCount"},{"name":"'result']","type":"object","source":"custom","description":"Variable: 'result']"},{"name":"'message'","type":"object","source":"custom","description":"Variable: 'message'"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"}],"inputVariableMappings":{"innerHTML":"{{whatsappMessageBody}}  {{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770013824184\")}}"}}}],"edges":[{"source":"whatsapp-trigger-1770013817891","target":"openaiAgentSDKNode-1770013824184"},{"source":"openaiAgentSDKNode-1770013824184","target":"whatsapp-business-1770013830209"},{"source":"whatsapp-business-1770013830209","target":"script-event-1771000297528"}],"chainType":"linear","dataFlow":[],"startNode":{"id":"whatsapp-trigger-1770013817891","nodeType":"whatsapp-trigger","config":{"label":{"key":null,"ref":null,"type":"div","props":{"children":[{"key":null,"ref":null,"type":"div","props":{"children":"WhatsApp Trigger"},"_owner":null,"_store":{}},{"key":null,"ref":null,"type":"div","props":{"data-node-id":"whatsapp-trigger-1770013817891"},"_owner":null,"_store":{}}],"className":"relative p-2"},"_owner":null,"_store":{}},"webhookUrl":"https://devapp.simplita.in/webhook/whatsapp/whatsapp-trigger-1770013817891","verifyToken":"whatsapp_whatsapp-trigger-1770013817891_hOXNtn2QVD5v7a84P1Z1HWgkAbk7A5L2","messageFilter":{"enabled":false},"phoneNumberId":"","subscribedFields":{"messages":true,"message_status":false,"phone_number_name":false,"account_review_update":false},"whatsappBusinessAccountId":""}},"endNode":{"id":"script-event-1771000297528","nodeType":"script-event","config":{"pageId":"page-1770985628551516","scriptId":"043f403a-ae56-4687-b921-5b2efd2815ac","elementId":"component-1770985632248-4126","eventType":"onLoad","scriptKey":"page-1770985628551516::component-1770985632248-4126::onLoad::043f403a-ae56-4687-b921-5b2efd2815ac","scriptName":"chatbotvitality","actionValue":"newMessage","componentId":"component-1770985632248-4126","inputVariables":[{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}],"outputVariables":[{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"lastMessageTime","type":"object","source":"custom","description":"Output variable: lastMessageTime"},{"name":"messageCount","type":"object","source":"custom","description":"Output variable: messageCount"},{"name":"'result']","type":"object","source":"custom","description":"Variable: 'result']"},{"name":"'message'","type":"object","source":"custom","description":"Variable: 'message'"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"}],"inputVariableMappings":{"innerHTML":"{{whatsappMessageBody}}  {{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770013824184\")}}"}}}};

    // Declare all step result variables
    let step1Result: any;
    let step2Result: any;
    let step3Result: any;
    let step4Result: any;



    // Initialize enhanced data flow system
    flowResults.nodeResults = {};
    flowResults.variables = {};
    flowResults.inputs = {};
    flowResults.apiResponses = {};
    flowResults.formData = {};
    flowResults.inboundEmailData = {};
    flowResults.calculations = {};
    flowResults.aiResponses = {};
    flowResults.authError = false;
    flowResults.lastAuthError = null;
    
    // Store original chain data for field resolution
    flowResults.originalChainData = {"id":"flow_whatsapp-trigger-1770013817891_1771079854994","nodes":[{"id":"whatsapp-trigger-1770013817891","nodeType":"whatsapp-trigger","config":{"label":{"key":null,"ref":null,"type":"div","props":{"children":[{"key":null,"ref":null,"type":"div","props":{"children":"WhatsApp Trigger"},"_owner":null,"_store":{}},{"key":null,"ref":null,"type":"div","props":{"data-node-id":"whatsapp-trigger-1770013817891"},"_owner":null,"_store":{}}],"className":"relative p-2"},"_owner":null,"_store":{}},"webhookUrl":"https://devapp.simplita.in/webhook/whatsapp/whatsapp-trigger-1770013817891","verifyToken":"whatsapp_whatsapp-trigger-1770013817891_hOXNtn2QVD5v7a84P1Z1HWgkAbk7A5L2","messageFilter":{"enabled":false},"phoneNumberId":"","subscribedFields":{"messages":true,"message_status":false,"phone_number_name":false,"account_review_update":false},"whatsappBusinessAccountId":""}},{"id":"openaiAgentSDKNode-1770013824184","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"OpenAI Agent","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770014049164","url":"https://supabase-crud.simplita.ai/mcp","name":"Supabase","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770014052268","url":"https://newgooglecalendar-czvc54.simplita.ai/mcp","name":"Calendar","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"{{whatsappMessageBody}}\n{{whatsappMessageFrom}}","agentSDKType":"orchestrator","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are an AI Agent for Vitality Research Centre, and you must operate using both MCP tools as a single assistant.\n:warning: MANDATORY TOOL EXECUTION ORDER\nYou MUST execute the CRUD MCP tool first to store the name and phonenumber, and then execute the Calendar MCP tool — this is compulsory.\n:receipt: CHAT HISTORY SAVING RULE (CRITICAL — MUST EXECUTE FOR EVERY MESSAGE)\nFor EVERY user message and EVERY AI response, you MUST save the conversation to the chat_history column in the \"crudsupabase\" table.\nThis is MANDATORY and must happen for EVERY conversation exchange — it must NEVER be skipped.\nCRITICAL 3-STEP PROCESS (MUST FOLLOW EXACTLY):\nFor EACH user message:\nSTEP 1: FIRST — Read existing chat_history\n  → Call supabase-crud → read/select → Find record where phonenumber = {{whatsappMessageFrom}} → Get the existing chat_history value (if it exists, otherwise use empty string \"\")\nSTEP 2: SECOND — Append to existing history\n  → Take the existing chat_history value you just read\n  → Append \"\\nUser: <exact user message>\" to it\n  → Create new value: existing_chat_history + \"\\nUser: <exact user message>\"\nSTEP 3: THIRD — Save complete updated history\n  → Call supabase-crud → update → Find record where phonenumber = {{whatsappMessageFrom}} → Set chat_history = the new value from STEP 2 (which includes ALL previous conversations + new user message)\nFor EACH AI response:\nSTEP 1: FIRST — Read existing chat_history\n  → Call supabase-crud → read/select → Find record where phonenumber = {{whatsappMessageFrom}} → Get the existing chat_history value (it should already contain previous conversations including the user message you just saved)\nSTEP 2: SECOND — Append to existing history\n  → Take the existing chat_history value you just read\n  → Append \"\\nAI: <your exact response>\" to it\n  → Create new value: existing_chat_history + \"\\nAI: <your exact response>\"\nSTEP 3: THIRD — Save complete updated history\n  → Call supabase-crud → update → Find record where phonenumber = {{whatsappMessageFrom}} → Set chat_history = the new value from STEP 2 (which includes ALL previous conversations + new AI response)\nCRITICAL REQUIREMENTS:\n- You MUST ALWAYS read the existing chat_history FIRST before updating (STEP 1 is mandatory)\n- You MUST preserve ALL previous conversations — never replace, always append\n- The final chat_history should contain ALL conversation exchanges from the very beginning in chronological order\n- Format example: \"User: hello\\nAI: hi there\\nUser: my name is kunju\\nAI: thanks kunju\\nUser: can you view details\\nAI: here are your details...\"\n- If the user doesn't exist yet, create the record first with name and phonenumber, then initialize chat_history with the first message\n- NEVER overwrite or replace existing chat_history — always read first, then append, then save\n:dart: ROLE & BEHAVIOR\nYour role is to reply to user queries.\nIf the user asks about the Vitality Research Centre or their weight reduction plans, you MUST explain the information simply and clearly and answer their related questions.\nYou must not mention or reveal that any information is being stored in a database.\nAfter explaining, politely ask the user to provide their name (this is important).\nIf the user does not provide their name → politely ask again for their name after addressing their queries.\nIf the user provides their name → proceed to store the name and phonenumber in the database using the MCP tool.\nOnce the name and phonenumber stored, Then use the calendar MCP tool to schedule in google calendar based on the details given.\nDo not respond unnecessarily to unrelated messages.\n:speech_balloon: ADDITIONAL USER HANDLING LOGIC\nUser can ask any questions like what is orientation call or etc etc etc, and the steps should continue normally as per the flow above.\nIf the user uses any greeting terms like hi, hello, hey, or asks anything like \"can I reschedule my call\" or \"can I view my details again,\" then you must check with the phonenumber we already have and the details stored in Supabase.\nCase A — Existing User\nIf the phonenumber {{whatsappMessageFrom}} already exists in Supabase, reply:\n\"Looks like you're already registered with us, {{name}}. Would you like to view your details or reschedule your orientation call?\"\nCase B — New User\nIf the user does not exist in Supabase, then insert into crudsupabase:\nname = user's name\nphonenumber = {{whatsappMessageFrom}}\nThen respond:\n\"Thanks for contacting us, {{name}}. At what date and time can we schedule your orientation call to share more details about the plans?\"\nThen continue the same workflow as already defined.\n:file_cabinet: DATA STORAGE VIA CRUD MCP TOOL\nYou are also a data management assistant.\nYour task is to interact with the Supabase database using the supabase-crud tool.\n:gear: MANDATORY ACTIONS\nYou MUST call the supabase-crud function to perform all database operations.\nYou MUST extract the name from the user's conversation message.\nYou MUST extract the phonenumber from the variable {{whatsappMessageFrom}}.\nYou MUST read all the data in supabase, if the phonenumber from {{whatsappMessageFrom}} already exist, you should NOT create the current data in supabase.\nCRITICAL — CHAT HISTORY SAVING:\nYou MUST save chat history for EVERY conversation exchange using this EXACT 3-STEP PROCESS:\nFor EACH user message:\n1. FIRST: Call supabase-crud → read → Find record where phonenumber = {{whatsappMessageFrom}} → READ existing chat_history value\n2. SECOND: Append \"\\nUser: <user message>\" to the existing chat_history you just read\n3. THIRD: Call supabase-crud → update → Find record where phonenumber = {{whatsappMessageFrom}} → Set chat_history = existing_chat_history + \"\\nUser: <user message>\"\nFor EACH AI response:\n1. FIRST: Call supabase-crud → read → Find record where phonenumber = {{whatsappMessageFrom}} → READ existing chat_history value\n2. SECOND: Append \"\\nAI: <your response>\" to the existing chat_history you just read\n3. THIRD: Call supabase-crud → update → Find record where phonenumber = {{whatsappMessageFrom}} → Set chat_history = existing_chat_history + \"\\nAI: <your response>\"\nCRITICAL: You MUST read existing chat_history FIRST (STEP 1) before updating. The chat_history column must contain ALL conversations from the beginning. Each new message must be APPENDED to existing chat_history (read first, then append, then save). NEVER replace existing chat_history — always preserve all previous conversations. This is MANDATORY for every message exchange.\n:clipboard: TABLE DETAILS\nCRITICAL: The table name is \"crudsupabase\" — you MUST always specify this exact table name when calling the supabase-crud function. Never use \"users\" or any other table name. Always use \"crudsupabase\" as the table name parameter.\nTable name: crudsupabase\n:wrench: SUPPORTED OPERATIONS\nInsert/Create: Add new records to the \"crudsupabase\" table\nUpdate: Modify existing records in the \"crudsupabase\" table (based on matching name or ID)\nDelete: Remove records from the \"crudsupabase\" table (based on a condition)\nRead/Select: Retrieve records or fetch all data from the \"crudsupabase\" table\n:rocket: EXECUTION RULE\nYou must execute the insert operation immediately by calling the supabase-crud function with table name \"crudsupabase\" — do not just acknowledge it.\nIf the user requests another operation (update, delete, or select), perform that specific operation on the \"crudsupabase\" table accordingly.\nREMINDER: For EVERY user message and EVERY AI response, you MUST follow the 3-STEP PROCESS: (1) FIRST read existing chat_history from \"crudsupabase\" table for phonenumber = {{whatsappMessageFrom}}, (2) SECOND append the new message to the existing chat_history (preserving ALL previous conversations), (3) THIRD save the complete updated chat_history back to \"crudsupabase\" table. NEVER replace existing chat_history — always read first, then append, then save. This ensures ALL conversations from the beginning are preserved. This is non-negotiable and must happen for every single message exchange.\n:speech_balloon: RESPONSE RULE\nAfter successfully storing the data, do not send or mention any message such as \"data stored\" or \"saved in the database.\"\nInstead, reply to any user queries and then send the following message:\n\"Thanks for contacting us. Our doctors will contact you as soon as possible. At what date and time can we schedule an Orientation call to share the details regarding the plans.\"\n:date: VIA CALENDAR MCP TOOL\nAfter asking the question regarding the date and time for call, then execute calendar MCP tool.\nThis tool should execute only after the CRUD MCP tool has been executed.\nYou will recieve date and time in this format:\nDate: {{date}}\nTime: {{time}}\n:scales: CONDITIONAL LOGIC — SLOT AVAILABILITY CHECK (Before Scheduling the Event)\nBefore creating the event in Google Calendar, you MUST check whether the requested date and time slot is already booked.\nSteps to follow:\nRetrieve all existing events from the configured Google Calendar (calendar_id).\nCompare the user's requested date and time with the existing scheduled events.\nIf the requested slot is already booked, reply to the user:\n\"The selected slot ({{date}} at {{time}}) is already booked. Would you like to reschedule to another available time?\"\nThen, calculate and display the next two available slots, each separated by 30 minutes, in the same day or the next available day. Example:\n\"Here are the next available time slots you can choose from:\n7:30 AM\n8:00 AM\"\nIf the user selects one of the available slots, update the selected date and time accordingly, and then proceed to create the event in Google Calendar.\nIf the requested slot is not booked, directly schedule the event in Google Calendar as per the existing flow.\nYou MUST extract the date and time in am or pm of event schedule from the conversation and create the event in google calendar.\nDefault calendar_id: c51c958ccfdffb580ee5ad1e69dbab503e6331e53459e60187faa2626f0439f4@group.calendar.google.com. Never use \"primary\". If the user provides a different calendar_id, use that instead and store it as the session default.\nDefault timezone: Asia/Kolkata unless the user specifies another IANA timezone. Interpret natural-language dates/times in the active timezone.\nYou MUST schedule the event in Google Calendar with the following details:\nSummary: Orientation Call - {{name}} (the name of the user which should be retrieved from Supabase \"crudsupabase\" table) - {{whatsappMessageFrom}} (the phonenumber of the user which should be retrieved from Supabase \"crudsupabase\" table)\nDescription: Call to share the details regarding the plans\nDate: You MUST extract the date from the chats\nTime: You MUST extract the time from the chats\nYou MUST extract the name from the user's input and include it in the calendar event.\nAfter creating event in calendar, then reply \"We will call you on scheduled time Please be available 10 minutes before the call — our doctor will be ready to begin your journey toward wellness.\"","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}},{"id":"whatsapp-business-1770013830209","nodeType":"whatsapp-business","config":{"apiKey":"","message":"{{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770013824184\")}}","mediaUrl":"","mediaType":"none","apiVersion":"v20.0","messageMode":"message","phoneNumber":"{{whatsappMessageFrom}}","credentialId":"26755c9c-eb1e-4b5c-8e8a-b14eca389dcd","templateName":"","templateText":"","phoneNumberId":"","templateLanguage":"en_US","businessAccountId":"","useStoredCredential":true}},{"id":"script-event-1771000297528","nodeType":"script-event","config":{"pageId":"page-1770985628551516","scriptId":"043f403a-ae56-4687-b921-5b2efd2815ac","elementId":"component-1770985632248-4126","eventType":"onLoad","scriptKey":"page-1770985628551516::component-1770985632248-4126::onLoad::043f403a-ae56-4687-b921-5b2efd2815ac","scriptName":"chatbotvitality","actionValue":"newMessage","componentId":"component-1770985632248-4126","inputVariables":[{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}],"outputVariables":[{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"lastMessageTime","type":"object","source":"custom","description":"Output variable: lastMessageTime"},{"name":"messageCount","type":"object","source":"custom","description":"Output variable: messageCount"},{"name":"'result']","type":"object","source":"custom","description":"Variable: 'result']"},{"name":"'message'","type":"object","source":"custom","description":"Variable: 'message'"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"}],"inputVariableMappings":{"innerHTML":"{{whatsappMessageBody}}  {{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770013824184\")}}"}}}],"edges":[{"source":"whatsapp-trigger-1770013817891","target":"openaiAgentSDKNode-1770013824184"},{"source":"openaiAgentSDKNode-1770013824184","target":"whatsapp-business-1770013830209"},{"source":"whatsapp-business-1770013830209","target":"script-event-1771000297528"}],"chainType":"linear","dataFlow":[],"startNode":{"id":"whatsapp-trigger-1770013817891","nodeType":"whatsapp-trigger","config":{"label":{"key":null,"ref":null,"type":"div","props":{"children":[{"key":null,"ref":null,"type":"div","props":{"children":"WhatsApp Trigger"},"_owner":null,"_store":{}},{"key":null,"ref":null,"type":"div","props":{"data-node-id":"whatsapp-trigger-1770013817891"},"_owner":null,"_store":{}}],"className":"relative p-2"},"_owner":null,"_store":{}},"webhookUrl":"https://devapp.simplita.in/webhook/whatsapp/whatsapp-trigger-1770013817891","verifyToken":"whatsapp_whatsapp-trigger-1770013817891_hOXNtn2QVD5v7a84P1Z1HWgkAbk7A5L2","messageFilter":{"enabled":false},"phoneNumberId":"","subscribedFields":{"messages":true,"message_status":false,"phone_number_name":false,"account_review_update":false},"whatsappBusinessAccountId":""}},"endNode":{"id":"script-event-1771000297528","nodeType":"script-event","config":{"pageId":"page-1770985628551516","scriptId":"043f403a-ae56-4687-b921-5b2efd2815ac","elementId":"component-1770985632248-4126","eventType":"onLoad","scriptKey":"page-1770985628551516::component-1770985632248-4126::onLoad::043f403a-ae56-4687-b921-5b2efd2815ac","scriptName":"chatbotvitality","actionValue":"newMessage","componentId":"component-1770985632248-4126","inputVariables":[{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}],"outputVariables":[{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"lastMessageTime","type":"object","source":"custom","description":"Output variable: lastMessageTime"},{"name":"messageCount","type":"object","source":"custom","description":"Output variable: messageCount"},{"name":"'result']","type":"object","source":"custom","description":"Variable: 'result']"},{"name":"'message'","type":"object","source":"custom","description":"Variable: 'message'"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"}],"inputVariableMappings":{"innerHTML":"{{whatsappMessageBody}}  {{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770013824184\")}}"}}}};
    
    if (typeof window !== 'undefined') {
      // SECURITY: Store SANITIZED workflow nodes in window context (remove API keys)
      // Sanitize each node individually to ensure all sensitive data is removed
      const sanitizedNodes = [{"id":"whatsapp-trigger-1770013817891","nodeType":"whatsapp-trigger","config":{"label":{"key":null,"ref":null,"type":"div","props":{"children":[{"key":null,"ref":null,"type":"div","props":{"children":"WhatsApp Trigger"},"_owner":null,"_store":{}},{"key":null,"ref":null,"type":"div","props":{"data-node-id":"whatsapp-trigger-1770013817891"},"_owner":null,"_store":{}}],"className":"relative p-2"},"_owner":null,"_store":{}},"webhookUrl":"https://devapp.simplita.in/webhook/whatsapp/whatsapp-trigger-1770013817891","verifyToken":"whatsapp_whatsapp-trigger-1770013817891_hOXNtn2QVD5v7a84P1Z1HWgkAbk7A5L2","messageFilter":{"enabled":false},"phoneNumberId":"","subscribedFields":{"messages":true,"message_status":false,"phone_number_name":false,"account_review_update":false},"whatsappBusinessAccountId":""}},{"id":"openaiAgentSDKNode-1770013824184","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"OpenAI Agent","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770014049164","url":"https://supabase-crud.simplita.ai/mcp","name":"Supabase","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770014052268","url":"https://newgooglecalendar-czvc54.simplita.ai/mcp","name":"Calendar","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"{{whatsappMessageBody}}\n{{whatsappMessageFrom}}","agentSDKType":"orchestrator","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are an AI Agent for Vitality Research Centre, and you must operate using both MCP tools as a single assistant.\n:warning: MANDATORY TOOL EXECUTION ORDER\nYou MUST execute the CRUD MCP tool first to store the name and phonenumber, and then execute the Calendar MCP tool — this is compulsory.\n:receipt: CHAT HISTORY SAVING RULE (CRITICAL — MUST EXECUTE FOR EVERY MESSAGE)\nFor EVERY user message and EVERY AI response, you MUST save the conversation to the chat_history column in the \"crudsupabase\" table.\nThis is MANDATORY and must happen for EVERY conversation exchange — it must NEVER be skipped.\nCRITICAL 3-STEP PROCESS (MUST FOLLOW EXACTLY):\nFor EACH user message:\nSTEP 1: FIRST — Read existing chat_history\n  → Call supabase-crud → read/select → Find record where phonenumber = {{whatsappMessageFrom}} → Get the existing chat_history value (if it exists, otherwise use empty string \"\")\nSTEP 2: SECOND — Append to existing history\n  → Take the existing chat_history value you just read\n  → Append \"\\nUser: <exact user message>\" to it\n  → Create new value: existing_chat_history + \"\\nUser: <exact user message>\"\nSTEP 3: THIRD — Save complete updated history\n  → Call supabase-crud → update → Find record where phonenumber = {{whatsappMessageFrom}} → Set chat_history = the new value from STEP 2 (which includes ALL previous conversations + new user message)\nFor EACH AI response:\nSTEP 1: FIRST — Read existing chat_history\n  → Call supabase-crud → read/select → Find record where phonenumber = {{whatsappMessageFrom}} → Get the existing chat_history value (it should already contain previous conversations including the user message you just saved)\nSTEP 2: SECOND — Append to existing history\n  → Take the existing chat_history value you just read\n  → Append \"\\nAI: <your exact response>\" to it\n  → Create new value: existing_chat_history + \"\\nAI: <your exact response>\"\nSTEP 3: THIRD — Save complete updated history\n  → Call supabase-crud → update → Find record where phonenumber = {{whatsappMessageFrom}} → Set chat_history = the new value from STEP 2 (which includes ALL previous conversations + new AI response)\nCRITICAL REQUIREMENTS:\n- You MUST ALWAYS read the existing chat_history FIRST before updating (STEP 1 is mandatory)\n- You MUST preserve ALL previous conversations — never replace, always append\n- The final chat_history should contain ALL conversation exchanges from the very beginning in chronological order\n- Format example: \"User: hello\\nAI: hi there\\nUser: my name is kunju\\nAI: thanks kunju\\nUser: can you view details\\nAI: here are your details...\"\n- If the user doesn't exist yet, create the record first with name and phonenumber, then initialize chat_history with the first message\n- NEVER overwrite or replace existing chat_history — always read first, then append, then save\n:dart: ROLE & BEHAVIOR\nYour role is to reply to user queries.\nIf the user asks about the Vitality Research Centre or their weight reduction plans, you MUST explain the information simply and clearly and answer their related questions.\nYou must not mention or reveal that any information is being stored in a database.\nAfter explaining, politely ask the user to provide their name (this is important).\nIf the user does not provide their name → politely ask again for their name after addressing their queries.\nIf the user provides their name → proceed to store the name and phonenumber in the database using the MCP tool.\nOnce the name and phonenumber stored, Then use the calendar MCP tool to schedule in google calendar based on the details given.\nDo not respond unnecessarily to unrelated messages.\n:speech_balloon: ADDITIONAL USER HANDLING LOGIC\nUser can ask any questions like what is orientation call or etc etc etc, and the steps should continue normally as per the flow above.\nIf the user uses any greeting terms like hi, hello, hey, or asks anything like \"can I reschedule my call\" or \"can I view my details again,\" then you must check with the phonenumber we already have and the details stored in Supabase.\nCase A — Existing User\nIf the phonenumber {{whatsappMessageFrom}} already exists in Supabase, reply:\n\"Looks like you're already registered with us, {{name}}. Would you like to view your details or reschedule your orientation call?\"\nCase B — New User\nIf the user does not exist in Supabase, then insert into crudsupabase:\nname = user's name\nphonenumber = {{whatsappMessageFrom}}\nThen respond:\n\"Thanks for contacting us, {{name}}. At what date and time can we schedule your orientation call to share more details about the plans?\"\nThen continue the same workflow as already defined.\n:file_cabinet: DATA STORAGE VIA CRUD MCP TOOL\nYou are also a data management assistant.\nYour task is to interact with the Supabase database using the supabase-crud tool.\n:gear: MANDATORY ACTIONS\nYou MUST call the supabase-crud function to perform all database operations.\nYou MUST extract the name from the user's conversation message.\nYou MUST extract the phonenumber from the variable {{whatsappMessageFrom}}.\nYou MUST read all the data in supabase, if the phonenumber from {{whatsappMessageFrom}} already exist, you should NOT create the current data in supabase.\nCRITICAL — CHAT HISTORY SAVING:\nYou MUST save chat history for EVERY conversation exchange using this EXACT 3-STEP PROCESS:\nFor EACH user message:\n1. FIRST: Call supabase-crud → read → Find record where phonenumber = {{whatsappMessageFrom}} → READ existing chat_history value\n2. SECOND: Append \"\\nUser: <user message>\" to the existing chat_history you just read\n3. THIRD: Call supabase-crud → update → Find record where phonenumber = {{whatsappMessageFrom}} → Set chat_history = existing_chat_history + \"\\nUser: <user message>\"\nFor EACH AI response:\n1. FIRST: Call supabase-crud → read → Find record where phonenumber = {{whatsappMessageFrom}} → READ existing chat_history value\n2. SECOND: Append \"\\nAI: <your response>\" to the existing chat_history you just read\n3. THIRD: Call supabase-crud → update → Find record where phonenumber = {{whatsappMessageFrom}} → Set chat_history = existing_chat_history + \"\\nAI: <your response>\"\nCRITICAL: You MUST read existing chat_history FIRST (STEP 1) before updating. The chat_history column must contain ALL conversations from the beginning. Each new message must be APPENDED to existing chat_history (read first, then append, then save). NEVER replace existing chat_history — always preserve all previous conversations. This is MANDATORY for every message exchange.\n:clipboard: TABLE DETAILS\nCRITICAL: The table name is \"crudsupabase\" — you MUST always specify this exact table name when calling the supabase-crud function. Never use \"users\" or any other table name. Always use \"crudsupabase\" as the table name parameter.\nTable name: crudsupabase\n:wrench: SUPPORTED OPERATIONS\nInsert/Create: Add new records to the \"crudsupabase\" table\nUpdate: Modify existing records in the \"crudsupabase\" table (based on matching name or ID)\nDelete: Remove records from the \"crudsupabase\" table (based on a condition)\nRead/Select: Retrieve records or fetch all data from the \"crudsupabase\" table\n:rocket: EXECUTION RULE\nYou must execute the insert operation immediately by calling the supabase-crud function with table name \"crudsupabase\" — do not just acknowledge it.\nIf the user requests another operation (update, delete, or select), perform that specific operation on the \"crudsupabase\" table accordingly.\nREMINDER: For EVERY user message and EVERY AI response, you MUST follow the 3-STEP PROCESS: (1) FIRST read existing chat_history from \"crudsupabase\" table for phonenumber = {{whatsappMessageFrom}}, (2) SECOND append the new message to the existing chat_history (preserving ALL previous conversations), (3) THIRD save the complete updated chat_history back to \"crudsupabase\" table. NEVER replace existing chat_history — always read first, then append, then save. This ensures ALL conversations from the beginning are preserved. This is non-negotiable and must happen for every single message exchange.\n:speech_balloon: RESPONSE RULE\nAfter successfully storing the data, do not send or mention any message such as \"data stored\" or \"saved in the database.\"\nInstead, reply to any user queries and then send the following message:\n\"Thanks for contacting us. Our doctors will contact you as soon as possible. At what date and time can we schedule an Orientation call to share the details regarding the plans.\"\n:date: VIA CALENDAR MCP TOOL\nAfter asking the question regarding the date and time for call, then execute calendar MCP tool.\nThis tool should execute only after the CRUD MCP tool has been executed.\nYou will recieve date and time in this format:\nDate: {{date}}\nTime: {{time}}\n:scales: CONDITIONAL LOGIC — SLOT AVAILABILITY CHECK (Before Scheduling the Event)\nBefore creating the event in Google Calendar, you MUST check whether the requested date and time slot is already booked.\nSteps to follow:\nRetrieve all existing events from the configured Google Calendar (calendar_id).\nCompare the user's requested date and time with the existing scheduled events.\nIf the requested slot is already booked, reply to the user:\n\"The selected slot ({{date}} at {{time}}) is already booked. Would you like to reschedule to another available time?\"\nThen, calculate and display the next two available slots, each separated by 30 minutes, in the same day or the next available day. Example:\n\"Here are the next available time slots you can choose from:\n7:30 AM\n8:00 AM\"\nIf the user selects one of the available slots, update the selected date and time accordingly, and then proceed to create the event in Google Calendar.\nIf the requested slot is not booked, directly schedule the event in Google Calendar as per the existing flow.\nYou MUST extract the date and time in am or pm of event schedule from the conversation and create the event in google calendar.\nDefault calendar_id: c51c958ccfdffb580ee5ad1e69dbab503e6331e53459e60187faa2626f0439f4@group.calendar.google.com. Never use \"primary\". If the user provides a different calendar_id, use that instead and store it as the session default.\nDefault timezone: Asia/Kolkata unless the user specifies another IANA timezone. Interpret natural-language dates/times in the active timezone.\nYou MUST schedule the event in Google Calendar with the following details:\nSummary: Orientation Call - {{name}} (the name of the user which should be retrieved from Supabase \"crudsupabase\" table) - {{whatsappMessageFrom}} (the phonenumber of the user which should be retrieved from Supabase \"crudsupabase\" table)\nDescription: Call to share the details regarding the plans\nDate: You MUST extract the date from the chats\nTime: You MUST extract the time from the chats\nYou MUST extract the name from the user's input and include it in the calendar event.\nAfter creating event in calendar, then reply \"We will call you on scheduled time Please be available 10 minutes before the call — our doctor will be ready to begin your journey toward wellness.\"","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}},{"id":"whatsapp-business-1770013830209","nodeType":"whatsapp-business","config":{"apiKey":"","message":"{{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770013824184\")}}","mediaUrl":"","mediaType":"none","apiVersion":"v20.0","messageMode":"message","phoneNumber":"{{whatsappMessageFrom}}","credentialId":"26755c9c-eb1e-4b5c-8e8a-b14eca389dcd","templateName":"","templateText":"","phoneNumberId":"","templateLanguage":"en_US","businessAccountId":"","useStoredCredential":true}},{"id":"script-event-1771000297528","nodeType":"script-event","config":{"pageId":"page-1770985628551516","scriptId":"043f403a-ae56-4687-b921-5b2efd2815ac","elementId":"component-1770985632248-4126","eventType":"onLoad","scriptKey":"page-1770985628551516::component-1770985632248-4126::onLoad::043f403a-ae56-4687-b921-5b2efd2815ac","scriptName":"chatbotvitality","actionValue":"newMessage","componentId":"component-1770985632248-4126","inputVariables":[{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}],"outputVariables":[{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"lastMessageTime","type":"object","source":"custom","description":"Output variable: lastMessageTime"},{"name":"messageCount","type":"object","source":"custom","description":"Output variable: messageCount"},{"name":"'result']","type":"object","source":"custom","description":"Variable: 'result']"},{"name":"'message'","type":"object","source":"custom","description":"Variable: 'message'"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"}],"inputVariableMappings":{"innerHTML":"{{whatsappMessageBody}}  {{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770013824184\")}}"}}}];
      
      (window as any).__currentWorkflowNodes = sanitizedNodes;
      (window as any).__flowChainMetadata = {
        chainId: 'flow_whatsapp-trigger-1770013817891_1771079854994',
        currentChainNodes: sanitizedNodes,
        nodeCount: 4
      };
      console.log('🔗 Workflow nodes made available globally: 4 nodes');
    }
    
    // This allows the separate chain to access data from the main chain
    // CRITICAL FIX: Import cross-chain nodeResults (especially from interval triggers)
    // This allows downstream chains (like telegram) to access variable nodes from the interval chain
    if (initialData.crossChainNodeResults) {
      // ✅ PR FIX: Validate shape - must be object, not null, not array
      if (typeof initialData.crossChainNodeResults === 'object' && 
          initialData.crossChainNodeResults !== null &&
          !Array.isArray(initialData.crossChainNodeResults)) {
        console.log('🔗 Importing cross-chain node results for data access');
        flowResults.nodeResults = { ...flowResults.nodeResults, ...initialData.crossChainNodeResults };
        console.log('📋 Imported node results:', Object.keys(initialData.crossChainNodeResults));
      } else {
        console.warn('⚠️ Invalid crossChainNodeResults type - expected object, got:', typeof initialData.crossChainNodeResults);
      }
    }
    if (initialData.crossChainFormData) {
      console.log('🔗 Importing cross-chain form data');
      flowResults.formData = { ...flowResults.formData, ...initialData.crossChainFormData };
      // Also make form fields accessible at top level
      Object.entries(initialData.crossChainFormData).forEach(([key, value]) => {
        flowResults[key] = value;
      });
      console.log('📋 Imported form data:', Object.keys(initialData.crossChainFormData));
    }
    if (initialData.crossChainVariables) {
      flowResults.variables = { ...flowResults.variables, ...initialData.crossChainVariables };
    }
    if (initialData.crossChainApiResponses) {
      flowResults.apiResponses = { ...flowResults.apiResponses, ...initialData.crossChainApiResponses };
    }
    if (initialData.crossChainAiResponses) {
      flowResults.aiResponses = { ...flowResults.aiResponses, ...initialData.crossChainAiResponses };
    }
    if (initialData.crossChainInputs) {
      flowResults.inputs = { ...flowResults.inputs, ...initialData.crossChainInputs };
    }
    if (initialData.crossChainCalculations) {
      flowResults.calculations = { ...flowResults.calculations, ...initialData.crossChainCalculations };
    }
    
    if (initialData.inheritedData) {
      console.log('🔗 Importing inherited data structure');
      const inherited = initialData.inheritedData;
      
      // Merge all inherited collections
      if (inherited.nodeResults) {
        flowResults.nodeResults = { ...flowResults.nodeResults, ...inherited.nodeResults };
        console.log('📋 Inherited nodeResults:', Object.keys(inherited.nodeResults));
      }
      if (inherited.formData) {
        flowResults.formData = { ...flowResults.formData, ...inherited.formData };
        // Make form fields accessible at top level
        Object.entries(inherited.formData).forEach(([key, value]) => {
          flowResults[key] = value;
        });
      }
      if (inherited.variables) flowResults.variables = { ...flowResults.variables, ...inherited.variables };
      if (inherited.apiResponses) flowResults.apiResponses = { ...flowResults.apiResponses, ...inherited.apiResponses };
      if (inherited.aiResponses) flowResults.aiResponses = { ...flowResults.aiResponses, ...inherited.aiResponses };
      if (inherited.inputs) flowResults.inputs = { ...flowResults.inputs, ...inherited.inputs };
      if (inherited.calculations) flowResults.calculations = { ...flowResults.calculations, ...inherited.calculations };
      
      // Set current and previous results from inherited data
      if (inherited.currentResult !== undefined) {
        flowResults.currentResult = inherited.currentResult;
        currentResult = inherited.currentResult;
        console.log('📋 Using inherited currentResult:', currentResult);
      }
      if (inherited.previousResult !== undefined) {
        flowResults.previousResult = inherited.previousResult;
      }
    }
    
    if (typeof window !== 'undefined') {
      // Check for globally stored cross-chain data
      if ((window as any).mainChainFlowResults) {
        console.log('🌐 Found global main chain data, importing...');
        const mainChain = (window as any).mainChainFlowResults;
        
        // CRITICAL FIX: Import nodeResults when triggered by interval-trigger
        // This allows downstream chains (like telegram) to access variable nodes from the interval chain
        // Only import if this chain was triggered by an interval-trigger (not from previous executions)
        if (initialData.triggeredBy === 'interval-trigger' && initialData.crossChainNodeResults) {
          // ✅ PR FIX: Validate shape - must be object, not null, not array
          if (typeof initialData.crossChainNodeResults === 'object' && 
              initialData.crossChainNodeResults !== null &&
              !Array.isArray(initialData.crossChainNodeResults)) {
            const crossChainKeys = Object.keys(initialData.crossChainNodeResults);
            if (crossChainKeys.length > 0) {
              // ✅ PR FIX: Check for potential collisions before merging
              const existingKeys = Object.keys(flowResults.nodeResults || {});
              const collisionKeys = crossChainKeys.filter(key => existingKeys.includes(key));
              if (collisionKeys.length > 0) {
                console.warn(`⚠️ Node-ID collision detected: keys ${collisionKeys.join(', ')} exist in both chains. Cross-chain values will overwrite local values.`);
              }
              flowResults.nodeResults = { ...flowResults.nodeResults, ...initialData.crossChainNodeResults };
              console.log('📋 Imported cross-chain nodeResults from interval trigger:', crossChainKeys);
            }
          } else {
            console.warn(`⚠️ Invalid crossChainNodeResults type - expected object, got: ${typeof initialData.crossChainNodeResults}`);
          }
        }
        
        if (mainChain.formData && Object.keys(mainChain.formData).length > 0) {
          flowResults.formData = { ...flowResults.formData, ...mainChain.formData };
          Object.entries(mainChain.formData).forEach(([key, value]) => {
            flowResults[key] = value;
          });
          console.log('📋 Imported global formData:', Object.keys(mainChain.formData));
        }
        if (mainChain.variables) flowResults.variables = { ...flowResults.variables, ...mainChain.variables };
        if (mainChain.apiResponses) flowResults.apiResponses = { ...flowResults.apiResponses, ...mainChain.apiResponses };
        if (mainChain.aiResponses) flowResults.aiResponses = { ...flowResults.aiResponses, ...mainChain.aiResponses };
        
        // Use router data if current result is not set
        if (!currentResult && mainChain.routerData) {
          currentResult = mainChain.routerData;
          flowResults.currentResult = mainChain.routerData;
          console.log('📋 Using global router data as currentResult');
        }
      }
    }
    
    console.log('📊 Final flowResults after cross-chain import:', {
      nodeResults: Object.keys(flowResults.nodeResults || {}),
      formData: Object.keys(flowResults.formData || {}),
      variables: Object.keys(flowResults.variables || {}),
      currentResult: !!currentResult
    });
    
    // Process form data if provided in the initial data
    // This ensures form fields are properly extracted and normalized
    if (initialData && typeof initialData === 'object') {
      // CRITICAL FIX: Extract form data from initialData and create form object
      // This ensures form.email, form.password, etc. are accessible in conditions and HTTP nodes
      const extractedFormData: Record<string, any> = {};
      
      // Extract from initialData.formData if available
      if (initialData.formData && typeof initialData.formData === 'object') {
        Object.assign(extractedFormData, initialData.formData);
      }
      
      // Extract form-like fields from top-level initialData (skip metadata fields)
      // CRITICAL: This captures fields that page.tsx passes at the top level
      Object.keys(initialData).forEach(key => {
        if (!key.startsWith('_') && 
            key !== 'buttonId' && 
            key !== 'formId' && 
            key !== 'trigger' &&
            key !== 'clickTimestamp' &&
            key !== 'timestamp' &&
            key !== 'formData' &&
            key !== 'crossChainNodeResults' &&
            key !== 'crossChainFormData' &&
            key !== 'inheritedData') {
          const value = initialData[key];
          // Include simple values that look like form fields
          if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
            // CRITICAL FIX: Don't skip if the value already exists in extractedFormData
            // This ensures we capture all variants (Email, email, etc.)
            extractedFormData[key] = value;
          }
        }
      });
      
      console.log('📝 Extracted form data (raw):', extractedFormData);
      
      // Normalize field names to lowercase with underscores for form object
      // This handles cases where fields come as "Email", "Password" etc.
      const normalizedFormData: Record<string, any> = {};
      Object.keys(extractedFormData).forEach(key => {
        const value = extractedFormData[key];
        
        // Normalize: "Email" -> "email", "Confirm Password" -> "confirm_password"
        const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
        
        // Store with normalized key (this is what form.email, form.password will use)
        if (!normalizedFormData[normalizedKey] || normalizedKey === key) {
          // Prefer the already-normalized version if it exists
          normalizedFormData[normalizedKey] = value;
        }
        
        // Also keep original key for backward compatibility
        if (key !== normalizedKey) {
          normalizedFormData[key] = value;
        }
      });
      
      console.log('📝 Normalized form data:', normalizedFormData);
      
      // Create form object in flowResults for form.email, form.password access
      if (!flowResults.form) {
        flowResults.form = {};
      }
      Object.assign(flowResults.form, normalizedFormData);
      
      // Also store in formData collection
      if (!flowResults.formData) {
        flowResults.formData = {};
      }
      Object.assign(flowResults.formData, normalizedFormData);
      
      // Store at top level for direct access
      Object.keys(normalizedFormData).forEach(key => {
        if (!key.startsWith('_')) {
          flowResults[key] = normalizedFormData[key];
        }
      });
      
      console.log('📝 Form object created in flowResults.form:', flowResults.form);
      
      // Process inbound email data if provided in the initial data
      // This ensures email fields like subject, from, text are properly extracted and normalized
      if (initialData.subject || initialData.from || initialData.text || initialData.emailData) {
        console.log('📧 Processing inbound email data from initialData...');
        
        // Check if we have email data in a nested property
        if (initialData.emailData && typeof initialData.emailData === 'object') {
          flowResults.inboundEmailData = { ...initialData.emailData };
          
          // Also make email fields accessible at the top level for template variables
          Object.entries(initialData.emailData).forEach(([key, value]) => {
            if (!key.startsWith('_')) {
              flowResults[key] = value;
            }
          });
          
          console.log('📧 Extracted email data from initialData.emailData:', flowResults.inboundEmailData);
        }
        
        // Check for email-like data at the top level
        const topLevelEmailData: Record<string, any> = {};
        let hasEmailFields = false;
        
        // Common email field names to look for
        const emailFields = ['subject', 'from', 'to', 'text', 'body', 'html', 'sender', 'recipient', 'message_id', 'timestamp'];
        
        Object.entries(initialData).forEach(([key, value]) => {
          // Check if this is an email field (case-insensitive)
          const isEmailField = emailFields.some(field => 
            key.toLowerCase() === field.toLowerCase() || 
            key.toLowerCase().includes(field.toLowerCase())
          );
          
          if (isEmailField && value !== undefined && value !== null) {
            topLevelEmailData[key] = value;
            hasEmailFields = true;
          }
        });
        
        if (hasEmailFields) {
          // Store in inboundEmailData if not already set
          if (!flowResults.inboundEmailData || Object.keys(flowResults.inboundEmailData).length === 0) {
            flowResults.inboundEmailData = topLevelEmailData;
            console.log('📧 Extracted email-like data from top level:', topLevelEmailData);
          }
          
          // Also make email fields accessible at the top level for template variables
          Object.entries(topLevelEmailData).forEach(([key, value]) => {
            flowResults[key] = value;
          });
        }
      }
    }
    
    step1Result = currentResult;
    try {
      
    // WhatsApp Trigger Node: whatsapp-trigger-1770013817891
    
    step1Result = {};
    
    try {
      const incomingWhatsappData: any = null;
      // WhatsApp trigger data comes from webhook - check if we have data
      if (incomingWhatsappData && typeof incomingWhatsappData === 'object') {
        
        // Store WhatsApp data in flow results for template variable access
        if (typeof flowResults !== 'undefined') {
          
          // Store WhatsApp data at top level for template access

          if (incomingWhatsappData.whatsappMessageBody !== undefined) {
            flowResults.whatsappMessageBody = incomingWhatsappData.whatsappMessageBody;
            flowResults.messageBody = incomingWhatsappData.whatsappMessageBody;
          }
          if (incomingWhatsappData.whatsappMessageFrom !== undefined) {
            flowResults.whatsappMessageFrom = incomingWhatsappData.whatsappMessageFrom;
            flowResults.messageFrom = incomingWhatsappData.whatsappMessageFrom;
          }
          if (incomingWhatsappData.whatsappSenderName !== undefined) {
            flowResults.whatsappSenderName = incomingWhatsappData.whatsappSenderName;
            flowResults.senderName = incomingWhatsappData.whatsappSenderName;
          }
          if (incomingWhatsappData.whatsappSenderPhone !== undefined) {
            flowResults.whatsappSenderPhone = incomingWhatsappData.whatsappSenderPhone;
            flowResults.senderPhone = incomingWhatsappData.whatsappSenderPhone;
          }
          if (incomingWhatsappData.whatsappWebhookData !== undefined) {
            flowResults.whatsappWebhookData = incomingWhatsappData.whatsappWebhookData;
            flowResults.webhookData = incomingWhatsappData.whatsappWebhookData;
          }

          // Store in whatsappTriggerData collection
          flowResults.whatsappTriggerData = flowResults.whatsappTriggerData || {};
          Object.assign(flowResults.whatsappTriggerData, incomingWhatsappData);
          
          // Store in nodeResults for dataFlow.getByNodeId() access
          flowResults.nodeResults = flowResults.nodeResults || {};
          flowResults.nodeResults['whatsapp-trigger-1770013817891'] = {
            nodeType: 'whatsapp-trigger',
            data: incomingWhatsappData,
            stepNumber: Object.keys(flowResults.nodeResults).length + 1,
            displayName: 'whatsapp-trigger-1770013817891_whatsapp'
          };
          
        }
        
        // Also store in global dataFlow system if available
        if (typeof window !== 'undefined' && typeof window.dataFlow?.storeResult === 'function') {
          try {
            window.dataFlow.storeResult('whatsapp-trigger-1770013817891', incomingWhatsappData, 'whatsapp-trigger');
          } catch (error) {
            console.warn(' Failed to store WhatsApp trigger result in dataFlow:', error);
          }
        }
        
        step1Result = {
          nodeType: 'whatsapp-trigger',
          nodeId: 'whatsapp-trigger-1770013817891',
          data: incomingWhatsappData,
          success: true,
          message: 'WhatsApp trigger data processed successfully'
        };
        
      } else {
        
        // Set up WhatsApp webhook trigger function (similar to inbound email pattern)
        if (!window.triggerWhatsAppWorkflow) {
          window.triggerWhatsAppWorkflow = async function(whatsappData: Record<string, any>) {

            try {
              
              // Store WhatsApp data globally for workflow access (like inbound email does)
              if (typeof flowResults !== 'undefined') {
                // Store in WhatsApp data collection
                flowResults.whatsappData = flowResults.whatsappData || {};
                Object.assign(flowResults.whatsappData, whatsappData);
                
                // Store individual WhatsApp fields at top level for template access
                if (whatsappData.whatsappMessageBody) flowResults.whatsappMessageBody = whatsappData.whatsappMessageBody;
                if (whatsappData.whatsappMessageFrom) flowResults.whatsappMessageFrom = whatsappData.whatsappMessageFrom;
                if (whatsappData.whatsappSenderName) flowResults.whatsappSenderName = whatsappData.whatsappSenderName;
                if (whatsappData.whatsappSenderPhone) flowResults.whatsappSenderPhone = whatsappData.whatsappSenderPhone;
                if (whatsappData.whatsappMessageId) flowResults.whatsappMessageId = whatsappData.whatsappMessageId;
                if (whatsappData.whatsappWebhookData) flowResults.whatsappWebhookData = whatsappData.whatsappWebhookData;
                
                // Store in nodeResults for dataFlow.getByNodeId() access
                flowResults.nodeResults = flowResults.nodeResults || {};
                flowResults.nodeResults['whatsapp-trigger-1770013817891'] = {
                  nodeType: 'whatsapp-trigger',
                  data: whatsappData,
                  stepNumber: Object.keys(flowResults.nodeResults).length + 1,
                  displayName: 'whatsapp-trigger-1770013817891_whatsapp'
                };
              }
              
              // Execute the flow chain for this WhatsApp message using executeSpecificFlow
              if (typeof window !== 'undefined' && 
                  typeof window.executeSpecificFlow === 'function' && 
                  typeof window.getFlowChainInfo === 'function') {
                
                // Find the matching workflow for this WhatsApp trigger
                const flowChains = window.getFlowChainInfo();
                const matchingFlow = flowChains.find((chain: any) => 
                  chain.startNode?.nodeType === 'whatsapp-trigger' ||
                  chain.startNode?.id === 'whatsapp-trigger-1770013817891'
                );
                
                if (matchingFlow) {
                  await window.executeSpecificFlow(matchingFlow.id, whatsappData);
                } else {
                  console.warn(' No matching WhatsApp workflow found for node whatsapp-trigger-1770013817891');
                }
              } else {
                console.warn(' Flow integration functions are not available on window');
              }
              
            } catch (error: unknown) {
              console.error(' Failed to trigger WhatsApp workflow:', error);
            }
          };
        }
        
        // Set up global WhatsApp webhook data storage functions
        if (!window.getWhatsAppWebhookData) {
          window.getWhatsAppWebhookData = function(nodeId: string): Record<string, any> | null {
            // Try multiple sources for WhatsApp data
            const sources: Array<() => any> = [
              () => window.lastReceivedWhatsApp,
              () => window.latestWhatsAppData,
              () => window.whatsappData,
              () => {
                const globalScope = globalThis as typeof globalThis & { incomingWebhookData?: Record<string, any> };
                return globalScope.incomingWebhookData?.[nodeId];
              },
              () => window.sessionStorage?.getItem(`whatsapp_webhook_${nodeId}`)
            ];
            
            for (const source of sources) {
              try {
                const data = source();
                if (data) {
                  return typeof data === 'string' ? JSON.parse(data) : data;
                }
              } catch (e: unknown) {
                continue;
              }
            }
            
            return null;
          };
          
          window.setupWhatsAppWebhookData = function(nodeId: string, whatsappData: Record<string, any>) {
            if (typeof window !== 'undefined' && window.sessionStorage) {
              window.sessionStorage.setItem(`whatsapp_webhook_${nodeId}`, JSON.stringify(whatsappData));
            }
            
            if (typeof globalThis !== 'undefined') {
              const globalScope = globalThis as typeof globalThis & { incomingWebhookData?: Record<string, any> };
              globalScope.incomingWebhookData = globalScope.incomingWebhookData || {};
              globalScope.incomingWebhookData[nodeId] = whatsappData;
            }
            
            // Store as latest WhatsApp data
            window.latestWhatsAppData = whatsappData;
            window.lastReceivedWhatsApp = whatsappData;
          };
        }
        
        // Check for existing WhatsApp webhook data first
        const existingWhatsAppData = window.getWhatsAppWebhookData('whatsapp-trigger-1770013817891');
        
        if (existingWhatsAppData && Object.keys(existingWhatsAppData).length > 0) {
          
          // Store WhatsApp data in flow results for template access
          if (typeof flowResults !== 'undefined') {
            Object.assign(flowResults, existingWhatsAppData);
            
            flowResults.nodeResults = flowResults.nodeResults || {};
            flowResults.nodeResults['whatsapp-trigger-1770013817891'] = {
              nodeType: 'whatsapp-trigger',
              data: existingWhatsAppData,
              stepNumber: Object.keys(flowResults.nodeResults).length + 1,
              displayName: 'whatsapp-trigger-1770013817891_whatsapp'
            };
          }
          
          step1Result = {
            nodeType: 'whatsapp-trigger',
            nodeId: 'whatsapp-trigger-1770013817891',
            data: existingWhatsAppData,
            success: true,
            message: 'WhatsApp trigger data processed from existing webhook'
          };
        } else {
          step1Result = {
            nodeType: 'whatsapp-trigger',
            nodeId: 'whatsapp-trigger-1770013817891',
            data: {},
            success: true,
            message: 'WhatsApp trigger configured - waiting for webhook data'
          };
        }
      }
      
      
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      step1Result = {
        nodeType: 'whatsapp-trigger',
        nodeId: 'whatsapp-trigger-1770013817891',
        success: false,
        error: errorMessage
      };
    }
    
    // Store result for next nodes
    (flowResults as any).whatsappTriggerResult = step1Result;
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['whatsapp-trigger-1770013817891'] = {
      nodeId: 'whatsapp-trigger-1770013817891',
      nodeType: 'whatsapp-trigger',
      stepNumber: 1,
      displayName: 'whatsapp-triggerResult_whatsapp_trigger_1770013817891',
      data: step1Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for whatsapp-trigger
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['whatsapp-triggerResult_whatsapp_trigger_1770013817891'] || typeof flowResults['whatsapp-triggerResult_whatsapp_trigger_1770013817891'] === 'undefined') {
      flowResults['whatsapp-triggerResult_whatsapp_trigger_1770013817891'] = step1Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
      
      if (flowResults.currentResult !== undefined && 
          flowResults.stepCounter > 0) {
        currentResult = flowResults.currentResult;
      } else {
        currentResult = step1Result;
      }
    } catch (stepError) {
      const stepErrorMessage = stepError instanceof Error ? stepError.message : String(stepError) || 'Unknown step error';
      console.error('❌ Error in step 1 (whatsapp-trigger):', stepError);
      flowErrors.push(`Step 1 (whatsapp-trigger): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step1Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'whatsapp-trigger',
        nodeId: 'whatsapp-trigger-1770013817891',
        stepNumber: 1
      };
      
      currentResult = step1Result; // Update currentResult even on error
      
      // Store error result in enhanced data flow system
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['whatsapp-trigger-1770013817891'] = {
      nodeId: 'whatsapp-trigger-1770013817891',
      nodeType: 'whatsapp-trigger',
      stepNumber: 1,
      displayName: 'whatsapp-triggerResult_whatsapp_trigger_1770013817891',
      data: step1Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for whatsapp-trigger
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['whatsapp-triggerResult_whatsapp_trigger_1770013817891'] || typeof flowResults['whatsapp-triggerResult_whatsapp_trigger_1770013817891'] === 'undefined') {
      flowResults['whatsapp-triggerResult_whatsapp_trigger_1770013817891'] = step1Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
    }

    step2Result = currentResult;
    try {
      
    // Process with OpenAI Agent SDK (Single Input Mode)
    step2Result = '';
    
    // 🆕 BUILD TARGET AGENT CONFIGURATIONS AT RUNTIME (for cross-workflow handoff)
    // CRITICAL FIX: Use workflowRegistry.allNodes instead of context.allNodes
    // This allows orchestrator agents to find sub-agents in other workflows
    const targetAgentConfigs: Record<string, any> = {};
    
    
    
    try {
      // 🚫 CHECK: Skip if this node was already executed via handoff (CLIENT-SIDE ONLY)
      if (typeof window !== 'undefined' && window.__executedNodes && window.__executedNodes.has('openaiAgentSDKNode-1770013824184')) {
        console.log('⏭Skipping node (already executed via handoff):', 'openaiAgentSDKNode-1770013824184');
        
        // Get the result from dataFlow if available
        const existingResult = dataFlow.getByNodeId('openaiAgentSDKNode-1770013824184');
        if (existingResult) {
          step2Result = existingResult;
        } else {
          step2Result = 'Node already executed via handoff';
        }
        
        // Remove from executed set for next workflow run (CLIENT-SIDE ONLY)
        if (typeof window !== 'undefined' && window.__executedNodes) {
          window.__executedNodes.delete('openaiAgentSDKNode-1770013824184');
        }
      } else {
      let aiInput = '';
      
      
      // Single input processing (existing logic - UNCHANGED)
      
        // User has provided a custom prompt - use it and evaluate any dataFlow expressions
        let userPrompt = `{{whatsappMessageBody}}
{{whatsappMessageFrom}}`;
        const templateContext = {
          ...flowResults,
          dataFlow: dataFlow,
          currentResult: currentResult,
          previousResult: flowResults.previousResult,
          // 🔧 Enhanced template variable access (like Evolution Send node)
          evolutionReceiveResult: flowResults.variables?.evolutionReceiveResult || flowResults.evolutionReceiveResult || {},
          aiAgentResult: flowResults.variables?.aiAgentResult || {},
          // 🔧 Enhanced template variable access - ALL variables from flowResults
          ...flowResults.variables,
          variables: flowResults.variables || {}
        };
        
        // 🔧 Fix [object Object] issue - Convert ANY object template variables to readable strings
        userPrompt = userPrompt.replace(/{{(w+)}}/g, (match, varName) => {
          const value = templateContext[varName];
          if (value && typeof value === 'object' && !varName.includes('.') && !varName.includes('(')) {
            return JSON.stringify(value, null, 2);
          }
          return match; // Let template engine handle complex expressions
        });
        
        try {
          if (userPrompt.includes('{{') && userPrompt.includes('}}')) {
            const templateResult = TemplateExpressionEngine.processTemplate(userPrompt, templateContext);
            aiInput = String(templateResult);
          } else if (userPrompt.includes('dataFlow.')) {
            const evaluatedResult = TemplateExpressionEngine.evaluate(userPrompt, templateContext, { allowFunctions: true });
            aiInput = (evaluatedResult !== undefined && evaluatedResult !== null) ? evaluatedResult : userPrompt;
          } else {
            aiInput = userPrompt;
          }
        } catch (templateError) {
          aiInput = userPrompt;
        }
      
    
      
      // Ensure aiInput is a string and not empty
      if (typeof aiInput !== 'string') {
        aiInput = JSON.stringify(aiInput, null, 2);
      }
      
      if (!aiInput || aiInput.trim() === '') {
        aiInput = 'Please provide assistance.';
      }
        
        // 📚 RETRIEVE AGENT MEMORY (if enabled)
        let memoryMessages = [];
        if (false && 'simple' !== 'none' && typeof window !== 'undefined') {
          try {
            const agentId = 'agent-1771079854996';
            const userId = 'user-1771079854996';
            const memoryStorageType = 'simple';
            
            if (memoryStorageType === 'supabase_vector' || memoryStorageType === 'postgres_chat' || 
                memoryStorageType === 'longterm_semantic' || memoryStorageType === 'semantic_longterm' || 
                memoryStorageType === 'longterm_vector') {
              // Supabase/PostgreSQL memory retrieval
              try {
                const memoryResponse = await fetch('/api/memory', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    operation: 'retrieve',
                    user_id: userId,
                    agent_id: agentId,
                    memory_type: memoryStorageType,
                    limit: 10
                  })
                });
                
                if (memoryResponse.ok) {
                  const memoryData = await memoryResponse.json();
                  if (memoryData.success && memoryData.data && Array.isArray(memoryData.data)) {
                    memoryMessages = memoryData.data.flatMap(item => {
                      const messages = [];
                      if (item.input_data) {
                        messages.push({
                          role: item.input_data.role || 'user',
                          content: item.input_data.content
                        });
                      }
                      if (item.output_data) {
                        messages.push({
                          role: item.output_data.role || 'assistant',
                          content: item.output_data.content
                        });
                      }
                      return messages;
                    });
                  }
                }
              } catch (supabaseError) {
                console.error('Memory retrieval error:', supabaseError);
              }
            } else {
              // Browser storage memory retrieval
              const memoryStorageKey = `openai_agent_memory_${agentId}_${userId}`;
              const storage = memoryStorageType === 'session' ? sessionStorage : localStorage;
              
              const storedMemory = storage.getItem(memoryStorageKey);
              if (storedMemory) {
                const conversations = JSON.parse(storedMemory);
                const recentConversations = conversations.slice(-10);
                memoryMessages = recentConversations.map(conv => ({
                  role: conv.role,
                  content: conv.content
                }));
              }
            }
          } catch (memoryError) {
            console.error('Failed to retrieve memory:', memoryError);
          }
        }
        
        // Define mediaCheckContext for media content checking (renamed to avoid global templateContext conflict)
        const mediaCheckContext = {
          ...flowResults,
          dataFlow: dataFlow,
          currentResult: flowResults.currentResult,
          previousResult: flowResults.previousResult,
          // Enhanced template variable access (like Image Gen and Smart Agent nodes)
          evolutionReceiveResult: flowResults.variables?.evolutionReceiveResult || flowResults.evolutionReceiveResult || {},
          aiAgentResult: flowResults.variables?.aiAgentResult || {},
          smartAgentResult: flowResults.variables?.smartAgentResult || {},
          // All variables from flowResults
          ...flowResults.variables,
          variables: flowResults.variables || {}
        };
        
        // 🆕 Check for media content to send to AI
        let hasMediaContent = false;
        let mediaContent = null;
        
        // Check for media in evolutionReceiveResult
        if (mediaCheckContext.evolutionReceiveResult?.mediaBase64 && mediaCheckContext.evolutionReceiveResult?.mimeType) {
          const mimeType = mediaCheckContext.evolutionReceiveResult.mimeType;
          if (mimeType.startsWith('image/')) {
            hasMediaContent = true;
            mediaContent = {
              type: 'image',
              mimeType: mimeType,
              base64: mediaCheckContext.evolutionReceiveResult.mediaBase64,
              dataUrl: mediaCheckContext.evolutionReceiveResult.mediaDataUrl
            };
          }
        }
        
        // SECURITY: Load API key from environment variables instead of embedding it
      let effectiveApiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';
      
      // If using stored credential, fetch from backend
      if (false && '') {
        try {
          const credentialResponse = await fetch(`${process.env.NEXT_PUBLIC_SIMPLITA_BACKEND_URL || 'http://localhost:8000'}/api/credentials/${encodeURIComponent('')}/data`, {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${process.env.SIMPLITA_API_TOKEN || 'generated-app-token'}`,
              'X-User-ID': process.env.SIMPLITA_USER_ID || 'anonymous'
            }
          });

          if (credentialResponse.ok) {
            const credentialData = await credentialResponse.json();
            if (credentialData && credentialData.api_key) {
              effectiveApiKey = credentialData.api_key;
            }
          }
        } catch (credError) {
          console.error('OpenAI SDK: Error retrieving stored credential:', credError);
        }
      }
      
      // 🔧 Use absolute URL for server-side compatibility
      const apiUrl = typeof window !== 'undefined' ? '/api/openai-agent-sdk' : `${process.env.NEXT_PUBLIC_BASE_URL || process.env.VERCEL_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/api/openai-agent-sdk`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          input: aiInput,
         user_prompt: `{{whatsappMessageBody}}
{{whatsappMessageFrom}}`,

          model: 'gpt-4.1-2025-04-14',
          instructions: `You are an AI Agent for Vitality Research Centre, and you must operate using both MCP tools as a single assistant.
:warning: MANDATORY TOOL EXECUTION ORDER
You MUST execute the CRUD MCP tool first to store the name and phonenumber, and then execute the Calendar MCP tool — this is compulsory.
:receipt: CHAT HISTORY SAVING RULE (CRITICAL — MUST EXECUTE FOR EVERY MESSAGE)
For EVERY user message and EVERY AI response, you MUST save the conversation to the chat_history column in the "crudsupabase" table.
This is MANDATORY and must happen for EVERY conversation exchange — it must NEVER be skipped.
CRITICAL 3-STEP PROCESS (MUST FOLLOW EXACTLY):
For EACH user message:
STEP 1: FIRST — Read existing chat_history
  → Call supabase-crud → read/select → Find record where phonenumber = {{whatsappMessageFrom}} → Get the existing chat_history value (if it exists, otherwise use empty string "")
STEP 2: SECOND — Append to existing history
  → Take the existing chat_history value you just read
  → Append "\nUser: <exact user message>" to it
  → Create new value: existing_chat_history + "\nUser: <exact user message>"
STEP 3: THIRD — Save complete updated history
  → Call supabase-crud → update → Find record where phonenumber = {{whatsappMessageFrom}} → Set chat_history = the new value from STEP 2 (which includes ALL previous conversations + new user message)
For EACH AI response:
STEP 1: FIRST — Read existing chat_history
  → Call supabase-crud → read/select → Find record where phonenumber = {{whatsappMessageFrom}} → Get the existing chat_history value (it should already contain previous conversations including the user message you just saved)
STEP 2: SECOND — Append to existing history
  → Take the existing chat_history value you just read
  → Append "\nAI: <your exact response>" to it
  → Create new value: existing_chat_history + "\nAI: <your exact response>"
STEP 3: THIRD — Save complete updated history
  → Call supabase-crud → update → Find record where phonenumber = {{whatsappMessageFrom}} → Set chat_history = the new value from STEP 2 (which includes ALL previous conversations + new AI response)
CRITICAL REQUIREMENTS:
- You MUST ALWAYS read the existing chat_history FIRST before updating (STEP 1 is mandatory)
- You MUST preserve ALL previous conversations — never replace, always append
- The final chat_history should contain ALL conversation exchanges from the very beginning in chronological order
- Format example: "User: hello\nAI: hi there\nUser: my name is kunju\nAI: thanks kunju\nUser: can you view details\nAI: here are your details..."
- If the user doesn't exist yet, create the record first with name and phonenumber, then initialize chat_history with the first message
- NEVER overwrite or replace existing chat_history — always read first, then append, then save
:dart: ROLE & BEHAVIOR
Your role is to reply to user queries.
If the user asks about the Vitality Research Centre or their weight reduction plans, you MUST explain the information simply and clearly and answer their related questions.
You must not mention or reveal that any information is being stored in a database.
After explaining, politely ask the user to provide their name (this is important).
If the user does not provide their name → politely ask again for their name after addressing their queries.
If the user provides their name → proceed to store the name and phonenumber in the database using the MCP tool.
Once the name and phonenumber stored, Then use the calendar MCP tool to schedule in google calendar based on the details given.
Do not respond unnecessarily to unrelated messages.
:speech_balloon: ADDITIONAL USER HANDLING LOGIC
User can ask any questions like what is orientation call or etc etc etc, and the steps should continue normally as per the flow above.
If the user uses any greeting terms like hi, hello, hey, or asks anything like "can I reschedule my call" or "can I view my details again," then you must check with the phonenumber we already have and the details stored in Supabase.
Case A — Existing User
If the phonenumber {{whatsappMessageFrom}} already exists in Supabase, reply:
"Looks like you're already registered with us, {{name}}. Would you like to view your details or reschedule your orientation call?"
Case B — New User
If the user does not exist in Supabase, then insert into crudsupabase:
name = user's name
phonenumber = {{whatsappMessageFrom}}
Then respond:
"Thanks for contacting us, {{name}}. At what date and time can we schedule your orientation call to share more details about the plans?"
Then continue the same workflow as already defined.
:file_cabinet: DATA STORAGE VIA CRUD MCP TOOL
You are also a data management assistant.
Your task is to interact with the Supabase database using the supabase-crud tool.
:gear: MANDATORY ACTIONS
You MUST call the supabase-crud function to perform all database operations.
You MUST extract the name from the user's conversation message.
You MUST extract the phonenumber from the variable {{whatsappMessageFrom}}.
You MUST read all the data in supabase, if the phonenumber from {{whatsappMessageFrom}} already exist, you should NOT create the current data in supabase.
CRITICAL — CHAT HISTORY SAVING:
You MUST save chat history for EVERY conversation exchange using this EXACT 3-STEP PROCESS:
For EACH user message:
1. FIRST: Call supabase-crud → read → Find record where phonenumber = {{whatsappMessageFrom}} → READ existing chat_history value
2. SECOND: Append "\nUser: <user message>" to the existing chat_history you just read
3. THIRD: Call supabase-crud → update → Find record where phonenumber = {{whatsappMessageFrom}} → Set chat_history = existing_chat_history + "\nUser: <user message>"
For EACH AI response:
1. FIRST: Call supabase-crud → read → Find record where phonenumber = {{whatsappMessageFrom}} → READ existing chat_history value
2. SECOND: Append "\nAI: <your response>" to the existing chat_history you just read
3. THIRD: Call supabase-crud → update → Find record where phonenumber = {{whatsappMessageFrom}} → Set chat_history = existing_chat_history + "\nAI: <your response>"
CRITICAL: You MUST read existing chat_history FIRST (STEP 1) before updating. The chat_history column must contain ALL conversations from the beginning. Each new message must be APPENDED to existing chat_history (read first, then append, then save). NEVER replace existing chat_history — always preserve all previous conversations. This is MANDATORY for every message exchange.
:clipboard: TABLE DETAILS
CRITICAL: The table name is "crudsupabase" — you MUST always specify this exact table name when calling the supabase-crud function. Never use "users" or any other table name. Always use "crudsupabase" as the table name parameter.
Table name: crudsupabase
:wrench: SUPPORTED OPERATIONS
Insert/Create: Add new records to the "crudsupabase" table
Update: Modify existing records in the "crudsupabase" table (based on matching name or ID)
Delete: Remove records from the "crudsupabase" table (based on a condition)
Read/Select: Retrieve records or fetch all data from the "crudsupabase" table
:rocket: EXECUTION RULE
You must execute the insert operation immediately by calling the supabase-crud function with table name "crudsupabase" — do not just acknowledge it.
If the user requests another operation (update, delete, or select), perform that specific operation on the "crudsupabase" table accordingly.
REMINDER: For EVERY user message and EVERY AI response, you MUST follow the 3-STEP PROCESS: (1) FIRST read existing chat_history from "crudsupabase" table for phonenumber = {{whatsappMessageFrom}}, (2) SECOND append the new message to the existing chat_history (preserving ALL previous conversations), (3) THIRD save the complete updated chat_history back to "crudsupabase" table. NEVER replace existing chat_history — always read first, then append, then save. This ensures ALL conversations from the beginning are preserved. This is non-negotiable and must happen for every single message exchange.
:speech_balloon: RESPONSE RULE
After successfully storing the data, do not send or mention any message such as "data stored" or "saved in the database."
Instead, reply to any user queries and then send the following message:
"Thanks for contacting us. Our doctors will contact you as soon as possible. At what date and time can we schedule an Orientation call to share the details regarding the plans."
:date: VIA CALENDAR MCP TOOL
After asking the question regarding the date and time for call, then execute calendar MCP tool.
This tool should execute only after the CRUD MCP tool has been executed.
You will recieve date and time in this format:
Date: {{date}}
Time: {{time}}
:scales: CONDITIONAL LOGIC — SLOT AVAILABILITY CHECK (Before Scheduling the Event)
Before creating the event in Google Calendar, you MUST check whether the requested date and time slot is already booked.
Steps to follow:
Retrieve all existing events from the configured Google Calendar (calendar_id).
Compare the user's requested date and time with the existing scheduled events.
If the requested slot is already booked, reply to the user:
"The selected slot ({{date}} at {{time}}) is already booked. Would you like to reschedule to another available time?"
Then, calculate and display the next two available slots, each separated by 30 minutes, in the same day or the next available day. Example:
"Here are the next available time slots you can choose from:
7:30 AM
8:00 AM"
If the user selects one of the available slots, update the selected date and time accordingly, and then proceed to create the event in Google Calendar.
If the requested slot is not booked, directly schedule the event in Google Calendar as per the existing flow.
You MUST extract the date and time in am or pm of event schedule from the conversation and create the event in google calendar.
Default calendar_id: c51c958ccfdffb580ee5ad1e69dbab503e6331e53459e60187faa2626f0439f4@group.calendar.google.com. Never use "primary". If the user provides a different calendar_id, use that instead and store it as the session default.
Default timezone: Asia/Kolkata unless the user specifies another IANA timezone. Interpret natural-language dates/times in the active timezone.
You MUST schedule the event in Google Calendar with the following details:
Summary: Orientation Call - {{name}} (the name of the user which should be retrieved from Supabase "crudsupabase" table) - {{whatsappMessageFrom}} (the phonenumber of the user which should be retrieved from Supabase "crudsupabase" table)
Description: Call to share the details regarding the plans
Date: You MUST extract the date from the chats
Time: You MUST extract the time from the chats
You MUST extract the name from the user's input and include it in the calendar event.
After creating event in calendar, then reply "We will call you on scheduled time Please be available 10 minutes before the call — our doctor will be ready to begin your journey toward wellness."`,
          temperature: 0.7,
          max_tokens: 1000,
          apiKey: effectiveApiKey,
          agentType: 'orchestrator',
          selected_tools: [],
          tool_configs: {},
          tool_settings: {"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},
          mcp_servers: [{"id":"custom_mcp_1770014049164","url":"https://supabase-crud.simplita.ai/mcp","name":"Supabase","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770014052268","url":"https://newgooglecalendar-czvc54.simplita.ai/mcp","name":"Calendar","enabled":true,"description":"Custom MCP Server"}],
          handoff_enabled: false,
          handoff_targets: [],
          // 📚 Include memory context if available
          memoryMessages: memoryMessages,
          enableMemory: false,
          memoryType: 'simple'
        })
      });
      
      if (!response.ok) {
        throw new Error('OpenAI Agent SDK API error: ' + response.status + ' - ' + response.statusText);
      }
      
      const result = await response.json();
      
      // ✅ AUTO-HANDOFF: Detect next directly connected agent (CLIENT-SIDE ONLY)
      if (false && !result.handoff && typeof window !== 'undefined') {
        try {
          // Get workflow graph from window (client-side only)
          const workflowNodes = (window as any).__currentWorkflowNodes || [];
          const workflowEdges = (window as any).__currentWorkflowEdges || [];
          
          // Find edges from current node
          const outgoingEdges = workflowEdges.filter((e: any) => e.source === 'openaiAgentSDKNode-1770013824184');
          
          // Find directly connected OpenAI Agent SDK nodes
          const nextAgentNodes = outgoingEdges
            .map((edge: any) => workflowNodes.find((n: any) => n.id === edge.target))
            .filter((n: any) => n && n.type === 'openaiAgentSDKNode');
          
          if (nextAgentNodes.length === 1) {
            const nextAgent = nextAgentNodes[0];
            console.log('Auto-handoff to:', nextAgent.data?.label || nextAgent.id);
            
            // Trigger auto-handoff by setting handoff flag
            result.handoff = true;
            result.execution_mode = 'transfer_control';
            result.target_agent = nextAgent.id;
            result.reason = 'Auto-handoff to next agent';
            result.context_summary = 'Automatically transferring to next connected agent';
            result.message = result.content || result.text || 'Agent response';
          } else if (nextAgentNodes.length > 1) {
            console.warn('Auto-handoff skipped: Multiple agents connected');
          }
        } catch (autoHandoffError) {
          console.warn('Auto-handoff detection failed:', autoHandoffError);
        }
      }
      
      // 📚 STORE AGENT MEMORY (if enabled and response contains data)
      if (false && 'simple' !== 'none' && typeof window !== 'undefined') {
        try {
          const agentId = 'agent-1771079854996';
          const userId = 'user-1771079854996';
          const sessionId = 'session-1771079854996';
          const memoryStorageType = 'simple';
          
          const conversationData = {
            user_message: { role: 'user', content: aiInput },
            assistant_message: { role: 'assistant', content: result.content || result.text || result.message || '' }
          };
          
          if (memoryStorageType === 'supabase_vector' || memoryStorageType === 'postgres_chat' || 
              memoryStorageType === 'longterm_semantic' || memoryStorageType === 'semantic_longterm' || 
              memoryStorageType === 'longterm_vector') {
            // Supabase/PostgreSQL memory storage
            try {
              const memoryStoreResponse = await fetch('/api/memory', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  operation: 'store',
                  user_id: userId,
                  agent_id: agentId,
                  session_id: sessionId,
                  memory_type: memoryStorageType,
                  interaction_type: 'conversation',
                  input_data: conversationData.user_message,
                  output_data: conversationData.assistant_message,
                  metadata: {
                    model: 'gpt-4.1-2025-04-14',
                    agentType: 'agent_as_tool',
                    timestamp: new Date().toISOString()
                  }
                })
              });
              
              if (!memoryStoreResponse.ok) {
                console.warn('Failed to store memory in Supabase:', memoryStoreResponse.status);
              }
            } catch (supabaseStoreError) {
              console.error('Supabase memory storage error:', supabaseStoreError);
            }
          } else {
            // Browser storage memory
            const memoryStorageKey = `openai_agent_memory_${agentId}_${userId}`;
            const storage = memoryStorageType === 'session' ? sessionStorage : localStorage;
            
            const existingData = storage.getItem(memoryStorageKey);
            const conversations = existingData ? JSON.parse(existingData) : [];
            
            // Add new conversation data
            conversations.push(conversationData.user_message);
            conversations.push(conversationData.assistant_message);
            
            // Apply limit (keep last 100 messages)
            if (conversations.length > 100) {
              conversations.splice(0, conversations.length - 100);
            }
            
            // Store back to browser storage
            storage.setItem(memoryStorageKey, JSON.stringify(conversations));
          }
        } catch (memoryError) {
          console.error('Failed to store memory:', memoryError);
        }
      }
      
      // ✅ CHECK FOR AGENT HANDOFF
      if (result.handoff && result.target_agent) {
        try {
          // Get workflow graph from window (client-side only)
          const workflowNodes = (window as any).__currentWorkflowNodes || [];
          const workflowEdges = (window as any).__currentWorkflowEdges || [];
          
          // Find edges from current node
          const outgoingEdges = workflowEdges.filter((e: any) => e.source === 'openaiAgentSDKNode-1770013824184');
          
          // Find directly connected OpenAI Agent SDK nodes
          const nextAgentNodes = outgoingEdges
            .map((edge: any) => workflowNodes.find((n: any) => n.id === edge.target))
            .filter((n: any) => n && n.type === 'openaiAgentSDKNode');
          
          if (nextAgentNodes.length === 1) {
            const nextAgent = nextAgentNodes[0];
            console.log('Auto-handoff to:', nextAgent.data?.label || nextAgent.id);
            
            // Trigger auto-handoff by setting handoff flag
            result.handoff = true;
            result.execution_mode = 'transfer_control';
            result.target_agent = nextAgent.id;
            result.reason = 'Auto-handoff to next agent';
            result.context_summary = 'Automatically transferring to next connected agent';
            result.message = result.content || result.text || 'Agent response';
          } else if (nextAgentNodes.length > 1) {
            console.warn('Auto-handoff skipped: Multiple agents connected');
          }
        } catch (autoHandoffError) {
          console.warn('Auto-handoff detection failed:', autoHandoffError);
        }
      }
      
      // ✅ CHECK FOR AGENT HANDOFF
      if (result.handoff && result.target_agent) {
        console.log('Handoff to:', result.target_agent);
        
        const handoffThreadId = result.threadId;
        const handoffSessionId = result.sessionId;
        const execution_mode = result.execution_mode || 'transfer_control';
        
        const targetConfig = (targetAgentConfigs as Record<string, any>)[result.target_agent];
        
        if (!targetConfig) {
          console.error('❌ Target agent not found:', result.target_agent);
          throw new Error(`Target agent configuration not found: ${result.target_agent}. Available: ${Object.keys(targetAgentConfigs).join(', ')}`);
        }
        
        // 🔄 AUTO-EXECUTE TARGET AGENT with shared thread
        try {
          // 🔧 Construct absolute URL for both client and server contexts
          let apiUrl = '/api/openai-agent-sdk';
          if (typeof window === 'undefined') {
            // Server-side: Use environment variables to build absolute URL
            const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 
                           process.env.VERCEL_URL || 
                           process.env.NEXT_PUBLIC_FRONTEND_URL || 
                           'http://localhost:3000';
            // Ensure protocol is included
            const protocol = baseUrl.startsWith('http') ? '' : 'https://';
            apiUrl = `${protocol}${baseUrl}/api/openai-agent-sdk`;
          }
          
          // Call the target agent with THE TARGET'S OWN CONFIGURATION
          const targetAgentResponse = await fetch(apiUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              input: `Context from previous agent: ${result.context_summary || 'No context provided'}`,
              user_prompt: targetConfig.user_prompt || '',
              model: targetConfig.model || 'gpt-4o',
              instructions: targetConfig.instructions || 'You are a helpful AI assistant.',
              temperature: targetConfig.temperature || 0.7,
              max_tokens: targetConfig.max_tokens || 1000,
              apiKey: effectiveApiKey,
              agentType: targetConfig.agentType || targetConfig.agentSDKType || 'agent_as_tool',
              selected_tools: targetConfig.selected_tools || [],
              tool_configs: targetConfig.tool_configs || {},
              tool_settings: targetConfig.tool_settings || {},
              mcp_servers: targetConfig.mcp_servers || [],
              // CRITICAL: Pass shared thread for conversation continuity
              threadId: handoffThreadId,
              sessionId: handoffSessionId,
              // Indicate this is a handoff continuation
              isHandoffContinuation: true,
              handoffReason: result.reason,
              handoffContext: result.context_summary
            })
          });
          
          if (targetAgentResponse.ok) {
            const targetAgentResult = await targetAgentResponse.json();
            
            // DIFFERENT BEHAVIOR BASED ON EXECUTION MODE
            if (execution_mode === 'transfer_control') {
              // TRUE HANDOFF: Only target result, workflow continues from target
              step2Result = targetAgentResult.content || targetAgentResult.text || targetAgentResult.message || 'Target agent response';
            } else {
              // TOOL CALL MODE: Combine results, orchestrator continues
              step2Result = {
                handoffCompleted: true,
                execution_mode: 'tool_call',
                sourceAgent: result.message,
                targetAgent: result.target_agent,
                targetAgentResult: targetAgentResult.content || targetAgentResult.text || targetAgentResult.message,
                handoffReason: result.reason,
                handoffContext: result.context_summary,
                sharedThreadId: handoffThreadId,
                sharedSessionId: handoffSessionId,
                finalMessage: `Agent tool call completed: ${result.target_agent} returned: ${targetAgentResult.content || targetAgentResult.text || 'Result received'}`
              };
            }
            
            // CRITICAL: Mark target agent as already executed to prevent double execution (CLIENT-SIDE ONLY)
            if (typeof window !== 'undefined') {
              if (!window.__executedNodes) {
                window.__executedNodes = new Set();
              }
              window.__executedNodes.add(result.target_agent);
              
              // Signal workflow to continue from target's output for transfer control (CLIENT-SIDE ONLY)
              if (execution_mode === 'transfer_control') {
                window.__workflowContinueFrom = result.target_agent;
              }
            } else {
              console.log('ℹServer-side execution: Skipping window-based node tracking');
            }
          } else {
            console.error('Target agent execution failed:', targetAgentResponse.status);
            step2Result = {
              handoffCompleted: false,
              sourceAgent: result.message,
              targetAgent: result.target_agent,
              error: 'Target agent execution failed',
              handoffReason: result.reason
            };
          }
        } catch (handoffError) {
          console.error('Handoff error:', handoffError);
          step2Result = {
            handoffCompleted: false,
            sourceAgent: result.message,
            targetAgent: result.target_agent,
            error: handoffError instanceof Error ? handoffError.message : String(handoffError),
            handoffReason: result.reason
          };
        }
      } else {
        // Normal response (no handoff)
        step2Result = result.content || result.text || result.message || 'AI response received';
      }
      
      // 📊 CRITICAL: Store result in flowResults for dataFlow access
      if (!flowResults.nodeResults) flowResults.nodeResults = {};
      if (!flowResults.variables) flowResults.variables = {};
      if (!flowResults.aiResponses) flowResults.aiResponses = {};
      
      // Generate safe display name at runtime
      const displayName = "OpenAI_Agent";
      
      // Store in nodeResults for dataFlow.getByNodeId()
      flowResults.nodeResults['openaiAgentSDKNode-1770013824184'] = {
        nodeId: 'openaiAgentSDKNode-1770013824184',
        nodeType: 'openaiAgentSDKNode',
        stepNumber: (flowResults.stepCounter || 0) + 1,
        displayName: displayName,
        data: step2Result,
        timestamp: new Date().toISOString(),
        success: true
      };
      
      // Store in variables for dataFlow.get()
      flowResults.variables[displayName] = step2Result;
      flowResults.aiResponses[displayName] = step2Result;
      
      // Store at top-level for direct access
      flowResults[displayName] = step2Result;

      // Store under configured resultVariable if provided (e.g., sdkResult)
      const resultVariableName = "sdkResult";
      if (resultVariableName) {
        flowResults.variables[resultVariableName] = step2Result;
        flowResults.aiResponses[resultVariableName] = step2Result;
        flowResults[resultVariableName] = step2Result;
      }
      
      // Update current/previous for dataFlow.current() and dataFlow.previous()
      flowResults.previousResult = flowResults.currentResult;
      flowResults.currentResult = step2Result;
      
      // Increment step counter
      flowResults.stepCounter = (flowResults.stepCounter || 0) + 1;
      }
      
    } catch (error) {
      console.error('OpenAI Agent SDK error:', error);
      step2Result = 'Error: ' + (error instanceof Error ? error.message : String(error));
      flowErrors.push('OpenAI Agent SDK error in node ' + "openaiAgentSDKNode-1770013824184" + ': ' + (error instanceof Error ? error.message : String(error)));
    }
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['openaiAgentSDKNode-1770013824184'] = {
      nodeId: 'openaiAgentSDKNode-1770013824184',
      nodeType: 'openaiAgentSDKNode',
      stepNumber: 2,
      displayName: 'openaiSDKResult_openaiAgentSDKNode_1770013824184',
      data: step2Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    flowResults.aiResponses['openaiSDKResult_openaiAgentSDKNode_1770013824184'] = step2Result;
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['openaiSDKResult_openaiAgentSDKNode_1770013824184'] || typeof flowResults['openaiSDKResult_openaiAgentSDKNode_1770013824184'] === 'undefined') {
      flowResults['openaiSDKResult_openaiAgentSDKNode_1770013824184'] = step2Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
      
      if (flowResults.currentResult !== undefined && 
          flowResults.stepCounter > 1) {
        currentResult = flowResults.currentResult;
      } else {
        currentResult = step2Result;
      }
    } catch (stepError) {
      const stepErrorMessage = stepError instanceof Error ? stepError.message : String(stepError) || 'Unknown step error';
      console.error('❌ Error in step 2 (openaiAgentSDKNode):', stepError);
      flowErrors.push(`Step 2 (openaiAgentSDKNode): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step2Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'openaiAgentSDKNode',
        nodeId: 'openaiAgentSDKNode-1770013824184',
        stepNumber: 2
      };
      
      currentResult = step2Result; // Update currentResult even on error
      
      // Store error result in enhanced data flow system
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['openaiAgentSDKNode-1770013824184'] = {
      nodeId: 'openaiAgentSDKNode-1770013824184',
      nodeType: 'openaiAgentSDKNode',
      stepNumber: 2,
      displayName: 'openaiSDKResult_openaiAgentSDKNode_1770013824184',
      data: step2Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    flowResults.aiResponses['openaiSDKResult_openaiAgentSDKNode_1770013824184'] = step2Result;
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['openaiSDKResult_openaiAgentSDKNode_1770013824184'] || typeof flowResults['openaiSDKResult_openaiAgentSDKNode_1770013824184'] === 'undefined') {
      flowResults['openaiSDKResult_openaiAgentSDKNode_1770013824184'] = step2Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
    }

    step3Result = currentResult;
    try {
      
      // WhatsApp Business Message Processing
    
      
      // Credential handling - Use environment variables (auto-generated from workflow credentials)
      let effectiveApiKey = process.env.WHATSAPP_BUSINESS_ACCESS_TOKEN || '';
      let effectivePhoneNumberId = process.env.WHATSAPP_BUSINESS_PHONE_NUMBER_ID || '';
      let effectiveBusinessAccountId = process.env.WHATSAPP_BUSINESS_BUSINESS_ACCOUNT_ID || '';
      
   
      
      if (!effectiveApiKey) {
        console.warn(' WhatsApp Business access token not found - workflow may not complete');
        console.warn(' Please set WHATSAPP_BUSINESS_ACCESS_TOKEN in .env');
        // Allow execution to continue for template-based workflows
        effectiveApiKey = 'MISSING_API_KEY';
      }
      
      if (!effectivePhoneNumberId) {
        console.warn(' WhatsApp Business phone number ID not found');
        console.warn(' Please set WHATSAPP_BUSINESS_PHONE_NUMBER_ID in .env');
      }

      // Template context for dynamic content resolution
      const templateContext: Record<string, any> = {
        ...flowResults,
        dataFlow: dataFlow,
        currentResult: flowResults.currentResult || null,
        previousResult: flowResults.previousResult || null
      };
      
      // Add template variables to context dynamically
      const nodeConfig: Record<string, any> = {"phoneNumber":"{{whatsappMessageFrom}}","message":"{{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770013824184\")}}","mediaType":"none","mediaUrl":"","apiKey":"","credentialId":"26755c9c-eb1e-4b5c-8e8a-b14eca389dcd","useStoredCredential":true,"phoneNumberId":"","businessAccountId":"","apiVersion":"v20.0","messageMode":"message","templateName":"","templateLanguage":"en_US","templateText":"","templateParameters":""};
      Object.keys(nodeConfig).forEach(key => {
        if (key.startsWith('templateVar_')) {
          templateContext[key] = nodeConfig[key] || '';
      
        }
      });
      
      
      const messageMode = 'message' as 'message' | 'template';
      const configuredMediaType = 'none' as 'image' | 'video' | 'audio' | 'document' | 'none';
      const parsedTemplateParameters: any[] = [];

      // Process phone number with template resolution
      let finalPhoneNumber = '{{whatsappMessageFrom}}';
      try {
        if (finalPhoneNumber.includes('{{') && finalPhoneNumber.includes('}}')) {
          const phoneResult = TemplateExpressionEngine.processTemplate(finalPhoneNumber, templateContext);
          finalPhoneNumber = String(phoneResult);
        } else if (finalPhoneNumber.includes('dataFlow.')) {
          const phoneResult = TemplateExpressionEngine.evaluate(finalPhoneNumber, templateContext, { allowFunctions: true });
          finalPhoneNumber = (phoneResult !== undefined && phoneResult !== null) ? String(phoneResult) : finalPhoneNumber;
        }
       
      } catch (phoneError) {
        console.warn(' Phone number template processing failed, using original:', phoneError);
        finalPhoneNumber = '{{whatsappMessageFrom}}';
      }

      // Process message content with template resolution
      let finalMessage = `{{dataFlow.getByNodeId("openaiAgentSDKNode-1770013824184")}}`;
      let detectedBase64Content = null;
      let detectedFileType = null;
      let shouldSendAsMedia = false;
      
      // Process template configuration if in template mode
      let finalTemplateName = '';
      let finalTemplateLanguage = 'en_US';
      let finalTemplateText = ``;
      let finalTemplateParameters = '';
      
      if (messageMode === 'template') {
       
        
        // Process template name with template resolution
        try {
          if (finalTemplateName.includes('{{') && finalTemplateName.includes('}}')) {
            const templateNameResult = TemplateExpressionEngine.processTemplate(finalTemplateName, templateContext);
            finalTemplateName = String(templateNameResult);
          } else if (finalTemplateName.includes('dataFlow.')) {
            const templateNameResult = TemplateExpressionEngine.evaluate(finalTemplateName, templateContext, { allowFunctions: true });
            finalTemplateName = (templateNameResult !== undefined && templateNameResult !== null) ? String(templateNameResult) : finalTemplateName;
          }
         
        } catch (templateNameError) {
          console.warn(' Template name processing failed, using original:', templateNameError);
          finalTemplateName = '';
        }
        
        // Process template language with template resolution
        try {
          if (finalTemplateLanguage.includes('{{') && finalTemplateLanguage.includes('}}')) {
            const templateLanguageResult = TemplateExpressionEngine.processTemplate(finalTemplateLanguage, templateContext);
            finalTemplateLanguage = String(templateLanguageResult);
          } else if (finalTemplateLanguage.includes('dataFlow.')) {
            const templateLanguageResult = TemplateExpressionEngine.evaluate(finalTemplateLanguage, templateContext, { allowFunctions: true });
            finalTemplateLanguage = (templateLanguageResult !== undefined && templateLanguageResult !== null) ? String(templateLanguageResult) : finalTemplateLanguage;
          }
 
        } catch (templateLanguageError) {
          console.warn(' Template language processing failed, using original:', templateLanguageError);
          finalTemplateLanguage = 'en_US';
        }
        
        // Process template text with template resolution
        try {
          if (finalTemplateText.includes('{{') && finalTemplateText.includes('}}')) {
            const templateTextResult = TemplateExpressionEngine.processTemplate(finalTemplateText, templateContext);
            finalTemplateText = String(templateTextResult);
          } else if (finalTemplateText.includes('dataFlow.')) {
            const templateTextResult = TemplateExpressionEngine.evaluate(finalTemplateText, templateContext, { allowFunctions: true });
            finalTemplateText = (templateTextResult !== undefined && templateTextResult !== null) ? String(templateTextResult) : finalTemplateText;
          }
         
        } catch (templateTextError) {
          console.warn(' Template text processing failed, using original:', templateTextError);
          finalTemplateText = ``;
        }
        
        // Extract variables from template text and substitute with values
        try {
          // Extract all {{variable}} patterns from template text
          const variableMatches = finalTemplateText.match(/\{\{([^}]+)\}\}/g);
          if (variableMatches) {
         
            
            // Process each variable
            for (const match of variableMatches) {
              const variableName = match.replace(/\{\{|\}\}/g, '').trim();
        
              
              // Look for template variable values in the context
              const variableValue = templateContext[`templateVar_${variableName}`] || 
                                 templateContext[variableName] || 
                                 `{{dataFlow.current().${variableName}}}`;
              
              // Process the variable value with template resolution
              let processedValue = variableValue;
              try {
                if (variableValue.includes('{{') && variableValue.includes('}}')) {
                  const varResult = TemplateExpressionEngine.processTemplate(variableValue, templateContext);
                  processedValue = String(varResult);
                } else if (variableValue.includes('dataFlow.')) {
                  const varResult = TemplateExpressionEngine.evaluate(variableValue, templateContext, { allowFunctions: true });
                  processedValue = (varResult !== undefined && varResult !== null) ? String(varResult) : variableValue;
                }
              } catch (varError) {
                console.warn(` Variable ${variableName} processing failed, using original:`, varError);
              }
              
              // Replace the variable in template text
              finalTemplateText = finalTemplateText.replace(match, processedValue);
            
            }
          }
          
          // For WhatsApp templates, we need to extract the actual parameter values
          // The template should have been processed and variables substituted
          // Now we need to create parameters array based on the original template structure
          
          // Get the original template text to understand the structure
          const originalTemplateText = ``;
        
          
          // Extract variables from original template to get parameter order
          const originalVariableMatches = originalTemplateText.match(/\{\{([^}]+)\}\}/g);
          if (originalVariableMatches) {
      
            
            // Create parameters array in the same order as variables appear in template
            parsedTemplateParameters.length = 0;
            
            for (const match of originalVariableMatches) {
              const variableName = match.replace(/\{\{|\}\}/g, '').trim();
      
              
              // Get the processed value for this variable
              const variableValue = templateContext[`templateVar_${variableName}`] || 
                                 templateContext[variableName] || 
                                 `{{dataFlow.current().${variableName}}}`;
              
              let processedValue = variableValue;
              try {
                if (variableValue.includes('{{') && variableValue.includes('}}')) {
                  const varResult = TemplateExpressionEngine.processTemplate(variableValue, templateContext);
                  processedValue = String(varResult);
                } else if (variableValue.includes('dataFlow.')) {
                  const varResult = TemplateExpressionEngine.evaluate(variableValue, templateContext, { allowFunctions: true });
                  processedValue = (varResult !== undefined && varResult !== null) ? String(varResult) : variableValue;
                }
              } catch (varError) {
                console.warn(` Variable ${variableName} processing failed for parameter:`, varError);
                processedValue = variableValue;
              }
              
              parsedTemplateParameters.push(processedValue);
           
            }
            
       
          } else {
            // No variables found, use the processed text as single parameter
            parsedTemplateParameters.length = 0;
            parsedTemplateParameters.push(finalTemplateText);

          }
        } catch (templateProcessingError) {
          console.warn(' Template text processing failed:', templateProcessingError);
          // Fallback to original template parameters if available
          if (finalTemplateParameters && finalTemplateParameters.trim()) {
            try {
              const parsed = JSON.parse(finalTemplateParameters);
              parsedTemplateParameters.length = 0;
              if (Array.isArray(parsed)) {
                parsed.forEach((param: any) => parsedTemplateParameters.push(param));
              } else {
                parsedTemplateParameters.push(parsed);
              }
            } catch (jsonError) {
              console.warn(' Failed to parse fallback template parameters:', jsonError);
              parsedTemplateParameters.length = 0;
            }
          }
        }
      }
      
      try {
        if (finalMessage.includes('{{') && finalMessage.includes('}}')) {
          const messageResult = TemplateExpressionEngine.processTemplate(finalMessage, templateContext);
          finalMessage = String(messageResult);
        } else if (finalMessage.includes('dataFlow.')) {
          const messageResult = TemplateExpressionEngine.evaluate(finalMessage, templateContext, { allowFunctions: true });
          finalMessage = (messageResult !== undefined && messageResult !== null) ? String(messageResult) : finalMessage;
        }
        
        //  ENHANCED: Check if message content is base64 encoded file
        if (finalMessage && typeof finalMessage === 'string') {
          // Check for base64 patterns (common base64 starts)
          const base64Patterns = [
            /^JVBERi0x/, // PDF files
            /^iVBORw0KGgo/, // PNG images
            /^\/9j\/4/, // JPEG images
            /^R0lGODlh/, // GIF images
            /^UEsDBBQ/, // ZIP/Office documents
            /^0M8R4KGx/, // MS Office documents
            /^UEsDBA/, // ZIP archives
            /^AAAA/, // MP4 videos (common start)
            /^GkXfo/, // WebM videos
            /^ID3/, // MP3 audio
            /^OggS/, // OGG audio
            /^RIFF.*WEBP/, // WebP images
            /^data:[^;]+;base64,/ // Data URL format
          ];
          
          let isBase64Content = false;
          let cleanBase64 = finalMessage.trim();
          
          // Handle data URL format
          if (cleanBase64.startsWith('data:')) {
            const dataUrlMatch = cleanBase64.match(/^data:([^;]+);base64,(.+)$/);
            if (dataUrlMatch) {
              const mimeType = dataUrlMatch[1];
              cleanBase64 = dataUrlMatch[2];
              isBase64Content = true;
              
              // Detect file type from MIME type
              if (mimeType.startsWith('image/')) {
                detectedFileType = 'image';
              } else if (mimeType.startsWith('video/')) {
                detectedFileType = 'video';
              } else if (mimeType.startsWith('audio/')) {
                detectedFileType = 'audio';
              } else if (mimeType === 'application/pdf') {
                detectedFileType = 'document';
              } else if (mimeType.includes('document') || mimeType.includes('office') || mimeType.includes('text')) {
                detectedFileType = 'document';
              } else {
                detectedFileType = 'document'; // Default for unknown types
              }
              
        
            }
          } else {
            // Check for raw base64 patterns
            for (const pattern of base64Patterns) {
              if (pattern.test(cleanBase64)) {
                isBase64Content = true;
                
                // Detect file type from base64 signature
                if (cleanBase64.startsWith('JVBERi0x')) {
                  detectedFileType = 'document'; // PDF
                } else if (cleanBase64.startsWith('iVBORw0KGgo') || cleanBase64.startsWith('R0lGODlh')) {
                  detectedFileType = 'image'; // PNG/GIF
                } else if (cleanBase64.startsWith('/9j/4')) {
                  detectedFileType = 'image'; // JPEG
                } else if (cleanBase64.startsWith('AAAA') || cleanBase64.startsWith('GkXfo')) {
                  detectedFileType = 'video'; // MP4/WebM
                } else if (cleanBase64.startsWith('ID3') || cleanBase64.startsWith('OggS')) {
                  detectedFileType = 'audio'; // MP3/OGG
                } else if (cleanBase64.startsWith('UEsDBBQ') || cleanBase64.startsWith('0M8R4KGx')) {
                  detectedFileType = 'document'; // Office/ZIP
                } else {
                  detectedFileType = 'document'; // Default
                }
                
         
                break;
              }
            }
          }
          
          // Additional validation: check if it's valid base64 and reasonable length
          if (isBase64Content || (cleanBase64.length > 1000 && /^[A-Za-z0-9+/]*={0,2}$/.test(cleanBase64))) {
            try {
              // Try to decode to validate it's proper base64
              atob(cleanBase64.substring(0, 100)); // Test decode first 100 chars
              
              detectedBase64Content = cleanBase64;
              shouldSendAsMedia = true;
              
              if (!detectedFileType) {
                // Fallback detection based on content length and patterns
                if (cleanBase64.length > 50000) {
                  detectedFileType = 'document'; // Large files likely documents
                } else if (cleanBase64.length > 10000) {
                  detectedFileType = 'image'; // Medium files likely images
                } else {
                  detectedFileType = 'document'; // Small files default to document
                }
              }
              
          
              
              // Clear the message since we'll send as media
              finalMessage = ''; // Will be set as caption if needed
              
            } catch (decodeError) {
              console.warn(' Base64 validation failed, treating as regular text:', decodeError);
              shouldSendAsMedia = false;
            }
          }
        }
        

      } catch (messageError) {
        console.warn(' Message template processing failed, using original:', messageError);
        finalMessage = `{{dataFlow.getByNodeId("openaiAgentSDKNode-1770013824184")}}`;
      }

      // Process media URL if specified
      let finalMediaUrl = '';
      if (configuredMediaType !== 'none' && '') {
        finalMediaUrl = '';
        try {
          if (finalMediaUrl.includes('{{') && finalMediaUrl.includes('}}')) {
            const mediaResult = TemplateExpressionEngine.processTemplate(finalMediaUrl, templateContext);
            finalMediaUrl = String(mediaResult);
          } else if (finalMediaUrl.includes('dataFlow.')) {
            const mediaResult = TemplateExpressionEngine.evaluate(finalMediaUrl, templateContext, { allowFunctions: true });
            finalMediaUrl = (mediaResult !== undefined && mediaResult !== null) ? String(mediaResult) : finalMediaUrl;
          }
     
        } catch (mediaError) {
          console.warn(' Media URL template processing failed, using original:', mediaError);
          finalMediaUrl = '';
        }
      }

      // Validate required fields at runtime
      if (!finalPhoneNumber || finalPhoneNumber.trim() === '') {
        throw new Error('WhatsApp Business: Phone number is required');
      }

      // Validate based on message mode
      if (messageMode === 'template') {
        // Template mode validation
        if (!finalTemplateName || finalTemplateName.trim() === '') {
          throw new Error('WhatsApp Business: Template name is required for template mode');
        }
        if (!finalTemplateText || finalTemplateText.trim() === '') {
          throw new Error('WhatsApp Business: Template text is required for template mode');
        }
      
      } else {
        // Regular message mode validation
        // For base64 media, message content is optional (will be sent as media)
        if (!shouldSendAsMedia && (!finalMessage || finalMessage.trim() === '')) {
          throw new Error('WhatsApp Business: Message content is required for message mode');
        }
     
      }

      // Validate phone number format
      const phoneRegex = /^\+[1-9]\d{1,14}$/;
      if (!phoneRegex.test(finalPhoneNumber)) {
        console.warn(' Phone number may not be in correct international format:', finalPhoneNumber);
      }

      // Prepare WhatsApp message payload
      const whatsappPayload: Record<string, any> = {
        to: finalPhoneNumber,
        api_key: effectiveApiKey,
        phone_number_id: '',
        business_account_id: '',
        api_version: 'v20.0'
      };

      // Add template configuration if in template mode
       if (messageMode === 'template') {
        whatsappPayload.template = {
          name: finalTemplateName,
          language: finalTemplateLanguage
        };
        
        // Add template parameters if provided
        if (parsedTemplateParameters && parsedTemplateParameters.length > 0) {
          whatsappPayload.template.components = [
            {
              type: 'body',
              parameters: parsedTemplateParameters.map(param => ({
                type: 'text',
                text: String(param)
              }))
            }
          ];
        }
        
       
      }

      // Handle base64 media or regular text/media (only for message mode)
      if (messageMode === 'message' && shouldSendAsMedia && detectedBase64Content) {
        //  ENHANCED: Send base64 content as media
      
        
        // Generate a filename based on detected type
        const fileExtensions: Record<string, string> = {
          image: 'jpg',
          video: 'mp4',
          audio: 'mp3',
          document: 'pdf'
        };
        
        const fileExtension = detectedFileType ? (fileExtensions[detectedFileType] || 'bin') : 'bin';
        const fileName = `file_${Date.now()}.${fileExtension}`;
        
        whatsappPayload.media = {
          type: detectedFileType,
          base64: detectedBase64Content,
          filename: fileName
        };
        
        // Add caption if there was any remaining text
        if (finalMessage && finalMessage.trim()) {
          whatsappPayload.media.caption = finalMessage;
        }
        
      
        
      } else if (messageMode === 'message' && configuredMediaType !== 'none' && finalMediaUrl) {
        // Regular media URL
        whatsappPayload.media = {
          type: configuredMediaType,
          url: finalMediaUrl
        };
        
        // Add text as caption if media is present
        if (finalMessage && finalMessage.trim()) {
          whatsappPayload.media.caption = finalMessage;
        }
      } else if (messageMode === 'message') {
        // Regular text message (only for message mode)
        whatsappPayload.text = finalMessage;
      }


      
   

      try {
        // Construct full URL for server-side fetch (Next.js API routes)
        // Browser context uses relative URLs, server context uses absolute URLs
        const baseUrl = typeof window !== 'undefined' 
          ? '' 
          : (process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000');
        const apiUrl = `${baseUrl}/api/whatsapp-business/send`;
        
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(whatsappPayload)
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(`WhatsApp API error: ${response.status} - ${errorData.message || 'Unknown error'}`);
        }

        const result = await response.json();
        
 

        const whatsappResult: Record<string, any> = {
          success: true,
          messageId: result.messageId || result.id,
          to: finalPhoneNumber,
          messageMode,
          message: messageMode === 'template' ? null : (shouldSendAsMedia ? (whatsappPayload.media?.caption || '') : finalMessage),
          template: messageMode === 'template' ? {
            name: finalTemplateName,
            language: finalTemplateLanguage,
            text: finalTemplateText,
            parameters: parsedTemplateParameters
          } : null,
          mediaType: shouldSendAsMedia ? detectedFileType : (configuredMediaType !== 'none' ? configuredMediaType : null),
          mediaUrl: shouldSendAsMedia ? null : (finalMediaUrl || null),
          base64Media: shouldSendAsMedia ? {
            type: detectedFileType,
            filename: whatsappPayload.media?.filename,
            size: detectedBase64Content ? detectedBase64Content.length : 0,
            hasCaption: !!(whatsappPayload.media?.caption)
          } : null,
          timestamp: new Date().toISOString(),
          provider: 'whatsapp-business',
          status: result.status || 'sent',
          rawResponse: result
        };

        // Store result in data flow system for dataFlow.current() and dataFlow.getByNodeId() access
        if (!flowResults.nodeResults) flowResults.nodeResults = {};
        if (!flowResults.variables) flowResults.variables = {};
        
        const resultVariable = `whatsappResult_${'whatsapp-business-1770013830209'.replace(/[^a-zA-Z0-9]/g, '_')}`;
        
        // Store in multiple accessible locations
        flowResults.variables[resultVariable] = whatsappResult;
        flowResults.nodeResults['whatsapp-business-1770013830209'] = {
          nodeId: 'whatsapp-business-1770013830209',
          nodeType: 'whatsapp-business',
          stepNumber: 3,
          displayName: 'whatsapp-business-1770013830209',
          data: whatsappResult,
          timestamp: new Date().toISOString(),
          success: true
        };

        // 🔧 CRITICAL: Update currentResult for dataFlow.current() access
        flowResults.previousResult = flowResults.currentResult;
        flowResults.currentResult = whatsappResult;
        
        

      
        
        return whatsappResult as any;

      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(' Error in WhatsApp Business Node whatsapp-business-1770013830209:', error);

        const errorResult: Record<string, any> = {
          success: false,
          error: errorMessage,
          to: finalPhoneNumber,
          messageMode,
          message: messageMode === 'template' ? null : finalMessage,
          template: messageMode === 'template' ? {
            name: finalTemplateName,
            language: finalTemplateLanguage,
            text: finalTemplateText,
            parameters: parsedTemplateParameters
          } : null,
          timestamp: new Date().toISOString(),
          provider: 'whatsapp-business'
        };

        // Store error result in data flow system
        if (!flowResults.nodeResults) flowResults.nodeResults = {};
        if (!flowResults.variables) flowResults.variables = {};
        
        const resultVariable = `whatsappResult_${'whatsapp-business-1770013830209'.replace(/[^a-zA-Z0-9]/g, '_')}`;
        
        flowResults.variables[resultVariable] = errorResult;
        flowResults.nodeResults['whatsapp-business-1770013830209'] = {
          nodeId: 'whatsapp-business-1770013830209',
          nodeType: 'whatsapp-business',
          stepNumber: 3,
          displayName: 'whatsapp-business-1770013830209',
          data: errorResult,
          timestamp: new Date().toISOString(),
          success: false,
          error: errorMessage
        };

        // 🔧 CRITICAL: Update currentResult even for errors so flow can continue
        flowResults.previousResult = flowResults.currentResult;
        flowResults.currentResult = errorResult;

        throw error;
      }
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['whatsapp-business-1770013830209'] = {
      nodeId: 'whatsapp-business-1770013830209',
      nodeType: 'whatsapp-business',
      stepNumber: 3,
      displayName: 'whatsapp-businessResult_whatsapp_business_1770013830209',
      data: step3Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for whatsapp-business
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['whatsapp-businessResult_whatsapp_business_1770013830209'] || typeof flowResults['whatsapp-businessResult_whatsapp_business_1770013830209'] === 'undefined') {
      flowResults['whatsapp-businessResult_whatsapp_business_1770013830209'] = step3Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
      
      if (flowResults.currentResult !== undefined && 
          flowResults.stepCounter > 2) {
        currentResult = flowResults.currentResult;
      } else {
        currentResult = step3Result;
      }
    } catch (stepError) {
      const stepErrorMessage = stepError instanceof Error ? stepError.message : String(stepError) || 'Unknown step error';
      console.error('❌ Error in step 3 (whatsapp-business):', stepError);
      flowErrors.push(`Step 3 (whatsapp-business): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step3Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'whatsapp-business',
        nodeId: 'whatsapp-business-1770013830209',
        stepNumber: 3
      };
      
      currentResult = step3Result; // Update currentResult even on error
      
      // Store error result in enhanced data flow system
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['whatsapp-business-1770013830209'] = {
      nodeId: 'whatsapp-business-1770013830209',
      nodeType: 'whatsapp-business',
      stepNumber: 3,
      displayName: 'whatsapp-businessResult_whatsapp_business_1770013830209',
      data: step3Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for whatsapp-business
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['whatsapp-businessResult_whatsapp_business_1770013830209'] || typeof flowResults['whatsapp-businessResult_whatsapp_business_1770013830209'] === 'undefined') {
      flowResults['whatsapp-businessResult_whatsapp_business_1770013830209'] = step3Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
    }

    step4Result = currentResult;
    try {
      
    const scriptEventPayload_script_event_1771000297528 = initialData || {};
    const scriptContextData_script_event_1771000297528 =
      scriptEventPayload_script_event_1771000297528.scriptContext ||
      scriptEventPayload_script_event_1771000297528.contextData ||
      scriptEventPayload_script_event_1771000297528;

    if (scriptContextData_script_event_1771000297528 && typeof scriptContextData_script_event_1771000297528 === 'object') {
      (flowResults as any).variables = (flowResults as any).variables || {};
      Object.entries(scriptContextData_script_event_1771000297528).forEach(([key, value]) => {
        if (key === 'scriptContext' || key === 'contextData') return;
        (flowResults as any)[key] = value;
        (flowResults as any).variables[key] = value;
      });
    }

    // Resolve inputVariableMappings and store in scriptEventParameters
    const inputVariableMappings_script_event_1771000297528 = {"innerHTML":"{{whatsappMessageBody}}  {{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770013824184\")}}"};
    const resolvedParameters_script_event_1771000297528: Record<string, any> = {};
    
    const resolveScriptMapping = (mappingValue: any) => {
      if (mappingValue === null || mappingValue === undefined) return undefined;
      if (typeof mappingValue !== 'string') return mappingValue;
      const trimmed = mappingValue.trim();
      if (!trimmed) return undefined;
      
      if (trimmed.includes('{{') && trimmed.includes('}}')) {
        const templateContext = {
          ...flowResults,
          dataFlow: typeof dataFlow !== 'undefined' ? dataFlow : undefined,
          currentResult: currentResult,
          previousResult: flowResults.previousResult
        };
        
        // CRITICAL FIX: Check if this is a pure dataFlow.getByNodeId() expression
        // If so, we need to return the actual object, not a string
        const pureDataFlowGetPattern = /^\{\{\s*dataFlow\.getByNodeId\(['"]([^'"]+)['"]\)\s*\}\}$/;
        const pureMatch = trimmed.match(pureDataFlowGetPattern);
        if (pureMatch) {
          const nodeId = pureMatch[1];
          try {
            // Try to get the actual object value directly
            if (typeof flowResults !== 'undefined' && flowResults.nodeResults && flowResults.nodeResults[nodeId]) {
              const nodeData = flowResults.nodeResults[nodeId];
              // Return the actual data object, not a string
              if (nodeData && typeof nodeData === 'object' && nodeData.data !== undefined) {
                let extractedData = nodeData.data;
                
                // CRITICAL FIX: Extract the actual array from API response objects
                // API responses are often wrapped like: { 'getNested-xxxResult': [...], apiSuccess: true }
                // We need to extract the array if it exists
                if (typeof extractedData === 'object' && extractedData !== null && !Array.isArray(extractedData)) {
                  // Check for common result property names
                  const resultKeys = Object.keys(extractedData).filter(key => 
                    key.includes('Result') || 
                    key.includes('data') || 
                    key.includes('items') ||
                    key.includes('records')
                  );
                  
                  // If we find a result key that contains an array, use that
                  for (const key of resultKeys) {
                    if (Array.isArray(extractedData[key])) {
                      console.log(`✅ Extracted array from API response property "${key}"`);
                      extractedData = extractedData[key];
                      break;
                    }
                  }
                  
                  // If no result key found but the object has array-like properties, check all values
                  if (!Array.isArray(extractedData)) {
                    const allValues = Object.values(extractedData);
                    const arrayValue = allValues.find(v => Array.isArray(v));
                    if (arrayValue) {
                      console.log('✅ Found array in API response object values');
                      extractedData = arrayValue;
                    }
                  }
                }
                
                console.log('✅ Resolved dataFlow.getByNodeId to actual object:', nodeId, extractedData);
                return extractedData;
              }
            } else if (typeof dataFlow !== 'undefined' && dataFlow.getByNodeId) {
              let nodeResult = dataFlow.getByNodeId(nodeId);
              if (nodeResult !== undefined && nodeResult !== null) {
                // CRITICAL FIX: Extract array from API response objects
                if (typeof nodeResult === 'object' && !Array.isArray(nodeResult)) {
                  const resultKeys = Object.keys(nodeResult).filter(key => 
                    key.includes('Result') || 
                    key.includes('data') || 
                    key.includes('items') ||
                    key.includes('records')
                  );
                  
                  for (const key of resultKeys) {
                    if (Array.isArray(nodeResult[key])) {
                      console.log(`✅ Extracted array from dataFlow result property "${key}"`);
                      nodeResult = nodeResult[key];
                      break;
                    }
                  }
                  
                  if (!Array.isArray(nodeResult)) {
                    const allValues = Object.values(nodeResult);
                    const arrayValue = allValues.find(v => Array.isArray(v));
                    if (arrayValue) {
                      console.log('✅ Found array in dataFlow result object values');
                      nodeResult = arrayValue;
                    }
                  }
                }
                
                console.log('✅ Resolved dataFlow.getByNodeId to actual object via dataFlow:', nodeId, nodeResult);
                return nodeResult;
              }
            }
          } catch (e) {
            console.warn('⚠️ Failed to resolve dataFlow.getByNodeId as object:', e);
          }
        }
        
        try {
          if (typeof TemplateExpressionEngine !== 'undefined' && typeof TemplateExpressionEngine.evaluate === 'function') {
            const cleanExpression = trimmed.replace(/[{}]/g, '').trim();
            const evaluated = TemplateExpressionEngine.evaluate(cleanExpression, templateContext, {
              allowComplexExpressions: true,
              allowFunctions: true,
              securityLevel: 'moderate',
              returnType: 'auto',
              fallbackValue: trimmed
            });
            // CRITICAL FIX: Return the actual evaluated value, not a string
            if (evaluated !== undefined && evaluated !== null && evaluated !== trimmed) {
              console.log('✅ TemplateExpressionEngine evaluated to:', evaluated);
              return evaluated;
            }
          }
        } catch (error) {
          console.warn('⚠️ Script-event mapping evaluation failed:', error);
        }
        
        // Fallback: manual template resolution (for string concatenations)
        const dataFlowCurrentPattern = /\{\{\s*dataFlow\.current\(\)\s*\}\}/g;
        let resolved = trimmed.replace(dataFlowCurrentPattern, () => {
          if (typeof flowResults !== 'undefined' && flowResults.currentResult !== undefined) {
            return String(flowResults.currentResult);
          } else if (typeof dataFlow !== 'undefined' && typeof dataFlow.current === 'function') {
            return String(dataFlow.current());
          }
          return '';
        });
        
        const dataFlowGetPattern = /\{\{\s*dataFlow\.getByNodeId\(['"]([^'"]+)['"]\)(?:.([^}]+))?\s*\}\}/g;
        resolved = resolved.replace(dataFlowGetPattern, (match, nodeId, propertyPath) => {
          try {
            if (typeof flowResults !== 'undefined' && flowResults.nodeResults && flowResults.nodeResults[nodeId]) {
              let nodeData = flowResults.nodeResults[nodeId];
              if (propertyPath && typeof nodeData === 'object') {
                const value = nodeData[propertyPath] || (nodeData.data && nodeData.data[propertyPath]);
                return value !== undefined ? String(value) : '';
              }
              // For string concatenation fallback, convert to JSON string
              return typeof nodeData === 'object' ? JSON.stringify(nodeData.data || nodeData) : String(nodeData);
            } else if (typeof dataFlow !== 'undefined' && dataFlow.getByNodeId) {
              const nodeResult = dataFlow.getByNodeId(nodeId);
              if (nodeResult !== undefined && nodeResult !== null) {
                if (propertyPath && typeof nodeResult === 'object') {
                  const value = nodeResult[propertyPath] || (nodeResult.data && nodeResult.data[propertyPath]);
                  return value !== undefined ? String(value) : '';
                }
                // For string concatenation fallback, convert to JSON string
                return typeof nodeResult === 'object' ? JSON.stringify(nodeResult.data || nodeResult) : String(nodeResult);
              }
            }
          } catch (e) {
            console.warn('⚠️ Failed to resolve dataFlow.getByNodeId:', e);
          }
          return '';
        });
        
        return resolved !== trimmed ? resolved : trimmed;
      }
      return trimmed;
    };
    
    Object.entries(inputVariableMappings_script_event_1771000297528).forEach(([key, mappingValue]) => {
      const resolvedValue = resolveScriptMapping(mappingValue);
      console.log(`🔍 Resolving script mapping for "${key}":`, {
        mappingValue,
        resolvedValue,
        resolvedType: typeof resolvedValue,
        isArray: Array.isArray(resolvedValue),
        isObject: typeof resolvedValue === 'object' && resolvedValue !== null
      });
      
      // CRITICAL FIX: Allow arrays and objects even if they're empty
      // Only reject undefined, null, and empty strings
      if (resolvedValue !== undefined && resolvedValue !== null) {
        // Allow empty arrays and objects
        if (Array.isArray(resolvedValue) || (typeof resolvedValue === 'object' && resolvedValue !== null)) {
          resolvedParameters_script_event_1771000297528[key] = resolvedValue;
          console.log(`✅ Set ${key} to:`, resolvedValue);
        } else if (typeof resolvedValue === 'string' && resolvedValue.trim() !== '') {
          // Only set non-empty strings
          resolvedParameters_script_event_1771000297528[key] = resolvedValue;
          console.log(`✅ Set ${key} to string:`, resolvedValue);
        } else if (typeof resolvedValue !== 'string') {
          // Allow numbers, booleans, etc.
          resolvedParameters_script_event_1771000297528[key] = resolvedValue;
          console.log(`✅ Set ${key} to:`, resolvedValue);
        } else {
          console.warn(`⚠️ Skipping ${key} - empty string`);
        }
      } else {
        console.warn(`⚠️ Skipping ${key} - resolvedValue is ${resolvedValue}`);
      }
    });
    
    console.log('📦 Resolved parameters:', resolvedParameters_script_event_1771000297528);
    
    const mergedParameters_script_event_1771000297528 = {
      ...(scriptEventPayload_script_event_1771000297528?.parameters || {}),
      ...resolvedParameters_script_event_1771000297528
    };
    
    // Store resolved parameters in flowResults.scriptEventParameters
    if (Object.keys(mergedParameters_script_event_1771000297528).length > 0) {
      (flowResults as any).scriptEventParameters = mergedParameters_script_event_1771000297528;
      console.log('💾 Stored scriptEventParameters in flowResults:', mergedParameters_script_event_1771000297528);
      
      // Push parameters to __scriptContext so UI scripts can access them
      if (typeof window !== 'undefined') {
        const scriptContext = (window as any).__scriptContext;
        if (scriptContext && typeof scriptContext.setData === 'function') {
          console.log('📤 Pushing parameters to scriptContext...');
          Object.entries(mergedParameters_script_event_1771000297528).forEach(([key, value]) => {
            console.log(`  Setting scriptContext.${key} =`, value);
            scriptContext.setData(key, value);
          });
          console.log('✅ All parameters pushed to scriptContext');
        } else {
          console.error('❌ scriptContext not available or setData not a function:', {
            hasScriptContext: !!scriptContext,
            hasSetData: scriptContext && typeof scriptContext.setData === 'function'
          });
        }
      } else {
        console.warn('⚠️ window is not available');
      }
    } else {
      console.warn('⚠️ No parameters to store - mergedParameters is empty');
    }

    step4Result = {
      ...scriptEventPayload_script_event_1771000297528,
      parameters: mergedParameters_script_event_1771000297528,
      scriptId: scriptEventPayload_script_event_1771000297528?.scriptId || scriptEventPayload_script_event_1771000297528?.script_id || '043f403a-ae56-4687-b921-5b2efd2815ac',
      scriptName: scriptEventPayload_script_event_1771000297528?.scriptName,
      trigger: scriptEventPayload_script_event_1771000297528?.trigger || 'script-event',
      timestamp: initialData?.timestamp || new Date().toISOString()
    };
    (flowResults as any).scriptEventResult = step4Result;
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['script-event-1771000297528'] = {
      nodeId: 'script-event-1771000297528',
      nodeType: 'script-event',
      stepNumber: 4,
      displayName: 'scriptEventResult_script_event_1771000297528',
      data: step4Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for script-event
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['scriptEventResult_script_event_1771000297528'] || typeof flowResults['scriptEventResult_script_event_1771000297528'] === 'undefined') {
      flowResults['scriptEventResult_script_event_1771000297528'] = step4Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
      
      if (flowResults.currentResult !== undefined && 
          flowResults.stepCounter > 3) {
        currentResult = flowResults.currentResult;
      } else {
        currentResult = step4Result;
      }
    } catch (stepError) {
      const stepErrorMessage = stepError instanceof Error ? stepError.message : String(stepError) || 'Unknown step error';
      console.error('❌ Error in step 4 (script-event):', stepError);
      flowErrors.push(`Step 4 (script-event): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step4Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'script-event',
        nodeId: 'script-event-1771000297528',
        stepNumber: 4
      };
      
      currentResult = step4Result; // Update currentResult even on error
      
      // Store error result in enhanced data flow system
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['script-event-1771000297528'] = {
      nodeId: 'script-event-1771000297528',
      nodeType: 'script-event',
      stepNumber: 4,
      displayName: 'scriptEventResult_script_event_1771000297528',
      data: step4Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for script-event
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['scriptEventResult_script_event_1771000297528'] || typeof flowResults['scriptEventResult_script_event_1771000297528'] === 'undefined') {
      flowResults['scriptEventResult_script_event_1771000297528'] = step4Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
    }

    // Make flowResults globally available for table and other component access
    if (typeof window !== 'undefined') {
      (window as any).flowResults = flowResults;
      console.log('🌐 Made flowResults globally available:', flowResults);
          // Store as main chain data for cross-chain access
      (window as any).mainChainFlowResults = flowResults;
      console.log('🔗 Stored main chain data for cross-chain access:', {
        nodeResults: Object.keys(flowResults.nodeResults || {}),
        aiResponses: Object.keys(flowResults.aiResponses || {}),
        variables: Object.keys(flowResults.variables || {})
      });
      
      // CRITICAL: Initialize button chain registry for dynamic chain ID lookup
      if (!(window as any).buttonChainRegistry) {
        (window as any).buttonChainRegistry = {};
      }
      
      // Register this chain if it's a button-triggered chain
      if ('flow_whatsapp-trigger-1770013817891_1771079854994'.includes('button')) {
        // Extract button node information from chain
        const buttonNodes = Object.values(flowResults.nodeResults || {}).filter(
          (result: any) => result.nodeType === 'button'
        );
        
        buttonNodes.forEach((buttonNode: any) => {
          // Store chain ID mapped to button element ID
          if (buttonNode.elementId) {
            (window as any).buttonChainRegistry[buttonNode.elementId] = 'flow_whatsapp-trigger-1770013817891_1771079854994';
            console.log(`🔗 Registered button chain: ${buttonNode.elementId} → flow_whatsapp-trigger-1770013817891_1771079854994`);
          }
        });
      }
      
      // Add memory management helper functions to window
       (window as any).getConversationHistory = function(agentId :any, userId :any, storageType = 'simple') {
        try {
          const storage = storageType === 'session' ? sessionStorage : localStorage;
          const storageKey = `smart_agent_memory_${agentId}_${userId}`;
          const stored = storage.getItem(storageKey);
          return stored ? JSON.parse(stored) : [];
        } catch (error) {
          console.error('💭 Failed to get conversation history:', error);
          return [];
        }
      };
      
      (window as any).clearConversationHistory = function(agentId :any, userId :any, storageType = 'simple') {
        try {
          const storage = storageType === 'session' ? sessionStorage : localStorage;
          const storageKey = `smart_agent_memory_${agentId}_${userId}`;
          storage.removeItem(storageKey);
          console.log('💭 Cleared conversation history for:', storageKey);
          return true;
        } catch (error) {
          console.error('💭 Failed to clear conversation history:', error);
          return false;
        }
      };
      
      console.log("💭 Memory management helpers added to window:", ['getConversationHistory', 'clearConversationHistory']);
      
      // Dispatch events for component integration (especially tables)
      (window as any).dispatchEvent(new CustomEvent('workflowCompleted', { 
        detail: { flowResults, chainId: 'flow_whatsapp-trigger-1770013817891_1771079854994' } 
      }));
      (window as any).dispatchEvent(new CustomEvent('flowExecutionCompleted', { 
        detail: { flowResults, chainId: 'flow_whatsapp-trigger-1770013817891_1771079854994' } 
      }));
      console.log("📡 Dispatched workflow completion events");
    }
    
    return {
      success: true,
      results: flowResults,
      errors: flowErrors,
      chainId: 'flow_whatsapp-trigger-1770013817891_1771079854994'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) || 'Unknown error';
    console.error('❌ Flow chain execution error:', error);
    return {
      success: false,
      results: flowResults,
      errors: [...flowErrors, errorMessage],
      chainId: 'flow_whatsapp-trigger-1770013817891_1771079854994'
    };
  }
};







// Register workflow nodes in global registry for cross-workflow node lookups
if (workflowRegistry && workflowRegistry.allNodes) {
  const workflowNodes = [{"id":"whatsapp-trigger-1770013817891","nodeType":"whatsapp-trigger","config":{"label":{"key":null,"ref":null,"type":"div","props":{"children":[{"key":null,"ref":null,"type":"div","props":{"children":"WhatsApp Trigger"},"_owner":null,"_store":{}},{"key":null,"ref":null,"type":"div","props":{"data-node-id":"whatsapp-trigger-1770013817891"},"_owner":null,"_store":{}}],"className":"relative p-2"},"_owner":null,"_store":{}},"webhookUrl":"https://devapp.simplita.in/webhook/whatsapp/whatsapp-trigger-1770013817891","verifyToken":"whatsapp_whatsapp-trigger-1770013817891_hOXNtn2QVD5v7a84P1Z1HWgkAbk7A5L2","messageFilter":{"enabled":false},"phoneNumberId":"","subscribedFields":{"messages":true,"message_status":false,"phone_number_name":false,"account_review_update":false},"whatsappBusinessAccountId":""}},{"id":"openaiAgentSDKNode-1770013824184","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"OpenAI Agent","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770014049164","url":"https://supabase-crud.simplita.ai/mcp","name":"Supabase","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770014052268","url":"https://newgooglecalendar-czvc54.simplita.ai/mcp","name":"Calendar","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"{{whatsappMessageBody}}\n{{whatsappMessageFrom}}","agentSDKType":"orchestrator","credentialId":"","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are an AI Agent for Vitality Research Centre, and you must operate using both MCP tools as a single assistant.\n:warning: MANDATORY TOOL EXECUTION ORDER\nYou MUST execute the CRUD MCP tool first to store the name and phonenumber, and then execute the Calendar MCP tool — this is compulsory.\n:receipt: CHAT HISTORY SAVING RULE (CRITICAL — MUST EXECUTE FOR EVERY MESSAGE)\nFor EVERY user message and EVERY AI response, you MUST save the conversation to the chat_history column in the \"crudsupabase\" table.\nThis is MANDATORY and must happen for EVERY conversation exchange — it must NEVER be skipped.\nCRITICAL 3-STEP PROCESS (MUST FOLLOW EXACTLY):\nFor EACH user message:\nSTEP 1: FIRST — Read existing chat_history\n  → Call supabase-crud → read/select → Find record where phonenumber = {{whatsappMessageFrom}} → Get the existing chat_history value (if it exists, otherwise use empty string \"\")\nSTEP 2: SECOND — Append to existing history\n  → Take the existing chat_history value you just read\n  → Append \"\\nUser: <exact user message>\" to it\n  → Create new value: existing_chat_history + \"\\nUser: <exact user message>\"\nSTEP 3: THIRD — Save complete updated history\n  → Call supabase-crud → update → Find record where phonenumber = {{whatsappMessageFrom}} → Set chat_history = the new value from STEP 2 (which includes ALL previous conversations + new user message)\nFor EACH AI response:\nSTEP 1: FIRST — Read existing chat_history\n  → Call supabase-crud → read/select → Find record where phonenumber = {{whatsappMessageFrom}} → Get the existing chat_history value (it should already contain previous conversations including the user message you just saved)\nSTEP 2: SECOND — Append to existing history\n  → Take the existing chat_history value you just read\n  → Append \"\\nAI: <your exact response>\" to it\n  → Create new value: existing_chat_history + \"\\nAI: <your exact response>\"\nSTEP 3: THIRD — Save complete updated history\n  → Call supabase-crud → update → Find record where phonenumber = {{whatsappMessageFrom}} → Set chat_history = the new value from STEP 2 (which includes ALL previous conversations + new AI response)\nCRITICAL REQUIREMENTS:\n- You MUST ALWAYS read the existing chat_history FIRST before updating (STEP 1 is mandatory)\n- You MUST preserve ALL previous conversations — never replace, always append\n- The final chat_history should contain ALL conversation exchanges from the very beginning in chronological order\n- Format example: \"User: hello\\nAI: hi there\\nUser: my name is kunju\\nAI: thanks kunju\\nUser: can you view details\\nAI: here are your details...\"\n- If the user doesn't exist yet, create the record first with name and phonenumber, then initialize chat_history with the first message\n- NEVER overwrite or replace existing chat_history — always read first, then append, then save\n:dart: ROLE & BEHAVIOR\nYour role is to reply to user queries.\nIf the user asks about the Vitality Research Centre or their weight reduction plans, you MUST explain the information simply and clearly and answer their related questions.\nYou must not mention or reveal that any information is being stored in a database.\nAfter explaining, politely ask the user to provide their name (this is important).\nIf the user does not provide their name → politely ask again for their name after addressing their queries.\nIf the user provides their name → proceed to store the name and phonenumber in the database using the MCP tool.\nOnce the name and phonenumber stored, Then use the calendar MCP tool to schedule in google calendar based on the details given.\nDo not respond unnecessarily to unrelated messages.\n:speech_balloon: ADDITIONAL USER HANDLING LOGIC\nUser can ask any questions like what is orientation call or etc etc etc, and the steps should continue normally as per the flow above.\nIf the user uses any greeting terms like hi, hello, hey, or asks anything like \"can I reschedule my call\" or \"can I view my details again,\" then you must check with the phonenumber we already have and the details stored in Supabase.\nCase A — Existing User\nIf the phonenumber {{whatsappMessageFrom}} already exists in Supabase, reply:\n\"Looks like you're already registered with us, {{name}}. Would you like to view your details or reschedule your orientation call?\"\nCase B — New User\nIf the user does not exist in Supabase, then insert into crudsupabase:\nname = user's name\nphonenumber = {{whatsappMessageFrom}}\nThen respond:\n\"Thanks for contacting us, {{name}}. At what date and time can we schedule your orientation call to share more details about the plans?\"\nThen continue the same workflow as already defined.\n:file_cabinet: DATA STORAGE VIA CRUD MCP TOOL\nYou are also a data management assistant.\nYour task is to interact with the Supabase database using the supabase-crud tool.\n:gear: MANDATORY ACTIONS\nYou MUST call the supabase-crud function to perform all database operations.\nYou MUST extract the name from the user's conversation message.\nYou MUST extract the phonenumber from the variable {{whatsappMessageFrom}}.\nYou MUST read all the data in supabase, if the phonenumber from {{whatsappMessageFrom}} already exist, you should NOT create the current data in supabase.\nCRITICAL — CHAT HISTORY SAVING:\nYou MUST save chat history for EVERY conversation exchange using this EXACT 3-STEP PROCESS:\nFor EACH user message:\n1. FIRST: Call supabase-crud → read → Find record where phonenumber = {{whatsappMessageFrom}} → READ existing chat_history value\n2. SECOND: Append \"\\nUser: <user message>\" to the existing chat_history you just read\n3. THIRD: Call supabase-crud → update → Find record where phonenumber = {{whatsappMessageFrom}} → Set chat_history = existing_chat_history + \"\\nUser: <user message>\"\nFor EACH AI response:\n1. FIRST: Call supabase-crud → read → Find record where phonenumber = {{whatsappMessageFrom}} → READ existing chat_history value\n2. SECOND: Append \"\\nAI: <your response>\" to the existing chat_history you just read\n3. THIRD: Call supabase-crud → update → Find record where phonenumber = {{whatsappMessageFrom}} → Set chat_history = existing_chat_history + \"\\nAI: <your response>\"\nCRITICAL: You MUST read existing chat_history FIRST (STEP 1) before updating. The chat_history column must contain ALL conversations from the beginning. Each new message must be APPENDED to existing chat_history (read first, then append, then save). NEVER replace existing chat_history — always preserve all previous conversations. This is MANDATORY for every message exchange.\n:clipboard: TABLE DETAILS\nCRITICAL: The table name is \"crudsupabase\" — you MUST always specify this exact table name when calling the supabase-crud function. Never use \"users\" or any other table name. Always use \"crudsupabase\" as the table name parameter.\nTable name: crudsupabase\n:wrench: SUPPORTED OPERATIONS\nInsert/Create: Add new records to the \"crudsupabase\" table\nUpdate: Modify existing records in the \"crudsupabase\" table (based on matching name or ID)\nDelete: Remove records from the \"crudsupabase\" table (based on a condition)\nRead/Select: Retrieve records or fetch all data from the \"crudsupabase\" table\n:rocket: EXECUTION RULE\nYou must execute the insert operation immediately by calling the supabase-crud function with table name \"crudsupabase\" — do not just acknowledge it.\nIf the user requests another operation (update, delete, or select), perform that specific operation on the \"crudsupabase\" table accordingly.\nREMINDER: For EVERY user message and EVERY AI response, you MUST follow the 3-STEP PROCESS: (1) FIRST read existing chat_history from \"crudsupabase\" table for phonenumber = {{whatsappMessageFrom}}, (2) SECOND append the new message to the existing chat_history (preserving ALL previous conversations), (3) THIRD save the complete updated chat_history back to \"crudsupabase\" table. NEVER replace existing chat_history — always read first, then append, then save. This ensures ALL conversations from the beginning are preserved. This is non-negotiable and must happen for every single message exchange.\n:speech_balloon: RESPONSE RULE\nAfter successfully storing the data, do not send or mention any message such as \"data stored\" or \"saved in the database.\"\nInstead, reply to any user queries and then send the following message:\n\"Thanks for contacting us. Our doctors will contact you as soon as possible. At what date and time can we schedule an Orientation call to share the details regarding the plans.\"\n:date: VIA CALENDAR MCP TOOL\nAfter asking the question regarding the date and time for call, then execute calendar MCP tool.\nThis tool should execute only after the CRUD MCP tool has been executed.\nYou will recieve date and time in this format:\nDate: {{date}}\nTime: {{time}}\n:scales: CONDITIONAL LOGIC — SLOT AVAILABILITY CHECK (Before Scheduling the Event)\nBefore creating the event in Google Calendar, you MUST check whether the requested date and time slot is already booked.\nSteps to follow:\nRetrieve all existing events from the configured Google Calendar (calendar_id).\nCompare the user's requested date and time with the existing scheduled events.\nIf the requested slot is already booked, reply to the user:\n\"The selected slot ({{date}} at {{time}}) is already booked. Would you like to reschedule to another available time?\"\nThen, calculate and display the next two available slots, each separated by 30 minutes, in the same day or the next available day. Example:\n\"Here are the next available time slots you can choose from:\n7:30 AM\n8:00 AM\"\nIf the user selects one of the available slots, update the selected date and time accordingly, and then proceed to create the event in Google Calendar.\nIf the requested slot is not booked, directly schedule the event in Google Calendar as per the existing flow.\nYou MUST extract the date and time in am or pm of event schedule from the conversation and create the event in google calendar.\nDefault calendar_id: c51c958ccfdffb580ee5ad1e69dbab503e6331e53459e60187faa2626f0439f4@group.calendar.google.com. Never use \"primary\". If the user provides a different calendar_id, use that instead and store it as the session default.\nDefault timezone: Asia/Kolkata unless the user specifies another IANA timezone. Interpret natural-language dates/times in the active timezone.\nYou MUST schedule the event in Google Calendar with the following details:\nSummary: Orientation Call - {{name}} (the name of the user which should be retrieved from Supabase \"crudsupabase\" table) - {{whatsappMessageFrom}} (the phonenumber of the user which should be retrieved from Supabase \"crudsupabase\" table)\nDescription: Call to share the details regarding the plans\nDate: You MUST extract the date from the chats\nTime: You MUST extract the time from the chats\nYou MUST extract the name from the user's input and include it in the calendar event.\nAfter creating event in calendar, then reply \"We will call you on scheduled time Please be available 10 minutes before the call — our doctor will be ready to begin your journey toward wellness.\"","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"openai_api_key":"process.env.OPENAI_API_KEY","resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","useStoredCredential":false,"auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}},{"id":"whatsapp-business-1770013830209","nodeType":"whatsapp-business","config":{"apiKey":"","message":"{{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770013824184\")}}","mediaUrl":"","mediaType":"none","apiVersion":"v20.0","messageMode":"message","phoneNumber":"{{whatsappMessageFrom}}","credentialId":"26755c9c-eb1e-4b5c-8e8a-b14eca389dcd","templateName":"","templateText":"","phoneNumberId":"","templateLanguage":"en_US","businessAccountId":"","useStoredCredential":true}},{"id":"script-event-1771000297528","nodeType":"script-event","config":{"pageId":"page-1770985628551516","scriptId":"043f403a-ae56-4687-b921-5b2efd2815ac","elementId":"component-1770985632248-4126","eventType":"onLoad","scriptKey":"page-1770985628551516::component-1770985632248-4126::onLoad::043f403a-ae56-4687-b921-5b2efd2815ac","scriptName":"chatbotvitality","actionValue":"newMessage","componentId":"component-1770985632248-4126","inputVariables":[{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}],"outputVariables":[{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"lastMessageTime","type":"object","source":"custom","description":"Output variable: lastMessageTime"},{"name":"messageCount","type":"object","source":"custom","description":"Output variable: messageCount"},{"name":"'result']","type":"object","source":"custom","description":"Variable: 'result']"},{"name":"'message'","type":"object","source":"custom","description":"Variable: 'message'"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"}],"inputVariableMappings":{"innerHTML":"{{whatsappMessageBody}}  {{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770013824184\")}}"}}}];
  // Only add nodes that don't already exist (by ID) to avoid duplicates
  workflowNodes.forEach((node: any) => {
    if (!workflowRegistry.allNodes.find((n: any) => n.id === node.id)) {
      workflowRegistry.allNodes.push(node);
    }
  });
  console.log('📋 Registered ' + workflowNodes.length + ' nodes in workflow registry (total: ' + workflowRegistry.allNodes.length + ')');
}



const executeAllFlows = async (triggerData: any = {}, specificChainId: string | null = null): Promise<any> => {
  // ✅ SOLUTION 2: Redirect flag check - Skip workflow execution if redirect is in progress
  if (typeof window !== 'undefined' && (window as any).__isRedirecting) {
    console.log('🛑 Skipping workflow execution - redirect in progress');
    return {
      success: false,
      skipped: true,
      reason: 'Redirect in progress',
      results: {}
    };
  }

  const results: Record<string, any> = {};
  const startTime = Date.now();

  
  // Initialize global execution tracker if not exists
  if (typeof window !== 'undefined' && !(window as any)._globalExecutionTracker) {
    (window as any)._globalExecutionTracker = {
      executedFlows: new Set(),
      isAutoExecutionComplete: false,
      executionInProgress: false
    };
  }
  
  // Check if this specific chain has already been executed recently
  if (typeof window !== 'undefined' && (window as any)._globalExecutionTracker && specificChainId) {
    const triggerType = triggerData?.trigger || 'manual';
    const executionKey = specificChainId + '_' + triggerType;
    if ((window as any)._globalExecutionTracker.executedFlows.has(executionKey)) {
      console.log('🛑 Chain already executed recently, skipping to prevent double execution:', executionKey);
      return { 
        success: false, 
        skipped: true, 
        reason: 'Already executed recently',
        chainId: specificChainId 
      };
    }
    (window as any)._globalExecutionTracker.executedFlows.add(executionKey);
    
    // Clean up old execution records after 5 seconds to allow re-execution
    setTimeout(() => {
      if ((window as any)._globalExecutionTracker) {
        (window as any)._globalExecutionTracker.executedFlows.delete(executionKey);
      }
    }, 5000);
  }

  console.log('🎯 Executing flow system...');
  if (specificChainId) {
    console.log('🎪 Running specific chain: ' + specificChainId);
  } else {
    console.log('🎪 Running all flow chains');
  }
  
  // Check if this is a page-load trigger
  const isPageLoadTrigger = triggerData && (triggerData.trigger === 'page-load' || triggerData.trigger === 'page-load-retry');
  if (isPageLoadTrigger) {
    const currentPath = triggerData.pageId || (typeof window !== 'undefined' ? (window as any).location.pathname : '/');
    console.log('🔍 Page load trigger detected for path:', currentPath);
  }
  
  
  // Execute flow_whatsapp-trigger-1770013817891_1771079854994
  if (!specificChainId || specificChainId === 'flow_whatsapp-trigger-1770013817891_1771079854994') {
    
    // ✅ CRITICAL FIX: This is a webhook-triggered workflow (whatsapp-trigger)
    // It should ONLY execute when triggered by its specific webhook, NOT on page load
    if (triggerData && triggerData.trigger === 'page-load') {
      results['flow_whatsapp-trigger-1770013817891_1771079854994'] = { 
        success: false, 
        skipped: true, 
        reason: 'Webhook workflow should not run on page load',
        chainId: 'flow_whatsapp-trigger-1770013817891_1771079854994',
        webhookType: 'whatsapp-trigger',
        actualTrigger: triggerData.trigger
      };
      // Don't return here, just skip to next workflow
    } else {
      // Proceed with webhook workflow execution
      try {
        const result_flow_whatsapp_trigger_1770013817891_1771079854994 = await executeFlowChain_flow_whatsapp_trigger_1770013817891_1771079854994(triggerData);
        results['flow_whatsapp-trigger-1770013817891_1771079854994'] = result_flow_whatsapp_trigger_1770013817891_1771079854994;
        
        if (!result_flow_whatsapp_trigger_1770013817891_1771079854994.success) {
          console.error('❌ Chain flow_whatsapp-trigger-1770013817891_1771079854994 failed:', result_flow_whatsapp_trigger_1770013817891_1771079854994.errors);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error) || 'Unknown error';
        console.error('💥 Error executing flow flow_whatsapp-trigger-1770013817891_1771079854994:', error);
        results['flow_whatsapp-trigger-1770013817891_1771079854994'] = { success: false, error: errorMessage, chainId: 'flow_whatsapp-trigger-1770013817891_1771079854994', results: {}, errors: [errorMessage] };
      }
    }
  }
  
  const endTime = Date.now();
  const executionTime = endTime - startTime;
  
  return {
    success: true,
    results,
    errors: [],
    chainId: 'master',
    executionTime,
    totalChains: 1,
    successfulChains: Object.values(results).filter((r: any) => r.success).length
  };
};

const getFlowChainInfo = (): any[] => {
  return [
  {
    "id": "flow_whatsapp-trigger-1770013817891_1771079854994",
    "nodeTypes": [
      "whatsapp-trigger",
      "openaiAgentSDKNode",
      "whatsapp-business",
      "script-event"
    ],
    "nodeCount": 4,
    "chainType": "linear",
    "startNode": {
      "id": "whatsapp-trigger-1770013817891",
      "nodeType": "whatsapp-trigger",
      "config": {
        "label": {
          "key": null,
          "ref": null,
          "type": "div",
          "props": {
            "children": [
              {
                "key": null,
                "ref": null,
                "type": "div",
                "props": {
                  "children": "WhatsApp Trigger"
                },
                "_owner": null,
                "_store": {}
              },
              {
                "key": null,
                "ref": null,
                "type": "div",
                "props": {
                  "data-node-id": "whatsapp-trigger-1770013817891"
                },
                "_owner": null,
                "_store": {}
              }
            ],
            "className": "relative p-2"
          },
          "_owner": null,
          "_store": {}
        },
        "webhookUrl": "https://devapp.simplita.in/webhook/whatsapp/whatsapp-trigger-1770013817891",
        "verifyToken": "whatsapp_whatsapp-trigger-1770013817891_hOXNtn2QVD5v7a84P1Z1HWgkAbk7A5L2",
        "messageFilter": {
          "enabled": false
        },
        "phoneNumberId": "",
        "subscribedFields": {
          "messages": true,
          "message_status": false,
          "phone_number_name": false,
          "account_review_update": false
        },
        "whatsappBusinessAccountId": ""
      }
    },
    "endNode": {
      "id": "script-event-1771000297528",
      "nodeType": "script-event",
      "config": {
        "pageId": "page-1770985628551516",
        "scriptId": "043f403a-ae56-4687-b921-5b2efd2815ac",
        "elementId": "component-1770985632248-4126",
        "eventType": "onLoad",
        "scriptKey": "page-1770985628551516::component-1770985632248-4126::onLoad::043f403a-ae56-4687-b921-5b2efd2815ac",
        "scriptName": "chatbotvitality",
        "actionValue": "newMessage",
        "componentId": "component-1770985632248-4126",
        "inputVariables": [
          {
            "name": "innerHTML",
            "type": "string",
            "source": "element",
            "description": "Element property: innerHTML"
          }
        ],
        "outputVariables": [
          {
            "name": "action",
            "type": "object",
            "source": "custom",
            "description": "Output variable: action"
          },
          {
            "name": "lastMessageTime",
            "type": "object",
            "source": "custom",
            "description": "Output variable: lastMessageTime"
          },
          {
            "name": "messageCount",
            "type": "object",
            "source": "custom",
            "description": "Output variable: messageCount"
          },
          {
            "name": "'result']",
            "type": "object",
            "source": "custom",
            "description": "Variable: 'result']"
          },
          {
            "name": "'message'",
            "type": "object",
            "source": "custom",
            "description": "Variable: 'message'"
          },
          {
            "name": "'response'",
            "type": "object",
            "source": "custom",
            "description": "Variable: 'response'"
          }
        ],
        "inputVariableMappings": {
          "innerHTML": "{{whatsappMessageBody}}  {{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770013824184\")}}"
        }
      }
    },
    "nodes": [
      {
        "id": "whatsapp-trigger-1770013817891",
        "nodeType": "whatsapp-trigger",
        "config": {
          "label": {
            "key": null,
            "ref": null,
            "type": "div",
            "props": {
              "children": [
                {
                  "key": null,
                  "ref": null,
                  "type": "div",
                  "props": {
                    "children": "WhatsApp Trigger"
                  },
                  "_owner": null,
                  "_store": {}
                },
                {
                  "key": null,
                  "ref": null,
                  "type": "div",
                  "props": {
                    "data-node-id": "whatsapp-trigger-1770013817891"
                  },
                  "_owner": null,
                  "_store": {}
                }
              ],
              "className": "relative p-2"
            },
            "_owner": null,
            "_store": {}
          },
          "webhookUrl": "https://devapp.simplita.in/webhook/whatsapp/whatsapp-trigger-1770013817891",
          "verifyToken": "whatsapp_whatsapp-trigger-1770013817891_hOXNtn2QVD5v7a84P1Z1HWgkAbk7A5L2",
          "messageFilter": {
            "enabled": false
          },
          "phoneNumberId": "",
          "subscribedFields": {
            "messages": true,
            "message_status": false,
            "phone_number_name": false,
            "account_review_update": false
          },
          "whatsappBusinessAccountId": ""
        }
      },
      {
        "id": "openaiAgentSDKNode-1770013824184",
        "nodeType": "openaiAgentSDKNode",
        "config": {
          "type": "openaiAgentSDKNode",
          "label": "OpenAI Agent",
          "model": "gpt-4.1-2025-04-14",
          "tools": [],
          "userId": "",
          "agentId": "",
          "nodeType": "openaiAgentSDK",
          "noteText": "",
          "sessionId": "",
          "isAgentSDK": true,
          "max_tokens": 1000,
          "memoryType": "simple",
          "description": "OpenAI Agent application",
          "mcp_servers": [
            {
              "id": "custom_mcp_1770014049164",
              "url": "https://supabase-crud.simplita.ai/mcp",
              "name": "Supabase",
              "enabled": true,
              "description": "Custom MCP Server"
            },
            {
              "id": "custom_mcp_1770014052268",
              "url": "https://newgooglecalendar-czvc54.simplita.ai/mcp",
              "name": "Calendar",
              "enabled": true,
              "description": "Custom MCP Server"
            }
          ],
          "temperature": 0.7,
          "user_prompt": "{{whatsappMessageBody}}\n{{whatsappMessageFrom}}",
          "agentSDKType": "orchestrator",
          "enableMemory": false,
          "handoff_mode": "transfer_control",
          "instructions": "You are an AI Agent for Vitality Research Centre, and you must operate using both MCP tools as a single assistant.\n:warning: MANDATORY TOOL EXECUTION ORDER\nYou MUST execute the CRUD MCP tool first to store the name and phonenumber, and then execute the Calendar MCP tool — this is compulsory.\n:receipt: CHAT HISTORY SAVING RULE (CRITICAL — MUST EXECUTE FOR EVERY MESSAGE)\nFor EVERY user message and EVERY AI response, you MUST save the conversation to the chat_history column in the \"crudsupabase\" table.\nThis is MANDATORY and must happen for EVERY conversation exchange — it must NEVER be skipped.\nCRITICAL 3-STEP PROCESS (MUST FOLLOW EXACTLY):\nFor EACH user message:\nSTEP 1: FIRST — Read existing chat_history\n  → Call supabase-crud → read/select → Find record where phonenumber = {{whatsappMessageFrom}} → Get the existing chat_history value (if it exists, otherwise use empty string \"\")\nSTEP 2: SECOND — Append to existing history\n  → Take the existing chat_history value you just read\n  → Append \"\\nUser: <exact user message>\" to it\n  → Create new value: existing_chat_history + \"\\nUser: <exact user message>\"\nSTEP 3: THIRD — Save complete updated history\n  → Call supabase-crud → update → Find record where phonenumber = {{whatsappMessageFrom}} → Set chat_history = the new value from STEP 2 (which includes ALL previous conversations + new user message)\nFor EACH AI response:\nSTEP 1: FIRST — Read existing chat_history\n  → Call supabase-crud → read/select → Find record where phonenumber = {{whatsappMessageFrom}} → Get the existing chat_history value (it should already contain previous conversations including the user message you just saved)\nSTEP 2: SECOND — Append to existing history\n  → Take the existing chat_history value you just read\n  → Append \"\\nAI: <your exact response>\" to it\n  → Create new value: existing_chat_history + \"\\nAI: <your exact response>\"\nSTEP 3: THIRD — Save complete updated history\n  → Call supabase-crud → update → Find record where phonenumber = {{whatsappMessageFrom}} → Set chat_history = the new value from STEP 2 (which includes ALL previous conversations + new AI response)\nCRITICAL REQUIREMENTS:\n- You MUST ALWAYS read the existing chat_history FIRST before updating (STEP 1 is mandatory)\n- You MUST preserve ALL previous conversations — never replace, always append\n- The final chat_history should contain ALL conversation exchanges from the very beginning in chronological order\n- Format example: \"User: hello\\nAI: hi there\\nUser: my name is kunju\\nAI: thanks kunju\\nUser: can you view details\\nAI: here are your details...\"\n- If the user doesn't exist yet, create the record first with name and phonenumber, then initialize chat_history with the first message\n- NEVER overwrite or replace existing chat_history — always read first, then append, then save\n:dart: ROLE & BEHAVIOR\nYour role is to reply to user queries.\nIf the user asks about the Vitality Research Centre or their weight reduction plans, you MUST explain the information simply and clearly and answer their related questions.\nYou must not mention or reveal that any information is being stored in a database.\nAfter explaining, politely ask the user to provide their name (this is important).\nIf the user does not provide their name → politely ask again for their name after addressing their queries.\nIf the user provides their name → proceed to store the name and phonenumber in the database using the MCP tool.\nOnce the name and phonenumber stored, Then use the calendar MCP tool to schedule in google calendar based on the details given.\nDo not respond unnecessarily to unrelated messages.\n:speech_balloon: ADDITIONAL USER HANDLING LOGIC\nUser can ask any questions like what is orientation call or etc etc etc, and the steps should continue normally as per the flow above.\nIf the user uses any greeting terms like hi, hello, hey, or asks anything like \"can I reschedule my call\" or \"can I view my details again,\" then you must check with the phonenumber we already have and the details stored in Supabase.\nCase A — Existing User\nIf the phonenumber {{whatsappMessageFrom}} already exists in Supabase, reply:\n\"Looks like you're already registered with us, {{name}}. Would you like to view your details or reschedule your orientation call?\"\nCase B — New User\nIf the user does not exist in Supabase, then insert into crudsupabase:\nname = user's name\nphonenumber = {{whatsappMessageFrom}}\nThen respond:\n\"Thanks for contacting us, {{name}}. At what date and time can we schedule your orientation call to share more details about the plans?\"\nThen continue the same workflow as already defined.\n:file_cabinet: DATA STORAGE VIA CRUD MCP TOOL\nYou are also a data management assistant.\nYour task is to interact with the Supabase database using the supabase-crud tool.\n:gear: MANDATORY ACTIONS\nYou MUST call the supabase-crud function to perform all database operations.\nYou MUST extract the name from the user's conversation message.\nYou MUST extract the phonenumber from the variable {{whatsappMessageFrom}}.\nYou MUST read all the data in supabase, if the phonenumber from {{whatsappMessageFrom}} already exist, you should NOT create the current data in supabase.\nCRITICAL — CHAT HISTORY SAVING:\nYou MUST save chat history for EVERY conversation exchange using this EXACT 3-STEP PROCESS:\nFor EACH user message:\n1. FIRST: Call supabase-crud → read → Find record where phonenumber = {{whatsappMessageFrom}} → READ existing chat_history value\n2. SECOND: Append \"\\nUser: <user message>\" to the existing chat_history you just read\n3. THIRD: Call supabase-crud → update → Find record where phonenumber = {{whatsappMessageFrom}} → Set chat_history = existing_chat_history + \"\\nUser: <user message>\"\nFor EACH AI response:\n1. FIRST: Call supabase-crud → read → Find record where phonenumber = {{whatsappMessageFrom}} → READ existing chat_history value\n2. SECOND: Append \"\\nAI: <your response>\" to the existing chat_history you just read\n3. THIRD: Call supabase-crud → update → Find record where phonenumber = {{whatsappMessageFrom}} → Set chat_history = existing_chat_history + \"\\nAI: <your response>\"\nCRITICAL: You MUST read existing chat_history FIRST (STEP 1) before updating. The chat_history column must contain ALL conversations from the beginning. Each new message must be APPENDED to existing chat_history (read first, then append, then save). NEVER replace existing chat_history — always preserve all previous conversations. This is MANDATORY for every message exchange.\n:clipboard: TABLE DETAILS\nCRITICAL: The table name is \"crudsupabase\" — you MUST always specify this exact table name when calling the supabase-crud function. Never use \"users\" or any other table name. Always use \"crudsupabase\" as the table name parameter.\nTable name: crudsupabase\n:wrench: SUPPORTED OPERATIONS\nInsert/Create: Add new records to the \"crudsupabase\" table\nUpdate: Modify existing records in the \"crudsupabase\" table (based on matching name or ID)\nDelete: Remove records from the \"crudsupabase\" table (based on a condition)\nRead/Select: Retrieve records or fetch all data from the \"crudsupabase\" table\n:rocket: EXECUTION RULE\nYou must execute the insert operation immediately by calling the supabase-crud function with table name \"crudsupabase\" — do not just acknowledge it.\nIf the user requests another operation (update, delete, or select), perform that specific operation on the \"crudsupabase\" table accordingly.\nREMINDER: For EVERY user message and EVERY AI response, you MUST follow the 3-STEP PROCESS: (1) FIRST read existing chat_history from \"crudsupabase\" table for phonenumber = {{whatsappMessageFrom}}, (2) SECOND append the new message to the existing chat_history (preserving ALL previous conversations), (3) THIRD save the complete updated chat_history back to \"crudsupabase\" table. NEVER replace existing chat_history — always read first, then append, then save. This ensures ALL conversations from the beginning are preserved. This is non-negotiable and must happen for every single message exchange.\n:speech_balloon: RESPONSE RULE\nAfter successfully storing the data, do not send or mention any message such as \"data stored\" or \"saved in the database.\"\nInstead, reply to any user queries and then send the following message:\n\"Thanks for contacting us. Our doctors will contact you as soon as possible. At what date and time can we schedule an Orientation call to share the details regarding the plans.\"\n:date: VIA CALENDAR MCP TOOL\nAfter asking the question regarding the date and time for call, then execute calendar MCP tool.\nThis tool should execute only after the CRUD MCP tool has been executed.\nYou will recieve date and time in this format:\nDate: {{date}}\nTime: {{time}}\n:scales: CONDITIONAL LOGIC — SLOT AVAILABILITY CHECK (Before Scheduling the Event)\nBefore creating the event in Google Calendar, you MUST check whether the requested date and time slot is already booked.\nSteps to follow:\nRetrieve all existing events from the configured Google Calendar (calendar_id).\nCompare the user's requested date and time with the existing scheduled events.\nIf the requested slot is already booked, reply to the user:\n\"The selected slot ({{date}} at {{time}}) is already booked. Would you like to reschedule to another available time?\"\nThen, calculate and display the next two available slots, each separated by 30 minutes, in the same day or the next available day. Example:\n\"Here are the next available time slots you can choose from:\n7:30 AM\n8:00 AM\"\nIf the user selects one of the available slots, update the selected date and time accordingly, and then proceed to create the event in Google Calendar.\nIf the requested slot is not booked, directly schedule the event in Google Calendar as per the existing flow.\nYou MUST extract the date and time in am or pm of event schedule from the conversation and create the event in google calendar.\nDefault calendar_id: c51c958ccfdffb580ee5ad1e69dbab503e6331e53459e60187faa2626f0439f4@group.calendar.google.com. Never use \"primary\". If the user provides a different calendar_id, use that instead and store it as the session default.\nDefault timezone: Asia/Kolkata unless the user specifies another IANA timezone. Interpret natural-language dates/times in the active timezone.\nYou MUST schedule the event in Google Calendar with the following details:\nSummary: Orientation Call - {{name}} (the name of the user which should be retrieved from Supabase \"crudsupabase\" table) - {{whatsappMessageFrom}} (the phonenumber of the user which should be retrieved from Supabase \"crudsupabase\" table)\nDescription: Call to share the details regarding the plans\nDate: You MUST extract the date from the chats\nTime: You MUST extract the time from the chats\nYou MUST extract the name from the user's input and include it in the calendar event.\nAfter creating event in calendar, then reply \"We will call you on scheduled time Please be available 10 minutes before the call — our doctor will be ready to begin your journey toward wellness.\"",
          "tool_configs": {},
          "tool_settings": {
            "tool_timeout_ms": 300,
            "error_handling_mode": "graceful",
            "enable_parallel_execution": false,
            "max_tool_calls_per_request": 5
          },
          "resultVariable": "sdkResult",
          "selected_tools": [],
          "handoff_enabled": false,
          "handoff_targets": [],
          "memoryTableName": "agent_interactions",
          "auto_handoff_enabled": false,
          "isAgentSDKOrchestrator": false
        }
      },
      {
        "id": "whatsapp-business-1770013830209",
        "nodeType": "whatsapp-business",
        "config": {
          "apiKey": "",
          "message": "{{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770013824184\")}}",
          "mediaUrl": "",
          "mediaType": "none",
          "apiVersion": "v20.0",
          "messageMode": "message",
          "phoneNumber": "{{whatsappMessageFrom}}",
          "credentialId": "26755c9c-eb1e-4b5c-8e8a-b14eca389dcd",
          "templateName": "",
          "templateText": "",
          "phoneNumberId": "",
          "templateLanguage": "en_US",
          "businessAccountId": "",
          "useStoredCredential": true
        }
      },
      {
        "id": "script-event-1771000297528",
        "nodeType": "script-event",
        "config": {
          "pageId": "page-1770985628551516",
          "scriptId": "043f403a-ae56-4687-b921-5b2efd2815ac",
          "elementId": "component-1770985632248-4126",
          "eventType": "onLoad",
          "scriptKey": "page-1770985628551516::component-1770985632248-4126::onLoad::043f403a-ae56-4687-b921-5b2efd2815ac",
          "scriptName": "chatbotvitality",
          "actionValue": "newMessage",
          "componentId": "component-1770985632248-4126",
          "inputVariables": [
            {
              "name": "innerHTML",
              "type": "string",
              "source": "element",
              "description": "Element property: innerHTML"
            }
          ],
          "outputVariables": [
            {
              "name": "action",
              "type": "object",
              "source": "custom",
              "description": "Output variable: action"
            },
            {
              "name": "lastMessageTime",
              "type": "object",
              "source": "custom",
              "description": "Output variable: lastMessageTime"
            },
            {
              "name": "messageCount",
              "type": "object",
              "source": "custom",
              "description": "Output variable: messageCount"
            },
            {
              "name": "'result']",
              "type": "object",
              "source": "custom",
              "description": "Variable: 'result']"
            },
            {
              "name": "'message'",
              "type": "object",
              "source": "custom",
              "description": "Variable: 'message'"
            },
            {
              "name": "'response'",
              "type": "object",
              "source": "custom",
              "description": "Variable: 'response'"
            }
          ],
          "inputVariableMappings": {
            "innerHTML": "{{whatsappMessageBody}}  {{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770013824184\")}}"
          }
        }
      }
    ]
  }
];
};

const executeSpecificFlow = async (chainId: string, data: any = {}): Promise<any> => {
  // Check if this is a page-load trigger
  const isPageLoadTrigger = data && (data.trigger === 'page-load' || data.trigger === 'page-load-retry');
  
  if (isPageLoadTrigger) {
    // Get chain info
    const allChains = getFlowChainInfo();
    const chain = allChains.find(c => c.id === chainId);
    
    // Check if this is a page-load chain
    if (chain && chain.startNode && chain.startNode.nodeType === 'page-load') {
      // Get the current page path
      const currentPath = data.pageId || (typeof window !== 'undefined' ? (window as any).location.pathname : '/');
      
      // Get the configured page URL
      const pageUrl = chain.startNode.config && chain.startNode.config.pageUrl;
      
      if (pageUrl) {
        // Normalize paths for comparison
        const normalizedConfigUrl = pageUrl.replace(/\/$/, '');
        const normalizedCurrentPath = currentPath.replace(/\/$/, '');
        
        // Skip if paths don't match
        if (normalizedConfigUrl !== normalizedCurrentPath) {
          console.log('⏭️ Skipping chain ' + chainId + ' - configured for "' + pageUrl + '" but current path is ' + currentPath);
          return { 
            success: false, 
            skipped: true, 
            reason: 'Page URL mismatch', 
            chainId,
            configuredUrl: pageUrl,
            currentPath
          };
        }
        console.log('✅ Page URL match for chain ' + chainId + ': ' + pageUrl);
      }
    }
  }
  
  return await executeAllFlows(data, chainId);
};

console.log('🔥🔥🔥 USING FIXED CODE VERSION - EXPORT BEFORE WINDOW 🔥🔥🔥');

// Export functions for ES module imports
export { executeAllFlows, executeSpecificFlow, getFlowChainInfo };

// Export functions for global access
if (typeof window !== 'undefined') {
  (window as any).executeAllFlows = executeAllFlows;
  (window as any).executeSpecificFlow = executeSpecificFlow;
  (window as any).getFlowChainInfo = getFlowChainInfo;
  
  
  console.log('🌐 Flow functions attached to window object');
  console.log('📝 Retell AI transcript monitoring not available (no Retell AI nodes in workflow)');
  
  // Initialize button chain registry for dynamic chain ID lookup
  if (!(window as any).buttonChainRegistry) {
    (window as any).buttonChainRegistry = {};
  }
  
  // Register all button-triggered chains at generation time
  const allChains = getFlowChainInfo();
  const buttonChains = allChains.filter(chain => 
    chain.startNode && chain.startNode.nodeType === 'button'
  );
  
  console.log('🔘 Registering button chains:', buttonChains.length);
  
  buttonChains.forEach(chain => {
    const buttonNode = chain.startNode;
    const config = buttonNode.config || {};
    const buttonId = config.buttonId || config.componentId || buttonNode.id;
    
    // Register both the node ID and potential element IDs
    // Node ID pattern: button-1761322615789
    // Chain ID pattern: flow_button-1761322615789_1761324366485
    
    // Method 1: Direct node ID mapping
    (window as any).buttonChainRegistry[buttonNode.id] = chain.id;
    // console.log(`🔗 Registered button node: ${buttonNode.id} → ${chain.id}`);
    
    // Method 2: If config has buttonId, register that too
    if (buttonId && buttonId !== buttonNode.id) {
      (window as any).buttonChainRegistry[buttonId] = chain.id;
      // console.log(`🔗 Registered button ID: ${buttonId} → ${chain.id}`);
    }
    
    // Method 3: Register by node ID timestamp for element ID matching
    // Extract timestamp from button node ID: button-1761322615789 -> 1761322615789
    const nodeIdMatch = buttonNode.id.match(/(\d{10,})/);
    if (nodeIdMatch) {
      const timestamp = nodeIdMatch[1];
      // Store a lookup table for timestamp-based matching
      if (!(window as any).buttonTimestampRegistry) {
        (window as any).buttonTimestampRegistry = {};
      }
      (window as any).buttonTimestampRegistry[timestamp] = {
        nodeId: buttonNode.id,
        chainId: chain.id,
        buttonId: buttonId
      };
      console.log(`🕐 Registered button timestamp: ${timestamp} → ${chain.id}`);
    }
  });
  
  // console.log('✅ Button chain registry initialized:', (window as any).buttonChainRegistry);
}

// WhatsApp webhook polling function
function startWhatsAppWebhookPolling(flowId: string, nodeId: string) {
  if (!nodeId) {
    console.warn(`⚠️ No nodeId provided for WhatsApp polling`);
    return;
  }
  
  // Poll every 2 seconds for new webhook data
  const pollInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/webhook-trigger?nodeId=${nodeId}`);
      const result = await response.json();
      
      if (result.success && result.hasData) {
        
        // Clear the polling interval since we found data
        clearInterval(pollInterval);
        
        // Execute the flow with the webhook data
        await executeSpecificFlow(flowId, result.data);
        
        // Restart polling for future webhook data (optional)
        setTimeout(() => {
          startWhatsAppWebhookPolling(flowId, nodeId);
        }, 1000);
        
      } else {
        // No new data, continue polling silently
      }
    } catch (error) {
      console.error(`❌ WhatsApp webhook polling error for node ${nodeId}:`, error);
    }
  }, 2000); // Poll every 2 seconds
  
  // Store the interval ID so it can be cleared if needed
  if (typeof window !== 'undefined') {
    (window as any).whatsappPollingIntervals = (window as any).whatsappPollingIntervals || {};
    (window as any).whatsappPollingIntervals[nodeId] = pollInterval;
  }
}

function startIncomingWebhookPolling(flowId: string, nodeId?: string, webhookId?: string) {
  if (!nodeId) {
    console.warn('⚠️ No nodeId provided for incoming webhook polling');
    return;
  }

  const resolvedWebhookId = webhookId || nodeId;
  
  const pollInterval = setInterval(async () => {
    try {
      const response = await fetch("/api/webhook-trigger?nodeId=" + nodeId);
      const result = await response.json();

      if (result.success && result.hasData) {
        
        clearInterval(pollInterval);

        const payload = result.data || {};
        
        // Extract webhook body from various possible locations
        const dynamicBody =
          (payload && payload.body) ? payload.body :
          (payload && payload.resultVariable && payload[payload.resultVariable]) ? payload[payload.resultVariable] :
          (payload && payload.incomingData) ? payload.incomingData :
          (payload && payload.webhookPayload) ? payload.webhookPayload :
          payload;
        
        // Normalize payload structure
        const normalizedPayload = {
          body: dynamicBody,
          headers: payload.headers || payload.webhookHeaders || {},
          method: payload.method || payload.webhookMethod || 'POST',
          timestamp: payload.timestamp || payload.webhookTimestamp || new Date().toISOString(),
          webhookId: resolvedWebhookId
        };

        // ✅ CRITICAL FIX: Store webhook data BEFORE executing workflow
        // This ensures the incoming webhook node code can access it immediately
        if (typeof window !== 'undefined') {
          const globalScope = window as typeof window & { incomingWebhookData?: Record<string, any> };
          globalScope.incomingWebhookData = globalScope.incomingWebhookData || {};
          globalScope.incomingWebhookData[resolvedWebhookId] = normalizedPayload;

          try {
            (window as any).sessionStorage?.setItem("webhook_" + resolvedWebhookId, JSON.stringify(normalizedPayload));
          } catch (storageError) {
            console.warn('⚠️ Unable to persist incoming webhook data to sessionStorage:', storageError);
          }
        }

        // ✅ CRITICAL FIX: Ensure triggerPayload structure matches what incoming webhook node expects
        // The incoming webhook node checks: triggerData.webhookPayload.webhookId === 'wh_xxx'
        // So webhookPayload must have webhookId property matching the expected value
        const triggerPayload = {
          ...payload,
          trigger: 'incoming-webhook',
          triggerType: 'incoming_webhook',
          nodeId: nodeId,
          webhookId: resolvedWebhookId,
          // CRITICAL: webhookPayload must have webhookId property matching the expected value
          // This ensures the incoming webhook node can detect and process the webhook data
          webhookPayload: {
            ...normalizedPayload,
            webhookId: resolvedWebhookId  // Ensure webhookId is explicitly set in webhookPayload object
          },
          body: dynamicBody,
          incomingData: dynamicBody,
          // Store in resultVariable if specified
          ...(payload.resultVariable ? { [payload.resultVariable]: dynamicBody } : {})
        };

        console.log('🌐 Executing workflow with webhook data:', {
          nodeId,
          webhookId: resolvedWebhookId,
          chainId: flowId,
          hasBody: !!dynamicBody,
          bodyKeys: typeof dynamicBody === 'object' ? Object.keys(dynamicBody) : [],
          webhookPayloadStructure: {
            hasWebhookPayload: !!triggerPayload.webhookPayload,
            webhookId: triggerPayload.webhookPayload?.webhookId,
            expectedWebhookId: resolvedWebhookId,
            matches: triggerPayload.webhookPayload?.webhookId === resolvedWebhookId
          }
        });

        await executeSpecificFlow(flowId, triggerPayload);

        // Restart polling after a delay to catch future webhooks
        setTimeout(() => {
          startIncomingWebhookPolling(flowId, nodeId, resolvedWebhookId);
        }, 1000);
      }
    } catch (error) {
      console.error('❌ Incoming webhook polling error for node ' + nodeId + ':', error);
    }
  }, 2000);

  if (typeof window !== 'undefined') {
    (window as any).incomingWebhookPollingIntervals = (window as any).incomingWebhookPollingIntervals || {};
    (window as any).incomingWebhookPollingIntervals[nodeId] = pollInterval;
  }
}

// Telegram inbound polling function
function startTelegramInboundPolling(flowId: string, nodeId: string) {
  if (!nodeId) {
    console.warn(`⚠️ No nodeId provided for Telegram polling`);
    return;
  }
  
  // Track processed message IDs per node to prevent duplicates
  const processedMessageIds = new Set<string>();
  
  // Poll every 3 seconds for new Telegram messages
  const pollInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/telegram-inbound-trigger?nodeId=${nodeId}`);
      
      if (!response.ok) {
        console.error('❌ Failed to poll Telegram messages:', response.statusText);
        return;
      }
      
      const result = await response.json();
      
      if (result.success && result.hasData) {
        // ✅ DEDUPLICATION: Check if we've already processed this message
        const messageId = result.data?.messageId || result.data?.telegram?.messageId || result.data?.message?.id;
        const deduplicationKey = messageId ? `${nodeId}_${messageId}` : null;
        
        if (deduplicationKey && processedMessageIds.has(deduplicationKey)) {
          return; // Skip duplicate message
        }
        
        console.log(`📝 Message ID: ${messageId || 'N/A'}`);
        
        // Mark this message as processed
        if (deduplicationKey) {
          processedMessageIds.add(deduplicationKey);
          // Clean up old processed messages (keep only last 100)
          if (processedMessageIds.size > 100) {
            const messagesArray = Array.from(processedMessageIds);
            processedMessageIds.clear();
            messagesArray.slice(-50).forEach(id => processedMessageIds.add(id));
          }
        }
        
        // Clear the polling interval since we found data
        clearInterval(pollInterval);
        
        // Execute the flow with the webhook data (client-side execution)
        await executeSpecificFlow(flowId, result.data);
        
        // Restart polling for future webhook data
        setTimeout(() => {
          startTelegramInboundPolling(flowId, nodeId);
        }, 1000);
        
      } else {
        // No new data, continue polling silently
      }
    } catch (error) {
      console.error(`❌ Telegram polling error for node ${nodeId}:`, error);
    }
  }, 3000); // Poll every 3 seconds
  
  // Store the interval ID so it can be cleared if needed
  if (typeof window !== 'undefined') {
    (window as any).telegramPollingIntervals = (window as any).telegramPollingIntervals || {};
    (window as any).telegramPollingIntervals[nodeId] = pollInterval;
  }
}

// Interval trigger polling function (for backend-orchestrated intervals)
function startIntervalTriggerPolling(flowId: string, nodeId: string) {
  if (!nodeId) {
    console.warn(`⚠️ No nodeId provided for interval trigger polling`);
    return;
  }
  
  // ✅ CRITICAL FIX: Check if polling is already running for this nodeId to prevent duplicates
  // But first, check if the stored interval is still valid (not cleared)
  if (typeof window !== 'undefined') {
    if (!(window as any).intervalTriggerPollingIntervals) {
      (window as any).intervalTriggerPollingIntervals = {};
    }
    
    const existingInterval = (window as any).intervalTriggerPollingIntervals[nodeId];
    // Only skip if there's an active interval (not cleared/null)
    if (existingInterval) {
      console.log(`⚠️ Interval trigger polling already running for node ${nodeId}, skipping duplicate start`);
      return;
    }
  }
  
  // ✅ CRITICAL FIX: Use global scope for processed timestamps to persist across restarts
  // This ensures deduplication works even when polling restarts
  if (typeof window !== 'undefined') {
    if (!(window as any).__intervalTriggerProcessedTimestamps) {
      (window as any).__intervalTriggerProcessedTimestamps = {};
    }
    if (!(window as any).__intervalTriggerProcessedTimestamps[nodeId]) {
      (window as any).__intervalTriggerProcessedTimestamps[nodeId] = new Set<string>();
    }
  }
  const processedTriggerTimestamps = typeof window !== 'undefined' 
    ? (window as any).__intervalTriggerProcessedTimestamps[nodeId]
    : new Set<string>();
  
  // Poll every 2 seconds for new interval trigger webhook data
  const pollInterval = setInterval(async () => {
    try {
      const response = await fetch(`/api/webhook-trigger?nodeId=${nodeId}`);
      
      if (!response.ok) {
        console.error('❌ Failed to poll interval trigger:', response.statusText);
        return;
      }
      
      const result = await response.json();
      
      if (result.success && result.hasData) {
        // ✅ DEDUPLICATION: Check if we've already processed this trigger
        // Use executionTime or timestamp from trigger data as deduplication key
        const triggerData = result.data || {};
        const executionTime = triggerData.executionTime || triggerData.timestamp || new Date().toISOString();
        const deduplicationKey = `${nodeId}_${executionTime}`;
        
        if (processedTriggerTimestamps.has(deduplicationKey)) {
          console.log(`⏸️ Interval trigger already processed: ${deduplicationKey}`);
          return; // Skip duplicate trigger
        }
        
        console.log(`⏰ Interval trigger webhook detected for node ${nodeId} at ${executionTime}`);
        
        // Mark this trigger as processed
        processedTriggerTimestamps.add(deduplicationKey);
        // Clean up old processed triggers (keep only last 50)
        if (processedTriggerTimestamps.size > 50) {
          const timestampsArray = Array.from(processedTriggerTimestamps);
          processedTriggerTimestamps.clear();
          timestampsArray.slice(-25).forEach(timestamp => processedTriggerTimestamps.add(timestamp));
        }
        
        // ✅ CRITICAL FIX: Clear the interval AND remove from window storage before restarting
        clearInterval(pollInterval);
        if (typeof window !== 'undefined' && (window as any).intervalTriggerPollingIntervals) {
          delete (window as any).intervalTriggerPollingIntervals[nodeId];
        }
        
        // Execute the flow with the webhook data (client-side execution)
        // Wrap in try-catch to ensure polling restarts even if execution fails
        try {
          await executeSpecificFlow(flowId, triggerData);
        } catch (execError) {
          console.error(`❌ Error executing interval trigger workflow for node ${nodeId}:`, execError);
          // Continue to restart polling even if execution fails
        }
        
        // Restart polling for future webhook data
        // Always restart regardless of execution success/failure
        setTimeout(() => {
          startIntervalTriggerPolling(flowId, nodeId);
        }, 1000);
        
      } else {
        // No new data, continue polling silently
      }
    } catch (error) {
      console.error(`❌ Interval trigger polling error for node ${nodeId}:`, error);
    }
  }, 2000); // Poll every 2 seconds
  
  // Store the interval ID so it can be cleared if needed
  if (typeof window !== 'undefined') {
    (window as any).intervalTriggerPollingIntervals = (window as any).intervalTriggerPollingIntervals || {};
    (window as any).intervalTriggerPollingIntervals[nodeId] = pollInterval;
  }
}


// Auto-execute trigger-based flows after initialization
if (typeof window !== 'undefined') {
  // Only execute flows that start with trigger nodes automatically
  setTimeout(async () => {
    console.log('🚀 Auto-starting trigger-based flows...');
    try {
      // Check if we have any trigger-based flows to execute
      const flowChainInfo = getFlowChainInfo();
      console.log('📊 Available flow chains for auto-execution:', flowChainInfo.length);
      
      // Execute flows that start with trigger nodes
      for (const flowInfo of flowChainInfo) {
        const startNodeType = flowInfo.startNode?.nodeType;
        const startNodeWebhookType =
          flowInfo.startNode?.config?.settings?.webhookType ||
          flowInfo.startNode?.settings?.webhookType ||
          flowInfo.startNode?.data?.settings?.webhookType ||
          flowInfo.startNode?.config?.webhookType ||
          flowInfo.startNode?.data?.webhookType ||
          flowInfo.startNode?.webhookType;
        const startNodeWebhookId =
          flowInfo.startNode?.config?.settings?.webhookId ||
          flowInfo.startNode?.settings?.webhookId ||
          flowInfo.startNode?.data?.settings?.webhookId ||
          flowInfo.startNode?.config?.webhookId ||
          flowInfo.startNode?.data?.webhookId ||
          flowInfo.startNode?.webhookId ||
          flowInfo.startNode?.id;
        const isIncomingWebhookTrigger =
          startNodeType === 'incoming-webhook' ||
          (startNodeType === 'webhook' &&
            (startNodeWebhookType === 'incoming' ||
              startNodeWebhookType === 'Incoming'));

        // console.log(`🔍 Checking flow ${flowInfo.id} with start node: ${startNodeType}`);
        
        if (startNodeType === 'inbound-email' || startNodeType === 'page-load') {
          console.log(`🎯 Auto-executing trigger flow: ${flowInfo.id}`);
          // FIX: Pass the current page path so page URL matching works correctly
          const currentPath = typeof window !== 'undefined' ? (window as any).location.pathname : '/';
          // CRITICAL FIX: Use the actual trigger type instead of hardcoding 'page-load'
          // This ensures inbound-email triggers are properly identified
          const actualTrigger = startNodeType === 'inbound-email' ? 'inbound-email' : 'page-load';
          await executeSpecificFlow(flowInfo.id, { 
            trigger: actualTrigger,
            nodeType: startNodeType,
            pageId: currentPath
          });
        } else if (startNodeType === 'whatsapp-trigger') {
          console.log(`📱 WhatsApp trigger flow detected: ${flowInfo.id} - setting up webhook polling`);
          // Start polling for webhook data for this specific WhatsApp trigger
          startWhatsAppWebhookPolling(flowInfo.id, flowInfo.startNode?.id);
        } else if (startNodeType === 'telegram-inbound') {
          console.log(`📱 Telegram inbound flow detected: ${flowInfo.id} - setting up client-side polling`);
          // ✅ CRITICAL FIX: Enable client-side polling for Telegram inbound
          // Backend stores webhook data, client polls and executes workflow client-side
          // This ensures network calls are visible and variables are accessible to subsequent nodes
          startTelegramInboundPolling(flowInfo.id, flowInfo.startNode?.id);
        } else if (isIncomingWebhookTrigger) {
          console.log(`🌐 Incoming webhook flow detected: ${flowInfo.id} - setting up webhook polling`);
          // ✅ CRITICAL FIX: Auto-start polling for incoming webhook nodes
          // Backend receives webhook and stores it, frontend polls and executes workflow
          // This ensures webhook data is accessible to subsequent nodes
          const webhookId = startNodeWebhookId || flowInfo.startNode?.id;
          startIncomingWebhookPolling(flowInfo.id, flowInfo.startNode?.id, webhookId);
        } else if (startNodeType === 'interval-trigger') {
          // CRITICAL FIX: Handle interval triggers based on backend orchestration setting
          const intervalConfig = flowInfo.startNode?.config || flowInfo.startNode?.data?.settings || {};
          // Note: runOnBackend defaults to true (matches DEFAULT_SETTINGS in IntervalTriggerNode.tsx)
          // This is intentional and maintains backward compatibility - default has always been true
          const runOnBackend = intervalConfig.runOnBackend !== false;
          
          if (runOnBackend) {
            console.log(`⏰ Interval trigger (backend) detected: ${flowInfo.id} - setting up webhook polling`);
            // Backend orchestration enabled: start polling for webhook triggers from backend
            startIntervalTriggerPolling(flowInfo.id, flowInfo.startNode?.id);
          } else {
            console.log(`⏰ Interval trigger (frontend) detected: ${flowInfo.id} - using local interval`);
            // Frontend-only mode: local interval is already initialized in workflow file
            // No action needed here
          }
        } else if (startNodeType === 'timer' || startNodeType === 'schedule') {
          const timerConfig = flowInfo.startNode?.config || flowInfo.startNode?.data?.settings || {};
          const timerMode = timerConfig.mode || timerConfig.timerType;
          
          // Check if this is a database polling scheduler
          if (timerMode === 'databasePolling' || timerMode === 'database-polling') {
            console.log(`📊 Database polling scheduler detected: ${flowInfo.id} - starting frontend polling`);
            // Start frontend polling for database polling schedulers
            // This will check backend for matches and execute workflow when matches found
            // The polling code is generated in the timer node processor
            // We just need to execute the flow once to start the polling
            try {
              await executeSpecificFlow(flowInfo.id, {
                trigger: 'database-polling-init',
                nodeType: 'timer',
                nodeId: flowInfo.startNode?.id
              });
            } catch (initError) {
              console.error(`❌ Error initializing database polling for flow ${flowInfo.id}:`, initError);
            }
          } else {
            console.log(`⏰ Timer/Schedule flow detected: ${flowInfo.id} - scheduling only (not executing)`);
            // Timer flows are scheduled automatically in their individual initialization
            // They should NOT be executed immediately on page load
          }
        } else if (startNodeType === 'on-change-trigger') {
          console.log(`🔄 On-change trigger flow detected: ${flowInfo.id} - setting up change listener`);
          // Get element ID from node config
          const onChangeConfig = flowInfo.startNode?.config || flowInfo.startNode?.data?.settings || {};
          const elementId = onChangeConfig.elementId || onChangeConfig.componentId || '';
          
          if (!elementId) {
            console.warn(`⚠️ On-change trigger flow ${flowInfo.id} has no elementId configured`);
            return;
          }
          
          // Function to attach change listener to element
          const attachOnChangeListener = () => {
            try {
              // Try multiple strategies to find the element
              let element: HTMLElement | null = document.getElementById(elementId);
              if (!element) {
                element = document.querySelector(`[data-component-id="${elementId}"]`) as HTMLElement;
              }
              if (!element) {
                element = document.querySelector(`[name="${elementId}"]`) as HTMLElement;
              }
              if (!element) {
                element = document.querySelector(`input[id*="${elementId}"], textarea[id*="${elementId}"], select[id*="${elementId}"]`) as HTMLElement;
              }
              
              if (element) {
                console.log(`✅ Found element for on-change trigger: ${elementId}`);
                
                // Remove any existing listener to avoid duplicates
                const existingListener = (element as any)._onChangeTriggerListener;
                if (existingListener) {
                  element.removeEventListener('change', existingListener);
                  element.removeEventListener('input', existingListener);
                }
                
                // Create change handler
                const changeHandler = async (event: Event) => {
                  const target = event.target as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
                  const newValue = target.value;
                  
                  console.log(`🔄 Element ${elementId} changed, triggering workflow ${flowInfo.id}`);
                  
                  try {
                    await executeSpecificFlow(flowInfo.id, {
                      trigger: 'on-change',
                      triggerType: 'on-change-trigger',
                      nodeType: 'on-change-trigger',
                      elementId: elementId,
                      elementValue: newValue,
                      elementName: onChangeConfig.elementName || elementId,
                      timestamp: new Date().toISOString(),
                      event: {
                        type: event.type,
                        target: {
                          id: target.id,
                          name: target.name,
                          value: newValue,
                          type: target.type
                        }
                      }
                    });
                    console.log(`✅ On-change workflow ${flowInfo.id} executed successfully`);
                  } catch (error) {
                    console.error(`❌ Error executing on-change workflow ${flowInfo.id}:`, error);
                  }
                };
                
                // Attach listeners for both 'change' and 'input' events
                // 'change' fires when element loses focus after value change
                // 'input' fires immediately on value change (for real-time updates)
                element.addEventListener('change', changeHandler);
                element.addEventListener('input', changeHandler);
                
                // Store reference to listener for cleanup
                (element as any)._onChangeTriggerListener = changeHandler;
                (element as any)._onChangeTriggerFlowId = flowInfo.id;
                
                console.log(`✅ Attached change listener to element ${elementId} for workflow ${flowInfo.id}`);
              } else {
                console.warn(`⚠️ Element ${elementId} not found, will retry after DOM ready`);
                // Retry after a short delay if element not found (might not be rendered yet)
                setTimeout(attachOnChangeListener, 1000);
              }
            } catch (error) {
              console.error(`❌ Error attaching on-change listener for element ${elementId}:`, error);
            }
          };
          
          // Try to attach listener immediately
          attachOnChangeListener();
          
          // Also try after DOM is ready (in case element loads later)
          if (typeof document !== 'undefined') {
            if (document.readyState === 'loading') {
              document.addEventListener('DOMContentLoaded', attachOnChangeListener);
            } else {
              // DOM already loaded, try again after a short delay
              setTimeout(attachOnChangeListener, 500);
            }
          }
        }
      }
    } catch (error) {
      console.error('❌ Error auto-executing trigger flows:', error);
    }
  }, 1000);
  
  // CRITICAL FIX: Check for Stripe subscription redirect parameters on page load
  // This ensures fetch_subscription is called when returning from Stripe redirect
  // This runs at module level, so it executes immediately when the file loads
  (() => {
    if (typeof window === 'undefined') return;
    
    // Check for Stripe subscription redirect parameters
    const urlParams = new URLSearchParams(window.location.search);
    const stripePaymentStatus = urlParams.get('stripe_payment');
    const sessionId = urlParams.get('session_id');
    const mode = urlParams.get('mode');
    
    if (stripePaymentStatus === 'success' && sessionId && mode === 'subscription') {
      console.log('🔄 Module-level: Detected Stripe subscription redirect, calling fetch_subscription...');
      
      // Find payment nodes with create_subscription operation and Stripe provider
      const allChains = getFlowChainInfo();
      const subscriptionPaymentNodes: Array<{nodeId: string, credentialId?: string, schemaEnabled?: boolean, schemaTable?: string}> = [];
      
      for (const chain of allChains) {
        // Traverse chain nodes to find payment nodes
        let currentNode: any = chain.startNode;
        while (currentNode) {
          if (currentNode.nodeType === 'payment') {
            const config = currentNode.config || currentNode.data?.settings || {};
            const operation = config.operation || config.paymentOperation;
            const provider = config.provider || config.paymentProvider;
            
            if (operation === 'create_subscription' && provider === 'stripe') {
              const schema = config.schema || {};
              subscriptionPaymentNodes.push({
                nodeId: currentNode.id,
                credentialId: config.credentialId,
                schemaEnabled: schema.enabled !== false,
                schemaTable: schema.table
              });
            }
          }
          
          // Move to next node (simplified traversal - actual implementation may vary)
          currentNode = currentNode.next || currentNode.edges?.[0]?.target;
          if (!currentNode || subscriptionPaymentNodes.length > 0) break; // Stop after finding first match
        }
      }
      
      // Call fetch_subscription for each matching payment node
      for (const paymentNode of subscriptionPaymentNodes) {
        (async () => {
          try {
            const backendUrl = typeof window !== 'undefined' && window.location 
              ? (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || `${window.location.protocol}//${window.location.hostname}:8000`)
              : (process.env.NEXT_PUBLIC_BACKEND_URL || process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000');
            
            // Resolve table name if needed
            let resolvedTableName = paymentNode.schemaTable || 'subscriptions';
            if (typeof resolveTableName === 'function' && paymentNode.schemaTable) {
              try {
                resolvedTableName = resolveTableName(paymentNode.schemaTable);
              } catch (e) {
                console.warn('⚠️ Could not resolve table name, using as-is:', paymentNode.schemaTable);
              }
            }
            
            console.log('📞 Module-level: Calling fetch_subscription with session_id:', sessionId);
            console.log('📞 Module-level: Schema enabled:', paymentNode.schemaEnabled, 'Table:', resolvedTableName);
            
            const fetchUrl = `${backendUrl}/api/payment/execute`;
            const fetchResponse = await fetch(fetchUrl, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              credentials: 'include',
              body: JSON.stringify({
                provider: 'stripe',
                operation: 'fetch_subscription',
                credentialId: paymentNode.credentialId || '',
                inputs: {
                  session_id: sessionId
                },
                schema: {
                  enabled: paymentNode.schemaEnabled !== false,
                  ...(resolvedTableName ? { table: resolvedTableName } : {})
                }
              }),
            });
            
            console.log('📞 Module-level: fetch_subscription response status:', fetchResponse.status);
            
            if (fetchResponse.ok) {
              const fetchResult = await fetchResponse.json();
              console.log('📞 Module-level: fetch_subscription result:', fetchResult);
              
              if (fetchResult.success && fetchResult.data?.subscription_id) {
                console.log('✅ Module-level: Subscription stored in DB:', fetchResult.data.subscription_id);
                
                // Clean up URL parameters
                const cleanUrl = window.location.pathname;
                window.history.replaceState({}, document.title, cleanUrl);
              } else {
                console.warn('⚠️ Module-level: fetch_subscription returned but no subscription_id:', fetchResult);
              }
            } else {
              const errorText = await fetchResponse.text();
              console.error('❌ Module-level: fetch_subscription failed:', fetchResponse.status, errorText);
            }
          } catch (error) {
            console.error('❌ Module-level: Error calling fetch_subscription:', error);
          }
        })();
      }
    }
  })();
}

