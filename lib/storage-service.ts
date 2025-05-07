// Enhanced storage service with folder support and improved image management

// Add this import at the top of the file
import { imageCache } from "./image-cache"

interface StoredImage {
  id: string
  name: string
  data: string // Base64 encoded image data
  type: string // MIME type
  dateAdded: number
  folderId: string // ID of the parent folder
  lastModified: number
}

interface ImageFolder {
  id: string
  name: string
  parentId: string | null // null for root folders
  dateCreated: number
  lastModified: number
}

// Add these interfaces after the existing interfaces
interface StoredFrame {
  id: string
  name: string
  flip_left: boolean
  images: string[] // Array of image IDs
  dateCreated: number
  lastModified: number
}

// Update the class constructor to include the frameStore
class StorageService {
  private dbName = "animation-config-editor"
  private imageStore = "images"
  private folderStore = "folders"
  private frameStore = "frames" // Add this line
  private dbVersion = 3 // Increased version for schema update
  private db: IDBDatabase | null = null
  private dbInitPromise: Promise<IDBDatabase> | null = null

  constructor() {
    // Initialize the database when the service is created
    this.dbInitPromise = this.initDB()
  }

  // Update the initDB method to include the frameStore
  private initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
      if (this.db) {
        resolve(this.db)
        return
      }

      // Check if IndexedDB is available
      if (!window.indexedDB) {
        console.error("Your browser doesn't support IndexedDB")
        reject(new Error("IndexedDB not supported"))
        return
      }

