"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, Loader2, AlertTriangle } from "lucide-react"
import { storageService, fileToBase64, generateId, type StoredImage } from "@/lib/storage-service"
import { toast } from "@/components/ui/use-toast"
import { Progress } from "@/components/ui/progress"

interface ImageUploaderProps {
  onImageUploaded?: (imageId: string) => void
}

export function ImageUploader({ onImageUploaded }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [storageAvailable, setStorageAvailable] = useState(true)
  const [uploadCount, setUploadCount] = useState(0)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Check if storage is available on component mount
  useEffect(() => {
    const checkStorage = async () => {
      const available = await storageService.checkDatabaseAccess()
      setStorageAvailable(available)

      if (!available) {
        toast({
          title: "Storage Warning",
          description: "Browser storage is not available. Your uploads may not persist after page refresh.",
          variant: "destructive",
        })
      }
    }

    checkStorage()
  }, [])

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
    if (!storageAvailable) {
      const proceed = window.confirm(
        "Browser storage is not available. Your uploads may not persist after page refresh. Continue anyway?",
      )
      if (!proceed) return
    }

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
        }

        await storageService.saveImage(imageData)

        // Update progress
        const progress = Math.round(((i + 1) / files.length) * 100)
        setUploadProgress(progress)

        // Notify parent component about the last uploaded image
        if (i === files.length - 1 && onImageUploaded) {
          onImageUploaded(imageData.id)
        }
      }

      toast({
        title: "Images uploaded",
        description: `${files.length} image${files.length > 1 ? "s" : ""} uploaded successfully.`,
      })
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
    <Card>
      <CardContent className="p-4">
        {!storageAvailable && (
          <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2 dark:bg-amber-950/30 dark:border-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-300">
              <p className="font-medium">Storage Warning</p>
              <p>Browser storage is not available. Your uploads may not persist after page refresh.</p>
            </div>
          </div>
        )}

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

          <Button className="w-full" disabled={isUploading} onClick={() => fileInputRef.current?.click()}>
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
      </CardContent>
    </Card>
  )
}
