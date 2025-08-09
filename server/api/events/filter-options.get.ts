import { getFilterOptions } from '../../utils/db/events';

export default defineEventHandler(async () => {
  return getFilterOptions();
});