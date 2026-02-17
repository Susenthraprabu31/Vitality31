/**
 * Web Search Service - Enhanced Implementation with Credential Support
 * Supports multiple search providers: Google, Bing, DuckDuckGo
 */

export interface SearchResult {
  title: string;
  link: string;
  snippet: string;
  displayLink?: string;
  source: 'google' | 'bing' | 'duckduckgo';
  timestamp?: string;
}

export interface WebSearchOptions {
  provider?: 'google' | 'bing' | 'duckduckgo' | 'auto';
  maxResults?: number;
  safeSearch?: 'active' | 'moderate' | 'off';
  region?: string;
  language?: string;
  // API Credentials (optional - will fallback to environment variables)
  googleApiKey?: string;
  googleSearchEngineId?: string;
  bingApiKey?: string;
}

export interface WebSearchResponse {
  query: string;
  results: SearchResult[];
  totalResults: number;
  searchTime: number;
  provider: string;
  success: boolean;
  error?: string;
  timestamp?: string;
}

class WebSearchService {
  private readonly DEFAULT_MAX_RESULTS = 10;
  private readonly TIMEOUT_MS = 10000; // 10 seconds
  
  /**
   * Main search function that routes to appropriate provider
   */
  async search(query: string, options: WebSearchOptions = {}): Promise<WebSearchResponse> {
    const startTime = Date.now();
    const maxResults = options.maxResults || this.DEFAULT_MAX_RESULTS;
    
    try {
      // Validate query
      if (!query || query.trim().length === 0) {
        throw new Error('Search query cannot be empty');
      }
      
      const cleanQuery = query.trim();
      let provider = options.provider || 'auto';
      
      // Auto-select provider based on available API keys
      if (provider === 'auto') {
        provider = this.selectBestProvider(options);
      }
      
      let results: SearchResult[] = [];
      
      // Route to appropriate search provider
      switch (provider) {
        case 'google':
          results = await this.searchGoogle(cleanQuery, options);
          break;
        case 'bing':
          results = await this.searchBing(cleanQuery, options);
          break;
        case 'duckduckgo':
          results = await this.searchDuckDuckGo(cleanQuery, options);
          break;
        default:
          throw new Error(`Unsupported search provider: ${provider}`);
      }
      
      const searchTime = Date.now() - startTime;
      
      return {
        query: cleanQuery,
        results: results.slice(0, maxResults),
        totalResults: results.length,
        searchTime,
        provider,
        success: true
      };
      
    } catch (error) {
      const searchTime = Date.now() - startTime;
      console.error('WebSearchService error:', error);
      
      return {
        query: query.trim(),
        results: [],
        totalResults: 0,
        searchTime,
        provider: options.provider || 'unknown',
        success: false,
        error: error instanceof Error ? error.message : 'Unknown search error'
      };
    }
  }
  
