import { z } from 'zod';
import { isAbsolute } from 'path';

// Hook Event Validation Schema
export const HookEventSchema = z.object({
  source_app: z.string()
    .min(1, 'Source app is required')
    .max(100, 'Source app must be less than 100 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Source app must contain only letters, numbers, underscores, and hyphens'),
  
  session_id: z.string()
    .min(1, 'Session ID is required')
    .max(50, 'Session ID must be less than 50 characters')
    .regex(/^[a-zA-Z0-9-]+$/, 'Session ID must be a valid format'),
  
  hook_event_type: z.enum([
    'PreToolUse',
    'PostToolUse', 
    'Stop',
    'UserPromptSubmit',
    'SubagentStop'
  ]),
  
  payload: z.record(z.string(), z.any()),
  
  chat: z.array(z.any()).optional(),
  
  summary: z.string()
    .max(1000, 'Summary must be less than 1000 characters')
    .optional(),
    
  timestamp: z.number()
    .int()
    .positive()
    .optional()
}).strict();

// WebSocket Message Schema
export const WebSocketMessageSchema = z.object({
  type: z.enum(['initial', 'event', 'tokenUsage']),
  data: z.any()
});

// Filter Options Schema
export const FilterOptionsSchema = z.object({
  source_apps: z.array(z.string()).optional(),
  session_ids: z.array(z.string()).optional(),
  hook_event_types: z.array(z.string()).optional(),
  limit: z.number().int().positive().max(1000).optional(),
  offset: z.number().int().nonnegative().optional()
}).strict();

// Usage Query Schema
export const UsageQuerySchema = z.object({
  session_id: z.string().optional(),
  source_app: z.string().optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional()
}).strict();

// Validation helper function
export function validateRequest<T>(schema: z.ZodSchema<T>, data: unknown): { 
  success: true; 
  data: T 
} | { 
  success: false; 
  error: string; 
  details?: z.ZodError 
} {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.issues[0];
      return {
        success: false,
        error: firstError?.message || 'Validation failed',
        details: error
      };
    }
    return {
      success: false,
      error: 'Invalid request format'
    };
  }
}

// Hook Installation Request Schema
export const HookInstallRequestSchema = z.object({
  targetPath: z.string()
    .min(1, 'Target path is required')
    .max(500, 'Target path too long')
    .refine(path => !path.includes('\0'), 'Path contains null bytes')
    .refine(path => isAbsolute(path), 'Path must be absolute')
    .refine(path => !path.includes('..'), 'Path traversal not allowed'),
  displayName: z.string()
    .min(1, 'Display name is required')
    .max(100, 'Display name too long')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'Invalid characters in display name'),
  serverUrl: z.string()
    .url('Invalid server URL')
    .refine(url => {
      try {
        const parsed = new URL(url);
        return ['http:', 'https:'].includes(parsed.protocol);
      } catch {
        return false;
      }
    }, 'Only HTTP/HTTPS protocols allowed')
}).strict();

// Request size limits
export const REQUEST_LIMITS = {
  MAX_PAYLOAD_SIZE: 1024 * 1024, // 1MB
  MAX_CHAT_ITEMS: 1000,
  MAX_SUMMARY_LENGTH: 1000
} as const;