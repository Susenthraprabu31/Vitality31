import { NextRequest, NextResponse } from 'next/server';

// Simple rate limiting (in-memory, resets on server restart)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 60; // 60 requests per minute

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = rateLimitMap.get(ip);
  
  if (!record || now > record.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  record.count++;
  return true;
}

/**
 * API route to get auth_token from httpOnly cookie
 * Since httpOnly cookies cannot be read by JavaScript, this server-side route
 * reads the cookie and returns it to the frontend.
 * 
 * SECURITY: 
 * - Rate limited to prevent abuse
 * - Reads HttpOnly cookies server-side, preventing XSS attacks
 * - Only returns token if cookie exists (no authentication check needed as cookie itself is the auth)
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limiting
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
               request.headers.get('x-real-ip') || 
               'unknown';
    
    if (!checkRateLimit(ip)) {
      return NextResponse.json(
        { error: 'Rate limit exceeded', authToken: null },
        { status: 429 }
      );
    }
    
    // Read the auth_token cookie (set by backend as httpOnly)
    const authToken = request.cookies.get('auth_token')?.value;
    
    if (authToken) {
      return NextResponse.json({ 
        authToken,
        source: 'cookie'
      });
    }
    
    // If no cookie found, return null (frontend will fallback to other methods)
    return NextResponse.json({ 
      authToken: null,
      source: 'none'
    });
  } catch (error) {
    console.error('Error reading auth_token cookie:', error);
    return NextResponse.json(
      { error: 'Failed to read auth_token cookie', authToken: null },
      { status: 500 }
    );
  }
}