  /**
   * Google Custom Search API implementation
   */
  private async searchGoogle(query: string, options: WebSearchOptions): Promise<SearchResult[]> {
    // Use provided credentials first, then fallback to environment variables
    const apiKey = options.googleApiKey || 
                   process.env.GOOGLE_SEARCH_API_KEY || 
                   process.env.NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY;
    const searchEngineId = options.googleSearchEngineId || 
                          process.env.GOOGLE_SEARCH_ENGINE_ID || 
                          process.env.NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID;
    
    if (!apiKey || !searchEngineId) {
      throw new Error('Google Search API credentials not configured');
    }
    
    const params = new URLSearchParams({
      key: apiKey,
      cx: searchEngineId,
      q: query,
      num: Math.min(options.maxResults || this.DEFAULT_MAX_RESULTS, 10).toString()
    });
    
    if (options.safeSearch) {
      params.append('safe', options.safeSearch === 'active' ? 'active' : 'off');
    }
    
    if (options.region) {
      params.append('gl', options.region);
    }
    
    if (options.language) {
      params.append('hl', options.language);
    }
    
    const url = `https://www.googleapis.com/customsearch/v1?${params.toString()}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'Simplita-WebSearch/1.0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Google Search API error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }
      
      const data = await response.json();
      
      return (data.items || []).map((item: any) => ({
        title: item.title || 'No title',
        link: item.link || '',
        snippet: item.snippet || 'No description available',
        displayLink: item.displayLink || new URL(item.link || '').hostname,
        source: 'google' as const,
        timestamp: new Date().toISOString()
      }));
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  /**
   * Bing Web Search API implementation
   */
  private async searchBing(query: string, options: WebSearchOptions): Promise<SearchResult[]> {
    // Use provided credentials first, then fallback to environment variables
    const apiKey = options.bingApiKey || 
                   process.env.BING_SEARCH_API_KEY || 
                   process.env.NEXT_PUBLIC_BING_SEARCH_API_KEY;
    
    if (!apiKey) {
      throw new Error('Bing Search API key not configured');
    }
    
    const params = new URLSearchParams({
      q: query,
      count: Math.min(options.maxResults || this.DEFAULT_MAX_RESULTS, 50).toString()
    });
    
    if (options.safeSearch) {
      params.append('safeSearch', options.safeSearch);
    }
    
    if (options.region) {
      params.append('cc', options.region);
    }
    
    const url = `https://api.bing.microsoft.com/v7.0/search?${params.toString()}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);
    
    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Ocp-Apim-Subscription-Key': apiKey,
          'Accept': 'application/json',
          'User-Agent': 'Simplita-WebSearch/1.0'
        },
        signal: controller.signal
      });
      
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Bing Search API error: ${response.status} - ${errorData.message || response.statusText}`);
      }
      
      const data = await response.json();
      
      return (data.webPages?.value || []).map((item: any) => ({
        title: item.name || 'No title',
        link: item.url || '',
        snippet: item.snippet || 'No description available',
        displayLink: item.displayUrl || new URL(item.url || '').hostname,
        source: 'bing' as const,
        timestamp: new Date().toISOString()
      }));
      
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  /**
   * DuckDuckGo search implementation (fallback)
   */
  private async searchDuckDuckGo(query: string, options: WebSearchOptions): Promise<SearchResult[]> {
    // DuckDuckGo Instant Answer API (limited but free)
    const params = new URLSearchParams({
      q: query,
      format: 'json',
      no_redirect: '1',
      no_html: '1',
      skip_disambig: '1'
    });

    const url = `https://api.duckduckgo.com/?${params.toString()}`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), this.TIMEOUT_MS);

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'User-Agent': 'Simplita-WebSearch/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`DuckDuckGo API error: ${response.status} - ${response.statusText}`);
      }

      const data = await response.json();
      const results: SearchResult[] = [];
      
      // Add abstract result if available
      if (data.Abstract && data.AbstractURL) {
        results.push({
          title: data.Heading || query,
          link: data.AbstractURL,
          snippet: data.Abstract,
          displayLink: new URL(data.AbstractURL).hostname,
          source: 'duckduckgo' as const,
          timestamp: new Date().toISOString()
        });
      }

      // Add related topics
      if (data.RelatedTopics && Array.isArray(data.RelatedTopics)) {
        data.RelatedTopics.slice(0, Math.max(0, (options.maxResults || 10) - results.length)).forEach((topic: any) => {
          if (topic.Text && topic.FirstURL) {
            results.push({
              title: topic.Text.split(' - ')[0] || topic.Text,
              link: topic.FirstURL,
              snippet: topic.Text,
              displayLink: new URL(topic.FirstURL).hostname,
              source: 'duckduckgo' as const,
              timestamp: new Date().toISOString()
            });
          }
        });
      }

      return results;

    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }
  
  /**
   * Select the best available search provider based on API configuration
   */
  private selectBestProvider(options: WebSearchOptions = {}): 'google' | 'bing' | 'duckduckgo' {
    // Check for Google API credentials (provided or environment)
    const hasGoogle = (options.googleApiKey || process.env.GOOGLE_SEARCH_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY) && 
                     (options.googleSearchEngineId || process.env.GOOGLE_SEARCH_ENGINE_ID || process.env.NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID);
    
    // Check for Bing API credentials (provided or environment)
    const hasBing = options.bingApiKey || process.env.BING_SEARCH_API_KEY || process.env.NEXT_PUBLIC_BING_SEARCH_API_KEY;
    
    // Prefer Google > Bing > DuckDuckGo
    if (hasGoogle) return 'google';
    if (hasBing) return 'bing';
    return 'duckduckgo'; // Fallback, no API key required
  }
  
  /**
   * Check if web search is properly configured
   */
  isConfigured(): boolean {
    const hasGoogle = (process.env.GOOGLE_SEARCH_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY) && 
                     (process.env.GOOGLE_SEARCH_ENGINE_ID || process.env.NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID);
    const hasBing = process.env.BING_SEARCH_API_KEY || process.env.NEXT_PUBLIC_BING_SEARCH_API_KEY;
    
    return hasGoogle || hasBing; // DuckDuckGo always available as fallback
  }
  
  /**
   * Get available search providers
   */
  getAvailableProviders(): string[] {
    const providers: string[] = [];
    
    const hasGoogle = (process.env.GOOGLE_SEARCH_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_SEARCH_API_KEY) && 
                     (process.env.GOOGLE_SEARCH_ENGINE_ID || process.env.NEXT_PUBLIC_GOOGLE_SEARCH_ENGINE_ID);
    const hasBing = process.env.BING_SEARCH_API_KEY || process.env.NEXT_PUBLIC_BING_SEARCH_API_KEY;
    
    if (hasGoogle) providers.push('google');
    if (hasBing) providers.push('bing');
    providers.push('duckduckgo'); // Always available
    
    return providers;
  }
}

export const webSearchService = new WebSearchService();
