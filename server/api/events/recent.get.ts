import { getRecentEvents } from '../../utils/db/events';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  const limit = query.limit ? parseInt(query.limit as string) : 100;
  
  return getRecentEvents(limit);
});