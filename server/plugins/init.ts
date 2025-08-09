import { getDatabase, closeDatabase } from '../utils/db/init';
import { cleanup as cleanupUsage } from '../utils/usage';
import { stopTokenUpdates } from '../utils/ws-clients';

export default defineNitroPlugin((nitroApp) => {
  console.log('🚀 Initializing server...');
  
  // Initialize database on startup
  getDatabase();
  console.log('📊 Database initialized');
  
  // Setup graceful shutdown handlers
  const shutdown = () => {
    console.log('\n🛑 Shutting down server...');
    stopTokenUpdates();
    cleanupUsage();
    closeDatabase();
  };
  
  process.on('SIGINT', () => {
    shutdown();
    process.exit(0);
  });
  
  process.on('SIGTERM', () => {
    shutdown();
    process.exit(0);
  });
  
  // Log endpoints
  console.log('📮 POST events to: /api/events');
  console.log('📊 WebSocket endpoint: /stream');
  console.log('📈 Token usage API: /api/usage/*');
});