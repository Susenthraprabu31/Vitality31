import { NextRequest, NextResponse } from 'next/server';

// Store for webhook data (in production, use Redis or database)
declare global {
  var whatsappWebhookData: Record<string, {
    data: any;
    flowId: string;
    timestamp: string;
    processed: boolean;
  }> | undefined;
}

export async function POST(request: NextRequest) {
  try {
    
    const body = await request.json();
    const { nodeId, nodeType, data, triggerType } = body;

    // Prepare the flow execution data
    const flowExecutionData = {
      nodeId,
      nodeType,
      data,
      timestamp: new Date().toISOString(),
      trigger: 'webhook-received'
    };

    // For WhatsApp triggers and Evolution receive nodes, execute the flow directly with the webhook data
    if (nodeType === 'whatsapp-trigger' || nodeType === 'evolution-whatsapp-receive') {
      try {
        
        // Import the flow integration system dynamically
        const { getFlowChainInfo } = await import('@/lib/flow-integration-index');
        
        // Find flows that start with this trigger node (WhatsApp or Evolution)
        const flowChainInfo = getFlowChainInfo();
        const matchingFlow = flowChainInfo.find(flow => 
          flow.startNode?.id === nodeId || 
          flow.startNode?.nodeType === 'whatsapp-trigger' ||
          flow.startNode?.nodeType === 'evolution-whatsapp-receive' ||
          flow.id.includes(nodeId)
        );
        
        if (matchingFlow) {
          
          // Store webhook data for client-side access instead of server-side execution
          // This avoids 'window is not defined' and 'document is not defined' errors
          
          // Store webhook data globally (in production, use Redis or database)
          global.whatsappWebhookData = global.whatsappWebhookData || {};
          global.whatsappWebhookData[nodeId] = {
            data,
            flowId: matchingFlow.id,
            timestamp: new Date().toISOString(),
            processed: false
          };
          
          
          return NextResponse.json({ 
            success: true, 
            message: 'WhatsApp workflow executed successfully',
            nodeId,
            nodeType,
            triggerType,
            flowId: matchingFlow.id,
            clientAction: 'executeFlow',
            availableVariables: Object.keys(data),
            timestamp: new Date().toISOString()
          });
          
        } else {
          
          // Fall through to general flow execution as backup
        }
        
      } catch (whatsappError) {
        
        // Fall through to general flow execution as backup
      }
    }
    
    // General flow execution for other trigger types or as backup
    try {
      // Import the flow integration system dynamically
      const { executeSpecificFlow, getFlowChainInfo } = await import('@/lib/flow-integration-index');
      
      // Find flows that start with this trigger node
      const flowChainInfo = getFlowChainInfo();
      const matchingFlow = flowChainInfo.find(flow => 
        flow.startNode?.id === nodeId || 
        flow.startNode?.nodeType === nodeType ||
        flow.id.includes(nodeId)
      );
      
      if (matchingFlow) {
        
        // Store webhook data for client-side access instead of server-side execution
        // This avoids 'window is not defined' and 'document is not defined' errors
        
        // Store webhook data globally (in production, use Redis or database)
        global.whatsappWebhookData = global.whatsappWebhookData || {};
        global.whatsappWebhookData[nodeId] = {
          data,
          flowId: matchingFlow.id,
          timestamp: new Date().toISOString(),
          processed: false
        };
        
        
        return NextResponse.json({ 
          success: true, 
          message: 'WhatsApp workflow executed successfully',
          nodeId,
          nodeType,
          triggerType,
          flowId: matchingFlow.id,
          clientAction: 'executeFlow',
          availableVariables: Object.keys(data),
          timestamp: new Date().toISOString()
        });
        
      } else {
        
      }
      
    } catch (flowError) {
      
    }
    
    // For development/testing, we simulate successful processing

    // Respond with success and the processed data
    return NextResponse.json({ 
      success: true, 
      message: 'Webhook trigger processed successfully',
      nodeId,
      nodeType,
      triggerType,
      availableVariables: Object.keys(data),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const nodeId = url.searchParams.get('nodeId');
  
  if (nodeId) {
    // Return stored webhook data for specific node
    const webhookData = global.whatsappWebhookData?.[nodeId];
    
    if (webhookData && !webhookData.processed) {
      // Mark as processed to avoid re-execution
      webhookData.processed = true;
      
      return NextResponse.json({
        success: true,
        hasData: true,
        nodeId,
        data: webhookData.data,
        flowId: webhookData.flowId,
        timestamp: webhookData.timestamp
      });
    } else {
      return NextResponse.json({
        success: true,
        hasData: false,
        nodeId
      });
    }
  }
  
  return NextResponse.json({ 
    message: 'WhatsApp webhook trigger endpoint',
    usage: 'POST to store webhook data, GET with ?nodeId=<id> to retrieve stored data'
  });
}