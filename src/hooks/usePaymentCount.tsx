import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePiAuth } from "@/contexts/PiAuthContext";

const LAST_VIEWED_KEY = 'paymentHistoryLastViewed';

function getOrCreateSessionId(): string {
  const STORAGE_KEY = 'verificationSessionId';
  let sessionId = localStorage.getItem(STORAGE_KEY);
  if (!sessionId) {
    sessionId = `session_${crypto.randomUUID()}`;
    localStorage.setItem(STORAGE_KEY, sessionId);
  }
  return sessionId;
}

function getLastViewedTimestamp(): string | null {
  return localStorage.getItem(LAST_VIEWED_KEY);
}

function setLastViewedTimestamp(): void {
  localStorage.setItem(LAST_VIEWED_KEY, new Date().toISOString());
}

export function usePaymentCount() {
  const { user } = usePiAuth();
  const [count, setCount] = useState<number>(0);
  const [newCount, setNewCount] = useState<number>(0);
  const [hasPending, setHasPending] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState(true);

  const getExternalUserId = useCallback((): string => {
    if (user?.uid) {
      return user.uid;
    }
    return getOrCreateSessionId();
  }, [user?.uid]);

  const fetchCount = useCallback(async () => {
    try {
      const externalUserId = getExternalUserId();
      const lastViewed = getLastViewedTimestamp();
      
      const { data, error } = await supabase.functions.invoke('get-payment-history', {
        body: { externalUserId, page: 1, pageSize: 100 },
      });

      if (error) {
        console.error('Failed to fetch payment count:', error);
        return;
      }

      if (data?.success) {
        const totalRecords = data?.pagination?.totalRecords || 0;
        setCount(totalRecords);
        
        // Count new payments since last viewed
        const payments = data?.data || [];
        if (lastViewed && payments.length > 0) {
          const lastViewedDate = new Date(lastViewed);
          const newPayments = payments.filter((p: { created_at: string }) => 
            new Date(p.created_at) > lastViewedDate
          );
          setNewCount(newPayments.length);
        } else if (!lastViewed && payments.length > 0) {
          // First time viewing - mark all as new
          setNewCount(payments.length);
        }
        
        // Check for pending payments
        const pendingPayments = payments.filter((p: { status: string }) => 
          p.status === 'pending'
        );
        setHasPending(pendingPayments.length > 0);
      }
    } catch (error) {
      console.error('Payment count error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getExternalUserId]);

  const markAsViewed = useCallback(() => {
    setLastViewedTimestamp();
    setNewCount(0);
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchCount();
  }, [fetchCount]);

  // Real-time subscription
  useEffect(() => {
    const externalUserId = getExternalUserId();
    
    const channel = supabase
      .channel('payment-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'payment_records',
          filter: `external_user_id=eq.${externalUserId}`,
        },
        (payload) => {
          console.log('Payment update received:', payload);
          // Refetch to get accurate counts
          fetchCount();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [getExternalUserId, fetchCount]);

  return { 
    count, 
    newCount, 
    hasPending, 
    hasNotification: newCount > 0 || hasPending,
    isLoading, 
    refetch: fetchCount,
    markAsViewed 
  };
}
