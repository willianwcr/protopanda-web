"use client"

import { useEffect, useState, useRef, useMemo } from "react"
import { useConfig } from "./config-provider"
import { Card, CardContent } from "@/components/ui/card"
import { storageService } from "@/lib/storage-service"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"

export function AnimationPreview() {
  const { config, activeExpressionIndex } = useConfig()
  const [currentFrameIndex, setCurrentFrameIndex] = useState(0)
  const [preloadedImages, setPreloadedImages] = useState<{ [key: string]: string }>({})
  const [isLoading, setIsLoading] = useState(false)
  const [showBothFaces, setShowBothFaces] = useState(true)
  const animationRef = useRef<NodeJS.Timeout | null>(null)
  const imagesLoadedRef = useRef<boolean>(false)

  // Compute animation sequence and frame definition
  const { animationSequence, framesDef, expression } = useMemo(() => {
    if (!config || !config.expressions[activeExpressionIndex]) {
      return { animationSequence: [], framesDef: null, expression: null }
    }

    const expr = config.expressions[activeExpressionIndex]
    const frames = config.frames.find((f) => f.name === expr.frames)

    if (!frames || frames.images.length === 0) {
      return { animationSequence: [], framesDef: null, expression: expr }
    }

    let sequence: number[] = []

    if (expr.animation === "auto") {
      // Generate auto sequence (0 to length-1)
      sequence = Array.from({ length: frames.images.length }, (_, i) => i)
    } else if (Array.isArray(expr.animation)) {
      // Convert 1-based indices in the config to 0-based indices for array access
      sequence = expr.animation.map((idx) => idx - 1)
      // Filter out invalid indices
      sequence = sequence.filter((idx) => idx >= 0 && idx < frames.images.length)
    }

    return { animationSequence: sequence, framesDef: frames, expression: expr }
  }, [config, activeExpressionIndex])

  // Preload all images
  useEffect(() => {
    const preloadAllImages = async () => {
      if (!framesDef || animationSequence.length === 0) {
        imagesLoadedRef.current = true
        return
      }

      // Check if we need to load images
      const imageIds = animationSequence.map((idx) => framesDef.images[idx]).filter((id) => id && id.trim() !== "") // Filter out invalid IDs

      if (imageIds.length === 0) {
        setIsLoading(false)
        imagesLoadedRef.current = true
        return
      }

      const allImagesLoaded = imageIds.every((id) => id in preloadedImages)

      if (allImagesLoaded && imagesLoadedRef.current) {
        return
      }

      setIsLoading(true)
      try {
        const newPreloadedImages = { ...preloadedImages }
        const promises = imageIds.map(async (imageId) => {
          if (!(imageId in newPreloadedImages)) {
            const image = await storageService.getImage(imageId)
            if (image) {
              newPreloadedImages[imageId] = image.data
            }
          }
        })

        await Promise.all(promises)
        setPreloadedImages(newPreloadedImages)
        imagesLoadedRef.current = true
      } catch (error) {
        console.error("Error preloading images:", error)
      } finally {
        setIsLoading(false)
      }
    }

    preloadAllImages()
  }, [framesDef, animationSequence, preloadedImages])

  // Animation effect
  useEffect(() => {
    // Clear any existing animation
    if (animationRef.current) {
      clearInterval(animationRef.current)
      animationRef.current = null
    }

    if (!expression || !framesDef || animationSequence.length === 0) {
      return
    }

    // Reset to first frame
    setCurrentFrameIndex(0)

    // Start animation if duration is set
    if (expression.duration && expression.duration > 0) {
      animationRef.current = setInterval(() => {
        setCurrentFrameIndex((prev) => (prev + 1) % animationSequence.length)
      }, expression.duration)
    }

    return () => {
      if (animationRef.current) {
        clearInterval(animationRef.current)
      }
    }
  }, [expression, framesDef, animationSequence])

  if (!config || config.expressions.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center h-32">
          <p className="text-muted-foreground">No expressions defined. Add expressions to see a preview.</p>
        </CardContent>
      </Card>
    )
  }

  if (!expression) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center h-32">
          <p className="text-muted-foreground">No expression selected</p>
        </CardContent>
      </Card>
    )
  }

  if (!framesDef) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center h-32">
          <p className="text-muted-foreground">Frame definition not found</p>
        </CardContent>
      </Card>
    )
  }

  if (framesDef.images.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center h-32">
          <p className="text-muted-foreground">No images in this frame. Edit the frame to add images.</p>
        </CardContent>
      </Card>
    )
  }

  if (animationSequence.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center h-32">
          <p className="text-muted-foreground">No animation frames defined</p>
        </CardContent>
      </Card>
    )
  }

  // Ensure currentFrameIndex is within bounds
  const safeFrameIndex = Math.min(currentFrameIndex, animationSequence.length - 1)
  const frameIndex = animationSequence[safeFrameIndex]
  const imageId =
    frameIndex !== undefined && frameIndex >= 0 && frameIndex < framesDef.images.length
      ? framesDef.images[frameIndex]
      : null
  const imageData = imageId && preloadedImages[imageId] ? preloadedImages[imageId] : null

  return (
    <Card className="flex-shrink-0">
      <CardContent className="p-4">
        <div className="flex flex-col items-center">
          <h2 className="text-lg font-medium mb-2">{expression.name || "Animation Preview"}</h2>

          <div className="flex items-center space-x-2 mb-4">
            <Switch id="show-both-faces" checked={showBothFaces} onCheckedChange={setShowBothFaces} />
            <Label htmlFor="show-both-faces">Show both faces</Label>
          </div>

          <div className="flex gap-4 justify-center">
            {showBothFaces && (
              <div className="border rounded-md overflow-hidden bg-black">
                {isLoading && !imageData ? (
                  <div className="w-[192px] h-[96px] flex items-center justify-center">
                    <p className="text-white text-sm">Loading...</p>
                  </div>
                ) : imageData ? (
                  <div className="w-[192px] h-[96px] flex items-center justify-center">
                    <img
                      src={imageData || "/placeholder.svg"}
                      alt={`Frame ${safeFrameIndex + 1} (Left)`}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "contain",
                        imageRendering: "pixelated",
                        transform: framesDef.flip_left ? "scaleX(-1)" : "none",
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-[192px] h-[96px] flex items-center justify-center">
                    <p className="text-white text-sm">Image not found</p>
                  </div>
                )}
              </div>
            )}

            <div className="border rounded-md overflow-hidden bg-black">
              {isLoading && !imageData ? (
                <div className="w-[192px] h-[96px] flex items-center justify-center">
                  <p className="text-white text-sm">Loading...</p>
                </div>
              ) : imageData ? (
                <div className="w-[192px] h-[96px] flex items-center justify-center">
                  <img
                    src={imageData || "/placeholder.svg"}
                    alt={`Frame ${safeFrameIndex + 1} (Right)`}
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      imageRendering: "pixelated",
                    }}
                  />
                </div>
              ) : (
                <div className="w-[192px] h-[96px] flex items-center justify-center">
                  <p className="text-white text-sm">Image not found</p>
                </div>
              )}
            </div>
          </div>

          <div className="mt-2 text-sm text-muted-foreground">
            Frame {safeFrameIndex + 1}/{animationSequence.length} • Duration: {expression.duration}ms
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
