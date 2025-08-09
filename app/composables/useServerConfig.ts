import { computed } from 'vue';

export const useServerConfig = () => {
  const config = useRuntimeConfig();
  
  const serverUrl = computed(() => {
    const host = config.public.serverHost || 'localhost';
    const port = config.public.serverPort || '3000';
    return `http://${host}:${port}`;
  });
  
  const websocketUrl = computed(() => {
    const host = config.public.serverHost || 'localhost';
    const port = config.public.serverPort || '3000';
    return `ws://${host}:${port}/stream`;
  });
  
  const apiUrl = (path: string) => {
    const base = serverUrl.value;
    // Ensure path starts with /api if not already
    const apiPath = path.startsWith('/api') ? path : `/api${path.startsWith('/') ? path : '/' + path}`;
    return `${base}${apiPath}`;
  };
  
  return {
    serverUrl,
    websocketUrl,
    apiUrl,
    serverHost: config.public.serverHost,
    serverPort: config.public.serverPort
  };
};