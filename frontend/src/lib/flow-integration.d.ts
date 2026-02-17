// Flow Integration System Type Definitions
// Auto-generated on: 2026-02-14T14:37:35.000Z

export interface FlowChainInfo {
  id: string;
  nodeTypes: string[];
  nodeCount: number;
  chainType: string;
  startNode?: any;
  endNode?: any;
  nodes: any[];
}

export interface FlowExecutionResult {
  success: boolean;
  results: any;
  errors: string[];
  chainId: string;
}

// Global window interface extensions
declare global {
  interface Window {
    executeAllFlows?: (triggerData?: any, specificChainId?: string | null) => Promise<FlowExecutionResult>;
    executeSpecificFlow?: (chainId: string, data?: any) => Promise<FlowExecutionResult>;
    getFlowChainInfo?: () => FlowChainInfo[];
  }
}

// Re-export main functions
export declare const executeAllFlows: (triggerData?: any, specificChainId?: string | null) => Promise<FlowExecutionResult>;
export declare const executeSpecificFlow: (chainId: string, data?: any) => Promise<FlowExecutionResult>;
export declare const getFlowChainInfo: () => FlowChainInfo[];
