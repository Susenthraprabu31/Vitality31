
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






const executeFlowChain_flow_script_event_1771077760003_1771079854883 = async (initialData: any = {}): Promise<FlowResult> => {
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
  
  flowResults._executionId = `flow_script_event_1771077760003_1771079854883_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
    flowResults.originalChainData = {"id":"flow_script-event-1771077760003_1771079854883","nodes":[{"id":"script-event-1771077760003","nodeType":"script-event","config":{"pageId":"page-17710071952151647","scriptId":"e4c81360-59ca-4d22-9dee-d9d62f7f95e4","elementId":"component-1771007210712-8027","eventType":"onLoad","scriptKey":"page-17710071952151647::component-1771007210712-8027::onLoad::e4c81360-59ca-4d22-9dee-d9d62f7f95e4","scriptName":"dashboardout","actionValue":"","componentId":"component-1771007210712-8027","inputVariables":[{"name":"dashboardData","type":"object from http request","source":"custom","description":"Input variable: dashboardData"}],"outputVariables":[],"inputVariableMappings":{"dashboardData":"{{httpResult}}"}}}],"edges":[{"source":"http-1770709018092","target":"script-event-1771077760003"},{"source":"button-1771079809740","target":"http-1770709018092"}],"chainType":"linear","dataFlow":[],"startNode":{"id":"script-event-1771077760003","nodeType":"script-event","config":{"pageId":"page-17710071952151647","scriptId":"e4c81360-59ca-4d22-9dee-d9d62f7f95e4","elementId":"component-1771007210712-8027","eventType":"onLoad","scriptKey":"page-17710071952151647::component-1771007210712-8027::onLoad::e4c81360-59ca-4d22-9dee-d9d62f7f95e4","scriptName":"dashboardout","actionValue":"","componentId":"component-1771007210712-8027","inputVariables":[{"name":"dashboardData","type":"object from http request","source":"custom","description":"Input variable: dashboardData"}],"outputVariables":[],"inputVariableMappings":{"dashboardData":"{{httpResult}}"}}},"endNode":{"id":"script-event-1771077760003","nodeType":"script-event","config":{"pageId":"page-17710071952151647","scriptId":"e4c81360-59ca-4d22-9dee-d9d62f7f95e4","elementId":"component-1771007210712-8027","eventType":"onLoad","scriptKey":"page-17710071952151647::component-1771007210712-8027::onLoad::e4c81360-59ca-4d22-9dee-d9d62f7f95e4","scriptName":"dashboardout","actionValue":"","componentId":"component-1771007210712-8027","inputVariables":[{"name":"dashboardData","type":"object from http request","source":"custom","description":"Input variable: dashboardData"}],"outputVariables":[],"inputVariableMappings":{"dashboardData":"{{httpResult}}"}}}};

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
    flowResults.originalChainData = {"id":"flow_script-event-1771077760003_1771079854883","nodes":[{"id":"script-event-1771077760003","nodeType":"script-event","config":{"pageId":"page-17710071952151647","scriptId":"e4c81360-59ca-4d22-9dee-d9d62f7f95e4","elementId":"component-1771007210712-8027","eventType":"onLoad","scriptKey":"page-17710071952151647::component-1771007210712-8027::onLoad::e4c81360-59ca-4d22-9dee-d9d62f7f95e4","scriptName":"dashboardout","actionValue":"","componentId":"component-1771007210712-8027","inputVariables":[{"name":"dashboardData","type":"object from http request","source":"custom","description":"Input variable: dashboardData"}],"outputVariables":[],"inputVariableMappings":{"dashboardData":"{{httpResult}}"}}}],"edges":[{"source":"http-1770709018092","target":"script-event-1771077760003"},{"source":"button-1771079809740","target":"http-1770709018092"}],"chainType":"linear","dataFlow":[],"startNode":{"id":"script-event-1771077760003","nodeType":"script-event","config":{"pageId":"page-17710071952151647","scriptId":"e4c81360-59ca-4d22-9dee-d9d62f7f95e4","elementId":"component-1771007210712-8027","eventType":"onLoad","scriptKey":"page-17710071952151647::component-1771007210712-8027::onLoad::e4c81360-59ca-4d22-9dee-d9d62f7f95e4","scriptName":"dashboardout","actionValue":"","componentId":"component-1771007210712-8027","inputVariables":[{"name":"dashboardData","type":"object from http request","source":"custom","description":"Input variable: dashboardData"}],"outputVariables":[],"inputVariableMappings":{"dashboardData":"{{httpResult}}"}}},"endNode":{"id":"script-event-1771077760003","nodeType":"script-event","config":{"pageId":"page-17710071952151647","scriptId":"e4c81360-59ca-4d22-9dee-d9d62f7f95e4","elementId":"component-1771007210712-8027","eventType":"onLoad","scriptKey":"page-17710071952151647::component-1771007210712-8027::onLoad::e4c81360-59ca-4d22-9dee-d9d62f7f95e4","scriptName":"dashboardout","actionValue":"","componentId":"component-1771007210712-8027","inputVariables":[{"name":"dashboardData","type":"object from http request","source":"custom","description":"Input variable: dashboardData"}],"outputVariables":[],"inputVariableMappings":{"dashboardData":"{{httpResult}}"}}}};
    
    if (typeof window !== 'undefined') {
      // SECURITY: Store SANITIZED workflow nodes in window context (remove API keys)
      // Sanitize each node individually to ensure all sensitive data is removed
      const sanitizedNodes = [{"id":"script-event-1771077760003","nodeType":"script-event","config":{"pageId":"page-17710071952151647","scriptId":"e4c81360-59ca-4d22-9dee-d9d62f7f95e4","elementId":"component-1771007210712-8027","eventType":"onLoad","scriptKey":"page-17710071952151647::component-1771007210712-8027::onLoad::e4c81360-59ca-4d22-9dee-d9d62f7f95e4","scriptName":"dashboardout","actionValue":"","componentId":"component-1771007210712-8027","inputVariables":[{"name":"dashboardData","type":"object from http request","source":"custom","description":"Input variable: dashboardData"}],"outputVariables":[],"inputVariableMappings":{"dashboardData":"{{httpResult}}"}}}];
      
      (window as any).__currentWorkflowNodes = sanitizedNodes;
      (window as any).__flowChainMetadata = {
        chainId: 'flow_script-event-1771077760003_1771079854883',
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
      
    const scriptEventPayload_script_event_1771077760003 = initialData || {};
    const scriptContextData_script_event_1771077760003 =
      scriptEventPayload_script_event_1771077760003.scriptContext ||
      scriptEventPayload_script_event_1771077760003.contextData ||
      scriptEventPayload_script_event_1771077760003;

    if (scriptContextData_script_event_1771077760003 && typeof scriptContextData_script_event_1771077760003 === 'object') {
      (flowResults as any).variables = (flowResults as any).variables || {};
      Object.entries(scriptContextData_script_event_1771077760003).forEach(([key, value]) => {
        if (key === 'scriptContext' || key === 'contextData') return;
        (flowResults as any)[key] = value;
        (flowResults as any).variables[key] = value;
      });
    }

    // Resolve inputVariableMappings and store in scriptEventParameters
    const inputVariableMappings_script_event_1771077760003 = {"dashboardData":"{{httpResult}}"};
    const resolvedParameters_script_event_1771077760003: Record<string, any> = {};
    
    const resolveScriptMapping = (mappingValue: any) => {
      if (mappingValue === null || mappingValue === undefined) return undefined;
      if (typeof mappingValue !== 'string') return mappingValue;
      const trimmed = mappingValue.trim();
      if (!trimmed) return undefined;
      
      if (trimmed.includes('{{') && trimmed.includes('}}')) {
        const templateContext = {
          ...flowResults,
          dataFlow: typeof dataFlow !== 'undefined' ? dataFlow : undefined,
          currentResult: null,
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
    
    Object.entries(inputVariableMappings_script_event_1771077760003).forEach(([key, mappingValue]) => {
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
          resolvedParameters_script_event_1771077760003[key] = resolvedValue;
          console.log(`✅ Set ${key} to:`, resolvedValue);
        } else if (typeof resolvedValue === 'string' && resolvedValue.trim() !== '') {
          // Only set non-empty strings
          resolvedParameters_script_event_1771077760003[key] = resolvedValue;
          console.log(`✅ Set ${key} to string:`, resolvedValue);
        } else if (typeof resolvedValue !== 'string') {
          // Allow numbers, booleans, etc.
          resolvedParameters_script_event_1771077760003[key] = resolvedValue;
          console.log(`✅ Set ${key} to:`, resolvedValue);
        } else {
          console.warn(`⚠️ Skipping ${key} - empty string`);
        }
      } else {
        console.warn(`⚠️ Skipping ${key} - resolvedValue is ${resolvedValue}`);
      }
    });
    
    console.log('📦 Resolved parameters:', resolvedParameters_script_event_1771077760003);
    
    const mergedParameters_script_event_1771077760003 = {
      ...(scriptEventPayload_script_event_1771077760003?.parameters || {}),
      ...resolvedParameters_script_event_1771077760003
    };
    
    // Store resolved parameters in flowResults.scriptEventParameters
    if (Object.keys(mergedParameters_script_event_1771077760003).length > 0) {
      (flowResults as any).scriptEventParameters = mergedParameters_script_event_1771077760003;
      console.log('💾 Stored scriptEventParameters in flowResults:', mergedParameters_script_event_1771077760003);
      
      // Push parameters to __scriptContext so UI scripts can access them
      if (typeof window !== 'undefined') {
        const scriptContext = (window as any).__scriptContext;
        if (scriptContext && typeof scriptContext.setData === 'function') {
          console.log('📤 Pushing parameters to scriptContext...');
          Object.entries(mergedParameters_script_event_1771077760003).forEach(([key, value]) => {
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

    step1Result = {
      ...scriptEventPayload_script_event_1771077760003,
      parameters: mergedParameters_script_event_1771077760003,
      scriptId: scriptEventPayload_script_event_1771077760003?.scriptId || scriptEventPayload_script_event_1771077760003?.script_id || 'e4c81360-59ca-4d22-9dee-d9d62f7f95e4',
      scriptName: scriptEventPayload_script_event_1771077760003?.scriptName,
      trigger: scriptEventPayload_script_event_1771077760003?.trigger || 'script-event',
      timestamp: initialData?.timestamp || new Date().toISOString()
    };
    (flowResults as any).scriptEventResult = step1Result;
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['script-event-1771077760003'] = {
      nodeId: 'script-event-1771077760003',
      nodeType: 'script-event',
      stepNumber: 1,
      displayName: 'scriptEventResult_script_event_1771077760003',
      data: step1Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for script-event
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['scriptEventResult_script_event_1771077760003'] || typeof flowResults['scriptEventResult_script_event_1771077760003'] === 'undefined') {
      flowResults['scriptEventResult_script_event_1771077760003'] = step1Result;
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
      console.error('❌ Error in step 1 (script-event):', stepError);
      flowErrors.push(`Step 1 (script-event): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step1Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'script-event',
        nodeId: 'script-event-1771077760003',
        stepNumber: 1
      };
      
      currentResult = step1Result; // Update currentResult even on error
      
      // Store error result in enhanced data flow system
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['script-event-1771077760003'] = {
      nodeId: 'script-event-1771077760003',
      nodeType: 'script-event',
      stepNumber: 1,
      displayName: 'scriptEventResult_script_event_1771077760003',
      data: step1Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for script-event
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['scriptEventResult_script_event_1771077760003'] || typeof flowResults['scriptEventResult_script_event_1771077760003'] === 'undefined') {
      flowResults['scriptEventResult_script_event_1771077760003'] = step1Result;
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
      if ('flow_script-event-1771077760003_1771079854883'.includes('button')) {
        // Extract button node information from chain
        const buttonNodes = Object.values(flowResults.nodeResults || {}).filter(
          (result: any) => result.nodeType === 'button'
        );
        
        buttonNodes.forEach((buttonNode: any) => {
          // Store chain ID mapped to button element ID
          if (buttonNode.elementId) {
            (window as any).buttonChainRegistry[buttonNode.elementId] = 'flow_script-event-1771077760003_1771079854883';
            console.log(`🔗 Registered button chain: ${buttonNode.elementId} → flow_script-event-1771077760003_1771079854883`);
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
        detail: { flowResults, chainId: 'flow_script-event-1771077760003_1771079854883' } 
      }));
      (window as any).dispatchEvent(new CustomEvent('flowExecutionCompleted', { 
        detail: { flowResults, chainId: 'flow_script-event-1771077760003_1771079854883' } 
      }));
      console.log("📡 Dispatched workflow completion events");
    }
    
    return {
      success: true,
      results: flowResults,
      errors: flowErrors,
      chainId: 'flow_script-event-1771077760003_1771079854883'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) || 'Unknown error';
    console.error('❌ Flow chain execution error:', error);
    return {
      success: false,
      results: flowResults,
      errors: [...flowErrors, errorMessage],
      chainId: 'flow_script-event-1771077760003_1771079854883'
    };
  }
};





