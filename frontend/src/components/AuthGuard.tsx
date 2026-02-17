"use client";

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { checkAuthStatus } from '../lib/auth-utils';
import { authConfig, isProtectedPage } from '../lib/auth-config';

interface AuthGuardProps {
  children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    async function verifyAuth() {
      if (!isProtectedPage(pathname)) {
        setIsAuthenticated(true);
        setIsLoading(false);
        return;
      }

      try {
        const authenticated = await checkAuthStatus();
        setIsAuthenticated(authenticated);

        if (!authenticated) {
          setIsRedirecting(true);
          setIsLoading(false);
          
          // Show "Authenticating..." message for 3 seconds before redirecting
          setTimeout(() => {
            const loginUrl = `${authConfig.loginPage}?redirect=${encodeURIComponent(pathname)}`;
            router.push(loginUrl);
          }, 3000);
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error('Auth verification error:', error);
        setIsAuthenticated(false);
        setIsRedirecting(true);
        setIsLoading(false);
        
        // Show "Authenticating..." message for 3 seconds before redirecting
        setTimeout(() => {
          const loginUrl = `${authConfig.loginPage}?redirect=${encodeURIComponent(pathname)}`;
          router.push(loginUrl);
        }, 3000);
      }
    }

    verifyAuth();
  }, [pathname, router]);

  if (isLoading || isRedirecting) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: '#666',
        backgroundColor: '#f0f0f0'
      }}>
        Authenticating...
      </div>
    );
  }

  if (isAuthenticated === false) {
    return null;
  }

  return <>{children}</>;
}
