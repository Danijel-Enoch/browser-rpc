import { useQuery } from '@tanstack/react-query'

export interface ServerConfig {
  fromAddress: string | null
}

async function fetchServerConfig(): Promise<ServerConfig> {
  const response = await fetch('/api/config')
  if (!response.ok) {
    throw new Error('Failed to fetch server config')
  }
  return response.json()
}

export function useServerConfig() {
  return useQuery({
    queryKey: ['serverConfig'],
    queryFn: fetchServerConfig,
    staleTime: Infinity, // Config doesn't change during a session
    refetchOnWindowFocus: false,
  })
}
