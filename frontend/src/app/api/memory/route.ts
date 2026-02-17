import { NextRequest, NextResponse } from 'next/server';

// In-memory storage for development (use Redis/Database in production)
const memoryStore = new Map<string, any[]>();

interface MemoryOperationResult {
  success: boolean;
  operationType: 'store' | 'retrieve' | 'clear' | 'consolidate';
  data?: any;
  error?: string;
}

interface StoredMemory {
  id: string;
  agentId: string;
  userId: string;
  sessionId?: string;
  message: {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: string;
    metadata?: any;
    importance?: number;
  };
  timestamp: string;
  importance: number;
  embedding?: number[];
}

// Generate unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

// Generate memory key for storage
function getMemoryKey(agentId: string, userId: string, sessionId?: string): string {
  return sessionId 
    ? `${agentId}:${userId}:${sessionId}`
    : `${agentId}:${userId}`;
}

// Memory API
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { operation, ...data } = body;

    switch (operation) {
      case 'store':
        return await handleStore(data);
      case 'retrieve':
        return await handleRetrieve(data);
      case 'clear':
        return await handleClear(data);
      default:
        // Default to store operation for backward compatibility
        return await handleStore(body);
    }
  } catch (error) {
    console.error('Memory API error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error',
        operationType: 'unknown'
      },
      { status: 500 }
    );
  }
}

async function handleStore(data: any): Promise<NextResponse> {
  const {
    user_id,
    agent_id,
    interaction_type,
    input_data,
    output_data,
    metadata = {},
    memory_type = 'simple',
    session_id
  } = data;

  if (!user_id || !agent_id) {
    return NextResponse.json(
      { success: false, error: 'user_id and agent_id are required', operationType: 'store' },
      { status: 400 }
    );
  }

  try {
    const result: MemoryOperationResult = {
      success: true,
      operationType: 'store'
    };

    switch (memory_type) {
      case 'simple':
      case 'buffer_window':
      case 'conversation_buffer':
        result.data = await storeInMemory(user_id, agent_id, interaction_type, input_data, output_data, metadata, session_id);
        break;
        
      case 'supabase_vector':
      case 'postgres_chat':
        result.data = await storeInSupabase(user_id, agent_id, interaction_type, input_data, output_data, metadata, session_id);
        break;
        
      case 'longterm_semantic':
      case 'semantic_longterm':
      case 'longterm_vector':
        result.data = await storeInLongTermSemantic(user_id, agent_id, interaction_type, input_data, output_data, metadata, session_id);
        break;
        
      case 'redis_session':
        result.data = await storeInRedis(user_id, agent_id, interaction_type, input_data, output_data, metadata, session_id);
        break;
        
      default:
        result.data = await storeInMemory(user_id, agent_id, interaction_type, input_data, output_data, metadata, session_id);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Store operation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Store operation failed',
        operationType: 'store'
      },
      { status: 500 }
    );
  }
}

async function handleRetrieve(data: any): Promise<NextResponse> {
  const {
    user_id,
    agent_id,
    memory_type = 'simple',
    session_id,
    limit = 10,
    query
  } = data;

  if (!user_id || !agent_id) {
    return NextResponse.json(
      { success: false, error: 'user_id and agent_id are required', operationType: 'retrieve' },
      { status: 400 }
    );
  }

  try {
    const result: MemoryOperationResult = {
      success: true,
      operationType: 'retrieve'
    };

    switch (memory_type) {
      case 'simple':
      case 'buffer_window':
      case 'conversation_buffer':
        result.data = await retrieveFromMemory(agent_id, user_id, session_id, limit, query);
        break;
        
      case 'supabase_vector':
      case 'postgres_chat':
        result.data = await retrieveFromSupabase(user_id, agent_id, limit, query);
        break;
        
      case 'longterm_semantic':
      case 'semantic_longterm':
      case 'longterm_vector':
        result.data = await retrieveFromLongTermSemantic(user_id, agent_id, limit, query);
        break;
        
      case 'redis_session':
        result.data = await retrieveFromRedis(user_id, agent_id, session_id, limit, query);
        break;
        
      default:
        result.data = await retrieveFromMemory(agent_id, user_id, session_id, limit, query);
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Retrieve operation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Retrieve operation failed',
        operationType: 'retrieve'
      },
      { status: 500 }
    );
  }
}

