"use client";
import React from 'react';
import { useState, useRef, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// Flow Integration System Types
declare global {
  interface Window {
    executeAllFlows?: (triggerData?: any, specificChainId?: string | null) => Promise<any>;
    executeSpecificFlow?: (chainId: string, data?: any) => Promise<any>;
    getFlowChainInfo?: () => any[];
    debugFlowSystem?: () => any;
  }
}

// Flow Integration System Variables
let executeAllFlows: any = null;
let executeSpecificFlow: any = null;
let getFlowChainInfo: any = null;

// Template Engine Import for Flow Integration
import { TemplateExpressionEngine } from '../lib/template-engine';

declare global {
  interface Window {
    dataFlow?: Record<string, any>;
    executeAllFlows?: (triggerData?: any, specificChainId?: string | null) => Promise<any>;
    executeSpecificFlow?: (chainId: string, data?: any) => Promise<any>;
    getFlowChainInfo?: () => any[];
    debugFlowSystem?: () => any;
  }
}


export default function SignUp() {
  const router = useRouter();

  // Utility function to convert text to URL slug
  const convertToSlug = (text: string) => {
    return text.toLowerCase().replace(/\s+/g, '-');
  };

  // Form state management
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const loginCredentialsRef = useRef<any>(null);

  // Input references
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  // Form submission handler
  const handleid17710721194725045Submit = async (e: FormEvent, formId: string) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);

    try {
      // Dynamically extract field names from DOM labels
      const extractFieldNamesFromDOM = (formId: string): Record<string, string> => {
        const fieldMapping: Record<string, string> = {};

        try {
          // Find the form element
          const formElement = document.querySelector(`[data-component-id="${formId}"]`);
          if (!formElement) {
            return fieldMapping;
          }

          // Find all input, select, and textarea elements
          const inputs = formElement.querySelectorAll('input, select, textarea');

          inputs.forEach((input: Element) => {
            const inputId = input.getAttribute('data-component-id') || input.id;
            if (!inputId) return;

            let fieldName = '';

            // Method 1: Look for a label that comes immediately before this input
            const parent = input.closest('div');
            if (parent) {
              const label = parent.querySelector('label');
              if (label && label.textContent) {
                fieldName = label.textContent.trim();
              }
            }

            // Method 2: Look for label by traversing siblings
            if (!fieldName) {
              let sibling = input.previousElementSibling;
              while (sibling) {
                if (sibling.tagName === 'LABEL' && sibling.textContent) {
                  fieldName = sibling.textContent.trim();
                  break;
                }
                sibling = sibling.previousElementSibling;
              }
            }

            // Method 2.5: Look for label within the same parent container
            if (!fieldName) {
              const parent = input.closest('div');
              if (parent) {
                const label = parent.querySelector('label');
                if (label && label.textContent) {
                  fieldName = label.textContent.trim();
                }
              }
            }

            // Method 3: Check for span text in checkbox labels
            if (!fieldName && (input as HTMLInputElement).type === 'checkbox') {
              const checkboxLabel = input.closest('label');
              if (checkboxLabel) {
                const span = checkboxLabel.querySelector('span');
                if (span && span.textContent) {
                  fieldName = span.textContent.trim();
                }
              }
            }

            // Method 4: Use placeholder as fallback
            if (!fieldName && (input as HTMLInputElement).placeholder) {
              fieldName = (input as HTMLInputElement).placeholder.replace(/^(enter your?|enter|type|please enter|input)\s*/i, '').trim();
              // Capitalize first letter
              fieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
            }

            // Store the mapping
            if (fieldName) {
              fieldMapping[inputId] = fieldName;
            } else {
              fieldMapping[inputId] = inputId;
            }
          });

        } catch (error) {
          console.error('Error extracting field names from DOM:', error);
        }

        return fieldMapping;
      };

      // Extract field mapping dynamically
      const fieldMapping = extractFieldNamesFromDOM(formId);

      // Collect form data with dynamically extracted field names
      const newFormData: Record<string, any> = {};

      // Apply the mapping with field name normalization for backend compatibility
      Object.keys(fieldMapping).forEach(inputId => {
        let fieldName = fieldMapping[inputId];
        let fieldValue: string | boolean | number | undefined;

        // Helper function to safely extract and convert value to primitive
        const safeGetValue = (element: HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement): string | boolean | number | undefined => {
          if (!element) return undefined;

          // Handle checkbox
          if (element instanceof HTMLInputElement && element.type === 'checkbox') {
            return element.checked || false;
          }

          // Handle radio buttons
          if (element instanceof HTMLInputElement && element.type === 'radio') {
            return element.checked ? element.value : undefined;
          }

          // Handle select (single or multiple)
          if (element instanceof HTMLSelectElement) {
            if (element.multiple) {
              const selectedValues = Array.from(element.selectedOptions).map(opt => opt.value);
              return selectedValues.length > 0 ? selectedValues.join(',') : '';
            }
            return element.value || '';
          }

          // Handle number inputs
          if (element instanceof HTMLInputElement && element.type === 'number') {
            const numValue = parseFloat(element.value);
            return isNaN(numValue) ? '' : numValue;
          }

          // Handle all other inputs and textareas - ensure string conversion
          const rawValue = element.value || '';
          if (typeof rawValue === 'string') {
            return rawValue;
          }
          if (typeof rawValue === 'number' || typeof rawValue === 'boolean') {
            return rawValue;
          }
          // If somehow it's an object, convert to string
          if (typeof rawValue === 'object' && rawValue !== null) {
            try {
              return JSON.stringify(rawValue);
            } catch {
              return String(rawValue);
            }
          }
          return '';
        };

        // Try to get value from refs first
        if (inputRefs.current[inputId]) {
          fieldValue = safeGetValue(inputRefs.current[inputId] as HTMLInputElement);
        } else if (textareaRefs.current[inputId]) {
          fieldValue = safeGetValue(textareaRefs.current[inputId] as HTMLTextAreaElement);
        } else if (selectRefs.current[inputId]) {
          fieldValue = safeGetValue(selectRefs.current[inputId] as HTMLSelectElement);
        } else {
          // ✅ CRITICAL FIX: Fallback to query DOM directly if refs don't have the element
          try {
            const formElement = document.querySelector(`[data-component-id="${formId}"]`);
            if (formElement) {
              const domElement = formElement.querySelector(`[data-component-id="${inputId}"], #${inputId}`) as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement | null;
              if (domElement) {
                fieldValue = safeGetValue(domElement);
              }
            }
          } catch (error) {
            console.error(`Error querying DOM for input ${inputId}:`, error);
          }
        }

        // Skip undefined values (don't store them)
        if (fieldValue === undefined) {
          return;
        }

        // Normalize field name for backend compatibility
        let normalizedFieldName = fieldName.toLowerCase().replace(/ /g, '_');

        // Handle special checkbox fields - convert long checkbox text to 'checkbox'
        if (fieldName.toLowerCase().includes('agree') ||
          fieldName.toLowerCase().includes('contact') ||
          fieldName.toLowerCase().includes('consent') ||
          fieldName.toLowerCase().includes('terms') ||
          fieldName.toLowerCase().includes('privacy') ||
          (typeof fieldValue === 'boolean' && fieldName.length > 10)) {
          normalizedFieldName = 'checkbox';
        }

        // Store both original and normalized field names for maximum compatibility
        newFormData[fieldName] = fieldValue;           // Original field name
        newFormData[normalizedFieldName] = fieldValue; // Normalized field name
      });


      // ✅ CRITICAL FIX: Validate signup form passwords BEFORE executing workflows
      // Check if this is a signup form (has confirm_password field)
      const isSignupForm = newFormData.hasOwnProperty('confirm_password') ||
        newFormData.hasOwnProperty('confirmPassword') ||
        newFormData.hasOwnProperty('Confirm Password') ||
        newFormData.hasOwnProperty('confirm_password');

      if (isSignupForm) {
        // Extract password and confirm password values (check multiple field name variations)
        const password = newFormData.password || newFormData.Password || newFormData['Password'] || '';
        const confirmPassword = newFormData.confirm_password ||
          newFormData.confirmPassword ||
          newFormData['Confirm Password'] ||
          newFormData['confirm_password'] || '';

        // Validate passwords match
        if (password && confirmPassword && password !== confirmPassword) {
          console.error('❌ Password validation failed: Passwords do not match');
          alert('Passwords do not match. Please check and try again.');
          setIsSubmitting(false);
          return; // Exit early - do NOT execute workflows
        }

        // Validate password is not empty
        if (!password || password.trim() === '') {
          console.error('❌ Password validation failed: Password is required');
          alert('Password is required');
          setIsSubmitting(false);
          return; // Exit early - do NOT execute workflows
        }
      }

      // Execute flow integration (email workflows, etc.)
      try {
        // ✅ SOLUTION 2: Check redirect flag before executing workflows
        if (typeof window !== 'undefined' && (window as any).__isRedirecting) {
          console.log('🛑 Skipping workflow execution - redirect in progress');
          return;
        }

        if (typeof window !== 'undefined' && (window as any).executeAllFlows) {
          // ✅ SOLUTION 1: For login forms, call only the login workflow instead of all workflows
          // Check if this is a login form by checking if loginCredentialsRef is set
          const isLoginForm = typeof loginCredentialsRef !== 'undefined' && loginCredentialsRef?.current;

          if (isLoginForm && typeof (window as any).executeSpecificFlow === 'function' && typeof (window as any).getFlowChainInfo === 'function') {
            // Find the login workflow chain ID
            const flowChains = (window as any).getFlowChainInfo();
            const loginWorkflow = flowChains.find((chain: any) => {
              // Check if this is a login workflow by examining the start node
              const startNode = chain.startNode;
              const authCategory = startNode?.config?._auth_metadata?.auth_block_category;
              return startNode?.nodeType === 'form' &&
                (authCategory?.toLowerCase().includes('login') || authCategory?.toLowerCase().includes('signin'));
            });

            if (loginWorkflow) {
              // If we have stored login credentials (Scenario 2), use them for workflow
              if (loginCredentialsRef?.current) {
                newFormData.email = loginCredentialsRef.current.email;
                newFormData.Email = loginCredentialsRef.current.email;
                newFormData.password = loginCredentialsRef.current.password;
                newFormData.Password = loginCredentialsRef.current.password;
                // Clear the ref after using it
                loginCredentialsRef.current = null;
              }

              // Pass form data both at top level and nested for maximum compatibility
              const flowData = {
                ...newFormData,  // Form fields at top level for easy access
                formId: 'id-17710721194725045',
                formData: newFormData,  // Also nested for backward compatibility
                trigger: 'form-submission',
                timestamp: new Date().toISOString()
              };

              // ✅ SOLUTION 1: Call only the login workflow, not all workflows
              console.log('🔐 Calling only login workflow:', loginWorkflow.id);
              await (window as any).executeSpecificFlow(loginWorkflow.id, flowData);
              return; // Exit early after login workflow
            }
          }

          // ✅ SOLUTION 3: For signup forms, call only the signup workflow instead of all workflows
          if (isSignupForm && typeof (window as any).executeSpecificFlow === 'function' && typeof (window as any).getFlowChainInfo === 'function') {
            // Find the signup workflow chain ID
            const flowChains = (window as any).getFlowChainInfo();
            const signupWorkflow = flowChains.find((chain: any) => {
              // Check if this is a signup workflow by examining the start node
              const startNode = chain.startNode;
              const authCategory = startNode?.config?._auth_metadata?.auth_block_category;
              return startNode?.nodeType === 'form' &&
                (authCategory?.toLowerCase().includes('signup') ||
                  authCategory?.toLowerCase().includes('register') ||
                  authCategory?.toLowerCase().includes('sign-up'));
            });

            if (signupWorkflow) {
              // Pass form data both at top level and nested for maximum compatibility
              const flowData = {
                ...newFormData,  // Form fields at top level for easy access
                formId: 'id-17710721194725045',
                formData: newFormData,  // Also nested for backward compatibility
                trigger: 'form-submission',
                timestamp: new Date().toISOString()
              };

              // ✅ SOLUTION 3: Call only the signup workflow, not all workflows
              console.log('📝 Calling only signup workflow:', signupWorkflow.id);
              await (window as any).executeSpecificFlow(signupWorkflow.id, flowData);
              return; // Exit early after signup workflow
            }
          }

          // If we have stored login credentials (Scenario 2), use them for workflow
          if (typeof loginCredentialsRef !== 'undefined' && loginCredentialsRef?.current) {
            newFormData.email = loginCredentialsRef.current.email;
            newFormData.Email = loginCredentialsRef.current.email;
            newFormData.password = loginCredentialsRef.current.password;
            newFormData.Password = loginCredentialsRef.current.password;
            // Clear the ref after using it
            loginCredentialsRef.current = null;
          }

          // Pass form data both at top level and nested for maximum compatibility
          const flowData = {
            ...newFormData,  // Form fields at top level for easy access
            formId: 'id-17710721194725045',
            formData: newFormData,  // Also nested for backward compatibility
            trigger: 'form-submission',
            timestamp: new Date().toISOString()
          };

          const flowResult = await (window as any).executeAllFlows(flowData);

          // Check if any email flows were executed successfully
          if (flowResult && flowResult.results) {
            const emailResults = Object.values(flowResult.results).filter((result: any) =>
              result && result.results && result.results.emailResult
            );

            if (emailResults.length > 0) {
              const successfulEmails = emailResults.filter((result: any) =>
                result.results.emailResult.success
              );
            }
          }
        }
      } catch (flowError) {
        console.error('Flow integration failed:', flowError);
      }
      // Form submission successful

      // Show success notification
      // alert('Form submitted successfully!');

      // Reset form
      Object.keys(inputRefs.current).forEach(key => {
        if (inputRefs.current[key]) {
          inputRefs.current[key].value = '';
        }
      });
      Object.keys(textareaRefs.current).forEach(key => {
        if (textareaRefs.current[key]) {
          textareaRefs.current[key].value = '';
        }
      });
      Object.keys(selectRefs.current).forEach(key => {
        if (selectRefs.current[key]) {
          selectRefs.current[key].selectedIndex = 0;
        }
      });

      setFormData({});
    } catch (error) {
      console.error('Form submission error:', error);

      // Show error notification
      // alert('Form submission failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };


  const textareaRefs = useRef<Record<string, HTMLTextAreaElement | null>>({});
  const selectRefs = useRef<Record<string, HTMLSelectElement | null>>({});

  // Make router available globally for navigation workflows
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      (window as any).router = router;
      console.log('🧭 Router made available globally for navigation workflows');
    }
  }, [router]);

  // Flow Integration System Initialization
  React.useEffect(() => {
    // Flow Integration System Variables
    let executeAllFlows: any = null;
    let executeSpecificFlow: any = null;
    let getFlowChainInfo: any = null;

    // Async function to load flow integration
    const loadFlowIntegration = async () => {
      try {
        const flowIntegration = await import('../lib/flow-integration-index').catch(() => null);
        if (flowIntegration) {
          executeAllFlows = flowIntegration.executeAllFlows;
          executeSpecificFlow = flowIntegration.executeSpecificFlow;
          getFlowChainInfo = flowIntegration.getFlowChainInfo;

          // Attach flow functions to window for global access
          if (typeof window !== 'undefined') {
            (window as any).executeAllFlows = executeAllFlows;
            (window as any).executeSpecificFlow = executeSpecificFlow;
            (window as any).getFlowChainInfo = getFlowChainInfo;
            (window as any).debugFlowSystem = () => {
              const chains = getFlowChainInfo();
              console.log('🔗 Flow Integration System Debug:', {
                chainsCount: chains?.length || 0,
                chains: chains || []
              });
              return chains;
            };

            // ✅ SOLUTION 5: Intercept router.push to automatically set redirect flag
            if (typeof window !== 'undefined' && typeof router !== 'undefined') {
              const originalPush = router.push;
              router.push = function (href: string, options?: any) {
                (window as any).__isRedirecting = true;
                return (originalPush as any)(href, options);
              };
            }

            console.log('🚀 Flow Integration System initialized with', getFlowChainInfo()?.length || 0, 'chains');

            // Auto-execute page load workflows if any exist

            // ✅ IMPROVED: Execute page load workflows with proper trigger data
            // The master executor will automatically filter by page URL and skip webhook workflows
            const pageLoadKey = 'page-load:' + window.location.pathname;
            (window as any).__pageLoadFlowState = (window as any).__pageLoadFlowState || {};
            if ((window as any).__pageLoadFlowState[pageLoadKey]) {
              console.log('Skipping duplicate page-load flow for:', window.location.pathname);
            } else {
              (window as any).__pageLoadFlowState[pageLoadKey] = true;
              console.log('?? Triggering page load workflows for:', window.location.pathname);
              executeAllFlows({
                trigger: 'page-load',
                pageId: window.location.pathname,
                timestamp: new Date().toISOString()
              }).then((result: any) => {
                console.log('? Page load workflows completed:', result);
              }).catch((error: any) => {
                console.error('? Page load workflows failed:', error);
              });
            }
          }
        } else {
          throw new Error('Flow integration module not found');
        }
      } catch (error) {
        console.warn('⚠️ Flow integration not available, using fallback functions');
        executeAllFlows = async () => ({ success: false, message: 'Flow integration not available' });
        executeSpecificFlow = async () => ({ success: false, message: 'Flow integration not available' });
        getFlowChainInfo = () => [];

        // Set fallback functions on window
        if (typeof window !== 'undefined') {
          (window as any).executeAllFlows = executeAllFlows;
          (window as any).executeSpecificFlow = executeSpecificFlow;
          (window as any).getFlowChainInfo = getFlowChainInfo;
          (window as any).debugFlowSystem = () => {
            console.log('🔗 Flow Integration System Debug: Not available');
            return [];
          };
        }
      }
    };

    // Load flow integration
    loadFlowIntegration();
  }, []);
  const [scriptContextData, setScriptContextData] = React.useState<Record<string, any>>({});
  const [lastScriptEvent, setLastScriptEvent] = React.useState<{ key?: string; value?: any } | null>(null);
  // Initialize global script context for input/output sharing
  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      if (!(window as any).__scriptContext) {
        (window as any).__scriptContext = {
          data: {},
          setData: function (key: string, value: any) {
            this.data[key] = value;
            // Dispatch custom event for data changes
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('__scriptContextChange', {
                detail: { key, value }
              }));
            }
          },
          getData: function (key: string) {
            return this.data[key];
          },
          clearData: function (key?: string) {
            if (key) {
              delete this.data[key];
            } else {
              this.data = {};
            }
          }
        };
      }
    }
  }, []);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const readContext = (detail?: { key?: string; value?: any }) => {
      const ctx = (window as any).__scriptContext;
      if (ctx && ctx.data) {
        setScriptContextData({ ...ctx.data });
      }
      if (detail && detail.key !== undefined) {
        setLastScriptEvent({ key: detail.key, value: detail.value });
      }
    };
    const handler = (event: Event) => {
      const detail = (event as CustomEvent).detail as { key?: string; value?: any } | undefined;
      readContext(detail);
    };
    window.addEventListener('__scriptContextChange', handler as EventListener);
    readContext();
    return () => window.removeEventListener('__scriptContextChange', handler as EventListener);
  }, []);
  React.useEffect(() => {
    if (typeof window === 'undefined') return;
    const queueKey = '__scriptDoneQueue';
    const matchesScriptEventChain = (chain: any, payload: any) => {
      const startNode = chain?.startNode;
      const config = startNode?.config || startNode?.data?.settings || {};
      if (startNode?.nodeType !== 'script-event') return false;

      const payloadScriptId = payload?.scriptId || payload?.script_id;
      const payloadScriptName = payload?.scriptName || payload?.script_name;
      const payloadAction =
        payload?.actionValue ||
        payload?.action_value ||
        payload?.action ||
        payload?.actionName ||
        payload?.action_name;
      const payloadComponentId =
        payload?.componentId ||
        payload?.elementId ||
        payload?.component_id ||
        payload?.element_id;

      const configScriptId = config.scriptId || config.script_id;
      const configScriptName = config.scriptName || config.script_name;
      const configAction =
        config.actionValue ||
        config.action ||
        config.action_value ||
        config.actionName ||
        config.action_name;
      const configComponentId =
        config.componentId ||
        config.elementId ||
        config.component_id ||
        config.element_id;

      if (configScriptId) {
        if (!payloadScriptId || payloadScriptId !== configScriptId) return false;
      } else if (configScriptName) {
        if (!payloadScriptName || payloadScriptName !== configScriptName) return false;
      }

      if (configComponentId) {
        if (!payloadComponentId || payloadComponentId !== configComponentId) return false;
      }

      if (configAction) {
        if (!payloadAction || payloadAction !== configAction) return false;
      }

      return true;
    };
    const flushQueuedEvents = () => {
      // ✅ SOLUTION 6: Check redirect flag before processing queued events
      if (typeof window !== 'undefined' && (window as any).__isRedirecting) {
        console.log('🛑 Skipping script event processing - redirect in progress');
        return false;
      }

      const executeSpecificFlow = (window as any).executeSpecificFlow;
      const getFlowChainInfo = (window as any).getFlowChainInfo;
      if (typeof executeSpecificFlow !== 'function' || typeof getFlowChainInfo !== 'function') {
        return false;
      }
      const queued = (window as any)[queueKey] as any[] | undefined;
      if (!queued || queued.length === 0) return true;
      const chains = getFlowChainInfo();
      const events = queued.splice(0, queued.length);
      events.forEach((payload: any) => {
        // ✅ SOLUTION 6: Check redirect flag before executing each workflow
        if (typeof window !== 'undefined' && (window as any).__isRedirecting) {
          return;
        }

        const scriptId = payload?.scriptId || payload?.script_id;
        const scriptName = payload?.scriptName || payload?.script_name;
        if (!scriptId && !scriptName) return;
        const matchingChains = (chains || []).filter((chain: any) =>
          matchesScriptEventChain(chain, payload)
        );
        if (!matchingChains.length) return;
        matchingChains.forEach((chain: any) => {
          executeSpecificFlow(chain.id, payload);
        });
      });
      return true;
    };
    const handler = (event: Event) => {
      // ✅ SOLUTION 6: Check redirect flag before processing script events
      if (typeof window !== 'undefined' && (window as any).__isRedirecting) {
        console.log('🛑 Skipping script event handler - redirect in progress');
        return;
      }

      const detail = (event as CustomEvent).detail as { key?: string; value?: any } | undefined;
      if (!detail || detail.key !== 'script_done') return;
      const payload = detail.value as any;
      const scriptId = payload?.scriptId || payload?.script_id;
      const scriptName = payload?.scriptName || payload?.script_name;
      if (!scriptId && !scriptName) return;

      const executeSpecificFlow = (window as any).executeSpecificFlow;
      const getFlowChainInfo = (window as any).getFlowChainInfo;
      if (typeof executeSpecificFlow !== 'function' || typeof getFlowChainInfo !== 'function') {
        (window as any)[queueKey] = (window as any)[queueKey] || [];
        (window as any)[queueKey].push(payload);
        setTimeout(() => {
          flushQueuedEvents();
        }, 300);
        return;
      }

      const chains = getFlowChainInfo();
      const matchingChains = (chains || []).filter((chain: any) =>
        matchesScriptEventChain(chain, payload)
      );

      if (!matchingChains.length) return;

      const ctx = (window as any).__scriptContext;
      const contextData = ctx && ctx.data ? ctx.data : {};
      const triggerPayload = {
        ...contextData,
        ...payload,
        scriptId: scriptId || payload?.script_id,
        scriptName: scriptName || payload?.script_name,
        trigger: 'script-event'
      };

      matchingChains.forEach((chain: any) => {
        // ✅ SOLUTION 6: Check redirect flag before executing each workflow
        if (typeof window !== 'undefined' && (window as any).__isRedirecting) {
          return;
        }
        executeSpecificFlow(chain.id, triggerPayload);
      });
    };
    window.addEventListener('__scriptContextChange', handler as EventListener);
    flushQueuedEvents();
    return () => window.removeEventListener('__scriptContextChange', handler as EventListener);
  }, []);
  return (
    <>
      <div style={{ width: "100%", display: "grid", position: "relative", minHeight: "100vh", gridTemplateRows: "repeat(auto-fill, minmax(30px, auto))", gridTemplateColumns: "repeat(12, 1fr)" }} id="page-container-undefined">
        <div style={{ width: "100%", display: "flex", padding: "20px", gridArea: "1 / 1 / 26 / 13", overflow: "hidden", position: "relative", minHeight: "750px", gridRowEnd: 26, gridRowStart: 1, gridColumnEnd: 13, flexDirection: "row", backgroundColor: "black", gridColumnStart: 1, justifyContent: "space-between" }} id="component-1770707142250-911">
          <div style={{ width: "1070.0000610351562px", border: "none", height: "814.0000610351562px", display: "flex", padding: "0.5rem", overflow: "visible", minHeight: "3.125rem", alignItems: "center", flexDirection: "row", backgroundColor: "", justifyContent: "center" }} id="nested-1771072055001-1420">
            <div style={{ width: "600px", height: "600px", display: "flex", padding: "20px", minHeight: "100vh", alignItems: "center", flexDirection: "column", justifyContent: "center", backgroundColor: "#f5f5f5" }} id="nested-1771072119472-8257">
              <div style={{ width: "100%", padding: "40px", maxWidth: "400px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", borderRadius: "8px", backgroundColor: "#ffffff" }} id="id-177107211947218">
                <h1 style={{ color: "#333", fontSize: "28px", textAlign: "center", fontWeight: "bold", marginBottom: "30px" }} id="id-17710721194723648">Sign Up</h1>
                <form data-component-id="id-17710721194725045" onSubmit={(e) => handleid17710721194725045Submit(e, 'id-17710721194725045')}>
                  <input style={{ width: "100%", border: "1px solid #ddd", padding: "12px", fontSize: "16px", borderRadius: "4px", marginBottom: "20px" }} data-component-id="id-17710721194723355" ref={(el) => { if (el) inputRefs.current['id-17710721194723355'] = el; }} name="email" type="email" placeholder="Email" required={true} />
                  <input style={{ width: "100%", border: "1px solid #ddd", padding: "12px", fontSize: "16px", borderRadius: "4px", marginBottom: "20px" }} data-component-id="id-17710721194728817" ref={(el) => { if (el) inputRefs.current['id-17710721194728817'] = el; }} name="password" type="password" placeholder="Password" required={true} />
                  <input style={{ width: "100%", border: "1px solid #ddd", padding: "12px", fontSize: "16px", borderRadius: "4px", marginBottom: "20px" }} data-component-id="id-17710721194729380" ref={(el) => { if (el) inputRefs.current['id-17710721194729380'] = el; }} name="confirm_password" type="password" placeholder="Confirm Password" required={true} />
                  <button style={{ color: "#ffffff", width: "100%", border: "none", cursor: "pointer", padding: "12px", fontSize: "16px", fontWeight: "bold", borderRadius: "4px", backgroundColor: "#28a745" }} data-component-id="id-17710721194725976" type="submit" onClick={() => {
                    console.log('🔘 Normal button clicked: id-17710721194725976');
                    // This button does not have any workflow attached
                  }}>Sign Up</button>
                </form>
              </div>
            </div>
          </div>
          <Image src="/uploads/Frame_2147223712.png" alt="Frame 2147223712.png" width={500} height={300} style={{ width: "724.5833740234375px", height: "814.0000610351562px" }} id="nested-1771072142675-9506" />
        </div>
      </div>

    </>
  );
}