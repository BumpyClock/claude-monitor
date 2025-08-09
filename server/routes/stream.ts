import type { Peer } from 'crossws';
import { getRecentEvents } from '../utils/db/events';
import { addClient, removeClient } from '../utils/ws-clients';
import { getLiveBlockData } from '../utils/usage';

export default defineWebSocketHandler({
  async open(peer: Peer) {
    console.log('WebSocket client connected');
    addClient(peer);
    
    // Send recent events on connection
    const events = getRecentEvents(200);
    peer.send(JSON.stringify({ type: 'initial', data: events }));
    
    // Send initial token usage data
    try {
      const liveBlockData = await getLiveBlockData();
      if (liveBlockData.success && liveBlockData.data) {
        peer.send(JSON.stringify({ type: 'tokenUsage', data: liveBlockData.data }));
      }
    } catch (error) {
      console.error('Error sending initial token data:', error);
    }
  },
  
  message(peer: Peer, message: any) {
    // Handle any client messages if needed
    console.log('Received message:', message);
  },
  
  close(peer: Peer) {
    console.log('WebSocket client disconnected');
    removeClient(peer);
  },
  
  error(peer: Peer, error: any) {
    console.error('WebSocket error:', error);
    removeClient(peer);
  }
});