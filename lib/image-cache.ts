// A simple in-memory cache for images to improve performance

type CacheEntry = {
  data: string
  timestamp: number
}

class ImageCache {
  private cache: Map<string, CacheEntry> = new Map()
  private maxSize = 100 // Maximum number of images to cache
  private expirationTime: number = 1000 * 60 * 30 // 30 minutes

  // Get an image from the cache
  get(id: string): string | null {
    const entry = this.cache.get(id)
    if (!entry) return null

    // Check if the entry has expired
    if (Date.now() - entry.timestamp > this.expirationTime) {
      this.cache.delete(id)
      return null
    }

    // Update the timestamp to mark it as recently used
    entry.timestamp = Date.now()
    return entry.data
  }

  // Add an image to the cache
  set(id: string, data: string): void {
    // If the cache is full, remove the oldest entry
    if (this.cache.size >= this.maxSize) {
      let oldestId: string | null = null
      let oldestTime = Number.POSITIVE_INFINITY

      for (const [key, entry] of this.cache.entries()) {
        if (entry.timestamp < oldestTime) {
          oldestTime = entry.timestamp
          oldestId = key
        }
      }

      if (oldestId) {
        this.cache.delete(oldestId)
      }
    }

    this.cache.set(id, {
      data,
      timestamp: Date.now(),
    })
  }

  // Clear the entire cache
  clear(): void {
    this.cache.clear()
  }

  // Get the current size of the cache
  get size(): number {
    return this.cache.size
  }
}

// Create a singleton instance
export const imageCache = new ImageCache()
