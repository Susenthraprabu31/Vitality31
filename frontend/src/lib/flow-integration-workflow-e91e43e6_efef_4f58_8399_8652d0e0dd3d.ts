
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






const executeFlowChain_flow_telegram_inbound_1770014553742_1771079854967 = async (initialData: any = {}): Promise<FlowResult> => {
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
  
  flowResults._executionId = `flow_telegram_inbound_1770014553742_1771079854967_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
    flowResults.originalChainData = {"id":"flow_telegram-inbound-1770014553742_1771079854967","nodes":[{"id":"telegram-inbound-1770014553742","nodeType":"telegram-inbound","config":{"id":"telegram-inbound-1770014553742","label":"Telegram Inbound","inputs":{"Bot Token":"static:"},"botToken":"","webhookUrl":"https://devapp.simplita.in/api/webhooks/telegram/telegram-inbound-1770014553742","credentialId":"943190dd-85b5-418c-a744-c4f0bdd05514","credentialName":"Gopinath_inbound","isWebhookRegistered":false}},{"id":"openaiAgentSDKNode-1770014563018","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"OpenAI Agent","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[],"querySource":"","temperature":0.7,"user_prompt":"{{messageText}}","agentSDKType":"orchestrator","enableMemory":false,"handoff_mode":"tool_call","instructions":"You are the Orchestrator Agent, responsible for routing messages to specialized sub-agents based on intent.\nYour role is not to answer user questions directly — your job is to analyze the message and decide which agent should handle it.\n\nWhen a message arrives:\n\nIf it contains keywords or context related to “orientation call”, “onboarding call”, “introduction session”, or “training session”, route it to the Orientation Call Agent.\n\nIf it contains keywords or context related to “root cause”, “issue analysis”, “incident report”, “problem summary”, or “troubleshooting”, route it to the Root Cause Call Agent.\n\nIf none of the above intents are found, respond with:\n\n“No specific keywords are matched. Please use appropriate keywords.”","tool_configs":{},"queryVariable":"","tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"variableInput":"","resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":true,"handoff_targets":[{"agent_label":"Orientation call Summary","agent_node_id":"openaiAgentSDKNode-1770014701913","agent_description":"OpenAI Agent application","handoff_instructions":"Transfer to Orientation call Summary for specialized assistance"},{"agent_label":"Root cause call summary","agent_node_id":"openaiAgentSDKNode-1770014706694","agent_description":"OpenAI Agent application","handoff_instructions":"Transfer to Root cause call summary for specialized assistance"}],"memoryTableName":"agent_interactions","selectedDataSources":[],"auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}},{"id":"telegram-send-message-1770014570163","nodeType":"Telegram Send Message","config":{"fields":[{"id":"bot_token","name":"Bot Token"},{"id":"chat_id","name":"Chat ID"},{"id":"text","name":"Message Text"},{"id":"parse_mode","name":"Parse Mode"},{"id":"media_type","name":"Media Type"},{"id":"media_url","name":"Media URL"},{"id":"media_caption","name":"Media Caption"}],"inputs":{"Chat ID":"static:{{chatId}}","Bot Token":"static:","Media URL":"static:","Media Type":"static:none","Parse Mode":"static:HTML","Message Text":"static:{{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770014563018\")}}","Media Caption":"static:"},"botToken":"","mediaUrl":"","mediaType":"none","parseMode":"HTML","sendMedia":false,"messageText":"{{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770014563018\")}}","credentialId":"99bc673e-a01f-4d8d-9922-35efd8378449","mediaCaption":"","credentialName":"Gopinath_Telegramsend","selectedMethod":"telegram_send_message"}}],"edges":[{"source":"telegram-inbound-1770014553742","target":"openaiAgentSDKNode-1770014563018"},{"source":"openaiAgentSDKNode-1770014563018","target":"telegram-send-message-1770014570163"}],"chainType":"linear","dataFlow":[],"startNode":{"id":"telegram-inbound-1770014553742","nodeType":"telegram-inbound","config":{"id":"telegram-inbound-1770014553742","label":"Telegram Inbound","inputs":{"Bot Token":"static:"},"botToken":"","webhookUrl":"https://devapp.simplita.in/api/webhooks/telegram/telegram-inbound-1770014553742","credentialId":"943190dd-85b5-418c-a744-c4f0bdd05514","credentialName":"Gopinath_inbound","isWebhookRegistered":false}},"endNode":{"id":"telegram-send-message-1770014570163","nodeType":"Telegram Send Message","config":{"fields":[{"id":"bot_token","name":"Bot Token"},{"id":"chat_id","name":"Chat ID"},{"id":"text","name":"Message Text"},{"id":"parse_mode","name":"Parse Mode"},{"id":"media_type","name":"Media Type"},{"id":"media_url","name":"Media URL"},{"id":"media_caption","name":"Media Caption"}],"inputs":{"Chat ID":"static:{{chatId}}","Bot Token":"static:","Media URL":"static:","Media Type":"static:none","Parse Mode":"static:HTML","Message Text":"static:{{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770014563018\")}}","Media Caption":"static:"},"botToken":"","mediaUrl":"","mediaType":"none","parseMode":"HTML","sendMedia":false,"messageText":"{{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770014563018\")}}","credentialId":"99bc673e-a01f-4d8d-9922-35efd8378449","mediaCaption":"","credentialName":"Gopinath_Telegramsend","selectedMethod":"telegram_send_message"}}};

    // Declare all step result variables
    let step1Result: any;
    let step2Result: any;
    let step3Result: any;



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
    flowResults.originalChainData = {"id":"flow_telegram-inbound-1770014553742_1771079854967","nodes":[{"id":"telegram-inbound-1770014553742","nodeType":"telegram-inbound","config":{"id":"telegram-inbound-1770014553742","label":"Telegram Inbound","inputs":{"Bot Token":"static:"},"botToken":"","webhookUrl":"https://devapp.simplita.in/api/webhooks/telegram/telegram-inbound-1770014553742","credentialId":"943190dd-85b5-418c-a744-c4f0bdd05514","credentialName":"Gopinath_inbound","isWebhookRegistered":false}},{"id":"openaiAgentSDKNode-1770014563018","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"OpenAI Agent","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[],"querySource":"","temperature":0.7,"user_prompt":"{{messageText}}","agentSDKType":"orchestrator","enableMemory":false,"handoff_mode":"tool_call","instructions":"You are the Orchestrator Agent, responsible for routing messages to specialized sub-agents based on intent.\nYour role is not to answer user questions directly — your job is to analyze the message and decide which agent should handle it.\n\nWhen a message arrives:\n\nIf it contains keywords or context related to “orientation call”, “onboarding call”, “introduction session”, or “training session”, route it to the Orientation Call Agent.\n\nIf it contains keywords or context related to “root cause”, “issue analysis”, “incident report”, “problem summary”, or “troubleshooting”, route it to the Root Cause Call Agent.\n\nIf none of the above intents are found, respond with:\n\n“No specific keywords are matched. Please use appropriate keywords.”","tool_configs":{},"queryVariable":"","tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"variableInput":"","resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":true,"handoff_targets":[{"agent_label":"Orientation call Summary","agent_node_id":"openaiAgentSDKNode-1770014701913","agent_description":"OpenAI Agent application","handoff_instructions":"Transfer to Orientation call Summary for specialized assistance"},{"agent_label":"Root cause call summary","agent_node_id":"openaiAgentSDKNode-1770014706694","agent_description":"OpenAI Agent application","handoff_instructions":"Transfer to Root cause call summary for specialized assistance"}],"memoryTableName":"agent_interactions","selectedDataSources":[],"auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}},{"id":"telegram-send-message-1770014570163","nodeType":"Telegram Send Message","config":{"fields":[{"id":"bot_token","name":"Bot Token"},{"id":"chat_id","name":"Chat ID"},{"id":"text","name":"Message Text"},{"id":"parse_mode","name":"Parse Mode"},{"id":"media_type","name":"Media Type"},{"id":"media_url","name":"Media URL"},{"id":"media_caption","name":"Media Caption"}],"inputs":{"Chat ID":"static:{{chatId}}","Bot Token":"static:","Media URL":"static:","Media Type":"static:none","Parse Mode":"static:HTML","Message Text":"static:{{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770014563018\")}}","Media Caption":"static:"},"botToken":"","mediaUrl":"","mediaType":"none","parseMode":"HTML","sendMedia":false,"messageText":"{{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770014563018\")}}","credentialId":"99bc673e-a01f-4d8d-9922-35efd8378449","mediaCaption":"","credentialName":"Gopinath_Telegramsend","selectedMethod":"telegram_send_message"}}],"edges":[{"source":"telegram-inbound-1770014553742","target":"openaiAgentSDKNode-1770014563018"},{"source":"openaiAgentSDKNode-1770014563018","target":"telegram-send-message-1770014570163"}],"chainType":"linear","dataFlow":[],"startNode":{"id":"telegram-inbound-1770014553742","nodeType":"telegram-inbound","config":{"id":"telegram-inbound-1770014553742","label":"Telegram Inbound","inputs":{"Bot Token":"static:"},"botToken":"","webhookUrl":"https://devapp.simplita.in/api/webhooks/telegram/telegram-inbound-1770014553742","credentialId":"943190dd-85b5-418c-a744-c4f0bdd05514","credentialName":"Gopinath_inbound","isWebhookRegistered":false}},"endNode":{"id":"telegram-send-message-1770014570163","nodeType":"Telegram Send Message","config":{"fields":[{"id":"bot_token","name":"Bot Token"},{"id":"chat_id","name":"Chat ID"},{"id":"text","name":"Message Text"},{"id":"parse_mode","name":"Parse Mode"},{"id":"media_type","name":"Media Type"},{"id":"media_url","name":"Media URL"},{"id":"media_caption","name":"Media Caption"}],"inputs":{"Chat ID":"static:{{chatId}}","Bot Token":"static:","Media URL":"static:","Media Type":"static:none","Parse Mode":"static:HTML","Message Text":"static:{{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770014563018\")}}","Media Caption":"static:"},"botToken":"","mediaUrl":"","mediaType":"none","parseMode":"HTML","sendMedia":false,"messageText":"{{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770014563018\")}}","credentialId":"99bc673e-a01f-4d8d-9922-35efd8378449","mediaCaption":"","credentialName":"Gopinath_Telegramsend","selectedMethod":"telegram_send_message"}}};
    
    if (typeof window !== 'undefined') {
      // SECURITY: Store SANITIZED workflow nodes in window context (remove API keys)
      // Sanitize each node individually to ensure all sensitive data is removed
      const sanitizedNodes = [{"id":"telegram-inbound-1770014553742","nodeType":"telegram-inbound","config":{"id":"telegram-inbound-1770014553742","label":"Telegram Inbound","inputs":{"Bot Token":"static:"},"botToken":"","webhookUrl":"https://devapp.simplita.in/api/webhooks/telegram/telegram-inbound-1770014553742","credentialId":"943190dd-85b5-418c-a744-c4f0bdd05514","credentialName":"Gopinath_inbound","isWebhookRegistered":false}},{"id":"openaiAgentSDKNode-1770014563018","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"OpenAI Agent","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[],"querySource":"","temperature":0.7,"user_prompt":"{{messageText}}","agentSDKType":"orchestrator","enableMemory":false,"handoff_mode":"tool_call","instructions":"You are the Orchestrator Agent, responsible for routing messages to specialized sub-agents based on intent.\nYour role is not to answer user questions directly — your job is to analyze the message and decide which agent should handle it.\n\nWhen a message arrives:\n\nIf it contains keywords or context related to “orientation call”, “onboarding call”, “introduction session”, or “training session”, route it to the Orientation Call Agent.\n\nIf it contains keywords or context related to “root cause”, “issue analysis”, “incident report”, “problem summary”, or “troubleshooting”, route it to the Root Cause Call Agent.\n\nIf none of the above intents are found, respond with:\n\n“No specific keywords are matched. Please use appropriate keywords.”","tool_configs":{},"queryVariable":"","tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"variableInput":"","resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":true,"handoff_targets":[{"agent_label":"Orientation call Summary","agent_node_id":"openaiAgentSDKNode-1770014701913","agent_description":"OpenAI Agent application","handoff_instructions":"Transfer to Orientation call Summary for specialized assistance"},{"agent_label":"Root cause call summary","agent_node_id":"openaiAgentSDKNode-1770014706694","agent_description":"OpenAI Agent application","handoff_instructions":"Transfer to Root cause call summary for specialized assistance"}],"memoryTableName":"agent_interactions","selectedDataSources":[],"auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}},{"id":"telegram-send-message-1770014570163","nodeType":"Telegram Send Message","config":{"fields":[{"id":"bot_token","name":"Bot Token"},{"id":"chat_id","name":"Chat ID"},{"id":"text","name":"Message Text"},{"id":"parse_mode","name":"Parse Mode"},{"id":"media_type","name":"Media Type"},{"id":"media_url","name":"Media URL"},{"id":"media_caption","name":"Media Caption"}],"inputs":{"Chat ID":"static:{{chatId}}","Bot Token":"static:","Media URL":"static:","Media Type":"static:none","Parse Mode":"static:HTML","Message Text":"static:{{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770014563018\")}}","Media Caption":"static:"},"botToken":"","mediaUrl":"","mediaType":"none","parseMode":"HTML","sendMedia":false,"messageText":"{{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770014563018\")}}","credentialId":"99bc673e-a01f-4d8d-9922-35efd8378449","mediaCaption":"","credentialName":"Gopinath_Telegramsend","selectedMethod":"telegram_send_message"}}];
      
      (window as any).__currentWorkflowNodes = sanitizedNodes;
      (window as any).__flowChainMetadata = {
        chainId: 'flow_telegram-inbound-1770014553742_1771079854967',
        currentChainNodes: sanitizedNodes,
        nodeCount: 3
      };
      console.log('🔗 Workflow nodes made available globally: 3 nodes');
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
      
    // Process telegram-inbound node
    try {
      // Extract configuration from the node
      const telegramNodeConfig = flowResults.originalChainData.nodes.find(
        (node: any) => node.id === 'telegram-inbound-1770014553742'
      )?.config || {};
      
      // Enhanced template processing helper function with nested property support
      const processTemplate = (template: string): any => {
        if (!template || typeof template !== 'string') return template;
        try {
          // TemplateExpressionEngine is already imported at the top of the generated workflow file
          
          // Build comprehensive template context
          const templateContext: Record<string, any> = {};
          
          // Add flowResults if available
          if (typeof flowResults !== 'undefined') {
            Object.assign(templateContext, flowResults);
            // Also add nested access to flowResults properties
            if (flowResults.variables) {
              Object.assign(templateContext, flowResults.variables);
            }
            if (flowResults.apiResponses) {
              Object.assign(templateContext, flowResults.apiResponses);
            }
          }
          
          // Add dataFlow if available
          if (typeof dataFlow !== 'undefined') {
            templateContext.dataFlow = dataFlow;
          }
          
          // Add initialData if available (for telegram inbound)
          if (typeof initialData !== 'undefined' && initialData !== null) {
            templateContext.initialData = initialData;
            templateContext.inputData = initialData;
            templateContext.input = initialData;
            // If initialData is an object, spread its properties
            if (typeof initialData === 'object' && !Array.isArray(initialData)) {
              Object.assign(templateContext, initialData);
            }
          }
          
          // Process template with support for nested properties (e.g., {{output.value.value2}})
          // First, try processTemplate for simple variables
          let processed = TemplateExpressionEngine.processTemplate(template, templateContext, {
            allowFunctions: true
          });
          
          // If template still contains {{}}, try evaluate for nested property access
          if (processed.includes('{{') && processed.includes('}}')) {
            // Extract and evaluate each template expression
            processed = processed.replace(/\{\{([^}]+)\}\}/g, (match, expr) => {
              const trimmedExpr = expr.trim();
              
              // Skip if already processed
              if (!trimmedExpr) return match;
              
              try {
                // Use evaluate for nested property access (e.g., output.value.value2)
                const result = TemplateExpressionEngine.evaluate(trimmedExpr, templateContext, {
                  allowFunctions: true,
                  allowComplexExpressions: true,
                  returnType: 'auto'
                });
                
                if (result !== undefined && result !== null) {
                  // Convert to string, handling objects/arrays
                  if (typeof result === 'object') {
                    return JSON.stringify(result);
                  }
                  return String(result);
                }
                
                return match; // Return original if evaluation fails
              } catch (evalErr) {
                return match; // Return original on error
              }
            });
          }
          
          return processed;
        } catch (err) {
          return template;
        }
      };
      
      // 🔧 CREDENTIAL PRIORITY: manual input > credential-name-based env var > default env var
      // Note: Credential name is already stored in config, so we use it directly to construct env var names
      // No need to fetch credentials at runtime - the generated code is self-contained
      let botToken = '';
      
      // Priority 1: Use manual bot token from input field (processed through template engine)
      const manualBotTokenValue = processTemplate(telegramNodeConfig.botToken || '');
      const manualBotToken = typeof manualBotTokenValue === 'string' ? manualBotTokenValue.trim() : '';
      
      // Priority 2: Fallback to credential-name-based environment variable (if credential name is available)
      // Priority 3: Fallback to default environment variable
      if (manualBotToken) {
        botToken = manualBotToken;
      } else {
        // Use credential-name-based env var if credential name is configured, otherwise fallback to default
        // credentialIdentifier and botTokenEnvVar are computed at code generation time and embedded as string literals
        botToken = process.env["NEXT_PUBLIC_INBOUND_TELEGRAM_GOPINATHINBOUND_BOT_TOKEN"] || process.env.NEXT_PUBLIC_INBOUND_TELEGRAM_BOT_TOKEN || '';
      }
      
      // Validate bot token
      if (!botToken) {
        const envVarHint = "NEXT_PUBLIC_INBOUND_TELEGRAM_GOPINATHINBOUND_BOT_TOKEN";
        throw new Error(`Telegram Inbound Bot Token is required. Please provide it via node input or set ${envVarHint} in .env.local`);
      }
      
      const webhookId = 'telegram-inbound-1770014553742';
      
      // For initial data, we'll use any incoming message data or create a placeholder for demonstration
      // Check if initialData contains actual message data by looking for key properties like messageId
      const hasRealMessageData =
        initialData?.messageId !== undefined &&
        initialData?.messageId !== '' &&
        initialData?.messageId !== 'placeholder-message-id';

      // CRITICAL FIX: Extract all fields dynamically from multiple possible locations
      // Extract messageText from multiple possible locations including rawMessage.text
      const extractedMessageText = initialData?.messageText ||
                                   initialData?.telegram?.messageText ||
                                   initialData?.message?.text ||
                                   initialData?.rawMessage?.text ||
                                   (initialData?.rawMessage && typeof initialData.rawMessage === 'object' && initialData.rawMessage.text) ||
                                   '';

      // Extract chatId from multiple possible locations
      const extractedChatId = initialData?.chatId ||
                              initialData?.telegram?.chatId ||
                              initialData?.rawMessage?.chat?.id ||
                              initialData?.message?.chat_id ||
                              (initialData?.rawMessage && typeof initialData.rawMessage === 'object' && initialData.rawMessage.chat?.id) ||
                              '';

      // Extract username from multiple possible locations
      const extractedUsername = initialData?.username ||
                                initialData?.telegram?.username ||
                                initialData?.rawMessage?.from?.username ||
                                initialData?.message?.username ||
                                (initialData?.rawMessage && typeof initialData.rawMessage === 'object' && initialData.rawMessage.from?.username) ||
                                '';

      // Extract firstName from multiple possible locations
      const extractedFirstName = initialData?.firstName ||
                                  initialData?.telegram?.firstName ||
                                  initialData?.rawMessage?.from?.first_name ||
                                  initialData?.message?.first_name ||
                                  (initialData?.rawMessage && typeof initialData.rawMessage === 'object' && initialData.rawMessage.from?.first_name) ||
                                  '';

      // Extract lastName from multiple possible locations
      const extractedLastName = initialData?.lastName ||
                                 initialData?.telegram?.lastName ||
                                 initialData?.rawMessage?.from?.last_name ||
                                 initialData?.message?.last_name ||
                                 (initialData?.rawMessage && typeof initialData.rawMessage === 'object' && initialData.rawMessage.from?.last_name) ||
                                 '';

      // Extract messageId from multiple possible locations
      const extractedMessageId = initialData?.messageId ||
                                  initialData?.telegram?.messageId ||
                                  initialData?.rawMessage?.message_id ||
                                  initialData?.message?.id ||
                                  (initialData?.rawMessage && typeof initialData.rawMessage === 'object' && initialData.rawMessage.message_id) ||
                                  '';

      // Extract userId from multiple possible locations
      const extractedUserId = initialData?.userId ||
                               initialData?.user_id ||
                               initialData?.telegram?.userId ||
                               initialData?.rawMessage?.from?.id ||
                               initialData?.message?.user_id ||
                               (initialData?.rawMessage && typeof initialData.rawMessage === 'object' && initialData.rawMessage.from?.id) ||
                               '';

      // Extract messageDate from multiple possible locations
      const extractedMessageDate = initialData?.messageDate ||
                                    initialData?.telegram?.messageDate ||
                                    (initialData?.rawMessage?.date ? new Date(initialData.rawMessage.date * 1000).toISOString() : null) ||
                                    initialData?.message?.timestamp ||
                                    (initialData?.rawMessage && typeof initialData.rawMessage === 'object' && initialData.rawMessage.date ? new Date(initialData.rawMessage.date * 1000).toISOString() : null) ||
                                    new Date().toISOString();

      // Extract messageType from multiple possible locations
      const extractedMessageType = initialData?.messageType ||
                                   initialData?.telegram?.messageType ||
                                   initialData?.rawMessage?.messageType ||
                                   initialData?.message?.type ||
                                   (initialData?.rawMessage && typeof initialData.rawMessage === 'object' && initialData.rawMessage.messageType) ||
                                   'text';

      // Extract chatType from multiple possible locations
      const extractedChatType = initialData?.chatType ||
                                initialData?.telegram?.chatType ||
                                initialData?.rawMessage?.chat?.type ||
                                initialData?.message?.chat_type ||
                                (initialData?.rawMessage && typeof initialData.rawMessage === 'object' && initialData.rawMessage.chat?.type) ||
                                'private';

      // Extract language from multiple possible locations
      const extractedLanguage = initialData?.language ||
                                initialData?.telegram?.language ||
                                initialData?.rawMessage?.from?.language_code ||
                                initialData?.message?.language_code ||
                                (initialData?.rawMessage && typeof initialData.rawMessage === 'object' && initialData.rawMessage.from?.language_code) ||
                                '';

      // Extract isBot from multiple possible locations
      const extractedIsBot = initialData?.isBot !== undefined ? initialData.isBot :
                              initialData?.telegram?.isBot !== undefined ? initialData.telegram.isBot :
                              initialData?.rawMessage?.from?.is_bot !== undefined ? initialData.rawMessage.from.is_bot :
                              initialData?.message?.is_bot !== undefined ? initialData.message.is_bot :
                              (initialData?.rawMessage && typeof initialData.rawMessage === 'object' && initialData.rawMessage.from?.is_bot !== undefined) ? initialData.rawMessage.from.is_bot :
                              false;

      const hasIncomingTelegramData = Boolean(
        initialData && (initialData.message || initialData.rawMessage || initialData.telegram || hasRealMessageData)
      );

      step1Result;

      step1Result = hasIncomingTelegramData ? {
        ...initialData,
        // Ensure messageText is extracted and available
        messageText: extractedMessageText || initialData?.messageText || initialData?.telegram?.messageText || initialData?.message?.text || initialData?.rawMessage?.text || '',
        // Ensure telegram object has all extracted values
        telegram: {
          ...initialData?.telegram,
          messageText: extractedMessageText || initialData?.telegram?.messageText || initialData?.messageText || initialData?.message?.text || initialData?.rawMessage?.text || '',
          chatId: extractedChatId || initialData?.telegram?.chatId || initialData?.chatId || initialData?.rawMessage?.chat?.id || '',
          username: extractedUsername || initialData?.telegram?.username || initialData?.username || initialData?.rawMessage?.from?.username || '',
          firstName: extractedFirstName || initialData?.telegram?.firstName || initialData?.firstName || initialData?.rawMessage?.from?.first_name || '',
          lastName: extractedLastName || initialData?.telegram?.lastName || initialData?.lastName || initialData?.rawMessage?.from?.last_name || '',
          messageId: extractedMessageId || initialData?.telegram?.messageId || initialData?.messageId || initialData?.rawMessage?.message_id || initialData?.message?.id || '',
          userId: extractedUserId || initialData?.telegram?.userId || initialData?.userId || initialData?.user_id || initialData?.rawMessage?.from?.id || '',
          chatType: extractedChatType || initialData?.telegram?.chatType || initialData?.chatType || initialData?.rawMessage?.chat?.type || 'private',
          messageType: extractedMessageType || initialData?.telegram?.messageType || initialData?.messageType || 'text',
          messageDate: extractedMessageDate || initialData?.telegram?.messageDate || initialData?.messageDate || new Date().toISOString(),
          language: extractedLanguage || initialData?.telegram?.language || initialData?.language || initialData?.rawMessage?.from?.language_code || '',
          isBot: extractedIsBot !== undefined ? extractedIsBot : (initialData?.telegram?.isBot !== undefined ? initialData.telegram.isBot : (initialData?.isBot !== undefined ? initialData.isBot : (initialData?.rawMessage?.from?.is_bot !== undefined ? initialData.rawMessage.from.is_bot : false))),
          fullMessage: initialData?.telegram?.fullMessage || initialData?.fullMessage || initialData?.rawMessage || initialData
        },
        // Backward compatibility fields with extracted values
        chatId: extractedChatId || initialData?.chatId || initialData?.telegram?.chatId || initialData?.rawMessage?.chat?.id || '',
        username: extractedUsername || initialData?.username || initialData?.telegram?.username || initialData?.rawMessage?.from?.username || '',
        firstName: extractedFirstName || initialData?.firstName || initialData?.telegram?.firstName || initialData?.rawMessage?.from?.first_name || '',
        lastName: extractedLastName || initialData?.lastName || initialData?.telegram?.lastName || initialData?.rawMessage?.from?.last_name || '',
        messageText: extractedMessageText || initialData?.messageText || initialData?.telegram?.messageText || initialData?.message?.text || initialData?.rawMessage?.text || '',
        messageDate: extractedMessageDate || initialData?.messageDate || initialData?.telegram?.messageDate || new Date().toISOString(),
        messageId: extractedMessageId || initialData?.messageId || initialData?.telegram?.messageId || initialData?.message?.id || initialData?.rawMessage?.message_id || '',
        userId: extractedUserId || initialData?.userId || initialData?.user_id || initialData?.telegram?.userId || initialData?.rawMessage?.from?.id || '',
        messageType: extractedMessageType || initialData?.messageType || initialData?.telegram?.messageType || 'text',
        nodeId: 'telegram-inbound-1770014553742',
        nodeType: 'telegram-inbound',
        success: true,
        timestamp: new Date().toISOString()
      } : {
        message: {
          id: 'placeholder-message-id',
          text: 'This is a placeholder for incoming Telegram messages',
          chat_id: 'placeholder-chat-id',
          user_id: 'placeholder-user-id',
          username: 'placeholder-username',
          timestamp: new Date().toISOString()
        },
        // Enhanced Telegram data structure
        telegram: {
          chatId: 'placeholder-chat-id',
          username: 'placeholder-username',
          firstName: '',
          lastName: '',
          messageText: 'Placeholder message',
          messageDate: new Date().toISOString(),
          messageId: 'placeholder-message-id',
          userId: 'placeholder-user-id',
          chatType: 'private',
          messageType: 'text',
          language: '',
          isBot: false,
          fullMessage: {}
        },
        // Backward compatibility fields
        chatId: 'placeholder-chat-id',
        username: 'placeholder-username',
        firstName: '',
        lastName: '',
        messageText: 'Placeholder message',
        messageDate: new Date().toISOString(),
        messageId: 'placeholder-message-id',
        userId: 'placeholder-user-id',
        nodeId: 'telegram-inbound-1770014553742',
        nodeType: 'telegram-inbound',
        success: true,
        timestamp: new Date().toISOString()
      };

      // Ensure reply-to-message fields are populated even if missing from the incoming payload
      const resolvedReplyToMessage =
        (step1Result.replyToMessage !== undefined && step1Result.replyToMessage !== null && step1Result.replyToMessage !== '')
          ? step1Result.replyToMessage
          : (initialData?.replyToMessage || initialData?.telegram?.replyToMessage || initialData?.message?.reply_to_message || null);
      step1Result.replyToMessage = resolvedReplyToMessage;

      const fallbackReplyToMessageId =
      initialData?.data?.replyToMessageId ||
        initialData?.replyToMessageId ||
        initialData?.telegram?.replyToMessageId ||
        (initialData?.telegram?.replyToMessage ? initialData.telegram.replyToMessage.message_id?.toString() : '') ||
        (initialData?.message?.reply_to_message ? initialData.message.reply_to_message.message_id?.toString() : '') ||
                (initialData?.rawMessage?.reply_to_message ? initialData.rawMessage.reply_to_message.message_id?.toString() : '') ||

        '';
      if (step1Result.replyToMessageId === undefined || step1Result.replyToMessageId === null || step1Result.replyToMessageId === '') {
        step1Result.replyToMessageId = fallbackReplyToMessageId;
      }

      const fallbackReplyToMessageText =
      initialData?.data?.replyToMessageText ||
        initialData?.replyToMessageText ||
        initialData?.telegram?.replyToMessageText ||
        (initialData?.telegram?.replyToMessage ? (initialData.telegram.replyToMessage.text || initialData.telegram.replyToMessage.caption || '') : '') ||
        (initialData?.message?.reply_to_message ? (initialData.message.reply_to_message.text || initialData.message.reply_to_message.caption || '') : '') ||
        (initialData?.rawMessage?.reply_to_message ? (initialData.rawMessage.reply_to_message.text || initialData.rawMessage.reply_to_message.caption || '') : '') ||
        '';
      if (step1Result.replyToMessageText === undefined || step1Result.replyToMessageText === null || step1Result.replyToMessageText === '') {
        step1Result.replyToMessageText = fallbackReplyToMessageText;
      }

      const fallbackReplyToMessageUserId =
        initialData?.data?.replyToMessageUserId ||
        initialData?.replyToMessageUserId ||
        initialData?.telegram?.replyToMessageUserId ||
        (initialData?.telegram?.replyToMessage?.from?.id?.toString() || '') ||
        (initialData?.message?.reply_to_message?.from?.id?.toString() || '') ||
        (initialData?.rawMessage?.reply_to_message?.from?.id?.toString() || '') ||
        '';
      if (step1Result.replyToMessageUserId === undefined || step1Result.replyToMessageUserId === null || step1Result.replyToMessageUserId === '') {
        step1Result.replyToMessageUserId = fallbackReplyToMessageUserId;
      }

      const fallbackReplyToMessageUsername =
        initialData?.data?.replyToMessageUsername ||
        initialData?.replyToMessageUsername ||
        initialData?.telegram?.replyToMessageUsername ||
        (initialData?.telegram?.replyToMessage?.from?.username || '') ||
        (initialData?.message?.reply_to_message?.from?.username || '') ||
        (initialData?.rawMessage?.reply_to_message?.from?.username || '') ||
        '';
      if (step1Result.replyToMessageUsername === undefined || step1Result.replyToMessageUsername === null || step1Result.replyToMessageUsername === '') {
        step1Result.replyToMessageUsername = fallbackReplyToMessageUsername;
      }

      const fallbackReplyToMessageFirstName =
        initialData?.data?.replyToMessageFirstName ||
        initialData?.replyToMessageFirstName ||
        initialData?.telegram?.replyToMessageFirstName ||
        (initialData?.telegram?.replyToMessage?.from?.first_name || '') ||
        (initialData?.message?.reply_to_message?.from?.first_name || '') ||
        (initialData?.rawMessage?.reply_to_message?.from?.first_name || '') ||
        '';
      if (step1Result.replyToMessageFirstName === undefined || step1Result.replyToMessageFirstName === null || step1Result.replyToMessageFirstName === '') {
        step1Result.replyToMessageFirstName = fallbackReplyToMessageFirstName;
      }

      const fallbackReplyToMessageLastName =
        initialData?.data?.replyToMessageLastName ||
        initialData?.replyToMessageLastName ||
        initialData?.telegram?.replyToMessageLastName ||
        (initialData?.telegram?.replyToMessage?.from?.last_name || '') ||
        (initialData?.message?.reply_to_message?.from?.last_name || '') ||
        (initialData?.rawMessage?.reply_to_message?.from?.last_name || '') ||
        '';
      if (step1Result.replyToMessageLastName === undefined || step1Result.replyToMessageLastName === null || step1Result.replyToMessageLastName === '') {
        step1Result.replyToMessageLastName = fallbackReplyToMessageLastName;
      }
      
      // CRITICAL FIX: If initialData has rawMessage fields, ensure we extract them properly
      if (initialData?.rawMessage?.text && (!step1Result.messageText || step1Result.messageText === 'Placeholder message' || step1Result.messageText === '')) {
        step1Result.messageText = initialData.rawMessage.text;
        if (step1Result.telegram) {
          step1Result.telegram.messageText = initialData.rawMessage.text;
        }
      }
      
      // Store Telegram data as workflow variables for easy access by other nodes
      // Store each field as a variable so they can be accessed with {{variableName}}
      flowResults.variables = flowResults.variables || {};
      
      // Extract values from result using dynamic extraction (checking all possible locations)
      // CRITICAL FIX: Check rawMessage fields as fallback for all fields
      const telegramChatId = step1Result.chatId ||
                              step1Result.telegram?.chatId ||
                              step1Result.rawMessage?.chat?.id ||
                              step1Result.message?.chat_id ||
                              initialData?.rawMessage?.chat?.id ||
                              initialData?.chatId ||
                              initialData?.telegram?.chatId ||
                              '';
      const telegramUsername = step1Result.username ||
                               step1Result.telegram?.username ||
                               step1Result.rawMessage?.from?.username ||
                               step1Result.message?.username ||
                               initialData?.rawMessage?.from?.username ||
                               initialData?.username ||
                               initialData?.telegram?.username ||
                               '';
      const telegramMessageText = step1Result.messageText ||
                                  step1Result.telegram?.messageText ||
                                  step1Result.message?.text ||
                                  step1Result.rawMessage?.text ||
                                  initialData?.rawMessage?.text ||
                                  initialData?.messageText ||
                                  initialData?.telegram?.messageText ||
                                  initialData?.message?.text ||
                                  '';
      const telegramMessageDate = step1Result.messageDate ||
                                  step1Result.telegram?.messageDate ||
                                  (step1Result.rawMessage?.date ? new Date(step1Result.rawMessage.date * 1000).toISOString() : null) ||
                                  step1Result.message?.timestamp ||
                                  (initialData?.rawMessage?.date ? new Date(initialData.rawMessage.date * 1000).toISOString() : null) ||
                                  initialData?.messageDate ||
                                  initialData?.telegram?.messageDate ||
                                  new Date().toISOString();
      const telegramUserId = step1Result.userId ||
                             step1Result.user_id ||
                             step1Result.telegram?.userId ||
                             step1Result.rawMessage?.from?.id ||
                             step1Result.message?.user_id ||
                             initialData?.rawMessage?.from?.id ||
                             initialData?.userId ||
                             initialData?.user_id ||
                             initialData?.telegram?.userId ||
                             '';
      const telegramMessageType = step1Result.messageType ||
                                  step1Result.telegram?.messageType ||
                                  step1Result.rawMessage?.messageType ||
                                  step1Result.message?.type ||
                                  initialData?.rawMessage?.messageType ||
                                  initialData?.messageType ||
                                  initialData?.telegram?.messageType ||
                                  'text';
      const telegramFirstName = step1Result.firstName ||
                                step1Result.telegram?.firstName ||
                                step1Result.rawMessage?.from?.first_name ||
                                step1Result.message?.first_name ||
                                initialData?.rawMessage?.from?.first_name ||
                                initialData?.firstName ||
                                initialData?.telegram?.firstName ||
                                '';
      const telegramLastName = step1Result.lastName ||
                               step1Result.telegram?.lastName ||
                               step1Result.rawMessage?.from?.last_name ||
                               step1Result.message?.last_name ||
                               initialData?.rawMessage?.from?.last_name ||
                               initialData?.lastName ||
                               initialData?.telegram?.lastName ||
                               '';
      const telegramMessageId = step1Result.messageId ||
                                step1Result.telegram?.messageId ||
                                step1Result.message?.id ||
                                step1Result.rawMessage?.message_id ||
                                initialData?.rawMessage?.message_id ||
                                initialData?.messageId ||
                                initialData?.telegram?.messageId ||
                                initialData?.message?.id ||
                                '';

      const telegramReplyToMessage = step1Result.replyToMessage || null;
      const telegramReplyToMessageId = step1Result.replyToMessageId || '';
      let telegramReplyToMessageText = step1Result.replyToMessageText || '';
      if (!telegramReplyToMessageText && telegramReplyToMessage) {
        telegramReplyToMessageText = telegramReplyToMessage.text || telegramReplyToMessage.caption || '';
      }
      const telegramReplyToUserId = step1Result.replyToMessageUserId || '';
      const telegramReplyToUsername = step1Result.replyToMessageUsername || '';
      const telegramReplyToFirstName = step1Result.replyToMessageFirstName || '';
      const telegramReplyToLastName = step1Result.replyToMessageLastName || '';

      // Store using configured output variable names (from settings)
      flowResults.variables['chatId'] = telegramChatId;
      flowResults.variables['username'] = telegramUsername;
      flowResults.variables['messageText'] = telegramMessageText;
      flowResults.variables['messageDate'] = telegramMessageDate;
      flowResults.variables['userId'] = telegramUserId;
      flowResults.variables['messageType'] = telegramMessageType;
      flowResults.variables['firstName'] = telegramFirstName;
      flowResults.variables['lastName'] = telegramLastName;
      flowResults.variables['messageId'] = telegramMessageId;
      // Store reply-to-message variables using configured names
      flowResults.variables['replyToMessage'] = telegramReplyToMessage;
      flowResults.variables['replyToMessageId'] = telegramReplyToMessageId;
      flowResults.variables['replyToMessageText'] = telegramReplyToMessageText;
      flowResults.variables['replyToMessageUserId'] = telegramReplyToUserId;
      flowResults.variables['replyToMessageUsername'] = telegramReplyToUsername;
      flowResults.variables['replyToMessageFirstName'] = telegramReplyToFirstName;
      flowResults.variables['replyToMessageLastName'] = telegramReplyToLastName;

      // Also store with default names for backward compatibility
      flowResults.variables.chatId = telegramChatId;
      flowResults.variables.username = telegramUsername;
      flowResults.variables.messageText = telegramMessageText;
      flowResults.variables.messageDate = telegramMessageDate;
      flowResults.variables.userId = telegramUserId;
      flowResults.variables.messageType = telegramMessageType;
      flowResults.variables.firstName = telegramFirstName;
      flowResults.variables.lastName = telegramLastName;
      flowResults.variables.messageId = telegramMessageId;
      // Reply-to-message backward compatibility
      flowResults.variables.replyToMessage = telegramReplyToMessage;
      flowResults.variables.replyToMessageId = telegramReplyToMessageId;
      flowResults.variables.replyToMessageText = telegramReplyToMessageText;
      flowResults.variables.replyToMessageUserId = telegramReplyToUserId;
      flowResults.variables.replyToMessageUsername = telegramReplyToUsername;
      flowResults.variables.replyToMessageFirstName = telegramReplyToFirstName;
      flowResults.variables.replyToMessageLastName = telegramReplyToLastName;

      // Store in top-level flowResults for direct access (using configured names)
      flowResults['chatId'] = telegramChatId;
      flowResults['username'] = telegramUsername;
      flowResults['messageText'] = telegramMessageText;
      flowResults['messageDate'] = telegramMessageDate;
      flowResults['userId'] = telegramUserId;
      flowResults['messageType'] = telegramMessageType;
      flowResults['firstName'] = telegramFirstName;
      flowResults['lastName'] = telegramLastName;
      flowResults['messageId'] = telegramMessageId;
      // Store reply-to-message in top-level flowResults
      flowResults['replyToMessage'] = telegramReplyToMessage;
      flowResults['replyToMessageId'] = telegramReplyToMessageId;
      flowResults['replyToMessageText'] = telegramReplyToMessageText;
      flowResults['replyToMessageUserId'] = telegramReplyToUserId;
      flowResults['replyToMessageUsername'] = telegramReplyToUsername;
      flowResults['replyToMessageFirstName'] = telegramReplyToFirstName;
      flowResults['replyToMessageLastName'] = telegramReplyToLastName;

      // Also store with default names at top level for backward compatibility
      flowResults.chatId = telegramChatId;
      flowResults.username = telegramUsername;
      flowResults.messageText = telegramMessageText;
      flowResults.messageDate = telegramMessageDate;
      flowResults.userId = telegramUserId;
      flowResults.messageType = telegramMessageType;
      flowResults.firstName = telegramFirstName;
      flowResults.lastName = telegramLastName;
      flowResults.messageId = telegramMessageId;
      // Reply-to-message top-level backward compatibility
      flowResults.replyToMessage = telegramReplyToMessage;
      flowResults.replyToMessageId = telegramReplyToMessageId;
      flowResults.replyToMessageText = telegramReplyToMessageText;
      flowResults.replyToMessageUserId = telegramReplyToUserId;
      flowResults.replyToMessageUsername = telegramReplyToUsername;
      flowResults.replyToMessageFirstName = telegramReplyToFirstName;
      flowResults.replyToMessageLastName = telegramReplyToLastName;
      
      // Store current result for dataFlow.current() access
      flowResults.currentResult = step1Result;
      flowResults.previousResult = flowResults.currentResult;
      
      // Store telegram data globally for template access
      if (typeof window !== 'undefined') {
        window.dataFlow = window.dataFlow || {};
        window.dataFlow.telegram = step1Result.telegram;
        window.dataFlow.message = step1Result.message;

        // Store with node ID for specific access
        window.dataFlow['telegram-inbound-1770014553742'] = step1Result;

        // Store individual variables in window.dataFlow for direct access
        window.dataFlow['messageText'] = telegramMessageText;
        window.dataFlow['userId'] = telegramUserId;
        window.dataFlow['firstName'] = telegramFirstName;
        window.dataFlow['lastName'] = telegramLastName;
        window.dataFlow['chatId'] = telegramChatId;
        window.dataFlow['username'] = telegramUsername;
        window.dataFlow['messageDate'] = telegramMessageDate;
        window.dataFlow['messageId'] = telegramMessageId;
        window.dataFlow['messageType'] = telegramMessageType;
        // Store reply-to-message variables in window.dataFlow
        window.dataFlow['replyToMessage'] = telegramReplyToMessage;
        window.dataFlow['replyToMessageId'] = telegramReplyToMessageId;
        window.dataFlow['replyToMessageText'] = telegramReplyToMessageText;
        window.dataFlow['replyToMessageUserId'] = telegramReplyToUserId;
        window.dataFlow['replyToMessageUsername'] = telegramReplyToUsername;
        window.dataFlow['replyToMessageFirstName'] = telegramReplyToFirstName;
        window.dataFlow['replyToMessageLastName'] = telegramReplyToLastName;

        // Also store with default names for backward compatibility
        window.dataFlow.messageText = telegramMessageText;
        window.dataFlow.userId = telegramUserId;
        window.dataFlow.firstName = telegramFirstName;
        window.dataFlow.lastName = telegramLastName;
        window.dataFlow.chatId = telegramChatId;
        window.dataFlow.username = telegramUsername;
        window.dataFlow.messageDate = telegramMessageDate;
        window.dataFlow.messageId = telegramMessageId;
        window.dataFlow.messageType = telegramMessageType;
        // Reply-to-message backward compatibility
        window.dataFlow.replyToMessage = telegramReplyToMessage;
        window.dataFlow.replyToMessageId = telegramReplyToMessageId;
        window.dataFlow.replyToMessageText = telegramReplyToMessageText;
        window.dataFlow.replyToMessageUserId = telegramReplyToUserId;
        window.dataFlow.replyToMessageUsername = telegramReplyToUsername;
        window.dataFlow.replyToMessageFirstName = telegramReplyToFirstName;
        window.dataFlow.replyToMessageLastName = telegramReplyToLastName;
      }

      // Store in nodeResults for flow integration access
      if (typeof flowResults !== 'undefined') {
        flowResults.nodeResults = flowResults.nodeResults || {};
        flowResults.nodeResults['telegram-inbound-1770014553742'] = {
          nodeId: 'telegram-inbound-1770014553742',
          nodeType: 'telegram-inbound',
          data: step1Result,
          variables: {
            'messageText': telegramMessageText,
            'userId': telegramUserId,
            'firstName': telegramFirstName,
            'lastName': telegramLastName,
            'chatId': telegramChatId,
            'username': telegramUsername,
            'messageDate': telegramMessageDate,
            'messageId': telegramMessageId,
            'messageType': telegramMessageType,
            // Reply-to-message variables
            'replyToMessage': telegramReplyToMessage,
            'replyToMessageId': telegramReplyToMessageId,
            'replyToMessageText': telegramReplyToMessageText,
            'replyToMessageUserId': telegramReplyToUserId,
            'replyToMessageUsername': telegramReplyToUsername,
            'replyToMessageFirstName': telegramReplyToFirstName,
            'replyToMessageLastName': telegramReplyToLastName
          },
          timestamp: new Date().toISOString(),
          success: true
        };
      }
      
    } catch (error) {
      flowErrors.push('Error in telegram-inbound node: ' + getErrorMessage(error));
      
      step1Result = {
        nodeId: 'telegram-inbound-1770014553742',
        nodeType: 'telegram-inbound',
        success: false,
        error: getErrorMessage(error),
        timestamp: new Date().toISOString(),
        telegram: {},
        message: {}
      };
    }
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['telegram-inbound-1770014553742'] = {
      nodeId: 'telegram-inbound-1770014553742',
      nodeType: 'telegram-inbound',
      stepNumber: 1,
      displayName: 'telegramResult_telegram_inbound_1770014553742',
      data: step1Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for telegram-inbound
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['telegramResult_telegram_inbound_1770014553742'] || typeof flowResults['telegramResult_telegram_inbound_1770014553742'] === 'undefined') {
      flowResults['telegramResult_telegram_inbound_1770014553742'] = step1Result;
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
      console.error('❌ Error in step 1 (telegram-inbound):', stepError);
      flowErrors.push(`Step 1 (telegram-inbound): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step1Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'telegram-inbound',
        nodeId: 'telegram-inbound-1770014553742',
        stepNumber: 1
      };
      
      currentResult = step1Result; // Update currentResult even on error
      
      // Store error result in enhanced data flow system
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['telegram-inbound-1770014553742'] = {
      nodeId: 'telegram-inbound-1770014553742',
      nodeType: 'telegram-inbound',
      stepNumber: 1,
      displayName: 'telegramResult_telegram_inbound_1770014553742',
      data: step1Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for telegram-inbound
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['telegramResult_telegram_inbound_1770014553742'] || typeof flowResults['telegramResult_telegram_inbound_1770014553742'] === 'undefined') {
      flowResults['telegramResult_telegram_inbound_1770014553742'] = step1Result;
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
    
    
    // Get all nodes from workflowRegistry (includes nodes from ALL workflows)
    const allNodes = (typeof workflowRegistry !== 'undefined' && workflowRegistry.allNodes) 
      ? workflowRegistry.allNodes 
      : [];
    
    [{"agent_label":"Orientation call Summary","agent_node_id":"openaiAgentSDKNode-1770014701913","agent_description":"OpenAI Agent application","handoff_instructions":"Transfer to Orientation call Summary for specialized assistance"},{"agent_label":"Root cause call summary","agent_node_id":"openaiAgentSDKNode-1770014706694","agent_description":"OpenAI Agent application","handoff_instructions":"Transfer to Root cause call summary for specialized assistance"}].forEach((target: any) => {
      const targetNode = allNodes.find((n: any) => n.id === target.agent_node_id);
      
      if (targetNode) {
        const targetNodeConfig = targetNode.config || targetNode.data || {};
        
        // Sanitize config (remove sensitive fields)
        const sanitizedTargetConfig = {
          ...targetNodeConfig,
          openai_api_key: undefined,
          apiKey: undefined,
          credentialId: undefined,
          useStoredCredential: undefined
        };
        
        // ✅ FIX: Ensure label is always a string
        let agentLabel = sanitizedTargetConfig.label || sanitizedTargetConfig.name || target.agent_label;
        if (typeof agentLabel !== 'string') {
          if (agentLabel && typeof agentLabel === 'object') {
            agentLabel = agentLabel.name || agentLabel.label || String(agentLabel);
          } else {
            agentLabel = String(agentLabel || 'Agent');
          }
        }
        
        targetAgentConfigs[target.agent_node_id] = {
          id: targetNode.id,
          label: agentLabel,
          instructions: sanitizedTargetConfig.instructions || '',
          model: sanitizedTargetConfig.model || 'gpt-4o',
          temperature: sanitizedTargetConfig.temperature || 0.7,
          max_tokens: sanitizedTargetConfig.max_tokens || 1000,
          user_prompt: sanitizedTargetConfig.user_prompt || '',
          agentType: sanitizedTargetConfig.agentType || sanitizedTargetConfig.agentSDKType || 'agent_as_tool',
          selected_tools: sanitizedTargetConfig.selected_tools || [],
          tool_configs: sanitizedTargetConfig.tool_configs || {},
          tool_settings: sanitizedTargetConfig.tool_settings || {},
          mcp_servers: sanitizedTargetConfig.mcp_servers || [],
          // Explicitly ensure sensitive fields are NOT included
          openai_api_key: undefined,
          apiKey: undefined,
          credentialId: undefined,
          useStoredCredential: undefined
        };
      } else {
        console.warn('Target agent node not found in registry:', target.agent_node_id);
        console.warn('Available node IDs:', allNodes.map((n: any) => n.id).slice(0, 10));
      }
    });
    
    if (Object.keys(targetAgentConfigs).length === 0 && 2 > 0) {
      console.warn('No target agent configurations found. Make sure all workflows are loaded and nodes are registered in workflowRegistry.allNodes');
      console.warn('Total nodes in registry:', allNodes.length);
      console.warn('Handoff targets:', ["openaiAgentSDKNode-1770014701913","openaiAgentSDKNode-1770014706694"]);
    }
    
    
    try {
      // 🚫 CHECK: Skip if this node was already executed via handoff (CLIENT-SIDE ONLY)
      if (typeof window !== 'undefined' && window.__executedNodes && window.__executedNodes.has('openaiAgentSDKNode-1770014563018')) {
        console.log('⏭Skipping node (already executed via handoff):', 'openaiAgentSDKNode-1770014563018');
        
        // Get the result from dataFlow if available
        const existingResult = dataFlow.getByNodeId('openaiAgentSDKNode-1770014563018');
        if (existingResult) {
          step2Result = existingResult;
        } else {
          step2Result = 'Node already executed via handoff';
        }
        
        // Remove from executed set for next workflow run (CLIENT-SIDE ONLY)
        if (typeof window !== 'undefined' && window.__executedNodes) {
          window.__executedNodes.delete('openaiAgentSDKNode-1770014563018');
        }
      } else {
      let aiInput = '';
      
      
      // Single input processing (existing logic - UNCHANGED)
      
        // User has provided a custom prompt - use it and evaluate any dataFlow expressions
        let userPrompt = `{{messageText}}`;
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
            const agentId = 'agent-1771079854971';
            const userId = 'user-1771079854971';
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
         user_prompt: `{{messageText}}`,

          model: 'gpt-4.1-2025-04-14',
          instructions: `You are the Orchestrator Agent, responsible for routing messages to specialized sub-agents based on intent.
Your role is not to answer user questions directly — your job is to analyze the message and decide which agent should handle it.

When a message arrives:

If it contains keywords or context related to “orientation call”, “onboarding call”, “introduction session”, or “training session”, route it to the Orientation Call Agent.

If it contains keywords or context related to “root cause”, “issue analysis”, “incident report”, “problem summary”, or “troubleshooting”, route it to the Root Cause Call Agent.

If none of the above intents are found, respond with:

“No specific keywords are matched. Please use appropriate keywords.”`,
          temperature: 0.7,
          max_tokens: 1000,
          apiKey: effectiveApiKey,
          agentType: 'orchestrator',
          selected_tools: [],
          tool_configs: {},
          tool_settings: {"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},
          mcp_servers: [],
          handoff_enabled: true,
          handoff_targets: [{"agent_label":"Orientation call Summary","agent_node_id":"openaiAgentSDKNode-1770014701913","agent_description":"OpenAI Agent application","handoff_instructions":"Transfer to Orientation call Summary for specialized assistance"},{"agent_label":"Root cause call summary","agent_node_id":"openaiAgentSDKNode-1770014706694","agent_description":"OpenAI Agent application","handoff_instructions":"Transfer to Root cause call summary for specialized assistance"}],
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
          const outgoingEdges = workflowEdges.filter((e: any) => e.source === 'openaiAgentSDKNode-1770014563018');
          
          // Find directly connected OpenAI Agent SDK nodes
          const nextAgentNodes = outgoingEdges
            .map((edge: any) => workflowNodes.find((n: any) => n.id === edge.target))
            .filter((n: any) => n && n.type === 'openaiAgentSDKNode');
          
          if (nextAgentNodes.length === 1) {
            const nextAgent = nextAgentNodes[0];
            console.log('Auto-handoff to:', nextAgent.data?.label || nextAgent.id);
            
            // Trigger auto-handoff by setting handoff flag
            result.handoff = true;
            result.execution_mode = 'tool_call';
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
          const agentId = 'agent-1771079854971';
          const userId = 'user-1771079854971';
          const sessionId = 'session-1771079854971';
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
          const outgoingEdges = workflowEdges.filter((e: any) => e.source === 'openaiAgentSDKNode-1770014563018');
          
          // Find directly connected OpenAI Agent SDK nodes
          const nextAgentNodes = outgoingEdges
            .map((edge: any) => workflowNodes.find((n: any) => n.id === edge.target))
            .filter((n: any) => n && n.type === 'openaiAgentSDKNode');
          
          if (nextAgentNodes.length === 1) {
            const nextAgent = nextAgentNodes[0];
            console.log('Auto-handoff to:', nextAgent.data?.label || nextAgent.id);
            
            // Trigger auto-handoff by setting handoff flag
            result.handoff = true;
            result.execution_mode = 'tool_call';
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
      flowResults.nodeResults['openaiAgentSDKNode-1770014563018'] = {
        nodeId: 'openaiAgentSDKNode-1770014563018',
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
      flowErrors.push('OpenAI Agent SDK error in node ' + "openaiAgentSDKNode-1770014563018" + ': ' + (error instanceof Error ? error.message : String(error)));
    }
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['openaiAgentSDKNode-1770014563018'] = {
      nodeId: 'openaiAgentSDKNode-1770014563018',
      nodeType: 'openaiAgentSDKNode',
      stepNumber: 2,
      displayName: 'openaiSDKResult_openaiAgentSDKNode_1770014563018',
      data: step2Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    flowResults.aiResponses['openaiSDKResult_openaiAgentSDKNode_1770014563018'] = step2Result;
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['openaiSDKResult_openaiAgentSDKNode_1770014563018'] || typeof flowResults['openaiSDKResult_openaiAgentSDKNode_1770014563018'] === 'undefined') {
      flowResults['openaiSDKResult_openaiAgentSDKNode_1770014563018'] = step2Result;
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
        nodeId: 'openaiAgentSDKNode-1770014563018',
        stepNumber: 2
      };
      
      currentResult = step2Result; // Update currentResult even on error
      
      // Store error result in enhanced data flow system
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['openaiAgentSDKNode-1770014563018'] = {
      nodeId: 'openaiAgentSDKNode-1770014563018',
      nodeType: 'openaiAgentSDKNode',
      stepNumber: 2,
      displayName: 'openaiSDKResult_openaiAgentSDKNode_1770014563018',
      data: step2Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    flowResults.aiResponses['openaiSDKResult_openaiAgentSDKNode_1770014563018'] = step2Result;
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['openaiSDKResult_openaiAgentSDKNode_1770014563018'] || typeof flowResults['openaiSDKResult_openaiAgentSDKNode_1770014563018'] === 'undefined') {
      flowResults['openaiSDKResult_openaiAgentSDKNode_1770014563018'] = step2Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
    }

    step3Result = currentResult;
    try {
      
    // === TELEGRAM MESSAGE OPERATION ===
    step3Result = currentResult;
    
    // Handle input data (evaluate dataFlow expressions if present)
    let processedInput_telegram_send_message_1770014570163 = currentResult;
    

     // Declare replacePathParameters function at function scope level
        var replacePathParameters: ((endpoint: string, context: any, flowResults: any, dataFlow: any, nodeConfig?: any) => Promise<string>) | undefined = undefined;


    // Enhanced DataFlow Expression Handler - Supports both single and multiple expressions
    if (typeof processedInput_telegram_send_message_1770014570163 === 'string' && processedInput_telegram_send_message_1770014570163.includes('dataFlow.')) {
      try {
        // Check if dataFlow is available
        if (typeof dataFlow !== 'undefined') {
          
          // PRIORITY 1: Handle multiple {{dataFlow.getByNodeId()}} expressions first
          if (processedInput_telegram_send_message_1770014570163.includes('{{dataFlow.getByNodeId(') && processedInput_telegram_send_message_1770014570163.includes('}}')) {
            
            // Handle multiple {{dataFlow.getByNodeId("...").PropertyName}} expressions with property access
const openBrace = '{{';
const closeBrace = '}}';
const functionCall = 'dataFlow.getByNodeId\\(["\']([^"\']+)["\']\\)';
const propertyAccess = '(?:\\.([a-zA-Z_$][a-zA-Z0-9_$]*))?';
const multiDataFlowRegex = new RegExp(openBrace + functionCall + propertyAccess + closeBrace, 'g');

            let processedVariable = processedInput_telegram_send_message_1770014570163;
            let matchCount = 0;
            
            // Replace all {{dataFlow.getByNodeId("...").PropertyName}} expressions
            processedVariable = processedVariable.replace(multiDataFlowRegex, (fullMatch, nodeId, propertyName) => {
              matchCount++;
              
              try {
                const result = dataFlow.getByNodeId(nodeId);
                if (result !== undefined && result !== null) {
                  // CRITICAL FIX: Check if user specified a property name (e.g., .Name, .Email)
                  let extractedValue: any;
                  if (propertyName) {
                    // Try direct property access first (most common for form fields)
                    if (typeof result === 'object' && result[propertyName] !== undefined) {
                      extractedValue = String(result[propertyName]);
                    }
                    // Try in formData
                    else if (result.formData && result.formData[propertyName] !== undefined) {
                      extractedValue = String(result.formData[propertyName]);
                    }
                    // Try in inputData
                    else if (result.inputData && result.inputData[propertyName] !== undefined) {
                      extractedValue = String(result.inputData[propertyName]);
                    }
                    // Try in data
                    else if (result.data && result.data[propertyName] !== undefined) {
                      extractedValue = String(result.data[propertyName]);
                    }
                    // Try case-insensitive property access for form fields
                    else if (typeof result === 'object') {
                      const resultKeys = Object.keys(result);
                      const matchingKey = resultKeys.find(key => key.toLowerCase() === propertyName.toLowerCase());
                      if (matchingKey && result[matchingKey] !== undefined) {
                        extractedValue = String(result[matchingKey]);
                      } else {
                        console.warn(`⚠️ Property '${propertyName}' not found in result object. Available keys:`, resultKeys);
                        extractedValue = '[property not found: ' + propertyName + ']';
                      }
                    } else {
                      console.warn(`⚠️ Cannot access property '${propertyName}' on non-object result`);
                      extractedValue = '[invalid property access]';
                    }
                  } else {
                    // No property specified - use auto-extraction
                    // CRITICAL FIX: Handle primitive values FIRST (strings, numbers, booleans)
                    // This is especially important for loop nodes that return primitive values like email addresses
                    if (typeof result !== 'object' || result === null) {
                      // Result is already a primitive (string/number/boolean) - use it directly
                      extractedValue = result;
                      console.log(`✅ [dataFlow.getByNodeId] Extracted primitive value: ${extractedValue}`);
                    } else {
                      // Result is an object - dynamically analyze structure and extract primitive value
                      console.log(`🔍 [dataFlow.getByNodeId] Result is object, analyzing structure. Keys: ${Object.keys(result)}`);
                      console.log(`🔍 [dataFlow.getByNodeId] Result value: ${result}`);
                      
                      // DYNAMIC ANALYSIS: Analyze the object structure from previous node
                      // Find all primitive properties (string, number, boolean) in the result object
                      const resultKeys = Object.keys(result);
                      const primitiveProperties: Array<{key: string, value: any}> = [];
                      
                      for (const key of resultKeys) {
                        const val = result[key];
                        // Skip functions, objects, arrays, and null/undefined
                        if (val !== null && val !== undefined && 
                            typeof val !== 'object' && typeof val !== 'function' && !Array.isArray(val)) {
                          primitiveProperties.push({ key, value: val });
                        }
                      }
                      
                      console.log(`🔍 [dataFlow.getByNodeId] Found ${primitiveProperties.length} primitive properties: ${primitiveProperties.map(p => `${p.key}: ${p.value}`).join(', ')}`);
                      
                      // STRATEGY 1: If only one primitive property exists, use it (most common case for loop items)
                      if (primitiveProperties.length === 1) {
                        extractedValue = primitiveProperties[0].value;
                        console.log(`✅ [dataFlow.getByNodeId] Single primitive property found, using "${primitiveProperties[0].key}": ${extractedValue}`);
                      }
                      // STRATEGY 2: If multiple primitive properties, prefer identifier-like fields
                      else if (primitiveProperties.length > 1) {
                        // Common identifier field patterns (case-insensitive)
                        const identifierPatterns = ['id', '_id', 'uuid', 'key', 'identifier', 'pk', 'primarykey'];
                        const identifierField = primitiveProperties.find(p => 
                          identifierPatterns.some(pattern => p.key.toLowerCase().includes(pattern.toLowerCase()))
                        );
                        
                        if (identifierField) {
                          extractedValue = identifierField.value;
                          console.log(`✅ [dataFlow.getByNodeId] Multiple primitives found, using identifier field "${identifierField.key}": ${extractedValue}`);
                        } else {
                          // Use the first primitive property
                          extractedValue = primitiveProperties[0].value;
                          console.log(`✅ [dataFlow.getByNodeId] Multiple primitives found, no identifier pattern match, using first "${primitiveProperties[0].key}": ${extractedValue}`);
                        }
                      }
                      // STRATEGY 3: No primitive properties found, try standard extraction methods
                      else {
                        console.log(`⚠️ [dataFlow.getByNodeId] No primitive properties found, trying standard extraction methods`);
                        
                        // CRITICAL FIX: For input nodes, extract the actual value using get() method
                        if (result.get && typeof result.get === 'function') {
                          try {
                            extractedValue = result.get();
                            // If get() returns an object, try to extract primitive value
                            if (typeof extractedValue === 'object' && extractedValue !== null) {
                              extractedValue = extractedValue.currentValue || extractedValue.value || extractedValue.data || '';
                            }
                          } catch (e) {
                            console.warn('⚠️ Error calling result.get():', e);
                          }
                        }
                        // Fallback to standard extraction
                        if (extractedValue === undefined || extractedValue === null) {
                          extractedValue = result.currentValue || result.value || result.data || '';
                        }
                        // CRITICAL FIX: Never use String(result) as it converts to "[object Object]"
                        // If we still don't have a primitive, try to find first primitive property
                        if (typeof extractedValue === 'object' && extractedValue !== null) {
                          const objKeys = Object.keys(extractedValue);
                          const primitiveValue = objKeys.find(key => {
                            const val = extractedValue[key];
                            return typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean';
                          });
                          if (primitiveValue !== undefined) {
                            extractedValue = extractedValue[primitiveValue];
                            console.log(`✅ [dataFlow.getByNodeId] Extracted first primitive property "${primitiveValue}": ${extractedValue}`);
                          } else {
                            console.warn(`⚠️ [dataFlow.getByNodeId] No primitive value found in extractedValue. Available keys: ${objKeys}`);
                            extractedValue = '';
                          }
                        } else if (extractedValue !== undefined && extractedValue !== null) {
                          console.log(`✅ [dataFlow.getByNodeId] Extracted value from standard methods: ${extractedValue}`);
                        } else {
                          console.warn(`⚠️ [dataFlow.getByNodeId] No primitive value found in result. Available keys: ${resultKeys}`);
                          extractedValue = '';
                        }
                      }
                    }
                  }
                  return String(extractedValue || '');
                } else {
                  console.warn(`⚠️ Enhanced Template: DataFlow.getByNodeId returned undefined/null for nodeId: ${nodeId}`);
                  
                  // CRITICAL FIX: For dropdown nodes, try to get value from DOM element directly
                  // This handles cases where the dropdown flow hasn't executed yet
                  try {
                    if (nodeId && nodeId.includes('dropdown')) {
                      if (typeof window !== 'undefined' && typeof document !== 'undefined') {
                        // Try multiple strategies to find the dropdown element
                        let element: HTMLSelectElement | null = null;
                        
                        // Strategy 1: Try by node ID in data attribute
                        element = document.querySelector(`[data-node-id="${nodeId}"]`) as HTMLSelectElement;
                        
                        // Strategy 2: Try by component ID (common pattern)
                        if (!element) {
                          // Try common component ID patterns
                          const possibleIds = ['Not set', nodeId.replace('dropdown-', '')];
                          for (const id of possibleIds) {
                            element = document.querySelector(`[data-component-id="${id}"]`) as HTMLSelectElement;
                            if (element) break;
                            element = document.getElementById(id) as HTMLSelectElement;
                            if (element) break;
                          }
                        }
                        
                        // Strategy 3: Try to find any select element (last resort)
                        if (!element) {
                          const allSelects = document.querySelectorAll('select');
                          // Try to match by checking if any select has options that match expected patterns
                          for (let i = 0; i < allSelects.length; i++) {
                            const select = allSelects[i] as HTMLSelectElement;
                            if (select.value && select.value !== '' && select.value !== 'Select Image URL') {
                              element = select;
                              break;
                            }
                          }
                        }
                        
                        if (element && element.value && element.value !== '' && element.value !== 'Select Image URL') {
                          console.log(`✅ [Template Processing] Retrieved dropdown value from DOM for ${nodeId}: ${element.value}`);
                          return String(element.value);
                        }
                      }
                    }
                  } catch (domError) {
                    console.warn(`⚠️ Enhanced Template: Error retrieving dropdown value from DOM for ${nodeId}:`, domError);
                  }


                  // FALLBACK: Try to use batchResult/currentItem if we're in a loop context
                  try {
                    // Check if we're in a loop context (batchResult should be available)
                    if (typeof batchResult !== 'undefined' && batchResult !== null) {
                      let fallbackValue;
                      
                      if (propertyName) {
                        // Try to get the property from batchResult
                        if (typeof batchResult === 'object' && batchResult[propertyName] !== undefined) {
                          fallbackValue = batchResult[propertyName];
                        } else if (batchResult.currentItem && typeof batchResult.currentItem === 'object' && batchResult.currentItem[propertyName] !== undefined) {
                          fallbackValue = batchResult.currentItem[propertyName];
                        }
                      } else {
                        // No property specified - try to extract a primitive value from batchResult
                        if (typeof batchResult === 'object') {
                          // Try common properties first
                          fallbackValue = batchResult.Email || batchResult.email || batchResult.value || batchResult.data || batchResult.id || batchResult.name;
                          
                          // If still no value, try to find first primitive property
                          if (!fallbackValue) {
                            const keys = Object.keys(batchResult);
                            for (const key of keys) {
                              const val = batchResult[key];
                              if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
                                fallbackValue = val;
                                break;
                              }
                            }
                          }
                        }
                      }
                      
                      if (fallbackValue !== undefined && fallbackValue !== null) {
                        return String(fallbackValue);
                      }
                    }
                  } catch (fallbackError) {
                    console.warn('⚠️ Enhanced Template: Error in batchResult fallback:', fallbackError);
                  }
                  
                  return '[data not available]';
                }
              } catch (error) {
                console.error(`❌ Enhanced Template: Error processing dataFlow expression for nodeId ${nodeId}:`, error);
                return '[dataFlow error]';
              }
            });
            
            if (matchCount > 0) {
              processedInput_telegram_send_message_1770014570163 = processedVariable;
            }
          }
          
          // PRIORITY 2: Handle legacy single dataFlow.getByNodeId() without braces (backwards compatibility)
          else if (processedInput_telegram_send_message_1770014570163.includes('dataFlow.getByNodeId(') && !processedInput_telegram_send_message_1770014570163.includes('{{') && !processedInput_telegram_send_message_1770014570163.includes('}}')) {
            // Extract node ID and property access from pattern: dataFlow.getByNodeId('nodeId').PropertyName
            const legacyNodeIdMatch = processedInput_telegram_send_message_1770014570163.match(/dataFlow\.getByNodeId\(['"]([^'"]+)['"]\)(?:\.([a-zA-Z_$][a-zA-Z0-9_$]*))?/);
            if (legacyNodeIdMatch) {
              const nodeId = legacyNodeIdMatch[1];
              const propertyName = legacyNodeIdMatch[2]; // Capture property name after function call (e.g., .Name)
              
              const result = dataFlow.getByNodeId(nodeId);
              if (result !== undefined && result !== null) {
                // CRITICAL FIX: Check if user specified a property name (e.g., .Name, .Email)
                if (propertyName) {
                  // Try direct property access first (most common for form fields)
                  if (typeof result === 'object' && result[propertyName] !== undefined) {
                    processedInput_telegram_send_message_1770014570163 = String(result[propertyName]);
                  }
                  // Try in formData
                  else if (result.formData && result.formData[propertyName] !== undefined) {
                    processedInput_telegram_send_message_1770014570163 = String(result.formData[propertyName]);
                  }
                  // Try in inputData
                  else if (result.inputData && result.inputData[propertyName] !== undefined) {
                    processedInput_telegram_send_message_1770014570163 = String(result.inputData[propertyName]);
                  }
                  // Try in data
                  else if (result.data && result.data[propertyName] !== undefined) {
                    processedInput_telegram_send_message_1770014570163 = String(result.data[propertyName]);
                  }
                  // Try case-insensitive property access for form fields
                  else if (typeof result === 'object') {
                    const resultKeys = Object.keys(result);
                    const matchingKey = resultKeys.find(key => key.toLowerCase() === propertyName.toLowerCase());
                    if (matchingKey && result[matchingKey] !== undefined) {
                      processedInput_telegram_send_message_1770014570163 = String(result[matchingKey]);
                    } else {
                      console.warn(`⚠️ Legacy: Property '${propertyName}' not found in result object. Available keys:`, resultKeys);
                      processedInput_telegram_send_message_1770014570163 = '[property not found: ' + propertyName + ']';
                    }
                  } else {
                    console.warn(`⚠️ Legacy: Cannot access property '${propertyName}' on non-object result`);
                    processedInput_telegram_send_message_1770014570163 = '[invalid property access]';
                  }
                } else {
                  // No property specified - use auto-extraction
                  if (typeof result === 'object') {
                    processedInput_telegram_send_message_1770014570163 = result.currentValue || result.value || result.data || String(result);
                  } else {
                    processedInput_telegram_send_message_1770014570163 = String(result);
                  }
                }
              } else {
                console.warn('⚠️ Enhanced Template: Legacy DataFlow.getByNodeId returned undefined/null for nodeId:', nodeId);
                
                // FALLBACK: Try to use batchResult/currentItem if we're in a loop context
                try {
                  if (typeof batchResult !== 'undefined' && batchResult !== null) {
                    let fallbackValue;
                    
                    if (propertyName) {
                      if (typeof batchResult === 'object' && batchResult[propertyName] !== undefined) {
                        fallbackValue = batchResult[propertyName];
                      } else if (batchResult.currentItem && typeof batchResult.currentItem === 'object' && batchResult.currentItem[propertyName] !== undefined) {
                        fallbackValue = batchResult.currentItem[propertyName];
                      }
                    } else {
                      if (typeof batchResult === 'object') {
                        fallbackValue = batchResult.Email || batchResult.email || batchResult.value || batchResult.data || batchResult.id || batchResult.name;
                        if (!fallbackValue) {
                          const keys = Object.keys(batchResult);
                          for (const key of keys) {
                            const val = batchResult[key];
                            if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
                              fallbackValue = val;
                              break;
                            }
                          }
                        }
                      }
                    }
                    
                    if (fallbackValue !== undefined && fallbackValue !== null) {
                      processedInput_telegram_send_message_1770014570163 = String(fallbackValue);
                    } else {
                      processedInput_telegram_send_message_1770014570163 = '[data not available]';
                    }
                  } else {
                    processedInput_telegram_send_message_1770014570163 = '[data not available]';
                  }
                } catch (fallbackError) {
                  console.warn('⚠️ Enhanced Template: Error in batchResult fallback:', fallbackError);
                  processedInput_telegram_send_message_1770014570163 = '[data not available]';
                }
              }
            }
          } else if (processedInput_telegram_send_message_1770014570163.includes('dataFlow.current()')) {
            const result = dataFlow.current();
            if (result !== undefined && result !== null) {
              if (typeof result === 'object') {
                processedInput_telegram_send_message_1770014570163 = result.currentValue || result.value || result.data || String(result);
              } else {
                processedInput_telegram_send_message_1770014570163 = String(result);
              }
            } else {
              processedInput_telegram_send_message_1770014570163 = '[current data not available]';
            }
          } else if (processedInput_telegram_send_message_1770014570163.includes('dataFlow.previous()')) {
            const result = dataFlow.previous();
            if (result !== undefined && result !== null) {
              if (typeof result === 'object') {
                processedInput_telegram_send_message_1770014570163 = result.currentValue || result.value || result.data || String(result);
              } else {
                processedInput_telegram_send_message_1770014570163 = String(result);
              }
            } else {
              processedInput_telegram_send_message_1770014570163 = '[previous data not available]';
            }
          } else if (processedInput_telegram_send_message_1770014570163.includes('dataFlow.get(')) {
            // Extract variable name from pattern: dataFlow.get('varName')
            const varNameMatch = processedInput_telegram_send_message_1770014570163.match(/dataFlow\.get\(['"]([^'"]+)['"]\)/);
            if (varNameMatch) {
              const varName = varNameMatch[1];
              const result = dataFlow.get(varName);
              if (result !== undefined && result !== null) {
                if (typeof result === 'object') {
                  processedInput_telegram_send_message_1770014570163 = result.currentValue || result.value || result.data || String(result);
                } else {
                  processedInput_telegram_send_message_1770014570163 = String(result);
                }
              } else {
                processedInput_telegram_send_message_1770014570163 = '[variable not available]';
              }
            }
          }
        } else {
          console.warn('⚠️ dataFlow not available in scope');
          processedInput_telegram_send_message_1770014570163 = '[dataFlow not available]';
        }
      } catch (error) {
        console.error('❌ Error evaluating dataFlow expression:', error);
        processedInput_telegram_send_message_1770014570163 = '[dataFlow evaluation error]';
      }
    }
    
    let hasMediaAttachment = false;
   // Declare mediaType and mediaUrl outside try block so they're accessible in catch
      let mediaType = "none";
      let mediaUrl = "";
      let mediaCaption = "";
      const sendMedia = false;

    try {
      // Enhanced template processing helper function with nested property support
      const processTemplate = (template: string): any => {
        if (!template || typeof template !== 'string') return template;
        try {
          // TemplateExpressionEngine is already imported at the top of the generated workflow file
          
          // Build comprehensive template context
          const templateContext: Record<string, any> = {};
          
          // Add flowResults if available
          if (typeof flowResults !== 'undefined') {
            Object.assign(templateContext, flowResults);
            // Also add nested access to flowResults properties
            if (flowResults.variables) {
              Object.assign(templateContext, flowResults.variables);
            }
            if (flowResults.apiResponses) {
              Object.assign(templateContext, flowResults.apiResponses);
            }
          }
          
          // Add dataFlow if available
          if (typeof dataFlow !== 'undefined') {
            templateContext.dataFlow = dataFlow;
          }
          
          // Add inputData if available
          if (typeof processedInput_telegram_send_message_1770014570163 !== 'undefined' && processedInput_telegram_send_message_1770014570163 !== null) {
            templateContext.inputData = processedInput_telegram_send_message_1770014570163;
            templateContext.input = processedInput_telegram_send_message_1770014570163;
            // If inputData is an object, spread its properties
            if (typeof processedInput_telegram_send_message_1770014570163 === 'object' && !Array.isArray(processedInput_telegram_send_message_1770014570163)) {
              Object.assign(templateContext, processedInput_telegram_send_message_1770014570163);
            }
          }
          
          // Process template with support for nested properties (e.g., {{output.value.value2}})
          // First, try processTemplate for simple variables
          let processed = TemplateExpressionEngine.processTemplate(template, templateContext, {
            allowFunctions: true
          });
          
          // If template still contains {{}}, try evaluate for nested property access
          if (processed.includes('{{') && processed.includes('}}')) {
            // Extract and evaluate each template expression
            processed = processed.replace(/\{\{([^}]+)\}\}/g, (match, expr) => {
              const trimmedExpr = expr.trim();
              
              // Skip if already processed
              if (!trimmedExpr) return match;
              
              try {
                // Use evaluate for nested property access (e.g., output.value.value2)
                const result = TemplateExpressionEngine.evaluate(trimmedExpr, templateContext, {
                  allowFunctions: true,
                  allowComplexExpressions: true,
                  returnType: 'auto'
                });
                
                if (result !== undefined && result !== null) {
                  // Convert to string, handling objects/arrays
                  if (typeof result === 'object') {
                    return JSON.stringify(result);
                  }
                  return String(result);
                }
                
                return match; // Return original if evaluation fails
              } catch (evalErr) {
                return match; // Return original on error
              }
            });
          }
          
          return processed;
        } catch (err) {
          return template;
        }
      };
      
      // Get chatId from node config first (will be processed for templates later, then fallback to env if needed)
      let chatId = "{{chatId}}";
      
    let telegramMessage: string = "{{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770014563018\")}}";
    const configMessageFallback = "{{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770014563018\")}}";
      const initialMediaType = "none";
      const initialMediaUrl = "";
      const initialMediaCaption = "";
       mediaType = initialMediaType;
       mediaUrl = initialMediaUrl;
       mediaCaption = initialMediaCaption;
      
      // === ENHANCED DATAFLOW TEMPLATE PROCESSING (same as Slack) ===
      // Process dataFlow.getByNodeId() templates with property access support
      
      const processDataFlowTemplates = (text: string): string => {
        // Pattern 1: dataFlow.getByNodeId('nodeId') with optional property access
        // ENHANCED: Support property names with spaces, special chars (e.g., .Data Msg, .User-Name, .field_1)
        const nodeIdPattern = /\{\{\s*dataFlow\.getByNodeId\(['"]([^'"]+)['"]\)(?:\.([^}]+?))?\s*\}\}/g;
        
        text = text.replace(nodeIdPattern, (match, nodeId, propertyPath) => {
          try {
            // Check if dataFlow is available
            if (typeof dataFlow !== 'undefined' && dataFlow.getByNodeId) {
              const nodeResult = dataFlow.getByNodeId(nodeId);
              
              if (nodeResult !== undefined && nodeResult !== null) {
                // Extract the actual value from the result - ENHANCED for mixed node types
                let extractedValue = nodeResult;
                
                // CRITICAL: Only extract nested values if NO property access is specified
                // This prevents interference when mixing input nodes (no property) with form nodes (with property)
                if (!propertyPath && typeof nodeResult === 'object') {
                  // For input nodes or nodes without property access, try to extract the main value
                  extractedValue = nodeResult.currentValue || 
                                   nodeResult.value || 
                                   nodeResult.data || 
                                   nodeResult.get?.() ||  // For input nodes with get() method
                                   String(nodeResult);
                } else if (propertyPath) {
                  // For form nodes with property access, keep the original object structure
                  // ENHANCED: Validate that this looks like proper form data structure collected from DOM
                  const hasFormFields = nodeResult && typeof nodeResult === 'object' && Object.keys(nodeResult).length > 0;
                  
                  // Check for common form field patterns (fully dynamic detection)
                  const formFieldPatterns = [
                    /^[A-Z][a-z]+$/, // PascalCase fields like Email, Name, Subject, Msge
                    /^[a-z][a-zA-Z0-9]*$/, // camelCase fields like email, firstName, msg123
                    /^[a-z_]+$/, // snake_case fields like user_email, first_name
                    /^[A-Z_]+$/, // SCREAMING_SNAKE_CASE like USER_EMAIL
                    /^[a-z][a-z0-9-]*$/, // kebab-case like user-email, first-name
                    /^[A-Z][a-zA-Z0-9]*$/, // Any field starting with uppercase letter
                    /^[a-z].*/, // Any field starting with lowercase letter
                    /^[A-Z].*/ // Any field starting with uppercase letter
                  ];
                  
                  const detectedFormFields = hasFormFields ? 
                    Object.keys(nodeResult).filter(key => 
                      // Exclude metadata and system fields
                      !key.startsWith('_') && 
                      !key.startsWith('$') &&
                      !['formId', 'inputData', 'buttonId', 'trigger', 'timestamp', 'nodeId', 'nodeType'].includes(key) &&
                      // Accept any field that matches common naming patterns
                      formFieldPatterns.some(pattern => pattern.test(key))
                    ) : [];
                  
                  // Form field validation completed
                }
                
                // Handle property access if specified (e.g., .Msge, .Name, .Email, .Data Msg)
                if (propertyPath) {
                  // Property path is already captured without the leading dot by the regex
                  const propertyName = propertyPath.trim(); // Trim any whitespace
                  
                  // ENHANCED: Try multiple strategies for property access based on node type and data structure
                  let propertyValue = null;
                  
                  // Strategy 0: For form nodes, check top-level properties first (most common case)
                  if (nodeResult && typeof nodeResult === 'object' && nodeResult[propertyName] !== undefined) {
                    propertyValue = nodeResult[propertyName];
                  }
                  
                  // Strategy 0b: CRITICAL FIX - Check if this is actually a form node containing input data
                  else if (nodeResult && nodeResult.formId && nodeResult.inputData && !nodeResult[propertyName]) {
                    
                    // Try to get the value from global flowResults since form data is processed there
                    if (typeof flowResults !== 'undefined' && flowResults[propertyName] !== undefined) {
                      propertyValue = flowResults[propertyName];
                     
                    }
                    // Try case variations in flowResults
                    else if (typeof flowResults !== 'undefined') {
                      const flowKeys = Object.keys(flowResults);
                      const matchingFlowKey = flowKeys.find(key => key.toLowerCase() === propertyName.toLowerCase());
                      if (matchingFlowKey && flowResults[matchingFlowKey] !== undefined) {
                        propertyValue = flowResults[matchingFlowKey];
                        
                      }
                    }
                  }
                  
                  // Strategy 1: Direct property access on the extracted value
                  else if (extractedValue && typeof extractedValue === 'object' && extractedValue[propertyName] !== undefined) {
                    propertyValue = extractedValue[propertyName];
                   
                  }
                  
                  // Strategy 2a: Extract from _metadata.formConfig for form structure analysis
                  else if (nodeResult && nodeResult._metadata && nodeResult._metadata.formConfig) {
                
                    const formConfig = nodeResult._metadata.formConfig;
                    
                    // Check if this field exists in the form inputs configuration
                    if (formConfig.inputs && Array.isArray(formConfig.inputs)) {
                      const fieldConfig = formConfig.inputs.find((input: Record<string, any>) => 
                        input.name === propertyName || 
                        input.name?.toLowerCase() === propertyName.toLowerCase()
                      );
                      
                      if (fieldConfig) {
                       
                        
                        // This field exists in the form, but we need to get its value from flowResults
                        if (typeof flowResults !== 'undefined') {
                          // Try multiple variations to find the actual value
                          const possibleKeys = [
                            propertyName,
                            propertyName.toLowerCase(),
                            propertyName.toUpperCase(),
                            fieldConfig.name,
                            fieldConfig.id
                          ];
                          
                          for (const key of possibleKeys) {
                            if (flowResults[key] !== undefined) {
                              propertyValue = flowResults[key];
                            
                              break;
                            }
                          }
                        }
                        
                        // If still not found, set empty default since field exists in form
                        if (propertyValue === null) {
                          propertyValue = '';

                        }
                      }
                    }
                  }
                  
                  // Strategy 2b: Handle default empty values that backend provides
                  else if (nodeResult && typeof nodeResult === 'object' && nodeResult[propertyName] === '') {
                    propertyValue = ''; // Backend provided empty default value

                  }
                  
                  // Strategy 3: Check if nodeResult has a data property with the field
                  else if (nodeResult && nodeResult.data && typeof nodeResult.data === 'object' && nodeResult.data[propertyName] !== undefined) {
                    propertyValue = nodeResult.data[propertyName];

                  }
                  
                  // Strategy 4: Check if extractedValue has a data property with the field
                  else if (extractedValue && extractedValue.data && typeof extractedValue.data === 'object' && extractedValue.data[propertyName] !== undefined) {
                    propertyValue = extractedValue.data[propertyName];
              
                  }
                  
                  // Strategy 5: Enhanced field matching for DOM-collected form data
                  // This handles various naming conventions your DOM collection might produce
                  else if (nodeResult && typeof nodeResult === 'object') {
                    const nodeKeys = Object.keys(nodeResult);
                    let matchingKey = null;
                    
                    // Try exact match first (including spaces)
                    if (nodeResult[propertyName] !== undefined) {
                      matchingKey = propertyName;
                   
                    }
                    
                    // Try exact case-insensitive match
                    if (!matchingKey) {
                      matchingKey = nodeKeys.find(key => key.toLowerCase() === propertyName.toLowerCase());
                    }
                    
                    // Try common field mapping variations
                    if (!matchingKey) {
                      const searchPatterns = [
                        propertyName.toLowerCase(), // email
                        propertyName.toUpperCase(), // EMAIL
                        propertyName.charAt(0).toUpperCase() + propertyName.slice(1).toLowerCase(), // Email
                        propertyName.replace(/([A-Z])/g, '_$1').toLowerCase(), // Email -> email, CamelCase -> camel_case
                        propertyName.replace(/([A-Z])/g, '-$1').toLowerCase(), // Email -> email, CamelCase -> camel-case
                        `user_${propertyName.toLowerCase()}`, // user_email
                        `form_${propertyName.toLowerCase()}`, // form_email
                        `${propertyName.toLowerCase()}_field`, // email_field
                        `input_${propertyName.toLowerCase()}` // input_email
                      ];
                      
                      for (const pattern of searchPatterns) {
                        matchingKey = nodeKeys.find(key => key.toLowerCase() === pattern);
                        if (matchingKey) {
                       
                          break;
                        }
                      }
                    }
                    
                    // Try partial matching for fields that contain the property name
                    if (!matchingKey) {
                      matchingKey = nodeKeys.find(key => 
                        key.toLowerCase().includes(propertyName.toLowerCase()) ||
                        propertyName.toLowerCase().includes(key.toLowerCase())
                      );
                     
                    }
                    
                    if (matchingKey && nodeResult[matchingKey] !== undefined) {
                      propertyValue = nodeResult[matchingKey];
           
                    }
                  }
                  
                  // Strategy 6: For nested data structures, try deeper object traversal
                  else if (nodeResult && typeof nodeResult === 'object') {
                    const deepSearch = (obj: any, prop: string, path: string = ''): any => {
                      if (!obj || typeof obj !== 'object') return null;
                      
                      // Direct property check
                      if (obj[prop] !== undefined) {

                        return obj[prop];
                      }
                      
                      // Check common form data containers
                      const containers = ['formData', 'inputData', 'data', 'fields', 'values'];
                      for (const container of containers) {
                        if (obj[container] && typeof obj[container] === 'object' && obj[container][prop] !== undefined) {
                       
                          return obj[container][prop];
                        }
                      }
                      
                      return null;
                    };
                    
                    propertyValue = deepSearch(nodeResult, propertyName, 'nodeResult');
                  }
                  
                  // Apply the found property value or set error message
                  if (propertyValue !== null && propertyValue !== undefined) {
                    extractedValue = String(propertyValue);

                  } else {
                  
                    extractedValue = '[property not found]';
                  }
                }
                
                const finalValue = String(extractedValue || '');

                return finalValue;
              } else {
              
                return '[data not available]';
              }
            } else {
           
              return '[dataFlow not available]';
            }
          } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            return `[error: ${errorMessage}]`;
          }
        });
        
    
        return text;
      };

      const flattenContextValue = (value: any): any => {
        if (Array.isArray(value)) {
          if (value.length === 1) {
            return flattenContextValue(value[0]);
          }
          return value.map(item => flattenContextValue(item));
        }
        return value;
      };

      const attachContextValue = (contextTarget: Record<string, any>, key: string, rawValue: any) => {
        if (!contextTarget || !key) return;
        const normalizedKey = String(key).trim();
        if (!normalizedKey) return;
        const flattened = flattenContextValue(rawValue);
        if (flattened !== undefined) {
          contextTarget[normalizedKey] = flattened;
        }
        if (Array.isArray(rawValue)) {
          const rawKey = normalizedKey + 'Raw';
          if (contextTarget[rawKey] === undefined) {
            contextTarget[rawKey] = rawValue;
          }
          if (rawValue.length > 0) {
            const firstKey = normalizedKey + 'First';
            if (contextTarget[firstKey] === undefined) {
              contextTarget[firstKey] = flattenContextValue(rawValue[0]);
            }
          }
        }
        const safeKey = normalizedKey.replace(/\s+/g, '_');
        if (safeKey && safeKey !== normalizedKey && contextTarget[safeKey] === undefined) {
          contextTarget[safeKey] = flattened;
        }
      };

      const getTemplateContext = () => {
        const baseContext = {
          ...flowResults,
          dataFlow,
          currentResult: processedInput_telegram_send_message_1770014570163,
          previousResult: flowResults.previousResult,
          inputData: processedInput_telegram_send_message_1770014570163?.inputData || {},
          formResult: processedInput_telegram_send_message_1770014570163?.formResult || {},
          apiResult: processedInput_telegram_send_message_1770014570163?.apiResult || {}
        };

        const match = mediaUrl.match(/\{\{(\w+)\./);
        const resultName = match ? match[1] : null;



        // Enhanced: Extract data from previousResult for template access
        if (flowResults?.previousResult) {
          const prevResult = flowResults.previousResult;
          const prevData = (prevResult as any)?.resultValue ?? (prevResult as any)?.data ?? (prevResult as any)?.apiResult ?? prevResult;
          if (prevData && typeof prevData === 'object') {
            // Make previousResult data directly accessible
            if ((prevResult as any)?.displayName) {
              attachContextValue(baseContext, (prevResult as any).displayName, prevData);
            }
            // Also try common names like resultName, postResult, etc.
            const commonNames = ['resultName', 'postResult', 'apiResult', 'result'];
            for (const name of commonNames) {
              if (!(baseContext as any)[name]) {
                attachContextValue(baseContext, name, prevData);
              }
            }
          }
        }

        if (flowResults?.variables && typeof flowResults.variables === 'object') {
          for (const [varName, varValue] of Object.entries(flowResults.variables)) {
            attachContextValue(baseContext, varName, varValue);
          }
        }

        if (flowResults?.nodeResults && typeof flowResults.nodeResults === 'object') {
          for (const [nodeKey, nodeValue] of Object.entries(flowResults.nodeResults)) {
            const dataValue = (nodeValue as any)?.resultValue ?? (nodeValue as any)?.data ?? (nodeValue as any)?.apiResult ?? nodeValue;
            attachContextValue(baseContext, nodeKey, dataValue);
            const displayName = (nodeValue as any)?.displayName;
            if (displayName) {
              attachContextValue(baseContext, displayName, dataValue);
            }
            // Enhanced: Check if this node result has image_url and make it accessible as resultName
             
            
            if (dataValue && typeof dataValue === 'object') {
              // Check for image_url at any level
              const hasImageUrl = (obj: any): boolean => {
                if (!obj || typeof obj !== 'object') return false;
                if ('image_url' in obj) return true;
                // Check nested objects
                for (const key in obj) {
                  if (obj.hasOwnProperty(key) && typeof obj[key] === 'object' && hasImageUrl(obj[key])) {
                    return true;
                  }
                }
                return false;
              };
              if (hasImageUrl(dataValue) && !(baseContext as any).resultName) {
                attachContextValue(baseContext, 'resultName', dataValue);
              }
            }
          }
        }

        // Enhanced: Also check apiResult for nested data
        if (processedInput_telegram_send_message_1770014570163?.apiResult) {
          const apiRes = processedInput_telegram_send_message_1770014570163.apiResult;
          if (apiRes && typeof apiRes === 'object') {
            // If apiResult has image_url, make it accessible as resultName
            if ((apiRes as any).image_url && !(baseContext as any).resultName) {
              attachContextValue(baseContext, 'resultName', apiRes);
            }
          }
        }

        // Enhanced: Check dataFlow for previous node results (db-api-get node)
        if (dataFlow && typeof dataFlow.getByNodeId === 'function') {
          try {
            // Try to find any db-api-get node result that might have image_url
            // This is dynamic - we check all nodes in the workflow
            const allNodeIds = Object.keys(flowResults?.nodeResults || {});
            for (const nodeId of allNodeIds) {
              try {
                const nodeResult = dataFlow.getByNodeId(nodeId);
                if (nodeResult && typeof nodeResult === 'object') {
                  const nodeData = (nodeResult as any)?.data ?? (nodeResult as any)?.resultValue ?? nodeResult;
                  if (nodeData && typeof nodeData === 'object' && (nodeData as any).image_url && !(baseContext as any).resultName) {
                    attachContextValue(baseContext, 'resultName', nodeData);
                    break;
                  }
                }
              } catch (dataFlowError) {
                // Silently continue if node access fails
              }
            }
          } catch (dataFlowError) {
            // Silently fail if dataFlow access fails
          }
        }

        return baseContext;
      };

      const getValueFromPath = (obj: any, path: string) => {
        if (obj === undefined || obj === null || !path) return undefined;
        const trimmed = path.trim();
        if (!trimmed) return undefined;
        const normalized = trimmed
          .replace(/[(d+)]/g, '.$1')
          .replace(/^./, '');
        const parts = normalized.split('.').filter(Boolean);
        let current: any = obj;
        for (const part of parts) {
          if (current === undefined || current === null) return undefined;
          if (Array.isArray(current)) {
            const index = Number(part);
            if (!Number.isNaN(index)) {
              current = current[index];
              continue;
            }
            const matchWithProp = current.find(
              item => item && typeof item === 'object' && Object.prototype.hasOwnProperty.call(item, part)
            );
            if (matchWithProp) {
              current = matchWithProp[part];
              continue;
            }
            current = current[0];
            if (current === undefined || current === null) return undefined;
          }
          if (typeof current === 'object' && Object.prototype.hasOwnProperty.call(current, part)) {
            current = current[part];
          } else {
            return undefined;
          }
        }
        return current;
      };

      const manualTemplateFallback = (value: string, templateContext: Record<string, any>) => {
        if (!value || typeof value !== 'string') return value;
        const singleMatch = value.trim().match(/^{{s*([^}]+)s*}}$/);
        if (!singleMatch) return value;
        const path = singleMatch[1];
        const resolved = getValueFromPath(templateContext, path);
        if (resolved === undefined || resolved === null) return value;
        return String(flattenContextValue(resolved));
      };

      const resolveGeneralTemplate = (rawValue: string) => {
        if (!rawValue || typeof rawValue !== 'string') return rawValue;
        let resolved = processDataFlowTemplates(rawValue);
        const templateContext = getTemplateContext();
        
        // Enhanced: Try multiple resolution strategies for nested property access
        if (resolved && resolved.includes('{{') && resolved.includes('}}')) {
          try {
            // Strategy 1: Use TemplateExpressionEngine with full context
            const processed = TemplateExpressionEngine.processTemplate(resolved, templateContext, {
              allowFunctions: true
            });
            if (processed !== undefined && processed !== null && processed !== resolved) {
              resolved = String(processed);
            }
          } catch (generalTemplateError) {
            // Template processing error - continue with original value
          }
        }
        
        // Strategy 2: Manual fallback for nested properties like resultName.image_url
        if (resolved && resolved.includes('{{') && resolved.includes('}}')) {
          const fallbackValue = manualTemplateFallback(resolved, templateContext);
          if (fallbackValue !== resolved) {
            resolved = fallbackValue;
          } else {
            // Enhanced: Try direct property access for patterns like {{resultName.image_url}}
            const nestedMatch = resolved.match(/^{{([^}]+)}}$/);
            if (nestedMatch) {
              const path = nestedMatch[1].trim();
              if (path.includes('.')) {
                const pathValue = getValueFromPath(templateContext, path);
                if (pathValue !== undefined && pathValue !== null) {
                  resolved = String(flattenContextValue(pathValue));
                }
              }
            }
          }
        }
        
        // Strategy 3: Try replacing remaining template variables with empty string if unresolved
        // This prevents sending literal template strings to the API
        if (resolved && resolved.includes('{{') && resolved.includes('}}')) {
          // Unresolved template variables remain in the string
        }
        
        return resolved;
      };
      
      // Apply enhanced dataFlow template processing to Telegram message
      telegramMessage = processDataFlowTemplates(telegramMessage);

      // If inputs used an unresolved template, fall back to messageText/message config
      if (telegramMessage && telegramMessage.includes('{{') && configMessageFallback) {
        telegramMessage = configMessageFallback;
      }
      
      // Process remaining template expressions with Universal Template Engine
      if (telegramMessage.includes('{{') && telegramMessage.includes('}}')) {
        const templateContext = getTemplateContext();
        // Template context prepared
        
        try {
          // Extract expression from template brackets
        telegramMessage = telegramMessage.replace(/{{(.+?)}}/g, (match, expr) => {
  try {
    const result = TemplateExpressionEngine.evaluate(expr.trim(), templateContext, {
      allowFunctions: true
    });
    return (result !== undefined && result !== null) ? result : '';
  } catch (err) {
  
    return '';
  }
});
          
        } catch (templateError) {
          // Template processing error - keeping original message
        }
      }
      
      // 🔧 FIX: Process chatId for template variables (e.g., {{output.chatId}}, {{dataFlow.getByNodeId("node-id").chatId}})
      // Priority: 1) Node input/config (with template processing if template syntax present), 2) Environment variable (.env)
      // Only extract from template context if user explicitly provided a template variable
      const originalChatId = chatId;
      const hasTemplateSyntax = chatId && typeof chatId === 'string' && (chatId.includes('{{') || chatId.includes('dataFlow'));
      const hadOriginalInput = originalChatId && originalChatId.trim().length > 0;
      
      // Step 1: Process template syntax if user provided chatId with template syntax (e.g., {{output.chatId}}, {{telegram.chatId}})
      if (hasTemplateSyntax) {
        chatId = processDataFlowTemplates(chatId);
        if (chatId.includes('{{') && chatId.includes('}}')) {
          const templateContext = getTemplateContext();
          try {
            chatId = chatId.replace(/{{(.+?)}}/g, (match, expr) => {
              try {
                const result = TemplateExpressionEngine.evaluate(expr.trim(), templateContext, {
                  allowFunctions: true
                });
                const resolved = (result !== undefined && result !== null) ? String(result) : '';
                return resolved;
              } catch (err) {
                return '';
              }
            });
          } catch (templateError) {
            // Template processing error - continue with current value
          }
        }
        
        // Step 2: If template processing resulted in empty or unresolved templates, try to extract from template context
        // This only happens if user explicitly provided a template variable
        if ((!chatId || chatId.trim() === '' || chatId.includes('{{')) && hadOriginalInput) {
          const templateContext = getTemplateContext();
          
          // Try common chat ID field names from Telegram inbound node
          const possibleChatIds = [
            (templateContext as any)?.chatId,
            (templateContext as any)?.telegram?.chatId,
            (templateContext as any)?.chat_id,
            (templateContext as any)?.telegram?.chat_id,
            (templateContext as any)?.output?.chatId,
            (templateContext as any)?.output?.chat_id,
            getValueFromPath(templateContext, 'chatId'),
            getValueFromPath(templateContext, 'telegram.chatId'),
            getValueFromPath(templateContext, 'chat_id'),
            getValueFromPath(templateContext, 'telegram.chat_id'),
            getValueFromPath(templateContext, 'output.chatId'),
            getValueFromPath(templateContext, 'output.chat_id'),
            // Also check nodeResults for telegram inbound nodes
            ...((templateContext as any)?.nodeResults ? Object.values((templateContext as any).nodeResults).map((nodeResult: any) => {
              const data = nodeResult?.data || nodeResult?.resultValue || nodeResult;
              const chatIdValue = data?.chatId || data?.telegram?.chatId || data?.chat_id || data?.telegram?.chat_id;
              return chatIdValue;
            }).filter(Boolean) : [])
          ];
          const foundChatId = possibleChatIds.find(id => id && String(id).trim().length > 0);
          if (foundChatId) {
            chatId = String(foundChatId).trim();
          }
        }
      }
      
      // Step 3: Fallback to environment variable if chatId is empty
      // This happens when user didn't provide any chatId input OR template processing failed
      if (!chatId || chatId.trim() === '' || chatId.includes('{{')) {
        // Use credential-name-based env var if credential is configured, otherwise fallback to default
        const envChatId = process.env["NEXT_PUBLIC_TELEGRAM_GOPINATHTELEGRAMSEND_CHAT_ID"] || process.env.NEXT_PUBLIC_TELEGRAM_CHAT_ID || '';
        if (envChatId) {
          chatId = envChatId;
        }
      }
      
      // Validate chatId after template processing and fallback
      if (!chatId || chatId.trim() === '') {
        throw new Error('Telegram Chat ID is required. Please provide it in the node configuration or set NEXT_PUBLIC_TELEGRAM_CHAT_ID in .env.local');
      }
      
      // 🔧 CREDENTIAL PRIORITY: manual input > credential-name-based env var > default env var
      // Note: Credential name is already stored in config, so we use it directly to construct env var names
      // No need to fetch credentials at runtime - the generated code is self-contained
      let botToken = '';
      
      // Priority 1: Use manual bot token from input field (processed through template engine - same as chatId)
      let manualBotToken = "";
      
      // Process bot token templates the same way as chatId (supports dataFlow and nested JSON)
      if (manualBotToken && typeof manualBotToken === 'string' && (manualBotToken.includes('{{') || manualBotToken.includes('dataFlow'))) {
        // Step 1: Process dataFlow templates (e.g., dataFlow.getByNodeId("node-id"))
        manualBotToken = processDataFlowTemplates(manualBotToken);
        
        // Step 2: Process remaining template variables with TemplateExpressionEngine
        if (manualBotToken.includes('{{') && manualBotToken.includes('}}')) {
          const templateContext = getTemplateContext();
          try {
            manualBotToken = manualBotToken.replace(/{{(.+?)}}/g, (match, expr) => {
              try {
                const result = TemplateExpressionEngine.evaluate(expr.trim(), templateContext, {
                  allowFunctions: true,
                  allowComplexExpressions: true,
                  returnType: 'auto'
                });
                if (result !== undefined && result !== null) {
                  // Convert to string, handling objects/arrays
                  if (typeof result === 'object') {
                    return JSON.stringify(result);
                  }
                  return String(result);
                }
                return '';
              } catch (err) {
                return '';
              }
            });
          } catch (templateError) {
            // Template processing error - continue
          }
        }
        
        // Step 3: Use resolveGeneralTemplate as fallback (same as chatId processing)
        if (manualBotToken && manualBotToken.includes('{{')) {
          const resolved = resolveGeneralTemplate(manualBotToken);
          if (resolved && !resolved.includes('{{')) {
            manualBotToken = resolved;
          }
        }
        
        manualBotToken = typeof manualBotToken === 'string' ? manualBotToken.trim() : '';
      } else {
        manualBotToken = typeof manualBotToken === 'string' ? manualBotToken.trim() : '';
      }
      
      // Priority 2: Fallback to credential-name-based environment variable (if credential name is available)
      // Priority 3: Fallback to default environment variable
      if (manualBotToken) {
        botToken = manualBotToken;
      } else {
        // Use credential-name-based env var if credential name is configured, otherwise fallback to default
        botToken = process.env["NEXT_PUBLIC_TELEGRAM_GOPINATHTELEGRAMSEND_BOT_TOKEN"] || process.env.NEXT_PUBLIC_TELEGRAM_BOT_TOKEN || '';
      }
      
      // Validate bot token
      if (!botToken) {
        const envVarHint = "NEXT_PUBLIC_TELEGRAM_GOPINATHTELEGRAMSEND_BOT_TOKEN";
        throw new Error(`Telegram Bot Token is required. Please provide it via credential, node input, or set ${envVarHint} in .env.local`);
      }
      
      // Media resolution logic
      const normalizeMediaType = (value: string) => {
        if (!value) return '';
        const normalized = value.toLowerCase();
        if (['photo', 'image', 'picture', 'img'].includes(normalized)) return 'photo';
        if (['video', 'clip'].includes(normalized)) return 'video';
        if (['document', 'file', 'doc', 'pdf'].includes(normalized)) return 'document';
        if (normalized === 'none') return 'none';
        return normalized;
      };

      mediaType = normalizeMediaType(mediaType || '');
      const originalMediaUrl = mediaUrl;
      mediaUrl = mediaUrl ? resolveGeneralTemplate(mediaUrl)?.trim() : '';
      mediaCaption = mediaCaption ? resolveGeneralTemplate(mediaCaption)?.trim() : mediaCaption;

      // Enhanced: Check if mediaUrl was actually resolved (not still containing template syntax)
      const mediaUrlResolved = Boolean(
        mediaUrl &&
        mediaUrl.trim().length > 0 &&
        !mediaUrl.includes('{{') &&
        !mediaUrl.includes('}}')
      );

      hasMediaAttachment = Boolean(
        sendMedia && mediaType && mediaType !== 'none' && mediaUrlResolved
      );

      // If template still unresolved, try direct variable lookup (e.g., {{sdkResult}})
      if (telegramMessage && telegramMessage.includes('{{')) {
        const directVarMatch = telegramMessage.match(/^\{\{\s*([a-zA-Z0-9_]+)\s*\}\}$/);
        if (directVarMatch) {
          const varName = directVarMatch[1];
          const directValue =
            flowResults?.variables?.[varName] ??
            (flowResults as any)?.[varName];
          if (directValue !== undefined && directValue !== null) {
            telegramMessage = String(directValue);
          }
        }
      }


      if (hasMediaAttachment && (!mediaCaption || mediaCaption.trim().length === 0)) {
        const trimmedMessage = telegramMessage ? telegramMessage.trim() : '';
        mediaCaption = trimmedMessage && !trimmedMessage.includes('{{') ? trimmedMessage : '';
      }

      // Normalize object messages to prevent "[object Object]"
      if (telegramMessage && typeof telegramMessage === 'object') {
        if ((telegramMessage as any).email) {
          telegramMessage = String((telegramMessage as any).email);
        } else {
          telegramMessage = JSON.stringify(telegramMessage);
        }
      }

      // If message is still empty or contains unresolved placeholders, provide a fallback (text-only)
      // But only if we don't have a valid media attachment
      if (!hasMediaAttachment && (!telegramMessage || telegramMessage.trim() === '' || telegramMessage.includes('{{'))) {
        telegramMessage = 'Form submitted successfully!';
      }
      
      // Construct full URL for server-side fetch (Next.js API routes)
      // Browser context uses relative URLs, server context uses absolute URLs
      const baseUrl = typeof window !== 'undefined' 
        ? '' 
        : (process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000');
      const apiUrl = `${baseUrl}/api/telegram`;
      
      const payload: any = {
        bot_token: botToken,
        chat_id: chatId, // 🔧 CRITICAL: Use the resolved chatId (from template or .env fallback)
        parse_mode: "HTML"
      };
      
      // 🔧 CRITICAL: Validate payload before sending
      if (!payload.chat_id || payload.chat_id.trim() === '') {
        throw new Error('Telegram Chat ID is required in payload. Template resolution may have failed.');
      }

      if (hasMediaAttachment) {
        payload.mediaType = mediaType;
        payload.mediaUrl = mediaUrl;
        if (mediaCaption) {
          payload.caption = mediaCaption;
        }
      } else {
        payload.message = telegramMessage;
      }

      // Make API call to Telegram backend proxy
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Telegram API error: ${response.status} - ${response.statusText}. ${errorText}`);
      }
      
      const apiResponse = await response.json();
      
      const finalMessageText = hasMediaAttachment ? (mediaCaption || telegramMessage) : telegramMessage;

      step3Result = {
        ...processedInput_telegram_send_message_1770014570163,
        telegramResult: {
          success: true,
          chatId: chatId,
          message: finalMessageText,
          media: hasMediaAttachment ? { type: mediaType, url: mediaUrl } : null,
          data: apiResponse,
          timestamp: new Date().toISOString()
        },
        nodeId: 'telegram-send-message-1770014570163'
      };
      
      flowResults.telegramResult = step3Result.telegramResult;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      flowErrors.push('Telegram error in node [telegram-send-message-1770014570163]: ' + errorMessage);
      
      step3Result = {
        ...processedInput_telegram_send_message_1770014570163,
        telegramResult: {
          success: false,
          error: errorMessage,
          media: hasMediaAttachment ? { type: mediaType, url: mediaUrl } : null,
          timestamp: new Date().toISOString()
        },
        nodeId: 'telegram-send-message-1770014570163'
      };
    }
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['telegram-send-message-1770014570163'] = {
      nodeId: 'telegram-send-message-1770014570163',
      nodeType: 'Telegram Send Message',
      stepNumber: 3,
      displayName: 'telegramSendResult_telegram_send_message_1770014570163',
      data: step3Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for Telegram Send Message
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['telegramSendResult_telegram_send_message_1770014570163'] || typeof flowResults['telegramSendResult_telegram_send_message_1770014570163'] === 'undefined') {
      flowResults['telegramSendResult_telegram_send_message_1770014570163'] = step3Result;
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
      console.error('❌ Error in step 3 (Telegram Send Message):', stepError);
      flowErrors.push(`Step 3 (Telegram Send Message): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step3Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'Telegram Send Message',
        nodeId: 'telegram-send-message-1770014570163',
        stepNumber: 3
      };
      
      currentResult = step3Result; // Update currentResult even on error
      
      // Store error result in enhanced data flow system
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['telegram-send-message-1770014570163'] = {
      nodeId: 'telegram-send-message-1770014570163',
      nodeType: 'Telegram Send Message',
      stepNumber: 3,
      displayName: 'telegramSendResult_telegram_send_message_1770014570163',
      data: step3Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for Telegram Send Message
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['telegramSendResult_telegram_send_message_1770014570163'] || typeof flowResults['telegramSendResult_telegram_send_message_1770014570163'] === 'undefined') {
      flowResults['telegramSendResult_telegram_send_message_1770014570163'] = step3Result;
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
      if ('flow_telegram-inbound-1770014553742_1771079854967'.includes('button')) {
        // Extract button node information from chain
        const buttonNodes = Object.values(flowResults.nodeResults || {}).filter(
          (result: any) => result.nodeType === 'button'
        );
        
        buttonNodes.forEach((buttonNode: any) => {
          // Store chain ID mapped to button element ID
          if (buttonNode.elementId) {
            (window as any).buttonChainRegistry[buttonNode.elementId] = 'flow_telegram-inbound-1770014553742_1771079854967';
            console.log(`🔗 Registered button chain: ${buttonNode.elementId} → flow_telegram-inbound-1770014553742_1771079854967`);
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
        detail: { flowResults, chainId: 'flow_telegram-inbound-1770014553742_1771079854967' } 
      }));
      (window as any).dispatchEvent(new CustomEvent('flowExecutionCompleted', { 
        detail: { flowResults, chainId: 'flow_telegram-inbound-1770014553742_1771079854967' } 
      }));
      console.log("📡 Dispatched workflow completion events");
    }
    
    return {
      success: true,
      results: flowResults,
      errors: flowErrors,
      chainId: 'flow_telegram-inbound-1770014553742_1771079854967'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) || 'Unknown error';
    console.error('❌ Flow chain execution error:', error);
    return {
      success: false,
      results: flowResults,
      errors: [...flowErrors, errorMessage],
      chainId: 'flow_telegram-inbound-1770014553742_1771079854967'
    };
  }
};





const executeFlowChain_flow_openaiAgentSDKNode_1770014701913_1771079854967 = async (initialData: any = {}): Promise<FlowResult> => {
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
  
  flowResults._executionId = `flow_openaiAgentSDKNode_1770014701913_1771079854967_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
    flowResults.originalChainData = {"id":"flow_openaiAgentSDKNode-1770014701913_1771079854967","nodes":[{"id":"openaiAgentSDKNode-1770014701913","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"Orientation call Summary","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770014783566","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"sendform","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770014789694","url":"https://supabase-crud.simplita.ai/mcp","name":"crud","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"","agentSDKType":"agent_as_tool","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are a helpful Assistant.\nYour task is to manage and update orientation call summaries in the Supabase database and optionally send a Google Form link based on user confirmation.\nConfiguration\nTool: CRUD MCP Tool\nDatabase Table: crudsupabase\nColumns Used: id_value, Name, phonenumber, orientation_call\nInput Format (from User)\nThe user will provide input as:\nName: [Name of the person]\nSummary: [Summary text for orientation call]\nConditional Logic and Actions:\nCondition 1 — When User Provides Name and Summary\nIntent: Save the orientation call summary for the provided person.\nActions:\nRead the crudsupabase table using the provided Name.\nFind the matching id_value and phonenumber.\nDo not update using the Name directly.\nUse id_value to update the row in the orientation_call column with the provided Summary.\nAfter successful update, respond with:\nThe orientation call summary has been saved successfully.\nWould you like to send the Google Form Link? (Yes/No)\nCondition 2 — If User Replies “Yes”\nIntent: Send the Google Form link to the respective user.\nActions:\nRetrieve the previously found phonenumber from the record.\nwe need to send the google form which is used to get the patient details for proceeding the next step.\nSend the Google Form link to that phone number:\nhttps://docs.google.com/forms/d/e/1FAIpQLSeJmu9Ml88E2-4Yt8gSpIGN_eKdahEM-j_TMMl7Stw4bLGGNw/viewform\nRespond with a success confirmation:\nThe Google Form link has been sent successfully to [phonenumber].\nCondition 3 — If User Replies “No”\nIntent: End the flow without sending any link.\nAction:\nRespond with:\nOkay, the Google Form link will not be sent.","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}}],"edges":[{"source":"telegram-inbound-1770014553742","target":"openaiAgentSDKNode-1770014563018"},{"source":"openaiAgentSDKNode-1770014563018","target":"telegram-send-message-1770014570163"}],"chainType":"linear","dataFlow":[],"startNode":{"id":"openaiAgentSDKNode-1770014701913","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"Orientation call Summary","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770014783566","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"sendform","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770014789694","url":"https://supabase-crud.simplita.ai/mcp","name":"crud","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"","agentSDKType":"agent_as_tool","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are a helpful Assistant.\nYour task is to manage and update orientation call summaries in the Supabase database and optionally send a Google Form link based on user confirmation.\nConfiguration\nTool: CRUD MCP Tool\nDatabase Table: crudsupabase\nColumns Used: id_value, Name, phonenumber, orientation_call\nInput Format (from User)\nThe user will provide input as:\nName: [Name of the person]\nSummary: [Summary text for orientation call]\nConditional Logic and Actions:\nCondition 1 — When User Provides Name and Summary\nIntent: Save the orientation call summary for the provided person.\nActions:\nRead the crudsupabase table using the provided Name.\nFind the matching id_value and phonenumber.\nDo not update using the Name directly.\nUse id_value to update the row in the orientation_call column with the provided Summary.\nAfter successful update, respond with:\nThe orientation call summary has been saved successfully.\nWould you like to send the Google Form Link? (Yes/No)\nCondition 2 — If User Replies “Yes”\nIntent: Send the Google Form link to the respective user.\nActions:\nRetrieve the previously found phonenumber from the record.\nwe need to send the google form which is used to get the patient details for proceeding the next step.\nSend the Google Form link to that phone number:\nhttps://docs.google.com/forms/d/e/1FAIpQLSeJmu9Ml88E2-4Yt8gSpIGN_eKdahEM-j_TMMl7Stw4bLGGNw/viewform\nRespond with a success confirmation:\nThe Google Form link has been sent successfully to [phonenumber].\nCondition 3 — If User Replies “No”\nIntent: End the flow without sending any link.\nAction:\nRespond with:\nOkay, the Google Form link will not be sent.","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}},"endNode":{"id":"openaiAgentSDKNode-1770014701913","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"Orientation call Summary","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770014783566","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"sendform","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770014789694","url":"https://supabase-crud.simplita.ai/mcp","name":"crud","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"","agentSDKType":"agent_as_tool","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are a helpful Assistant.\nYour task is to manage and update orientation call summaries in the Supabase database and optionally send a Google Form link based on user confirmation.\nConfiguration\nTool: CRUD MCP Tool\nDatabase Table: crudsupabase\nColumns Used: id_value, Name, phonenumber, orientation_call\nInput Format (from User)\nThe user will provide input as:\nName: [Name of the person]\nSummary: [Summary text for orientation call]\nConditional Logic and Actions:\nCondition 1 — When User Provides Name and Summary\nIntent: Save the orientation call summary for the provided person.\nActions:\nRead the crudsupabase table using the provided Name.\nFind the matching id_value and phonenumber.\nDo not update using the Name directly.\nUse id_value to update the row in the orientation_call column with the provided Summary.\nAfter successful update, respond with:\nThe orientation call summary has been saved successfully.\nWould you like to send the Google Form Link? (Yes/No)\nCondition 2 — If User Replies “Yes”\nIntent: Send the Google Form link to the respective user.\nActions:\nRetrieve the previously found phonenumber from the record.\nwe need to send the google form which is used to get the patient details for proceeding the next step.\nSend the Google Form link to that phone number:\nhttps://docs.google.com/forms/d/e/1FAIpQLSeJmu9Ml88E2-4Yt8gSpIGN_eKdahEM-j_TMMl7Stw4bLGGNw/viewform\nRespond with a success confirmation:\nThe Google Form link has been sent successfully to [phonenumber].\nCondition 3 — If User Replies “No”\nIntent: End the flow without sending any link.\nAction:\nRespond with:\nOkay, the Google Form link will not be sent.","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}}};

    // Declare all step result variables
    let step1Result: any;



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
    flowResults.originalChainData = {"id":"flow_openaiAgentSDKNode-1770014701913_1771079854967","nodes":[{"id":"openaiAgentSDKNode-1770014701913","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"Orientation call Summary","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770014783566","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"sendform","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770014789694","url":"https://supabase-crud.simplita.ai/mcp","name":"crud","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"","agentSDKType":"agent_as_tool","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are a helpful Assistant.\nYour task is to manage and update orientation call summaries in the Supabase database and optionally send a Google Form link based on user confirmation.\nConfiguration\nTool: CRUD MCP Tool\nDatabase Table: crudsupabase\nColumns Used: id_value, Name, phonenumber, orientation_call\nInput Format (from User)\nThe user will provide input as:\nName: [Name of the person]\nSummary: [Summary text for orientation call]\nConditional Logic and Actions:\nCondition 1 — When User Provides Name and Summary\nIntent: Save the orientation call summary for the provided person.\nActions:\nRead the crudsupabase table using the provided Name.\nFind the matching id_value and phonenumber.\nDo not update using the Name directly.\nUse id_value to update the row in the orientation_call column with the provided Summary.\nAfter successful update, respond with:\nThe orientation call summary has been saved successfully.\nWould you like to send the Google Form Link? (Yes/No)\nCondition 2 — If User Replies “Yes”\nIntent: Send the Google Form link to the respective user.\nActions:\nRetrieve the previously found phonenumber from the record.\nwe need to send the google form which is used to get the patient details for proceeding the next step.\nSend the Google Form link to that phone number:\nhttps://docs.google.com/forms/d/e/1FAIpQLSeJmu9Ml88E2-4Yt8gSpIGN_eKdahEM-j_TMMl7Stw4bLGGNw/viewform\nRespond with a success confirmation:\nThe Google Form link has been sent successfully to [phonenumber].\nCondition 3 — If User Replies “No”\nIntent: End the flow without sending any link.\nAction:\nRespond with:\nOkay, the Google Form link will not be sent.","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}}],"edges":[{"source":"telegram-inbound-1770014553742","target":"openaiAgentSDKNode-1770014563018"},{"source":"openaiAgentSDKNode-1770014563018","target":"telegram-send-message-1770014570163"}],"chainType":"linear","dataFlow":[],"startNode":{"id":"openaiAgentSDKNode-1770014701913","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"Orientation call Summary","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770014783566","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"sendform","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770014789694","url":"https://supabase-crud.simplita.ai/mcp","name":"crud","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"","agentSDKType":"agent_as_tool","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are a helpful Assistant.\nYour task is to manage and update orientation call summaries in the Supabase database and optionally send a Google Form link based on user confirmation.\nConfiguration\nTool: CRUD MCP Tool\nDatabase Table: crudsupabase\nColumns Used: id_value, Name, phonenumber, orientation_call\nInput Format (from User)\nThe user will provide input as:\nName: [Name of the person]\nSummary: [Summary text for orientation call]\nConditional Logic and Actions:\nCondition 1 — When User Provides Name and Summary\nIntent: Save the orientation call summary for the provided person.\nActions:\nRead the crudsupabase table using the provided Name.\nFind the matching id_value and phonenumber.\nDo not update using the Name directly.\nUse id_value to update the row in the orientation_call column with the provided Summary.\nAfter successful update, respond with:\nThe orientation call summary has been saved successfully.\nWould you like to send the Google Form Link? (Yes/No)\nCondition 2 — If User Replies “Yes”\nIntent: Send the Google Form link to the respective user.\nActions:\nRetrieve the previously found phonenumber from the record.\nwe need to send the google form which is used to get the patient details for proceeding the next step.\nSend the Google Form link to that phone number:\nhttps://docs.google.com/forms/d/e/1FAIpQLSeJmu9Ml88E2-4Yt8gSpIGN_eKdahEM-j_TMMl7Stw4bLGGNw/viewform\nRespond with a success confirmation:\nThe Google Form link has been sent successfully to [phonenumber].\nCondition 3 — If User Replies “No”\nIntent: End the flow without sending any link.\nAction:\nRespond with:\nOkay, the Google Form link will not be sent.","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}},"endNode":{"id":"openaiAgentSDKNode-1770014701913","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"Orientation call Summary","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770014783566","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"sendform","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770014789694","url":"https://supabase-crud.simplita.ai/mcp","name":"crud","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"","agentSDKType":"agent_as_tool","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are a helpful Assistant.\nYour task is to manage and update orientation call summaries in the Supabase database and optionally send a Google Form link based on user confirmation.\nConfiguration\nTool: CRUD MCP Tool\nDatabase Table: crudsupabase\nColumns Used: id_value, Name, phonenumber, orientation_call\nInput Format (from User)\nThe user will provide input as:\nName: [Name of the person]\nSummary: [Summary text for orientation call]\nConditional Logic and Actions:\nCondition 1 — When User Provides Name and Summary\nIntent: Save the orientation call summary for the provided person.\nActions:\nRead the crudsupabase table using the provided Name.\nFind the matching id_value and phonenumber.\nDo not update using the Name directly.\nUse id_value to update the row in the orientation_call column with the provided Summary.\nAfter successful update, respond with:\nThe orientation call summary has been saved successfully.\nWould you like to send the Google Form Link? (Yes/No)\nCondition 2 — If User Replies “Yes”\nIntent: Send the Google Form link to the respective user.\nActions:\nRetrieve the previously found phonenumber from the record.\nwe need to send the google form which is used to get the patient details for proceeding the next step.\nSend the Google Form link to that phone number:\nhttps://docs.google.com/forms/d/e/1FAIpQLSeJmu9Ml88E2-4Yt8gSpIGN_eKdahEM-j_TMMl7Stw4bLGGNw/viewform\nRespond with a success confirmation:\nThe Google Form link has been sent successfully to [phonenumber].\nCondition 3 — If User Replies “No”\nIntent: End the flow without sending any link.\nAction:\nRespond with:\nOkay, the Google Form link will not be sent.","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}}};
    
    if (typeof window !== 'undefined') {
      // SECURITY: Store SANITIZED workflow nodes in window context (remove API keys)
      // Sanitize each node individually to ensure all sensitive data is removed
      const sanitizedNodes = [{"id":"openaiAgentSDKNode-1770014701913","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"Orientation call Summary","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770014783566","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"sendform","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770014789694","url":"https://supabase-crud.simplita.ai/mcp","name":"crud","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"","agentSDKType":"agent_as_tool","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are a helpful Assistant.\nYour task is to manage and update orientation call summaries in the Supabase database and optionally send a Google Form link based on user confirmation.\nConfiguration\nTool: CRUD MCP Tool\nDatabase Table: crudsupabase\nColumns Used: id_value, Name, phonenumber, orientation_call\nInput Format (from User)\nThe user will provide input as:\nName: [Name of the person]\nSummary: [Summary text for orientation call]\nConditional Logic and Actions:\nCondition 1 — When User Provides Name and Summary\nIntent: Save the orientation call summary for the provided person.\nActions:\nRead the crudsupabase table using the provided Name.\nFind the matching id_value and phonenumber.\nDo not update using the Name directly.\nUse id_value to update the row in the orientation_call column with the provided Summary.\nAfter successful update, respond with:\nThe orientation call summary has been saved successfully.\nWould you like to send the Google Form Link? (Yes/No)\nCondition 2 — If User Replies “Yes”\nIntent: Send the Google Form link to the respective user.\nActions:\nRetrieve the previously found phonenumber from the record.\nwe need to send the google form which is used to get the patient details for proceeding the next step.\nSend the Google Form link to that phone number:\nhttps://docs.google.com/forms/d/e/1FAIpQLSeJmu9Ml88E2-4Yt8gSpIGN_eKdahEM-j_TMMl7Stw4bLGGNw/viewform\nRespond with a success confirmation:\nThe Google Form link has been sent successfully to [phonenumber].\nCondition 3 — If User Replies “No”\nIntent: End the flow without sending any link.\nAction:\nRespond with:\nOkay, the Google Form link will not be sent.","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}}];
      
      (window as any).__currentWorkflowNodes = sanitizedNodes;
      (window as any).__flowChainMetadata = {
        chainId: 'flow_openaiAgentSDKNode-1770014701913_1771079854967',
        currentChainNodes: sanitizedNodes,
        nodeCount: 1
      };
      console.log('🔗 Workflow nodes made available globally: 1 nodes');
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
      
    // Process with OpenAI Agent SDK (Single Input Mode)
    step1Result = '';
    
    // 🆕 BUILD TARGET AGENT CONFIGURATIONS AT RUNTIME (for cross-workflow handoff)
    // CRITICAL FIX: Use workflowRegistry.allNodes instead of context.allNodes
    // This allows orchestrator agents to find sub-agents in other workflows
    const targetAgentConfigs: Record<string, any> = {};
    
    
    
    try {
      // 🚫 CHECK: Skip if this node was already executed via handoff (CLIENT-SIDE ONLY)
      if (typeof window !== 'undefined' && window.__executedNodes && window.__executedNodes.has('openaiAgentSDKNode-1770014701913')) {
        console.log('⏭Skipping node (already executed via handoff):', 'openaiAgentSDKNode-1770014701913');
        
        // Get the result from dataFlow if available
        const existingResult = dataFlow.getByNodeId('openaiAgentSDKNode-1770014701913');
        if (existingResult) {
          step1Result = existingResult;
        } else {
          step1Result = 'Node already executed via handoff';
        }
        
        // Remove from executed set for next workflow run (CLIENT-SIDE ONLY)
        if (typeof window !== 'undefined' && window.__executedNodes) {
          window.__executedNodes.delete('openaiAgentSDKNode-1770014701913');
        }
      } else {
      let aiInput = '';
      
      
      // Single input processing (existing logic - UNCHANGED)
      
        // No user prompt provided - use previous step data
        let processedInput = null;
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
            const agentId = 'agent-1771079854973';
            const userId = 'user-1771079854973';
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
          instructions: `You are a helpful Assistant.
Your task is to manage and update orientation call summaries in the Supabase database and optionally send a Google Form link based on user confirmation.
Configuration
Tool: CRUD MCP Tool
Database Table: crudsupabase
Columns Used: id_value, Name, phonenumber, orientation_call
Input Format (from User)
The user will provide input as:
Name: [Name of the person]
Summary: [Summary text for orientation call]
Conditional Logic and Actions:
Condition 1 — When User Provides Name and Summary
Intent: Save the orientation call summary for the provided person.
Actions:
Read the crudsupabase table using the provided Name.
Find the matching id_value and phonenumber.
Do not update using the Name directly.
Use id_value to update the row in the orientation_call column with the provided Summary.
After successful update, respond with:
The orientation call summary has been saved successfully.
Would you like to send the Google Form Link? (Yes/No)
Condition 2 — If User Replies “Yes”
Intent: Send the Google Form link to the respective user.
Actions:
Retrieve the previously found phonenumber from the record.
we need to send the google form which is used to get the patient details for proceeding the next step.
Send the Google Form link to that phone number:
https://docs.google.com/forms/d/e/1FAIpQLSeJmu9Ml88E2-4Yt8gSpIGN_eKdahEM-j_TMMl7Stw4bLGGNw/viewform
Respond with a success confirmation:
The Google Form link has been sent successfully to [phonenumber].
Condition 3 — If User Replies “No”
Intent: End the flow without sending any link.
Action:
Respond with:
Okay, the Google Form link will not be sent.`,
          temperature: 0.7,
          max_tokens: 1000,
          apiKey: effectiveApiKey,
          agentType: 'agent_as_tool',
          selected_tools: [],
          tool_configs: {},
          tool_settings: {"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},
          mcp_servers: [{"id":"custom_mcp_1770014783566","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"sendform","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770014789694","url":"https://supabase-crud.simplita.ai/mcp","name":"crud","enabled":true,"description":"Custom MCP Server"}],
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
          const outgoingEdges = workflowEdges.filter((e: any) => e.source === 'openaiAgentSDKNode-1770014701913');
          
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
          const agentId = 'agent-1771079854973';
          const userId = 'user-1771079854973';
          const sessionId = 'session-1771079854973';
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
          const outgoingEdges = workflowEdges.filter((e: any) => e.source === 'openaiAgentSDKNode-1770014701913');
          
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
              step1Result = targetAgentResult.content || targetAgentResult.text || targetAgentResult.message || 'Target agent response';
            } else {
              // TOOL CALL MODE: Combine results, orchestrator continues
              step1Result = {
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
            step1Result = {
              handoffCompleted: false,
              sourceAgent: result.message,
              targetAgent: result.target_agent,
              error: 'Target agent execution failed',
              handoffReason: result.reason
            };
          }
        } catch (handoffError) {
          console.error('Handoff error:', handoffError);
          step1Result = {
            handoffCompleted: false,
            sourceAgent: result.message,
            targetAgent: result.target_agent,
            error: handoffError instanceof Error ? handoffError.message : String(handoffError),
            handoffReason: result.reason
          };
        }
      } else {
        // Normal response (no handoff)
        step1Result = result.content || result.text || result.message || 'AI response received';
      }
      
      // 📊 CRITICAL: Store result in flowResults for dataFlow access
      if (!flowResults.nodeResults) flowResults.nodeResults = {};
      if (!flowResults.variables) flowResults.variables = {};
      if (!flowResults.aiResponses) flowResults.aiResponses = {};
      
      // Generate safe display name at runtime
      const displayName = "Orientation_call_Summary";
      
      // Store in nodeResults for dataFlow.getByNodeId()
      flowResults.nodeResults['openaiAgentSDKNode-1770014701913'] = {
        nodeId: 'openaiAgentSDKNode-1770014701913',
        nodeType: 'openaiAgentSDKNode',
        stepNumber: (flowResults.stepCounter || 0) + 1,
        displayName: displayName,
        data: step1Result,
        timestamp: new Date().toISOString(),
        success: true
      };
      
      // Store in variables for dataFlow.get()
      flowResults.variables[displayName] = step1Result;
      flowResults.aiResponses[displayName] = step1Result;
      
      // Store at top-level for direct access
      flowResults[displayName] = step1Result;

      // Store under configured resultVariable if provided (e.g., sdkResult)
      const resultVariableName = "sdkResult";
      if (resultVariableName) {
        flowResults.variables[resultVariableName] = step1Result;
        flowResults.aiResponses[resultVariableName] = step1Result;
        flowResults[resultVariableName] = step1Result;
      }
      
      // Update current/previous for dataFlow.current() and dataFlow.previous()
      flowResults.previousResult = flowResults.currentResult;
      flowResults.currentResult = step1Result;
      
      // Increment step counter
      flowResults.stepCounter = (flowResults.stepCounter || 0) + 1;
      }
      
    } catch (error) {
      console.error('OpenAI Agent SDK error:', error);
      step1Result = 'Error: ' + (error instanceof Error ? error.message : String(error));
      flowErrors.push('OpenAI Agent SDK error in node ' + "openaiAgentSDKNode-1770014701913" + ': ' + (error instanceof Error ? error.message : String(error)));
    }
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['openaiAgentSDKNode-1770014701913'] = {
      nodeId: 'openaiAgentSDKNode-1770014701913',
      nodeType: 'openaiAgentSDKNode',
      stepNumber: 1,
      displayName: 'openaiSDKResult_openaiAgentSDKNode_1770014701913',
      data: step1Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    flowResults.aiResponses['openaiSDKResult_openaiAgentSDKNode_1770014701913'] = step1Result;
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['openaiSDKResult_openaiAgentSDKNode_1770014701913'] || typeof flowResults['openaiSDKResult_openaiAgentSDKNode_1770014701913'] === 'undefined') {
      flowResults['openaiSDKResult_openaiAgentSDKNode_1770014701913'] = step1Result;
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
      console.error('❌ Error in step 1 (openaiAgentSDKNode):', stepError);
      flowErrors.push(`Step 1 (openaiAgentSDKNode): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step1Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'openaiAgentSDKNode',
        nodeId: 'openaiAgentSDKNode-1770014701913',
        stepNumber: 1
      };
      
      currentResult = step1Result; // Update currentResult even on error
      
      // Store error result in enhanced data flow system
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['openaiAgentSDKNode-1770014701913'] = {
      nodeId: 'openaiAgentSDKNode-1770014701913',
      nodeType: 'openaiAgentSDKNode',
      stepNumber: 1,
      displayName: 'openaiSDKResult_openaiAgentSDKNode_1770014701913',
      data: step1Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    flowResults.aiResponses['openaiSDKResult_openaiAgentSDKNode_1770014701913'] = step1Result;
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['openaiSDKResult_openaiAgentSDKNode_1770014701913'] || typeof flowResults['openaiSDKResult_openaiAgentSDKNode_1770014701913'] === 'undefined') {
      flowResults['openaiSDKResult_openaiAgentSDKNode_1770014701913'] = step1Result;
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
      if ('flow_openaiAgentSDKNode-1770014701913_1771079854967'.includes('button')) {
        // Extract button node information from chain
        const buttonNodes = Object.values(flowResults.nodeResults || {}).filter(
          (result: any) => result.nodeType === 'button'
        );
        
        buttonNodes.forEach((buttonNode: any) => {
          // Store chain ID mapped to button element ID
          if (buttonNode.elementId) {
            (window as any).buttonChainRegistry[buttonNode.elementId] = 'flow_openaiAgentSDKNode-1770014701913_1771079854967';
            console.log(`🔗 Registered button chain: ${buttonNode.elementId} → flow_openaiAgentSDKNode-1770014701913_1771079854967`);
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
        detail: { flowResults, chainId: 'flow_openaiAgentSDKNode-1770014701913_1771079854967' } 
      }));
      (window as any).dispatchEvent(new CustomEvent('flowExecutionCompleted', { 
        detail: { flowResults, chainId: 'flow_openaiAgentSDKNode-1770014701913_1771079854967' } 
      }));
      console.log("📡 Dispatched workflow completion events");
    }
    
    return {
      success: true,
      results: flowResults,
      errors: flowErrors,
      chainId: 'flow_openaiAgentSDKNode-1770014701913_1771079854967'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) || 'Unknown error';
    console.error('❌ Flow chain execution error:', error);
    return {
      success: false,
      results: flowResults,
      errors: [...flowErrors, errorMessage],
      chainId: 'flow_openaiAgentSDKNode-1770014701913_1771079854967'
    };
  }
};





const executeFlowChain_flow_openaiAgentSDKNode_1770014706694_1771079854967 = async (initialData: any = {}): Promise<FlowResult> => {
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
  
  flowResults._executionId = `flow_openaiAgentSDKNode_1770014706694_1771079854967_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
    flowResults.originalChainData = {"id":"flow_openaiAgentSDKNode-1770014706694_1771079854967","nodes":[{"id":"openaiAgentSDKNode-1770014706694","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"Root cause call summary","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770014848256","url":"https://supabase-crud.simplita.ai/mcp","name":"supabase","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770014857040","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"Call_details","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"","agentSDKType":"agent_as_tool","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are a helpful AI a🤖 SYSTEM INSTRUCTION — ROOT CAUSE ANALYSIS CALL MANAGEMENT AGENT\n\nYou are a helpful Assistant.\nYour task is to manage and update Root Cause Analysis call summaries in the Supabase database.\n\n⚙️ Configuration\n\nTool: CRUD MCP Tool\nDatabase Table: crudsupabase\nColumns Used:\nid_value, Name, phonenumber, orientation_call, rootcause_analysis, joining_information\n\n📥 Input Format (from User)\n\nThe user will provide input in the following structure:\n\ntitle is this : Root Cause Analysis  \nName: [Name of the person]  \nPhone Number: [phonenumber of the person]  \nSummary: [Summary text for rootcause_analysis]  \nJoining Information: [Joining information of the person, e.g. “today 5:00pm”, “25th October 2025”, “tomorrow 9:00am”]\n\n\nNote: Convert the Joining Information into standard ISO date and time format (YYYY-MM-DD HH:MM:SS) before saving in the database.\n\n🧩 Conditional Logic & Actions\n✅ Condition 1 — When User Provides Name, Phone Number, Summary, and Joining Information\n\nIntent: Save the Root Cause Analysis summary and joining information for the provided person.\n\nActions:\n\nRead the crudsupabase table using the provided Name.\n\nFind the matching record using the phonenumber.\n\nDo not update using the Name directly — use phonenumber as the key.\n\nUpdate the row in the following columns:\n\nrootcause_analysis → with the provided Summary\n\njoining_information → with the standardized date-time value\n\nResponse (after successful update):\n\nThe Root Cause Analysis summary has been saved successfully.\nWould you like to send a follow-up health message to the respective user? (Yes/No)\n\n💬 Condition 2 — If User Replies “Yes”\n\nIntent: Send a follow-up health reminder message to the respective user.\n\nActions:\n\nRetrieve the phonenumber from the previously updated record.\n\nUse the Call_details MCP to send the following message to that number:\n\n💪 Hi [Name], this is a gentle reminder from your Root Cause Analysis follow-up.  \nPlease remember to take your routine health tests such as:\n- Blood Sugar Test  \n- Lipid Profile  \n- Thyroid Function Test  \n- Complete Blood Count (CBC)  \n- Vitamin D & B12 Levels  \n\nIf you’re in a weight loss or gain program, please submit your respective blood test or health check-up reports to help us track your progress and ensure your wellness goals are on the right path. 🩺\n\n\nResponse (after message sent):\n\nThe health follow-up message has been sent successfully to [phonenumber].\n\n🚫 Condition 3 — If User Replies “No”\n\nIntent: End the flow without sending any message.\n\nAction:\n\nOkay, no follow-up message will be sent.assistant.","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}}],"edges":[{"source":"telegram-inbound-1770014553742","target":"openaiAgentSDKNode-1770014563018"},{"source":"openaiAgentSDKNode-1770014563018","target":"telegram-send-message-1770014570163"}],"chainType":"linear","dataFlow":[],"startNode":{"id":"openaiAgentSDKNode-1770014706694","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"Root cause call summary","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770014848256","url":"https://supabase-crud.simplita.ai/mcp","name":"supabase","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770014857040","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"Call_details","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"","agentSDKType":"agent_as_tool","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are a helpful AI a🤖 SYSTEM INSTRUCTION — ROOT CAUSE ANALYSIS CALL MANAGEMENT AGENT\n\nYou are a helpful Assistant.\nYour task is to manage and update Root Cause Analysis call summaries in the Supabase database.\n\n⚙️ Configuration\n\nTool: CRUD MCP Tool\nDatabase Table: crudsupabase\nColumns Used:\nid_value, Name, phonenumber, orientation_call, rootcause_analysis, joining_information\n\n📥 Input Format (from User)\n\nThe user will provide input in the following structure:\n\ntitle is this : Root Cause Analysis  \nName: [Name of the person]  \nPhone Number: [phonenumber of the person]  \nSummary: [Summary text for rootcause_analysis]  \nJoining Information: [Joining information of the person, e.g. “today 5:00pm”, “25th October 2025”, “tomorrow 9:00am”]\n\n\nNote: Convert the Joining Information into standard ISO date and time format (YYYY-MM-DD HH:MM:SS) before saving in the database.\n\n🧩 Conditional Logic & Actions\n✅ Condition 1 — When User Provides Name, Phone Number, Summary, and Joining Information\n\nIntent: Save the Root Cause Analysis summary and joining information for the provided person.\n\nActions:\n\nRead the crudsupabase table using the provided Name.\n\nFind the matching record using the phonenumber.\n\nDo not update using the Name directly — use phonenumber as the key.\n\nUpdate the row in the following columns:\n\nrootcause_analysis → with the provided Summary\n\njoining_information → with the standardized date-time value\n\nResponse (after successful update):\n\nThe Root Cause Analysis summary has been saved successfully.\nWould you like to send a follow-up health message to the respective user? (Yes/No)\n\n💬 Condition 2 — If User Replies “Yes”\n\nIntent: Send a follow-up health reminder message to the respective user.\n\nActions:\n\nRetrieve the phonenumber from the previously updated record.\n\nUse the Call_details MCP to send the following message to that number:\n\n💪 Hi [Name], this is a gentle reminder from your Root Cause Analysis follow-up.  \nPlease remember to take your routine health tests such as:\n- Blood Sugar Test  \n- Lipid Profile  \n- Thyroid Function Test  \n- Complete Blood Count (CBC)  \n- Vitamin D & B12 Levels  \n\nIf you’re in a weight loss or gain program, please submit your respective blood test or health check-up reports to help us track your progress and ensure your wellness goals are on the right path. 🩺\n\n\nResponse (after message sent):\n\nThe health follow-up message has been sent successfully to [phonenumber].\n\n🚫 Condition 3 — If User Replies “No”\n\nIntent: End the flow without sending any message.\n\nAction:\n\nOkay, no follow-up message will be sent.assistant.","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}},"endNode":{"id":"openaiAgentSDKNode-1770014706694","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"Root cause call summary","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770014848256","url":"https://supabase-crud.simplita.ai/mcp","name":"supabase","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770014857040","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"Call_details","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"","agentSDKType":"agent_as_tool","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are a helpful AI a🤖 SYSTEM INSTRUCTION — ROOT CAUSE ANALYSIS CALL MANAGEMENT AGENT\n\nYou are a helpful Assistant.\nYour task is to manage and update Root Cause Analysis call summaries in the Supabase database.\n\n⚙️ Configuration\n\nTool: CRUD MCP Tool\nDatabase Table: crudsupabase\nColumns Used:\nid_value, Name, phonenumber, orientation_call, rootcause_analysis, joining_information\n\n📥 Input Format (from User)\n\nThe user will provide input in the following structure:\n\ntitle is this : Root Cause Analysis  \nName: [Name of the person]  \nPhone Number: [phonenumber of the person]  \nSummary: [Summary text for rootcause_analysis]  \nJoining Information: [Joining information of the person, e.g. “today 5:00pm”, “25th October 2025”, “tomorrow 9:00am”]\n\n\nNote: Convert the Joining Information into standard ISO date and time format (YYYY-MM-DD HH:MM:SS) before saving in the database.\n\n🧩 Conditional Logic & Actions\n✅ Condition 1 — When User Provides Name, Phone Number, Summary, and Joining Information\n\nIntent: Save the Root Cause Analysis summary and joining information for the provided person.\n\nActions:\n\nRead the crudsupabase table using the provided Name.\n\nFind the matching record using the phonenumber.\n\nDo not update using the Name directly — use phonenumber as the key.\n\nUpdate the row in the following columns:\n\nrootcause_analysis → with the provided Summary\n\njoining_information → with the standardized date-time value\n\nResponse (after successful update):\n\nThe Root Cause Analysis summary has been saved successfully.\nWould you like to send a follow-up health message to the respective user? (Yes/No)\n\n💬 Condition 2 — If User Replies “Yes”\n\nIntent: Send a follow-up health reminder message to the respective user.\n\nActions:\n\nRetrieve the phonenumber from the previously updated record.\n\nUse the Call_details MCP to send the following message to that number:\n\n💪 Hi [Name], this is a gentle reminder from your Root Cause Analysis follow-up.  \nPlease remember to take your routine health tests such as:\n- Blood Sugar Test  \n- Lipid Profile  \n- Thyroid Function Test  \n- Complete Blood Count (CBC)  \n- Vitamin D & B12 Levels  \n\nIf you’re in a weight loss or gain program, please submit your respective blood test or health check-up reports to help us track your progress and ensure your wellness goals are on the right path. 🩺\n\n\nResponse (after message sent):\n\nThe health follow-up message has been sent successfully to [phonenumber].\n\n🚫 Condition 3 — If User Replies “No”\n\nIntent: End the flow without sending any message.\n\nAction:\n\nOkay, no follow-up message will be sent.assistant.","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}}};

    // Declare all step result variables
    let step1Result: any;



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
    flowResults.originalChainData = {"id":"flow_openaiAgentSDKNode-1770014706694_1771079854967","nodes":[{"id":"openaiAgentSDKNode-1770014706694","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"Root cause call summary","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770014848256","url":"https://supabase-crud.simplita.ai/mcp","name":"supabase","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770014857040","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"Call_details","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"","agentSDKType":"agent_as_tool","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are a helpful AI a🤖 SYSTEM INSTRUCTION — ROOT CAUSE ANALYSIS CALL MANAGEMENT AGENT\n\nYou are a helpful Assistant.\nYour task is to manage and update Root Cause Analysis call summaries in the Supabase database.\n\n⚙️ Configuration\n\nTool: CRUD MCP Tool\nDatabase Table: crudsupabase\nColumns Used:\nid_value, Name, phonenumber, orientation_call, rootcause_analysis, joining_information\n\n📥 Input Format (from User)\n\nThe user will provide input in the following structure:\n\ntitle is this : Root Cause Analysis  \nName: [Name of the person]  \nPhone Number: [phonenumber of the person]  \nSummary: [Summary text for rootcause_analysis]  \nJoining Information: [Joining information of the person, e.g. “today 5:00pm”, “25th October 2025”, “tomorrow 9:00am”]\n\n\nNote: Convert the Joining Information into standard ISO date and time format (YYYY-MM-DD HH:MM:SS) before saving in the database.\n\n🧩 Conditional Logic & Actions\n✅ Condition 1 — When User Provides Name, Phone Number, Summary, and Joining Information\n\nIntent: Save the Root Cause Analysis summary and joining information for the provided person.\n\nActions:\n\nRead the crudsupabase table using the provided Name.\n\nFind the matching record using the phonenumber.\n\nDo not update using the Name directly — use phonenumber as the key.\n\nUpdate the row in the following columns:\n\nrootcause_analysis → with the provided Summary\n\njoining_information → with the standardized date-time value\n\nResponse (after successful update):\n\nThe Root Cause Analysis summary has been saved successfully.\nWould you like to send a follow-up health message to the respective user? (Yes/No)\n\n💬 Condition 2 — If User Replies “Yes”\n\nIntent: Send a follow-up health reminder message to the respective user.\n\nActions:\n\nRetrieve the phonenumber from the previously updated record.\n\nUse the Call_details MCP to send the following message to that number:\n\n💪 Hi [Name], this is a gentle reminder from your Root Cause Analysis follow-up.  \nPlease remember to take your routine health tests such as:\n- Blood Sugar Test  \n- Lipid Profile  \n- Thyroid Function Test  \n- Complete Blood Count (CBC)  \n- Vitamin D & B12 Levels  \n\nIf you’re in a weight loss or gain program, please submit your respective blood test or health check-up reports to help us track your progress and ensure your wellness goals are on the right path. 🩺\n\n\nResponse (after message sent):\n\nThe health follow-up message has been sent successfully to [phonenumber].\n\n🚫 Condition 3 — If User Replies “No”\n\nIntent: End the flow without sending any message.\n\nAction:\n\nOkay, no follow-up message will be sent.assistant.","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}}],"edges":[{"source":"telegram-inbound-1770014553742","target":"openaiAgentSDKNode-1770014563018"},{"source":"openaiAgentSDKNode-1770014563018","target":"telegram-send-message-1770014570163"}],"chainType":"linear","dataFlow":[],"startNode":{"id":"openaiAgentSDKNode-1770014706694","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"Root cause call summary","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770014848256","url":"https://supabase-crud.simplita.ai/mcp","name":"supabase","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770014857040","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"Call_details","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"","agentSDKType":"agent_as_tool","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are a helpful AI a🤖 SYSTEM INSTRUCTION — ROOT CAUSE ANALYSIS CALL MANAGEMENT AGENT\n\nYou are a helpful Assistant.\nYour task is to manage and update Root Cause Analysis call summaries in the Supabase database.\n\n⚙️ Configuration\n\nTool: CRUD MCP Tool\nDatabase Table: crudsupabase\nColumns Used:\nid_value, Name, phonenumber, orientation_call, rootcause_analysis, joining_information\n\n📥 Input Format (from User)\n\nThe user will provide input in the following structure:\n\ntitle is this : Root Cause Analysis  \nName: [Name of the person]  \nPhone Number: [phonenumber of the person]  \nSummary: [Summary text for rootcause_analysis]  \nJoining Information: [Joining information of the person, e.g. “today 5:00pm”, “25th October 2025”, “tomorrow 9:00am”]\n\n\nNote: Convert the Joining Information into standard ISO date and time format (YYYY-MM-DD HH:MM:SS) before saving in the database.\n\n🧩 Conditional Logic & Actions\n✅ Condition 1 — When User Provides Name, Phone Number, Summary, and Joining Information\n\nIntent: Save the Root Cause Analysis summary and joining information for the provided person.\n\nActions:\n\nRead the crudsupabase table using the provided Name.\n\nFind the matching record using the phonenumber.\n\nDo not update using the Name directly — use phonenumber as the key.\n\nUpdate the row in the following columns:\n\nrootcause_analysis → with the provided Summary\n\njoining_information → with the standardized date-time value\n\nResponse (after successful update):\n\nThe Root Cause Analysis summary has been saved successfully.\nWould you like to send a follow-up health message to the respective user? (Yes/No)\n\n💬 Condition 2 — If User Replies “Yes”\n\nIntent: Send a follow-up health reminder message to the respective user.\n\nActions:\n\nRetrieve the phonenumber from the previously updated record.\n\nUse the Call_details MCP to send the following message to that number:\n\n💪 Hi [Name], this is a gentle reminder from your Root Cause Analysis follow-up.  \nPlease remember to take your routine health tests such as:\n- Blood Sugar Test  \n- Lipid Profile  \n- Thyroid Function Test  \n- Complete Blood Count (CBC)  \n- Vitamin D & B12 Levels  \n\nIf you’re in a weight loss or gain program, please submit your respective blood test or health check-up reports to help us track your progress and ensure your wellness goals are on the right path. 🩺\n\n\nResponse (after message sent):\n\nThe health follow-up message has been sent successfully to [phonenumber].\n\n🚫 Condition 3 — If User Replies “No”\n\nIntent: End the flow without sending any message.\n\nAction:\n\nOkay, no follow-up message will be sent.assistant.","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}},"endNode":{"id":"openaiAgentSDKNode-1770014706694","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"Root cause call summary","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770014848256","url":"https://supabase-crud.simplita.ai/mcp","name":"supabase","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770014857040","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"Call_details","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"","agentSDKType":"agent_as_tool","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are a helpful AI a🤖 SYSTEM INSTRUCTION — ROOT CAUSE ANALYSIS CALL MANAGEMENT AGENT\n\nYou are a helpful Assistant.\nYour task is to manage and update Root Cause Analysis call summaries in the Supabase database.\n\n⚙️ Configuration\n\nTool: CRUD MCP Tool\nDatabase Table: crudsupabase\nColumns Used:\nid_value, Name, phonenumber, orientation_call, rootcause_analysis, joining_information\n\n📥 Input Format (from User)\n\nThe user will provide input in the following structure:\n\ntitle is this : Root Cause Analysis  \nName: [Name of the person]  \nPhone Number: [phonenumber of the person]  \nSummary: [Summary text for rootcause_analysis]  \nJoining Information: [Joining information of the person, e.g. “today 5:00pm”, “25th October 2025”, “tomorrow 9:00am”]\n\n\nNote: Convert the Joining Information into standard ISO date and time format (YYYY-MM-DD HH:MM:SS) before saving in the database.\n\n🧩 Conditional Logic & Actions\n✅ Condition 1 — When User Provides Name, Phone Number, Summary, and Joining Information\n\nIntent: Save the Root Cause Analysis summary and joining information for the provided person.\n\nActions:\n\nRead the crudsupabase table using the provided Name.\n\nFind the matching record using the phonenumber.\n\nDo not update using the Name directly — use phonenumber as the key.\n\nUpdate the row in the following columns:\n\nrootcause_analysis → with the provided Summary\n\njoining_information → with the standardized date-time value\n\nResponse (after successful update):\n\nThe Root Cause Analysis summary has been saved successfully.\nWould you like to send a follow-up health message to the respective user? (Yes/No)\n\n💬 Condition 2 — If User Replies “Yes”\n\nIntent: Send a follow-up health reminder message to the respective user.\n\nActions:\n\nRetrieve the phonenumber from the previously updated record.\n\nUse the Call_details MCP to send the following message to that number:\n\n💪 Hi [Name], this is a gentle reminder from your Root Cause Analysis follow-up.  \nPlease remember to take your routine health tests such as:\n- Blood Sugar Test  \n- Lipid Profile  \n- Thyroid Function Test  \n- Complete Blood Count (CBC)  \n- Vitamin D & B12 Levels  \n\nIf you’re in a weight loss or gain program, please submit your respective blood test or health check-up reports to help us track your progress and ensure your wellness goals are on the right path. 🩺\n\n\nResponse (after message sent):\n\nThe health follow-up message has been sent successfully to [phonenumber].\n\n🚫 Condition 3 — If User Replies “No”\n\nIntent: End the flow without sending any message.\n\nAction:\n\nOkay, no follow-up message will be sent.assistant.","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}}};
    
    if (typeof window !== 'undefined') {
      // SECURITY: Store SANITIZED workflow nodes in window context (remove API keys)
      // Sanitize each node individually to ensure all sensitive data is removed
      const sanitizedNodes = [{"id":"openaiAgentSDKNode-1770014706694","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"Root cause call summary","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770014848256","url":"https://supabase-crud.simplita.ai/mcp","name":"supabase","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770014857040","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"Call_details","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"","agentSDKType":"agent_as_tool","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are a helpful AI a🤖 SYSTEM INSTRUCTION — ROOT CAUSE ANALYSIS CALL MANAGEMENT AGENT\n\nYou are a helpful Assistant.\nYour task is to manage and update Root Cause Analysis call summaries in the Supabase database.\n\n⚙️ Configuration\n\nTool: CRUD MCP Tool\nDatabase Table: crudsupabase\nColumns Used:\nid_value, Name, phonenumber, orientation_call, rootcause_analysis, joining_information\n\n📥 Input Format (from User)\n\nThe user will provide input in the following structure:\n\ntitle is this : Root Cause Analysis  \nName: [Name of the person]  \nPhone Number: [phonenumber of the person]  \nSummary: [Summary text for rootcause_analysis]  \nJoining Information: [Joining information of the person, e.g. “today 5:00pm”, “25th October 2025”, “tomorrow 9:00am”]\n\n\nNote: Convert the Joining Information into standard ISO date and time format (YYYY-MM-DD HH:MM:SS) before saving in the database.\n\n🧩 Conditional Logic & Actions\n✅ Condition 1 — When User Provides Name, Phone Number, Summary, and Joining Information\n\nIntent: Save the Root Cause Analysis summary and joining information for the provided person.\n\nActions:\n\nRead the crudsupabase table using the provided Name.\n\nFind the matching record using the phonenumber.\n\nDo not update using the Name directly — use phonenumber as the key.\n\nUpdate the row in the following columns:\n\nrootcause_analysis → with the provided Summary\n\njoining_information → with the standardized date-time value\n\nResponse (after successful update):\n\nThe Root Cause Analysis summary has been saved successfully.\nWould you like to send a follow-up health message to the respective user? (Yes/No)\n\n💬 Condition 2 — If User Replies “Yes”\n\nIntent: Send a follow-up health reminder message to the respective user.\n\nActions:\n\nRetrieve the phonenumber from the previously updated record.\n\nUse the Call_details MCP to send the following message to that number:\n\n💪 Hi [Name], this is a gentle reminder from your Root Cause Analysis follow-up.  \nPlease remember to take your routine health tests such as:\n- Blood Sugar Test  \n- Lipid Profile  \n- Thyroid Function Test  \n- Complete Blood Count (CBC)  \n- Vitamin D & B12 Levels  \n\nIf you’re in a weight loss or gain program, please submit your respective blood test or health check-up reports to help us track your progress and ensure your wellness goals are on the right path. 🩺\n\n\nResponse (after message sent):\n\nThe health follow-up message has been sent successfully to [phonenumber].\n\n🚫 Condition 3 — If User Replies “No”\n\nIntent: End the flow without sending any message.\n\nAction:\n\nOkay, no follow-up message will be sent.assistant.","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}}];
      
      (window as any).__currentWorkflowNodes = sanitizedNodes;
      (window as any).__flowChainMetadata = {
        chainId: 'flow_openaiAgentSDKNode-1770014706694_1771079854967',
        currentChainNodes: sanitizedNodes,
        nodeCount: 1
      };
      console.log('🔗 Workflow nodes made available globally: 1 nodes');
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
      
    // Process with OpenAI Agent SDK (Single Input Mode)
    step1Result = '';
    
    // 🆕 BUILD TARGET AGENT CONFIGURATIONS AT RUNTIME (for cross-workflow handoff)
    // CRITICAL FIX: Use workflowRegistry.allNodes instead of context.allNodes
    // This allows orchestrator agents to find sub-agents in other workflows
    const targetAgentConfigs: Record<string, any> = {};
    
    
    
    try {
      // 🚫 CHECK: Skip if this node was already executed via handoff (CLIENT-SIDE ONLY)
      if (typeof window !== 'undefined' && window.__executedNodes && window.__executedNodes.has('openaiAgentSDKNode-1770014706694')) {
        console.log('⏭Skipping node (already executed via handoff):', 'openaiAgentSDKNode-1770014706694');
        
        // Get the result from dataFlow if available
        const existingResult = dataFlow.getByNodeId('openaiAgentSDKNode-1770014706694');
        if (existingResult) {
          step1Result = existingResult;
        } else {
          step1Result = 'Node already executed via handoff';
        }
        
        // Remove from executed set for next workflow run (CLIENT-SIDE ONLY)
        if (typeof window !== 'undefined' && window.__executedNodes) {
          window.__executedNodes.delete('openaiAgentSDKNode-1770014706694');
        }
      } else {
      let aiInput = '';
      
      
      // Single input processing (existing logic - UNCHANGED)
      
        // No user prompt provided - use previous step data
        let processedInput = null;
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
            const agentId = 'agent-1771079854974';
            const userId = 'user-1771079854974';
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
          instructions: `You are a helpful AI a🤖 SYSTEM INSTRUCTION — ROOT CAUSE ANALYSIS CALL MANAGEMENT AGENT

You are a helpful Assistant.
Your task is to manage and update Root Cause Analysis call summaries in the Supabase database.

⚙️ Configuration

Tool: CRUD MCP Tool
Database Table: crudsupabase
Columns Used:
id_value, Name, phonenumber, orientation_call, rootcause_analysis, joining_information

📥 Input Format (from User)

The user will provide input in the following structure:

title is this : Root Cause Analysis  
Name: [Name of the person]  
Phone Number: [phonenumber of the person]  
Summary: [Summary text for rootcause_analysis]  
Joining Information: [Joining information of the person, e.g. “today 5:00pm”, “25th October 2025”, “tomorrow 9:00am”]


Note: Convert the Joining Information into standard ISO date and time format (YYYY-MM-DD HH:MM:SS) before saving in the database.

🧩 Conditional Logic & Actions
✅ Condition 1 — When User Provides Name, Phone Number, Summary, and Joining Information

Intent: Save the Root Cause Analysis summary and joining information for the provided person.

Actions:

Read the crudsupabase table using the provided Name.

Find the matching record using the phonenumber.

Do not update using the Name directly — use phonenumber as the key.

Update the row in the following columns:

rootcause_analysis → with the provided Summary

joining_information → with the standardized date-time value

Response (after successful update):

The Root Cause Analysis summary has been saved successfully.
Would you like to send a follow-up health message to the respective user? (Yes/No)

💬 Condition 2 — If User Replies “Yes”

Intent: Send a follow-up health reminder message to the respective user.

Actions:

Retrieve the phonenumber from the previously updated record.

Use the Call_details MCP to send the following message to that number:

💪 Hi [Name], this is a gentle reminder from your Root Cause Analysis follow-up.  
Please remember to take your routine health tests such as:
- Blood Sugar Test  
- Lipid Profile  
- Thyroid Function Test  
- Complete Blood Count (CBC)  
- Vitamin D & B12 Levels  

If you’re in a weight loss or gain program, please submit your respective blood test or health check-up reports to help us track your progress and ensure your wellness goals are on the right path. 🩺


Response (after message sent):

The health follow-up message has been sent successfully to [phonenumber].

🚫 Condition 3 — If User Replies “No”

Intent: End the flow without sending any message.

Action:

Okay, no follow-up message will be sent.assistant.`,
          temperature: 0.7,
          max_tokens: 1000,
          apiKey: effectiveApiKey,
          agentType: 'agent_as_tool',
          selected_tools: [],
          tool_configs: {},
          tool_settings: {"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},
          mcp_servers: [{"id":"custom_mcp_1770014848256","url":"https://supabase-crud.simplita.ai/mcp","name":"supabase","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770014857040","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"Call_details","enabled":true,"description":"Custom MCP Server"}],
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
          const outgoingEdges = workflowEdges.filter((e: any) => e.source === 'openaiAgentSDKNode-1770014706694');
          
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
          const agentId = 'agent-1771079854974';
          const userId = 'user-1771079854974';
          const sessionId = 'session-1771079854974';
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
          const outgoingEdges = workflowEdges.filter((e: any) => e.source === 'openaiAgentSDKNode-1770014706694');
          
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
              step1Result = targetAgentResult.content || targetAgentResult.text || targetAgentResult.message || 'Target agent response';
            } else {
              // TOOL CALL MODE: Combine results, orchestrator continues
              step1Result = {
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
            step1Result = {
              handoffCompleted: false,
              sourceAgent: result.message,
              targetAgent: result.target_agent,
              error: 'Target agent execution failed',
              handoffReason: result.reason
            };
          }
        } catch (handoffError) {
          console.error('Handoff error:', handoffError);
          step1Result = {
            handoffCompleted: false,
            sourceAgent: result.message,
            targetAgent: result.target_agent,
            error: handoffError instanceof Error ? handoffError.message : String(handoffError),
            handoffReason: result.reason
          };
        }
      } else {
        // Normal response (no handoff)
        step1Result = result.content || result.text || result.message || 'AI response received';
      }
      
      // 📊 CRITICAL: Store result in flowResults for dataFlow access
      if (!flowResults.nodeResults) flowResults.nodeResults = {};
      if (!flowResults.variables) flowResults.variables = {};
      if (!flowResults.aiResponses) flowResults.aiResponses = {};
      
      // Generate safe display name at runtime
      const displayName = "Root_cause_call_summary";
      
      // Store in nodeResults for dataFlow.getByNodeId()
      flowResults.nodeResults['openaiAgentSDKNode-1770014706694'] = {
        nodeId: 'openaiAgentSDKNode-1770014706694',
        nodeType: 'openaiAgentSDKNode',
        stepNumber: (flowResults.stepCounter || 0) + 1,
        displayName: displayName,
        data: step1Result,
        timestamp: new Date().toISOString(),
        success: true
      };
      
      // Store in variables for dataFlow.get()
      flowResults.variables[displayName] = step1Result;
      flowResults.aiResponses[displayName] = step1Result;
      
      // Store at top-level for direct access
      flowResults[displayName] = step1Result;

      // Store under configured resultVariable if provided (e.g., sdkResult)
      const resultVariableName = "sdkResult";
      if (resultVariableName) {
        flowResults.variables[resultVariableName] = step1Result;
        flowResults.aiResponses[resultVariableName] = step1Result;
        flowResults[resultVariableName] = step1Result;
      }
      
      // Update current/previous for dataFlow.current() and dataFlow.previous()
      flowResults.previousResult = flowResults.currentResult;
      flowResults.currentResult = step1Result;
      
      // Increment step counter
      flowResults.stepCounter = (flowResults.stepCounter || 0) + 1;
      }
      
    } catch (error) {
      console.error('OpenAI Agent SDK error:', error);
      step1Result = 'Error: ' + (error instanceof Error ? error.message : String(error));
      flowErrors.push('OpenAI Agent SDK error in node ' + "openaiAgentSDKNode-1770014706694" + ': ' + (error instanceof Error ? error.message : String(error)));
    }
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['openaiAgentSDKNode-1770014706694'] = {
      nodeId: 'openaiAgentSDKNode-1770014706694',
      nodeType: 'openaiAgentSDKNode',
      stepNumber: 1,
      displayName: 'openaiSDKResult_openaiAgentSDKNode_1770014706694',
      data: step1Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    flowResults.aiResponses['openaiSDKResult_openaiAgentSDKNode_1770014706694'] = step1Result;
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['openaiSDKResult_openaiAgentSDKNode_1770014706694'] || typeof flowResults['openaiSDKResult_openaiAgentSDKNode_1770014706694'] === 'undefined') {
      flowResults['openaiSDKResult_openaiAgentSDKNode_1770014706694'] = step1Result;
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
      console.error('❌ Error in step 1 (openaiAgentSDKNode):', stepError);
      flowErrors.push(`Step 1 (openaiAgentSDKNode): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step1Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'openaiAgentSDKNode',
        nodeId: 'openaiAgentSDKNode-1770014706694',
        stepNumber: 1
      };
      
      currentResult = step1Result; // Update currentResult even on error
      
      // Store error result in enhanced data flow system
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['openaiAgentSDKNode-1770014706694'] = {
      nodeId: 'openaiAgentSDKNode-1770014706694',
      nodeType: 'openaiAgentSDKNode',
      stepNumber: 1,
      displayName: 'openaiSDKResult_openaiAgentSDKNode_1770014706694',
      data: step1Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    flowResults.aiResponses['openaiSDKResult_openaiAgentSDKNode_1770014706694'] = step1Result;
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['openaiSDKResult_openaiAgentSDKNode_1770014706694'] || typeof flowResults['openaiSDKResult_openaiAgentSDKNode_1770014706694'] === 'undefined') {
      flowResults['openaiSDKResult_openaiAgentSDKNode_1770014706694'] = step1Result;
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
      if ('flow_openaiAgentSDKNode-1770014706694_1771079854967'.includes('button')) {
        // Extract button node information from chain
        const buttonNodes = Object.values(flowResults.nodeResults || {}).filter(
          (result: any) => result.nodeType === 'button'
        );
        
        buttonNodes.forEach((buttonNode: any) => {
          // Store chain ID mapped to button element ID
          if (buttonNode.elementId) {
            (window as any).buttonChainRegistry[buttonNode.elementId] = 'flow_openaiAgentSDKNode-1770014706694_1771079854967';
            console.log(`🔗 Registered button chain: ${buttonNode.elementId} → flow_openaiAgentSDKNode-1770014706694_1771079854967`);
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
        detail: { flowResults, chainId: 'flow_openaiAgentSDKNode-1770014706694_1771079854967' } 
      }));
      (window as any).dispatchEvent(new CustomEvent('flowExecutionCompleted', { 
        detail: { flowResults, chainId: 'flow_openaiAgentSDKNode-1770014706694_1771079854967' } 
      }));
      console.log("📡 Dispatched workflow completion events");
    }
    
    return {
      success: true,
      results: flowResults,
      errors: flowErrors,
      chainId: 'flow_openaiAgentSDKNode-1770014706694_1771079854967'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) || 'Unknown error';
    console.error('❌ Flow chain execution error:', error);
    return {
      success: false,
      results: flowResults,
      errors: [...flowErrors, errorMessage],
      chainId: 'flow_openaiAgentSDKNode-1770014706694_1771079854967'
    };
  }
};







