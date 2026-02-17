"use client";
import React from 'react';
import { useState, useRef, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';

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


export default function FormSubmission() {
  const router = useRouter();

  // Utility function to convert text to URL slug
  const convertToSlug = (text: string) => {
    return text.toLowerCase().replace(/\s+/g, '-');
  };

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
              router.push = function(...args: any[]) {
                (window as any).__isRedirecting = true;
                return originalPush.apply(router, args);
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
          setData: function(key: string, value: any) {
            this.data[key] = value;
            // Dispatch custom event for data changes
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('__scriptContextChange', {
                detail: { key, value }
              }));
            }
          },
          getData: function(key: string) {
            return this.data[key];
          },
          clearData: function(key?: string) {
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
    try { e.preventDefault(); } catch (err) {}
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
      } catch (err) {}
    }
  };
  
  el.addEventListener('click', handler);
  anyEl.__pageLinkHandler = handler;
  anyEl.__pageLinkHandlerPageId = navigationTarget;
  try { el.style.setProperty('cursor', 'pointer'); } catch (e) {}
  try { el.style.setProperty('pointer-events', 'auto'); } catch (e) {}
  try { (el as any).disabled = false; } catch (e) {}
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
        } catch (e) {}
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
  if (!scripts || scripts.length === 0) return () => {};
  const cleanupKey = componentId + '::' + eventType;
  const store = getScriptCleanupStore();
  if (store && store[cleanupKey]) {
    store[cleanupKey].forEach((fn) => {
      try { fn(); } catch (e) {}
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
      try { fn(); } catch (e) {}
    });
    if (store) delete store[cleanupKey];
  };
};

  const scripts_component_1771005580992_8438_onload = [
    { id: "9c50f7fb-b373-42a8-b13d-d80d598eea51", name: "formsubmissionvitality", order: 0, code: "// ===============================\n// Form Submissions - Dashboard Display\n// Displays form submissions in a sortable data table\n// \n// INPUT VARIABLES (from HTTP request or workflow):\n//   - submissionsData: Array of form submission objects\n//     OR\n//   - httpResponse: HTTP response containing submissions data\n//     OR  \n//   - submissions: Direct array of submissions\n//\n// Expected JSON format:\n// {\n//   \"submissions\": [\n//     {\n//       \"id\": \"sub-001\",\n//       \"contactName\": \"Arjun Mehta\",\n//       \"company\": \"Growththive Technologies\",\n//       \"email\": \"arjun@gmail.com\",\n//       \"phone\": \"9876543210\",\n//       \"status\": \"Active\",\n//       \"createdDate\": \"2026-01-12\"\n//     }\n//   ]\n// }\n//\n// OUTPUT VARIABLES:\n//   - output.selectedSubmissions: Array of selected submission IDs\n//   - output.action: \"select\" | \"edit\" | \"delete\" | \"export\" | \"search\"\n//   - output.totalCount: Total number of submissions\n//   - output.filteredCount: Number of submissions after search/filter\n// ===============================\n\nelement.innerHTML = `\n  <style>\n    * {\n      margin: 0;\n      padding: 0;\n      box-sizing: border-box;\n    }\n    \n    .scrollbar::-webkit-scrollbar {\n      width: 6px;\n      height: 6px;\n    }\n    \n    .scrollbar::-webkit-scrollbar-track {\n      background: transparent;\n    }\n    \n    .scrollbar::-webkit-scrollbar-thumb {\n      background: #3a3a3a;\n      border-radius: 3px;\n    }\n    \n    .scrollbar::-webkit-scrollbar-thumb:hover {\n      background: #4a4a4a;\n    }\n    \n    .table-row {\n      transition: background 0.15s;\n    }\n    \n    .table-row:hover {\n      background: #1a1a1a !important;\n    }\n    \n    .sortable-header {\n      cursor: pointer;\n      user-select: none;\n      transition: color 0.15s;\n    }\n    \n    .sortable-header:hover {\n      color: #22c55e;\n    }\n    \n    .checkbox-custom {\n      appearance: none;\n      width: 18px;\n      height: 18px;\n      border: 2px solid #3a3a3a;\n      border-radius: 4px;\n      cursor: pointer;\n      position: relative;\n      transition: all 0.15s;\n    }\n    \n    .checkbox-custom:checked {\n      background: #22c55e;\n      border-color: #22c55e;\n    }\n    \n    .checkbox-custom:checked::after {\n      content: '✓';\n      position: absolute;\n      color: #000;\n      font-size: 12px;\n      font-weight: bold;\n      top: 50%;\n      left: 50%;\n      transform: translate(-50%, -50%);\n    }\n    \n    .action-btn {\n      color: #888;\n      cursor: pointer;\n      font-size: 13px;\n      transition: color 0.15s;\n      text-decoration: none;\n    }\n    \n    .action-btn:hover {\n      color: #22c55e;\n    }\n    \n    .search-input {\n      background: #1a1a1a;\n      border: 1px solid #2a2a2a;\n      color: #e5e5e5;\n      padding: 10px 16px 10px 40px;\n      border-radius: 8px;\n      font-size: 14px;\n      outline: none;\n      transition: border-color 0.15s;\n      width: 300px;\n    }\n    \n    .search-input:focus {\n      border-color: #22c55e;\n    }\n    \n    .export-btn {\n      background: #22c55e;\n      color: #000;\n      border: none;\n      padding: 10px 20px;\n      border-radius: 8px;\n      font-size: 13px;\n      font-weight: 600;\n      cursor: pointer;\n      display: flex;\n      align-items: center;\n      gap: 8px;\n      transition: background 0.15s;\n    }\n    \n    .export-btn:hover {\n      background: #1ea047;\n    }\n    \n    .status-badge {\n      display: inline-block;\n      padding: 4px 12px;\n      border-radius: 12px;\n      font-size: 12px;\n      font-weight: 500;\n    }\n    \n    .status-active {\n      background: rgba(34, 197, 94, 0.1);\n      color: #22c55e;\n    }\n    \n    .status-pending {\n      background: rgba(234, 179, 8, 0.1);\n      color: #eab308;\n    }\n    \n    .status-inactive {\n      background: rgba(239, 68, 68, 0.1);\n      color: #ef4444;\n    }\n    \n    .pagination-btn {\n      background: #1a1a1a;\n      border: 1px solid #2a2a2a;\n      color: #e5e5e5;\n      padding: 8px 16px;\n      border-radius: 6px;\n      font-size: 13px;\n      cursor: pointer;\n      transition: all 0.15s;\n    }\n    \n    .pagination-btn:hover:not(:disabled) {\n      background: #2a2a2a;\n      border-color: #22c55e;\n    }\n    \n    .pagination-btn:disabled {\n      opacity: 0.3;\n      cursor: not-allowed;\n    }\n    \n    .pagination-btn.active {\n      background: #22c55e;\n      color: #000;\n      border-color: #22c55e;\n    }\n  </style>\n\n  <div style=\"display: flex; width: 100%; min-height: 100vh; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    \n    <!-- Vitality Sidebar -->\n    <div style=\"\n      width: 240px;\n      min-height: 100vh;\n      background: #1a1a1a;\n      display: flex;\n      flex-direction: column;\n      border-right: 1px solid #2a2a2a;\n      flex-shrink: 0;\n    \">\n      <!-- Logo -->\n      <div style=\"padding: 24px 20px; text-align: center; border-bottom: 1px solid #2a2a2a;\">\n        <div style=\"width: 50px; height: 50px; margin: 0 auto 8px;\">\n          <svg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\">\n            <rect x=\"85\" y=\"30\" width=\"30\" height=\"140\" fill=\"#22c55e\" rx=\"4\"/>\n            <rect x=\"30\" y=\"85\" width=\"140\" height=\"30\" fill=\"#22c55e\" rx=\"4\"/>\n            <path d=\"M 50 60 L 70 60 L 70 80 L 55 80 Q 50 80 50 75 Z\" fill=\"#9333ea\"/>\n            <circle cx=\"45\" cy=\"55\" r=\"8\" fill=\"#9333ea\"/>\n            <path d=\"M 130 60 L 150 60 L 150 75 Q 150 80 145 80 L 130 80 Z\" fill=\"#ef4444\"/>\n            <circle cx=\"155\" cy=\"55\" r=\"8\" fill=\"#ef4444\"/>\n            <path d=\"M 50 120 L 70 120 L 70 140 L 50 140 L 50 125 Q 50 120 55 120 Z\" fill=\"#eab308\"/>\n            <circle cx=\"45\" cy=\"145\" r=\"8\" fill=\"#eab308\"/>\n            <path d=\"M 130 120 L 145 120 Q 150 120 150 125 L 150 140 L 130 140 Z\" fill=\"#3b82f6\"/>\n            <circle cx=\"155\" cy=\"145\" r=\"8\" fill=\"#3b82f6\"/>\n          </svg>\n        </div>\n        <div style=\"font-size: 18px; font-weight: 700; color: #22c55e;\">Vitality</div>\n        <div style=\"font-size: 9px; color: #9333ea; font-weight: 500;\">Research Centre</div>\n      </div>\n      \n      <!-- Menu -->\n      <div style=\"flex: 1; padding: 16px 12px; overflow-y: auto;\">\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 13px;\">\n          <span style=\"font-size: 16px;\"></span>\n          <span>Dashboard</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 13px;\">\n          <span style=\"font-size: 16px;\"></span>\n          <span>Chat-Bot Engagement</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 13px;\">\n          <span style=\"font-size: 16px;\"></span>\n          <span>User Directory</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 13px;\">\n          <span style=\"font-size: 16px;\"></span>\n          <span>Orientation Calls</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; background: #22c55e; color: #000; font-size: 13px; font-weight: 600;\">\n          <span style=\"font-size: 16px;\"></span>\n          <span>Form Submissions</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 13px;\">\n          <span style=\"font-size: 16px;\"></span>\n          <span>Chat History</span>\n        </div>\n      </div>\n      \n      <!-- Copyright -->\n      <div style=\"padding: 12px; border-top: 1px solid #2a2a2a; font-size: 9px; color: #555; text-align: center;\">\n        © 2025 Vitality\n      </div>\n    </div>\n\n    <!-- Main Content -->\n    <div style=\"\n      flex: 1;\n      min-height: 100vh;\n      background: #0a0a0a;\n      display: flex;\n      flex-direction: column;\n    \">\n      \n      <!-- Top Bar -->\n      <div style=\"\n        background: transparent;\n        padding: 24px 40px;\n        display: flex;\n        align-items: center;\n        justify-content: space-between;\n      \">\n        <div>\n          <div style=\"color: #e5e5e5; font-size: 20px; font-weight: 500;\">Admin Dashboard</div>\n        </div>\n        <div style=\"\n          width: 40px;\n          height: 40px;\n          border-radius: 50%;\n          background: #1a1a1a;\n          display: flex;\n          align-items: center;\n          justify-content: center;\n          cursor: pointer;\n        \">\n          <svg width=\"20\" height=\"20\" fill=\"#e5e5e5\" viewBox=\"0 0 24 24\">\n            <path d=\"M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z\"/>\n          </svg>\n        </div>\n      </div>\n\n      <!-- Page Title -->\n      <div style=\"padding: 0 40px 24px 40px;\">\n        <h1 style=\"color: #e5e5e5; font-size: 28px; font-weight: 500; margin: 0;\">Form Submissions</h1>\n      </div>\n\n      <!-- Table Controls -->\n      <div style=\"\n        padding: 0 40px 20px 40px;\n        display: flex;\n        align-items: center;\n        justify-content: space-between;\n      \">\n        <!-- Search -->\n        <div style=\"position: relative;\">\n          <svg width=\"16\" height=\"16\" fill=\"#888\" viewBox=\"0 0 24 24\" style=\"position: absolute; left: 14px; top: 50%; transform: translateY(-50%);\">\n            <path d=\"M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z\"/>\n          </svg>\n          <input \n            type=\"text\" \n            id=\"searchInput\" \n            class=\"search-input\" \n            placeholder=\"Search by name, company...\"\n          />\n        </div>\n\n        <!-- Right Controls -->\n        <div style=\"display: flex; align-items: center; gap: 16px;\">\n          <div style=\"color: #888; font-size: 14px;\">\n            <span id=\"submissionCount\">0</span> Submissions\n          </div>\n          <button id=\"exportBtn\" class=\"export-btn\">\n            <svg width=\"16\" height=\"16\" fill=\"currentColor\" viewBox=\"0 0 24 24\">\n              <path d=\"M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z\"/>\n            </svg>\n            Export CSV\n          </button>\n        </div>\n      </div>\n\n      <!-- Data Table -->\n      <div style=\"\n        flex: 1;\n        overflow: hidden;\n        padding: 0 40px 40px 40px;\n      \">\n        <div style=\"\n          background: #0f0f0f;\n          border-radius: 12px;\n          overflow: hidden;\n          border: 1px solid #1a1a1a;\n          height: 100%;\n          display: flex;\n          flex-direction: column;\n        \">\n          <!-- Table Header -->\n          <div style=\"\n            display: grid;\n            grid-template-columns: 50px 200px 200px 240px 140px 120px 140px 140px;\n            background: #1a1a1a;\n            border-bottom: 1px solid #2a2a2a;\n            padding: 16px 20px;\n            font-size: 12px;\n            font-weight: 600;\n            color: #888;\n            text-transform: uppercase;\n            letter-spacing: 0.5px;\n          \">\n            <div style=\"display: flex; align-items: center;\">\n              <input type=\"checkbox\" id=\"selectAll\" class=\"checkbox-custom\" />\n            </div>\n            <div class=\"sortable-header\" data-column=\"contactName\">\n              Contact Name ↕\n            </div>\n            <div class=\"sortable-header\" data-column=\"company\">\n              Company ↕\n            </div>\n            <div class=\"sortable-header\" data-column=\"email\">\n              Email ↕\n            </div>\n            <div class=\"sortable-header\" data-column=\"phone\">\n              Phone ↕\n            </div>\n            <div class=\"sortable-header\" data-column=\"status\">\n              Status ↕\n            </div>\n            <div class=\"sortable-header\" data-column=\"createdDate\">\n              Created Date ↕\n            </div>\n            <div>Actions</div>\n          </div>\n\n          <!-- Table Body -->\n          <div id=\"tableBody\" class=\"scrollbar\" style=\"\n            flex: 1;\n            overflow-y: auto;\n          \">\n            <!-- Rows will be rendered here -->\n          </div>\n\n          <!-- Table Footer / Pagination -->\n          <div style=\"\n            background: #1a1a1a;\n            border-top: 1px solid #2a2a2a;\n            padding: 16px 20px;\n            display: flex;\n            align-items: center;\n            justify-content: space-between;\n          \">\n            <div style=\"color: #888; font-size: 13px;\">\n              Showing <span id=\"showingStart\">0</span> - <span id=\"showingEnd\">0</span> of <span id=\"totalSubmissions\">0</span> Submissions\n            </div>\n            \n            <div style=\"display: flex; align-items: center; gap: 8px;\">\n              <button id=\"prevBtn\" class=\"pagination-btn\">Prev</button>\n              <div id=\"pageNumbers\" style=\"display: flex; gap: 4px;\"></div>\n              <button id=\"nextBtn\" class=\"pagination-btn\">Next</button>\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n`;\n\n// =====================================\n// Utility Functions\n// =====================================\n\nconst $ = (id) => document.getElementById(id);\n\nconst getInputData = (key) => {\n  if (scriptContext && typeof scriptContext.getData === 'function') {\n    const value = scriptContext.getData(key);\n    if (value !== undefined && value !== null) {\n      return value;\n    }\n  }\n  if (parameters && parameters[key] !== undefined) {\n    return parameters[key];\n  }\n  return null;\n};\n\nconst parseSubmissionsData = (data) => {\n  if (!data) return [];\n  \n  if (Array.isArray(data)) {\n    return data;\n  }\n  \n  if (typeof data === 'string') {\n    try {\n      const parsed = JSON.parse(data);\n      return parseSubmissionsData(parsed);\n    } catch (e) {\n      console.error('Failed to parse JSON:', e);\n      return [];\n    }\n  }\n  \n  if (typeof data === 'object') {\n    const arrayKeys = ['submissions', 'data', 'items', 'records', 'results', 'forms'];\n    for (const key of arrayKeys) {\n      if (Array.isArray(data[key])) {\n        return data[key];\n      }\n    }\n    \n    if (data.contactName || data.email) {\n      return [data];\n    }\n  }\n  \n  return [];\n};\n\nconst escapeHtml = (str) => String(str || '')\n  .replaceAll('&', '&amp;')\n  .replaceAll('<', '&lt;')\n  .replaceAll('>', '&gt;')\n  .replaceAll('\"', '&quot;')\n  .replaceAll(\"'\", '&#039;');\n\nconst formatDate = (dateStr) => {\n  if (!dateStr) return '';\n  try {\n    const date = new Date(dateStr);\n    return date.toLocaleDateString('en-US', { \n      day: 'numeric',\n      month: 'short', \n      year: 'numeric'\n    });\n  } catch {\n    return dateStr;\n  }\n};\n\nconst getStatusClass = (status) => {\n  const s = String(status || '').toLowerCase();\n  if (s === 'active') return 'status-active';\n  if (s === 'pending') return 'status-pending';\n  return 'status-inactive';\n};\n\n// =====================================\n// Data Management\n// =====================================\n\nlet allSubmissions = [];\nlet filteredSubmissions = [];\nlet selectedIds = new Set();\nlet currentPage = 1;\nlet itemsPerPage = 9;\nlet sortColumn = 'createdDate';\nlet sortDirection = 'desc';\n\nconst loadSubmissionsData = () => {\n  const sources = [\n    getInputData('submissionsData'),\n    getInputData('httpResponse'),\n    getInputData('submissions'),\n    getInputData('data'),\n    getInputData('formSubmissions'),\n    getInputData('response')\n  ];\n  \n  for (const source of sources) {\n    if (source) {\n      const parsed = parseSubmissionsData(source);\n      if (parsed.length > 0) {\n        return parsed;\n      }\n    }\n  }\n  \n  return [];\n};\n\n// =====================================\n// Sorting & Filtering\n// =====================================\n\nconst sortData = (data) => {\n  return [...data].sort((a, b) => {\n    let aVal = a[sortColumn] || '';\n    let bVal = b[sortColumn] || '';\n    \n    if (sortColumn === 'createdDate') {\n      aVal = new Date(aVal).getTime();\n      bVal = new Date(bVal).getTime();\n    } else {\n      aVal = String(aVal).toLowerCase();\n      bVal = String(bVal).toLowerCase();\n    }\n    \n    if (sortDirection === 'asc') {\n      return aVal > bVal ? 1 : -1;\n    } else {\n      return aVal < bVal ? 1 : -1;\n    }\n  });\n};\n\nconst filterData = (searchTerm) => {\n  if (!searchTerm.trim()) {\n    return allSubmissions;\n  }\n  \n  const term = searchTerm.toLowerCase();\n  return allSubmissions.filter(sub => {\n    const name = String(sub.contactName || '').toLowerCase();\n    const company = String(sub.company || '').toLowerCase();\n    const email = String(sub.email || '').toLowerCase();\n    const phone = String(sub.phone || '').toLowerCase();\n    \n    return name.includes(term) || \n           company.includes(term) || \n           email.includes(term) || \n           phone.includes(term);\n  });\n};\n\n// =====================================\n// Rendering\n// =====================================\n\nconst renderTable = () => {\n  const tableBody = $('tableBody');\n  if (!tableBody) return;\n  \n  const sorted = sortData(filteredSubmissions);\n  const startIdx = (currentPage - 1) * itemsPerPage;\n  const endIdx = startIdx + itemsPerPage;\n  const pageData = sorted.slice(startIdx, endIdx);\n  \n  if (pageData.length === 0) {\n    tableBody.innerHTML = `\n      <div style=\"\n        padding: 60px 20px;\n        text-align: center;\n        color: #888;\n      \">\n        <div style=\"font-size: 16px; margin-bottom: 8px;\">No submissions found</div>\n        <div style=\"font-size: 13px;\">Try adjusting your search filters</div>\n      </div>\n    `;\n    return;\n  }\n  \n  tableBody.innerHTML = pageData.map((sub, idx) => {\n    const globalIdx = startIdx + idx;\n    const isSelected = selectedIds.has(sub.id || globalIdx);\n    \n    return `\n      <div \n        class=\"table-row\" \n        style=\"\n          display: grid;\n          grid-template-columns: 50px 200px 200px 240px 140px 120px 140px 140px;\n          padding: 16px 20px;\n          border-bottom: 1px solid #1a1a1a;\n          background: ${isSelected ? '#1a1a1a' : 'transparent'};\n        \"\n        data-id=\"${sub.id || globalIdx}\"\n      >\n        <div style=\"display: flex; align-items: center;\">\n          <input \n            type=\"checkbox\" \n            class=\"checkbox-custom row-checkbox\" \n            data-id=\"${sub.id || globalIdx}\"\n            ${isSelected ? 'checked' : ''}\n          />\n        </div>\n        <div style=\"color: #e5e5e5; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;\">\n          ${escapeHtml(sub.contactName || sub.name || '')}\n        </div>\n        <div style=\"color: #888; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;\">\n          ${escapeHtml(sub.company || '')}\n        </div>\n        <div style=\"color: #888; font-size: 14px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;\">\n          ${escapeHtml(sub.email || '')}\n        </div>\n        <div style=\"color: #888; font-size: 14px;\">\n          ${escapeHtml(sub.phone || '')}\n        </div>\n        <div>\n          <span class=\"status-badge ${getStatusClass(sub.status)}\">\n            ${escapeHtml(sub.status || 'Active')}\n          </span>\n        </div>\n        <div style=\"color: #888; font-size: 14px;\">\n          ${formatDate(sub.createdDate || sub.created_at || sub.date)}\n        </div>\n        <div style=\"display: flex; gap: 8px;\">\n          <a class=\"action-btn edit-btn\" data-id=\"${sub.id || globalIdx}\">Edit</a>\n          <span style=\"color: #3a3a3a;\">•</span>\n          <a class=\"action-btn delete-btn\" data-id=\"${sub.id || globalIdx}\">Delete</a>\n        </div>\n      </div>\n    `;\n  }).join('');\n  \n  // Update stats\n  updateStats();\n  updatePagination();\n  \n  // Add event listeners\n  addTableEventListeners();\n};\n\nconst updateStats = () => {\n  const submissionCount = $('submissionCount');\n  const totalSubmissions = $('totalSubmissions');\n  const showingStart = $('showingStart');\n  const showingEnd = $('showingEnd');\n  \n  if (submissionCount) submissionCount.textContent = filteredSubmissions.length;\n  if (totalSubmissions) totalSubmissions.textContent = filteredSubmissions.length;\n  \n  const startIdx = (currentPage - 1) * itemsPerPage + 1;\n  const endIdx = Math.min(currentPage * itemsPerPage, filteredSubmissions.length);\n  \n  if (showingStart) showingStart.textContent = filteredSubmissions.length > 0 ? startIdx : 0;\n  if (showingEnd) showingEnd.textContent = endIdx;\n};\n\nconst updatePagination = () => {\n  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);\n  const pageNumbers = $('pageNumbers');\n  const prevBtn = $('prevBtn');\n  const nextBtn = $('nextBtn');\n  \n  if (!pageNumbers) return;\n  \n  // Update buttons\n  if (prevBtn) prevBtn.disabled = currentPage === 1;\n  if (nextBtn) nextBtn.disabled = currentPage === totalPages || totalPages === 0;\n  \n  // Render page numbers\n  pageNumbers.innerHTML = '';\n  \n  for (let i = 1; i <= totalPages; i++) {\n    if (i === 1 || i === totalPages || (i >= currentPage - 1 && i <= currentPage + 1)) {\n      const btn = document.createElement('button');\n      btn.className = `pagination-btn ${i === currentPage ? 'active' : ''}`;\n      btn.textContent = i;\n      btn.addEventListener('click', () => {\n        currentPage = i;\n        renderTable();\n      });\n      pageNumbers.appendChild(btn);\n    } else if (i === currentPage - 2 || i === currentPage + 2) {\n      const ellipsis = document.createElement('span');\n      ellipsis.style.color = '#888';\n      ellipsis.style.padding = '0 8px';\n      ellipsis.textContent = '...';\n      pageNumbers.appendChild(ellipsis);\n    }\n  }\n};\n\n// =====================================\n// Event Handlers\n// =====================================\n\nconst addTableEventListeners = () => {\n  // Row checkboxes\n  document.querySelectorAll('.row-checkbox').forEach(cb => {\n    cb.addEventListener('change', (e) => {\n      const id = e.target.getAttribute('data-id');\n      if (e.target.checked) {\n        selectedIds.add(id);\n      } else {\n        selectedIds.delete(id);\n      }\n      updateSelectAll();\n      updateOutput();\n    });\n  });\n  \n  // Edit buttons\n  document.querySelectorAll('.edit-btn').forEach(btn => {\n    btn.addEventListener('click', (e) => {\n      e.preventDefault();\n      const id = btn.getAttribute('data-id');\n      handleEdit(id);\n    });\n  });\n  \n  // Delete buttons\n  document.querySelectorAll('.delete-btn').forEach(btn => {\n    btn.addEventListener('click', (e) => {\n      e.preventDefault();\n      const id = btn.getAttribute('data-id');\n      handleDelete(id);\n    });\n  });\n};\n\nconst handleEdit = (id) => {\n  const submission = filteredSubmissions.find((s, idx) => (s.id || idx) == id);\n  \n  if (typeof output !== 'undefined') {\n    output.action = 'edit';\n    output.selectedSubmission = submission;\n  }\n  \n  console.log('Edit submission:', submission);\n};\n\nconst handleDelete = (id) => {\n  const submission = filteredSubmissions.find((s, idx) => (s.id || idx) == id);\n  \n  if (typeof output !== 'undefined') {\n    output.action = 'delete';\n    output.selectedSubmission = submission;\n  }\n  \n  console.log('Delete submission:', submission);\n};\n\nconst updateSelectAll = () => {\n  const selectAll = $('selectAll');\n  if (!selectAll) return;\n  \n  const visibleIds = filteredSubmissions\n    .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)\n    .map((s, idx) => s.id || ((currentPage - 1) * itemsPerPage + idx));\n  \n  const allSelected = visibleIds.length > 0 && visibleIds.every(id => selectedIds.has(String(id)));\n  selectAll.checked = allSelected;\n};\n\nconst updateOutput = () => {\n  if (typeof output !== 'undefined') {\n    output.selectedSubmissions = Array.from(selectedIds);\n    output.totalCount = allSubmissions.length;\n    output.filteredCount = filteredSubmissions.length;\n  }\n};\n\nconst exportToCSV = () => {\n  const headers = ['Contact Name', 'Company', 'Email', 'Phone', 'Status', 'Created Date'];\n  const rows = filteredSubmissions.map(sub => [\n    sub.contactName || sub.name || '',\n    sub.company || '',\n    sub.email || '',\n    sub.phone || '',\n    sub.status || '',\n    formatDate(sub.createdDate || sub.created_at || sub.date)\n  ]);\n  \n  const csvContent = [\n    headers.join(','),\n    ...rows.map(row => row.map(cell => `\"${cell}\"`).join(','))\n  ].join('\\n');\n  \n  const blob = new Blob([csvContent], { type: 'text/csv' });\n  const url = URL.createObjectURL(blob);\n  const a = document.createElement('a');\n  a.href = url;\n  a.download = `form-submissions-${new Date().toISOString().split('T')[0]}.csv`;\n  a.click();\n  URL.revokeObjectURL(url);\n  \n  if (typeof output !== 'undefined') {\n    output.action = 'export';\n  }\n};\n\n// =====================================\n// Initialize Event Listeners\n// =====================================\n\nif (typeof window !== 'undefined') {\n  // Select All checkbox\n  const selectAll = $('selectAll');\n  if (selectAll) {\n    selectAll.addEventListener('change', (e) => {\n      const checked = e.target.checked;\n      const visibleIds = filteredSubmissions\n        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)\n        .map((s, idx) => s.id || ((currentPage - 1) * itemsPerPage + idx));\n      \n      if (checked) {\n        visibleIds.forEach(id => selectedIds.add(String(id)));\n      } else {\n        visibleIds.forEach(id => selectedIds.delete(String(id)));\n      }\n      \n      renderTable();\n      updateOutput();\n    });\n  }\n  \n  // Search input\n  const searchInput = $('searchInput');\n  if (searchInput) {\n    let searchTimeout;\n    searchInput.addEventListener('input', (e) => {\n      clearTimeout(searchTimeout);\n      searchTimeout = setTimeout(() => {\n        filteredSubmissions = filterData(e.target.value);\n        currentPage = 1;\n        renderTable();\n        \n        if (typeof output !== 'undefined') {\n          output.action = 'search';\n          output.searchTerm = e.target.value;\n        }\n      }, 300);\n    });\n  }\n  \n  // Export button\n  const exportBtn = $('exportBtn');\n  if (exportBtn) {\n    exportBtn.addEventListener('click', exportToCSV);\n  }\n  \n  // Pagination buttons\n  const prevBtn = $('prevBtn');\n  const nextBtn = $('nextBtn');\n  \n  if (prevBtn) {\n    prevBtn.addEventListener('click', () => {\n      if (currentPage > 1) {\n        currentPage--;\n        renderTable();\n      }\n    });\n  }\n  \n  if (nextBtn) {\n    nextBtn.addEventListener('click', () => {\n      const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);\n      if (currentPage < totalPages) {\n        currentPage++;\n        renderTable();\n      }\n    });\n  }\n  \n  // Sortable headers\n  document.querySelectorAll('.sortable-header').forEach(header => {\n    header.addEventListener('click', () => {\n      const column = header.getAttribute('data-column');\n      if (sortColumn === column) {\n        sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';\n      } else {\n        sortColumn = column;\n        sortDirection = 'asc';\n      }\n      renderTable();\n    });\n  });\n  \n  // Context changes\n  const handler = (evt) => {\n    const detail = evt && evt.detail ? evt.detail : {};\n    \n    const relevantKeys = [\n      'submissionsData',\n      'httpResponse',\n      'submissions',\n      'data',\n      'formSubmissions',\n      'response'\n    ];\n    \n    if (!detail.key || relevantKeys.includes(detail.key)) {\n      const newData = loadSubmissionsData();\n      if (JSON.stringify(newData) !== JSON.stringify(allSubmissions)) {\n        allSubmissions = newData;\n        filteredSubmissions = allSubmissions;\n        currentPage = 1;\n        renderTable();\n        \n        if (typeof output !== 'undefined') {\n          output.action = 'refresh';\n        }\n      }\n    }\n  };\n\n  window.addEventListener('__scriptContextChange', handler);\n\n  if (typeof onCleanup === 'function') {\n    onCleanup(() => window.removeEventListener('__scriptContextChange', handler));\n  }\n}\n\n// =====================================\n// Initialize\n// =====================================\n\ntry {\n  allSubmissions = loadSubmissionsData();\n  filteredSubmissions = allSubmissions;\n  renderTable();\n  \n  if (typeof output !== 'undefined') {\n    output.action = '';\n    output.selectedSubmissions = [];\n    output.totalCount = allSubmissions.length;\n    output.filteredCount = filteredSubmissions.length;\n  }\n} catch (error) {\n  console.error('Initialization error:', error);\n}", input_variables: [{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}], output_variables: [{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"selectedSubmission","type":"object","source":"custom","description":"Output variable: selectedSubmission"},{"name":"selectedSubmissions","type":"object","source":"custom","description":"Output variable: selectedSubmissions"},{"name":"totalCount","type":"object","source":"custom","description":"Output variable: totalCount"},{"name":"filteredCount","type":"object","source":"custom","description":"Output variable: filteredCount"},{"name":"searchTerm","type":"object","source":"custom","description":"Output variable: searchTerm"},{"name":"getInputData('response')","type":"object","source":"custom","description":"Variable: getInputData('response')"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"},{"name":"sub.status","type":"object","source":"custom","description":"Variable: sub.status"},{"name":"'Status'","type":"object","source":"custom","description":"Variable: 'Status'"}], scriptElementOverrides: {"auto-134mf2":{"attributes":{"onclick":"if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17709737292499859'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17709737292499859'); } return false;","data-page-link":"page-17709737292499859","data-link-to-page":"Userdirectory"}},"auto-egzq9s":{"attributes":{"onclick":"if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17706519722888156'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17706519722888156'); } return false;","data-page-link":"page-17706519722888156","data-link-to-page":"Dashboard"}},"auto-givzmj":{"attributes":{"onclick":"if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17702907459371426'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17702907459371426'); } return false;","data-page-link":"page-17702907459371426","data-link-to-page":"Chat History"}},"auto-rqhun5":{"attributes":{"onclick":"if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-1770985628551516'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-1770985628551516'); } return false;","data-page-link":"page-1770985628551516","data-link-to-page":"chatbot"}},"auto-twr3h9":{"attributes":{"onclick":"if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17702812000504656'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17702812000504656'); } return false;","data-page-link":"page-17702812000504656","data-link-to-page":"Orientation Calls"}}} }
  ];
  React.useEffect(() => {
    const element = document.getElementById('component-1771005580992-8438') || document.querySelector('[data-component-id="component-1771005580992-8438"]');
    if (!element) return;
    
    // Event-driven pattern: Run script once on load, then scripts listen to __scriptContextChange
    // Scripts should set up listeners in their code to reactively update DOM when workflow data changes
    let cleanupFn: (() => void) | null = null;
    
    // Get initial parameters from script context or flowResults (non-blocking)
    const getInitialParameters = (): Record<string, any> => {
      const scriptContext = typeof window !== 'undefined' && (window as any).__scriptContext ? (window as any).__scriptContext : null;
      const flowResults = typeof window !== 'undefined' ? (window as any).flowResults : undefined;
      
      // First, try scriptEventParameters from flowResults (preferred source)
      if (flowResults?.scriptEventParameters && Object.keys(flowResults.scriptEventParameters).length > 0) {
        return flowResults.scriptEventParameters;
      }
      
      // Second, try script context data
      if (scriptContext && scriptContext.data) {
        const contextParams: Record<string, any> = {};
        const inputVarNames = ["innerHTML"];
        inputVarNames.forEach((varName: string) => {
          const value = scriptContext.getData(varName);
          if (value !== undefined && value !== null) {
            contextParams[varName] = value;
          }
        });
        if (Object.keys(contextParams).length > 0) {
          return contextParams;
        }
      }
      
      // Fallback: build parameters from flowResults properties matching input variable names
      if (flowResults) {
        const fallbackParameters: Record<string, any> = {};
        const inputVarNames = ["innerHTML"];
        inputVarNames.forEach((varName: string) => {
          const value = flowResults[varName] ?? 
                         flowResults?.variables?.[varName] ?? 
                         flowResults?.testingdata ?? 
                         flowResults?.currentResult?.[varName] ??
                         undefined;
          if (value !== undefined && value !== null) {
            fallbackParameters[varName] = value;
          }
        });
        if (Object.keys(fallbackParameters).length > 0) {
          return fallbackParameters;
        }
      }
      
      return {};
    };
    
    // Run script once on load with initial parameters (if available)
    // Script should set up __scriptContextChange listeners to reactively update DOM
    const initialParams = getInitialParameters();
    cleanupFn = runComponentScripts({ 
      componentId: 'component-1771005580992-8438', 
      eventType: 'onload', 
      scripts: scripts_component_1771005580992_8438_onload, 
      element, 
      parameters: initialParams
    });
    
    return () => {
      if (cleanupFn && typeof cleanupFn === 'function') {
        cleanupFn();
      }
    };
  }, []);

  return (
<> 
<div style={{ width: "100%", display: "grid", position: "relative", minHeight: "100vh", gridTemplateRows: "repeat(auto-fill, minmax(30px, auto))", gridTemplateColumns: "repeat(12, 1fr)" }} id="page-container-undefined">
      <div style={{ width: "100%", border: "none", display: "block", padding: "0.5rem", gridArea: "1 / 1 / 28 / 13", overflow: "hidden", minHeight: "810px", gridRowEnd: 28, paddingTop: "0", gridRowStart: 1, paddingLeft: "0", gridColumnEnd: 13, paddingRight: "0", paddingBottom: "0", backgroundColor: "#fff", gridColumnStart: 1 }} id="component-1771005580992-8438"></div>
    </div>

    </>
  );
}