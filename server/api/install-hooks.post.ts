import { installHooks } from '../utils/hook-installer';

export default defineEventHandler(async (event) => {
  try {
    const body = await readBody(event);
    const { targetPath, displayName, serverUrl } = body;
    
    // Validate required fields
    if (!targetPath || !displayName || !serverUrl) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Missing required fields: targetPath, displayName, and serverUrl are required'
      });
    }
    
    // Install hooks
    const result = await installHooks({
      targetPath,
      displayName,
      serverUrl
    });
    
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