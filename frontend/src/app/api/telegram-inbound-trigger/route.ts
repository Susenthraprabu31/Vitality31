import { NextRequest, NextResponse } from 'next/server';

// Telegram Inbound webhook trigger - auto-generated for Telegram inbound nodes
// This route is specifically for Telegram inbound workflow execution

// Store for webhook data (in production, use Redis or database)
declare global {
  var telegramWebhookData: Record<string, {
    data: any;
    nodeId: string;
    nodeType: string;
    triggerType: string;
    messageId: string | null;
    timestamp: string;
    processed: boolean;
    result?: any;
    error?: string;
  }> | undefined;
  var _telegramProcessedMessages: Set<string> | undefined;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nodeId, nodeType, data, triggerType } = body;

    // For Telegram inbound nodes, store the data for client-side execution
    if (nodeType === 'telegram-inbound') {
      try {
        // ✅ DEDUPLICATION: Check if this message has already been processed
        const messageId = data?.messageId || data?.telegram?.messageId || data?.message?.id;
        const deduplicationKey = `${nodeId}_${messageId}`;
        
        global.telegramWebhookData = global.telegramWebhookData || {};
        global._telegramProcessedMessages = global._telegramProcessedMessages || new Set();
        
        // Check if this message has already been processed for this node
        if (messageId && global._telegramProcessedMessages.has(deduplicationKey)) {
          return NextResponse.json({ 
            success: true, 
            message: 'Message already processed (duplicate prevented)',
            nodeId,
            messageId,
            duplicate: true,
            timestamp: new Date().toISOString()
          });
        }
        
        // Store webhook data for client-side polling to pick up
        // This prevents duplicate execution and ensures client-side execution
        // which makes network calls visible and variables accessible
        global.telegramWebhookData[nodeId] = {
          data,
          nodeId,
          nodeType,
          triggerType,
          messageId: messageId || null,
          timestamp: new Date().toISOString(),
          processed: false, // Client-side will mark as processed after execution
        };
        
        // Mark this message as processed to prevent duplicates
        if (messageId) {
          global._telegramProcessedMessages.add(deduplicationKey);
          // Clean up old processed messages (keep only last 1000)
          if (global._telegramProcessedMessages.size > 1000) {
            const messagesArray = Array.from(global._telegramProcessedMessages);
            global._telegramProcessedMessages = new Set(messagesArray.slice(-500));
          }
        }
        
        return NextResponse.json({ 
          success: true, 
          message: 'Telegram webhook data stored successfully',
          nodeId,
          nodeType,
          triggerType,
          messageId: messageId || null,
          availableVariables: Object.keys(data || {}),
          timestamp: new Date().toISOString(),
          note: 'Workflow will be executed client-side via polling'
        });
        
      } catch (telegramError) {
        const telegramErrorMessage = telegramError instanceof Error
          ? telegramError.message
          : String(telegramError);
        
        return NextResponse.json(
          { success: false, error: 'Telegram webhook storage failed', details: telegramErrorMessage },
          { status: 500 }
        );
      }
    }
    
    // For other node types, return error
    return NextResponse.json(
      { success: false, error: 'Unsupported node type for Telegram webhook trigger' },
      { status: 400 }
    );

  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const { searchParams } = new URL(request.url);
    const nodeId = searchParams.get('nodeId');
    
    // Get Telegram webhook data from the store
    const telegramData = global.telegramWebhookData || {};
    
    if (nodeId) {
      // Return data for specific node (for polling)
      const nodeData = telegramData[nodeId];
      
      if (nodeData && !nodeData.processed) {
        // Mark as processed to prevent duplicate execution
        nodeData.processed = true;
        
        return NextResponse.json({
          success: true,
          hasData: true,
          data: nodeData.data,
          nodeId: nodeData.nodeId,
          nodeType: nodeData.nodeType,
          triggerType: nodeData.triggerType,
          timestamp: nodeData.timestamp
        });
      } else {
        // No new data for this node
        return NextResponse.json({
          success: true,
          hasData: false,
          message: 'No new Telegram data for this node'
        });
      }
    } else {
      // Return all messages (for debugging)
      const messages = Object.entries(telegramData).map(([id, msgData]) => ({
        ...msgData,
        nodeId: msgData.nodeId || id, // Use existing nodeId or fallback to id
      }));
      
      // Sort by timestamp (newest first)
      messages.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      return NextResponse.json({
        success: true,
        message: 'Telegram webhook trigger endpoint is active',
        messageCount: messages.length,
        latestMessage: messages[0] || null,
        allMessages: messages,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}