async function handleClear(data: any): Promise<NextResponse> {
  const { user_id, agent_id, session_id } = data;

  if (!user_id || !agent_id) {
    return NextResponse.json(
      { success: false, error: 'user_id and agent_id are required', operationType: 'clear' },
      { status: 400 }
    );
  }

  try {
    const memoryKey = getMemoryKey(agent_id, user_id, session_id);
    memoryStore.delete(memoryKey);

    return NextResponse.json({
      success: true,
      operationType: 'clear',
      data: { message: 'Memory cleared successfully' }
    });
  } catch (error) {
    console.error('Clear operation error:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Clear operation failed',
        operationType: 'clear'
      },
      { status: 500 }
    );
  }
}

async function storeInMemory(
  userId: string, 
  agentId: string, 
  interactionType: string, 
  inputData: any, 
  outputData: any, 
  metadata: any,
  sessionId?: string
): Promise<any> {
  const memoryKey = getMemoryKey(agentId, userId, sessionId);
  
  if (!memoryStore.has(memoryKey)) {
    memoryStore.set(memoryKey, []);
  }
  
  const memories = memoryStore.get(memoryKey)!;
  
  // Handle conversation interactions by storing both user and assistant messages
  if (interactionType === 'conversation' && inputData && outputData) {
    // Store user message
    const userMemory: StoredMemory = {
      id: generateId(),
      agentId,
      userId,
      sessionId,
      message: {
        role: 'user',
        content: inputData.content,
        timestamp: inputData.timestamp || new Date().toISOString(),
        metadata,
        importance: metadata.importance || 0.5
      },
      timestamp: inputData.timestamp || new Date().toISOString(),
      importance: metadata.importance || 0.5
    };
    
    // Store assistant message
    const assistantMemory: StoredMemory = {
      id: generateId(),
      agentId,
      userId,
      sessionId,
      message: {
        role: 'assistant',
        content: outputData.content,
        timestamp: outputData.timestamp || new Date().toISOString(),
        metadata,
        importance: metadata.importance || 0.5
      },
      timestamp: outputData.timestamp || new Date().toISOString(),
      importance: metadata.importance || 0.5
    };
    
    memories.push(userMemory, assistantMemory);
    console.log(`🧠 Stored conversation: ${inputData.content.substring(0, 30)}... -> ${outputData.content.substring(0, 30)}...`);
  } else {
    // Handle legacy single-message format
    const content = interactionType === 'input' ? (inputData.prompt || inputData.content) : (outputData.response || outputData.content);
    
    const memory: StoredMemory = {
      id: generateId(),
      agentId,
      userId,
      sessionId,
      message: {
        role: interactionType === 'input' ? 'user' : 'assistant',
        content,
        timestamp: new Date().toISOString(),
        metadata,
        importance: metadata.importance || 0.5
      },
      timestamp: new Date().toISOString(),
      importance: metadata.importance || 0.5
    };
    
    memories.push(memory);
    console.log(`🧠 Stored message: ${content.substring(0, 50)}...`);
  }
  
  // Apply memory limits
  const maxMemories = metadata.max_messages || 100;
  if (memories.length > maxMemories) {
    memories.splice(0, memories.length - maxMemories);
  }
  
  memoryStore.set(memoryKey, memories);
  
  return {
    interaction_id: memories[memories.length - 1]?.id,
    memory_count: memories.length
  };
}

