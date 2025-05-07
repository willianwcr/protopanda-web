"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { useConfig } from "./config-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FrameAnimationPreview } from "./frame-animation-preview"
import { storageService } from "@/lib/storage-service"
import type { Expression } from "@/lib/types"
import { toast } from "@/components/ui/use-toast"

export function ExpressionEditor() {
  const {
    config,
    isEditing,
    setIsEditing,
    editingExpression,
    setEditingExpression,
    updateExpression,
    addExpression,
    activeExpressionIndex,
  } = useConfig()

  const [localExpression, setLocalExpression] = useState<Expression | null>(null)
  const [animationType, setAnimationType] = useState<"auto" | "custom">("auto")
  const [customFrames, setCustomFrames] = useState<number[]>([])
  const [previewDuration, setPreviewDuration] = useState(250)
  const [previewImages, setPreviewImages] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState("basic")

  // Add these state variables and refs
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)
  const [isFromSource, setIsFromSource] = useState(false)
  const [dropIndicatorPosition, setDropIndicatorPosition] = useState(0)
  const frameRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (editingExpression) {
      setLocalExpression(JSON.parse(JSON.stringify(editingExpression)))
      setAnimationType(Array.isArray(editingExpression.animation) ? "custom" : "auto")
      setPreviewDuration(editingExpression.duration || 250)

      if (Array.isArray(editingExpression.animation)) {
        setCustomFrames([...editingExpression.animation])
      } else {
        // Generate auto sequence for preview
        const framesDef = config?.frames.find((f) => f.name === editingExpression.frames)
        if (framesDef && framesDef.images.length > 0) {
          const autoFrames = []
          for (let i = 0; i < framesDef.images.length; i++) {
            autoFrames.push(i)
          }
          setCustomFrames(autoFrames)
        } else {
          setCustomFrames([])
        }
      }

      // Load preview images
      loadPreviewImages(editingExpression.frames)
    }
  }, [editingExpression, config])

  // Load preview images for the selected frame
  const loadPreviewImages = async (frameName: string) => {
    if (!config) return

    const framesDef = config.frames.find((f) => f.name === frameName)
    if (!framesDef || framesDef.images.length === 0) {
      setPreviewImages([])
      return
    }

    try {
      const images = []
      for (const imageId of framesDef.images) {
        const image = await storageService.getImage(imageId)
        if (image) {
          images.push(image.data)
        }
      }
      setPreviewImages(images)
    } catch (error) {
      console.error("Error loading preview images:", error)
      setPreviewImages([])
    }
  }

  const handleClose = () => {
    setIsEditing(false)
    setEditingExpression(null)
    setLocalExpression(null)
    setCustomFrames([])
    setPreviewImages([])
    setActiveTab("basic")
  }

  const handleSave = () => {
    if (!localExpression || !config) return

    // Prepare the expression to save
    const expressionToSave: Expression = {
      ...localExpression,
      animation: animationType === "auto" ? "auto" : customFrames.map((index) => index + 1), // Convert to 1-based indices for storage
    }

    // Check if this is a new expression or editing an existing one
    const existingIndex = config.expressions.findIndex(
      (e) => e.name === editingExpression?.name && e.frames === editingExpression?.frames,
    )

    if (existingIndex >= 0) {
      updateExpression(existingIndex, expressionToSave)
      toast({
        title: "Expression updated",
        description: `${expressionToSave.name} has been updated.`,
      })
    } else {
      addExpression(expressionToSave)
      toast({
        title: "Expression added",
        description: `${expressionToSave.name} has been added to the configuration.`,
      })
    }

    handleClose()
  }

  // Update the drag and drop handlers
  const handleDragStart = (e: React.DragEvent, index: number, fromSource = false) => {
    setDraggedIndex(index)
    setIsFromSource(fromSource)

    // Set drag image
    if (e.dataTransfer && e.currentTarget) {
      e.dataTransfer.effectAllowed = "move"

      // Create a custom drag image
      const dragImage = e.currentTarget.cloneNode(true) as HTMLDivElement
      dragImage.style.width = `${e.currentTarget.offsetWidth}px`
      dragImage.style.height = `${e.currentTarget.offsetHeight}px`
      dragImage.style.opacity = "0.8"
      dragImage.style.position = "absolute"
      dragImage.style.top = "-1000px"
      dragImage.style.backgroundColor = "white"
      dragImage.style.boxShadow = "0 5px 15px rgba(0,0,0,0.2)"
      dragImage.style.borderRadius = "8px"
      dragImage.style.zIndex = "9999"
      document.body.appendChild(dragImage)

      e.dataTransfer.setDragImage(dragImage, 20, 20)

      // Clean up the drag image after a short delay
      setTimeout(() => {
        document.body.removeChild(dragImage)
      }, 100)
    }
  }

  const handleDragEnter = (e: React.DragEvent, index: number) => {
    e.preventDefault()

    if (draggedIndex === null) return

    // Don't allow dropping on itself
    if (draggedIndex === index && !isFromSource) return

    setDragOverIndex(index)

    // Calculate drop indicator position
    const currentElement = frameRefs.current[index]
    if (currentElement) {
      const rect = currentElement.getBoundingClientRect()
      const mouseX = e.clientX

      // Use a simpler approach - just check if we're in the left half or right half
      if (mouseX < rect.left + rect.width / 2) {
        // Before the element
        setDropIndicatorPosition(currentElement.offsetLeft)
      } else {
        // After the element
        setDropIndicatorPosition(currentElement.offsetLeft + rect.width)
      }
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()

    // If we're already over a specific item, don't do anything
    if (dragOverIndex !== null) return

    // If dragging over the container and not a specific item
    if (e.currentTarget.classList.contains("overflow-x-auto")) {
      const containerRect = e.currentTarget.getBoundingClientRect()
      const containerScrollLeft = e.currentTarget.scrollLeft
      const mouseX = e.clientX - containerRect.left + containerScrollLeft

      // If near the end of the container
      if (customFrames.length > 0) {
        if (mouseX < 50) {
          // Near the beginning
          setDropIndicatorPosition(0)
          setDragOverIndex(0)
        } else if (mouseX > containerRect.width - 50) {
          // Near the end
          setDropIndicatorPosition(e.currentTarget.scrollWidth)
          setDragOverIndex(customFrames.length)
        }
      }
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDragOverIndex(null)
    setIsFromSource(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()

    if (draggedIndex === null) return

    // Create a new array from the current frames
    const newFrames = [...customFrames]

    if (isFromSource) {
      // Adding from source (available frames)
      const frameToAdd = draggedIndex

      if (dragOverIndex !== null) {
        // Determine if we're dropping before or after the target
        const rect = frameRefs.current[dragOverIndex]?.getBoundingClientRect()
        const mouseX = e.clientX

        if (rect && mouseX < rect.left + rect.width / 2) {
          // Insert before
          newFrames.splice(dragOverIndex, 0, frameToAdd)
        } else {
          // Insert after
          newFrames.splice(dragOverIndex + 1, 0, frameToAdd)
        }
      } else {
        // Add to the end
        newFrames.push(frameToAdd)
      }
    } else {
      // Moving within the timeline
      const frameToMove = newFrames[draggedIndex]
      newFrames.splice(draggedIndex, 1)

      if (dragOverIndex !== null) {
        // Adjust index if needed
        let insertAt = dragOverIndex
        if (draggedIndex < dragOverIndex) {
          insertAt--
        }
        insertAt = Math.max(0, Math.min(newFrames.length, insertAt))

        // Insert at the new position
        newFrames.splice(insertAt, 0, frameToMove)
      }
    }

    setCustomFrames(newFrames)
    setDraggedIndex(null)
    setDragOverIndex(null)
    setIsFromSource(false)
  }

  // Add a function to handle adding frames via button click
  const handleAddFrame = (frameIndex: number) => {
    setCustomFrames([...customFrames, frameIndex])
  }

  const handleRemoveFrame = (index: number) => {
    const newFrames = [...customFrames]
    newFrames.splice(index, 1)
    setCustomFrames(newFrames)
  }

  const handleDurationChange = (value: string) => {
    const duration = Number.parseInt(value) || 250
    setPreviewDuration(duration)
    setLocalExpression((prev) => (prev ? { ...prev, duration } : null))
  }

  const handleFrameTypeChange = (value: string) => {
    if (!localExpression) return

    setLocalExpression((prev) => (prev ? { ...prev, frames: value } : null))
    loadPreviewImages(value)

    // Reset custom frames when changing frame type
    const newFramesDef = config?.frames.find((f) => f.name === value)
    if (newFramesDef && newFramesDef.images.length > 0) {
      const autoFrames = Array.from({ length: newFramesDef.images.length }, (_, i) => i)
      setCustomFrames(autoFrames)
    } else {
      setCustomFrames([])
    }
  }

  if (!config || !localExpression) return null

  // Get the frame definition for the current expression
  const framesDef = config.frames.find((f) => f.name === localExpression.frames)
  if (!framesDef) return null

  // Create an array of available frame indices
  const availableFrames = Array.from({ length: framesDef.images.length }, (_, i) => i)

  // Get all expressions for the intro/outro selectors
  const allExpressions = config.expressions.map((e) => e.name)

  return (
    <Dialog open={isEditing} onOpenChange={setIsEditing}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>
            {editingExpression && config.expressions.some((e) => e.name === editingExpression.name)
              ? "Edit Expression"
              : "Add New Expression"}
          </DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-1">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-grow">
            <TabsList className="mb-4">
              <TabsTrigger value="basic">Basic Settings</TabsTrigger>
              <TabsTrigger value="advanced">Advanced Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-0">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Expression Name</Label>
                    <Input
                      id="name"
                      value={localExpression.name || ""}
                      onChange={(e) => setLocalExpression({ ...localExpression, name: e.target.value })}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="frames">Frames Type</Label>
                    <Select value={localExpression.frames} onValueChange={handleFrameTypeChange}>
                      <SelectTrigger id="frames">
                        <SelectValue placeholder="Select frames type" />
                      </SelectTrigger>
                      <SelectContent>
                        {config.frames.map((frame, index) => (
                          <SelectItem key={index} value={frame.name}>
                            {frame.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="animation-type">Animation Type</Label>
                    <Select value={animationType} onValueChange={(value: "auto" | "custom") => setAnimationType(value)}>
                      <SelectTrigger id="animation-type">
                        <SelectValue placeholder="Select animation type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="auto">Auto (all frames)</SelectItem>
                        <SelectItem value="custom">Custom sequence</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="duration">Duration (ms)</Label>
                    <Input
                      id="duration"
                      type="number"
                      min={50}
                      step={50}
                      value={localExpression.duration || 250}
                      onChange={(e) => handleDurationChange(e.target.value)}
                    />
                  </div>

                  <div className="flex items-center space-x-2 pt-2">
                    <Checkbox
                      id="transition"
                      checked={localExpression.transition || false}
                      onCheckedChange={(checked) =>
                        setLocalExpression({
                          ...localExpression,
                          transition: checked === true,
                        })
                      }
                    />
                    <Label htmlFor="transition">Is Transition</Label>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Animation Preview</Label>
                    <div className="p-4 bg-accent/10 rounded-md flex justify-center">
                      {customFrames.length > 0 && framesDef.images.length > 0 ? (
                        <FrameAnimationPreview
                          imageIds={customFrames.map((index) => framesDef.images[index])}
                          flipLeft={framesDef.flip_left}
                          duration={previewDuration}
                          showBothSides={true}
                          scale={2.5}
                        />
                      ) : (
                        <div className="h-24 flex items-center justify-center text-muted-foreground">
                          No images available for preview
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="advanced" className="mt-0">
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="onEnter">On Enter (Script)</Label>
                    <Input
                      id="onEnter"
                      value={localExpression.onEnter || ""}
                      onChange={(e) => setLocalExpression({ ...localExpression, onEnter: e.target.value })}
                      placeholder="Script to run when entering this expression"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="onLeave">On Leave (Script)</Label>
                    <Input
                      id="onLeave"
                      value={localExpression.onLeave || ""}
                      onChange={(e) => setLocalExpression({ ...localExpression, onLeave: e.target.value })}
                      placeholder="Script to run when leaving this expression"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="intro">Intro Expression</Label>
                    <Select
                      value={localExpression.intro || ""}
                      onValueChange={(value) => {
                        setLocalExpression((prev) => (prev ? { ...prev, intro: value } : null))
                      }}
                    >
                      <SelectTrigger id="intro">
                        <SelectValue placeholder="Select intro expression" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {allExpressions
                          .filter((name) => name !== localExpression.name)
                          .map((name, index) => (
                            <SelectItem key={index} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="outro">Outro Expression</Label>
                    <Select
                      value={localExpression.outro || ""}
                      onValueChange={(value) => {
                        setLocalExpression((prev) => (prev ? { ...prev, outro: value } : null))
                      }}
                    >
                      <SelectTrigger id="outro">
                        <SelectValue placeholder="Select outro expression" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">None</SelectItem>
                        {allExpressions
                          .filter((name) => name !== localExpression.name)
                          .map((name, index) => (
                            <SelectItem key={index} value={name}>
                              {name}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="hidden"
                    checked={localExpression.hidden || false}
                    onCheckedChange={(checked) =>
                      setLocalExpression({
                        ...localExpression,
                        hidden: checked === true,
                      })
                    }
                  />
                  <Label htmlFor="hidden">Hidden (not visible in UI)</Label>
                </div>
              </div>
            </TabsContent>
          </Tabs>

          {/* Timeline section - full width at the bottom */}
          <div className="space-y-4 mt-6 mb-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Label className="text-lg">Animation Timeline</Label>
                <div className="bg-primary/10 text-primary rounded-full px-2 py-0.5 text-xs font-medium">
                  {customFrames.length} frames
                </div>
              </div>
              <div className="text-sm text-muted-foreground">
                {animationType === "custom"
                  ? "Drag frames to reorder • Click + to add • Click × to remove"
                  : "Auto animation uses all frames in sequence (read-only)"}
              </div>
            </div>

            <div className="border rounded-md p-4">
              <div
                className="flex gap-2 overflow-x-auto pb-4 min-h-[120px] relative"
                onDragOver={animationType === "custom" ? handleDragOver : undefined}
                onDrop={animationType === "custom" ? (e) => handleDrop(e) : undefined}
              >
                {customFrames.length === 0 ? (
                  <div className="w-full text-center text-muted-foreground p-4 flex items-center justify-center">
                    {animationType === "custom"
                      ? "Drag frames from below to create a custom animation sequence"
                      : "No frames available for this animation"}
                  </div>
                ) : (
                  <>
                    {/* Drop indicator that shows during drag */}
                    {dragOverIndex !== null && animationType === "custom" && (
                      <div
                        className="absolute top-0 bottom-0 w-1 bg-primary transition-all duration-200"
                        style={{
                          left: dropIndicatorPosition,
                          height: "100%",
                        }}
                      />
                    )}

                    {customFrames.map((frameIndex, index) => (
                      <div
                        key={index}
                        className={`relative group ${draggedIndex === index ? "opacity-50" : ""} ${animationType === "auto" ? "cursor-default" : "cursor-grab"}`}
                        draggable={animationType === "custom"}
                        onDragStart={animationType === "custom" ? (e) => handleDragStart(e, index) : undefined}
                        onDragEnter={animationType === "custom" ? (e) => handleDragEnter(e, index) : undefined}
                        onDragOver={(e) => {
                          e.preventDefault()
                          if (animationType === "custom") handleDragOver(e)
                        }}
                        onDragEnd={animationType === "custom" ? handleDragEnd : undefined}
                        ref={(el) => (frameRefs.current[index] = el)}
                      >
                        <div
                          className={`border rounded p-2 bg-background ${animationType === "custom" ? "hover:border-primary active:cursor-grabbing" : "opacity-90"}`}
                        >
                          <div className="absolute top-1 right-1 z-10">
                            <div className="bg-muted text-muted-foreground text-xs px-1 rounded">{index + 1}</div>
                          </div>
                          {frameIndex < framesDef.images.length ? (
                            <div className="w-24 h-16 flex items-center justify-center bg-black">
                              <FrameAnimationPreview
                                imageIds={[framesDef.images[frameIndex]]}
                                flipLeft={false}
                                duration={0}
                                width={48}
                                height={24}
                                scale={2}
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-16 flex items-center justify-center bg-black text-white text-xs">
                              Invalid
                            </div>
                          )}
                          <div className="text-center text-xs mt-1">Frame {frameIndex + 1}</div>
                          {animationType === "custom" && (
                            <button
                              className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => handleRemoveFrame(index)}
                            >
                              ×
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </>
                )}
              </div>
            </div>

            {/* Separate available frames section with a clear divider */}
            {animationType === "custom" && (
              <div className="mt-6 pt-4 border-t">
                <Label className="mb-2 block text-lg">Available Frames</Label>
                <div className="border rounded-md p-4">
                  <div className="flex gap-2 overflow-x-auto pb-2">
                    {availableFrames.map((frameIndex) => (
                      <div
                        key={frameIndex}
                        draggable
                        onDragStart={(e) => handleDragStart(e, frameIndex, true)}
                        className="border rounded p-2 bg-background cursor-grab hover:border-primary"
                      >
                        <div className="w-20 h-12 flex items-center justify-center bg-black">
                          <FrameAnimationPreview
                            imageIds={[framesDef.images[frameIndex]]}
                            flipLeft={false}
                            duration={0}
                            width={40}
                            height={20}
                            scale={2}
                          />
                        </div>
                        <div className="text-center text-xs mt-1">Frame {frameIndex + 1}</div>
                        <button
                          className="w-full mt-1 text-xs text-primary hover:underline flex items-center justify-center"
                          onClick={() => handleAddFrame(frameIndex)}
                        >
                          <span className="mr-1">+</span> Add
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        <DialogFooter className="pt-2 border-t">
          <Button variant="outline" onClick={handleClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
