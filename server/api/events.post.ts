import type { HookEvent } from '../utils/types';
import { insertEvent } from '../utils/db/events';
import { broadcastEvent } from '../utils/ws-clients';
import { HookEventSchema, validateRequest, REQUEST_LIMITS } from '../utils/validation/schemas';

export default defineEventHandler(async (event) => {
  try {
    // Check request size first
    const contentLength = getHeader(event, 'content-length');
    if (contentLength && parseInt(contentLength) > REQUEST_LIMITS.MAX_PAYLOAD_SIZE) {
      throw createError({
        statusCode: 413,
        statusMessage: 'Request payload too large'
      });
    }

    const rawBody = await readBody(event);
    
    // Validate request body with Zod
    const validation = validateRequest(HookEventSchema, rawBody);
    
    if (!validation.success) {
      console.warn('Validation failed:', validation.error, validation.details?.issues);
      throw createError({
        statusCode: 400,
        statusMessage: validation.error
      });
    }
    
    const body: HookEvent = validation.data;
    
    // Additional security checks
    if (body.chat && body.chat.length > REQUEST_LIMITS.MAX_CHAT_ITEMS) {
      throw createError({
        statusCode: 400,
        statusMessage: `Chat items exceed maximum limit of ${REQUEST_LIMITS.MAX_CHAT_ITEMS}`
      });
    }
    
    if (body.summary && body.summary.length > REQUEST_LIMITS.MAX_SUMMARY_LENGTH) {
      throw createError({
        statusCode: 400,
        statusMessage: `Summary exceeds maximum length of ${REQUEST_LIMITS.MAX_SUMMARY_LENGTH} characters`
      });
    }
    
    // Sanitize payload - remove any potentially dangerous keys
    const sanitizedPayload = sanitizePayload(body.payload);
    const sanitizedBody = { ...body, payload: sanitizedPayload };
    
    // Insert event into database
    const savedEvent = insertEvent(sanitizedBody);
    
    // Broadcast to all WebSocket clients
    broadcastEvent(savedEvent);
    
    return {
      success: true,
      data: savedEvent
    };
  } catch (error) {
    console.error('Error processing event:', error);
    
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    });
  }
});

// Sanitize payload to prevent injection attacks
function sanitizePayload(payload: Record<string, any>): Record<string, any> {
  const sanitized: Record<string, any> = {};
  const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
  
  for (const [key, value] of Object.entries(payload)) {
    // Skip dangerous keys
    if (dangerousKeys.includes(key)) continue;
    
    // Recursively sanitize nested objects
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      sanitized[key] = sanitizePayload(value);
    } else if (typeof value === 'string') {
      // Basic XSS prevention - remove script tags and javascript: protocols
      sanitized[key] = value
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/javascript:/gi, '');
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
}