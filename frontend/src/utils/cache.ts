const cache = new Map<string, { data: any; timestamp: number }>()
const DEFAULT_CACHE_DURATION = 5 * 60 * 1000

export const setCache = (key: string, data: any, duration: number = DEFAULT_CACHE_DURATION) => {
  cache.set(key, {
    data,
    timestamp: Date.now() + duration
  })
}

export const getCache = (key: string) => {
  const cached = cache.get(key)
  if (!cached) return null

  if (Date.now() > cached.timestamp) {
    cache.delete(key)
    return null
  }

  return cached.data
}

export const clearCache = (key?: string) => {
  if (key) {
    cache.delete(key)
  } else {
    cache.clear()
  }
}

export const clearExpiredCache = () => {
  const now = Date.now()
  for (const [key, value] of cache.entries()) {
    if (now > value.timestamp) {
      cache.delete(key)
    }
  }
}

setInterval(clearExpiredCache, 60000)

export const withCache = async <T>(
  key: string,
  fetcher: () => Promise<T>,
  duration?: number
): Promise<T> => {
  const cached = getCache(key)
  if (cached) {
    return cached as T
  }

  const data = await fetcher()
  setCache(key, data, duration)
  return data
}