async function retrieveFromMemory(
  agentId: string, 
  userId: string, 
  sessionId: string | null, 
  limit: number,
  query?: string | null
): Promise<any[]> {
  const memoryKey = getMemoryKey(agentId, userId, sessionId || undefined);
  const memories = memoryStore.get(memoryKey) || [];
  
  // Sort by timestamp (most recent first)
  const sortedMemories = memories.sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  const result = sortedMemories
    .slice(0, limit)
    .map((memory: any) => ({
      input_data: memory.message.role === 'user' ? memory.message : null,
      output_data: memory.message.role === 'assistant' ? memory.message : null,
      timestamp: memory.timestamp,
      metadata: memory.message.metadata
    }))
    .filter((item: any) => item.input_data || item.output_data);
  
  console.log(`🧠 Retrieved ${result.length} memories for agent ${agentId}`);
  return result;
}

// Supabase Vector Memory Functions
async function storeInSupabase(
  userId: string, 
  agentId: string, 
  interactionType: string, 
  inputData: any, 
  outputData: any, 
  metadata: any,
  sessionId?: string
): Promise<any> {
  try {
    // Get Supabase configuration from environment variables (with smart fallbacks for generated apps)
    // Supabase configuration - MUST use environment variables (no hardcoded fallbacks)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const tableName = process.env.SUPABASE_MEMORY_TABLE || 'agent_interactions';
    
    console.log('🔧 Supabase config:', {
      url: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'undefined',
      key: supabaseKey ? 'present (' + supabaseKey.length + ' chars)' : 'undefined',
      table: tableName
    });
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY)');
    }
    
    console.log(`📊 Storing conversation in Supabase table: ${tableName}`);
    
    // Enhanced contextual processing for Database Memory
    const currentTimestamp = new Date().toISOString();
    const interactionId = crypto.randomUUID();
    
    // Generate content summary for contextual understanding
    const generateContentSummary = (content: string): string => {
      if (!content || content.length < 50) return content;
      
      const sentences = content.split(/[.!?]+/).filter((s: string) => s.trim().length > 10);
      const firstSentence = sentences[0]?.trim() || '';
      const keyWords = content.toLowerCase()
        .split(/\W+/)
        .filter((word: string) => word.length > 3)
        .slice(0, 5)
        .join(', ');
      
      return `${firstSentence.substring(0, 100)}... [Keywords: ${keyWords}]`;
    };
    
    // Generate semantic tags for contextual categorization
    const generateSemanticTags = (content: string): string[] => {
      const tags: string[] = [];
      const lowerContent = content.toLowerCase();
      
      const topicMap = {
        'question': ['what', 'how', 'why', 'when', 'where', 'which', '?'],
        'request': ['please', 'can you', 'could you', 'would you', 'help'],
        'information': ['explain', 'tell me', 'describe', 'define', 'show'],
        'problem': ['error', 'issue', 'problem', 'bug', 'wrong', 'fail'],
        'code': ['function', 'class', 'variable', 'method', 'api', 'code'],
        'data': ['database', 'table', 'query', 'data', 'record', 'field']
      };
      
      for (const [topic, keywords] of Object.entries(topicMap)) {
        if (keywords.some((keyword: string) => lowerContent.includes(keyword))) {
          tags.push(topic);
        }
      }
      
      const positiveWords = ['good', 'great', 'excellent', 'perfect', 'thanks'];
      const negativeWords = ['bad', 'terrible', 'wrong', 'error', 'problem'];
      
      if (positiveWords.some((word: string) => lowerContent.includes(word))) tags.push('positive');
      if (negativeWords.some((word: string) => lowerContent.includes(word))) tags.push('negative');
      
      if (content.length > 500) tags.push('detailed');
      if (content.length < 50) tags.push('brief');
      
      return tags.length > 0 ? tags : ['general'];
    };
    
    // Calculate importance score based on content analysis
    const calculateImportanceScore = (content: string, role: string): number => {
      let score = 0.5;
      const lowerContent = content.toLowerCase();
      
      if (role === 'user') score += 0.1;
      if (lowerContent.includes('important') || lowerContent.includes('urgent')) score += 0.3;
      if (lowerContent.includes('error') || lowerContent.includes('problem')) score += 0.2;
      if (lowerContent.includes('help') || lowerContent.includes('please')) score += 0.1;
      if (content.length > 200) score += 0.1;
      if (lowerContent.includes('?') || lowerContent.startsWith('how')) score += 0.15;
      
      return Math.min(1.0, Math.max(0.1, score));
    };
    
    // Process content for contextual features
    const userContent = inputData?.content || '';
    const assistantContent = outputData?.content || '';
    const combinedContent = `${userContent} ${assistantContent}`;
    
    // Prepare enhanced data for agent_interactions table schema
    const interactionData = {
      id: interactionId,
      user_id: userId,
      agent_id: agentId,
      session_id: sessionId || null,
      interaction_type: interactionType || 'conversation',
      input_data: inputData || {},
      output_data: outputData || {},
      record_metadata: {
        ...metadata,
        timestamp: currentTimestamp,
        stored_by: 'smart_agent_generated_app',
        // Enhanced contextual metadata
        contentSummary: generateContentSummary(combinedContent),
        semanticTags: generateSemanticTags(combinedContent),
        contextualData: {
          userMessageLength: userContent.length,
          assistantMessageLength: assistantContent.length,
          hasQuestion: combinedContent.includes('?'),
          sentiment: generateSemanticTags(combinedContent).includes('positive') ? 'positive' : 
                   generateSemanticTags(combinedContent).includes('negative') ? 'negative' : 'neutral',
          topicCategories: generateSemanticTags(combinedContent)
        },
        accessCount: 0,
        lastAccessed: currentTimestamp
      },
      importance: calculateImportanceScore(combinedContent, 'conversation'),
      created_at: currentTimestamp,
      updated_at: currentTimestamp,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString() // Extended to 30 days for better context
    };
    
    console.log('📤 Sending data to Supabase:', {
      table: tableName,
      user_id: userId,
      agent_id: agentId,
      interaction_type: interactionType,
      has_input: !!inputData,
      has_output: !!outputData
    });
    
    // Insert into Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(interactionData)
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Supabase error response:', errorData);
      throw new Error(`Supabase insert failed: ${response.status} - ${errorData}`);
    }
    
    const result = await response.json();
    console.log(`✅ Successfully stored conversation in Supabase:`, result);
    
    return {
      interaction_id: interactionId, // Use the generated ID we created
      stored_messages: Array.isArray(result) ? result.length : 1,
      supabase_result: result
    };
    
  } catch (error) {
    console.error('❌ Supabase storage error:', error);
    throw error;
  }
}

