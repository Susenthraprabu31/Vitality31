
// ===== FLOW INTEGRATION INDEX =====
// This file imports all workflow files and provides a unified API

import { 
  executeAllFlows as sharedExecuteAllFlows,
  executeSpecificFlow as sharedExecuteSpecificFlow,
  getFlowChainInfo as sharedGetFlowChainInfo,
  workflowRegistry
} from './flow-integration-shared';

import * as workflow_ec752534_cb48_4b71_ae77_9515064d28da from './flow-integration-workflow-ec752534_cb48_4b71_ae77_9515064d28da';
import * as workflow_ef318095_b9e4_4411_85ff_7101d236ec68 from './flow-integration-workflow-ef318095_b9e4_4411_85ff_7101d236ec68';
import * as workflow_b591165e_cdb2_40e2_9511_80a2b5cf4023 from './flow-integration-workflow-b591165e_cdb2_40e2_9511_80a2b5cf4023';
import * as workflow_0bbee0df_8a91_4dde_b198_f52da418e965 from './flow-integration-workflow-0bbee0df_8a91_4dde_b198_f52da418e965';
import * as workflow_5e4a3799_4263_4485_bae2_4a5cd25642ee from './flow-integration-workflow-5e4a3799_4263_4485_bae2_4a5cd25642ee';
import * as workflow_1bef36f6_6d8d_46d6_8a0d_b38b3cb933c8 from './flow-integration-workflow-1bef36f6_6d8d_46d6_8a0d_b38b3cb933c8';
import * as workflow_0f125a6c_9f6d_4a74_97ad_735d4aceeefa from './flow-integration-workflow-0f125a6c_9f6d_4a74_97ad_735d4aceeefa';
import * as workflow_740eb982_a576_4557_b356_1d94d06e31a1 from './flow-integration-workflow-740eb982_a576_4557_b356_1d94d06e31a1';
import * as workflow_fa262b65_a18f_4bb0_b8c8_40f4dfe655b4 from './flow-integration-workflow-fa262b65_a18f_4bb0_b8c8_40f4dfe655b4';
import * as workflow_e91e43e6_efef_4f58_8399_8652d0e0dd3d from './flow-integration-workflow-e91e43e6_efef_4f58_8399_8652d0e0dd3d';
import * as workflow_12be9d6c_c471_4b13_bb9f_9676dcd2c516 from './flow-integration-workflow-12be9d6c_c471_4b13_bb9f_9676dcd2c516';

// Register all workflows
  workflowRegistry.workflows.set('ec752534-cb48-4b71-ae77-9515064d28da', {
    execute: workflow_ec752534_cb48_4b71_ae77_9515064d28da.executeAllFlows || (async () => ({ success: false, error: 'No execute function' })),
    getChainInfo: workflow_ec752534_cb48_4b71_ae77_9515064d28da.getFlowChainInfo || (() => [])
  });
  workflowRegistry.workflows.set('ef318095-b9e4-4411-85ff-7101d236ec68', {
    execute: workflow_ef318095_b9e4_4411_85ff_7101d236ec68.executeAllFlows || (async () => ({ success: false, error: 'No execute function' })),
    getChainInfo: workflow_ef318095_b9e4_4411_85ff_7101d236ec68.getFlowChainInfo || (() => [])
  });
  workflowRegistry.workflows.set('b591165e-cdb2-40e2-9511-80a2b5cf4023', {
    execute: workflow_b591165e_cdb2_40e2_9511_80a2b5cf4023.executeAllFlows || (async () => ({ success: false, error: 'No execute function' })),
    getChainInfo: workflow_b591165e_cdb2_40e2_9511_80a2b5cf4023.getFlowChainInfo || (() => [])
  });
  workflowRegistry.workflows.set('0bbee0df-8a91-4dde-b198-f52da418e965', {
    execute: workflow_0bbee0df_8a91_4dde_b198_f52da418e965.executeAllFlows || (async () => ({ success: false, error: 'No execute function' })),
    getChainInfo: workflow_0bbee0df_8a91_4dde_b198_f52da418e965.getFlowChainInfo || (() => [])
  });
  workflowRegistry.workflows.set('5e4a3799-4263-4485-bae2-4a5cd25642ee', {
    execute: workflow_5e4a3799_4263_4485_bae2_4a5cd25642ee.executeAllFlows || (async () => ({ success: false, error: 'No execute function' })),
    getChainInfo: workflow_5e4a3799_4263_4485_bae2_4a5cd25642ee.getFlowChainInfo || (() => [])
  });
  workflowRegistry.workflows.set('1bef36f6-6d8d-46d6-8a0d-b38b3cb933c8', {
    execute: workflow_1bef36f6_6d8d_46d6_8a0d_b38b3cb933c8.executeAllFlows || (async () => ({ success: false, error: 'No execute function' })),
    getChainInfo: workflow_1bef36f6_6d8d_46d6_8a0d_b38b3cb933c8.getFlowChainInfo || (() => [])
  });
  workflowRegistry.workflows.set('0f125a6c-9f6d-4a74-97ad-735d4aceeefa', {
    execute: workflow_0f125a6c_9f6d_4a74_97ad_735d4aceeefa.executeAllFlows || (async () => ({ success: false, error: 'No execute function' })),
    getChainInfo: workflow_0f125a6c_9f6d_4a74_97ad_735d4aceeefa.getFlowChainInfo || (() => [])
  });
  workflowRegistry.workflows.set('740eb982-a576-4557-b356-1d94d06e31a1', {
    execute: workflow_740eb982_a576_4557_b356_1d94d06e31a1.executeAllFlows || (async () => ({ success: false, error: 'No execute function' })),
    getChainInfo: workflow_740eb982_a576_4557_b356_1d94d06e31a1.getFlowChainInfo || (() => [])
  });
  workflowRegistry.workflows.set('fa262b65-a18f-4bb0-b8c8-40f4dfe655b4', {
    execute: workflow_fa262b65_a18f_4bb0_b8c8_40f4dfe655b4.executeAllFlows || (async () => ({ success: false, error: 'No execute function' })),
    getChainInfo: workflow_fa262b65_a18f_4bb0_b8c8_40f4dfe655b4.getFlowChainInfo || (() => [])
  });
  workflowRegistry.workflows.set('e91e43e6-efef-4f58-8399-8652d0e0dd3d', {
    execute: workflow_e91e43e6_efef_4f58_8399_8652d0e0dd3d.executeAllFlows || (async () => ({ success: false, error: 'No execute function' })),
    getChainInfo: workflow_e91e43e6_efef_4f58_8399_8652d0e0dd3d.getFlowChainInfo || (() => [])
  });
  workflowRegistry.workflows.set('12be9d6c-c471-4b13-bb9f-9676dcd2c516', {
    execute: workflow_12be9d6c_c471_4b13_bb9f_9676dcd2c516.executeAllFlows || (async () => ({ success: false, error: 'No execute function' })),
    getChainInfo: workflow_12be9d6c_c471_4b13_bb9f_9676dcd2c516.getFlowChainInfo || (() => [])
  });

