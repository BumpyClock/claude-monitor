import { getHistoricalEvents } from '../../utils/db/events';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const beforeParam = query.before as string;
  const limit = query.limit ? parseInt(query.limit as string) : 50;
  
  if (!beforeParam) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Missing required parameter: before (ISO timestamp)'
    });
  }
  
  try {
    const beforeTimestamp = new Date(beforeParam).getTime();
    if (isNaN(beforeTimestamp)) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Invalid timestamp format. Use ISO 8601 format.'
      });
    }
    
    return getHistoricalEvents(beforeTimestamp, limit);
  } catch (error) {
    console.error('Error retrieving historical events:', error);
    
    if (error instanceof Error && 'statusCode' in error) {
      throw error;
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to retrieve historical events'
    });
  }
});