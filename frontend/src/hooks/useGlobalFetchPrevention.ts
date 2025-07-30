import { useRef, useCallback, useEffect } from 'react';

interface FetchState {
  isLoading: boolean;
  lastFetchKey: string;
  hasCompleted: boolean;
  data: any;
  timestamp: number;
}

// Global state to prevent duplicate fetches across all components
const globalFetchState = new Map<string, FetchState>();

const CACHE_DURATION = 30000; // 30 seconds cache

export function useGlobalFetchPrevention() {
  const isInitialRender = useRef(true);

  useEffect(() => {
    isInitialRender.current = false;
  }, []);

  const shouldPreventFetch = useCallback((fetchKey: string): boolean => {
    const currentState = globalFetchState.get(fetchKey);
    const now = Date.now();
    
    if (!currentState) {
      return false;
    }
    
    // Prevent if currently loading
    if (currentState.isLoading) {
      // console.log('🚫 Preventing duplicate fetch - already loading:', fetchKey);
      return true;
    }
    
    // Prevent if recently completed (within cache duration)
    if (currentState.hasCompleted && (now - currentState.timestamp) < CACHE_DURATION) {
      // console.log('🚫 Preventing duplicate fetch - recently completed:', fetchKey);
      return true;
    }
    
    return false;
  }, []);

  const markFetchStart = useCallback((fetchKey: string) => {
    // Additional check to prevent React strict mode double calls
    const currentState = globalFetchState.get(fetchKey);
    if (currentState && currentState.isLoading) {
      // console.log('🚫 Ignoring duplicate markFetchStart for:', fetchKey);
      return;
    }

    // console.log('🚀 Starting global fetch for:', fetchKey);
    globalFetchState.set(fetchKey, {
      isLoading: true,
      lastFetchKey: fetchKey,
      hasCompleted: false,
      data: null,
      timestamp: Date.now(),
    });
  }, []);

  const markFetchComplete = useCallback((fetchKey: string, data?: any) => {
    // console.log('✅ Completed global fetch for:', fetchKey);
    globalFetchState.set(fetchKey, {
      isLoading: false,
      lastFetchKey: fetchKey,
      hasCompleted: true,
      data,
      timestamp: Date.now(),
    });
  }, []);

  const markFetchError = useCallback((fetchKey: string) => {
    // console.log('❌ Failed global fetch for:', fetchKey);
    globalFetchState.set(fetchKey, {
      isLoading: false,
      lastFetchKey: fetchKey,
      hasCompleted: false,
      data: null,
      timestamp: Date.now(),
    });
  }, []);

  const getCachedData = useCallback((fetchKey: string) => {
    const currentState = globalFetchState.get(fetchKey);
    const now = Date.now();
    
    if (currentState && currentState.hasCompleted && (now - currentState.timestamp) < CACHE_DURATION) {
      return currentState.data;
    }
    
    return null;
  }, []);

  const reset = useCallback((fetchKey?: string) => {
    if (fetchKey) {
      // console.log('🔄 Resetting global fetch state for:', fetchKey);
      globalFetchState.delete(fetchKey);
    } else {
      // console.log('🔄 Resetting all global fetch state');
      globalFetchState.clear();
    }
  }, []);

  return {
    shouldPreventFetch,
    markFetchStart,
    markFetchComplete,
    markFetchError,
    getCachedData,
    reset,
  };
}
