import { getDailyUsage } from '../../utils/usage';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  
  const options = {
    since: query.since as string | undefined,
    until: query.until as string | undefined,
    project: query.project as string | undefined,
    breakdown: query.breakdown === 'true',
    mode: query.mode as any || undefined
  };
  
  return await getDailyUsage(options);
});