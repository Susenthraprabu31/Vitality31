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


export default function Chatbot() {
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

  const scripts_component_1770985632248_4126_onload = [
    { id: "043f403a-ae56-4687-b921-5b2efd2815ac", name: "chatbotvitality", order: 0, code: "// ===============================\n// Chat-Bot Engagement - WhatsApp Conversation Display (Enhanced)\n// Integrates with Full Page Chat Configuration Node\n// \n// Input Variables (from Full Page Chat node):\n//   - userMessage: Individual user message from Variable Message Display\n//   - aiResponse: Individual AI response from AI Response Configuration\n//   - messagesHistory: Array of all messages (if available)\n//   - conversationId: Unique conversation identifier\n//\n// Output Variables:\n//   - output.selectedConversation: Selected conversation object\n//   - output.action: \"select\" | \"refresh\" | \"newMessage\"\n//   - output.messageCount: Total number of messages\n//   - output.lastMessageTime: Timestamp of last message\n// ===============================\n\nelement.innerHTML = `\n  <style>\n    * {\n      margin: 0;\n      padding: 0;\n      box-sizing: border-box;\n    }\n    \n    .scrollbar::-webkit-scrollbar {\n      width: 6px;\n    }\n    \n    .scrollbar::-webkit-scrollbar-track {\n      background: transparent;\n    }\n    \n    .scrollbar::-webkit-scrollbar-thumb {\n      background: #3a3a3a;\n      border-radius: 3px;\n    }\n    \n    .scrollbar::-webkit-scrollbar-thumb:hover {\n      background: #4a4a4a;\n    }\n    \n    .message-bubble {\n      animation: slideIn 0.3s ease-out;\n    }\n    \n    @keyframes slideIn {\n      from {\n        opacity: 0;\n        transform: translateY(10px);\n      }\n      to {\n        opacity: 1;\n        transform: translateY(0);\n      }\n    }\n    \n    .typing-indicator {\n      display: flex;\n      gap: 4px;\n      padding: 12px 16px;\n    }\n    \n    .typing-dot {\n      width: 8px;\n      height: 8px;\n      border-radius: 50%;\n      background: #666;\n      animation: typing 1.4s infinite;\n    }\n    \n    .typing-dot:nth-child(2) {\n      animation-delay: 0.2s;\n    }\n    \n    .typing-dot:nth-child(3) {\n      animation-delay: 0.4s;\n    }\n    \n    @keyframes typing {\n      0%, 60%, 100% {\n        transform: translateY(0);\n        opacity: 0.6;\n      }\n      30% {\n        transform: translateY(-10px);\n        opacity: 1;\n      }\n    }\n    \n    .new-message-indicator {\n      position: fixed;\n      top: 80px;\n      right: 40px;\n      background: #00c853;\n      color: #000;\n      padding: 12px 20px;\n      border-radius: 8px;\n      font-size: 13px;\n      font-weight: 600;\n      box-shadow: 0 4px 12px rgba(0, 200, 83, 0.3);\n      animation: slideInRight 0.3s ease-out;\n      z-index: 1000;\n    }\n    \n    @keyframes slideInRight {\n      from {\n        opacity: 0;\n        transform: translateX(100px);\n      }\n      to {\n        opacity: 1;\n        transform: translateX(0);\n      }\n    }\n  </style>\n\n  <div style=\"display: flex; width: 100%; min-height: 100vh; background: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    \n    <!-- Vitality Sidebar -->\n    <div style=\"\n      width: 240px;\n      min-height: 100vh;\n      background: #1f1f1f;\n      display: flex;\n      flex-direction: column;\n      border-right: 1px solid #2a2a2a;\n      flex-shrink: 0;\n    \">\n      <!-- Logo -->\n      <div style=\"padding: 24px 20px; text-align: center; border-bottom: 1px solid #2a2a2a;\">\n        <div style=\"width: 50px; height: 50px; margin: 0 auto 8px;\">\n          <svg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\">\n            <rect x=\"85\" y=\"30\" width=\"30\" height=\"140\" fill=\"#22c55e\" rx=\"4\"/>\n            <rect x=\"30\" y=\"85\" width=\"140\" height=\"30\" fill=\"#22c55e\" rx=\"4\"/>\n            <path d=\"M 50 60 L 70 60 L 70 80 L 55 80 Q 50 80 50 75 Z\" fill=\"#9333ea\"/>\n            <circle cx=\"45\" cy=\"55\" r=\"8\" fill=\"#9333ea\"/>\n            <path d=\"M 130 60 L 150 60 L 150 75 Q 150 80 145 80 L 130 80 Z\" fill=\"#ef4444\"/>\n            <circle cx=\"155\" cy=\"55\" r=\"8\" fill=\"#ef4444\"/>\n            <path d=\"M 50 120 L 70 120 L 70 140 L 50 140 L 50 125 Q 50 120 55 120 Z\" fill=\"#eab308\"/>\n            <circle cx=\"45\" cy=\"145\" r=\"8\" fill=\"#eab308\"/>\n            <path d=\"M 130 120 L 145 120 Q 150 120 150 125 L 150 140 L 130 140 Z\" fill=\"#3b82f6\"/>\n            <circle cx=\"155\" cy=\"145\" r=\"8\" fill=\"#3b82f6\"/>\n          </svg>\n        </div>\n        <div style=\"font-size: 18px; font-weight: 700; color: #22c55e;\">Vitality</div>\n        <div style=\"font-size: 9px; color: #9333ea; font-weight: 500;\">Research Centre</div>\n      </div>\n      \n      <!-- Menu -->\n      <div style=\"flex: 1; padding: 16px 12px; overflow-y: auto;\">\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 13px;\">\n          <span style=\"font-size: 16px;\"></span>\n          <span>Dashboard</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; background: #00c853; color: #000; font-size: 13px; font-weight: 600;\">\n          <span style=\"font-size: 16px;\"></span>\n          <span>Chat-Bot Engagement</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 13px;\">\n          <span style=\"font-size: 16px;\"></span>\n          <span>User Directory</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 13px;\">\n          <span style=\"font-size: 16px;\"></span>\n          <span>Orientation Calls</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 13px;\">\n          <span style=\"font-size: 16px;\"></span>\n          <span>Form Submissions</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 13px;\">\n          <span style=\"font-size: 16px;\"></span>\n          <span>Chat History</span>\n        </div>\n      </div>\n      \n      <!-- Stats Footer -->\n      <div style=\"padding: 16px 12px; border-top: 1px solid #2a2a2a;\">\n        <div style=\"display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;\">\n          <span style=\"color: #888; font-size: 11px;\">Active Chats</span>\n          <span id=\"activeChatsCount\" style=\"color: #00c853; font-size: 13px; font-weight: 600;\">0</span>\n        </div>\n        <div style=\"display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;\">\n          <span style=\"color: #888; font-size: 11px;\">Total Messages</span>\n          <span id=\"totalMessagesCount\" style=\"color: #e5e5e5; font-size: 13px; font-weight: 600;\">0</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 8px; margin-top: 16px;\">\n          <div style=\"width: 8px; height: 8px; border-radius: 50%; background: #00c853;\"></div>\n          <span style=\"color: #888; font-size: 11px;\">Live Monitoring</span>\n        </div>\n      </div>\n      \n      <!-- Copyright -->\n      <div style=\"padding: 12px; border-top: 1px solid #2a2a2a; font-size: 9px; color: #555; text-align: center;\">\n        © 2025 Vitality\n      </div>\n    </div>\n\n    <!-- Main Content -->\n    <div style=\"\n      flex: 1;\n      min-height: 100vh;\n      background: #1a1a1a;\n      display: flex;\n      flex-direction: column;\n    \">\n      \n      <!-- Top Bar -->\n      <div style=\"\n        background: #1f1f1f;\n        padding: 16px 24px;\n        border-bottom: 1px solid #2a2a2a;\n        display: flex;\n        align-items: center;\n        justify-content: space-between;\n      \">\n        <div>\n          <div style=\"color: #e5e5e5; font-size: 16px; font-weight: 500;\">Admin Dashboard</div>\n          <div id=\"conversationInfo\" style=\"color: #666; font-size: 12px; margin-top: 4px;\">\n            Monitoring WhatsApp conversations\n          </div>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 16px;\">\n          <button id=\"refreshBtn\" style=\"\n            background: #2a2a2a;\n            border: 1px solid #3a3a3a;\n            color: #e5e5e5;\n            padding: 8px 16px;\n            border-radius: 6px;\n            cursor: pointer;\n            font-size: 13px;\n            display: flex;\n            align-items: center;\n            gap: 8px;\n          \">\n            <svg width=\"16\" height=\"16\" fill=\"currentColor\" viewBox=\"0 0 24 24\">\n              <path d=\"M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z\"/>\n            </svg>\n            Refresh\n          </button>\n          <div style=\"\n            width: 40px;\n            height: 40px;\n            border-radius: 50%;\n            background: #2a2a2a;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            cursor: pointer;\n          \">\n            <svg width=\"20\" height=\"20\" fill=\"#e5e5e5\" viewBox=\"0 0 24 24\">\n              <path d=\"M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z\"/>\n            </svg>\n          </div>\n        </div>\n      </div>\n\n      <!-- New Message Indicator -->\n      <div id=\"newMessageIndicator\" style=\"display: none;\" class=\"new-message-indicator\">\n        New message received!\n      </div>\n\n      <!-- Chat Area -->\n      <div style=\"\n        flex: 1;\n        display: flex;\n        flex-direction: column;\n        align-items: center;\n        justify-content: center;\n        padding: 40px;\n        position: relative;\n      \">\n        \n        <!-- Welcome Message (shown when no messages) -->\n        <div id=\"welcomeMessage\" style=\"\n          text-align: center;\n          max-width: 600px;\n        \">\n          <h1 style=\"\n            color: #e5e5e5;\n            font-size: 36px;\n            font-weight: 400;\n            margin-bottom: 20px;\n          \">Hi there, What can I help with?</h1>\n          <p style=\"\n            color: #888;\n            font-size: 16px;\n            line-height: 1.6;\n            margin-bottom: 24px;\n          \">This is your live WhatsApp conversation monitor. Messages from users and AI responses will appear here in real-time.</p>\n          <div style=\"\n            display: inline-flex;\n            align-items: center;\n            gap: 8px;\n            background: #2a2a2a;\n            border: 1px solid #3a3a3a;\n            border-radius: 8px;\n            padding: 12px 20px;\n            color: #00c853;\n            font-size: 13px;\n            font-weight: 500;\n          \">\n            <div style=\"width: 8px; height: 8px; border-radius: 50%; background: #00c853;\"></div>\n            Waiting for messages...\n          </div>\n        </div>\n\n        <!-- Messages Container (hidden initially) -->\n        <div id=\"messagesContainer\" style=\"\n          display: none;\n          width: 100%;\n          max-width: 900px;\n          height: 100%;\n          flex-direction: column;\n        \">\n          <!-- Messages Area -->\n          <div id=\"messagesArea\" class=\"scrollbar\" style=\"\n            flex: 1;\n            overflow-y: auto;\n            padding: 20px;\n            display: flex;\n            flex-direction: column;\n            gap: 16px;\n          \">\n            <!-- Messages will be rendered here -->\n          </div>\n          \n          <!-- Typing Indicator -->\n          <div id=\"typingIndicator\" style=\"\n            display: none;\n            padding: 0 20px 20px 20px;\n          \">\n            <div style=\"\n              display: flex;\n              align-items: flex-start;\n              gap: 12px;\n            \">\n              <div style=\"\n                width: 40px;\n                height: 40px;\n                border-radius: 50%;\n                background: #9333ea;\n                display: flex;\n                align-items: center;\n                justify-content: center;\n                color: #fff;\n                font-weight: 600;\n                font-size: 16px;\n                flex-shrink: 0;\n              \">AI</div>\n              <div style=\"\n                background: #1f1f1f;\n                border: 1px solid #2a2a2a;\n                border-radius: 12px;\n                padding: 14px 16px;\n              \">\n                <div class=\"typing-indicator\">\n                  <div class=\"typing-dot\"></div>\n                  <div class=\"typing-dot\"></div>\n                  <div class=\"typing-dot\"></div>\n                </div>\n              </div>\n            </div>\n          </div>\n        </div>\n      </div>\n\n      <!-- Bottom Input Display (Read-only) -->\n      <div style=\"\n        padding: 20px 40px;\n        border-top: 1px solid #2a2a2a;\n        background: #1f1f1f;\n      \">\n        <div style=\"\n          max-width: 900px;\n          margin: 0 auto;\n          background: #2a2a2a;\n          border: 1px solid #3a3a3a;\n          border-radius: 12px;\n          padding: 14px 20px;\n          display: flex;\n          align-items: center;\n          gap: 12px;\n          opacity: 0.7;\n        \">\n          <svg width=\"20\" height=\"20\" fill=\"#888\" viewBox=\"0 0 24 24\">\n            <path d=\"M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z\"/>\n          </svg>\n          <div style=\"\n            flex: 1;\n            color: #666;\n            font-size: 14px;\n          \">Monitoring live conversations - View only mode</div>\n          <div style=\"\n            display: flex;\n            align-items: center;\n            gap: 8px;\n            color: #666;\n            font-size: 13px;\n          \">\n            <svg width=\"18\" height=\"18\" fill=\"#666\" viewBox=\"0 0 24 24\">\n              <circle cx=\"12\" cy=\"12\" r=\"10\"/>\n            </svg>\n            <span>WhatsApp Bot</span>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n`;\n\n// =====================================\n// Utility Functions\n// =====================================\n\nconst $ = (id) => document.getElementById(id);\n\n// Get data from scriptContext or parameters\nconst getInputData = (key) => {\n  // First try scriptContext (Full Page Chat node integration)\n  const ctxValue = (scriptContext && typeof scriptContext.getData === 'function')\n    ? scriptContext.getData(key)\n    : undefined;\n  if (ctxValue !== undefined && ctxValue !== null) return ctxValue;\n\n  // Then try parameters\n  if (parameters && Object.prototype.hasOwnProperty.call(parameters, key)) return parameters[key];\n\n  // Then try window.dataFlow (direct or via get())\n  if (typeof window !== 'undefined') {\n    const df = window.dataFlow;\n    if (df) {\n      if (Object.prototype.hasOwnProperty.call(df, key)) return df[key];\n      if (typeof df.get === 'function') {\n        try {\n          const value = df.get(key);\n          if (value !== undefined && value !== null) return value;\n        } catch {}\n      }\n    }\n  }\n\n  // Finally try window.flowResults\n  if (typeof window !== 'undefined') {\n    const fr = window.flowResults || window.mainChainFlowResults;\n    if (fr) {\n      return fr[key] || \n        (fr.apiResponses && fr.apiResponses[key]) ||\n        (fr.variables && fr.variables[key]);\n    }\n  }\n\n  return null;\n};\n\n// Normalize various message formats to array\nconst normalizeMessages = (value) => {\n  if (Array.isArray(value)) return value;\n  if (typeof value === 'string') {\n    try {\n      const parsed = JSON.parse(value);\n      return normalizeMessages(parsed);\n    } catch {}\n  }\n  if (value && typeof value === 'object') {\n    const keys = ['messages', 'data', 'items', 'records', 'body'];\n    for (const key of keys) {\n      if (Array.isArray(value[key])) return value[key];\n    }\n  }\n  return [];\n};\n\n// Parse individual message (from Full Page Chat node)\nconst parseMessage = (value) => {\n  if (!value) return null;\n  \n  // If it's already an object\n  if (typeof value === 'object' && !Array.isArray(value)) {\n    return value;\n  }\n  \n  // If it's a string, try to parse as JSON\n  if (typeof value === 'string') {\n    try {\n      const parsed = JSON.parse(value);\n      return parsed;\n    } catch {\n      // If not JSON, return as text message\n      return { text: value };\n    }\n  }\n  \n  return null;\n};\n// Extract text from common message shapes\nconst extractText = (value) => {\n  if (value === undefined || value === null) return '';\n  if (typeof value === 'string') return value;\n  if (typeof value === 'number' || typeof value === 'boolean') return String(value);\n  if (typeof value === 'object') {\n    const direct = value.text || value.message || value.content || value.body || value.response || value.result || value.output || value.data || value.value;\n    if (direct !== undefined && direct !== null) return String(direct);\n    try {\n      return JSON.stringify(value);\n    } catch {\n      return String(value);\n    }\n  }\n  return String(value);\n};\n\nconst extractTimestamp = (value, fallback) => {\n  if (!value) return fallback;\n  if (typeof value === 'object') {\n    const ts = value.timestamp || value.time || value.created_at || value.createdAt || value.received_at;\n    if (ts) return ts;\n  }\n  return fallback;\n};\n\n// Resolve AI response from flow/dataFlow\nconst getLatestAiResponse = () => {\n  const direct =\n    getInputData('aiResponse') ||\n    getInputData('agentResponse') ||\n    getInputData('assistantResponse') ||\n    getInputData('sdkResult') ||\n    getInputData('OpenAI_Agent') ||\n    getInputData('openaiSDKResult_openaiAgentSDKNode_1770013824184');\n  if (direct !== undefined && direct !== null) {\n    return { value: direct, timestamp: extractTimestamp(direct, null) };\n  }\n\n  if (typeof window !== 'undefined') {\n    const df = window.dataFlow;\n    if (df && typeof df.getByNodeId === 'function') {\n      const byNode = df.getByNodeId('openaiAgentSDKNode-1770013824184');\n      if (byNode !== undefined && byNode !== null) {\n        return { value: byNode, timestamp: extractTimestamp(byNode, null) };\n      }\n    }\n\n    const fr = window.flowResults || window.mainChainFlowResults;\n    const nodeResults = fr && fr.nodeResults ? Object.values(fr.nodeResults) : [];\n    if (nodeResults && nodeResults.length) {\n      const candidates = nodeResults.filter((node) => node && node.nodeType === 'openaiAgentSDKNode');\n      if (candidates.length) {\n        candidates.sort((a, b) => new Date(a.timestamp || 0) - new Date(b.timestamp || 0));\n        const latest = candidates[candidates.length - 1];\n        return { value: latest.data, timestamp: latest.timestamp || null };\n      }\n    }\n  }\n\n  return null;\n};\n\nconst getHistoryStore = () => {\n  if (typeof window === 'undefined') return null;\n  const key = '__whatsappConversationHistory';\n  if (!window[key]) window[key] = {};\n  return window[key];\n};\n\nconst normalizeText = (value) => {\n  return String(value || '').trim().replace(/\\s+/g, ' ');\n};\n\nconst makeMessageKey = (msg) => {\n  const type = msg.type || '';\n  const text = normalizeText(msg.text);\n  const from = msg.from || '';\n  return `${type}|${from}|${text}`;\n};\n\nconst mergeHistory = (existing, incoming) => {\n  const map = new Map();\n  (existing || []).forEach((msg) => {\n    if (!msg) return;\n    map.set(makeMessageKey(msg), msg);\n  });\n  (incoming || []).forEach((msg) => {\n    if (!msg) return;\n    const key = makeMessageKey(msg);\n    if (!map.has(key)) {\n      map.set(key, msg);\n    }\n  });\n  const merged = Array.from(map.values());\n  merged.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));\n  return merged;\n};\n\n// HTML escape for security\nconst escapeHtml = (str) => String(str || '')\n  .replaceAll('&', '&amp;')\n  .replaceAll('<', '&lt;')\n  .replaceAll('>', '&gt;')\n  .replaceAll('\"', '&quot;')\n  .replaceAll(\"'\", '&#039;');\n\n// Format timestamp\nconst formatTimestamp = (timestamp) => {\n  if (!timestamp) return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });\n  try {\n    const date = new Date(timestamp);\n    if (isNaN(date.getTime())) {\n      return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });\n    }\n    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });\n  } catch {\n    return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });\n  }\n};\n\n// =====================================\n// Message Management\n// =====================================\n\nlet messagesStore = [];\nlet lastMessageCount = 0;\nlet conversationId = null;\n\n// Load messages from various sources\nconst loadMessages = () => {\n  let messages = [];\n  const convFallback = getInputData('conversationId') ||\n    getInputData('whatsappMessageFrom') ||\n    getInputData('whatsappContactNumber') ||\n    getInputData('whatsappSenderPhone');\n  if (!conversationId && convFallback) {\n    conversationId = convFallback;\n  }\n\n  \n  // Method 1: Try to get messagesHistory array (if available)\n  const history = normalizeMessages(getInputData('messagesHistory'));\n  if (history && history.length > 0) {\n    messages = history.map(msg => ({\n      type: msg.type || (msg.role === 'user' ? 'user' : 'ai'),\n      text: msg.text || msg.message || msg.content || '',\n      timestamp: extractTimestamp(msg, new Date().toISOString()),\n      from: msg.from || msg.sender || (msg.type === 'user' ? 'User' : 'AI Assistant'),\n      id: msg.id || `msg-${Date.now()}-${Math.random()}`\n    }));\n  }\n  \n  // Method 2: Get individual messages from Full Page Chat node\n  const userMessage = parseMessage(getInputData('userMessage'));\n  const aiResponse = parseMessage(getInputData('aiResponse'));\n  \n  // If we have individual messages but no history, create combined array\n  if ((userMessage || aiResponse) && messages.length === 0) {\n    if (userMessage) {\n      messages.push({\n        type: 'user',\n        text: userMessage.text || userMessage.message || userMessage.body || JSON.stringify(userMessage),\n        timestamp: extractTimestamp(userMessage, new Date().toISOString()),\n        from: userMessage.from || userMessage.sender || userMessage.name || 'User',\n        id: `user-${Date.now()}`\n      });\n    }\n    \n    if (aiResponse) {\n      messages.push({\n        type: 'ai',\n        text: aiResponse.text || aiResponse.message || aiResponse.response || JSON.stringify(aiResponse),\n        timestamp: extractTimestamp(aiResponse, new Date().toISOString()),\n        from: 'AI Assistant',\n        id: `ai-${Date.now()}`\n      });\n    }\n  }\n  \n  // Method 3: Fallback to separate userMessages and aiMessages arrays\n  if (messages.length === 0) {\n    const userMessages = normalizeMessages(getInputData('userMessages'));\n    const aiMessages = normalizeMessages(getInputData('aiMessages'));\n    \n    userMessages.forEach(msg => {\n      messages.push({\n        type: 'user',\n        text: msg.text || msg.message || msg.content || '',\n        timestamp: extractTimestamp(msg, new Date().toISOString()),\n        from: msg.from || msg.name || 'User',\n        id: msg.id || `user-${Date.now()}-${Math.random()}`\n      });\n    });\n    \n    aiMessages.forEach(msg => {\n      messages.push({\n        type: 'ai',\n        text: msg.text || msg.message || msg.content || msg.response || '',\n        timestamp: extractTimestamp(msg, new Date().toISOString()),\n        from: 'AI Assistant',\n        id: msg.id || `ai-${Date.now()}-${Math.random()}`\n      });\n    });\n  }\n  \n  // Method 4: WhatsApp trigger / flow variables\n  if (messages.length === 0) {\n    const whatsappBody =\n      getInputData('whatsappMessageBody') ||\n      getInputData('messageBody') ||\n      getInputData('whatsappMessage') ||\n      getInputData('message');\n\n    const whatsappFrom =\n      getInputData('whatsappMessageFrom') ||\n      getInputData('whatsappSenderPhone') ||\n      getInputData('whatsappContactNumber') ||\n      getInputData('from') ||\n      getInputData('sender');\n\n    const whatsappName =\n      getInputData('whatsappSenderName') ||\n      getInputData('whatsappContactName') ||\n      getInputData('sender_name') ||\n      getInputData('senderName');\n\n    const whatsappTimestamp =\n      getInputData('whatsappMessageTimestamp') ||\n      getInputData('timestamp') ||\n      getInputData('received_at');\n\n    const baseTime = Date.now();\n\n    if (whatsappBody) {\n      messages.push({\n        type: 'user',\n        text: extractText(whatsappBody),\n        timestamp: extractTimestamp(whatsappBody, whatsappTimestamp || new Date(baseTime).toISOString()),\n        from: whatsappName || whatsappFrom || 'User',\n        id: `wa-user-${Date.now()}`\n      });\n    }\n\n    const aiResult = getLatestAiResponse();\n    if (aiResult && aiResult.value) {\n      const aiTimestamp = extractTimestamp(aiResult.value, aiResult.timestamp || new Date(baseTime + 1).toISOString());\n      messages.push({\n        type: 'ai',\n        text: extractText(aiResult.value),\n        timestamp: aiTimestamp,\n        from: 'AI Assistant',\n        id: `wa-ai-${Date.now()}`\n      });\n    }\n  }\n\n  // Method 5: Fallback to innerHTML mapping (combined message string)\n  if (messages.length === 0) {\n    const combined = getInputData('innerHTML');\n    if (combined && typeof combined === 'string') {\n      const baseTime = Date.now();\n      const separatorIndex = combined.indexOf('  ');\n      if (separatorIndex > -1) {\n        const userText = combined.slice(0, separatorIndex).trim();\n        const aiText = combined.slice(separatorIndex + 2).trim();\n        if (userText) {\n          messages.push({\n            type: 'user',\n            text: userText,\n            timestamp: new Date(baseTime).toISOString(),\n            from: 'User',\n            id: `combined-user-${Date.now()}`\n          });\n        }\n        if (aiText) {\n          messages.push({\n            type: 'ai',\n            text: aiText,\n            timestamp: new Date(baseTime + 1).toISOString(),\n            from: 'AI Assistant',\n            id: `combined-ai-${Date.now()}`\n          });\n        }\n      } else if (combined.trim()) {\n        messages.push({\n          type: 'user',\n          text: combined.trim(),\n          timestamp: new Date(baseTime).toISOString(),\n          from: 'User',\n          id: `combined-user-${Date.now()}`\n        });\n      }\n    }\n  }\n\n  // Sort by timestamp\n  messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));\n\n  const store = getHistoryStore();\n  if (store) {\n    const key = conversationId || 'default';\n    const existing = Array.isArray(store[key]) ? store[key] : [];\n    const merged = mergeHistory(existing, messages);\n    store[key] = merged;\n    messages = merged;\n  }\n\n  return messages;\n};\n\n// =====================================\n// UI Rendering\n// =====================================\n\nconst renderMessages = () => {\n  const welcomeMessage = $('welcomeMessage');\n  const messagesContainer = $('messagesContainer');\n  const messagesArea = $('messagesArea');\n  const totalMessagesCount = $('totalMessagesCount');\n  const activeChatsCount = $('activeChatsCount');\n  const conversationInfo = $('conversationInfo');\n  \n  if (!messagesArea) return;\n  \n  // Update stats\n  if (totalMessagesCount) {\n    totalMessagesCount.textContent = messagesStore.length;\n  }\n  if (activeChatsCount) {\n    activeChatsCount.textContent = messagesStore.length > 0 ? '1' : '0';\n  }\n  \n  // Show/hide welcome message\n  if (messagesStore.length === 0) {\n    if (welcomeMessage) welcomeMessage.style.display = 'block';\n    if (messagesContainer) messagesContainer.style.display = 'none';\n    if (conversationInfo) conversationInfo.textContent = 'Monitoring WhatsApp conversations';\n    return;\n  }\n  \n  if (welcomeMessage) welcomeMessage.style.display = 'none';\n  if (messagesContainer) messagesContainer.style.display = 'flex';\n  \n  // Update conversation info\n  if (conversationInfo && conversationId) {\n    conversationInfo.textContent = `Conversation ID: ${conversationId}`;\n  } else if (conversationInfo) {\n    conversationInfo.textContent = `${messagesStore.length} messages`;\n  }\n  \n  // Render messages\n  messagesArea.innerHTML = messagesStore.map(msg => {\n    const isUser = msg.type === 'user';\n    \n    return `\n      <div class=\"message-bubble\" style=\"\n        display: flex;\n        align-items: flex-start;\n        gap: 12px;\n      \">\n        <!-- Avatar -->\n        <div style=\"\n          width: 40px;\n          height: 40px;\n          border-radius: 50%;\n          background: ${isUser ? '#00c853' : '#9333ea'};\n          display: flex;\n          align-items: center;\n          justify-content: center;\n          color: #fff;\n          font-weight: 600;\n          font-size: 16px;\n          flex-shrink: 0;\n        \">${isUser ? (msg.from ? msg.from.charAt(0).toUpperCase() : 'U') : 'AI'}</div>\n        \n        <!-- Message Content -->\n        <div style=\"flex: 1; max-width: 700px;\">\n          <div style=\"\n            display: flex;\n            align-items: center;\n            gap: 8px;\n            margin-bottom: 6px;\n          \">\n            <span style=\"\n              color: #e5e5e5;\n              font-weight: 500;\n              font-size: 14px;\n            \">${escapeHtml(msg.from)}</span>\n            <span style=\"\n              color: #666;\n              font-size: 12px;\n            \">${formatTimestamp(msg.timestamp)}</span>\n          </div>\n          <div style=\"\n            background: ${isUser ? '#2a2a2a' : '#1f1f1f'};\n            border: 1px solid ${isUser ? '#3a3a3a' : '#2a2a2a'};\n            border-radius: 12px;\n            padding: 14px 16px;\n            color: #e5e5e5;\n            font-size: 15px;\n            line-height: 1.6;\n            white-space: pre-wrap;\n          \">${escapeHtml(msg.text)}</div>\n        </div>\n      </div>\n    `;\n  }).join('');\n  \n  // Auto-scroll to bottom\n  setTimeout(() => {\n    messagesArea.scrollTop = messagesArea.scrollHeight;\n  }, 100);\n};\n\n// Show new message indicator\nconst showNewMessageIndicator = () => {\n  const indicator = $('newMessageIndicator');\n  if (!indicator) return;\n  \n  indicator.style.display = 'block';\n  \n  setTimeout(() => {\n    indicator.style.display = 'none';\n  }, 3000);\n};\n\n// Show/hide typing indicator\nconst setTypingIndicator = (show) => {\n  const indicator = $('typingIndicator');\n  if (!indicator) return;\n  \n  indicator.style.display = show ? 'block' : 'none';\n  \n  // Auto-scroll when showing typing indicator\n  if (show) {\n    const messagesArea = $('messagesArea');\n    if (messagesArea) {\n      setTimeout(() => {\n        messagesArea.scrollTop = messagesArea.scrollHeight;\n      }, 100);\n    }\n  }\n};\n\n// =====================================\n// Update Logic\n// =====================================\n\nconst updateMessages = () => {\n  const newMessages = loadMessages();\n  \n  // Check if there are new messages\n  if (newMessages.length > messagesStore.length) {\n    // Show new message indicator\n    showNewMessageIndicator();\n    \n    // Update output\n    if (typeof output !== 'undefined') {\n      output.action = 'newMessage';\n      output.lastMessageTime = new Date().toISOString();\n    }\n  }\n  \n  // Check if last message is from user (show typing indicator)\n  if (newMessages.length > 0 && messagesStore.length > 0) {\n    const lastOldMessage = messagesStore[messagesStore.length - 1];\n    const lastNewMessage = newMessages[newMessages.length - 1];\n    \n    if (lastNewMessage.type === 'user' && lastNewMessage.id !== lastOldMessage.id) {\n      setTypingIndicator(true);\n      \n      // Hide typing indicator after 2 seconds\n      setTimeout(() => setTypingIndicator(false), 2000);\n    }\n  }\n  \n  const mergedMessages = mergeHistory(messagesStore, newMessages);\n  messagesStore = mergedMessages;\n  renderMessages();\n  \n  // Update output\n  if (typeof output !== 'undefined') {\n    output.messageCount = messagesStore.length;\n    if (messagesStore.length > 0) {\n      output.lastMessageTime = messagesStore[messagesStore.length - 1].timestamp;\n    }\n  }\n};\n\n// =====================================\n// Event Handlers\n// =====================================\n\n// Refresh button\nif (typeof window !== 'undefined') {\n  const refreshBtn = $('refreshBtn');\n  if (refreshBtn) {\n    refreshBtn.addEventListener('click', () => {\n      updateMessages();\n      \n      if (typeof output !== 'undefined') {\n        output.action = 'refresh';\n      }\n    });\n  }\n}\n\n// Handle context changes from Full Page Chat node\nif (typeof window !== 'undefined') {\n  const handler = (evt) => {\n    const detail = evt && evt.detail ? evt.detail : {};\n    \n    // Update on any relevant key change\n    const relevantKeys = [\n      'userMessage', \n      'aiResponse', \n      'messagesHistory', \n      'userMessages', \n      'aiMessages',\n      'conversationId',\n      'whatsappMessageBody',\n      'whatsappMessageFrom',\n      'whatsappMessageTimestamp',\n      'messageBody',\n      'sdkResult',\n      'openaiSDKResult_openaiAgentSDKNode_1770013824184',\n      'innerHTML'\n    ];\n    \n    if (!detail.key || relevantKeys.includes(detail.key)) {\n      // Get conversation ID if available\n      const newConvId = getInputData('conversationId');\n      if (newConvId) {\n        conversationId = newConvId;\n      }\n      \n      updateMessages();\n    }\n  };\n\n  window.addEventListener('__scriptContextChange', handler);\n\n  if (typeof onCleanup === 'function') {\n    onCleanup(() => window.removeEventListener('__scriptContextChange', handler));\n  }\n}\n\n// Auto-refresh every 3 seconds to check for new messages\nlet refreshInterval;\nif (typeof window !== 'undefined') {\n  refreshInterval = setInterval(() => {\n    const currentMessages = loadMessages();\n    \n    if (JSON.stringify(currentMessages) !== JSON.stringify(messagesStore)) {\n      updateMessages();\n    }\n  }, 3000);\n  \n  if (typeof onCleanup === 'function') {\n    onCleanup(() => clearInterval(refreshInterval));\n  }\n}\n\n// =====================================\n// Initialize\n// =====================================\n\ntry {\n  // Get conversation ID if available\n  conversationId = getInputData('conversationId');\n  \n  // Load initial messages\n  messagesStore = loadMessages();\n  renderMessages();\n  \n  // Initialize output\n  if (typeof output !== 'undefined') {\n    output.action = '';\n    output.selectedConversation = conversationId ? { id: conversationId } : null;\n    output.messageCount = messagesStore.length;\n    output.lastMessageTime = messagesStore.length > 0 \n      ? messagesStore[messagesStore.length - 1].timestamp \n      : null;\n  }\n} catch (error) {\n  console.error('Initialization error:', error);\n}", input_variables: [{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}], output_variables: [{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"lastMessageTime","type":"object","source":"custom","description":"Output variable: lastMessageTime"},{"name":"messageCount","type":"object","source":"custom","description":"Output variable: messageCount"},{"name":"'result']","type":"object","source":"custom","description":"Variable: 'result']"},{"name":"'message'","type":"object","source":"custom","description":"Variable: 'message'"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"}], scriptElementOverrides: {"auto-wi2o5n":{"attributes":{"onclick":"if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17702907459371426'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17702907459371426'); } return false;","data-page-link":"page-17702907459371426","data-link-to-page":"Chat History"}},"auto-wi2o5o":{"attributes":{"onclick":"if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17702826114826988'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17702826114826988'); } return false;","data-page-link":"page-17702826114826988","data-link-to-page":"Form Submission"}},"auto-wi2o5p":{"attributes":{"onclick":"if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17702812000504656'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17702812000504656'); } return false;","data-page-link":"page-17702812000504656","data-link-to-page":"Orientation Calls"}},"auto-wi2o5q":{"attributes":{"onclick":"if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17709737292499859'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17709737292499859'); } return false;","data-page-link":"page-17709737292499859","data-link-to-page":"Userdirectory"}},"auto-wi2o5s":{"attributes":{"onclick":"if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17706519722888156'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17706519722888156'); } return false;","data-page-link":"page-17706519722888156","data-link-to-page":"Dashboard"}}} }
  ];
  React.useEffect(() => {
    const element = document.getElementById('component-1770985632248-4126') || document.querySelector('[data-component-id="component-1770985632248-4126"]');
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
      componentId: 'component-1770985632248-4126', 
      eventType: 'onload', 
      scripts: scripts_component_1770985632248_4126_onload, 
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
      <div style={{ width: "100%", border: "none", display: "block", padding: "0.5rem", gridArea: "1 / 1 / 29 / 13", overflow: "hidden", minHeight: "840px", gridRowEnd: 29, paddingTop: "0", gridRowStart: 1, paddingLeft: "0", gridColumnEnd: 13, paddingRight: "0", paddingBottom: "0", backgroundColor: "#fff", gridColumnStart: 1 }} id="component-1770985632248-4126"></div>
    </div>

    </>
  );
}