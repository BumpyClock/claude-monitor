import { installHooks } from '../utils/hook-installer';
import { HookInstallRequestSchema, validateRequest } from '../utils/validation/schemas';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    
    // Use Zod validation for comprehensive input validation
    const validation = validateRequest(HookInstallRequestSchema, body);
    if (!validation.success) {
      throw createError({
        statusCode: 400,
        statusMessage: validation.error,
        data: validation.details // Include details for debugging
      });
    }
    
    // Install hooks with validated data
    const result = await installHooks(validation.data);
    
    return result;
  } catch (error) {
    console.error('Error installing hooks:', error);
    
    if (error instanceof Error) {
      // Check if it's already an H3Error
      if ('statusCode' in error) {
        throw error;
      }
      
      // Create appropriate error response
      throw createError({
        statusCode: error.message.includes('does not exist') ? 400 : 500,
        statusMessage: error.message
      });
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to install hooks'
    });
  }
});