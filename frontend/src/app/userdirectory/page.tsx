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


export default function Userdirectory() {
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

  const scripts_component_1770973739404_7958_onload = [
    { id: "a6706965-7adf-4a5c-9c7d-4e83ec3e7dc1", name: "Vitalityuserdirectory", order: 0, code: "// ===============================\n// User Directory Table with Vitality Sidebar\n// Input var: userData (Array<Object> from HTTP request)\n// Features: Search, Sort, Pagination, Export CSV, Edit, Delete\n// ===============================\n\nelement.innerHTML = `\n  <style>\n    * {\n      margin: 0;\n      padding: 0;\n      box-sizing: border-box;\n    }\n    \n    .scrollbar::-webkit-scrollbar {\n      width: 6px;\n      height: 6px;\n    }\n    \n    .scrollbar::-webkit-scrollbar-track {\n      background: transparent;\n    }\n    \n    .scrollbar::-webkit-scrollbar-thumb {\n      background: #3a3a3a;\n      border-radius: 3px;\n    }\n    \n    .table-row:hover {\n      background: #2a2a2a !important;\n    }\n  </style>\n\n  <div style=\"display: flex; width: 100%; min-height: 100vh; background: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    \n    <!-- Vitality Sidebar -->\n    <div style=\"\n      width: 240px;\n      min-height: 100vh;\n      background: #1f1f1f;\n      display: flex;\n      flex-direction: column;\n      border-right: 1px solid #2a2a2a;\n      flex-shrink: 0;\n    \">\n      <!-- Logo -->\n      <div style=\"padding: 24px 20px; text-align: center; border-bottom: 1px solid #2a2a2a;\">\n        <div style=\"width: 50px; height: 50px; margin: 0 auto 8px;\">\n          <svg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\">\n            <rect x=\"85\" y=\"30\" width=\"30\" height=\"140\" fill=\"#22c55e\" rx=\"4\"/>\n            <rect x=\"30\" y=\"85\" width=\"140\" height=\"30\" fill=\"#22c55e\" rx=\"4\"/>\n            <path d=\"M 50 60 L 70 60 L 70 80 L 55 80 Q 50 80 50 75 Z\" fill=\"#9333ea\"/>\n            <circle cx=\"45\" cy=\"55\" r=\"8\" fill=\"#9333ea\"/>\n            <path d=\"M 130 60 L 150 60 L 150 75 Q 150 80 145 80 L 130 80 Z\" fill=\"#ef4444\"/>\n            <circle cx=\"155\" cy=\"55\" r=\"8\" fill=\"#ef4444\"/>\n            <path d=\"M 50 120 L 70 120 L 70 140 L 50 140 L 50 125 Q 50 120 55 120 Z\" fill=\"#eab308\"/>\n            <circle cx=\"45\" cy=\"145\" r=\"8\" fill=\"#eab308\"/>\n            <path d=\"M 130 120 L 145 120 Q 150 120 150 125 L 150 140 L 130 140 Z\" fill=\"#3b82f6\"/>\n            <circle cx=\"155\" cy=\"145\" r=\"8\" fill=\"#3b82f6\"/>\n          </svg>\n        </div>\n        <div style=\"font-size: 18px; font-weight: 700; color: #22c55e;\">Vitality</div>\n        <div style=\"font-size: 9px; color: #9333ea; font-weight: 500;\">Research Centre</div>\n      </div>\n      \n      <!-- Menu -->\n      <div style=\"flex: 1; padding: 16px 12px; overflow-y: auto;\">\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 13px;\">\n          <span style=\"font-size: 16px;\"></span>\n          <span>Dashboard</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 13px;\">\n          <span style=\"font-size: 16px;\"></span>\n          <span>Chat-Bot Engagement</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; background: #00c853; color: #000; font-size: 13px; font-weight: 600;\">\n          <span style=\"font-size: 16px;\"></span>\n          <span>User Directory</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 13px;\">\n          <span style=\"font-size: 16px;\"></span>\n          <span>Orientation Calls</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 13px;\">\n          <span style=\"font-size: 16px;\"></span>\n          <span>Form Submissions</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 4px; border-radius: 8px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 13px;\">\n          <span style=\"font-size: 16px;\"></span>\n          <span>Chat History</span>\n        </div>\n      </div>\n      \n      <!-- Footer -->\n      <div style=\"padding: 12px; border-top: 1px solid #2a2a2a; font-size: 9px; color: #555; text-align: center;\">\n        © 2025 Vitality\n      </div>\n    </div>\n\n    <!-- Main Content -->\n    <div style=\"\n      flex: 1;\n      min-height: 100vh;\n      background: #1a1a1a;\n      display: flex;\n      flex-direction: column;\n    \">\n      \n      <!-- Top Bar -->\n      <div style=\"\n        background: #1f1f1f;\n        padding: 16px 24px;\n        border-bottom: 1px solid #2a2a2a;\n        display: flex;\n        align-items: center;\n        justify-content: space-between;\n      \">\n        <div style=\"color: #e5e5e5; font-size: 16px; font-weight: 500;\">Admin Dashboard</div>\n        <div style=\"\n          width: 40px;\n          height: 40px;\n          border-radius: 50%;\n          background: #2a2a2a;\n          display: flex;\n          align-items: center;\n          justify-content: center;\n          cursor: pointer;\n        \">\n          <svg width=\"20\" height=\"20\" fill=\"#e5e5e5\" viewBox=\"0 0 24 24\">\n            <path d=\"M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z\"/>\n          </svg>\n        </div>\n      </div>\n\n      <!-- Page Header -->\n      <div style=\"padding: 24px 24px 16px 24px;\">\n        <h1 style=\"color: #e5e5e5; font-size: 28px; font-weight: 600; margin: 0;\">User Directory</h1>\n      </div>\n\n      <!-- Table Controls -->\n      <div style=\"\n        padding: 0 24px 16px 24px;\n        display: flex;\n        align-items: center;\n        justify-content: space-between;\n        gap: 16px;\n      \">\n        <!-- Search -->\n        <div style=\"flex: 1; max-width: 400px; position: relative;\">\n          <svg style=\"position: absolute; left: 12px; top: 50%; transform: translateY(-50%); width: 18px; height: 18px; opacity: 0.5;\" fill=\"none\" stroke=\"#888\" viewBox=\"0 0 24 24\">\n            <circle cx=\"11\" cy=\"11\" r=\"8\"></circle>\n            <path d=\"m21 21-4.35-4.35\"></path>\n          </svg>\n          <input id=\"searchInput\" placeholder=\"Search by name, company...\" style=\"\n            width: 100%;\n            padding: 10px 12px 10px 40px;\n            background: #2a2a2a;\n            border: 1px solid #3a3a3a;\n            border-radius: 8px;\n            color: #e5e5e5;\n            font-size: 14px;\n            outline: none;\n          \"/>\n        </div>\n\n        <!-- Right Controls -->\n        <div style=\"display: flex; align-items: center; gap: 12px;\">\n          <div style=\"color: #888; font-size: 14px;\">\n            <span id=\"userCount\">0</span> Users\n          </div>\n          <button id=\"exportBtn\" style=\"\n            padding: 10px 16px;\n            background: #00c853;\n            border: 0;\n            border-radius: 8px;\n            color: #000;\n            font-size: 14px;\n            font-weight: 500;\n            cursor: pointer;\n            display: flex;\n            align-items: center;\n            gap: 8px;\n          \">\n            <svg width=\"16\" height=\"16\" fill=\"currentColor\" viewBox=\"0 0 24 24\">\n              <path d=\"M19 12v7H5v-7H3v7c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-7h-2zm-6 .67l2.59-2.58L17 11.5l-5 5-5-5 1.41-1.41L11 12.67V3h2z\"/>\n            </svg>\n            Export CSV\n          </button>\n        </div>\n      </div>\n\n      <!-- Table Container -->\n      <div style=\"\n        flex: 1;\n        margin: 0 24px 24px 24px;\n        background: #1f1f1f;\n        border: 1px solid #2a2a2a;\n        border-radius: 12px;\n        overflow: hidden;\n        display: flex;\n        flex-direction: column;\n      \">\n        <!-- Table -->\n        <div class=\"scrollbar\" style=\"flex: 1; overflow: auto;\">\n          <table id=\"userTable\" style=\"width: 100%; border-collapse: collapse;\">\n            <thead id=\"tableHead\" style=\"background: #252525; position: sticky; top: 0; z-index: 10;\">\n            </thead>\n            <tbody id=\"tableBody\">\n            </tbody>\n          </table>\n        </div>\n\n        <!-- Pagination -->\n        <div style=\"\n          padding: 16px 20px;\n          border-top: 1px solid #2a2a2a;\n          display: flex;\n          align-items: center;\n          justify-content: space-between;\n          background: #1f1f1f;\n        \">\n          <div style=\"color: #888; font-size: 14px;\">\n            Showing <span id=\"showingCount\">0</span> of <span id=\"totalCount\">0</span> Users\n          </div>\n          <div style=\"display: flex; align-items: center; gap: 8px;\">\n            <button id=\"prevBtn\" style=\"\n              padding: 8px 12px;\n              background: #2a2a2a;\n              border: 1px solid #3a3a3a;\n              border-radius: 6px;\n              color: #888;\n              font-size: 14px;\n              cursor: pointer;\n            \">Prev</button>\n            <button class=\"page-btn active\" data-page=\"1\" style=\"\n              padding: 8px 12px;\n              background: #00c853;\n              border: 0;\n              border-radius: 6px;\n              color: #000;\n              font-size: 14px;\n              font-weight: 600;\n              cursor: pointer;\n              min-width: 36px;\n            \">1</button>\n            <button class=\"page-btn\" data-page=\"2\" style=\"\n              padding: 8px 12px;\n              background: #2a2a2a;\n              border: 1px solid #3a3a3a;\n              border-radius: 6px;\n              color: #888;\n              font-size: 14px;\n              cursor: pointer;\n              min-width: 36px;\n            \">2</button>\n            <button id=\"nextBtn\" style=\"\n              padding: 8px 12px;\n              background: #2a2a2a;\n              border: 1px solid #3a3a3a;\n              border-radius: 6px;\n              color: #888;\n              font-size: 14px;\n              cursor: pointer;\n            \">Next</button>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n`;\n\nconst $ = (id) => document.getElementById(id);\n\n// Backend integration\nconst getInputData = () => {\n  const ctxValue = (scriptContext && typeof scriptContext.getData === 'function')\n    ? scriptContext.getData('userData')\n    : undefined;\n  if (ctxValue !== undefined && ctxValue !== null) return ctxValue;\n\n  if (parameters && parameters.userData) return parameters.userData;\n  if (parameters && parameters.httpResult) return parameters.httpResult;\n  if (parameters && parameters.httpResult_raw) return parameters.httpResult_raw;\n\n  if (typeof window !== 'undefined') {\n    const fr = window.flowResults || window.mainChainFlowResults;\n    if (fr) {\n      return fr.userData || fr.httpResult || fr.httpResult_raw ||\n        (fr.apiResponses && (fr.apiResponses.httpResult || fr.apiResponses.httpResult_raw)) ||\n        (fr.variables && (fr.variables.httpResult || fr.variables.httpResult_raw)) ||\n        fr.currentResult;\n    }\n  }\n\n  return [];\n};\n\nconst normalizeUserData = (value) => {\n  if (Array.isArray(value)) return value;\n  if (value && typeof value === 'object') {\n    const keys = ['userData','httpResult','httpResult_raw','data','result','results','items','records','rows','payload','body'];\n    for (const key of keys) {\n      if (Array.isArray(value[key])) return value[key];\n    }\n    const arrayValue = Object.values(value).find((v) => Array.isArray(v));\n    if (arrayValue) return arrayValue;\n  }\n  return [];\n};\n\nconst escapeHtml = (str) => String(str || '')\n  .replaceAll('&', '&amp;')\n  .replaceAll('<', '&lt;')\n  .replaceAll('>', '&gt;')\n  .replaceAll('\"', '&quot;')\n  .replaceAll(\"'\", '&#039;');\n\nconst formatDate = (dateStr) => {\n  if (!dateStr) return '-';\n  try {\n    const date = new Date(dateStr);\n    return date.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' });\n  } catch {\n    return dateStr;\n  }\n};\n\n// State\nlet rawData = normalizeUserData(getInputData());\nlet filteredData = [...rawData];\nlet selectedRows = new Set();\nlet currentPage = 1;\nlet rowsPerPage = 9;\nlet sortColumn = null;\nlet sortDirection = 'asc';\n\nconst columns = [\n  { key: 'select', label: '', width: '40px', sortable: false },\n  { key: 'name', label: 'Contact Name', sortable: true },\n  { key: 'phonenumber', label: 'Phone', sortable: true },\n  { key: 'orientation_call', label: 'Orientation Call', sortable: false },\n  { key: 'created_at', label: 'Created Date', sortable: true },\n  { key: 'actions', label: 'Actions', width: '120px', sortable: false }\n];\n\nconst applySearchFilter = () => {\n  const query = $('searchInput').value.toLowerCase().trim();\n  if (!query) {\n    filteredData = [...rawData];\n  } else {\n    filteredData = rawData.filter((user) => {\n      const nameMatch = user.name && user.name.toLowerCase().includes(query);\n      const phoneMatch = user.phonenumber && user.phonenumber.toLowerCase().includes(query);\n      return nameMatch || phoneMatch;\n    });\n  }\n  currentPage = 1;\n  updateCounts();\n  renderTable();\n};\n\nconst sortData = (column) => {\n  if (sortColumn === column) {\n    sortDirection = sortDirection === 'asc' ? 'desc' : 'asc';\n  } else {\n    sortColumn = column;\n    sortDirection = 'asc';\n  }\n  \n  filteredData.sort((a, b) => {\n    let aVal = a[column] || '';\n    let bVal = b[column] || '';\n    \n    if (column === 'created_at') {\n      aVal = new Date(aVal).getTime() || 0;\n      bVal = new Date(bVal).getTime() || 0;\n    } else {\n      aVal = String(aVal).toLowerCase();\n      bVal = String(bVal).toLowerCase();\n    }\n    \n    if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;\n    if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;\n    return 0;\n  });\n  \n  renderTable();\n};\n\nconst renderTableHeader = () => {\n  const thead = $('tableHead');\n  if (!thead) return;\n  \n  const tr = document.createElement('tr');\n  \n  columns.forEach(col => {\n    const th = document.createElement('th');\n    th.style.cssText = `\n      padding: 12px 16px;\n      text-align: left;\n      font-size: 12px;\n      font-weight: 500;\n      color: #888;\n      white-space: nowrap;\n      ${col.width ? `width: ${col.width};` : ''}\n    `;\n    \n    if (col.key === 'select') {\n      th.innerHTML = `<input type=\"checkbox\" id=\"selectAll\" style=\"cursor: pointer; width: 16px; height: 16px;\"/>`;\n    } else if (col.sortable) {\n      th.innerHTML = `\n        <div style=\"display: flex; align-items: center; gap: 6px; cursor: pointer;\" data-sort=\"${col.key}\">\n          <span>${col.label}</span>\n          <svg width=\"12\" height=\"12\" fill=\"#888\" viewBox=\"0 0 24 24\">\n            <path d=\"M7 10l5 5 5-5z\"/>\n          </svg>\n        </div>\n      `;\n    } else {\n      th.textContent = col.label;\n    }\n    \n    tr.appendChild(th);\n  });\n  \n  thead.innerHTML = '';\n  thead.appendChild(tr);\n  \n  thead.querySelectorAll('[data-sort]').forEach(el => {\n    el.addEventListener('click', () => sortData(el.dataset.sort));\n  });\n  \n  const selectAll = $('selectAll');\n  if (selectAll) {\n    selectAll.addEventListener('change', (e) => {\n      const startIdx = (currentPage - 1) * rowsPerPage;\n      const endIdx = startIdx + rowsPerPage;\n      const pageData = filteredData.slice(startIdx, endIdx);\n      \n      if (e.target.checked) {\n        pageData.forEach(user => selectedRows.add(user.id));\n      } else {\n        pageData.forEach(user => selectedRows.delete(user.id));\n      }\n      renderTableBody();\n    });\n  }\n};\n\nconst renderTableBody = () => {\n  const tbody = $('tableBody');\n  if (!tbody) return;\n  \n  const startIdx = (currentPage - 1) * rowsPerPage;\n  const endIdx = startIdx + rowsPerPage;\n  const pageData = filteredData.slice(startIdx, endIdx);\n  \n  if (pageData.length === 0) {\n    tbody.innerHTML = `\n      <tr>\n        <td colspan=\"${columns.length}\" style=\"padding: 40px; text-align: center; color: #666;\">\n          No users found\n        </td>\n      </tr>\n    `;\n    return;\n  }\n  \n  tbody.innerHTML = pageData.map((user) => {\n    const isSelected = selectedRows.has(user.id);\n    return `\n      <tr class=\"table-row\" style=\"border-bottom: 1px solid #2a2a2a; background: ${isSelected ? '#2a2a2a' : 'transparent'};\">\n        <td style=\"padding: 12px 16px;\">\n          <input type=\"checkbox\" class=\"row-select\" data-id=\"${user.id}\" ${isSelected ? 'checked' : ''} style=\"cursor: pointer; width: 16px; height: 16px;\"/>\n        </td>\n        <td style=\"padding: 12px 16px; color: #e5e5e5; font-size: 14px;\">${escapeHtml(user.name)}</td>\n        <td style=\"padding: 12px 16px; color: #888; font-size: 14px;\">${escapeHtml(user.phonenumber)}</td>\n        <td style=\"padding: 12px 16px; color: #888; font-size: 14px;\">\n          ${user.orientation_call ? escapeHtml(user.orientation_call.substring(0, 30)) + '...' : '-'}\n        </td>\n        <td style=\"padding: 12px 16px; color: #888; font-size: 14px;\">${formatDate(user.created_at)}</td>\n        <td style=\"padding: 12px 16px;\">\n          <div style=\"display: flex; gap: 8px;\">\n            <button class=\"edit-btn\" data-id=\"${user.id}\" style=\"color: #00c853; background: transparent; border: 0; cursor: pointer; font-size: 13px; padding: 4px 8px;\">Edit</button>\n            <span style=\"color: #3a3a3a;\">•</span>\n            <button class=\"delete-btn\" data-id=\"${user.id}\" style=\"color: #ef4444; background: transparent; border: 0; cursor: pointer; font-size: 13px; padding: 4px 8px;\">Delete</button>\n          </div>\n        </td>\n      </tr>\n    `;\n  }).join('');\n  \n  tbody.querySelectorAll('.row-select').forEach(checkbox => {\n    checkbox.addEventListener('change', (e) => {\n      const userId = e.target.dataset.id;\n      if (e.target.checked) {\n        selectedRows.add(userId);\n      } else {\n        selectedRows.delete(userId);\n      }\n      renderTableBody();\n    });\n  });\n  \n  tbody.querySelectorAll('.edit-btn').forEach(btn => {\n    btn.addEventListener('click', () => {\n      const user = rawData.find(u => u.id === btn.dataset.id);\n      alert(`Edit user: ${user.name}`);\n    });\n  });\n  \n  tbody.querySelectorAll('.delete-btn').forEach(btn => {\n    btn.addEventListener('click', () => {\n      const user = rawData.find(u => u.id === btn.dataset.id);\n      if (confirm(`Delete ${user.name}?`)) {\n        rawData = rawData.filter(u => u.id !== btn.dataset.id);\n        filteredData = filteredData.filter(u => u.id !== btn.dataset.id);\n        updateCounts();\n        renderTable();\n      }\n    });\n  });\n};\n\nconst renderTable = () => {\n  renderTableHeader();\n  renderTableBody();\n  renderPagination();\n};\n\nconst renderPagination = () => {\n  const totalPages = Math.ceil(filteredData.length / rowsPerPage);\n  \n  const prevBtn = $('prevBtn');\n  const nextBtn = $('nextBtn');\n  \n  if (prevBtn) {\n    prevBtn.disabled = currentPage === 1;\n    prevBtn.style.opacity = currentPage === 1 ? '0.5' : '1';\n  }\n  \n  if (nextBtn) {\n    nextBtn.disabled = currentPage === totalPages;\n    nextBtn.style.opacity = currentPage === totalPages ? '0.5' : '1';\n  }\n  \n  document.querySelectorAll('.page-btn').forEach(btn => {\n    const page = parseInt(btn.dataset.page);\n    if (page === currentPage) {\n      btn.style.background = '#00c853';\n      btn.style.color = '#000';\n      btn.style.border = '0';\n    } else {\n      btn.style.background = '#2a2a2a';\n      btn.style.color = '#888';\n      btn.style.border = '1px solid #3a3a3a';\n    }\n  });\n};\n\nconst updateCounts = () => {\n  const total = filteredData.length;\n  const startIdx = (currentPage - 1) * rowsPerPage;\n  const showing = Math.min(rowsPerPage, total - startIdx);\n  \n  if ($('userCount')) $('userCount').textContent = total;\n  if ($('totalCount')) $('totalCount').textContent = total;\n  if ($('showingCount')) $('showingCount').textContent = showing;\n};\n\nconst exportCSV = () => {\n  const headers = ['Name', 'Phone', 'Orientation Call', 'Created Date'];\n  const rows = filteredData.map(user => [\n    user.name || '',\n    user.phonenumber || '',\n    user.orientation_call || '',\n    formatDate(user.created_at)\n  ]);\n  \n  const csv = [\n    headers.join(','),\n    ...rows.map(row => row.map(cell => `\"${String(cell).replace(/\"/g, '\"\"')}\"`).join(','))\n  ].join('\\n');\n  \n  const blob = new Blob([csv], { type: 'text/csv' });\n  const link = document.createElement('a');\n  link.href = URL.createObjectURL(blob);\n  link.download = `users_${new Date().toISOString().split('T')[0]}.csv`;\n  link.click();\n};\n\n// Event listeners\nif ($('searchInput')) $('searchInput').addEventListener('input', applySearchFilter);\nif ($('exportBtn')) $('exportBtn').addEventListener('click', exportCSV);\nif ($('prevBtn')) $('prevBtn').addEventListener('click', () => { if (currentPage > 1) { currentPage--; renderTable(); } });\nif ($('nextBtn')) $('nextBtn').addEventListener('click', () => { if (currentPage < Math.ceil(filteredData.length / rowsPerPage)) { currentPage++; renderTable(); } });\n\ndocument.querySelectorAll('.page-btn').forEach(btn => {\n  btn.addEventListener('click', () => {\n    currentPage = parseInt(btn.dataset.page);\n    renderTable();\n  });\n});\n\n// Context changes\nif (typeof window !== 'undefined') {\n  const handler = () => {\n    const newData = normalizeUserData(getInputData());\n    if (newData && newData.length > 0) {\n      rawData = newData;\n      applySearchFilter();\n    }\n  };\n  window.addEventListener('__scriptContextChange', handler);\n  if (typeof onCleanup === 'function') {\n    onCleanup(() => window.removeEventListener('__scriptContextChange', handler));\n  }\n}\n\n// Initialize\ntry {\n  updateCounts();\n  renderTable();\n  if (typeof output !== 'undefined') {\n    output.action = '';\n    output.selectedRows = [];\n  }\n} catch (error) {\n  console.error('Init error:', error);\n}", input_variables: [{ "name": "userData", "type": "array<object> from http request", "source": "custom", "description": "Input variable: userData" }], output_variables: [{ "name": "selectedRows", "type": "object", "source": "custom", "description": "array of selected user IDs" }, { "name": "action", "type": "object", "source": "custom", "description": "\"edit\" | \"delete\" | \"export\" | \"select\"" }], scriptElementOverrides: { "auto-wi2o5n": { "attributes": { "onclick": "if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17702907459371426'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17702907459371426'); } return false;", "data-page-link": "page-17702907459371426", "data-link-to-page": "Chat History" } }, "auto-wi2o5o": { "attributes": { "onclick": "if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17702826114826988'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17702826114826988'); } return false;", "data-page-link": "page-17702826114826988", "data-link-to-page": "Form Submission" } }, "auto-wi2o5p": { "attributes": { "onclick": "if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17702812000504656'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17702812000504656'); } return false;", "data-page-link": "page-17702812000504656", "data-link-to-page": "Orientation Calls" } }, "auto-wi2o5r": { "attributes": { "onclick": "if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-1770985628551516'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-1770985628551516'); } return false;", "data-page-link": "page-1770985628551516", "data-link-to-page": "chatbot" } }, "auto-wi2o5s": { "attributes": { "onclick": "if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17706519722888156'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17706519722888156'); } return false;", "data-page-link": "page-17706519722888156", "data-link-to-page": "Dashboard" } } } }
  ];
  React.useEffect(() => {
    const element = document.getElementById('component-1770973739404-7958') || document.querySelector('[data-component-id="component-1770973739404-7958"]');
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
        const inputVarNames = ["userData"];
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
        const inputVarNames = ["userData"];
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
      componentId: 'component-1770973739404-7958',
      eventType: 'onload',
      scripts: scripts_component_1770973739404_7958_onload,
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
        <div style={{ width: "100%", border: "none", display: "block", padding: "0.5rem", gridArea: "1 / 1 / 25 / 13", overflow: "hidden", minHeight: "720px", gridRowEnd: 25, paddingTop: "0", gridRowStart: 1, paddingLeft: "0", gridColumnEnd: 13, paddingRight: "0", paddingBottom: "0", backgroundColor: "#fff", gridColumnStart: 1 }} id="component-1770973739404-7958"></div>
      </div>

    </>
  );
}