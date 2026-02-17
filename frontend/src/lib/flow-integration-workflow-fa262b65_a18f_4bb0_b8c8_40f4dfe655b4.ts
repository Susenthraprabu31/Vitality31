
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






const executeFlowChain_flow_timer_1770024151262_1771079854943 = async (initialData: any = {}): Promise<FlowResult> => {
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
  
  flowResults._executionId = `flow_timer_1770024151262_1771079854943_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
    flowResults.originalChainData = {"id":"flow_timer-1770024151262_1771079854943","nodes":[{"id":"timer-1770024151262","nodeType":"timer","config":{"mode":"daily","time":"10:00","repeat":true,"enabled":true,"endTime":"23:59","interval":1000,"timezone":"UTC","dateField":"date","startTime":"00:00","timeField":"time","timerType":"interval","dateFormat":"YYYY-MM-DD","timeFormat":"HH:MM","databaseUrl":"","inputFormat":"YYYY-MM-DD HH:mm:ss","monthlyTime":"09:00","selectedDays":["Monday"],"dateFieldName":"","dateTimeField":"start_time","monthlyMonths":["All"],"timeFieldName":"","dayAndTimeTime":"09:00","monthlyTimezone":"UTC","pollingInterval":1,"databaseTimezone":"UTC","monthlyDaysOfMonth":[1],"monthlySkipInvalidDates":true}},{"id":"openaiAgentSDKNode-1770024158249","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"OpenAI Agent","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770024420717","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"Sendwhatsapp","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770024432542","url":"https://supabase-crud.simplita.ai/mcp","name":"Supabase","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"","agentSDKType":"orchestrator","enableMemory":false,"handoff_mode":"transfer_control","instructions":"System Role:\nYou are the Vitality WhatsApp Follow-Up Agent.\nYou are connected to two MCP tools:\n\nSupabase MCP — to fetch user data from the crudsupabase table.\n\nWhatsApp Send MCP — to send follow-up messages to users.\n\nYour responsibility is to check who has not completed their joining process in the Vitality Weight Loss Program and send them a friendly, motivational follow-up message.\n\n🧠 Core Workflow Logic\n\nFetch Data:\n\nRetrieve all records from the Supabase table: crudsupabase.\n\nValidate Records:\n\nFor each record:\n\nCheck the field joining_information.\n\nIf the value is null, proceed to send a message.\n\nIf it is not null, skip that user (do not send any message).\n\nExtract Fields:\n\nName\n\nphonenumber\n\nGenerate a Personalized WhatsApp Message:\n\nUse a friendly, polite, and encouraging tone.\n\nMention the user’s name.\n\nInclude one fun or motivational health/fitness fact to make it engaging.\n\nKeep it short and cheerful — include a few emojis for warmth.\n\nSend Message:\n\nSend the generated message to the respective phone number via the WhatsApp Send MCP tool.\n\n\n💬 Message Template Example\nHey <Name> 👋  \nHope you're doing great today! Just a little nudge from the Vitality team 😄 — when do you think you'll join our Weight Loss Program?  \n\nFun fact: Drinking water before meals can boost metabolism and help with weight loss 💧🔥  \n\nWe’d love to have you onboard soon — your fitness story is waiting to begin 💪✨","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}}],"edges":[{"source":"timer-1770024151262","target":"openaiAgentSDKNode-1770024158249"}],"chainType":"linear","dataFlow":[],"startNode":{"id":"timer-1770024151262","nodeType":"timer","config":{"mode":"daily","time":"10:00","repeat":true,"enabled":true,"endTime":"23:59","interval":1000,"timezone":"UTC","dateField":"date","startTime":"00:00","timeField":"time","timerType":"interval","dateFormat":"YYYY-MM-DD","timeFormat":"HH:MM","databaseUrl":"","inputFormat":"YYYY-MM-DD HH:mm:ss","monthlyTime":"09:00","selectedDays":["Monday"],"dateFieldName":"","dateTimeField":"start_time","monthlyMonths":["All"],"timeFieldName":"","dayAndTimeTime":"09:00","monthlyTimezone":"UTC","pollingInterval":1,"databaseTimezone":"UTC","monthlyDaysOfMonth":[1],"monthlySkipInvalidDates":true}},"endNode":{"id":"openaiAgentSDKNode-1770024158249","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"OpenAI Agent","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770024420717","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"Sendwhatsapp","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770024432542","url":"https://supabase-crud.simplita.ai/mcp","name":"Supabase","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"","agentSDKType":"orchestrator","enableMemory":false,"handoff_mode":"transfer_control","instructions":"System Role:\nYou are the Vitality WhatsApp Follow-Up Agent.\nYou are connected to two MCP tools:\n\nSupabase MCP — to fetch user data from the crudsupabase table.\n\nWhatsApp Send MCP — to send follow-up messages to users.\n\nYour responsibility is to check who has not completed their joining process in the Vitality Weight Loss Program and send them a friendly, motivational follow-up message.\n\n🧠 Core Workflow Logic\n\nFetch Data:\n\nRetrieve all records from the Supabase table: crudsupabase.\n\nValidate Records:\n\nFor each record:\n\nCheck the field joining_information.\n\nIf the value is null, proceed to send a message.\n\nIf it is not null, skip that user (do not send any message).\n\nExtract Fields:\n\nName\n\nphonenumber\n\nGenerate a Personalized WhatsApp Message:\n\nUse a friendly, polite, and encouraging tone.\n\nMention the user’s name.\n\nInclude one fun or motivational health/fitness fact to make it engaging.\n\nKeep it short and cheerful — include a few emojis for warmth.\n\nSend Message:\n\nSend the generated message to the respective phone number via the WhatsApp Send MCP tool.\n\n\n💬 Message Template Example\nHey <Name> 👋  \nHope you're doing great today! Just a little nudge from the Vitality team 😄 — when do you think you'll join our Weight Loss Program?  \n\nFun fact: Drinking water before meals can boost metabolism and help with weight loss 💧🔥  \n\nWe’d love to have you onboard soon — your fitness story is waiting to begin 💪✨","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}}};

    // Declare all step result variables
    let step1Result: any;
    let step2Result: any;



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
    flowResults.originalChainData = {"id":"flow_timer-1770024151262_1771079854943","nodes":[{"id":"timer-1770024151262","nodeType":"timer","config":{"mode":"daily","time":"10:00","repeat":true,"enabled":true,"endTime":"23:59","interval":1000,"timezone":"UTC","dateField":"date","startTime":"00:00","timeField":"time","timerType":"interval","dateFormat":"YYYY-MM-DD","timeFormat":"HH:MM","databaseUrl":"","inputFormat":"YYYY-MM-DD HH:mm:ss","monthlyTime":"09:00","selectedDays":["Monday"],"dateFieldName":"","dateTimeField":"start_time","monthlyMonths":["All"],"timeFieldName":"","dayAndTimeTime":"09:00","monthlyTimezone":"UTC","pollingInterval":1,"databaseTimezone":"UTC","monthlyDaysOfMonth":[1],"monthlySkipInvalidDates":true}},{"id":"openaiAgentSDKNode-1770024158249","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"OpenAI Agent","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770024420717","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"Sendwhatsapp","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770024432542","url":"https://supabase-crud.simplita.ai/mcp","name":"Supabase","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"","agentSDKType":"orchestrator","enableMemory":false,"handoff_mode":"transfer_control","instructions":"System Role:\nYou are the Vitality WhatsApp Follow-Up Agent.\nYou are connected to two MCP tools:\n\nSupabase MCP — to fetch user data from the crudsupabase table.\n\nWhatsApp Send MCP — to send follow-up messages to users.\n\nYour responsibility is to check who has not completed their joining process in the Vitality Weight Loss Program and send them a friendly, motivational follow-up message.\n\n🧠 Core Workflow Logic\n\nFetch Data:\n\nRetrieve all records from the Supabase table: crudsupabase.\n\nValidate Records:\n\nFor each record:\n\nCheck the field joining_information.\n\nIf the value is null, proceed to send a message.\n\nIf it is not null, skip that user (do not send any message).\n\nExtract Fields:\n\nName\n\nphonenumber\n\nGenerate a Personalized WhatsApp Message:\n\nUse a friendly, polite, and encouraging tone.\n\nMention the user’s name.\n\nInclude one fun or motivational health/fitness fact to make it engaging.\n\nKeep it short and cheerful — include a few emojis for warmth.\n\nSend Message:\n\nSend the generated message to the respective phone number via the WhatsApp Send MCP tool.\n\n\n💬 Message Template Example\nHey <Name> 👋  \nHope you're doing great today! Just a little nudge from the Vitality team 😄 — when do you think you'll join our Weight Loss Program?  \n\nFun fact: Drinking water before meals can boost metabolism and help with weight loss 💧🔥  \n\nWe’d love to have you onboard soon — your fitness story is waiting to begin 💪✨","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}}],"edges":[{"source":"timer-1770024151262","target":"openaiAgentSDKNode-1770024158249"}],"chainType":"linear","dataFlow":[],"startNode":{"id":"timer-1770024151262","nodeType":"timer","config":{"mode":"daily","time":"10:00","repeat":true,"enabled":true,"endTime":"23:59","interval":1000,"timezone":"UTC","dateField":"date","startTime":"00:00","timeField":"time","timerType":"interval","dateFormat":"YYYY-MM-DD","timeFormat":"HH:MM","databaseUrl":"","inputFormat":"YYYY-MM-DD HH:mm:ss","monthlyTime":"09:00","selectedDays":["Monday"],"dateFieldName":"","dateTimeField":"start_time","monthlyMonths":["All"],"timeFieldName":"","dayAndTimeTime":"09:00","monthlyTimezone":"UTC","pollingInterval":1,"databaseTimezone":"UTC","monthlyDaysOfMonth":[1],"monthlySkipInvalidDates":true}},"endNode":{"id":"openaiAgentSDKNode-1770024158249","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"OpenAI Agent","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770024420717","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"Sendwhatsapp","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770024432542","url":"https://supabase-crud.simplita.ai/mcp","name":"Supabase","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"","agentSDKType":"orchestrator","enableMemory":false,"handoff_mode":"transfer_control","instructions":"System Role:\nYou are the Vitality WhatsApp Follow-Up Agent.\nYou are connected to two MCP tools:\n\nSupabase MCP — to fetch user data from the crudsupabase table.\n\nWhatsApp Send MCP — to send follow-up messages to users.\n\nYour responsibility is to check who has not completed their joining process in the Vitality Weight Loss Program and send them a friendly, motivational follow-up message.\n\n🧠 Core Workflow Logic\n\nFetch Data:\n\nRetrieve all records from the Supabase table: crudsupabase.\n\nValidate Records:\n\nFor each record:\n\nCheck the field joining_information.\n\nIf the value is null, proceed to send a message.\n\nIf it is not null, skip that user (do not send any message).\n\nExtract Fields:\n\nName\n\nphonenumber\n\nGenerate a Personalized WhatsApp Message:\n\nUse a friendly, polite, and encouraging tone.\n\nMention the user’s name.\n\nInclude one fun or motivational health/fitness fact to make it engaging.\n\nKeep it short and cheerful — include a few emojis for warmth.\n\nSend Message:\n\nSend the generated message to the respective phone number via the WhatsApp Send MCP tool.\n\n\n💬 Message Template Example\nHey <Name> 👋  \nHope you're doing great today! Just a little nudge from the Vitality team 😄 — when do you think you'll join our Weight Loss Program?  \n\nFun fact: Drinking water before meals can boost metabolism and help with weight loss 💧🔥  \n\nWe’d love to have you onboard soon — your fitness story is waiting to begin 💪✨","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}}};
    
    if (typeof window !== 'undefined') {
      // SECURITY: Store SANITIZED workflow nodes in window context (remove API keys)
      // Sanitize each node individually to ensure all sensitive data is removed
      const sanitizedNodes = [{"id":"timer-1770024151262","nodeType":"timer","config":{"mode":"daily","time":"10:00","repeat":true,"enabled":true,"endTime":"23:59","interval":1000,"timezone":"UTC","dateField":"date","startTime":"00:00","timeField":"time","timerType":"interval","dateFormat":"YYYY-MM-DD","timeFormat":"HH:MM","databaseUrl":"","inputFormat":"YYYY-MM-DD HH:mm:ss","monthlyTime":"09:00","selectedDays":["Monday"],"dateFieldName":"","dateTimeField":"start_time","monthlyMonths":["All"],"timeFieldName":"","dayAndTimeTime":"09:00","monthlyTimezone":"UTC","pollingInterval":1,"databaseTimezone":"UTC","monthlyDaysOfMonth":[1],"monthlySkipInvalidDates":true}},{"id":"openaiAgentSDKNode-1770024158249","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"OpenAI Agent","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770024420717","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"Sendwhatsapp","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770024432542","url":"https://supabase-crud.simplita.ai/mcp","name":"Supabase","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"","agentSDKType":"orchestrator","enableMemory":false,"handoff_mode":"transfer_control","instructions":"System Role:\nYou are the Vitality WhatsApp Follow-Up Agent.\nYou are connected to two MCP tools:\n\nSupabase MCP — to fetch user data from the crudsupabase table.\n\nWhatsApp Send MCP — to send follow-up messages to users.\n\nYour responsibility is to check who has not completed their joining process in the Vitality Weight Loss Program and send them a friendly, motivational follow-up message.\n\n🧠 Core Workflow Logic\n\nFetch Data:\n\nRetrieve all records from the Supabase table: crudsupabase.\n\nValidate Records:\n\nFor each record:\n\nCheck the field joining_information.\n\nIf the value is null, proceed to send a message.\n\nIf it is not null, skip that user (do not send any message).\n\nExtract Fields:\n\nName\n\nphonenumber\n\nGenerate a Personalized WhatsApp Message:\n\nUse a friendly, polite, and encouraging tone.\n\nMention the user’s name.\n\nInclude one fun or motivational health/fitness fact to make it engaging.\n\nKeep it short and cheerful — include a few emojis for warmth.\n\nSend Message:\n\nSend the generated message to the respective phone number via the WhatsApp Send MCP tool.\n\n\n💬 Message Template Example\nHey <Name> 👋  \nHope you're doing great today! Just a little nudge from the Vitality team 😄 — when do you think you'll join our Weight Loss Program?  \n\nFun fact: Drinking water before meals can boost metabolism and help with weight loss 💧🔥  \n\nWe’d love to have you onboard soon — your fitness story is waiting to begin 💪✨","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}}];
      
      (window as any).__currentWorkflowNodes = sanitizedNodes;
      (window as any).__flowChainMetadata = {
        chainId: 'flow_timer-1770024151262_1771079854943',
        currentChainNodes: sanitizedNodes,
        nodeCount: 2
      };
      console.log('🔗 Workflow nodes made available globally: 2 nodes');
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
      
    // === SCHEDULER: DAILY MODE (Start Trigger) ===
    
    step1Result = {
      status: 'scheduled',
      mode: 'daily',
      nodeId: 'timer-1770024151262',
      scheduledTime: '10:00',
      timestamp: new Date().toISOString()
    };
    
    // Timer just sets up the schedule - actual execution will be handled by timer initialization
    console.log('⏰ Daily timer configured for 10:00 - execution will be handled by timer initialization');
    console.log('✅ Daily scheduler configured:', step1Result);
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['timer-1770024151262'] = {
      nodeId: 'timer-1770024151262',
      nodeType: 'timer',
      stepNumber: 1,
      displayName: 'timerResult_timer_1770024151262',
      data: step1Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for timer
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['timerResult_timer_1770024151262'] || typeof flowResults['timerResult_timer_1770024151262'] === 'undefined') {
      flowResults['timerResult_timer_1770024151262'] = step1Result;
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
      console.error('❌ Error in step 1 (timer):', stepError);
      flowErrors.push(`Step 1 (timer): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step1Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'timer',
        nodeId: 'timer-1770024151262',
        stepNumber: 1
      };
      
      currentResult = step1Result; // Update currentResult even on error
      
      // Store error result in enhanced data flow system
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['timer-1770024151262'] = {
      nodeId: 'timer-1770024151262',
      nodeType: 'timer',
      stepNumber: 1,
      displayName: 'timerResult_timer_1770024151262',
      data: step1Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for timer
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['timerResult_timer_1770024151262'] || typeof flowResults['timerResult_timer_1770024151262'] === 'undefined') {
      flowResults['timerResult_timer_1770024151262'] = step1Result;
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
      if (typeof window !== 'undefined' && window.__executedNodes && window.__executedNodes.has('openaiAgentSDKNode-1770024158249')) {
        console.log('⏭Skipping node (already executed via handoff):', 'openaiAgentSDKNode-1770024158249');
        
        // Get the result from dataFlow if available
        const existingResult = dataFlow.getByNodeId('openaiAgentSDKNode-1770024158249');
        if (existingResult) {
          step2Result = existingResult;
        } else {
          step2Result = 'Node already executed via handoff';
        }
        
        // Remove from executed set for next workflow run (CLIENT-SIDE ONLY)
        if (typeof window !== 'undefined' && window.__executedNodes) {
          window.__executedNodes.delete('openaiAgentSDKNode-1770024158249');
        }
      } else {
      let aiInput = '';
      
      
      // Single input processing (existing logic - UNCHANGED)
      
        // No user prompt provided - use previous step data
        let processedInput = currentResult;
        aiInput = typeof processedInput === 'string' ? processedInput : 
                  JSON.stringify(processedInput, null, 2);
      
    
      
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
            const agentId = 'agent-1771079854944';
            const userId = 'user-1771079854944';
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
         user_prompt: ``,

          model: 'gpt-4.1-2025-04-14',
          instructions: `System Role:
You are the Vitality WhatsApp Follow-Up Agent.
You are connected to two MCP tools:

Supabase MCP — to fetch user data from the crudsupabase table.

WhatsApp Send MCP — to send follow-up messages to users.

Your responsibility is to check who has not completed their joining process in the Vitality Weight Loss Program and send them a friendly, motivational follow-up message.

🧠 Core Workflow Logic

Fetch Data:

Retrieve all records from the Supabase table: crudsupabase.

Validate Records:

For each record:

Check the field joining_information.

If the value is null, proceed to send a message.

If it is not null, skip that user (do not send any message).

Extract Fields:

Name

phonenumber

Generate a Personalized WhatsApp Message:

Use a friendly, polite, and encouraging tone.

Mention the user’s name.

Include one fun or motivational health/fitness fact to make it engaging.

Keep it short and cheerful — include a few emojis for warmth.

Send Message:

Send the generated message to the respective phone number via the WhatsApp Send MCP tool.


💬 Message Template Example
Hey <Name> 👋  
Hope you're doing great today! Just a little nudge from the Vitality team 😄 — when do you think you'll join our Weight Loss Program?  

Fun fact: Drinking water before meals can boost metabolism and help with weight loss 💧🔥  

We’d love to have you onboard soon — your fitness story is waiting to begin 💪✨`,
          temperature: 0.7,
          max_tokens: 1000,
          apiKey: effectiveApiKey,
          agentType: 'orchestrator',
          selected_tools: [],
          tool_configs: {},
          tool_settings: {"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},
          mcp_servers: [{"id":"custom_mcp_1770024420717","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"Sendwhatsapp","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770024432542","url":"https://supabase-crud.simplita.ai/mcp","name":"Supabase","enabled":true,"description":"Custom MCP Server"}],
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
          const outgoingEdges = workflowEdges.filter((e: any) => e.source === 'openaiAgentSDKNode-1770024158249');
          
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
          const agentId = 'agent-1771079854944';
          const userId = 'user-1771079854944';
          const sessionId = 'session-1771079854944';
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
          const outgoingEdges = workflowEdges.filter((e: any) => e.source === 'openaiAgentSDKNode-1770024158249');
          
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
      flowResults.nodeResults['openaiAgentSDKNode-1770024158249'] = {
        nodeId: 'openaiAgentSDKNode-1770024158249',
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
      flowErrors.push('OpenAI Agent SDK error in node ' + "openaiAgentSDKNode-1770024158249" + ': ' + (error instanceof Error ? error.message : String(error)));
    }
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['openaiAgentSDKNode-1770024158249'] = {
      nodeId: 'openaiAgentSDKNode-1770024158249',
      nodeType: 'openaiAgentSDKNode',
      stepNumber: 2,
      displayName: 'openaiSDKResult_openaiAgentSDKNode_1770024158249',
      data: step2Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    flowResults.aiResponses['openaiSDKResult_openaiAgentSDKNode_1770024158249'] = step2Result;
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['openaiSDKResult_openaiAgentSDKNode_1770024158249'] || typeof flowResults['openaiSDKResult_openaiAgentSDKNode_1770024158249'] === 'undefined') {
      flowResults['openaiSDKResult_openaiAgentSDKNode_1770024158249'] = step2Result;
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
        nodeId: 'openaiAgentSDKNode-1770024158249',
        stepNumber: 2
      };
      
      currentResult = step2Result; // Update currentResult even on error
      
      // Store error result in enhanced data flow system
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['openaiAgentSDKNode-1770024158249'] = {
      nodeId: 'openaiAgentSDKNode-1770024158249',
      nodeType: 'openaiAgentSDKNode',
      stepNumber: 2,
      displayName: 'openaiSDKResult_openaiAgentSDKNode_1770024158249',
      data: step2Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    flowResults.aiResponses['openaiSDKResult_openaiAgentSDKNode_1770024158249'] = step2Result;
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['openaiSDKResult_openaiAgentSDKNode_1770024158249'] || typeof flowResults['openaiSDKResult_openaiAgentSDKNode_1770024158249'] === 'undefined') {
      flowResults['openaiSDKResult_openaiAgentSDKNode_1770024158249'] = step2Result;
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
      if ('flow_timer-1770024151262_1771079854943'.includes('button')) {
        // Extract button node information from chain
        const buttonNodes = Object.values(flowResults.nodeResults || {}).filter(
          (result: any) => result.nodeType === 'button'
        );
        
        buttonNodes.forEach((buttonNode: any) => {
          // Store chain ID mapped to button element ID
          if (buttonNode.elementId) {
            (window as any).buttonChainRegistry[buttonNode.elementId] = 'flow_timer-1770024151262_1771079854943';
            console.log(`🔗 Registered button chain: ${buttonNode.elementId} → flow_timer-1770024151262_1771079854943`);
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
        detail: { flowResults, chainId: 'flow_timer-1770024151262_1771079854943' } 
      }));
      (window as any).dispatchEvent(new CustomEvent('flowExecutionCompleted', { 
        detail: { flowResults, chainId: 'flow_timer-1770024151262_1771079854943' } 
      }));
      console.log("📡 Dispatched workflow completion events");
    }
    
    return {
      success: true,
      results: flowResults,
      errors: flowErrors,
      chainId: 'flow_timer-1770024151262_1771079854943'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) || 'Unknown error';
    console.error('❌ Flow chain execution error:', error);
    return {
      success: false,
      results: flowResults,
      errors: [...flowErrors, errorMessage],
      chainId: 'flow_timer-1770024151262_1771079854943'
    };
  }
};


console.log('⏰ Initializing timers for chain: flow_timer-1770024151262_1771079854943');

// Daily timer for node timer-1770024151262 at 10:00
const initializeTimer_timer_1770024151262 = () => {
  const schedule_timer_1770024151262 = () => {
    const now = new Date();
    const [hours, minutes] = '10:00'.split(':').map(Number);
    const scheduledTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
    
    
    // Daily mode: If time has already passed today, schedule for tomorrow
    if (scheduledTime <= now) {
      scheduledTime.setDate(scheduledTime.getDate() + 1);
    }
    
    
    const timeUntilExecution = scheduledTime.getTime() - now.getTime();
    
    console.log('⏰ Timer timer-1770024151262: Next execution scheduled for', scheduledTime.toLocaleString());
    console.log('⏰ Timer timer-1770024151262: Time until execution:', Math.round(timeUntilExecution / 1000 / 60), 'minutes');
    
    setTimeout(async () => {
      try {
        console.log('🔥 Timer timer-1770024151262: Executing scheduled flow at', new Date().toLocaleString());
        
        // Execute the flow chain
        if (typeof executeFlowChain_flow_timer_1770024151262_1771079854943 === 'function') {
          const result = await executeFlowChain_flow_timer_1770024151262_1771079854943({
            triggeredBy: 'timer',
            timerId: 'timer-1770024151262',
            scheduledTime: '10:00',
            executionTime: new Date().toISOString()
          });
          
          console.log('✅ Timer timer-1770024151262: Flow execution completed:', result);
        } else {
          console.error('❌ Timer timer-1770024151262: Flow function not available');
        }
        
        // Schedule for next day/week
        schedule_timer_1770024151262();
        
      } catch (error) {
        console.error('❌ Timer timer-1770024151262: Execution error:', error);
        
        // Still schedule for next day/week even if execution failed
        schedule_timer_1770024151262();
      }
    }, timeUntilExecution);
  };
  
  // Start the scheduling
  schedule_timer_1770024151262();
  
  // Make timer manually triggerable for testing
  if (typeof window !== 'undefined') {
    (window as any).triggerTimer_timer_1770024151262 = async () => {
      if (typeof executeFlowChain_flow_timer_1770024151262_1771079854943 === 'function') {
        return await executeFlowChain_flow_timer_1770024151262_1771079854943({
          triggeredBy: 'manual',
          timerId: 'timer-1770024151262',
          manualTrigger: true,
          executionTime: new Date().toISOString()
        });
      }
    };
    
  }
};

// Initialize timer immediately for daily/day&time scheduler (start trigger)
initializeTimer_timer_1770024151262();






// Register workflow nodes in global registry for cross-workflow node lookups
if (workflowRegistry && workflowRegistry.allNodes) {
  const workflowNodes = [{"id":"timer-1770024151262","nodeType":"timer","config":{"mode":"daily","time":"10:00","repeat":true,"enabled":true,"endTime":"23:59","interval":1000,"timezone":"UTC","dateField":"date","startTime":"00:00","timeField":"time","timerType":"interval","dateFormat":"YYYY-MM-DD","timeFormat":"HH:MM","databaseUrl":"","inputFormat":"YYYY-MM-DD HH:mm:ss","monthlyTime":"09:00","selectedDays":["Monday"],"dateFieldName":"","dateTimeField":"start_time","monthlyMonths":["All"],"timeFieldName":"","dayAndTimeTime":"09:00","monthlyTimezone":"UTC","pollingInterval":1,"databaseTimezone":"UTC","monthlyDaysOfMonth":[1],"monthlySkipInvalidDates":true}},{"id":"openaiAgentSDKNode-1770024158249","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"OpenAI Agent","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770024420717","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"Sendwhatsapp","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770024432542","url":"https://supabase-crud.simplita.ai/mcp","name":"Supabase","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"","agentSDKType":"orchestrator","credentialId":"","enableMemory":false,"handoff_mode":"transfer_control","instructions":"System Role:\nYou are the Vitality WhatsApp Follow-Up Agent.\nYou are connected to two MCP tools:\n\nSupabase MCP — to fetch user data from the crudsupabase table.\n\nWhatsApp Send MCP — to send follow-up messages to users.\n\nYour responsibility is to check who has not completed their joining process in the Vitality Weight Loss Program and send them a friendly, motivational follow-up message.\n\n🧠 Core Workflow Logic\n\nFetch Data:\n\nRetrieve all records from the Supabase table: crudsupabase.\n\nValidate Records:\n\nFor each record:\n\nCheck the field joining_information.\n\nIf the value is null, proceed to send a message.\n\nIf it is not null, skip that user (do not send any message).\n\nExtract Fields:\n\nName\n\nphonenumber\n\nGenerate a Personalized WhatsApp Message:\n\nUse a friendly, polite, and encouraging tone.\n\nMention the user’s name.\n\nInclude one fun or motivational health/fitness fact to make it engaging.\n\nKeep it short and cheerful — include a few emojis for warmth.\n\nSend Message:\n\nSend the generated message to the respective phone number via the WhatsApp Send MCP tool.\n\n\n💬 Message Template Example\nHey <Name> 👋  \nHope you're doing great today! Just a little nudge from the Vitality team 😄 — when do you think you'll join our Weight Loss Program?  \n\nFun fact: Drinking water before meals can boost metabolism and help with weight loss 💧🔥  \n\nWe’d love to have you onboard soon — your fitness story is waiting to begin 💪✨","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"openai_api_key":"process.env.OPENAI_API_KEY","resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","useStoredCredential":false,"auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}}];
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
  
  
  // Execute flow_timer-1770024151262_1771079854943
  if (!specificChainId || specificChainId === 'flow_timer-1770024151262_1771079854943') {
    
    // For script-event or other trigger types, use existing logic
    const triggerType = triggerData?.trigger || 'manual';
    const isPageLoadTrigger = triggerType === 'page-load';
    const isButtonOrFormChain = ['button', 'form', 'script-event'].includes('timer');
    
    // Debug logging (only in development)
    const DEBUG_FLOW_SYSTEM = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
    
    if (isButtonOrFormChain && isPageLoadTrigger && !specificChainId) {
      results['flow_timer_1770024151262_1771079854943'] = { 
        success: false, 
        skipped: true, 
        reason: 'Button/Form workflow should not run on page load',
        chainId: 'flow_timer_1770024151262_1771079854943',
        triggerType: triggerType,  // FIXED: Use actual triggerType
        workflowType: 'timer',
        actualTrigger: triggerType
      };
      return; // Explicit early return
    } else {
      // Proceed with workflow execution
      try {
        const result_flow_timer_1770024151262_1771079854943 = await executeFlowChain_flow_timer_1770024151262_1771079854943(triggerData);
        results['flow_timer_1770024151262_1771079854943'] = result_flow_timer_1770024151262_1771079854943;
        
        if (!result_flow_timer_1770024151262_1771079854943.success) {
          if (DEBUG_FLOW_SYSTEM) {
            console.error('❌ Chain flow_timer_1770024151262_1771079854943 failed:', result_flow_timer_1770024151262_1771079854943.errors);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error) || 'Unknown error';
        if (DEBUG_FLOW_SYSTEM) {
          console.error('💥 Error executing flow flow_timer_1770024151262_1771079854943:', error);
        }
        results['flow_timer_1770024151262_1771079854943'] = { success: false, error: errorMessage, chainId: 'flow_timer_1770024151262_1771079854943', results: {}, errors: [errorMessage] };
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
    "id": "flow_timer-1770024151262_1771079854943",
    "nodeTypes": [
      "timer",
      "openaiAgentSDKNode"
    ],
    "nodeCount": 2,
    "chainType": "linear",
    "startNode": {
      "id": "timer-1770024151262",
      "nodeType": "timer",
      "config": {
        "mode": "daily",
        "time": "10:00",
        "repeat": true,
        "enabled": true,
        "endTime": "23:59",
        "interval": 1000,
        "timezone": "UTC",
        "dateField": "date",
        "startTime": "00:00",
        "timeField": "time",
        "timerType": "interval",
        "dateFormat": "YYYY-MM-DD",
        "timeFormat": "HH:MM",
        "databaseUrl": "",
        "inputFormat": "YYYY-MM-DD HH:mm:ss",
        "monthlyTime": "09:00",
        "selectedDays": [
          "Monday"
        ],
        "dateFieldName": "",
        "dateTimeField": "start_time",
        "monthlyMonths": [
          "All"
        ],
        "timeFieldName": "",
        "dayAndTimeTime": "09:00",
        "monthlyTimezone": "UTC",
        "pollingInterval": 1,
        "databaseTimezone": "UTC",
        "monthlyDaysOfMonth": [
          1
        ],
        "monthlySkipInvalidDates": true
      }
    },
    "endNode": {
      "id": "openaiAgentSDKNode-1770024158249",
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
            "id": "custom_mcp_1770024420717",
            "url": "https://sendgoogleform-hcyuev.mcp.simplita.app/mcp",
            "name": "Sendwhatsapp",
            "enabled": true,
            "description": "Custom MCP Server"
          },
          {
            "id": "custom_mcp_1770024432542",
            "url": "https://supabase-crud.simplita.ai/mcp",
            "name": "Supabase",
            "enabled": true,
            "description": "Custom MCP Server"
          }
        ],
        "temperature": 0.7,
        "user_prompt": "",
        "agentSDKType": "orchestrator",
        "enableMemory": false,
        "handoff_mode": "transfer_control",
        "instructions": "System Role:\nYou are the Vitality WhatsApp Follow-Up Agent.\nYou are connected to two MCP tools:\n\nSupabase MCP — to fetch user data from the crudsupabase table.\n\nWhatsApp Send MCP — to send follow-up messages to users.\n\nYour responsibility is to check who has not completed their joining process in the Vitality Weight Loss Program and send them a friendly, motivational follow-up message.\n\n🧠 Core Workflow Logic\n\nFetch Data:\n\nRetrieve all records from the Supabase table: crudsupabase.\n\nValidate Records:\n\nFor each record:\n\nCheck the field joining_information.\n\nIf the value is null, proceed to send a message.\n\nIf it is not null, skip that user (do not send any message).\n\nExtract Fields:\n\nName\n\nphonenumber\n\nGenerate a Personalized WhatsApp Message:\n\nUse a friendly, polite, and encouraging tone.\n\nMention the user’s name.\n\nInclude one fun or motivational health/fitness fact to make it engaging.\n\nKeep it short and cheerful — include a few emojis for warmth.\n\nSend Message:\n\nSend the generated message to the respective phone number via the WhatsApp Send MCP tool.\n\n\n💬 Message Template Example\nHey <Name> 👋  \nHope you're doing great today! Just a little nudge from the Vitality team 😄 — when do you think you'll join our Weight Loss Program?  \n\nFun fact: Drinking water before meals can boost metabolism and help with weight loss 💧🔥  \n\nWe’d love to have you onboard soon — your fitness story is waiting to begin 💪✨",
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
    "nodes": [
      {
        "id": "timer-1770024151262",
        "nodeType": "timer",
        "config": {
          "mode": "daily",
          "time": "10:00",
          "repeat": true,
          "enabled": true,
          "endTime": "23:59",
          "interval": 1000,
          "timezone": "UTC",
          "dateField": "date",
          "startTime": "00:00",
          "timeField": "time",
          "timerType": "interval",
          "dateFormat": "YYYY-MM-DD",
          "timeFormat": "HH:MM",
          "databaseUrl": "",
          "inputFormat": "YYYY-MM-DD HH:mm:ss",
          "monthlyTime": "09:00",
          "selectedDays": [
            "Monday"
          ],
          "dateFieldName": "",
          "dateTimeField": "start_time",
          "monthlyMonths": [
            "All"
          ],
          "timeFieldName": "",
          "dayAndTimeTime": "09:00",
          "monthlyTimezone": "UTC",
          "pollingInterval": 1,
          "databaseTimezone": "UTC",
          "monthlyDaysOfMonth": [
            1
          ],
          "monthlySkipInvalidDates": true
        }
      },
      {
        "id": "openaiAgentSDKNode-1770024158249",
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
              "id": "custom_mcp_1770024420717",
              "url": "https://sendgoogleform-hcyuev.mcp.simplita.app/mcp",
              "name": "Sendwhatsapp",
              "enabled": true,
              "description": "Custom MCP Server"
            },
            {
              "id": "custom_mcp_1770024432542",
              "url": "https://supabase-crud.simplita.ai/mcp",
              "name": "Supabase",
              "enabled": true,
              "description": "Custom MCP Server"
            }
          ],
          "temperature": 0.7,
          "user_prompt": "",
          "agentSDKType": "orchestrator",
          "enableMemory": false,
          "handoff_mode": "transfer_control",
          "instructions": "System Role:\nYou are the Vitality WhatsApp Follow-Up Agent.\nYou are connected to two MCP tools:\n\nSupabase MCP — to fetch user data from the crudsupabase table.\n\nWhatsApp Send MCP — to send follow-up messages to users.\n\nYour responsibility is to check who has not completed their joining process in the Vitality Weight Loss Program and send them a friendly, motivational follow-up message.\n\n🧠 Core Workflow Logic\n\nFetch Data:\n\nRetrieve all records from the Supabase table: crudsupabase.\n\nValidate Records:\n\nFor each record:\n\nCheck the field joining_information.\n\nIf the value is null, proceed to send a message.\n\nIf it is not null, skip that user (do not send any message).\n\nExtract Fields:\n\nName\n\nphonenumber\n\nGenerate a Personalized WhatsApp Message:\n\nUse a friendly, polite, and encouraging tone.\n\nMention the user’s name.\n\nInclude one fun or motivational health/fitness fact to make it engaging.\n\nKeep it short and cheerful — include a few emojis for warmth.\n\nSend Message:\n\nSend the generated message to the respective phone number via the WhatsApp Send MCP tool.\n\n\n💬 Message Template Example\nHey <Name> 👋  \nHope you're doing great today! Just a little nudge from the Vitality team 😄 — when do you think you'll join our Weight Loss Program?  \n\nFun fact: Drinking water before meals can boost metabolism and help with weight loss 💧🔥  \n\nWe’d love to have you onboard soon — your fitness story is waiting to begin 💪✨",
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

