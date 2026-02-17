// ===== SHARED FLOW INTEGRATION SYSTEM =====
// Generated: 2026-02-14T14:37:34.681Z
// This file contains shared code used by all workflow files

// Template engine import (always needed)
import { TemplateExpressionEngine } from './template-engine';

// ===== SHARED INTERFACES =====

interface FlowResult {
  success: boolean;
  results: Record<string, any>;
  errors: string[];
  chainId: string;
  executionTime?: number;
  totalChains?: number;
  successfulChains?: number;
}

interface ButtonResult {
  buttonId: string;
  clicked: boolean;
  inputData: any;
}

interface FormData extends Record<string, any> {}

interface InputRefsType {
  current: Record<string, HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>;
}

interface TextareaRefsType {
  current: Record<string, HTMLTextAreaElement>;
}

interface SelectRefsType {
  current: Record<string, HTMLSelectElement>;
}

// Extend Window interface for universal data flow access
declare global {
  interface Window {
    executeAllFlows?: (triggerData?: any, specificChainId?: string | null) => Promise<any>;
    executeSpecificFlow?: (chainId: string, data?: any) => Promise<any>;
    getFlowChainInfo?: () => any[];
    dataFlow?: Record<string, any>;
    getPreviousResult?: (nodeId: any) => any;
    getFlowResult?: (nodeType: any) => any;
    getAllFlowResults?: () => Record<string, any>;
    getInput?: (name: any) => any;
    getValue?: (name: any) => any;
    setValue?: (name: any, value: any) => void;
    clearInput?: (name: any) => void;
    _globalExecutionTracker?: {
      executedFlows: Set<string>;
      isAutoExecutionComplete: boolean;
      executionInProgress: boolean;
    };
    buttonChainRegistry?: Record<string, string>;
    buttonTimestampRegistry?: Record<string, any>;
    whatsappPollingIntervals?: Record<string, any>;
    incomingWebhookData?: Record<string, any>;
  }
}

// ===== SHARED UTILITY FUNCTIONS =====

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

// Universal input handling
export const inputRefs: InputRefsType = { current: {} };
export const textareaRefs: TextareaRefsType = { current: {} };
export const selectRefs: SelectRefsType = { current: {} };

// Universal form data tracking
export let formData: FormData = {};

// Universal flow results with enhanced data collections
export let flowResults: Record<string, any> = {
  nodeResults: {},
  variables: {},
  inputs: {},
  apiResponses: {},
  formData: {},
  inboundEmailData: {},
  calculations: {},
  aiResponses: {}
};

// Enhanced Data Flow Helper Functions
export const dataFlow = {
  // Get current result
  current: () => flowResults.currentResult,
  
  // Get previous step result
  previous: () => flowResults.previousResult,
  
  // Get result by variable name
  get: (name: any) => {
    // First check at the top level (for form fields and email fields)
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
    
    if (nodeResult.nodeType === 'form' && nodeResult.data) {
      return nodeResult.data;
    }
    
    if (nodeResult.nodeType === 'button' && nodeResult.data && nodeResult.data.buttonId) {
      return nodeResult.data.buttonId;
    }
    
    if (nodeResult.nodeType === 'if-conditional' && nodeResult.data && nodeResult.data.conditionResult !== undefined) {
      return String(nodeResult.data.conditionResult);
    }
    
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
    
    return [...new Set(names)].sort();
  }
};

// Process initial data for form and inbound email data
export const processInitialData = (initialData: any) => {
  if (!initialData || typeof initialData !== 'object') return;
  
  console.log('🔄 Processing initial data for flow...');
  
  // Process form data if provided in the initial data
  if (initialData.formData && typeof initialData.formData === 'object') {
    flowResults.formData = { ...initialData.formData };
    
    // Also make form fields accessible at the top level for template variables
    Object.entries(initialData.formData).forEach(([key, value]) => {
      if (!key.startsWith('_')) {
        flowResults[key] = value;
      }
    });
    
    console.log('📝 Extracted form data from initialData.formData:', flowResults.formData);
  }
  
  // Check for form-like data at the top level
  const topLevelFormData = {};
  let hasFormFields = false;
  
  Object.entries(initialData).forEach(([key, value]) => {
    // Skip metadata and special properties
    if (!key.startsWith('_') && 
        key !== 'buttonId' && 
        key !== 'formId' && 
        key !== 'trigger' &&
        key !== 'clickTimestamp' &&
        key !== 'timestamp') {
      
      // Only include simple values that look like form fields
      if (typeof value === 'string' || 
          typeof value === 'number' || 
          typeof value === 'boolean') {
        topLevelFormData[key] = value;
        hasFormFields = true;
      }
    }
  });
  
  if (hasFormFields) {
    // Store in formData if not already set
    if (!flowResults.formData || Object.keys(flowResults.formData).length === 0) {
      flowResults.formData = topLevelFormData;
      console.log('📝 Extracted form-like data from top level:', topLevelFormData);
    }
    
    // Also make form fields accessible at the top level for template variables
    Object.entries(topLevelFormData).forEach(([key, value]) => {
      flowResults[key] = value;
    });
  }
  
  // Process inbound email data if provided in the initial data
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
    const topLevelEmailData = {};
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
  
  console.log('✅ Initial data processing completed');
};

// Global workflow registry for cross-workflow dependencies
export const workflowRegistry: {
  workflows: Map<string, { execute: (data: any) => Promise<any>; getChainInfo: () => any[] }>;
  allNodes: any[];
  allAgents: Record<string, any>;
} = {
  workflows: new Map(),
  allNodes: [],
  allAgents: {}
};

// Make dataFlow available globally
if (typeof window !== 'undefined') {
  (window as any).dataFlow = dataFlow;
  (window as any).getPreviousResult = dataFlow.previous;
  (window as any).getFlowResult = dataFlow.get;
  (window as any).getAllFlowResults = dataFlow.getAvailableNames;
  
  // Initialize global execution tracker
  if (!(window as any)._globalExecutionTracker) {
    (window as any)._globalExecutionTracker = {
      executedFlows: new Set(),
      isAutoExecutionComplete: false,
      executionInProgress: false
    };
  }
  
  // Initialize button chain registry
  if (!(window as any).buttonChainRegistry) {
    (window as any).buttonChainRegistry = {};
  }
  
  if (!(window as any).buttonTimestampRegistry) {
    (window as any).buttonTimestampRegistry = {};
  }
}

console.log('✅ Shared Flow Integration System initialized');
