import { NextRequest, NextResponse } from 'next/server';

// ✅ ASSISTANT CACHE - Reuse assistants across requests to save costs and time
const assistantCache = new Map();

// ✅ THREAD CACHE - Maintain conversation memory across requests
const threadCache = new Map();

// ✅ SERVER-SIDE STORAGE - For API routes and webhook triggers (when window is not available)
const contextStorage = new Map<string, any>();
const memoryStorage = new Map<string, any>();
const workflowContextStorage = new Map<string, any>();

// Generate a cache key based on assistant configuration
function getAssistantCacheKey(config: any) {
  const key = {
    model: config.model,
    agentType: config.agentType,
    tools: config.tools?.map((t: any) => t.function?.name || 'unnamed').sort() || [],
    instructions: config.instructions
  };
  return JSON.stringify(key);
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { 
      model, 
      instructions,
      temperature,
      max_tokens,
      input,
      apiKey,
      assistantId, // Optional: use existing assistant
      threadId, // Optional: use existing thread for conversation continuity
      sessionId, // Optional: session ID for maintaining conversation context
      // Enhanced Tool System
      selected_tools, // Array of selected tool IDs from Tool Library
      tool_configs, // Tool-specific configurations
      tool_settings, // General tool execution settings
      agentType, // Agent type (orchestrator vs agent_as_tool)
      // MCP Servers
      mcp_servers, // Array of MCP server configurations
      // Agent Handoff Configuration
      handoff_enabled, // Boolean: whether handoff is enabled
      handoff_mode, // 'transfer_control' | 'tool_call'
      handoff_targets, // Array of handoff target configurations
      // Handoff Continuation Detection
      isHandoffContinuation,
      handoffReason,
      handoffContext
    } = body;

    // 🔄 LOG HANDOFF CONTINUATION
    if (isHandoffContinuation) {
      console.log('');
      console.log('🔄 ============================================');
      console.log('🔄 HANDOFF CONTINUATION DETECTED');
      console.log('🔄 ============================================');
      console.log('🔄 This is a target agent execution');
      console.log('🔄 Reason:', handoffReason);
      console.log('🔄 Context:', handoffContext);
      console.log('🔄 Using shared thread ID:', threadId);
      console.log('🔄 Using shared session ID:', sessionId);
      console.log('🔄 ============================================');
      console.log('');
    }

    console.log('🔗 MCP Servers received in API:', mcp_servers?.length || 0, 'servers');
    if (mcp_servers && mcp_servers.length > 0) {
      console.log('🔗 MCP Servers details:', mcp_servers.map((s: any) => ({
        id: s.id,
        name: s.name,
        enabled: s.enabled,
        url: s.url
      })));
    }

    if (!input) {
      return NextResponse.json(
        { error: 'Input is required' },
        { status: 400 }
      );
    }

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey || process.env.OPENAI_API_KEY}`,
      'OpenAI-Beta': 'assistants=v2'
    };

    const modelName = model || 'gpt-4o';
    
    // ✅ USE RESPONSES API for GPT-5 and GPT-5.1 (not supported by Assistants API)
    const useResponsesAPI = modelName === 'gpt-5' || modelName === 'gpt-5.1';
    
    if (useResponsesAPI) {
      console.log('🚀 Using Responses API for model:', modelName);
      
      // Prepare instructions with handoff guidance if enabled
      let enhancedInstructions = instructions || 'You are a helpful AI assistant.';
      if (handoff_enabled && handoff_targets && handoff_targets.length > 0) {
        const handoffRules = handoff_targets.map((t: any) => {
          let targetLabel = t.agent_label || 'specialist agent';
          if (typeof targetLabel !== 'string') {
            if (targetLabel && typeof targetLabel === 'object') {
              targetLabel = targetLabel.name || targetLabel.label || String(targetLabel);
            } else {
              targetLabel = String(targetLabel || 'specialist agent');
            }
          }
          const targetInstructions = t.handoff_instructions || 'when their expertise is needed';
          return '\n- ALWAYS call transfer_to_agent with target "' + t.agent_node_id + '" (' + targetLabel + ') ' + targetInstructions;
        }).join('');
        
        enhancedInstructions += '\n\nCRITICAL AGENT HANDOFF RULES:\nYou MUST use the transfer_to_agent function in these situations:' + handoffRules + '\n\nDo NOT attempt to answer these requests yourself. IMMEDIATELY call transfer_to_agent when any of the above conditions are met.';
      }
      
      // Prepare tools for Responses API (Responses API uses flat structure, not nested under 'function')
      const responsesApiTools: any[] = [];
      
      // Add selected tools
      if (selected_tools && selected_tools.length > 0) {
        const { TOOL_LIBRARY } = await import('../../../lib/tool-library');
        selected_tools.forEach((toolId: string) => {
          const tool = TOOL_LIBRARY.find((t: any) => t.id === toolId);
          if (tool) {
            tool.functions.forEach((func: any) => {
              responsesApiTools.push({
                type: 'function',
                name: func.name,
                description: func.description,
                parameters: func.parameters
              });
            });
          }
        });
      }
      
      // Add MCP server functions
      if (mcp_servers && mcp_servers.length > 0) {
        const enabledMcpServers = mcp_servers.filter((server: any) => server.enabled);
        for (const server of enabledMcpServers) {
          try {
            const mcpResponse = await fetch(server.url + '/mcp/v1/tools', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({})
            });
            
            if (mcpResponse.ok) {
              const mcpData = await mcpResponse.json();
              if (mcpData.tools && Array.isArray(mcpData.tools)) {
                mcpData.tools.forEach((tool: any) => {
                  responsesApiTools.push({
                    type: 'function',
                    name: 'mcp_' + server.id + '_' + tool.name,
                    description: '[MCP] ' + (tool.description || ''),
                    parameters: tool.inputSchema || {}
                  });
                });
              }
            }
          } catch (error) {
            console.warn('⚠️ Failed to fetch MCP tools from', server.url, error);
          }
        }
      }
      
      // Add handoff tool if enabled
      if (handoff_enabled && handoff_targets && handoff_targets.length > 0) {
        responsesApiTools.push({
          type: 'function',
          name: 'transfer_to_agent',
          description: '🚨 REQUIRED: Transfer this conversation to another specialized agent.',
          parameters: {
            type: 'object',
            properties: {
              target_agent: {
                type: 'string',
                enum: handoff_targets.map((t: any) => t.agent_node_id),
                description: 'Target agent ID'
              },
              reason: {
                type: 'string',
                description: 'Brief reason for the transfer'
              },
              context_summary: {
                type: 'string',
                description: 'Quick summary of what the user needs'
              }
            },
            required: ['target_agent', 'reason']
          }
        });
      }
      
      // Prepare Responses API request
      const responsesApiPayload: any = {
        model: modelName,
        input: [
          {
            role: 'system',
            content: [
              {
                type: 'input_text',
                text: enhancedInstructions
              }
            ]
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: input
              }
            ]
          }
        ],
        text: {
          format: {
            type: 'text'
          }
        },
        max_output_tokens: max_tokens || 1000
      };
      
      // Note: GPT-5/5.1 models don't support temperature parameter in Responses API
      // Temperature is not included for these models
      
      // Add tools if available
      if (responsesApiTools.length > 0) {
        responsesApiPayload.tools = responsesApiTools;
        responsesApiPayload.tool_choice = 'auto';
      }
      
      // Call Responses API
      const responsesApiHeaders = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey || process.env.OPENAI_API_KEY}`
      };
      
      const responsesApiResponse = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: responsesApiHeaders,
        body: JSON.stringify(responsesApiPayload)
      });
      
      if (!responsesApiResponse.ok) {
        const errorData = await responsesApiResponse.json().catch(() => ({}));
        return NextResponse.json(
          { 
            error: `Responses API error: ${responsesApiResponse.status}`,
            details: errorData
          },
          { status: responsesApiResponse.status }
        );
      }
      
      const responsesApiResult = await responsesApiResponse.json();
      
      // Extract content from Responses API result
      let finalContent = '';
      
      // Responses API returns output in different formats
      if (responsesApiResult.output) {
        if (Array.isArray(responsesApiResult.output)) {
          // Array format - extract text parts (Responses API uses 'output_text' type)
          const textParts = responsesApiResult.output
            .filter((item: any) => (item.type === 'output_text' || item.type === 'text') && item.text)
            .map((item: any) => item.text);
          finalContent = textParts.join('\n');
          
          // Check for tool calls (Responses API may use different format)
          const toolCalls = responsesApiResult.output.filter((item: any) => 
            item.type === 'tool_call' || item.type === 'function_call' || item.tool_call_id
          );
          if (toolCalls.length > 0) {
            // Handle tool calls (including handoff)
            for (const toolCall of toolCalls) {
              // Responses API may have name directly or nested under function
              const functionName = toolCall.name || toolCall.function?.name || toolCall.function_name;
              const functionArgs = toolCall.arguments 
                ? (typeof toolCall.arguments === 'string' ? JSON.parse(toolCall.arguments) : toolCall.arguments)
                : (toolCall.function?.arguments 
                  ? (typeof toolCall.function.arguments === 'string' ? JSON.parse(toolCall.function.arguments) : toolCall.function.arguments)
                  : {});
              
              if (functionName === 'transfer_to_agent') {
                // Handle handoff - return immediately
                return NextResponse.json({
                  handoff: true,
                  execution_mode: handoff_mode || 'transfer_control',
                  target_agent: functionArgs.target_agent,
                  reason: functionArgs.reason || 'Handoff requested',
                  context_summary: functionArgs.context_summary || finalContent,
                  message: finalContent || 'Agent handoff requested',
                  content: finalContent || 'Agent handoff requested',
                  text: finalContent || 'Agent handoff requested',
                  success: true,
                  apiUsed: 'responses'
                });
              } else {
                // Execute other tool calls
                try {
                  const toolOutput = await handleToolCall(functionName, functionArgs, selected_tools, tool_configs, mcp_servers);
                  finalContent += '\n\n[Tool executed: ' + functionName + ']';
                } catch (toolError) {
                  console.error('Tool execution error:', toolError);
                  finalContent += '\n\n[Tool error: ' + functionName + ']';
                }
              }
            }
          }
        } else if (typeof responsesApiResult.output === 'string') {
          finalContent = responsesApiResult.output;
        }
      } else if (responsesApiResult.text) {
        finalContent = responsesApiResult.text;
      } else if (responsesApiResult.content) {
        finalContent = typeof responsesApiResult.content === 'string' 
          ? responsesApiResult.content 
          : JSON.stringify(responsesApiResult.content);
      }
      
      return NextResponse.json({
        output: finalContent,
        content: finalContent,
        text: finalContent,
        success: true,
        apiUsed: 'responses'
      });
    }

    let currentAssistantId = assistantId;

    // Step 1: Create or use existing assistant (Assistants API path)
    if (!currentAssistantId) {
      
      // Check if model requires default temperature (o1, o3 reasoning models)
      // Note: GPT-5 and GPT-4.1 support temperature control
      const requiresDefaultTemp = (modelName.includes('o1') || 
                                   modelName.includes('o3') ||
                                   modelName.includes('o1-preview') ||
                                   modelName.includes('o1-mini') ||
                                   modelName.includes('o3-mini')) &&
                                  !modelName.includes('gpt-5') && 
                                  !modelName.includes('gpt-4.1');
      
      // ✅ ENHANCE INSTRUCTIONS with handoff guidance if enabled
      let enhancedInstructions = instructions || 'You are a helpful AI assistant.';
      if (handoff_enabled && handoff_targets && handoff_targets.length > 0) {
        // Build STRONG, SPECIFIC handoff instructions for each target
        const handoffRules = handoff_targets.map((t: any) => {
          // ✅ FIX: Ensure agent_label is always a string
          let targetLabel = t.agent_label || 'specialist agent';
          if (typeof targetLabel !== 'string') {
            if (targetLabel && typeof targetLabel === 'object') {
              targetLabel = targetLabel.name || targetLabel.label || String(targetLabel);
            } else {
              targetLabel = String(targetLabel || 'specialist agent');
            }
          }
          const targetInstructions = t.handoff_instructions || 'when their expertise is needed';
          return '\n- ALWAYS call transfer_to_agent with target "' + t.agent_node_id + '" (' + targetLabel + ') ' + targetInstructions;
        }).join('');
        
        const handoffGuidance = '\n\nCRITICAL AGENT HANDOFF RULES:\nYou MUST use the transfer_to_agent function in these situations:' + handoffRules + '\n\nDo NOT attempt to answer these requests yourself. IMMEDIATELY call transfer_to_agent when any of the above conditions are met. The target agent is specifically designed for these tasks.';
        
        enhancedInstructions += handoffGuidance;
        console.log('📝 Enhanced instructions with handoff guidance');
      }
      
      // Prepare assistant configuration for cache key (includes agentType)
      const assistantConfigForCache: any = {
        model: modelName,
        agentType: agentType || 'orchestrator',
        instructions: enhancedInstructions,
        temperature: requiresDefaultTemp ? undefined : (temperature || 0.7)
      };
      
      // Prepare assistant configuration for API (excludes agentType - not a valid API param)
      const assistantConfig: any = {
        model: modelName,
        name: agentType === 'orchestrator' ? 'Orchestrator Assistant' : 'Flow Integration Assistant',
        instructions: enhancedInstructions,
        // Only include temperature if model supports it
        ...(requiresDefaultTemp ? {} : { temperature: temperature || 0.7 })
      };

      // Add tools if provided
      if (selected_tools && selected_tools.length > 0) {
        // Import TOOL_LIBRARY to get tool definitions
        const { TOOL_LIBRARY } = await import('../../../lib/tool-library');
        
        // Convert selected tools to OpenAI tool format using actual tool definitions
        const openaiTools: any[] = [];
        
        selected_tools.forEach((toolId: string) => {
          const tool = TOOL_LIBRARY.find((t: any) => t.id === toolId);
          if (tool) {
            // Add all functions from this tool
            tool.functions.forEach((func: any) => {
              openaiTools.push({
                type: 'function',
                function: {
                  name: func.name,
                  description: func.description,
                  parameters: func.parameters
                }
              });
            });
          }
        });
        
        if (openaiTools.length > 0) {
          assistantConfig.tools = openaiTools;
          console.log('Added ' + openaiTools.length + ' tool functions to assistant');
        }
      }
      
      // Add MCP Server functions as available tools
      if (mcp_servers && mcp_servers.length > 0) {
        console.log('🔗 Registering MCP server functions...');
        
        if (!assistantConfig.tools) {
          assistantConfig.tools = [];
        }
        
        const enabledMcpServers = mcp_servers.filter((server: any) => server.enabled);
        console.log('🔗 Found ' + enabledMcpServers.length + ' enabled MCP servers');
        
        // 🚀 UNIVERSAL MCP SERVER DISCOVERY & REGISTRATION
        for (const server of enabledMcpServers) {
          console.log('🔍 Auto-discovering tools for MCP server: ' + server.name);
          
          try {
            // Try to discover server capabilities automatically
            let discoveredTools = [];
            let serverCapabilities = null;
            
            // Try different discovery endpoints
            const discoveryEndpoints = ['', '/mcp', '/'];
            
            for (const endpoint of discoveryEndpoints) {
              try {
                let discoveryUrl = server.url;
                if (endpoint && !discoveryUrl.endsWith('/')) {
                  discoveryUrl = discoveryUrl + endpoint;
                }
                
                console.log('🔍 Trying discovery at: ' + discoveryUrl);
                const capabilitiesResponse = await fetch(discoveryUrl, {
                  method: 'GET',
                  headers: { 'Content-Type': 'application/json' }
                });
                
                if (capabilitiesResponse.ok) {
                  serverCapabilities = await capabilitiesResponse.json();
                  console.log('✅ Got capabilities from ' + discoveryUrl);
                  break;
                }
              } catch (discoveryError: any) {
                console.log('⚠️ Discovery failed for ' + endpoint + ':', discoveryError.message);
                continue;
              }
            }
            
            // Extract tools from capabilities
            if (serverCapabilities && serverCapabilities.tools && Array.isArray(serverCapabilities.tools)) {
              discoveredTools = serverCapabilities.tools;
              console.log('🔍 Discovered ' + discoveredTools.length + ' tools from ' + server.name);
            }
            
            // Register discovered tools with OpenAI
            if (discoveredTools.length > 0) {
              discoveredTools.forEach((tool: any) => {
                console.log('📝 Registering tool: ' + tool.name + ' from ' + server.name);
                
                // Create OpenAI function from MCP tool
                const openaiFunction = {
                  type: 'function',
                  function: {
                    name: tool.name,
                    description: tool.description || ('Function from MCP server: ' + server.name),
                    parameters: tool.inputSchema || {
                      type: 'object',
                      properties: {},
                      required: []
                    }
                  }
                };
                
                assistantConfig.tools.push(openaiFunction);
              });
            } else {
              console.log('⚠️ No tools discovered for ' + server.name + ', creating generic interface');
              
              // Fallback: Create a generic function for this server
              assistantConfig.tools.push({
                type: 'function',
                function: {
                  name: 'mcp_' + server.id.replace(/[^a-zA-Z0-9]/g, '_') + '_call',
                  description: 'Call any function on MCP server: ' + server.name + '. Use this for ' + server.name + ' operations.',
                  parameters: {
                    type: 'object',
                    properties: {
                      function_name: {
                        type: 'string',
                        description: 'Name of the function to call on ' + server.name
                      },
                      arguments: {
                        type: 'object',
                        description: 'Arguments to pass to the function'
                      }
                    },
                    required: ['function_name']
                  }
                }
              });
            }
            
          } catch (serverError: any) {
            console.log('❌ Error discovering tools for ' + server.name + ':', serverError.message);
            
            // Fallback: Create a generic function for this server
            assistantConfig.tools.push({
              type: 'function',
              function: {
                name: 'mcp_' + server.id.replace(/[^a-zA-Z0-9]/g, '_') + '_call',
                description: 'Call any function on MCP server: ' + server.name + '. Use this for ' + server.name + ' operations.',
                parameters: {
                  type: 'object',
                  properties: {
                    function_name: {
                      type: 'string',
                      description: 'Name of the function to call on ' + server.name
                    },
                    arguments: {
                      type: 'object',
                      description: 'Arguments to pass to the function'
                    }
                  },
                  required: ['function_name']
                }
              }
            });
          }
        }
        
        console.log('🔗 Total tools registered: ' + assistantConfig.tools.length);
      }
      
      // ✅ ADD AGENT HANDOFF TOOL if enabled
      if (handoff_enabled && handoff_targets && handoff_targets.length > 0) {
        console.log('🔄 Adding agent handoff tool with ' + handoff_targets.length + ' targets');
        
        if (!assistantConfig.tools) {
          assistantConfig.tools = [];
        }
        
        // Create the transfer_to_agent function tool
        const transferTool = {
          type: 'function',
          function: {
            name: 'transfer_to_agent',
            description: '🚨 REQUIRED: Transfer this conversation to another specialized agent. You MUST use this function when the user request matches any configured handoff condition. Do NOT answer these requests yourself - the specialist agent is better equipped. Conversation history is fully preserved.',
            parameters: {
              type: 'object',
              properties: {
                target_agent: {
                  type: 'string',
                  enum: handoff_targets.map((t: any) => t.agent_node_id),
                  description: 'Target agent ID. Available: ' + handoff_targets.map((t: any) => {
                    // ✅ FIX: Ensure agent_label is always a string
                    let agentLabel = t.agent_label || 'agent';
                    if (typeof agentLabel !== 'string') {
                      if (agentLabel && typeof agentLabel === 'object') {
                        agentLabel = agentLabel.name || agentLabel.label || String(agentLabel);
                      } else {
                        agentLabel = String(agentLabel || 'agent');
                      }
                    }
                    const agentDesc = t.agent_description || '';
                    return t.agent_node_id + ' (' + agentLabel + (agentDesc ? ' - ' + agentDesc : '') + ')';
                  }).join(', ')
                },
                reason: {
                  type: 'string',
                  description: 'Brief reason for the transfer (helps with debugging and logging)'
                },
                context_summary: {
                  type: 'string',
                  description: 'Quick summary of what the user needs (one sentence)'
                }
              },
              required: ['target_agent', 'reason']
            }
          }
        };
        
        assistantConfig.tools.push(transferTool);
        console.log('✅ Added transfer_to_agent function tool');
        
        // Log each handoff target with its instructions
        handoff_targets.forEach((target: any) => {
          // ✅ FIX: Ensure agent_label is always a string
          let agentLabel = target.agent_label || 'agent';
          if (typeof agentLabel !== 'string') {
            if (agentLabel && typeof agentLabel === 'object') {
              agentLabel = agentLabel.name || agentLabel.label || String(agentLabel);
            } else {
              agentLabel = String(agentLabel || 'agent');
            }
          }
          console.log('  → Can transfer to: ' + agentLabel + ' (' + target.agent_node_id + ')');
          if (target.handoff_instructions) {
            console.log('    Instructions: ' + target.handoff_instructions);
          }
        });
      }
      
      // ✅ UPDATE CACHE CONFIG with tools (after tools are added)
      assistantConfigForCache.tools = (assistantConfig.tools || []).map((t: any) => 
        t.function?.name || 'unnamed'
      ).sort();
      
      // ✅ CHECK CACHE FIRST - Reuse existing assistant if configuration matches
      const cacheKey = getAssistantCacheKey(assistantConfigForCache);
      const cachedAssistantId = assistantCache.get(cacheKey);
      
      if (cachedAssistantId) {
        console.log('♻️ Reusing cached assistant:', cachedAssistantId);
        currentAssistantId = cachedAssistantId;
      } else {
        // Create new assistant only if not in cache
        console.log('🆕 Creating new assistant (not in cache)');
        
        const assistantResponse = await fetch('https://api.openai.com/v1/assistants', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify(assistantConfig)
        });

        if (!assistantResponse.ok) {
          const errorData = await assistantResponse.json().catch(() => ({}));
          return NextResponse.json(
            { 
              error: `Failed to create assistant: ${assistantResponse.status}`,
              details: errorData
            },
            { status: assistantResponse.status }
          );
        }

        const assistantData = await assistantResponse.json();
        currentAssistantId = assistantData.id;
        
        // ✅ CACHE THE ASSISTANT ID for future requests
        assistantCache.set(cacheKey, currentAssistantId);
        console.log('✅ Created and cached assistant:', currentAssistantId);
      }
    }

    // Step 2: Get or create thread (with conversation memory)
    let currentThreadId = threadId;
    
    // Use sessionId for thread caching (maintains conversation across requests)
    const sessionKey = sessionId || 'default-session';
    
    if (!currentThreadId) {
      // Check if we have a cached thread for this session
      const cachedThreadId = threadCache.get(sessionKey);
      
      if (cachedThreadId) {
        console.log('💬 Reusing cached thread for session:', sessionKey, '→', cachedThreadId);
        currentThreadId = cachedThreadId;
      } else {
        // Create new thread only if no cached thread exists
        console.log('🆕 Creating new thread for session:', sessionKey);
        
        const threadResponse = await fetch('https://api.openai.com/v1/threads', {
          method: 'POST',
          headers: authHeaders,
          body: JSON.stringify({})
        });

        if (!threadResponse.ok) {
          const errorData = await threadResponse.json().catch(() => ({}));
          return NextResponse.json(
            { 
              error: `Failed to create thread: ${threadResponse.status}`,
              details: errorData
            },
            { status: threadResponse.status }
          );
        }

        const threadData = await threadResponse.json();
        currentThreadId = threadData.id;
        
        // ✅ CACHE THE THREAD ID for conversation continuity
        threadCache.set(sessionKey, currentThreadId);
        console.log('✅ Created and cached thread:', currentThreadId, 'for session:', sessionKey);
      }
    } else {
      console.log('📌 Using provided thread ID:', currentThreadId);
    }

    // Step 3: Add message to thread
    const messageResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        role: 'user',
        content: input
      })
    });

    if (!messageResponse.ok) {
      const errorData = await messageResponse.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: `Failed to add message: ${messageResponse.status}`,
          details: errorData
        },
        { status: messageResponse.status }
      );
    }

    // Step 4: Run the assistant
    const runResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        assistant_id: currentAssistantId,
        max_completion_tokens: max_tokens || 1000
      })
    });

    if (!runResponse.ok) {
      const errorData = await runResponse.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: `Failed to run assistant: ${runResponse.status}`,
          details: errorData
        },
        { status: runResponse.status }
      );
    }

    const runData = await runResponse.json();
    const runId = runData.id;
    console.log('Started run:', runId);

    // Step 5: Poll for completion
    let runStatus = 'in_progress';
    let attempts = 0;
    const maxAttempts = 30; // 30 seconds timeout
    let handoffDetected = null; // Track handoff detection across polling

    while (runStatus === 'in_progress' || runStatus === 'queued') {
      if (attempts >= maxAttempts) {
        return NextResponse.json(
          { error: 'Assistant run timed out' },
          { status: 408 }
        );
      }

      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
      attempts++;

      const statusResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs/${runId}`, {
        headers: authHeaders
      });

      if (statusResponse.ok) {
        const statusData = await statusResponse.json();
        runStatus = statusData.status;
        console.log('Run status (attempt ' + attempts + '): ' + runStatus);
        
        // Handle function calls (including MCP calls)
        if (runStatus === 'requires_action' && statusData.required_action?.type === 'submit_tool_outputs') {
          const toolCalls = statusData.required_action.submit_tool_outputs.tool_calls;
          console.log('Function calls required:', toolCalls.length);
          
          const toolOutputs = [];
          
          for (const toolCall of toolCalls) {
            const functionName = toolCall.function?.name;
            const functionArgs = JSON.parse(toolCall.function?.arguments || '{}');
            
            // Skip if function name is missing
            if (!functionName) {
              console.warn('⚠️ Tool call missing function name:', toolCall);
              continue;
            }
            
            console.log('Executing function: ' + functionName, functionArgs);
            
            let output = '';
            
            // Handle tool calls using the enhanced tool system (including MCP servers)
            output = await handleToolCall(functionName, functionArgs, selected_tools, tool_configs, mcp_servers);
            
            // ✅ CHECK FOR HANDOFF in tool output
            try {
              const parsedOutput = JSON.parse(output);
              if (parsedOutput.handoff && parsedOutput.target_agent) {
                console.log('🔄 HANDOFF DETECTED in tool output!');
                
                // Determine execution_mode from handoff_mode or per-target config
                let execution_mode = handoff_mode || 'transfer_control'; // Default to transfer_control
                
                // Check if target has a specific execution_mode override
                if (handoff_targets && handoff_targets.length > 0) {
                  const targetConfig = handoff_targets.find((t: any) => t.agent_node_id === parsedOutput.target_agent);
                  if (targetConfig && targetConfig.execution_mode) {
                    execution_mode = targetConfig.execution_mode;
                  }
                }
                
                handoffDetected = {
                  handoff: true,
                  execution_mode: execution_mode,
                  target_agent: parsedOutput.target_agent,
                  reason: parsedOutput.reason,
                  context_summary: parsedOutput.context_summary,
                  message: parsedOutput.message
                };
                
                console.log('🔄 Handoff execution_mode: ' + execution_mode);
              }
            } catch (e: any) {
              // Not JSON or no handoff, continue normally
            }
            
            toolOutputs.push({
              tool_call_id: toolCall.id,
              output: output
            });
          }
          
          // Submit tool outputs
          const submitResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/runs/${runId}/submit_tool_outputs`, {
            method: 'POST',
            headers: authHeaders,
            body: JSON.stringify({
              tool_outputs: toolOutputs
            })
          });
          
          if (submitResponse.ok) {
            console.log('Tool outputs submitted successfully');
            runStatus = 'in_progress'; // Continue polling
          } else {
            console.error('Failed to submit tool outputs');
            runStatus = 'failed';
          }
        }
      }
    }

    if (runStatus !== 'completed') {
      return NextResponse.json(
        { 
          error: `Assistant run failed with status: ${runStatus}`,
          status: runStatus
        },
        { status: 500 }
      );
    }

    // Step 6: Get the messages from the thread
    const messagesResponse = await fetch(`https://api.openai.com/v1/threads/${currentThreadId}/messages`, {
      headers: authHeaders
    });

    if (!messagesResponse.ok) {
      const errorData = await messagesResponse.json().catch(() => ({}));
      return NextResponse.json(
        { 
          error: `Failed to get messages: ${messagesResponse.status}`,
          details: errorData
        },
        { status: messagesResponse.status }
      );
    }

    const messagesData = await messagesResponse.json();
    
    // Get the latest assistant message
    const assistantMessages = messagesData.data.filter((msg: any) => msg.role === 'assistant');
    if (assistantMessages.length === 0) {
      return NextResponse.json(
        { error: 'No assistant response found' },
        { status: 500 }
      );
    }

    const latestMessage = assistantMessages[0];
    const content = latestMessage.content[0]?.text?.value || 'No content generated';

    // ✅ DON'T DELETE THREAD - Keep it for conversation memory!
    // The thread will be reused in subsequent requests with the same sessionId
    console.log('💾 Thread preserved for conversation continuity:', currentThreadId);
    console.log('💬 Use sessionId:', sessionKey, 'to continue this conversation');

    // Format response to match expected format
    const result = {
      output: content,
      content: content,
      text: content,
      assistantId: currentAssistantId,
      threadId: currentThreadId, // ✅ Return threadId for conversation continuity
      sessionId: sessionKey, // ✅ Return sessionId for easy reuse
      runId: runId,
      success: true,
      conversationActive: true // ✅ Indicates conversation memory is active
    };

    // ✅ INCLUDE HANDOFF DATA if detected
    if (handoffDetected) {
      console.log('🔄 Including handoff data in API response:', handoffDetected);
      Object.assign(result, handoffDetected);
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Error in OpenAI Agent SDK API route:', error);
    return NextResponse.json(
      { 
        error: 'OpenAI Agent SDK processing failed',
        message: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  }
}

// MCP handling removed - was just mock implementations

// Enhanced Tool Call Handler - Supports all tools from the Tool Library and MCP Servers
async function handleToolCall(functionName: string, args: any, tools: any[], toolConfigs: any = {}, mcpServers: any[] = []) {
  try {
    console.log('🛠️ Executing tool: ' + functionName, args);
    
    // ✅ AGENT HANDOFF HANDLER - Check if this is a transfer_to_agent call
    if (functionName === 'transfer_to_agent') {
      console.log('🔄 Agent handoff requested:', args);
      
      const targetAgentId = args.target_agent;
      const reason = args.reason;
      const contextSummary = args.context_summary || '';
      
      // Return special handoff response format
      return JSON.stringify({
        success: true,
        handoff: true,
        target_agent: targetAgentId,
        reason: reason,
        context_summary: contextSummary,
        message: 'Transferring to ' + targetAgentId + ': ' + reason
      });
    }
    
    // Import tool handlers dynamically
    const {
      handleWebSearchTool,
      handleHttpRequestTool,
      handleJsonProcessorTool,
      handleTextProcessorTool,
      handleMathCalculatorTool,
      handleDateTimeTool,
      handleUuidGeneratorTool,
      handleCsvProcessorTool,
      handleEmailValidatorTool
    } = await import('../../../lib/tool-handlers');
    
    // Dynamic tool dispatch - maps function names to tool handlers
    const toolHandlers: Record<string, () => Promise<string>> = {
      // External API Tools
      'search_web': () => handleWebSearchTool(args, toolConfigs?.web_search),
      'web_search': () => handleWebSearchTool(args, toolConfigs?.web_search), // Legacy alias
      'make_http_request': () => handleHttpRequestTool(args, toolConfigs?.http_request),
      
      // Data Processing Tools
      'parse_json': () => handleJsonProcessorTool({...args, _function: 'parse_json'}, toolConfigs?.json_processor),
      'extract_json_path': () => handleJsonProcessorTool({...args, _function: 'extract_json_path'}, toolConfigs?.json_processor),
      'extract_text': () => handleTextProcessorTool({...args, _function: 'extract_text'}, toolConfigs?.text_processor),
      'format_text': () => handleTextProcessorTool({...args, _function: 'format_text'}, toolConfigs?.text_processor),
      'calculate': () => handleMathCalculatorTool({...args, _function: 'calculate'}, toolConfigs?.math_calculator),
      'statistics': () => handleMathCalculatorTool({...args, _function: 'statistics'}, toolConfigs?.math_calculator),
      
      // Utility Tools
      'current_datetime': () => handleDateTimeTool({...args, _function: 'current_datetime'}, toolConfigs?.date_time),
      'format_date': () => handleDateTimeTool({...args, _function: 'format_date'}, toolConfigs?.date_time),
      'generate_uuid': () => handleUuidGeneratorTool({...args, _function: 'generate_uuid'}, toolConfigs?.uuid_generator),
      'generate_random': () => handleUuidGeneratorTool({...args, _function: 'generate_random'}, toolConfigs?.uuid_generator),
      
      // File Processing Tools
      'parse_csv': () => handleCsvProcessorTool({...args, _function: 'parse_csv'}, toolConfigs?.csv_processor),
      
      // Communication Tools
      'validate_email': () => handleEmailValidatorTool({...args, _function: 'validate_email'}, toolConfigs?.email_validator)
    };

    // 🔗 MCP SERVER HANDLING - Check if this is an MCP server call first
    if (mcpServers && mcpServers.length > 0) {
      console.log('🔗 Checking MCP servers for function:', functionName);
      console.log('🔗 Available MCP servers:', mcpServers.filter((s: any) => s.enabled).map((s: any) => s.name));
      
      // 🚀 UNIVERSAL MCP SERVER ROUTING
      let targetServer = null;
      let mcpFunctionName = functionName;
      let mcpArgs = args;
      let functionNamesToTry: string[] = [functionName]; // Declare at outer scope for fallback logic
      
      console.log('🔍 Looking for MCP server that can handle function: ' + functionName);
      
      // 1. Check if this is a generic MCP call (mcp_serverid_call)
      if (functionName.startsWith('mcp_') && functionName.endsWith('_call')) {
        const serverIdPattern = functionName.replace('mcp_', '').replace('_call', '');
        targetServer = mcpServers.find((s: any) => s.enabled && s.id.replace(/[^a-zA-Z0-9]/g, '_') === serverIdPattern);
        if (targetServer) {
          console.log('🎯 Found server by ID pattern: ' + targetServer.name);
          mcpFunctionName = args.function_name || functionName;
          mcpArgs = args.arguments || args;
        }
      }
      
      // 2. If not found, discover which servers have this exact function
      if (!targetServer) {
        console.log('🔍 Discovering which MCP servers have function: ' + functionName);
        
        for (const server of mcpServers) {
          if (!server.enabled) continue;
          
          try {
            // Try to get server capabilities
            let serverHasFunction = false;
            const discoveryEndpoints = ['', '/mcp', '/'];
            
            for (const endpoint of discoveryEndpoints) {
              try {
                let discoveryUrl = server.url;
                if (endpoint && !discoveryUrl.endsWith('/')) {
                  discoveryUrl = discoveryUrl + endpoint;
                }
                
                const capabilitiesResponse = await fetch(discoveryUrl, {
                  method: 'GET',
                  headers: { 'Content-Type': 'application/json' }
                });
                
                if (capabilitiesResponse.ok) {
                  const capabilities = await capabilitiesResponse.json();
                  if (capabilities.tools && Array.isArray(capabilities.tools)) {
                    serverHasFunction = capabilities.tools.some((tool: any) => tool?.name === functionName);
                    if (serverHasFunction) {
                      console.log('✅ Found function ' + functionName + ' on server: ' + server.name);
                      targetServer = server;
                      break;
                    }
                  }
                  break; // Found capabilities, don't try other endpoints
                }
              } catch (discoveryError: any) {
                continue; // Try next endpoint
              }
            }
            
            if (targetServer) break; // Found the server, stop searching
            
          } catch (serverError: any) {
            console.log('⚠️ Could not check capabilities for server: ' + server.name);
            continue;
          }
        }
      }
      
      // 3. If still not found, try heuristic matching based on function name
      if (!targetServer) {
        console.log('🔍 Using heuristic matching for function: ' + functionName);
        
        // Try to match function name to server type
        const functionLower = functionName.toLowerCase();
        
        if (functionLower.includes('time') || functionLower.includes('date')) {
          targetServer = mcpServers.find((s: any) => s.enabled && (s.name.toLowerCase().includes('time') || s.url.includes('time')));
        } else if (functionLower.includes('email') || functionLower.includes('mail') || functionLower.includes('smtp')) {
          targetServer = mcpServers.find((s: any) => s.enabled && (s.name.toLowerCase().includes('email') || s.name.toLowerCase().includes('mail') || s.name.toLowerCase().includes('smtp')));
        } else if (functionLower.includes('file') || functionLower.includes('read') || functionLower.includes('write')) {
          targetServer = mcpServers.find((s: any) => s.enabled && (s.name.toLowerCase().includes('file') || s.name.toLowerCase().includes('filesystem')));
        } else if (functionLower.includes('database') || functionLower.includes('query') || functionLower.includes('db')) {
          targetServer = mcpServers.find((s: any) => s.enabled && (s.name.toLowerCase().includes('database') || s.name.toLowerCase().includes('db')));
        }
        
        if (targetServer) {
          console.log('🎯 Matched by heuristic to server: ' + targetServer.name);
        }
      }
      
      // If we found a target server, try it first
      if (targetServer) {
        console.log('🎯 Routing ' + functionName + ' to MCP server: ' + targetServer.name);
        
        // 🚀 SMART FUNCTION NAME RESOLUTION
        // Reassign to use mcpFunctionName (may have been modified by ID pattern matching)
        functionNamesToTry = [mcpFunctionName];
        
        // First, try to discover available tools from this specific server
        let discoveredTools = [];
        try {
          console.log('🔍 Getting available tools from MCP server: ' + targetServer.name);
          
          const discoveryEndpoints = ['', '/mcp', '/'];
          for (const endpoint of discoveryEndpoints) {
            try {
              let discoveryUrl = targetServer.url;
              if (endpoint && !discoveryUrl.endsWith('/')) {
                discoveryUrl = discoveryUrl + endpoint;
              }
              
              const capabilitiesResponse = await fetch(discoveryUrl, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
              });
              
              if (capabilitiesResponse.ok) {
                const capabilities = await capabilitiesResponse.json();
                if (capabilities.tools && Array.isArray(capabilities.tools)) {
                  discoveredTools = capabilities.tools.map((tool: any) => tool?.name || 'unnamed_tool').filter((name: string) => name !== 'unnamed_tool');
                  console.log('🔍 Discovered tools from ' + targetServer.name + ':', discoveredTools);
                  break;
                }
              }
            } catch (discoveryError: any) {
              continue;
            }
          }
        } catch (discoveryError: any) {
          console.log('⚠️ Could not discover tools from ' + targetServer.name);
        }
        
        // If we have discovered tools, prioritize the exact match or use all discovered tools
        if (discoveredTools.length > 0) {
          if (discoveredTools.includes(functionName)) {
            // Exact match found
            functionNamesToTry = [functionName];
            console.log('✅ Exact function match found: ' + functionName);
          } else {
            // Try all discovered tools (maybe OpenAI mapped to a different name)
            functionNamesToTry = [...discoveredTools, functionName];
            console.log('🔄 Will try all discovered tools for ' + functionName);
          }
        } else {
          // Fallback: Try common variations based on the function name
          console.log('🔄 Using fallback function name variations for: ' + functionName);
          
          const baseName = functionName.toLowerCase();
          const variations = [
            functionName, // Original
            baseName, // lowercase
            baseName.replace(/_/g, '-'), // underscores to dashes
            baseName.replace(/-/g, '_'), // dashes to underscores
            // Add camelCase variations
            functionName.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase()),
            // Add simple variations
            'execute', 'run', 'call', 'invoke'
          ];
          
          functionNamesToTry = Array.from(new Set(variations)); // Remove duplicates
        }
        
        for (const tryFunctionName of functionNamesToTry) {
          // 🚀 SMART ENDPOINT DISCOVERY
          let endpointsToTry = ['/mcp', '/', '/execute']; // Standard endpoints
          
          // Try to discover the best endpoint for this server
          console.log('🔍 Finding best endpoint for ' + targetServer.name);
          
          for (const endpoint of endpointsToTry) {
            try {
              console.log('🔗 Calling MCP server: ' + targetServer.name + ' at ' + targetServer.url + endpoint);
              console.log('🔗 Trying function: ' + (tryFunctionName || '(empty)') + ', Args:', mcpArgs);
              
              // 🚀 SMART REQUEST FORMAT
              let requestBody;
              let requestId = Date.now();
              
              // Try MCP tools/call format first (most common for MCP servers)
              requestBody = JSON.stringify({
                jsonrpc: '2.0',
                method: 'tools/call',
                params: {
                  name: tryFunctionName,
                  arguments: mcpArgs || {}
                },
                id: requestId
              });
              
              console.log('📤 Request format: MCP tools/call');
              console.log('📤 Function: ' + tryFunctionName);
              console.log('📤 Arguments:', mcpArgs);
              
              // Determine the correct endpoint for this MCP server
              let serverUrl = targetServer.url;
              if (!serverUrl.endsWith(endpoint) && !serverUrl.endsWith('/')) {
                serverUrl = serverUrl + endpoint;
              } else if (serverUrl.endsWith('/') && endpoint !== '/') {
                serverUrl = serverUrl + endpoint.substring(1);
              }
              
              // Make call to MCP server
              const mcpResponse = await fetch(serverUrl, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: requestBody
              });
            
            if (mcpResponse.ok) {
              const mcpResult = await mcpResponse.json();
              
              // Handle JSON-RPC 2.0 response format
              if (mcpResult.jsonrpc === '2.0') {
                if (mcpResult.error) {
                  console.log('⚠️ MCP server ' + targetServer.name + ' returned JSON-RPC error for ' + tryFunctionName + ':', mcpResult.error.message);
                  // Try next function name
                  continue;
                } else if (mcpResult.result !== undefined) {
                  console.log('✅ MCP server ' + targetServer.name + ' handled function ' + tryFunctionName + ' (mapped from ' + functionName + ')');
                  
                  // Parse MCP response format
                  let parsedResult = mcpResult.result;
                  
                  // Handle MCP tool response format with content array
                  if (mcpResult.result.content && Array.isArray(mcpResult.result.content)) {
                    console.log('📋 Processing MCP content response...');
                    const textContent = mcpResult.result.content
                      .filter((item: any) => item.type === 'text')
                      .map((item: any) => item.text)
                      .join(' ');
                    
                    // Try to parse as JSON if it looks like JSON
                    try {
                      if (textContent.includes('{') && textContent.includes('}')) {
                        const cleanedText = textContent.replace(/'/g, '"');
                        parsedResult = JSON.parse(cleanedText);
                        console.log('📋 Parsed MCP JSON content:', parsedResult);
                      } else {
                        parsedResult = textContent;
                      }
                    } catch (parseError: any) {
                      console.log('📋 Using raw text content:', textContent);
                      parsedResult = textContent;
                    }
                  }
                  
                  return JSON.stringify({
                    success: true,
                    mcp_server: targetServer.name,
                    result: parsedResult,
                    function: functionName,
                    actual_function_called: tryFunctionName,
                    args: args,
                    timestamp: new Date().toISOString()
                  });
                }
              } else {
                // Handle non-JSON-RPC response
                console.log('✅ MCP server ' + targetServer.name + ' handled function ' + tryFunctionName);
                return JSON.stringify({
                  success: true,
                  mcp_server: targetServer.name,
                  result: mcpResult,
                  function: functionName,
                  actual_function_called: tryFunctionName,
                  args: args,
                  timestamp: new Date().toISOString()
                });
              }
            } else {
              const errorText = await mcpResponse.text();
              console.log('⚠️ MCP server ' + targetServer.name + ' returned status ' + mcpResponse.status + ' for ' + tryFunctionName + ' at ' + endpoint);
              // Continue to next endpoint
              continue;
            }
            
          } catch (mcpError: any) {
            console.log('❌ MCP server ' + targetServer.name + ' error for ' + tryFunctionName + ' at ' + endpoint + ':', mcpError.message);
            // Continue to next endpoint
            continue;
          }
        }
        
          // If we get here, none of the endpoints worked for this function
          console.log('⚠️ None of the endpoints worked for function ' + tryFunctionName + ' on server ' + targetServer.name);
        }
        
        console.log('⚠️ None of the function names worked for ' + targetServer.name);
      }
      
      // 🔄 FALLBACK: Try other enabled servers if target server failed
      if (!targetServer || !functionNamesToTry.length) {
        console.log('🔄 No target server found or function failed, trying all enabled MCP servers...');
        
        for (const mcpServer of mcpServers) {
          if (!mcpServer.enabled || mcpServer === targetServer) continue;
          
          console.log('🔄 Fallback attempt with server: ' + mcpServer.name);
          
          // Try a simple MCP call to this server
          try {
            const fallbackResponse = await fetch(mcpServer.url + '/mcp', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                method: 'tools/call',
                params: {
                  name: functionName,
                  arguments: args || {}
                },
                id: Date.now()
              })
            });
            
            if (fallbackResponse.ok) {
              const result = await fallbackResponse.json();
              if (result.jsonrpc === '2.0' && result.result) {
                console.log('✅ Fallback success with server: ' + mcpServer.name);
                
                let parsedResult = result.result;
                if (result.result.content && Array.isArray(result.result.content)) {
                  const textContent = result.result.content
                    .filter((item: any) => item.type === 'text')
                    .map((item: any) => item.text)
                    .join(' ');
                  parsedResult = textContent;
                }
                
                return JSON.stringify({
                  success: true,
                  mcp_server: mcpServer.name,
                  result: parsedResult,
                  function: functionName,
                  args: args,
                  timestamp: new Date().toISOString()
                });
              }
            }
          } catch (fallbackError: any) {
            console.log('⚠️ Fallback failed for ' + mcpServer.name + ':', fallbackError.message);
            continue;
          }
        }
      }
    }

    // Check if the function handler exists in regular tools
    const handler = toolHandlers[functionName];
    if (!handler) {
      const availableTools = Object.keys(toolHandlers);
      return JSON.stringify({
        success: false,
        error: 'Unknown tool function: ' + functionName,
        available_functions: availableTools,
        suggestion: 'Did you mean one of: ' + availableTools.slice(0, 5).join(', ') + '?'
      });
    }

    // Execute the tool function
    const result = await handler();
    console.log('🛠️ Tool execution result for ' + functionName + ':', result);
    return result;
    
  } catch (error: any) {
    console.error('Tool execution error for ' + functionName + ':', error);
    return JSON.stringify({
      success: false,
      error: 'Tool call failed: ' + (error instanceof Error ? error.message : String(error)),
      tool: functionName,
      args: args,
      timestamp: new Date().toISOString()
    });
  }
}