async function storeInLongTermSemantic(
  userId: string, 
  agentId: string, 
  interactionType: string, 
  inputData: any, 
  outputData: any, 
  metadata: any,
  sessionId?: string
): Promise<any> {
  try {
    // Get Long-term Semantic Memory configuration from environment variables
    // Long-term semantic memory uses separate configuration and table
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const tableName = process.env.SUPABASE_LONGTERM_MEMORY_TABLE || 'longterm_semantic_memory';
    
    console.log('🧠 Long-term Semantic Memory config:', {
      url: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'undefined',
      key: supabaseKey ? 'present (' + supabaseKey.length + ' chars)' : 'undefined',
      table: tableName
    });
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing for long-term semantic memory. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY)');
    }
    
    console.log('🧠 Storing long-term semantic memory in Supabase table: ' + tableName);
    
    // Prepare data for longterm_semantic_memory table schema
    // Enhanced schema for semantic analysis and long-term storage
    const currentTimestamp = new Date().toISOString();
    const memoryId = crypto.randomUUID(); // Generate UUID client-side to avoid null constraint
    
    // Enhanced semantic memory data structure
    const semanticMemoryData = {
      id: memoryId,                        // UUID primary key
      user_id: userId,                     // User identifier
      agent_id: agentId,                   // Agent identifier  
      session_id: sessionId || null,      // Session identifier (nullable)
      memory_type: 'semantic',             // Memory type for long-term semantic
      interaction_type: interactionType || 'conversation', // Type of interaction
      content_summary: '',                 // Will be enhanced later with AI summarization
      semantic_tags: [],                   // Will be enhanced later with semantic tagging
      input_data: inputData || {},         // Input data (JSONB)
      output_data: outputData || {},       // Output data (JSONB)
      embedding_vector: null,              // Will be enhanced later with vector embeddings
      importance_score: 0.7,               // Higher importance for long-term memory
      access_count: 0,                     // Track how often this memory is accessed
      last_accessed: currentTimestamp,     // Last access timestamp
      record_metadata: {                   // Enhanced metadata for semantic memory
        ...metadata,
        timestamp: currentTimestamp,
        stored_by: 'longterm_semantic_memory_system',
        memory_category: 'longterm_semantic',
        retention_policy: 'permanent'      // Long-term memories are permanent
      },
      created_at: currentTimestamp,        // Creation timestamp
      updated_at: currentTimestamp,        // Update timestamp  
      expires_at: null                     // Long-term memories don't expire
    };
    
    console.log('🧠 Sending long-term semantic data to Supabase:', {
      table: tableName,
      user_id: userId,
      agent_id: agentId,
      memory_type: 'semantic',
      interaction_type: interactionType,
      has_input: !!inputData,
      has_output: !!outputData
    });
    
    // Insert into Supabase (long-term semantic memory table)
    const response = await fetch(supabaseUrl + '/rest/v1/' + tableName, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + supabaseKey,
        'apikey': supabaseKey,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify(semanticMemoryData)
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Long-term Semantic Memory Supabase error response:', errorData);
      throw new Error('Long-term Semantic Memory Supabase insert failed: ' + response.status + ' - ' + errorData);
    }
    
    const result = await response.json();
    console.log('✅ Successfully stored long-term semantic memory in Supabase:', result);
    
    return {
      memory_id: memoryId, // Use the generated ID we created
      stored_memories: Array.isArray(result) ? result.length : 1,
      memory_type: 'longterm_semantic',
      supabase_result: result
    };
    
  } catch (error) {
    console.error('❌ Long-term Semantic Memory storage error:', error);
    throw error;
  }
}