// Collect all chain info from all workflows
const getAllChainInfo = (): any[] => {
  const allChains: any[] = [];
    try {
    if (typeof workflow_ec752534_cb48_4b71_ae77_9515064d28da !== 'undefined' && workflow_ec752534_cb48_4b71_ae77_9515064d28da.getFlowChainInfo) {
      const chains = workflow_ec752534_cb48_4b71_ae77_9515064d28da.getFlowChainInfo();
      if (Array.isArray(chains) && chains.length > 0) {
        allChains.push(...chains);
      }
    } else {
      console.warn('Workflow ec752534_cb48_4b71_ae77_9515064d28da module not available or missing getFlowChainInfo');
    }
  } catch (e) {
    console.error('Failed to get chain info from workflow ec752534_cb48_4b71_ae77_9515064d28da:', e);
  }
  try {
    if (typeof workflow_ef318095_b9e4_4411_85ff_7101d236ec68 !== 'undefined' && workflow_ef318095_b9e4_4411_85ff_7101d236ec68.getFlowChainInfo) {
      const chains = workflow_ef318095_b9e4_4411_85ff_7101d236ec68.getFlowChainInfo();
      if (Array.isArray(chains) && chains.length > 0) {
        allChains.push(...chains);
      }
    } else {
      console.warn('Workflow ef318095_b9e4_4411_85ff_7101d236ec68 module not available or missing getFlowChainInfo');
    }
  } catch (e) {
    console.error('Failed to get chain info from workflow ef318095_b9e4_4411_85ff_7101d236ec68:', e);
  }
  try {
    if (typeof workflow_b591165e_cdb2_40e2_9511_80a2b5cf4023 !== 'undefined' && workflow_b591165e_cdb2_40e2_9511_80a2b5cf4023.getFlowChainInfo) {
      const chains = workflow_b591165e_cdb2_40e2_9511_80a2b5cf4023.getFlowChainInfo();
      if (Array.isArray(chains) && chains.length > 0) {
        allChains.push(...chains);
      }
    } else {
      console.warn('Workflow b591165e_cdb2_40e2_9511_80a2b5cf4023 module not available or missing getFlowChainInfo');
    }
  } catch (e) {
    console.error('Failed to get chain info from workflow b591165e_cdb2_40e2_9511_80a2b5cf4023:', e);
  }
  try {
    if (typeof workflow_0bbee0df_8a91_4dde_b198_f52da418e965 !== 'undefined' && workflow_0bbee0df_8a91_4dde_b198_f52da418e965.getFlowChainInfo) {
      const chains = workflow_0bbee0df_8a91_4dde_b198_f52da418e965.getFlowChainInfo();
      if (Array.isArray(chains) && chains.length > 0) {
        allChains.push(...chains);
      }
    } else {
      console.warn('Workflow 0bbee0df_8a91_4dde_b198_f52da418e965 module not available or missing getFlowChainInfo');
    }
  } catch (e) {
    console.error('Failed to get chain info from workflow 0bbee0df_8a91_4dde_b198_f52da418e965:', e);
  }
  try {
    if (typeof workflow_5e4a3799_4263_4485_bae2_4a5cd25642ee !== 'undefined' && workflow_5e4a3799_4263_4485_bae2_4a5cd25642ee.getFlowChainInfo) {
      const chains = workflow_5e4a3799_4263_4485_bae2_4a5cd25642ee.getFlowChainInfo();
      if (Array.isArray(chains) && chains.length > 0) {
        allChains.push(...chains);
      }
    } else {
      console.warn('Workflow 5e4a3799_4263_4485_bae2_4a5cd25642ee module not available or missing getFlowChainInfo');
    }
  } catch (e) {
    console.error('Failed to get chain info from workflow 5e4a3799_4263_4485_bae2_4a5cd25642ee:', e);
  }
  try {
    if (typeof workflow_1bef36f6_6d8d_46d6_8a0d_b38b3cb933c8 !== 'undefined' && workflow_1bef36f6_6d8d_46d6_8a0d_b38b3cb933c8.getFlowChainInfo) {
      const chains = workflow_1bef36f6_6d8d_46d6_8a0d_b38b3cb933c8.getFlowChainInfo();
      if (Array.isArray(chains) && chains.length > 0) {
        allChains.push(...chains);
      }
    } else {
      console.warn('Workflow 1bef36f6_6d8d_46d6_8a0d_b38b3cb933c8 module not available or missing getFlowChainInfo');
    }
  } catch (e) {
    console.error('Failed to get chain info from workflow 1bef36f6_6d8d_46d6_8a0d_b38b3cb933c8:', e);
  }
  try {
    if (typeof workflow_0f125a6c_9f6d_4a74_97ad_735d4aceeefa !== 'undefined' && workflow_0f125a6c_9f6d_4a74_97ad_735d4aceeefa.getFlowChainInfo) {
      const chains = workflow_0f125a6c_9f6d_4a74_97ad_735d4aceeefa.getFlowChainInfo();
      if (Array.isArray(chains) && chains.length > 0) {
        allChains.push(...chains);
      }
    } else {
      console.warn('Workflow 0f125a6c_9f6d_4a74_97ad_735d4aceeefa module not available or missing getFlowChainInfo');
    }
  } catch (e) {
    console.error('Failed to get chain info from workflow 0f125a6c_9f6d_4a74_97ad_735d4aceeefa:', e);
  }
  try {
    if (typeof workflow_740eb982_a576_4557_b356_1d94d06e31a1 !== 'undefined' && workflow_740eb982_a576_4557_b356_1d94d06e31a1.getFlowChainInfo) {
      const chains = workflow_740eb982_a576_4557_b356_1d94d06e31a1.getFlowChainInfo();
      if (Array.isArray(chains) && chains.length > 0) {
        allChains.push(...chains);
      }
    } else {
      console.warn('Workflow 740eb982_a576_4557_b356_1d94d06e31a1 module not available or missing getFlowChainInfo');
    }
  } catch (e) {
    console.error('Failed to get chain info from workflow 740eb982_a576_4557_b356_1d94d06e31a1:', e);
  }
  try {
    if (typeof workflow_fa262b65_a18f_4bb0_b8c8_40f4dfe655b4 !== 'undefined' && workflow_fa262b65_a18f_4bb0_b8c8_40f4dfe655b4.getFlowChainInfo) {
      const chains = workflow_fa262b65_a18f_4bb0_b8c8_40f4dfe655b4.getFlowChainInfo();
      if (Array.isArray(chains) && chains.length > 0) {
        allChains.push(...chains);
      }
    } else {
      console.warn('Workflow fa262b65_a18f_4bb0_b8c8_40f4dfe655b4 module not available or missing getFlowChainInfo');
    }
  } catch (e) {
    console.error('Failed to get chain info from workflow fa262b65_a18f_4bb0_b8c8_40f4dfe655b4:', e);
  }
  try {
    if (typeof workflow_e91e43e6_efef_4f58_8399_8652d0e0dd3d !== 'undefined' && workflow_e91e43e6_efef_4f58_8399_8652d0e0dd3d.getFlowChainInfo) {
      const chains = workflow_e91e43e6_efef_4f58_8399_8652d0e0dd3d.getFlowChainInfo();
      if (Array.isArray(chains) && chains.length > 0) {
        allChains.push(...chains);
      }
    } else {
      console.warn('Workflow e91e43e6_efef_4f58_8399_8652d0e0dd3d module not available or missing getFlowChainInfo');
    }
  } catch (e) {
    console.error('Failed to get chain info from workflow e91e43e6_efef_4f58_8399_8652d0e0dd3d:', e);
  }
  try {
    if (typeof workflow_12be9d6c_c471_4b13_bb9f_9676dcd2c516 !== 'undefined' && workflow_12be9d6c_c471_4b13_bb9f_9676dcd2c516.getFlowChainInfo) {
      const chains = workflow_12be9d6c_c471_4b13_bb9f_9676dcd2c516.getFlowChainInfo();
      if (Array.isArray(chains) && chains.length > 0) {
        allChains.push(...chains);
      }
    } else {
      console.warn('Workflow 12be9d6c_c471_4b13_bb9f_9676dcd2c516 module not available or missing getFlowChainInfo');
    }
  } catch (e) {
    console.error('Failed to get chain info from workflow 12be9d6c_c471_4b13_bb9f_9676dcd2c516:', e);
  }
  return allChains;
};

