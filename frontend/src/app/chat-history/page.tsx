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


export default function ChatHistory() {
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

  const scripts_component_1770967512513_9303_onload = [
    { id: "73927903-bec2-4571-a9e7-5feec5519818", name: "whatsapppchathistory", order: 0, code: "// ===============================\n// Vitality Chat History - WhatsApp Style with HTTP Fetch - FIXED\n// Input var: userData (Array<Object> with id, name, phonenumber)\n// Fetches chat_history via HTTP when user is selected\n// ===============================\n\nconst root = (typeof element !== 'undefined' && element) ? element : (typeof document !== 'undefined' ? (document.getElementById('root') || document.body) : null);\nif (!root) { /* noop */ }\nelse root.innerHTML = `\n  <style>\n    * {\n      margin: 0;\n      padding: 0;\n      box-sizing: border-box;\n    }\n    \n    body {\n      font-family: 'Segoe UI', Helvetica, Arial, sans-serif;\n    }\n    \n    .scrollbar::-webkit-scrollbar {\n      width: 6px;\n    }\n    \n    .scrollbar::-webkit-scrollbar-track {\n      background: transparent;\n    }\n    \n    .scrollbar::-webkit-scrollbar-thumb {\n      background: rgba(255, 255, 255, 0.1);\n      border-radius: 3px;\n    }\n  </style>\n\n  <div id=\"whatsappWrap\" style=\"display: flex; width: 100%; min-height: 100vh; background: #111b21; overflow: hidden; font-family: 'Segoe UI', Helvetica, Arial, sans-serif;\">\n    \n    <!-- Vitality Sidebar -->\n    <div style=\"\n      width: 280px;\n      min-height: 100vh;\n      background: #1a1a1a;\n      display: flex;\n      flex-direction: column;\n      flex-shrink: 0;\n      border-right: 1px solid #2a2a2a;\n    \">\n      <!-- Logo -->\n      <div style=\"padding: 24px 20px; text-align: center; border-bottom: 1px solid #2a2a2a;\">\n        <div style=\"width: 60px; height: 60px; margin: 0 auto 8px;\">\n          <svg viewBox=\"0 0 200 200\" xmlns=\"http://www.w3.org/2000/svg\">\n            <rect x=\"85\" y=\"30\" width=\"30\" height=\"140\" fill=\"#22c55e\" rx=\"4\"/>\n            <rect x=\"30\" y=\"85\" width=\"140\" height=\"30\" fill=\"#22c55e\" rx=\"4\"/>\n            <path d=\"M 50 60 L 70 60 L 70 80 L 55 80 Q 50 80 50 75 Z\" fill=\"#9333ea\"/>\n            <circle cx=\"45\" cy=\"55\" r=\"8\" fill=\"#9333ea\"/>\n            <path d=\"M 130 60 L 150 60 L 150 75 Q 150 80 145 80 L 130 80 Z\" fill=\"#ef4444\"/>\n            <circle cx=\"155\" cy=\"55\" r=\"8\" fill=\"#ef4444\"/>\n            <path d=\"M 50 120 L 70 120 L 70 140 L 50 140 L 50 125 Q 50 120 55 120 Z\" fill=\"#eab308\"/>\n            <circle cx=\"45\" cy=\"145\" r=\"8\" fill=\"#eab308\"/>\n            <path d=\"M 130 120 L 145 120 Q 150 120 150 125 L 150 140 L 130 140 Z\" fill=\"#3b82f6\"/>\n            <circle cx=\"155\" cy=\"145\" r=\"8\" fill=\"#3b82f6\"/>\n          </svg>\n        </div>\n        <div style=\"font-size: 20px; font-weight: 700; color: #22c55e;\">Vitality</div>\n        <div style=\"font-size: 10px; color: #9333ea; font-weight: 500;\">Research Centre</div>\n      </div>\n      \n      <!-- Menu -->\n      <div style=\"flex: 1; padding: 16px 12px; overflow-y: auto;\">\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin-bottom: 6px; border-radius: 8px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 14px;\">\n          <span style=\"font-size: 18px;\"></span>\n          <span>Dashboard</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin-bottom: 6px; border-radius: 8px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 14px;\">\n          <span style=\"font-size: 18px;\"></span>\n          <span>Chat-Bot Engagement</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin-bottom: 6px; border-radius: 8px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 14px;\">\n          <span style=\"font-size: 18px;\"></span>\n          <span>User Directory</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin-bottom: 6px; border-radius: 8px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 14px;\">\n          <span style=\"font-size: 18px;\"></span>\n          <span>Orientation Calls</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin-bottom: 6px; border-radius: 8px; cursor: pointer; background: transparent; color: #e5e5e5; font-size: 14px;\">\n          <span style=\"font-size: 18px;\"></span>\n          <span>Form Submissions</span>\n        </div>\n        <div style=\"display: flex; align-items: center; gap: 12px; padding: 12px 14px; margin-bottom: 6px; border-radius: 8px; cursor: pointer; background: #00c853; color: #000; font-size: 14px; font-weight: 600;\">\n          <span style=\"font-size: 18px;\"></span>\n          <span>Chat History</span>\n        </div>\n      </div>\n      \n      <!-- Footer -->\n      <div style=\"padding: 12px; border-top: 1px solid #2a2a2a; font-size: 9px; color: #555; text-align: center;\">\n        Â© 2025 Vitality Research Centre\n      </div>\n    </div>\n\n    <!-- Chat List Panel -->\n    <div style=\"\n      width: 420px;\n      min-height: 100vh;\n      background: #111b21;\n      display: flex;\n      flex-direction: column;\n      border-right: 1px solid #222d34;\n      flex-shrink: 0;\n    \">\n      <!-- Header -->\n      <div style=\"\n        background: #202c33;\n        padding: 10px 16px;\n        display: flex;\n        align-items: center;\n        justify-content: space-between;\n        border-bottom: 1px solid #111b21;\n      \">\n        <h1 style=\"color: #00a884; font-size: 22px; font-weight: 400; margin: 0;\">WhatsApp</h1>\n        <div style=\"display: flex; gap: 24px;\">\n          <button style=\"background: transparent; border: 0; cursor: pointer; padding: 8px;\">\n            <svg width=\"24\" height=\"24\" fill=\"#aebac1\" viewBox=\"0 0 24 24\">\n              <path d=\"M12 20.664a9.163 9.163 0 01-6.521-2.702.977.977 0 01.342-1.614l2.85-.96a.977.977 0 011.25.56l.73 1.827c.313-.097.627-.214.94-.35.313-.136.617-.29.911-.462l-1.332-2.273a.977.977 0 01.214-1.25l2.073-1.665a.977.977 0 011.439.144l1.267 1.902c.311-.227.613-.469.904-.725.29-.256.566-.526.827-.81l-1.902-1.267a.977.977 0 01-.144-1.439l1.665-2.073a.977.977 0 011.25-.214l2.273 1.332c.172-.294.326-.598.462-.911.136-.313.253-.627.35-.94l-1.827-.73a.977.977 0 01-.56-1.25l.96-2.85a.977.977 0 011.614-.342A9.163 9.163 0 0121.336 12c0 5.153-4.183 9.336-9.336 9.336z\"/>\n            </svg>\n          </button>\n          <button style=\"background: transparent; border: 0; cursor: pointer; padding: 8px;\">\n            <svg width=\"24\" height=\"24\" fill=\"#aebac1\" viewBox=\"0 0 24 24\">\n              <path d=\"M12 7a2 2 0 100-4 2 2 0 000 4zm0 7a2 2 0 100-4 2 2 0 000 4zm0 7a2 2 0 100-4 2 2 0 000 4z\"/>\n            </svg>\n          </button>\n        </div>\n      </div>\n\n      <!-- Search -->\n      <div style=\"background: #202c33; padding: 8px 12px;\">\n        <div style=\"\n          background: #111b21;\n          border-radius: 8px;\n          padding: 8px 12px;\n          display: flex;\n          align-items: center;\n          gap: 12px;\n        \">\n          <svg width=\"18\" height=\"18\" fill=\"#8696a0\" viewBox=\"0 0 24 24\">\n            <path d=\"M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z\"/>\n          </svg>\n          <input id=\"chatSearchInput\" placeholder=\"Search or start new chat\" style=\"\n            flex: 1;\n            background: transparent;\n            border: 0;\n            outline: 0;\n            color: #d1d7db;\n            font-size: 14px;\n          \"/>\n        </div>\n      </div>\n\n      <!-- Filter Tabs -->\n      <div style=\"\n        background: #111b21;\n        padding: 8px 12px;\n        display: flex;\n        gap: 8px;\n        border-bottom: 1px solid #222d34;\n      \">\n        <button class=\"filter-tab active\" data-filter=\"all\" style=\"\n          background: #00a884;\n          border: 0;\n          padding: 6px 12px;\n          border-radius: 16px;\n          color: #111b21;\n          font-size: 13px;\n          font-weight: 500;\n          cursor: pointer;\n        \">All</button>\n      </div>\n\n      <!-- Chat List -->\n      <div id=\"chatList\" class=\"scrollbar\" style=\"\n        flex: 1;\n        overflow-y: auto;\n        background: #111b21;\n      \"></div>\n    </div>\n\n    <!-- Chat View Panel -->\n    <div id=\"chatViewPanel\" style=\"\n      flex: 1;\n      min-height: 100vh;\n      background: #0b141a;\n      display: flex;\n      flex-direction: column;\n    \">\n      <!-- Welcome Screen -->\n      <div id=\"welcomeScreen\" style=\"\n        flex: 1;\n        display: flex;\n        flex-direction: column;\n        align-items: center;\n        justify-content: center;\n        padding: 40px;\n      \">\n        <div style=\"\n          width: 120px;\n          height: 120px;\n          background: #1e4535;\n          border-radius: 50%;\n          display: flex;\n          align-items: center;\n          justify-content: center;\n          margin-bottom: 24px;\n        \">\n          <svg width=\"60\" height=\"60\" fill=\"#00a884\" viewBox=\"0 0 24 24\">\n            <path d=\"M12.072 1.761a10.05 10.05 0 00-9.303 5.65.977.977 0 01-1.756-.855 12 12 0 0122.096-.053.977.977 0 01-1.756.855A10.05 10.05 0 0012.072 1.761z\"/>\n          </svg>\n        </div>\n        <h2 style=\"color: #e9edef; font-size: 32px; font-weight: 300; margin-bottom: 16px;\">WhatsApp Web</h2>\n        <p style=\"color: #8696a0; font-size: 14px; text-align: center; line-height: 20px; max-width: 520px;\">\n          Send and receive messages without keeping your phone online. Use WhatsApp on up to 4 linked devices.\n        </p>\n        <div style=\"display: flex; gap: 8px; margin-top: 24px;\">\n          <div style=\"width: 8px; height: 8px; background: #00a884; border-radius: 50%; opacity: 0.8;\"></div>\n          <div style=\"width: 8px; height: 8px; background: #00a884; border-radius: 50%; opacity: 0.4;\"></div>\n        </div>\n      </div>\n\n      <!-- Chat Header (hidden by default) -->\n      <div id=\"chatHeader\" style=\"\n        display: none;\n        background: #202c33;\n        padding: 10px 16px;\n        align-items: center;\n        gap: 12px;\n        border-bottom: 1px solid #111b21;\n      \">\n        <div id=\"chatAvatar\" style=\"\n          width: 40px;\n          height: 40px;\n          border-radius: 50%;\n          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n          display: flex;\n          align-items: center;\n          justify-content: center;\n          color: #fff;\n          font-weight: 600;\n          font-size: 16px;\n          cursor: pointer;\n        \"></div>\n        <div style=\"flex: 1; cursor: pointer;\">\n          <div id=\"chatHeaderName\" style=\"color: #e9edef; font-size: 16px; font-weight: 400;\"></div>\n          <div id=\"chatHeaderStatus\" style=\"color: #00a884; font-size: 13px; margin-top: 2px;\">online</div>\n        </div>\n        <div style=\"display: flex; gap: 24px;\">\n          <button style=\"background: transparent; border: 0; cursor: pointer; padding: 8px;\">\n            <svg width=\"24\" height=\"24\" fill=\"#aebac1\" viewBox=\"0 0 24 24\">\n              <path d=\"M15.5 14h-.79l-.28-.27A6.471 6.471 0 0016 9.5 6.5 6.5 0 109.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z\"/>\n            </svg>\n          </button>\n          <button id=\"showContactInfo\" style=\"background: transparent; border: 0; cursor: pointer; padding: 8px;\">\n            <svg width=\"24\" height=\"24\" fill=\"#aebac1\" viewBox=\"0 0 24 24\">\n              <path d=\"M12 7a2 2 0 100-4 2 2 0 000 4zm0 7a2 2 0 100-4 2 2 0 000 4zm0 7a2 2 0 100-4 2 2 0 000 4z\"/>\n            </svg>\n          </button>\n        </div>\n      </div>\n\n      <!-- Messages Area (hidden by default) -->\n      <div id=\"messagesArea\" style=\"\n        display: none;\n        flex: 1;\n        overflow-y: auto;\n        overflow-x: hidden;\n        padding: 20px 80px;\n        background-image: url(/uploads/image_1771058927316_80pksi_0.png);\n        background-repeat: repeat;\n        background-color: #0b141a;\n        flex-direction: column;\n        gap: 2px;\n      \" class=\"scrollbar\"></div>\n\n      <!-- Message Input (hidden by default) -->\n      <div id=\"messageInputArea\" style=\"\n        display: none;\n        background: #202c33;\n        padding: 10px 16px;\n        gap: 12px;\n        align-items: center;\n        border-top: 1px solid #111b21;\n      \">\n        <button style=\"background: transparent; border: 0; cursor: pointer; padding: 8px;\">\n          <svg width=\"26\" height=\"26\" fill=\"#8696a0\" viewBox=\"0 0 24 24\">\n            <path d=\"M9.153 11.603c.795 0 1.439-.879 1.439-1.962s-.644-1.962-1.439-1.962-1.439.879-1.439 1.962.644 1.962 1.439 1.962zm-3.204 1.362c-.026-.307-.131 5.218 6.063 5.551 6.066-.25 6.066-5.551 6.066-5.551-6.078 1.416-12.129 0-12.129 0z\"/>\n          </svg>\n        </button>\n        <button style=\"background: transparent; border: 0; cursor: pointer; padding: 8px;\">\n          <svg width=\"26\" height=\"26\" fill=\"#8696a0\" viewBox=\"0 0 24 24\">\n            <path d=\"M1.816 15.556v.002c0 1.502.584 2.912 1.646 3.972s2.472 1.647 3.974 1.647a5.58 5.58 0 003.972-1.645l9.547-9.548c.769-.768 1.147-1.766 1.058-2.817-.079-.968-.548-1.927-1.319-2.698-1.594-1.592-4.068-1.711-5.517-.262l-7.916 7.915c-.881.881-.792 2.25.214 3.261.959.958 2.423 1.053 3.263.215l5.511-5.512c.28-.28.267-.722.053-.936l-.244-.244c-.191-.191-.567-.349-.957.04l-5.506 5.506c-.18.18-.635.127-.976-.214-.098-.097-.576-.613-.213-.973l7.915-7.917c.818-.817 2.267-.699 3.23.262.5.501.802 1.1.849 1.685.051.573-.156 1.111-.589 1.543l-9.547 9.549a3.97 3.97 0 01-2.829 1.171 3.975 3.975 0 01-2.83-1.173 3.973 3.973 0 01-1.172-2.828c0-1.071.415-2.076 1.172-2.83l7.209-7.211c.157-.157.264-.579.028-.814L11.5 4.36a.572.572 0 00-.834.018l-7.205 7.207a5.577 5.577 0 00-1.645 3.971z\"/>\n          </svg>\n        </button>\n        <div style=\"flex: 1; background: #2a3942; border-radius: 8px; padding: 10px 12px; display: flex; align-items: center;\">\n          <input id=\"messageInput\" placeholder=\"Type a message...\" style=\"\n            flex: 1;\n            background: transparent;\n            border: 0;\n            outline: 0;\n            color: #e9edef;\n            font-size: 15px;\n          \"/>\n        </div>\n        <button id=\"sendMessageBtn\" style=\"background: transparent; border: 0; cursor: pointer; padding: 8px;\">\n          <svg width=\"26\" height=\"26\" fill=\"#8696a0\" viewBox=\"0 0 24 24\">\n            <path d=\"M1.101 21.757L23.8 12.028 1.101 2.3l.011 7.912 13.623 1.816-13.623 1.817-.011 7.912z\"/>\n          </svg>\n        </button>\n      </div>\n    </div>\n\n    <!-- Contact Info Panel (hidden by default) -->\n    <div id=\"contactInfoPanel\" style=\"\n      display: none;\n      width: 420px;\n      min-height: 100vh;\n      background: #111b21;\n      flex-direction: column;\n      border-left: 1px solid #222d34;\n      flex-shrink: 0;\n    \">\n      <!-- Header -->\n      <div style=\"\n        background: #202c33;\n        padding: 20px 24px;\n        display: flex;\n        align-items: center;\n        gap: 24px;\n      \">\n        <button id=\"closeContactInfo\" style=\"background: transparent; border: 0; cursor: pointer; padding: 8px; margin-left: -8px;\">\n          <svg width=\"24\" height=\"24\" fill=\"#aebac1\" viewBox=\"0 0 24 24\">\n            <path d=\"M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z\"/>\n          </svg>\n        </button>\n        <h2 style=\"color: #e9edef; font-size: 19px; font-weight: 400; margin: 0;\">Contact info</h2>\n      </div>\n\n      <!-- Contact Info Content -->\n      <div class=\"scrollbar\" style=\"flex: 1; overflow-y: auto;\">\n        <!-- Avatar -->\n        <div style=\"background: #202c33; padding: 28px; text-align: center;\">\n          <div id=\"contactAvatar\" style=\"\n            width: 200px;\n            height: 200px;\n            border-radius: 50%;\n            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            color: #fff;\n            font-weight: 600;\n            font-size: 72px;\n            margin: 0 auto;\n          \"></div>\n        </div>\n\n        <!-- Name -->\n        <div style=\"background: #111b21; padding: 14px 30px;\">\n          <div style=\"color: #00a884; font-size: 13px; margin-bottom: 4px;\">NAME</div>\n          <div id=\"contactName\" style=\"color: #e9edef; font-size: 16px;\"></div>\n        </div>\n\n        <!-- About -->\n        <div style=\"background: #111b21; padding: 14px 30px; margin-top: 10px;\">\n          <div style=\"color: #00a884; font-size: 13px; margin-bottom: 4px;\">ABOUT</div>\n          <div id=\"contactAbout\" style=\"color: #e9edef; font-size: 16px;\">Hey there! I am using WhatsApp.</div>\n        </div>\n\n        <!-- Phone -->\n        <div style=\"background: #111b21; padding: 14px 30px; margin-top: 10px;\">\n          <div style=\"color: #00a884; font-size: 13px; margin-bottom: 4px;\">PHONE</div>\n          <div id=\"contactPhone\" style=\"color: #e9edef; font-size: 16px;\">Not available</div>\n        </div>\n\n        <!-- Actions -->\n        <div style=\"background: #111b21; padding: 20px 30px; margin-top: 10px; display: flex; gap: 24px;\">\n          <button style=\"\n            flex: 1;\n            background: transparent;\n            border: 1px solid #00a884;\n            padding: 10px 20px;\n            border-radius: 20px;\n            color: #00a884;\n            font-size: 14px;\n            cursor: pointer;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            gap: 8px;\n          \">\n            <svg width=\"20\" height=\"20\" fill=\"#00a884\" viewBox=\"0 0 24 24\">\n              <path d=\"M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z\"/>\n            </svg>\n            Message\n          </button>\n          <button style=\"\n            flex: 1;\n            background: transparent;\n            border: 1px solid #00a884;\n            padding: 10px 20px;\n            border-radius: 20px;\n            color: #00a884;\n            font-size: 14px;\n            cursor: pointer;\n            display: flex;\n            align-items: center;\n            justify-content: center;\n            gap: 8px;\n          \">\n            <svg width=\"20\" height=\"20\" fill=\"#00a884\" viewBox=\"0 0 24 24\">\n              <path d=\"M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z\"/>\n            </svg>\n            Call\n          </button>\n        </div>\n\n        <!-- Last Seen -->\n        <div style=\"background: #111b21; padding: 14px 30px; margin-top: 10px;\">\n          <div style=\"color: #00a884; font-size: 13px; margin-bottom: 4px;\">LAST SEEN</div>\n          <div style=\"color: #e9edef; font-size: 16px;\">online</div>\n        </div>\n\n        <!-- Groups in Common -->\n        <div style=\"background: #111b21; padding: 14px 30px; margin-top: 10px;\">\n          <div style=\"color: #8696a0; font-size: 13px;\">Groups in common</div>\n        </div>\n      </div>\n    </div>\n\n  </div>\n`;\n\nconst $ = (id) => document.getElementById(id);\n\n// Rest of the JavaScript code (keeping all backend integration)\nconst getInputData = () => {\n  const keys = ['userData','users','user_list','userList','contacts','contact_list','contactList','chat_users','chatUsers','participants','members','list','httpResult','httpResult_raw','httpResponse','httpResponse_raw','response','result','data','payload','body','records','items','rows','chat_history','chatHistory'];\n\n  if (typeof scriptContext !== 'undefined' && scriptContext && typeof scriptContext.getData === 'function') {\n    for (const key of keys) {\n      const value = scriptContext.getData(key);\n      if (value !== undefined && value !== null) return value;\n    }\n  }\n\n  if (typeof parameters !== 'undefined' && parameters) {\n    for (const key of keys) {\n      if (parameters[key] !== undefined && parameters[key] !== null) return parameters[key];\n    }\n  }\n\n  if (typeof window !== 'undefined') {\n    const fr = window.flowResults || window.mainChainFlowResults;\n    if (fr) {\n      for (const key of keys) {\n        const direct = fr[key];\n        if (direct !== undefined && direct !== null) return direct;\n        const apiVal = fr.apiResponses && fr.apiResponses[key];\n        if (apiVal !== undefined && apiVal !== null) return apiVal;\n        const varVal = fr.variables && fr.variables[key];\n        if (varVal !== undefined && varVal !== null) return varVal;\n        const curVal = fr.currentResult && fr.currentResult[key];\n        if (curVal !== undefined && curVal !== null) return curVal;\n      }\n      if (fr.currentResult !== undefined && fr.currentResult !== null) return fr.currentResult;\n      return fr;\n    }\n  }\n\n  return null;\n};\n\nconst parseMaybeJson = (value) => {\n  if (typeof value !== 'string') return value;\n  try {\n    return JSON.parse(value);\n  } catch {\n    return value;\n  }\n};\n\nconst looksLikeUser = (obj) => {\n  if (!obj || typeof obj !== 'object') return false;\n  const keys = [\n    'name','Name','full_name','fullName','username','userName','user_name','contact_name','contactName','customerName',\n    'phone','phonenumber','phoneNumber','phone_number','mobile','number','msisdn','whatsapp_number','whatsappNumber',\n    'chat_history','chatHistory','message_history','messageHistory','messages','history','conversation','chat','logs'\n  ];\n  return keys.some((k) => obj[k] !== undefined && obj[k] !== null);\n};\n\nconst findUserArray = (value) => {\n  const data = parseMaybeJson(value);\n  if (Array.isArray(data)) return data;\n  if (data && typeof data === 'object') {\n    const keys = ['userData','users','user_list','userList','contacts','contact_list','contactList','chat_users','chatUsers','participants','members','list','data','result','results','items','records','rows','payload','body','httpResult','httpResult_raw','httpResponse','httpResponse_raw','response'];\n    for (const key of keys) {\n      if (Array.isArray(data[key])) return data[key];\n    }\n    const arrayValue = Object.values(data).find((v) => Array.isArray(v));\n    if (arrayValue) return arrayValue;\n    const mapValues = Object.values(data);\n    if (mapValues.length && mapValues.every((v) => v && typeof v === 'object') && mapValues.some(looksLikeUser)) {\n      return mapValues;\n    }\n    const stack = [data];\n    const seen = new Set();\n    while (stack.length) {\n      const current = stack.pop();\n      if (!current || typeof current !== 'object') continue;\n      if (seen.has(current)) continue;\n      seen.add(current);\n      if (Array.isArray(current)) {\n        if (current.length === 0) return current;\n        if (current.some((item) => looksLikeUser(item))) return current;\n      }\n      if (Array.isArray(current)) {\n        for (const item of current) stack.push(item);\n      } else {\n        for (const key in current) stack.push(current[key]);\n      }\n    }\n  }\n  return null;\n};\n\nconst normalizeUserData = (value) => {\n  const found = findUserArray(value);\n  return Array.isArray(found) ? found : [];\n};\n\nconst escapeHtml = (str) => String(str || '')\n  .replaceAll('&', '&amp;')\n  .replaceAll('<', '&lt;')\n  .replaceAll('>', '&gt;')\n  .replaceAll('\"', '&quot;')\n  .replaceAll(\"'\", '&#039;');\n\nconst parseChatHistory = (chatHistoryValue) => {\n  if (!chatHistoryValue) return [];\n\n  const toText = (val) => {\n    if (val === undefined || val === null) return '';\n    if (typeof val === 'string') return val;\n    if (typeof val === 'number' || typeof val === 'boolean') return String(val);\n    if (typeof val === 'object') {\n      const direct = val.text || val.message || val.content || val.body || val.value || val.data;\n      if (direct !== undefined && direct !== null) return String(direct);\n      try { return JSON.stringify(val); } catch { return String(val); }\n    }\n    return String(val);\n  };\n\n  const normalizeFrom = (val) => {\n    const s = String(val || '').toLowerCase();\n    if (s.includes('user')) return 'user';\n    if (s.includes('ai') || s.includes('assistant') || s.includes('bot')) return 'bot';\n    return s || 'user';\n  };\n\n  const normalizeMessage = (msg) => {\n    if (msg === undefined || msg === null) return null;\n    if (typeof msg === 'string') {\n      return { from: 'user', text: msg, timestamp: '' };\n    }\n    if (typeof msg !== 'object') {\n      return { from: 'user', text: toText(msg), timestamp: '' };\n    }\n    const from = normalizeFrom(msg.from || msg.role || msg.sender || msg.type);\n    const text = toText(msg.text || msg.message || msg.content || msg.body || msg.value || msg.data || msg);\n    const timestamp = msg.timestamp || msg.time || msg.created_at || msg.createdAt || '';\n    return { from, text, timestamp };\n  };\n\n  if (Array.isArray(chatHistoryValue)) {\n    return chatHistoryValue.map(normalizeMessage).filter(Boolean);\n  }\n\n  if (typeof chatHistoryValue === 'object') {\n    const nested = chatHistoryValue.messages || chatHistoryValue.chat_history || chatHistoryValue.chatHistory || chatHistoryValue.history || chatHistoryValue.data;\n    if (nested) return parseChatHistory(nested);\n    return [];\n  }\n\n  if (typeof chatHistoryValue === 'string') {\n    const messages = [];\n    const lines = chatHistoryValue.split('\\n');\n    for (let line of lines) {\n      line = line.trim();\n      if (!line) continue;\n      if (line.startsWith('User: ')) {\n        messages.push({ from: 'user', text: line.substring(6), timestamp: '' });\n      } else if (line.startsWith('AI: ')) {\n        messages.push({ from: 'bot', text: line.substring(4), timestamp: '' });\n      } else {\n        messages.push({ from: 'user', text: line, timestamp: '' });\n      }\n    }\n    return messages;\n  }\n\n  return [];\n};\n\nlet rawData = normalizeUserData(getInputData());\nlet filteredData = [...rawData];\nlet selectedIndex = -1;\nlet currentUserChatData = null;\n\nconst getAvatarColor = (name) => {\n  const colors = [\n    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',\n    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',\n    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',\n    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',\n    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',\n  ];\n  const index = name.charCodeAt(0) % colors.length;\n  return colors[index];\n};\n\nconst getUserName = (user) => {\n  if (!user) return 'Unknown';\n  return user.name || user.Name || user.full_name || user.fullName || user.username || user.userName || user.contact_name || user.contactName || user.customerName || 'Unknown';\n};\n\nconst getUserPhone = (user) => {\n  if (!user) return '';\n  return user.phonenumber || user.phone || user.phoneNumber || user.contact || user.mobile || user.number || user.whatsapp_number || user.whatsappNumber || '';\n};\n\nconst getUserChatHistory = (user) => {\n  if (!user) return null;\n  return user.chat_history || user.chatHistory || user.message_history || user.messageHistory || user.messages || user.history || user.conversation || user.chat || user.logs || null;\n};\n\nconst getLastMessagePreview = (user) => {\n  const history = getUserChatHistory(user);\n  if (!history) return 'No messages yet';\n  const messages = parseChatHistory(history);\n  if (messages.length === 0) return 'No messages yet';\n  const lastMsg = messages[messages.length - 1];\n  return lastMsg.text.substring(0, 40) + (lastMsg.text.length > 40 ? '...' : '');\n};\n\nconst renderChatList = () => {\n  const chatList = $('chatList');\n  if (!chatList) return;\n  \n  if (!filteredData.length) {\n    chatList.innerHTML = '<div style=\"padding:20px; text-align:center; color:#8696a0;\">No users found</div>';\n    return;\n  }\n  \n  chatList.innerHTML = filteredData.map((user, idx) => {\n    const isActive = idx === selectedIndex;\n    \n    return `\n    <div class=\"chat-item\" data-idx=\"${idx}\" style=\"\n      padding: 12px 16px;\n      display: flex;\n      align-items: center;\n      gap: 12px;\n      cursor: pointer;\n      background: ${isActive ? '#2a3942' : 'transparent'};\n      border-bottom: 1px solid #222d34;\n    \">\n      <div style=\"\n        width: 48px;\n        height: 48px;\n        border-radius: 50%;\n        background: ${getAvatarColor(getUserName(user) || 'U')};\n        display: flex;\n        align-items: center;\n        justify-content: center;\n        color: #fff;\n        font-weight: 600;\n        font-size: 18px;\n        flex-shrink: 0;\n      \">${getUserName(user) ? getUserName(user).charAt(0).toUpperCase() : '?'}</div>\n      <div style=\"flex: 1; min-width: 0;\">\n        <div style=\"display: flex; justify-content: space-between; margin-bottom: 2px;\">\n          <div style=\"color: #e9edef; font-size: 16px; font-weight: 400;\">${escapeHtml(getUserName(user) || 'Unknown')}</div>\n          <div style=\"color: #8696a0; font-size: 12px;\">Yesterday</div>\n        </div>\n        <div style=\"color: #8696a0; font-size: 14px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;\">${getLastMessagePreview(user)}</div>\n      </div>\n    </div>\n  `;\n  }).join('');\n  \n  document.querySelectorAll('.chat-item').forEach(item => {\n    item.addEventListener('click', () => {\n      selectedIndex = parseInt(item.dataset.idx);\n      renderChatList();\n      fetchAndDisplayChat(filteredData[selectedIndex]);\n    });\n  });\n};\n\nconst fetchAndDisplayChat = (user) => {\n  if (!user) return;\n  \n  currentUserChatData = user;\n  $('welcomeScreen').style.display = 'none';\n  $('chatHeader').style.display = 'flex';\n  $('messagesArea').style.display = 'flex';\n  $('messageInputArea').style.display = 'flex';\n  \n  $('chatAvatar').textContent = getUserName(user) ? getUserName(user).charAt(0).toUpperCase() : '?';\n  $('chatAvatar').style.background = getAvatarColor(getUserName(user) || 'U');\n  $('chatHeaderName').textContent = getUserName(user) || 'Unknown';\n  \n  renderMessages(user);\n};\n\nconst renderMessages = (user) => {\n  const messagesArea = $('messagesArea');\n  if (!messagesArea || !user) return;\n  \n  const messages = parseChatHistory(getUserChatHistory(user));\n  \n  if (!messages || messages.length === 0) {\n    messagesArea.innerHTML = '<div style=\"color:#8696a0; text-align:center;\">No messages yet</div>';\n    return;\n  }\n  \n  messagesArea.innerHTML = `\n    <div style=\"text-align: center; margin: 20px 0;\">\n      <div style=\"background: #202c33; color: #8696a0; padding: 6px 12px; border-radius: 8px; display: inline-block; font-size: 13px;\">Yesterday</div>\n    </div>\n    ${messages.map(msg => `\n      <div style=\"display: flex; justify-content: ${msg.from === 'user' ? 'flex-end' : 'flex-start'}; margin-bottom: 8px;\">\n        <div style=\"background: ${msg.from === 'user' ? '#005c4b' : '#202c33'}; color: #e9edef; padding: 6px 12px 8px; border-radius: 8px; max-width: 65%; font-size: 14.2px; line-height: 19px;\">\n          ${msg.from === 'user' ? `<div style=\"color: #00a884; font-size: 13px; font-weight: 500; margin-bottom: 4px;\">${escapeHtml(getUserName(user))}</div>` : ''}\n          <div>${escapeHtml(msg.text)}</div>\n          <div style=\"color: #8696a0; font-size: 11px; text-align: right; margin-top: 4px;\">7:23 PM</div>\n        </div>\n      </div>\n    `).join('')}\n  `;\n  \n  setTimeout(() => {\n    messagesArea.scrollTop = messagesArea.scrollHeight;\n  }, 50);\n};\n\n// Event listeners\nif ($('chatSearchInput')) {\n  $('chatSearchInput').addEventListener('input', () => {\n    const query = $('chatSearchInput').value.toLowerCase().trim();\n    if (!query) {\n      filteredData = [...rawData];\n    } else {\n      filteredData = rawData.filter((user) => {\n        const nameMatch = getUserName(user) && getUserName(user).toLowerCase().includes(query);\n        const phoneMatch = getUserPhone(user) && getUserPhone(user).toLowerCase().includes(query);\n        return nameMatch || phoneMatch;\n      });\n    }\n    selectedIndex = -1;\n    renderChatList();\n  });\n}\n\nconst areArraysEqualShallow = (a, b) => {\n  if (a === b) return true;\n  if (!Array.isArray(a) || !Array.isArray(b)) return false;\n  if (a.length !== b.length) return false;\n  for (let i = 0; i < a.length; i++) {\n    if (a[i] !== b[i]) return false;\n  }\n  return true;\n};\n\nconst refreshUserList = () => {\n  const next = normalizeUserData(getInputData());\n  if (!areArraysEqualShallow(next, rawData)) {\n    rawData = next;\n    filteredData = [...rawData];\n    selectedIndex = -1;\n    renderChatList();\n  }\n};\n\nif (typeof window !== 'undefined') {\n  const handler = (evt) => {\n    const detail = evt && evt.detail ? evt.detail : {};\n    const relevantKeys = ['userData','users','user_list','userList','contacts','contact_list','contactList','chat_users','chatUsers','participants','members','list','httpResult','httpResult_raw','httpResponse','httpResponse_raw','response','result','data','payload','body','records','items','rows','chat_history','chatHistory'];\n    if (!detail.key || relevantKeys.includes(detail.key)) {\n      refreshUserList();\n    }\n  };\n  window.addEventListener('__scriptContextChange', handler);\n  if (typeof onCleanup === 'function') {\n    onCleanup(() => window.removeEventListener('__scriptContextChange', handler));\n  }\n}\n\nif ($('showContactInfo')) {\n  $('showContactInfo').addEventListener('click', () => {\n    if (!currentUserChatData) return;\n    $('contactInfoPanel').style.display = 'flex';\n    const name = getUserName(currentUserChatData);\n    const phone = getUserPhone(currentUserChatData);\n    $('contactAvatar').textContent = name ? name.charAt(0).toUpperCase() : '?';\n    $('contactAvatar').style.background = getAvatarColor(name || 'U');\n    $('contactName').textContent = name || 'Unknown';\n    $('contactPhone').textContent = phone || 'Not available';\n  });\n}\n\nif ($('closeContactInfo')) {\n  $('closeContactInfo').addEventListener('click', () => {\n    $('contactInfoPanel').style.display = 'none';\n  });\n}\n\n// Initialize\ntry {\n  renderChatList();\n  refreshUserList();\n  if (typeof window !== 'undefined') {\n    setTimeout(refreshUserList, 250);\n    setTimeout(refreshUserList, 1000);\n  }\n  if (typeof output !== 'undefined') {\n    output.action = '';\n    output.selectedUser = null;\n  }\n} catch (error) {\n  console.error('Init error:', error);\n}", input_variables: [{ "name": "userData", "type": "array<object> with id, name, phonenumber", "source": "custom", "description": "Input variable: userData" }], output_variables: [], scriptElementOverrides: { "auto-wi2o5o": { "attributes": { "onclick": "if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17702826114826988'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17702826114826988'); } return false;", "data-page-link": "page-17702826114826988", "data-link-to-page": "Form Submission" } }, "auto-wi2o5p": { "attributes": { "onclick": "if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17702812000504656'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17702812000504656'); } return false;", "data-page-link": "page-17702812000504656", "data-link-to-page": "Orientation Calls" } }, "auto-wi2o5q": { "attributes": { "onclick": "if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17709737292499859'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17709737292499859'); } return false;", "data-page-link": "page-17709737292499859", "data-link-to-page": "Userdirectory" } }, "auto-wi2o5r": { "attributes": { "onclick": "if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-1770985628551516'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-1770985628551516'); } return false;", "data-page-link": "page-1770985628551516", "data-link-to-page": "chatbot" } }, "auto-wi2o5s": { "attributes": { "onclick": "if (typeof window !== 'undefined' && typeof window.navigateToPage === 'function') { window.navigateToPage('page-17710071952151647'); } else if (typeof window !== 'undefined' && window.parent && typeof window.parent.navigateToPage === 'function') { window.parent.navigateToPage('page-17710071952151647'); } return false;", "data-page-link": "page-17710071952151647", "data-link-to-page": "Dashboard" } } } }
  ];
  React.useEffect(() => {
    const element = document.getElementById('component-1770967512513-9303') || document.querySelector('[data-component-id="component-1770967512513-9303"]');
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
      componentId: 'component-1770967512513-9303',
      eventType: 'onload',
      scripts: scripts_component_1770967512513_9303_onload,
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
        <div style={{ width: "100%", border: "none", display: "block", padding: "0.5rem", gridArea: "1 / 1 / 27 / 13", overflow: "hidden", minHeight: "780px", gridRowEnd: 27, paddingTop: "0", gridRowStart: 1, paddingLeft: "0", gridColumnEnd: 13, paddingRight: "0", paddingBottom: "0", backgroundColor: "#fff", gridColumnStart: 1 }} id="component-1770967512513-9303"></div>
      </div>

    </>
  );
}