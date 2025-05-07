// Simple in-memory cache for image data to improve performance

class ImageCache {
  private cache: Map<string, string>
  private maxSize: number
  private currentSize: number

  constructor(maxSize = 50) {
    this.cache = new Map()
    this.maxSize = maxSize
    this.currentSize = 0
  }

  set(id: string, data: string): void {
    // If we're on the server, don't cache
    if (typeof window === "undefined") return

    // If the cache is full, remove the oldest entry
    if (this.currentSize >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
      this.currentSize--
    }

    // Add the new entry
    this.cache.set(id, data)
    this.currentSize++
  }

  get(id: string): string | null {
    // If we're on the server, return null
    if (typeof window === "undefined") return null

    return this.cache.get(id) || null
  }

  clear(): void {
    // If we're on the server, do nothing
    if (typeof window === "undefined") return

    this.cache.clear()
    this.currentSize = 0
  }

  remove(id: string): void {
    // If we're on the server, do nothing
    if (typeof window === "undefined") return

    if (this.cache.has(id)) {
      this.cache.delete(id)
      this.currentSize--
    }
  }
}

// Create a singleton instance
export const imageCache = new ImageCache()