// Tool implementations moved to tools/tool-handlers.ts

// Context Management Tool (Basic Implementation)
async function handleContextManagementTool(args: any): Promise<string> {
  try {
    const action = args.action || args.operation;
    
    switch (action) {
      case 'set_context':
      case 'set':
        const key = args.key || args.context_key;
        const value = args.value || args.context_value || args.data;
        
        if (!key) {
          return JSON.stringify({
            success: false,
            error: 'Context key is required for set operation',
            expected_args: { action: 'set', key: 'string', value: 'any' }
          });
        }
        
        // Store in browser localStorage (browser) or server-side Map (API routes/webhooks)
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem('context_' + key, JSON.stringify(value));
            return JSON.stringify({
              success: true,
              action: 'set_context',
              key: key,
              message: 'Context ' + key + ' has been stored',
              storage: 'localStorage'
            });
          } catch (storageError: any) {
            return JSON.stringify({
              success: false,
              error: 'Failed to store context data',
              key: key
            });
          }
        } else {
          // Server-side execution (webhook triggers, API routes) - use in-memory Map
          try {
            contextStorage.set(key, value);
            return JSON.stringify({
              success: true,
              action: 'set_context',
              key: key,
              message: 'Context ' + key + ' has been stored',
              storage: 'server-memory',
              note: 'Data persists only during server runtime. For production, consider using a database.'
            });
          } catch (storageError: any) {
            return JSON.stringify({
              success: false,
              error: 'Failed to store context data',
              key: key
            });
          }
        }
        
      case 'get_context':
      case 'get':
        const getKey = args.key || args.context_key;
        
        if (!getKey) {
          return JSON.stringify({
            success: false,
            error: 'Context key is required for get operation',
            expected_args: { action: 'get', key: 'string' }
          });
        }
        
        // Retrieve from browser localStorage (browser) or server-side Map (API routes/webhooks)
        if (typeof window !== 'undefined') {
          try {
            const stored = window.localStorage.getItem('context_' + getKey);
            const storedValue = stored ? JSON.parse(stored) : null;
            return JSON.stringify({
              success: true,
              action: 'get_context',
              key: getKey,
              value: storedValue,
              found: storedValue !== null,
              storage: 'localStorage'
            });
          } catch (parseError: any) {
            return JSON.stringify({
              success: false,
              error: 'Failed to retrieve context data',
              key: getKey
            });
          }
        } else {
          // Server-side execution (webhook triggers, API routes) - use in-memory Map
          try {
            const storedValue = contextStorage.get(getKey) || null;
            return JSON.stringify({
              success: true,
              action: 'get_context',
              key: getKey,
              value: storedValue,
              found: storedValue !== null,
              storage: 'server-memory'
            });
          } catch (error: any) {
            return JSON.stringify({
              success: false,
              error: 'Failed to retrieve context data',
              key: getKey
            });
          }
        }
        
      default:
        return JSON.stringify({
          success: false,
          error: 'Unknown context action: ' + action,
          available_actions: ['set_context', 'get_context'],
          expected_args: { action: 'set|get', key: 'string', value: 'any (for set)' }
        });
    }
  } catch (error: any) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Context management error'
    });
  }
}

