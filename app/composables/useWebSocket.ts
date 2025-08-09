import { ref, onMounted, onUnmounted, computed } from 'vue';
import type { HookEvent, WebSocketMessage } from '~/types';

export function useWebSocket(url: string) {
  const events = ref<HookEvent[]>([]);
  const historicalEvents = ref<HookEvent[]>([]);
  const isConnected = ref(false);
  const error = ref<string | null>(null);
  const isLoadingHistorical = ref(false);
  const hasMoreHistorical = ref(true);
  const wsRef = ref<WebSocket | null>(null);
  
  let reconnectTimeout: number | null = null;
  
  // Get max events from environment variable or use default
  const maxEvents = parseInt(import.meta.env.VITE_MAX_EVENTS_TO_DISPLAY || '200');
  
  const connect = () => {
    try {
      const ws = new WebSocket(url);
      wsRef.value = ws;
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        isConnected.value = true;
        error.value = null;
      };
      
      ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          
          if (message.type === 'initial') {
            const initialEvents = Array.isArray(message.data) ? message.data : [];
            console.log('[useWebSocket] Initial events received:', {
              count: initialEvents.length,
              eventsWithSummary: initialEvents.filter((e: any) => e.summary).length,
              sampleEvents: initialEvents.slice(0, 3).map((e: any) => ({
                id: e.id,
                hook_event_type: e.hook_event_type,
                summary: e.summary,
                has_summary: !!e.summary
              }))
            });
            // Only keep the most recent events up to maxEvents
            events.value = initialEvents.slice(-maxEvents);
          } else if (message.type === 'event') {
            const newEvent = message.data as HookEvent;
            console.log('[useWebSocket] New event received:', {
              id: newEvent.id,
              hook_event_type: newEvent.hook_event_type,
              summary: newEvent.summary,
              has_summary: !!newEvent.summary,
              source_app: newEvent.source_app
            });
            events.value.push(newEvent);
            
            // Limit events array to maxEvents, removing the oldest when exceeded
            if (events.value.length > maxEvents) {
              // Remove the oldest events (first 10) when limit is exceeded
              events.value = events.value.slice(events.value.length - maxEvents + 10);
            }
          }
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
      
      ws.onerror = (err) => {
        console.error('WebSocket error:', err);
        error.value = 'WebSocket connection error';
      };
      
      ws.onclose = () => {
        console.log('WebSocket disconnected');
        isConnected.value = false;
        
        // Attempt to reconnect after 3 seconds
        reconnectTimeout = window.setTimeout(() => {
          console.log('Attempting to reconnect...');
          connect();
        }, 3000);
      };
    } catch (err) {
      console.error('Failed to connect:', err);
      error.value = 'Failed to connect to server';
    }
  };
  
  const disconnect = () => {
    if (reconnectTimeout) {
      clearTimeout(reconnectTimeout);
      reconnectTimeout = null;
    }
    
    if (wsRef.value) {
      wsRef.value.close();
      wsRef.value = null;
    }
  };

  // Load more historical events via REST API
  const loadMoreHistoricalEvents = async () => {
    if (isLoadingHistorical.value || !hasMoreHistorical.value) return;
    
    try {
      isLoadingHistorical.value = true;
      
      // Get the earliest timestamp from combined events
      const allCurrentEvents = [...events.value, ...historicalEvents.value];
      let beforeTimestamp: string;
      
      if (allCurrentEvents.length === 0) {
        // No events yet, load from current time
        beforeTimestamp = new Date().toISOString();
      } else {
        // Find the earliest event
        const earliestEvent = allCurrentEvents.reduce((earliest, event) => 
          event.timestamp! < earliest.timestamp! ? event : earliest
        );
        beforeTimestamp = new Date(earliestEvent.timestamp!).toISOString();
      }
      
      const response = await fetch(`http://localhost:4000/events/historical?before=${beforeTimestamp}&limit=50`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.events && result.events.length > 0) {
        // Add new historical events to the beginning of the historical array
        historicalEvents.value.unshift(...result.events);
        hasMoreHistorical.value = result.has_more;
        
        console.log('[useWebSocket] Loaded historical events:', {
          newEventsCount: result.events.length,
          totalHistoricalCount: historicalEvents.value.length,
          hasMore: result.has_more,
          earliestTimestamp: result.earliest_timestamp
        });
      } else {
        hasMoreHistorical.value = false;
      }
    } catch (err) {
      console.error('[useWebSocket] Failed to load historical events:', err);
      error.value = 'Failed to load historical events';
    } finally {
      isLoadingHistorical.value = false;
    }
  };

  // Infinite scroll detection function
  const handleScroll = (scrollContainer: HTMLElement) => {
    if (!scrollContainer || isLoadingHistorical.value || !hasMoreHistorical.value) return;
    
    const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
    const isNearBottom = scrollTop + clientHeight >= scrollHeight - 100;
    
    if (isNearBottom) {
      console.log('[useWebSocket] Near bottom, loading more historical events...');
      loadMoreHistoricalEvents();
    }
  };

  // Combined events (historical + recent)
  const allEvents = computed(() => {
    const combined = [...historicalEvents.value, ...events.value];
    // Sort by timestamp (oldest first)
    return combined.sort((a, b) => a.timestamp! - b.timestamp!);
  });
  
  onMounted(() => {
    connect();
  });
  
  onUnmounted(() => {
    disconnect();
  });
  
  return {
    events,
    historicalEvents,
    allEvents,
    isConnected,
    error,
    isLoadingHistorical,
    hasMoreHistorical,
    loadMoreHistoricalEvents,
    handleScroll,
    ws: wsRef // Export WebSocket connection ref directly
  };
}