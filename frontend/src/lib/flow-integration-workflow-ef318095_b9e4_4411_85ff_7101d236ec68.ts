
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






const executeFlowChain_flow_trigger_583d14fc_1771079854736 = async (initialData: any = {}): Promise<FlowResult> => {
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
  
  flowResults._executionId = `flow_trigger_583d14fc_1771079854736_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

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
    flowResults.originalChainData = {"id":"flow_trigger-583d14fc_1771079854736","nodes":[{"id":"trigger-583d14fc","nodeType":"form","config":{"label":"Form Submit","formId":"auth-form","inputs":[],"componentId":"auth-form","triggerType":"form_submit","_auth_metadata":{"page_id":"page-17702830188969191","component_id":"nested-1771072119472-8257","cookie_names":["auth_token","user_id"],"tables_added":[],"auth_block_id":"id-17710708530174553","auth_block_label":"Basic Signup","auth_block_category":"Signup"},"suggestedApiBody":{},"suggestedApiEndpoint":"/api/form/auth-form"}},{"id":"validate-583d14fc","nodeType":"if-conditional","config":{"label":"Validate Data","condition":"{{form.email}} && {{form.password}} && {{form.confirm_password}} && {{form.password}} === {{form.confirm_password}}","validations":[{"type":"email","field":"email","required":true},{"type":"password","field":"password","required":true,"minLength":8},{"type":"match","field":"confirm_password","required":true,"matchField":"password"}]}},{"id":"create-user-583d14fc","nodeType":"http","config":{"url":"/api/auth/signup","body":{"email":"{{form.email}}","password":"{{form.password}}","confirm_password":"{{form.confirm_password}}"},"label":"Create User","method":"POST","headers":[],"bodyType":"empty","formFields":[],"bodyContent":"","contentType":"application/json","queryParams":[],"parseResponse":false,"resultVariable":"httpResult"}},{"id":"set-cookie-583d14fc","nodeType":"run-javascript","config":{"code":"// Set authentication cookies from previous HTTP node response\nconst createUserNodeId = 'create-user-583d14fc';\nconst authToken = workflowData[createUserNodeId]?.access_token || workflowData[createUserNodeId]?.token || workflowData[createUserNodeId]?.data?.access_token;\nconst userId = workflowData[createUserNodeId]?.user?.id || workflowData[createUserNodeId]?.user_id || workflowData[createUserNodeId]?.data?.user?.id;\n\nif (authToken && userId) {\n    // Set cookies using document.cookie (client-side)\n    const isSecure = window.location.protocol === 'https:';\n    document.cookie = `auth_token=${authToken}; path=/; max-age=86400; SameSite=Lax${isSecure ? '; Secure' : ''}`;\n    document.cookie = `user_id=${userId}; path=/; max-age=86400; SameSite=Lax${isSecure ? '; Secure' : ''}`;\n    \n    // Store in workflow data for next node\n    workflowData['auth_token'] = authToken;\n    workflowData['user_id'] = userId;\n}","label":"Set Auth Cookie","timeout":30,"description":"Custom JavaScript execution","inputVariables":[],"outputVariable":"jsResult"}},{"id":"redirect-583d14fc","nodeType":"navigate","config":{"url":"/dashboard","label":"Redirect","method":"push","nodeType":"navigate","noteText":"","targetUrl":"/login","selectedPageId":"page-17706133359975892","selectedPageUrl":"/login","navigationParams":"","selectedPageName":"Login"}}],"edges":[{"source":"trigger-583d14fc","target":"validate-583d14fc"},{"source":"validate-583d14fc","target":"create-user-583d14fc"},{"source":"create-user-583d14fc","target":"set-cookie-583d14fc"},{"source":"set-cookie-583d14fc","target":"redirect-583d14fc"}],"chainType":"conditional","dataFlow":[],"startNode":{"id":"trigger-583d14fc","nodeType":"form","config":{"label":"Form Submit","formId":"auth-form","inputs":[],"componentId":"auth-form","triggerType":"form_submit","_auth_metadata":{"page_id":"page-17702830188969191","component_id":"nested-1771072119472-8257","cookie_names":["auth_token","user_id"],"tables_added":[],"auth_block_id":"id-17710708530174553","auth_block_label":"Basic Signup","auth_block_category":"Signup"},"suggestedApiBody":{},"suggestedApiEndpoint":"/api/form/auth-form"}},"endNode":{"id":"redirect-583d14fc","nodeType":"navigate","config":{"url":"/dashboard","label":"Redirect","method":"push","nodeType":"navigate","noteText":"","targetUrl":"/login","selectedPageId":"page-17706133359975892","selectedPageUrl":"/login","navigationParams":"","selectedPageName":"Login"}}};

    // Declare all step result variables
    let step1Result: any;
    let step2Result: any;
    let step3Result: any;
    let step4Result: any;
    let step5Result: any;



    // Initialize enhanced data flow system
    if (!flowResults.nodeResults) flowResults.nodeResults = {};
    if (!flowResults.variables) flowResults.variables = {};
    if (!flowResults.inputs) flowResults.inputs = {};
    if (!flowResults.apiResponses) flowResults.apiResponses = {};
    if (!flowResults.formData) flowResults.formData = {};
    if (!flowResults.calculations) flowResults.calculations = {};
    if (!flowResults.aiResponses) flowResults.aiResponses = {};
    
    if (initialData.crossChainNodeResults) {
    
      flowResults.nodeResults = { ...flowResults.nodeResults, ...initialData.crossChainNodeResults };

    }
    if (initialData.crossChainFormData) {
     
      flowResults.formData = { ...flowResults.formData, ...initialData.crossChainFormData };
      Object.entries(initialData.crossChainFormData).forEach(([key, value]) => {
        flowResults[key] = value;
      });
    
    }
    if (initialData.inheritedData) {
      console.log('🔗 Importing inherited data for conditional flow');
      const inherited = initialData.inheritedData;
      if (inherited.nodeResults) {
        flowResults.nodeResults = { ...flowResults.nodeResults, ...inherited.nodeResults };
      }
      if (inherited.formData) {
        flowResults.formData = { ...flowResults.formData, ...inherited.formData };
        Object.entries(inherited.formData).forEach(([key, value]) => {
          flowResults[key] = value;
        });
      }
      if (inherited.currentResult !== undefined) {
        flowResults.currentResult = inherited.currentResult;
        currentResult = inherited.currentResult;
      }
    }
    
    
    // === STEP 1: FORM ===
    try {
      
    
      // Dynamic field mapping function
      const createDynamicFieldMapping = () => {
        const fieldMapping: Record<string, string> = {};
        
        // If we have form configuration, use it to create initial mapping
        
        const configuredFields = [];
        configuredFields.forEach((input: any) => {
          const inputId = input.id;
          const fieldName = input.label || input.name || input.placeholder || inputId;
          fieldMapping[inputId] = fieldName;
        });
        
        
                 // Try to extract field names from DOM labels dynamically
         try {
           const formElements = document.querySelectorAll('input, textarea, select');
           formElements.forEach((element: Element) => {
            const elementId = element.id || (element as any).getAttribute('data-component-id');
            if (elementId) {
              // Try to find associated label
              let fieldName = '';
              
              // Method 1: Look for label with 'for' attribute
              const associatedLabel = document.querySelector(`label[for="${elementId}"]`);
              if (associatedLabel) {
                fieldName = associatedLabel.textContent?.trim() || '';
              }
              
              // Method 2: Look for closest label (parent or sibling)
              if (!fieldName) {
                const parentLabel = element.closest('label');
                if (parentLabel) {
                  fieldName = parentLabel.textContent?.trim() || '';
                }
              }
              
              // Method 2.5: Look for label within the same parent container
              if (!fieldName) {
                const parent = element.parentElement;
                if (parent) {
                  const label = parent.querySelector('label');
                  if (label && label.textContent) {
                    fieldName = label.textContent.trim();
                  }
                }
              }
              
              // Method 3: Look for nearby text content
              if (!fieldName) {
                const parent = element.parentElement;
                if (parent) {
                  const textNodes = Array.from(parent.childNodes)
                    .filter(node => node.nodeType === 3) // Text nodes
                    .map(node => node.textContent?.trim())
                    .filter(text => text && text.length > 0);
                  if (textNodes.length > 0) {
                    fieldName = textNodes[0] || '';
                  }
                }
              }
              
              // Method 4: Use placeholder, name, or other attributes
              if (!fieldName) {
                fieldName = (element as any).placeholder || 
                          (element as any).getAttribute('name') || 
                          (element as any).getAttribute('aria-label') || 
                          elementId;
              }
              
              // Clean up field name
              if (fieldName) {
                // Remove common placeholder prefixes and clean up
                fieldName = fieldName.replace(/^(enter your?|enter|type|please enter|input)\s*/i, '').trim();
                fieldName = fieldName.replace(/[*:]/g, '').trim();
                fieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
                fieldMapping[elementId] = fieldName;
              }
            }
          });
        } catch (error) {
          console.warn('⚠️ Could not extract dynamic field mapping:', error);
        }
        
        return fieldMapping;
      };
      
      const fieldMapping = createDynamicFieldMapping();
      console.log('🗺️ Dynamic field mapping created:', fieldMapping);
    
    
    // Smart form data collection - use passed data if available, otherwise collect from DOM
    let formData: Record<string, any> = {};
    let apiPayload: Record<string, any> = {};
    
    // Dynamic field detection - don't rely on hardcoded field names
    // Instead, check if the input data contains form-like data structures
    let hasFormData = false;
    
    // Check multiple possible data structures with dynamic field detection
    if (typeof currentResult === 'object' && currentResult) {
      // Helper function to check if an object contains form-like data
      const isFormLikeData = (obj: any): boolean => {
        if (!obj || typeof obj !== 'object') return false;
        
        // Check for common form field patterns
        const keys = Object.keys(obj);
        const hasStringValues = keys.some(key => typeof obj[key] === 'string' && obj[key].length > 0);
        const hasBooleanValues = keys.some(key => typeof obj[key] === 'boolean');
        const hasFormStructure = keys.length > 0 && (hasStringValues || hasBooleanValues);
        
        // Additional checks for form-specific properties
        const hasFormFields = keys.some(key => 
          key.toLowerCase().includes('name') ||
          key.toLowerCase().includes('email') || 
          key.toLowerCase().includes('message') ||
          key.toLowerCase().includes('subject') ||
          key.toLowerCase().includes('phone') ||
          key.toLowerCase().includes('address') ||
          /^[a-z]+$/i.test(key) // Simple field names
        );
        
        return hasFormStructure && (hasFormFields || keys.length >= 2);
      };
      
      // PRIORITY 1: Check if fields are nested in formData property (HIGHEST PRIORITY)
      // This is the most common case when button passes form data
      if (currentResult.formData && isFormLikeData(currentResult.formData)) {
        formData = { ...currentResult.formData };
        hasFormData = true;
        console.log('📋 Using nested formData:', formData);
      }
      // PRIORITY 2: Check if there's an inputData property with form data
      else if (currentResult.inputData && isFormLikeData(currentResult.inputData)) {
        formData = { ...currentResult.inputData };
        hasFormData = true;
        console.log('📋 Using nested inputData:', formData);
      }
      // PRIORITY 3: Check if fields are at the top level (excluding metadata)
      else {
        const topLevelData = { ...currentResult };
        delete topLevelData._metadata;
        delete topLevelData.formId;
        delete topLevelData.buttonId;
        delete topLevelData.trigger;
        delete topLevelData.timestamp;
        delete topLevelData.clicked;
        delete topLevelData.inputData;
        delete topLevelData.formData;  // Also exclude formData to avoid false positives
        delete topLevelData.clickTimestamp;  // Exclude button click metadata
        
        if (isFormLikeData(topLevelData)) {
          formData = topLevelData;
          hasFormData = true;
          console.log('📋 Using top-level form data:', formData);
        }
        // PRIORITY 4: Check for any other nested objects that might contain form data
        else {
          for (const key of Object.keys(currentResult)) {
            const nestedObj = currentResult[key];
            if (isFormLikeData(nestedObj)) {
              formData = { ...nestedObj };
              hasFormData = true;
              console.log(`📋 Using nested form data from "${key}":`, formData);
              break;
            }
          }
        }
      }
    }
    
    if (hasFormData) {
      // Form data was found and extracted - now map to API field names
      Object.keys(formData).forEach(key => {
        const apiFieldName = fieldMapping[key] || key;
        apiPayload[apiFieldName] = formData[key];
      });
    } else {
      // Fallback: dynamically collect data from ALL form elements in the DOM
      console.log('📋 Dynamically collecting form data from DOM elements...');
      
      // Collect all form elements dynamically
      Object.keys(fieldMapping).forEach(elementId => {
        const fieldName = fieldMapping[elementId];
        
        // Try multiple selection strategies
        let element = document.getElementById(elementId);
        if (!element) {
          element = document.querySelector(`[data-component-id="${elementId}"]`);
        }
        if (!element) {
          element = document.querySelector(`[name="${elementId}"]`);
        }
        
        if (element) {
          let fieldValue: any;
          
          if (element.tagName.toLowerCase() === 'input') {
            const inputElement = element as HTMLInputElement;
            if (inputElement.type === 'checkbox' || inputElement.type === 'radio') {
              fieldValue = inputElement.checked;
            } else if (inputElement.type === 'number') {
              fieldValue = parseFloat(inputElement.value) || 0;
            } else {
              fieldValue = inputElement.value || '';
            }
          } else if (element.tagName.toLowerCase() === 'textarea') {
            const textareaElement = element as HTMLTextAreaElement;
            fieldValue = textareaElement.value || '';
          } else if (element.tagName.toLowerCase() === 'select') {
            const selectElement = element as HTMLSelectElement;
            fieldValue = selectElement.value || '';
          } else {
            // Generic element value extraction
            fieldValue = (element as any).value || (element as any).textContent || '';
          }
          
          // Normalize field name for backend compatibility
          let normalizedFieldName = fieldName.toLowerCase().replace(/ /g, '_');
          
          // Handle special checkbox fields
          if (fieldName.toLowerCase().includes('agree') || 
              fieldName.toLowerCase().includes('contact') || 
              fieldName.toLowerCase().includes('consent') ||
              fieldName.toLowerCase().includes('terms') ||
              fieldName.toLowerCase().includes('privacy') ||
              (typeof fieldValue === 'boolean' && fieldName.length > 10)) {
            normalizedFieldName = 'checkbox';
          }
          
          // Store both original and normalized field names
          formData[fieldName] = fieldValue;                 // Original field name
          formData[normalizedFieldName] = fieldValue;       // Normalized field name
          apiPayload[fieldName] = fieldValue;               // Original field name
          apiPayload[normalizedFieldName] = fieldValue;     // Normalized field name
          
          console.log(`📋 Collected "${fieldName}" -> "${normalizedFieldName}" from DOM (${element.tagName}): ${fieldValue}`);
        } else {
          console.warn(`⚠️ Form element not found: ${elementId}`);
        }
      });
      
             // Additional sweep: find any form elements that might have been missed
       const allFormElements = document.querySelectorAll('input, textarea, select');
       allFormElements.forEach((element: Element) => {
        const elementId = element.id || (element as any).getAttribute('data-component-id') || (element as any).getAttribute('name');
        
        if (elementId && !fieldMapping[elementId]) {
          // This element wasn't in our mapping, try to add it
          let fieldName = (element as any).placeholder || (element as any).getAttribute('aria-label') || elementId;
          fieldName = fieldName.replace(/[*:]/g, '').trim();
          fieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
          
          let fieldValue: any;
          if (element.tagName.toLowerCase() === 'input') {
            const inputElement = element as HTMLInputElement;
            if (inputElement.type === 'checkbox' || inputElement.type === 'radio') {
              fieldValue = inputElement.checked;
            } else {
              fieldValue = inputElement.value || '';
            }
          } else if (element.tagName.toLowerCase() === 'textarea') {
            fieldValue = (element as HTMLTextAreaElement).value || '';
          } else if (element.tagName.toLowerCase() === 'select') {
            fieldValue = (element as HTMLSelectElement).value || '';
          }
          
          if (fieldValue !== undefined && fieldValue !== '') {
            // Normalize field name for backend compatibility
            let normalizedFieldName = fieldName.toLowerCase().replace(/ /g, '_');
            
            // Handle special checkbox fields
            if (fieldName.toLowerCase().includes('agree') || 
                fieldName.toLowerCase().includes('contact') || 
                fieldName.toLowerCase().includes('consent') ||
                fieldName.toLowerCase().includes('terms') ||
                fieldName.toLowerCase().includes('privacy') ||
                (typeof fieldValue === 'boolean' && fieldName.length > 10)) {
              normalizedFieldName = 'checkbox';
            }
            
            // Store both original and normalized field names
            formData[fieldName] = fieldValue;                 // Original field name
            formData[normalizedFieldName] = fieldValue;       // Normalized field name
            apiPayload[fieldName] = fieldValue;               // Original field name
            apiPayload[normalizedFieldName] = fieldValue;     // Normalized field name
            
            console.log(`📋 Additional field collected "${fieldName}" -> "${normalizedFieldName}": ${fieldValue}`);
          }
        }
      });
    }
    
    // Create a standardized result structure that preserves the original field names
    // but also makes them accessible at the top level for template variables
    // CRITICAL FIX: Extract actual form fields while avoiding circular references
    const cleanFormData: Record<string, any> = {};
    
    // Extract form fields from the formData variable (which already contains the extracted data)
    // NOTE: At this point, 'formData' variable contains the actual form fields, not a wrapper
    // because we already extracted it from currentResult.formData in the data collection step above
    Object.keys(formData).forEach(key => {
      // Skip nested objects and metadata that could cause circular references
      if (key !== 'formData' && key !== 'inputData' && 
          key !== 'buttonId' && key !== 'formId' && 
          key !== 'clickTimestamp' && key !== 'trigger' && 
          !key.startsWith('_')) {
         cleanFormData[key] = (formData as Record<string, any>)[key];
        console.log(`📝 Extracted form field: ${key} = ${(formData as Record<string, any>)[key]}`);
      }
    });
    
    // CRITICAL FIX: Normalize field names and create form object in flowResults
    // This ensures form.email, form.password, etc. are accessible in conditions and HTTP nodes
    const normalizedFormData: Record<string, any> = {};
    Object.keys(cleanFormData).forEach(key => {
      const value = cleanFormData[key];
      
      // Normalize: "Email" -> "email", "Confirm Password" -> "confirm_password"
      const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
      
      // Store with normalized key (this is what form.email, form.password will use)
      if (!normalizedFormData[normalizedKey] || normalizedKey === key) {
        normalizedFormData[normalizedKey] = value;
      }
      
      // Also keep original key for backward compatibility
      if (key !== normalizedKey) {
        normalizedFormData[key] = value;
      }
    });
    
    // Create form object in flowResults for form.email, form.password access
    if (!flowResults.form) {
      flowResults.form = {};
    }
    Object.assign(flowResults.form, normalizedFormData);
    
    // Merge normalized fields into cleanFormData
    Object.assign(cleanFormData, normalizedFormData);
    
    console.log('✅ Clean form data extracted:', Object.keys(cleanFormData));
    console.log('✅ Normalized form data:', normalizedFormData);
    console.log('✅ Form object created in flowResults.form:', flowResults.form);
    
    step1Result = {
      formId: 'trigger-583d14fc',
      _metadata: {
        formId: 'trigger-583d14fc',
        formConfig: {"label":"Form Submit","formId":"auth-form","inputs":[],"componentId":"auth-form","triggerType":"form_submit","_auth_metadata":{"page_id":"page-17702830188969191","component_id":"nested-1771072119472-8257","cookie_names":["auth_token","user_id"],"tables_added":[],"auth_block_id":"id-17710708530174553","auth_block_label":"Basic Signup","auth_block_category":"Signup"},"suggestedApiBody":{},"suggestedApiEndpoint":"/api/form/auth-form"}
      },
      // Include CLEAN form fields at the top level for direct access in templates
      ...cleanFormData,
      // Also include API-ready payload
      ...apiPayload
    };
    
    // Store the form data in a way that makes it accessible to template variables
    // This ensures that both {{Name}} and {{formData.Name}} will work
    Object.keys(cleanFormData).forEach(key => {
      step1Result[key] = cleanFormData[key];
      
    });
    
    console.log('📝 Form processed with collected data:', step1Result);
    flowResults.formResult = step1Result;
    
    // CRITICAL FIX: Store form data in nodeResults for dataFlow.getByNodeId() access
    // This allows downstream nodes to access specific form fields using:
    // {{dataFlow.getByNodeId("form-123").name}} or {{dataFlow.getByNodeId("form-123").email}}
    if (typeof flowResults.nodeResults === 'undefined') {
      flowResults.nodeResults = {};
    }
    
    // Store the complete form data with all fields accessible by name
    // CRITICAL FIX: Store CLEAN form fields directly to avoid circular reference
    flowResults.nodeResults['trigger-583d14fc'] = {
      nodeId: 'trigger-583d14fc',
      nodeType: 'form',
      displayName: 'auth-form',
      stepNumber: 1,
      formId: 'trigger-583d14fc',
      // Store CLEAN form fields directly for access (avoids circular reference)
      ...cleanFormData
    };
    
    // Also make form data accessible at top level of flowResults for template variables
    Object.keys(cleanFormData).forEach(key => {
      flowResults[key] = cleanFormData[key];
    });
    
    // Store in formData collection for backward compatibility
    if (typeof flowResults.formData === 'undefined') {
      flowResults.formData = {};
    }
    Object.assign(flowResults.formData, cleanFormData);
    
    console.log('✅ Form data stored in nodeResults for dataFlow.getByNodeId() access');
    console.log('📊 Available form fields:', Object.keys(formData));
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['trigger-583d14fc'] = {
      nodeId: 'trigger-583d14fc',
      nodeType: 'form',
      stepNumber: 1,
      displayName: 'formSubmission_4738',
      data: step1Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // flowResults.formData['formSubmission_4738'] = step1Result; // ❌ Removed - causes circular ref
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['formSubmission_4738'] || typeof flowResults['formSubmission_4738'] === 'undefined') {
      flowResults['formSubmission_4738'] = step1Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
      currentResult = step1Result; // Update currentResult for next step
    } catch (stepError) {
      const stepErrorMessage = stepError instanceof Error ? stepError.message : String(stepError) || 'Unknown step error';
      console.error('❌ Error in step 1 (form):', stepError);
      flowErrors.push(`Step 1 (form): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step1Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'form',
        nodeId: 'trigger-583d14fc',
        stepNumber: 1
      };
      
      currentResult = step1Result; // Update currentResult even on error
    }
    

    // === STEP 2: IF-CONDITIONAL ===
    try {
      
    // === UNIVERSAL VALIDATION/CONDITIONAL LOGIC: validate-583d14fc ===
    
    // Node configuration (unique variable name)
    const config_validate_583d14fc = {"label":"Validate Data","condition":"{{form.email}} && {{form.password}} && {{form.confirm_password}} && {{form.password}} === {{form.confirm_password}}","validations":[{"type":"email","field":"email","required":true},{"type":"password","field":"password","required":true,"minLength":8},{"type":"match","field":"confirm_password","required":true,"matchField":"password"}]};
    
    step2Result = currentResult;
    let conditionResult_validate_583d14fc = false;
    let validationDetails_validate_583d14fc = {
      nodeId: 'validate-583d14fc',
      type: 'conditional-validation',
      tests: [],
      overallResult: false,
      executedAt: new Date().toISOString(),
      multipleRules: undefined as any,
      logicalOperator: 'AND',
      ruleResults: [] as Array<{ field: any; operator: any; value: any; fieldValue: string; result: boolean }>,
      error: null as any
    };
    
    try {
      // Enhanced condition extraction - handle multiple formats
      let leftOperand = config_validate_583d14fc.condition || config_validate_583d14fc.leftOperand || 'true';
      let rightOperand = config_validate_583d14fc.rightOperand || (config_validate_583d14fc as any).value || 'true';
      let operator = config_validate_583d14fc.operator || '==';
      
      console.log('🔍 Original condition config:', { leftOperand, rightOperand, operator });
      
      // CRITICAL FIX: Handle complex AND expressions (e.g., "{{form.email}} && {{form.password}} && {{form.password}} === {{form.confirm_password}}")
      if (typeof leftOperand === 'string' && leftOperand.includes('&&')) {
        console.log('🔧 Detected complex AND condition, splitting into parts:', leftOperand);
        
        // Split by && and trim each part
        const conditionParts = leftOperand.split('&&').map(part => part.trim()).filter(part => part.length > 0);
        console.log('📋 Condition parts:', conditionParts);
        
        const partResults: boolean[] = [];
        
        // Evaluate each part separately
        for (const part of conditionParts) {
          let partResult = false;
          
          // Check if this part is a comparison (contains operator)
          const operatorPatterns = [
            { pattern: /\s+!==\s+/, op: '!==' },
            { pattern: /\s+===\s+/, op: '===' },
            { pattern: /\s+!=\s+/, op: '!=' },
            { pattern: /\s+==\s+/, op: '==' },
            { pattern: /\s+>=\s+/, op: '>=' },
            { pattern: /\s+<=\s+/, op: '<=' },
            { pattern: /\s+>\s+/, op: '>' },
            { pattern: /\s+<\s+/, op: '<' }
          ];
          
          let foundOperator = null;
          let comparisonParts: string[] = [];
          
          for (const { pattern, op } of operatorPatterns) {
            if (pattern.test(part)) {
              foundOperator = op;
              comparisonParts = part.split(pattern);
              break;
            }
          }
          
          if (foundOperator && comparisonParts.length === 2) {
            // This is a comparison expression (e.g., "{{form.password}} === {{form.confirm_password}}")
            const leftPart = comparisonParts[0].trim();
            const rightPart = comparisonParts[1].trim();
            
            // Extract field names from both parts
            const leftTemplateMatch = leftPart.match(/\{\{([^}]+)\}\}/);
            const rightTemplateMatch = rightPart.match(/\{\{([^}]+)\}\}/);
            
            if (leftTemplateMatch && rightTemplateMatch) {
              const leftFieldName = leftTemplateMatch[1].trim();
              const rightFieldName = rightTemplateMatch[1].trim();
              
              // Get field values using dataFlow
              let leftValue: any = '[field not found]';
              let rightValue: any = '[field not found]';
              
              if (typeof dataFlow !== 'undefined') {
                if (leftFieldName.includes('dataFlow.')) {
                  // Already a dataFlow expression - evaluate it
                  try {
                    if (leftFieldName.includes('dataFlow.getByFieldName(')) {
                      const fieldNameMatch = leftFieldName.match(/dataFlow\.getByFieldName\(['"]([^'"]+)['"]\)/);
                      if (fieldNameMatch) {
                        leftValue = dataFlow.getByFieldName(fieldNameMatch[1]);
                      }
                    }
                  } catch (e) {
                    console.warn('Error evaluating left dataFlow expression:', e);
                  }
                } else {
                  leftValue = dataFlow.getByFieldName(leftFieldName);
                }
                
                if (rightFieldName.includes('dataFlow.')) {
                  try {
                    if (rightFieldName.includes('dataFlow.getByFieldName(')) {
                      const fieldNameMatch = rightFieldName.match(/dataFlow\.getByFieldName\(['"]([^'"]+)['"]\)/);
                      if (fieldNameMatch) {
                        rightValue = dataFlow.getByFieldName(fieldNameMatch[1]);
                      }
                    }
                  } catch (e) {
                    console.warn('Error evaluating right dataFlow expression:', e);
                  }
                } else {
                  rightValue = dataFlow.getByFieldName(rightFieldName);
                }
              }
              
              // Evaluate comparison
              switch (foundOperator) {
                case '===':
                case '==':
                  partResult = String(leftValue) === String(rightValue);
                  break;
                case '!==':
                case '!=':
                  partResult = String(leftValue) !== String(rightValue);
                  break;
                case '>=':
                  partResult = Number(leftValue) >= Number(rightValue);
                  break;
                case '<=':
                  partResult = Number(leftValue) <= Number(rightValue);
                  break;
                case '>':
                  partResult = Number(leftValue) > Number(rightValue);
                  break;
                case '<':
                  partResult = Number(leftValue) < Number(rightValue);
                  break;
                default:
                  partResult = Boolean(leftValue);
              }
            } else {
              // Couldn't parse comparison - treat as truthy check
              const templateMatch = part.match(/\{\{([^}]+)\}\}/);
              if (templateMatch) {
                const fieldName = templateMatch[1].trim();
                let fieldValue: any = false;
                
                if (typeof dataFlow !== 'undefined') {
                  if (fieldName.includes('dataFlow.')) {
                    try {
                      if (fieldName.includes('dataFlow.getByFieldName(')) {
                        const fieldNameMatch = fieldName.match(/dataFlow\.getByFieldName\(['"]([^'"]+)['"]\)/);
                        if (fieldNameMatch) {
                          fieldValue = dataFlow.getByFieldName(fieldNameMatch[1]);
                        }
                      }
                    } catch (e) {
                      console.warn('Error evaluating dataFlow expression:', e);
                    }
                  } else {
                    fieldValue = dataFlow.getByFieldName(fieldName);
                  }
                }
                
                partResult = Boolean(fieldValue);
              }
            }
          } else {
            // Simple template variable - truthy check (e.g., "{{form.email}}")
            const templateMatch = part.match(/\{\{([^}]+)\}\}/);
            if (templateMatch) {
              const fieldName = templateMatch[1].trim();
              let fieldValue: any = false;
              
              if (typeof dataFlow !== 'undefined') {
                if (fieldName.includes('dataFlow.')) {
                  try {
                    if (fieldName.includes('dataFlow.getByFieldName(')) {
                      const fieldNameMatch = fieldName.match(/dataFlow\.getByFieldName\(['"]([^'"]+)['"]\)/);
                      if (fieldNameMatch) {
                        fieldValue = dataFlow.getByFieldName(fieldNameMatch[1]);
                      }
                    }
                  } catch (e) {
                    console.warn('Error evaluating dataFlow expression:', e);
                  }
                } else {
                  fieldValue = dataFlow.getByFieldName(fieldName);
                }
              }
              
              partResult = Boolean(fieldValue);
            } else {
              // No template variable found - treat as literal boolean
              partResult = Boolean(part);
            }
          }
          
          partResults.push(partResult);
        }
        
        // Combine all results with AND logic
        conditionResult_validate_583d14fc = partResults.every(result => result === true);
        
        // Skip the rest of the condition parsing since we've already evaluated it
        // Set leftOperand and rightOperand to skip further processing
        leftOperand = conditionResult_validate_583d14fc ? 'true' : 'false';
        rightOperand = 'true';
        operator = '==';
      } else if (typeof leftOperand === 'string' && leftOperand.includes('{{') && leftOperand.includes('}}')) {
        // CRITICAL FIX: Handle full condition expressions dynamically - works for ANY field name and ANY value
        // Examples: "{{messageText}} == 'APPROVE'", "{{userName}} == 'John'", "{{age}} >= 18", etc.
        // If condition contains both template variables AND operators, parse it as a full expression
        // Check if the condition string already contains an operator (full expression)
        // Order matters: check longer operators first to avoid partial matches
        const operatorPatterns = [
          { pattern: /\s+contains\s+/i, op: 'contains' },
          { pattern: /\s+startsWith\s+/i, op: 'startsWith' },
          { pattern: /\s+endsWith\s+/i, op: 'endsWith' },
          { pattern: /\s+!==\s+/, op: '!==' },
          { pattern: /\s+===\s+/, op: '===' },
          { pattern: /\s+>=\s+/, op: '>=' },
          { pattern: /\s+<=\s+/, op: '<=' },
          { pattern: /\s+!=\s+/, op: '!=' },
          { pattern: /\s+==\s+/, op: '==' },
          { pattern: /\s+>\s+/, op: '>' },
          { pattern: /\s+<\s+/, op: '<' }
        ];
        
        let foundOperator = null;
        let conditionParts: string[] = [];
        
        // Try to find operator in the condition string
        for (const { pattern, op } of operatorPatterns) {
          if (pattern.test(leftOperand)) {
            foundOperator = op;
            conditionParts = leftOperand.split(pattern);
            break;
          }
        }
        
        // If we found an operator in the condition string, parse it as a full expression
        if (foundOperator && conditionParts.length === 2) {
          console.log('🎯 Detected full condition expression (dynamic):', leftOperand);
          
          const leftPart = conditionParts[0].trim();
          const rightPart = conditionParts[1].trim();
          
          // DYNAMIC FIELD EXTRACTION: Extract field name from left part (works for ANY field name)
          const templateMatch = leftPart.match(/\{\{([^}]+)\}\}/);
          if (templateMatch) {
            const fieldName = templateMatch[1].trim();
            console.log('📝 Extracted field name from full expression (dynamic):', fieldName);
            
            // Check if fieldName is already a dataFlow expression
            if (fieldName.includes('dataFlow.')) {
              leftOperand = fieldName;
              console.log('[SUCCESS] Using dataFlow expression directly:', fieldName);
            } else {
              // Convert ANY field name to dataFlow expression dynamically
              leftOperand = `dataFlow.getByFieldName('${fieldName}')`;
              console.log('[SUCCESS] Converted field name to dataFlow expression:', fieldName);
            }
          } else if (leftPart.includes('dataFlow.')) {
            // Already a dataFlow expression
            leftOperand = leftPart;
            console.log('[SUCCESS] Using existing dataFlow expression:', leftPart);
          } else {
            // Plain value (no template variable)
            leftOperand = leftPart;
            console.log('[SUCCESS] Using plain value as left operand:', leftPart);
          }
          
          // Use the detected operator from the condition string
          operator = foundOperator;
          console.log('📝 Detected operator:', operator);
          
          // DYNAMIC VALUE EXTRACTION: Clean right operand - handles ANY value (not just 'APPROVE')
          let cleanRightOperand = rightPart.trim();
          
          // Remove outer quotes (handles both single and double quotes, and nested quotes)
          // Handle multiple quote layers: ''value'' -> 'value' -> value
          let quoteRemoved = true;
          while (quoteRemoved) {
            quoteRemoved = false;
            if ((cleanRightOperand.startsWith("'") && cleanRightOperand.endsWith("'")) ||
                (cleanRightOperand.startsWith('"') && cleanRightOperand.endsWith('"'))) {
              cleanRightOperand = cleanRightOperand.slice(1, -1).trim();
              quoteRemoved = true;
            }
          }
          
          // Check if right part is also a template variable or dataFlow expression (dynamic)
          const rightTemplateMatch = cleanRightOperand.match(/\{\{([^}]+)\}\}/);
          if (rightTemplateMatch) {
            const rightFieldName = rightTemplateMatch[1].trim();
            console.log('📝 Right operand contains template variable:', rightFieldName);
            
            if (rightFieldName.includes('dataFlow.')) {
              rightOperand = rightFieldName;
              console.log('[SUCCESS] Using dataFlow expression directly for right operand:', rightFieldName);
            } else {
              // Convert ANY right field name to dataFlow expression dynamically
              rightOperand = `dataFlow.getByFieldName('${rightFieldName}')`;
              console.log('[SUCCESS] Converted right field name to dataFlow expression:', rightFieldName);
            }
          } else if (cleanRightOperand.includes('dataFlow.')) {
            // Already a dataFlow expression
            rightOperand = cleanRightOperand;
            console.log('[SUCCESS] Using existing dataFlow expression for right operand:', cleanRightOperand);
          } else {
            // DYNAMIC VALUE: Use the cleaned value as-is (works for ANY value: strings, numbers, booleans, etc.)
            rightOperand = cleanRightOperand;
            console.log('[SUCCESS] Using cleaned value for right operand (dynamic):', rightOperand);
          }
          
          console.log('[SUCCESS] Parsed full condition expression (dynamic):', { 
            originalCondition: leftOperand, 
            leftOperand, 
            operator, 
            rightOperand,
            fieldName: templateMatch ? templateMatch[1].trim() : 'N/A',
            value: rightOperand
          });
        } else {
          // Condition has template variable but no operator detected - log for debugging
          console.log('⚠️ Condition contains template variable but no operator detected:', leftOperand);
        }
      }
      
            // Handle rules-based conditions (from condition node UI) - Pre-processed at build time
      
      
      // Handle template variables in conditions ({{FieldName}}) - for cases not already parsed above
      // DYNAMIC HANDLING: Works for ANY field name and ANY value
      if (typeof leftOperand === 'string' && leftOperand.includes('{{') && leftOperand.includes('}}') && !leftOperand.includes('dataFlow.')) {
        console.log('🎯 Processing template variables in condition (dynamic fallback):', leftOperand);
        
        // Store original condition for operator extraction
        const originalCondition = leftOperand;
        
        // Extract all template variables and operators from the condition
        let processedCondition = originalCondition;
        
        // Handle various condition formats dynamically:
        // {{Field}} contains 'value'
        // {{Field}} == 'value'  
        // {{Field}} != 'value'
        // {{Field}} >= 5
        // {{anyField}} == 'anyValue'
        // etc.
        
        // Order matters: check longer operators first to avoid partial matches
        const operatorPatterns = [
          { pattern: /\s+contains\s+/i, op: 'contains' },
          { pattern: /\s+startsWith\s+/i, op: 'startsWith' },
          { pattern: /\s+endsWith\s+/i, op: 'endsWith' },
          { pattern: /\s+!==\s+/, op: '!==' },
          { pattern: /\s+===\s+/, op: '===' },
          { pattern: /\s+>=\s+/, op: '>=' },
          { pattern: /\s+<=\s+/, op: '<=' },
          { pattern: /\s+!=\s+/, op: '!=' },
          { pattern: /\s+==\s+/, op: '==' },
          { pattern: /\s+>\s+/, op: '>' },
          { pattern: /\s+<\s+/, op: '<' }
        ];
        
        // Find which operator is used
        let detectedOperator = '=='; // default
        let conditionParts: string[] = [];
        
        for (const { pattern, op } of operatorPatterns) {
          if (pattern.test(processedCondition)) {
            detectedOperator = op;
            conditionParts = processedCondition.split(pattern);
            break;
          }
        }
        
        if (conditionParts.length === 2) {
          // Successfully parsed condition with operator
          const leftPart = conditionParts[0].trim();
          const rightPart = conditionParts[1].trim();
          
          // DYNAMIC FIELD EXTRACTION: Extract field name from left part (works for ANY field name)
          const templateMatch = leftPart.match(/\{\{([^}]+)\}\}/);
          if (templateMatch) {
            const fieldName = templateMatch[1].trim();
            console.log('📝 Extracted field name (dynamic):', fieldName, 'operator:', detectedOperator);
            
            // CRITICAL FIX: Check if fieldName is already a dataFlow expression
            // If it contains dataFlow methods, use it directly instead of wrapping it
            if (fieldName.includes('dataFlow.')) {
              leftOperand = fieldName;
              console.log('[SUCCESS] Using dataFlow expression directly:', fieldName);
            } else {
              // Convert ANY field name to dataFlow expression dynamically
              leftOperand = `dataFlow.getByFieldName('${fieldName}')`;
              console.log('[SUCCESS] Converted field name to dataFlow expression (dynamic):', fieldName);
            }
            operator = detectedOperator;
            
            // DYNAMIC VALUE EXTRACTION: Handle ANY value properly - remove outer quotes but preserve content
            let cleanRightOperand = rightPart.trim();
            
            // Remove outer quotes (handles both single and double quotes, and nested quotes)
            // Handle multiple quote layers: ''value'' -> 'value' -> value
            let quoteRemoved = true;
            while (quoteRemoved) {
              quoteRemoved = false;
              if ((cleanRightOperand.startsWith("'") && cleanRightOperand.endsWith("'")) ||
                  (cleanRightOperand.startsWith('"') && cleanRightOperand.endsWith('"'))) {
                cleanRightOperand = cleanRightOperand.slice(1, -1).trim();
                quoteRemoved = true;
              }
            }
            
            // Check if right part is also a template variable (dynamic)
            const rightTemplateMatch = cleanRightOperand.match(/\{\{([^}]+)\}\}/);
            if (rightTemplateMatch) {
              const rightFieldName = rightTemplateMatch[1].trim();
              console.log('📝 Right operand contains template variable (dynamic):', rightFieldName);
              
              if (rightFieldName.includes('dataFlow.')) {
                rightOperand = rightFieldName;
              } else {
                rightOperand = `dataFlow.getByFieldName('${rightFieldName}')`;
              }
              console.log('[SUCCESS] Converted right operand template variable to dataFlow expression:', rightFieldName);
            } else if (cleanRightOperand.includes('dataFlow.')) {
              // Already a dataFlow expression
              rightOperand = cleanRightOperand;
              console.log('[SUCCESS] Using existing dataFlow expression for right operand:', cleanRightOperand);
            } else {
              // DYNAMIC VALUE: Use the cleaned value as-is (works for ANY value: strings, numbers, booleans, etc.)
              rightOperand = cleanRightOperand;
              console.log('[SUCCESS] Using cleaned value for right operand (dynamic):', rightOperand);
            }
            
            console.log('[SUCCESS] Parsed template condition (dynamic):', { field: fieldName, operator, value: rightOperand });
          }
        } else {
          // Simple template variable without operator (assume == true)
          const templateMatch = processedCondition.match(/\{\{([^}]+)\}\}/);
          if (templateMatch) {
            const fieldName = templateMatch[1].trim();
            console.log('📝 Simple template variable detected (dynamic):', fieldName);
            
            // CRITICAL FIX: Check if fieldName is already a dataFlow expression
            if (fieldName.includes('dataFlow.')) {
              leftOperand = fieldName;
              console.log('[SUCCESS] Using dataFlow expression directly:', fieldName);
            } else {
              // Convert ANY field name to dataFlow expression dynamically
              leftOperand = `dataFlow.getByFieldName('${fieldName}')`;
              console.log('[SUCCESS] Converted field name to dataFlow expression (dynamic):', fieldName);
            }
            operator = '==';
            rightOperand = 'true';
            
            console.log('[SUCCESS] Simple template variable (dynamic):', { field: fieldName, operator, value: rightOperand });
          }
        }
      }
      
      // DataFlow expression evaluation for left operand
      if (typeof leftOperand === 'string' && leftOperand.includes('dataFlow.')) {
        try {
          console.log('🔄 Evaluating dataFlow expression:', leftOperand);
          
          // Check if dataFlow is available
          if (typeof dataFlow !== 'undefined') {
            // Parse common dataFlow patterns safely
            if (leftOperand.includes('dataFlow.getByNodeId(')) {
              // Extract node ID and property access from pattern: dataFlow.getByNodeId('nodeId').PropertyName
              const nodeIdMatch = leftOperand.match(/dataFlow\.getByNodeId\(['"]([^'"]+)['"]\)(?:\.([a-zA-Z_$][a-zA-Z0-9_$]*))?/);
              if (nodeIdMatch) {
                const nodeId = nodeIdMatch[1];
                const propertyName = nodeIdMatch[2]; // Capture property name after function call (e.g., .Name)
                const result = dataFlow.getByNodeId(nodeId);
                
                console.log('🔍 DataFlow.getByNodeId(\'' + nodeId + '\') - Property: \'' + (propertyName || 'none') + '\'', result);
                
                if (result !== undefined && result !== null) {
                  // CRITICAL FIX: Check if user specified a property name (e.g., .Name, .Email)
                  if (propertyName) {
                    console.log('🔍 Accessing property \'' + propertyName + '\' from result');
                    
                    // Try direct property access first (most common for form fields)
                    if (typeof result === 'object' && result[propertyName] !== undefined) {
                      leftOperand = String(result[propertyName]);
                      console.log('✅ [SUCCESS] Found property \'' + propertyName + '\' directly:', leftOperand);
                    }
                    // Try in formData
                    else if (result.formData && result.formData[propertyName] !== undefined) {
                      leftOperand = String(result.formData[propertyName]);
                      console.log('✅ [SUCCESS] Found property \'' + propertyName + '\' in formData:', leftOperand);
                    }
                    // Try in inputData
                    else if (result.inputData && result.inputData[propertyName] !== undefined) {
                      leftOperand = String(result.inputData[propertyName]);
                      console.log('✅ [SUCCESS] Found property \'' + propertyName + '\' in inputData:', leftOperand);
                    }
                    // Try in data
                    else if (result.data && result.data[propertyName] !== undefined) {
                      leftOperand = String(result.data[propertyName]);
                      console.log('✅ [SUCCESS] Found property \'' + propertyName + '\' in data:', leftOperand);
                    }
                    else {
                      console.warn('⚠️ [WARNING] Property \'' + propertyName + '\' not found in result');
                      leftOperand = '[property not found]';
                    }
                  } else {
                    // No property specified - use auto-extraction (backward compatibility)
                    // CRITICAL FIX: Handle primitive values FIRST (strings, numbers, booleans)
                    // This is especially important for loop nodes that return primitive values like email addresses
                    if (typeof result !== 'object' || result === null) {
                      // Result is already a primitive (string/number/boolean) - use it directly
                      leftOperand = String(result);
                      console.log('[SUCCESS] DataFlow.getByNodeId evaluated (primitive):', leftOperand);
                    } else {
                      // Result is an object - try to extract primitive value
                      // CRITICAL FIX: For conditional nodes, prioritize conditionResult
                      if (result.conditionResult !== undefined) {
                        leftOperand = String(result.conditionResult);
                        console.log('[SUCCESS] DataFlow.getByNodeId evaluated (condition result):', leftOperand);
                      }
                      // CRITICAL FIX: For input nodes, try to get the actual input value
                      else if (typeof result.get === 'function') {
                        leftOperand = String(result.get());
                        console.log('[SUCCESS] DataFlow.getByNodeId evaluated (input value via get()):', leftOperand);
                      }
                      else if (result.currentValue !== undefined) {
                        leftOperand = String(result.currentValue);
                        console.log('[SUCCESS] DataFlow.getByNodeId evaluated (currentValue):', leftOperand);
                      }
                      else {
                        leftOperand = result.value || result.data || String(result);
                        console.log('[SUCCESS] DataFlow.getByNodeId evaluated (auto-extracted):', leftOperand);
                      }
                    }
                  }
                } else {
                  console.warn('[WARNING] DataFlow.getByNodeId returned undefined/null for nodeId:', nodeId);
                  leftOperand = '[data not available]';
                }
              }
            } else if (leftOperand.includes('dataFlow.current()')) {
              // Extract property access from pattern: dataFlow.current().PropertyName
              const propertyMatch = leftOperand.match(/dataFlow\.current\(\)(?:\.([a-zA-Z_$][a-zA-Z0-9_$]*))?/);
              const propertyName = propertyMatch?.[1];
              const result = dataFlow.current();
              
              if (result !== undefined && result !== null) {
                if (propertyName && typeof result === 'object') {
                  // User specified a property - access it directly
                  leftOperand = result[propertyName] !== undefined ? String(result[propertyName]) : '[property not found]';
                  console.log('[SUCCESS] DataFlow.current().' + propertyName + ' evaluated:', leftOperand);
                } else if (typeof result === 'object') {
                  leftOperand = result.currentValue || result.value || result.data || String(result);
                  console.log('[SUCCESS] DataFlow.current() evaluated (auto-extracted):', leftOperand);
                } else {
                  leftOperand = String(result);
                }
              } else {
                leftOperand = '[current data not available]';
              }
            } else if (leftOperand.includes('dataFlow.previous()')) {
              // Extract property access from pattern: dataFlow.previous().PropertyName
              const propertyMatch = leftOperand.match(/dataFlow\.previous\(\)(?:\.([a-zA-Z_$][a-zA-Z0-9_$]*))?/);
              const propertyName = propertyMatch?.[1];
              const result = dataFlow.previous();
              
              if (result !== undefined && result !== null) {
                if (propertyName && typeof result === 'object') {
                  // User specified a property - access it directly
                  leftOperand = result[propertyName] !== undefined ? String(result[propertyName]) : '[property not found]';
                  console.log('[SUCCESS] DataFlow.previous().' + propertyName + ' evaluated:', leftOperand);
                } else if (typeof result === 'object') {
                  leftOperand = result.currentValue || result.value || result.data || String(result);
                  console.log('[SUCCESS] DataFlow.previous() evaluated (auto-extracted):', leftOperand);
                } else {
                  leftOperand = String(result);
                }
              } else {
                leftOperand = '[previous data not available]';
              }
            } else if (leftOperand.includes('dataFlow.get(')) {
              // Extract variable name and property access from pattern: dataFlow.get('varName').PropertyName
              const getMatch = leftOperand.match(/dataFlow\.get\(['"]([^'"]+)['"]\)(?:\.([a-zA-Z_$][a-zA-Z0-9_$]*))?/);
              if (getMatch) {
                const varName = getMatch[1];
                const propertyName = getMatch[2];
                const result = dataFlow.get(varName);
                
                if (result !== undefined && result !== null) {
                  if (propertyName && typeof result === 'object') {
                    // User specified a property - access it directly
                    leftOperand = result[propertyName] !== undefined ? String(result[propertyName]) : '[property not found]';
                    console.log('[SUCCESS] DataFlow.get(\'' + varName + '\').' + propertyName + ' evaluated:', leftOperand);
                  } else if (typeof result === 'object') {
                    leftOperand = result.currentValue || result.value || result.data || String(result);
                    console.log('[SUCCESS] DataFlow.get(\'' + varName + '\') evaluated (auto-extracted):', leftOperand);
                  } else {
                    leftOperand = String(result);
                  }
                } else {
                  leftOperand = '[variable not available]';
                }
              }
            } else if (leftOperand.includes('dataFlow.getByFieldName(')) {
              // Extract field name from pattern: dataFlow.getByFieldName('fieldName')
              const fieldNameMatch = leftOperand.match(/dataFlow\.getByFieldName\(['"]([^'"]+)['"]\)/);
              if (fieldNameMatch) {
                const targetFieldName = fieldNameMatch[1];
                console.log('🔍 Evaluating dataFlow.getByFieldName() for:', targetFieldName);
                
                // CRITICAL FIX: Use the actual dataFlow.getByFieldName() method
                // This method checks variables, flowResults, and window.dataFlow first
                const fieldValue = dataFlow.getByFieldName(targetFieldName);
                
                if (fieldValue !== undefined) {
                  // CRITICAL FIX: Allow null values - convert null to string "null" for comparison
                  leftOperand = fieldValue === null ? 'null' : String(fieldValue);
                  console.log('[SUCCESS] DataFlow.getByFieldName() evaluated:', leftOperand, '(original value:', fieldValue, ')');
               } else {
                  leftOperand = '[field not found]';
                  console.warn('[WARNING] DataFlow.getByFieldName() returned undefined for:', targetFieldName);
                }
              }
            }
          } else {
            console.warn('[WARNING] dataFlow not available in scope');
            leftOperand = '[dataFlow not available]';
          }
        } catch (error) {
          console.error('❌ Error evaluating dataFlow expression:', error);
          leftOperand = '[dataFlow evaluation error]';
        }
      }
      
      // Handle template variables in right operand (if not already a dataFlow expression)
      // DYNAMIC HANDLING: Works for ANY field name in the right operand
      if (typeof rightOperand === 'string' && rightOperand.includes('{{') && rightOperand.includes('}}') && !rightOperand.includes('dataFlow.')) {
        console.log('🎯 Processing template variables in right operand (dynamic):', rightOperand);
        
        const templateMatch = rightOperand.match(/\{\{([^}]+)\}\}/);
        if (templateMatch) {
          const fieldName = templateMatch[1].trim();
          console.log('📝 Extracted field name from right operand (dynamic):', fieldName);
          
          // Check if fieldName is already a dataFlow expression
          if (fieldName.includes('dataFlow.')) {
            rightOperand = fieldName;
            console.log('[SUCCESS] Using dataFlow expression directly in right operand (dynamic):', fieldName);
          } else {
            // Convert ANY field name to dataFlow expression dynamically
            rightOperand = `dataFlow.getByFieldName('${fieldName}')`;
            console.log('[SUCCESS] Converted right operand template variable to dataFlow expression (dynamic):', fieldName);
          }
        }
      }
      
      // DataFlow expression evaluation for right operand
      if (typeof rightOperand === 'string' && rightOperand.includes('dataFlow.')) {
        try {
          console.log('🔄 Evaluating dataFlow expression:', rightOperand);
          
          // Check if dataFlow is available
          if (typeof dataFlow !== 'undefined') {
            // Parse common dataFlow patterns safely
            if (rightOperand.includes('dataFlow.getByNodeId(')) {
              // Extract node ID and property access from pattern: dataFlow.getByNodeId('nodeId').PropertyName
              const nodeIdMatch = rightOperand.match(/dataFlow\.getByNodeId\(['"]([^'"]+)['"]\)(?:\.([a-zA-Z_$][a-zA-Z0-9_$]*))?/);
              if (nodeIdMatch) {
                const nodeId = nodeIdMatch[1];
                const propertyName = nodeIdMatch[2]; // Capture property name after function call (e.g., .Name)
                const result = dataFlow.getByNodeId(nodeId);
                
                console.log('🔍 DataFlow.getByNodeId(\'' + nodeId + '\') [RIGHT] - Property: \'' + (propertyName || 'none') + '\'', result);
                
                if (result !== undefined && result !== null) {
                  // CRITICAL FIX: Check if user specified a property name (e.g., .Name, .Email)
                  if (propertyName) {
                    console.log('🔍 Accessing property \'' + propertyName + '\' from result [RIGHT]');
                    
                    // Try direct property access first (most common for form fields)
                    if (typeof result === 'object' && result[propertyName] !== undefined) {
                      rightOperand = String(result[propertyName]);
                      console.log('✅ [SUCCESS] Found property \'' + propertyName + '\' directly:', rightOperand);
                    }
                    // Try in formData
                    else if (result.formData && result.formData[propertyName] !== undefined) {
                      rightOperand = String(result.formData[propertyName]);
                      console.log('✅ [SUCCESS] Found property \'' + propertyName + '\' in formData:', rightOperand);
                    }
                    // Try in inputData
                    else if (result.inputData && result.inputData[propertyName] !== undefined) {
                      rightOperand = String(result.inputData[propertyName]);
                      console.log('✅ [SUCCESS] Found property \'' + propertyName + '\' in inputData:', rightOperand);
                    }
                    // Try in data
                    else if (result.data && result.data[propertyName] !== undefined) {
                      rightOperand = String(result.data[propertyName]);
                      console.log('✅ [SUCCESS] Found property \'' + propertyName + '\' in data:', rightOperand);
                    }
                    else {
                      console.warn('⚠️ [WARNING] Property \'' + propertyName + '\' not found in result [RIGHT]');
                      rightOperand = '[property not found]';
                    }
                  } else {
                    // No property specified - use auto-extraction (backward compatibility)
                    // CRITICAL FIX: Handle primitive values FIRST (strings, numbers, booleans)
                    // This is especially important for loop nodes that return primitive values like email addresses
                    if (typeof result !== 'object' || result === null) {
                      // Result is already a primitive (string/number/boolean) - use it directly
                      rightOperand = String(result);
                      console.log('[SUCCESS] DataFlow.getByNodeId evaluated (primitive) [RIGHT]:', rightOperand);
                    } else {
                      // Result is an object - try to extract primitive value
                      rightOperand = result.currentValue || result.value || result.data || String(result);
                      console.log('[SUCCESS] DataFlow.getByNodeId evaluated (auto-extracted) [RIGHT]:', rightOperand);
                    }
                  }
                } else {
                  console.warn('[WARNING] DataFlow.getByNodeId returned undefined/null for nodeId:', nodeId);
                  rightOperand = '[data not available]';
                }
              }
            } else if (rightOperand.includes('dataFlow.current()')) {
              // Extract property access from pattern: dataFlow.current().PropertyName
              const propertyMatch = rightOperand.match(/dataFlow\.current\(\)(?:\.([a-zA-Z_$][a-zA-Z0-9_$]*))?/);
              const propertyName = propertyMatch?.[1];
              const result = dataFlow.current();
              
              if (result !== undefined && result !== null) {
                if (propertyName && typeof result === 'object') {
                  // User specified a property - access it directly
                  rightOperand = result[propertyName] !== undefined ? String(result[propertyName]) : '[property not found]';
                  console.log('[SUCCESS] DataFlow.current().' + propertyName + ' evaluated [RIGHT]:', rightOperand);
                } else if (typeof result === 'object') {
                  rightOperand = result.currentValue || result.value || result.data || String(result);
                  console.log('[SUCCESS] DataFlow.current() evaluated (auto-extracted) [RIGHT]:', rightOperand);
                } else {
                  rightOperand = String(result);
                }
              } else {
                rightOperand = '[current data not available]';
              }
            } else if (rightOperand.includes('dataFlow.previous()')) {
              // Extract property access from pattern: dataFlow.previous().PropertyName
              const propertyMatch = rightOperand.match(/dataFlow\.previous\(\)(?:\.([a-zA-Z_$][a-zA-Z0-9_$]*))?/);
              const propertyName = propertyMatch?.[1];
              const result = dataFlow.previous();
              
              if (result !== undefined && result !== null) {
                if (propertyName && typeof result === 'object') {
                  // User specified a property - access it directly
                  rightOperand = result[propertyName] !== undefined ? String(result[propertyName]) : '[property not found]';
                  console.log('[SUCCESS] DataFlow.previous().' + propertyName + ' evaluated [RIGHT]:', rightOperand);
                } else if (typeof result === 'object') {
                  rightOperand = result.currentValue || result.value || result.data || String(result);
                  console.log('[SUCCESS] DataFlow.previous() evaluated (auto-extracted) [RIGHT]:', rightOperand);
                } else {
                  rightOperand = String(result);
                }
              } else {
                rightOperand = '[previous data not available]';
              }
            } else if (rightOperand.includes('dataFlow.get(')) {
              // Extract variable name and property access from pattern: dataFlow.get('varName').PropertyName
              const getMatch = rightOperand.match(/dataFlow\.get\(['"]([^'"]+)['"]\)(?:\.([a-zA-Z_$][a-zA-Z0-9_$]*))?/);
              if (getMatch) {
                const varName = getMatch[1];
                const propertyName = getMatch[2];
                const result = dataFlow.get(varName);
                
                if (result !== undefined && result !== null) {
                  if (propertyName && typeof result === 'object') {
                    // User specified a property - access it directly
                    rightOperand = result[propertyName] !== undefined ? String(result[propertyName]) : '[property not found]';
                    console.log('[SUCCESS] DataFlow.get(\'' + varName + '\').' + propertyName + ' evaluated [RIGHT]:', rightOperand);
                  } else if (typeof result === 'object') {
                    rightOperand = result.currentValue || result.value || result.data || String(result);
                    console.log('[SUCCESS] DataFlow.get(\'' + varName + '\') evaluated (auto-extracted) [RIGHT]:', rightOperand);
                  } else {
                    rightOperand = String(result);
                  }
                } else {
                  rightOperand = '[variable not available]';
                }
              }
            } else if (rightOperand.includes('dataFlow.getByFieldName(')) {
              // Extract field name from pattern: dataFlow.getByFieldName('fieldName')
              const fieldNameMatch = rightOperand.match(/dataFlow\.getByFieldName\(['"]([^'"]+)['"]\)/);
              if (fieldNameMatch) {
                const fieldName = fieldNameMatch[1];
                console.log('🔍 Evaluating dataFlow.getByFieldName() for right operand:', fieldName);
                
                // CRITICAL FIX: Use the actual dataFlow.getByFieldName() method
                // This method checks variables, flowResults, and window.dataFlow first
                const fieldValue = dataFlow.getByFieldName(fieldName);
                
                 if (fieldValue !== undefined) {
                  // CRITICAL FIX: Allow null values - convert null to string "null" for comparison
                  rightOperand = fieldValue === null ? 'null' : String(fieldValue);
                  console.log('[SUCCESS] DataFlow.getByFieldName() evaluated for right operand:', rightOperand, '(original value:', fieldValue, ')');
                } else {
                  rightOperand = '[field not found]';
                  console.warn('[WARNING] DataFlow.getByFieldName() returned undefined for right operand:', fieldName);
                }
              }
            }
          } else {
            console.warn('[WARNING] dataFlow not available in scope');
            rightOperand = '[dataFlow not available]';
          }
        } catch (error) {
          console.error('❌ Error evaluating dataFlow expression:', error);
          rightOperand = '[dataFlow evaluation error]';
        }
      }
      
      // Simple condition evaluation
      const condition = leftOperand;
      // Use the operator we determined earlier
       let value = rightOperand;
      if (typeof value === 'string' && value.toUpperCase() === 'NULL') {
        value = 'null';
      }
      
      console.log('🔍 Evaluating condition:', { condition, operator, value });
      
      // Evaluate the condition based on operator
      if (operator === 'compound' && validationDetails_validate_583d14fc.multipleRules) {
        // Handle multiple rules with logical operators
        console.log('🔧 Evaluating compound condition with', validationDetails_validate_583d14fc.multipleRules.length, 'rules');
        
        const ruleResults = [];
        
        for (const rule of validationDetails_validate_583d14fc.multipleRules) {
          // Get field value
          let fieldValue = '[field not found]';
          
          // Use the same field resolution logic
          if (flowResults.nodeResults) {
            for (const [nodeId, nodeResult] of Object.entries(flowResults.nodeResults)) {
              if ((nodeResult as any).nodeType === 'input') {
                const inputData = (nodeResult as any).data;
                
                // Check if this input matches the field name
                let isFieldMatch = false;
                if (inputData) {
                  const inputName = inputData.inputName || inputData.name || inputData.fieldName;
                  if (inputName && inputName.toLowerCase() === rule.field.toLowerCase()) {
                    isFieldMatch = true;
                  }
                }
                
                if (isFieldMatch && inputData && inputData.inputHandler) {
                  try {
                    fieldValue = String(inputData.inputHandler.get() || '');
                    break;
                  } catch (error) {
                    console.warn('[WARNING] Error getting input value for rule:', error);
                  }
                }
              }
            }
          }
          
          // Evaluate this rule
          let ruleResult = false;
          switch (rule.operator) {
            case 'contains':
              ruleResult = String(fieldValue).includes(String(rule.value));
              break;
            case 'startsWith':
              ruleResult = String(fieldValue).startsWith(String(rule.value));
              break;
            case 'endsWith':
              ruleResult = String(fieldValue).endsWith(String(rule.value));
              break;
            case '==':
              ruleResult = fieldValue == rule.value;
              break;
            case '!=':
              ruleResult = fieldValue != rule.value;
              break;
            case '>=':
              ruleResult = Number(fieldValue) >= Number(rule.value);
              break;
            case '<=':
              ruleResult = Number(fieldValue) <= Number(rule.value);
              break;
            case '>':
              ruleResult = Number(fieldValue) > Number(rule.value);
              break;
            case '<':
              ruleResult = Number(fieldValue) < Number(rule.value);
              break;
            default:
              ruleResult = Boolean(fieldValue);
          }
          
          ruleResults.push({
            field: rule.field,
            operator: rule.operator,
            value: rule.value,
            fieldValue: fieldValue,
            result: ruleResult
          });
        }
        
        // Combine results based on logical operator
        if (validationDetails_validate_583d14fc.logicalOperator === 'OR' || validationDetails_validate_583d14fc.logicalOperator === '||') {
          conditionResult_validate_583d14fc = ruleResults.some(r => r.result);
        } else {
          // Default to AND
          conditionResult_validate_583d14fc = ruleResults.every(r => r.result);
        }
        
        validationDetails_validate_583d14fc.ruleResults = ruleResults;
        
      } else {
        // Single condition evaluation
        switch (operator) {
          case '>=':
            conditionResult_validate_583d14fc = Number(condition) >= Number(value);
            break;
          case '<=':
            conditionResult_validate_583d14fc = Number(condition) <= Number(value);
            break;
          case '>':
            conditionResult_validate_583d14fc = Number(condition) > Number(value);
            break;
          case '<':
            conditionResult_validate_583d14fc = Number(condition) < Number(value);
            break;
          case '==':
          case '===':
            conditionResult_validate_583d14fc = condition == value;
            break;
          case '!=':
          case '!==':
            conditionResult_validate_583d14fc = condition != value;
            break;
          case 'contains':
            conditionResult_validate_583d14fc = String(condition).includes(String(value));
            break;
          case 'startsWith':
            conditionResult_validate_583d14fc = String(condition).startsWith(String(value));
            break;
          case 'endsWith':
            conditionResult_validate_583d14fc = String(condition).endsWith(String(value));
            break;
          default:
            // For unknown operators, try direct evaluation
            conditionResult_validate_583d14fc = Boolean(condition);
        }
      }
      
      console.log('[SUCCESS] Validation completed. Result:', conditionResult_validate_583d14fc);
      console.log('📋 Validation details:', validationDetails_validate_583d14fc);
      
      step2Result = { 
        ...currentResult, 
        conditionResult: conditionResult_validate_583d14fc,
        validationDetails: validationDetails_validate_583d14fc,
        branch: conditionResult_validate_583d14fc ? 'true' : 'false',
        validate_583d14fc_result: conditionResult_validate_583d14fc
      };
      
    } catch (error) {
      console.error('❌ Error during validation:', error);
      conditionResult_validate_583d14fc = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      validationDetails_validate_583d14fc.error = errorMessage;
      step2Result = { 
        ...currentResult, 
        conditionResult: false,
        validationDetails: validationDetails_validate_583d14fc,
        branch: 'false',
        error: errorMessage
      };
    }
    
    // Store results in flow context with unique names
    flowResults.conditionResult_validate_583d14fc = conditionResult_validate_583d14fc;
    flowResults.validationDetails_validate_583d14fc = validationDetails_validate_583d14fc;
    flowResults.validate_583d14fc = step2Result;
    
    console.log('🔀 Conditional validation result:', step2Result);
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['validate-583d14fc'] = {
      nodeId: 'validate-583d14fc',
      nodeType: 'if-conditional',
      stepNumber: 2,
      displayName: 'condition_4740',
      data: step2Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for if-conditional
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['condition_4740'] || typeof flowResults['condition_4740'] === 'undefined') {
      flowResults['condition_4740'] = step2Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
      currentResult = step2Result; // Update currentResult for next step
    } catch (stepError) {
      const stepErrorMessage = stepError instanceof Error ? stepError.message : String(stepError) || 'Unknown step error';
      console.error('❌ Error in step 2 (if-conditional):', stepError);
      flowErrors.push(`Step 2 (if-conditional): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step2Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'if-conditional',
        nodeId: 'validate-583d14fc',
        stepNumber: 2
      };
      
      currentResult = step2Result; // Update currentResult even on error
    }
    

    console.log('🔀 Evaluating conditional result for branching...');
    console.log('📊 Condition result:', step2Result.conditionResult);
    
    if (step2Result.conditionResult) {
      console.log('✅ Taking TRUE branch');

    // === STEP 3: HTTP ===
    try {
      
    // === HTTP REQUEST (POST) ===
    if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        console.info('🌐 Processing POST request');
      }
    
    step3Result = currentResult;
    
    let fullUrl_create_user_583d14fc = '/api/auth/signup';
    let responseStatus_create_user_583d14fc: number = 0;
    let responseStatusText_create_user_583d14fc: string = '';
    let responseHeaders_create_user_583d14fc: Record<string, string> = {};
    let responseData_create_user_583d14fc: any = null;
    let lastError_create_user_583d14fc: any = null;
    
    try {
      if (!fullUrl_create_user_583d14fc || fullUrl_create_user_583d14fc.trim() === '') {
        throw new Error('URL is required for HTTP requests');
      }
      
      // Show loader before starting API request
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('apiLoadingStart', { 
          detail: { endpoint: '/api/auth/signup', method: 'POST', nodeId: 'create-user-583d14fc' } 
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
      
      fullUrl_create_user_583d14fc = TemplateExpressionEngine.processTemplate(fullUrl_create_user_583d14fc, urlTemplateContext, {
        allowComplexExpressions: true,
        allowFunctions: true,
        securityLevel: 'moderate',
        returnType: 'string',
        fallbackValue: fullUrl_create_user_583d14fc
      });
      
      // Ensure URL has a protocol
      if (!fullUrl_create_user_583d14fc.startsWith('http://') && !fullUrl_create_user_583d14fc.startsWith('https://')) {
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000';
        fullUrl_create_user_583d14fc = fullUrl_create_user_583d14fc.startsWith('/') ? `${apiBaseUrl}${fullUrl_create_user_583d14fc}` : `${apiBaseUrl}/${fullUrl_create_user_583d14fc}`;
      }
      
      // No query parameters specified
      
      // Prepare headers with proper typing
      const headers: Record<string, string> = {};
      // No headers specified
      
      // Prepare request options with proper typing
      const requestOptions: RequestInit = {
        method: 'POST',
        headers: headers
      };
      
      // Add request body for non-GET requests
      
      // CRITICAL FIX: Process body template from config if available
      if (['POST', 'PUT', 'PATCH'].includes('POST')) {
        try {
          let requestBody: any = null;
          
          // Extract HTTP node config from originalChainData
          let httpNodeConfig: any = null;
          if (flowResults.originalChainData && flowResults.originalChainData.nodes) {
            const httpNode = flowResults.originalChainData.nodes.find((node: any) => node.id === 'create-user-583d14fc');
            if (httpNode && httpNode.config) {
              httpNodeConfig = httpNode.config;
            }
          }
          // Fallback to passed config if not found
          if (!httpNodeConfig) {
            httpNodeConfig = {"url":"/api/auth/signup","body":{"email":"{{form.email}}","password":"{{form.password}}","confirm_password":"{{form.confirm_password}}"},"label":"Create User","method":"POST","headers":[],"bodyType":"empty","formFields":[],"bodyContent":"","contentType":"application/json","queryParams":[],"parseResponse":false,"resultVariable":"httpResult"};
          }
          
          // Track template processing state for fallback logic
          let templateProcessingFailed = false;
          let templateProcessingPartial = false;
          
          // CRITICAL FIX: Process body template from config if available
          if (httpNodeConfig.body && typeof httpNodeConfig.body === 'object' && Object.keys(httpNodeConfig.body).length > 0) {
            // Build comprehensive template context with multiple access patterns
            const bodyTemplateContext: any = {
              dataFlow: dataFlow,
              flowResults: flowResults,
              form: flowResults.form || {},
              ...flowResults
            };
            
            // Explicitly include form object for form.email access
            if (flowResults.form) {
              bodyTemplateContext.form = flowResults.form;
              // Also add form fields at top level for direct access
              Object.keys(flowResults.form).forEach(key => {
                if (!key.startsWith('_')) {
                  bodyTemplateContext[key] = flowResults.form[key];
                }
              });
            }
            
            // Include formData collection for fallback access
            if (flowResults.formData) {
              Object.keys(flowResults.formData).forEach(key => {
                if (!key.startsWith('_') && bodyTemplateContext[key] === undefined) {
                  bodyTemplateContext[key] = flowResults.formData[key];
                }
              });
            }
            
            // Process body template with enhanced fallback strategies
            const processedBody: any = {};
            
            Object.keys(httpNodeConfig.body).forEach(key => {
              const value = httpNodeConfig.body[key];
              if (typeof value === 'string' && value.includes('{{')) {
                let processedValue: any = null;
                
                // Process template expression using TemplateExpressionEngine if available
                if (typeof TemplateExpressionEngine !== 'undefined' && TemplateExpressionEngine.processTemplate) {
                  try {
                    processedValue = TemplateExpressionEngine.processTemplate(value, bodyTemplateContext, {
                      allowComplexExpressions: true,
                      allowFunctions: true,
                      securityLevel: 'moderate',
                      returnType: 'string',
                      fallbackValue: undefined // Don't use empty string as fallback
                    });
                    // If TemplateExpressionEngine returns empty string, it means variable not found
                    if (processedValue === '' || processedValue === undefined) {
                      processedValue = null;
                    }
                  } catch (error) {
                    console.warn('🌐 TemplateExpressionEngine processing failed for', key, ':', error);
                    processedValue = null;
                  }
                }
                
                // Enhanced fallback: try multiple strategies if TemplateExpressionEngine failed or unavailable
                if (processedValue === null || processedValue === undefined) {
                  processedValue = value.replace(/\{\{([^}]+)\}\}/g, (match, variable) => {
                    const trimmedVar = variable.trim();
                    let resolvedValue: any = undefined;
                    
                    // Strategy 1: Try form.fieldName pattern (e.g., form.email)
                    if (trimmedVar.startsWith('form.')) {
                      const formField = trimmedVar.substring(5);
                      // Try exact match first
                      if (bodyTemplateContext.form && bodyTemplateContext.form[formField] !== undefined) {
                        resolvedValue = bodyTemplateContext.form[formField];
                      }
                      // Try normalized match (email, Email, EMAIL)
                      if (resolvedValue === undefined && bodyTemplateContext.form) {
                        const normalizedField = formField.toLowerCase().replace(/\s+/g, '_');
                        for (const key in bodyTemplateContext.form) {
                          const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
                          if (normalizedKey === normalizedField) {
                            resolvedValue = bodyTemplateContext.form[key];
                            break;
                          }
                        }
                      }
                    }
                    
                    // Strategy 2: Try direct access in template context
                    if (resolvedValue === undefined && bodyTemplateContext[trimmedVar] !== undefined) {
                      resolvedValue = bodyTemplateContext[trimmedVar];
                    }
                    
                    // Strategy 3: Try case-insensitive direct access
                    if (resolvedValue === undefined) {
                      const lowerVar = trimmedVar.toLowerCase();
                      for (const ctxKey in bodyTemplateContext) {
                        if (ctxKey.toLowerCase() === lowerVar) {
                          resolvedValue = bodyTemplateContext[ctxKey];
                          break;
                        }
                      }
                    }
                    
                    // Strategy 4: Try dataFlow.getByFieldName (handles form.fieldName pattern)
                    if (resolvedValue === undefined && dataFlow && dataFlow.getByFieldName) {
                      try {
                        resolvedValue = dataFlow.getByFieldName(trimmedVar);
                      } catch (error) {
                        // Ignore errors from getByFieldName
                      }
                    }
                    
                    // Strategy 5: Try accessing from currentResult or inputData
                    if (resolvedValue === undefined) {
                      const formDataSource = currentResult || currentResult || {};
                      if (formDataSource && typeof formDataSource === 'object') {
                        // Try direct access
                        if (formDataSource[trimmedVar] !== undefined) {
                          resolvedValue = formDataSource[trimmedVar];
                        }
                        // Try form property
                        else if (formDataSource.form && formDataSource.form[trimmedVar] !== undefined) {
                          resolvedValue = formDataSource.form[trimmedVar];
                        }
                        // Try normalized access
                        else {
                          const normalizedVar = trimmedVar.toLowerCase().replace(/\s+/g, '_');
                          for (const key in formDataSource) {
                            const normalizedKey = key.toLowerCase().replace(/\s+/g, '_');
                            if (normalizedKey === normalizedVar && !key.startsWith('_')) {
                              resolvedValue = formDataSource[key];
                              break;
                            }
                          }
                        }
                      }
                    }
                    
                    // Return resolved value or keep original template if not found
                    return resolvedValue !== undefined && resolvedValue !== null ? String(resolvedValue) : match;
                  });
                  
                  // Check if template was fully resolved (no remaining {{}})
                  if (processedValue.includes('{{')) {
                    templateProcessingPartial = true;
                    // If this is a critical field, mark as failed
                    if (key === 'email' || key === 'password') {
                      templateProcessingFailed = true;
                    }
                  }
                }
                
                processedBody[key] = processedValue;
              } else {
                processedBody[key] = value;
              }
            });
            
            // Use processed body if:
            // 1. All values are non-empty, OR
            // 2. At least some values are non-empty and we can fallback for empty ones
            const hasNonEmptyValues = Object.values(processedBody).some(v => v !== '' && v !== null && v !== undefined);
            const hasEmptyValues = Object.values(processedBody).some(v => v === '' || v === null || v === undefined);
            
            // If we have some values but template processing was partial, still use it but allow fallback
            if (hasNonEmptyValues && !templateProcessingFailed) {
              // Remove empty values to allow fallback to fill them
              const cleanedBody: any = {};
              Object.keys(processedBody).forEach(key => {
                const val = processedBody[key];
                if (val !== '' && val !== null && val !== undefined && !String(val).includes('{{')) {
                  cleanedBody[key] = val;
                }
              });
              
              if (Object.keys(cleanedBody).length > 0) {
                requestBody = cleanedBody;
                console.log('🌐 Processed body template (partial):', requestBody);
                // Set flag to allow fallback to fill missing fields
                templateProcessingPartial = true;
              }
            } else if (hasNonEmptyValues && !hasEmptyValues) {
              // All values resolved successfully
              requestBody = processedBody;
              console.log('🌐 Processed body template:', requestBody);
            }
            
            // If template processing completely failed, requestBody will remain null and fallback will run
            if (templateProcessingFailed && !hasNonEmptyValues) {
              console.warn('🌐 Template processing failed, will use fallback auto-detection');
            }
          }
          
          // Fallback to auto-detection if body template wasn't processed, is empty, or partially processed
          // CRITICAL FIX: Always run fallback to ensure all required fields are present
          // Also run if template processing was partial (some fields missing)
          const shouldRunFallback = !requestBody || 
                                    (requestBody && Object.keys(requestBody).length === 0) ||
                                    templateProcessingPartial;
          
          if (shouldRunFallback) {
            // Try to extract form data from currentResult or inputData
            const formDataSource = currentResult || currentResult || {};
            let formDataToSend: any = {};
            
            // Check if formDataSource has formData property
            if (formDataSource.formData && typeof formDataSource.formData === 'object') {
              formDataToSend = { ...formDataSource.formData };
            }
            // Check if formDataSource has inputData.formData
            else if (formDataSource.inputData && formDataSource.inputData.formData) {
              formDataToSend = { ...formDataSource.inputData.formData };
            }
            // Check if formDataSource itself contains form fields (email, password, etc.)
            else if (formDataSource.email || formDataSource.password || formDataSource.Email || formDataSource.Password) {
              formDataToSend = { ...formDataSource };
            }
            // Check flowResults.formData
            else if (flowResults.formData && typeof flowResults.formData === 'object') {
              formDataToSend = { ...flowResults.formData };
            }
            // Check flowResults.form (CRITICAL FIX: Use form object we created)
            else if (flowResults.form && typeof flowResults.form === 'object') {
              formDataToSend = { ...flowResults.form };
            }
            // Check if currentResult has form fields at top level
            else if (currentResult && typeof currentResult === 'object') {
              // Look for common form field names
              const formFields = ['email', 'password', 'confirm_password', 'username', 'name', 'Email', 'Password', 'Confirm Password'];
              const hasFormFields = formFields.some(field => currentResult[field] !== undefined);
              if (hasFormFields) {
                formDataToSend = { ...currentResult };
              }
            }
            
            // Normalize field names (convert spaces to underscores, handle case variations)
            const normalizedFormData: any = {};
            Object.keys(formDataToSend).forEach(key => {
              if (key.startsWith('_') || key === 'formId' || key === 'trigger' || key === 'clickTimestamp') {
                return; // Skip metadata fields
              }
              // Normalize key: convert spaces to underscores, lowercase
              const normalizedKey = key.replace(/\s+/g, '_').toLowerCase();
              // Map common variations
              if (normalizedKey === 'confirm_password' || normalizedKey === 'confirmpassword') {
                normalizedFormData['confirm_password'] = formDataToSend[key];
              } else if (normalizedKey === 'email' || key.toLowerCase() === 'email') {
                normalizedFormData['email'] = formDataToSend[key];
              } else if (normalizedKey === 'password' || key.toLowerCase() === 'password') {
                normalizedFormData['password'] = formDataToSend[key];
              } else {
                normalizedFormData[normalizedKey] = formDataToSend[key];
              }
            });
            
            // Merge with existing requestBody if template processing partially succeeded
            if (Object.keys(normalizedFormData).length > 0) {
              if (requestBody && typeof requestBody === 'object') {
                // Merge: template-processed values take precedence, but fill missing fields from auto-detection
                requestBody = {
                  ...normalizedFormData,
                  ...requestBody // Template-processed values override auto-detected ones
                };
                console.log('🌐 Merged template-processed and auto-detected form data:', requestBody);
              } else {
                requestBody = normalizedFormData;
                console.log('🌐 Auto-detected form data for request body:', requestBody);
              }
            } else if (requestBody && typeof requestBody === 'object' && Object.keys(requestBody).length > 0) {
              // Keep existing requestBody if auto-detection found nothing
              console.log('🌐 Using template-processed body (auto-detection found no additional data)');
            }
          }
          
          // Set request body if we have one
          if (requestBody && typeof requestBody === 'object' && Object.keys(requestBody).length > 0) {
            requestOptions.body = JSON.stringify(requestBody);
            headers['Content-Type'] = 'application/json';
            if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
              console.log('🌐 Request body set:', requestBody);
            }
          } else {
            if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
              console.warn('🌐 No form data detected for POST request');
            }
          }
        } catch (error: any) {
          console.error('🌐 Error processing request body:', error);
          // Continue without body if processing fails
        }
      }
      
      
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
          
          response = await fetch(fullUrl_create_user_583d14fc, requestOptions);
          clearTimeout(timeoutId);
          
          // Store response.ok immediately after successful fetch
          responseOk = response.ok;
          
          // Check response size before processing
          const contentLength: string | null = response.headers.get('content-length');
          if (contentLength !== null && parseInt(contentLength) > maxResponseSize) {
            throw new Error(`Response size (${(parseInt(contentLength) / 1024 / 1024).toFixed(2)} MB) exceeds limit (${maxResponseSize / 1024 / 1024} MB)`);
          }
          
          // Process response
          responseStatus_create_user_583d14fc = response.status;
          responseStatusText_create_user_583d14fc = response.statusText;
          responseHeaders_create_user_583d14fc = {};
          response.headers.forEach((value, key) => {
            responseHeaders_create_user_583d14fc[key] = value;
          });
          
          // Advanced response processing with chunking support
          if (false) {
            const contentType = response.headers.get('content-type') || '';
            
            // Handle chunked processing for large responses
            if (false && contentLength && parseInt(contentLength || '0') > 1024 * 1024) {
              if (typeof process !== 'undefined' && process.env?.NODE_ENV === 'development') {
        console.info('🌐 Processing large response in chunks');
      }
              
              if (contentType.includes('application/json')) {
                const textResponse = await response.text();
                responseData_create_user_583d14fc = JSON.parse(textResponse);
              } else {
                responseData_create_user_583d14fc = await response.text();
              }
            } else {
              // Standard processing for smaller responses
              if (contentType.includes('application/json')) {
                responseData_create_user_583d14fc = await response.json();
              } else if (contentType.includes('text/')) {
                responseData_create_user_583d14fc = await response.text();
              } else {
                responseData_create_user_583d14fc = await response.text();
              }
            }
          } else {
             // Parse JSON response if content-type indicates JSON, otherwise get text
            const contentType = response.headers.get('content-type') || '';
            const responseText = await response.text();
            
            if (contentType.includes('application/json') || responseText.trim().startsWith('{') || responseText.trim().startsWith('[')) {
              try {
                responseData_create_user_583d14fc = JSON.parse(responseText);
                console.log('✅ Parsed HTTP response as JSON:', {
                  type: typeof responseData_create_user_583d14fc,
                  hasData: !!responseData_create_user_583d14fc?.data,
                  dataLength: Array.isArray(responseData_create_user_583d14fc?.data) ? responseData_create_user_583d14fc.data.length : 'not array'
                });
              } catch (parseError) {
                console.warn('⚠️ Failed to parse JSON response, using text:', parseError);
                responseData_create_user_583d14fc = responseText;
              }
            } else {
              responseData_create_user_583d14fc = responseText;
            }
          }
          
          break; // Success - exit retry loop
          
        } catch (error: any) {
          lastError_create_user_583d14fc = error;
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
        throw lastError_create_user_583d14fc || new Error('HTTP request failed after all retry attempts');
      }
      
       // CRITICAL: Ensure responseData is parsed if it's still a string
      if (typeof responseData_create_user_583d14fc === 'string') {
        try {
          const trimmed = responseData_create_user_583d14fc.trim();
          if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
            responseData_create_user_583d14fc = JSON.parse(responseData_create_user_583d14fc);
            console.log(`✅ Parsed httpResult from string to object`);
          }
        } catch (parseError) {
          console.warn('⚠️ Failed to parse responseData_create_user_583d14fc:', parseError);
        }
      }

      // Hide loader after successful API request
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('apiLoadingEnd', { 
          detail: { 
            success: true,
            endpoint: '/api/auth/signup', 
            method: 'POST', 
            nodeId: 'create-user-583d14fc',
            response: responseData_create_user_583d14fc
          } 
        }));
      }
      
      // === AUTHENTICATION ERROR HANDLING ===
      // Check if this is an authentication endpoint and handle errors appropriately
      const isAuthEndpoint_create_user_583d14fc = (fullUrl_create_user_583d14fc.toLowerCase().includes('/login') || 
                                              fullUrl_create_user_583d14fc.toLowerCase().includes('/signup') || 
                                              fullUrl_create_user_583d14fc.toLowerCase().includes('/sign-in') ||
                                              fullUrl_create_user_583d14fc.toLowerCase().includes('/sign-up') ||
                                              fullUrl_create_user_583d14fc.toLowerCase().includes('/register') ||
                                              fullUrl_create_user_583d14fc.toLowerCase().includes('/auth/login') ||
                                              fullUrl_create_user_583d14fc.toLowerCase().includes('/auth/signup') ||
                                              fullUrl_create_user_583d14fc.toLowerCase().includes('/auth/register'));
      
      // ✅ CRITICAL FIX: Set user_id cookie immediately after successful login/signup (client-side)
      // SECURITY: auth_token is now only in HttpOnly cookie (set by backend) - use /api/auth/token route to read it
      // This ensures user_id is available before any JavaScript node runs
      // The backend sets HttpOnly cookies, but in some environments (incognito, cross-origin) they may not be set properly
      // Setting user_id client-side ensures it's available for workflow path parameter replacement
      if (responseOk && isAuthEndpoint_create_user_583d14fc && typeof window !== 'undefined') {
        try {
          // Extract user_id from login/signup response
          const userId = responseData_create_user_583d14fc?.user_id || 
                        responseData_create_user_583d14fc?.user?.id;
          
          if (userId) {
            // Set user_id cookie using document.cookie (client-side)
            // Note: auth_token is NOT set here - it's only in HttpOnly cookie set by backend
            const isSecure = window.location.protocol === 'https:';
            document.cookie = `user_id=${userId}; path=/; max-age=86400; SameSite=Lax${isSecure ? '; Secure' : ''}`;
            console.log('✅ Set user_id cookie after login/signup:', { userId });
          } else {
            console.warn('⚠️ Could not extract userId from auth response:', responseData_create_user_583d14fc);
          }
        } catch (cookieError) {
          console.error('❌ Failed to set user_id cookie after login/signup:', cookieError);
        }
      }
      
      if (!responseOk && isAuthEndpoint_create_user_583d14fc) {
        // Map authentication errors to user-friendly messages
        let authErrorMessage_create_user_583d14fc = '';
        const lowerUrl_create_user_583d14fc = fullUrl_create_user_583d14fc.toLowerCase();
        const isLogin_create_user_583d14fc = lowerUrl_create_user_583d14fc.includes('/login') || lowerUrl_create_user_583d14fc.includes('/sign-in');
        const isSignup_create_user_583d14fc = lowerUrl_create_user_583d14fc.includes('/signup') || lowerUrl_create_user_583d14fc.includes('/sign-up') || lowerUrl_create_user_583d14fc.includes('/register');
        
        // Extract error message from response data
        if (responseData_create_user_583d14fc) {
          if (typeof responseData_create_user_583d14fc === 'string') {
            authErrorMessage_create_user_583d14fc = responseData_create_user_583d14fc;
          } else if (responseData_create_user_583d14fc.detail) {
            authErrorMessage_create_user_583d14fc = responseData_create_user_583d14fc.detail;
          } else if (responseData_create_user_583d14fc.message) {
            authErrorMessage_create_user_583d14fc = responseData_create_user_583d14fc.message;
          } else if (responseData_create_user_583d14fc.error) {
            authErrorMessage_create_user_583d14fc = responseData_create_user_583d14fc.error;
          }
        }
        
        const lowerError_create_user_583d14fc = authErrorMessage_create_user_583d14fc.toLowerCase();
        
        // Login-specific error mapping
        if (isLogin_create_user_583d14fc) {
          if (responseStatus_create_user_583d14fc === 401) {
            if (lowerError_create_user_583d14fc.includes('not registered') || lowerError_create_user_583d14fc.includes('not found') || lowerError_create_user_583d14fc.includes('does not exist')) {
              authErrorMessage_create_user_583d14fc = 'Email is not registered, kindly register';
            } else {
              authErrorMessage_create_user_583d14fc = 'Email or password is incorrect';
            }
          } else if (responseStatus_create_user_583d14fc === 404) {
            authErrorMessage_create_user_583d14fc = 'Email is not registered, kindly register';
          } else if (responseStatus_create_user_583d14fc === 403) {
            authErrorMessage_create_user_583d14fc = 'Account is inactive';
          } else if (!authErrorMessage_create_user_583d14fc) {
            authErrorMessage_create_user_583d14fc = 'Authentication failed. Please check your credentials';
          }
        }
        
        // Signup-specific error mapping
        if (isSignup_create_user_583d14fc) {
          if (responseStatus_create_user_583d14fc === 400 || responseStatus_create_user_583d14fc === 409) {
            if (lowerError_create_user_583d14fc.includes('already registered') || lowerError_create_user_583d14fc.includes('already exists') || lowerError_create_user_583d14fc.includes('email already')) {
              authErrorMessage_create_user_583d14fc = 'Email is already registered';
            } else if (lowerError_create_user_583d14fc.includes('password') && (lowerError_create_user_583d14fc.includes('match') || lowerError_create_user_583d14fc.includes('mismatch') || lowerError_create_user_583d14fc.includes('confirm'))) {
              authErrorMessage_create_user_583d14fc = 'Password and confirm password do not match';
            } else if (lowerError_create_user_583d14fc.includes('password') && (lowerError_create_user_583d14fc.includes('short') || lowerError_create_user_583d14fc.includes('length') || lowerError_create_user_583d14fc.includes('minimum'))) {
              authErrorMessage_create_user_583d14fc = 'Password is too short. Please use at least 8 characters';
            } else if (!authErrorMessage_create_user_583d14fc) {
              authErrorMessage_create_user_583d14fc = 'Invalid request. Please check your input';
            }
          } else if (!authErrorMessage_create_user_583d14fc) {
            authErrorMessage_create_user_583d14fc = 'An error occurred. Please try again';
          }
        }
        
        // Show toast notification for authentication errors
        if (typeof window !== 'undefined') {
          // Use the same toast pattern as auth handlers
          const toast_create_user_583d14fc = document.createElement('div');
          toast_create_user_583d14fc.className = 'fixed top-4 right-4 px-4 py-2 rounded-md text-white text-sm z-50 bg-red-500';
          toast_create_user_583d14fc.textContent = authErrorMessage_create_user_583d14fc || 'Authentication error occurred';
          toast_create_user_583d14fc.style.cssText = `position: fixed; top: 20px; right: 20px; z-index: 10000; padding: 16px; border-radius: 6px; background-color: #ef4444; color: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); min-width: 300px;`;
          document.body.appendChild(toast_create_user_583d14fc);
          
          setTimeout(() => {
            toast_create_user_583d14fc.style.opacity = '0';
            toast_create_user_583d14fc.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
              if (toast_create_user_583d14fc.parentElement) {
                document.body.removeChild(toast_create_user_583d14fc);
              }
            }, 500);
          }, 5000);
        }
        
        // Set authentication error flag to prevent navigation
        if (flowResults) {
          flowResults.authError = true;
          flowResults.lastAuthError = authErrorMessage_create_user_583d14fc || 'Authentication error occurred';
        } else {
          console.warn('⚠️ flowResults not available, cannot set authError flag');
        }
      }
      
      // Update result variable (EXISTING FUNCTIONALITY - PRESERVED)
      step3Result = {
        ...currentResult,
        httpResult: responseData_create_user_583d14fc,
        httpSuccess: responseOk,
        httpStatus: responseStatus_create_user_583d14fc,
        httpStatusText: responseStatusText_create_user_583d14fc,
        httpHeaders: responseHeaders_create_user_583d14fc,
        httpUrl: fullUrl_create_user_583d14fc,
        httpMethod: 'POST',
        timestamp: new Date().toISOString()
      };
      
      // Store in Data Flow System for UI Components
      // Store result in enhanced data flow system
      if (!flowResults.apiResponses) flowResults.apiResponses = {};
      if (!flowResults.nodeResults) flowResults.nodeResults = {};
      if (!flowResults.variables) flowResults.variables = {};
      
      // CRITICAL FIX: Smart Data Extraction
      // Extract actual data from common API response patterns
      let extractedData_create_user_583d14fc = responseData_create_user_583d14fc;
      
      if (responseData_create_user_583d14fc && typeof responseData_create_user_583d14fc === 'object' && !Array.isArray(responseData_create_user_583d14fc)) {
        // Pattern 1: { data: [...] } or { data: {...} }
        if (responseData_create_user_583d14fc.data !== undefined && responseData_create_user_583d14fc.data !== null) {
          extractedData_create_user_583d14fc = responseData_create_user_583d14fc.data;
          console.log('✅ Extracted data from response.data field');
        }
        // Pattern 2: { result: [...] } or { result: {...} }
        else if (responseData_create_user_583d14fc.result !== undefined && responseData_create_user_583d14fc.result !== null) {
          extractedData_create_user_583d14fc = responseData_create_user_583d14fc.result;
          console.log('✅ Extracted data from response.result field');
        }
        // Pattern 3: { items: [...] }
        else if (responseData_create_user_583d14fc.items !== undefined && responseData_create_user_583d14fc.items !== null) {
          extractedData_create_user_583d14fc = responseData_create_user_583d14fc.items;
          console.log('✅ Extracted data from response.items field');
        }
        // Pattern 4: { results: [...] }
        else if (responseData_create_user_583d14fc.results !== undefined && responseData_create_user_583d14fc.results !== null) {
          extractedData_create_user_583d14fc = responseData_create_user_583d14fc.results;
          console.log('✅ Extracted data from response.results field');
        }
        // Pattern 5: { records: [...] }
        else if (responseData_create_user_583d14fc.records !== undefined && responseData_create_user_583d14fc.records !== null) {
          extractedData_create_user_583d14fc = responseData_create_user_583d14fc.records;
          console.log('✅ Extracted data from response.records field');
        }
        // Pattern 6: { rows: [...] }
        else if (responseData_create_user_583d14fc.rows !== undefined && responseData_create_user_583d14fc.rows !== null) {
          extractedData_create_user_583d14fc = responseData_create_user_583d14fc.rows;
          console.log('✅ Extracted data from response.rows field');
        }
        // Pattern 7: { payload: [...] } or { payload: {...} }
        else if (responseData_create_user_583d14fc.payload !== undefined && responseData_create_user_583d14fc.payload !== null) {
          extractedData_create_user_583d14fc = responseData_create_user_583d14fc.payload;
          console.log('✅ Extracted data from response.payload field');
        }
        // Pattern 8: { body: [...] } or { body: {...} }
        else if (responseData_create_user_583d14fc.body !== undefined && responseData_create_user_583d14fc.body !== null) {
          extractedData_create_user_583d14fc = responseData_create_user_583d14fc.body;
          console.log('✅ Extracted data from response.body field');
        }
      }
      
      // Store both raw and extracted data
      flowResults.apiResponses["httpResult_raw"] = responseData_create_user_583d14fc;
      flowResults.apiResponses["httpResult"] = extractedData_create_user_583d14fc;
      
      flowResults.variables["httpResult_raw"] = responseData_create_user_583d14fc;
      flowResults.variables["httpResult"] = extractedData_create_user_583d14fc;
      
      flowResults.nodeResults["create-user-583d14fc"] = {
        data: extractedData_create_user_583d14fc,
        rawData: responseData_create_user_583d14fc,
        displayName: "httpResult",
        nodeType: "http",
        success: responseOk,
        status: responseStatus_create_user_583d14fc,
        stepNumber: (flowResults.stepCounter || 0) + 1
      };
      
      // Store at top-level for direct access (use extracted data)
      flowResults["httpResult"] = extractedData_create_user_583d14fc;
      flowResults["httpResult_raw"] = responseData_create_user_583d14fc;
      
      // Update result tracking (use extracted data)
      flowResults.previousResult = flowResults.currentResult;
      flowResults.currentResult = extractedData_create_user_583d14fc;
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
            endpoint: '/api/auth/signup', 
            method: 'POST', 
            nodeId: 'create-user-583d14fc',
            response: null
          } 
        }));
      }
      
      // === AUTHENTICATION ERROR HANDLING IN CATCH BLOCK ===
      // Check if this is an authentication endpoint and handle errors appropriately
      const isAuthEndpoint_create_user_583d14fc = (fullUrl_create_user_583d14fc && (fullUrl_create_user_583d14fc.toLowerCase().includes('/login') || 
                                              fullUrl_create_user_583d14fc.toLowerCase().includes('/signup') || 
                                              fullUrl_create_user_583d14fc.toLowerCase().includes('/sign-in') ||
                                              fullUrl_create_user_583d14fc.toLowerCase().includes('/sign-up') ||
                                              fullUrl_create_user_583d14fc.toLowerCase().includes('/register') ||
                                              fullUrl_create_user_583d14fc.toLowerCase().includes('/auth/login') ||
                                              fullUrl_create_user_583d14fc.toLowerCase().includes('/auth/signup') ||
                                              fullUrl_create_user_583d14fc.toLowerCase().includes('/auth/register'))) ||
                                              ('/api/auth/signup'.toLowerCase().includes('/login') || 
                                               '/api/auth/signup'.toLowerCase().includes('/signup') || 
                                               '/api/auth/signup'.toLowerCase().includes('/sign-in') ||
                                               '/api/auth/signup'.toLowerCase().includes('/sign-up') ||
                                               '/api/auth/signup'.toLowerCase().includes('/register') ||
                                               '/api/auth/signup'.toLowerCase().includes('/auth/login') ||
                                               '/api/auth/signup'.toLowerCase().includes('/auth/signup') ||
                                               '/api/auth/signup'.toLowerCase().includes('/auth/register'));
      
      if (isAuthEndpoint_create_user_583d14fc) {
        // For authentication endpoints, show user-friendly error message
        let authErrorMessage_create_user_583d14fc = 'An error occurred. Please try again';
        
        // Try to extract error from response if available
        if (responseData_create_user_583d14fc && typeof responseData_create_user_583d14fc === 'object') {
          if (responseData_create_user_583d14fc.detail) {
            authErrorMessage_create_user_583d14fc = responseData_create_user_583d14fc.detail;
          } else if (responseData_create_user_583d14fc.message) {
            authErrorMessage_create_user_583d14fc = responseData_create_user_583d14fc.message;
          } else if (responseData_create_user_583d14fc.error) {
            authErrorMessage_create_user_583d14fc = responseData_create_user_583d14fc.error;
          }
        } else if (error?.message) {
          authErrorMessage_create_user_583d14fc = error.message;
        }
        
        // Show toast notification for authentication errors
        if (typeof window !== 'undefined') {
          const toast_create_user_583d14fc = document.createElement('div');
          toast_create_user_583d14fc.className = 'fixed top-4 right-4 px-4 py-2 rounded-md text-white text-sm z-50 bg-red-500';
          toast_create_user_583d14fc.textContent = authErrorMessage_create_user_583d14fc;
          toast_create_user_583d14fc.style.cssText = `position: fixed; top: 20px; right: 20px; z-index: 10000; padding: 16px; border-radius: 6px; background-color: #ef4444; color: white; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1); min-width: 300px;`;
          document.body.appendChild(toast_create_user_583d14fc);
          
          setTimeout(() => {
            toast_create_user_583d14fc.style.opacity = '0';
            toast_create_user_583d14fc.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
              if (toast_create_user_583d14fc.parentElement) {
                document.body.removeChild(toast_create_user_583d14fc);
              }
            }, 500);
          }, 5000);
        }
        
        // Set authentication error flag to prevent navigation
        if (flowResults) {
          flowResults.authError = true;
          flowResults.lastAuthError = authErrorMessage_create_user_583d14fc;
        } else {
          console.warn('⚠️ flowResults not available, cannot set authError flag');
        }
      }
      
      step3Result = {
        ...currentResult,
        httpResult: responseData_create_user_583d14fc || null,
        httpError: error?.message || 'Unknown HTTP error',
        httpSuccess: false,
        httpStatus: responseStatus_create_user_583d14fc || 0,
        httpStatusText: responseStatusText_create_user_583d14fc || '',
        httpHeaders: responseHeaders_create_user_583d14fc || {},
        httpUrl: fullUrl_create_user_583d14fc || '/api/auth/signup',
        httpMethod: 'POST',
        timestamp: new Date().toISOString()
      };
      
      // Store error state in Data Flow System
      if (!flowResults.apiResponses) flowResults.apiResponses = {};
      if (!flowResults.nodeResults) flowResults.nodeResults = {};
      if (!flowResults.variables) flowResults.variables = {};
      
      // Apply smart extraction even for error responses (some APIs return data in error responses)
      let extractedErrorData_create_user_583d14fc = responseData_create_user_583d14fc || null;
      if (responseData_create_user_583d14fc && typeof responseData_create_user_583d14fc === 'object' && !Array.isArray(responseData_create_user_583d14fc)) {
        if (responseData_create_user_583d14fc.data !== undefined) {
          extractedErrorData_create_user_583d14fc = responseData_create_user_583d14fc.data;
        } else if (responseData_create_user_583d14fc.result !== undefined) {
          extractedErrorData_create_user_583d14fc = responseData_create_user_583d14fc.result;
        }
      }
      
      flowResults.apiResponses["httpResult_raw"] = responseData_create_user_583d14fc || null;
      flowResults.apiResponses["httpResult"] = extractedErrorData_create_user_583d14fc;
      
      flowResults.variables["httpResult_raw"] = responseData_create_user_583d14fc || null;
      flowResults.variables["httpResult"] = extractedErrorData_create_user_583d14fc;
      
      flowResults.nodeResults["create-user-583d14fc"] = {
        data: extractedErrorData_create_user_583d14fc,
        rawData: responseData_create_user_583d14fc || null,
        error: error?.message || 'Unknown HTTP error',
        displayName: "httpResult",
        nodeType: "http",
        success: false,
        status: responseStatus_create_user_583d14fc || 0,
        statusText: responseStatusText_create_user_583d14fc || '',
        stepNumber: (flowResults.stepCounter || 0) + 1
      };
      
      flowResults["httpResult"] = extractedErrorData_create_user_583d14fc;
      flowResults["httpResult_raw"] = responseData_create_user_583d14fc || null;
    }
    
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['create-user-583d14fc'] = {
      nodeId: 'create-user-583d14fc',
      nodeType: 'http',
      stepNumber: 3,
      displayName: 'apiResponse_4741',
      data: step3Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    flowResults.apiResponses['apiResponse_4741'] = step3Result;
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['apiResponse_4741'] || typeof flowResults['apiResponse_4741'] === 'undefined') {
      flowResults['apiResponse_4741'] = step3Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
      currentResult = step3Result; // Update currentResult for next step
    } catch (stepError) {
      const stepErrorMessage = stepError instanceof Error ? stepError.message : String(stepError) || 'Unknown step error';
      console.error('❌ Error in step 3 (http):', stepError);
      flowErrors.push(`Step 3 (http): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step3Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'http',
        nodeId: 'create-user-583d14fc',
        stepNumber: 3
      };
      
      currentResult = step3Result; // Update currentResult even on error
    }
    

    // === STEP 4: RUN-JAVASCRIPT ===
    try {
      
    // ═══════════════════════════════════════════════════════════════
    // 📜 Run JavaScript Node: Custom JavaScript execution
    // Node ID: set-cookie-583d14fc
    // Output Variable: jsResult
    // Execution: Node.js VM sandbox (FastAPI backend)
    // ═══════════════════════════════════════════════════════════════
    
    step4Result = null;
    try {
      console.log('📜 Executing JavaScript code for node: set-cookie-583d14fc');
      
      // Prepare input data for JavaScript execution (previous node result)
      const jsInputData_set_cookie_583d14fc = currentResult;
      
      // Build workflowData object from nodeResults (keyed by nodeId)
      // This allows JavaScript code to access previous node results via workflowData[nodeId]
      const workflowData_set_cookie_583d14fc: Record<string, any> = {};
      if (flowResults.nodeResults) {
        Object.keys(flowResults.nodeResults).forEach(nodeId => {
          const nodeResult = flowResults.nodeResults[nodeId];
          if (nodeResult && nodeResult.data !== undefined) {
            workflowData_set_cookie_583d14fc[nodeId] = nodeResult.data;
          }
        });
      }
      // Also add HTTP response data with nodeId as key for easy access
      if (flowResults.apiResponses) {
        Object.keys(flowResults.apiResponses).forEach(key => {
          // Try to find corresponding nodeId from nodeResults
          for (const [nodeId, nodeResult] of Object.entries(flowResults.nodeResults || {})) {
            if ((nodeResult as any).displayName === key || (nodeResult as any).nodeType === 'http') {
              workflowData_set_cookie_583d14fc[nodeId] = flowResults.apiResponses[key];
              break;
            }
          }
        });
      }
      
      // Build template context with all available flow results for {{variable}} resolution
      // This matches the pattern used by other nodes (email, notification, etc.)
      const templateContext_set_cookie_583d14fc = {
        // Previous node result
        input_data: jsInputData_set_cookie_583d14fc,
        previous: jsInputData_set_cookie_583d14fc,
        inputData: jsInputData_set_cookie_583d14fc,
        input: jsInputData_set_cookie_583d14fc,
        
        // All flow results from previous steps
        ...flowResults,
        
        // CRITICAL FIX: Add workflowData object for JavaScript execution context
        workflowData: workflowData_set_cookie_583d14fc,

        // Legacy alias for older nodes referencing {{userFormResponse}}
        userFormResponse:
          (typeof flowResults !== 'undefined' &&
            ((flowResults as any).userFormResponse ??
              (flowResults as any).getUsersResult ??
              (flowResults as any).apiResponses?.getUsersResult ??
              (flowResults as any).variables?.getUsersResult)) ??
          null,
        
        // DataFlow helper functions
        dataFlow: typeof dataFlow !== 'undefined' ? {
          get: (name) => dataFlow.get(name),
          getByNodeId: (id) => dataFlow.getByNodeId(id),
          previous: () => dataFlow.previous(),
          current: () => dataFlow.current()
        } : {}
      };
      
      console.log('📝 Template context keys:', Object.keys(templateContext_set_cookie_583d14fc));
      
      // Resolve {{variable}} templates in JavaScript code using TemplateExpressionEngine
      let resolvedJsCode_set_cookie_583d14fc = `// Set authentication cookies from previous HTTP node response\nconst createUserNodeId = 'create-user-583d14fc';\nconst authToken = workflowData[createUserNodeId]?.access_token || workflowData[createUserNodeId]?.token || workflowData[createUserNodeId]?.data?.access_token;\nconst userId = workflowData[createUserNodeId]?.user?.id || workflowData[createUserNodeId]?.user_id || workflowData[createUserNodeId]?.data?.user?.id;\n\nif (authToken && userId) {\n    // Set cookies using document.cookie (client-side)\n    const isSecure = window.location.protocol === 'https:';\n    document.cookie = \`auth_token=\${authToken}; path=/; max-age=86400; SameSite=Lax\${isSecure ? '; Secure' : ''}\`;\n    document.cookie = \`user_id=\${userId}; path=/; max-age=86400; SameSite=Lax\${isSecure ? '; Secure' : ''}\`;\n    \n    // Store in workflow data for next node\n    workflowData['auth_token'] = authToken;\n    workflowData['user_id'] = userId;\n}`;
      
      // Use the same template resolution pattern as other nodes
      if (resolvedJsCode_set_cookie_583d14fc.includes('{{') && resolvedJsCode_set_cookie_583d14fc.includes('}}')) {
        console.log('🔄 Resolving template variables in JavaScript code...');
        
        // Replace {{variableName}} with actual values from context
        resolvedJsCode_set_cookie_583d14fc = resolvedJsCode_set_cookie_583d14fc.replace(
          /\{\{\s*([^}]+?)\s*\}\}/g,
          (match, varPath) => {
            try {
              const trimmedPath = varPath.trim();
              
              // ═══════════════════════════════════════════════════════════════
              // PRIORITY 1: Handle dataFlow function calls
              // ═══════════════════════════════════════════════════════════════
              
              // Handle dataFlow.getByNodeId("node-id") or dataFlow.getByNodeId('node-id')
              const getByNodeIdMatch = trimmedPath.match(/^dataFlow\.getByNodeId\(['"](.*?)['"]\)$/);
              if (getByNodeIdMatch && typeof dataFlow !== 'undefined') {
                const nodeId = getByNodeIdMatch[1];
                const value = dataFlow.getByNodeId(nodeId);

                // For input nodes (and similar), extract the user-provided value instead of returning the entire result object
                let resolvedValue = value;
                if (value && typeof value === 'object') {
                  if (value.data && (value.data.currentValue !== undefined || value.data.value !== undefined)) {
                    resolvedValue = value.data.currentValue !== undefined ? value.data.currentValue : value.data.value;
                  } else if (value.currentValue !== undefined) {
                    resolvedValue = value.currentValue;
                  } else if (value.value !== undefined) {
                    resolvedValue = value.value;
                  } else if (value.data !== undefined) {
                    resolvedValue = value.data;
                  }
                }

                console.log('Resolved {{dataFlow.getByNodeId("' + nodeId + '")}} ->', typeof resolvedValue === 'object' ? JSON.stringify(resolvedValue) : resolvedValue);
                return formatForJs(resolvedValue);
              }
              
              // Handle dataFlow.get("name") or dataFlow.get('name')
              const getMatch = trimmedPath.match(/^dataFlow\.get\(['"](.*?)['"]\)$/);
              if (getMatch && typeof dataFlow !== 'undefined') {
                const name = getMatch[1];
                const value = dataFlow.get(name);
                console.log('✅ Resolved {{dataFlow.get("' + name + '")}} →', typeof value === 'object' ? JSON.stringify(value) : value);
                return formatForJs(value);
              }
              
              // Handle dataFlow.previous()
              if (trimmedPath === 'dataFlow.previous()' && typeof dataFlow !== 'undefined') {
                const value = dataFlow.previous();
                console.log('✅ Resolved {{dataFlow.previous()}} →', typeof value === 'object' ? JSON.stringify(value) : value);
                return formatForJs(value);
              }
              
              // Handle dataFlow.current()
              if (trimmedPath === 'dataFlow.current()' && typeof dataFlow !== 'undefined') {
                const value = dataFlow.current();
                console.log('✅ Resolved {{dataFlow.current()}} →', typeof value === 'object' ? JSON.stringify(value) : value);
                return formatForJs(value);
              }
              
              // ═══════════════════════════════════════════════════════════════
              // PRIORITY 2: Try direct lookup in context
              // ═══════════════════════════════════════════════════════════════
              if (templateContext_set_cookie_583d14fc[trimmedPath] !== undefined) {
                const value = templateContext_set_cookie_583d14fc[trimmedPath];
                console.log('✅ Resolved {{' + trimmedPath + '}} →', typeof value === 'object' ? JSON.stringify(value) : value);
                return formatForJs(value);
              }
              
              // ═══════════════════════════════════════════════════════════════
              // PRIORITY 3: Look through flowResults collections (variables, apiResponses, etc.)
              // ═══════════════════════════════════════════════════════════════
              const collectionKeys = ['variables', 'apiResponses', 'inputs', 'formData', 'inboundEmailData', 'calculations', 'aiResponses'];
              for (const collectionKey of collectionKeys) {
                const collection = flowResults && (flowResults as any)[collectionKey];
                if (collection && collection[trimmedPath] !== undefined) {
                  const collectionValue = collection[trimmedPath];
                  console.log('Гo. Resolved {{' + trimmedPath + '}} via flowResults.' + collectionKey + ' Г+' + (typeof collectionValue === 'object' ? JSON.stringify(collectionValue) : collectionValue));
                  return formatForJs(collectionValue);
                }
              }

              // ═══════════════════════════════════════════════════════════════
              // PRIORITY 4: Try nested path (e.g., step1Result.data.name)
              // ═══════════════════════════════════════════════════════════════
              const parts = trimmedPath.split('.');
              let value = templateContext_set_cookie_583d14fc;
              
              for (const part of parts) {
                if (value && typeof value === 'object' && part in value) {
                  value = value[part];
                } else {
                  value = undefined;
                  break;
                }
              }
              
              if (value !== undefined) {
                console.log('✅ Resolved {{' + trimmedPath + '}} (nested) →', typeof value === 'object' ? JSON.stringify(value) : value);
                return formatForJs(value);
              }
              
              // ═══════════════════════════════════════════════════════════════
              // PRIORITY 5: Try flowResults directly with various patterns
              // ═══════════════════════════════════════════════════════════════
              
              // Try direct flowResults lookup
              if (flowResults[trimmedPath] !== undefined) {
                const val = flowResults[trimmedPath];
                console.log('✅ Resolved {{' + trimmedPath + '}} (flowResults direct) →', typeof val === 'object' ? JSON.stringify(val) : val);
                return formatForJs(val);
              }
              
              // Try flowResults with nested path
              let flowValue = flowResults;
              let flowFound = true;
              for (const p of parts) {
                if (flowValue && typeof flowValue === 'object' && p in flowValue) {
                  flowValue = flowValue[p];
                } else {
                  flowFound = false;
                  break;
                }
              }
              if (flowFound && flowValue !== undefined) {
                console.log('✅ Resolved {{' + trimmedPath + '}} (flowResults nested) →', typeof flowValue === 'object' ? JSON.stringify(flowValue) : flowValue);
                return formatForJs(flowValue);
              }
              
              // Try common prefixes (step1Result, step2Result, inputResult_*)
              const flowResultPatterns = [
                'step1Result.' + trimmedPath,
                'step2Result.' + trimmedPath,
                'step3Result.' + trimmedPath
              ];
              
              // Also try inputResult_ patterns
              Object.keys(flowResults).forEach(key => {
                if (key.startsWith('inputResult_')) {
                  flowResultPatterns.push(key + '.' + trimmedPath);
                }
              });
              
              for (const pattern of flowResultPatterns) {
                const patternParts = pattern.split('.');
                let patternValue = flowResults;
                let found = true;
                
                for (const p of patternParts) {
                  if (patternValue && typeof patternValue === 'object' && p in patternValue) {
                    patternValue = patternValue[p];
                  } else {
                    found = false;
                    break;
                  }
                }
                
                if (found && patternValue !== undefined) {
                  console.log('✅ Resolved {{' + trimmedPath + '}} (pattern: ' + pattern + ') →', typeof patternValue === 'object' ? JSON.stringify(patternValue) : patternValue);
                  return formatForJs(patternValue);
                }
              }
              
              // ═══════════════════════════════════════════════════════════════
              // PRIORITY 6: Try nodeResults lookup (for node-id based access)
              // ═══════════════════════════════════════════════════════════════
              if (flowResults.nodeResults) {
                // Try direct node ID lookup
                if (flowResults.nodeResults[trimmedPath]) {
                  const nodeResult = flowResults.nodeResults[trimmedPath];
                  console.log('✅ Resolved {{' + trimmedPath + '}} (nodeResults) →', typeof nodeResult === 'object' ? JSON.stringify(nodeResult) : nodeResult);
                  return formatForJs(nodeResult);
                }
                
                // Try nested path in nodeResults (e.g., nodeResults.someNodeId.data)
                if (parts.length >= 2 && parts[0] === 'nodeResults') {
                  let nodeValue = flowResults.nodeResults;
                  let nodeFound = true;
                  for (let i = 1; i < parts.length; i++) {
                    if (nodeValue && typeof nodeValue === 'object' && parts[i] in nodeValue) {
                      nodeValue = nodeValue[parts[i]];
                    } else {
                      nodeFound = false;
                      break;
                    }
                  }
                  if (nodeFound && nodeValue !== undefined) {
                    console.log('✅ Resolved {{' + trimmedPath + '}} (nodeResults nested) →', typeof nodeValue === 'object' ? JSON.stringify(nodeValue) : nodeValue);
                    return formatForJs(nodeValue);
                  }
                }
              }
              
              console.warn('⚠️ Template variable not found: {{' + trimmedPath + '}}');
              console.warn('   Available keys:', Object.keys(templateContext_set_cookie_583d14fc));
              console.warn('   FlowResults keys:', Object.keys(flowResults));
              if (flowResults.nodeResults) {
                console.warn('   NodeResults keys:', Object.keys(flowResults.nodeResults));
              }
              return 'null';  // JavaScript null for unresolved
              
            } catch (e) {
              console.error('❌ Failed to resolve {{' + varPath + '}}:', e);
              return 'null';
            }
          }
        );
        
        console.log('✅ Template resolution completed');
      }

      const prepareJsCode_set_cookie_583d14fc = (code: string) => {
        const trimmedCode = (code ?? '').trim();
        if (!trimmedCode) {
          return '';
        }

        const containsAwait = /\bawait\b/.test(trimmedCode);
        const alreadyWrapped = trimmedCode.includes('__flowRuntimeAsyncWrapper');
        if (!containsAwait || alreadyWrapped) {
          return trimmedCode;
        }

        const indentedCode = trimmedCode
          .split('\n')
          .map((line) => (line ? `  ${line}` : ''))
          .join('\n');

        console.log('[JS:set-cookie-583d14fc] Wrapped code in async runtime to support await.');
        return [
          'async function __flowRuntimeAsyncWrapper() {',
          indentedCode,
          '}',
          '',
          'return __flowRuntimeAsyncWrapper();',
        ].join('\n');
      };

      resolvedJsCode_set_cookie_583d14fc = prepareJsCode_set_cookie_583d14fc(resolvedJsCode_set_cookie_583d14fc);

      // Helper function to format values for JavaScript
      function formatForJs(value) {
        if (value === undefined || value === null) {
          return 'null';
        } else if (typeof value === 'boolean') {
          return value ? 'true' : 'false';
        } else if (typeof value === 'string') {
          // Escape for JavaScript string
          return JSON.stringify(value);
        } else if (typeof value === 'object') {
          // Convert to JavaScript object/array format via JSON
          return JSON.stringify(value);
        } else {
          return String(value);
        }
      }
      
      // Get the backend API URL (relative for same-origin)
      // Router prefix: /api/javascript, endpoint: /execute
      const jsApiUrl = '/api/javascript/execute';
      
      console.log('🔄 Calling JavaScript execution API...');
      const startTime = performance.now();
      
      // CRITICAL FIX: Prepare input_data with workflowData for JavaScript execution
      const jsInputDataWithWorkflow_set_cookie_583d14fc = {
        ...(jsInputData_set_cookie_583d14fc && typeof jsInputData_set_cookie_583d14fc === 'object' ? jsInputData_set_cookie_583d14fc : {}),
        workflowData: workflowData_set_cookie_583d14fc,
        // Also include all flowResults for backward compatibility
        ...flowResults
      };
      
      // Call the FastAPI JavaScript execution endpoint
      const jsResponse_set_cookie_583d14fc = await fetch(jsApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          code: resolvedJsCode_set_cookie_583d14fc,
          input_data: jsInputDataWithWorkflow_set_cookie_583d14fc,
          output_variable: 'jsResult',
          timeout: 30
        })
      });
      
      if (!jsResponse_set_cookie_583d14fc.ok) {
        const errorText = await jsResponse_set_cookie_583d14fc.text();
        throw new Error(`JavaScript API error (${jsResponse_set_cookie_583d14fc.status}): ${errorText}`);
      }
      
      const jsApiResult_set_cookie_583d14fc = await jsResponse_set_cookie_583d14fc.json();
      
      const executionTime = ((performance.now() - startTime) / 1000).toFixed(3);
      
      if (jsApiResult_set_cookie_583d14fc.status === 'error') {
        console.error('❌ JavaScript execution error:', jsApiResult_set_cookie_583d14fc.error);
        throw new Error(jsApiResult_set_cookie_583d14fc.error);
      }
      
      // Get the result
      step4Result = jsApiResult_set_cookie_583d14fc.result;
      
      // Log stdout if present
      if (jsApiResult_set_cookie_583d14fc.stdout) {
        console.log('📝 JavaScript stdout:', jsApiResult_set_cookie_583d14fc.stdout);
      }
      
      console.log('✅ JavaScript execution completed in', executionTime, 'seconds');
      console.log('📦 JavaScript result:', step4Result);
      
      // Store result for other nodes to access
      window['jsResult'] = step4Result;
      window.nodeOutputs = window.nodeOutputs || {};
      window.nodeOutputs['set-cookie-583d14fc'] = step4Result;

      if (typeof flowResults !== 'undefined') {
        flowResults.nodeResults = flowResults.nodeResults || {};
        flowResults.variables = flowResults.variables || {};
        const nextStepNumber_set_cookie_583d14fc = (flowResults.stepCounter || 0) + 1;

        flowResults.nodeResults['set-cookie-583d14fc'] = {
          nodeId: 'set-cookie-583d14fc',
          nodeType: 'run-javascript',
          stepNumber: nextStepNumber_set_cookie_583d14fc,
          displayName: 'jsResult',
          data: step4Result,
          timestamp: new Date().toISOString(),
          success: true
        };

        flowResults.variables['jsResult'] = step4Result;
        flowResults['jsResult'] = step4Result;

        flowResults.previousResult = flowResults.currentResult;
        flowResults.currentResult = step4Result;
        flowResults.stepCounter = nextStepNumber_set_cookie_583d14fc;
      }

      if (typeof currentResult !== 'undefined') {
        currentResult = step4Result;
      }
      
    } catch (jsError_set_cookie_583d14fc) {
      console.error('❌ JavaScript node set-cookie-583d14fc failed:', jsError_set_cookie_583d14fc);
      step4Result = {
        status: 'error',
        error: jsError_set_cookie_583d14fc.message || String(jsError_set_cookie_583d14fc),
        nodeId: 'set-cookie-583d14fc'
      };
      
      // Still store error result for downstream error handling
      window.nodeOutputs = window.nodeOutputs || {};
      window.nodeOutputs['set-cookie-583d14fc'] = step4Result;
    }

      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['set-cookie-583d14fc'] = {
      nodeId: 'set-cookie-583d14fc',
      nodeType: 'run-javascript',
      stepNumber: 4,
      displayName: 'run-javascript_4741',
      data: step4Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for run-javascript
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['run-javascript_4741'] || typeof flowResults['run-javascript_4741'] === 'undefined') {
      flowResults['run-javascript_4741'] = step4Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
      currentResult = step4Result; // Update currentResult for next step
    } catch (stepError) {
      const stepErrorMessage = stepError instanceof Error ? stepError.message : String(stepError) || 'Unknown step error';
      console.error('❌ Error in step 4 (run-javascript):', stepError);
      flowErrors.push(`Step 4 (run-javascript): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step4Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'run-javascript',
        nodeId: 'set-cookie-583d14fc',
        stepNumber: 4
      };
      
      currentResult = step4Result; // Update currentResult even on error
    }
    

    // === STEP 5: NAVIGATE ===
    try {
      
        // Navigate to static page
        step5Result;
        try {
          // === CHECK FOR AUTHENTICATION ERRORS BEFORE NAVIGATION ===
          // Prevent navigation if authentication errors occurred
          if (flowResults && flowResults.authError === true) {
            console.warn('⚠️ Navigation prevented due to authentication error:', flowResults.lastAuthError || 'Authentication failed');
            step5Result = {
              success: false,
              targetUrl: "/login",
              error: 'Navigation blocked due to authentication error',
              navigationParams: '',
              timestamp: new Date().toISOString(),
              blocked: true,
              reason: 'authentication_error'
            };
          } else {
            // Check if any previous AUTHENTICATION HTTP nodes failed (not all HTTP errors)
            let hasAuthHttpError = false;
            if (flowResults && flowResults.nodeResults && typeof flowResults.nodeResults === 'object') {
              const nodeResultsArray = Object.values(flowResults.nodeResults);
              hasAuthHttpError = nodeResultsArray.some((result: any) => {
                if (!result || result.nodeType !== 'http' || result.success !== false) {
                  return false;
                }
                // Check if this HTTP node was for an authentication endpoint
                const httpUrl = result.httpUrl || result.url || result.data?.httpUrl || '';
                if (!httpUrl) {
                  return false;
                }
                const lowerUrl = String(httpUrl).toLowerCase();
                const isAuthEndpoint = lowerUrl.includes('/login') || 
                                       lowerUrl.includes('/signup') || 
                                       lowerUrl.includes('/sign-in') ||
                                       lowerUrl.includes('/sign-up') ||
                                       lowerUrl.includes('/register') ||
                                       lowerUrl.includes('/auth/login') ||
                                       lowerUrl.includes('/auth/signup') ||
                                       lowerUrl.includes('/auth/register');
                return isAuthEndpoint;
              });
            }
            
            if (hasAuthHttpError) {
              console.warn('⚠️ Navigation prevented due to authentication HTTP request failure');
              step5Result = {
                success: false,
                targetUrl: "/login",
                error: 'Navigation blocked due to authentication HTTP request failure',
                navigationParams: '',
                timestamp: new Date().toISOString(),
                blocked: true,
                reason: 'auth_http_error'
              };
            } else {
              const targetUrl = "/login";
              console.log('🧭 Navigating to:', targetUrl);
              
              if (typeof router !== 'undefined') {
                // ✅ SOLUTION 4: Set redirect flag before navigation
                if (typeof window !== 'undefined') {
                  (window as any).__isRedirecting = true;
                }
                router.push(targetUrl);
                step5Result = {
                  success: true,
                  targetUrl: targetUrl,
                  navigationParams: '',
                  timestamp: new Date().toISOString()
                };
              } else {
                console.error('❌ Router not available for navigation');
                step5Result = {
                  success: false,
                  targetUrl: targetUrl,
                  error: 'Router not available',
                  navigationParams: '',
                  timestamp: new Date().toISOString()
                };
              }
            }
          }
        } catch (error) {
          console.error('❌ Navigation error:', error);
          step5Result = {
            success: false,
            targetUrl: "/login",
            error: error.message || 'Navigation failed',
            navigationParams: '',
            timestamp: new Date().toISOString()
          };
        }
      
      
      
    // Store result in enhanced data flow system
    flowResults.nodeResults['redirect-583d14fc'] = {
      nodeId: 'redirect-583d14fc',
      nodeType: 'navigate',
      stepNumber: 5,
      displayName: 'navigate_4742',
      data: step5Result,
      timestamp: new Date().toISOString(),
      success: true
    };
    
    // Store in specialized collection using dynamic variable name
    // No specialized storage for navigate
    
    // Store at top-level for direct access (CRITICAL for HTTP nodes)
    // CRITICAL FIX: Don't overwrite if the processor already set a formatted result
    // This is especially important for Bolna AI which stores formattedResult before polling
    if (!flowResults['navigate_4742'] || typeof flowResults['navigate_4742'] === 'undefined') {
      flowResults['navigate_4742'] = step5Result;
    }
    
    // Update previous result
    flowResults.previousResult = flowResults.currentResult;
    
    
      currentResult = step5Result; // Update currentResult for next step
    } catch (stepError) {
      const stepErrorMessage = stepError instanceof Error ? stepError.message : String(stepError) || 'Unknown step error';
      console.error('❌ Error in step 5 (navigate):', stepError);
      flowErrors.push(`Step 5 (navigate): ${stepErrorMessage}`);
      
      // Set a default result for this step to avoid undefined references
      step5Result = { 
        error: true, 
        message: stepErrorMessage, 
        nodeType: 'navigate',
        nodeId: 'redirect-583d14fc',
        stepNumber: 5
      };
      
      currentResult = step5Result; // Update currentResult even on error
    }
    

    } else {

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
      if ('flow_trigger-583d14fc_1771079854736'.includes('button')) {
        // Extract button node information from chain
        const buttonNodes = Object.values(flowResults.nodeResults || {}).filter(
          (result: any) => result.nodeType === 'button'
        );
        
        buttonNodes.forEach((buttonNode: any) => {
          // Store chain ID mapped to button element ID
          if (buttonNode.elementId) {
            (window as any).buttonChainRegistry[buttonNode.elementId] = 'flow_trigger-583d14fc_1771079854736';
            console.log(`🔗 Registered button chain: ${buttonNode.elementId} → flow_trigger-583d14fc_1771079854736`);
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
        detail: { flowResults, chainId: 'flow_trigger-583d14fc_1771079854736' } 
      }));
      (window as any).dispatchEvent(new CustomEvent('flowExecutionCompleted', { 
        detail: { flowResults, chainId: 'flow_trigger-583d14fc_1771079854736' } 
      }));
      console.log("📡 Dispatched workflow completion events");
    }
    
    return {
      success: true,
      results: flowResults,
      errors: flowErrors,
      chainId: 'flow_trigger-583d14fc_1771079854736'
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error) || 'Unknown error';
    console.error('❌ Flow chain execution error:', error);
    return {
      success: false,
      results: flowResults,
      errors: [...flowErrors, errorMessage],
      chainId: 'flow_trigger-583d14fc_1771079854736'
    };
  }
};







// Register workflow nodes in global registry for cross-workflow node lookups
if (workflowRegistry && workflowRegistry.allNodes) {
  const workflowNodes = [{"id":"trigger-583d14fc","nodeType":"form","config":{"label":"Form Submit","formId":"auth-form","inputs":[],"componentId":"auth-form","triggerType":"form_submit","_auth_metadata":{"page_id":"page-17702830188969191","component_id":"nested-1771072119472-8257","cookie_names":["auth_token","user_id"],"tables_added":[],"auth_block_id":"id-17710708530174553","auth_block_label":"Basic Signup","auth_block_category":"Signup"},"suggestedApiBody":{},"suggestedApiEndpoint":"/api/form/auth-form"}},{"id":"validate-583d14fc","nodeType":"if-conditional","config":{"label":"Validate Data","condition":"{{form.email}} && {{form.password}} && {{form.confirm_password}} && {{form.password}} === {{form.confirm_password}}","validations":[{"type":"email","field":"email","required":true},{"type":"password","field":"password","required":true,"minLength":8},{"type":"match","field":"confirm_password","required":true,"matchField":"password"}]}},{"id":"create-user-583d14fc","nodeType":"http","config":{"url":"/api/auth/signup","body":{"email":"{{form.email}}","password":"{{form.password}}","confirm_password":"{{form.confirm_password}}"},"label":"Create User","method":"POST","headers":[],"bodyType":"empty","formFields":[],"bodyContent":"","contentType":"application/json","queryParams":[],"parseResponse":false,"resultVariable":"httpResult"}},{"id":"set-cookie-583d14fc","nodeType":"run-javascript","config":{"code":"// Set authentication cookies from previous HTTP node response\nconst createUserNodeId = 'create-user-583d14fc';\nconst authToken = workflowData[createUserNodeId]?.access_token || workflowData[createUserNodeId]?.token || workflowData[createUserNodeId]?.data?.access_token;\nconst userId = workflowData[createUserNodeId]?.user?.id || workflowData[createUserNodeId]?.user_id || workflowData[createUserNodeId]?.data?.user?.id;\n\nif (authToken && userId) {\n    // Set cookies using document.cookie (client-side)\n    const isSecure = window.location.protocol === 'https:';\n    document.cookie = `auth_token=${authToken}; path=/; max-age=86400; SameSite=Lax${isSecure ? '; Secure' : ''}`;\n    document.cookie = `user_id=${userId}; path=/; max-age=86400; SameSite=Lax${isSecure ? '; Secure' : ''}`;\n    \n    // Store in workflow data for next node\n    workflowData['auth_token'] = authToken;\n    workflowData['user_id'] = userId;\n}","label":"Set Auth Cookie","timeout":30,"description":"Custom JavaScript execution","inputVariables":[],"outputVariable":"jsResult"}},{"id":"redirect-583d14fc","nodeType":"navigate","config":{"url":"/dashboard","label":"Redirect","method":"push","nodeType":"navigate","noteText":"","targetUrl":"/login","selectedPageId":"page-17706133359975892","selectedPageUrl":"/login","navigationParams":"","selectedPageName":"Login"}}];
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
  
  
  // Execute flow_trigger-583d14fc_1771079854736
  if (!specificChainId || specificChainId === 'flow_trigger-583d14fc_1771079854736') {
    
    // ✅ CRITICAL FIX: Form workflows should only execute on form-submission trigger
    // Note: Multiple form workflows may run, but they'll handle their own logic (e.g., login vs signup endpoints)
    const triggerType = triggerData?.trigger || 'manual';
    const workflowAuthCategory = 'Signup';
    
    // Debug logging for form workflows (only in development)
    const DEBUG_FLOW_SYSTEM_FORM = typeof process !== 'undefined' && process.env.NODE_ENV === 'development';
    if (DEBUG_FLOW_SYSTEM_FORM) {
      console.log('🔍 Form Workflow Check:', { 
        chainId: 'flow_trigger_583d14fc_1771079854736', 
        triggerType, 
        authCategory: workflowAuthCategory,
        specificChainId
      });
    }
    
    // ✅ SOLUTION 2: Redirect flag check - Skip if redirect is in progress
    if (typeof window !== 'undefined' && (window as any).__isRedirecting && !specificChainId) {
      if (DEBUG_FLOW_SYSTEM_FORM) {
        console.log('⏭️ SKIPPING Form workflow - redirect in progress');
      }
      results['flow_trigger_583d14fc_1771079854736'] = { 
        success: false, 
        skipped: true, 
        reason: 'Redirect in progress',
        chainId: 'flow_trigger_583d14fc_1771079854736',
        triggerType: triggerType,
        workflowType: 'form'
      };
      return; // Explicit early return
    }
    
    // Skip on page-load
    if (triggerType === 'page-load' && !specificChainId) {
      results['flow_trigger_583d14fc_1771079854736'] = { 
        success: false, 
        skipped: true, 
        reason: 'Form workflow should not run on page load',
        chainId: 'flow_trigger_583d14fc_1771079854736',
        triggerType: triggerType,  // FIXED: Use actual triggerType, not hardcoded 'form'
        workflowType: 'form',
        actualTrigger: triggerType
      };
      return; // Explicit early return
    }
    // Skip if this is NOT a form-submission trigger (unless explicitly called)
    else if (triggerType !== 'form-submission' && triggerType !== 'manual' && !specificChainId) {
      results['flow_trigger_583d14fc_1771079854736'] = { 
        success: false, 
        skipped: true, 
        reason: 'Form workflow should only execute on form-submission trigger',
        chainId: 'flow_trigger_583d14fc_1771079854736',
        triggerType: triggerType,  // FIXED: Use actual triggerType
        workflowType: 'form',
        actualTrigger: triggerType,
        expectedTrigger: 'form-submission'
      };
      return; // Explicit early return
    }
    else {
      // Proceed with form workflow execution
      // Note: The workflow itself will handle login vs signup logic (e.g., different API endpoints)
      try {
        const result_flow_trigger_583d14fc_1771079854736 = await executeFlowChain_flow_trigger_583d14fc_1771079854736(triggerData);
        results['flow_trigger_583d14fc_1771079854736'] = result_flow_trigger_583d14fc_1771079854736;
        
        if (!result_flow_trigger_583d14fc_1771079854736.success) {
          if (DEBUG_FLOW_SYSTEM_FORM) {
            console.error('❌ Chain flow_trigger_583d14fc_1771079854736 failed:', result_flow_trigger_583d14fc_1771079854736.errors);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error) || 'Unknown error';
        if (DEBUG_FLOW_SYSTEM_FORM) {
          console.error('💥 Error executing flow flow_trigger_583d14fc_1771079854736:', error);
        }
        results['flow_trigger_583d14fc_1771079854736'] = { success: false, error: errorMessage, chainId: 'flow_trigger_583d14fc_1771079854736', results: {}, errors: [errorMessage] };
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
    "id": "flow_trigger-583d14fc_1771079854736",
    "nodeTypes": [
      "form",
      "if-conditional",
      "http",
      "run-javascript",
      "navigate"
    ],
    "nodeCount": 5,
    "chainType": "conditional",
    "startNode": {
      "id": "trigger-583d14fc",
      "nodeType": "form",
      "config": {
        "label": "Form Submit",
        "formId": "auth-form",
        "inputs": [],
        "componentId": "auth-form",
        "triggerType": "form_submit",
        "_auth_metadata": {
          "page_id": "page-17702830188969191",
          "component_id": "nested-1771072119472-8257",
          "cookie_names": [
            "auth_token",
            "user_id"
          ],
          "tables_added": [],
          "auth_block_id": "id-17710708530174553",
          "auth_block_label": "Basic Signup",
          "auth_block_category": "Signup"
        },
        "suggestedApiBody": {},
        "suggestedApiEndpoint": "/api/form/auth-form"
      }
    },
    "endNode": {
      "id": "redirect-583d14fc",
      "nodeType": "navigate",
      "config": {
        "url": "/dashboard",
        "label": "Redirect",
        "method": "push",
        "nodeType": "navigate",
        "noteText": "",
        "targetUrl": "/login",
        "selectedPageId": "page-17706133359975892",
        "selectedPageUrl": "/login",
        "navigationParams": "",
        "selectedPageName": "Login"
      }
    },
    "nodes": [
      {
        "id": "trigger-583d14fc",
        "nodeType": "form",
        "config": {
          "label": "Form Submit",
          "formId": "auth-form",
          "inputs": [],
          "componentId": "auth-form",
          "triggerType": "form_submit",
          "_auth_metadata": {
            "page_id": "page-17702830188969191",
            "component_id": "nested-1771072119472-8257",
            "cookie_names": [
              "auth_token",
              "user_id"
            ],
            "tables_added": [],
            "auth_block_id": "id-17710708530174553",
            "auth_block_label": "Basic Signup",
            "auth_block_category": "Signup"
          },
          "suggestedApiBody": {},
          "suggestedApiEndpoint": "/api/form/auth-form"
        }
      },
      {
        "id": "validate-583d14fc",
        "nodeType": "if-conditional",
        "config": {
          "label": "Validate Data",
          "condition": "{{form.email}} && {{form.password}} && {{form.confirm_password}} && {{form.password}} === {{form.confirm_password}}",
          "validations": [
            {
              "type": "email",
              "field": "email",
              "required": true
            },
            {
              "type": "password",
              "field": "password",
              "required": true,
              "minLength": 8
            },
            {
              "type": "match",
              "field": "confirm_password",
              "required": true,
              "matchField": "password"
            }
          ]
        }
      },
      {
        "id": "create-user-583d14fc",
        "nodeType": "http",
        "config": {
          "url": "/api/auth/signup",
          "body": {
            "email": "{{form.email}}",
            "password": "{{form.password}}",
            "confirm_password": "{{form.confirm_password}}"
          },
          "label": "Create User",
          "method": "POST",
          "headers": [],
          "bodyType": "empty",
          "formFields": [],
          "bodyContent": "",
          "contentType": "application/json",
          "queryParams": [],
          "parseResponse": false,
          "resultVariable": "httpResult"
        }
      },
      {
        "id": "set-cookie-583d14fc",
        "nodeType": "run-javascript",
        "config": {
          "code": "// Set authentication cookies from previous HTTP node response\nconst createUserNodeId = 'create-user-583d14fc';\nconst authToken = workflowData[createUserNodeId]?.access_token || workflowData[createUserNodeId]?.token || workflowData[createUserNodeId]?.data?.access_token;\nconst userId = workflowData[createUserNodeId]?.user?.id || workflowData[createUserNodeId]?.user_id || workflowData[createUserNodeId]?.data?.user?.id;\n\nif (authToken && userId) {\n    // Set cookies using document.cookie (client-side)\n    const isSecure = window.location.protocol === 'https:';\n    document.cookie = `auth_token=${authToken}; path=/; max-age=86400; SameSite=Lax${isSecure ? '; Secure' : ''}`;\n    document.cookie = `user_id=${userId}; path=/; max-age=86400; SameSite=Lax${isSecure ? '; Secure' : ''}`;\n    \n    // Store in workflow data for next node\n    workflowData['auth_token'] = authToken;\n    workflowData['user_id'] = userId;\n}",
          "label": "Set Auth Cookie",
          "timeout": 30,
          "description": "Custom JavaScript execution",
          "inputVariables": [],
          "outputVariable": "jsResult"
        }
      },
      {
        "id": "redirect-583d14fc",
        "nodeType": "navigate",
        "config": {
          "url": "/dashboard",
          "label": "Redirect",
          "method": "push",
          "nodeType": "navigate",
          "noteText": "",
          "targetUrl": "/login",
          "selectedPageId": "page-17706133359975892",
          "selectedPageUrl": "/login",
          "navigationParams": "",
          "selectedPageName": "Login"
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