// Memory Tool (Basic Implementation)
async function handleMemoryTool(args: any): Promise<string> {
  try {
    const action = args.action || args.operation;
    
    switch (action) {
      case 'store_memory':
      case 'store':
        const key = args.key || args.memory_key;
        const value = args.value || args.memory_value || args.data;
        const tags = args.tags || [];
        
        if (!key) {
          return JSON.stringify({
            success: false,
            error: 'Memory key is required for store operation',
            expected_args: { action: 'store', key: 'string', value: 'any', tags: 'array (optional)' }
          });
        }
        
        const memoryData = {
          value: value,
          tags: Array.isArray(tags) ? tags : [],
          timestamp: new Date().toISOString()
        };
        
        // Store in browser localStorage (browser) or server-side Map (API routes/webhooks)
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(`memory_${key}`, JSON.stringify(memoryData));
            return JSON.stringify({
              success: true,
              action: 'store_memory',
              key: key,
              tags: memoryData.tags,
              timestamp: memoryData.timestamp,
              message: `Memory '${key}' has been stored`,
              storage: 'localStorage'
            });
          } catch (storageError: any) {
            return JSON.stringify({
              success: false,
              error: 'Failed to store memory data',
              key: key
            });
          }
        } else {
          // Server-side execution (webhook triggers, API routes) - use in-memory Map
          try {
            memoryStorage.set(key, memoryData);
            return JSON.stringify({
              success: true,
              action: 'store_memory',
              key: key,
              tags: memoryData.tags,
              timestamp: memoryData.timestamp,
              message: `Memory '${key}' has been stored`,
              storage: 'server-memory',
              note: 'Data persists only during server runtime. For production, consider using a database.'
            });
          } catch (storageError: any) {
            return JSON.stringify({
              success: false,
              error: 'Failed to store memory data',
              key: key
            });
          }
        }
        
      case 'retrieve_memory':
      case 'retrieve':
        const retrieveKey = args.key || args.memory_key;
        
        if (!retrieveKey) {
          return JSON.stringify({
            success: false,
            error: 'Memory key is required for retrieve operation',
            expected_args: { action: 'retrieve', key: 'string' }
          });
        }
        
        // Retrieve from browser localStorage (browser) or server-side Map (API routes/webhooks)
        if (typeof window !== 'undefined') {
          try {
            const stored = window.localStorage.getItem(`memory_${retrieveKey}`);
            const memoryValue = stored ? JSON.parse(stored) : null;
            return JSON.stringify({
              success: true,
              action: 'retrieve_memory',
              key: retrieveKey,
              data: memoryValue,
              found: memoryValue !== null,
              storage: 'localStorage'
            });
          } catch (parseError: any) {
            return JSON.stringify({
              success: false,
              error: 'Failed to retrieve memory data',
              key: retrieveKey
            });
          }
        } else {
          // Server-side execution (webhook triggers, API routes) - use in-memory Map
          try {
            const memoryValue = memoryStorage.get(retrieveKey) || null;
            return JSON.stringify({
              success: true,
              action: 'retrieve_memory',
              key: retrieveKey,
              data: memoryValue,
              found: memoryValue !== null,
              storage: 'server-memory'
            });
          } catch (error: any) {
            return JSON.stringify({
              success: false,
              error: 'Failed to retrieve memory data',
              key: retrieveKey
            });
          }
        }
        
      default:
        return JSON.stringify({
          success: false,
          error: `Unknown memory action: ${action}`,
          available_actions: ['store_memory', 'retrieve_memory'],
          expected_args: { action: 'store|retrieve', key: 'string', value: 'any (for store)', tags: 'array (optional for store)' }
        });
    }
  } catch (error: any) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Memory tool error'
    });
  }
}

