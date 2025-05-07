"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useConfig } from "./config-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, ImageIcon, Loader2, GripVertical } from "lucide-react"
import type { Frame } from "@/lib/types"
import { toast } from "@/components/ui/use-toast"
import { FileExplorer } from "./file-explorer/file-explorer"
import { FrameAnimationPreview } from "./frame-animation-preview"
import { storageService, type StoredImage, type StoredFrame } from "@/lib/storage-service"

export function FramesList() {
  const { config, updateFrame, addFrame, deleteFrame } = useConfig()
  const [isEditing, setIsEditing] = useState(false)
  const [editingFrame, setEditingFrame] = useState<Frame | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)
  const [showImageSelector, setShowImageSelector] = useState(false)
  const [selectedImages, setSelectedImages] = useState<StoredImage[]>([])
  const [storedFrames, setStoredFrames] = useState<StoredFrame[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [draggedImageIndex, setDraggedImageIndex] = useState<number | null>(null)
  const [dragOverImageIndex, setDragOverImageIndex] = useState<number | null>(null)
  const [multiSelectedImages, setMultiSelectedImages] = useState<StoredImage[]>([])
  const dragItemRef = useRef<HTMLDivElement>(null)
  const dragOverItemRef = useRef<HTMLDivElement>(null)

  // Load stored frames
  useEffect(() => {
    const loadStoredFrames = async () => {
      try {
        setIsLoading(true)
        const frames = await storageService.getAllFrames()
        setStoredFrames(frames)
      } catch (error) {
        console.error("Error loading stored frames:", error)
        toast({
          title: "Error loading frames",
          description: "There was a problem loading your saved frames.",
          variant: "destructive",
        })
      } finally {
        setIsLoading(false)
      }
    }

    loadStoredFrames()
  }, [])

  if (!config) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center">
          <p className="text-muted-foreground">No config loaded</p>
        </CardContent>
      </Card>
    )
  }

  const handleAddFrame = () => {
    setEditingFrame({
      name: `frames_new_${config.frames.length + 1}`,
      flip_left: false,
      images: [],
    })
    setSelectedImages([])
    setEditingIndex(null)
    setIsEditing(true)
  }

  const handleEditFrame = (frame: Frame, index: number) => {
    setEditingFrame({ ...frame })
    setEditingIndex(index)
    setIsEditing(true)

    // Load selected images
    const loadImages = async () => {
      try {
        const images: StoredImage[] = []
        for (const id of frame.images) {
          const image = await storageService.getImage(id)
          if (image) {
            images.push(image)
          }
        }
        setSelectedImages(images)
      } catch (error) {
        console.error("Error loading frame images:", error)
      }
    }

    loadImages()
  }

  const handleDeleteFrame = (index: number) => {
    // Check if this frame is used by any expressions
    const usedByExpressions = config.expressions.filter((e) => e.frames === config.frames[index].name)

    if (usedByExpressions.length > 0) {
      toast({
        title: "Cannot delete frame",
        description: `This frame is used by ${usedByExpressions.length} expression(s). Remove those expressions first.`,
        variant: "destructive",
      })
      return
    }

    if (window.confirm("Are you sure you want to delete this frame?")) {
      // Delete from browser storage if it exists
      const frameToDelete = config.frames[index]
      const storedFrame = storedFrames.find((f) => f.name === frameToDelete.name)
      if (storedFrame) {
        storageService
          .deleteFrame(storedFrame.id)
          .then(() => {
            // Update stored frames list
            setStoredFrames(storedFrames.filter((f) => f.id !== storedFrame.id))
          })
          .catch((error) => {
            console.error("Error deleting stored frame:", error)
          })
      }

      // Delete from config
      deleteFrame(index)

      toast({
        title: "Frame deleted",
        description: "The frame has been removed from the configuration.",
      })
    }
  }

  const handleSaveFrame = async () => {
    if (!editingFrame) return

    // Update the frame with selected image IDs
    const updatedFrame: Frame = {
      ...editingFrame,
      images: selectedImages.map((img) => img.id),
    }

    // Save to browser storage
    try {
      // Check if this frame already exists in storage
      let existingFrame = storedFrames.find((f) => f.name === updatedFrame.name)

      if (existingFrame) {
        // Update existing frame
        existingFrame = {
          ...existingFrame,
          flip_left: updatedFrame.flip_left,
          images: updatedFrame.images,
          lastModified: Date.now(),
        }
        await storageService.updateFrame(existingFrame)
      } else {
        // Create new frame
        const newStoredFrame: StoredFrame = {
          id: generateId(),
          name: updatedFrame.name,
          flip_left: updatedFrame.flip_left,
          images: updatedFrame.images,
          dateCreated: Date.now(),
          lastModified: Date.now(),
        }
        await storageService.saveFrame(newStoredFrame)

        // Update stored frames list
        setStoredFrames([...storedFrames, newStoredFrame])
      }
    } catch (error) {
      console.error("Error saving frame to storage:", error)
      toast({
        title: "Error saving frame",
        description: "There was a problem saving the frame to browser storage.",
        variant: "destructive",
      })
    }

    // Save to config
    if (editingIndex !== null) {
      updateFrame(editingIndex, updatedFrame)
      toast({
        title: "Frame updated",
        description: `${updatedFrame.name} has been updated.`,
      })
    } else {
      addFrame(updatedFrame)
      toast({
        title: "Frame added",
        description: `${updatedFrame.name} has been added to the configuration.`,
      })
    }

    setIsEditing(false)
    setEditingFrame(null)
    setEditingIndex(null)
    setSelectedImages([])
  }

  const handleSelectImage = (image: StoredImage) => {
    // Check if the image is already in the multi-select list
    const isAlreadySelected = multiSelectedImages.some((img) => img.id === image.id)

    if (isAlreadySelected) {
      // If already selected, remove it (unselect)
      setMultiSelectedImages(multiSelectedImages.filter((img) => img.id !== image.id))
    } else {
      // If not selected, add it
      setMultiSelectedImages([...multiSelectedImages, image])
    }
  }

  const handleAddSelectedImages = () => {
    if (multiSelectedImages.length > 0) {
      setSelectedImages([...selectedImages, ...multiSelectedImages])
      setMultiSelectedImages([])
      setShowImageSelector(false)
    }
  }

  const handleImagesUploaded = (uploadedImages: StoredImage[]) => {
    if (uploadedImages.length > 0) {
      // Add the newly uploaded images to the multi-selected images
      setMultiSelectedImages([...multiSelectedImages, ...uploadedImages])
    }
  }

  const handleRemoveImage = (index: number) => {
    const newImages = [...selectedImages]
    newImages.splice(index, 1)
    setSelectedImages(newImages)
  }

  // Add a new function to handle image duplication after the handleRemoveImage function
  const handleDuplicateImage = (index: number) => {
    const imageToDuplicate = selectedImages[index]
    const newImages = [...selectedImages]
    // Insert the duplicate right after the original
    newImages.splice(index + 1, 0, imageToDuplicate)
    setSelectedImages(newImages)

    toast({
      title: "Image duplicated",
      description: "The image has been duplicated in the sequence.",
    })
  }

  const handleRemoveMultiSelectedImage = (index: number) => {
    const newImages = [...multiSelectedImages]
    newImages.splice(index, 1)
    setMultiSelectedImages(newImages)
  }

  // Enhanced drag and drop handlers for the image list
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedImageIndex(index)

    // Store the dragged element reference
    if (e.currentTarget instanceof HTMLDivElement) {
      dragItemRef.current = e.currentTarget

      // Add a class for styling during drag
      e.currentTarget.classList.add("dragging")

      // Create a custom drag image
      const dragImage = e.currentTarget.cloneNode(true) as HTMLDivElement
      dragImage.style.width = `${e.currentTarget.offsetWidth}px`
      dragImage.style.height = `${e.currentTarget.offsetHeight}px`
      dragImage.style.opacity = "0.7"
      dragImage.style.position = "absolute"
      dragImage.style.top = "-1000px"
      dragImage.style.backgroundColor = "white"
      dragImage.style.boxShadow = "0 5px 15px rgba(0,0,0,0.2)"
      dragImage.style.borderRadius = "8px"
      dragImage.style.zIndex = "9999"
      document.body.appendChild(dragImage)

      // Set the drag image
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move"
        e.dataTransfer.setDragImage(dragImage, 20, 20)

        // Clean up the drag image after a short delay
        setTimeout(() => {
          document.body.removeChild(dragImage)
        }, 100)
      }
    }
  }

  // Update the handleDragEnter to show a drop indicator
  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault()

    // Store the element being dragged over
    if (e.currentTarget instanceof HTMLDivElement) {
      dragOverItemRef.current = e.currentTarget

      // Add a visual indicator for the drop position
      const allItems = e.currentTarget.parentElement?.children
      if (allItems) {
        for (let i = 0; i < allItems.length; i++) {
          const item = allItems[i] as HTMLElement
          item.style.borderTop = ""
          item.style.borderBottom = ""
        }
      }

      // Determine if we should show the indicator at the top or bottom
      const rect = e.currentTarget.getBoundingClientRect()
      const mouseY = e.clientY
      const threshold = rect.top + rect.height / 2

      if (mouseY < threshold) {
        e.currentTarget.style.borderTop = "2px solid hsl(var(--primary))"
      } else {
        e.currentTarget.style.borderBottom = "2px solid hsl(var(--primary))"
      }
    }

    setDragOverImageIndex(index)
  }

  // Update handleDragEnd to clean up indicators
  const handleDragEnd = (e: React.DragEvent) => {
    // Remove styling classes
    if (dragItemRef.current) {
      dragItemRef.current.classList.remove("dragging")
    }

    // Clean up all drop indicators
    const allItems = document.querySelectorAll(".frame-item")
    allItems.forEach((item) => {
      ;(item as HTMLElement).style.borderTop = ""
      ;(item as HTMLElement).style.borderBottom = ""
    })

    setDraggedImageIndex(null)
    setDragOverImageIndex(null)

    // Clear references
    dragItemRef.current = null
    dragOverItemRef.current = null
  }

  // Update handleDrop to use the indicator position
  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault()

    if (draggedImageIndex === null) return

    // Determine if we should insert before or after the drop target
    const rect = e.currentTarget.getBoundingClientRect()
    const mouseY = e.clientY
    const threshold = rect.top + rect.height / 2

    // Create a new array from the current images
    const newImages = [...selectedImages]

    // Remove the dragged item
    const draggedItem = newImages[draggedImageIndex]
    newImages.splice(draggedImageIndex, 1)

    // Calculate the actual insert position
    let insertPosition = dropIndex
    if (mouseY >= threshold) {
      // Insert after
      insertPosition = dropIndex + 1
    }
    // Adjust for the removed item
    if (draggedImageIndex < insertPosition) {
      insertPosition--
    }

    // Insert at the new position
    newImages.splice(insertPosition, 0, draggedItem)

    // Update state
    setSelectedImages(newImages)
    setDraggedImageIndex(null)
    setDragOverImageIndex(null)

    // Clean up all drop indicators
    const allItems = document.querySelectorAll(".frame-item")
    allItems.forEach((item) => {
      ;(item as HTMLElement).style.borderTop = ""
      ;(item as HTMLElement).style.borderBottom = ""
    })
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Helper function to generate ID
  const generateId = (): string => {
    return Date.now().toString(36) + Math.random().toString(36).substring(2)
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Frames</h3>
        <Button size="sm" onClick={handleAddFrame}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      <ScrollArea className="flex-1 rounded-md border">
        {isLoading ? (
          <div className="flex justify-center items-center h-40">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            <p>Loading frames...</p>
          </div>
        ) : config.frames.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">No frames defined. Click "Add" to create one.</div>
        ) : (
          <div className="p-4 space-y-4">
            {config.frames.map((frame, index) => (
              <Card key={index}>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">{frame.name}</CardTitle>
                  <CardDescription>
                    {frame.images.length} image{frame.images.length !== 1 ? "s" : ""} • Flip left:{" "}
                    {frame.flip_left ? "Yes" : "No"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 pb-2">
                  <div className="flex justify-center py-2">
                    <FrameAnimationPreview
                      imageIds={frame.images}
                      flipLeft={frame.flip_left}
                      duration={250}
                      showBothSides={true}
                      scale={2}
                    />
                  </div>
                </CardContent>
                <CardFooter className="p-2 flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleEditFrame(frame, index)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteFrame(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? "Edit Frame" : "Add New Frame"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4 overflow-y-auto max-h-[calc(90vh-10rem)]">
            <div className="space-y-2">
              <Label htmlFor="frame-name">Frame Name</Label>
              <Input
                id="frame-name"
                value={editingFrame?.name || ""}
                onChange={(e) => setEditingFrame((prev) => (prev ? { ...prev, name: e.target.value } : null))}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="flip-left"
                checked={editingFrame?.flip_left || false}
                onCheckedChange={(checked) =>
                  setEditingFrame((prev) => (prev ? { ...prev, flip_left: checked === true } : null))
                }
              />
              <Label htmlFor="flip-left">Flip Left</Label>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <Label className="text-lg">Animation Preview</Label>
              </div>

              <div className="flex justify-center p-4 bg-accent/10 rounded-md">
                <FrameAnimationPreview
                  imageIds={selectedImages.map((img) => img.id)}
                  flipLeft={editingFrame?.flip_left || false}
                  duration={250}
                  showBothSides={true}
                  scale={3}
                />
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <Label className="text-lg">Frame Sequence</Label>
              </div>

              {selectedImages.length === 0 ? (
                <div className="text-center text-muted-foreground py-8 border rounded-md">
                  No images selected. Click "Add Images" to select images from your library.
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <div className="divide-y">
                    {selectedImages.map((image, index) => (
                      <div
                        key={index}
                        className={`frame-item flex items-center p-3 transition-all duration-200 ${
                          dragOverImageIndex === index ? "bg-accent/30" : ""
                        } ${draggedImageIndex === index ? "opacity-50 bg-accent/10" : ""}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        onDrop={(e) => handleDrop(e, index)}
                        style={{
                          transform: draggedImageIndex === index ? "scale(1.02)" : "scale(1)",
                          boxShadow: draggedImageIndex === index ? "0 5px 15px rgba(0,0,0,0.1)" : "none",
                        }}
                      >
                        <div className="flex items-center cursor-grab">
                          <GripVertical className="h-5 w-5 text-muted-foreground mr-2" />
                        </div>

                        <div className="flex items-center flex-1 min-w-0">
                          <div className="flex-shrink-0 w-8 text-center font-medium text-muted-foreground mr-3">
                            {index + 1}
                          </div>

                          <div className="h-16 w-32 bg-black rounded mr-3 flex items-center justify-center flex-shrink-0">
                            <img
                              src={image.data || "/placeholder.svg"}
                              alt={image.name}
                              style={{
                                width: "100%",
                                height: "100%",
                                objectFit: "contain",
                                imageRendering: "pixelated",
                              }}
                            />
                          </div>

                          <div className="flex-1 min-w-0">
                            <p className="truncate font-medium">{image.name}</p>
                            <p className="text-xs text-muted-foreground">
                              Frame {index + 1} of {selectedImages.length}
                            </p>
                          </div>
                        </div>

                        <div className="flex gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="ml-2 text-primary hover:text-primary"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDuplicateImage(index)
                            }}
                            title="Duplicate image"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              width="16"
                              height="16"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              className="h-4 w-4"
                            >
                              <rect x="8" y="8" width="12" height="12" rx="2" />
                              <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
                            </svg>
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive hover:text-destructive"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleRemoveImage(index)
                            }}
                            title="Remove image"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-center mt-4">
                <Button variant="outline" onClick={() => setShowImageSelector(true)}>
                  <ImageIcon className="h-4 w-4 mr-2" />
                  Add Images
                </Button>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                setEditingFrame(null)
                setEditingIndex(null)
                setSelectedImages([])
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveFrame} disabled={selectedImages.length === 0}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={showImageSelector}
        onOpenChange={(open) => {
          if (!open) {
            setMultiSelectedImages([])
          }
          setShowImageSelector(open)
        }}
      >
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Select Images</DialogTitle>
          </DialogHeader>

          <div className="py-4 h-[500px]">
            <FileExplorer
              onSelectImage={handleSelectImage}
              selectable={true}
              multiSelect={true}
              selectedImages={multiSelectedImages}
              onImagesUploaded={handleImagesUploaded}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setMultiSelectedImages([])
                setShowImageSelector(false)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleAddSelectedImages} disabled={multiSelectedImages.length === 0}>
              Add {multiSelectedImages.length} Image{multiSelectedImages.length !== 1 ? "s" : ""}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