const executeFlowChain_flow_button_1771079809740_1771079854883 = async (initialData: any = {}): Promise<FlowResult> => {
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
  
  flowResults._executionId = `flow_button_1771079809740_1771079854883_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
    flowResults.originalChainData = {"id":"flow_button-1771079809740_1771079854883","nodes":[{"id":"button-1771079809740","nodeType":"button","config":{"value":"","buttonId":"id-17710796453655651","attribute":"data-id","buttonName":"Submit","componentId":"id-17710796453655651","componentType":"button"}},{"id":"http-1770709018092","nodeType":"http","config":{"url":"https://loejhunuyscavxtsvnkl.supabase.co/rest/v1/rpc/get_crudsupabase_counts","method":"GET","headers":[{"id":"header-1770709055451","name":"apikey","value":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZWpodW51eXNjYXZ4dHN2bmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjUwNCwiZXhwIjoyMDczMjMyNTA0fQ.6ERQ8rwPpaQkAxp2mZ_S8TtCzZ65rznxVnXnZzkOfmU"},{"id":"header-1770709071810","name":"Authorization","value":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZWpodW51eXNjYXZ4dHN2bmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjUwNCwiZXhwIjoyMDczMjMyNTA0fQ.6ERQ8rwPpaQkAxp2mZ_S8TtCzZ65rznxVnXnZzkOfmU"}],"timeout":30000,"bodyType":"empty","noteText":"","chunkSize":1024,"formFields":[],"retryDelay":1000,"bodyContent":"","contentType":"application/json","queryParams":[],"validateSSL":true,"parseResponse":true,"retryAttempts":3,"enableChunking":false,"resultVariable":"httpResult","enableStreaming":false,"followRedirects":true,"maxResponseSize":100}}],"edges":[{"source":"http-1770709018092","target":"script-event-1771077760003"},{"source":"button-1771079809740","target":"http-1770709018092"}],"chainType":"linear","dataFlow":[],"startNode":{"id":"button-1771079809740","nodeType":"button","config":{"value":"","buttonId":"id-17710796453655651","attribute":"data-id","buttonName":"Submit","componentId":"id-17710796453655651","componentType":"button"}},"endNode":{"id":"http-1770709018092","nodeType":"http","config":{"url":"https://loejhunuyscavxtsvnkl.supabase.co/rest/v1/rpc/get_crudsupabase_counts","method":"GET","headers":[{"id":"header-1770709055451","name":"apikey","value":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZWpodW51eXNjYXZ4dHN2bmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjUwNCwiZXhwIjoyMDczMjMyNTA0fQ.6ERQ8rwPpaQkAxp2mZ_S8TtCzZ65rznxVnXnZzkOfmU"},{"id":"header-1770709071810","name":"Authorization","value":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZWpodW51eXNjYXZ4dHN2bmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjUwNCwiZXhwIjoyMDczMjMyNTA0fQ.6ERQ8rwPpaQkAxp2mZ_S8TtCzZ65rznxVnXnZzkOfmU"}],"timeout":30000,"bodyType":"empty","noteText":"","chunkSize":1024,"formFields":[],"retryDelay":1000,"bodyContent":"","contentType":"application/json","queryParams":[],"validateSSL":true,"parseResponse":true,"retryAttempts":3,"enableChunking":false,"resultVariable":"httpResult","enableStreaming":false,"followRedirects":true,"maxResponseSize":100}}};

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
    flowResults.originalChainData = {"id":"flow_button-1771079809740_1771079854883","nodes":[{"id":"button-1771079809740","nodeType":"button","config":{"value":"","buttonId":"id-17710796453655651","attribute":"data-id","buttonName":"Submit","componentId":"id-17710796453655651","componentType":"button"}},{"id":"http-1770709018092","nodeType":"http","config":{"url":"https://loejhunuyscavxtsvnkl.supabase.co/rest/v1/rpc/get_crudsupabase_counts","method":"GET","headers":[{"id":"header-1770709055451","name":"apikey","value":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZWpodW51eXNjYXZ4dHN2bmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjUwNCwiZXhwIjoyMDczMjMyNTA0fQ.6ERQ8rwPpaQkAxp2mZ_S8TtCzZ65rznxVnXnZzkOfmU"},{"id":"header-1770709071810","name":"Authorization","value":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZWpodW51eXNjYXZ4dHN2bmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjUwNCwiZXhwIjoyMDczMjMyNTA0fQ.6ERQ8rwPpaQkAxp2mZ_S8TtCzZ65rznxVnXnZzkOfmU"}],"timeout":30000,"bodyType":"empty","noteText":"","chunkSize":1024,"formFields":[],"retryDelay":1000,"bodyContent":"","contentType":"application/json","queryParams":[],"validateSSL":true,"parseResponse":true,"retryAttempts":3,"enableChunking":false,"resultVariable":"httpResult","enableStreaming":false,"followRedirects":true,"maxResponseSize":100}}],"edges":[{"source":"http-1770709018092","target":"script-event-1771077760003"},{"source":"button-1771079809740","target":"http-1770709018092"}],"chainType":"linear","dataFlow":[],"startNode":{"id":"button-1771079809740","nodeType":"button","config":{"value":"","buttonId":"id-17710796453655651","attribute":"data-id","buttonName":"Submit","componentId":"id-17710796453655651","componentType":"button"}},"endNode":{"id":"http-1770709018092","nodeType":"http","config":{"url":"https://loejhunuyscavxtsvnkl.supabase.co/rest/v1/rpc/get_crudsupabase_counts","method":"GET","headers":[{"id":"header-1770709055451","name":"apikey","value":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZWpodW51eXNjYXZ4dHN2bmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjUwNCwiZXhwIjoyMDczMjMyNTA0fQ.6ERQ8rwPpaQkAxp2mZ_S8TtCzZ65rznxVnXnZzkOfmU"},{"id":"header-1770709071810","name":"Authorization","value":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZWpodW51eXNjYXZ4dHN2bmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjUwNCwiZXhwIjoyMDczMjMyNTA0fQ.6ERQ8rwPpaQkAxp2mZ_S8TtCzZ65rznxVnXnZzkOfmU"}],"timeout":30000,"bodyType":"empty","noteText":"","chunkSize":1024,"formFields":[],"retryDelay":1000,"bodyContent":"","contentType":"application/json","queryParams":[],"validateSSL":true,"parseResponse":true,"retryAttempts":3,"enableChunking":false,"resultVariable":"httpResult","enableStreaming":false,"followRedirects":true,"maxResponseSize":100}}};
    
    if (typeof window !== 'undefined') {
      // SECURITY: Store SANITIZED workflow nodes in window context (remove API keys)
      // Sanitize each node individually to ensure all sensitive data is removed
      const sanitizedNodes = [{"id":"button-1771079809740","nodeType":"button","config":{"value":"","buttonId":"id-17710796453655651","attribute":"data-id","buttonName":"Submit","componentId":"id-17710796453655651","componentType":"button"}},{"id":"http-1770709018092","nodeType":"http","config":{"url":"https://loejhunuyscavxtsvnkl.supabase.co/rest/v1/rpc/get_crudsupabase_counts","method":"GET","headers":[{"id":"header-1770709055451","name":"apikey","value":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZWpodW51eXNjYXZ4dHN2bmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjUwNCwiZXhwIjoyMDczMjMyNTA0fQ.6ERQ8rwPpaQkAxp2mZ_S8TtCzZ65rznxVnXnZzkOfmU"},{"id":"header-1770709071810","name":"Authorization","value":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZWpodW51eXNjYXZ4dHN2bmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjUwNCwiZXhwIjoyMDczMjMyNTA0fQ.6ERQ8rwPpaQkAxp2mZ_S8TtCzZ65rznxVnXnZzkOfmU"}],"timeout":30000,"bodyType":"empty","noteText":"","chunkSize":1024,"formFields":[],"retryDelay":1000,"bodyContent":"","contentType":"application/json","queryParams":[],"validateSSL":true,"parseResponse":true,"retryAttempts":3,"enableChunking":false,"resultVariable":"httpResult","enableStreaming":false,"followRedirects":true,"maxResponseSize":100}}];
      
      (window as any).__currentWorkflowNodes = sanitizedNodes;
      (window as any).__flowChainMetadata = {
        chainId: 'flow_button-1771079809740_1771079854883',
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
      
    // CRITICAL FIX: Capture dynamic button ID from initialData
    const dynamicButtonId_id_17710796453655651 = initialData?.buttonId || initialData?.elementId || 'id-17710796453655651';
    const buttonClickData_id_17710796453655651 = initialData?.itemData || null;
    
    // CRITICAL FIX: Pass ALL initialData forward (including form data)
    // This ensures form fields collected by button click handler are available to downstream nodes
    step1Result = {
      ...initialData,  // Include ALL data from button click (form fields, etc.)
      buttonId: dynamicButtonId_id_17710796453655651,
      clicked: true,
      inputData: buttonClickData_id_17710796453655651,
      itemData: buttonClickData_id_17710796453655651,
      elementId: initialData?.elementId || 'id-17710796453655651',
      trigger: initialData?.trigger || 'button-click',
      timestamp: initialData?.timestamp || initialData?.clickTimestamp || new Date().toISOString()
    };
    
    console.log('🔘 Button processed with dynamic data:', step1Result);
    (flowResults as any).buttonResult = step1Result;
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['button-1771079809740'] = {
      nodeId: 'button-1771079809740',
      nodeType: 'button',
      stepNumber: 1,
      displayName: 'buttonResult_id_17710796453655651',
      data: step1Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for button
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['buttonResult_id_17710796453655651'] || typeof flowResults['buttonResult_id_17710796453655651'] === 'undefined') {
      flowResults['buttonResult_id_17710796453655651'] = step1Result;
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
      console.error('❌ Error in step 1 (button):', stepError);
      flowErrors.push(`Step 1 (button): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step1Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'button',
        nodeId: 'button-1771079809740',
        stepNumber: 1
      };
      
      currentResult = step1Result; // Update currentResult even on error
      
      // Store error result in enhanced data flow system
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['button-1771079809740'] = {
      nodeId: 'button-1771079809740',
      nodeType: 'button',
      stepNumber: 1,
      displayName: 'buttonResult_id_17710796453655651',
      data: step1Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for button
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['buttonResult_id_17710796453655651'] || typeof flowResults['buttonResult_id_17710796453655651'] === 'undefined') {
      flowResults['buttonResult_id_17710796453655651'] = step1Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
    }

    step2Result = currentResult;
    try {
      
    // === HTTP REQUEST (GET) ===
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        console.info('🌐 Processing GET request');
      }
    
    step2Result = currentResult;
    
    let fullUrl_http_1770709018092 = 'https://loejhunuyscavxtsvnkl.supabase.co/rest/v1/rpc/get_crudsupabase_counts';
    let responseStatus_http_1770709018092: number = 0;
    let responseStatusText_http_1770709018092: string = '';
    let responseHeaders_http_1770709018092: Record<string, string> = {};
    let responseData_http_1770709018092: any = null;
    let lastError_http_1770709018092: any = null;
    
    try {
      if (!fullUrl_http_1770709018092 || fullUrl_http_1770709018092.trim() === '') {
        throw new Error('URL is required for HTTP requests');
      }
      
      // Show loader before starting API request
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('apiLoadingStart', { 
          detail: { endpoint: 'https://loejhunuyscavxtsvnkl.supabase.co/rest/v1/rpc/get_crudsupabase_counts', method: 'GET', nodeId: 'http-1770709018092' } 
        }));
      }
      
      // Build and process URL
      // Process URL template expressions
      const urlTemplateContext = {
        dataFlow: dataFlow,
        flowResults: flowResults,
        ...flowResults
      };

       // Spread flowResults to make top-level properties available
        Object.assign(urlTemplateContext, flowResults);

        // Explicitly include all node results by their displayName for direct access
        // This ensures variables like getPostResult.insta_image_url can be resolved
        if (flowResults.nodeResults) {
          for (const [nodeId, nodeResult] of Object.entries(flowResults.nodeResults)) {
            const result = nodeResult as any;
            if (result.displayName && result.data !== undefined) {
              (urlTemplateContext as Record<string, any>)[result.displayName] = result.data;
            }
          }
        }

        // Explicitly include all API responses for direct access
        if (flowResults.apiResponses) {
          for (const [key, value] of Object.entries(flowResults.apiResponses)) {
            if (value !== undefined) {
              (urlTemplateContext as Record<string, any>)[key] = value;
            }
          }
        }

        // Explicitly include all variables for direct access
        if (flowResults.variables) {
          for (const [key, value] of Object.entries(flowResults.variables)) {
            if (value !== undefined) {
              (urlTemplateContext as Record<string, any>)[key] = value;
            }
          }
        }
      
      fullUrl_http_1770709018092 = TemplateExpressionEngine.processTemplate(fullUrl_http_1770709018092, urlTemplateContext, {
        allowComplexExpressions: true,
        allowFunctions: true,
        securityLevel: 'moderate',
        returnType: 'string',
        fallbackValue: fullUrl_http_1770709018092
      });
      
      // Ensure URL has a protocol
      if (!fullUrl_http_1770709018092.startsWith('http://') && !fullUrl_http_1770709018092.startsWith('https://')) {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        fullUrl_http_1770709018092 = fullUrl_http_1770709018092.startsWith('/') ? `${apiBaseUrl}${fullUrl_http_1770709018092}` : `${apiBaseUrl}/${fullUrl_http_1770709018092}`;
      }
      
      // No query parameters specified
      
      // Prepare headers with proper typing
      const headers: Record<string, string> = {};
      headers['apikey'] = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZWpodW51eXNjYXZ4dHN2bmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjUwNCwiZXhwIjoyMDczMjMyNTA0fQ.6ERQ8rwPpaQkAxp2mZ_S8TtCzZ65rznxVnXnZzkOfmU';
      headers['Authorization'] = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZWpodW51eXNjYXZ4dHN2bmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjUwNCwiZXhwIjoyMDczMjMyNTA0fQ.6ERQ8rwPpaQkAxp2mZ_S8TtCzZ65rznxVnXnZzkOfmU';
      
      // Prepare request options with proper typing
      const requestOptions: RequestInit = {
        method: 'GET',
        headers: headers
      };
      
      // Add request body for non-GET requests
      // No body for this request
      
      // Configurable timeout handling with retry mechanism
      const timeout = 30000;
      const retryAttempts = 3;
      const retryDelay = 1000;
      const maxResponseSize = 100 * 1024 * 1024;
      
      let attempt = 0;
      
      // Declare response variables outside the retry loop
      let response: Response;
      let responseOk: boolean = false;
      
      while (attempt <= retryAttempts) {
        try {
          const controller = new AbortController();
          const timeoutId = setTimeout(() => {
            controller.abort();
            if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        console.warn('🌐 Request timeout');
      }
          }, timeout);
          
          requestOptions.signal = controller.signal;
          
          response = await fetch(fullUrl_http_1770709018092, requestOptions);
          clearTimeout(timeoutId);
          
          // Store response.ok immediately after successful fetch
          responseOk = response.ok;
          
          // Check response size before processing
          const contentLength: string | null = response.headers.get('content-length');
          if (contentLength !== null && parseInt(contentLength) > maxResponseSize) {
            throw new Error(`Response size (${(parseInt(contentLength) / 1024 / 1024).toFixed(2)} MB) exceeds limit (${maxResponseSize / 1024 / 1024} MB)`);
          }
          
          // Process response
          responseStatus_http_1770709018092 = response.status;
          responseStatusText_http_1770709018092 = response.statusText;
          responseHeaders_http_1770709018092 = {};
          response.headers.forEach((value, key) => {
            responseHeaders_http_1770709018092[key] = value;
          });
          
          // Advanced response processing with chunking support
          if (true) {
            const contentType = response.headers.get('content-type') || '';
            
            // Handle chunked processing for large responses
            if (false && contentLength && parseInt(contentLength || '0') > 1024 * 1024) {
              if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        console.info('🌐 Processing large response in chunks');
      }
              
              if (contentType.includes('application/json')) {
                const textResponse = await response.text();
                responseData_http_1770709018092 = JSON.parse(textResponse);
              } else {
                responseData_http_1770709018092 = await response.text();
              }
            } else {
              // Standard processing for smaller responses
              if (contentType.includes('application/json')) {
                responseData_http_1770709018092 = await response.json();
              } else if (contentType.includes('text/')) {
                responseData_http_1770709018092 = await response.text();
              } else {
                responseData_http_1770709018092 = await response.text();
              }
            }
          } else {
             // Parse JSON response if content-type indicates JSON, otherwise get text
            const contentType = response.headers.get('content-type') || '';
            const responseText = await response.text();
            
            if (contentType.includes('application/json') || responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
              try {
                responseData_http_1770709018092 = JSON.parse(responseText);
                console.log('✅ Parsed HTTP response as JSON:', {
                  type: typeof responseData_http_1770709018092,
                  hasData: !!responseData_http_1770709018092?.data,
                  dataLength: Array.isArray(responseData_http_1770709018092?.data) ? responseData_http_1770709018092.data.length : 'not array'
                });
              } catch (parseError) {
                console.warn('⚠️ Failed to parse JSON response, using text:', parseError);
                responseData_http_1770709018092 = responseText;
              }
            } else {
              responseData_http_1770709018092 = responseText;
            }
          }
          
          break; // Success - exit retry loop
          
        } catch (error: any) {
          lastError_http_1770709018092 = error;
          attempt++;
          
          // Retry logic
          if (error.name === 'AbortError' && attempt <= retryAttempts) {
            if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        console.warn('🌐 Request timeout, retrying');
      }
          } else if (attempt <= retryAttempts) {
            if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        console.warn('🌐 Request failed, retrying');
      }
          }
          
          // Wait before retry
          if (attempt <= retryAttempts) {
            await new Promise(resolve => setTimeout(resolve, retryDelay));
          }
        }
      }
      
      // If all retries failed
      if (attempt > retryAttempts) {
        throw lastError_http_1770709018092 || new Error('HTTP request failed after all retry attempts');
      }
      
       // CRITICAL: Ensure responseData is parsed if it's still a string
      if (typeof responseData_http_1770709018092 === 'string') {
        try {
          const trimmed = responseData_http_1770709018092.trim();
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            responseData_http_1770709018092 = JSON.parse(responseData_http_1770709018092);
            console.log(`✅ Parsed httpResult from string to object`);
          }
        } catch (parseError) {
          console.warn('⚠️ Failed to parse responseData_http_1770709018092:', parseError);
        }
      }

      // Hide loader after successful API request
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('apiLoadingEnd', { 
          detail: { 
            success: true,
            endpoint: 'https://loejhunuyscavxtsvnkl.supabase.co/rest/v1/rpc/get_crudsupabase_counts', 
            method: 'GET', 
            nodeId: 'http-1770709018092',
            response: responseData_http_1770709018092
          } 
        }));
      }
      
      // === AUTHENTICATION ERROR HANDLING ===
      // Check if this is an authentication endpoint and handle errors appropriately
      const isAuthEndpoint_http_1770709018092 = (fullUrl_http_1770709018092.toLowerCase().includes('/login') || 
                                              fullUrl_http_1770709018092.toLowerCase().includes('/signup') || 
                                              fullUrl_http_1770709018092.toLowerCase().includes('/sign-in') ||
                                              fullUrl_http_1770709018092.toLowerCase().includes('/sign-up') ||
                                              fullUrl_http_1770709018092.toLowerCase().includes('/register') ||
                                              fullUrl_http_1770709018092.toLowerCase().includes('/auth/login') ||
                                              fullUrl_http_1770709018092.toLowerCase().includes('/auth/signup') ||
                                              fullUrl_http_1770709018092.toLowerCase().includes('/auth/register'));
      
      // ✅ CRITICAL FIX: Set user_id cookie immediately after successful login/signup (client-side)
      // SECURITY: auth_token is now only in HttpOnly cookie (set by backend) - use /api/auth/token route to read it
      // This ensures user_id is available before any JavaScript node runs
      // The backend sets HttpOnly cookies, but in some environments (incognito, cross-origin) they may not be set properly
      // Setting user_id client-side ensures it's available for workflow path parameter replacement
      if (responseOk && isAuthEndpoint_http_1770709018092 && typeof window !== 'undefined') {
        try {
          // Extract user_id from login/signup response
          const userId = responseData_http_1770709018092?.user_id || 
                        responseData_http_1770709018092?.user?.id;
          
          if (userId) {
            // Set user_id cookie using document.cookie (client-side)
            // Note: auth_token is NOT set here - it's only in HttpOnly cookie set by backend
            const isSecure = window.location.protocol === 'https:';
            document.cookie = `user_id=${userId}; path=/; max-age=86400; SameSite=Lax${isSecure ? '; Secure' : ''}`;
            console.log('✅ Set user_id cookie after login/signup:', { userId });
          } else {
            console.warn('⚠️ Could not extract userId from auth response:', responseData_http_1770709018092);
          }
        } catch (cookieError) {
          console.error('❌ Failed to set user_id cookie after login/signup:', cookieError);
        }
      }
      
      if (!responseOk && isAuthEndpoint_http_1770709018092) {
        // Map authentication errors to user-friendly messages
        let authErrorMessage_http_1770709018092 = '';
        const lowerUrl_http_1770709018092 = fullUrl_http_1770709018092.toLowerCase();
        const isLogin_http_1770709018092 = lowerUrl_http_1770709018092.includes('/login') || lowerUrl_http_1770709018092.includes('/sign-in');
        const isSignup_http_1770709018092 = lowerUrl_http_1770709018092.includes('/signup') || lowerUrl_http_1770709018092.includes('/sign-up') || lowerUrl_http_1770709018092.includes('/register');
        
        // Extract error message from response data
        if (responseData_http_1770709018092) {
          if (typeof responseData_http_1770709018092 === 'string') {
            authErrorMessage_http_1770709018092 = responseData_http_1770709018092;
          } else if (responseData_http_1770709018092.detail) {
            authErrorMessage_http_1770709018092 = responseData_http_1770709018092.detail;
          } else if (responseData_http_1770709018092.message) {
            authErrorMessage_http_1770709018092 = responseData_http_1770709018092.message;
          } else if (responseData_http_1770709018092.error) {
            authErrorMessage_http_1770709018092 = responseData_http_1770709018092.error;
          }
        }
        
        const lowerError_http_1770709018092 = authErrorMessage_http_1770709018092.toLowerCase();
        
        // Login-specific error mapping
        if (isLogin_http_1770709018092) {
          if (responseStatus_http_1770709018092 === 401) {
            if (lowerError_http_1770709018092.includes('not registered') || lowerError_http_1770709018092.includes('not found') || lowerError_http_1770709018092.includes('does not exist')) {
              authErrorMessage_http_1770709018092 = 'Email is not registered, kindly register';
            } else {
              authErrorMessage_http_1770709018092 = 'Email or password is incorrect';
            }
          } else if (responseStatus_http_1770709018092 === 404) {
            authErrorMessage_http_1770709018092 = 'Email is not registered, kindly register';
          } else if (responseStatus_http_1770709018092 === 403) {
            authErrorMessage_http_1770709018092 = 'Account is inactive';
          } else if (!authErrorMessage_http_1770709018092) {
            authErrorMessage_http_1770709018092 = 'Authentication failed. Please check your credentials';
          }
        }
        
        // Signup-specific error mapping
        if (isSignup_http_1770709018092) {
          if (responseStatus_http_1770709018092 === 400 || responseStatus_http_1770709018092 === 409) {
            if (lowerError_http_1770709018092.includes('already registered') || lowerError_http_1770709018092.includes('already exists') || lowerError_http_1770709018092.includes('email already')) {
              authErrorMessage_http_1770709018092 = 'Email is already registered';
            } else if (lowerError_http_1770709018092.includes('password') && (lowerError_http_1770709018092.includes('match') || lowerError_http_1770709018092.includes('mismatch') || lowerError_http_1770709018092.includes('confirm'))) {
              authErrorMessage_http_1770709018092 = 'Password and confirm password do not match';
            } else if (lowerError_http_1770709018092.includes('password') && (lowerError_http_1770709018092.includes('short') || lowerError_http_1770709018092.includes('length') || lowerError_http_1770709018092.includes('minimum'))) {
              authErrorMessage_http_1770709018092 = 'Password is too short. Please use at least 8 characters';
            } else if (!authErrorMessage_http_1770709018092) {
              authErrorMessage_http_1770709018092 = 'Invalid request. Please check your input';
            }
          } else if (!authErrorMessage_http_1770709018092) {
            authErrorMessage_http_1770709018092 = 'An error occurred. Please try again';
          }
        }
        
        // Show toast notification for authentication errors
        if (typeof window !== 'undefined') {
          // Use the same toast pattern as auth handlers
          const toast_http_1770709018092 = document.createElement('div');
          toast_http_1770709018092.className = 'fixed top-4 right-4 px-4 py-2 rounded-md text-white text-sm z-50 bg-red-500';
          toast_http_1770709018092.textContent = authErrorMessage_http_1770709018092 || 'Authentication error occurred';
          toast_http_1770709018092.style.cssText = `position: fixed; top: 20px; right: 20px; z-index: 10000; padding: 16px; border-radius: 6px; background-color: #ef4444; color: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); min-width: 300px;`;
          document.body.appendChild(toast_http_1770709018092);
          
          setTimeout(() => {
            toast_http_1770709018092.style.opacity = '0';
            toast_http_1770709018092.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
              if (toast_http_1770709018092.parentElement) {
                document.body.removeChild(toast_http_1770709018092);
              }
            }, 500);
          }, 5000);
        }
        
        // Set authentication error flag to prevent navigation
        if (flowResults) {
          flowResults.authError = true;
          flowResults.lastAuthError = authErrorMessage_http_1770709018092 || 'Authentication error occurred';
        } else {
          console.warn('⚠️ flowResults not available, cannot set authError flag');
        }
      }
      
      // Update result variable (EXISTING FUNCTIONALITY - PRESERVED)
      step2Result = {
        ...currentResult,
        httpResult: responseData_http_1770709018092,
        httpSuccess: responseOk,
        httpStatus: responseStatus_http_1770709018092,
        httpStatusText: responseStatusText_http_1770709018092,
        httpHeaders: responseHeaders_http_1770709018092,
        httpUrl: fullUrl_http_1770709018092,
        httpMethod: 'GET',
        timestamp: new Date().toISOString()
      };
      
      // Store in Data Flow System for UI Components
      // Store result in enhanced data flow system
      if (!flowResults.apiResponses) flowResults.apiResponses = {};
      if (!flowResults.nodeResults) flowResults.nodeResults = {};
      if (!flowResults.variables) flowResults.variables = {};
      
      // CRITICAL FIX: Smart Data Extraction
      // Extract actual data from common API response patterns
      let extractedData_http_1770709018092 = responseData_http_1770709018092;
      
      if (responseData_http_1770709018092 && typeof responseData_http_1770709018092 === 'object' && !Array.isArray(responseData_http_1770709018092)) {
        // Pattern 1: { data: [...] } or { data: {...} }
        if (responseData_http_1770709018092.data !== undefined && responseData_http_1770709018092.data !== null) {
          extractedData_http_1770709018092 = responseData_http_1770709018092.data;
          console.log('✅ Extracted data from response.data field');
        }
        // Pattern 2: { result: [...] } or { result: {...} }
        else if (responseData_http_1770709018092.result !== undefined && responseData_http_1770709018092.result !== null) {
          extractedData_http_1770709018092 = responseData_http_1770709018092.result;
          console.log('✅ Extracted data from response.result field');
        }
        // Pattern 3: { items: [...] }
        else if (responseData_http_1770709018092.items !== undefined && responseData_http_1770709018092.items !== null) {
          extractedData_http_1770709018092 = responseData_http_1770709018092.items;
          console.log('✅ Extracted data from response.items field');
        }
        // Pattern 4: { results: [...] }
        else if (responseData_http_1770709018092.results !== undefined && responseData_http_1770709018092.results !== null) {
          extractedData_http_1770709018092 = responseData_http_1770709018092.results;
          console.log('✅ Extracted data from response.results field');
        }
        // Pattern 5: { records: [...] }
        else if (responseData_http_1770709018092.records !== undefined && responseData_http_1770709018092.records !== null) {
          extractedData_http_1770709018092 = responseData_http_1770709018092.records;
          console.log('✅ Extracted data from response.records field');
        }
        // Pattern 6: { rows: [...] }
        else if (responseData_http_1770709018092.rows !== undefined && responseData_http_1770709018092.rows !== null) {
          extractedData_http_1770709018092 = responseData_http_1770709018092.rows;
          console.log('✅ Extracted data from response.rows field');
        }
        // Pattern 7: { payload: [...] } or { payload: {...} }
        else if (responseData_http_1770709018092.payload !== undefined && responseData_http_1770709018092.payload !== null) {
          extractedData_http_1770709018092 = responseData_http_1770709018092.payload;
          console.log('✅ Extracted data from response.payload field');
        }
        // Pattern 8: { body: [...] } or { body: {...} }
        else if (responseData_http_1770709018092.body !== undefined && responseData_http_1770709018092.body !== null) {
          extractedData_http_1770709018092 = responseData_http_1770709018092.body;
          console.log('✅ Extracted data from response.body field');
        }
      }
      
      // Store both raw and extracted data
      flowResults.apiResponses["httpResult_raw"] = responseData_http_1770709018092;
      flowResults.apiResponses["httpResult"] = extractedData_http_1770709018092;
      
      flowResults.variables["httpResult_raw"] = responseData_http_1770709018092;
      flowResults.variables["httpResult"] = extractedData_http_1770709018092;
      
      flowResults.nodeResults["http-1770709018092"] = {
        data: extractedData_http_1770709018092,
        rawData: responseData_http_1770709018092,
        displayName: "httpResult",
        nodeType: "http",
        success: responseOk,
        status: responseStatus_http_1770709018092,
        stepNumber: (flowResults.stepCounter || 0) + 1
      };
      
      // Store at top-level for direct access (use extracted data)
      flowResults["httpResult"] = extractedData_http_1770709018092;
      flowResults["httpResult_raw"] = responseData_http_1770709018092;
      
      // Update result tracking (use extracted data)
      flowResults.previousResult = flowResults.currentResult;
      flowResults.currentResult = extractedData_http_1770709018092;
      flowResults.stepCounter = (flowResults.stepCounter || 0) + 1;
      
      // Store original chain data for table config detection
      if (!flowResults.originalChainData) {
        flowResults.originalChainData = {
          nodes: [],
          edges: []
        };
      }
      
    } catch (error: any) {
      console.error('🌐 HTTP request failed: ${error?.message}');
      
      // Hide loader after API request error
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('apiLoadingEnd', { 
          detail: { 
            success: false,
            endpoint: 'https://loejhunuyscavxtsvnkl.supabase.co/rest/v1/rpc/get_crudsupabase_counts', 
            method: 'GET', 
            nodeId: 'http-1770709018092',
            response: null
          } 
        }));
      }
      
      // === AUTHENTICATION ERROR HANDLING IN CATCH BLOCK ===
      // Check if this is an authentication endpoint and handle errors appropriately
      const isAuthEndpoint_http_1770709018092 = (fullUrl_http_1770709018092 && (fullUrl_http_1770709018092.toLowerCase().includes('/login') || 
                                              fullUrl_http_1770709018092.toLowerCase().includes('/signup') || 
                                              fullUrl_http_1770709018092.toLowerCase().includes('/sign-in') ||
                                              fullUrl_http_1770709018092.toLowerCase().includes('/sign-up') ||
                                              fullUrl_http_1770709018092.toLowerCase().includes('/register') ||
                                              fullUrl_http_1770709018092.toLowerCase().includes('/auth/login') ||
                                              fullUrl_http_1770709018092.toLowerCase().includes('/auth/signup') ||
                                              fullUrl_http_1770709018092.toLowerCase().includes('/auth/register'))) ||
                                              ('https://loejhunuyscavxtsvnkl.supabase.co/rest/v1/rpc/get_crudsupabase_counts'.toLowerCase().includes('/login') || 
                                               'https://loejhunuyscavxtsvnkl.supabase.co/rest/v1/rpc/get_crudsupabase_counts'.toLowerCase().includes('/signup') || 
                                               'https://loejhunuyscavxtsvnkl.supabase.co/rest/v1/rpc/get_crudsupabase_counts'.toLowerCase().includes('/sign-in') ||
                                               'https://loejhunuyscavxtsvnkl.supabase.co/rest/v1/rpc/get_crudsupabase_counts'.toLowerCase().includes('/sign-up') ||
                                               'https://loejhunuyscavxtsvnkl.supabase.co/rest/v1/rpc/get_crudsupabase_counts'.toLowerCase().includes('/register') ||
                                               'https://loejhunuyscavxtsvnkl.supabase.co/rest/v1/rpc/get_crudsupabase_counts'.toLowerCase().includes('/auth/login') ||
                                               'https://loejhunuyscavxtsvnkl.supabase.co/rest/v1/rpc/get_crudsupabase_counts'.toLowerCase().includes('/auth/signup') ||
                                               'https://loejhunuyscavxtsvnkl.supabase.co/rest/v1/rpc/get_crudsupabase_counts'.toLowerCase().includes('/auth/register'));
      
      if (isAuthEndpoint_http_1770709018092) {
        // For authentication endpoints, show user-friendly error message
        let authErrorMessage_http_1770709018092 = 'An error occurred. Please try again';
        
        // Try to extract error from response if available
        if (responseData_http_1770709018092 && typeof responseData_http_1770709018092 === 'object') {
          if (responseData_http_1770709018092.detail) {
            authErrorMessage_http_1770709018092 = responseData_http_1770709018092.detail;
          } else if (responseData_http_1770709018092.message) {
            authErrorMessage_http_1770709018092 = responseData_http_1770709018092.message;
          } else if (responseData_http_1770709018092.error) {
            authErrorMessage_http_1770709018092 = responseData_http_1770709018092.error;
          }
        } else if (error?.message) {
          authErrorMessage_http_1770709018092 = error.message;
        }
        
        // Show toast notification for authentication errors
        if (typeof window !== 'undefined') {
          const toast_http_1770709018092 = document.createElement('div');
          toast_http_1770709018092.className = 'fixed top-4 right-4 px-4 py-2 rounded-md text-white text-sm z-50 bg-red-500';
          toast_http_1770709018092.textContent = authErrorMessage_http_1770709018092;
          toast_http_1770709018092.style.cssText = `position: fixed; top: 20px; right: 20px; z-index: 10000; padding: 16px; border-radius: 6px; background-color: #ef4444; color: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); min-width: 300px;`;
          document.body.appendChild(toast_http_1770709018092);
          
          setTimeout(() => {
            toast_http_1770709018092.style.opacity = '0';
            toast_http_1770709018092.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
              if (toast_http_1770709018092.parentElement) {
                document.body.removeChild(toast_http_1770709018092);
              }
            }, 500);
          }, 5000);
        }
        
        // Set authentication error flag to prevent navigation
        if (flowResults) {
          flowResults.authError = true;
          flowResults.lastAuthError = authErrorMessage_http_1770709018092;
        } else {
          console.warn('⚠️ flowResults not available, cannot set authError flag');
        }
      }
      
      step2Result = {
        ...currentResult,
        httpResult: responseData_http_1770709018092 || null,
        httpError: error?.message || 'Unknown HTTP error',
        httpSuccess: false,
        httpStatus: responseStatus_http_1770709018092 || 0,
        httpStatusText: responseStatusText_http_1770709018092 || '',
        httpHeaders: responseHeaders_http_1770709018092 || {},
        httpUrl: fullUrl_http_1770709018092 || 'https://loejhunuyscavxtsvnkl.supabase.co/rest/v1/rpc/get_crudsupabase_counts',
        httpMethod: 'GET',
        timestamp: new Date().toISOString()
      };
      
      // Store error state in Data Flow System
      if (!flowResults.apiResponses) flowResults.apiResponses = {};
      if (!flowResults.nodeResults) flowResults.nodeResults = {};
      if (!flowResults.variables) flowResults.variables = {};
      
      // Apply smart extraction even for error responses (some APIs return data in error responses)
      let extractedErrorData_http_1770709018092 = responseData_http_1770709018092 || null;
      if (responseData_http_1770709018092 && typeof responseData_http_1770709018092 === 'object' && !Array.isArray(responseData_http_1770709018092)) {
        if (responseData_http_1770709018092.data !== undefined) {
          extractedErrorData_http_1770709018092 = responseData_http_1770709018092.data;
        } else if (responseData_http_1770709018092.result !== undefined) {
          extractedErrorData_http_1770709018092 = responseData_http_1770709018092.result;
        }
      }
      
      flowResults.apiResponses["httpResult_raw"] = responseData_http_1770709018092 || null;
      flowResults.apiResponses["httpResult"] = extractedErrorData_http_1770709018092;
      
      flowResults.variables["httpResult_raw"] = responseData_http_1770709018092 || null;
      flowResults.variables["httpResult"] = extractedErrorData_http_1770709018092;
      
      flowResults.nodeResults["http-1770709018092"] = {
        data: extractedErrorData_http_1770709018092,
        rawData: responseData_http_1770709018092 || null,
        error: error?.message || 'Unknown HTTP error',
        displayName: "httpResult",
        nodeType: "http",
        success: false,
        status: responseStatus_http_1770709018092 || 0,
        statusText: responseStatusText_http_1770709018092 || '',
        stepNumber: (flowResults.stepCounter || 0) + 1
      };
      
      flowResults["httpResult"] = extractedErrorData_http_1770709018092;
      flowResults["httpResult_raw"] = responseData_http_1770709018092 || null;
    }
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['http-1770709018092'] = {
      nodeId: 'http-1770709018092',
      nodeType: 'http',
      stepNumber: 2,
      displayName: 'httpResult',
      data: step2Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    flowResults.apiResponses['httpResult'] = step2Result;
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['httpResult'] || typeof flowResults['httpResult'] === 'undefined') {
      flowResults['httpResult'] = step2Result;
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
      console.error('❌ Error in step 2 (http):', stepError);
      flowErrors.push(`Step 2 (http): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step2Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'http',
        nodeId: 'http-1770709018092',
        stepNumber: 2
      };
      
      currentResult = step2Result; // Update currentResult even on error
      
      // Store error result in enhanced data flow system
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['http-1770709018092'] = {
      nodeId: 'http-1770709018092',
      nodeType: 'http',
      stepNumber: 2,
      displayName: 'httpResult',
      data: step2Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    flowResults.apiResponses['httpResult'] = step2Result;
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['httpResult'] || typeof flowResults['httpResult'] === 'undefined') {
      flowResults['httpResult'] = step2Result;
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
      if ('flow_button-1771079809740_1771079854883'.includes('button')) {
        // Extract button node information from chain
        const buttonNodes = Object.values(flowResults.nodeResults || {}).filter(
          (result: any) => result.nodeType === 'button'
        );
        
        buttonNodes.forEach((buttonNode: any) => {
          // Store chain ID mapped to button element ID
          if (buttonNode.elementId) {
            (window as any).buttonChainRegistry[buttonNode.elementId] = 'flow_button-1771079809740_1771079854883';
            console.log(`🔗 Registered button chain: ${buttonNode.elementId} → flow_button-1771079809740_1771079854883`);
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
        detail: { flowResults, chainId: 'flow_button-1771079809740_1771079854883' } 
      }));
      (window as any).dispatchEvent(new CustomEvent('flowExecutionCompleted', { 
        detail: { flowResults, chainId: 'flow_button-1771079809740_1771079854883' } 
      }));
      console.log("📡 Dispatched workflow completion events");
    }
    
    return {
      success: true,
      results: flowResults,
      errors: flowErrors,
      chainId: 'flow_button-1771079809740_1771079854883'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) || 'Unknown error';
    console.error('❌ Flow chain execution error:', error);
    return {
      success: false,
      results: flowResults,
      errors: [...flowErrors, errorMessage],
      chainId: 'flow_button-1771079809740_1771079854883'
    };
  }
};







// Register workflow nodes in global registry for cross-workflow node lookups
if (workflowRegistry && workflowRegistry.allNodes) {
  const workflowNodes = [{"id":"http-1770709018092","nodeType":"http","config":{"url":"https://loejhunuyscavxtsvnkl.supabase.co/rest/v1/rpc/get_crudsupabase_counts","method":"GET","headers":[{"id":"header-1770709055451","name":"apikey","value":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZWpodW51eXNjYXZ4dHN2bmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjUwNCwiZXhwIjoyMDczMjMyNTA0fQ.6ERQ8rwPpaQkAxp2mZ_S8TtCzZ65rznxVnXnZzkOfmU"},{"id":"header-1770709071810","name":"Authorization","value":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZWpodW51eXNjYXZ4dHN2bmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjUwNCwiZXhwIjoyMDczMjMyNTA0fQ.6ERQ8rwPpaQkAxp2mZ_S8TtCzZ65rznxVnXnZzkOfmU"}],"timeout":30000,"bodyType":"empty","noteText":"","chunkSize":1024,"formFields":[],"retryDelay":1000,"bodyContent":"","contentType":"application/json","queryParams":[],"validateSSL":true,"parseResponse":true,"retryAttempts":3,"enableChunking":false,"resultVariable":"httpResult","enableStreaming":false,"followRedirects":true,"maxResponseSize":100}},{"id":"script-event-1771077760003","nodeType":"script-event","config":{"pageId":"page-17710071952151647","scriptId":"e4c81360-59ca-4d22-9dee-d9d62f7f95e4","elementId":"component-1771007210712-8027","eventType":"onLoad","scriptKey":"page-17710071952151647::component-1771007210712-8027::onLoad::e4c81360-59ca-4d22-9dee-d9d62f7f95e4","scriptName":"dashboardout","actionValue":"","componentId":"component-1771007210712-8027","inputVariables":[{"name":"dashboardData","type":"object from http request","source":"custom","description":"Input variable: dashboardData"}],"outputVariables":[],"inputVariableMappings":{"dashboardData":"{{httpResult}}"}}},{"id":"button-1771079809740","nodeType":"button","config":{"value":"","buttonId":"id-17710796453655651","attribute":"data-id","buttonName":"Submit","componentId":"id-17710796453655651","componentType":"button"}}];
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
  
  
  // Execute flow_script-event-1771077760003_1771079854883
  if (!specificChainId || specificChainId === 'flow_script-event-1771077760003_1771079854883') {
    
    // For script-event or other trigger types, use existing logic
    const triggerType = triggerData?.trigger || 'manual';
    const isPageLoadTrigger = triggerType === 'page-load';
    const isButtonOrFormChain = ['button', 'form', 'script-event'].includes('script-event');
    
    // Debug logging (only in development)
    const DEBUG_FLOW_SYSTEM = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
    
    if (isButtonOrFormChain && isPageLoadTrigger && !specificChainId) {
      results['flow_script_event_1771077760003_1771079854883'] = { 
        success: false, 
        skipped: true, 
        reason: 'Button/Form workflow should not run on page load',
        chainId: 'flow_script_event_1771077760003_1771079854883',
        triggerType: triggerType,  // FIXED: Use actual triggerType
        workflowType: 'script-event',
        actualTrigger: triggerType
      };
      return; // Explicit early return
    } else {
      // Proceed with workflow execution
      try {
        const result_flow_script_event_1771077760003_1771079854883 = await executeFlowChain_flow_script_event_1771077760003_1771079854883(triggerData);
        results['flow_script_event_1771077760003_1771079854883'] = result_flow_script_event_1771077760003_1771079854883;
        
        if (!result_flow_script_event_1771077760003_1771079854883.success) {
          if (DEBUG_FLOW_SYSTEM) {
            console.error('❌ Chain flow_script_event_1771077760003_1771079854883 failed:', result_flow_script_event_1771077760003_1771079854883.errors);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error) || 'Unknown error';
        if (DEBUG_FLOW_SYSTEM) {
          console.error('💥 Error executing flow flow_script_event_1771077760003_1771079854883:', error);
        }
        results['flow_script_event_1771077760003_1771079854883'] = { success: false, error: errorMessage, chainId: 'flow_script_event_1771077760003_1771079854883', results: {}, errors: [errorMessage] };
      }
    }
    
  }

  // Execute flow_button-1771079809740_1771079854883
  if (!specificChainId || specificChainId === 'flow_button-1771079809740_1771079854883') {
    
    // ✅ CRITICAL FIX: Button workflows should ONLY execute when their specific button is clicked
    // They should NOT execute on page-load, form-submission, or other triggers
    const triggerType = triggerData?.trigger || 'manual';
    const triggerButtonId = triggerData?.buttonId || triggerData?.elementId || null;
    const expectedButtonId = 'id-17710796453655651';
    
    // Type-safe window access with validation
    const getButtonRegistry = (): Record<string, string> | null => {
      if (typeof window === 'undefined') return null;
      try {
        const win = window as Window & { buttonChainRegistry?: Record<string, string> };
        return (win.buttonChainRegistry && typeof win.buttonChainRegistry === 'object') 
          ? win.buttonChainRegistry 
          : null;
      } catch {
        return null;
      }
    };
    const buttonRegistry = getButtonRegistry();
    const registeredChainId = (buttonRegistry && triggerButtonId && typeof triggerButtonId === 'string')
      ? (typeof buttonRegistry[triggerButtonId] === 'string' ? buttonRegistry[triggerButtonId] : null)
      : null;
    
    // Debug logging for button workflows (only in development)
    const DEBUG_FLOW_SYSTEM = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
    if (DEBUG_FLOW_SYSTEM) {
      console.log('🔍 Button Workflow Check:', { 
        chainId: 'flow_button_1771079809740_1771079854883', 
        triggerType, 
        triggerButtonId, 
        expectedButtonId, 
        specificChainId,
        shouldSkip: triggerType === 'form-submission' && !specificChainId 
      });
    }
    
    // ✅ SOLUTION 2: Redirect flag check - Skip if redirect is in progress
    if (typeof window !== 'undefined' && (window as any).__isRedirecting && !specificChainId) {
      if (DEBUG_FLOW_SYSTEM) {
        console.log('⏭️ SKIPPING Button workflow - redirect in progress');
      }
      results['flow_button_1771079809740_1771079854883'] = { 
        success: false, 
        skipped: true, 
        reason: 'Redirect in progress',
        chainId: 'flow_button_1771079809740_1771079854883',
        triggerType: triggerType,
        workflowType: 'button'
      };
      return; // Explicit early return
    }
    
    // Skip on form-submission (this is the key fix!)
    if (triggerType === 'form-submission' && !specificChainId) {
      if (DEBUG_FLOW_SYSTEM) {
        console.log('⏭️ SKIPPING Button workflow - form-submission trigger detected');
      }
      results['flow_button_1771079809740_1771079854883'] = { 
        success: false, 
        skipped: true, 
        reason: 'Button workflow should not run on form submission',
        chainId: 'flow_button_1771079809740_1771079854883',
        triggerType: triggerType,  // FIXED: Use actual triggerType, not hardcoded 'button'
        workflowType: 'button',  // Add workflowType to distinguish from triggerType
        actualTrigger: triggerType
      };
      return; // Explicit early return
    }
    // Skip on page-load
    else if (triggerType === 'page-load' && !specificChainId) {
      results['flow_button_1771079809740_1771079854883'] = { 
        success: false, 
        skipped: true, 
        reason: 'Button workflow should not run on page load',
        chainId: 'flow_button_1771079809740_1771079854883',
        triggerType: triggerType,  // FIXED: Use actual triggerType
        workflowType: 'button',
        actualTrigger: triggerType
      };
      return; // Explicit early return
    }
    // Skip if button-click trigger but buttonId doesn't match
    else if (triggerType === 'button-click' && triggerButtonId && expectedButtonId && triggerButtonId !== expectedButtonId && !specificChainId) {
      results['flow_button_1771079809740_1771079854883'] = {
        success: false,
        skipped: true,
        reason: 'Button ID mismatch - this workflow is for a different button',
        chainId: 'flow_button_1771079809740_1771079854883',
        triggerType: triggerType,  // FIXED: Use actual triggerType
        workflowType: 'button',
        triggerButtonId,
        expectedButtonId
      };
      return; // Explicit early return
    }
    // Skip if button registry mismatch
    else if (triggerType === 'button-click' && triggerButtonId && registeredChainId && registeredChainId !== 'flow_button_1771079809740_1771079854883' && !specificChainId) {
      results['flow_button_1771079809740_1771079854883'] = {
        success: false,
        skipped: true,
        reason: 'Button workflow button registry mismatch',
        chainId: 'flow_button_1771079809740_1771079854883',
        triggerType: triggerType,  // FIXED: Use actual triggerType
        workflowType: 'button',
        triggerButtonId,
        registeredChainId
      };
      return; // Explicit early return
    }
    // Skip if this is NOT a button-click trigger (and not manual/explicit call)
    else if (triggerType !== 'button-click' && triggerType !== 'manual' && !specificChainId) {
      results['flow_button_1771079809740_1771079854883'] = { 
        success: false, 
        skipped: true, 
        reason: 'Button workflow should only execute on button-click trigger',
        chainId: 'flow_button_1771079809740_1771079854883',
        triggerType: triggerType,  // FIXED: Use actual triggerType
        workflowType: 'button',
        actualTrigger: triggerType,
        expectedTrigger: 'button-click'
      };
      return; // Explicit early return
    }
    else {
      // Proceed with button workflow execution
      try {
        const result_flow_button_1771079809740_1771079854883 = await executeFlowChain_flow_button_1771079809740_1771079854883(triggerData);
        results['flow_button_1771079809740_1771079854883'] = result_flow_button_1771079809740_1771079854883;
        
        if (!result_flow_button_1771079809740_1771079854883.success) {
          if (DEBUG_FLOW_SYSTEM) {
            console.error('❌ Chain flow_button_1771079809740_1771079854883 failed:', result_flow_button_1771079809740_1771079854883.errors);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error) || 'Unknown error';
        if (DEBUG_FLOW_SYSTEM) {
          console.error('💥 Error executing flow flow_button_1771079809740_1771079854883:', error);
        }
        results['flow_button_1771079809740_1771079854883'] = { success: false, error: errorMessage, chainId: 'flow_button_1771079809740_1771079854883', results: {}, errors: [errorMessage] };
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
    "id": "flow_script-event-1771077760003_1771079854883",
    "nodeTypes": [
      "script-event"
    ],
    "nodeCount": 1,
    "chainType": "linear",
    "startNode": {
      "id": "script-event-1771077760003",
      "nodeType": "script-event",
      "config": {
        "pageId": "page-17710071952151647",
        "scriptId": "e4c81360-59ca-4d22-9dee-d9d62f7f95e4",
        "elementId": "component-1771007210712-8027",
        "eventType": "onLoad",
        "scriptKey": "page-17710071952151647::component-1771007210712-8027::onLoad::e4c81360-59ca-4d22-9dee-d9d62f7f95e4",
        "scriptName": "dashboardout",
        "actionValue": "",
        "componentId": "component-1771007210712-8027",
        "inputVariables": [
          {
            "name": "dashboardData",
            "type": "object from http request",
            "source": "custom",
            "description": "Input variable: dashboardData"
          }
        ],
        "outputVariables": [],
        "inputVariableMappings": {
          "dashboardData": "{{httpResult}}"
        }
      }
    },
    "endNode": {
      "id": "script-event-1771077760003",
      "nodeType": "script-event",
      "config": {
        "pageId": "page-17710071952151647",
        "scriptId": "e4c81360-59ca-4d22-9dee-d9d62f7f95e4",
        "elementId": "component-1771007210712-8027",
        "eventType": "onLoad",
        "scriptKey": "page-17710071952151647::component-1771007210712-8027::onLoad::e4c81360-59ca-4d22-9dee-d9d62f7f95e4",
        "scriptName": "dashboardout",
        "actionValue": "",
        "componentId": "component-1771007210712-8027",
        "inputVariables": [
          {
            "name": "dashboardData",
            "type": "object from http request",
            "source": "custom",
            "description": "Input variable: dashboardData"
          }
        ],
        "outputVariables": [],
        "inputVariableMappings": {
          "dashboardData": "{{httpResult}}"
        }
      }
    },
    "nodes": [
      {
        "id": "script-event-1771077760003",
        "nodeType": "script-event",
        "config": {
          "pageId": "page-17710071952151647",
          "scriptId": "e4c81360-59ca-4d22-9dee-d9d62f7f95e4",
          "elementId": "component-1771007210712-8027",
          "eventType": "onLoad",
          "scriptKey": "page-17710071952151647::component-1771007210712-8027::onLoad::e4c81360-59ca-4d22-9dee-d9d62f7f95e4",
          "scriptName": "dashboardout",
          "actionValue": "",
          "componentId": "component-1771007210712-8027",
          "inputVariables": [
            {
              "name": "dashboardData",
              "type": "object from http request",
              "source": "custom",
              "description": "Input variable: dashboardData"
            }
          ],
          "outputVariables": [],
          "inputVariableMappings": {
            "dashboardData": "{{httpResult}}"
          }
        }
      }
    ]
  },
  {
    "id": "flow_button-1771079809740_1771079854883",
    "nodeTypes": [
      "button",
      "http"
    ],
    "nodeCount": 2,
    "chainType": "linear",
    "startNode": {
      "id": "button-1771079809740",
      "nodeType": "button",
      "config": {
        "value": "",
        "buttonId": "id-17710796453655651",
        "attribute": "data-id",
        "buttonName": "Submit",
        "componentId": "id-17710796453655651",
        "componentType": "button"
      }
    },
    "endNode": {
      "id": "http-1770709018092",
      "nodeType": "http",
      "config": {
        "url": "https://loejhunuyscavxtsvnkl.supabase.co/rest/v1/rpc/get_crudsupabase_counts",
        "method": "GET",
        "headers": [
          {
            "id": "header-1770709055451",
            "name": "apikey",
            "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZWpodW51eXNjYXZ4dHN2bmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjUwNCwiZXhwIjoyMDczMjMyNTA0fQ.6ERQ8rwPpaQkAxp2mZ_S8TtCzZ65rznxVnXnZzkOfmU"
          },
          {
            "id": "header-1770709071810",
            "name": "Authorization",
            "value": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZWpodW51eXNjYXZ4dHN2bmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjUwNCwiZXhwIjoyMDczMjMyNTA0fQ.6ERQ8rwPpaQkAxp2mZ_S8TtCzZ65rznxVnXnZzkOfmU"
          }
        ],
        "timeout": 30000,
        "bodyType": "empty",
        "noteText": "",
        "chunkSize": 1024,
        "formFields": [],
        "retryDelay": 1000,
        "bodyContent": "",
        "contentType": "application/json",
        "queryParams": [],
        "validateSSL": true,
        "parseResponse": true,
        "retryAttempts": 3,
        "enableChunking": false,
        "resultVariable": "httpResult",
        "enableStreaming": false,
        "followRedirects": true,
        "maxResponseSize": 100
      }
    },
    "nodes": [
      {
        "id": "button-1771079809740",
        "nodeType": "button",
        "config": {
          "value": "",
          "buttonId": "id-17710796453655651",
          "attribute": "data-id",
          "buttonName": "Submit",
          "componentId": "id-17710796453655651",
          "componentType": "button"
        }
      },
      {
        "id": "http-1770709018092",
        "nodeType": "http",
        "config": {
          "url": "https://loejhunuyscavxtsvnkl.supabase.co/rest/v1/rpc/get_crudsupabase_counts",
          "method": "GET",
          "headers": [
            {
              "id": "header-1770709055451",
              "name": "apikey",
              "value": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZWpodW51eXNjYXZ4dHN2bmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjUwNCwiZXhwIjoyMDczMjMyNTA0fQ.6ERQ8rwPpaQkAxp2mZ_S8TtCzZ65rznxVnXnZzkOfmU"
            },
            {
              "id": "header-1770709071810",
              "name": "Authorization",
              "value": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxvZWpodW51eXNjYXZ4dHN2bmtsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjUwNCwiZXhwIjoyMDczMjMyNTA0fQ.6ERQ8rwPpaQkAxp2mZ_S8TtCzZ65rznxVnXnZzkOfmU"
            }
          ],
          "timeout": 30000,
          "bodyType": "empty",
          "noteText": "",
          "chunkSize": 1024,
          "formFields": [],
          "retryDelay": 1000,
          "bodyContent": "",
          "contentType": "application/json",
          "queryParams": [],
          "validateSSL": true,
          "parseResponse": true,
          "retryAttempts": 3,
          "enableChunking": false,
          "resultVariable": "httpResult",
          "enableStreaming": false,
          "followRedirects": true,
          "maxResponseSize": 100
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

