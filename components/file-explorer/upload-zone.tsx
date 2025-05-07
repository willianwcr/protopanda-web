"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Upload, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { storageService, fileToBase64, generateId, type StoredImage } from "@/lib/storage-service"
import { toast } from "@/components/ui/use-toast"

interface UploadZoneProps {
  currentFolderId: string
  onUploadComplete: () => void
  onCancel: () => void
}

export function UploadZone({ currentFolderId, onUploadComplete, onCancel }: UploadZoneProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [uploadCount, setUploadCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files ? Array.from(e.target.files) : []
    if (files.length === 0) return

    // Filter for image files only
    const imageFiles = files.filter((file) => file.type.startsWith("image/"))

    if (imageFiles.length === 0) {
      toast({
        title: "Invalid file type",
        description: "Please upload image files only.",
        variant: "destructive",
      })
      return
    }

    // Start upload immediately
    await uploadFiles(imageFiles)

    // Reset the file input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const uploadFiles = async (files: File[]) => {
    try {
      setIsUploading(true)
      setUploadProgress(0)
      setUploadCount(files.length)

      // Upload each image sequentially
      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Convert to base64
        const base64Data = await fileToBase64(file)

        // Save to IndexedDB
        const imageData: StoredImage = {
          id: generateId(),
          name: file.name,
          data: base64Data,
          type: file.type,
          dateAdded: Date.now(),
          folderId: currentFolderId,
          lastModified: Date.now(),
        }

        await storageService.saveImage(imageData)

        // Update progress
        const progress = Math.round(((i + 1) / files.length) * 100)
        setUploadProgress(progress)
      }

      toast({
        title: "Images uploaded",
        description: `${files.length} image${files.length > 1 ? "s" : ""} uploaded successfully.`,
      })

      // Notify parent and reset state
      onUploadComplete()
    } catch (error) {
      console.error("Error uploading images:", error)
      toast({
        title: "Upload failed",
        description: "There was an error uploading your images.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-background">
      <div className="space-y-4">
        <div className="flex flex-col items-center justify-center p-6 border-2 border-dashed border-muted-foreground/25 rounded-lg text-center">
          <Upload className="h-10 w-10 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground mb-1">Click the button below to select and upload images</p>
          <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 5MB each</p>
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          multiple
        />

        {isUploading && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span>Uploading...</span>
              <span>{uploadProgress}%</span>
            </div>
            <Progress value={uploadProgress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              Uploading {uploadCount} image{uploadCount !== 1 ? "s" : ""}...
            </p>
          </div>
        )}

        <div className="flex justify-end space-x-2">
          <Button variant="outline" onClick={onCancel} disabled={isUploading}>
            Cancel
          </Button>
          <Button disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
            {isUploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Select and Upload Images
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  )
}
