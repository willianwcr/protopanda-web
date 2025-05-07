"use client"

import { useState, useEffect } from "react"
import { X, ZoomIn, ZoomOut, RotateCw, Info } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import type { StoredImage } from "@/lib/storage-service"
import { formatFileSize, formatDate } from "@/lib/storage-service"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface ImagePreviewProps {
  image: StoredImage | null
  onClose: () => void
}

export function ImagePreview({ image, onClose }: ImagePreviewProps) {
  const [zoom, setZoom] = useState(5) // Default zoom level (1-10)
  const [rotation, setRotation] = useState(0)
  const [showDetails, setShowDetails] = useState(false)

  // Reset zoom and rotation when image changes
  useEffect(() => {
    setZoom(5)
    setRotation(0)
    setShowDetails(false)
  }, [image?.id])

  if (!image) return null

  // Extract file extension and size
  const fileExt = image.name.split(".").pop()?.toLowerCase() || ""
  const fileSizeBytes = Math.round((image.data.length * 3) / 4)
  const fileSize = formatFileSize(fileSizeBytes)

  // Calculate zoom factor (1x to 10x)
  const zoomFactor = zoom / 5

  return (
    <Card className="w-full h-full flex flex-col">
      <CardHeader className="pb-1 flex flex-row items-center justify-between space-y-0 pt-3">
        <CardTitle className="text-lg truncate pr-4">{image.name}</CardTitle>
        <div className="flex items-center space-x-1">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setShowDetails(!showDetails)}>
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Toggle image details</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="flex-1 p-0 flex flex-col">
        <div className="relative bg-accent/20 flex-1 flex items-center justify-center overflow-hidden">
          <div
            className="transform transition-transform"
            style={{
              transform: `scale(${zoomFactor}) rotate(${rotation}deg)`,
            }}
          >
            <img
              src={image.data || "/placeholder.svg"}
              alt={image.name}
              width={64}
              height={32}
              className="object-contain"
              style={{ imageRendering: "pixelated" }}
            />
          </div>

          {/* Zoom and rotation controls overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center gap-2 bg-background/80 backdrop-blur-sm p-2 rounded-md">
            <ZoomOut className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Slider
              value={[zoom]}
              min={1}
              max={10}
              step={1}
              onValueChange={(value) => setZoom(value[0])}
              className="flex-1"
            />
            <ZoomIn className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <div className="w-px h-6 bg-border mx-1"></div>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              onClick={() => setRotation((prev) => (prev - 90 + 360) % 360)}
            >
              <RotateCw className="h-4 w-4 transform -scale-x-100" />
            </Button>
            <div className="text-xs w-8 text-center">{rotation}°</div>
            <Button
              variant="outline"
              size="icon"
              className="h-7 w-7 flex-shrink-0"
              onClick={() => setRotation((prev) => (prev + 90) % 360)}
            >
              <RotateCw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {showDetails && (
          <div className="p-3 text-xs text-muted-foreground space-y-2 border-t">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-medium">Type:</span> {fileExt.toUpperCase()}
              </div>
              <div>
                <span className="font-medium">Size:</span> {fileSize}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="font-medium">Dimensions:</span> 64×32 px
              </div>
              <div>
                <span className="font-medium">Added:</span> {formatDate(image.dateAdded)}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
