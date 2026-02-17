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


export default function OrientationCalls() {
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

  const scripts_component_1771002248957_6083_onload = [
    { id: "ef7e1ec7-0f59-42b2-abbb-6e2ea412a884", name: "Orientationcall", order: 0, code: "// ===============================\n// Orientation Calls - Dashboard Display\n// Displays scheduled orientation calls in card grid layout\n// \n// INPUT VARIABLES (from HTTP request or workflow):\n//   - callsData: Array of orientation call objects\n//     OR\n//   - httpResponse: HTTP response containing calls data\n//     OR  \n//   - calls: Direct array of calls\n//\n// Expected JSON format:\n// {\n//   \"calls\": [\n//     {\n//       \"id\": \"call-001\",\n//       \"name\": \"Nancy Robinson Camley\",\n//       \"phone\": \"+91 9868543210\",\n//       \"date\": \"2025-10-25\",\n//       \"time\": \"11:00 AM - 11:30 AM\",\n//       \"status\": \"scheduled\"\n//     }\n//   ]\n// }\n//\n// OUTPUT VARIABLES:\n//   - output.selectedCall: Selected call object\n//   - output.action: \"select\" | \"refresh\"\n//   - output.callCount: Total number of calls\n// ===============================\n\nelement.innerHTML = `\n  <style>\n    * {\n      margin: 0;\n      padding: 0;\n      box-sizing: border-box;\n    }\n    \n    .scrollbar::-webkit-scrollbar {\n      width: 6px;\n    }\n    \n    .scrollbar::-webkit-scrollbar-track {\n      background: transparent;\n    }\n    \n    .scrollbar::-webkit-scrollbar-thumb {\n      background: #3a3a3a;\n      border-radius: 3px;\n    }\n    \n    .scrollbar::-webkit-scrollbar-thumb:hover {\n      background: #4a4a4a;\n    }\n    \n    .call-card {\n      animation: fadeIn 0.3s ease-out;\n      transition: transform 0.2s, box-shadow 0.2s;\n    }\n    \n    .call-card:hover {\n      transform: translateY(-4px);\n      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);\n    }\n    \n    @keyframes fadeIn {\n      from {\n        opacity: 0;\n        transform: translateY(10px);\n      }\n      to {\n        opacity: 1;\n        transform: translateY(0);\n      }\n    }\n  </style>\n\n  <div style=\"display: flex; width: 100%; min-height: 100vh; background: #0a0a0a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    \n    <!-- Vitality Sidebar -->\n    <div style=\"\n      width: 240px;\n      min-height: 100vh;\n      background: #1a1a1a;\n      display: flex;\n      flex-direction: column;\n      border-right: 1px solid #2a2a2a;\n      flex-shrink: 0;\n    \">\n      <!-- Logo -->\n      <div style=\"padding: 24px 20px; text-align: center; border-bottom: 1px solid #2a2a2a;\">\n        <div style=\"width: 50px; height: 50px; margin: 0 auto 8px;\">\n          <svg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\">\n            <rect x=\"85\" y=\"30\" width=\"30\" height=\"140\" fill=\"#22c55e\" rx=\"4\"/>\n            <rect x=\"30\" y=\"85\" width=\"140\" height=\"30\" fill=\"#22c55e\" rx=\"4\"/>\n            <path d=\"M 50 60 L 70 60 L 70 80 L 55 80 Q 50 80 50 75 Z\" fill=\"#9333ea\"/>\n            <circle cx=\"45\" cy=\"55\" r=\"8\" fill=\"#9333ea\"/>\n            <path d=\"M 130 60 L 150 60 L 150 75 Q 150 80 145 80 L 130 80 Z\" fill=\"#ef4444\"/>\n            <circle cx=\"155\" cy=\"55\" r=\"8\" fill=\"#ef4444\"/>\n            <path d=\"M 50 120 L 70 120 L 70 140 L 50 140 L 50 125 Q 50 120 55 120 Z\" fill=\"#eab308\"/>\n            <circle cx=\"45\" cy=\"145\" r=\"8\" fill=\"#eab308\"/>\n            <path d=\"M 130 120 L 145 120 Q 150 120 150 125 L 150 140 L 130 140 Z\" fill=\"#3b82f6\"/>\n            <circle cx=\"155\" cy=\"145\" r=\"8\" fill=\"#3b82f6\"/>\n          </svg>\n        </div>\n        <div style=\"font-size: 18px; font-weight: 700; color: #22c55e;\">Vitality</div>\n        <div style=\"font-size: 9px; color: #9333ea; font-weight: 500;\">Research Centre</div>\n      </div>\n      \n      <!-- Menu -->\n      <div style=\"flex: 1; padding: 16px 12px; overflow-y: auto;\">\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 13px;\">\n          <span style=\"font-size: 16px;\"></span>\n          <span>Dashboard</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 13px;\">\n          <span style=\"font-size: 16px;\"></span>\n          <span>Chat-Bot Engagement</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 13px;\">\n          <span style=\"font-size: 16px;\"></span>\n          <span>User Directory</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; background: #22c55e; color: #000; font-size: 13px; font-weight: 600;\">\n          <span style=\"font-size: 16px;\"></span>\n          <span>Orientation Calls</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 13px;\">\n          <span style=\"font-size: 16px;\"></span>\n          <span>Form Submissions</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 13px;\">\n          <span style=\"font-size: 16px;\"></span>\n          <span>Chat History</span>\n        </div>\n      </div>\n      \n      <!-- Copyright -->\n      <div style=\"padding: 12px; border-top: 1px solid #2a2a2a; font-size: 9px; color: #555; text-align: center;\">\n        © 2025 Vitality\n      </div>\n    </div>\n\n    <!-- Main Content -->\n    <div style=\"\n      flex: 1;\n      min-height: 100vh;\n      background: #0a0a0a;\n      display: flex;\n      flex-direction: column;\n    \">\n      \n      <!-- Top Bar -->\n      <div style=\"\n        background: transparent;\n        padding: 24px 40px;\n        display: flex;\n        align-items: center;\n        justify-content: space-between;\n      \">\n        <div>\n          <div style=\"color: #e5e5e5; font-size: 20px; font-weight: 500;\">Admin Dashboard</div>\n        </div>\n        <div style=\"\n          width: 40px;\n          height: 40px;\n          border-radius: 50%;\n          background: #1a1a1a;\n          display: flex;\n          align-items: center;\n          justify-content: center;\n          cursor: pointer;\n        \">\n          <svg width=\"20\" height=\"20\" fill=\"#e5e5e5\" viewBox=\"0 0 24 24\">\n            <path d=\"M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z\"/>\n          </svg>\n        </div>\n      </div>\n\n      <!-- Page Title -->\n      <div style=\"padding: 0 40px 24px 40px;\">\n        <h1 style=\"color: #e5e5e5; font-size: 28px; font-weight: 500; margin: 0;\">Orientation Calls</h1>\n      </div>\n\n      <!-- Calls Grid -->\n      <div class=\"scrollbar\" style=\"\n        flex: 1;\n        overflow-y: auto;\n        padding: 0 40px 40px 40px;\n      \">\n        <div id=\"callsGrid\" style=\"\n          display: grid;\n          grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));\n          gap: 20px;\n        \">\n          <!-- Call cards will be rendered here -->\n        </div>\n\n        <!-- Empty State -->\n        <div id=\"emptyState\" style=\"\n          display: none;\n          text-align: center;\n          padding: 80px 20px;\n        \">\n          <div style=\"\n            width: 80px;\n            height: 80px;\n            margin: 0 auto 20px;\n            background: #1a1a1a;\n            border-radius: 50%;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n          \">\n            <svg width=\"40\" height=\"40\" fill=\"#555\" viewBox=\"0 0 24 24\">\n              <path d=\"M20 15.5c-1.25 0-2.45-.2-3.57-.57-.1-.03-.21-.05-.31-.05-.26 0-.51.1-.71.29l-2.2 2.2c-2.83-1.44-5.15-3.75-6.59-6.58l2.2-2.21c.28-.26.36-.65.25-1C8.7 6.45 8.5 5.25 8.5 4c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1 0 9.39 7.61 17 17 17 .55 0 1-.45 1-1v-3.5c0-.55-.45-1-1-1z\"/>\n            </svg>\n          </div>\n          <div style=\"color: #888; font-size: 16px;\">No orientation calls scheduled</div>\n        </div>\n      </div>\n    </div>\n  </div>\n`;\n\n// =====================================\n// Utility Functions\n// =====================================\n\nconst $ = (id) => document.getElementById(id);\n\n// Get input data from various sources\nconst getInputData = (key) => {\n  // Try scriptContext first\n  if (scriptContext && typeof scriptContext.getData === 'function') {\n    const value = scriptContext.getData(key);\n    if (value !== undefined && value !== null) {\n      return value;\n    }\n  }\n\n  // Try parameters\n  if (parameters && parameters[key] !== undefined) {\n    return parameters[key];\n  }\n\n  return null;\n};\n\n// Parse calls data from various formats\nconst parseCallsData = (data) => {\n  if (!data) return [];\n  \n  // If it's already an array\n  if (Array.isArray(data)) {\n    return data;\n  }\n  \n  // If it's a string, try to parse JSON\n  if (typeof data === 'string') {\n    try {\n      const parsed = JSON.parse(data);\n      return parseCallsData(parsed);\n    } catch (e) {\n      console.error('Failed to parse JSON:', e);\n      return [];\n    }\n  }\n  \n  // If it's an object, look for common array properties\n  if (typeof data === 'object') {\n    const arrayKeys = ['calls', 'data', 'items', 'records', 'results', 'appointments'];\n    for (const key of arrayKeys) {\n      if (Array.isArray(data[key])) {\n        return data[key];\n      }\n    }\n    \n    // If the object itself looks like a call, wrap it in array\n    if (data.name || data.phone || data.date) {\n      return [data];\n    }\n  }\n  \n  return [];\n};\n\n// HTML escape\nconst escapeHtml = (str) => String(str || '')\n  .replaceAll('&', '&amp;')\n  .replaceAll('<', '&lt;')\n  .replaceAll('>', '&gt;')\n  .replaceAll('\"', '&quot;')\n  .replaceAll(\"'\", '&#039;');\n\n// Format date\nconst formatDate = (dateStr) => {\n  if (!dateStr) return '';\n  try {\n    const date = new Date(dateStr);\n    return date.toLocaleDateString('en-US', { \n      year: 'numeric', \n      month: '2-digit', \n      day: '2-digit' \n    }).replace(/\\//g, '-');\n  } catch {\n    return dateStr;\n  }\n};\n\n// Get initials from name\nconst getInitials = (name) => {\n  if (!name) return 'U';\n  const parts = name.trim().split(' ');\n  if (parts.length >= 2) {\n    return (parts[0][0] + parts[1][0]).toUpperCase();\n  }\n  return name.substring(0, 1).toUpperCase();\n};\n\n// =====================================\n// Data Loading\n// =====================================\n\nlet callsData = [];\n\nconst loadCallsData = () => {\n  // Try multiple input sources\n  const sources = [\n    getInputData('callsData'),\n    getInputData('httpResponse'),\n    getInputData('calls'),\n    getInputData('data'),\n    getInputData('orientationCalls'),\n    getInputData('response')\n  ];\n  \n  for (const source of sources) {\n    if (source) {\n      const parsed = parseCallsData(source);\n      if (parsed.length > 0) {\n        return parsed;\n      }\n    }\n  }\n  \n  return [];\n};\n\n// =====================================\n// Rendering\n// =====================================\n\nconst renderCalls = () => {\n  const callsGrid = $('callsGrid');\n  const emptyState = $('emptyState');\n  \n  if (!callsGrid || !emptyState) return;\n  \n  if (callsData.length === 0) {\n    callsGrid.style.display = 'none';\n    emptyState.style.display = 'block';\n    return;\n  }\n  \n  callsGrid.style.display = 'grid';\n  emptyState.style.display = 'none';\n  \n  callsGrid.innerHTML = callsData.map((call, index) => {\n    const name = call.name || call.customerName || call.userName || 'Unknown';\n    const phone = call.phone || call.phoneNumber || call.contact || '';\n    const date = formatDate(call.date || call.callDate || call.appointmentDate || '');\n    const time = call.time || call.callTime || call.timeSlot || '';\n    const status = call.status || 'scheduled';\n    const initials = getInitials(name);\n    \n    return `\n      <div \n        class=\"call-card\" \n        data-call-id=\"${call.id || index}\"\n        style=\"\n          background: #1a1a1a;\n          border-radius: 12px;\n          padding: 20px;\n          cursor: pointer;\n          border: 1px solid #2a2a2a;\n        \"\n      >\n        <!-- Header -->\n        <div style=\"\n          display: flex;\n          align-items: center;\n          gap: 12px;\n          margin-bottom: 16px;\n        \">\n          <div style=\"font-size: 11px; color: #888; text-transform: uppercase; letter-spacing: 0.5px;\">\n            Orientation Calls\n          </div>\n        </div>\n        \n        <!-- Date & Time -->\n        <div style=\"\n          display: flex;\n          align-items: center;\n          gap: 16px;\n          margin-bottom: 20px;\n        \">\n          <div style=\"display: flex; align-items: center; gap: 6px;\">\n            <svg width=\"14\" height=\"14\" fill=\"#888\" viewBox=\"0 0 24 24\">\n              <path d=\"M19 3h-1V1h-2v2H8V1H6v2H5c-1.11 0-1.99.9-1.99 2L3 19c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 16H5V8h14v11z\"/>\n            </svg>\n            <span style=\"color: #e5e5e5; font-size: 13px;\">${escapeHtml(date)}</span>\n          </div>\n          <div style=\"display: flex; align-items: center; gap: 6px;\">\n            <svg width=\"14\" height=\"14\" fill=\"#888\" viewBox=\"0 0 24 24\">\n              <path d=\"M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8z\"/>\n              <path d=\"M12.5 7H11v6l5.25 3.15.75-1.23-4.5-2.67z\"/>\n            </svg>\n            <span style=\"color: #e5e5e5; font-size: 13px;\">${escapeHtml(time)}</span>\n          </div>\n        </div>\n        \n        <!-- User Info -->\n        <div style=\"\n          display: flex;\n          align-items: center;\n          gap: 12px;\n        \">\n          <!-- Avatar -->\n          <div style=\"\n            width: 48px;\n            height: 48px;\n            border-radius: 50%;\n            background: #22c55e;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            color: #000;\n            font-weight: 700;\n            font-size: 18px;\n            flex-shrink: 0;\n          \">${initials}</div>\n          \n          <!-- Details -->\n          <div style=\"flex: 1; min-width: 0;\">\n            <div style=\"\n              color: #e5e5e5;\n              font-size: 15px;\n              font-weight: 500;\n              margin-bottom: 4px;\n              white-space: nowrap;\n              overflow: hidden;\n              text-overflow: ellipsis;\n            \">${escapeHtml(name)}</div>\n            <div style=\"\n              color: #888;\n              font-size: 13px;\n              white-space: nowrap;\n              overflow: hidden;\n              text-overflow: ellipsis;\n            \">${escapeHtml(phone)}</div>\n          </div>\n        </div>\n      </div>\n    `;\n  }).join('');\n  \n  // Add click handlers\n  const cards = callsGrid.querySelectorAll('.call-card');\n  cards.forEach((card, index) => {\n    card.addEventListener('click', () => {\n      handleCallSelect(callsData[index]);\n    });\n  });\n};\n\n// =====================================\n// Event Handlers\n// =====================================\n\nconst handleCallSelect = (call) => {\n  console.log('Call selected:', call);\n  \n  if (typeof output !== 'undefined') {\n    output.selectedCall = call;\n    output.action = 'select';\n  }\n  \n  // Highlight selected card\n  const cards = document.querySelectorAll('.call-card');\n  cards.forEach(card => {\n    if (card.getAttribute('data-call-id') === String(call.id || callsData.indexOf(call))) {\n      card.style.borderColor = '#22c55e';\n      card.style.background = '#1f2a1f';\n    } else {\n      card.style.borderColor = '#2a2a2a';\n      card.style.background = '#1a1a1a';\n    }\n  });\n};\n\n// Handle context changes\nif (typeof window !== 'undefined') {\n  const handler = (evt) => {\n    const detail = evt && evt.detail ? evt.detail : {};\n    \n    // Reload data on relevant key changes\n    const relevantKeys = [\n      'callsData',\n      'httpResponse',\n      'calls',\n      'data',\n      'orientationCalls',\n      'response'\n    ];\n    \n    if (!detail.key || relevantKeys.includes(detail.key)) {\n      const newData = loadCallsData();\n      if (JSON.stringify(newData) !== JSON.stringify(callsData)) {\n        callsData = newData;\n        renderCalls();\n        \n        if (typeof output !== 'undefined') {\n          output.action = 'refresh';\n          output.callCount = callsData.length;\n        }\n      }\n    }\n  };\n\n  window.addEventListener('__scriptContextChange', handler);\n\n  if (typeof onCleanup === 'function') {\n    onCleanup(() => window.removeEventListener('__scriptContextChange', handler));\n  }\n}\n\n// =====================================\n// Initialize\n// =====================================\n\ntry {\n  callsData = loadCallsData();\n  renderCalls();\n  \n  if (typeof output !== 'undefined') {\n    output.action = '';\n    output.selectedCall = null;\n    output.callCount = callsData.length;\n  }\n} catch (error) {\n  console.error('Initialization error:', error);\n}", input_variables: [{"name":"innerHTML","type":"string","source":"element","description":"Element property: innerHTML"}], output_variables: [{"name":"selectedCall","type":"object","source":"custom","description":"Output variable: selectedCall"},{"name":"action","type":"object","source":"custom","description":"Output variable: action"},{"name":"callCount","type":"object","source":"custom","description":"Output variable: callCount"},{"name":"getInputData('response')","type":"object","source":"custom","description":"Variable: getInputData('response')"},{"name":"status","type":"object","source":"custom","description":"Variable: status"},{"name":"'response'","type":"object","source":"custom","description":"Variable: 'response'"}], scriptElementOverrides: {"auto-egzq9s":{"attributes":{"onclick":"if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17706519722888156'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17706519722888156'); } return false;","data-page-link":"page-17706519722888156","data-link-to-page":"Dashboard"}},"auto-wi2o5n":{"attributes":{"onclick":"if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17702907459371426'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17702907459371426'); } return false;","data-page-link":"page-17702907459371426","data-link-to-page":"Chat History"}},"auto-wi2o5o":{"attributes":{"onclick":"if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17702826114826988'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17702826114826988'); } return false;","data-page-link":"page-17702826114826988","data-link-to-page":"Form Submission"}},"auto-wi2o5q":{"attributes":{"onclick":"if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17709737292499859'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17709737292499859'); } return false;","data-page-link":"page-17709737292499859","data-link-to-page":"Userdirectory"}},"auto-wi2o5r":{"attributes":{"onclick":"if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-1770985628551516'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-1770985628551516'); } return false;","data-page-link":"page-1770985628551516","data-link-to-page":"chatbot"}},"auto-wi2o5s":{"attributes":{"onclick":"if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17706519722888156'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17706519722888156'); } return false;","data-page-link":"page-17706519722888156","data-link-to-page":"Dashboard"}}} }
  ];
  React.useEffect(() => {
    const element = document.getElementById('component-1771002248957-6083') || document.querySelector('[data-component-id="component-1771002248957-6083"]');
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
      componentId: 'component-1771002248957-6083', 
      eventType: 'onload', 
      scripts: scripts_component_1771002248957_6083_onload, 
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
      <div style={{ width: "100%", border: "none", display: "block", padding: "0.5rem", gridArea: "1 / 1 / 28 / 13", overflow: "hidden", minHeight: "810px", gridRowEnd: 28, paddingTop: "0", gridRowStart: 1, paddingLeft: "0", gridColumnEnd: 13, paddingRight: "0", paddingBottom: "0", backgroundColor: "#fff", gridColumnStart: 1 }} id="component-1771002248957-6083"></div>
    </div>

    </>
  );
}