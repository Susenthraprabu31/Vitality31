import { NextRequest, NextResponse } from 'next/server';
import { webSearchService, WebSearchOptions } from '../../../../services/webSearchService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, options = {} } = body;

    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Search query is required and must be a non-empty string' 
        },
        { status: 400 }
      );
    }

    // Validate and sanitize search options
    const searchOptions: WebSearchOptions = {
      provider: options.provider || 'auto',
      maxResults: Math.min(parseInt(options.maxResults) || 10, 20), // Limit to 20 results max
      safeSearch: options.safeSearch || 'moderate',
      region: options.region,
      language: options.language || 'en'
    };

    console.log('🔍 Processing web search request:', { query, options: searchOptions });

    // Perform the search
    const searchResponse = await webSearchService.search(query.trim(), searchOptions);

    if (!searchResponse.success) {
      return NextResponse.json(
        {
          success: false,
          error: searchResponse.error || 'Web search failed',
          query: searchResponse.query,
          provider: searchResponse.provider,
          timestamp: searchResponse.timestamp
        },
        { status: 500 }
      );
    }

    // Return successful search results
    return NextResponse.json({
      success: true,
      query: searchResponse.query,
      results: searchResponse.results,
      totalResults: searchResponse.totalResults,
      searchTime: searchResponse.searchTime,
      provider: searchResponse.provider,
      timestamp: searchResponse.timestamp
    });

  } catch (error) {
    console.error('Web search API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown web search error',
        timestamp: new Date().toISOString()
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Return web search service configuration status
    const isConfigured = webSearchService.isConfigured();
    const availableProviders = webSearchService.getAvailableProviders();

    return NextResponse.json({
      configured: isConfigured,
      providers: availableProviders,
      message: isConfigured 
        ? 'Web search service is properly configured'
        : 'Web search service requires API key configuration'
    });

  } catch (error) {
    console.error('Web search config check error:', error);
    return NextResponse.json(
      {
        configured: false,
        providers: [],
        error: error instanceof Error ? error.message : 'Configuration check failed'
      },
      { status: 500 }
    );
  }
}
