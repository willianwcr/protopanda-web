"use client"

import { useState, useEffect, useRef } from "react"
import { storageService, type StoredImage } from "@/lib/storage-service"

interface FrameAnimationPreviewProps {
  imageIds: string[]
  flipLeft?: boolean
  duration?: number
  width?: number
  height?: number
  showBothSides?: boolean
  scale?: number
}

export function FrameAnimationPreview({
  imageIds,
  flipLeft = false,
  duration = 250,
  width = 64,
  height = 32,
  showBothSides = false,
  scale = 1,
}: FrameAnimationPreviewProps) {
  const [images, setImages] = useState<StoredImage[]>([])
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [isLoading, setIsLoading] = useState(true)
  const animationRef = useRef<NodeJS.Timeout | null>(null)
  const imagesLoadedRef = useRef<boolean>(false)

  // Load all images at once
  useEffect(() => {
    const loadImages = async () => {
      if (imageIds.length === 0) {
        setImages([])
        setIsLoading(false)
        imagesLoadedRef.current = true
        return
      }

      // Only load images if they haven't been loaded yet or if the imageIds have changed
      if (
        !imagesLoadedRef.current ||
        !arraysEqual(
          imageIds,
          images.map((img) => img.id),
        )
      ) {
        setIsLoading(true)
        try {
          const loadedImages: StoredImage[] = []
          const promises = imageIds.map((id) => storageService.getImage(id))
          const results = await Promise.all(promises)

          for (const image of results) {
            if (image) {
              loadedImages.push(image)
            }
          }

          setImages(loadedImages)
          imagesLoadedRef.current = true
        } catch (error) {
          console.error("Error loading images for animation:", error)
        } finally {
          setIsLoading(false)
        }
      }
    }

    loadImages()

    // Helper function to compare arrays
    function arraysEqual(a: string[], b: string[]) {
      if (a.length !== b.length) return false
      for (let i = 0; i < a.length; i++) {
        if (a[i] !== b[i]) return false
      }
      return true
    }
  }, [imageIds])

  // Animation effect
  useEffect(() => {
    // Clear any existing animation
    if (animationRef.current) {
      clearInterval(animationRef.current)
      animationRef.current = null
    }

    if (images.length === 0) return

    // Reset to first frame
    setCurrentFrameIndex(0)

    // Start animation if duration is set and we have more than one frame
    if (duration > 0 && images.length > 1) {
      animationRef.current = setInterval(() => {
        setCurrentFrameIndex((prev) => (prev + 1) % images.length)
      }, duration)
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current)
      }
    }
  }, [images, duration, imageIds]) // Add imageIds to dependencies to restart animation when they change

  // Calculate scaled dimensions
  const scaledWidth = width * scale
  const scaledHeight = height * scale
  const containerWidth = showBothSides ? scaledWidth * 2 + 8 * scale : scaledWidth

  if (isLoading) {
    return (
      <div className="flex items-center justify-center" style={{ width: containerWidth, height: scaledHeight }}>
        <div className="text-xs text-muted-foreground">Loading...</div>
      </div>
    )
  }

  if (images.length === 0) {
    return (
      <div className="flex items-center justify-center" style={{ width: containerWidth, height: scaledHeight }}>
        <div className="text-xs text-muted-foreground">No frames selected</div>
      </div>
    )
  }

  // Ensure currentFrameIndex is within bounds
  const safeFrameIndex = Math.min(currentFrameIndex, images.length - 1)
  const currentImage = safeFrameIndex >= 0 ? images[safeFrameIndex] : null

  // Guard against undefined currentImage
  if (!currentImage) {
    return (
      <div className="flex items-center justify-center" style={{ width: containerWidth, height: scaledHeight }}>
        <div className="text-xs text-muted-foreground">Image not available</div>
      </div>
    )
  }

  return (
    <div className="flex gap-2 items-center justify-center">
      {showBothSides && (
        <div
          className="bg-black rounded overflow-hidden flex items-center justify-center"
          style={{ width: scaledWidth, height: scaledHeight }}
        >
          <div
            style={{
              width: scaledWidth,
              height: scaledHeight,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <img
              src={currentImage.data || "/placeholder.svg"}
              alt={`Frame ${safeFrameIndex + 1}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                imageRendering: "pixelated",
                transform: flipLeft ? "scaleX(-1)" : "none",
              }}
            />
          </div>
        </div>
      )}

      <div
        className="bg-black rounded overflow-hidden flex items-center justify-center"
        style={{ width: scaledWidth, height: scaledHeight }}
      >
        <div
          style={{
            width: scaledWidth,
            height: scaledHeight,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <img
            src={currentImage.data || "/placeholder.svg"}
            alt={`Frame ${safeFrameIndex + 1}`}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              imageRendering: "pixelated",
            }}
          />
        </div>
      </div>
    </div>
  )
}
