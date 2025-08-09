import type { HookEvent } from '../utils/types';
import { insertEvent } from '../utils/db/events';
import { broadcastEvent } from '../utils/ws-clients';

export default defineEventHandler(async (event) => {
  try {
    const body: HookEvent = await readBody(event);
    
    // Validate required fields
    if (!body.source_app || !body.session_id || !body.hook_event_type || !body.payload) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields'
      });
    }
    
    // Insert event into database
    const savedEvent = insertEvent(body);
    
    // Broadcast to all WebSocket clients
    broadcastEvent(savedEvent);
    
    return savedEvent;
  } catch (error) {
    console.error('Error processing event:', error);
    
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    
    throw createError({
      statusCode: 400,
      statusMessage: 'Invalid request'
    });
  }
});