// Unified executeAllFlows - executes all workflows
export const executeAllFlows = async (triggerData: any = {}, specificChainId: string | null = null): Promise<any> => {
  const results: Record<string, any> = {};
  const startTime = Date.now();
  
  // ✅ IMPORTANT: On page-load triggers, only execute page-load chains for the current page.
  // The previous behavior executed every workflow module, relying on each workflow to "skip" itself.
  // That caused unnecessary executions/log spam and could trigger non-page-load workflows if any module had weak guards.
  const triggerType = triggerData?.trigger;
  const isPageLoadTrigger = triggerType === 'page-load' || triggerType === 'page-load-retry';
  if (isPageLoadTrigger && !specificChainId) {
    const normalizePath = (value: any): string => {
      if (!value) return '';
      const raw = String(value);
      const withoutQuery = raw.split('?')[0]?.split('#')[0] || raw;
      if (withoutQuery === '/') return '/';
      return withoutQuery.replace(/[/]+$/, '');
    };

    const currentPath = normalizePath(
      triggerData?.pageId ||
        triggerData?.pagePath ||
        (typeof window !== 'undefined' ? window.location.pathname : '')
    );

    const pageLoadChains = (getAllChainInfo() || []).filter((chain: any) => {
      if (!chain || chain.startNode?.nodeType !== 'page-load') return false;
      const configuredUrl = normalizePath(chain.startNode?.config?.pageUrl);
      return configuredUrl !== '' && configuredUrl === currentPath;
    });

    for (const chain of pageLoadChains) {
      const chainId = chain?.id;
      if (!chainId) continue;
      try {
        results[chainId] = await executeSpecificFlow(chainId, triggerData);
      } catch (error) {
        console.error('Error executing page-load chain ' + chainId + ':', error);
        results[chainId] = { success: false, error: String(error), chainId };
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
      totalChains: pageLoadChains.length,
      successfulChains: Object.values(results).filter((r: any) => r && r.success).length,
      pageLoadOnly: true,
      currentPath
    };
  }
  
  // Execute each workflow
    try {
    if (typeof workflow_ec752534_cb48_4b71_ae77_9515064d28da !== 'undefined' && workflow_ec752534_cb48_4b71_ae77_9515064d28da.executeAllFlows) {
      const workflowResult = await workflow_ec752534_cb48_4b71_ae77_9515064d28da.executeAllFlows(triggerData, specificChainId);
      if (workflowResult) {
        results['ec752534-cb48-4b71-ae77-9515064d28da'] = workflowResult;
      }
    } else {
      console.warn('Workflow ec752534_cb48_4b71_ae77_9515064d28da module not available or missing executeAllFlows');
      results['ec752534-cb48-4b71-ae77-9515064d28da'] = { success: false, error: 'Workflow module not available' };
    }
  } catch (error) {
    console.error('Error executing workflow ec752534_cb48_4b71_ae77_9515064d28da:', error);
    results['ec752534-cb48-4b71-ae77-9515064d28da'] = { success: false, error: String(error) };
  }
  try {
    if (typeof workflow_ef318095_b9e4_4411_85ff_7101d236ec68 !== 'undefined' && workflow_ef318095_b9e4_4411_85ff_7101d236ec68.executeAllFlows) {
      const workflowResult = await workflow_ef318095_b9e4_4411_85ff_7101d236ec68.executeAllFlows(triggerData, specificChainId);
      if (workflowResult) {
        results['ef318095-b9e4-4411-85ff-7101d236ec68'] = workflowResult;
      }
    } else {
      console.warn('Workflow ef318095_b9e4_4411_85ff_7101d236ec68 module not available or missing executeAllFlows');
      results['ef318095-b9e4-4411-85ff-7101d236ec68'] = { success: false, error: 'Workflow module not available' };
    }
  } catch (error) {
    console.error('Error executing workflow ef318095_b9e4_4411_85ff_7101d236ec68:', error);
    results['ef318095-b9e4-4411-85ff-7101d236ec68'] = { success: false, error: String(error) };
  }
  try {
    if (typeof workflow_b591165e_cdb2_40e2_9511_80a2b5cf4023 !== 'undefined' && workflow_b591165e_cdb2_40e2_9511_80a2b5cf4023.executeAllFlows) {
      const workflowResult = await workflow_b591165e_cdb2_40e2_9511_80a2b5cf4023.executeAllFlows(triggerData, specificChainId);
      if (workflowResult) {
        results['b591165e-cdb2-40e2-9511-80a2b5cf4023'] = workflowResult;
      }
    } else {
      console.warn('Workflow b591165e_cdb2_40e2_9511_80a2b5cf4023 module not available or missing executeAllFlows');
      results['b591165e-cdb2-40e2-9511-80a2b5cf4023'] = { success: false, error: 'Workflow module not available' };
    }
  } catch (error) {
    console.error('Error executing workflow b591165e_cdb2_40e2_9511_80a2b5cf4023:', error);
    results['b591165e-cdb2-40e2-9511-80a2b5cf4023'] = { success: false, error: String(error) };
  }
  try {
    if (typeof workflow_0bbee0df_8a91_4dde_b198_f52da418e965 !== 'undefined' && workflow_0bbee0df_8a91_4dde_b198_f52da418e965.executeAllFlows) {
      const workflowResult = await workflow_0bbee0df_8a91_4dde_b198_f52da418e965.executeAllFlows(triggerData, specificChainId);
      if (workflowResult) {
        results['0bbee0df-8a91-4dde-b198-f52da418e965'] = workflowResult;
      }
    } else {
      console.warn('Workflow 0bbee0df_8a91_4dde_b198_f52da418e965 module not available or missing executeAllFlows');
      results['0bbee0df-8a91-4dde-b198-f52da418e965'] = { success: false, error: 'Workflow module not available' };
    }
  } catch (error) {
    console.error('Error executing workflow 0bbee0df_8a91_4dde_b198_f52da418e965:', error);
    results['0bbee0df-8a91-4dde-b198-f52da418e965'] = { success: false, error: String(error) };
  }
  try {
    if (typeof workflow_5e4a3799_4263_4485_bae2_4a5cd25642ee !== 'undefined' && workflow_5e4a3799_4263_4485_bae2_4a5cd25642ee.executeAllFlows) {
      const workflowResult = await workflow_5e4a3799_4263_4485_bae2_4a5cd25642ee.executeAllFlows(triggerData, specificChainId);
      if (workflowResult) {
        results['5e4a3799-4263-4485-bae2-4a5cd25642ee'] = workflowResult;
      }
    } else {
      console.warn('Workflow 5e4a3799_4263_4485_bae2_4a5cd25642ee module not available or missing executeAllFlows');
      results['5e4a3799-4263-4485-bae2-4a5cd25642ee'] = { success: false, error: 'Workflow module not available' };
    }
  } catch (error) {
    console.error('Error executing workflow 5e4a3799_4263_4485_bae2_4a5cd25642ee:', error);
    results['5e4a3799-4263-4485-bae2-4a5cd25642ee'] = { success: false, error: String(error) };
  }
  try {
    if (typeof workflow_1bef36f6_6d8d_46d6_8a0d_b38b3cb933c8 !== 'undefined' && workflow_1bef36f6_6d8d_46d6_8a0d_b38b3cb933c8.executeAllFlows) {
      const workflowResult = await workflow_1bef36f6_6d8d_46d6_8a0d_b38b3cb933c8.executeAllFlows(triggerData, specificChainId);
      if (workflowResult) {
        results['1bef36f6-6d8d-46d6-8a0d-b38b3cb933c8'] = workflowResult;
      }
    } else {
      console.warn('Workflow 1bef36f6_6d8d_46d6_8a0d_b38b3cb933c8 module not available or missing executeAllFlows');
      results['1bef36f6-6d8d-46d6-8a0d-b38b3cb933c8'] = { success: false, error: 'Workflow module not available' };
    }
  } catch (error) {
    console.error('Error executing workflow 1bef36f6_6d8d_46d6_8a0d_b38b3cb933c8:', error);
    results['1bef36f6-6d8d-46d6-8a0d-b38b3cb933c8'] = { success: false, error: String(error) };
  }
  try {
    if (typeof workflow_0f125a6c_9f6d_4a74_97ad_735d4aceeefa !== 'undefined' && workflow_0f125a6c_9f6d_4a74_97ad_735d4aceeefa.executeAllFlows) {
      const workflowResult = await workflow_0f125a6c_9f6d_4a74_97ad_735d4aceeefa.executeAllFlows(triggerData, specificChainId);
      if (workflowResult) {
        results['0f125a6c-9f6d-4a74-97ad-735d4aceeefa'] = workflowResult;
      }
    } else {
      console.warn('Workflow 0f125a6c_9f6d_4a74_97ad_735d4aceeefa module not available or missing executeAllFlows');
      results['0f125a6c-9f6d-4a74-97ad-735d4aceeefa'] = { success: false, error: 'Workflow module not available' };
    }
  } catch (error) {
    console.error('Error executing workflow 0f125a6c_9f6d_4a74_97ad_735d4aceeefa:', error);
    results['0f125a6c-9f6d-4a74-97ad-735d4aceeefa'] = { success: false, error: String(error) };
  }
  try {
    if (typeof workflow_740eb982_a576_4557_b356_1d94d06e31a1 !== 'undefined' && workflow_740eb982_a576_4557_b356_1d94d06e31a1.executeAllFlows) {
      const workflowResult = await workflow_740eb982_a576_4557_b356_1d94d06e31a1.executeAllFlows(triggerData, specificChainId);
      if (workflowResult) {
        results['740eb982-a576-4557-b356-1d94d06e31a1'] = workflowResult;
      }
    } else {
      console.warn('Workflow 740eb982_a576_4557_b356_1d94d06e31a1 module not available or missing executeAllFlows');
      results['740eb982-a576-4557-b356-1d94d06e31a1'] = { success: false, error: 'Workflow module not available' };
    }
  } catch (error) {
    console.error('Error executing workflow 740eb982_a576_4557_b356_1d94d06e31a1:', error);
    results['740eb982-a576-4557-b356-1d94d06e31a1'] = { success: false, error: String(error) };
  }
  try {
    if (typeof workflow_fa262b65_a18f_4bb0_b8c8_40f4dfe655b4 !== 'undefined' && workflow_fa262b65_a18f_4bb0_b8c8_40f4dfe655b4.executeAllFlows) {
      const workflowResult = await workflow_fa262b65_a18f_4bb0_b8c8_40f4dfe655b4.executeAllFlows(triggerData, specificChainId);
      if (workflowResult) {
        results['fa262b65-a18f-4bb0-b8c8-40f4dfe655b4'] = workflowResult;
      }
    } else {
      console.warn('Workflow fa262b65_a18f_4bb0_b8c8_40f4dfe655b4 module not available or missing executeAllFlows');
      results['fa262b65-a18f-4bb0-b8c8-40f4dfe655b4'] = { success: false, error: 'Workflow module not available' };
    }
  } catch (error) {
    console.error('Error executing workflow fa262b65_a18f_4bb0_b8c8_40f4dfe655b4:', error);
    results['fa262b65-a18f-4bb0-b8c8-40f4dfe655b4'] = { success: false, error: String(error) };
  }
  try {
    if (typeof workflow_e91e43e6_efef_4f58_8399_8652d0e0dd3d !== 'undefined' && workflow_e91e43e6_efef_4f58_8399_8652d0e0dd3d.executeAllFlows) {
      const workflowResult = await workflow_e91e43e6_efef_4f58_8399_8652d0e0dd3d.executeAllFlows(triggerData, specificChainId);
      if (workflowResult) {
        results['e91e43e6-efef-4f58-8399-8652d0e0dd3d'] = workflowResult;
      }
    } else {
      console.warn('Workflow e91e43e6_efef_4f58_8399_8652d0e0dd3d module not available or missing executeAllFlows');
      results['e91e43e6-efef-4f58-8399-8652d0e0dd3d'] = { success: false, error: 'Workflow module not available' };
    }
  } catch (error) {
    console.error('Error executing workflow e91e43e6_efef_4f58_8399_8652d0e0dd3d:', error);
    results['e91e43e6-efef-4f58-8399-8652d0e0dd3d'] = { success: false, error: String(error) };
  }
  try {
    if (typeof workflow_12be9d6c_c471_4b13_bb9f_9676dcd2c516 !== 'undefined' && workflow_12be9d6c_c471_4b13_bb9f_9676dcd2c516.executeAllFlows) {
      const workflowResult = await workflow_12be9d6c_c471_4b13_bb9f_9676dcd2c516.executeAllFlows(triggerData, specificChainId);
      if (workflowResult) {
        results['12be9d6c-c471-4b13-bb9f-9676dcd2c516'] = workflowResult;
      }
    } else {
      console.warn('Workflow 12be9d6c_c471_4b13_bb9f_9676dcd2c516 module not available or missing executeAllFlows');
      results['12be9d6c-c471-4b13-bb9f-9676dcd2c516'] = { success: false, error: 'Workflow module not available' };
    }
  } catch (error) {
    console.error('Error executing workflow 12be9d6c_c471_4b13_bb9f_9676dcd2c516:', error);
    results['12be9d6c-c471-4b13-bb9f-9676dcd2c516'] = { success: false, error: String(error) };
  }
  
  const endTime = Date.now();
  const executionTime = endTime - startTime;
  
  return {
    success: true,
    results,
    errors: [],
    chainId: 'master',
    executionTime,
    totalChains: getAllChainInfo().length,
    successfulChains: Object.values(results).filter((r: any) => r.success).length
  };
};

// Unified executeSpecificFlow - finds and executes specific chain
export const executeSpecificFlow = async (chainId: string, data: any = {}): Promise<any> => {
  // Try to find the chain in each workflow
    try {
    if (typeof workflow_ec752534_cb48_4b71_ae77_9515064d28da !== 'undefined' && workflow_ec752534_cb48_4b71_ae77_9515064d28da.getFlowChainInfo) {
      const chains = workflow_ec752534_cb48_4b71_ae77_9515064d28da.getFlowChainInfo();
      if (Array.isArray(chains) && chains.some((c: any) => c.id === chainId)) {
        if (workflow_ec752534_cb48_4b71_ae77_9515064d28da.executeSpecificFlow) {
          return await workflow_ec752534_cb48_4b71_ae77_9515064d28da.executeSpecificFlow(chainId, data);
        } else if (workflow_ec752534_cb48_4b71_ae77_9515064d28da.executeAllFlows) {
          return await workflow_ec752534_cb48_4b71_ae77_9515064d28da.executeAllFlows(data, chainId);
        }
      }
    }
  } catch (error) {
    console.error('Error checking workflow ec752534_cb48_4b71_ae77_9515064d28da for chain ' + chainId + ':', error);
  }
  try {
    if (typeof workflow_ef318095_b9e4_4411_85ff_7101d236ec68 !== 'undefined' && workflow_ef318095_b9e4_4411_85ff_7101d236ec68.getFlowChainInfo) {
      const chains = workflow_ef318095_b9e4_4411_85ff_7101d236ec68.getFlowChainInfo();
      if (Array.isArray(chains) && chains.some((c: any) => c.id === chainId)) {
        if (workflow_ef318095_b9e4_4411_85ff_7101d236ec68.executeSpecificFlow) {
          return await workflow_ef318095_b9e4_4411_85ff_7101d236ec68.executeSpecificFlow(chainId, data);
        } else if (workflow_ef318095_b9e4_4411_85ff_7101d236ec68.executeAllFlows) {
          return await workflow_ef318095_b9e4_4411_85ff_7101d236ec68.executeAllFlows(data, chainId);
        }
      }
    }
  } catch (error) {
    console.error('Error checking workflow ef318095_b9e4_4411_85ff_7101d236ec68 for chain ' + chainId + ':', error);
  }
  try {
    if (typeof workflow_b591165e_cdb2_40e2_9511_80a2b5cf4023 !== 'undefined' && workflow_b591165e_cdb2_40e2_9511_80a2b5cf4023.getFlowChainInfo) {
      const chains = workflow_b591165e_cdb2_40e2_9511_80a2b5cf4023.getFlowChainInfo();
      if (Array.isArray(chains) && chains.some((c: any) => c.id === chainId)) {
        if (workflow_b591165e_cdb2_40e2_9511_80a2b5cf4023.executeSpecificFlow) {
          return await workflow_b591165e_cdb2_40e2_9511_80a2b5cf4023.executeSpecificFlow(chainId, data);
        } else if (workflow_b591165e_cdb2_40e2_9511_80a2b5cf4023.executeAllFlows) {
          return await workflow_b591165e_cdb2_40e2_9511_80a2b5cf4023.executeAllFlows(data, chainId);
        }
      }
    }
  } catch (error) {
    console.error('Error checking workflow b591165e_cdb2_40e2_9511_80a2b5cf4023 for chain ' + chainId + ':', error);
  }
  try {
    if (typeof workflow_0bbee0df_8a91_4dde_b198_f52da418e965 !== 'undefined' && workflow_0bbee0df_8a91_4dde_b198_f52da418e965.getFlowChainInfo) {
      const chains = workflow_0bbee0df_8a91_4dde_b198_f52da418e965.getFlowChainInfo();
      if (Array.isArray(chains) && chains.some((c: any) => c.id === chainId)) {
        if (workflow_0bbee0df_8a91_4dde_b198_f52da418e965.executeSpecificFlow) {
          return await workflow_0bbee0df_8a91_4dde_b198_f52da418e965.executeSpecificFlow(chainId, data);
        } else if (workflow_0bbee0df_8a91_4dde_b198_f52da418e965.executeAllFlows) {
          return await workflow_0bbee0df_8a91_4dde_b198_f52da418e965.executeAllFlows(data, chainId);
        }
      }
    }
  } catch (error) {
    console.error('Error checking workflow 0bbee0df_8a91_4dde_b198_f52da418e965 for chain ' + chainId + ':', error);
  }
  try {
    if (typeof workflow_5e4a3799_4263_4485_bae2_4a5cd25642ee !== 'undefined' && workflow_5e4a3799_4263_4485_bae2_4a5cd25642ee.getFlowChainInfo) {
      const chains = workflow_5e4a3799_4263_4485_bae2_4a5cd25642ee.getFlowChainInfo();
      if (Array.isArray(chains) && chains.some((c: any) => c.id === chainId)) {
        if (workflow_5e4a3799_4263_4485_bae2_4a5cd25642ee.executeSpecificFlow) {
          return await workflow_5e4a3799_4263_4485_bae2_4a5cd25642ee.executeSpecificFlow(chainId, data);
        } else if (workflow_5e4a3799_4263_4485_bae2_4a5cd25642ee.executeAllFlows) {
          return await workflow_5e4a3799_4263_4485_bae2_4a5cd25642ee.executeAllFlows(data, chainId);
        }
      }
    }
  } catch (error) {
    console.error('Error checking workflow 5e4a3799_4263_4485_bae2_4a5cd25642ee for chain ' + chainId + ':', error);
  }
  try {
    if (typeof workflow_1bef36f6_6d8d_46d6_8a0d_b38b3cb933c8 !== 'undefined' && workflow_1bef36f6_6d8d_46d6_8a0d_b38b3cb933c8.getFlowChainInfo) {
      const chains = workflow_1bef36f6_6d8d_46d6_8a0d_b38b3cb933c8.getFlowChainInfo();
      if (Array.isArray(chains) && chains.some((c: any) => c.id === chainId)) {
        if (workflow_1bef36f6_6d8d_46d6_8a0d_b38b3cb933c8.executeSpecificFlow) {
          return await workflow_1bef36f6_6d8d_46d6_8a0d_b38b3cb933c8.executeSpecificFlow(chainId, data);
        } else if (workflow_1bef36f6_6d8d_46d6_8a0d_b38b3cb933c8.executeAllFlows) {
          return await workflow_1bef36f6_6d8d_46d6_8a0d_b38b3cb933c8.executeAllFlows(data, chainId);
        }
      }
    }
  } catch (error) {
    console.error('Error checking workflow 1bef36f6_6d8d_46d6_8a0d_b38b3cb933c8 for chain ' + chainId + ':', error);
  }
  try {
    if (typeof workflow_0f125a6c_9f6d_4a74_97ad_735d4aceeefa !== 'undefined' && workflow_0f125a6c_9f6d_4a74_97ad_735d4aceeefa.getFlowChainInfo) {
      const chains = workflow_0f125a6c_9f6d_4a74_97ad_735d4aceeefa.getFlowChainInfo();
      if (Array.isArray(chains) && chains.some((c: any) => c.id === chainId)) {
        if (workflow_0f125a6c_9f6d_4a74_97ad_735d4aceeefa.executeSpecificFlow) {
          return await workflow_0f125a6c_9f6d_4a74_97ad_735d4aceeefa.executeSpecificFlow(chainId, data);
        } else if (workflow_0f125a6c_9f6d_4a74_97ad_735d4aceeefa.executeAllFlows) {
          return await workflow_0f125a6c_9f6d_4a74_97ad_735d4aceeefa.executeAllFlows(data, chainId);
        }
      }
    }
  } catch (error) {
    console.error('Error checking workflow 0f125a6c_9f6d_4a74_97ad_735d4aceeefa for chain ' + chainId + ':', error);
  }
  try {
    if (typeof workflow_740eb982_a576_4557_b356_1d94d06e31a1 !== 'undefined' && workflow_740eb982_a576_4557_b356_1d94d06e31a1.getFlowChainInfo) {
      const chains = workflow_740eb982_a576_4557_b356_1d94d06e31a1.getFlowChainInfo();
      if (Array.isArray(chains) && chains.some((c: any) => c.id === chainId)) {
        if (workflow_740eb982_a576_4557_b356_1d94d06e31a1.executeSpecificFlow) {
          return await workflow_740eb982_a576_4557_b356_1d94d06e31a1.executeSpecificFlow(chainId, data);
        } else if (workflow_740eb982_a576_4557_b356_1d94d06e31a1.executeAllFlows) {
          return await workflow_740eb982_a576_4557_b356_1d94d06e31a1.executeAllFlows(data, chainId);
        }
      }
    }
  } catch (error) {
    console.error('Error checking workflow 740eb982_a576_4557_b356_1d94d06e31a1 for chain ' + chainId + ':', error);
  }
  try {
    if (typeof workflow_fa262b65_a18f_4bb0_b8c8_40f4dfe655b4 !== 'undefined' && workflow_fa262b65_a18f_4bb0_b8c8_40f4dfe655b4.getFlowChainInfo) {
      const chains = workflow_fa262b65_a18f_4bb0_b8c8_40f4dfe655b4.getFlowChainInfo();
      if (Array.isArray(chains) && chains.some((c: any) => c.id === chainId)) {
        if (workflow_fa262b65_a18f_4bb0_b8c8_40f4dfe655b4.executeSpecificFlow) {
          return await workflow_fa262b65_a18f_4bb0_b8c8_40f4dfe655b4.executeSpecificFlow(chainId, data);
        } else if (workflow_fa262b65_a18f_4bb0_b8c8_40f4dfe655b4.executeAllFlows) {
          return await workflow_fa262b65_a18f_4bb0_b8c8_40f4dfe655b4.executeAllFlows(data, chainId);
        }
      }
    }
  } catch (error) {
    console.error('Error checking workflow fa262b65_a18f_4bb0_b8c8_40f4dfe655b4 for chain ' + chainId + ':', error);
  }
  try {
    if (typeof workflow_e91e43e6_efef_4f58_8399_8652d0e0dd3d !== 'undefined' && workflow_e91e43e6_efef_4f58_8399_8652d0e0dd3d.getFlowChainInfo) {
      const chains = workflow_e91e43e6_efef_4f58_8399_8652d0e0dd3d.getFlowChainInfo();
      if (Array.isArray(chains) && chains.some((c: any) => c.id === chainId)) {
        if (workflow_e91e43e6_efef_4f58_8399_8652d0e0dd3d.executeSpecificFlow) {
          return await workflow_e91e43e6_efef_4f58_8399_8652d0e0dd3d.executeSpecificFlow(chainId, data);
        } else if (workflow_e91e43e6_efef_4f58_8399_8652d0e0dd3d.executeAllFlows) {
          return await workflow_e91e43e6_efef_4f58_8399_8652d0e0dd3d.executeAllFlows(data, chainId);
        }
      }
    }
  } catch (error) {
    console.error('Error checking workflow e91e43e6_efef_4f58_8399_8652d0e0dd3d for chain ' + chainId + ':', error);
  }
  try {
    if (typeof workflow_12be9d6c_c471_4b13_bb9f_9676dcd2c516 !== 'undefined' && workflow_12be9d6c_c471_4b13_bb9f_9676dcd2c516.getFlowChainInfo) {
      const chains = workflow_12be9d6c_c471_4b13_bb9f_9676dcd2c516.getFlowChainInfo();
      if (Array.isArray(chains) && chains.some((c: any) => c.id === chainId)) {
        if (workflow_12be9d6c_c471_4b13_bb9f_9676dcd2c516.executeSpecificFlow) {
          return await workflow_12be9d6c_c471_4b13_bb9f_9676dcd2c516.executeSpecificFlow(chainId, data);
        } else if (workflow_12be9d6c_c471_4b13_bb9f_9676dcd2c516.executeAllFlows) {
          return await workflow_12be9d6c_c471_4b13_bb9f_9676dcd2c516.executeAllFlows(data, chainId);
        }
      }
    }
  } catch (error) {
    console.error('Error checking workflow 12be9d6c_c471_4b13_bb9f_9676dcd2c516 for chain ' + chainId + ':', error);
  }
  
  console.warn('Chain not found:', chainId);
  return {
    success: false,
    error: 'Chain not found: ' + chainId,
    chainId
  };
};

// Unified getFlowChainInfo
export const getFlowChainInfo = (): any[] => {
  return getAllChainInfo();
};

// ===== POLLING FUNCTIONS =====
// These functions are needed for trigger-based workflows (telegram-inbound, whatsapp-trigger, incoming-webhook)

function startWhatsAppWebhookPolling(flowId: string, nodeId: string) {
  if (!nodeId) {
    console.warn(`⚠️ No nodeId provided for WhatsApp polling`);
    return;
  }
  
  // ✅ CRITICAL FIX: Check if polling is already running for this nodeId to prevent duplicates
  if (typeof window !== 'undefined' && (window as any).whatsappPollingIntervals && (window as any).whatsappPollingIntervals[nodeId]) {
    console.log(`⚠️ WhatsApp polling already running for node ${nodeId}, skipping duplicate start`);
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

  // ✅ CRITICAL FIX: Check if polling is already running for this nodeId to prevent duplicates
  if (typeof window !== 'undefined' && (window as any).incomingWebhookPollingIntervals && (window as any).incomingWebhookPollingIntervals[nodeId]) {
    console.log('⚠️ Incoming webhook polling already running for node ' + nodeId + ', skipping duplicate start');
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
            window.sessionStorage?.setItem("webhook_" + resolvedWebhookId, JSON.stringify(normalizedPayload));
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
  
  // ✅ CRITICAL FIX: Check if polling is already running for this nodeId to prevent duplicates
  if (typeof window !== 'undefined' && (window as any).telegramPollingIntervals && (window as any).telegramPollingIntervals[nodeId]) {
    console.log(`⚠️ Telegram polling already running for node ${nodeId}, skipping duplicate start`);
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

// Make functions globally available
if (typeof window !== 'undefined') {
  (window as any).executeAllFlows = executeAllFlows;
  (window as any).executeSpecificFlow = executeSpecificFlow;
  (window as any).getFlowChainInfo = getFlowChainInfo;
  
  // Use workflowRegistry to get the count of registered workflows
  const registeredWorkflowCount = workflowRegistry?.workflows?.size || 0;
  const totalChains = getAllChainInfo().length;
  console.log('✅ Flow Integration Index initialized with', registeredWorkflowCount, 'workflows');
  console.log('📋 Total chains:', totalChains);
  
  // ✅ CRITICAL FIX: Auto-execute trigger-based flows after initialization
  // This uses the unified getFlowChainInfo() which aggregates ALL workflows from ALL files
  // Without this, polling for trigger-based workflows (telegram-inbound, whatsapp-trigger, etc.) never starts
  setTimeout(async () => {
    console.log('🚀 Auto-starting trigger-based flows...');
    try {
      // Check if we have any trigger-based flows to execute
      // ✅ Uses unified getFlowChainInfo() that sees ALL workflows, not just one file
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

        if (startNodeType === 'page-load') {
          console.log('Skipping page-load auto-execution for flow: ' + flowInfo.id);
        } else if (startNodeType === 'inbound-email') {
          console.log('Skipping inbound-email auto-execution for flow: ' + flowInfo.id);
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
}

// Export for module usage
export { workflowRegistry };
