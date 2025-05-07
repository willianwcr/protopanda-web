// Re-export from storage-service to maintain backward compatibility
import { storageService, fileToBase64, generateId, formatFileSize, formatDate } from "./storage-service"
import type { StoredImage, ImageFolder, StoredFrame } from "./storage-service"

export { storageService, fileToBase64, generateId, formatFileSize, formatDate }
export type { StoredImage, ImageFolder, StoredFrame }
