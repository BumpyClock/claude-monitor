import { getLiveBlockData } from '../../../utils/usage';

export default defineEventHandler(async () => {
  return await getLiveBlockData();
});