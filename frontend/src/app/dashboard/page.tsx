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


export default function Dashboard() {
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

  const scripts_component_1771007210712_8027_onload = [
    { id: "e4c81360-59ca-4d22-9dee-d9d62f7f95e4", name: "dashboardout", order: 0, code: "// ===============================\n// Dashboard with KPIs, Funnel, and Charts - FIXED\n// Input var: dashboardData (Object from HTTP request)\n// ===============================\n\nelement.innerHTML = `\n  <style>\n    * {\n      margin: 0;\n      padding: 0;\n      box-sizing: border-box;\n    }\n    \n    .scrollbar::-webkit-scrollbar {\n      width: 6px;\n    }\n    \n    .scrollbar::-webkit-scrollbar-track {\n      background: transparent;\n    }\n    \n    .scrollbar::-webkit-scrollbar-thumb {\n      background: #3a3a3a;\n      border-radius: 3px;\n    }\n    \n    .kpi-card {\n      transition: transform 0.2s ease;\n    }\n    \n    .kpi-card:hover {\n      transform: translateY(-4px);\n    }\n  </style>\n\n  <div style=\"display: flex; width: 100%; min-height: 100vh; background: #1a1a1a; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;\">\n    \n    <!-- Vitality Sidebar -->\n    <div style=\"\n      width: 280px;\n      min-height: 100vh;\n      background: #1f1f1f;\n      display: flex;\n      flex-direction: column;\n      border-right: 1px solid #2a2a2a;\n      flex-shrink: 0;\n    \">\n      <!-- Logo -->\n      <div style=\"padding: 24px 20px; text-align: center; border-bottom: 1px solid #2a2a2a;\">\n        <div style=\"width: 50px; height: 50px; margin: 0 auto 8px;\">\n          <svg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\">\n            <rect x=\"85\" y=\"30\" width=\"30\" height=\"140\" fill=\"#22c55e\" rx=\"4\"/>\n            <rect x=\"30\" y=\"85\" width=\"140\" height=\"30\" fill=\"#22c55e\" rx=\"4\"/>\n            <path d=\"M 50 60 L 70 60 L 70 80 L 55 80 Q 50 80 50 75 Z\" fill=\"#9333ea\"/>\n            <circle cx=\"45\" cy=\"55\" r=\"8\" fill=\"#9333ea\"/>\n            <path d=\"M 130 60 L 150 60 L 150 75 Q 150 80 145 80 L 130 80 Z\" fill=\"#ef4444\"/>\n            <circle cx=\"155\" cy=\"55\" r=\"8\" fill=\"#ef4444\"/>\n            <path d=\"M 50 120 L 70 120 L 70 140 L 50 140 L 50 125 Q 50 120 55 120 Z\" fill=\"#eab308\"/>\n            <circle cx=\"45\" cy=\"145\" r=\"8\" fill=\"#eab308\"/>\n            <path d=\"M 130 120 L 145 120 Q 150 120 150 125 L 150 140 L 130 140 Z\" fill=\"#3b82f6\"/>\n            <circle cx=\"155\" cy=\"145\" r=\"8\" fill=\"#3b82f6\"/>\n          </svg>\n        </div>\n        <div style=\"font-size: 18px; font-weight: 700; color: #22c55e;\">Vitality</div>\n        <div style=\"font-size: 9px; color: #9333ea; font-weight: 500;\">Research Centre</div>\n      </div>\n      \n      <!-- Menu -->\n      <div style=\"flex: 1; padding: 16px 12px; overflow-y: auto;\">\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin-bottom: 6px; border-radius: 10px; cursor: pointer; background: #00c853; color: #000; font-size: 14px; font-weight: 600;\">\n          <span>Dashboard</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin-bottom: 6px; border-radius: 10px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 14px;\">\n          <span>Chat-Bot Engagement</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin-bottom: 6px; border-radius: 10px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 14px;\">\n          <span>User Directory</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin-bottom: 6px; border-radius: 10px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 14px;\">\n          <span>Orientation Calls</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin-bottom: 6px; border-radius: 10px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 14px;\">\n          <span>Form Submissions</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin-bottom: 6px; border-radius: 10px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 14px;\">\n          <span>Chat History</span>\n        </div>\n      </div>\n      \n      <!-- Footer -->\n      <div style=\"padding: 12px; border-top: 1px solid #2a2a2a; font-size: 9px; color: #555; text-align: center;\">\n        &copy; 2025 Vitality\n      </div>\n    </div>\n\n    <!-- Main Content -->\n    <div style=\"\n      flex: 1;\n      min-height: 100vh;\n      background: #1a1a1a;\n      display: flex;\n      flex-direction: column;\n    \">\n      \n      <!-- Top Bar -->\n      <div style=\"\n        background: #1f1f1f;\n        padding: 16px 24px;\n        border-bottom: 1px solid #2a2a2a;\n        display: flex;\n        align-items: center;\n        justify-content: space-between;\n      \">\n        <div style=\"color: #e5e5e5; font-size: 16px; font-weight: 500;\">Admin Dashboard</div>\n        <div style=\"\n          width: 40px;\n          height: 40px;\n          border-radius: 50%;\n          background: #2a2a2a;\n          display: flex;\n          align-items: center;\n          justify-content: center;\n          cursor: pointer;\n        \">\n          <svg width=\"20\" height=\"20\" fill=\"#e5e5e5\" viewBox=\"0 0 24 24\">\n            <path d=\"M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z\"/>\n          </svg>\n        </div>\n      </div>\n\n      <!-- Dashboard Content -->\n      <div class=\"scrollbar\" style=\"flex: 1; overflow-y: auto; padding: 32px 28px;\">\n        \n        <!-- Header -->\n        <div style=\"margin-bottom: 28px;\">\n          <h1 style=\"color: #e5e5e5; font-size: 32px; font-weight: 600; margin-bottom: 8px;\">Dashboard</h1>\n          <p style=\"color: #888; font-size: 15px;\">Monitor performance metrics</p>\n        </div>\n\n        <!-- KPI Cards -->\n        <div style=\"\n          display: grid;\n          grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));\n          gap: 20px;\n          margin-bottom: 28px;\n        \">\n          <!-- Total Active Users -->\n          <div class=\"kpi-card\" style=\"\n            background: #2a2a2a;\n            border: 1px solid #3a3a3a;\n            border-radius: 14px;\n            padding: 24px;\n          \">\n            <div style=\"display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;\">\n              <div style=\"color: #aaa; font-size: 14px; font-weight: 500;\">Total Active Users</div>\n              <div style=\"\n                width: 36px;\n                height: 36px;\n                border-radius: 8px;\n                background: rgba(0, 200, 83, 0.15);\n                display: flex;\n                align-items: center;\n                justify-content: center;\n              \">\n                <svg width=\"20\" height=\"20\" fill=\"#00c853\" viewBox=\"0 0 24 24\">\n                  <path d=\"M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z\"/>\n                </svg>\n              </div>\n            </div>\n            <div id=\"totalUsers\" style=\"color: #fff; font-size: 36px; font-weight: 700; margin-bottom: 8px;\">1,248</div>\n            <div id=\"usersGrowth\" style=\"color: #00c853; font-size: 13px; font-weight: 500;\">+12.3% this month</div>\n          </div>\n\n          <!-- Orientation Calls Booked -->\n          <div class=\"kpi-card\" style=\"\n            background: #2a2a2a;\n            border: 1px solid #3a3a3a;\n            border-radius: 14px;\n            padding: 24px;\n          \">\n            <div style=\"display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;\">\n              <div style=\"color: #aaa; font-size: 14px; font-weight: 500;\">Orientation Calls Booked</div>\n              <div style=\"\n                width: 36px;\n                height: 36px;\n                border-radius: 8px;\n                background: rgba(0, 200, 83, 0.15);\n                display: flex;\n                align-items: center;\n                justify-content: center;\n              \">\n                <svg width=\"20\" height=\"20\" fill=\"#00c853\" viewBox=\"0 0 24 24\">\n                  <path d=\"M13 10h5l-6 6-6-6h5V3h2v7zm-9 9h16v-7h2v8c0 .55-.45 1-1 1H3c-.55 0-1-.45-1-1v-8h2v7z\"/>\n                </svg>\n              </div>\n            </div>\n            <div id=\"orientationBooked\" style=\"color: #fff; font-size: 36px; font-weight: 700; margin-bottom: 8px;\">116</div>\n            <div id=\"orientationGrowth\" style=\"color: #00c853; font-size: 13px; font-weight: 500;\">+8% this month</div>\n          </div>\n\n          <!-- Call Attendance Rate -->\n          <div class=\"kpi-card\" style=\"\n            background: #2a2a2a;\n            border: 1px solid #3a3a3a;\n            border-radius: 14px;\n            padding: 24px;\n          \">\n            <div style=\"display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 16px;\">\n              <div style=\"color: #aaa; font-size: 14px; font-weight: 500;\">Call Attendance Rate</div>\n              <div style=\"\n                width: 36px;\n                height: 36px;\n                border-radius: 8px;\n                background: rgba(0, 200, 83, 0.15);\n                display: flex;\n                align-items: center;\n                justify-content: center;\n              \">\n                <svg width=\"20\" height=\"20\" fill=\"#00c853\" viewBox=\"0 0 24 24\">\n                  <path d=\"M16 11c1.66 0 2.99-1.34 2.99-3S17.66 5 16 5c-1.66 0-3 1.34-3 3s1.34 3 3 3zm-8 0c1.66 0 2.99-1.34 2.99-3S9.66 5 8 5C6.34 5 5 6.34 5 8s1.34 3 3 3zm0 2c-2.33 0-7 1.17-7 3.5V19h14v-2.5c0-2.33-4.67-3.5-7-3.5zm8 0c-.29 0-.62.02-.97.05 1.16.84 1.97 1.97 1.97 3.45V19h6v-2.5c0-2.33-4.67-3.5-7-3.5z\"/>\n                </svg>\n              </div>\n            </div>\n            <div id=\"attendanceRate\" style=\"color: #fff; font-size: 36px; font-weight: 700; margin-bottom: 8px;\">74%</div>\n            <div id=\"attendanceGrowth\" style=\"color: #00c853; font-size: 13px; font-weight: 500;\">+23% this month</div>\n          </div>\n        </div>\n\n        <!-- Charts Row -->\n        <div style=\"\n          display: grid;\n          grid-template-columns: 1fr 1.3fr;\n          gap: 20px;\n        \">\n          <!-- Funnel Analysis -->\n          <div style=\"\n            background: #2a2a2a;\n            border: 1px solid #3a3a3a;\n            border-radius: 14px;\n            padding: 28px;\n          \">\n            <h3 style=\"color: #e5e5e5; font-size: 18px; font-weight: 600; margin-bottom: 28px;\">Funnel Analysis</h3>\n            \n            <!-- All Users -->\n            <div style=\"\n              background: linear-gradient(90deg, #a0d911 0%, #a0d911dd 100%);\n              border-radius: 50px;\n              padding: 16px 28px;\n              width: 100%;\n              margin: 0 auto 16px auto;\n              display: flex;\n              justify-content: space-between;\n              align-items: center;\n              min-height: 56px;\n            \">\n              <div style=\"display: flex; align-items: center; gap: 10px;\">\n                <svg width=\"18\" height=\"18\" fill=\"#fff\" viewBox=\"0 0 24 24\">\n                  <path d=\"M10 17l5-5-5-5v10z\"/>\n                </svg>\n                <span style=\"color: #fff; font-weight: 600; font-size: 15px;\">All Users</span>\n              </div>\n              <div id=\"funnelAllUsers\" style=\"\n                background: rgba(255, 255, 255, 0.25);\n                padding: 6px 14px;\n                border-radius: 20px;\n                color: #fff;\n                font-weight: 600;\n                font-size: 14px;\n              \">00</div>\n            </div>\n\n            <!-- Orientation -->\n            <div style=\"\n              background: linear-gradient(90deg, #52c41a 0%, #52c41add 100%);\n              border-radius: 50px;\n              padding: 16px 28px;\n              width: 85%;\n              margin: 0 auto 16px auto;\n              display: flex;\n              justify-content: space-between;\n              align-items: center;\n              min-height: 56px;\n            \">\n              <div style=\"display: flex; align-items: center; gap: 10px;\">\n                <svg width=\"18\" height=\"18\" fill=\"#fff\" viewBox=\"0 0 24 24\">\n                  <path d=\"M10 17l5-5-5-5v10z\"/>\n                </svg>\n                <span style=\"color: #fff; font-weight: 600; font-size: 15px;\">Orientation</span>\n              </div>\n              <div id=\"funnelOrientation\" style=\"\n                background: rgba(255, 255, 255, 0.25);\n                padding: 6px 14px;\n                border-radius: 20px;\n                color: #fff;\n                font-weight: 600;\n                font-size: 14px;\n              \">00</div>\n            </div>\n\n            <!-- Root Cause -->\n            <div style=\"\n              background: linear-gradient(90deg, #13c2c2 0%, #13c2c2dd 100%);\n              border-radius: 50px;\n              padding: 16px 28px;\n              width: 70%;\n              margin: 0 auto 16px auto;\n              display: flex;\n              justify-content: space-between;\n              align-items: center;\n              min-height: 56px;\n            \">\n              <div style=\"display: flex; align-items: center; gap: 10px;\">\n                <svg width=\"18\" height=\"18\" fill=\"#fff\" viewBox=\"0 0 24 24\">\n                  <path d=\"M10 17l5-5-5-5v10z\"/>\n                </svg>\n                <span style=\"color: #fff; font-weight: 600; font-size: 15px;\">Root Cause</span>\n              </div>\n              <div id=\"funnelRootCause\" style=\"\n                background: rgba(255, 255, 255, 0.25);\n                padding: 6px 14px;\n                border-radius: 20px;\n                color: #fff;\n                font-weight: 600;\n                font-size: 14px;\n              \">00</div>\n            </div>\n\n            <!-- Empty Stage -->\n            <div style=\"\n              background: linear-gradient(90deg, #a0d911 0%, #a0d911dd 100%);\n              border-radius: 50px;\n              padding: 16px 28px;\n              width: 55%;\n              margin: 0 auto 0 auto;\n              min-height: 56px;\n            \"></div>\n\n            <div style=\"text-align: center; padding-top: 24px; border-top: 1px solid #3a3a3a; margin-top: 24px;\">\n              <div style=\"color: #888; font-size: 13px; margin-bottom: 6px;\">Total Conversions</div>\n              <div id=\"totalConversions\" style=\"color: #a0d911; font-size: 28px; font-weight: 700;\">0.93%</div>\n            </div>\n          </div>\n\n          <!-- Engagement Trends -->\n          <div style=\"\n            background: #2a2a2a;\n            border: 1px solid #3a3a3a;\n            border-radius: 14px;\n            padding: 28px;\n          \">\n            <div style=\"display: flex; justify-content: space-between; align-items: center; margin-bottom: 28px;\">\n              <h3 style=\"color: #e5e5e5; font-size: 18px; font-weight: 600;\">Engagement Trends</h3>\n              <div style=\"display: flex; align-items: center; gap: 8px;\">\n                <div style=\"width: 10px; height: 10px; border-radius: 50%; background: #00c853;\"></div>\n                <span style=\"color: #888; font-size: 13px;\">Value</span>\n              </div>\n            </div>\n            \n            <div style=\"position: relative; height: 300px;\">\n              <!-- Y-axis labels -->\n              <div style=\"\n                position: absolute;\n                left: -10px;\n                top: 0;\n                height: 270px;\n                display: flex;\n                flex-direction: column;\n                justify-content: space-between;\n                font-size: 11px;\n                color: #666;\n              \">\n                <div>100</div>\n                <div>80</div>\n                <div>60</div>\n                <div>40</div>\n                <div>20</div>\n                <div>0</div>\n              </div>\n\n              <!-- Bar Chart Container -->\n              <div style=\"\n                display: flex;\n                align-items: flex-end;\n                justify-content: space-around;\n                height: 270px;\n                gap: 12px;\n                margin-left: 30px;\n              \">\n                <!-- Sat -->\n                <div style=\"flex: 1; display: flex; flex-direction: column; align-items: center; gap: 10px;\">\n                  <div id=\"barSat\" style=\"width: 100%; height: 15%; background: linear-gradient(180deg, #00c853 0%, #00a844 100%); border-radius: 8px 8px 4px 4px; min-height: 20px;\"></div>\n                  <div style=\"color: #888; font-size: 12px; font-weight: 500;\">Sat</div>\n                </div>\n                <!-- Sun -->\n                <div style=\"flex: 1; display: flex; flex-direction: column; align-items: center; gap: 10px;\">\n                  <div id=\"barSun\" style=\"width: 100%; height: 78%; background: linear-gradient(180deg, #00c853 0%, #00a844 100%); border-radius: 8px 8px 4px 4px; min-height: 20px;\"></div>\n                  <div style=\"color: #888; font-size: 12px; font-weight: 500;\">Sun</div>\n                </div>\n                <!-- Mon -->\n                <div style=\"flex: 1; display: flex; flex-direction: column; align-items: center; gap: 10px;\">\n                  <div id=\"barMon\" style=\"width: 100%; height: 40%; background: linear-gradient(180deg, #00c853 0%, #00a844 100%); border-radius: 8px 8px 4px 4px; min-height: 20px;\"></div>\n                  <div style=\"color: #888; font-size: 12px; font-weight: 500;\">Mon</div>\n                </div>\n                <!-- Tue -->\n                <div style=\"flex: 1; display: flex; flex-direction: column; align-items: center; gap: 10px;\">\n                  <div id=\"barTue\" style=\"width: 100%; height: 72%; background: linear-gradient(180deg, #00c853 0%, #00a844 100%); border-radius: 8px 8px 4px 4px; min-height: 20px;\"></div>\n                  <div style=\"color: #888; font-size: 12px; font-weight: 500;\">Tue</div>\n                </div>\n                <!-- Wed -->\n                <div style=\"flex: 1; display: flex; flex-direction: column; align-items: center; gap: 10px;\">\n                  <div id=\"barWed\" style=\"width: 100%; height: 68%; background: linear-gradient(180deg, #00c853 0%, #00a844 100%); border-radius: 8px 8px 4px 4px; min-height: 20px;\"></div>\n                  <div style=\"color: #888; font-size: 12px; font-weight: 500;\">Wed</div>\n                </div>\n                <!-- Thu -->\n                <div style=\"flex: 1; display: flex; flex-direction: column; align-items: center; gap: 10px;\">\n                  <div id=\"barThu\" style=\"width: 100%; height: 45%; background: linear-gradient(180deg, #00c853 0%, #00a844 100%); border-radius: 8px 8px 4px 4px; min-height: 20px;\"></div>\n                  <div style=\"color: #888; font-size: 12px; font-weight: 500;\">Thu</div>\n                </div>\n                <!-- Fri -->\n                <div style=\"flex: 1; display: flex; flex-direction: column; align-items: center; gap: 10px;\">\n                  <div id=\"barFri\" style=\"width: 100%; height: 62%; background: linear-gradient(180deg, #00c853 0%, #00a844 100%); border-radius: 8px 8px 4px 4px; min-height: 20px;\"></div>\n                  <div style=\"color: #888; font-size: 12px; font-weight: 500;\">Fri</div>\n                </div>\n              </div>\n            </div>\n          </div>\n        </div>\n      </div>\n    </div>\n  </div>\n`;\n\nconst $ = (id) => document.getElementById(id);\n\nconst hasCountKeys = (obj) => {\n  if (!obj || typeof obj !== 'object') return false;\n  return obj.name_count !== undefined ||\n    obj.nameCount !== undefined ||\n    obj.total_users !== undefined ||\n    obj.totalUsers !== undefined ||\n    obj.all_users !== undefined ||\n    obj.allUsers !== undefined ||\n    obj.orientation_call_count !== undefined ||\n    obj.orientationCallCount !== undefined ||\n    obj.orientation_count !== undefined ||\n    obj.orientationCount !== undefined ||\n    obj.rootcause_analysis_count !== undefined ||\n    obj.rootcause_count !== undefined ||\n    obj.rootCauseCount !== undefined ||\n    obj.rootCause !== undefined;\n};\n\nconst findCountsObject = (root) => {\n  if (!root || typeof root !== 'object') return null;\n  const stack = [root];\n  const seen = new Set();\n  while (stack.length) {\n    const current = stack.pop();\n    if (!current || typeof current !== 'object') continue;\n    if (seen.has(current)) continue;\n    seen.add(current);\n    if (hasCountKeys(current)) return current;\n    if (Array.isArray(current)) {\n      for (const item of current) stack.push(item);\n    } else {\n      for (const key in current) {\n        stack.push(current[key]);\n      }\n    }\n  }\n  return null;\n};\n\nconst pickFromFlowResults = (fr) => {\n  if (!fr || typeof fr !== 'object') return null;\n  const direct = fr.dashboardData ?? fr.httpResult ?? fr.httpResult_raw ?? fr.httpResponse ?? fr.httpResponse_raw ?? fr.response ?? fr.result ?? fr.data ?? fr.payload ?? fr.body;\n  if (direct !== undefined && direct !== null) return direct;\n\n  const apiDirect = fr.apiResponses && (fr.apiResponses.httpResult ?? fr.apiResponses.httpResult_raw ?? fr.apiResponses.httpResponse ?? fr.apiResponses.httpResponse_raw ?? fr.apiResponses.response ?? fr.apiResponses.result);\n  if (apiDirect !== undefined && apiDirect !== null) return apiDirect;\n\n  const varDirect = fr.variables && (fr.variables.httpResult ?? fr.variables.httpResult_raw ?? fr.variables.httpResponse ?? fr.variables.httpResponse_raw ?? fr.variables.response ?? fr.variables.result);\n  if (varDirect !== undefined && varDirect !== null) return varDirect;\n\n  const candidates = [fr.apiResponses, fr.variables, fr.nodeResults, fr.currentResult, fr.previousResult, fr];\n  for (const candidate of candidates) {\n    const found = findCountsObject(candidate);\n    if (found) return found;\n  }\n  return null;\n};\n\nconst getInputData = () => {\n  if (typeof scriptContext !== 'undefined' && scriptContext && typeof scriptContext.getData === 'function') {\n    const ctxKeys = ['dashboardData','httpResult','httpResult_raw','httpResponse','httpResponse_raw','response','result','data','payload','body','innerHTML'];\n    for (const key of ctxKeys) {\n      const value = scriptContext.getData(key);\n      if (value !== undefined && value !== null) return value;\n    }\n  }\n\n  if (typeof parameters !== 'undefined' && parameters) {\n    if (parameters.dashboardData) return parameters.dashboardData;\n    if (parameters.httpResult) return parameters.httpResult;\n    if (parameters.httpResult_raw) return parameters.httpResult_raw;\n    if (parameters.httpResponse) return parameters.httpResponse;\n    if (parameters.httpResponse_raw) return parameters.httpResponse_raw;\n    if (parameters.response) return parameters.response;\n    if (parameters.result) return parameters.result;\n    if (parameters.data) return parameters.data;\n    if (parameters.payload) return parameters.payload;\n    if (parameters.body) return parameters.body;\n    if (parameters.innerHTML !== undefined) return parameters.innerHTML;\n  }\n\n  if (typeof window !== 'undefined') {\n    const fr = window.flowResults || window.mainChainFlowResults;\n    if (fr) {\n      const picked = pickFromFlowResults(fr);\n      if (picked !== undefined && picked !== null) return picked;\n    }\n  }\n\n  return null;\n};\n\nconst parseMaybeJson = (value) => {\n  if (typeof value !== 'string') return value;\n  try {\n    return JSON.parse(value);\n  } catch {\n    return value;\n  }\n};\n\nconst unwrapData = (value) => {\n  if (!value) return null;\n  let data = parseMaybeJson(value);\n  if (!data || typeof data !== 'object') return null;\n  if (Array.isArray(data) && data.length === 1 && data[0] && typeof data[0] === 'object') {\n    data = data[0];\n  }\n  const keys = ['dashboardData','httpResult','httpResult_raw','httpResponse','httpResponse_raw','response','result','data','payload','body','innerHTML'];\n  for (const key of keys) {\n    if (data && typeof data === 'object' && data[key] !== undefined && data[key] !== null) {\n      data = parseMaybeJson(data[key]);\n      if (Array.isArray(data) && data.length === 1 && data[0] && typeof data[0] === 'object') {\n        data = data[0];\n      }\n    }\n  }\n  return data;\n};\n\nconst toNumber = (value) => {\n  const num = Number(value);\n  return Number.isFinite(num) ? num : null;\n};\n\nconst DAY_ORDER = ['Sat','Sun','Mon','Tue','Wed','Thu','Fri'];\n\nconst normalizeDay = (day) => {\n  if (!day) return null;\n  const s = String(day).trim().slice(0, 3).toLowerCase();\n  if (s == 'sat') return 'Sat';\n  if (s == 'sun') return 'Sun';\n  if (s == 'mon') return 'Mon';\n  if (s == 'tue') return 'Tue';\n  if (s == 'wed') return 'Wed';\n  if (s == 'thu') return 'Thu';\n  if (s == 'fri') return 'Fri';\n  return null;\n};\n\nconst buildTrendsFromArray = (arr) => {\n  if (!Array.isArray(arr) || !arr.length) return null;\n  const allPrimitive = arr.every(v => v === null || v === undefined || typeof v !== 'object');\n  if (allPrimitive) {\n    const items = [];\n    for (let i = 0; i < arr.length && i < DAY_ORDER.length; i++) {\n      const value = toNumber(arr[i]);\n      if (value === null) continue;\n      items.push({ day: DAY_ORDER[i], value });\n    }\n    return items.length ? items : null;\n  }\n  const items = [];\n  for (const item of arr) {\n    if (!item || typeof item !== 'object') continue;\n    const day = normalizeDay(item.day ?? item.label ?? item.name ?? item.x);\n    const value = toNumber(item.value ?? item.count ?? item.val ?? item.metric ?? item.y ?? item.total);\n    if (day && value !== null) items.push({ day, value });\n  }\n  return items.length ? items : null;\n};\n\nconst buildTrendsFromObject = (obj) => {\n  if (!obj || typeof obj !== 'object') return null;\n  const items = [];\n  for (const day of DAY_ORDER) {\n    const value = toNumber(obj[day] ?? obj[day.toLowerCase()] ?? obj[day.slice(0,3).toLowerCase()]);\n    if (value !== null) items.push({ day, value });\n  }\n  if (items.length) return items;\n  for (const key in obj) {\n    const day = normalizeDay(key);\n    if (!day) continue;\n    const value = toNumber(obj[key]);\n    if (value !== null) items.push({ day, value });\n  }\n  return items.length ? items : null;\n};\n\nconst normalizeTrends = (data) => {\n  if (!data || typeof data !== 'object') return null;\n  const direct = data.trends ?? data.engagement_trends ?? data.engagementTrends ?? data.trend ?? data.trend_data ?? data.trendData;\n  if (Array.isArray(direct)) {\n    const fromArray = buildTrendsFromArray(direct);\n    if (fromArray) return fromArray;\n  } else if (direct && typeof direct === 'object') {\n    const fromObject = buildTrendsFromObject(direct);\n    if (fromObject) return fromObject;\n  }\n  const valuesArray = data.values ?? data.value_list ?? data.valueList ?? data.trend_values ?? data.trendValues ?? data.weekly_values ?? data.weeklyValues ?? data.daily_values ?? data.dailyValues;\n  const fromValues = buildTrendsFromArray(valuesArray);\n  if (fromValues) return fromValues;\n  const singleValue = toNumber(data.value ?? data.trend_value ?? data.trendValue ?? data.engagement_value ?? data.engagementValue);\n  if (singleValue !== null) {\n    return DAY_ORDER.map(day => ({ day, value: singleValue }));\n  }\n  return null;\n};\n\nconst normalizeData = (value) => {\n  const data = unwrapData(value);\n  if (!data || typeof data !== 'object') return null;\n\n  const trends = normalizeTrends(data);\n\n  if (data.kpis || data.funnel || data.trends) {\n    if (trends && (!data.trends || data.trends !== trends)) {\n      return { ...data, trends };\n    }\n    return data;\n  }\n\n  const nameCount = toNumber(data.name_count ?? data.nameCount ?? data.total_users ?? data.totalUsers ?? data.all_users ?? data.allUsers);\n  const orientationCount = toNumber(data.orientation_call_count ?? data.orientationCallCount ?? data.orientation_count ?? data.orientationCount);\n  const rootCauseCount = toNumber(data.rootcause_analysis_count ?? data.rootcause_count ?? data.rootCauseCount ?? data.rootCause);\n\n  if (nameCount === null && orientationCount === null && rootCauseCount === null) {\n    const found = findCountsObject(data);\n    if (found && found !== data) {\n      return normalizeData(found);\n    }\n  }\n\n  const kpis = {};\n  if (nameCount !== null) kpis.totalUsers = nameCount;\n  if (orientationCount !== null) kpis.orientationBooked = orientationCount;\n\n  const funnel = {};\n  if (nameCount !== null) funnel.allUsers = nameCount;\n  if (orientationCount !== null) funnel.orientation = orientationCount;\n  if (rootCauseCount !== null) funnel.rootCause = rootCauseCount;\n\n  if (Object.keys(kpis).length || Object.keys(funnel).length || trends) {\n    const result = {};\n    if (Object.keys(kpis).length) result.kpis = kpis;\n    if (Object.keys(funnel).length) result.funnel = funnel;\n    if (trends) result.trends = trends;\n    return result;\n  }\n\n  return data;\n};\n\nconst defaultData = {\n  kpis: {\n    totalUsers: 1248,\n    orientationBooked: 116,\n    attendanceRate: 74,\n    usersGrowth: '+12.3% this month',\n    orientationGrowth: '+8% this month',\n    attendanceGrowth: '+23% this month'\n  },\n  funnel: {\n    allUsers: 100,\n    orientation: 75,\n    rootCause: 50,\n    conversions: 0.93\n  },\n  trends: [\n    { day: 'Sat', value: 15 },\n    { day: 'Sun', value: 78 },\n    { day: 'Mon', value: 40 },\n    { day: 'Tue', value: 72 },\n    { day: 'Wed', value: 68 },\n    { day: 'Thu', value: 45 },\n    { day: 'Fri', value: 62 }\n  ]\n};\n\nlet dashboardData = normalizeData(getInputData()) || defaultData;\n\nconst formatNumber = (num) => {\n  if (!num && num !== 0) return '0';\n  return num.toLocaleString();\n};\n\nconst updateDashboard = () => {\n  const kpis = { ...defaultData.kpis, ...(dashboardData && dashboardData.kpis ? dashboardData.kpis : {}) };\n  const funnel = { ...defaultData.funnel, ...(dashboardData && dashboardData.funnel ? dashboardData.funnel : {}) };\n  const trends = (dashboardData && Array.isArray(dashboardData.trends) && dashboardData.trends.length)\n    ? dashboardData.trends\n    : defaultData.trends;\n  \n  if ($('totalUsers')) $('totalUsers').textContent = formatNumber(kpis.totalUsers);\n  if ($('usersGrowth')) $('usersGrowth').textContent = kpis.usersGrowth || '+12.3% this month';\n  \n  if ($('orientationBooked')) $('orientationBooked').textContent = formatNumber(kpis.orientationBooked);\n  if ($('orientationGrowth')) $('orientationGrowth').textContent = kpis.orientationGrowth || '+8% this month';\n  \n  if ($('attendanceRate')) $('attendanceRate').textContent = kpis.attendanceRate + '%';\n  if ($('attendanceGrowth')) $('attendanceGrowth').textContent = kpis.attendanceGrowth || '+23% this month';\n  \n  if ($('funnelAllUsers')) $('funnelAllUsers').textContent = funnel.allUsers;\n  if ($('funnelOrientation')) $('funnelOrientation').textContent = funnel.orientation;\n  if ($('funnelRootCause')) $('funnelRootCause').textContent = funnel.rootCause;\n  if ($('totalConversions')) $('totalConversions').textContent = funnel.conversions + '%';\n  \n  const values = trends.map(d => toNumber(d.value) ?? 0);\n  const maxValue = Math.max(1, ...values);\n  trends.forEach(data => {\n    const barId = 'bar' + data.day;\n    const bar = $(barId);\n    if (bar) {\n      const value = toNumber(data.value) ?? 0;\n      const height = maxValue ? (value / maxValue) * 100 : 0;\n      bar.style.height = height + '%';\n    }\n  });\n};\n\nlet lastGoodData = dashboardData;\n\nconst applyData = (value) => {\n  const normalized = normalizeData(value);\n  if (normalized) {\n    dashboardData = normalized;\n    lastGoodData = normalized;\n    updateDashboard();\n    return true;\n  }\n  return false;\n};\n\nconst refreshData = () => {\n  const current = getInputData();\n  if (!applyData(current) && lastGoodData) {\n    updateDashboard();\n  }\n};\n\nif (typeof window !== 'undefined') {\n  const handler = (evt) => {\n    const detail = evt && evt.detail ? evt.detail : {};\n    const relevantKeys = ['dashboardData','httpResult','httpResult_raw','httpResponse','httpResponse_raw','response','result','data','payload','body','innerHTML'];\n\n    if (detail && detail.value !== undefined) {\n      if (!detail.key || relevantKeys.includes(detail.key)) {\n        if (applyData(detail.value)) return;\n      }\n    }\n\n    if (!detail.key || relevantKeys.includes(detail.key)) {\n      refreshData();\n    }\n  };\n\n  const flowHandler = (evt) => {\n    const detail = evt && evt.detail ? evt.detail : {};\n    if (detail && detail.flowResults) {\n      if (applyData(detail.flowResults)) return;\n    }\n    refreshData();\n  };\n  \n  window.addEventListener('__scriptContextChange', handler);\n  window.addEventListener('workflowCompleted', flowHandler);\n  window.addEventListener('flowExecutionCompleted', flowHandler);\n\n  if (window.__dashboardRefreshInterval) {\n    clearInterval(window.__dashboardRefreshInterval);\n  }\n  window.__dashboardRefreshInterval = setInterval(refreshData, 2000);\n  \n  if (typeof onCleanup === 'function') {\n    onCleanup(() => {\n      window.removeEventListener('__scriptContextChange', handler);\n      window.removeEventListener('workflowCompleted', flowHandler);\n      window.removeEventListener('flowExecutionCompleted', flowHandler);\n      if (window.__dashboardRefreshInterval) {\n        clearInterval(window.__dashboardRefreshInterval);\n        window.__dashboardRefreshInterval = null;\n      }\n    });\n  }\n}\n\ntry {\n  updateDashboard();\n  refreshData();\n  \n  if (typeof window !== 'undefined') {\n    setTimeout(refreshData, 250);\n    setTimeout(refreshData, 1000);\n  }\n  \n  if (typeof output !== 'undefined') {\n    output.action = 'loaded';\n    output.dashboardLoaded = true;\n  }\n} catch (error) {\n  console.error('Init error:', error);\n}", input_variables: [{ "name": "dashboardData", "type": "object from http request", "source": "custom", "description": "Input variable: dashboardData" }], output_variables: [], scriptElementOverrides: { "auto-wi2o5n": { "attributes": { "onclick": "if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17702907459371426'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17702907459371426'); } return false;", "data-page-link": "page-17702907459371426", "data-link-to-page": "Chat History" } }, "auto-wi2o5o": { "attributes": { "onclick": "if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17702826114826988'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17702826114826988'); } return false;", "data-page-link": "page-17702826114826988", "data-link-to-page": "Form Submission" } }, "auto-wi2o5p": { "attributes": { "onclick": "if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17702812000504656'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17702812000504656'); } return false;", "data-page-link": "page-17702812000504656", "data-link-to-page": "Orientation Calls" } }, "auto-wi2o5q": { "attributes": { "onclick": "if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17709737292499859'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17709737292499859'); } return false;", "data-page-link": "page-17709737292499859", "data-link-to-page": "Userdirectory" } }, "auto-wi2o5r": { "attributes": { "onclick": "if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-1770985628551516'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-1770985628551516'); } return false;", "data-page-link": "page-1770985628551516", "data-link-to-page": "chatbot" } } } }
  ];
  React.useEffect(() => {
    const element = document.getElementById('component-1771007210712-8027') || document.querySelector('[data-component-id="component-1771007210712-8027"]');
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
        const inputVarNames = ["dashboardData"];
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
        const inputVarNames = ["dashboardData"];
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
      componentId: 'component-1771007210712-8027',
      eventType: 'onload',
      scripts: scripts_component_1771007210712_8027_onload,
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
        <div style={{ width: "100%", border: "none", display: "block", padding: "0.5rem", gridArea: "1 / 1 / 27 / 13", overflow: "hidden", minHeight: "780px", gridRowEnd: 27, paddingTop: "0", gridRowStart: 1, paddingLeft: "0", gridColumnEnd: 13, paddingRight: "0", paddingBottom: "0", backgroundColor: "#5e5e5e", gridColumnStart: 1 }} id="component-1771007210712-8027"></div>
        <div style={{ width: "100%", border: "none", display: "flex", padding: "0.5rem", gridArea: "27 / 1 / 34 / 13", overflow: "hidden", position: "relative", flexWrap: "wrap", minHeight: "210px", gridRowEnd: 34, alignItems: "flex-start", paddingTop: "0", gridRowStart: 27, paddingLeft: "0", gridColumnEnd: 13, paddingRight: "0", flexDirection: "row", paddingBottom: "0", backgroundColor: "#1a1a1a", gridColumnStart: 1, justifyContent: "flex-start" }} id="component-1771079635520-8118">
          <div style={{ width: "148px", height: "74px" }} id="nested-1771079645365-617">
            <button style={{ color: "white", width: "148px", border: "none", cursor: "pointer", height: "64px", padding: "10px 16px", fontWeight: "500", borderRadius: "4px", backgroundColor: "" }} data-component-id="id-17710796453655651" type="submit" onClick={async (event: React.MouseEvent) => {
              event.preventDefault();

              try {
                console.log('Flow Integration: Button clicked:', 'id-17710796453655651');

                // Ensure router is available globally for navigation workflows
                // This is safely handled even if router is not available in this component
                try {
                  if (typeof window !== 'undefined' && !(window as any).router) {
                    // Try to get router from React context or Next.js if available
                    console.log('Attempting to expose router globally for navigation workflows');
                  }
                } catch (routerError) {
                  // Silently handle router exposure errors
                }

                // Collect form data if the button is inside a form
                let formData: Record<string, any> = {};
                let formId = '';

                try {
                  const buttonElement = document.querySelector('[data-component-id="id-17710796453655651"]');
                  if (buttonElement) {
                    const formElement = buttonElement.closest('form');
                    if (formElement) {
                      formId = formElement.getAttribute('data-component-id') || 'unknown-form';
                      console.log('Button is inside form:', formId);

                      // VALIDATION: Check all form fields before proceeding
                      console.log('Validating form fields before flow execution...');
                      const formInputs = formElement.querySelectorAll('input, select, textarea');
                      let validationErrors: string[] = [];
                      const validatedRadioGroups = new Set<string>(); // Track validated radio groups

                      // CRITICAL FIX: Check if form actually has any validations before proceeding
                      const hasFormValidations = Array.from(formInputs).some((input: Element) => {
                        const validationsAttr = input.getAttribute('data-validations');
                        if (!validationsAttr) return false;

                        try {
                          const validations = JSON.parse(validationsAttr);
                          // Check if there are any active validation rules
                          return Object.entries(validations).some(([key, value]) => {
                            if (value === null || value === undefined || value === false) return false;
                            if (typeof value === 'string' && value.trim() === '') return false;
                            if (typeof value === 'number' && isNaN(value)) return false;
                            return true;
                          });
                        } catch {
                          return false;
                        }
                      });

                      console.log('Form has active validations: ' + hasFormValidations);

                      // CRITICAL FIX: If no validations exist, skip validation entirely
                      if (!hasFormValidations) {
                        console.log('No validations found on form, skipping validation checks');
                      } else {

                        // Helper functions for date validation
                        const parseDateValue = (
                          rawValue?: string | number | Date | null
                        ): Date | null => {
                          if (rawValue === undefined || rawValue === null) {
                            return null;
                          }
                          if (rawValue instanceof Date) {
                            return new Date(rawValue.getTime());
                          }
                          const normalizedValue = String(rawValue).trim();
                          if (!normalizedValue) {
                            return null;
                          }
                          const parsed = new Date(normalizedValue);
                          return isNaN(parsed.getTime()) ? null : parsed;
                        };

                        const formatDateLimit = (
                          rawValue: any,
                          parsedValue: Date,
                          includeTime: boolean = false
                        ) => {
                          if (typeof rawValue === 'string' && rawValue.trim()) {
                            return rawValue;
                          }
                          return includeTime
                            ? parsedValue.toLocaleString()
                            : parsedValue.toLocaleDateString();
                        };

                        const isValidationFlagEnabled = (flagValue: any) =>
                          flagValue === true ||
                          flagValue === 'true' ||
                          flagValue === 1 ||
                          flagValue === '1';

                        formInputs.forEach((input: Element) => {
                          const inputElement = input as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;
                          const inputId = inputElement.getAttribute('data-component-id') || inputElement.id;

                          if (!inputId) return;

                          // Clear previous errors for this input
                          const existingError = inputElement.parentElement?.querySelector('.error-message');
                          if (existingError) existingError.remove();

                          // Get validation rules from data-validations attribute
                          const validationsAttr = inputElement.getAttribute('data-validations');

                          // Handle different input types first
                          const isSelect = inputElement.tagName === 'SELECT';
                          const isMultiSelect = isSelect && (inputElement as HTMLSelectElement).multiple;
                          const isCheckbox = (inputElement as HTMLInputElement).type === 'checkbox';
                          const isRadio = (inputElement as HTMLInputElement).type === 'radio';

                          // For radio buttons with data-validations, check if this group was already validated
                          if (isRadio) {
                            const radioName = (inputElement as HTMLInputElement).name;
                            if (radioName && validatedRadioGroups.has(radioName)) {
                              return; // Skip - already validated this radio group
                            }
                          }

                          // For select elements and radio buttons without data-validations, check if they should be validated
                          let validations: any = {};
                          if (validationsAttr) {
                            try {
                              validations = JSON.parse(validationsAttr);
                            } catch {
                              return; // Skip if invalid JSON
                            }
                          } else if (isSelect) {
                            // No explicit validations configured for this select element
                            (inputElement as HTMLSelectElement).style.borderColor = '';
                            return;
                          } else if (isRadio) {
                            // No explicit validations configured for this radio group
                            const radioElement = inputElement as HTMLInputElement;
                            radioElement.style.borderColor = '';
                            const radioContainer = radioElement.closest('.radio-group');
                            if (radioContainer) {
                              const existingError = radioContainer.querySelector('.error-message');
                              if (existingError) {
                                existingError.remove();
                              }
                            }
                            return;
                          } else {
                            // Not a select or radio and no validations attribute, skip
                            return;
                          }

                          try {
                            let hasError = false;
                            let errorMessage = '';

                            // Handle different input types
                            let value: string = '';

                            if (isSelect) {
                              const selectEl = inputElement as HTMLSelectElement;
                              if (isMultiSelect) {
                                const selectedOptions = Array.from(selectEl.selectedOptions).map(opt => opt.value);
                                value = selectedOptions.join(',');
                              } else {
                                const selectedOption = selectEl.options[selectEl.selectedIndex];
                                if (selectedOption && (selectedOption.disabled || selectedOption.value === '')) {
                                  value = '';
                                } else {
                                  value = selectEl.value || '';
                                }
                              }
                            } else if (isCheckbox) {
                              value = (inputElement as HTMLInputElement).checked ? 'checked' : '';
                            } else if ((inputElement as HTMLInputElement).type === 'file') {
                              // For file inputs, check if files are selected
                              const fileInput = inputElement as HTMLInputElement;
                              if (fileInput.files && fileInput.files.length > 0) {
                                value = 'files-selected'; // Mark as having value
                              } else {
                                value = ''; // No files selected
                              }
                            } else {
                              value = inputElement.value.trim();
                            }

                            // Required validation
                            if (validations.required) {
                              if (isSelect && !isMultiSelect) {
                                // For single select, check if a valid option is selected
                                const selectEl = inputElement as HTMLSelectElement;
                                const selectedOption = selectEl.options[selectEl.selectedIndex];
                                if (!selectedOption || selectedOption.disabled || selectedOption.value === '') {
                                  hasError = true;
                                  errorMessage = 'This field is required';
                                }
                              } else if (isMultiSelect) {
                                const selectEl = inputElement as HTMLSelectElement;
                                const selectedOptions = Array.from(selectEl.selectedOptions).filter(opt => !opt.disabled && opt.value !== '');
                                if (selectedOptions.length === 0) {
                                  hasError = true;
                                  errorMessage = 'This field is required';
                                }
                              } else if ((inputElement as HTMLInputElement).type === 'file') {
                                // For file upload, check if at least one file is selected
                                const fileInput = inputElement as HTMLInputElement;
                                if (!fileInput.files || fileInput.files.length === 0) {
                                  hasError = true;
                                  errorMessage = 'This field is required';
                                }
                              } else if (isRadio) {
                                // For radio buttons, check if at least one in the group is selected
                                const radioName = (inputElement as HTMLInputElement).name;
                                if (radioName) {
                                  // Mark this radio group as validated
                                  validatedRadioGroups.add(radioName);

                                  const radioGroup = formElement.querySelectorAll('input[type="radio"][name="' + radioName + '"]');
                                  const isAnyChecked = Array.from(radioGroup).some((radio: any) => radio.checked);
                                  if (!isAnyChecked) {
                                    hasError = true;
                                    errorMessage = 'This field is required';
                                  }
                                }
                              } else if (isCheckbox) {
                                if (!(inputElement as HTMLInputElement).checked) {
                                  hasError = true;
                                  errorMessage = 'This field is required';
                                }
                              } else if (!value || value === '') {
                                hasError = true;
                                errorMessage = 'This field is required';
                              }
                            }

                            // Only check other validations if field has a value or is not required
                            if (!hasError && value && value !== '') {
                              const getLengthValidationValue = () => {
                                if (!isSelect && ((inputElement as HTMLInputElement).type === 'tel' || validations.phone) && value) {
                                  const digitsOnly = value.replace(/[\s()-]/g, '');
                                  const digitsWithoutPlus = digitsOnly.startsWith('+') ? digitsOnly.slice(1) : digitsOnly;
                                  if (validations.countryCode) {
                                    const normalizedCode = validations.countryCode.trim().replace(/[\s()-]/g, '');
                                    const codeDigits = normalizedCode.startsWith('+') ? normalizedCode.slice(1) : normalizedCode;
                                    if (codeDigits && digitsWithoutPlus.startsWith(codeDigits)) {
                                      return digitsWithoutPlus.slice(codeDigits.length);
                                    }
                                  }
                                  return digitsWithoutPlus;
                                }
                                return value;
                              };
                              const lengthValidationValue = getLengthValidationValue();
                              const parseLengthValue = (len: any) => {
                                if (typeof len === 'number') return len;
                                if (typeof len === 'string') {
                                  const parsed = parseInt(len, 10);
                                  return isNaN(parsed) ? undefined : parsed;
                                }
                                return undefined;
                              };
                              const effectiveMinLength = parseLengthValue(
                                validations.minLength !== undefined
                                  ? validations.minLength
                                  : (validations.countryCode && validations.maxLength !== undefined ? validations.maxLength : undefined)
                              );
                              const effectiveMaxLength = parseLengthValue(validations.maxLength);

                              // Min length validation
                              if (!isSelect && effectiveMinLength !== undefined) {
                                const minLength = effectiveMinLength;
                                if (lengthValidationValue.length < minLength) {
                                  hasError = true;
                                  errorMessage = 'Minimum length is ' + minLength + ' characters';
                                }
                              }

                              // Max length validation
                              if (!hasError && !isSelect && effectiveMaxLength !== undefined) {
                                const maxLength = effectiveMaxLength;
                                if (lengthValidationValue.length > maxLength) {
                                  hasError = true;
                                  errorMessage = 'Maximum length is ' + maxLength + ' characters';
                                }
                              }

                              // Email validation
                              if (!hasError && !isSelect && (inputElement as HTMLInputElement).type === 'email') {
                                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                                if (!emailRegex.test(value)) {
                                  hasError = true;
                                  errorMessage = 'Please enter a valid email address';
                                }

                                // Allowed domains validation
                                if (!hasError && validations.allowedDomains) {
                                  const domains = validations.allowedDomains.split(',').map((d: string) => d.trim().toLowerCase()).filter(Boolean);
                                  const emailDomain = value.split('@')[1]?.toLowerCase();
                                  if (!emailDomain || !domains.includes(emailDomain)) {
                                    hasError = true;
                                    errorMessage = 'Email must be from one of these domains: ' + domains.join(', ');
                                  }
                                }
                              }

                              // Phone validation
                              if (!hasError && !isSelect && ((inputElement as HTMLInputElement).type === 'tel' || validations.phone)) {
                                const cleanedPhone = value.replace(/[\s()-]/g, '');
                                const phoneRegex = /^\+?\d{10,15}$/; // enforce optional + and 10-15 digits after cleanup
                                if (!phoneRegex.test(cleanedPhone)) {
                                  hasError = true;
                                  errorMessage = 'Enter a valid phone number with 10-15 digits';
                                } else if (validations.countryCode) {
                                  const countryCode = validations.countryCode.trim();
                                  const requiredCode = countryCode.replace(/[\s()-]/g, '');
                                  const requiredCodeNoPlus = requiredCode.startsWith('+') ? requiredCode.slice(1) : requiredCode;
                                  const phoneNoPlus = cleanedPhone.startsWith('+') ? cleanedPhone.slice(1) : cleanedPhone;
                                  const matchesCountryCode =
                                    (requiredCode && cleanedPhone.startsWith(requiredCode)) ||
                                    (requiredCodeNoPlus && phoneNoPlus.startsWith(requiredCodeNoPlus));
                                  if (!matchesCountryCode) {
                                    hasError = true;
                                    errorMessage = validations.countryCodeMessage || 'Phone number must start with ' + countryCode;
                                  }
                                }
                              }

                              // Number validation
                              if (!hasError && !isSelect && (inputElement as HTMLInputElement).type === 'number') {
                                const numValue = parseFloat(value);
                                if (isNaN(numValue)) {
                                  hasError = true;
                                  errorMessage = 'Please enter a valid number';
                                } else {
                                  if (validations.min !== undefined && numValue < validations.min) {
                                    hasError = true;
                                    errorMessage = 'Minimum value is ' + validations.min;
                                  } else if (validations.max !== undefined && numValue > validations.max) {
                                    hasError = true;
                                    errorMessage = 'Maximum value is ' + validations.max;
                                  }
                                }
                              }

                              // Alphabets only validation
                              if (!hasError && !isSelect && validations.alphabetsOnly) {
                                const alphabetsRegex = /^[A-Za-z\s]+$/;
                                if (!alphabetsRegex.test(value)) {
                                  hasError = true;
                                  errorMessage = 'Only alphabets are allowed';
                                }
                              }

                              // No special characters validation
                              if (!hasError && !isSelect && validations.noSpecialChars) {
                                const specialCharsRegex = /[!@#$%^&*(),.?":{}|<>]/;
                                if (specialCharsRegex.test(value)) {
                                  hasError = true;
                                  errorMessage = 'Special characters are not allowed';
                                }
                              }

                              // Pattern validation (regex)
                              if (!hasError && validations.pattern) {
                                try {
                                  const regex = new RegExp(validations.pattern);
                                  if (!regex.test(value)) {
                                    hasError = true;
                                    errorMessage = validations.patternMessage || 'Please match the required format';
                                  }
                                } catch (regexError) {
                                  console.error('Invalid regex pattern:', validations.pattern);
                                }
                              }

                              // Password validation (only for input type="password")
                              if (!hasError && !isSelect && (inputElement as HTMLInputElement).type === 'password' && value) {
                                let passwordErrors: string[] = [];

                                // Check password requirements even without passwordStrength flag
                                if (validations.requiresUppercase && !/[A-Z]/.test(value)) {
                                  passwordErrors.push('uppercase letter');
                                }
                                if (validations.requiresLowercase && !/[a-z]/.test(value)) {
                                  passwordErrors.push('lowercase letter');
                                }
                                if (validations.requiresNumbers && !/[0-9]/.test(value)) {
                                  passwordErrors.push('number');
                                }
                                if (validations.requiresSymbols && !/[!@#$%^&*(),.?":{}|<>]/.test(value)) {
                                  passwordErrors.push('symbol');
                                }

                                if (passwordErrors.length > 0) {
                                  hasError = true;
                                  errorMessage = 'Password must contain at least one ' + passwordErrors.join(', ');
                                }

                                // Check password strength
                                if (!hasError && validations.passwordStrength) {
                                  const strength = validations.passwordStrength;
                                  const minLength = strength === 'weak' ? 6 : strength === 'medium' ? 8 : 12;
                                  if (value.length < minLength) {
                                    hasError = true;
                                    errorMessage = 'Password must be at least ' + minLength + ' characters for ' + strength + ' strength';
                                  }
                                }

                                // Check match confirm password
                                if (!hasError && validations.matchConfirmPassword) {
                                  // Find confirm password field - look for password input with label containing "confirm"
                                  const formElement = inputElement.closest('form');
                                  if (formElement) {
                                    const allPasswordInputs = formElement.querySelectorAll('input[type="password"]');
                                    let confirmPasswordValue = '';

                                    // Try to find confirm password field by label text
                                    for (const pwdInput of Array.from(allPasswordInputs)) {
                                      if (pwdInput === inputElement) continue; // Skip current password field

                                      const parent = pwdInput.closest('div');
                                      if (parent) {
                                        const label = parent.querySelector('label');
                                        if (label && label.textContent) {
                                          const labelText = label.textContent.toLowerCase();
                                          if (labelText.includes('confirm') || labelText.includes('re-enter') || labelText.includes('verify')) {
                                            confirmPasswordValue = (pwdInput as HTMLInputElement).value;
                                            break;
                                          }
                                        }
                                      }

                                      // Also check placeholder
                                      const placeholder = (pwdInput as HTMLInputElement).placeholder?.toLowerCase() || '';
                                      if (placeholder.includes('confirm') || placeholder.includes('re-enter') || placeholder.includes('verify')) {
                                        confirmPasswordValue = (pwdInput as HTMLInputElement).value;
                                        break;
                                      }
                                    }

                                    // If no confirm field found by label, use the next password field
                                    if (!confirmPasswordValue && allPasswordInputs.length > 1) {
                                      const passwordInputsArray = Array.from(allPasswordInputs);
                                      const currentIndex = passwordInputsArray.indexOf(inputElement);
                                      if (currentIndex < passwordInputsArray.length - 1) {
                                        confirmPasswordValue = (passwordInputsArray[currentIndex + 1] as HTMLInputElement).value;
                                      }
                                    }

                                    if (confirmPasswordValue && value !== confirmPasswordValue) {
                                      hasError = true;
                                      errorMessage = 'Passwords do not match';
                                    }
                                  }
                                }
                              }

                              // Date validation
                              if (!hasError && !isSelect && (inputElement as HTMLInputElement).type === 'date' && value) {
                                const dateValue = parseDateValue(value);
                                if (!dateValue) {
                                  hasError = true;
                                  errorMessage = validations.dateMessage || 'Please enter a valid date';
                                } else {
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  const endOfToday = new Date(today);
                                  endOfToday.setHours(23, 59, 59, 999);

                                  // Disallow past dates
                                  if (isValidationFlagEnabled(validations.disallowPast) && dateValue < today) {
                                    hasError = true;
                                    errorMessage = validations.disallowPastMessage || 'Past dates are not allowed';
                                  }

                                  // Disallow future dates
                                  if (!hasError && isValidationFlagEnabled(validations.disallowFuture) && dateValue > endOfToday) {
                                    hasError = true;
                                    errorMessage = validations.disallowFutureMessage || 'Future dates are not allowed';
                                  }

                                  // Min date validation
                                  if (!hasError) {
                                    const minDateRaw = validations.minDate || validations.min;
                                    if (minDateRaw) {
                                      const minDate = parseDateValue(minDateRaw);
                                      if (minDate && dateValue < minDate) {
                                        hasError = true;
                                        errorMessage = validations.minDateMessage ||
                                          validations.minMessage ||
                                          ('Date must be on or after ' + formatDateLimit(minDateRaw, minDate, false));
                                      }
                                    }
                                  }

                                  // Max date validation
                                  if (!hasError) {
                                    const maxDateRaw = validations.maxDate || validations.max;
                                    if (maxDateRaw) {
                                      const maxDate = parseDateValue(maxDateRaw);
                                      if (maxDate && dateValue > maxDate) {
                                        hasError = true;
                                        errorMessage = validations.maxDateMessage ||
                                          validations.maxMessage ||
                                          ('Date must be on or before ' + formatDateLimit(maxDateRaw, maxDate, false));
                                      }
                                    }
                                  }
                                }
                              }

                              // DateTime validation
                              if (!hasError && !isSelect && (inputElement as HTMLInputElement).type === 'datetime-local' && value) {
                                const dateTimeValue = parseDateValue(value);
                                if (!dateTimeValue) {
                                  hasError = true;
                                  errorMessage = validations.dateTimeMessage || 'Please enter a valid date and time';
                                } else {
                                  const now = new Date();

                                  // Disallow past datetimes
                                  if (isValidationFlagEnabled(validations.disallowPast) && dateTimeValue < now) {
                                    hasError = true;
                                    errorMessage = validations.disallowPastMessage || 'Past dates and times are not allowed';
                                  }

                                  // Disallow future datetimes
                                  if (!hasError && isValidationFlagEnabled(validations.disallowFuture) && dateTimeValue > now) {
                                    hasError = true;
                                    errorMessage = validations.disallowFutureMessage || 'Future dates and times are not allowed';
                                  }

                                  // Min datetime validation
                                  if (!hasError) {
                                    const minDateTimeRaw = validations.minDateTime || validations.min;
                                    if (minDateTimeRaw) {
                                      const minDateTime = parseDateValue(minDateTimeRaw);
                                      if (minDateTime && dateTimeValue < minDateTime) {
                                        hasError = true;
                                        errorMessage = validations.minDateTimeMessage ||
                                          validations.minMessage ||
                                          ('Date and time must be on or after ' + formatDateLimit(minDateTimeRaw, minDateTime, true));
                                      }
                                    }
                                  }

                                  // Max datetime validation
                                  if (!hasError) {
                                    const maxDateTimeRaw = validations.maxDateTime || validations.max;
                                    if (maxDateTimeRaw) {
                                      const maxDateTime = parseDateValue(maxDateTimeRaw);
                                      if (maxDateTime && dateTimeValue > maxDateTime) {
                                        hasError = true;
                                        errorMessage = validations.maxDateTimeMessage ||
                                          validations.maxMessage ||
                                          ('Date and time must be on or before ' + formatDateLimit(maxDateTimeRaw, maxDateTime, true));
                                      }
                                    }
                                  }
                                }
                              }

                              // Time validation
                              if (!hasError && !isSelect && (inputElement as HTMLInputElement).type === 'time' && value) {
                                const timeValue = value.split(':');
                                const timeMinutes = parseInt(timeValue[0]) * 60 + parseInt(timeValue[1] || '0');

                                // Min time validation
                                if (validations.minTime && value) {
                                  const minTimeParts = validations.minTime.split(':');
                                  const minTimeMinutes = parseInt(minTimeParts[0]) * 60 + parseInt(minTimeParts[1] || '0');
                                  if (timeMinutes < minTimeMinutes) {
                                    hasError = true;
                                    errorMessage = 'Time must be at or after ' + validations.minTime;
                                  }
                                }

                                // Max time validation
                                if (!hasError && validations.maxTime && value) {
                                  const maxTimeParts = validations.maxTime.split(':');
                                  const maxTimeMinutes = parseInt(maxTimeParts[0]) * 60 + parseInt(maxTimeParts[1] || '0');
                                  if (timeMinutes > maxTimeMinutes) {
                                    hasError = true;
                                    errorMessage = 'Time must be at or before ' + validations.maxTime;
                                  }
                                }
                              }
                            }

                            // Show error or success state
                            if (hasError) {
                              inputElement.style.borderColor = '#ef4444';
                              const errorElement = document.createElement('div');
                              errorElement.className = 'error-message';
                              errorElement.style.color = '#ef4444';
                              errorElement.style.fontSize = '0.875rem';
                              errorElement.style.marginTop = '0.25rem';
                              errorElement.textContent = errorMessage;
                              inputElement.parentElement?.appendChild(errorElement);

                              validationErrors.push(errorMessage);
                              console.warn('Validation error for field ' + inputId + ': ' + errorMessage);
                            } else if (value && value !== '') {
                              inputElement.style.borderColor = '#10b981';
                            } else {
                              inputElement.style.borderColor = '#d1d5db';
                            }
                            inputElement.style.boxShadow = 'none';

                          } catch (error) {
                            console.error('Validation error for field', inputId, ':', error);
                          }
                        });

                        // If there are validation errors, stop flow execution
                        if (validationErrors.length > 0) {
                          console.error('Form validation failed with errors:', validationErrors);
                          return {
                            success: false,
                            error: 'Please fix the validation errors before proceeding',
                            validationErrors: validationErrors,
                            buttonId: 'id-17710796453655651'
                          };
                        }

                        console.log('Form validation passed, proceeding with flow execution');
                      } // End of validation block

                      // Dynamically extract field names from DOM labels
                      const extractFieldNamesFromDOM = (formId: string): Record<string, string> => {
                        const fieldMapping: Record<string, string> = {};

                        try {
                          const formElement = document.querySelector('[data-component-id="' + formId + '"]');
                          if (!formElement) {
                            console.warn('Form element not found:', formId);
                            return fieldMapping;
                          }

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
                              fieldName = fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
                            }

                            // Store the mapping
                            if (fieldName) {
                              fieldMapping[inputId] = fieldName;
                              console.log('Dynamically mapped ' + inputId + ' → "' + fieldName + '"');
                            } else {
                              fieldMapping[inputId] = inputId;
                              console.warn('No label found for ' + inputId + ', using ID as fallback');
                            }
                          });

                        } catch (error) {
                          console.error('Error extracting field names from DOM:', error);
                        }

                        return fieldMapping;
                      };

                      // Extract field mapping dynamically
                      const fieldMapping = extractFieldNamesFromDOM(formId);
                      console.log('Dynamic field mapping:', fieldMapping);

                      // Collect form data with dynamically extracted field names and normalization
                      Object.keys(fieldMapping).forEach(inputId => {
                        const fieldName = fieldMapping[inputId];
                        const input = document.querySelector('[data-component-id="' + inputId + '"]') as HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

                        if (input) {
                          let fieldValue: any;
                          if ((input as HTMLInputElement).type === 'checkbox') {
                            fieldValue = (input as HTMLInputElement).checked || false;
                          } else {
                            fieldValue = input.value || '';
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
                          formData[fieldName] = fieldValue;           // Original field name
                          formData[normalizedFieldName] = fieldValue; // Normalized field name

                          console.log('Field mapped: "' + fieldName + '" -> "' + normalizedFieldName + '" = ' + fieldValue);
                        }
                      });

                      console.log('Form data collected by button click:', formData);
                    }
                  }
                } catch (error) {
                  console.error('Error collecting form data:', error);
                }

                // Type-safe check for flow integration functions
                const hasFlowSystem = typeof window !== 'undefined' &&
                  typeof window.executeSpecificFlow === 'function' &&
                  typeof window.getFlowChainInfo === 'function';

                if (hasFlowSystem) {
                  const flowChains = window.getFlowChainInfo!();
                  console.log('Available flow chains:', flowChains.length);

                  // Debug: Log all flow chains for troubleshooting
                  flowChains.forEach((chain, index) => {
                    console.log('  Chain ' + (index + 1) + ': ' + chain.id + ' -> Start: ' + chain.startNode?.id + ' (' + chain.startNode?.nodeType + ')');
                  });

                  let buttonFlow = flowChains.find((chain: any) => {
                    if (!chain.startNode) return false;

                    const config = chain.startNode.config || {};

                    // Method 1: Check config properties
                    if (config.buttonId === 'id-17710796453655651' ||
                      config.componentId === 'id-17710796453655651') {
                      return true;
                    }

                    // Method 2: Check start node ID
                    if (chain.startNode.id === 'id-17710796453655651') {
                      return true;
                    }

                    // Method 3: Check if flow chain ID contains the button ID
                    if (chain.id.includes('id-17710796453655651')) {
                      return true;
                    }

                    // Method 4: Check config nested properties
                    if (config.config?.buttonId === 'id-17710796453655651' ||
                      config.config?.componentId === 'id-17710796453655651') {
                      return true;
                    }

                    return false;
                  });

                  // Robust fallback matching when IDs differ across contexts (e.g., nested-* vs button-*)
                  if (!buttonFlow) {
                    try {
                      const normalizeId = (id: string | undefined | null) => (id || '').toString();
                      const stripPrefix = (id: string) => id.replace(/^nested-/, '').replace(/^button-/, '');
                      const digits = (id: string) => (id.match(/d+/g) || []).join('');

                      const targetId = normalizeId('id-17710796453655651');
                      const targetCore = stripPrefix(targetId);
                      const targetDigits = digits(targetId);

                      // Heuristic A: any chain whose start node is a button
                      const buttonChains = flowChains.filter((c: any) => c.startNode && c.startNode.nodeType === 'button');
                      if (buttonChains.length === 1) {
                        buttonFlow = buttonChains[0];
                      }

                      // Heuristic B: match core id (without prefixes)
                      if (!buttonFlow) {
                        buttonFlow = flowChains.find((c: any) => {
                          const sid = normalizeId(c.startNode?.id);
                          return stripPrefix(sid) === targetCore;
                        });
                      }

                      // Heuristic C: match by digits only
                      if (!buttonFlow && targetDigits) {
                        buttonFlow = flowChains.find((c: any) => {
                          const sd = digits(normalizeId(c.startNode?.id));
                          const idDigits = digits(normalizeId(c.id));
                          return sd === targetDigits || idDigits === targetDigits || normalizeId(c.id).includes(targetCore);
                        });
                      }

                      // Heuristic D: pick the first chain explicitly named for a button
                      if (!buttonFlow) {
                        buttonFlow = flowChains.find((c: any) => normalizeId(c.id).startsWith('universal_flow_button-'));
                      }

                      // Heuristic E: Removed - Don't automatically assign workflow to any button
                      // This was causing all buttons to trigger the workflow
                      // if (!buttonFlow && flowChains.length === 1) {
                      //   buttonFlow = flowChains[0];
                      // }
                    } catch (e) {
                      console.warn('Button flow fallback matching error:', e);
                    }
                  }

                  if (buttonFlow) {
                    console.log('Found matching flow chain:', buttonFlow.id);

                    // Pass comprehensive data including form data
                    const clickData = {
                      ...formData,  // Form fields at top level for easy access
                      buttonId: 'id-17710796453655651',
                      formId: formId,
                      formData: formData,  // Also nested for backward compatibility
                      clickTimestamp: new Date().toISOString(),
                      trigger: 'button-click-with-form-data'
                    };

                    console.log('Executing flow with form data:', clickData);
                    const result = await window.executeSpecificFlow!(buttonFlow.id, clickData);
                    console.log('Flow execution completed:', result);

                    return result;
                  } else {
                    console.warn('No flow chain found for button:', 'id-17710796453655651');

                    // FALLBACK: Check if there are Link Elements with custom navigation in the form
                    const formElement = document.querySelector('[data-component-id="' + formId + '"]');
                    if (formElement) {
                      const linkElements = formElement.querySelectorAll('a[data-component-id]');

                      linkElements.forEach((linkEl: Element) => {
                        // Check if this is a custom navigation link by looking for onClick handler
                        const linkId = linkEl.getAttribute('data-component-id');
                        console.log('Found Link Element in form:', linkId);

                        // Trigger the link's click handler to perform navigation
                        if ((linkEl as any).onclick) {
                          console.log('Triggering Link Element navigation as fallback');
                          (linkEl as any).click();
                          return {
                            success: true,
                            trigger: 'link-navigation-fallback',
                            linkId: linkId,
                            buttonId: 'id-17710796453655651'
                          };
                        }
                      });
                    }

                    // If no link elements found, check if form data contains URL patterns
                    const urlPatterns = Object.values(formData).filter(value =>
                      typeof value === 'string' &&
                      (value.startsWith('http://') || value.startsWith('https://'))
                    );

                    if (urlPatterns.length > 0) {
                      const targetUrl = urlPatterns[0] as string;
                      console.log('Found URL in form data, navigating to:', targetUrl);
                      window.open(targetUrl, '_blank');
                      return {
                        success: true,
                        trigger: 'url-extraction-navigation',
                        targetUrl: targetUrl,
                        buttonId: 'id-17710796453655651'
                      };
                    }
                  }
                } else {
                  console.warn('Flow integration system not available on window object');

                  // CRITICAL FIX: Don't use fallback that executes ALL flows
                  // This was causing all workflows to execute when only one should run
                  console.error('Flow integration system not properly initialized');
                  console.error('Missing functions:', {
                    hasExecuteSpecificFlow: typeof window !== 'undefined' && typeof window.executeSpecificFlow === 'function',
                    hasGetFlowChainInfo: typeof window !== 'undefined' && typeof window.getFlowChainInfo === 'function',
                    hasExecuteAllFlows: typeof window !== 'undefined' && typeof (window as any).executeAllFlows === 'function'
                  });

                  // Wait a moment and retry once (in case system is still initializing)
                  console.log('Waiting 500ms and retrying flow integration initialization...');
                  await new Promise(resolve => setTimeout(resolve, 500));

                  // Retry check after delay
                  if (typeof window !== 'undefined' &&
                    typeof window.executeSpecificFlow === 'function' &&
                    typeof window.getFlowChainInfo === 'function') {
                    console.log('Flow integration system now available, retrying...');

                    // Retry the entire button click flow
                    try {
                      const flowChains = window.getFlowChainInfo!();
                      const buttonFlow = flowChains.find((chain: any) => {
                        if (!chain.startNode) return false;
                        const config = chain.startNode.config || {};
                        return config.buttonId === 'id-17710796453655651' ||
                          config.componentId === 'id-17710796453655651' ||
                          chain.startNode.id === 'id-17710796453655651';
                      });

                      if (buttonFlow) {
                        const clickData = {
                          ...formData,
                          buttonId: 'id-17710796453655651',
                          formId: formId,
                          formData: formData,
                          clickTimestamp: new Date().toISOString(),
                          trigger: 'button-click-retry'
                        };

                        console.log('Retry: Executing specific flow:', buttonFlow.id);
                        const result = await window.executeSpecificFlow!(buttonFlow.id, clickData);
                        console.log('Retry successful:', result);
                        return result;
                      }
                    } catch (retryError) {
                      console.error('Retry failed:', retryError);
                    }
                  }

                  console.error('No flow system available after retry');
                  return {
                    success: false,
                    error: 'Flow integration system not available. Please refresh the page and try again.',
                    buttonId: 'id-17710796453655651',
                    details: 'executeSpecificFlow function not available even after retry'
                  };
                }
              } catch (error: any) {
                console.error('Flow integration error:', error);
                return {
                  success: false,
                  error: error.message || 'Unknown error',
                  buttonId: 'id-17710796453655651'
                };
              }
            }}>Submit</button>
          </div>
        </div>
      </div>

    </>
  );
}