/**
 * Client-side memory utilities for Smart AI Agent
 * Provides localStorage and sessionStorage integration
 */

interface ClientMemoryMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  agentId: string;
  userId: string;
  sessionId?: string;
}

export class ClientMemoryManager {
  private storageKey: string;
  private useSessionStorage: boolean;

  constructor(agentId: string, userId: string, useSessionStorage = false) {
    this.storageKey = `smart_agent_memory_${agentId}_${userId}`;
    this.useSessionStorage = useSessionStorage;
  }

  private getStorage(): Storage {
    return this.useSessionStorage ? sessionStorage : localStorage;
  }

  /**
   * Store a conversation in browser storage
   */
  storeConversation(userMessage: string, assistantMessage: string, agentId: string, userId: string): void {
    try {
      const storage = this.getStorage();
      const existing = this.getMessages();
      
      const timestamp = new Date().toISOString();
      
      const newMessages: ClientMemoryMessage[] = [
        {
          role: 'user',
          content: userMessage,
          timestamp,
          agentId,
          userId
        },
        {
          role: 'assistant', 
          content: assistantMessage,
          timestamp,
          agentId,
          userId
        }
      ];
      
      const updated = [...existing, ...newMessages];
      
      // Limit to 100 messages max
      if (updated.length > 100) {
        updated.splice(0, updated.length - 100);
      }
      
      storage.setItem(this.storageKey, JSON.stringify(updated));
      console.log(`💾 Stored conversation locally: ${userMessage.substring(0, 30)}...`);
    } catch (error) {
      console.warn('Failed to store conversation locally:', error);
    }
  }

  /**
   * Get conversation history from browser storage
   */
  getMessages(limit = 10): ClientMemoryMessage[] {
    try {
      const storage = this.getStorage();
      const stored = storage.getItem(this.storageKey);
      
      if (!stored) return [];
      
      const messages: ClientMemoryMessage[] = JSON.parse(stored);
      return messages.slice(-limit); // Get most recent messages
    } catch (error) {
      console.warn('Failed to load messages from local storage:', error);
      return [];
    }
  }

  /**
   * Clear conversation history
   */
  clearMemory(): void {
    try {
      const storage = this.getStorage();
      storage.removeItem(this.storageKey);
      console.log('🧠 Cleared local memory');
    } catch (error) {
      console.warn('Failed to clear local memory:', error);
    }
  }

  /**
   * Get conversation context for AI requests
   */
  getContextMessages(systemPrompt?: string): Array<{role: string, content: string}> {
    const messages = this.getMessages();
    const context: Array<{role: string, content: string}> = [];
    
    if (systemPrompt) {
      context.push({ role: 'system', content: systemPrompt });
    }
    
    messages.forEach((msg: any) => {
      context.push({ role: msg.role, content: msg.content });
    });
    
    return context;
  }
}

// Global memory manager instance
let globalMemoryManager: ClientMemoryManager | null = null;

/**
 * Get or create global memory manager
 */
export function getMemoryManager(agentId: string, userId: string, useSessionStorage = false): ClientMemoryManager {
  if (!globalMemoryManager) {
    globalMemoryManager = new ClientMemoryManager(agentId, userId, useSessionStorage);
  }
  return globalMemoryManager;
}
