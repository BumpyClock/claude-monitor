import type { Peer } from 'crossws';
import type { HookEvent } from './types';

// Store WebSocket clients
export const wsClients = new Set<Peer>();

// Token update timer
let tokenUpdateTimer: NodeJS.Timeout | null = null;

// Broadcast message to all connected clients
export function broadcast(message: any): void {
  const messageString = typeof message === 'string' ? message : JSON.stringify(message);
  
  wsClients.forEach(client => {
    try {
      client.send(messageString);
    } catch (err) {
      // Client disconnected, remove from set
      console.error('Error sending to client:', err);
      wsClients.delete(client);
    }
  });
}

// Broadcast event to all clients
export function broadcastEvent(event: HookEvent): void {
  broadcast({
    type: 'event',
    data: event
  });
}

// Start periodic token usage updates
export async function startTokenUpdates(): Promise<void> {
  if (tokenUpdateTimer) return;
  
  const { getLiveBlockData } = await import('./usage');
  const TOKEN_UPDATE_INTERVAL = 30000; // 30 seconds
  
  tokenUpdateTimer = setInterval(async () => {
    if (wsClients.size === 0) return;
    
    try {
      const liveBlockData = await getLiveBlockData();
      if (liveBlockData.success && liveBlockData.data) {
        broadcast({
          type: 'tokenUsage',
          data: liveBlockData.data
        });
      }
    } catch (error) {
      console.error('Error broadcasting token usage:', error);
    }
  }, TOKEN_UPDATE_INTERVAL);
}

// Stop periodic updates
export function stopTokenUpdates(): void {
  if (tokenUpdateTimer) {
    clearInterval(tokenUpdateTimer);
    tokenUpdateTimer = null;
  }
}

// Add a client
export function addClient(client: Peer): void {
  wsClients.add(client);
  
  // Start token updates if this is the first client
  if (wsClients.size === 1) {
    startTokenUpdates();
  }
}

// Remove a client
export function removeClient(client: Peer): void {
  wsClients.delete(client);
  
  // Stop token updates if no clients remain
  if (wsClients.size === 0) {
    stopTokenUpdates();
  }
}