import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { usePiAuth } from "@/contexts/PiAuthContext";

function getOrCreateSessionId(): string {
  const STORAGE_KEY = 'verificationSessionId';
  let sessionId = localStorage.getItem(STORAGE_KEY);
  if (!sessionId) {
    sessionId = `session_${crypto.randomUUID()}`;
    localStorage.setItem(STORAGE_KEY, sessionId);
  }
  return sessionId;
}

export function usePaymentCount() {
  const { user } = usePiAuth();
  const [count, setCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(true);

  const getExternalUserId = (): string => {
    if (user?.uid) {
      return user.uid;
    }
    return getOrCreateSessionId();
  };

  const fetchCount = async () => {
    try {
      const externalUserId = getExternalUserId();
      
      const { data, error } = await supabase.functions.invoke('get-payment-history', {
        body: { externalUserId, page: 1, pageSize: 1 },
      });

      if (error) {
        console.error('Failed to fetch payment count:', error);
        return;
      }

      if (data?.success && data?.pagination) {
        setCount(data.pagination.totalRecords || 0);
      }
    } catch (error) {
      console.error('Payment count error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCount();
  }, [user?.uid]);

  return { count, isLoading, refetch: fetchCount };
}
