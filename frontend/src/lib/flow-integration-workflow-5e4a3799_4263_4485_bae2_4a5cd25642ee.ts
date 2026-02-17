
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






const executeFlowChain_flow_google_sheets_trigger_1770831498824_1771079854809 = async (initialData: any = {}): Promise<FlowResult> => {
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
  
  flowResults._executionId = `flow_google_sheets_trigger_1770831498824_1771079854809_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
    flowResults.originalChainData = {"id":"flow_google-sheets-trigger-1770831498824_1771079854809","nodes":[{"id":"google-sheets-trigger-1770831498824","nodeType":"google-sheets-trigger","config":{"eventType":"*","sheetName":"Form Responses 1","filterValue":"","credentialId":"efaf85fb-9ca5-4688-850e-490a6eaf953e","filterColumn":"","spreadsheetId":"1pRqhjnhwTQcb6MqtulODeDAt34f8_fjgkXz39DwQcSg","outputVariable":"sheetTriggerResult"}},{"id":"db-api-post-1770831673235","nodeType":"db-api-post","config":{"url":"/api/form/component-generated-form_vitality_form_338226625-917682082","body":"{\n  \"Age\": \"{{Age}}\",\n  \"City\": \"{{City}}\",\n  \"Name\": \"{{Name}}\",\n  \"Email\": \"{{Email}}\",\n  \"State\": \"{{State}}\",\n  \"Gender\": \"{{Gender}}\",\n  \"Mobile\": \"{{Mobile}}\",\n  \"Address\": \"{{Address}}\",\n  \"Country\": \"{{Country}}\",\n  \"Pincode\": \"{{Pincode}}\",\n  \"Occupation\": \"{{Occupation}}\"\n}","method":"POST","params":[],"apiName":"vitality_form create Database API","headers":[{"key":"Content-Type","value":"application/json"},{"key":"Authorization","value":"Bearer {{auth_token}}"}],"tableId":"vitality_form","dbMethod":"post","endpoint":"/api/form/component-generated-form_vitality_form_338226625-917682082","operation":"create","tableName":"vitality_form","description":"Create vitality_form record(s)","requestBody":"{\n  \"Age\": \"{{Age}}\",\n  \"City\": \"{{City}}\",\n  \"Name\": \"{{Name}}\",\n  \"Email\": \"{{Email}}\",\n  \"State\": \"{{State}}\",\n  \"Gender\": \"{{Gender}}\",\n  \"Mobile\": \"{{Mobile}}\",\n  \"Address\": \"{{Address}}\",\n  \"Country\": \"{{Country}}\",\n  \"Pincode\": \"{{Pincode}}\",\n  \"Occupation\": \"{{Occupation}}\"\n}","isDatabaseApi":true,"authentication":{"type":"bearer"},"resultVariable":"postVitality_formResult","apiResultVariable":"postVitality_formResult"}},{"id":"json-string-parser-1770831703679","nodeType":"json-string-parser","config":{"nodeId":"json-string-parser-1770831703679","nodeType":"json-string-parser","inputSource":"variable","outputFormat":"raw","variableInput":"{{dataFlow.getByNodeId(\"google-sheets-trigger-1770831498824\").rowData.Name}}"}},{"id":"telegram-send-message-1770832326787","nodeType":"Telegram Send Message","config":{"fields":[{"id":"bot_token","name":"Bot Token"},{"id":"chat_id","name":"Chat ID"},{"id":"text","name":"Message Text"},{"id":"parse_mode","name":"Parse Mode"},{"id":"media_type","name":"Media Type"},{"id":"media_url","name":"Media URL"},{"id":"media_caption","name":"Media Caption"}],"inputs":{"Chat ID":"static:","Bot Token":"static:","Media URL":"static:","Media Type":"static:none","Parse Mode":"static:HTML","Message Text":"static:The new patient {{dataFlow.getByNodeId(\"json-string-parser-1770831703679\")}} has been submitted their details successfully.","Media Caption":"static:"},"botToken":"","mediaUrl":"","mediaType":"none","parseMode":"HTML","sendMedia":false,"messageText":"The new patient {{dataFlow.getByNodeId(\"json-string-parser-1770831703679\")}} has been submitted their details successfully.","credentialId":"99bc673e-a01f-4d8d-9922-35efd8378449","mediaCaption":"","credentialName":"Gopinath_Telegramsend","selectedMethod":"telegram_send_message"}},{"id":"openaiAgentSDKNode-1770832397803","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"OpenAI Agent","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770832474051","url":"https://supabase-crud.simplita.ai/mcp","name":"crud supabase","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770832487339","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"send form","enabled":true,"description":"Custom MCP Server"}],"querySource":"","temperature":0.7,"user_prompt":"{{sheetTriggerResult.Name}}","agentSDKType":"orchestrator","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are an agent.\nYou will receive the output from the JSON String Parser, which contains the field name.\n\nYour Task\n\nUse the received name to fetch the corresponding phonenumber from the Supabase database using the CRUD Supabase MCP Tool.\n\nDatabase Table: crudsupabase\n\nOnce the phonenumber is retrieved, send a reply message to that number with the following text:\n\n\"Thank you for providing your details. We have successfully received it. Our Team will connect you soon\"\n\nExpected Outcome\n\nThe correct phonenumber is successfully retrieved from Supabase using the provided name.\n\nA confirmation message is sent to that phone number confirming successful form submission.You are an agent.\nYou will receive the output from the JSON String Parser, which contains the field name.\n\nYour Task\n\nUse the received name to fetch the corresponding phonenumber from the Supabase database using the CRUD Supabase MCP Tool.\n\nDatabase Table: crudsupabase\n\nOnce the phonenumber is retrieved, send a reply message to that number with the following text:\n\n\"Your form details have been submitted successfully.\"\n\nExpected Outcome\n\nThe correct phonenumber is successfully retrieved from Supabase using the provided name.\n\nA confirmation message is sent to that phone number confirming successful form submission.","tool_configs":{},"queryVariable":"","tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"variableInput":"","resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","selectedDataSources":[],"auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}}],"edges":[{"source":"google-sheets-trigger-1770831498824","target":"db-api-post-1770831673235"},{"source":"db-api-post-1770831673235","target":"json-string-parser-1770831703679"},{"source":"json-string-parser-1770831703679","target":"telegram-send-message-1770832326787"},{"source":"telegram-send-message-1770832326787","target":"openaiAgentSDKNode-1770832397803"},{"source":"page-load-1770832545541","target":"db-api-get-1770832554240"},{"source":"db-api-get-1770832554240","target":"script-event-1771006028992"},{"source":"script-event-1771006028992","target":"script-event-1771006052608"},{"source":"script-event-1771006052608","target":"script-event-1771006060937"},{"source":"script-event-1771006060937","target":"script-event-1771006085797"}],"chainType":"linear","dataFlow":[],"startNode":{"id":"google-sheets-trigger-1770831498824","nodeType":"google-sheets-trigger","config":{"eventType":"*","sheetName":"Form Responses 1","filterValue":"","credentialId":"efaf85fb-9ca5-4688-850e-490a6eaf953e","filterColumn":"","spreadsheetId":"1pRqhjnhwTQcb6MqtulODeDAt34f8_fjgkXz39DwQcSg","outputVariable":"sheetTriggerResult"}},"endNode":{"id":"openaiAgentSDKNode-1770832397803","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"OpenAI Agent","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770832474051","url":"https://supabase-crud.simplita.ai/mcp","name":"crud supabase","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770832487339","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"send form","enabled":true,"description":"Custom MCP Server"}],"querySource":"","temperature":0.7,"user_prompt":"{{sheetTriggerResult.Name}}","agentSDKType":"orchestrator","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are an agent.\nYou will receive the output from the JSON String Parser, which contains the field name.\n\nYour Task\n\nUse the received name to fetch the corresponding phonenumber from the Supabase database using the CRUD Supabase MCP Tool.\n\nDatabase Table: crudsupabase\n\nOnce the phonenumber is retrieved, send a reply message to that number with the following text:\n\n\"Thank you for providing your details. We have successfully received it. Our Team will connect you soon\"\n\nExpected Outcome\n\nThe correct phonenumber is successfully retrieved from Supabase using the provided name.\n\nA confirmation message is sent to that phone number confirming successful form submission.You are an agent.\nYou will receive the output from the JSON String Parser, which contains the field name.\n\nYour Task\n\nUse the received name to fetch the corresponding phonenumber from the Supabase database using the CRUD Supabase MCP Tool.\n\nDatabase Table: crudsupabase\n\nOnce the phonenumber is retrieved, send a reply message to that number with the following text:\n\n\"Your form details have been submitted successfully.\"\n\nExpected Outcome\n\nThe correct phonenumber is successfully retrieved from Supabase using the provided name.\n\nA confirmation message is sent to that phone number confirming successful form submission.","tool_configs":{},"queryVariable":"","tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"variableInput":"","resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","selectedDataSources":[],"auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}}};

    // Declare all step result variables
    let step1Result: any;
    let step2Result: any;
    let step3Result: any;
    let step4Result: any;
    let step5Result: any;



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
    flowResults.originalChainData = {"id":"flow_google-sheets-trigger-1770831498824_1771079854809","nodes":[{"id":"google-sheets-trigger-1770831498824","nodeType":"google-sheets-trigger","config":{"eventType":"*","sheetName":"Form Responses 1","filterValue":"","credentialId":"efaf85fb-9ca5-4688-850e-490a6eaf953e","filterColumn":"","spreadsheetId":"1pRqhjnhwTQcb6MqtulODeDAt34f8_fjgkXz39DwQcSg","outputVariable":"sheetTriggerResult"}},{"id":"db-api-post-1770831673235","nodeType":"db-api-post","config":{"url":"/api/form/component-generated-form_vitality_form_338226625-917682082","body":"{\n  \"Age\": \"{{Age}}\",\n  \"City\": \"{{City}}\",\n  \"Name\": \"{{Name}}\",\n  \"Email\": \"{{Email}}\",\n  \"State\": \"{{State}}\",\n  \"Gender\": \"{{Gender}}\",\n  \"Mobile\": \"{{Mobile}}\",\n  \"Address\": \"{{Address}}\",\n  \"Country\": \"{{Country}}\",\n  \"Pincode\": \"{{Pincode}}\",\n  \"Occupation\": \"{{Occupation}}\"\n}","method":"POST","params":[],"apiName":"vitality_form create Database API","headers":[{"key":"Content-Type","value":"application/json"},{"key":"Authorization","value":"Bearer {{auth_token}}"}],"tableId":"vitality_form","dbMethod":"post","endpoint":"/api/form/component-generated-form_vitality_form_338226625-917682082","operation":"create","tableName":"vitality_form","description":"Create vitality_form record(s)","requestBody":"{\n  \"Age\": \"{{Age}}\",\n  \"City\": \"{{City}}\",\n  \"Name\": \"{{Name}}\",\n  \"Email\": \"{{Email}}\",\n  \"State\": \"{{State}}\",\n  \"Gender\": \"{{Gender}}\",\n  \"Mobile\": \"{{Mobile}}\",\n  \"Address\": \"{{Address}}\",\n  \"Country\": \"{{Country}}\",\n  \"Pincode\": \"{{Pincode}}\",\n  \"Occupation\": \"{{Occupation}}\"\n}","isDatabaseApi":true,"authentication":{"type":"bearer"},"resultVariable":"postVitality_formResult","apiResultVariable":"postVitality_formResult"}},{"id":"json-string-parser-1770831703679","nodeType":"json-string-parser","config":{"nodeId":"json-string-parser-1770831703679","nodeType":"json-string-parser","inputSource":"variable","outputFormat":"raw","variableInput":"{{dataFlow.getByNodeId(\"google-sheets-trigger-1770831498824\").rowData.Name}}"}},{"id":"telegram-send-message-1770832326787","nodeType":"Telegram Send Message","config":{"fields":[{"id":"bot_token","name":"Bot Token"},{"id":"chat_id","name":"Chat ID"},{"id":"text","name":"Message Text"},{"id":"parse_mode","name":"Parse Mode"},{"id":"media_type","name":"Media Type"},{"id":"media_url","name":"Media URL"},{"id":"media_caption","name":"Media Caption"}],"inputs":{"Chat ID":"static:","Bot Token":"static:","Media URL":"static:","Media Type":"static:none","Parse Mode":"static:HTML","Message Text":"static:The new patient {{dataFlow.getByNodeId(\"json-string-parser-1770831703679\")}} has been submitted their details successfully.","Media Caption":"static:"},"botToken":"","mediaUrl":"","mediaType":"none","parseMode":"HTML","sendMedia":false,"messageText":"The new patient {{dataFlow.getByNodeId(\"json-string-parser-1770831703679\")}} has been submitted their details successfully.","credentialId":"99bc673e-a01f-4d8d-9922-35efd8378449","mediaCaption":"","credentialName":"Gopinath_Telegramsend","selectedMethod":"telegram_send_message"}},{"id":"openaiAgentSDKNode-1770832397803","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"OpenAI Agent","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770832474051","url":"https://supabase-crud.simplita.ai/mcp","name":"crud supabase","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770832487339","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"send form","enabled":true,"description":"Custom MCP Server"}],"querySource":"","temperature":0.7,"user_prompt":"{{sheetTriggerResult.Name}}","agentSDKType":"orchestrator","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are an agent.\nYou will receive the output from the JSON String Parser, which contains the field name.\n\nYour Task\n\nUse the received name to fetch the corresponding phonenumber from the Supabase database using the CRUD Supabase MCP Tool.\n\nDatabase Table: crudsupabase\n\nOnce the phonenumber is retrieved, send a reply message to that number with the following text:\n\n\"Thank you for providing your details. We have successfully received it. Our Team will connect you soon\"\n\nExpected Outcome\n\nThe correct phonenumber is successfully retrieved from Supabase using the provided name.\n\nA confirmation message is sent to that phone number confirming successful form submission.You are an agent.\nYou will receive the output from the JSON String Parser, which contains the field name.\n\nYour Task\n\nUse the received name to fetch the corresponding phonenumber from the Supabase database using the CRUD Supabase MCP Tool.\n\nDatabase Table: crudsupabase\n\nOnce the phonenumber is retrieved, send a reply message to that number with the following text:\n\n\"Your form details have been submitted successfully.\"\n\nExpected Outcome\n\nThe correct phonenumber is successfully retrieved from Supabase using the provided name.\n\nA confirmation message is sent to that phone number confirming successful form submission.","tool_configs":{},"queryVariable":"","tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"variableInput":"","resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","selectedDataSources":[],"auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}}],"edges":[{"source":"google-sheets-trigger-1770831498824","target":"db-api-post-1770831673235"},{"source":"db-api-post-1770831673235","target":"json-string-parser-1770831703679"},{"source":"json-string-parser-1770831703679","target":"telegram-send-message-1770832326787"},{"source":"telegram-send-message-1770832326787","target":"openaiAgentSDKNode-1770832397803"},{"source":"page-load-1770832545541","target":"db-api-get-1770832554240"},{"source":"db-api-get-1770832554240","target":"script-event-1771006028992"},{"source":"script-event-1771006028992","target":"script-event-1771006052608"},{"source":"script-event-1771006052608","target":"script-event-1771006060937"},{"source":"script-event-1771006060937","target":"script-event-1771006085797"}],"chainType":"linear","dataFlow":[],"startNode":{"id":"google-sheets-trigger-1770831498824","nodeType":"google-sheets-trigger","config":{"eventType":"*","sheetName":"Form Responses 1","filterValue":"","credentialId":"efaf85fb-9ca5-4688-850e-490a6eaf953e","filterColumn":"","spreadsheetId":"1pRqhjnhwTQcb6MqtulODeDAt34f8_fjgkXz39DwQcSg","outputVariable":"sheetTriggerResult"}},"endNode":{"id":"openaiAgentSDKNode-1770832397803","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"OpenAI Agent","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770832474051","url":"https://supabase-crud.simplita.ai/mcp","name":"crud supabase","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770832487339","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"send form","enabled":true,"description":"Custom MCP Server"}],"querySource":"","temperature":0.7,"user_prompt":"{{sheetTriggerResult.Name}}","agentSDKType":"orchestrator","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are an agent.\nYou will receive the output from the JSON String Parser, which contains the field name.\n\nYour Task\n\nUse the received name to fetch the corresponding phonenumber from the Supabase database using the CRUD Supabase MCP Tool.\n\nDatabase Table: crudsupabase\n\nOnce the phonenumber is retrieved, send a reply message to that number with the following text:\n\n\"Thank you for providing your details. We have successfully received it. Our Team will connect you soon\"\n\nExpected Outcome\n\nThe correct phonenumber is successfully retrieved from Supabase using the provided name.\n\nA confirmation message is sent to that phone number confirming successful form submission.You are an agent.\nYou will receive the output from the JSON String Parser, which contains the field name.\n\nYour Task\n\nUse the received name to fetch the corresponding phonenumber from the Supabase database using the CRUD Supabase MCP Tool.\n\nDatabase Table: crudsupabase\n\nOnce the phonenumber is retrieved, send a reply message to that number with the following text:\n\n\"Your form details have been submitted successfully.\"\n\nExpected Outcome\n\nThe correct phonenumber is successfully retrieved from Supabase using the provided name.\n\nA confirmation message is sent to that phone number confirming successful form submission.","tool_configs":{},"queryVariable":"","tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"variableInput":"","resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","selectedDataSources":[],"auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}}};
    
    if (typeof window !== 'undefined') {
      // SECURITY: Store SANITIZED workflow nodes in window context (remove API keys)
      // Sanitize each node individually to ensure all sensitive data is removed
      const sanitizedNodes = [{"id":"google-sheets-trigger-1770831498824","nodeType":"google-sheets-trigger","config":{"eventType":"*","sheetName":"Form Responses 1","filterValue":"","credentialId":"efaf85fb-9ca5-4688-850e-490a6eaf953e","filterColumn":"","spreadsheetId":"1pRqhjnhwTQcb6MqtulODeDAt34f8_fjgkXz39DwQcSg","outputVariable":"sheetTriggerResult"}},{"id":"db-api-post-1770831673235","nodeType":"db-api-post","config":{"url":"/api/form/component-generated-form_vitality_form_338226625-917682082","body":"{\n  \"Age\": \"{{Age}}\",\n  \"City\": \"{{City}}\",\n  \"Name\": \"{{Name}}\",\n  \"Email\": \"{{Email}}\",\n  \"State\": \"{{State}}\",\n  \"Gender\": \"{{Gender}}\",\n  \"Mobile\": \"{{Mobile}}\",\n  \"Address\": \"{{Address}}\",\n  \"Country\": \"{{Country}}\",\n  \"Pincode\": \"{{Pincode}}\",\n  \"Occupation\": \"{{Occupation}}\"\n}","method":"POST","params":[],"apiName":"vitality_form create Database API","headers":[{"key":"Content-Type","value":"application/json"},{"key":"Authorization","value":"Bearer {{auth_token}}"}],"tableId":"vitality_form","dbMethod":"post","endpoint":"/api/form/component-generated-form_vitality_form_338226625-917682082","operation":"create","tableName":"vitality_form","description":"Create vitality_form record(s)","requestBody":"{\n  \"Age\": \"{{Age}}\",\n  \"City\": \"{{City}}\",\n  \"Name\": \"{{Name}}\",\n  \"Email\": \"{{Email}}\",\n  \"State\": \"{{State}}\",\n  \"Gender\": \"{{Gender}}\",\n  \"Mobile\": \"{{Mobile}}\",\n  \"Address\": \"{{Address}}\",\n  \"Country\": \"{{Country}}\",\n  \"Pincode\": \"{{Pincode}}\",\n  \"Occupation\": \"{{Occupation}}\"\n}","isDatabaseApi":true,"authentication":{"type":"bearer"},"resultVariable":"postVitality_formResult","apiResultVariable":"postVitality_formResult"}},{"id":"json-string-parser-1770831703679","nodeType":"json-string-parser","config":{"nodeId":"json-string-parser-1770831703679","nodeType":"json-string-parser","inputSource":"variable","outputFormat":"raw","variableInput":"{{dataFlow.getByNodeId(\"google-sheets-trigger-1770831498824\").rowData.Name}}"}},{"id":"telegram-send-message-1770832326787","nodeType":"Telegram Send Message","config":{"fields":[{"id":"bot_token","name":"Bot Token"},{"id":"chat_id","name":"Chat ID"},{"id":"text","name":"Message Text"},{"id":"parse_mode","name":"Parse Mode"},{"id":"media_type","name":"Media Type"},{"id":"media_url","name":"Media URL"},{"id":"media_caption","name":"Media Caption"}],"inputs":{"Chat ID":"static:","Bot Token":"static:","Media URL":"static:","Media Type":"static:none","Parse Mode":"static:HTML","Message Text":"static:The new patient {{dataFlow.getByNodeId(\"json-string-parser-1770831703679\")}} has been submitted their details successfully.","Media Caption":"static:"},"botToken":"","mediaUrl":"","mediaType":"none","parseMode":"HTML","sendMedia":false,"messageText":"The new patient {{dataFlow.getByNodeId(\"json-string-parser-1770831703679\")}} has been submitted their details successfully.","credentialId":"99bc673e-a01f-4d8d-9922-35efd8378449","mediaCaption":"","credentialName":"Gopinath_Telegramsend","selectedMethod":"telegram_send_message"}},{"id":"openaiAgentSDKNode-1770832397803","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"OpenAI Agent","model":"gpt-4.1-2025-04-14","tools":[],"userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770832474051","url":"https://supabase-crud.simplita.ai/mcp","name":"crud supabase","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770832487339","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"send form","enabled":true,"description":"Custom MCP Server"}],"querySource":"","temperature":0.7,"user_prompt":"{{sheetTriggerResult.Name}}","agentSDKType":"orchestrator","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are an agent.\nYou will receive the output from the JSON String Parser, which contains the field name.\n\nYour Task\n\nUse the received name to fetch the corresponding phonenumber from the Supabase database using the CRUD Supabase MCP Tool.\n\nDatabase Table: crudsupabase\n\nOnce the phonenumber is retrieved, send a reply message to that number with the following text:\n\n\"Thank you for providing your details. We have successfully received it. Our Team will connect you soon\"\n\nExpected Outcome\n\nThe correct phonenumber is successfully retrieved from Supabase using the provided name.\n\nA confirmation message is sent to that phone number confirming successful form submission.You are an agent.\nYou will receive the output from the JSON String Parser, which contains the field name.\n\nYour Task\n\nUse the received name to fetch the corresponding phonenumber from the Supabase database using the CRUD Supabase MCP Tool.\n\nDatabase Table: crudsupabase\n\nOnce the phonenumber is retrieved, send a reply message to that number with the following text:\n\n\"Your form details have been submitted successfully.\"\n\nExpected Outcome\n\nThe correct phonenumber is successfully retrieved from Supabase using the provided name.\n\nA confirmation message is sent to that phone number confirming successful form submission.","tool_configs":{},"queryVariable":"","tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"variableInput":"","resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","selectedDataSources":[],"auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}}];
      
      (window as any).__currentWorkflowNodes = sanitizedNodes;
      (window as any).__flowChainMetadata = {
        chainId: 'flow_google-sheets-trigger-1770831498824_1771079854809',
        currentChainNodes: sanitizedNodes,
        nodeCount: 5
      };
      console.log('🔗 Workflow nodes made available globally: 5 nodes');
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
      
      // Google Sheets Trigger Processing
      // SECURITY: Credentials loaded from environment variables
      
      let sheetTriggerResult: Record<string, any> = {
        success: true,
        nodeId: 'google-sheets-trigger-1770831498824',
        nodeType: 'google-sheets-trigger',
        spreadsheetId: "1pRqhjnhwTQcb6MqtulODeDAt34f8_fjgkXz39DwQcSg",
        sheetName: "Form Responses 1",
        eventType: "*",
        mode: 'apps-script',
        timestamp: new Date().toISOString(),
        configured: true,
        
        // Populate data from incoming webhook payload (initialData)
        event: initialData.event || '*',
        rowData: initialData.rowData || [],
        oldRowData: initialData.oldRowData || [],
        rowIndex: initialData.rowIndex || null,
        columnIndex: initialData.columnIndex || null,
        newValue: initialData.newValue || null,
        oldValue: initialData.oldValue || null,
        
        // Structured access to specific fields
        data: initialData.rowData || [],
        rawPayload: initialData
      };

      // Template context for dynamic content resolution
      const templateContext = {
        ...flowResults,
        dataFlow: dataFlow,
        currentResult: flowResults.currentResult || null,
        previousResult: flowResults.previousResult || null
      };

      try {
        // ===== WEBHOOK CONFIGURATION SETUP =====
        // Load credentials from environment variables
        
      const __googleSheetsEnv = (() => {
        if (typeof window !== 'undefined') {
          const scopedEnv = (window as any).__googleSheetsEnv || (window as any).__env;
          if (scopedEnv) {
            return scopedEnv;
          }
        }
        const globalProcess = typeof globalThis !== 'undefined' ? (globalThis as any).process : undefined;
        if (globalProcess?.env) {
          return globalProcess.env;
        }
        return {};
      })();
      const getSheetsEnvValue = (key: string) => (__googleSheetsEnv && (__googleSheetsEnv as any)[key]) || undefined;
    
        const effectiveSpreadsheetId = getSheetsEnvValue('NEXT_PUBLIC_GOOGLE_SHEETS_SPREADSHEET_ID') || "1pRqhjnhwTQcb6MqtulODeDAt34f8_fjgkXz39DwQcSg" || '';
        const effectiveSheetName = getSheetsEnvValue('NEXT_PUBLIC_GOOGLE_SHEETS_SHEET_NAME') || "Form Responses 1" || '';
        
        // Validate credentials
        if (!effectiveSpreadsheetId || !effectiveSheetName) {
          throw new Error('Google Sheets configuration incomplete. Set NEXT_PUBLIC_GOOGLE_SHEETS_SPREADSHEET_ID and NEXT_PUBLIC_GOOGLE_SHEETS_SHEET_NAME in .env.local');
        }
        
        const webhookConfig = {
          nodeId: 'google-sheets-trigger-1770831498824',
          spreadsheetId: effectiveSpreadsheetId,
          sheetName: effectiveSheetName,
          eventType: '*',
          mode: 'apps-script',
          filterColumn: "",
          filterValue: ""
        };
        
        // Store webhook configuration for later use
        if (!flowResults.webhookConfigs) flowResults.webhookConfigs = {};
        flowResults.webhookConfigs['google-sheets-trigger-1770831498824'] = webhookConfig;
        
        // ===== FILTERING FUNCTIONS =====
        
        // Row data filtering function
        const passesFilters = (rowData) => {
          const filterColumnSetting: string = "";
          const filterValueSetting: string = "";
          // Column filter
          if (filterColumnSetting && filterValueSetting) {
            const filterColumns = filterColumnSetting.split(',').map(s => s.trim()).filter(Boolean);
            const filterValues = filterValueSetting.split(',').map(s => s.trim());
            
            let matches = false;
            for (let i = 0; i < filterColumns.length; i++) {
              const column = filterColumns[i];
              const expectedValue = filterValues[i] || filterValues[0];
              
              // Try to match by column name or index
              let actualValue;
              if (typeof column === 'string' && isNaN(parseInt(column))) {
                // Column name - would need header mapping
                actualValue = rowData[column];
              } else {
                // Column index
                const colIndex = parseInt(column);
                actualValue = rowData[colIndex];
              }
              
              if (actualValue && String(actualValue) === expectedValue) {
                matches = true;
                break;
              }
            }
            
            if (!matches) {
              return false;
            }
          }
          
          return true;
        };
        
        // ===== EVENT HANDLER REGISTRATION =====
        
        // Register global event handler function (similar to Supabase/Evolution pattern)
        if (typeof window !== 'undefined') {
          window.handleGoogleSheetsEvent_google_sheets_trigger_1770831498824 = async function(eventData) {
            
            try {
              // Extract row data from event
              const rowData = eventData.rowData || [];
              const oldRowData = eventData.oldRowData || [];
              
              // Apply all filters
              if (!passesFilters(rowData)) {
                return null;
              }
              
              // Process the received event
              const receivedEvent = {
                success: true,
                event: eventData.event || '*',
                spreadsheetId: eventData.spreadsheetId || '1pRqhjnhwTQcb6MqtulODeDAt34f8_fjgkXz39DwQcSg',
                sheetName: eventData.sheetName || 'Form Responses 1',
                rowData: rowData,
                oldRowData: oldRowData,
                rowIndex: eventData.rowIndex || null,
                columnIndex: eventData.columnIndex || null,
                newValue: eventData.newValue || null,
                oldValue: eventData.oldValue || null,
                timestamp: eventData.timestamp || new Date().toISOString(),
                nodeId: 'google-sheets-trigger-1770831498824',
                webhookTriggered: true,
                filtered: false,
                
                // Direct field access for templates
                data: rowData,
                rawPayload: eventData
              };
              
              // Update sheetTriggerResult with received event data
              sheetTriggerResult.receivedEvent = receivedEvent;
              sheetTriggerResult.lastActivity = 'received';
              sheetTriggerResult.lastEventTime = new Date().toISOString();
              sheetTriggerResult.eventCount = (sheetTriggerResult.eventCount || 0) + 1;
              
              // Populate main fields for template access
              sheetTriggerResult.event = receivedEvent.event;
              sheetTriggerResult.rowData = receivedEvent.rowData;
              sheetTriggerResult.oldRowData = receivedEvent.oldRowData;
              sheetTriggerResult.rowIndex = receivedEvent.rowIndex;
              sheetTriggerResult.columnIndex = receivedEvent.columnIndex;
              sheetTriggerResult.newValue = receivedEvent.newValue;
              sheetTriggerResult.oldValue = receivedEvent.oldValue;
              sheetTriggerResult.data = receivedEvent.data;
              sheetTriggerResult.rawPayload = receivedEvent.rawPayload;
              
              // ✅ CRITICAL FIX: Flatten rowData fields to top level for easy template access
              if (rowData && typeof rowData === 'object') {
                Object.keys(rowData).forEach(key => {
                  // Map field names with spaces to camelCase (e.g., "First Name" → "FirstName")
                  const camelKey = key.replace(/\s+(.)/g, (match, char) => char.toUpperCase()).replace(/\s+/g, '');
                  sheetTriggerResult[key] = rowData[key];  // Keep original key
                  if (camelKey !== key) {
                    sheetTriggerResult[camelKey] = rowData[key];  // Add camelCase version
                  }
              });
            }
            
            // Store in data flow system
            if (!flowResults.nodeResults) flowResults.nodeResults = {};
            if (!flowResults.variables) flowResults.variables = {};
            
            flowResults.variables['sheetTriggerResult'] = sheetTriggerResult;
              
              flowResults.nodeResults['google-sheets-trigger-1770831498824'] = {
                nodeId: 'google-sheets-trigger-1770831498824',
                nodeType: 'google-sheets-trigger',
                stepNumber: 1,
                displayName: 'Google Sheets Trigger',
                data: sheetTriggerResult,
                timestamp: new Date().toISOString(),
                success: true
              };
              
              // Update currentResult for dataFlow.current() access
              flowResults.previousResult = flowResults.currentResult;
              flowResults.currentResult = sheetTriggerResult;
              
              // Store at top-level for direct template access (CRITICAL for HTTP nodes)
              flowResults.event = receivedEvent.event;
              flowResults.rowData = receivedEvent.rowData;
              flowResults.oldRowData = receivedEvent.oldRowData;
              flowResults.rowIndex = receivedEvent.rowIndex;
              flowResults.sheetName = receivedEvent.sheetName;
              flowResults.spreadsheetId = receivedEvent.spreadsheetId;
              
              // Also store with node ID for node-specific access
              flowResults['googleSheetsTrigger_google-sheets-trigger-1770831498824'] = sheetTriggerResult;
              
              return receivedEvent;
            } catch (error) {
              console.error('Error processing Google Sheets event:', error);
              return null;
            }
          };
        }
        
        // ===== POPULATE FROM INITIAL DATA (WEBHOOK TRIGGER) =====
        
        // If we have initial data (from webhook), populate immediately
        if (initialData && (initialData.event || initialData.rowData)) {
          
          const rowData = initialData.rowData || [];
          const oldRowData = initialData.oldRowData || [];
          
          // Apply filters
          if (passesFilters(rowData)) {
            sheetTriggerResult.event = initialData.event || '*';
            sheetTriggerResult.rowData = rowData;
            sheetTriggerResult.oldRowData = oldRowData;
            sheetTriggerResult.rowIndex = initialData.rowIndex || null;
            sheetTriggerResult.columnIndex = initialData.columnIndex || null;
            sheetTriggerResult.newValue = initialData.newValue || null;
            sheetTriggerResult.oldValue = initialData.oldValue || null;
            sheetTriggerResult.data = rowData;
            sheetTriggerResult.rawPayload = initialData;
            sheetTriggerResult.webhookTriggered = true;
            sheetTriggerResult.lastActivity = 'webhook_received';
            sheetTriggerResult.lastEventTime = new Date().toISOString();
            
            // ✅ CRITICAL FIX: Flatten rowData fields to top level for easy template access
            // This allows templates like {{sheetTriggerResult.Name}} instead of {{sheetTriggerResult.rowData.Name}}
            if (rowData && typeof rowData === 'object') {
              Object.keys(rowData).forEach(key => {
                // Map field names with spaces to camelCase (e.g., "First Name" → "FirstName")
                const camelKey = key.replace(/\s+(.)/g, (match, char) => char.toUpperCase()).replace(/\s+/g, '');
                sheetTriggerResult[key] = rowData[key];  // Keep original key
                if (camelKey !== key) {
                  sheetTriggerResult[camelKey] = rowData[key];  // Add camelCase version
                }
              });
            }
          } else {
            sheetTriggerResult.filtered = true;
            sheetTriggerResult.filterReason = 'Column filter not matched';
          }
        }
        
        // ===== STORE IN FLOW RESULTS =====
        
        // Store in variables for organized access
        if (!flowResults.variables) flowResults.variables = {};
        flowResults.variables['sheetTriggerResult'] = sheetTriggerResult;
        
        // Store at top-level for direct template access (CRITICAL for HTTP nodes)
        flowResults.event = sheetTriggerResult.event;
        flowResults.rowData = sheetTriggerResult.rowData;
        flowResults.oldRowData = sheetTriggerResult.oldRowData;
        flowResults.rowIndex = sheetTriggerResult.rowIndex;
        flowResults.columnIndex = sheetTriggerResult.columnIndex;
        flowResults.newValue = sheetTriggerResult.newValue;
        flowResults.oldValue = sheetTriggerResult.oldValue;
        flowResults.sheetName = sheetTriggerResult.sheetName;
        flowResults.spreadsheetId = sheetTriggerResult.spreadsheetId;
        
        // Also store with node ID for node-specific access
        flowResults['googleSheetsTrigger_google-sheets-trigger-1770831498824'] = sheetTriggerResult;
        
        // Store in nodeResults
        if (!flowResults.nodeResults) flowResults.nodeResults = {};
        flowResults.nodeResults['google-sheets-trigger-1770831498824'] = {
          nodeId: 'google-sheets-trigger-1770831498824',
          nodeType: 'google-sheets-trigger',
          stepNumber: 1,
          displayName: 'Google Sheets Trigger',
          data: sheetTriggerResult,
          timestamp: new Date().toISOString(),
          success: true
        };
        
        // Update currentResult for dataFlow.current() access
        flowResults.previousResult = flowResults.currentResult;
        flowResults.currentResult = sheetTriggerResult;
        
      } catch (error) {
        console.error('Error in Google Sheets Trigger node:', error);
        sheetTriggerResult.success = false;
        sheetTriggerResult.error = error.message;
        
        // Store error in flow results
        if (!flowResults.variables) flowResults.variables = {};
        flowResults.variables['sheetTriggerResult'] = sheetTriggerResult;
        
        if (!flowResults.nodeResults) flowResults.nodeResults = {};
        flowResults.nodeResults['google-sheets-trigger-1770831498824'] = {
          nodeId: 'google-sheets-trigger-1770831498824',
          nodeType: 'google-sheets-trigger',
          stepNumber: 1,
          displayName: 'Google Sheets Trigger',
          data: sheetTriggerResult,
          timestamp: new Date().toISOString(),
          success: false,
          error: error.message
        };
      }
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['google-sheets-trigger-1770831498824'] = {
      nodeId: 'google-sheets-trigger-1770831498824',
      nodeType: 'google-sheets-trigger',
      stepNumber: 1,
      displayName: 'google-sheets-triggerResult_google_sheets_trigger_1770831498824',
      data: step1Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for google-sheets-trigger
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['google-sheets-triggerResult_google_sheets_trigger_1770831498824'] || typeof flowResults['google-sheets-triggerResult_google_sheets_trigger_1770831498824'] === 'undefined') {
      flowResults['google-sheets-triggerResult_google_sheets_trigger_1770831498824'] = step1Result;
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
      console.error('❌ Error in step 1 (google-sheets-trigger):', stepError);
      flowErrors.push(`Step 1 (google-sheets-trigger): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step1Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'google-sheets-trigger',
        nodeId: 'google-sheets-trigger-1770831498824',
        stepNumber: 1
      };
      
      currentResult = step1Result; // Update currentResult even on error
      
      // Store error result in enhanced data flow system
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['google-sheets-trigger-1770831498824'] = {
      nodeId: 'google-sheets-trigger-1770831498824',
      nodeType: 'google-sheets-trigger',
      stepNumber: 1,
      displayName: 'google-sheets-triggerResult_google_sheets_trigger_1770831498824',
      data: step1Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for google-sheets-trigger
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['google-sheets-triggerResult_google_sheets_trigger_1770831498824'] || typeof flowResults['google-sheets-triggerResult_google_sheets_trigger_1770831498824'] === 'undefined') {
      flowResults['google-sheets-triggerResult_google_sheets_trigger_1770831498824'] = step1Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
    }

    step2Result = currentResult;
    try {
      
    // === HELPER FUNCTIONS ===
    const flattenNestedObjects = (data : any) => {
      if (!data || typeof data !== 'object') {
        return data;
      }
      
      const flattened : any = {};
      
      const flatten = (obj : any, prefix = '', depth = 0) => {
        // Safety check to prevent infinite recursion (max 20 levels)
        if (depth > 20) {
          if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') { 
            console.warn('🔧 Flattening stopped at depth ' + depth + ' to prevent infinite recursion');
          }
          return;
        }
        
        for (const key in obj) {
          if (obj.hasOwnProperty(key)) {
            const value = (obj as Record<string, any>)[key];
            const fullPath = prefix ? prefix + '.' + key : key;
            
            if (Array.isArray(value)) {
              // Keep arrays as-is for database APIs
              flattened[fullPath] = value;
            } else if (value && typeof value === 'object') {
              // Recursively flatten nested objects
              flatten(value, fullPath, depth + 1);
            } else {
              // Primitive value - add to flattened result
              flattened[fullPath] = value;
            }
          }
        }
      }
      
      flatten(data);
      return flattened;
    };
    
    // === API POST REQUEST ===
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        console.info('🌐 Processing API POST request');
      }
    
    step2Result = currentResult;
    
    // Handle input data (evaluate dataFlow expressions if present)
    let processedInput_db_api_post_1770831673235 = currentResult;
    

     // Declare replacePathParameters function at function scope level
        var replacePathParameters: ((endpoint: string, context: any, flowResults: any, dataFlow: any, nodeConfig?: any) => Promise<string>) | undefined = undefined;


    // Enhanced DataFlow Expression Handler - Supports both single and multiple expressions
    if (typeof processedInput_db_api_post_1770831673235 === 'string' && processedInput_db_api_post_1770831673235.includes('dataFlow.')) {
      try {
        // Check if dataFlow is available
        if (typeof dataFlow !== 'undefined') {
          
          // PRIORITY 1: Handle multiple {{dataFlow.getByNodeId()}} expressions first
          if (processedInput_db_api_post_1770831673235.includes('{{dataFlow.getByNodeId(') && processedInput_db_api_post_1770831673235.includes('}}')) {
            
            // Handle multiple {{dataFlow.getByNodeId("...").PropertyName}} expressions with property access
const openBrace = '{{';
const closeBrace = '}}';
const functionCall = 'dataFlow.getByNodeId\\(["\']([^"\']+)["\']\\)';
const propertyAccess = '(?:\\.([a-zA-Z_$][a-zA-Z0-9_$]*))?';
const multiDataFlowRegex = new RegExp(openBrace + functionCall + propertyAccess + closeBrace, 'g');

            let processedVariable = processedInput_db_api_post_1770831673235;
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
              processedInput_db_api_post_1770831673235 = processedVariable;
            }
          }
          
          // PRIORITY 2: Handle legacy single dataFlow.getByNodeId() without braces (backwards compatibility)
          else if (processedInput_db_api_post_1770831673235.includes('dataFlow.getByNodeId(') && !processedInput_db_api_post_1770831673235.includes('{{') && !processedInput_db_api_post_1770831673235.includes('}}')) {
            // Extract node ID and property access from pattern: dataFlow.getByNodeId('nodeId').PropertyName
            const legacyNodeIdMatch = processedInput_db_api_post_1770831673235.match(/dataFlow\.getByNodeId\(['"]([^'"]+)['"]\)(?:\.([a-zA-Z_$][a-zA-Z0-9_$]*))?/);
            if (legacyNodeIdMatch) {
              const nodeId = legacyNodeIdMatch[1];
              const propertyName = legacyNodeIdMatch[2]; // Capture property name after function call (e.g., .Name)
              
              const result = dataFlow.getByNodeId(nodeId);
              if (result !== undefined && result !== null) {
                // CRITICAL FIX: Check if user specified a property name (e.g., .Name, .Email)
                if (propertyName) {
                  // Try direct property access first (most common for form fields)
                  if (typeof result === 'object' && result[propertyName] !== undefined) {
                    processedInput_db_api_post_1770831673235 = String(result[propertyName]);
                  }
                  // Try in formData
                  else if (result.formData && result.formData[propertyName] !== undefined) {
                    processedInput_db_api_post_1770831673235 = String(result.formData[propertyName]);
                  }
                  // Try in inputData
                  else if (result.inputData && result.inputData[propertyName] !== undefined) {
                    processedInput_db_api_post_1770831673235 = String(result.inputData[propertyName]);
                  }
                  // Try in data
                  else if (result.data && result.data[propertyName] !== undefined) {
                    processedInput_db_api_post_1770831673235 = String(result.data[propertyName]);
                  }
                  // Try case-insensitive property access for form fields
                  else if (typeof result === 'object') {
                    const resultKeys = Object.keys(result);
                    const matchingKey = resultKeys.find(key => key.toLowerCase() === propertyName.toLowerCase());
                    if (matchingKey && result[matchingKey] !== undefined) {
                      processedInput_db_api_post_1770831673235 = String(result[matchingKey]);
                    } else {
                      console.warn(`⚠️ Legacy: Property '${propertyName}' not found in result object. Available keys:`, resultKeys);
                      processedInput_db_api_post_1770831673235 = '[property not found: ' + propertyName + ']';
                    }
                  } else {
                    console.warn(`⚠️ Legacy: Cannot access property '${propertyName}' on non-object result`);
                    processedInput_db_api_post_1770831673235 = '[invalid property access]';
                  }
                } else {
                  // No property specified - use auto-extraction
                  if (typeof result === 'object') {
                    processedInput_db_api_post_1770831673235 = result.currentValue || result.value || result.data || String(result);
                  } else {
                    processedInput_db_api_post_1770831673235 = String(result);
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
                      processedInput_db_api_post_1770831673235 = String(fallbackValue);
                    } else {
                      processedInput_db_api_post_1770831673235 = '[data not available]';
                    }
                  } else {
                    processedInput_db_api_post_1770831673235 = '[data not available]';
                  }
                } catch (fallbackError) {
                  console.warn('⚠️ Enhanced Template: Error in batchResult fallback:', fallbackError);
                  processedInput_db_api_post_1770831673235 = '[data not available]';
                }
              }
            }
          } else if (processedInput_db_api_post_1770831673235.includes('dataFlow.current()')) {
            const result = dataFlow.current();
            if (result !== undefined && result !== null) {
              if (typeof result === 'object') {
                processedInput_db_api_post_1770831673235 = result.currentValue || result.value || result.data || String(result);
              } else {
                processedInput_db_api_post_1770831673235 = String(result);
              }
            } else {
              processedInput_db_api_post_1770831673235 = '[current data not available]';
            }
          } else if (processedInput_db_api_post_1770831673235.includes('dataFlow.previous()')) {
            const result = dataFlow.previous();
            if (result !== undefined && result !== null) {
              if (typeof result === 'object') {
                processedInput_db_api_post_1770831673235 = result.currentValue || result.value || result.data || String(result);
              } else {
                processedInput_db_api_post_1770831673235 = String(result);
              }
            } else {
              processedInput_db_api_post_1770831673235 = '[previous data not available]';
            }
          } else if (processedInput_db_api_post_1770831673235.includes('dataFlow.get(')) {
            // Extract variable name from pattern: dataFlow.get('varName')
            const varNameMatch = processedInput_db_api_post_1770831673235.match(/dataFlow\.get\(['"]([^'"]+)['"]\)/);
            if (varNameMatch) {
              const varName = varNameMatch[1];
              const result = dataFlow.get(varName);
              if (result !== undefined && result !== null) {
                if (typeof result === 'object') {
                  processedInput_db_api_post_1770831673235 = result.currentValue || result.value || result.data || String(result);
                } else {
                  processedInput_db_api_post_1770831673235 = String(result);
                }
              } else {
                processedInput_db_api_post_1770831673235 = '[variable not available]';
              }
            }
          }
        } else {
          console.warn('⚠️ dataFlow not available in scope');
          processedInput_db_api_post_1770831673235 = '[dataFlow not available]';
        }
      } catch (error) {
        console.error('❌ Error evaluating dataFlow expression:', error);
        processedInput_db_api_post_1770831673235 = '[dataFlow evaluation error]';
      }
    }
    
    try {

    let postResponse: Response | null = null;

      const configuredEndpoint_db_api_post_1770831673235 = "/api/form/component-generated-form_vitality_form_338226625-917682082";
      const apiEndpoint_db_api_post_1770831673235 = (configuredEndpoint_db_api_post_1770831673235 || '').trim();
      if (!apiEndpoint_db_api_post_1770831673235) {
        throw new Error('API endpoint is required for POST requests');
      }
      
      // Show loader before starting API request
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('apiLoadingStart', { 
          detail: { 
            endpoint: apiEndpoint_db_api_post_1770831673235,
            method: 'POST',
            nodeId: 'db-api-post-1770831673235'
          } 
        }));
      }
      
      // Build the full API URL using environment variable with auto-detection for Coder
      let apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || process.env.NEXT_PUBLIC_BACKEND_URL;
      
      if (!apiBaseUrl && typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        if (hostname.startsWith('frontend--')) {
          // Coder subdomain routing: frontend--{workspace}--{owner}.{coder-domain}
          const backendHostname = hostname.replace(/^frontend--/, 'backend--');
          apiBaseUrl = `${window.location.protocol}//${backendHostname}`;
        } else {
          // Local development fallback
          apiBaseUrl = window.location.origin.replace(':3001', ':9000').replace(':3000', ':9000').replace(':4000', ':9000');
        }
      } else if (!apiBaseUrl) {
        // Server-side fallback
        apiBaseUrl = 'http://localhost:9000';
      }
      
      // Simple URL construction that guarantees proper slash handling
      let fullApiUrl;
      if (apiEndpoint_db_api_post_1770831673235.startsWith('http')) {
        fullApiUrl = apiEndpoint_db_api_post_1770831673235;
      } else {
        const baseWithoutTrailingSlash = apiBaseUrl.endsWith('/') ? apiBaseUrl.slice(0, -1) : apiBaseUrl;
        const pathWithLeadingSlash = apiEndpoint_db_api_post_1770831673235.startsWith('/') ? apiEndpoint_db_api_post_1770831673235 : '/' + apiEndpoint_db_api_post_1770831673235;
        fullApiUrl = baseWithoutTrailingSlash + pathWithLeadingSlash;
      }
      
      // Create comprehensive template context from all available data with field name normalization
      const templateContext = {
        ...(processedInput_db_api_post_1770831673235 || {}),                    // Include all top-level fields
        ...((processedInput_db_api_post_1770831673235 && processedInput_db_api_post_1770831673235.formData) ? processedInput_db_api_post_1770831673235.formData : {}),           // Include nested form data if available
        ...((processedInput_db_api_post_1770831673235 && processedInput_db_api_post_1770831673235.inputData) ? processedInput_db_api_post_1770831673235.inputData : {}),          // Include input data if available
        ...((processedInput_db_api_post_1770831673235 && processedInput_db_api_post_1770831673235.formResult && processedInput_db_api_post_1770831673235.formResult.inputData) ? processedInput_db_api_post_1770831673235.formResult.inputData : {}), // Include form result input data if available
        ...(flowResults.variables || {}),                    // CRITICAL: Include flow variables (from JSON Filter, etc.)
        // CRITICAL: Include voiceCallResult from flowResults for Bolna AI integration
        voiceCallResult: flowResults['voiceCallResult'] || flowResults.voiceCallResult || null,
        // CRITICAL: Also spread voiceCallResult data directly into templateContext for easy access
        ...(flowResults['voiceCallResult'] || flowResults.voiceCallResult || {})
      };

      
      // CRITICAL: Extract voice call data fields directly for template variables
      // First try from processedInput
      if (processedInput_db_api_post_1770831673235 && processedInput_db_api_post_1770831673235.voiceCallResult) {
        const voiceData = processedInput_db_api_post_1770831673235.voiceCallResult;
        
        // Map Bolna API response fields to database schema (agentid, tonumber, etc.)
        templateContext.agentid = voiceData.agentid || voiceData.agent_id || '';
        templateContext.createdat = voiceData.createdat || voiceData.created_at || '';
        templateContext.updatedat = voiceData.updatedat || voiceData.updated_at || '';
        templateContext.transcript = voiceData.transcript || '';
        templateContext.callduration = voiceData.callduration || voiceData.conversation_time || '';
        templateContext.status = voiceData.status || '';
        
        // Extract phone numbers from telephony_data or direct fields
        templateContext.tonumber = voiceData.tonumber || 
                                  voiceData.to_number || 
                                  (voiceData.telephony_data && voiceData.telephony_data.to_number) || '';
        templateContext.fromnumber = voiceData.fromnumber || 
                                    voiceData.from_number || 
                                    (voiceData.telephony_data && voiceData.telephony_data.from_number) || '';
        
        // Additional Bolna API fields
        templateContext.batchid = voiceData.batch_id || '';
        templateContext.totalcost = voiceData.total_cost || '';
        templateContext.errormessage = voiceData.error_message || '';
        templateContext.answeredbyvoicemail = voiceData.answered_by_voice_mail || false;
        templateContext.recordingurl = (voiceData.telephony_data && voiceData.telephony_data.recording_url) || '';
      } 
      // If not found in processedInput, try from templateContext.voiceCallResult
      else if (templateContext.voiceCallResult) {
        const voiceData = templateContext.voiceCallResult;
        
        // Map Bolna API response fields to database schema (agentid, tonumber, etc.)
        templateContext.agentid = voiceData.agentid || voiceData.agent_id || '';
        templateContext.createdat = voiceData.createdat || voiceData.created_at || '';
        templateContext.updatedat = voiceData.updatedat || voiceData.updated_at || '';
        templateContext.transcript = voiceData.transcript || '';
        templateContext.callduration = voiceData.callduration || voiceData.conversation_time || '';
        templateContext.status = voiceData.status || '';
        
        // Extract phone numbers from telephony_data or direct fields
        templateContext.tonumber = voiceData.tonumber || 
                                  voiceData.to_number || 
                                  (voiceData.telephony_data && voiceData.telephony_data.to_number) || '';
        templateContext.fromnumber = voiceData.fromnumber || 
                                    voiceData.from_number || 
                                    (voiceData.telephony_data && voiceData.telephony_data.from_number) || '';
        
        // Additional Bolna API fields
        templateContext.batchid = voiceData.batch_id || '';
        templateContext.totalcost = voiceData.total_cost || '';
        templateContext.errormessage = voiceData.error_message || '';
        templateContext.answeredbyvoicemail = voiceData.answered_by_voice_mail || false;
        templateContext.recordingurl = (voiceData.telephony_data && voiceData.telephony_data.recording_url) || '';
      }
      
      
      // Normalize field names for backend compatibility (convert to lowercase and handle special cases)
      const normalizedContext : any = {};
      Object.entries(templateContext).forEach(([key, value]) => {
        // Skip metadata fields
        if (key.startsWith('_') || key === 'formId' || key === 'buttonId' || key === 'trigger' || key === 'timestamp') {
          return;
        }
        
        // Normalize field name to lowercase
        let normalizedKey = key.toLowerCase().replace(/ /g, '_');
        
        // Handle special checkbox fields - convert long checkbox text to 'checkbox'
        if (key.toLowerCase().includes('agree') || 
            key.toLowerCase().includes('contact') || 
            key.toLowerCase().includes('consent') ||
            key.toLowerCase().includes('terms') ||
            key.toLowerCase().includes('privacy') ||
            (typeof value === 'boolean' && key.length > 10)) {
          normalizedKey = 'checkbox';
        }
        
        // Store both original and normalized keys for maximum compatibility
        normalizedContext[key] = value;           // Original key
        normalizedContext[normalizedKey] = value; // Normalized key
      });
      
      // Process the body template with the context
      let requestBodyTemplate = "{\n  \"Age\": \"{{Age}}\",\n  \"City\": \"{{City}}\",\n  \"Name\": \"{{Name}}\",\n  \"Email\": \"{{Email}}\",\n  \"State\": \"{{State}}\",\n  \"Gender\": \"{{Gender}}\",\n  \"Mobile\": \"{{Mobile}}\",\n  \"Address\": \"{{Address}}\",\n  \"Country\": \"{{Country}}\",\n  \"Pincode\": \"{{Pincode}}\",\n  \"Occupation\": \"{{Occupation}}\"\n}";
      let requestBody = requestBodyTemplate;

          // Check if we have a JSON template
          if (requestBodyTemplate.trim().startsWith('{') && requestBodyTemplate.trim().endsWith('}')) {
            try {

         // ✅ CRITICAL FIX: Use a safer approach - parse JSON first, then replace values in object
          // This prevents JSON parsing errors with long base64 strings
          let parsedBody: any = null;
          
          // Step 1: Replace dataFlow expressions with placeholder values, then parse JSON
          // ✅ CRITICAL FIX: Use placeholder approach to avoid JSON parsing errors with long base64 strings
          const dataFlowValues: Record<string, any> = {};
          let placeholderCounter = 0;

          // ENHANCED: Process dataFlow expressions first before template variables
          if (requestBodyTemplate.includes('dataFlow.')) {
            // Handle dataFlow.getByNodeId() expressions
            const dataFlowNodeIdPattern = /\{\{\s*dataFlow\.getByNodeId\(['"]([^'"]+)['"]\)([^}]*)\}\}/g;
            requestBody = requestBodyTemplate.replace(dataFlowNodeIdPattern, (match, nodeId, propertyPath) => {
              const placeholder = `__DATEFLOW_PLACEHOLDER_${placeholderCounter}__`;
              const placeholderKey = `"${placeholder}"`; // Key with quotes for storage lookup
              try {
                if (typeof dataFlow !== 'undefined' && dataFlow.getByNodeId) {
                  let nodeResult = dataFlow.getByNodeId(nodeId);

                    // 🔧 CRITICAL FIX: For video-gen nodes, check result variable FIRST (prioritize direct base64 string)
                    if (nodeId.includes('universal-video-gen') && (nodeResult === undefined || nodeResult === null)) {                   
                     const videoResultVar = `${nodeId}_GeneratedVideo`;
                    
                      // First try local dataFlow.get() method
                      if (typeof dataFlow !== 'undefined' && typeof dataFlow.get === 'function') {
                        const localResult = dataFlow.get(videoResultVar);
                        if (localResult !== undefined && localResult !== null) {
                          nodeResult = localResult;
                        }
                      }
                      
                      // Then try window.dataFlow
                      if ((nodeResult === undefined || nodeResult === null) && typeof window !== 'undefined' && (window as any).dataFlow) {
                        const winDataFlow = (window as any).dataFlow;
                        
                        // Try using get() method if available
                        if (typeof winDataFlow.get === 'function') {
                          const getResult = winDataFlow.get(videoResultVar);
                          if (getResult !== undefined && getResult !== null) {
                            nodeResult = getResult;
                          }
                        }
                        
                        // Also try direct property access (data might be stored as non-enumerable property)
                        if ((nodeResult === undefined || nodeResult === null)) {
                          try {
                            const directValue = winDataFlow[videoResultVar];
                            if (directValue !== undefined && directValue !== null) {
                              nodeResult = directValue;
                            }
                          } catch (e) {
                            // Error accessing videoResultVar directly
                          }
                        } }
                  }
                  
                  // 🔧 CRITICAL FIX: Check window.dataFlow for cross-chain access (image-gen/video-gen from other pages)
                  if ((nodeResult === undefined || nodeResult === null) && typeof window !== 'undefined' && (window as any).dataFlow) {
                   const winDataFlow = (window as any).dataFlow;
                      
                      // Try using get() method first
                      let globalData = null;
                      if (typeof winDataFlow.get === 'function') {
                        globalData = winDataFlow.get(nodeId);
                      }
                      
                      // Also try direct property access
                      if ((globalData === undefined || globalData === null) && winDataFlow[nodeId] !== undefined && winDataFlow[nodeId] !== null) {
                        globalData = winDataFlow[nodeId];
                      }
                    if (globalData !== undefined && globalData !== null) {
                      // For video-gen nodes, if we found the full result object, extract videoBase64
                      if (nodeId.includes('universal-video-gen') && typeof globalData === 'object' && !Array.isArray(globalData)) {
                        if (globalData.videoBase64) {
                          nodeResult = globalData.videoBase64;
                        } else if (globalData.data && globalData.data.videoBase64) {
                          nodeResult = globalData.data.videoBase64;
                        } else {
                          nodeResult = globalData;
                        }
                      } else {
                        nodeResult = globalData;
                      }
                    }
                  }
                  
                  if ((nodeResult === undefined || nodeResult === null) && typeof window !== 'undefined' && (window as any).dataFlow) {
                    const winDataFlow = (window as any).dataFlow;
                      // Get all keys including non-enumerable ones by trying common patterns
                      const allPossibleKeys: string[] = [];
                      
                      // Try to get keys via getAvailableNames if available
                      if (typeof winDataFlow.getAvailableNames === 'function') {
                        const availableNames = winDataFlow.getAvailableNames();
                        if (Array.isArray(availableNames)) {
                          allPossibleKeys.push(...availableNames);
                        }
                      }
                      
                      // Also check enumerable keys
                      allPossibleKeys.push(...Object.keys(winDataFlow));
                      
                      // Check for the result variable directly
                      const videoResultVar = `${nodeId}_GeneratedVideo`;
                      if (allPossibleKeys.includes(videoResultVar) || winDataFlow[videoResultVar] !== undefined) {
                        const result = typeof winDataFlow.get === 'function' ? winDataFlow.get(videoResultVar) : winDataFlow[videoResultVar];
                        if (result !== undefined && result !== null) {
                          nodeResult = result;
                        }
                      }
                      
                      // Fallback: search for keys containing nodeId
                      if ((nodeResult === undefined || nodeResult === null)) {
                        const resultVarKeys = allPossibleKeys.filter(key => key.includes(nodeId));
                        if (resultVarKeys.length > 0) {
                          // For video-gen nodes, prioritize the result variable that stores videoBase64 directly
                          if (nodeId.includes('universal-video-gen')) {
                            const videoResultVarKey = resultVarKeys.find(key => key.includes('_GeneratedVideo'));
                            if (videoResultVarKey) {
                              const result = typeof winDataFlow.get === 'function' ? winDataFlow.get(videoResultVarKey) : winDataFlow[videoResultVarKey];
                              if (result !== undefined && result !== null) {
                                nodeResult = result;
                              }
                            } else if (resultVarKeys[0]) {
                              const result = typeof winDataFlow.get === 'function' ? winDataFlow.get(resultVarKeys[0]) : winDataFlow[resultVarKeys[0]];
                              if (result !== undefined && result !== null) {
                                nodeResult = result;
                              }
                            }
                          } else if (resultVarKeys[0]) {
                            const result = typeof winDataFlow.get === 'function' ? winDataFlow.get(resultVarKeys[0]) : winDataFlow[resultVarKeys[0]];
                            if (result !== undefined && result !== null) {
                              nodeResult = result;
                            }
                          } }
                    }
                  }
                  
                  
                  // 🔧 CRITICAL FIX: Check window.globalImageStore for image-gen nodes
                  if (nodeId.includes('image-gen') && (nodeResult === undefined || nodeResult === null) && typeof window !== 'undefined' && (window as any).globalImageStore) {
                    const globalStore = (window as any).globalImageStore;
                    if (globalStore && globalStore.images && globalStore.images.length > 0) {
                      // Create a compatible structure
                      nodeResult = {
                        images: globalStore.images,
                        firstImage: globalStore.images[0],
                        success: true,
                        ...(globalStore.lastGenerated || {})
                      };
                    }
                  }
                  
                  
                  if (nodeResult !== undefined && nodeResult !== null) {
                  // If there's a property path (e.g., .images[0]), navigate through it
                    if (propertyPath && propertyPath.trim()) {
                      const path = propertyPath.trim();
                      let current = nodeResult;
                      
                      // Handle property access like .images[0]
                      // Split by . and [ to handle both dot notation and array access
                      const pathParts = path.match(/(?:\.([a-zA-Z_$][a-zA-Z0-9_$]*)|[\(\d+\)])/g);
                      
                      if (pathParts) {
                        for (const part of pathParts) {
                          if (part.startsWith('.')) {
                            // Property access: .images
                            const propName = part.substring(1);
                            current = current?.[propName];
                          } else if (part.startsWith('[')) {
                            // Array access: [0]
                            const index = parseInt(part.substring(1, part.length - 1), 10);
                            if (Array.isArray(current)) {
                              current = current[index];
                            } else {
                              current = undefined;
                              break;
                            }
                          }
                          if (current === undefined || current === null) {
                            break;
                          }
                        }
                      }
                      
                      nodeResult = current;
                        } else {
                      // 🔧 CRITICAL FIX: For video-gen nodes without property path, automatically extract videoBase64
                      if (nodeId.includes('universal-video-gen') && typeof nodeResult === 'object' && nodeResult !== null && !Array.isArray(nodeResult)) {
                        // If nodeResult is already a string (from result variable), use it directly
                        if (typeof nodeResult === 'string' && nodeResult.startsWith('data:video/')) {
                          // Already a videoBase64 string
                        } else if (nodeResult.videoBase64) {
                          nodeResult = nodeResult.videoBase64;
                        } else if (nodeResult.data && nodeResult.data.videoBase64) {
                          nodeResult = nodeResult.data.videoBase64;
                        } else if (nodeResult.videoUrl) {
                          nodeResult = nodeResult.videoUrl;
                        }
                      }
                    }
                    

                    // Extract the actual value from the result
                    let extractedValue = nodeResult;
                    
                    // If it's an object, try to extract the actual value
                    if (typeof nodeResult === 'object' && nodeResult !== null && !Array.isArray(nodeResult)) {
                      // 🔧 CRITICAL FIX: For video-gen nodes, prioritize videoBase64
                      if (nodeId.includes('universal-video-gen') && nodeResult.videoBase64) {
                        extractedValue = nodeResult.videoBase64;
                      } else if (nodeId.includes('universal-video-gen') && nodeResult.videoUrl) {
                        extractedValue = nodeResult.videoUrl;
                      } else {
                      extractedValue = nodeResult.currentValue || 
                                       nodeResult.value || 
                                       nodeResult.data || 
                                       nodeResult.get?.() ||  // For input nodes with get() method
                                       nodeResult; // Keep the original object if no specific value found
                  }
                    }
                    
                    // Properly handle different data types
                    // ✅ CRITICAL FIX: Store the actual value (no string escaping) - will be inserted after JSON parsing
                    dataFlowValues[placeholderKey] = extractedValue;
                    placeholderCounter++;
                    return placeholder; // Return WITHOUT quotes (quotes are already in the template)
                  } else {
                    console.warn(`⚠️ NodeResult is null/undefined for ${nodeId}. Available nodes: ${Object.keys(flowResults.nodeResults || {})}`);
                    if (typeof window !== 'undefined' && (window as any).dataFlow) {
                      // 🔧 CRITICAL FIX: Try one more time to find video-gen result variable directly
                      if (nodeId.includes('universal-video-gen')) {
                        const videoResultVar = `${nodeId}_GeneratedVideo`;
                        if ((window as any).dataFlow[videoResultVar] !== undefined && (window as any).dataFlow[videoResultVar] !== null) {
                          const videoData = (window as any).dataFlow[videoResultVar];
                          dataFlowValues[placeholderKey] = videoData;
                          placeholderCounter++;
                          return placeholder;
                        }
                        // Also check if the full node result exists
                        if ((window as any).dataFlow[nodeId] !== undefined && (window as any).dataFlow[nodeId] !== null) {
                          const fullResult = (window as any).dataFlow[nodeId];
                          if (fullResult.videoBase64) {
                            dataFlowValues[placeholderKey] = fullResult.videoBase64;
                            placeholderCounter++;
                            return placeholder;
                          } else if (fullResult.videoUrl) {
                            dataFlowValues[placeholderKey] = fullResult.videoUrl;
                            placeholderCounter++;
                            return placeholder;
                          }
                        }
                      }
                    }
                    
                    // Return the properly serialized value (already JSON stringified for objects/arrays)
                    dataFlowValues[placeholderKey] = '';
                    placeholderCounter++;
                    return placeholder;
                  }
                } else {
                   console.warn(`⚠️ dataFlow.getByNodeId is not available`);
                  dataFlowValues[placeholderKey] = '';
                  placeholderCounter++;
                  return placeholder;
                }
              } catch (error) {
                 dataFlowValues[placeholderKey] = '';
                placeholderCounter++;
                return placeholder;
              }
            });
            
            // Handle dataFlow.current() expressions
            const dataFlowCurrentPattern = /\{\{\s*dataFlow\.current\(\)\s*\}\}/g;
            requestBody = requestBody.replace(dataFlowCurrentPattern, (match) => {
              try {
                if (typeof dataFlow !== 'undefined' && dataFlow.current) {
                  const currentResult = dataFlow.current();
                  let extractedValue = currentResult;
                  
                  if (typeof currentResult === 'object') {
                    extractedValue = currentResult.currentValue || 
                                     currentResult.value || 
                                     currentResult.data || 
                                     currentResult; // Keep the original object if no specific value found
                  }
                  
                  // Properly handle different data types
                  let finalValue;
                  if (Array.isArray(extractedValue)) {
                    // For arrays, serialize as JSON array
                    finalValue = JSON.stringify(extractedValue);
                  } else if (typeof extractedValue === 'object' && extractedValue !== null) {
                    // For objects, serialize as JSON object
                    finalValue = JSON.stringify(extractedValue);
                  } else {
                    // For primitives, convert to string
                    finalValue = String(extractedValue || '');
                  }
                  
                  // Return the properly serialized value (already JSON stringified for objects/arrays)
                  return finalValue;
                } else {
                  return '""';
                }
              } catch (error) {
                console.error('❌ Error processing dataFlow.current():', error);
                return '""';
              }
            });
            
            // Handle dataFlow.previous() expressions
            const dataFlowPreviousPattern = /\{\{\s*dataFlow\.previous\(\)\s*\}\}/g;
            requestBody = requestBody.replace(dataFlowPreviousPattern, (match) => {
              try {
                if (typeof dataFlow !== 'undefined' && dataFlow.previous) {
                  const previousResult = dataFlow.previous();
                  let extractedValue = previousResult;
                  
                  if (typeof previousResult === 'object') {
                    extractedValue = previousResult.currentValue || 
                                     previousResult.value || 
                                     previousResult.data || 
                                     previousResult; // Keep the original object if no specific value found
                  }
                  
                  // Properly handle different data types
                  let finalValue;
                  if (Array.isArray(extractedValue)) {
                    // For arrays, serialize as JSON array
                    finalValue = JSON.stringify(extractedValue);
                  } else if (typeof extractedValue === 'object' && extractedValue !== null) {
                    // For objects, serialize as JSON object
                    finalValue = JSON.stringify(extractedValue);
                  } else {
                    // For primitives, convert to string
                    finalValue = String(extractedValue || '');
                  }
                  
                  // Return the properly serialized value (already JSON stringified for objects/arrays)
                  return finalValue;
                } else {
                  return '""';
                }
              } catch (error) {
                console.error('❌ Error processing dataFlow.previous():', error);
                return '""';
              }
            });
          }
          
          // Replace template variables in the JSON body with proper JSON formatting
          requestBody = requestBody.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
            const trimmedVar = variable.trim();
            
            // Skip if this is a dataFlow expression (already processed above)
            if (trimmedVar.includes('dataFlow.')) {
              return match; // Keep as-is if dataFlow processing failed
            }
            
            // Try normalized context first, then original context
            let value = normalizedContext[trimmedVar];
            if (value === undefined) {
              value = normalizedContext[trimmedVar.toLowerCase().replace(/ /g, '_')];
            }
            if (value === undefined) {
              value = templateContext[trimmedVar.toLowerCase().replace(/ /g, '_')];
            }
            
            // ✅ CRITICAL FIX: Handle nested property access (e.g., "sheetTriggerResult.Name")
            if (value === undefined && trimmedVar.includes('.')) {
              const parts = trimmedVar.split('.');
              const baseVar = parts[0];
              
              // First, try to get the base variable from flowResults or dataFlow
              let baseValue = undefined;
              
              // Check flowResults directly
              if (flowResults[baseVar] !== undefined) {
                baseValue = flowResults[baseVar];
              }
                  // ✅ CRITICAL FIX: Check flowResults.variables (where API results are stored)
              else if (flowResults.variables && flowResults.variables[baseVar] !== undefined) {
                baseValue = flowResults.variables[baseVar];
              }
              // ✅ CRITICAL FIX: Check flowResults.apiResponses (where API results are stored)
              else if (flowResults.apiResponses && flowResults.apiResponses[baseVar] !== undefined) {
                baseValue = flowResults.apiResponses[baseVar];
              }
              // Try dataFlow.get() if available
              else if (typeof dataFlow !== 'undefined' && dataFlow.get) {
                baseValue = dataFlow.get(baseVar);
              }
              // Try normalized context
              else {
                baseValue = normalizedContext[baseVar];
                if (baseValue === undefined) {
                  baseValue = normalizedContext[baseVar.toLowerCase().replace(/ /g, '_')];
                }
                if (baseValue === undefined) {
                  baseValue = templateContext[baseVar];
                }
              }
              
              // If we found the base value, navigate through the property path
              if (baseValue !== undefined) {
                let current = baseValue;
                for (let i = 1; i < parts.length; i++) {
                  const part = parts[i];
                  if (!part) continue;
                  
                  // Try direct property access
                  if (typeof current === 'object' && current !== null && current[part] !== undefined) {
                    current = current[part];
                  }
                  // Try case-insensitive property access
                  else if (typeof current === 'object' && current !== null) {
                    const keys = Object.keys(current);
                    const matchingKey = keys.find(key => key.toLowerCase() === part.toLowerCase());
                    if (matchingKey && current[matchingKey] !== undefined) {
                      current = current[matchingKey];
                    } else {
                      current = undefined;
                      break;
                    }
                  } else {
                    current = undefined;
                    break;
                  }
                }
                
                if (current !== undefined) {
                  value = current;
                }
                   // ✅ CRITICAL FIX: If property not found and this looks like an API response, try data wrapper
                if (current === undefined && parts.length >= 2 && typeof baseValue === 'object' && baseValue !== null) {
                  // Check if baseValue has a 'data' property (common API response structure)
                  if (baseValue.data && typeof baseValue.data === 'object' && baseValue.data !== null) {
                    // Try accessing the property through data wrapper
                    const dataValue = baseValue.data[parts[1]];
                    if (dataValue !== undefined) {
                      // Continue navigating from data if there are more parts
                      current = dataValue;
                      for (let j = 2; j < parts.length; j++) {
                        const part = parts[j];
                        if (!part) continue;
                        if (typeof current === 'object' && current !== null && current[part] !== undefined) {
                          current = current[part];
                        } else {
                          current = undefined;
                          break;
                        }
                      }
                      if (current !== undefined) {
                        value = current;
                      }
                    }
                  }
                }
              }
              
              // Fallback: Try nested property access in normalized context
              if (value === undefined) {
                let current = normalizedContext;
                for (const part of parts) {
                  if (!part) continue;
                  current = current?.[part];
                  if (current === undefined) break;
                }
                
                if (current !== undefined) {
                  value = current;
                } else {
                  // Try original context
                  current = templateContext;
                  for (const part of parts) {
                    if (!part) continue;
                    current = current?.[part];
                    if (current === undefined) break;
                  }
                  value = current;
                }
              }
            }
            
            // ✅ CRITICAL FIX: Also check flowResults for simple variable names (without property access)
            if (value === undefined && !trimmedVar.includes('.')) {
              // Check flowResults directly
              if (flowResults[trimmedVar] !== undefined) {
                value = flowResults[trimmedVar];
              }
                // ✅ CRITICAL FIX: Check flowResults.variables (where API results are stored)
              else if (flowResults.variables && flowResults.variables[trimmedVar] !== undefined) {
                value = flowResults.variables[trimmedVar];
              }
              // ✅ CRITICAL FIX: Check flowResults.apiResponses (where API results are stored)
              else if (flowResults.apiResponses && flowResults.apiResponses[trimmedVar] !== undefined) {
                value = flowResults.apiResponses[trimmedVar];
              }
              // Try dataFlow.get() if available
              else if (typeof dataFlow !== 'undefined' && dataFlow.get) {
                value = dataFlow.get(trimmedVar);
              
              }
            }
            
            if (value !== undefined) {
              if (typeof value === 'object') {
                return JSON.stringify(value);
              }
              
              // ✅ IMPROVED: Check if the template variable is within quotes by analyzing JSON structure
              const matchIndex = requestBody.indexOf(match);
              const beforeMatch = requestBody.substring(Math.max(0, matchIndex - 100), matchIndex);
              const afterMatch = requestBody.substring(matchIndex + match.length, Math.min(requestBody.length, matchIndex + match.length + 100));
              
              // ✅ IMPROVED: Detect if we're inside a JSON string value by finding the opening quote
              // Look backwards to find if we're inside quotes (find the last unescaped quote before the match)
              let isInQuotedContext = false;
              let escaped = false;
              
              // Count unescaped quotes before the match and check if we're inside a string value
              for (let i = beforeMatch.length - 1; i >= 0; i--) {
                const char = beforeMatch[i];
                if (char === '\\' && !escaped) {
                  escaped = true;
                  continue;
                }
                if (char === '"' && !escaped) {
                  // Found an unescaped quote - check if it's the opening quote of a value
                  const beforeQuote = beforeMatch.substring(0, i);
                  // Check for pattern: "key" : " (opening quote for JSON string value)
                  if (beforeQuote.match(/:\s*"$/) || (beforeQuote.trim().endsWith(':') && beforeQuote.match(/"[^"]*"\s*:\s*$/))) {
                    isInQuotedContext = true;
                    break;
                  }
                }
                escaped = false;
              }
              
              // Also check simple case: quote before and quote after (complete quoted value)
              const hasQuoteBefore = beforeMatch.trim().endsWith('"');
              const hasQuoteAfter = afterMatch.trim().startsWith('"');
              if (!isInQuotedContext && hasQuoteBefore && hasQuoteAfter) {
                isInQuotedContext = true;
              }
              
              // ✅ ADDITIONAL CHECK: If there's a quote before but not immediately after, we might still be in quotes
              // This handles cases like "{{var}}_FbVideo" where var is part of a concatenated string
              if (!isInQuotedContext && hasQuoteBefore) {
                // Check if there's a closing quote somewhere after (even if not immediately)
                // This means we're inside a JSON string value
                isInQuotedContext = true;
              }
            
            // Comprehensive JSON string escaping function
              const escapeJsonString = (str : any) => {
                return String(str)
                  .replace(/\\/g, '\\\\')    // Escape backslashes
                  .replace(/"/g, '\\"')         // Escape double quotes
                  .replace(/\n/g, '\\n')       // Escape newlines
                  .replace(/\r/g, '\\r')       // Escape carriage returns
                  .replace(/\t/g, '\\t')       // Escape tabs
                  .replace(/\f/g, '\\f')       // Escape form feeds
                  .replace(/\x08/g, '\\b')     // Escape actual backspace characters (0x08), not word boundaries
                  .replace(/[\x00-\x07\x09-\x1F\x7F]/g, (char) => {
                    // Escape all control characters (0-31 and 127) except backspace (0x08) which is handled above
                    return '\\u' + ('0000' + char.charCodeAt(0).toString(16)).slice(-4);
                  });
              };
              
              // CRITICAL: Handle boolean, number, and null values - they should NOT be quoted in JSON
              if (typeof value === 'boolean' || typeof value === 'number' || value === null) {
                // If we're in a quoted context but have a non-string value, convert to string and escape
                if (isInQuotedContext) {
                  return escapeJsonString(String(value));
                }
                return String(value); // Return as-is: true, false, null, or number
              }
              
              if (isInQuotedContext) {
                // ✅ FIX: Value is already in quotes, just escape and return the raw value (no extra quotes)
                // This handles cases like "{{var}}_FbVideo" where var should be inserted without breaking JSON
                return escapeJsonString(value);
              } else {
                // Value needs to be quoted, add quotes and escape
                return '"' + escapeJsonString(value) + '"';
              }
            }
            
            // ✅ IMPROVED: Check if we're in a quoted context to return proper JSON value
            const matchIndex = requestBody.indexOf(match);
            const beforeMatch = requestBody.substring(Math.max(0, matchIndex - 100), matchIndex);
            const afterMatch = requestBody.substring(matchIndex + match.length, Math.min(requestBody.length, matchIndex + match.length + 100));
            
            // ✅ IMPROVED: Better detection of quoted context
            let isInQuotedContext = false;
            let escaped = false;
            for (let i = beforeMatch.length - 1; i >= 0; i--) {
              const char = beforeMatch[i];
              if (char === '\\' && !escaped) {
                escaped = true;
                continue;
              }
              if (char === '"' && !escaped) {
                const beforeQuote = beforeMatch.substring(0, i);
                if (beforeQuote.match(/:\s*"$/) || (beforeQuote.trim().endsWith(':') && beforeQuote.match(/"[^"]*"\s*:\s*$/))) {
                  isInQuotedContext = true;
                  break;
                }
              }
              escaped = false;
            }
            
            const hasQuoteBefore = beforeMatch.trim().endsWith('"');
            const hasQuoteAfter = afterMatch.trim().startsWith('"');
            if (!isInQuotedContext && hasQuoteBefore && hasQuoteAfter) {
              isInQuotedContext = true;
            }
            
            // ✅ ADDITIONAL CHECK: If there's a quote before, we're likely in a quoted context
            if (!isInQuotedContext && hasQuoteBefore) {
              isInQuotedContext = true;
            }
            
            if (isInQuotedContext) {
              return ''; // Return empty string for quoted context
            } else {
              return '""'; // Return quoted empty string for unquoted context
            }
          });
          
          // Parse and stringify to ensure valid JSON
          console.log('📋 Processed request body (before JSON parse):', requestBody.substring(0, 500) + (requestBody.length > 500 ? '...' : ''));

          // ✅ CRITICAL FIX: Check if the entire body is just a placeholder (not wrapped in JSON)
          const trimmedBody = requestBody.trim();
          if (trimmedBody.startsWith('__DATEFLOW_PLACEHOLDER_') && trimmedBody.endsWith('__')) {
            // The entire body is a placeholder - replace it directly
            const placeholderKey = `"${trimmedBody}"`;
            const placeholderKeyNoQuotes = trimmedBody;
            
            let replacementValue = undefined;
            if (dataFlowValues[placeholderKey] !== undefined) {
              replacementValue = dataFlowValues[placeholderKey];
            } else if (dataFlowValues[placeholderKeyNoQuotes] !== undefined) {
              replacementValue = dataFlowValues[placeholderKeyNoQuotes];
            }
            
            if (replacementValue !== undefined) {
              // If replacement is an object/array, stringify it; otherwise wrap in object
              if (typeof replacementValue === 'object' && replacementValue !== null) {
                requestBody = JSON.stringify(replacementValue);
              } else {
                // Wrap primitive values in an object for API consistency
                requestBody = JSON.stringify({ value: replacementValue });
              }
            } else {
              console.warn(`⚠️ Entire body placeholder ${trimmedBody} not found in dataFlowValues. Available placeholders: ${Object.keys(dataFlowValues)}`);
              requestBody = '{}'; // Fallback to empty object
            }
          }

          try {
            const parsedBody = JSON.parse(requestBody);
             
            // Step 2: Replace placeholders with actual values from dataFlowValues
            const replacePlaceholders = (obj: any): any => {
              if (Array.isArray(obj)) {
                return obj.map(item => replacePlaceholders(item));
              } else if (obj !== null && typeof obj === 'object') {
                const result: any = {};
                for (const [key, value] of Object.entries(obj)) {
                  if (typeof value === 'string' && value.startsWith('__DATEFLOW_PLACEHOLDER_') && value.endsWith('__')) {
                    // Found a placeholder (without quotes, as parsed from JSON) - replace with actual value
                    // Try both with and without quotes in the lookup key
                    const lookupKeyWithQuotes = `"${value}"`;
                    const lookupKeyWithoutQuotes = value;
                    
                    let replacementValue = undefined;
                    if (dataFlowValues[lookupKeyWithQuotes] !== undefined) {
                      replacementValue = dataFlowValues[lookupKeyWithQuotes];
                    } else if (dataFlowValues[lookupKeyWithoutQuotes] !== undefined) {
                      replacementValue = dataFlowValues[lookupKeyWithoutQuotes];
                    }
                    
                    if (replacementValue !== undefined) {
                      result[key] = replacementValue;
                    } else {
                      result[key] = '';
                      console.warn(`⚠️ Placeholder ${value} not found in dataFlowValues. Available placeholders: ${Object.keys(dataFlowValues)}`);
                    }
                  } else {
                    result[key] = replacePlaceholders(value);
                  }
                }
                return result;
              } else if (typeof obj === 'string' && obj.startsWith('__DATEFLOW_PLACEHOLDER_') && obj.endsWith('__')) {
                // Handle string placeholder (direct value without quotes)
                // Try both with and without quotes in the lookup key
                const lookupKeyWithQuotes = `"${obj}"`;
                const lookupKeyWithoutQuotes = obj;
                
                if (dataFlowValues[lookupKeyWithQuotes] !== undefined) {
                  return dataFlowValues[lookupKeyWithQuotes];
                } else if (dataFlowValues[lookupKeyWithoutQuotes] !== undefined) {
                  return dataFlowValues[lookupKeyWithoutQuotes];
                }
                return '';
              }
              return obj;
            };
            
            const finalBody = replacePlaceholders(parsedBody);
            
            // 🔧 ENHANCED: Process template expressions recursively in nested object values
            const processTemplatesInObject = (obj: any, context: any, parentKey?: string): any => {
              if (typeof obj === 'string') {
                if (obj.includes('{{') && obj.includes('}}')) {
                  const processed = TemplateExpressionEngine.processTemplate(obj, context);
                 
                  return processed;
                }
               
                return obj;
              } else if (Array.isArray(obj)) {
                return obj.map(item => processTemplatesInObject(item, context, parentKey));
              } else if (obj && typeof obj === 'object') {
                const processed: any = {};
                Object.keys(obj).forEach(key => {
                  processed[key] = processTemplatesInObject(obj[key], context, key);
                });
                return processed;
              }
              return obj;
            };
            
            // Build template context for recursive processing
            const buildTemplateContext = (): any => {
              const context: any = {};
              
              // Add all flowResults variables to context
              if (flowResults?.variables) {
                Object.assign(context, flowResults.variables);
              }
              
              // Add all flowResults top-level properties (but exclude internal structures)
              Object.keys(flowResults || {}).forEach(key => {
                if (key !== 'nodeResults' && key !== 'apiResponses' && key !== 'variables' && key !== 'originalChainData') {
                  if (!context[key]) {
                    context[key] = flowResults[key];
                  }
                }
              });
              
              // Add currentResult properties
              if (typeof currentResult !== 'undefined' && currentResult && typeof currentResult === 'object') {
                Object.keys(currentResult).forEach(key => {
                  if (!context[key]) {
                    context[key] = currentResult[key];
                  }
                });
              }
              
              // Add previousResult properties
              if (typeof previousResult !== 'undefined' && previousResult && typeof previousResult === 'object') {
                Object.keys(previousResult).forEach(key => {
                  if (!context[key]) {
                    context[key] = previousResult[key];
                  }
                });
              }

              // Add batchResult to context if available
          if (typeof batchResult !== 'undefined' && batchResult !== null) {
            context.batchResult = batchResult;
          }
              
              // Add apiResponses to context (for accessing previous API results)
              if (flowResults?.apiResponses) {
                Object.keys(flowResults.apiResponses).forEach(key => {
                  if (!context[key]) {
                    context[key] = flowResults.apiResponses[key];
                  }
                });
              }
              
              // Add normalizedContext properties if available
              if (typeof normalizedContext !== 'undefined' && normalizedContext) {
                Object.keys(normalizedContext).forEach(key => {
                  if (!context[key]) {
                    context[key] = normalizedContext[key];
                  }
                });
              }
              
              // Add templateContext properties if available
              if (typeof templateContext !== 'undefined' && templateContext) {
                Object.keys(templateContext).forEach(key => {
                  if (!context[key]) {
                    context[key] = templateContext[key];
                  }
                });
              }
              
              return context;
            };
            
            // Process templates recursively in the final body
            const templateContextForRecursion = buildTemplateContext();
            const processedFinalBody = processTemplatesInObject(finalBody, templateContextForRecursion);
            
            // Step 3: Stringify the final object
            requestBody = JSON.stringify(processedFinalBody);
            
            // 🔍 DEBUG: Log final parsed values
            console.log('📸 EXTRACTED VALUES FROM FINAL REQUEST BODY:');
            console.log('  - image_url:', finalBody.image_url ? (String(finalBody.image_url).substring(0, 100) + (String(finalBody.image_url).length > 100 ? '...' : '')) : 'EMPTY');
            console.log('  - video_url:', finalBody.video_url ? (String(finalBody.video_url).substring(0, 100) + (String(finalBody.video_url).length > 100 ? '...' : '')) : 'EMPTY');
            console.log('  - brand_id:', finalBody.brand_id);
            console.log('  - campaign_id:', finalBody.campaign_id);
          } catch (parseError : any) {
            console.error('❌ JSON Parse Error Details:', {
              error: parseError.message,
              requestBody: requestBody,
              bodyLength: requestBody.length,
              // Show characters around the error position if available
              errorPosition: parseError.message.match(/position (\d+)/) ? 
                parseInt(parseError.message.match(/position (\d+)/)[1]) : null,
              // Show a snippet around the error position
              errorSnippet: parseError.message.match(/position (\d+)/) ? 
                requestBody.substring(
                  Math.max(0, parseInt(parseError.message.match(/position (\d+)/)[1]) - 20),
                  Math.min(requestBody.length, parseInt(parseError.message.match(/position (\d+)/)[1]) + 20)
                ) : null
            });
            
            // Try to fix common JSON issues
            let fixedBody = requestBody;
            
            // Fix double quotes around string values (most common issue)
            fixedBody = fixedBody.replace(/:\s*""([^"]*)""/g, ': "$1"');
            
            // Fix trailing commas
            fixedBody = fixedBody.replace(/,(\s*[}\]])/g, '$1');
            
            // Fix triple or more quotes
            fixedBody = fixedBody.replace(/"{3,}/g, '"');
            
            // Fix missing quotes around string values (but not around numbers/booleans)
            fixedBody = fixedBody.replace(/:\s*([^",{}[\]]+)(?=\s*[,}])/g, (match, value) => {
              const trimmedValue = value.trim();
              // Check if it's already quoted, a number, boolean, null, or object/array
              if (trimmedValue.startsWith('"') || trimmedValue.startsWith('{') || trimmedValue.startsWith('[') || 
                  /^(true|false|null|\d+\.?\d*)$/.test(trimmedValue)) {
                return match;
              }
              return ': "' + trimmedValue + '"';
            });
            
            try {
              const parsedFixedBody = JSON.parse(fixedBody);
              requestBody = JSON.stringify(parsedFixedBody);
            } catch (secondError : any) {
              console.error('❌ Could not fix JSON template, falling back to form data extraction:', secondError.message);
              throw secondError; // Continue to fallback
            }
          }
        } catch (error) {
          console.error('❌ Error processing JSON template:', error);
          
                     // Fallback to extracting data directly
           let requestData : any = {};
          
          // Extract form data from various possible locations with priority order
          if (typeof processedInput_db_api_post_1770831673235 === 'object' && processedInput_db_api_post_1770831673235 !== null) {
            // PRIORITY 1: Use formData property (actual form values)
            if (processedInput_db_api_post_1770831673235?.formData && typeof processedInput_db_api_post_1770831673235.formData === 'object') {
              // Normalize field names in formData
              Object.entries(processedInput_db_api_post_1770831673235.formData).forEach(([key, value]) => {
                if (!key.startsWith('_')) {
                  let normalizedKey = key.toLowerCase().replace(/ /g, '_');
                  
                  // Handle special checkbox fields
                  if (key.toLowerCase().includes('agree') || 
                      key.toLowerCase().includes('contact') || 
                      key.toLowerCase().includes('consent') ||
                      key.toLowerCase().includes('terms') ||
                      key.toLowerCase().includes('privacy') ||
                      (typeof value === 'boolean' && key.length > 10)) {
                    normalizedKey = 'checkbox';
                  }
                  
                  requestData[normalizedKey] = value;
                }
              });
            }
            // PRIORITY 2: Use inputData if it's not null and contains actual data
            else if (processedInput_db_api_post_1770831673235?.inputData && 
                     processedInput_db_api_post_1770831673235.inputData !== null &&
                     typeof processedInput_db_api_post_1770831673235.inputData === 'object' &&
                     Object.keys(processedInput_db_api_post_1770831673235.inputData).length > 0) {
              // Normalize field names in inputData
              Object.entries(processedInput_db_api_post_1770831673235.inputData).forEach(([key, value]) => {
                if (!key.startsWith('_')) {
                  let normalizedKey = key.toLowerCase().replace(/ /g, '_');
                  
                  // Handle special checkbox fields
                  if (key.toLowerCase().includes('agree') || 
                      key.toLowerCase().includes('contact') || 
                      key.toLowerCase().includes('consent') ||
                      key.toLowerCase().includes('terms') ||
                      key.toLowerCase().includes('privacy') ||
                      (typeof value === 'boolean' && key.length > 10)) {
                    normalizedKey = 'checkbox';
                  }
                  
                  requestData[normalizedKey] = value;
                }
              });
            }
            // PRIORITY 3: Extract from top-level, but EXCLUDE button/form metadata
            else {
              Object.entries(processedInput_db_api_post_1770831673235).forEach(([key, value]) => {
                // EXCLUDE button/form metadata, only include actual form field data
                if (!key.startsWith('_') && 
                    key !== 'formId' &&        // EXCLUDE form metadata
                    key !== 'clicked' &&       // EXCLUDE button metadata
                    key !== 'buttonId' &&      // EXCLUDE button metadata
                    key !== 'trigger' &&       // EXCLUDE metadata
                    key !== 'timestamp' &&     // EXCLUDE metadata
                    key !== 'inputData' &&     // EXCLUDE null inputData
                    key !== 'nodeResults' &&
                    key !== 'apiResponses' &&
                    key !== 'variables' &&
                    key !== 'calculations' &&
                    key !== 'aiResponses' &&
                    key !== 'originalChainData' &&
                    typeof value !== 'object') { // Only include simple values
                  
                  let normalizedKey = key.toLowerCase().replace(/ /g, '_');
                  
                  // Handle special checkbox fields
                  if (key.toLowerCase().includes('agree') || 
                      key.toLowerCase().includes('contact') || 
                      key.toLowerCase().includes('consent') ||
                      key.toLowerCase().includes('terms') ||
                      key.toLowerCase().includes('privacy') ||
                      (typeof value === 'boolean' && key.length > 10)) {
                    normalizedKey = 'checkbox';
                  }
                  
                  requestData[normalizedKey] = value;
                }
              });
            }
          }
          
          // 🔧 ENHANCED: Flatten nested objects for database APIs
          if (true || apiEndpoint_db_api_post_1770831673235.includes('/api/form/component-generated-')) {
            requestData = flattenNestedObjects(requestData);
          }
          
          // Convert all values to strings to ensure consistent API payload format
          const stringifiedRequestData : any = {};
          Object.entries(requestData).forEach(([key, value]) => {
            if (value !== null && value !== undefined) {
              if (typeof value === 'object') {
                // Keep objects/arrays as-is (will be JSON stringified)
                stringifiedRequestData[key] = value;
              } else {
                // Convert primitives (numbers, booleans) to strings
                stringifiedRequestData[key] = String(value);
              }
            } else {
              stringifiedRequestData[key] = "";
            }
          });
          
          // Use the extracted data as the request body with all values as strings
          requestBody = JSON.stringify(stringifiedRequestData);
        }
      }
      
      // Generate vector embedding if enabled
      
      
      // Prepare request options
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      // Add custom headers if provided
      
      const customHeaders = [{"key":"Content-Type","value":"application/json"},{"key":"Authorization","value":"Bearer {{auth_token}}"}];
      if (Array.isArray(customHeaders)) {
        customHeaders.forEach(header => {
          if (header.key && header.value) {
            requestHeaders[header.key] = String(header.value);
          }
        });
      }
      
      const controller = new AbortController();
      const requestOptions: RequestInit = {
        method: 'POST',
        headers: requestHeaders,
        body: requestBody,
        signal: controller.signal
      };

       // Calculate timeout based on request body size
         const requestBodySize = requestBody ? new Blob([requestBody]).size : 0;

         // Convert bytes → MB
         const sizeInMB = requestBodySize / (1024 * 1024);
   
         // Check if request contains large media files (base64 video/image data)
         let hasLargeMedia = false;
         let mediaSizeMB = 0;
         try {
           const parsedBody = JSON.parse(requestBody);
           // Check for video_url or image_url with base64 data
           if (parsedBody.video_url && typeof parsedBody.video_url === 'string' && parsedBody.video_url.startsWith('data:video')) {
             hasLargeMedia = true;
             // Base64 data is ~33% larger than original, estimate original size
             const base64Data = parsedBody.video_url.split(',')[1] || '';
             mediaSizeMB = (base64Data.length * 0.75) / (1024 * 1024); // Approximate original size
           }
           if (parsedBody.image_url && typeof parsedBody.image_url === 'string' && parsedBody.image_url.startsWith('data:image')) {
             hasLargeMedia = true;
             const base64Data = parsedBody.image_url.split(',')[1] || '';
             const imgSizeMB = (base64Data.length * 0.75) / (1024 * 1024);
             mediaSizeMB = Math.max(mediaSizeMB, imgSizeMB);
           }
         } catch (e) {
           // If parsing fails, continue with default calculation
         }
   
         // Timeout calculation - Increased for large payloads
         const BASE_TIMEOUT = 60000;          // 30 seconds (increased from 15s)
         const TIMEOUT_PER_MB = 60000;        // 15 seconds per MB (increased from 6s)
         const MEDIA_TIMEOUT_MULTIPLIER = 8.0; // Extra time for media uploads (increased from 2.5x)
         const MAX_TIMEOUT = 900000;          // 10 minutes cap (increased from 5 minutes)
   
         let timeoutDuration = BASE_TIMEOUT + Math.ceil(sizeInMB) * TIMEOUT_PER_MB;
   
         // Add extra timeout for media files
         if (hasLargeMedia && mediaSizeMB > 0) {
           timeoutDuration += Math.ceil(mediaSizeMB) * TIMEOUT_PER_MB * MEDIA_TIMEOUT_MULTIPLIER;
         }
   
         // Cap the timeout
         timeoutDuration = Math.min(timeoutDuration, MAX_TIMEOUT);
   

         const timeoutMessage =
           sizeInMB > 1
             ? `Request timeout after ${timeoutDuration / 1000}s (${Math.ceil(sizeInMB)}MB payload)`
             : `Request timeout after ${timeoutDuration / 1000}s`;

      
      // Add timeout handling
        const timeoutId = setTimeout(() => controller.abort(timeoutMessage), timeoutDuration);
      
        try {
          postResponse = await fetch(fullApiUrl, requestOptions);

      clearTimeout(timeoutId);
      
      if (!postResponse.ok) {
        const errorText = await postResponse.text();
        throw new Error(`API POST request failed: ${postResponse.status} - ${postResponse.statusText}. Response: ${errorText}`);
      }
      
      const responseData = await postResponse.json();
      
      // Hide loader after successful API request
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('apiLoadingEnd', { 
          detail: { 
            success: true,
            endpoint: apiEndpoint_db_api_post_1770831673235,
            method: 'POST',
            nodeId: 'db-api-post-1770831673235',
            response: responseData
          } 
        }));
      }
      
      // Update result variable (EXISTING FUNCTIONALITY - PRESERVED)
      step2Result = {
        ...currentResult,
        apiResult: responseData,
        apiSuccess: true,
        apiStatus: postResponse.status,
        requestData: JSON.parse(requestBody)
      };
      
      // 🔧 ENHANCED: Store in Data Flow System for UI Components
      if (!flowResults.apiResponses) flowResults.apiResponses = {};
      if (!flowResults.nodeResults) flowResults.nodeResults = {};
      if (!flowResults.variables) flowResults.variables = {};
      
      // Store the result in multiple accessible locations
      const resultVariable = "postVitality_formResult";
      flowResults.apiResponses[resultVariable] = responseData;
      flowResults.variables[resultVariable] = responseData;
      flowResults.nodeResults["db-api-post-1770831673235"] = {
        data: responseData,
        displayName: resultVariable,
        nodeType: "api-post",
        success: true,
        status: postResponse.status,
        stepNumber: (flowResults.stepCounter || 0) + 1
      };
      
      // Store current result for dataFlow.current() and dataFlow.previous()
      flowResults.previousResult = flowResults.currentResult;
      flowResults.currentResult = responseData;
      
      // Increment step counter for proper sequencing
      flowResults.stepCounter = (flowResults.stepCounter || 0) + 1;

        } finally {
          // Always clear timeout to prevent memory leaks
          clearTimeout(timeoutId);
        }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
            const isTimeoutError = errorMessage.includes('timeout') || errorMessage.includes('aborted') || 
                            (error instanceof Error && error.name === 'AbortError');
      console.error('🚨 API POST Error:', error);
      
      // Hide loader after API request error
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('apiLoadingEnd', { 
          detail: { 
            success: false,
            endpoint: 'apiEndpoint_db_api_post_1770831673235',
            method: 'POST',
            nodeId: 'db-api-post-1770831673235',
            error: errorMessage || 'Unknown API error'
          } 
        }));
      }
      
      step2Result = {
        ...currentResult,
        apiResult: null,
        apiError: errorMessage || 'Unknown API error',
        apiSuccess: false
      };
      
      // 🔧 ENHANCED: Store error state in Data Flow System
      if (!flowResults.apiResponses) flowResults.apiResponses = {};
      if (!flowResults.nodeResults) flowResults.nodeResults = {};
      if (!flowResults.variables) flowResults.variables = {};
      
      const resultVariable = "postVitality_formResult";
      flowResults.apiResponses[resultVariable] = null;
      flowResults.variables[resultVariable] = null;
      flowResults.nodeResults["db-api-post-1770831673235"] = {
        data: null,
        error: errorMessage || 'Unknown API error',
        displayName: resultVariable,
        nodeType: "api-post",
        success: false,
        stepNumber: (flowResults.stepCounter || 0) + 1
      };
    }
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['db-api-post-1770831673235'] = {
      nodeId: 'db-api-post-1770831673235',
      nodeType: 'db-api-post',
      stepNumber: 2,
      displayName: 'apiPostResult_db_api_post_1770831673235',
      data: step2Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    flowResults.apiResponses['apiPostResult_db_api_post_1770831673235'] = step2Result;
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['apiPostResult_db_api_post_1770831673235'] || typeof flowResults['apiPostResult_db_api_post_1770831673235'] === 'undefined') {
      flowResults['apiPostResult_db_api_post_1770831673235'] = step2Result;
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
      console.error('❌ Error in step 2 (db-api-post):', stepError);
      flowErrors.push(`Step 2 (db-api-post): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step2Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'db-api-post',
        nodeId: 'db-api-post-1770831673235',
        stepNumber: 2
      };
      
      currentResult = step2Result; // Update currentResult even on error
      
      // Store error result in enhanced data flow system
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['db-api-post-1770831673235'] = {
      nodeId: 'db-api-post-1770831673235',
      nodeType: 'db-api-post',
      stepNumber: 2,
      displayName: 'apiPostResult_db_api_post_1770831673235',
      data: step2Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    flowResults.apiResponses['apiPostResult_db_api_post_1770831673235'] = step2Result;
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['apiPostResult_db_api_post_1770831673235'] || typeof flowResults['apiPostResult_db_api_post_1770831673235'] === 'undefined') {
      flowResults['apiPostResult_db_api_post_1770831673235'] = step2Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
    }

    step3Result = currentResult;
    try {
      
      
        // Safe conversion helper - handle objects properly
        const rawInput = (() => {
          try {
            // Comprehensive dataFlow expression handling
            if (typeof dataFlow !== 'undefined') {
              const result = dataFlow.getByNodeId("google-sheets-trigger-1770831498824").rowData.Name;
              console.log('🔗 DataFlow expression "dataFlow.getByNodeId("google-sheets-trigger-1770831498824").rowData.Name" result:', result);
              
              // Handle different result types
              if (result !== undefined && result !== null) {
                // Extract actual value from result object if needed
                let extractedValue = result;
                if (typeof result === 'object' && !Array.isArray(result)) {
                  extractedValue = result.currentValue || result.value || result.data || result;
                }
                return extractedValue;
              }
            }
            console.warn('⚠️ DataFlow expression "dataFlow.getByNodeId("google-sheets-trigger-1770831498824").rowData.Name" returned null/undefined');
            return null;
          } catch (error) {
            console.error('❌ DataFlow expression "dataFlow.getByNodeId("google-sheets-trigger-1770831498824").rowData.Name" failed:', error);
            return null;
          }
        })() || '';
        
        // Keep the original data for array detection, but also have string version
        let inputContent = rawInput;
        

      
      step3Result;
      
      try {
        
        let parsedData;
        
        // Raw format processing - convert to JSON string for display
        if (typeof inputContent === 'object' && inputContent !== null) {
          
          // Always convert objects/arrays to formatted JSON string
          if (Array.isArray(inputContent)) {
            // For arrays, create a clean JSON string representation
            step3Result = JSON.stringify(inputContent, null, 2);
          } else {
            // For objects, create formatted JSON string
            step3Result = JSON.stringify(inputContent, null, 2);
          }
        } else {
          step3Result = String(inputContent);
        }
        
        // Ensure the result is always a string
        step3Result = String(step3Result);
        
        
      } catch (error) {
        
        // Default error handling - return error message
        step3Result = `JSON Parse Error: ${(error as Error).message}`;
        
        // Ensure the result is always a string
        step3Result = String(step3Result);
      }
      
      // Store result in flow results for dataFlow access
      flowResults.jsonStringParserResult = step3Result;
      
      // Ensure dataFlow.current() works by updating currentResult
      flowResults.previousResult = flowResults.currentResult;
      flowResults.currentResult = step3Result;
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['json-string-parser-1770831703679'] = {
      nodeId: 'json-string-parser-1770831703679',
      nodeType: 'json-string-parser',
      stepNumber: 3,
      displayName: 'jsonStringParserResult',
      data: step3Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for json-string-parser
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['jsonStringParserResult'] || typeof flowResults['jsonStringParserResult'] === 'undefined') {
      flowResults['jsonStringParserResult'] = step3Result;
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
      console.error('❌ Error in step 3 (json-string-parser):', stepError);
      flowErrors.push(`Step 3 (json-string-parser): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step3Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'json-string-parser',
        nodeId: 'json-string-parser-1770831703679',
        stepNumber: 3
      };
      
      currentResult = step3Result; // Update currentResult even on error
      
      // Store error result in enhanced data flow system
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['json-string-parser-1770831703679'] = {
      nodeId: 'json-string-parser-1770831703679',
      nodeType: 'json-string-parser',
      stepNumber: 3,
      displayName: 'jsonStringParserResult',
      data: step3Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for json-string-parser
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['jsonStringParserResult'] || typeof flowResults['jsonStringParserResult'] === 'undefined') {
      flowResults['jsonStringParserResult'] = step3Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
    }

    step4Result = currentResult;
    try {
      
    // === TELEGRAM MESSAGE OPERATION ===
    step4Result = currentResult;
    
    // Handle input data (evaluate dataFlow expressions if present)
    let processedInput_telegram_send_message_1770832326787 = currentResult;
    

     // Declare replacePathParameters function at function scope level
        var replacePathParameters: ((endpoint: string, context: any, flowResults: any, dataFlow: any, nodeConfig?: any) => Promise<string>) | undefined = undefined;


    // Enhanced DataFlow Expression Handler - Supports both single and multiple expressions
    if (typeof processedInput_telegram_send_message_1770832326787 === 'string' && processedInput_telegram_send_message_1770832326787.includes('dataFlow.')) {
      try {
        // Check if dataFlow is available
        if (typeof dataFlow !== 'undefined') {
          
          // PRIORITY 1: Handle multiple {{dataFlow.getByNodeId()}} expressions first
          if (processedInput_telegram_send_message_1770832326787.includes('{{dataFlow.getByNodeId(') && processedInput_telegram_send_message_1770832326787.includes('}}')) {
            
            // Handle multiple {{dataFlow.getByNodeId("...").PropertyName}} expressions with property access
const openBrace = '{{';
const closeBrace = '}}';
const functionCall = 'dataFlow.getByNodeId\\(["\']([^"\']+)["\']\\)';
const propertyAccess = '(?:\\.([a-zA-Z_$][a-zA-Z0-9_$]*))?';
const multiDataFlowRegex = new RegExp(openBrace + functionCall + propertyAccess + closeBrace, 'g');

            let processedVariable = processedInput_telegram_send_message_1770832326787;
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
              processedInput_telegram_send_message_1770832326787 = processedVariable;
            }
          }
          
          // PRIORITY 2: Handle legacy single dataFlow.getByNodeId() without braces (backwards compatibility)
          else if (processedInput_telegram_send_message_1770832326787.includes('dataFlow.getByNodeId(') && !processedInput_telegram_send_message_1770832326787.includes('{{') && !processedInput_telegram_send_message_1770832326787.includes('}}')) {
            // Extract node ID and property access from pattern: dataFlow.getByNodeId('nodeId').PropertyName
            const legacyNodeIdMatch = processedInput_telegram_send_message_1770832326787.match(/dataFlow\.getByNodeId\(['"]([^'"]+)['"]\)(?:\.([a-zA-Z_$][a-zA-Z0-9_$]*))?/);
            if (legacyNodeIdMatch) {
              const nodeId = legacyNodeIdMatch[1];
              const propertyName = legacyNodeIdMatch[2]; // Capture property name after function call (e.g., .Name)
              
              const result = dataFlow.getByNodeId(nodeId);
              if (result !== undefined && result !== null) {
                // CRITICAL FIX: Check if user specified a property name (e.g., .Name, .Email)
                if (propertyName) {
                  // Try direct property access first (most common for form fields)
                  if (typeof result === 'object' && result[propertyName] !== undefined) {
                    processedInput_telegram_send_message_1770832326787 = String(result[propertyName]);
                  }
                  // Try in formData
                  else if (result.formData && result.formData[propertyName] !== undefined) {
                    processedInput_telegram_send_message_1770832326787 = String(result.formData[propertyName]);
                  }
                  // Try in inputData
                  else if (result.inputData && result.inputData[propertyName] !== undefined) {
                    processedInput_telegram_send_message_1770832326787 = String(result.inputData[propertyName]);
                  }
                  // Try in data
                  else if (result.data && result.data[propertyName] !== undefined) {
                    processedInput_telegram_send_message_1770832326787 = String(result.data[propertyName]);
                  }
                  // Try case-insensitive property access for form fields
                  else if (typeof result === 'object') {
                    const resultKeys = Object.keys(result);
                    const matchingKey = resultKeys.find(key => key.toLowerCase() === propertyName.toLowerCase());
                    if (matchingKey && result[matchingKey] !== undefined) {
                      processedInput_telegram_send_message_1770832326787 = String(result[matchingKey]);
                    } else {
                      console.warn(`⚠️ Legacy: Property '${propertyName}' not found in result object. Available keys:`, resultKeys);
                      processedInput_telegram_send_message_1770832326787 = '[property not found: ' + propertyName + ']';
                    }
                  } else {
                    console.warn(`⚠️ Legacy: Cannot access property '${propertyName}' on non-object result`);
                    processedInput_telegram_send_message_1770832326787 = '[invalid property access]';
                  }
                } else {
                  // No property specified - use auto-extraction
                  if (typeof result === 'object') {
                    processedInput_telegram_send_message_1770832326787 = result.currentValue || result.value || result.data || String(result);
                  } else {
                    processedInput_telegram_send_message_1770832326787 = String(result);
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
                      processedInput_telegram_send_message_1770832326787 = String(fallbackValue);
                    } else {
                      processedInput_telegram_send_message_1770832326787 = '[data not available]';
                    }
                  } else {
                    processedInput_telegram_send_message_1770832326787 = '[data not available]';
                  }
                } catch (fallbackError) {
                  console.warn('⚠️ Enhanced Template: Error in batchResult fallback:', fallbackError);
                  processedInput_telegram_send_message_1770832326787 = '[data not available]';
                }
              }
            }
          } else if (processedInput_telegram_send_message_1770832326787.includes('dataFlow.current()')) {
            const result = dataFlow.current();
            if (result !== undefined && result !== null) {
              if (typeof result === 'object') {
                processedInput_telegram_send_message_1770832326787 = result.currentValue || result.value || result.data || String(result);
              } else {
                processedInput_telegram_send_message_1770832326787 = String(result);
              }
            } else {
              processedInput_telegram_send_message_1770832326787 = '[current data not available]';
            }
          } else if (processedInput_telegram_send_message_1770832326787.includes('dataFlow.previous()')) {
            const result = dataFlow.previous();
            if (result !== undefined && result !== null) {
              if (typeof result === 'object') {
                processedInput_telegram_send_message_1770832326787 = result.currentValue || result.value || result.data || String(result);
              } else {
                processedInput_telegram_send_message_1770832326787 = String(result);
              }
            } else {
              processedInput_telegram_send_message_1770832326787 = '[previous data not available]';
            }
          } else if (processedInput_telegram_send_message_1770832326787.includes('dataFlow.get(')) {
            // Extract variable name from pattern: dataFlow.get('varName')
            const varNameMatch = processedInput_telegram_send_message_1770832326787.match(/dataFlow\.get\(['"]([^'"]+)['"]\)/);
            if (varNameMatch) {
              const varName = varNameMatch[1];
              const result = dataFlow.get(varName);
              if (result !== undefined && result !== null) {
                if (typeof result === 'object') {
                  processedInput_telegram_send_message_1770832326787 = result.currentValue || result.value || result.data || String(result);
                } else {
                  processedInput_telegram_send_message_1770832326787 = String(result);
                }
              } else {
                processedInput_telegram_send_message_1770832326787 = '[variable not available]';
              }
            }
          }
        } else {
          console.warn('⚠️ dataFlow not available in scope');
          processedInput_telegram_send_message_1770832326787 = '[dataFlow not available]';
        }
      } catch (error) {
        console.error('❌ Error evaluating dataFlow expression:', error);
        processedInput_telegram_send_message_1770832326787 = '[dataFlow evaluation error]';
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
          if (typeof processedInput_telegram_send_message_1770832326787 !== 'undefined' && processedInput_telegram_send_message_1770832326787 !== null) {
            templateContext.inputData = processedInput_telegram_send_message_1770832326787;
            templateContext.input = processedInput_telegram_send_message_1770832326787;
            // If inputData is an object, spread its properties
            if (typeof processedInput_telegram_send_message_1770832326787 === 'object' && !Array.isArray(processedInput_telegram_send_message_1770832326787)) {
              Object.assign(templateContext, processedInput_telegram_send_message_1770832326787);
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
      let chatId = "";
      
    let telegramMessage: string = "The new patient {{dataFlow.getByNodeId(\"json-string-parser-1770831703679\")}} has been submitted their details successfully.";
    const configMessageFallback = "The new patient {{dataFlow.getByNodeId(\"json-string-parser-1770831703679\")}} has been submitted their details successfully.";
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
          currentResult: processedInput_telegram_send_message_1770832326787,
          previousResult: flowResults.previousResult,
          inputData: processedInput_telegram_send_message_1770832326787?.inputData || {},
          formResult: processedInput_telegram_send_message_1770832326787?.formResult || {},
          apiResult: processedInput_telegram_send_message_1770832326787?.apiResult || {}
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
        if (processedInput_telegram_send_message_1770832326787?.apiResult) {
          const apiRes = processedInput_telegram_send_message_1770832326787.apiResult;
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

      step4Result = {
        ...processedInput_telegram_send_message_1770832326787,
        telegramResult: {
          success: true,
          chatId: chatId,
          message: finalMessageText,
          media: hasMediaAttachment ? { type: mediaType, url: mediaUrl } : null,
          data: apiResponse,
          timestamp: new Date().toISOString()
        },
        nodeId: 'telegram-send-message-1770832326787'
      };
      
      flowResults.telegramResult = step4Result.telegramResult;
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      flowErrors.push('Telegram error in node [telegram-send-message-1770832326787]: ' + errorMessage);
      
      step4Result = {
        ...processedInput_telegram_send_message_1770832326787,
        telegramResult: {
          success: false,
          error: errorMessage,
          media: hasMediaAttachment ? { type: mediaType, url: mediaUrl } : null,
          timestamp: new Date().toISOString()
        },
        nodeId: 'telegram-send-message-1770832326787'
      };
    }
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['telegram-send-message-1770832326787'] = {
      nodeId: 'telegram-send-message-1770832326787',
      nodeType: 'Telegram Send Message',
      stepNumber: 4,
      displayName: 'telegramSendResult_telegram_send_message_1770832326787',
      data: step4Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for Telegram Send Message
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['telegramSendResult_telegram_send_message_1770832326787'] || typeof flowResults['telegramSendResult_telegram_send_message_1770832326787'] === 'undefined') {
      flowResults['telegramSendResult_telegram_send_message_1770832326787'] = step4Result;
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
      console.error('❌ Error in step 4 (Telegram Send Message):', stepError);
      flowErrors.push(`Step 4 (Telegram Send Message): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step4Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'Telegram Send Message',
        nodeId: 'telegram-send-message-1770832326787',
        stepNumber: 4
      };
      
      currentResult = step4Result; // Update currentResult even on error
      
      // Store error result in enhanced data flow system
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['telegram-send-message-1770832326787'] = {
      nodeId: 'telegram-send-message-1770832326787',
      nodeType: 'Telegram Send Message',
      stepNumber: 4,
      displayName: 'telegramSendResult_telegram_send_message_1770832326787',
      data: step4Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for Telegram Send Message
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['telegramSendResult_telegram_send_message_1770832326787'] || typeof flowResults['telegramSendResult_telegram_send_message_1770832326787'] === 'undefined') {
      flowResults['telegramSendResult_telegram_send_message_1770832326787'] = step4Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
    }

    step5Result = currentResult;
    try {
      
    // Process with OpenAI Agent SDK (Single Input Mode)
    step5Result = '';
    
    // 🆕 BUILD TARGET AGENT CONFIGURATIONS AT RUNTIME (for cross-workflow handoff)
    // CRITICAL FIX: Use workflowRegistry.allNodes instead of context.allNodes
    // This allows orchestrator agents to find sub-agents in other workflows
    const targetAgentConfigs: Record<string, any> = {};
    
    
    
    try {
      // 🚫 CHECK: Skip if this node was already executed via handoff (CLIENT-SIDE ONLY)
      if (typeof window !== 'undefined' && window.__executedNodes && window.__executedNodes.has('openaiAgentSDKNode-1770832397803')) {
        console.log('⏭Skipping node (already executed via handoff):', 'openaiAgentSDKNode-1770832397803');
        
        // Get the result from dataFlow if available
        const existingResult = dataFlow.getByNodeId('openaiAgentSDKNode-1770832397803');
        if (existingResult) {
          step5Result = existingResult;
        } else {
          step5Result = 'Node already executed via handoff';
        }
        
        // Remove from executed set for next workflow run (CLIENT-SIDE ONLY)
        if (typeof window !== 'undefined' && window.__executedNodes) {
          window.__executedNodes.delete('openaiAgentSDKNode-1770832397803');
        }
      } else {
      let aiInput = '';
      
      
      // Single input processing (existing logic - UNCHANGED)
      
        // User has provided a custom prompt - use it and evaluate any dataFlow expressions
        let userPrompt = `{{sheetTriggerResult.Name}}`;
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
            const agentId = 'agent-1771079854820';
            const userId = 'user-1771079854820';
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
         user_prompt: `{{sheetTriggerResult.Name}}`,

          model: 'gpt-4.1-2025-04-14',
          instructions: `You are an agent.
You will receive the output from the JSON String Parser, which contains the field name.

Your Task

Use the received name to fetch the corresponding phonenumber from the Supabase database using the CRUD Supabase MCP Tool.

Database Table: crudsupabase

Once the phonenumber is retrieved, send a reply message to that number with the following text:

"Thank you for providing your details. We have successfully received it. Our Team will connect you soon"

Expected Outcome

The correct phonenumber is successfully retrieved from Supabase using the provided name.

A confirmation message is sent to that phone number confirming successful form submission.You are an agent.
You will receive the output from the JSON String Parser, which contains the field name.

Your Task

Use the received name to fetch the corresponding phonenumber from the Supabase database using the CRUD Supabase MCP Tool.

Database Table: crudsupabase

Once the phonenumber is retrieved, send a reply message to that number with the following text:

"Your form details have been submitted successfully."

Expected Outcome

The correct phonenumber is successfully retrieved from Supabase using the provided name.

A confirmation message is sent to that phone number confirming successful form submission.`,
          temperature: 0.7,
          max_tokens: 1000,
          apiKey: effectiveApiKey,
          agentType: 'orchestrator',
          selected_tools: [],
          tool_configs: {},
          tool_settings: {"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},
          mcp_servers: [{"id":"custom_mcp_1770832474051","url":"https://supabase-crud.simplita.ai/mcp","name":"crud supabase","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770832487339","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"send form","enabled":true,"description":"Custom MCP Server"}],
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
          const outgoingEdges = workflowEdges.filter((e: any) => e.source === 'openaiAgentSDKNode-1770832397803');
          
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
          const agentId = 'agent-1771079854820';
          const userId = 'user-1771079854820';
          const sessionId = 'session-1771079854820';
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
          const outgoingEdges = workflowEdges.filter((e: any) => e.source === 'openaiAgentSDKNode-1770832397803');
          
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
              step5Result = targetAgentResult.content || targetAgentResult.text || targetAgentResult.message || 'Target agent response';
            } else {
              // TOOL CALL MODE: Combine results, orchestrator continues
              step5Result = {
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
            step5Result = {
              handoffCompleted: false,
              sourceAgent: result.message,
              targetAgent: result.target_agent,
              error: 'Target agent execution failed',
              handoffReason: result.reason
            };
          }
        } catch (handoffError) {
          console.error('Handoff error:', handoffError);
          step5Result = {
            handoffCompleted: false,
            sourceAgent: result.message,
            targetAgent: result.target_agent,
            error: handoffError instanceof Error ? handoffError.message : String(handoffError),
            handoffReason: result.reason
          };
        }
      } else {
        // Normal response (no handoff)
        step5Result = result.content || result.text || result.message || 'AI response received';
      }
      
      // 📊 CRITICAL: Store result in flowResults for dataFlow access
      if (!flowResults.nodeResults) flowResults.nodeResults = {};
      if (!flowResults.variables) flowResults.variables = {};
      if (!flowResults.aiResponses) flowResults.aiResponses = {};
      
      // Generate safe display name at runtime
      const displayName = "OpenAI_Agent";
      
      // Store in nodeResults for dataFlow.getByNodeId()
      flowResults.nodeResults['openaiAgentSDKNode-1770832397803'] = {
        nodeId: 'openaiAgentSDKNode-1770832397803',
        nodeType: 'openaiAgentSDKNode',
        stepNumber: (flowResults.stepCounter || 0) + 1,
        displayName: displayName,
        data: step5Result,
        timestamp: new Date().toISOString(),
        success: true
      };
      
      // Store in variables for dataFlow.get()
      flowResults.variables[displayName] = step5Result;
      flowResults.aiResponses[displayName] = step5Result;
      
      // Store at top-level for direct access
      flowResults[displayName] = step5Result;

      // Store under configured resultVariable if provided (e.g., sdkResult)
      const resultVariableName = "sdkResult";
      if (resultVariableName) {
        flowResults.variables[resultVariableName] = step5Result;
        flowResults.aiResponses[resultVariableName] = step5Result;
        flowResults[resultVariableName] = step5Result;
      }
      
      // Update current/previous for dataFlow.current() and dataFlow.previous()
      flowResults.previousResult = flowResults.currentResult;
      flowResults.currentResult = step5Result;
      
      // Increment step counter
      flowResults.stepCounter = (flowResults.stepCounter || 0) + 1;
      }
      
    } catch (error) {
      console.error('OpenAI Agent SDK error:', error);
      step5Result = 'Error: ' + (error instanceof Error ? error.message : String(error));
      flowErrors.push('OpenAI Agent SDK error in node ' + "openaiAgentSDKNode-1770832397803" + ': ' + (error instanceof Error ? error.message : String(error)));
    }
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['openaiAgentSDKNode-1770832397803'] = {
      nodeId: 'openaiAgentSDKNode-1770832397803',
      nodeType: 'openaiAgentSDKNode',
      stepNumber: 5,
      displayName: 'openaiSDKResult_openaiAgentSDKNode_1770832397803',
      data: step5Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    flowResults.aiResponses['openaiSDKResult_openaiAgentSDKNode_1770832397803'] = step5Result;
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['openaiSDKResult_openaiAgentSDKNode_1770832397803'] || typeof flowResults['openaiSDKResult_openaiAgentSDKNode_1770832397803'] === 'undefined') {
      flowResults['openaiSDKResult_openaiAgentSDKNode_1770832397803'] = step5Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
      
      if (flowResults.currentResult !== undefined && 
          flowResults.stepCounter > 4) {
        currentResult = flowResults.currentResult;
      } else {
        currentResult = step5Result;
      }
    } catch (stepError) {
      const stepErrorMessage = stepError instanceof Error ? stepError.message : String(stepError) || 'Unknown step error';
      console.error('❌ Error in step 5 (openaiAgentSDKNode):', stepError);
      flowErrors.push(`Step 5 (openaiAgentSDKNode): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step5Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'openaiAgentSDKNode',
        nodeId: 'openaiAgentSDKNode-1770832397803',
        stepNumber: 5
      };
      
      currentResult = step5Result; // Update currentResult even on error
      
      // Store error result in enhanced data flow system
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['openaiAgentSDKNode-1770832397803'] = {
      nodeId: 'openaiAgentSDKNode-1770832397803',
      nodeType: 'openaiAgentSDKNode',
      stepNumber: 5,
      displayName: 'openaiSDKResult_openaiAgentSDKNode_1770832397803',
      data: step5Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    flowResults.aiResponses['openaiSDKResult_openaiAgentSDKNode_1770832397803'] = step5Result;
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['openaiSDKResult_openaiAgentSDKNode_1770832397803'] || typeof flowResults['openaiSDKResult_openaiAgentSDKNode_1770832397803'] === 'undefined') {
      flowResults['openaiSDKResult_openaiAgentSDKNode_1770832397803'] = step5Result;
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
      if ('flow_google-sheets-trigger-1770831498824_1771079854809'.includes('button')) {
        // Extract button node information from chain
        const buttonNodes = Object.values(flowResults.nodeResults || {}).filter(
          (result: any) => result.nodeType === 'button'
        );
        
        buttonNodes.forEach((buttonNode: any) => {
          // Store chain ID mapped to button element ID
          if (buttonNode.elementId) {
            (window as any).buttonChainRegistry[buttonNode.elementId] = 'flow_google-sheets-trigger-1770831498824_1771079854809';
            console.log(`🔗 Registered button chain: ${buttonNode.elementId} → flow_google-sheets-trigger-1770831498824_1771079854809`);
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
        detail: { flowResults, chainId: 'flow_google-sheets-trigger-1770831498824_1771079854809' } 
      }));
      (window as any).dispatchEvent(new CustomEvent('flowExecutionCompleted', { 
        detail: { flowResults, chainId: 'flow_google-sheets-trigger-1770831498824_1771079854809' } 
      }));
      console.log("📡 Dispatched workflow completion events");
    }
    
    return {
      success: true,
      results: flowResults,
      errors: flowErrors,
      chainId: 'flow_google-sheets-trigger-1770831498824_1771079854809'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) || 'Unknown error';
    console.error('❌ Flow chain execution error:', error);
    return {
      success: false,
      results: flowResults,
      errors: [...flowErrors, errorMessage],
      chainId: 'flow_google-sheets-trigger-1770831498824_1771079854809'
    };
  }
};





const executeFlowChain_flow_page_load_1770832545541_1771079854809 = async (initialData: any = {}): Promise<FlowResult> => {
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
  
  flowResults._executionId = `flow_page_load_1770832545541_1771079854809_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
    flowResults.originalChainData = {"id":"flow_page-load-1770832545541_1771079854809","nodes":[{"id":"page-load-1770832545541","nodeType":"page-load","config":{"pageId":"page-17702826114826988","pageUrl":"/form-submission","loadType":"full"}},{"id":"db-api-get-1770832554240","nodeType":"db-api-get","config":{"url":"/api/form/component-generated-form_vitality_form_338226625-917682082","body":"","method":"GET","params":[],"apiName":"vitality_form read-all Database API","headers":[{"key":"Content-Type","value":"application/json"},{"key":"Authorization","value":"Bearer {{auth_token}}"}],"tableId":"vitality_form","dbMethod":"get","endpoint":"/api/form/component-generated-form_vitality_form_338226625-917682082","operation":"read-all","tableName":"vitality_form","description":"Get all vitality_form records","requestBody":"","isDatabaseApi":true,"authentication":{"type":"bearer"},"resultVariable":"getVitality_formResult","apiResultVariable":"getVitality_formResult"}},{"id":"script-event-1771006028992","nodeType":"script-event","config":{"pageId":"page-17702826114826988","scriptId":"9c50f7fb-b373-42a8-b13d-d80d598eea51","elementId":"component-1771005580992-8438","eventType":"onLoad","scriptKey":"page-17702826114826988::component-1771005580992-8438::onLoad::9c50f7fb-b373-42a8-b13d-d80d598eea51","scriptName":"formsubmissionvitality","actionValue":"delete","componentId":"component-1771005580992-8438","inputVariables":[{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}],"outputVariables":[{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"selectedSubmission","type":"object","source":"custom","description":"Output variable: selectedSubmission"},{"name":"selectedSubmissions","type":"object","source":"custom","description":"Output variable: selectedSubmissions"},{"name":"totalCount","type":"object","source":"custom","description":"Output variable: totalCount"},{"name":"filteredCount","type":"object","source":"custom","description":"Output variable: filteredCount"},{"name":"searchTerm","type":"object","source":"custom","description":"Output variable: searchTerm"},{"name":"getInputData('response')","type":"object","source":"custom","description":"Variable: getInputData('response')"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"},{"name":"sub.status","type":"object","source":"custom","description":"Variable: sub.status"},{"name":"'Status'","type":"object","source":"custom","description":"Variable: 'Status'"}],"inputVariableMappings":{"innerHTML":"{{getVitality_formResult}}"}}},{"id":"script-event-1771006052608","nodeType":"script-event","config":{"pageId":"page-17702826114826988","scriptId":"9c50f7fb-b373-42a8-b13d-d80d598eea51","elementId":"component-1771005580992-8438","eventType":"onLoad","scriptKey":"page-17702826114826988::component-1771005580992-8438::onLoad::9c50f7fb-b373-42a8-b13d-d80d598eea51","scriptName":"formsubmissionvitality","actionValue":"select","componentId":"component-1771005580992-8438","inputVariables":[{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}],"outputVariables":[{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"selectedSubmission","type":"object","source":"custom","description":"Output variable: selectedSubmission"},{"name":"selectedSubmissions","type":"object","source":"custom","description":"Output variable: selectedSubmissions"},{"name":"totalCount","type":"object","source":"custom","description":"Output variable: totalCount"},{"name":"filteredCount","type":"object","source":"custom","description":"Output variable: filteredCount"},{"name":"searchTerm","type":"object","source":"custom","description":"Output variable: searchTerm"},{"name":"getInputData('response')","type":"object","source":"custom","description":"Variable: getInputData('response')"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"},{"name":"sub.status","type":"object","source":"custom","description":"Variable: sub.status"},{"name":"'Status'","type":"object","source":"custom","description":"Variable: 'Status'"}],"inputVariableMappings":{"innerHTML":"{{getVitality_formResult}}"}}},{"id":"script-event-1771006060937","nodeType":"script-event","config":{"pageId":"page-17702826114826988","scriptId":"9c50f7fb-b373-42a8-b13d-d80d598eea51","elementId":"component-1771005580992-8438","eventType":"onLoad","scriptKey":"page-17702826114826988::component-1771005580992-8438::onLoad::9c50f7fb-b373-42a8-b13d-d80d598eea51","scriptName":"formsubmissionvitality","actionValue":"search","componentId":"component-1771005580992-8438","inputVariables":[{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}],"outputVariables":[{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"selectedSubmission","type":"object","source":"custom","description":"Output variable: selectedSubmission"},{"name":"selectedSubmissions","type":"object","source":"custom","description":"Output variable: selectedSubmissions"},{"name":"totalCount","type":"object","source":"custom","description":"Output variable: totalCount"},{"name":"filteredCount","type":"object","source":"custom","description":"Output variable: filteredCount"},{"name":"searchTerm","type":"object","source":"custom","description":"Output variable: searchTerm"},{"name":"getInputData('response')","type":"object","source":"custom","description":"Variable: getInputData('response')"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"},{"name":"sub.status","type":"object","source":"custom","description":"Variable: sub.status"},{"name":"'Status'","type":"object","source":"custom","description":"Variable: 'Status'"}],"inputVariableMappings":{"innerHTML":"{{getVitality_formResult}}"}}},{"id":"script-event-1771006085797","nodeType":"script-event","config":{"pageId":"page-17702826114826988","scriptId":"9c50f7fb-b373-42a8-b13d-d80d598eea51","elementId":"component-1771005580992-8438","eventType":"onLoad","scriptKey":"page-17702826114826988::component-1771005580992-8438::onLoad::9c50f7fb-b373-42a8-b13d-d80d598eea51","scriptName":"formsubmissionvitality","actionValue":"export","componentId":"component-1771005580992-8438","inputVariables":[{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}],"outputVariables":[{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"selectedSubmission","type":"object","source":"custom","description":"Output variable: selectedSubmission"},{"name":"selectedSubmissions","type":"object","source":"custom","description":"Output variable: selectedSubmissions"},{"name":"totalCount","type":"object","source":"custom","description":"Output variable: totalCount"},{"name":"filteredCount","type":"object","source":"custom","description":"Output variable: filteredCount"},{"name":"searchTerm","type":"object","source":"custom","description":"Output variable: searchTerm"},{"name":"getInputData('response')","type":"object","source":"custom","description":"Variable: getInputData('response')"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"},{"name":"sub.status","type":"object","source":"custom","description":"Variable: sub.status"},{"name":"'Status'","type":"object","source":"custom","description":"Variable: 'Status'"}],"inputVariableMappings":{"innerHTML":"{{getVitality_formResult}}"}}}],"edges":[{"source":"google-sheets-trigger-1770831498824","target":"db-api-post-1770831673235"},{"source":"db-api-post-1770831673235","target":"json-string-parser-1770831703679"},{"source":"json-string-parser-1770831703679","target":"telegram-send-message-1770832326787"},{"source":"telegram-send-message-1770832326787","target":"openaiAgentSDKNode-1770832397803"},{"source":"page-load-1770832545541","target":"db-api-get-1770832554240"},{"source":"db-api-get-1770832554240","target":"script-event-1771006028992"},{"source":"script-event-1771006028992","target":"script-event-1771006052608"},{"source":"script-event-1771006052608","target":"script-event-1771006060937"},{"source":"script-event-1771006060937","target":"script-event-1771006085797"}],"chainType":"linear","dataFlow":[],"startNode":{"id":"page-load-1770832545541","nodeType":"page-load","config":{"pageId":"page-17702826114826988","pageUrl":"/form-submission","loadType":"full"}},"endNode":{"id":"script-event-1771006085797","nodeType":"script-event","config":{"pageId":"page-17702826114826988","scriptId":"9c50f7fb-b373-42a8-b13d-d80d598eea51","elementId":"component-1771005580992-8438","eventType":"onLoad","scriptKey":"page-17702826114826988::component-1771005580992-8438::onLoad::9c50f7fb-b373-42a8-b13d-d80d598eea51","scriptName":"formsubmissionvitality","actionValue":"export","componentId":"component-1771005580992-8438","inputVariables":[{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}],"outputVariables":[{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"selectedSubmission","type":"object","source":"custom","description":"Output variable: selectedSubmission"},{"name":"selectedSubmissions","type":"object","source":"custom","description":"Output variable: selectedSubmissions"},{"name":"totalCount","type":"object","source":"custom","description":"Output variable: totalCount"},{"name":"filteredCount","type":"object","source":"custom","description":"Output variable: filteredCount"},{"name":"searchTerm","type":"object","source":"custom","description":"Output variable: searchTerm"},{"name":"getInputData('response')","type":"object","source":"custom","description":"Variable: getInputData('response')"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"},{"name":"sub.status","type":"object","source":"custom","description":"Variable: sub.status"},{"name":"'Status'","type":"object","source":"custom","description":"Variable: 'Status'"}],"inputVariableMappings":{"innerHTML":"{{getVitality_formResult}}"}}}};

    // Declare all step result variables
    let step1Result: any;
    let step2Result: any;
    let step3Result: any;
    let step4Result: any;
    let step5Result: any;
    let step6Result: any;



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
    flowResults.originalChainData = {"id":"flow_page-load-1770832545541_1771079854809","nodes":[{"id":"page-load-1770832545541","nodeType":"page-load","config":{"pageId":"page-17702826114826988","pageUrl":"/form-submission","loadType":"full"}},{"id":"db-api-get-1770832554240","nodeType":"db-api-get","config":{"url":"/api/form/component-generated-form_vitality_form_338226625-917682082","body":"","method":"GET","params":[],"apiName":"vitality_form read-all Database API","headers":[{"key":"Content-Type","value":"application/json"},{"key":"Authorization","value":"Bearer {{auth_token}}"}],"tableId":"vitality_form","dbMethod":"get","endpoint":"/api/form/component-generated-form_vitality_form_338226625-917682082","operation":"read-all","tableName":"vitality_form","description":"Get all vitality_form records","requestBody":"","isDatabaseApi":true,"authentication":{"type":"bearer"},"resultVariable":"getVitality_formResult","apiResultVariable":"getVitality_formResult"}},{"id":"script-event-1771006028992","nodeType":"script-event","config":{"pageId":"page-17702826114826988","scriptId":"9c50f7fb-b373-42a8-b13d-d80d598eea51","elementId":"component-1771005580992-8438","eventType":"onLoad","scriptKey":"page-17702826114826988::component-1771005580992-8438::onLoad::9c50f7fb-b373-42a8-b13d-d80d598eea51","scriptName":"formsubmissionvitality","actionValue":"delete","componentId":"component-1771005580992-8438","inputVariables":[{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}],"outputVariables":[{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"selectedSubmission","type":"object","source":"custom","description":"Output variable: selectedSubmission"},{"name":"selectedSubmissions","type":"object","source":"custom","description":"Output variable: selectedSubmissions"},{"name":"totalCount","type":"object","source":"custom","description":"Output variable: totalCount"},{"name":"filteredCount","type":"object","source":"custom","description":"Output variable: filteredCount"},{"name":"searchTerm","type":"object","source":"custom","description":"Output variable: searchTerm"},{"name":"getInputData('response')","type":"object","source":"custom","description":"Variable: getInputData('response')"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"},{"name":"sub.status","type":"object","source":"custom","description":"Variable: sub.status"},{"name":"'Status'","type":"object","source":"custom","description":"Variable: 'Status'"}],"inputVariableMappings":{"innerHTML":"{{getVitality_formResult}}"}}},{"id":"script-event-1771006052608","nodeType":"script-event","config":{"pageId":"page-17702826114826988","scriptId":"9c50f7fb-b373-42a8-b13d-d80d598eea51","elementId":"component-1771005580992-8438","eventType":"onLoad","scriptKey":"page-17702826114826988::component-1771005580992-8438::onLoad::9c50f7fb-b373-42a8-b13d-d80d598eea51","scriptName":"formsubmissionvitality","actionValue":"select","componentId":"component-1771005580992-8438","inputVariables":[{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}],"outputVariables":[{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"selectedSubmission","type":"object","source":"custom","description":"Output variable: selectedSubmission"},{"name":"selectedSubmissions","type":"object","source":"custom","description":"Output variable: selectedSubmissions"},{"name":"totalCount","type":"object","source":"custom","description":"Output variable: totalCount"},{"name":"filteredCount","type":"object","source":"custom","description":"Output variable: filteredCount"},{"name":"searchTerm","type":"object","source":"custom","description":"Output variable: searchTerm"},{"name":"getInputData('response')","type":"object","source":"custom","description":"Variable: getInputData('response')"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"},{"name":"sub.status","type":"object","source":"custom","description":"Variable: sub.status"},{"name":"'Status'","type":"object","source":"custom","description":"Variable: 'Status'"}],"inputVariableMappings":{"innerHTML":"{{getVitality_formResult}}"}}},{"id":"script-event-1771006060937","nodeType":"script-event","config":{"pageId":"page-17702826114826988","scriptId":"9c50f7fb-b373-42a8-b13d-d80d598eea51","elementId":"component-1771005580992-8438","eventType":"onLoad","scriptKey":"page-17702826114826988::component-1771005580992-8438::onLoad::9c50f7fb-b373-42a8-b13d-d80d598eea51","scriptName":"formsubmissionvitality","actionValue":"search","componentId":"component-1771005580992-8438","inputVariables":[{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}],"outputVariables":[{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"selectedSubmission","type":"object","source":"custom","description":"Output variable: selectedSubmission"},{"name":"selectedSubmissions","type":"object","source":"custom","description":"Output variable: selectedSubmissions"},{"name":"totalCount","type":"object","source":"custom","description":"Output variable: totalCount"},{"name":"filteredCount","type":"object","source":"custom","description":"Output variable: filteredCount"},{"name":"searchTerm","type":"object","source":"custom","description":"Output variable: searchTerm"},{"name":"getInputData('response')","type":"object","source":"custom","description":"Variable: getInputData('response')"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"},{"name":"sub.status","type":"object","source":"custom","description":"Variable: sub.status"},{"name":"'Status'","type":"object","source":"custom","description":"Variable: 'Status'"}],"inputVariableMappings":{"innerHTML":"{{getVitality_formResult}}"}}},{"id":"script-event-1771006085797","nodeType":"script-event","config":{"pageId":"page-17702826114826988","scriptId":"9c50f7fb-b373-42a8-b13d-d80d598eea51","elementId":"component-1771005580992-8438","eventType":"onLoad","scriptKey":"page-17702826114826988::component-1771005580992-8438::onLoad::9c50f7fb-b373-42a8-b13d-d80d598eea51","scriptName":"formsubmissionvitality","actionValue":"export","componentId":"component-1771005580992-8438","inputVariables":[{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}],"outputVariables":[{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"selectedSubmission","type":"object","source":"custom","description":"Output variable: selectedSubmission"},{"name":"selectedSubmissions","type":"object","source":"custom","description":"Output variable: selectedSubmissions"},{"name":"totalCount","type":"object","source":"custom","description":"Output variable: totalCount"},{"name":"filteredCount","type":"object","source":"custom","description":"Output variable: filteredCount"},{"name":"searchTerm","type":"object","source":"custom","description":"Output variable: searchTerm"},{"name":"getInputData('response')","type":"object","source":"custom","description":"Variable: getInputData('response')"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"},{"name":"sub.status","type":"object","source":"custom","description":"Variable: sub.status"},{"name":"'Status'","type":"object","source":"custom","description":"Variable: 'Status'"}],"inputVariableMappings":{"innerHTML":"{{getVitality_formResult}}"}}}],"edges":[{"source":"google-sheets-trigger-1770831498824","target":"db-api-post-1770831673235"},{"source":"db-api-post-1770831673235","target":"json-string-parser-1770831703679"},{"source":"json-string-parser-1770831703679","target":"telegram-send-message-1770832326787"},{"source":"telegram-send-message-1770832326787","target":"openaiAgentSDKNode-1770832397803"},{"source":"page-load-1770832545541","target":"db-api-get-1770832554240"},{"source":"db-api-get-1770832554240","target":"script-event-1771006028992"},{"source":"script-event-1771006028992","target":"script-event-1771006052608"},{"source":"script-event-1771006052608","target":"script-event-1771006060937"},{"source":"script-event-1771006060937","target":"script-event-1771006085797"}],"chainType":"linear","dataFlow":[],"startNode":{"id":"page-load-1770832545541","nodeType":"page-load","config":{"pageId":"page-17702826114826988","pageUrl":"/form-submission","loadType":"full"}},"endNode":{"id":"script-event-1771006085797","nodeType":"script-event","config":{"pageId":"page-17702826114826988","scriptId":"9c50f7fb-b373-42a8-b13d-d80d598eea51","elementId":"component-1771005580992-8438","eventType":"onLoad","scriptKey":"page-17702826114826988::component-1771005580992-8438::onLoad::9c50f7fb-b373-42a8-b13d-d80d598eea51","scriptName":"formsubmissionvitality","actionValue":"export","componentId":"component-1771005580992-8438","inputVariables":[{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}],"outputVariables":[{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"selectedSubmission","type":"object","source":"custom","description":"Output variable: selectedSubmission"},{"name":"selectedSubmissions","type":"object","source":"custom","description":"Output variable: selectedSubmissions"},{"name":"totalCount","type":"object","source":"custom","description":"Output variable: totalCount"},{"name":"filteredCount","type":"object","source":"custom","description":"Output variable: filteredCount"},{"name":"searchTerm","type":"object","source":"custom","description":"Output variable: searchTerm"},{"name":"getInputData('response')","type":"object","source":"custom","description":"Variable: getInputData('response')"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"},{"name":"sub.status","type":"object","source":"custom","description":"Variable: sub.status"},{"name":"'Status'","type":"object","source":"custom","description":"Variable: 'Status'"}],"inputVariableMappings":{"innerHTML":"{{getVitality_formResult}}"}}}};
    
    if (typeof window !== 'undefined') {
      // SECURITY: Store SANITIZED workflow nodes in window context (remove API keys)
      // Sanitize each node individually to ensure all sensitive data is removed
      const sanitizedNodes = [{"id":"page-load-1770832545541","nodeType":"page-load","config":{"pageId":"page-17702826114826988","pageUrl":"/form-submission","loadType":"full"}},{"id":"db-api-get-1770832554240","nodeType":"db-api-get","config":{"url":"/api/form/component-generated-form_vitality_form_338226625-917682082","body":"","method":"GET","params":[],"apiName":"vitality_form read-all Database API","headers":[{"key":"Content-Type","value":"application/json"},{"key":"Authorization","value":"Bearer {{auth_token}}"}],"tableId":"vitality_form","dbMethod":"get","endpoint":"/api/form/component-generated-form_vitality_form_338226625-917682082","operation":"read-all","tableName":"vitality_form","description":"Get all vitality_form records","requestBody":"","isDatabaseApi":true,"authentication":{"type":"bearer"},"resultVariable":"getVitality_formResult","apiResultVariable":"getVitality_formResult"}},{"id":"script-event-1771006028992","nodeType":"script-event","config":{"pageId":"page-17702826114826988","scriptId":"9c50f7fb-b373-42a8-b13d-d80d598eea51","elementId":"component-1771005580992-8438","eventType":"onLoad","scriptKey":"page-17702826114826988::component-1771005580992-8438::onLoad::9c50f7fb-b373-42a8-b13d-d80d598eea51","scriptName":"formsubmissionvitality","actionValue":"delete","componentId":"component-1771005580992-8438","inputVariables":[{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}],"outputVariables":[{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"selectedSubmission","type":"object","source":"custom","description":"Output variable: selectedSubmission"},{"name":"selectedSubmissions","type":"object","source":"custom","description":"Output variable: selectedSubmissions"},{"name":"totalCount","type":"object","source":"custom","description":"Output variable: totalCount"},{"name":"filteredCount","type":"object","source":"custom","description":"Output variable: filteredCount"},{"name":"searchTerm","type":"object","source":"custom","description":"Output variable: searchTerm"},{"name":"getInputData('response')","type":"object","source":"custom","description":"Variable: getInputData('response')"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"},{"name":"sub.status","type":"object","source":"custom","description":"Variable: sub.status"},{"name":"'Status'","type":"object","source":"custom","description":"Variable: 'Status'"}],"inputVariableMappings":{"innerHTML":"{{getVitality_formResult}}"}}},{"id":"script-event-1771006052608","nodeType":"script-event","config":{"pageId":"page-17702826114826988","scriptId":"9c50f7fb-b373-42a8-b13d-d80d598eea51","elementId":"component-1771005580992-8438","eventType":"onLoad","scriptKey":"page-17702826114826988::component-1771005580992-8438::onLoad::9c50f7fb-b373-42a8-b13d-d80d598eea51","scriptName":"formsubmissionvitality","actionValue":"select","componentId":"component-1771005580992-8438","inputVariables":[{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}],"outputVariables":[{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"selectedSubmission","type":"object","source":"custom","description":"Output variable: selectedSubmission"},{"name":"selectedSubmissions","type":"object","source":"custom","description":"Output variable: selectedSubmissions"},{"name":"totalCount","type":"object","source":"custom","description":"Output variable: totalCount"},{"name":"filteredCount","type":"object","source":"custom","description":"Output variable: filteredCount"},{"name":"searchTerm","type":"object","source":"custom","description":"Output variable: searchTerm"},{"name":"getInputData('response')","type":"object","source":"custom","description":"Variable: getInputData('response')"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"},{"name":"sub.status","type":"object","source":"custom","description":"Variable: sub.status"},{"name":"'Status'","type":"object","source":"custom","description":"Variable: 'Status'"}],"inputVariableMappings":{"innerHTML":"{{getVitality_formResult}}"}}},{"id":"script-event-1771006060937","nodeType":"script-event","config":{"pageId":"page-17702826114826988","scriptId":"9c50f7fb-b373-42a8-b13d-d80d598eea51","elementId":"component-1771005580992-8438","eventType":"onLoad","scriptKey":"page-17702826114826988::component-1771005580992-8438::onLoad::9c50f7fb-b373-42a8-b13d-d80d598eea51","scriptName":"formsubmissionvitality","actionValue":"search","componentId":"component-1771005580992-8438","inputVariables":[{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}],"outputVariables":[{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"selectedSubmission","type":"object","source":"custom","description":"Output variable: selectedSubmission"},{"name":"selectedSubmissions","type":"object","source":"custom","description":"Output variable: selectedSubmissions"},{"name":"totalCount","type":"object","source":"custom","description":"Output variable: totalCount"},{"name":"filteredCount","type":"object","source":"custom","description":"Output variable: filteredCount"},{"name":"searchTerm","type":"object","source":"custom","description":"Output variable: searchTerm"},{"name":"getInputData('response')","type":"object","source":"custom","description":"Variable: getInputData('response')"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"},{"name":"sub.status","type":"object","source":"custom","description":"Variable: sub.status"},{"name":"'Status'","type":"object","source":"custom","description":"Variable: 'Status'"}],"inputVariableMappings":{"innerHTML":"{{getVitality_formResult}}"}}},{"id":"script-event-1771006085797","nodeType":"script-event","config":{"pageId":"page-17702826114826988","scriptId":"9c50f7fb-b373-42a8-b13d-d80d598eea51","elementId":"component-1771005580992-8438","eventType":"onLoad","scriptKey":"page-17702826114826988::component-1771005580992-8438::onLoad::9c50f7fb-b373-42a8-b13d-d80d598eea51","scriptName":"formsubmissionvitality","actionValue":"export","componentId":"component-1771005580992-8438","inputVariables":[{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}],"outputVariables":[{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"selectedSubmission","type":"object","source":"custom","description":"Output variable: selectedSubmission"},{"name":"selectedSubmissions","type":"object","source":"custom","description":"Output variable: selectedSubmissions"},{"name":"totalCount","type":"object","source":"custom","description":"Output variable: totalCount"},{"name":"filteredCount","type":"object","source":"custom","description":"Output variable: filteredCount"},{"name":"searchTerm","type":"object","source":"custom","description":"Output variable: searchTerm"},{"name":"getInputData('response')","type":"object","source":"custom","description":"Variable: getInputData('response')"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"},{"name":"sub.status","type":"object","source":"custom","description":"Variable: sub.status"},{"name":"'Status'","type":"object","source":"custom","description":"Variable: 'Status'"}],"inputVariableMappings":{"innerHTML":"{{getVitality_formResult}}"}}}];
      
      (window as any).__currentWorkflowNodes = sanitizedNodes;
      (window as any).__flowChainMetadata = {
        chainId: 'flow_page-load-1770832545541_1771079854809',
        currentChainNodes: sanitizedNodes,
        nodeCount: 6
      };
      console.log('🔗 Workflow nodes made available globally: 6 nodes');
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
      
    const normalizedInput_page_load_1770832545541 = {};

    step1Result = {
      ...normalizedInput_page_load_1770832545541,
      pageId: 'current-page',
      nodeId: 'page-load-1770832545541',
      trigger: 'page-load',
      timestamp: new Date().toISOString(),
      config: {"pageId":"page-17702826114826988","pageUrl":"/form-submission","loadType":"full"}
    };
    
    flowResults.pageLoadResult = step1Result;
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['page-load-1770832545541'] = {
      nodeId: 'page-load-1770832545541',
      nodeType: 'page-load',
      stepNumber: 1,
      displayName: 'pageLoadResult_page_load_1770832545541',
      data: step1Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for page-load
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['pageLoadResult_page_load_1770832545541'] || typeof flowResults['pageLoadResult_page_load_1770832545541'] === 'undefined') {
      flowResults['pageLoadResult_page_load_1770832545541'] = step1Result;
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
      console.error('❌ Error in step 1 (page-load):', stepError);
      flowErrors.push(`Step 1 (page-load): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step1Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'page-load',
        nodeId: 'page-load-1770832545541',
        stepNumber: 1
      };
      
      currentResult = step1Result; // Update currentResult even on error
      
      // Store error result in enhanced data flow system
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['page-load-1770832545541'] = {
      nodeId: 'page-load-1770832545541',
      nodeType: 'page-load',
      stepNumber: 1,
      displayName: 'pageLoadResult_page_load_1770832545541',
      data: step1Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for page-load
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['pageLoadResult_page_load_1770832545541'] || typeof flowResults['pageLoadResult_page_load_1770832545541'] === 'undefined') {
      flowResults['pageLoadResult_page_load_1770832545541'] = step1Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
    }

    step2Result = currentResult;
    try {
      
    // === API GET REQUEST ===
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        console.info('🌐 Processing API GET request');
      }
    
    step2Result = currentResult;
    
    // Handle input data (evaluate dataFlow expressions if present)
    let processedInput_db_api_get_1770832554240 = currentResult;
    

     // Declare replacePathParameters function at function scope level
        var replacePathParameters: ((endpoint: string, context: any, flowResults: any, dataFlow: any, nodeConfig?: any) => Promise<string>) | undefined = undefined;


    // Enhanced DataFlow Expression Handler - Supports both single and multiple expressions
    if (typeof processedInput_db_api_get_1770832554240 === 'string' && processedInput_db_api_get_1770832554240.includes('dataFlow.')) {
      try {
        // Check if dataFlow is available
        if (typeof dataFlow !== 'undefined') {
          
          // PRIORITY 1: Handle multiple {{dataFlow.getByNodeId()}} expressions first
          if (processedInput_db_api_get_1770832554240.includes('{{dataFlow.getByNodeId(') && processedInput_db_api_get_1770832554240.includes('}}')) {
            
            // Handle multiple {{dataFlow.getByNodeId("...").PropertyName}} expressions with property access
const openBrace = '{{';
const closeBrace = '}}';
const functionCall = 'dataFlow.getByNodeId\\(["\']([^"\']+)["\']\\)';
const propertyAccess = '(?:\\.([a-zA-Z_$][a-zA-Z0-9_$]*))?';
const multiDataFlowRegex = new RegExp(openBrace + functionCall + propertyAccess + closeBrace, 'g');

            let processedVariable = processedInput_db_api_get_1770832554240;
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
              processedInput_db_api_get_1770832554240 = processedVariable;
            }
          }
          
          // PRIORITY 2: Handle legacy single dataFlow.getByNodeId() without braces (backwards compatibility)
          else if (processedInput_db_api_get_1770832554240.includes('dataFlow.getByNodeId(') && !processedInput_db_api_get_1770832554240.includes('{{') && !processedInput_db_api_get_1770832554240.includes('}}')) {
            // Extract node ID and property access from pattern: dataFlow.getByNodeId('nodeId').PropertyName
            const legacyNodeIdMatch = processedInput_db_api_get_1770832554240.match(/dataFlow\.getByNodeId\(['"]([^'"]+)['"]\)(?:\.([a-zA-Z_$][a-zA-Z0-9_$]*))?/);
            if (legacyNodeIdMatch) {
              const nodeId = legacyNodeIdMatch[1];
              const propertyName = legacyNodeIdMatch[2]; // Capture property name after function call (e.g., .Name)
              
              const result = dataFlow.getByNodeId(nodeId);
              if (result !== undefined && result !== null) {
                // CRITICAL FIX: Check if user specified a property name (e.g., .Name, .Email)
                if (propertyName) {
                  // Try direct property access first (most common for form fields)
                  if (typeof result === 'object' && result[propertyName] !== undefined) {
                    processedInput_db_api_get_1770832554240 = String(result[propertyName]);
                  }
                  // Try in formData
                  else if (result.formData && result.formData[propertyName] !== undefined) {
                    processedInput_db_api_get_1770832554240 = String(result.formData[propertyName]);
                  }
                  // Try in inputData
                  else if (result.inputData && result.inputData[propertyName] !== undefined) {
                    processedInput_db_api_get_1770832554240 = String(result.inputData[propertyName]);
                  }
                  // Try in data
                  else if (result.data && result.data[propertyName] !== undefined) {
                    processedInput_db_api_get_1770832554240 = String(result.data[propertyName]);
                  }
                  // Try case-insensitive property access for form fields
                  else if (typeof result === 'object') {
                    const resultKeys = Object.keys(result);
                    const matchingKey = resultKeys.find(key => key.toLowerCase() === propertyName.toLowerCase());
                    if (matchingKey && result[matchingKey] !== undefined) {
                      processedInput_db_api_get_1770832554240 = String(result[matchingKey]);
                    } else {
                      console.warn(`⚠️ Legacy: Property '${propertyName}' not found in result object. Available keys:`, resultKeys);
                      processedInput_db_api_get_1770832554240 = '[property not found: ' + propertyName + ']';
                    }
                  } else {
                    console.warn(`⚠️ Legacy: Cannot access property '${propertyName}' on non-object result`);
                    processedInput_db_api_get_1770832554240 = '[invalid property access]';
                  }
                } else {
                  // No property specified - use auto-extraction
                  if (typeof result === 'object') {
                    processedInput_db_api_get_1770832554240 = result.currentValue || result.value || result.data || String(result);
                  } else {
                    processedInput_db_api_get_1770832554240 = String(result);
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
                      processedInput_db_api_get_1770832554240 = String(fallbackValue);
                    } else {
                      processedInput_db_api_get_1770832554240 = '[data not available]';
                    }
                  } else {
                    processedInput_db_api_get_1770832554240 = '[data not available]';
                  }
                } catch (fallbackError) {
                  console.warn('⚠️ Enhanced Template: Error in batchResult fallback:', fallbackError);
                  processedInput_db_api_get_1770832554240 = '[data not available]';
                }
              }
            }
          } else if (processedInput_db_api_get_1770832554240.includes('dataFlow.current()')) {
            const result = dataFlow.current();
            if (result !== undefined && result !== null) {
              if (typeof result === 'object') {
                processedInput_db_api_get_1770832554240 = result.currentValue || result.value || result.data || String(result);
              } else {
                processedInput_db_api_get_1770832554240 = String(result);
              }
            } else {
              processedInput_db_api_get_1770832554240 = '[current data not available]';
            }
          } else if (processedInput_db_api_get_1770832554240.includes('dataFlow.previous()')) {
            const result = dataFlow.previous();
            if (result !== undefined && result !== null) {
              if (typeof result === 'object') {
                processedInput_db_api_get_1770832554240 = result.currentValue || result.value || result.data || String(result);
              } else {
                processedInput_db_api_get_1770832554240 = String(result);
              }
            } else {
              processedInput_db_api_get_1770832554240 = '[previous data not available]';
            }
          } else if (processedInput_db_api_get_1770832554240.includes('dataFlow.get(')) {
            // Extract variable name from pattern: dataFlow.get('varName')
            const varNameMatch = processedInput_db_api_get_1770832554240.match(/dataFlow\.get\(['"]([^'"]+)['"]\)/);
            if (varNameMatch) {
              const varName = varNameMatch[1];
              const result = dataFlow.get(varName);
              if (result !== undefined && result !== null) {
                if (typeof result === 'object') {
                  processedInput_db_api_get_1770832554240 = result.currentValue || result.value || result.data || String(result);
                } else {
                  processedInput_db_api_get_1770832554240 = String(result);
                }
              } else {
                processedInput_db_api_get_1770832554240 = '[variable not available]';
              }
            }
          }
        } else {
          console.warn('⚠️ dataFlow not available in scope');
          processedInput_db_api_get_1770832554240 = '[dataFlow not available]';
        }
      } catch (error) {
        console.error('❌ Error evaluating dataFlow expression:', error);
        processedInput_db_api_get_1770832554240 = '[dataFlow evaluation error]';
      }
    }
    
    const configuredEndpoint_db_api_get_1770832554240 = "/api/form/component-generated-form_vitality_form_338226625-917682082";
    let apiEndpoint_db_api_get_1770832554240 = (configuredEndpoint_db_api_get_1770832554240 || '').trim();
    

     // Declare replacePathParameters function at function scope level
        var replacePathParameters: ((endpoint: string, context: any, flowResults: any, dataFlow: any, nodeConfig?: any) => Promise<string>) | undefined = undefined;


    // Enhanced DataFlow Expression Handler - Supports both single and multiple expressions
    if (typeof apiEndpoint_db_api_get_1770832554240 === 'string' && apiEndpoint_db_api_get_1770832554240.includes('dataFlow.')) {
      try {
        // Check if dataFlow is available
        if (typeof dataFlow !== 'undefined') {
          
          // PRIORITY 1: Handle multiple {{dataFlow.getByNodeId()}} expressions first
          if (apiEndpoint_db_api_get_1770832554240.includes('{{dataFlow.getByNodeId(') && apiEndpoint_db_api_get_1770832554240.includes('}}')) {
            
            // Handle multiple {{dataFlow.getByNodeId("...").PropertyName}} expressions with property access
const openBrace = '{{';
const closeBrace = '}}';
const functionCall = 'dataFlow.getByNodeId\\(["\']([^"\']+)["\']\\)';
const propertyAccess = '(?:\\.([a-zA-Z_$][a-zA-Z0-9_$]*))?';
const multiDataFlowRegex = new RegExp(openBrace + functionCall + propertyAccess + closeBrace, 'g');

            let processedVariable = apiEndpoint_db_api_get_1770832554240;
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
              apiEndpoint_db_api_get_1770832554240 = processedVariable;
            }
          }
          
          // PRIORITY 2: Handle legacy single dataFlow.getByNodeId() without braces (backwards compatibility)
          else if (apiEndpoint_db_api_get_1770832554240.includes('dataFlow.getByNodeId(') && !apiEndpoint_db_api_get_1770832554240.includes('{{') && !apiEndpoint_db_api_get_1770832554240.includes('}}')) {
            // Extract node ID and property access from pattern: dataFlow.getByNodeId('nodeId').PropertyName
            const legacyNodeIdMatch = apiEndpoint_db_api_get_1770832554240.match(/dataFlow\.getByNodeId\(['"]([^'"]+)['"]\)(?:\.([a-zA-Z_$][a-zA-Z0-9_$]*))?/);
            if (legacyNodeIdMatch) {
              const nodeId = legacyNodeIdMatch[1];
              const propertyName = legacyNodeIdMatch[2]; // Capture property name after function call (e.g., .Name)
              
              const result = dataFlow.getByNodeId(nodeId);
              if (result !== undefined && result !== null) {
                // CRITICAL FIX: Check if user specified a property name (e.g., .Name, .Email)
                if (propertyName) {
                  // Try direct property access first (most common for form fields)
                  if (typeof result === 'object' && result[propertyName] !== undefined) {
                    apiEndpoint_db_api_get_1770832554240 = String(result[propertyName]);
                  }
                  // Try in formData
                  else if (result.formData && result.formData[propertyName] !== undefined) {
                    apiEndpoint_db_api_get_1770832554240 = String(result.formData[propertyName]);
                  }
                  // Try in inputData
                  else if (result.inputData && result.inputData[propertyName] !== undefined) {
                    apiEndpoint_db_api_get_1770832554240 = String(result.inputData[propertyName]);
                  }
                  // Try in data
                  else if (result.data && result.data[propertyName] !== undefined) {
                    apiEndpoint_db_api_get_1770832554240 = String(result.data[propertyName]);
                  }
                  // Try case-insensitive property access for form fields
                  else if (typeof result === 'object') {
                    const resultKeys = Object.keys(result);
                    const matchingKey = resultKeys.find(key => key.toLowerCase() === propertyName.toLowerCase());
                    if (matchingKey && result[matchingKey] !== undefined) {
                      apiEndpoint_db_api_get_1770832554240 = String(result[matchingKey]);
                    } else {
                      console.warn(`⚠️ Legacy: Property '${propertyName}' not found in result object. Available keys:`, resultKeys);
                      apiEndpoint_db_api_get_1770832554240 = '[property not found: ' + propertyName + ']';
                    }
                  } else {
                    console.warn(`⚠️ Legacy: Cannot access property '${propertyName}' on non-object result`);
                    apiEndpoint_db_api_get_1770832554240 = '[invalid property access]';
                  }
                } else {
                  // No property specified - use auto-extraction
                  if (typeof result === 'object') {
                    apiEndpoint_db_api_get_1770832554240 = result.currentValue || result.value || result.data || String(result);
                  } else {
                    apiEndpoint_db_api_get_1770832554240 = String(result);
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
                      apiEndpoint_db_api_get_1770832554240 = String(fallbackValue);
                    } else {
                      apiEndpoint_db_api_get_1770832554240 = '[data not available]';
                    }
                  } else {
                    apiEndpoint_db_api_get_1770832554240 = '[data not available]';
                  }
                } catch (fallbackError) {
                  console.warn('⚠️ Enhanced Template: Error in batchResult fallback:', fallbackError);
                  apiEndpoint_db_api_get_1770832554240 = '[data not available]';
                }
              }
            }
          } else if (apiEndpoint_db_api_get_1770832554240.includes('dataFlow.current()')) {
            const result = dataFlow.current();
            if (result !== undefined && result !== null) {
              if (typeof result === 'object') {
                apiEndpoint_db_api_get_1770832554240 = result.currentValue || result.value || result.data || String(result);
              } else {
                apiEndpoint_db_api_get_1770832554240 = String(result);
              }
            } else {
              apiEndpoint_db_api_get_1770832554240 = '[current data not available]';
            }
          } else if (apiEndpoint_db_api_get_1770832554240.includes('dataFlow.previous()')) {
            const result = dataFlow.previous();
            if (result !== undefined && result !== null) {
              if (typeof result === 'object') {
                apiEndpoint_db_api_get_1770832554240 = result.currentValue || result.value || result.data || String(result);
              } else {
                apiEndpoint_db_api_get_1770832554240 = String(result);
              }
            } else {
              apiEndpoint_db_api_get_1770832554240 = '[previous data not available]';
            }
          } else if (apiEndpoint_db_api_get_1770832554240.includes('dataFlow.get(')) {
            // Extract variable name from pattern: dataFlow.get('varName')
            const varNameMatch = apiEndpoint_db_api_get_1770832554240.match(/dataFlow\.get\(['"]([^'"]+)['"]\)/);
            if (varNameMatch) {
              const varName = varNameMatch[1];
              const result = dataFlow.get(varName);
              if (result !== undefined && result !== null) {
                if (typeof result === 'object') {
                  apiEndpoint_db_api_get_1770832554240 = result.currentValue || result.value || result.data || String(result);
                } else {
                  apiEndpoint_db_api_get_1770832554240 = String(result);
                }
              } else {
                apiEndpoint_db_api_get_1770832554240 = '[variable not available]';
              }
            }
          }
        } else {
          console.warn('⚠️ dataFlow not available in scope');
          apiEndpoint_db_api_get_1770832554240 = '[dataFlow not available]';
        }
      } catch (error) {
        console.error('❌ Error evaluating dataFlow expression:', error);
        apiEndpoint_db_api_get_1770832554240 = '[dataFlow evaluation error]';
      }
    }

    
    // ✅ DYNAMIC PATH PARAMETER REPLACEMENT FUNCTION
    if (typeof replacePathParameters === 'undefined') {
     //  replacePathParameters = (endpoint: string, context: any, flowResults: any, dataFlow: any): string => {
      var replacePathParameters = async (endpoint: string, context: any, flowResults: any, dataFlow: any, nodeConfig?: any): Promise<string> => {

      // CRITICAL FIX: Ensure endpoint is a string before processing
      // Handle case where endpoint might be a Promise or other non-string type
      if (typeof endpoint !== 'string') {
        const endpointAny = endpoint as any;
        if (endpointAny && typeof endpointAny.then === 'function') {
          // If it's a Promise, await it
          endpoint = await endpointAny;
        }
        // Convert to string if still not a string
        if (typeof endpoint !== 'string') {
          endpoint = String(endpointAny || '');
        }
      }
      
      // Find all path parameters like {name}, {id}, {userId}, etc.
      let processedEndpoint = endpoint;
         // STEP 1: Process template expressions in path parameters (e.g., {postPostResult.data.id} or {{postPostResult.data.id}})
        // This handles complex expressions that need template engine evaluation
        const templateExpressionPattern = /{({?)([^}]+)(}?)}/g;
        const templateMatches = Array.from(endpoint.matchAll(templateExpressionPattern));

        for (const match of templateMatches) {
          const fullMatch = match[0]; // e.g., "{postPostResult.data.id}" or "{{postPostResult.data.id}}"
          const expression = match[2]; // e.g., "postPostResult.data.id"

          // Skip if it's a simple parameter (will be handled in STEP 2)
          if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(expression)) {
            continue;
          }

          // Build evaluation context - dynamically include all available variables
          const evalContext: any = {
            ...(context || {}),
            ...(flowResults || {}),
            ...(flowResults?.formData || {}),
            dataFlow: dataFlow || {}
          };

          // Add all variables from apiResponses, nodeResults, and variables
          if (flowResults?.apiResponses) {
            Object.assign(evalContext, flowResults.apiResponses);
          }
          if (flowResults?.variables) {
            Object.assign(evalContext, flowResults.variables);
          }
          if (flowResults?.nodeResults) {
            // Add node results with their display names as keys
            Object.entries(flowResults.nodeResults).forEach(([nodeId, nodeResult]: [string, any]) => {
              if (nodeResult?.displayName) {
                evalContext[nodeResult.displayName] = nodeResult.data || nodeResult;
              }
            });
          }

          // CRITICAL: Add context (which contains batchResult and loop step results) AFTER flowResults
          // This ensures that API responses from within the loop (like getInsightsResult) override the original values
          if (context && typeof context === 'object' && !Array.isArray(context)) {
            Object.assign(evalContext, context);
          }

          // Process the template expression
          try {
            const templateToProcess = `{{${expression}}}`;
            let evaluatedValue = TemplateExpressionEngine.processTemplate(templateToProcess, evalContext);

            // If template engine failed and expression has nested properties, try manual access
            if ((evaluatedValue === undefined || evaluatedValue === null || evaluatedValue === '') && expression.includes('.')) {
              const firstPart = expression.split('.')[0];
              if (evalContext[firstPart] && typeof evalContext[firstPart] === 'object') {
                console.warn(`⚠️ Template engine failed for ${fullMatch}, attempting manual property access...`);
                try {
                  const parts = expression.split('.');
                  let value = evalContext;
                  for (const part of parts) {
                    if (value && typeof value === 'object' && part in value) {
                      value = value[part];
                    } else {
                      value = undefined;
                      break;
                    }
                  }
                  if (value !== undefined && value !== null && value !== '') {
                    evaluatedValue = value;
                    console.log(`✅ Manually resolved ${fullMatch} = ${evaluatedValue}`);
                  }
                } catch (manualError) {
                  console.warn(`   Manual access failed: ${manualError}`);
                }
              }
            }
            if (evaluatedValue !== undefined && evaluatedValue !== null && evaluatedValue !== '') {
              const encodedValue = encodeURIComponent(String(evaluatedValue));
              processedEndpoint = processedEndpoint.replace(fullMatch, encodedValue);
              console.log(`🔧 Replaced template expression ${fullMatch} with value: ${evaluatedValue} -> ${processedEndpoint}`);
            } else {
              // Enhanced error message with context information
              const availableKeys = Object.keys(evalContext).filter(k => !k.startsWith('_') && k !== 'dataFlow').slice(0, 10);
              console.warn(`⚠️ Could not evaluate template expression ${fullMatch} in endpoint URL`);
              console.warn(`   Expression: ${expression}`);
              console.warn(`   Available variables: ${availableKeys.join(', ')}${availableKeys.length === 10 ? '...' : ''}`);
              
              // Check if this is a dependency on a previous step that failed
              const firstPart = expression.split('.')[0];
              if (evalContext[firstPart] === null || evalContext[firstPart] === undefined) {
                console.error(`❌ Required variable '${firstPart}' is null/undefined. Previous step may have failed.`);
                throw new Error(`Cannot evaluate template expression ${fullMatch}: Required variable '${firstPart}' is null or undefined. This may indicate that a previous API call failed or timed out.`);
              }
              
              // If we can't evaluate, throw an error to prevent invalid URLs
              throw new Error(`Template expression ${fullMatch} could not be evaluated. Available context keys: ${availableKeys.join(', ')}`);            
          } 
              } catch (error) {
            console.error(`❌ Error evaluating template expression ${fullMatch}:`, error);
            throw error;
          }
        }

        // STEP 2: Find all simple path parameters like {name}, {id}, {userId}, etc.
      const paramPattern = /{([a-zA-Z_][a-zA-Z0-9_]*)}/g;
        const matches = Array.from(processedEndpoint.matchAll(paramPattern));
      
      for (const match of matches) {
        const fullMatch = match[0]; // e.g., "{name}"
        const paramName = match[1]; // e.g., "name"
        let paramValue: any = undefined;
        
        // Strategy 0: Check cookies if idParam matches and authentication.type is 'cookie'
        const configIdParam = nodeConfig?.idParam || null;
        const configAuthType = nodeConfig?.authentication?.type || "bearer";
        const configCookieName = nodeConfig?.authentication?.cookieName || null || paramName;
        
        if (configIdParam === paramName && configAuthType === 'cookie') {
          // SECURITY: For httpOnly cookies (user_id, auth_token), use API route
          // This prevents XSS attacks that could steal tokens from non-HttpOnly cookies
          if (configCookieName === 'user_id') {
            try {
              // Read user_id from httpOnly cookie via API route
              const cookieResponse = await fetch('/api/auth/user-id', {
                method: 'GET',
                credentials: 'include'
              });
              if (cookieResponse.ok) {
                const cookieData = await cookieResponse.json();
                if (cookieData.userId) {
                  paramValue = cookieData.userId;
                  console.log(`🍪 Read ${configCookieName} from httpOnly cookie: ${paramValue}`);
                } else {
                  console.warn(`⚠️ Cookie ${configCookieName} not found in response. Response: ${JSON.stringify(cookieData)}`);
                }
              } else if (cookieResponse.status === 404) {
                // ✅ IMPROVED: Handle 404 gracefully - route might not exist in older projects
                console.warn(`⚠️ /api/auth/user-id route not found (404). This route should be generated in src/app/api/auth/user-id/route.ts. Falling back to other methods...`);
                // Don't throw error, let it fall through to other strategies
              } else {
                console.warn(`⚠️ Failed to fetch ${configCookieName} from API route: ${cookieResponse.status} - ${cookieResponse.statusText}`);
              }
            } catch (error) {
              console.warn(`⚠️ Failed to read ${configCookieName} from cookie:`, error);
              // Don't throw error, let it fall through to other strategies
            }
          } else if (configCookieName === 'auth_token' || configCookieName === 'token') {
            // SECURITY: Read auth_token from httpOnly cookie via API route (prevents XSS)
            try {
              const cookieResponse = await fetch('/api/auth/token', {
                method: 'GET',
                credentials: 'include'
              });
              if (cookieResponse.ok) {
                const cookieData = await cookieResponse.json();
                if (cookieData.authToken) {
                  paramValue = cookieData.authToken;
                  console.log(`🍪 Read ${configCookieName} from httpOnly cookie via API route: ${paramValue.substring(0, 20)}...`);
                } else {
                  console.warn(`⚠️ Cookie ${configCookieName} not found in response. Response: ${JSON.stringify(cookieData)}`);
                }
              } else if (cookieResponse.status === 404) {
                console.warn(`⚠️ /api/auth/token route not found (404). This route should be generated in src/app/api/auth/token/route.ts. Falling back to other methods...`);
                // Don't throw error, let it fall through to other strategies
              } else {
                console.warn(`⚠️ Failed to fetch ${configCookieName} from API route: ${cookieResponse.status} - ${cookieResponse.statusText}`);
              }
            } catch (error) {
              console.warn(`⚠️ Failed to read ${configCookieName} from cookie:`, error);
              // Don't throw error, let it fall through to other strategies
            }
          } else {
            // For non-httpOnly cookies (like user_id fallback), read directly from document.cookie
            try {
              if (typeof document !== 'undefined' && document.cookie) {
                const cookies = document.cookie.split(';').reduce((acc: any, cookie: string) => {
                  const [key, value] = cookie.trim().split('=');
                  if (key && value) {
                    acc[key] = decodeURIComponent(value);
                  }
                  return acc;
                }, {});
                if (cookies[configCookieName]) {
                  paramValue = cookies[configCookieName];
                  console.log(`🍪 Read ${configCookieName} from cookie: ${paramValue}`);
                }
              }
            } catch (error) {
              console.warn(`⚠️ Failed to read ${configCookieName} from document.cookie:`, error);
            }
          }
          
          // If we found the value from cookie, replace and continue to next parameter
          if (paramValue !== undefined && paramValue !== null && paramValue !== '') {
            const encodedValue = encodeURIComponent(String(paramValue));
            processedEndpoint = processedEndpoint.replace(fullMatch, encodedValue);
            console.log(`🔧 Replaced ${fullMatch} with cookie value: ${paramValue} -> ${processedEndpoint}`);
            continue; // Skip to next parameter
          } else {
            console.warn(`⚠️ Could not read ${configCookieName} from cookie for parameter ${fullMatch}`);
          }
        }
        
        // Strategy 1: Try direct match (case-insensitive)
        // Look for exact param name, capitalized, lowercase, etc.
        const searchKeys = [
          paramName,
          paramName.charAt(0).toUpperCase() + paramName.slice(1), // Capitalized
          paramName.toUpperCase(),
          paramName.toLowerCase()
        ];
        
        // Check in cleanedInitialData
        for (const key of searchKeys) {
          if (context?.[key] !== undefined && context[key] !== null && context[key] !== '') {
            paramValue = context[key];
            break;
          }
          if (context?.formData?.[key] !== undefined && context.formData[key] !== null && context.formData[key] !== '') {
            paramValue = context.formData[key];
            break;
          }
        }
        
        // Strategy 2: Check flowResults.formData
        if (!paramValue && flowResults?.formData) {
          for (const key of searchKeys) {
            if (flowResults.formData[key] !== undefined && flowResults.formData[key] !== null && flowResults.formData[key] !== '') {
              paramValue = flowResults.formData[key];
              break;
            }
          }
        }
        
        // Strategy 3: Check dataFlow.get()
        if (!paramValue && typeof dataFlow !== 'undefined' && dataFlow.get) {
          for (const key of searchKeys) {
            const flowValue = dataFlow.get(key);
            if (flowValue !== undefined && flowValue !== null && flowValue !== '') {
              // Extract value from object if needed
              if (typeof flowValue === 'object' && !Array.isArray(flowValue)) {
                paramValue = flowValue.value || flowValue.data || flowValue.currentValue || flowValue;
              } else {
                paramValue = flowValue;
              }
              if (paramValue !== undefined && paramValue !== null && paramValue !== '') break;
            }
          }
        }
        
        // Strategy 4: Context-aware matching based on endpoint path
        // e.g., /api/brand/{name} -> try "brand", "Brand"
        // e.g., /api/campaign/{name} -> try "campaign", "Campaign"
        if (!paramValue) {
          const endpointParts = endpoint.split('/');
          const resourceName = endpointParts.find(part => part && !part.startsWith('{') && part !== 'api');
          if (resourceName) {
            const resourceKeys = [
              resourceName,
              resourceName.charAt(0).toUpperCase() + resourceName.slice(1),
              resourceName.toLowerCase()
            ];
            
            for (const key of resourceKeys) {
              if (context?.[key] !== undefined && context[key] !== null && context[key] !== '') {
                paramValue = context[key];
                break;
              }
              if (context?.formData?.[key] !== undefined && context.formData[key] !== null && context.formData[key] !== '') {
                paramValue = context.formData[key];
                break;
              }
              if (flowResults?.formData?.[key] !== undefined && flowResults.formData[key] !== null && flowResults.formData[key] !== '') {
                paramValue = flowResults.formData[key];
                break;
              }
            }
          }
        }
        
        // Strategy 5: Case-insensitive search in all available data
        if (!paramValue) {
          const allData = {
            ...(context || {}),
            ...(context?.formData || {}),
            ...(flowResults?.formData || {}),
            ...(flowResults || {})
          };
          
          for (const [key, value] of Object.entries(allData)) {
            if (key.toLowerCase() === paramName.toLowerCase() && value !== undefined && value !== null && value !== '') {
              paramValue = value;
              break;
            }
          }
        }
        
        // Replace the parameter if value found
        if (paramValue !== undefined && paramValue !== null && paramValue !== '') {
          // CRITICAL FIX: Extract primitive value from objects/arrays before encoding
          let primitiveValue = paramValue;
          
          // If paramValue is an array, try to extract the first item
          if (Array.isArray(paramValue) && paramValue.length > 0) {
            primitiveValue = paramValue[0];
          }
          
          // If primitiveValue is still an object, try to extract common properties
          if (typeof primitiveValue === 'object' && primitiveValue !== null) {
            // Try common property names (case-insensitive)
            const commonProps = ['Email', 'email', 'value', 'data', 'id', 'name', 'key', 'Value', 'Data', 'Id', 'Name', 'Key'];
            for (const prop of commonProps) {
              if (primitiveValue[prop] !== undefined && primitiveValue[prop] !== null) {
                const extractedValue = primitiveValue[prop];
                // Only use if it's a primitive
                if (typeof extractedValue === 'string' || typeof extractedValue === 'number' || typeof extractedValue === 'boolean') {
                  primitiveValue = extractedValue;
                  break;
                }
              }
            }
            
            // If still an object, try to find first primitive property
            if (typeof primitiveValue === 'object' && primitiveValue !== null) {
              const keys = Object.keys(primitiveValue);
              for (const key of keys) {
                const val = primitiveValue[key];
                if (typeof val === 'string' || typeof val === 'number' || typeof val === 'boolean') {
                  primitiveValue = val;
                  break;
                }
              }
            }
          }
          
          // Final check: if still an object, convert to string (fallback)
          if (typeof primitiveValue === 'object' && primitiveValue !== null) {
            console.warn(`⚠️ Could not extract primitive value from object for parameter ${fullMatch}, using string conversion`);
            primitiveValue = String(primitiveValue);
          }
          
          const encodedValue = encodeURIComponent(String(primitiveValue));
          processedEndpoint = processedEndpoint.replace(fullMatch, encodedValue);
          console.log(`🔧 Replaced ${fullMatch} with value: ${primitiveValue} -> ${processedEndpoint}`);
        } else {
          console.warn(`⚠️ Could not find value for path parameter ${fullMatch} in endpoint URL`);
        }
      }
      
        return processedEndpoint;
      };
    }
    
   
    const nodeConfigId_apiEndpoint_db_api_get_1770832554240 = 'apiEndpoint_db_api_get_1770832554240'.replace(/^apiEndpoint_/, '').replace(/[^a-zA-Z0-9_]/g, '_') || 'default';
    const nodeConfig_apiEndpoint_db_api_get_1770832554240 = {"url":"/api/form/component-generated-form_vitality_form_338226625-917682082","body":"","method":"GET","params":[],"apiName":"vitality_form read-all Database API","headers":[{"key":"Content-Type","value":"application/json"},{"key":"Authorization","value":"Bearer {{auth_token}}"}],"tableId":"vitality_form","dbMethod":"get","endpoint":"/api/form/component-generated-form_vitality_form_338226625-917682082","operation":"read-all","tableName":"vitality_form","description":"Get all vitality_form records","requestBody":"","isDatabaseApi":true,"authentication":{"type":"bearer"},"resultVariable":"getVitality_formResult","apiResultVariable":"getVitality_formResult"};

     // 🔧 FIX: Process template expressions like {{databaseRowId}} in the URL before replacePathParameters
    if (typeof apiEndpoint_db_api_get_1770832554240 === 'string' && apiEndpoint_db_api_get_1770832554240.includes('{{')) {
      try {
        // Build evaluation context with all available variables
        const evalContext: any = {
          ...(typeof flowResults !== 'undefined' ? flowResults : {}),
          ...(typeof flowResults !== 'undefined' && flowResults.variables ? flowResults.variables : {}),
          ...(typeof dataFlow !== 'undefined' ? { dataFlow } : {})
        };
        
        // Process template expressions in the URL
        apiEndpoint_db_api_get_1770832554240 = TemplateExpressionEngine.processTemplate(
          apiEndpoint_db_api_get_1770832554240,
          evalContext
        );
        
          console.log(`🔧 Processed template URL: ${apiEndpoint_db_api_get_1770832554240}`);
      } catch (templateError) {
        console.warn(`⚠️ Template processing error for URL: ${templateError}`);
        // Continue with original URL if template processing fails
      }
    }

   if (replacePathParameters) {
    apiEndpoint_db_api_get_1770832554240 = await replacePathParameters(apiEndpoint_db_api_get_1770832554240, processedInput_db_api_get_1770832554240, typeof flowResults !== 'undefined' ? flowResults : {}, typeof dataFlow !== 'undefined' ? dataFlow : {}, nodeConfig_apiEndpoint_db_api_get_1770832554240);
   } ;
    try {
      if (!apiEndpoint_db_api_get_1770832554240) {
        throw new Error('API endpoint is required for GET requests');
      }
      
      // Show loader before starting API request
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('apiLoadingStart', { 
          detail: { 
            endpoint: apiEndpoint_db_api_get_1770832554240,
            method: 'GET',
            nodeId: 'db-api-get-1770832554240'
          } 
        }));
      }
      
      // Build the full API URL using environment variable
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
      const normalizedPath = apiEndpoint_db_api_get_1770832554240.startsWith('/') ? apiEndpoint_db_api_get_1770832554240 : `/${apiEndpoint_db_api_get_1770832554240}`;
      const fullApiUrl = apiEndpoint_db_api_get_1770832554240.startsWith('http') ? apiEndpoint_db_api_get_1770832554240 : `${apiBaseUrl}${normalizedPath}`;
      
      // Prepare request options
      const configuredHeaders = [{"key":"Content-Type","value":"application/json"},{"key":"Authorization","value":"Bearer {{auth_token}}"}];
      const requestHeaders: Record<string, string> = {
        'Content-Type': 'application/json'
      };
      
      if (Array.isArray(configuredHeaders)) {
        configuredHeaders.forEach(header => {
          if (header && header.key) {
            requestHeaders[header.key] = header.value !== undefined ? String(header.value) : '';
          }
        });
      } else if (configuredHeaders && typeof configuredHeaders === 'object') {
        Object.entries(configuredHeaders).forEach(([key, value]) => {
          if (value !== undefined && value !== null) {
            requestHeaders[key] = String(value);
          }
        });
      }
      
      const controller = new AbortController();
      const requestOptions: RequestInit = {
        method: 'GET',
        headers: requestHeaders,
        signal: controller.signal
      };
      
      // Add timeout handling
      const timeoutId = setTimeout(() => controller.abort(), 30000);
      
      // 🔧 IMPROVED: Log full URL and request details for debugging
      if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        console.log('🌐 API GET Request Details:', {
          fullUrl: fullApiUrl,
          endpoint: apiEndpoint_db_api_get_1770832554240,
          method: 'GET',
          headers: requestHeaders,
          nodeId: 'db-api-get-1770832554240'
        });
      }
      
      const response = await fetch(fullApiUrl, requestOptions);
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorText = await response.text();
        const errorMessage = `API GET request failed: ${response.status} - ${response.statusText}. Response: ${errorText}`;
        
        // 🔧 SECURITY: Gate detailed error logging behind development mode to prevent log volume issues
        if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
          console.error('❌ API GET Error Details:', {
            fullUrl: fullApiUrl,
            endpoint: apiEndpoint_db_api_get_1770832554240,
            status: response.status,
            statusText: response.statusText,
            errorResponse: errorText,
            nodeId: 'db-api-get-1770832554240'
          });
        } else {
          // Production: Log minimal error info
          console.error('❌ API GET Error:', {
            endpoint: apiEndpoint_db_api_get_1770832554240,
            status: response.status,
            nodeId: 'db-api-get-1770832554240'
          });
        }
        
        throw new Error(errorMessage);
      }
      
      const responseData = await response.json();
      
      // Hide loader after successful API request
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('apiLoadingEnd', { 
          detail: { 
            success: true,
            endpoint: apiEndpoint_db_api_get_1770832554240,
            method: 'GET',
            nodeId: 'db-api-get-1770832554240',
            response: responseData
          } 
        }));
      }
      
      // Update result variable
      step2Result = {
        ...currentResult,
        ['getVitality_formResult']: responseData,
        apiSuccess: true,
        url: fullApiUrl,
        status: response.status,
        statusText: response.statusText,
        timestamp: new Date().toISOString()
      };
      
      // 🔧 ENHANCED: Store in Data Flow System for UI Components
      if (!flowResults.apiResponses) flowResults.apiResponses = {};
      if (!flowResults.nodeResults) flowResults.nodeResults = {};
      if (!flowResults.variables) flowResults.variables = {};
      
      // Store the result in multiple accessible locations
      flowResults.apiResponses["getVitality_formResult"] = responseData;
      flowResults.variables["getVitality_formResult"] = responseData;
      flowResults.nodeResults["db-api-get-1770832554240"] = {
        data: responseData,
        displayName: "getVitality_formResult",
        nodeType: "api-get",
        success: true,
        status: response.status,
        stepNumber: (flowResults.stepCounter || 0) + 1
      };
      
      // 🔧 CRITICAL FIX: Store at top-level for direct access by foreach loops
      flowResults["getVitality_formResult"] = responseData;
      
      // Store current result for dataFlow.current() and dataFlow.previous()
      flowResults.previousResult = flowResults.currentResult;
      flowResults.currentResult = responseData;
      
      // Increment step counter for proper sequencing
      flowResults.stepCounter = (flowResults.stepCounter || 0) + 1;
      
    } catch (error) {
      // 🔧 SECURITY: Gate detailed error logging behind development mode to prevent log volume issues
      const errorMessage = error instanceof Error ? error.message : String(error) || 'Unknown API error';
      
      // CRITICAL FIX: Declare fullErrorUrl outside if block so it's always available
      // This prevents ReferenceError in production when fullErrorUrl is referenced unconditionally
      const fullErrorUrl = apiEndpoint_db_api_get_1770832554240.startsWith('http') ? apiEndpoint_db_api_get_1770832554240 : `${process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000'}${apiEndpoint_db_api_get_1770832554240.startsWith('/') ? apiEndpoint_db_api_get_1770832554240 : `/${apiEndpoint_db_api_get_1770832554240}`}`;
      
      if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        // Development: Full error details with stack traces
        console.error('🌐 API GET request failed:', {
          error: errorMessage,
          fullUrl: fullErrorUrl,
          endpoint: apiEndpoint_db_api_get_1770832554240,
          nodeId: 'db-api-get-1770832554240',
          errorDetails: error instanceof Error ? {
            name: error.name,
            message: error.message,
            stack: error.stack
          } : error
        });
      } else {
        // Production: Minimal error info (no stack traces, but URL is still available for error object)
        console.error('🌐 API GET request failed:', {
          error: errorMessage,
          endpoint: apiEndpoint_db_api_get_1770832554240,
          nodeId: 'db-api-get-1770832554240'
        });
      }
      
      // Hide loader after API request error
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('apiLoadingEnd', { 
          detail: { 
            success: false,
            endpoint: apiEndpoint_db_api_get_1770832554240,
            fullUrl: fullErrorUrl,
            method: 'GET',
            nodeId: 'db-api-get-1770832554240',
            error: errorMessage
          } 
        }));
      }
      
      step2Result = {
        ...currentResult,
        ['getVitality_formResult']: null,
        apiError: errorMessage,
        apiSuccess: false,
        url: fullErrorUrl,
        endpoint: apiEndpoint_db_api_get_1770832554240,
        timestamp: new Date().toISOString()
      };
    }
      currentResult = step2Result;
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['db-api-get-1770832554240'] = {
      nodeId: 'db-api-get-1770832554240',
      nodeType: 'db-api-get',
      stepNumber: 2,
      displayName: 'apiGetResult_db_api_get_1770832554240',
      data: step2Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    flowResults.apiResponses['apiGetResult_db_api_get_1770832554240'] = step2Result;
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['apiGetResult_db_api_get_1770832554240'] || typeof flowResults['apiGetResult_db_api_get_1770832554240'] === 'undefined') {
      flowResults['apiGetResult_db_api_get_1770832554240'] = step2Result;
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
      console.error('❌ Error in step 2 (db-api-get):', stepError);
      flowErrors.push(`Step 2 (db-api-get): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step2Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'db-api-get',
        nodeId: 'db-api-get-1770832554240',
        stepNumber: 2
      };
      
      currentResult = step2Result; // Update currentResult even on error
      
      // Store error result in enhanced data flow system
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['db-api-get-1770832554240'] = {
      nodeId: 'db-api-get-1770832554240',
      nodeType: 'db-api-get',
      stepNumber: 2,
      displayName: 'apiGetResult_db_api_get_1770832554240',
      data: step2Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    flowResults.apiResponses['apiGetResult_db_api_get_1770832554240'] = step2Result;
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['apiGetResult_db_api_get_1770832554240'] || typeof flowResults['apiGetResult_db_api_get_1770832554240'] === 'undefined') {
      flowResults['apiGetResult_db_api_get_1770832554240'] = step2Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
    }

    step3Result = currentResult;
    try {
      
    const scriptEventPayload_script_event_1771006028992 = initialData || {};
    const scriptContextData_script_event_1771006028992 =
      scriptEventPayload_script_event_1771006028992.scriptContext ||
      scriptEventPayload_script_event_1771006028992.contextData ||
      scriptEventPayload_script_event_1771006028992;

    if (scriptContextData_script_event_1771006028992 && typeof scriptContextData_script_event_1771006028992 === 'object') {
      (flowResults as any).variables = (flowResults as any).variables || {};
      Object.entries(scriptContextData_script_event_1771006028992).forEach(([key, value]) => {
        if (key === 'scriptContext' || key === 'contextData') return;
        (flowResults as any)[key] = value;
        (flowResults as any).variables[key] = value;
      });
    }

    // Resolve inputVariableMappings and store in scriptEventParameters
    const inputVariableMappings_script_event_1771006028992 = {"innerHTML":"{{getVitality_formResult}}"};
    const resolvedParameters_script_event_1771006028992: Record<string, any> = {};
    
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
    
    Object.entries(inputVariableMappings_script_event_1771006028992).forEach(([key, mappingValue]) => {
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
          resolvedParameters_script_event_1771006028992[key] = resolvedValue;
          console.log(`✅ Set ${key} to:`, resolvedValue);
        } else if (typeof resolvedValue === 'string' && resolvedValue.trim() !== '') {
          // Only set non-empty strings
          resolvedParameters_script_event_1771006028992[key] = resolvedValue;
          console.log(`✅ Set ${key} to string:`, resolvedValue);
        } else if (typeof resolvedValue !== 'string') {
          // Allow numbers, booleans, etc.
          resolvedParameters_script_event_1771006028992[key] = resolvedValue;
          console.log(`✅ Set ${key} to:`, resolvedValue);
        } else {
          console.warn(`⚠️ Skipping ${key} - empty string`);
        }
      } else {
        console.warn(`⚠️ Skipping ${key} - resolvedValue is ${resolvedValue}`);
      }
    });
    
    console.log('📦 Resolved parameters:', resolvedParameters_script_event_1771006028992);
    
    const mergedParameters_script_event_1771006028992 = {
      ...(scriptEventPayload_script_event_1771006028992?.parameters || {}),
      ...resolvedParameters_script_event_1771006028992
    };
    
    // Store resolved parameters in flowResults.scriptEventParameters
    if (Object.keys(mergedParameters_script_event_1771006028992).length > 0) {
      (flowResults as any).scriptEventParameters = mergedParameters_script_event_1771006028992;
      console.log('💾 Stored scriptEventParameters in flowResults:', mergedParameters_script_event_1771006028992);
      
      // Push parameters to __scriptContext so UI scripts can access them
      if (typeof window !== 'undefined') {
        const scriptContext = (window as any).__scriptContext;
        if (scriptContext && typeof scriptContext.setData === 'function') {
          console.log('📤 Pushing parameters to scriptContext...');
          Object.entries(mergedParameters_script_event_1771006028992).forEach(([key, value]) => {
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

    step3Result = {
      ...scriptEventPayload_script_event_1771006028992,
      parameters: mergedParameters_script_event_1771006028992,
      scriptId: scriptEventPayload_script_event_1771006028992?.scriptId || scriptEventPayload_script_event_1771006028992?.script_id || '9c50f7fb-b373-42a8-b13d-d80d598eea51',
      scriptName: scriptEventPayload_script_event_1771006028992?.scriptName,
      trigger: scriptEventPayload_script_event_1771006028992?.trigger || 'script-event',
      timestamp: initialData?.timestamp || new Date().toISOString()
    };
    (flowResults as any).scriptEventResult = step3Result;
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['script-event-1771006028992'] = {
      nodeId: 'script-event-1771006028992',
      nodeType: 'script-event',
      stepNumber: 3,
      displayName: 'scriptEventResult_script_event_1771006028992',
      data: step3Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for script-event
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['scriptEventResult_script_event_1771006028992'] || typeof flowResults['scriptEventResult_script_event_1771006028992'] === 'undefined') {
      flowResults['scriptEventResult_script_event_1771006028992'] = step3Result;
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
      console.error('❌ Error in step 3 (script-event):', stepError);
      flowErrors.push(`Step 3 (script-event): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step3Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'script-event',
        nodeId: 'script-event-1771006028992',
        stepNumber: 3
      };
      
      currentResult = step3Result; // Update currentResult even on error
      
      // Store error result in enhanced data flow system
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['script-event-1771006028992'] = {
      nodeId: 'script-event-1771006028992',
      nodeType: 'script-event',
      stepNumber: 3,
      displayName: 'scriptEventResult_script_event_1771006028992',
      data: step3Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for script-event
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['scriptEventResult_script_event_1771006028992'] || typeof flowResults['scriptEventResult_script_event_1771006028992'] === 'undefined') {
      flowResults['scriptEventResult_script_event_1771006028992'] = step3Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
    }

    step4Result = currentResult;
    try {
      
    const scriptEventPayload_script_event_1771006052608 = initialData || {};
    const scriptContextData_script_event_1771006052608 =
      scriptEventPayload_script_event_1771006052608.scriptContext ||
      scriptEventPayload_script_event_1771006052608.contextData ||
      scriptEventPayload_script_event_1771006052608;

    if (scriptContextData_script_event_1771006052608 && typeof scriptContextData_script_event_1771006052608 === 'object') {
      (flowResults as any).variables = (flowResults as any).variables || {};
      Object.entries(scriptContextData_script_event_1771006052608).forEach(([key, value]) => {
        if (key === 'scriptContext' || key === 'contextData') return;
        (flowResults as any)[key] = value;
        (flowResults as any).variables[key] = value;
      });
    }

    // Resolve inputVariableMappings and store in scriptEventParameters
    const inputVariableMappings_script_event_1771006052608 = {"innerHTML":"{{getVitality_formResult}}"};
    const resolvedParameters_script_event_1771006052608: Record<string, any> = {};
    
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
    
    Object.entries(inputVariableMappings_script_event_1771006052608).forEach(([key, mappingValue]) => {
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
          resolvedParameters_script_event_1771006052608[key] = resolvedValue;
          console.log(`✅ Set ${key} to:`, resolvedValue);
        } else if (typeof resolvedValue === 'string' && resolvedValue.trim() !== '') {
          // Only set non-empty strings
          resolvedParameters_script_event_1771006052608[key] = resolvedValue;
          console.log(`✅ Set ${key} to string:`, resolvedValue);
        } else if (typeof resolvedValue !== 'string') {
          // Allow numbers, booleans, etc.
          resolvedParameters_script_event_1771006052608[key] = resolvedValue;
          console.log(`✅ Set ${key} to:`, resolvedValue);
        } else {
          console.warn(`⚠️ Skipping ${key} - empty string`);
        }
      } else {
        console.warn(`⚠️ Skipping ${key} - resolvedValue is ${resolvedValue}`);
      }
    });
    
    console.log('📦 Resolved parameters:', resolvedParameters_script_event_1771006052608);
    
    const mergedParameters_script_event_1771006052608 = {
      ...(scriptEventPayload_script_event_1771006052608?.parameters || {}),
      ...resolvedParameters_script_event_1771006052608
    };
    
    // Store resolved parameters in flowResults.scriptEventParameters
    if (Object.keys(mergedParameters_script_event_1771006052608).length > 0) {
      (flowResults as any).scriptEventParameters = mergedParameters_script_event_1771006052608;
      console.log('💾 Stored scriptEventParameters in flowResults:', mergedParameters_script_event_1771006052608);
      
      // Push parameters to __scriptContext so UI scripts can access them
      if (typeof window !== 'undefined') {
        const scriptContext = (window as any).__scriptContext;
        if (scriptContext && typeof scriptContext.setData === 'function') {
          console.log('📤 Pushing parameters to scriptContext...');
          Object.entries(mergedParameters_script_event_1771006052608).forEach(([key, value]) => {
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
      ...scriptEventPayload_script_event_1771006052608,
      parameters: mergedParameters_script_event_1771006052608,
      scriptId: scriptEventPayload_script_event_1771006052608?.scriptId || scriptEventPayload_script_event_1771006052608?.script_id || '9c50f7fb-b373-42a8-b13d-d80d598eea51',
      scriptName: scriptEventPayload_script_event_1771006052608?.scriptName,
      trigger: scriptEventPayload_script_event_1771006052608?.trigger || 'script-event',
      timestamp: initialData?.timestamp || new Date().toISOString()
    };
    (flowResults as any).scriptEventResult = step4Result;
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['script-event-1771006052608'] = {
      nodeId: 'script-event-1771006052608',
      nodeType: 'script-event',
      stepNumber: 4,
      displayName: 'scriptEventResult_script_event_1771006052608',
      data: step4Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for script-event
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['scriptEventResult_script_event_1771006052608'] || typeof flowResults['scriptEventResult_script_event_1771006052608'] === 'undefined') {
      flowResults['scriptEventResult_script_event_1771006052608'] = step4Result;
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
        nodeId: 'script-event-1771006052608',
        stepNumber: 4
      };
      
      currentResult = step4Result; // Update currentResult even on error
      
      // Store error result in enhanced data flow system
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['script-event-1771006052608'] = {
      nodeId: 'script-event-1771006052608',
      nodeType: 'script-event',
      stepNumber: 4,
      displayName: 'scriptEventResult_script_event_1771006052608',
      data: step4Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for script-event
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['scriptEventResult_script_event_1771006052608'] || typeof flowResults['scriptEventResult_script_event_1771006052608'] === 'undefined') {
      flowResults['scriptEventResult_script_event_1771006052608'] = step4Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
    }

    step5Result = currentResult;
    try {
      
    const scriptEventPayload_script_event_1771006060937 = initialData || {};
    const scriptContextData_script_event_1771006060937 =
      scriptEventPayload_script_event_1771006060937.scriptContext ||
      scriptEventPayload_script_event_1771006060937.contextData ||
      scriptEventPayload_script_event_1771006060937;

    if (scriptContextData_script_event_1771006060937 && typeof scriptContextData_script_event_1771006060937 === 'object') {
      (flowResults as any).variables = (flowResults as any).variables || {};
      Object.entries(scriptContextData_script_event_1771006060937).forEach(([key, value]) => {
        if (key === 'scriptContext' || key === 'contextData') return;
        (flowResults as any)[key] = value;
        (flowResults as any).variables[key] = value;
      });
    }

    // Resolve inputVariableMappings and store in scriptEventParameters
    const inputVariableMappings_script_event_1771006060937 = {"innerHTML":"{{getVitality_formResult}}"};
    const resolvedParameters_script_event_1771006060937: Record<string, any> = {};
    
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
    
    Object.entries(inputVariableMappings_script_event_1771006060937).forEach(([key, mappingValue]) => {
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
          resolvedParameters_script_event_1771006060937[key] = resolvedValue;
          console.log(`✅ Set ${key} to:`, resolvedValue);
        } else if (typeof resolvedValue === 'string' && resolvedValue.trim() !== '') {
          // Only set non-empty strings
          resolvedParameters_script_event_1771006060937[key] = resolvedValue;
          console.log(`✅ Set ${key} to string:`, resolvedValue);
        } else if (typeof resolvedValue !== 'string') {
          // Allow numbers, booleans, etc.
          resolvedParameters_script_event_1771006060937[key] = resolvedValue;
          console.log(`✅ Set ${key} to:`, resolvedValue);
        } else {
          console.warn(`⚠️ Skipping ${key} - empty string`);
        }
      } else {
        console.warn(`⚠️ Skipping ${key} - resolvedValue is ${resolvedValue}`);
      }
    });
    
    console.log('📦 Resolved parameters:', resolvedParameters_script_event_1771006060937);
    
    const mergedParameters_script_event_1771006060937 = {
      ...(scriptEventPayload_script_event_1771006060937?.parameters || {}),
      ...resolvedParameters_script_event_1771006060937
    };
    
    // Store resolved parameters in flowResults.scriptEventParameters
    if (Object.keys(mergedParameters_script_event_1771006060937).length > 0) {
      (flowResults as any).scriptEventParameters = mergedParameters_script_event_1771006060937;
      console.log('💾 Stored scriptEventParameters in flowResults:', mergedParameters_script_event_1771006060937);
      
      // Push parameters to __scriptContext so UI scripts can access them
      if (typeof window !== 'undefined') {
        const scriptContext = (window as any).__scriptContext;
        if (scriptContext && typeof scriptContext.setData === 'function') {
          console.log('📤 Pushing parameters to scriptContext...');
          Object.entries(mergedParameters_script_event_1771006060937).forEach(([key, value]) => {
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

    step5Result = {
      ...scriptEventPayload_script_event_1771006060937,
      parameters: mergedParameters_script_event_1771006060937,
      scriptId: scriptEventPayload_script_event_1771006060937?.scriptId || scriptEventPayload_script_event_1771006060937?.script_id || '9c50f7fb-b373-42a8-b13d-d80d598eea51',
      scriptName: scriptEventPayload_script_event_1771006060937?.scriptName,
      trigger: scriptEventPayload_script_event_1771006060937?.trigger || 'script-event',
      timestamp: initialData?.timestamp || new Date().toISOString()
    };
    (flowResults as any).scriptEventResult = step5Result;
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['script-event-1771006060937'] = {
      nodeId: 'script-event-1771006060937',
      nodeType: 'script-event',
      stepNumber: 5,
      displayName: 'scriptEventResult_script_event_1771006060937',
      data: step5Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for script-event
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['scriptEventResult_script_event_1771006060937'] || typeof flowResults['scriptEventResult_script_event_1771006060937'] === 'undefined') {
      flowResults['scriptEventResult_script_event_1771006060937'] = step5Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
      
      if (flowResults.currentResult !== undefined && 
          flowResults.stepCounter > 4) {
        currentResult = flowResults.currentResult;
      } else {
        currentResult = step5Result;
      }
    } catch (stepError) {
      const stepErrorMessage = stepError instanceof Error ? stepError.message : String(stepError) || 'Unknown step error';
      console.error('❌ Error in step 5 (script-event):', stepError);
      flowErrors.push(`Step 5 (script-event): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step5Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'script-event',
        nodeId: 'script-event-1771006060937',
        stepNumber: 5
      };
      
      currentResult = step5Result; // Update currentResult even on error
      
      // Store error result in enhanced data flow system
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['script-event-1771006060937'] = {
      nodeId: 'script-event-1771006060937',
      nodeType: 'script-event',
      stepNumber: 5,
      displayName: 'scriptEventResult_script_event_1771006060937',
      data: step5Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for script-event
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['scriptEventResult_script_event_1771006060937'] || typeof flowResults['scriptEventResult_script_event_1771006060937'] === 'undefined') {
      flowResults['scriptEventResult_script_event_1771006060937'] = step5Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
    }

    step6Result = currentResult;
    try {
      
    const scriptEventPayload_script_event_1771006085797 = initialData || {};
    const scriptContextData_script_event_1771006085797 =
      scriptEventPayload_script_event_1771006085797.scriptContext ||
      scriptEventPayload_script_event_1771006085797.contextData ||
      scriptEventPayload_script_event_1771006085797;

    if (scriptContextData_script_event_1771006085797 && typeof scriptContextData_script_event_1771006085797 === 'object') {
      (flowResults as any).variables = (flowResults as any).variables || {};
      Object.entries(scriptContextData_script_event_1771006085797).forEach(([key, value]) => {
        if (key === 'scriptContext' || key === 'contextData') return;
        (flowResults as any)[key] = value;
        (flowResults as any).variables[key] = value;
      });
    }

    // Resolve inputVariableMappings and store in scriptEventParameters
    const inputVariableMappings_script_event_1771006085797 = {"innerHTML":"{{getVitality_formResult}}"};
    const resolvedParameters_script_event_1771006085797: Record<string, any> = {};
    
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
    
    Object.entries(inputVariableMappings_script_event_1771006085797).forEach(([key, mappingValue]) => {
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
          resolvedParameters_script_event_1771006085797[key] = resolvedValue;
          console.log(`✅ Set ${key} to:`, resolvedValue);
        } else if (typeof resolvedValue === 'string' && resolvedValue.trim() !== '') {
          // Only set non-empty strings
          resolvedParameters_script_event_1771006085797[key] = resolvedValue;
          console.log(`✅ Set ${key} to string:`, resolvedValue);
        } else if (typeof resolvedValue !== 'string') {
          // Allow numbers, booleans, etc.
          resolvedParameters_script_event_1771006085797[key] = resolvedValue;
          console.log(`✅ Set ${key} to:`, resolvedValue);
        } else {
          console.warn(`⚠️ Skipping ${key} - empty string`);
        }
      } else {
        console.warn(`⚠️ Skipping ${key} - resolvedValue is ${resolvedValue}`);
      }
    });
    
    console.log('📦 Resolved parameters:', resolvedParameters_script_event_1771006085797);
    
    const mergedParameters_script_event_1771006085797 = {
      ...(scriptEventPayload_script_event_1771006085797?.parameters || {}),
      ...resolvedParameters_script_event_1771006085797
    };
    
    // Store resolved parameters in flowResults.scriptEventParameters
    if (Object.keys(mergedParameters_script_event_1771006085797).length > 0) {
      (flowResults as any).scriptEventParameters = mergedParameters_script_event_1771006085797;
      console.log('💾 Stored scriptEventParameters in flowResults:', mergedParameters_script_event_1771006085797);
      
      // Push parameters to __scriptContext so UI scripts can access them
      if (typeof window !== 'undefined') {
        const scriptContext = (window as any).__scriptContext;
        if (scriptContext && typeof scriptContext.setData === 'function') {
          console.log('📤 Pushing parameters to scriptContext...');
          Object.entries(mergedParameters_script_event_1771006085797).forEach(([key, value]) => {
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

    step6Result = {
      ...scriptEventPayload_script_event_1771006085797,
      parameters: mergedParameters_script_event_1771006085797,
      scriptId: scriptEventPayload_script_event_1771006085797?.scriptId || scriptEventPayload_script_event_1771006085797?.script_id || '9c50f7fb-b373-42a8-b13d-d80d598eea51',
      scriptName: scriptEventPayload_script_event_1771006085797?.scriptName,
      trigger: scriptEventPayload_script_event_1771006085797?.trigger || 'script-event',
      timestamp: initialData?.timestamp || new Date().toISOString()
    };
    (flowResults as any).scriptEventResult = step6Result;
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['script-event-1771006085797'] = {
      nodeId: 'script-event-1771006085797',
      nodeType: 'script-event',
      stepNumber: 6,
      displayName: 'scriptEventResult_script_event_1771006085797',
      data: step6Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for script-event
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['scriptEventResult_script_event_1771006085797'] || typeof flowResults['scriptEventResult_script_event_1771006085797'] === 'undefined') {
      flowResults['scriptEventResult_script_event_1771006085797'] = step6Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
      
      if (flowResults.currentResult !== undefined && 
          flowResults.stepCounter > 5) {
        currentResult = flowResults.currentResult;
      } else {
        currentResult = step6Result;
      }
    } catch (stepError) {
      const stepErrorMessage = stepError instanceof Error ? stepError.message : String(stepError) || 'Unknown step error';
      console.error('❌ Error in step 6 (script-event):', stepError);
      flowErrors.push(`Step 6 (script-event): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step6Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'script-event',
        nodeId: 'script-event-1771006085797',
        stepNumber: 6
      };
      
      currentResult = step6Result; // Update currentResult even on error
      
      // Store error result in enhanced data flow system
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['script-event-1771006085797'] = {
      nodeId: 'script-event-1771006085797',
      nodeType: 'script-event',
      stepNumber: 6,
      displayName: 'scriptEventResult_script_event_1771006085797',
      data: step6Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for script-event
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['scriptEventResult_script_event_1771006085797'] || typeof flowResults['scriptEventResult_script_event_1771006085797'] === 'undefined') {
      flowResults['scriptEventResult_script_event_1771006085797'] = step6Result;
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
      if ('flow_page-load-1770832545541_1771079854809'.includes('button')) {
        // Extract button node information from chain
        const buttonNodes = Object.values(flowResults.nodeResults || {}).filter(
          (result: any) => result.nodeType === 'button'
        );
        
        buttonNodes.forEach((buttonNode: any) => {
          // Store chain ID mapped to button element ID
          if (buttonNode.elementId) {
            (window as any).buttonChainRegistry[buttonNode.elementId] = 'flow_page-load-1770832545541_1771079854809';
            console.log(`🔗 Registered button chain: ${buttonNode.elementId} → flow_page-load-1770832545541_1771079854809`);
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
        detail: { flowResults, chainId: 'flow_page-load-1770832545541_1771079854809' } 
      }));
      (window as any).dispatchEvent(new CustomEvent('flowExecutionCompleted', { 
        detail: { flowResults, chainId: 'flow_page-load-1770832545541_1771079854809' } 
      }));
      console.log("📡 Dispatched workflow completion events");
    }
    
    return {
      success: true,
      results: flowResults,
      errors: flowErrors,
      chainId: 'flow_page-load-1770832545541_1771079854809'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) || 'Unknown error';
    console.error('❌ Flow chain execution error:', error);
    return {
      success: false,
      results: flowResults,
      errors: [...flowErrors, errorMessage],
      chainId: 'flow_page-load-1770832545541_1771079854809'
    };
  }
};







// Register workflow nodes in global registry for cross-workflow node lookups
if (workflowRegistry && workflowRegistry.allNodes) {
  const workflowNodes = [{"id":"google-sheets-trigger-1770831498824","nodeType":"google-sheets-trigger","config":{"eventType":"*","sheetName":"Form Responses 1","filterValue":"","credentialId":"efaf85fb-9ca5-4688-850e-490a6eaf953e","filterColumn":"","spreadsheetId":"1pRqhjnhwTQcb6MqtulODeDAt34f8_fjgkXz39DwQcSg","outputVariable":"sheetTriggerResult"}},{"id":"db-api-post-1770831673235","nodeType":"db-api-post","config":{"url":"/api/form/component-generated-form_vitality_form_338226625-917682082","body":"{\n  \"Age\": \"{{Age}}\",\n  \"City\": \"{{City}}\",\n  \"Name\": \"{{Name}}\",\n  \"Email\": \"{{Email}}\",\n  \"State\": \"{{State}}\",\n  \"Gender\": \"{{Gender}}\",\n  \"Mobile\": \"{{Mobile}}\",\n  \"Address\": \"{{Address}}\",\n  \"Country\": \"{{Country}}\",\n  \"Pincode\": \"{{Pincode}}\",\n  \"Occupation\": \"{{Occupation}}\"\n}","method":"POST","params":[],"apiName":"vitality_form create Database API","headers":[{"key":"Content-Type","value":"application/json"},{"key":"Authorization","value":"Bearer {{auth_token}}"}],"tableId":"vitality_form","dbMethod":"post","endpoint":"/api/form/component-generated-form_vitality_form_338226625-917682082","operation":"create","tableName":"vitality_form","description":"Create vitality_form record(s)","requestBody":"{\n  \"Age\": \"{{Age}}\",\n  \"City\": \"{{City}}\",\n  \"Name\": \"{{Name}}\",\n  \"Email\": \"{{Email}}\",\n  \"State\": \"{{State}}\",\n  \"Gender\": \"{{Gender}}\",\n  \"Mobile\": \"{{Mobile}}\",\n  \"Address\": \"{{Address}}\",\n  \"Country\": \"{{Country}}\",\n  \"Pincode\": \"{{Pincode}}\",\n  \"Occupation\": \"{{Occupation}}\"\n}","isDatabaseApi":true,"authentication":{"type":"bearer"},"resultVariable":"postVitality_formResult","apiResultVariable":"postVitality_formResult"}},{"id":"json-string-parser-1770831703679","nodeType":"json-string-parser","config":{"nodeId":"json-string-parser-1770831703679","nodeType":"json-string-parser","inputSource":"variable","outputFormat":"raw","variableInput":"{{dataFlow.getByNodeId(\"google-sheets-trigger-1770831498824\").rowData.Name}}"}},{"id":"telegram-send-message-1770832326787","nodeType":"Telegram Send Message","config":{"fields":[{"id":"bot_token","name":"Bot Token"},{"id":"chat_id","name":"Chat ID"},{"id":"text","name":"Message Text"},{"id":"parse_mode","name":"Parse Mode"},{"id":"media_type","name":"Media Type"},{"id":"media_url","name":"Media URL"},{"id":"media_caption","name":"Media Caption"}],"inputs":{"Chat ID":"static:","Bot Token":"static:","Media URL":"static:","Media Type":"static:none","Parse Mode":"static:HTML","Message Text":"static:The new patient {{dataFlow.getByNodeId(\"json-string-parser-1770831703679\")}} has been submitted their details successfully.","Media Caption":"static:"},"botToken":"","mediaUrl":"","mediaType":"none","parseMode":"HTML","sendMedia":false,"messageText":"The new patient {{dataFlow.getByNodeId(\"json-string-parser-1770831703679\")}} has been submitted their details successfully.","credentialId":"99bc673e-a01f-4d8d-9922-35efd8378449","mediaCaption":"","credentialName":"Gopinath_Telegramsend","selectedMethod":"telegram_send_message"}},{"id":"openaiAgentSDKNode-1770832397803","nodeType":"openaiAgentSDKNode","config":{"type":"openaiAgentSDKNode","label":"OpenAI Agent","model":"gpt-4.1-2025-04-14","tools":[],"apiKey":"","userId":"","agentId":"","nodeType":"openaiAgentSDK","noteText":"","sessionId":"","isAgentSDK":true,"max_tokens":1000,"memoryType":"simple","description":"OpenAI Agent application","mcp_servers":[{"id":"custom_mcp_1770832474051","url":"https://supabase-crud.simplita.ai/mcp","name":"crud supabase","enabled":true,"description":"Custom MCP Server"},{"id":"custom_mcp_1770832487339","url":"https://sendgoogleform-hcyuev.mcp.simplita.app/mcp","name":"send form","enabled":true,"description":"Custom MCP Server"}],"querySource":"","temperature":0.7,"user_prompt":"{{sheetTriggerResult.Name}}","agentSDKType":"orchestrator","credentialId":"","enableMemory":false,"handoff_mode":"transfer_control","instructions":"You are an agent.\nYou will receive the output from the JSON String Parser, which contains the field name.\n\nYour Task\n\nUse the received name to fetch the corresponding phonenumber from the Supabase database using the CRUD Supabase MCP Tool.\n\nDatabase Table: crudsupabase\n\nOnce the phonenumber is retrieved, send a reply message to that number with the following text:\n\n\"Thank you for providing your details. We have successfully received it. Our Team will connect you soon\"\n\nExpected Outcome\n\nThe correct phonenumber is successfully retrieved from Supabase using the provided name.\n\nA confirmation message is sent to that phone number confirming successful form submission.You are an agent.\nYou will receive the output from the JSON String Parser, which contains the field name.\n\nYour Task\n\nUse the received name to fetch the corresponding phonenumber from the Supabase database using the CRUD Supabase MCP Tool.\n\nDatabase Table: crudsupabase\n\nOnce the phonenumber is retrieved, send a reply message to that number with the following text:\n\n\"Your form details have been submitted successfully.\"\n\nExpected Outcome\n\nThe correct phonenumber is successfully retrieved from Supabase using the provided name.\n\nA confirmation message is sent to that phone number confirming successful form submission.","tool_configs":{},"queryVariable":"","tool_settings":{"tool_timeout_ms":300,"error_handling_mode":"graceful","enable_parallel_execution":false,"max_tool_calls_per_request":5},"variableInput":"","openai_api_key":"process.env.OPENAI_API_KEY","resultVariable":"sdkResult","selected_tools":[],"handoff_enabled":false,"handoff_targets":[],"memoryTableName":"agent_interactions","selectedDataSources":[],"useStoredCredential":false,"auto_handoff_enabled":false,"isAgentSDKOrchestrator":false}},{"id":"page-load-1770832545541","nodeType":"page-load","config":{"pageId":"page-17702826114826988","pageUrl":"/form-submission","loadType":"full"}},{"id":"db-api-get-1770832554240","nodeType":"db-api-get","config":{"url":"/api/form/component-generated-form_vitality_form_338226625-917682082","body":"","method":"GET","params":[],"apiName":"vitality_form read-all Database API","headers":[{"key":"Content-Type","value":"application/json"},{"key":"Authorization","value":"Bearer {{auth_token}}"}],"tableId":"vitality_form","dbMethod":"get","endpoint":"/api/form/component-generated-form_vitality_form_338226625-917682082","operation":"read-all","tableName":"vitality_form","description":"Get all vitality_form records","requestBody":"","isDatabaseApi":true,"authentication":{"type":"bearer"},"resultVariable":"getVitality_formResult","apiResultVariable":"getVitality_formResult"}},{"id":"script-event-1771006028992","nodeType":"script-event","config":{"pageId":"page-17702826114826988","scriptId":"9c50f7fb-b373-42a8-b13d-d80d598eea51","elementId":"component-1771005580992-8438","eventType":"onLoad","scriptKey":"page-17702826114826988::component-1771005580992-8438::onLoad::9c50f7fb-b373-42a8-b13d-d80d598eea51","scriptName":"formsubmissionvitality","actionValue":"delete","componentId":"component-1771005580992-8438","inputVariables":[{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}],"outputVariables":[{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"selectedSubmission","type":"object","source":"custom","description":"Output variable: selectedSubmission"},{"name":"selectedSubmissions","type":"object","source":"custom","description":"Output variable: selectedSubmissions"},{"name":"totalCount","type":"object","source":"custom","description":"Output variable: totalCount"},{"name":"filteredCount","type":"object","source":"custom","description":"Output variable: filteredCount"},{"name":"searchTerm","type":"object","source":"custom","description":"Output variable: searchTerm"},{"name":"getInputData('response')","type":"object","source":"custom","description":"Variable: getInputData('response')"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"},{"name":"sub.status","type":"object","source":"custom","description":"Variable: sub.status"},{"name":"'Status'","type":"object","source":"custom","description":"Variable: 'Status'"}],"inputVariableMappings":{"innerHTML":"{{getVitality_formResult}}"}}},{"id":"script-event-1771006052608","nodeType":"script-event","config":{"pageId":"page-17702826114826988","scriptId":"9c50f7fb-b373-42a8-b13d-d80d598eea51","elementId":"component-1771005580992-8438","eventType":"onLoad","scriptKey":"page-17702826114826988::component-1771005580992-8438::onLoad::9c50f7fb-b373-42a8-b13d-d80d598eea51","scriptName":"formsubmissionvitality","actionValue":"select","componentId":"component-1771005580992-8438","inputVariables":[{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}],"outputVariables":[{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"selectedSubmission","type":"object","source":"custom","description":"Output variable: selectedSubmission"},{"name":"selectedSubmissions","type":"object","source":"custom","description":"Output variable: selectedSubmissions"},{"name":"totalCount","type":"object","source":"custom","description":"Output variable: totalCount"},{"name":"filteredCount","type":"object","source":"custom","description":"Output variable: filteredCount"},{"name":"searchTerm","type":"object","source":"custom","description":"Output variable: searchTerm"},{"name":"getInputData('response')","type":"object","source":"custom","description":"Variable: getInputData('response')"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"},{"name":"sub.status","type":"object","source":"custom","description":"Variable: sub.status"},{"name":"'Status'","type":"object","source":"custom","description":"Variable: 'Status'"}],"inputVariableMappings":{"innerHTML":"{{getVitality_formResult}}"}}},{"id":"script-event-1771006060937","nodeType":"script-event","config":{"pageId":"page-17702826114826988","scriptId":"9c50f7fb-b373-42a8-b13d-d80d598eea51","elementId":"component-1771005580992-8438","eventType":"onLoad","scriptKey":"page-17702826114826988::component-1771005580992-8438::onLoad::9c50f7fb-b373-42a8-b13d-d80d598eea51","scriptName":"formsubmissionvitality","actionValue":"search","componentId":"component-1771005580992-8438","inputVariables":[{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}],"outputVariables":[{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"selectedSubmission","type":"object","source":"custom","description":"Output variable: selectedSubmission"},{"name":"selectedSubmissions","type":"object","source":"custom","description":"Output variable: selectedSubmissions"},{"name":"totalCount","type":"object","source":"custom","description":"Output variable: totalCount"},{"name":"filteredCount","type":"object","source":"custom","description":"Output variable: filteredCount"},{"name":"searchTerm","type":"object","source":"custom","description":"Output variable: searchTerm"},{"name":"getInputData('response')","type":"object","source":"custom","description":"Variable: getInputData('response')"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"},{"name":"sub.status","type":"object","source":"custom","description":"Variable: sub.status"},{"name":"'Status'","type":"object","source":"custom","description":"Variable: 'Status'"}],"inputVariableMappings":{"innerHTML":"{{getVitality_formResult}}"}}},{"id":"script-event-1771006085797","nodeType":"script-event","config":{"pageId":"page-17702826114826988","scriptId":"9c50f7fb-b373-42a8-b13d-d80d598eea51","elementId":"component-1771005580992-8438","eventType":"onLoad","scriptKey":"page-17702826114826988::component-1771005580992-8438::onLoad::9c50f7fb-b373-42a8-b13d-d80d598eea51","scriptName":"formsubmissionvitality","actionValue":"export","componentId":"component-1771005580992-8438","inputVariables":[{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}],"outputVariables":[{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"selectedSubmission","type":"object","source":"custom","description":"Output variable: selectedSubmission"},{"name":"selectedSubmissions","type":"object","source":"custom","description":"Output variable: selectedSubmissions"},{"name":"totalCount","type":"object","source":"custom","description":"Output variable: totalCount"},{"name":"filteredCount","type":"object","source":"custom","description":"Output variable: filteredCount"},{"name":"searchTerm","type":"object","source":"custom","description":"Output variable: searchTerm"},{"name":"getInputData('response')","type":"object","source":"custom","description":"Variable: getInputData('response')"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"},{"name":"sub.status","type":"object","source":"custom","description":"Variable: sub.status"},{"name":"'Status'","type":"object","source":"custom","description":"Variable: 'Status'"}],"inputVariableMappings":{"innerHTML":"{{getVitality_formResult}}"}}}];
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
  
  
  // Execute flow_google-sheets-trigger-1770831498824_1771079854809
  if (!specificChainId || specificChainId === 'flow_google-sheets-trigger-1770831498824_1771079854809') {
    
    // ✅ CRITICAL FIX: This is a webhook-triggered workflow (google-sheets-trigger)
    // It should ONLY execute when triggered by its specific webhook, NOT on page load
    if (triggerData && triggerData.trigger === 'page-load') {
      results['flow_google-sheets-trigger-1770831498824_1771079854809'] = { 
        success: false, 
        skipped: true, 
        reason: 'Webhook workflow should not run on page load',
        chainId: 'flow_google-sheets-trigger-1770831498824_1771079854809',
        webhookType: 'google-sheets-trigger',
        actualTrigger: triggerData.trigger
      };
      // Don't return here, just skip to next workflow
    } else {
      // Proceed with webhook workflow execution
      try {
        const result_flow_google_sheets_trigger_1770831498824_1771079854809 = await executeFlowChain_flow_google_sheets_trigger_1770831498824_1771079854809(triggerData);
        results['flow_google-sheets-trigger-1770831498824_1771079854809'] = result_flow_google_sheets_trigger_1770831498824_1771079854809;
        
        if (!result_flow_google_sheets_trigger_1770831498824_1771079854809.success) {
          console.error('❌ Chain flow_google-sheets-trigger-1770831498824_1771079854809 failed:', result_flow_google_sheets_trigger_1770831498824_1771079854809.errors);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error) || 'Unknown error';
        console.error('💥 Error executing flow flow_google-sheets-trigger-1770831498824_1771079854809:', error);
        results['flow_google-sheets-trigger-1770831498824_1771079854809'] = { success: false, error: errorMessage, chainId: 'flow_google-sheets-trigger-1770831498824_1771079854809', results: {}, errors: [errorMessage] };
      }
    }
  }

  // Execute flow_page-load-1770832545541_1771079854809
  if (!specificChainId || specificChainId === 'flow_page-load-1770832545541_1771079854809') {
    
    // This is a page-load chain for page: /form-submission
    if (triggerData && (triggerData.trigger === 'page-load' || triggerData.trigger === 'page-load-retry')) {
      // Get the current page path
      const currentPath = triggerData.pageId || (typeof window !== 'undefined' ? (window as any).location.pathname : '/');
      
      // Check if this page-load chain should run on this page
      
      // Normalize paths for comparison
      const normalizedConfigUrl = '/form-submission'.replace(/\/$/, '');
      const normalizedCurrentPath = currentPath.replace(/\/$/, '');
      
      // Skip if paths don't match
      if (normalizedConfigUrl !== normalizedCurrentPath) {
        results['flow_page-load-1770832545541_1771079854809'] = { 
          success: false, 
          skipped: true, 
          reason: 'Page URL mismatch', 
          chainId: 'flow_page-load-1770832545541_1771079854809',
          configuredUrl: '/form-submission',
          currentPath
        };
        return;
      }
      
      // ✅ Execute the page-load workflow after URL validation passes
      try {
        const result_flow_page_load_1770832545541_1771079854809 = await executeFlowChain_flow_page_load_1770832545541_1771079854809(triggerData);
        results['flow_page-load-1770832545541_1771079854809'] = result_flow_page_load_1770832545541_1771079854809;
        
        if (!result_flow_page_load_1770832545541_1771079854809.success) {
          console.error('❌ Chain flow_page-load-1770832545541_1771079854809 failed:', result_flow_page_load_1770832545541_1771079854809.errors);
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error) || 'Unknown error';
        console.error('💥 Error executing flow flow_page-load-1770832545541_1771079854809:', error);
        results['flow_page-load-1770832545541_1771079854809'] = { success: false, error: errorMessage, chainId: 'flow_page-load-1770832545541_1771079854809', results: {}, errors: [errorMessage] };
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
    totalChains: 2,
    successfulChains: Object.values(results).filter((r: any) => r.success).length
  };
};

const getFlowChainInfo = (): any[] => {
  return [
  {
    "id": "flow_google-sheets-trigger-1770831498824_1771079854809",
    "nodeTypes": [
      "google-sheets-trigger",
      "db-api-post",
      "json-string-parser",
      "Telegram Send Message",
      "openaiAgentSDKNode"
    ],
    "nodeCount": 5,
    "chainType": "linear",
    "startNode": {
      "id": "google-sheets-trigger-1770831498824",
      "nodeType": "google-sheets-trigger",
      "config": {
        "eventType": "*",
        "sheetName": "Form Responses 1",
        "filterValue": "",
        "credentialId": "efaf85fb-9ca5-4688-850e-490a6eaf953e",
        "filterColumn": "",
        "spreadsheetId": "1pRqhjnhwTQcb6MqtulODeDAt34f8_fjgkXz39DwQcSg",
        "outputVariable": "sheetTriggerResult"
      }
    },
    "endNode": {
      "id": "openaiAgentSDKNode-1770832397803",
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
            "id": "custom_mcp_1770832474051",
            "url": "https://supabase-crud.simplita.ai/mcp",
            "name": "crud supabase",
            "enabled": true,
            "description": "Custom MCP Server"
          },
          {
            "id": "custom_mcp_1770832487339",
            "url": "https://sendgoogleform-hcyuev.mcp.simplita.app/mcp",
            "name": "send form",
            "enabled": true,
            "description": "Custom MCP Server"
          }
        ],
        "querySource": "",
        "temperature": 0.7,
        "user_prompt": "{{sheetTriggerResult.Name}}",
        "agentSDKType": "orchestrator",
        "enableMemory": false,
        "handoff_mode": "transfer_control",
        "instructions": "You are an agent.\nYou will receive the output from the JSON String Parser, which contains the field name.\n\nYour Task\n\nUse the received name to fetch the corresponding phonenumber from the Supabase database using the CRUD Supabase MCP Tool.\n\nDatabase Table: crudsupabase\n\nOnce the phonenumber is retrieved, send a reply message to that number with the following text:\n\n\"Thank you for providing your details. We have successfully received it. Our Team will connect you soon\"\n\nExpected Outcome\n\nThe correct phonenumber is successfully retrieved from Supabase using the provided name.\n\nA confirmation message is sent to that phone number confirming successful form submission.You are an agent.\nYou will receive the output from the JSON String Parser, which contains the field name.\n\nYour Task\n\nUse the received name to fetch the corresponding phonenumber from the Supabase database using the CRUD Supabase MCP Tool.\n\nDatabase Table: crudsupabase\n\nOnce the phonenumber is retrieved, send a reply message to that number with the following text:\n\n\"Your form details have been submitted successfully.\"\n\nExpected Outcome\n\nThe correct phonenumber is successfully retrieved from Supabase using the provided name.\n\nA confirmation message is sent to that phone number confirming successful form submission.",
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
        "handoff_enabled": false,
        "handoff_targets": [],
        "memoryTableName": "agent_interactions",
        "selectedDataSources": [],
        "auto_handoff_enabled": false,
        "isAgentSDKOrchestrator": false
      }
    },
    "nodes": [
      {
        "id": "google-sheets-trigger-1770831498824",
        "nodeType": "google-sheets-trigger",
        "config": {
          "eventType": "*",
          "sheetName": "Form Responses 1",
          "filterValue": "",
          "credentialId": "efaf85fb-9ca5-4688-850e-490a6eaf953e",
          "filterColumn": "",
          "spreadsheetId": "1pRqhjnhwTQcb6MqtulODeDAt34f8_fjgkXz39DwQcSg",
          "outputVariable": "sheetTriggerResult"
        }
      },
      {
        "id": "db-api-post-1770831673235",
        "nodeType": "db-api-post",
        "config": {
          "url": "/api/form/component-generated-form_vitality_form_338226625-917682082",
          "body": "{\n  \"Age\": \"{{Age}}\",\n  \"City\": \"{{City}}\",\n  \"Name\": \"{{Name}}\",\n  \"Email\": \"{{Email}}\",\n  \"State\": \"{{State}}\",\n  \"Gender\": \"{{Gender}}\",\n  \"Mobile\": \"{{Mobile}}\",\n  \"Address\": \"{{Address}}\",\n  \"Country\": \"{{Country}}\",\n  \"Pincode\": \"{{Pincode}}\",\n  \"Occupation\": \"{{Occupation}}\"\n}",
          "method": "POST",
          "params": [],
          "apiName": "vitality_form create Database API",
          "headers": [
            {
              "key": "Content-Type",
              "value": "application/json"
            },
            {
              "key": "Authorization",
              "value": "Bearer {{auth_token}}"
            }
          ],
          "tableId": "vitality_form",
          "dbMethod": "post",
          "endpoint": "/api/form/component-generated-form_vitality_form_338226625-917682082",
          "operation": "create",
          "tableName": "vitality_form",
          "description": "Create vitality_form record(s)",
          "requestBody": "{\n  \"Age\": \"{{Age}}\",\n  \"City\": \"{{City}}\",\n  \"Name\": \"{{Name}}\",\n  \"Email\": \"{{Email}}\",\n  \"State\": \"{{State}}\",\n  \"Gender\": \"{{Gender}}\",\n  \"Mobile\": \"{{Mobile}}\",\n  \"Address\": \"{{Address}}\",\n  \"Country\": \"{{Country}}\",\n  \"Pincode\": \"{{Pincode}}\",\n  \"Occupation\": \"{{Occupation}}\"\n}",
          "isDatabaseApi": true,
          "authentication": {
            "type": "bearer"
          },
          "resultVariable": "postVitality_formResult",
          "apiResultVariable": "postVitality_formResult"
        }
      },
      {
        "id": "json-string-parser-1770831703679",
        "nodeType": "json-string-parser",
        "config": {
          "nodeId": "json-string-parser-1770831703679",
          "nodeType": "json-string-parser",
          "inputSource": "variable",
          "outputFormat": "raw",
          "variableInput": "{{dataFlow.getByNodeId(\"google-sheets-trigger-1770831498824\").rowData.Name}}"
        }
      },
      {
        "id": "telegram-send-message-1770832326787",
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
            "Chat ID": "static:",
            "Bot Token": "static:",
            "Media URL": "static:",
            "Media Type": "static:none",
            "Parse Mode": "static:HTML",
            "Message Text": "static:The new patient {{dataFlow.getByNodeId(\"json-string-parser-1770831703679\")}} has been submitted their details successfully.",
            "Media Caption": "static:"
          },
          "botToken": "",
          "mediaUrl": "",
          "mediaType": "none",
          "parseMode": "HTML",
          "sendMedia": false,
          "messageText": "The new patient {{dataFlow.getByNodeId(\"json-string-parser-1770831703679\")}} has been submitted their details successfully.",
          "credentialId": "99bc673e-a01f-4d8d-9922-35efd8378449",
          "mediaCaption": "",
          "credentialName": "Gopinath_Telegramsend",
          "selectedMethod": "telegram_send_message"
        }
      },
      {
        "id": "openaiAgentSDKNode-1770832397803",
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
              "id": "custom_mcp_1770832474051",
              "url": "https://supabase-crud.simplita.ai/mcp",
              "name": "crud supabase",
              "enabled": true,
              "description": "Custom MCP Server"
            },
            {
              "id": "custom_mcp_1770832487339",
              "url": "https://sendgoogleform-hcyuev.mcp.simplita.app/mcp",
              "name": "send form",
              "enabled": true,
              "description": "Custom MCP Server"
            }
          ],
          "querySource": "",
          "temperature": 0.7,
          "user_prompt": "{{sheetTriggerResult.Name}}",
          "agentSDKType": "orchestrator",
          "enableMemory": false,
          "handoff_mode": "transfer_control",
          "instructions": "You are an agent.\nYou will receive the output from the JSON String Parser, which contains the field name.\n\nYour Task\n\nUse the received name to fetch the corresponding phonenumber from the Supabase database using the CRUD Supabase MCP Tool.\n\nDatabase Table: crudsupabase\n\nOnce the phonenumber is retrieved, send a reply message to that number with the following text:\n\n\"Thank you for providing your details. We have successfully received it. Our Team will connect you soon\"\n\nExpected Outcome\n\nThe correct phonenumber is successfully retrieved from Supabase using the provided name.\n\nA confirmation message is sent to that phone number confirming successful form submission.You are an agent.\nYou will receive the output from the JSON String Parser, which contains the field name.\n\nYour Task\n\nUse the received name to fetch the corresponding phonenumber from the Supabase database using the CRUD Supabase MCP Tool.\n\nDatabase Table: crudsupabase\n\nOnce the phonenumber is retrieved, send a reply message to that number with the following text:\n\n\"Your form details have been submitted successfully.\"\n\nExpected Outcome\n\nThe correct phonenumber is successfully retrieved from Supabase using the provided name.\n\nA confirmation message is sent to that phone number confirming successful form submission.",
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
          "handoff_enabled": false,
          "handoff_targets": [],
          "memoryTableName": "agent_interactions",
          "selectedDataSources": [],
          "auto_handoff_enabled": false,
          "isAgentSDKOrchestrator": false
        }
      }
    ]
  },
  {
    "id": "flow_page-load-1770832545541_1771079854809",
    "nodeTypes": [
      "page-load",
      "db-api-get",
      "script-event",
      "script-event",
      "script-event",
      "script-event"
    ],
    "nodeCount": 6,
    "chainType": "linear",
    "startNode": {
      "id": "page-load-1770832545541",
      "nodeType": "page-load",
      "config": {
        "pageId": "page-17702826114826988",
        "pageUrl": "/form-submission",
        "loadType": "full"
      }
    },
    "endNode": {
      "id": "script-event-1771006085797",
      "nodeType": "script-event",
      "config": {
        "pageId": "page-17702826114826988",
        "scriptId": "9c50f7fb-b373-42a8-b13d-d80d598eea51",
        "elementId": "component-1771005580992-8438",
        "eventType": "onLoad",
        "scriptKey": "page-17702826114826988::component-1771005580992-8438::onLoad::9c50f7fb-b373-42a8-b13d-d80d598eea51",
        "scriptName": "formsubmissionvitality",
        "actionValue": "export",
        "componentId": "component-1771005580992-8438",
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
            "name": "selectedSubmission",
            "type": "object",
            "source": "custom",
            "description": "Output variable: selectedSubmission"
          },
          {
            "name": "selectedSubmissions",
            "type": "object",
            "source": "custom",
            "description": "Output variable: selectedSubmissions"
          },
          {
            "name": "totalCount",
            "type": "object",
            "source": "custom",
            "description": "Output variable: totalCount"
          },
          {
            "name": "filteredCount",
            "type": "object",
            "source": "custom",
            "description": "Output variable: filteredCount"
          },
          {
            "name": "searchTerm",
            "type": "object",
            "source": "custom",
            "description": "Output variable: searchTerm"
          },
          {
            "name": "getInputData('response')",
            "type": "object",
            "source": "custom",
            "description": "Variable: getInputData('response')"
          },
          {
            "name": "'response'",
            "type": "object",
            "source": "custom",
            "description": "Variable: 'response'"
          },
          {
            "name": "sub.status",
            "type": "object",
            "source": "custom",
            "description": "Variable: sub.status"
          },
          {
            "name": "'Status'",
            "type": "object",
            "source": "custom",
            "description": "Variable: 'Status'"
          }
        ],
        "inputVariableMappings": {
          "innerHTML": "{{getVitality_formResult}}"
        }
      }
    },
    "nodes": [
      {
        "id": "page-load-1770832545541",
        "nodeType": "page-load",
        "config": {
          "pageId": "page-17702826114826988",
          "pageUrl": "/form-submission",
          "loadType": "full"
        }
      },
      {
        "id": "db-api-get-1770832554240",
        "nodeType": "db-api-get",
        "config": {
          "url": "/api/form/component-generated-form_vitality_form_338226625-917682082",
          "body": "",
          "method": "GET",
          "params": [],
          "apiName": "vitality_form read-all Database API",
          "headers": [
            {
              "key": "Content-Type",
              "value": "application/json"
            },
            {
              "key": "Authorization",
              "value": "Bearer {{auth_token}}"
            }
          ],
          "tableId": "vitality_form",
          "dbMethod": "get",
          "endpoint": "/api/form/component-generated-form_vitality_form_338226625-917682082",
          "operation": "read-all",
          "tableName": "vitality_form",
          "description": "Get all vitality_form records",
          "requestBody": "",
          "isDatabaseApi": true,
          "authentication": {
            "type": "bearer"
          },
          "resultVariable": "getVitality_formResult",
          "apiResultVariable": "getVitality_formResult"
        }
      },
      {
        "id": "script-event-1771006028992",
        "nodeType": "script-event",
        "config": {
          "pageId": "page-17702826114826988",
          "scriptId": "9c50f7fb-b373-42a8-b13d-d80d598eea51",
          "elementId": "component-1771005580992-8438",
          "eventType": "onLoad",
          "scriptKey": "page-17702826114826988::component-1771005580992-8438::onLoad::9c50f7fb-b373-42a8-b13d-d80d598eea51",
          "scriptName": "formsubmissionvitality",
          "actionValue": "delete",
          "componentId": "component-1771005580992-8438",
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
              "name": "selectedSubmission",
              "type": "object",
              "source": "custom",
              "description": "Output variable: selectedSubmission"
            },
            {
              "name": "selectedSubmissions",
              "type": "object",
              "source": "custom",
              "description": "Output variable: selectedSubmissions"
            },
            {
              "name": "totalCount",
              "type": "object",
              "source": "custom",
              "description": "Output variable: totalCount"
            },
            {
              "name": "filteredCount",
              "type": "object",
              "source": "custom",
              "description": "Output variable: filteredCount"
            },
            {
              "name": "searchTerm",
              "type": "object",
              "source": "custom",
              "description": "Output variable: searchTerm"
            },
            {
              "name": "getInputData('response')",
              "type": "object",
              "source": "custom",
              "description": "Variable: getInputData('response')"
            },
            {
              "name": "'response'",
              "type": "object",
              "source": "custom",
              "description": "Variable: 'response'"
            },
            {
              "name": "sub.status",
              "type": "object",
              "source": "custom",
              "description": "Variable: sub.status"
            },
            {
              "name": "'Status'",
              "type": "object",
              "source": "custom",
              "description": "Variable: 'Status'"
            }
          ],
          "inputVariableMappings": {
            "innerHTML": "{{getVitality_formResult}}"
          }
        }
      },
      {
        "id": "script-event-1771006052608",
        "nodeType": "script-event",
        "config": {
          "pageId": "page-17702826114826988",
          "scriptId": "9c50f7fb-b373-42a8-b13d-d80d598eea51",
          "elementId": "component-1771005580992-8438",
          "eventType": "onLoad",
          "scriptKey": "page-17702826114826988::component-1771005580992-8438::onLoad::9c50f7fb-b373-42a8-b13d-d80d598eea51",
          "scriptName": "formsubmissionvitality",
          "actionValue": "select",
          "componentId": "component-1771005580992-8438",
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
              "name": "selectedSubmission",
              "type": "object",
              "source": "custom",
              "description": "Output variable: selectedSubmission"
            },
            {
              "name": "selectedSubmissions",
              "type": "object",
              "source": "custom",
              "description": "Output variable: selectedSubmissions"
            },
            {
              "name": "totalCount",
              "type": "object",
              "source": "custom",
              "description": "Output variable: totalCount"
            },
            {
              "name": "filteredCount",
              "type": "object",
              "source": "custom",
              "description": "Output variable: filteredCount"
            },
            {
              "name": "searchTerm",
              "type": "object",
              "source": "custom",
              "description": "Output variable: searchTerm"
            },
            {
              "name": "getInputData('response')",
              "type": "object",
              "source": "custom",
              "description": "Variable: getInputData('response')"
            },
            {
              "name": "'response'",
              "type": "object",
              "source": "custom",
              "description": "Variable: 'response'"
            },
            {
              "name": "sub.status",
              "type": "object",
              "source": "custom",
              "description": "Variable: sub.status"
            },
            {
              "name": "'Status'",
              "type": "object",
              "source": "custom",
              "description": "Variable: 'Status'"
            }
          ],
          "inputVariableMappings": {
            "innerHTML": "{{getVitality_formResult}}"
          }
        }
      },
      {
        "id": "script-event-1771006060937",
        "nodeType": "script-event",
        "config": {
          "pageId": "page-17702826114826988",
          "scriptId": "9c50f7fb-b373-42a8-b13d-d80d598eea51",
          "elementId": "component-1771005580992-8438",
          "eventType": "onLoad",
          "scriptKey": "page-17702826114826988::component-1771005580992-8438::onLoad::9c50f7fb-b373-42a8-b13d-d80d598eea51",
          "scriptName": "formsubmissionvitality",
          "actionValue": "search",
          "componentId": "component-1771005580992-8438",
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
              "name": "selectedSubmission",
              "type": "object",
              "source": "custom",
              "description": "Output variable: selectedSubmission"
            },
            {
              "name": "selectedSubmissions",
              "type": "object",
              "source": "custom",
              "description": "Output variable: selectedSubmissions"
            },
            {
              "name": "totalCount",
              "type": "object",
              "source": "custom",
              "description": "Output variable: totalCount"
            },
            {
              "name": "filteredCount",
              "type": "object",
              "source": "custom",
              "description": "Output variable: filteredCount"
            },
            {
              "name": "searchTerm",
              "type": "object",
              "source": "custom",
              "description": "Output variable: searchTerm"
            },
            {
              "name": "getInputData('response')",
              "type": "object",
              "source": "custom",
              "description": "Variable: getInputData('response')"
            },
            {
              "name": "'response'",
              "type": "object",
              "source": "custom",
              "description": "Variable: 'response'"
            },
            {
              "name": "sub.status",
              "type": "object",
              "source": "custom",
              "description": "Variable: sub.status"
            },
            {
              "name": "'Status'",
              "type": "object",
              "source": "custom",
              "description": "Variable: 'Status'"
            }
          ],
          "inputVariableMappings": {
            "innerHTML": "{{getVitality_formResult}}"
          }
        }
      },
      {
        "id": "script-event-1771006085797",
        "nodeType": "script-event",
        "config": {
          "pageId": "page-17702826114826988",
          "scriptId": "9c50f7fb-b373-42a8-b13d-d80d598eea51",
          "elementId": "component-1771005580992-8438",
          "eventType": "onLoad",
          "scriptKey": "page-17702826114826988::component-1771005580992-8438::onLoad::9c50f7fb-b373-42a8-b13d-d80d598eea51",
          "scriptName": "formsubmissionvitality",
          "actionValue": "export",
          "componentId": "component-1771005580992-8438",
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
              "name": "selectedSubmission",
              "type": "object",
              "source": "custom",
              "description": "Output variable: selectedSubmission"
            },
            {
              "name": "selectedSubmissions",
              "type": "object",
              "source": "custom",
              "description": "Output variable: selectedSubmissions"
            },
            {
              "name": "totalCount",
              "type": "object",
              "source": "custom",
              "description": "Output variable: totalCount"
            },
            {
              "name": "filteredCount",
              "type": "object",
              "source": "custom",
              "description": "Output variable: filteredCount"
            },
            {
              "name": "searchTerm",
              "type": "object",
              "source": "custom",
              "description": "Output variable: searchTerm"
            },
            {
              "name": "getInputData('response')",
              "type": "object",
              "source": "custom",
              "description": "Variable: getInputData('response')"
            },
            {
              "name": "'response'",
              "type": "object",
              "source": "custom",
              "description": "Variable: 'response'"
            },
            {
              "name": "sub.status",
              "type": "object",
              "source": "custom",
              "description": "Variable: sub.status"
            },
            {
              "name": "'Status'",
              "type": "object",
              "source": "custom",
              "description": "Variable: 'Status'"
            }
          ],
          "inputVariableMappings": {
            "innerHTML": "{{getVitality_formResult}}"
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

