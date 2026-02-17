
// Flow Integration System Initialization
import { executeAllFlows, executeSpecificFlow, getFlowChainInfo } from 'lib/flow-integration-index';

// Make flow functions available globally
if (typeof window !== 'undefined') {
  window.executeAllFlows = executeAllFlows;
  window.executeSpecificFlow = executeSpecificFlow;
  window.getFlowChainInfo = getFlowChainInfo;
  
  console.log('🔗 Flow Integration System initialized globally');
  console.log('📊 Available flows:', getFlowChainInfo().length);
}
