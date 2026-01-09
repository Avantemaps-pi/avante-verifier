import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { PiAuthResult, PiPaymentData } from '@/types/pi-sdk';
import { toast } from 'sonner';

interface PiUser {
  uid: string;
  username: string;
  accessToken: string;
}

interface PiAuthContextType {
  user: PiUser | null;
  isLoading: boolean;
  isSDKReady: boolean;
  login: () => Promise<void>;
  logout: () => void;
}

const PiAuthContext = createContext<PiAuthContextType | undefined>(undefined);

// Check if running inside Pi Browser
const isPiBrowser = (): boolean => {
  return typeof window !== 'undefined' && 
         (window.navigator.userAgent.includes('PiBrowser') || 
          typeof window.Pi !== 'undefined');
};

export const PiAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<PiUser | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSDKReady, setIsSDKReady] = useState(false);

  // Initialize Pi SDK when script loads
  useEffect(() => {
    const initPiSDK = () => {
      if (window.Pi) {
        try {
          window.Pi.init({ version: '2.0', sandbox: false });
          setIsSDKReady(true);
          console.log('Pi SDK initialized successfully');
        } catch (error) {
          console.error('Failed to initialize Pi SDK:', error);
        }
      }
    };

    // Check if SDK is already loaded
    if (window.Pi) {
      initPiSDK();
    } else {
      // Wait for SDK to load
      const checkInterval = setInterval(() => {
        if (window.Pi) {
          initPiSDK();
          clearInterval(checkInterval);
        }
      }, 100);

      // Cleanup after 10 seconds if SDK doesn't load
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.Pi) {
          console.warn('Pi SDK not available - not running in Pi Browser');
        }
      }, 10000);

      return () => clearInterval(checkInterval);
    }
  }, []);

  // Handle incomplete payments (required by SDK)
  const handleIncompletePayment = useCallback((payment: PiPaymentData) => {
    console.log('Incomplete payment found:', payment);
    // For now, just log incomplete payments
    // In a full implementation, you would handle payment completion here
  }, []);

  const login = useCallback(async () => {
    if (!window.Pi) {
      toast.error('Pi SDK not available. Please open this app in Pi Browser.');
      return;
    }

    setIsLoading(true);
    try {
      // Request username scope for authentication
      const authResult: PiAuthResult = await window.Pi.authenticate(
        ['username', 'payments', 'wallet_address'],
        handleIncompletePayment
      );

      const piUser: PiUser = {
        uid: authResult.user.uid,
        username: authResult.user.username,
        accessToken: authResult.accessToken,
      };

      setUser(piUser);
      toast.success(`Welcome, ${piUser.username}!`);
      console.log('Pi authentication successful:', piUser);
    } catch (error) {
      console.error('Pi authentication failed:', error);
      toast.error('Authentication failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [handleIncompletePayment]);

  const logout = useCallback(() => {
    setUser(null);
    toast.info('Logged out successfully');
  }, []);

  return (
    <PiAuthContext.Provider value={{ user, isLoading, isSDKReady, login, logout }}>
      {children}
    </PiAuthContext.Provider>
  );
};

export const usePiAuth = (): PiAuthContextType => {
  const context = useContext(PiAuthContext);
  if (context === undefined) {
    throw new Error('usePiAuth must be used within a PiAuthProvider');
  }
  return context;
};

export { isPiBrowser };