// Register workflow nodes in global registry for cross-workflow node lookups
if (workflowRegistry && workflowRegistry.allNodes) {
  const workflowNodes = [{"id":"telegram-inbound-1770014553742","nodeType":"telegram-inbound","config":{"id":"telegram-inbound-1770014553742","label":"Telegram Inbound","inputs":{"Bot Token":"static:"},"botToken":"","webhookUrl":"https://devapp.simplita.in/api/webhooks/telegram/telegram-inbound-1770014553742","credentialId":"943190dd-85b5-418c-a744-c4f0bdd05514","credentialName":"Gopinath_inbound","isWebhookRegistered":false}},{"id":"openaiAgentSDKNode-1770014563018","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"OpenAI Agent","model":"gpt-4.1-2025-04-14","tools":[],"apiKey":"","userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[],"querySource":"","temperature":0.7,"user_prompt":"{{messageText}}","agentSDKType":"orchestrator","credentialId":"","enableMemory":false,"handoff_mode":"tool_call","instructions":"You are the Orchestrator Agent, responsible for routing messages to specialized sub-agents based on intent.\nYour role is not to answer user questions directly — your job is to analyze the message and decide which agent should handle it.\n\nWhen a message arrives:\n\nIf it contains keywords or context related to “orientation call”, “onboarding call”, “introduction session”, or “training session”, route it to the Orientation Call Agent.\n\nIf it contains keywords or context related to “root cause”, “issue analysis”, “incident report”, “problem summary”, or “troubleshooting”, route it to the Root Cause Call Agent.\n\nIf none of the above intents are found, respond with:\n\n“No specific keywords are matched. Please use appropriate keywords.”","tool_configs":{},"queryVariable":"","tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"variableInput":"","openai_api_key":"process.env.OPENAI_API_KEY","resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":true,"handoff_targets":[{"agent_label":"Orientation call Summary","agent_node_id":"openaiAgentSDKNode-1770014701913","agent_description":"OpenAI Agent application","handoff_instructions":"Transfer to Orientation call Summary for specialized assistance"},{"agent_label":"Root cause call summary","agent_node_id":"openaiAgentSDKNode-1770014706694","agent_description":"OpenAI Agent application","handoff_instructions":"Transfer to Root cause call summary for specialized assistance"}],"memoryTableName":"agent_interactions","selectedDataSources":[],"useStoredCredential":false,"auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}},{"id":"telegram-send-message-1770014570163","nodeType":"Telegram Send Message","config":{"fields":[{"id":"bot_token","name":"Bot Token"},{"id":"chat_id","name":"Chat ID"},{"id":"text","name":"Message Text"},{"id":"parse_mode","name":"Parse Mode"},{"id":"media_type","name":"Media Type"},{"id":"media_url","name":"Media URL"},{"id":"media_caption","name":"Media Caption"}],"inputs":{"Chat ID":"static:{{chatId}}","Bot Token":"static:","Media URL":"static:","Media Type":"static:none","Parse Mode":"static:HTML","Message Text":"static:{{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770014563018\")}}","Media Caption":"static:"},"botToken":"","mediaUrl":"","mediaType":"none","parseMode":"HTML","sendMedia":false,"messageText":"{{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770014563018\")}}","credentialId":"99bc673e-a01f-4d8d-9922-35efd8378449","mediaCaption":"","credentialName":"Gopinath_Telegramsend","selectedMethod":"telegram_send_message"}},{"id":"openaiAgentSDKNode-1770014701913","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"Orientation call Summary","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770014783566","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"sendform","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770014789694","url":"https://supabase-crud.simplita.ai/mcp","name":"crud","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"","agentSDKType":"agent_as_tool","credentialId":"","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are a helpful Assistant.\nYour task is to manage and update orientation call summaries in the Supabase database and optionally send a Google Form link based on user confirmation.\nConfiguration\nTool: CRUD MCP Tool\nDatabase Table: crudsupabase\nColumns Used: id_value, Name, phonenumber, orientation_call\nInput Format (from User)\nThe user will provide input as:\nName: [Name of the person]\nSummary: [Summary text for orientation call]\nConditional Logic and Actions:\nCondition 1 — When User Provides Name and Summary\nIntent: Save the orientation call summary for the provided person.\nActions:\nRead the crudsupabase table using the provided Name.\nFind the matching id_value and phonenumber.\nDo not update using the Name directly.\nUse id_value to update the row in the orientation_call column with the provided Summary.\nAfter successful update, respond with:\nThe orientation call summary has been saved successfully.\nWould you like to send the Google Form Link? (Yes/No)\nCondition 2 — If User Replies “Yes”\nIntent: Send the Google Form link to the respective user.\nActions:\nRetrieve the previously found phonenumber from the record.\nwe need to send the google form which is used to get the patient details for proceeding the next step.\nSend the Google Form link to that phone number:\nhttps://docs.google.com/forms/d/e/1FAIpQLSeJmu9Ml88E2-4Yt8gSpIGN_eKdahEM-j_TMMl7Stw4bLGGNw/viewform\nRespond with a success confirmation:\nThe Google Form link has been sent successfully to [phonenumber].\nCondition 3 — If User Replies “No”\nIntent: End the flow without sending any link.\nAction:\nRespond with:\nOkay, the Google Form link will not be sent.","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"openai_api_key":"process.env.OPENAI_API_KEY","resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","useStoredCredential":false,"auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}},{"id":"openaiAgentSDKNode-1770014706694","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"Root cause call summary","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770014848256","url":"https://supabase-crud.simplita.ai/mcp","name":"supabase","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770014857040","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"Call_details","enabled":true,"description":"Custom MCP Server"}],"temperature":0.7,"user_prompt":"","agentSDKType":"agent_as_tool","credentialId":"","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are a helpful AI a🤖 SYSTEM INSTRUCTION — ROOT CAUSE ANALYSIS CALL MANAGEMENT AGENT\n\nYou are a helpful Assistant.\nYour task is to manage and update Root Cause Analysis call summaries in the Supabase database.\n\n⚙️ Configuration\n\nTool: CRUD MCP Tool\nDatabase Table: crudsupabase\nColumns Used:\nid_value, Name, phonenumber, orientation_call, rootcause_analysis, joining_information\n\n📥 Input Format (from User)\n\nThe user will provide input in the following structure:\n\ntitle is this : Root Cause Analysis  \nName: [Name of the person]  \nPhone Number: [phonenumber of the person]  \nSummary: [Summary text for rootcause_analysis]  \nJoining Information: [Joining information of the person, e.g. “today 5:00pm”, “25th October 2025”, “tomorrow 9:00am”]\n\n\nNote: Convert the Joining Information into standard ISO date and time format (YYYY-MM-DD HH:MM:SS) before saving in the database.\n\n🧩 Conditional Logic & Actions\n✅ Condition 1 — When User Provides Name, Phone Number, Summary, and Joining Information\n\nIntent: Save the Root Cause Analysis summary and joining information for the provided person.\n\nActions:\n\nRead the crudsupabase table using the provided Name.\n\nFind the matching record using the phonenumber.\n\nDo not update using the Name directly — use phonenumber as the key.\n\nUpdate the row in the following columns:\n\nrootcause_analysis → with the provided Summary\n\njoining_information → with the standardized date-time value\n\nResponse (after successful update):\n\nThe Root Cause Analysis summary has been saved successfully.\nWould you like to send a follow-up health message to the respective user? (Yes/No)\n\n💬 Condition 2 — If User Replies “Yes”\n\nIntent: Send a follow-up health reminder message to the respective user.\n\nActions:\n\nRetrieve the phonenumber from the previously updated record.\n\nUse the Call_details MCP to send the following message to that number:\n\n💪 Hi [Name], this is a gentle reminder from your Root Cause Analysis follow-up.  \nPlease remember to take your routine health tests such as:\n- Blood Sugar Test  \n- Lipid Profile  \n- Thyroid Function Test  \n- Complete Blood Count (CBC)  \n- Vitamin D & B12 Levels  \n\nIf you’re in a weight loss or gain program, please submit your respective blood test or health check-up reports to help us track your progress and ensure your wellness goals are on the right path. 🩺\n\n\nResponse (after message sent):\n\nThe health follow-up message has been sent successfully to [phonenumber].\n\n🚫 Condition 3 — If User Replies “No”\n\nIntent: End the flow without sending any message.\n\nAction:\n\nOkay, no follow-up message will be sent.assistant.","tool_configs":{},"tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"openai_api_key":"process.env.OPENAI_API_KEY","resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","useStoredCredential":false,"auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}}];
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
  
  
  // Execute flow_telegram-inbound-1770014553742_1771079854967
  if (!specificChainId || specificChainId === 'flow_telegram-inbound-1770014553742_1771079854967') {
    
    // ✅ CRITICAL FIX: This is a webhook-triggered workflow (telegram-inbound)
    // It should ONLY execute when triggered by its specific webhook, NOT on page load
    if (triggerData && triggerData.trigger === 'page-load') {
      results['flow_telegram-inbound-1770014553742_1771079854967'] = { 
        success: false, 
        skipped: true, 
        reason: 'Webhook workflow should not run on page load',
        chainId: 'flow_telegram-inbound-1770014553742_1771079854967',
        webhookType: 'telegram-inbound',
        actualTrigger: triggerData.trigger
      };
      // Don't return here, just skip to next workflow
    } else {
      // Proceed with webhook workflow execution
      try {
        const result_flow_telegram_inbound_1770014553742_1771079854967 = await executeFlowChain_flow_telegram_inbound_1770014553742_1771079854967(triggerData);
        results['flow_telegram-inbound-1770014553742_1771079854967'] = result_flow_telegram_inbound_1770014553742_1771079854967;
        
        if (!result_flow_telegram_inbound_1770014553742_1771079854967.success) {
          console.error('❌ Chain flow_telegram-inbound-1770014553742_1771079854967 failed:', result_flow_telegram_inbound_1770014553742_1771079854967.errors);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error) || 'Unknown error';
        console.error('💥 Error executing flow flow_telegram-inbound-1770014553742_1771079854967:', error);
        results['flow_telegram-inbound-1770014553742_1771079854967'] = { success: false, error: errorMessage, chainId: 'flow_telegram-inbound-1770014553742_1771079854967', results: {}, errors: [errorMessage] };
      }
    }
  }

  // Execute flow_openaiAgentSDKNode-1770014701913_1771079854967
  if (!specificChainId || specificChainId === 'flow_openaiAgentSDKNode-1770014701913_1771079854967') {
    
    // For script-event or other trigger types, use existing logic
    const triggerType = triggerData?.trigger || 'manual';
    const isPageLoadTrigger = triggerType === 'page-load';
    const isButtonOrFormChain = ['button', 'form', 'script-event'].includes('openaiAgentSDKNode');
    
    // Debug logging (only in development)
    const DEBUG_FLOW_SYSTEM = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
    
    if (isButtonOrFormChain && isPageLoadTrigger && !specificChainId) {
      results['flow_openaiAgentSDKNode_1770014701913_1771079854967'] = { 
        success: false, 
        skipped: true, 
        reason: 'Button/Form workflow should not run on page load',
        chainId: 'flow_openaiAgentSDKNode_1770014701913_1771079854967',
        triggerType: triggerType,  // FIXED: Use actual triggerType
        workflowType: 'openaiAgentSDKNode',
        actualTrigger: triggerType
      };
      return; // Explicit early return
    } else {
      // Proceed with workflow execution
      try {
        const result_flow_openaiAgentSDKNode_1770014701913_1771079854967 = await executeFlowChain_flow_openaiAgentSDKNode_1770014701913_1771079854967(triggerData);
        results['flow_openaiAgentSDKNode_1770014701913_1771079854967'] = result_flow_openaiAgentSDKNode_1770014701913_1771079854967;
        
        if (!result_flow_openaiAgentSDKNode_1770014701913_1771079854967.success) {
          if (DEBUG_FLOW_SYSTEM) {
            console.error('❌ Chain flow_openaiAgentSDKNode_1770014701913_1771079854967 failed:', result_flow_openaiAgentSDKNode_1770014701913_1771079854967.errors);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error) || 'Unknown error';
        if (DEBUG_FLOW_SYSTEM) {
          console.error('💥 Error executing flow flow_openaiAgentSDKNode_1770014701913_1771079854967:', error);
        }
        results['flow_openaiAgentSDKNode_1770014701913_1771079854967'] = { success: false, error: errorMessage, chainId: 'flow_openaiAgentSDKNode_1770014701913_1771079854967', results: {}, errors: [errorMessage] };
      }
    }
    
  }

  // Execute flow_openaiAgentSDKNode-1770014706694_1771079854967
  if (!specificChainId || specificChainId === 'flow_openaiAgentSDKNode-1770014706694_1771079854967') {
    
    // For script-event or other trigger types, use existing logic
    const triggerType = triggerData?.trigger || 'manual';
    const isPageLoadTrigger = triggerType === 'page-load';
    const isButtonOrFormChain = ['button', 'form', 'script-event'].includes('openaiAgentSDKNode');
    
    // Debug logging (only in development)
    const DEBUG_FLOW_SYSTEM = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
    
    if (isButtonOrFormChain && isPageLoadTrigger && !specificChainId) {
      results['flow_openaiAgentSDKNode_1770014706694_1771079854967'] = { 
        success: false, 
        skipped: true, 
        reason: 'Button/Form workflow should not run on page load',
        chainId: 'flow_openaiAgentSDKNode_1770014706694_1771079854967',
        triggerType: triggerType,  // FIXED: Use actual triggerType
        workflowType: 'openaiAgentSDKNode',
        actualTrigger: triggerType
      };
      return; // Explicit early return
    } else {
      // Proceed with workflow execution
      try {
        const result_flow_openaiAgentSDKNode_1770014706694_1771079854967 = await executeFlowChain_flow_openaiAgentSDKNode_1770014706694_1771079854967(triggerData);
        results['flow_openaiAgentSDKNode_1770014706694_1771079854967'] = result_flow_openaiAgentSDKNode_1770014706694_1771079854967;
        
        if (!result_flow_openaiAgentSDKNode_1770014706694_1771079854967.success) {
          if (DEBUG_FLOW_SYSTEM) {
            console.error('❌ Chain flow_openaiAgentSDKNode_1770014706694_1771079854967 failed:', result_flow_openaiAgentSDKNode_1770014706694_1771079854967.errors);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error) || 'Unknown error';
        if (DEBUG_FLOW_SYSTEM) {
          console.error('💥 Error executing flow flow_openaiAgentSDKNode_1770014706694_1771079854967:', error);
        }
        results['flow_openaiAgentSDKNode_1770014706694_1771079854967'] = { success: false, error: errorMessage, chainId: 'flow_openaiAgentSDKNode_1770014706694_1771079854967', results: {}, errors: [errorMessage] };
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
    totalChains: 3,
    successfulChains: Object.values(results).filter((r: any) => r.success).length
  };
};

const getFlowChainInfo = (): any[] => {
  return [
  {
    "id": "flow_telegram-inbound-1770014553742_1771079854967",
    "nodeTypes": [
      "telegram-inbound",
      "openaiAgentSDKNode",
      "Telegram Send Message"
    ],
    "nodeCount": 3,
    "chainType": "linear",
    "startNode": {
      "id": "telegram-inbound-1770014553742",
      "nodeType": "telegram-inbound",
      "config": {
        "id": "telegram-inbound-1770014553742",
        "label": "Telegram Inbound",
        "inputs": {
          "Bot Token": "static:"
        },
        "botToken": "",
        "webhookUrl": "https://devapp.simplita.in/api/webhooks/telegram/telegram-inbound-1770014553742",
        "credentialId": "943190dd-85b5-418c-a744-c4f0bdd05514",
        "credentialName": "Gopinath_inbound",
        "isWebhookRegistered": false
      }
    },
    "endNode": {
      "id": "telegram-send-message-1770014570163",
      "nodeType": "Telegram Send Message",
      "config": {
        "fields": [
          {
            "id": "bot_token",
            "name": "Bot Token"
          },
          {
            "id": "chat_id",
            "name": "Chat ID"
          },
          {
            "id": "text",
            "name": "Message Text"
          },
          {
            "id": "parse_mode",
            "name": "Parse Mode"
          },
          {
            "id": "media_type",
            "name": "Media Type"
          },
          {
            "id": "media_url",
            "name": "Media URL"
          },
          {
            "id": "media_caption",
            "name": "Media Caption"
          }
        ],
        "inputs": {
          "Chat ID": "static:{{chatId}}",
          "Bot Token": "static:",
          "Media URL": "static:",
          "Media Type": "static:none",
          "Parse Mode": "static:HTML",
          "Message Text": "static:{{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770014563018\")}}",
          "Media Caption": "static:"
        },
        "botToken": "",
        "mediaUrl": "",
        "mediaType": "none",
        "parseMode": "HTML",
        "sendMedia": false,
        "messageText": "{{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770014563018\")}}",
        "credentialId": "99bc673e-a01f-4d8d-9922-35efd8378449",
        "mediaCaption": "",
        "credentialName": "Gopinath_Telegramsend",
        "selectedMethod": "telegram_send_message"
      }
    },
    "nodes": [
      {
        "id": "telegram-inbound-1770014553742",
        "nodeType": "telegram-inbound",
        "config": {
          "id": "telegram-inbound-1770014553742",
          "label": "Telegram Inbound",
          "inputs": {
            "Bot Token": "static:"
          },
          "botToken": "",
          "webhookUrl": "https://devapp.simplita.in/api/webhooks/telegram/telegram-inbound-1770014553742",
          "credentialId": "943190dd-85b5-418c-a744-c4f0bdd05514",
          "credentialName": "Gopinath_inbound",
          "isWebhookRegistered": false
        }
      },
      {
        "id": "openaiAgentSDKNode-1770014563018",
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
          "mcp_servers": [],
          "querySource": "",
          "temperature": 0.7,
          "user_prompt": "{{messageText}}",
          "agentSDKType": "orchestrator",
          "enableMemory": false,
          "handoff_mode": "tool_call",
          "instructions": "You are the Orchestrator Agent, responsible for routing messages to specialized sub-agents based on intent.\nYour role is not to answer user questions directly — your job is to analyze the message and decide which agent should handle it.\n\nWhen a message arrives:\n\nIf it contains keywords or context related to “orientation call”, “onboarding call”, “introduction session”, or “training session”, route it to the Orientation Call Agent.\n\nIf it contains keywords or context related to “root cause”, “issue analysis”, “incident report”, “problem summary”, or “troubleshooting”, route it to the Root Cause Call Agent.\n\nIf none of the above intents are found, respond with:\n\n“No specific keywords are matched. Please use appropriate keywords.”",
          "tool_configs": {},
          "queryVariable": "",
          "tool_settings": {
            "tool_timeout_ms": 300,
            "error_handling_mode": "graceful",
            "enable_parallel_execution": false,
            "max_tool_calls_per_request": 5
          },
          "variableInput": "",
          "resultVariable": "sdkResult",
          "selected_tools": [],
          "handoff_enabled": true,
          "handoff_targets": [
            {
              "agent_label": "Orientation call Summary",
              "agent_node_id": "openaiAgentSDKNode-1770014701913",
              "agent_description": "OpenAI Agent application",
              "handoff_instructions": "Transfer to Orientation call Summary for specialized assistance"
            },
            {
              "agent_label": "Root cause call summary",
              "agent_node_id": "openaiAgentSDKNode-1770014706694",
              "agent_description": "OpenAI Agent application",
              "handoff_instructions": "Transfer to Root cause call summary for specialized assistance"
            }
          ],
          "memoryTableName": "agent_interactions",
          "selectedDataSources": [],
          "auto_handoff_enabled": false,
          "isAgentSDKOrchestrator": false
        }
      },
      {
        "id": "telegram-send-message-1770014570163",
        "nodeType": "Telegram Send Message",
        "config": {
          "fields": [
            {
              "id": "bot_token",
              "name": "Bot Token"
            },
            {
              "id": "chat_id",
              "name": "Chat ID"
            },
            {
              "id": "text",
              "name": "Message Text"
            },
            {
              "id": "parse_mode",
              "name": "Parse Mode"
            },
            {
              "id": "media_type",
              "name": "Media Type"
            },
            {
              "id": "media_url",
              "name": "Media URL"
            },
            {
              "id": "media_caption",
              "name": "Media Caption"
            }
          ],
          "inputs": {
            "Chat ID": "static:{{chatId}}",
            "Bot Token": "static:",
            "Media URL": "static:",
            "Media Type": "static:none",
            "Parse Mode": "static:HTML",
            "Message Text": "static:{{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770014563018\")}}",
            "Media Caption": "static:"
          },
          "botToken": "",
          "mediaUrl": "",
          "mediaType": "none",
          "parseMode": "HTML",
          "sendMedia": false,
          "messageText": "{{dataFlow.getByNodeId(\"openaiAgentSDKNode-1770014563018\")}}",
          "credentialId": "99bc673e-a01f-4d8d-9922-35efd8378449",
          "mediaCaption": "",
          "credentialName": "Gopinath_Telegramsend",
          "selectedMethod": "telegram_send_message"
        }
      }
    ]
  },
  {
    "id": "flow_openaiAgentSDKNode-1770014701913_1771079854967",
    "nodeTypes": [
      "openaiAgentSDKNode"
    ],
    "nodeCount": 1,
    "chainType": "linear",
    "startNode": {
      "id": "openaiAgentSDKNode-1770014701913",
      "nodeType": "openaiAgentSDKNode",
      "config": {
        "type": "openaiAgentSDKNode",
        "label": "Orientation call Summary",
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
            "id": "custom_mcp_1770014783566",
            "url": "https://sendgoogleform-hcyuev.mcp.simplita.app/mcp",
            "name": "sendform",
            "enabled": true,
            "description": "Custom MCP Server"
          },
          {
            "id": "custom_mcp_1770014789694",
            "url": "https://supabase-crud.simplita.ai/mcp",
            "name": "crud",
            "enabled": true,
            "description": "Custom MCP Server"
          }
        ],
        "temperature": 0.7,
        "user_prompt": "",
        "agentSDKType": "agent_as_tool",
        "enableMemory": false,
        "handoff_mode": "transfer_control",
        "instructions": "You are a helpful Assistant.\nYour task is to manage and update orientation call summaries in the Supabase database and optionally send a Google Form link based on user confirmation.\nConfiguration\nTool: CRUD MCP Tool\nDatabase Table: crudsupabase\nColumns Used: id_value, Name, phonenumber, orientation_call\nInput Format (from User)\nThe user will provide input as:\nName: [Name of the person]\nSummary: [Summary text for orientation call]\nConditional Logic and Actions:\nCondition 1 — When User Provides Name and Summary\nIntent: Save the orientation call summary for the provided person.\nActions:\nRead the crudsupabase table using the provided Name.\nFind the matching id_value and phonenumber.\nDo not update using the Name directly.\nUse id_value to update the row in the orientation_call column with the provided Summary.\nAfter successful update, respond with:\nThe orientation call summary has been saved successfully.\nWould you like to send the Google Form Link? (Yes/No)\nCondition 2 — If User Replies “Yes”\nIntent: Send the Google Form link to the respective user.\nActions:\nRetrieve the previously found phonenumber from the record.\nwe need to send the google form which is used to get the patient details for proceeding the next step.\nSend the Google Form link to that phone number:\nhttps://docs.google.com/forms/d/e/1FAIpQLSeJmu9Ml88E2-4Yt8gSpIGN_eKdahEM-j_TMMl7Stw4bLGGNw/viewform\nRespond with a success confirmation:\nThe Google Form link has been sent successfully to [phonenumber].\nCondition 3 — If User Replies “No”\nIntent: End the flow without sending any link.\nAction:\nRespond with:\nOkay, the Google Form link will not be sent.",
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
    "endNode": {
      "id": "openaiAgentSDKNode-1770014701913",
      "nodeType": "openaiAgentSDKNode",
      "config": {
        "type": "openaiAgentSDKNode",
        "label": "Orientation call Summary",
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
            "id": "custom_mcp_1770014783566",
            "url": "https://sendgoogleform-hcyuev.mcp.simplita.app/mcp",
            "name": "sendform",
            "enabled": true,
            "description": "Custom MCP Server"
          },
          {
            "id": "custom_mcp_1770014789694",
            "url": "https://supabase-crud.simplita.ai/mcp",
            "name": "crud",
            "enabled": true,
            "description": "Custom MCP Server"
          }
        ],
        "temperature": 0.7,
        "user_prompt": "",
        "agentSDKType": "agent_as_tool",
        "enableMemory": false,
        "handoff_mode": "transfer_control",
        "instructions": "You are a helpful Assistant.\nYour task is to manage and update orientation call summaries in the Supabase database and optionally send a Google Form link based on user confirmation.\nConfiguration\nTool: CRUD MCP Tool\nDatabase Table: crudsupabase\nColumns Used: id_value, Name, phonenumber, orientation_call\nInput Format (from User)\nThe user will provide input as:\nName: [Name of the person]\nSummary: [Summary text for orientation call]\nConditional Logic and Actions:\nCondition 1 — When User Provides Name and Summary\nIntent: Save the orientation call summary for the provided person.\nActions:\nRead the crudsupabase table using the provided Name.\nFind the matching id_value and phonenumber.\nDo not update using the Name directly.\nUse id_value to update the row in the orientation_call column with the provided Summary.\nAfter successful update, respond with:\nThe orientation call summary has been saved successfully.\nWould you like to send the Google Form Link? (Yes/No)\nCondition 2 — If User Replies “Yes”\nIntent: Send the Google Form link to the respective user.\nActions:\nRetrieve the previously found phonenumber from the record.\nwe need to send the google form which is used to get the patient details for proceeding the next step.\nSend the Google Form link to that phone number:\nhttps://docs.google.com/forms/d/e/1FAIpQLSeJmu9Ml88E2-4Yt8gSpIGN_eKdahEM-j_TMMl7Stw4bLGGNw/viewform\nRespond with a success confirmation:\nThe Google Form link has been sent successfully to [phonenumber].\nCondition 3 — If User Replies “No”\nIntent: End the flow without sending any link.\nAction:\nRespond with:\nOkay, the Google Form link will not be sent.",
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
        "id": "openaiAgentSDKNode-1770014701913",
        "nodeType": "openaiAgentSDKNode",
        "config": {
          "type": "openaiAgentSDKNode",
          "label": "Orientation call Summary",
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
              "id": "custom_mcp_1770014783566",
              "url": "https://sendgoogleform-hcyuev.mcp.simplita.app/mcp",
              "name": "sendform",
              "enabled": true,
              "description": "Custom MCP Server"
            },
            {
              "id": "custom_mcp_1770014789694",
              "url": "https://supabase-crud.simplita.ai/mcp",
              "name": "crud",
              "enabled": true,
              "description": "Custom MCP Server"
            }
          ],
          "temperature": 0.7,
          "user_prompt": "",
          "agentSDKType": "agent_as_tool",
          "enableMemory": false,
          "handoff_mode": "transfer_control",
          "instructions": "You are a helpful Assistant.\nYour task is to manage and update orientation call summaries in the Supabase database and optionally send a Google Form link based on user confirmation.\nConfiguration\nTool: CRUD MCP Tool\nDatabase Table: crudsupabase\nColumns Used: id_value, Name, phonenumber, orientation_call\nInput Format (from User)\nThe user will provide input as:\nName: [Name of the person]\nSummary: [Summary text for orientation call]\nConditional Logic and Actions:\nCondition 1 — When User Provides Name and Summary\nIntent: Save the orientation call summary for the provided person.\nActions:\nRead the crudsupabase table using the provided Name.\nFind the matching id_value and phonenumber.\nDo not update using the Name directly.\nUse id_value to update the row in the orientation_call column with the provided Summary.\nAfter successful update, respond with:\nThe orientation call summary has been saved successfully.\nWould you like to send the Google Form Link? (Yes/No)\nCondition 2 — If User Replies “Yes”\nIntent: Send the Google Form link to the respective user.\nActions:\nRetrieve the previously found phonenumber from the record.\nwe need to send the google form which is used to get the patient details for proceeding the next step.\nSend the Google Form link to that phone number:\nhttps://docs.google.com/forms/d/e/1FAIpQLSeJmu9Ml88E2-4Yt8gSpIGN_eKdahEM-j_TMMl7Stw4bLGGNw/viewform\nRespond with a success confirmation:\nThe Google Form link has been sent successfully to [phonenumber].\nCondition 3 — If User Replies “No”\nIntent: End the flow without sending any link.\nAction:\nRespond with:\nOkay, the Google Form link will not be sent.",
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
  },
  {
    "id": "flow_openaiAgentSDKNode-1770014706694_1771079854967",
    "nodeTypes": [
      "openaiAgentSDKNode"
    ],
    "nodeCount": 1,
    "chainType": "linear",
    "startNode": {
      "id": "openaiAgentSDKNode-1770014706694",
      "nodeType": "openaiAgentSDKNode",
      "config": {
        "type": "openaiAgentSDKNode",
        "label": "Root cause call summary",
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
            "id": "custom_mcp_1770014848256",
            "url": "https://supabase-crud.simplita.ai/mcp",
            "name": "supabase",
            "enabled": true,
            "description": "Custom MCP Server"
          },
          {
            "id": "custom_mcp_1770014857040",
            "url": "https://sendgoogleform-hcyuev.mcp.simplita.app/mcp",
            "name": "Call_details",
            "enabled": true,
            "description": "Custom MCP Server"
          }
        ],
        "temperature": 0.7,
        "user_prompt": "",
        "agentSDKType": "agent_as_tool",
        "enableMemory": false,
        "handoff_mode": "transfer_control",
        "instructions": "You are a helpful AI a🤖 SYSTEM INSTRUCTION — ROOT CAUSE ANALYSIS CALL MANAGEMENT AGENT\n\nYou are a helpful Assistant.\nYour task is to manage and update Root Cause Analysis call summaries in the Supabase database.\n\n⚙️ Configuration\n\nTool: CRUD MCP Tool\nDatabase Table: crudsupabase\nColumns Used:\nid_value, Name, phonenumber, orientation_call, rootcause_analysis, joining_information\n\n📥 Input Format (from User)\n\nThe user will provide input in the following structure:\n\ntitle is this : Root Cause Analysis  \nName: [Name of the person]  \nPhone Number: [phonenumber of the person]  \nSummary: [Summary text for rootcause_analysis]  \nJoining Information: [Joining information of the person, e.g. “today 5:00pm”, “25th October 2025”, “tomorrow 9:00am”]\n\n\nNote: Convert the Joining Information into standard ISO date and time format (YYYY-MM-DD HH:MM:SS) before saving in the database.\n\n🧩 Conditional Logic & Actions\n✅ Condition 1 — When User Provides Name, Phone Number, Summary, and Joining Information\n\nIntent: Save the Root Cause Analysis summary and joining information for the provided person.\n\nActions:\n\nRead the crudsupabase table using the provided Name.\n\nFind the matching record using the phonenumber.\n\nDo not update using the Name directly — use phonenumber as the key.\n\nUpdate the row in the following columns:\n\nrootcause_analysis → with the provided Summary\n\njoining_information → with the standardized date-time value\n\nResponse (after successful update):\n\nThe Root Cause Analysis summary has been saved successfully.\nWould you like to send a follow-up health message to the respective user? (Yes/No)\n\n💬 Condition 2 — If User Replies “Yes”\n\nIntent: Send a follow-up health reminder message to the respective user.\n\nActions:\n\nRetrieve the phonenumber from the previously updated record.\n\nUse the Call_details MCP to send the following message to that number:\n\n💪 Hi [Name], this is a gentle reminder from your Root Cause Analysis follow-up.  \nPlease remember to take your routine health tests such as:\n- Blood Sugar Test  \n- Lipid Profile  \n- Thyroid Function Test  \n- Complete Blood Count (CBC)  \n- Vitamin D & B12 Levels  \n\nIf you’re in a weight loss or gain program, please submit your respective blood test or health check-up reports to help us track your progress and ensure your wellness goals are on the right path. 🩺\n\n\nResponse (after message sent):\n\nThe health follow-up message has been sent successfully to [phonenumber].\n\n🚫 Condition 3 — If User Replies “No”\n\nIntent: End the flow without sending any message.\n\nAction:\n\nOkay, no follow-up message will be sent.assistant.",
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
    "endNode": {
      "id": "openaiAgentSDKNode-1770014706694",
      "nodeType": "openaiAgentSDKNode",
      "config": {
        "type": "openaiAgentSDKNode",
        "label": "Root cause call summary",
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
            "id": "custom_mcp_1770014848256",
            "url": "https://supabase-crud.simplita.ai/mcp",
            "name": "supabase",
            "enabled": true,
            "description": "Custom MCP Server"
          },
          {
            "id": "custom_mcp_1770014857040",
            "url": "https://sendgoogleform-hcyuev.mcp.simplita.app/mcp",
            "name": "Call_details",
            "enabled": true,
            "description": "Custom MCP Server"
          }
        ],
        "temperature": 0.7,
        "user_prompt": "",
        "agentSDKType": "agent_as_tool",
        "enableMemory": false,
        "handoff_mode": "transfer_control",
        "instructions": "You are a helpful AI a🤖 SYSTEM INSTRUCTION — ROOT CAUSE ANALYSIS CALL MANAGEMENT AGENT\n\nYou are a helpful Assistant.\nYour task is to manage and update Root Cause Analysis call summaries in the Supabase database.\n\n⚙️ Configuration\n\nTool: CRUD MCP Tool\nDatabase Table: crudsupabase\nColumns Used:\nid_value, Name, phonenumber, orientation_call, rootcause_analysis, joining_information\n\n📥 Input Format (from User)\n\nThe user will provide input in the following structure:\n\ntitle is this : Root Cause Analysis  \nName: [Name of the person]  \nPhone Number: [phonenumber of the person]  \nSummary: [Summary text for rootcause_analysis]  \nJoining Information: [Joining information of the person, e.g. “today 5:00pm”, “25th October 2025”, “tomorrow 9:00am”]\n\n\nNote: Convert the Joining Information into standard ISO date and time format (YYYY-MM-DD HH:MM:SS) before saving in the database.\n\n🧩 Conditional Logic & Actions\n✅ Condition 1 — When User Provides Name, Phone Number, Summary, and Joining Information\n\nIntent: Save the Root Cause Analysis summary and joining information for the provided person.\n\nActions:\n\nRead the crudsupabase table using the provided Name.\n\nFind the matching record using the phonenumber.\n\nDo not update using the Name directly — use phonenumber as the key.\n\nUpdate the row in the following columns:\n\nrootcause_analysis → with the provided Summary\n\njoining_information → with the standardized date-time value\n\nResponse (after successful update):\n\nThe Root Cause Analysis summary has been saved successfully.\nWould you like to send a follow-up health message to the respective user? (Yes/No)\n\n💬 Condition 2 — If User Replies “Yes”\n\nIntent: Send a follow-up health reminder message to the respective user.\n\nActions:\n\nRetrieve the phonenumber from the previously updated record.\n\nUse the Call_details MCP to send the following message to that number:\n\n💪 Hi [Name], this is a gentle reminder from your Root Cause Analysis follow-up.  \nPlease remember to take your routine health tests such as:\n- Blood Sugar Test  \n- Lipid Profile  \n- Thyroid Function Test  \n- Complete Blood Count (CBC)  \n- Vitamin D & B12 Levels  \n\nIf you’re in a weight loss or gain program, please submit your respective blood test or health check-up reports to help us track your progress and ensure your wellness goals are on the right path. 🩺\n\n\nResponse (after message sent):\n\nThe health follow-up message has been sent successfully to [phonenumber].\n\n🚫 Condition 3 — If User Replies “No”\n\nIntent: End the flow without sending any message.\n\nAction:\n\nOkay, no follow-up message will be sent.assistant.",
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
        "id": "openaiAgentSDKNode-1770014706694",
        "nodeType": "openaiAgentSDKNode",
        "config": {
          "type": "openaiAgentSDKNode",
          "label": "Root cause call summary",
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
              "id": "custom_mcp_1770014848256",
              "url": "https://supabase-crud.simplita.ai/mcp",
              "name": "supabase",
              "enabled": true,
              "description": "Custom MCP Server"
            },
            {
              "id": "custom_mcp_1770014857040",
              "url": "https://sendgoogleform-hcyuev.mcp.simplita.app/mcp",
              "name": "Call_details",
              "enabled": true,
              "description": "Custom MCP Server"
            }
          ],
          "temperature": 0.7,
          "user_prompt": "",
          "agentSDKType": "agent_as_tool",
          "enableMemory": false,
          "handoff_mode": "transfer_control",
          "instructions": "You are a helpful AI a🤖 SYSTEM INSTRUCTION — ROOT CAUSE ANALYSIS CALL MANAGEMENT AGENT\n\nYou are a helpful Assistant.\nYour task is to manage and update Root Cause Analysis call summaries in the Supabase database.\n\n⚙️ Configuration\n\nTool: CRUD MCP Tool\nDatabase Table: crudsupabase\nColumns Used:\nid_value, Name, phonenumber, orientation_call, rootcause_analysis, joining_information\n\n📥 Input Format (from User)\n\nThe user will provide input in the following structure:\n\ntitle is this : Root Cause Analysis  \nName: [Name of the person]  \nPhone Number: [phonenumber of the person]  \nSummary: [Summary text for rootcause_analysis]  \nJoining Information: [Joining information of the person, e.g. “today 5:00pm”, “25th October 2025”, “tomorrow 9:00am”]\n\n\nNote: Convert the Joining Information into standard ISO date and time format (YYYY-MM-DD HH:MM:SS) before saving in the database.\n\n🧩 Conditional Logic & Actions\n✅ Condition 1 — When User Provides Name, Phone Number, Summary, and Joining Information\n\nIntent: Save the Root Cause Analysis summary and joining information for the provided person.\n\nActions:\n\nRead the crudsupabase table using the provided Name.\n\nFind the matching record using the phonenumber.\n\nDo not update using the Name directly — use phonenumber as the key.\n\nUpdate the row in the following columns:\n\nrootcause_analysis → with the provided Summary\n\njoining_information → with the standardized date-time value\n\nResponse (after successful update):\n\nThe Root Cause Analysis summary has been saved successfully.\nWould you like to send a follow-up health message to the respective user? (Yes/No)\n\n💬 Condition 2 — If User Replies “Yes”\n\nIntent: Send a follow-up health reminder message to the respective user.\n\nActions:\n\nRetrieve the phonenumber from the previously updated record.\n\nUse the Call_details MCP to send the following message to that number:\n\n💪 Hi [Name], this is a gentle reminder from your Root Cause Analysis follow-up.  \nPlease remember to take your routine health tests such as:\n- Blood Sugar Test  \n- Lipid Profile  \n- Thyroid Function Test  \n- Complete Blood Count (CBC)  \n- Vitamin D & B12 Levels  \n\nIf you’re in a weight loss or gain program, please submit your respective blood test or health check-up reports to help us track your progress and ensure your wellness goals are on the right path. 🩺\n\n\nResponse (after message sent):\n\nThe health follow-up message has been sent successfully to [phonenumber].\n\n🚫 Condition 3 — If User Replies “No”\n\nIntent: End the flow without sending any message.\n\nAction:\n\nOkay, no follow-up message will be sent.assistant.",
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

