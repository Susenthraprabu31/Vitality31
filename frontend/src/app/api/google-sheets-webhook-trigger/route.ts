import { NextRequest, NextResponse } from 'next/server';

// Google Sheets webhook trigger - auto-generated for Google Sheets trigger nodes
// This route is specifically for Google Sheets event workflow execution

// Store for webhook data (in production, use Redis or database)
declare global {
  var googleSheetsWebhookData: Record<string, {
    data: any;
    flowId: string;
    timestamp: string;
    processed: boolean;
    result?: any;
    error?: string;
  }> | undefined;
}

export async function POST(request: NextRequest) {
  try {
    console.log('Google Sheets webhook trigger endpoint called');
    
    const body = await request.json();
    const { nodeId, nodeType, data, triggerType } = body;
    
    console.log(`Received Google Sheets webhook trigger:`, {
      nodeId,
      nodeType,
      triggerType,
      dataKeys: Object.keys(data || {})
    });

    // For Google Sheets trigger nodes, execute the workflow directly
    if (nodeType === 'google-sheets-trigger' || nodeType.includes('google-sheets')) {
      try {
        console.log(`🚀 Executing Google Sheets workflow for node ${nodeId}`);
        
        // Import the flow integration system dynamically
        const { executeSpecificFlow, getFlowChainInfo } = await import('@/lib/flow-integration-index');
        
        // Find flows that start with this Google Sheets trigger node
        const flowChainInfo = getFlowChainInfo();
        const matchingFlow = flowChainInfo.find(flow => 
          flow.startNode?.id === nodeId || 
          flow.startNode?.nodeType === 'google-sheets-trigger' ||
          flow.startNode?.nodeType === 'google-sheets-db-trigger' ||
          flow.startNode?.nodeType === 'google-sheets-webhook-trigger' ||
          flow.id.includes(nodeId)
        );
        
        if (matchingFlow) {
          console.log(`Found matching Google Sheets flow: ${matchingFlow.id}`);
          console.log(`Flow details:`, {
            id: matchingFlow.id,
            nodeTypes: matchingFlow.nodeTypes,
            nodeCount: matchingFlow.nodeCount
          });
          
          // Execute the workflow directly on the server side
          console.log(`🚀 Executing Google Sheets workflow: ${matchingFlow.id}`);
          
          try {
            // ✅ CRITICAL FIX: Use executeSpecificFlow to execute ONLY the matched workflow
            const result = await executeSpecificFlow(matchingFlow.id, data);
            console.log(`✅ Google Sheets workflow executed successfully:`, result);
            
            // Store webhook data as backup
            global.googleSheetsWebhookData = global.googleSheetsWebhookData || {};
            global.googleSheetsWebhookData[nodeId] = {
              data,
              flowId: matchingFlow.id,
              timestamp: new Date().toISOString(),
              processed: true,
              result
            };
            
            return NextResponse.json({ 
              success: true, 
              message: 'Google Sheets workflow executed successfully',
              nodeId,
              nodeType,
              triggerType,
              flowId: matchingFlow.id,
              availableVariables: Object.keys(data),
              timestamp: new Date().toISOString(),
              result
            });
            
          } catch (executionError) {
            console.error(`❌ Google Sheets workflow execution failed:`, executionError);
            
            // Store webhook data for retry
            global.googleSheetsWebhookData = global.googleSheetsWebhookData || {};
            global.googleSheetsWebhookData[nodeId] = {
              data,
              flowId: matchingFlow.id,
              timestamp: new Date().toISOString(),
              processed: false,
              error: executionError instanceof Error ? executionError.message : String(executionError)
            };
            
            return NextResponse.json(
              { success: false, error: 'Google Sheets workflow execution failed', details: executionError instanceof Error ? executionError.message : String(executionError) },
              { status: 500 }
            );
          }
          
        } else {
          console.log(`No matching Google Sheets flow found for node ${nodeId}`);
          console.log(`Available flows:`, flowChainInfo.map(f => ({id: f.id, startNode: f.startNode?.nodeType})));
          
          return NextResponse.json(
            { success: false, error: 'No matching Google Sheets workflow found' },
            { status: 404 }
          );
        }
        
      } catch (googleSheetsError) {
        console.error(`Google Sheets workflow execution error:`, googleSheetsError);
        
        return NextResponse.json(
          { success: false, error: 'Google Sheets workflow system error', details: googleSheetsError instanceof Error ? googleSheetsError.message : String(googleSheetsError) },
          { status: 500 }
        );
      }
    }
    
    // For other node types, return error
    return NextResponse.json(
      { success: false, error: 'Unsupported node type for Google Sheets webhook trigger' },
      { status: 400 }
    );

  } catch (error) {
    console.error('Google Sheets webhook trigger error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return NextResponse.json({
    success: true,
    message: 'Google Sheets webhook trigger endpoint is active',
    timestamp: new Date().toISOString()
  });
}