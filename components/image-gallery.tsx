"use client"

import type React from "react"

import { useState, useEffect, forwardRef, useImperativeHandle } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Trash2, Loader2, AlertTriangle, RefreshCw } from "lucide-react"
import { storageService, type StoredImage } from "@/lib/storage-service"
import { toast } from "@/components/ui/use-toast"

interface ImageGalleryProps {
  onSelectImage?: (imageData: string) => void
  showDeleteButtons?: boolean
}

export interface ImageGalleryRef {
  loadImages: () => Promise<void>
}

export const ImageGallery = forwardRef<ImageGalleryRef, ImageGalleryProps>(
  ({ onSelectImage, showDeleteButtons = true }, ref) => {
    const [images, setImages] = useState<StoredImage[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const loadImages = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Check database access first
        const hasAccess = await storageService.checkDatabaseAccess()
        if (!hasAccess) {
          setError("Cannot access browser storage. Your images may not persist after page refresh.")
          setIsLoading(false)
          return
        }

        const allImages = await storageService.getAllImages()
        // Sort by date added (newest first)
        allImages.sort((a, b) => b.dateAdded - a.dateAdded)
        setImages(allImages)
      } catch (error) {
        console.error("Error loading images:", error)
        setError("Failed to load images. Please try refreshing the page.")
        toast({
          title: "Error loading images",
          description: "There was a problem loading your saved images.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    // Expose the loadImages method through the ref
    useImperativeHandle(ref, () => ({
      loadImages,
    }))

    useEffect(() => {
      loadImages()
    }, [])

    const handleDeleteImage = async (id: string, e: React.MouseEvent) => {
      e.stopPropagation() // Prevent selecting the image when deleting

      try {
        await storageService.deleteImage(id)
        setImages(images.filter((img) => img.id !== id))
        toast({
          title: "Image deleted",
          description: "The image has been removed from your library.",
        })
      } catch (error) {
        console.error("Error deleting image:", error)
        toast({
          title: "Error deleting image",
          description: "There was a problem deleting the image.",
          variant: "destructive",
        })
      }
    }

    const handleSelectImage = (image: StoredImage) => {
      if (onSelectImage) {
        onSelectImage(image.data)
      }
    }

    return (
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between">
          <CardTitle className="text-lg">Your Images</CardTitle>
          {error && (
            <Button variant="ghost" size="sm" onClick={loadImages} title="Retry loading images">
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-40 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading images...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col justify-center items-center h-40 space-y-4 text-center">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <p className="text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" onClick={loadImages}>
                Try Again
              </Button>
            </div>
          ) : images.length === 0 ? (
            <div className="flex justify-center items-center h-40">
              <p className="text-muted-foreground">No images uploaded yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {images.map((image) => (
                  <div
                    key={image.id}
                    className="relative group cursor-pointer border rounded-md overflow-hidden"
                    onClick={() => handleSelectImage(image)}
                  >
                    <img src={image.data || "/placeholder.svg"} alt={image.name} className="w-full h-24 object-cover" />
                    {showDeleteButtons && (
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button
                          variant="destructive"
                          size="icon"
                          className="h-8 w-8"
                          onClick={(e) => handleDeleteImage(image.id, e)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1 truncate">
                      {image.name}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    )
  },
)

ImageGallery.displayName = "ImageGallery"