async function retrieveFromLongTermSemantic(
  userId: string, 
  agentId: string, 
  limit: number = 10,
  query?: string | null
): Promise<any[]> {
  try {
    // Get Long-term Semantic Memory configuration from environment variables
    // Long-term semantic memory uses separate configuration and table
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const tableName = process.env.SUPABASE_LONGTERM_MEMORY_TABLE || 'longterm_semantic_memory';
    
    console.log('🧠 Long-term Semantic Memory config for retrieval:', {
      url: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'undefined',
      key: supabaseKey ? 'present (' + supabaseKey.length + ' chars)' : 'undefined',
      table: tableName
    });
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing for long-term semantic memory retrieval. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY)');
    }
    
    console.log('🧠 Retrieving long-term semantic memory from Supabase table: ' + tableName);
    
    // Build query parameters for longterm_semantic_memory table
    // Enhanced query for semantic memory with importance scoring and access tracking
    let queryString = 'agent_id=eq.' + agentId + '&user_id=eq.' + userId + '&memory_type=eq.semantic';
    
    // Add semantic search if query is provided
    if (query && query.trim()) {
      // For now, use simple text search - will be enhanced with vector similarity later
      queryString += '&or=(content_summary.ilike.*' + encodeURIComponent(query) + '*,semantic_tags.cs.["' + encodeURIComponent(query) + '"])';
    }
    
    // Order by importance and last access for better semantic relevance
    queryString += '&order=importance_score.desc,last_accessed.desc&limit=' + limit;
    
    console.log('🧠 Long-term Semantic Memory query:', queryString);
    
    // Fetch from Supabase (long-term semantic memory table)
    const response = await fetch(supabaseUrl + '/rest/v1/' + tableName + '?' + queryString, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + supabaseKey,
        'apikey': supabaseKey
      }
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Long-term Semantic Memory Supabase query error:', errorData);
      throw new Error('Long-term Semantic Memory Supabase query failed: ' + response.status + ' - ' + errorData);
    }
    
    const supabaseData = await response.json();
    console.log('🧠 Retrieved ' + supabaseData.length + ' long-term semantic memories from Supabase');
    
    // Update access count and last_accessed for retrieved memories (fire-and-forget)
    if (supabaseData.length > 0) {
      const memoryIds = supabaseData.map((item: any) => item.id);
      const updatePromise = fetch(supabaseUrl + '/rest/v1/' + tableName + '?id=in.(' + memoryIds.join(',') + ')', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + supabaseKey,
          'apikey': supabaseKey
        },
        body: JSON.stringify({
          access_count: 'access_count + 1', // Increment access count
          last_accessed: new Date().toISOString()
        })
      }).catch(err => console.warn('⚠️ Failed to update access tracking:', err));
    }
    
    // Convert Supabase data to enhanced semantic memory format
    const result = supabaseData.map((item: any) => {
      return {
        memory_id: item.id,
        input_data: item.input_data,
        output_data: item.output_data,
        content_summary: item.content_summary || '',
        semantic_tags: item.semantic_tags || [],
        embedding_vector: item.embedding_vector,
        importance_score: item.importance_score || 0.7,
        access_count: item.access_count || 0,
        timestamp: item.created_at || item.timestamp,
        last_accessed: item.last_accessed,
        metadata: item.record_metadata || item.metadata,
        interaction_type: item.interaction_type,
        memory_type: 'longterm_semantic',
        retention_policy: 'permanent'
      };
    });
    
    console.log('🧠 Formatted ' + result.length + ' long-term semantic memories for Smart Agent consumption');
    return result;
    
  } catch (error) {
    console.error('❌ Long-term Semantic Memory retrieval error:', error);
    return [];
  }
}

