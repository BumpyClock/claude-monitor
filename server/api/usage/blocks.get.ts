import { getBlocksUsage } from '../../utils/usage';

export default defineEventHandler(async (event) => {
  const query = getQuery(event);
  
  const options = {
    active: query.active === 'true',
    recent: query.recent === 'true',
    mode: query.mode as any || undefined,
    order: query.order as any || undefined,
    tokenLimit: query.tokenLimit ? 
      (query.tokenLimit === 'max' ? 'max' : parseInt(query.tokenLimit as string)) : 
      undefined
  };
  
  return await getBlocksUsage(options);
});