// Workflow Context Tool (Advanced Context Management)
async function handleWorkflowContextTool(args: any): Promise<string> {
  try {
    const action = args.action || args.operation;
    
    switch (action) {
      case 'set_workflow_context':
      case 'set':
        const workflowId = args.workflow_id || 'default';
        const key = args.key || args.context_key;
        const value = args.value || args.context_value || args.data;
        const metadata = args.metadata || {};
        
        if (!key) {
          return JSON.stringify({
            success: false,
            error: 'Context key is required for set operation',
            expected_args: { action: 'set', workflow_id: 'string (optional)', key: 'string', value: 'any', metadata: 'object (optional)' }
          });
        }
        
        const contextData = {
          value: value,
          metadata: metadata,
          workflow_id: workflowId,
          timestamp: new Date().toISOString()
        };
        
        // Store in browser localStorage (browser) or server-side Map (API routes/webhooks)
        if (typeof window !== 'undefined') {
          try {
            window.localStorage.setItem(`workflow_context_${workflowId}_${key}`, JSON.stringify(contextData));
            return JSON.stringify({
              success: true,
              action: 'set_workflow_context',
              workflow_id: workflowId,
              key: key,
              timestamp: contextData.timestamp,
              message: `Workflow context '${key}' has been stored for workflow '${workflowId}'`,
              storage: 'localStorage'
            });
          } catch (storageError: any) {
            return JSON.stringify({
              success: false,
              error: 'Failed to store workflow context data',
              workflow_id: workflowId,
              key: key
            });
          }
        } else {
          // Server-side execution (webhook triggers, API routes) - use in-memory Map
          try {
            const storageKey = `${workflowId}_${key}`;
            workflowContextStorage.set(storageKey, contextData);
            return JSON.stringify({
              success: true,
              action: 'set_workflow_context',
              workflow_id: workflowId,
              key: key,
              timestamp: contextData.timestamp,
              message: `Workflow context '${key}' has been stored for workflow '${workflowId}'`,
              storage: 'server-memory',
              note: 'Data persists only during server runtime. For production, consider using a database.'
            });
          } catch (storageError: any) {
            return JSON.stringify({
              success: false,
              error: 'Failed to store workflow context data',
              workflow_id: workflowId,
              key: key
            });
          }
        }
        
      case 'get_workflow_context':
      case 'get':
        const getWorkflowId = args.workflow_id || 'default';
        const getKey = args.key || args.context_key;
        
        if (!getKey) {
          return JSON.stringify({
            success: false,
            error: 'Context key is required for get operation',
            expected_args: { action: 'get', workflow_id: 'string (optional)', key: 'string' }
          });
        }
        
        // Retrieve from browser localStorage (browser) or server-side Map (API routes/webhooks)
        if (typeof window !== 'undefined') {
          try {
            const stored = window.localStorage.getItem(`workflow_context_${getWorkflowId}_${getKey}`);
            const contextValue = stored ? JSON.parse(stored) : null;
            return JSON.stringify({
              success: true,
              action: 'get_workflow_context',
              workflow_id: getWorkflowId,
              key: getKey,
              data: contextValue,
              found: contextValue !== null,
              storage: 'localStorage'
            });
          } catch (parseError: any) {
            return JSON.stringify({
              success: false,
              error: 'Failed to retrieve workflow context data',
              workflow_id: getWorkflowId,
              key: getKey
            });
          }
        } else {
          // Server-side execution (webhook triggers, API routes) - use in-memory Map
          try {
            const storageKey = `${getWorkflowId}_${getKey}`;
            const contextValue = workflowContextStorage.get(storageKey) || null;
            return JSON.stringify({
              success: true,
              action: 'get_workflow_context',
              workflow_id: getWorkflowId,
              key: getKey,
              data: contextValue,
              found: contextValue !== null,
              storage: 'server-memory'
            });
          } catch (error: any) {
            return JSON.stringify({
              success: false,
              error: 'Failed to retrieve workflow context data',
              workflow_id: getWorkflowId,
              key: getKey
            });
          }
        }
        
      default:
        return JSON.stringify({
          success: false,
          error: `Unknown workflow context action: ${action}`,
          available_actions: ['set_workflow_context', 'get_workflow_context'],
          expected_args: { action: 'set|get', workflow_id: 'string (optional)', key: 'string', value: 'any (for set)', metadata: 'object (optional for set)' }
        });
    }
  } catch (error: any) {
    return JSON.stringify({
      success: false,
      error: error instanceof Error ? error.message : 'Workflow context tool error'
    });
  }
}

// Mock MCP server handlers removed - were not real implementations