async function retrieveFromSupabase(
  userId: string, 
  agentId: string, 
  limit: number = 10,
  query?: string | null
): Promise<any[]> {
  try {
    // Get Supabase configuration from environment variables (with smart fallbacks for generated apps)
    // Supabase configuration - MUST use environment variables (no hardcoded fallbacks)
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    const tableName = process.env.SUPABASE_MEMORY_TABLE || 'agent_interactions';
    
    console.log('🔧 Supabase config for retrieval:', {
      url: supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'undefined',
      key: supabaseKey ? 'present (' + supabaseKey.length + ' chars)' : 'undefined',
      table: tableName
    });
    
    if (!supabaseUrl || !supabaseKey) {
      throw new Error('Supabase configuration missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY (or SUPABASE_SERVICE_ROLE_KEY)');
    }
    
    console.log(`🔍 Retrieving conversation from Supabase table: ${tableName}`);
    
    // Enhanced contextual query building for agent_interactions table
    let queryString = `agent_id=eq.${agentId}&user_id=eq.${userId}&expires_at=gt.${new Date().toISOString()}`;
    
    // Enhanced contextual search if query is provided
    if (query && query.trim()) {
      const encodedQuery = encodeURIComponent(query.toLowerCase());
      
      // Multi-field contextual search using Supabase's advanced querying
      // Search in: input_data content, output_data content, and metadata
      queryString += `&or=(input_data->>content.ilike.*${encodedQuery}*,output_data->>content.ilike.*${encodedQuery}*,record_metadata->>contentSummary.ilike.*${encodedQuery}*,record_metadata->>semanticTags.cs.{"${query}"})`;
      
      // Order by importance and recency for contextual relevance
      queryString += `&order=importance.desc,created_at.desc`;
    } else {
      // Default ordering by contextual relevance (importance + recency)
      queryString += `&order=importance.desc,created_at.desc`;
    }
    
    queryString += `&limit=${limit}`;
    
    console.log('🔍 Enhanced Supabase contextual query:', queryString);
    
    // Fetch from Supabase
    const response = await fetch(`${supabaseUrl}/rest/v1/${tableName}?${queryString}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey
      }
    });
    
    if (!response.ok) {
      const errorData = await response.text();
      console.error('❌ Supabase query error:', errorData);
      throw new Error(`Supabase query failed: ${response.status} - ${errorData}`);
    }
    
    const supabaseData = await response.json();
    console.log(`📊 Retrieved ${supabaseData.length} contextual interactions from Supabase`);
    
    // Update access tracking for retrieved memories (fire-and-forget)
    if (supabaseData.length > 0 && query) {
      const memoryIds = supabaseData.map((item: any) => item.id);
      const updatePromise = fetch(`${supabaseUrl}/rest/v1/${tableName}?id=in.(${memoryIds.join(',')})`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseKey}`,
          'apikey': supabaseKey
        },
        body: JSON.stringify({
          record_metadata: {
            accessCount: 'record_metadata->accessCount + 1',
            lastAccessed: new Date().toISOString()
          },
          updated_at: new Date().toISOString()
        })
      }).catch(err => console.warn('⚠️ Failed to update access tracking:', err));
    }
    
    // Helper function to calculate contextual relevance
    const calculateContextualRelevance = (item: any, searchQuery: string): number => {
      let relevanceScore = item.importance || 0.5;
      const lowerQuery = searchQuery.toLowerCase();
      
      // Content matching boost
      const inputContent = item.input_data?.content?.toLowerCase() || '';
      const outputContent = item.output_data?.content?.toLowerCase() || '';
      
      if (inputContent.includes(lowerQuery) || outputContent.includes(lowerQuery)) {
        relevanceScore += 0.3;
      }
      
      // Metadata contextual boost
      const metadata = item.record_metadata || {};
      if (metadata.contentSummary?.toLowerCase().includes(lowerQuery)) {
        relevanceScore += 0.2;
      }
      
      if (metadata.semanticTags?.some((tag: string) => tag.toLowerCase().includes(lowerQuery))) {
        relevanceScore += 0.25;
      }
      
      // Recency boost (more recent = more relevant)
      const daysSinceCreated = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24);
      const recencyBoost = Math.max(0, 0.1 - (daysSinceCreated * 0.01));
      relevanceScore += recencyBoost;
      
      return Math.min(1.0, relevanceScore);
    };
    
    // Convert Supabase data to enhanced memory format with contextual metadata
    const result = supabaseData.map((item: any) => {
      const metadata = item.record_metadata || item.metadata || {};
      
      return {
        memory_id: item.id,
        input_data: item.input_data,
        output_data: item.output_data,
        timestamp: item.created_at || item.timestamp,
        metadata: metadata,
        interaction_type: item.interaction_type,
        importance: item.importance || 0.5,
        // Enhanced contextual fields
        contentSummary: metadata.contentSummary || '',
        semanticTags: metadata.semanticTags || [],
        contextualData: metadata.contextualData || {},
        accessCount: metadata.accessCount || 0,
        lastAccessed: metadata.lastAccessed || item.created_at,
        // Calculate contextual relevance score
        contextualRelevance: query ? calculateContextualRelevance(item, query) : item.importance || 0.5
      };
    });
    
    console.log(`🧠 Formatted ${result.length} memories for Smart Agent consumption`);
    return result;
    
  } catch (error) {
    console.error('❌ Supabase retrieval error:', error);
    return [];
  }
}

async function storeInRedis(
  userId: string, 
  agentId: string, 
  interactionType: string, 
  inputData: any, 
  outputData: any, 
  metadata: any,
  sessionId?: string
): Promise<any> {
  // Redis implementation placeholder
  console.log('🔴 Redis storage not implemented yet');
  return { message: 'Redis storage not implemented' };
}

async function retrieveFromRedis(
  userId: string, 
  agentId: string, 
  sessionId: string | null, 
  limit: number,
  query?: string | null
): Promise<any[]> {
  // Redis implementation placeholder
  console.log('🔴 Redis retrieval not implemented yet');
  return [];
}
