"use client";
import React from 'react';
import { useState, useRef, FormEvent, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
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
import { TemplateExpressionEngine } from '../../lib/template-engine';

declare global {
  interface Window {
    dataFlow?: Record<string, any>;
    executeAllFlows?: (triggerData?: any, specificChainId?: string | null) => Promise<any>;
    executeSpecificFlow?: (chainId: string, data?: any) => Promise<any>;
    getFlowChainInfo?: () => any[];
    debugFlowSystem?: () => any;
  }
}


export default function Login() {
  const router = useRouter();

  // Utility function to convert text to URL slug
  const convertToSlug = (text: string) => {
    return text.toLowerCase().replace(/\s+/g, '-');
  };

  // Form state management
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Input references
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const [loginError, setLoginError] = useState<string | null>(null);
  // Store login credentials for workflow (Scenario 2)
  const loginCredentialsRef = useRef<{ email: string; password: string } | null>(null);
  // Form submission handler
  const handleid17710724062232715Submit = async (e: FormEvent, formId: string) => {
    e.preventDefault();

    if (isSubmitting) return;

    setIsSubmitting(true);
    setLoginError(null);

    // Declare inputs outside try block so they're accessible in catch block
    let emailInput: HTMLInputElement | null = null;
    let passwordInput: HTMLInputElement | null = null;

    try {
      // LOGIN FORM: Get email and password and call login API
      emailInput = inputRefs.current["id-17710724062237485"];
      passwordInput = inputRefs.current["id-17710724062239844"];

      if (emailInput && passwordInput) {
        const email = emailInput.value.trim();
        const password = passwordInput.value;

        if (email && password) {
          // Call login API
          const loginResponse = await fetch('/api/auth/login', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify({ email, password }),
          });

          const loginData = await loginResponse.json();

          // Handle both response formats: { success: true } or { access_token: ... }
          const isSuccess = loginResponse.ok && (loginData.success === true || loginData.access_token || loginData.token);

          if (!isSuccess) {
            setLoginError(loginData.detail || loginData.message || loginData.error || 'Login failed');
            setIsSubmitting(false);
            return;
          }

          // Set cookies immediately after successful login
          // This ensures cookies are available before redirect so middleware doesn't redirect back to login
          if (typeof window !== 'undefined') {
            try {
              const isSecure = window.location.protocol === 'https:';
              const maxAge = 86400; // 24 hours

              // Extract user_id from response (support multiple formats)
              const userId = loginData.user_id || loginData.userId || loginData.user?.id;
              // Extract auth_token from response (support multiple formats)
              const authToken = loginData.token || loginData.access_token || loginData.authToken;

              // Set auth_token cookie as fallback (backend sets HttpOnly, but client-side ensures it's available)
              if (authToken) {
                document.cookie = `auth_token=${authToken}; path=/; max-age=${maxAge}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
              }

              // Set user_id cookie as fallback
              if (userId) {
                document.cookie = `user_id=${userId}; path=/; max-age=${maxAge}; SameSite=Lax${isSecure ? '; Secure' : ''}`;
              }

              console.log('✅ Authentication cookies set:', { userId, hasToken: !!authToken });
            } catch (cookieError) {
              console.error('❌ Failed to set authentication cookies:', cookieError);
            }
          }

          // Secure validation function for redirect URLs
          const isValidRedirectPath = (path: string): boolean => {
            if (!path || typeof path !== 'string') return false;

            // Decode URL encoding
            const decoded = decodeURIComponent(path);

            // Reject protocol-relative URLs (//evil.com)
            if (decoded.startsWith('//')) return false;

            // Reject absolute URLs with protocols (http://, https://, javascript:, data:, etc.)
            if (/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(decoded)) return false;

            // Reject URLs containing : after the first character (potential protocol)
            if (decoded.includes(':') && !decoded.startsWith('/')) return false;

            // Only allow relative paths starting with /
            if (!decoded.startsWith('/')) return false;

            // Additional safety: reject paths with suspicious patterns
            // Reject paths containing // anywhere (except at the start which we already checked)
            if (decoded.substring(1).includes('//')) return false;

            return true;
          };

          // Login successful - handle redirect
          // Get redirect parameter from URL
          let redirectUrl = null;
          if (typeof window !== 'undefined') {
            const urlParams = new URLSearchParams(window.location.search);
            const redirectParam = urlParams.get('redirect');
            if (redirectParam && isValidRedirectPath(redirectParam)) {
              redirectUrl = decodeURIComponent(redirectParam);
            } else if (redirectParam) {
              console.warn('Invalid redirect URL rejected:', redirectParam);
            }
          }

          // Only redirect if redirect parameter exists
          // Otherwise, let workflow handle navigation
          if (redirectUrl) {
            // Scenario 1: Redirect parameter exists - redirect after cookies are set
            // Reset form before redirecting
            emailInput.value = '';
            passwordInput.value = '';
            setFormData({});

            // Wait for cookies to persist before redirecting
            // This ensures middleware can read the cookies and won't redirect back to login
            await new Promise(resolve => setTimeout(resolve, 250));

            // ✅ SOLUTION 2: Set redirect flag before navigation
            if (typeof window !== 'undefined') {
              (window as any).__isRedirecting = true;
              window.location.href = redirectUrl;
            }
            setIsSubmitting(false);
            return; // Exit early - don't process as regular form
          } else {
            // Scenario 2: No redirect parameter - let workflow handle navigation
            // Store credentials for workflow to use (workflow may need them)
            loginCredentialsRef.current = { email, password };
            // DON'T clear form fields yet - workflow needs them to extract data
            console.log('Login successful - workflow will handle navigation');
            // Continue with regular form processing which will trigger workflow
            // Form fields will be cleared after workflow completes (in success handler)
          }
        } else {
          setLoginError('Email and password are required');
          setIsSubmitting(false);
          return;
        }
      } else {
        // Inputs not found - clear credentials ref if set and show error
        if (loginCredentialsRef && loginCredentialsRef.current) {
          loginCredentialsRef.current = null;
        }
        setLoginError('Login form inputs not found');
        setIsSubmitting(false);
        return;
      }
    } catch (loginError: any) {
      console.error('Login error:', loginError);
      setLoginError(loginError.message || 'Login failed. Please try again.');
      // Clear credentials ref on error
      if (loginCredentialsRef && loginCredentialsRef.current) {
        loginCredentialsRef.current = null;
      }
      // Clear form fields on error
      if (emailInput) emailInput.value = '';
      if (passwordInput) passwordInput.value = '';
      setIsSubmitting(false);
      return;
    }

    // If not login form or login failed, continue with regular form processing
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
                formId: 'id-17710724062232715',
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
                formId: 'id-17710724062232715',
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
            formId: 'id-17710724062232715',
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
        const flowIntegration = await import('../../lib/flow-integration-index').catch(() => null);
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
              router.push = function (...args: any[]) {
                (window as any).__isRedirecting = true;
                return (originalPush as any).apply(router, args);
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
  type ScriptRuntimeEntry = {
    id?: string;
    name?: string;
    order?: number;
    code: string;
    input_variables?: Array<{ name?: string; type?: string; source?: string; description?: string }>;
    output_variables?: Array<{ name?: string; type?: string; source?: string; description?: string }>;
    scriptElementOverrides?: Record<string, any> | null;
  };

  type RunScriptsArgs = {
    componentId: string;
    eventType: string;
    scripts: ScriptRuntimeEntry[];
    element: HTMLElement | null;
    event?: any;
    parameters?: Record<string, any>;
  };

  const getScriptCleanupStore = () => {
    if (typeof window === 'undefined') return null;
    const key = '__scriptCleanupStore';
    if (!(window as any)[key]) {
      (window as any)[key] = {};
    }
    return (window as any)[key] as Record<string, Array<() => void>>;
  };

  const readOutputValue = (out: any, env: any) => {
    if (!out || !out.name) return undefined;
    const source = (out.source || 'element').toLowerCase();
    if (source === 'element') {
      if (!env.element) return undefined;
      if (out.name === 'style') {
        return (env.element as HTMLElement).style?.cssText || '';
      }
      return (env.element as any)[out.name];
    }
    if (source === 'event') {
      return env.event ? (env.event as any)[out.name] : undefined;
    }
    if (source === 'context') {
      return env.getScriptData ? env.getScriptData(out.name) : undefined;
    }
    return undefined;
  };

  const collectScriptOutputs = (script: ScriptRuntimeEntry, env: any) => {
    const outputs = script?.output_variables;
    if (!outputs || outputs.length === 0) return {};
    const values: Record<string, any> = {};
    outputs.forEach((out) => {
      if (!out?.name) return;
      let value = env.getScriptData ? env.getScriptData(out.name) : undefined;
      if (value === undefined) {
        value = readOutputValue(out, env);
      }
      values[out.name] = value;
    });
    return values;
  };

  const dispatchScriptDone = (script: ScriptRuntimeEntry, env: any, extra?: any) => {
    if (!script || (!script.id && !script.name)) return;
    const contextData = env.scriptContext && env.scriptContext.data ? env.scriptContext.data : {};
    const outputValues = collectScriptOutputs(script, env);
    const payload = {
      ...contextData,
      ...outputValues,
      ...extra,
      componentId: env?.componentId,
      elementId: env?.componentId,
      eventType: env?.eventType,
      event_type: env?.eventType,
      scriptId: script.id,
      scriptName: script.name,
      timestamp: new Date().toISOString()
    };
    if (env.setScriptData) {
      env.setScriptData('script_done', payload);
    }
  };

  const writeScriptOutputs = (script: ScriptRuntimeEntry, env: any) => {
    const outputs = script?.output_variables;
    if (!outputs || outputs.length === 0) return;
    outputs.forEach((out) => {
      const value = readOutputValue(out, env);
      if (out?.name) {
        env.setScriptData(out.name, value);
      }
    });
  };

  const hashString = (value: string) => {
    let hash = 0;
    if (!value) return '0';
    for (let i = 0; i < value.length; i += 1) {
      hash = ((hash << 5) - hash) + value.charCodeAt(i);
      hash |= 0;
    }
    return Math.abs(hash).toString(36);
  };

  const getStableElementId = (el: HTMLElement, root: HTMLElement) => {
    if (!el || !root) return null;
    const parts: string[] = [];
    let current: HTMLElement | null = el;
    while (current && current !== root) {
      const tag = current.tagName.toLowerCase();
      let idx = 0;
      let sibling = current.previousElementSibling;
      while (sibling) {
        if (sibling.tagName === current.tagName) idx += 1;
        sibling = sibling.previousElementSibling;
      }
      parts.unshift(`${tag}:${idx}`);
      current = current.parentElement;
    }
    if (!parts.length) return null;
    return `auto-${hashString(parts.join('/'))}`;
  };

  const assignScriptElementIds = (root: HTMLElement) => {
    if (!root || !root.querySelectorAll) return;
    const eligible = root.querySelectorAll('button, input, select, textarea, a, label, h1, h2, h3, h4, h5, h6, p, span, div');
    for (let i = 0; i < eligible.length; i += 1) {
      const el = eligible[i] as HTMLElement;
      if (!el.getAttribute('data-script-el-id')) {
        const stableId = getStableElementId(el, root);
        el.setAttribute('data-script-el-id', stableId || `auto-${i}`);
        el.setAttribute('data-script-el-type', el.tagName.toLowerCase());
      }
    }
  };

  const ensureScriptElementClones = (root: HTMLElement, overrides?: Record<string, any> | null) => {
    if (!root || !overrides) return;
    let created = false;
    Object.keys(overrides).forEach((elementId) => {
      const entry = overrides[elementId];
      if (!entry || !entry.cloneFrom) return;
      const existing = root.querySelector('[data-script-el-id="' + elementId + '"]') as HTMLElement | null;
      if (existing) return;
      const source = root.querySelector('[data-script-el-id="' + entry.cloneFrom + '"]') as HTMLElement | null;
      if (!source) return;
      const parent =
        (entry.parentId && root.querySelector('[data-script-el-id="' + entry.parentId + '"]')) ||
        source.parentElement;
      if (!parent) return;

      const cloned = source.cloneNode(true) as HTMLElement;
      if (cloned.removeAttribute) {
        cloned.removeAttribute('data-script-el-id');
        cloned.removeAttribute('data-script-el-type');
      }
      if (cloned.querySelectorAll) {
        const descendants = cloned.querySelectorAll('[data-script-el-id]');
        descendants.forEach((node) => {
          if ((node as HTMLElement).removeAttribute) {
            (node as HTMLElement).removeAttribute('data-script-el-id');
            (node as HTMLElement).removeAttribute('data-script-el-type');
          }
        });
      }
      cloned.setAttribute('data-script-el-id', elementId);
      cloned.setAttribute('data-script-el-type', cloned.tagName.toLowerCase());

      if (source.parentElement === parent && source.nextSibling) {
        parent.insertBefore(cloned, source.nextSibling);
      } else {
        parent.appendChild(cloned);
      }
      created = true;
    });

    if (created) {
      assignScriptElementIds(root);
    }
  };

  const attachPageLinkHandler = (el: HTMLElement, pageId: string) => {
    if (!el) return;
    const anyEl = el as any;
    const linkToPage = el.getAttribute('data-link-to-page');
    const rawPageId = pageId || el.getAttribute('data-page-link') || '';

    // Detect if we're in preview mode
    // Preview mode: navigateToPage expects page IDs (e.g., 'page-17707911380889957')
    // Deployment mode: navigateToPage expects page slugs (e.g., 'page-2')
    const isPreviewMode = typeof window !== 'undefined' &&
      (window.location?.pathname?.includes('/preview') ||
        window.location?.pathname?.includes('/internal_preview'));

    const computeNavigationTarget = () => {
      // In preview mode, use page ID directly
      if (isPreviewMode && rawPageId) {
        return rawPageId;
      }

      // In deployment mode:
      // Priority 1: Use data-link-to-page (page name) - preferred for deployment
      if (linkToPage) {
        return linkToPage.toLowerCase().replace(/\s+/g, '-');
      }

      // Priority 2: Try to map page ID to slug using __pageIdToSlug (if available)
      if (!rawPageId) return '';
      if (typeof window !== 'undefined') {
        try {
          const idToSlug = (window as any).__pageIdToSlug;
          if (idToSlug && typeof idToSlug === 'object') {
            const mapped = idToSlug[rawPageId];
            if (mapped) {
              const slugStr = String(mapped);
              // Remove leading slash if present (avoid regex escaping issues in generated code)
              return (slugStr.startsWith('/') ? slugStr.slice(1) : slugStr).toLowerCase();
            }
          }
        } catch (e) {
          // __pageIdToSlug might not exist - that's okay, fall through to default
        }
      }

      // Priority 3: Fallback - convert page ID to slug format
      return rawPageId.replace(/^page-/, '').toLowerCase();
    };

    const navigationTarget = computeNavigationTarget();
    if (!navigationTarget) return;

    if (anyEl.__pageLinkHandler) {
      if (anyEl.__pageLinkHandlerPageId === navigationTarget) return;
      el.removeEventListener('click', anyEl.__pageLinkHandler);
    }

    const handler = (e: Event) => {
      try { e.preventDefault(); } catch (err) { }
      const target = computeNavigationTarget();
      if (!target) return;
      if (typeof window !== 'undefined') {
        if (typeof (window as any).navigateToPage === 'function') {
          (window as any).navigateToPage(target);
          return;
        }
        if (window.parent && typeof (window.parent as any).navigateToPage === 'function') {
          (window.parent as any).navigateToPage(target);
          return;
        }
        try {
          window.location.assign('/' + target);
        } catch (err) { }
      }
    };

    el.addEventListener('click', handler);
    anyEl.__pageLinkHandler = handler;
    anyEl.__pageLinkHandlerPageId = navigationTarget;
    try { el.style.setProperty('cursor', 'pointer'); } catch (e) { }
    try { el.style.setProperty('pointer-events', 'auto'); } catch (e) { }
    try { (el as any).disabled = false; } catch (e) { }
  };

  const applyScriptElementOverrides = (root: HTMLElement, overrides?: Record<string, any> | null) => {
    if (!root || !overrides) return;
    ensureScriptElementClones(root, overrides);
    Object.keys(overrides).forEach((elementId) => {
      const entry = overrides[elementId];
      const element = elementId === '__root__'
        ? root
        : root.querySelector('[data-script-el-id="' + elementId + '"]') as HTMLElement | null;
      if (!element) return;
      if (entry && entry.style) {
        Object.keys(entry.style).forEach((prop) => {
          try {
            element.style.setProperty(prop, entry.style[prop]);
          } catch (e) {
            // ignore invalid style props
          }
        });
      }
      if (entry && entry.attributes) {
        const hasPageLink =
          !!entry.attributes['data-page-link'] ||
          !!entry.attributes['data-link-to-page'] ||
          (typeof entry.attributes.onclick === 'string' && entry.attributes.onclick.includes('navigateToPage'));

        // Detect preview mode - in preview, keep onclick handler as-is (it uses page ID)
        const isPreviewMode = typeof window !== 'undefined' &&
          (window.location?.pathname?.includes('/preview') ||
            window.location?.pathname?.includes('/internal_preview'));

        Object.keys(entry.attributes).forEach((attr) => {
          try {
            // In preview mode with page link, preserve onclick handler (it already uses page ID)
            if (hasPageLink && attr === 'onclick' && isPreviewMode) {
              // Keep the onclick handler as-is in preview mode
              const value = entry.attributes[attr];
              if (value && typeof value === 'string' && value.includes('navigateToPage')) {
                element.setAttribute(attr, String(value));
                return;
              }
            }

            // Skip setting onclick if we'll handle it via attachPageLinkHandler (deployment mode)
            if (hasPageLink && attr === 'onclick' && typeof entry.attributes.onclick === 'string' && entry.attributes.onclick.includes('navigateToPage')) {
              return;
            }

            const value = entry.attributes[attr];
            if (value === '' || value === null || value === undefined) {
              element.removeAttribute(attr);
            } else {
              element.setAttribute(attr, String(value));
            }
          } catch (e) {
            // ignore invalid attributes
          }
        });

        // Only replace onclick handler in deployment mode (not preview)
        if (hasPageLink && !isPreviewMode) {
          try {
            element.removeAttribute('onclick');
          } catch (e) { }
          const pageId = entry.attributes['data-page-link'] || element.getAttribute('data-page-link');
          if (pageId) {
            attachPageLinkHandler(element, String(pageId));
          }
        }
      }
      if (entry && typeof entry.text === 'string') {
        if (element.children.length > 0) {
          return;
        }
        element.textContent = entry.text;
      }
      if (entry && Array.isArray(entry.order)) {
        const parentEl = element;
        const children = Array.from(parentEl.children);
        const byId: Record<string, Element> = {};
        children.forEach((child) => {
          const cid = (child as HTMLElement).getAttribute('data-script-el-id');
          if (cid) byId[cid] = child;
        });
        entry.order.forEach((childId: string) => {
          const node = byId[childId];
          if (node) parentEl.appendChild(node);
        });
      }
    });
  };

  const resolveOverrideRoot = (env: any) => {
    if (env.element) return env.element as HTMLElement;
    if (env.componentId) {
      const byId = document.getElementById(env.componentId);
      if (byId) return byId as HTMLElement;
      const byData = document.querySelector('[data-component-id="' + env.componentId + '"]');
      if (byData) return byData as HTMLElement;
    }
    return null;
  };

  const applyOverridesIfNeeded = (script: ScriptRuntimeEntry, env: any) => {
    if (!script?.scriptElementOverrides) return;
    let overrides: Record<string, any> | null = script.scriptElementOverrides as any;
    if (typeof overrides === 'string') {
      try {
        overrides = JSON.parse(overrides);
      } catch (e) {
        overrides = null;
      }
    }
    if (!overrides) return;
    const root = resolveOverrideRoot(env);
    if (!root) return;
    assignScriptElementIds(root);
    applyScriptElementOverrides(root, overrides);
  };

  const runSingleScript = (script: ScriptRuntimeEntry, env: any) => {
    try {
      let dispatched = false;
      const outputNames = (script?.output_variables || [])
        .map((out) => out?.name)
        .filter(Boolean) as string[];
      const finalize = (scriptRuntimeEnv: any) => {
        applyOverridesIfNeeded(script, scriptRuntimeEnv);
        writeScriptOutputs(script, scriptRuntimeEnv);
        attemptAutoDispatch(scriptRuntimeEnv);
      };
      const attemptAutoDispatch = (scriptRuntimeEnv: any) => {
        if (dispatched) return;
        if (outputNames.length === 0) {
          dispatchScriptDone(script, scriptRuntimeEnv);
          return;
        }
        const outputValues = collectScriptOutputs(script, scriptRuntimeEnv);
        const allReady = outputNames.every((name) => outputValues[name] !== undefined);
        if (allReady) {
          dispatchScriptDone(script, scriptRuntimeEnv);
        }
      };
      const baseSetScriptData = env.setScriptData;
      let scriptEnv: any = null;
      const wrappedSetScriptData = (key: string, value: any) => {
        if (typeof baseSetScriptData === 'function') {
          baseSetScriptData(key, value);
        }
        if (scriptEnv) {
          if (key !== 'script_done') {
            attemptAutoDispatch(scriptEnv);
          }
        }
      };
      // Get parameters from env or fallback to script context
      let scriptParameters = env.parameters || {};
      if (env.getScriptData && Object.keys(scriptParameters).length === 0) {
        // Try to get parameters from script context if not provided directly
        const scriptContextParams = env.getScriptData('scriptEventParameters');
        if (scriptContextParams && typeof scriptContextParams === 'object') {
          scriptParameters = scriptContextParams;
        }
      }

      // Create output object proxy for scripts that use output.variableName = value pattern
      // This allows scripts to use either setScriptData('key', value) or output.key = value
      const outputProxy: Record<string, any> = {};
      const outputHandler = {
        set: (target: Record<string, any>, prop: string, value: any) => {
          // Set the value in the proxy object
          target[prop] = value;
          // Also set it via setScriptData for proper tracking
          if (typeof wrappedSetScriptData === 'function') {
            wrappedSetScriptData(prop, value);
          }
          return true;
        },
        get: (target: Record<string, any>, prop: string) => {
          // Return the value from the proxy object or from script context
          if (prop in target) {
            return target[prop];
          }
          // Fallback to getting from script context
          if (env.getScriptData && typeof env.getScriptData === 'function') {
            return env.getScriptData(prop);
          }
          return undefined;
        }
      };
      const output = new Proxy(outputProxy, outputHandler);

      scriptEnv = {
        ...env,
        scriptId: script?.id,
        scriptName: script?.name,
        parameters: scriptParameters,
        output: output,
        dispatchScriptDone: (extra?: any) => {
          dispatched = true;
          dispatchScriptDone(script, env, extra);
        },
        setScriptData: wrappedSetScriptData
      };
      const fn = new Function(
        'env',
        'const { element, event, scriptContext, setScriptData, getScriptData, clearScriptData, onCleanup, componentId, eventType, scriptId, scriptName, dispatchScriptDone, parameters, output } = env;\n' +
        script.code
      );
      const result = fn(scriptEnv);
      if (result && typeof result.then === 'function') {
        result
          .then(() => finalize(scriptEnv))
          .catch((error: any) => {
            console.error('Error executing async user script:', script?.name || script?.id, error);
            finalize(scriptEnv);
          });
        return;
      }
      if (typeof result === 'function') {
        scriptEnv.onCleanup(result);
      }
      finalize(scriptEnv);
    } catch (error) {
      console.error('Error executing user script:', script?.name || script?.id, error);
    }
  };

  const runComponentScripts = (args: RunScriptsArgs) => {
    const { componentId, eventType, scripts, element, event, parameters } = args;
    if (!scripts || scripts.length === 0) return () => { };
    const cleanupKey = componentId + '::' + eventType;
    const store = getScriptCleanupStore();
    if (store && store[cleanupKey]) {
      store[cleanupKey].forEach((fn) => {
        try { fn(); } catch (e) { }
      });
      delete store[cleanupKey];
    }

    const cleanupFns: Array<() => void> = [];
    const onCleanup = (fn: () => void) => {
      if (typeof fn === 'function') cleanupFns.push(fn);
    };

    const scriptContext = (typeof window !== 'undefined' && (window as any).__scriptContext)
      ? (window as any).__scriptContext
      : null;
    const setScriptData = (key: string, value: any) => {
      if (scriptContext) scriptContext.setData(key, value);
    };
    const getScriptData = (key: string) => {
      return scriptContext ? scriptContext.getData(key) : undefined;
    };
    const clearScriptData = (key?: string) => {
      if (scriptContext) scriptContext.clearData(key);
    };

    const env = {
      element,
      event,
      componentId,
      eventType,
      scriptContext,
      setScriptData,
      getScriptData,
      clearScriptData,
      onCleanup,
      parameters: parameters || {}
    };

    const orderedScripts = [...scripts].sort((a, b) => (a.order || 0) - (b.order || 0));
    orderedScripts.forEach((script) => runSingleScript(script, env));

    if (store) {
      store[cleanupKey] = cleanupFns;
    }

    return () => {
      cleanupFns.forEach((fn) => {
        try { fn(); } catch (e) { }
      });
      if (store) delete store[cleanupKey];
    };
  };

  return (
    <>
      <div style={{ width: "100%", display: "grid", position: "relative", minHeight: "100vh", gridTemplateRows: "repeat(auto-fill, minmax(30px, auto))", gridTemplateColumns: "repeat(12, 1fr)" }} id="page-container-undefined">
        <div style={{ width: "100%", display: "flex", padding: "20px", gridArea: "1 / 1 / 23 / 13", overflow: "hidden", position: "relative", minHeight: "660px", gridRowEnd: 23, alignItems: "flex-start", paddingTop: "0", gridRowStart: 1, paddingLeft: "0", gridColumnEnd: 13, paddingRight: "0", flexDirection: "row", paddingBottom: "0", backgroundColor: "black", gridColumnStart: 1, justifyContent: "space-between" }} id="component-1770707323574-5198">
          <div style={{ width: "884.0000610351562px", border: "none", height: "845.0000610351562px", display: "flex", padding: "0.5rem", overflow: "visible", minHeight: "3.125rem", alignItems: "center", flexDirection: "row", backgroundColor: "", justifyContent: "center" }} id="nested-1771071263427-9817">
            <div style={{ width: "600px", height: "600px", display: "flex", padding: "20px", minHeight: "100vh", alignItems: "center", flexDirection: "column", justifyContent: "center", backgroundColor: "#f5f5f5" }} id="nested-1771072406223-1354">
              <div style={{ width: "100%", padding: "40px", maxWidth: "400px", boxShadow: "0 2px 10px rgba(0,0,0,0.1)", borderRadius: "8px", backgroundColor: "#ffffff" }} id="id-17710724062234839">
                <h1 style={{ color: "#333", fontSize: "28px", textAlign: "center", fontWeight: "bold", marginBottom: "30px" }} id="id-17710724062231737">Login</h1>
                <form data-component-id="id-17710724062232715" onSubmit={(e) => handleid17710724062232715Submit(e, 'id-17710724062232715')}>
                  <input style={{ width: "100%", border: "1px solid #ddd", padding: "12px", fontSize: "16px", borderRadius: "4px", marginBottom: "20px" }} data-component-id="id-17710724062237485" ref={(el) => { if (el) inputRefs.current['id-17710724062237485'] = el; }} name="email" type="email" placeholder="Email" required={true} />
                  <input style={{ width: "100%", border: "1px solid #ddd", padding: "12px", fontSize: "16px", borderRadius: "4px", marginBottom: "20px" }} data-component-id="id-17710724062239844" ref={(el) => { if (el) inputRefs.current['id-17710724062239844'] = el; }} name="password" type="password" placeholder="Password" required={true} />

                  {loginError && (
                    <div style={{ color: "#dc3545", fontSize: "14px", marginBottom: "15px", padding: "10px", backgroundColor: "#f8d7da", borderRadius: "4px", border: "1px solid #f5c6cb" }}>
                      {loginError}
                    </div>
                  )}
                  <button style={{ color: "#ffffff", width: "100%", border: "none", cursor: "pointer", padding: "12px", fontSize: "16px", fontWeight: "bold", borderRadius: "4px", backgroundColor: "#24af4c" }} data-component-id="id-17710724062236905" type="submit" onClick={() => {
                    console.log('🔘 Normal button clicked: id-17710724062236905');
                    // This button does not have any workflow attached
                  }}>Login</button>
                </form>
              </div>
            </div>
          </div>
          <Image src="/uploads/Frame_2147223712.jpg" alt="Frame 2147223712.jpg" width={500} height={300} style={{ width: "715px", height: "831px" }} id="nested-1771071459850-3670" />
        </div>
      </div>

    </>
  );
}