      try {
        const request = indexedDB.open(this.dbName, this.dbVersion)

        request.onerror = (event) => {
          console.error("IndexedDB error:", event)
          reject(new Error("Error opening database"))
        }

        request.onsuccess = (event) => {
          this.db = (event.target as IDBOpenDBRequest).result

          // Set up error handler for the database
          this.db.onerror = (event) => {
            console.error("Database error:", event)
          }

          resolve(this.db)
        }

        request.onupgradeneeded = (event) => {
          const db = (event.target as IDBOpenDBRequest).result
          const oldVersion = event.oldVersion

          // Create or update stores based on the old version
          if (oldVersion < 1) {
            // Create the image store if it doesn't exist
            if (!db.objectStoreNames.contains(this.imageStore)) {
              const imageStore = db.createObjectStore(this.imageStore, { keyPath: "id" })
              imageStore.createIndex("dateAdded", "dateAdded", { unique: false })
              imageStore.createIndex("name", "name", { unique: false })
            }
          }

          if (oldVersion < 2) {
            // Add folder store in version 2
            if (!db.objectStoreNames.contains(this.folderStore)) {
              const folderStore = db.createObjectStore(this.folderStore, { keyPath: "id" })
              folderStore.createIndex("parentId", "parentId", { unique: false })
              folderStore.createIndex("name", "name", { unique: false })
              folderStore.createIndex("dateCreated", "dateCreated", { unique: false })
            }

            // Update image store to include folderId if it exists
            if (db.objectStoreNames.contains(this.imageStore)) {
              const imageStore = request.transaction!.objectStore(this.imageStore)

              // Add folderId index if it doesn't exist
              if (!imageStore.indexNames.contains("folderId")) {
                imageStore.createIndex("folderId", "folderId", { unique: false })
              }

              // Add lastModified index if it doesn't exist
              if (!imageStore.indexNames.contains("lastModified")) {
                imageStore.createIndex("lastModified", "lastModified", { unique: false })
              }
            }

            // Create a default "root" folder
            const transaction = request.transaction!
            const folderStore = transaction.objectStore(this.folderStore)
            folderStore.add({
              id: "root",
              name: "Root",
              parentId: null,
              dateCreated: Date.now(),
              lastModified: Date.now(),
            })
          }

          if (oldVersion < 3) {
            // Add frame store in version 3
            if (!db.objectStoreNames.contains(this.frameStore)) {
              const frameStore = db.createObjectStore(this.frameStore, { keyPath: "id" })
              frameStore.createIndex("name", "name", { unique: false })
              frameStore.createIndex("dateCreated", "dateCreated", { unique: false })
              frameStore.createIndex("lastModified", "lastModified", { unique: false })
            }
          }
        }
      } catch (error) {
        console.error("Error initializing database:", error)
        reject(error)
      }
    })
  }

  // Ensure the database is initialized before any operation
  private async ensureDB(): Promise<IDBDatabase> {
    if (this.db) return this.db

    if (this.dbInitPromise) {
      try {
        this.db = await this.dbInitPromise
        return this.db
      } catch (error) {
        // If the initial promise failed, try again
        this.dbInitPromise = this.initDB()
        this.db = await this.dbInitPromise
        return this.db
      }
    } else {
      this.dbInitPromise = this.initDB()
      this.db = await this.dbInitPromise
      return this.db
    }
  }

  // Image operations
  async saveImage(image: StoredImage): Promise<string> {
    try {
      const db = await this.ensureDB()

      // Ensure the image has a folderId (default to root)
      if (!image.folderId) {
        image.folderId = "root"
      }

      // Ensure lastModified is set
      image.lastModified = Date.now()

      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([this.imageStore], "readwrite")

          transaction.onerror = (event) => {
            console.error("Transaction error:", event)
            reject(new Error("Error in transaction"))
          }

          const store = transaction.objectStore(this.imageStore)
          const request = store.put(image)

          request.onsuccess = () => {
            resolve(image.id)
          }

          request.onerror = (event) => {
            console.error("Error saving image:", event)
            reject(new Error("Error saving image"))
          }
        } catch (error) {
          console.error("Error in saveImage transaction:", error)
          reject(error)
        }
      })
    } catch (error) {
      console.error("Error ensuring database in saveImage:", error)
      throw error
    }
  }

  // Then modify the getImage method in the StorageService class
  async getImage(id: string): Promise<StoredImage | null> {
    try {
      // Check cache first
      const cachedData = imageCache.get(id)
      if (cachedData) {
        // If we have the image data in cache, we still need the metadata
        const db = await this.ensureDB()

        return new Promise((resolve, reject) => {
          try {
            const transaction = db.transaction([this.imageStore], "readonly")
            const store = transaction.objectStore(this.imageStore)
            const request = store.get(id)

            request.onsuccess = () => {
              if (request.result) {
                // Use the cached data with the metadata
                const image = { ...request.result, data: cachedData }
                resolve(image)
              } else {
                // If metadata is gone but we have the cache, clear the cache entry
                imageCache.clear()
                resolve(null)
              }
            }

            request.onerror = (event) => {
              console.error("Error getting image:", event)
              reject(new Error("Error getting image"))
            }
          } catch (error) {
            console.error("Error in getImage transaction:", error)
            reject(error)
          }
        })
      }

      // If not in cache, get from database
      const db = await this.ensureDB()

      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([this.imageStore], "readonly")
          const store = transaction.objectStore(this.imageStore)
          const request = store.get(id)

          request.onsuccess = () => {
            const image = request.result || null
            if (image && image.data) {
              // Add to cache
              imageCache.set(id, image.data)
            }
            resolve(image)
          }

          request.onerror = (event) => {
            console.error("Error getting image:", event)
            reject(new Error("Error getting image"))
          }
        } catch (error) {
          console.error("Error in getImage transaction:", error)
          reject(error)
        }
      })
    } catch (error) {
      console.error("Error ensuring database in getImage:", error)
      throw error
    }
  }

  async getAllImages(): Promise<StoredImage[]> {
    try {
      const db = await this.ensureDB()

      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([this.imageStore], "readonly")
          const store = transaction.objectStore(this.imageStore)
          const request = store.getAll()

          request.onsuccess = () => {
            // Add folderId to any images that don't have one (for backward compatibility)
            const images = request.result || []
            const updatedImages = images.map((img) => ({
              ...img,
              folderId: img.folderId || "root",
              lastModified: img.lastModified || img.dateAdded,
            }))
            resolve(updatedImages)
          }

          request.onerror = (event) => {
            console.error("Error getting all images:", event)
            reject(new Error("Error getting all images"))
          }
        } catch (error) {
          console.error("Error in getAllImages transaction:", error)
          reject(error)
        }
      })
    } catch (error) {
      console.error("Error ensuring database in getAllImages:", error)
      throw error
    }
  }

  async getImagesByFolder(folderId: string): Promise<StoredImage[]> {
    try {
      const db = await this.ensureDB()

      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([this.imageStore], "readonly")
          const store = transaction.objectStore(this.imageStore)
          const index = store.index("folderId")
          const request = index.getAll(folderId)

          request.onsuccess = () => {
            resolve(request.result || [])
          }

          request.onerror = (event) => {
            console.error("Error getting images by folder:", event)
            reject(new Error("Error getting images by folder"))
          }
        } catch (error) {
          console.error("Error in getImagesByFolder transaction:", error)
          reject(error)
        }
      })
    } catch (error) {
      console.error("Error ensuring database in getImagesByFolder:", error)
      throw error
    }
  }

  async updateImageName(id: string, newName: string): Promise<void> {
    try {
      const db = await this.ensureDB()
      const image = await this.getImage(id)

      if (!image) {
        throw new Error("Image not found")
      }

      image.name = newName
      image.lastModified = Date.now()

      await this.saveImage(image)
    } catch (error) {
      console.error("Error updating image name:", error)
      throw error
    }
  }

  async moveImage(id: string, newFolderId: string): Promise<void> {
    try {
      const db = await this.ensureDB()
      const image = await this.getImage(id)

      if (!image) {
        throw new Error("Image not found")
      }

      image.folderId = newFolderId
      image.lastModified = Date.now()

      await this.saveImage(image)
    } catch (error) {
      console.error("Error moving image:", error)
      throw error
    }
  }

  async deleteImage(id: string): Promise<void> {
    try {
      const db = await this.ensureDB()

      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([this.imageStore], "readwrite")
          const store = transaction.objectStore(this.imageStore)
          const request = store.delete(id)

          request.onsuccess = () => {
            resolve()
          }

          request.onerror = (event) => {
            console.error("Error deleting image:", event)
            reject(new Error("Error deleting image"))
          }
        } catch (error) {
          console.error("Error in deleteImage transaction:", error)
          reject(error)
        }
      })
    } catch (error) {
      console.error("Error ensuring database in deleteImage:", error)
      throw error
    }
  }

  // Folder operations
  async createFolder(folder: Omit<ImageFolder, "id" | "dateCreated" | "lastModified">): Promise<string> {
    try {
      const db = await this.ensureDB()

      const newFolder: ImageFolder = {
        ...folder,
        id: generateId(),
        dateCreated: Date.now(),
        lastModified: Date.now(),
      }

      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([this.folderStore], "readwrite")
          const store = transaction.objectStore(this.folderStore)
          const request = store.add(newFolder)

          request.onsuccess = () => {
            resolve(newFolder.id)
          }

          request.onerror = (event) => {
            console.error("Error creating folder:", event)
            reject(new Error("Error creating folder"))
          }
        } catch (error) {
          console.error("Error in createFolder transaction:", error)
          reject(error)
        }
      })
    } catch (error) {
      console.error("Error ensuring database in createFolder:", error)
      throw error
    }
  }

  async getFolder(id: string): Promise<ImageFolder | null> {
    try {
      const db = await this.ensureDB()

      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([this.folderStore], "readonly")
          const store = transaction.objectStore(this.folderStore)
          const request = store.get(id)

          request.onsuccess = () => {
            resolve(request.result || null)
          }

          request.onerror = (event) => {
            console.error("Error getting folder:", event)
            reject(new Error("Error getting folder"))
          }
        } catch (error) {
          console.error("Error in getFolder transaction:", error)
          reject(error)
        }
      })
    } catch (error) {
      console.error("Error ensuring database in getFolder:", error)
      throw error
    }
  }

  async getAllFolders(): Promise<ImageFolder[]> {
    try {
      const db = await this.ensureDB()

      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([this.folderStore], "readonly")
          const store = transaction.objectStore(this.folderStore)
          const request = store.getAll()

          request.onsuccess = () => {
            resolve(request.result || [])
          }

          request.onerror = (event) => {
            console.error("Error getting all folders:", event)
            reject(new Error("Error getting all folders"))
          }
        } catch (error) {
          console.error("Error in getAllFolders transaction:", error)
          reject(error)
        }
      })
    } catch (error) {
      console.error("Error ensuring database in getAllFolders:", error)
      throw error
    }
  }

  async getChildFolders(parentId: string | null): Promise<ImageFolder[]> {
    try {
      const db = await this.ensureDB()

      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([this.folderStore], "readonly")
          const store = transaction.objectStore(this.folderStore)
          const index = store.index("parentId")
          const request = index.getAll(parentId)

          request.onsuccess = () => {
            resolve(request.result || [])
          }

          request.onerror = (event) => {
            console.error("Error getting child folders:", event)
            reject(new Error("Error getting child folders"))
          }
        } catch (error) {
          console.error("Error in getChildFolders transaction:", error)
          reject(error)
        }
      })
    } catch (error) {
      console.error("Error ensuring database in getChildFolders:", error)
      throw error
    }
  }

  async updateFolder(folder: ImageFolder): Promise<void> {
    try {
      const db = await this.ensureDB()

      folder.lastModified = Date.now()

      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([this.folderStore], "readwrite")
          const store = transaction.objectStore(this.folderStore)
          const request = store.put(folder)

          request.onsuccess = () => {
            resolve()
          }

          request.onerror = (event) => {
            console.error("Error updating folder:", event)
            reject(new Error("Error updating folder"))
          }
        } catch (error) {
          console.error("Error in updateFolder transaction:", error)
          reject(error)
        }
      })
    } catch (error) {
      console.error("Error ensuring database in updateFolder:", error)
      throw error
    }
  }

  async deleteFolder(id: string): Promise<void> {
    try {
      const db = await this.ensureDB()

      // First, get all images in this folder and move them to root
      const images = await this.getImagesByFolder(id)
      for (const image of images) {
        await this.moveImage(image.id, "root")
      }

      // Then, get all child folders and delete them recursively
      const childFolders = await this.getChildFolders(id)
      for (const folder of childFolders) {
        await this.deleteFolder(folder.id)
      }

      // Finally, delete the folder itself
      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([this.folderStore], "readwrite")
          const store = transaction.objectStore(this.folderStore)
          const request = store.delete(id)

          request.onsuccess = () => {
            resolve()
          }

          request.onerror = (event) => {
            console.error("Error deleting folder:", event)
            reject(new Error("Error deleting folder"))
          }
        } catch (error) {
          console.error("Error in deleteFolder transaction:", error)
          reject(error)
        }
      })
    } catch (error) {
      console.error("Error ensuring database in deleteFolder:", error)
      throw error
    }
  }

  // Check if the database is accessible
  async checkDatabaseAccess(): Promise<boolean> {
    try {
      await this.ensureDB()
      return true
    } catch (error) {
      console.error("Database access check failed:", error)
      return false
    }
  }

  // Add these methods at the end of the class, before the closing brace

  // Frame operations
  async saveFrame(frame: StoredFrame): Promise<string> {
    try {
      const db = await this.ensureDB()

      // Ensure lastModified is set
      frame.lastModified = Date.now()

      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([this.frameStore], "readwrite")
          const store = transaction.objectStore(this.frameStore)
          const request = store.put(frame)

          request.onsuccess = () => {
            resolve(frame.id)
          }

          request.onerror = (event) => {
            console.error("Error saving frame:", event)
            reject(new Error("Error saving frame"))
          }
        } catch (error) {
          console.error("Error in saveFrame transaction:", error)
          reject(error)
        }
      })
    } catch (error) {
      console.error("Error ensuring database in saveFrame:", error)
      throw error
    }
  }

  async getFrame(id: string): Promise<StoredFrame | null> {
    try {
      const db = await this.ensureDB()

      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([this.frameStore], "readonly")
          const store = transaction.objectStore(this.frameStore)
          const request = store.get(id)

          request.onsuccess = () => {
            resolve(request.result || null)
          }

          request.onerror = (event) => {
            console.error("Error getting frame:", event)
            reject(new Error("Error getting frame"))
          }
        } catch (error) {
          console.error("Error in getFrame transaction:", error)
          reject(error)
        }
      })
    } catch (error) {
      console.error("Error ensuring database in getFrame:", error)
      throw error
    }
  }

  async getAllFrames(): Promise<StoredFrame[]> {
    try {
      const db = await this.ensureDB()

      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([this.frameStore], "readonly")
          const store = transaction.objectStore(this.frameStore)
          const request = store.getAll()

          request.onsuccess = () => {
            resolve(request.result || [])
          }

          request.onerror = (event) => {
            console.error("Error getting all frames:", event)
            reject(new Error("Error getting all frames"))
          }
        } catch (error) {
          console.error("Error in getAllFrames transaction:", error)
          reject(error)
        }
      })
    } catch (error) {
      console.error("Error ensuring database in getAllFrames:", error)
      throw error
    }
  }

  async updateFrame(frame: StoredFrame): Promise<void> {
    try {
      const db = await this.ensureDB()

      frame.lastModified = Date.now()

      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([this.frameStore], "readwrite")
          const store = transaction.objectStore(this.frameStore)
          const request = store.put(frame)

          request.onsuccess = () => {
            resolve()
          }

          request.onerror = (event) => {
            console.error("Error updating frame:", event)
            reject(new Error("Error updating frame"))
          }
        } catch (error) {
          console.error("Error in updateFrame transaction:", error)
          reject(error)
        }
      })
    } catch (error) {
      console.error("Error ensuring database in updateFrame:", error)
      throw error
    }
  }

  async deleteFrame(id: string): Promise<void> {
    try {
      const db = await this.ensureDB()

      return new Promise((resolve, reject) => {
        try {
          const transaction = db.transaction([this.frameStore], "readwrite")
          const store = transaction.objectStore(this.frameStore)
          const request = store.delete(id)

          request.onsuccess = () => {
            resolve()
          }

          request.onerror = (event) => {
            console.error("Error deleting frame:", event)
            reject(new Error("Error deleting frame"))
          }
        } catch (error) {
          console.error("Error in deleteFrame transaction:", error)
          reject(error)
        }
      })
    } catch (error) {
      console.error("Error ensuring database in deleteFrame:", error)
      throw error
    }
  }
}

// Create a singleton instance
const storageService = new StorageService()

// Helper function to convert a File to a base64 string
function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.readAsDataURL(file)
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = (error) => reject(error)
  })
}

// Helper function to generate a unique ID
function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substring(2)
}

// Format file size for display
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + " B"
  else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + " KB"
  else return (bytes / 1048576).toFixed(1) + " MB"
}

// Format date for display
function formatDate(timestamp: number): string {
  return new Date(timestamp).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

// Export the StoredFrame interface
export { storageService, fileToBase64, generateId, formatFileSize, formatDate }
export type { StoredImage, ImageFolder, StoredFrame }
