"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Loader2, AlertTriangle } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Breadcrumb } from "./breadcrumb"
import { Toolbar } from "./toolbar"
import { FolderItem } from "./folder-item"
import { ImageItem } from "./image-item"
import { ImagePreview } from "./image-preview"
import { storageService, generateId, type StoredImage, type ImageFolder } from "@/lib/storage-service"
import { toast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"

interface FileExplorerProps {
  onSelectImage?: (image: StoredImage) => void
  selectable?: boolean
  multiSelect?: boolean
  selectedImages?: StoredImage[]
  onImagesUploaded?: (images: StoredImage[]) => void
}

export function FileExplorer({
  onSelectImage,
  selectable = false,
  multiSelect = false,
  selectedImages = [],
  onImagesUploaded,
}: FileExplorerProps) {
  const [currentFolderId, setCurrentFolderId] = useState<string | null>("root")
  const [currentPath, setCurrentPath] = useState<ImageFolder[]>([])
  const [folders, setFolders] = useState<ImageFolder[]>([])
  const [images, setImages] = useState<StoredImage[]>([])
  const [allFolders, setAllFolders] = useState<ImageFolder[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [view, setView] = useState<"grid" | "list">("grid")
  const [sortBy, setSortBy] = useState<"name" | "date" | "type">("name")
  const [searchQuery, setSearchQuery] = useState("")
  const [previewImage, setPreviewImage] = useState<StoredImage | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)

  // Add these state variables at the beginning of the component
  const [selectedImageIds, setSelectedImageIds] = useState<string[]>([])
  const [isDraggingImages, setIsDraggingImages] = useState(false)
  const [draggedOverFolderId, setDraggedOverFolderId] = useState<string | null>(null)

  useEffect(() => {
    console.log("Selected image IDs:", selectedImageIds)
  }, [selectedImageIds])

  // Load data
  const loadData = async () => {
    try {
      setIsLoading(true)
      setError(null)

      // Check database access
      const hasAccess = await storageService.checkDatabaseAccess()
      if (!hasAccess) {
        setError("Cannot access browser storage. Your images may not persist after page refresh.")
        setIsLoading(false)
        return
      }

      // Load all folders for reference
      const allFoldersData = await storageService.getAllFolders()
      setAllFolders(allFoldersData)

      // Load current folder's contents
      if (currentFolderId) {
        const folderData = await storageService.getChildFolders(currentFolderId)
        const imageData = await storageService.getImagesByFolder(currentFolderId)

        setFolders(folderData)
        setImages(imageData)

        // Update breadcrumb path
        updateBreadcrumbPath(currentFolderId, allFoldersData)
      } else {
        // Root level - show all
        const folderData = await storageService.getChildFolders(null)
        const imageData = await storageService.getImagesByFolder("root")

        setFolders(folderData)
        setImages(imageData)
        setCurrentPath([])
      }
    } catch (error) {
      console.error("Error loading data:", error)
      setError("Failed to load content. Please try refreshing.")
      toast({
        title: "Error loading content",
        description: "There was a problem loading your files and folders.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  // Update breadcrumb path
  const updateBreadcrumbPath = (folderId: string | null, allFolders: ImageFolder[]) => {
    if (!folderId || folderId === "root") {
      setCurrentPath([])
      return
    }

    const path: ImageFolder[] = []
    let currentId = folderId

    // Build path from current folder up to root
    while (currentId && currentId !== "root") {
      const folder = allFolders.find((f) => f.id === currentId)
      if (folder) {
        path.unshift(folder)
        currentId = folder.parentId || "root"
      } else {
        break
      }
    }

    setCurrentPath(path)
  }

  // Initial load
  useEffect(() => {
    loadData()
  }, [currentFolderId])

  // Handle folder navigation
  const handleNavigate = (folderId: string | null) => {
    setCurrentFolderId(folderId)
    // Close preview when navigating
    setPreviewImage(null)
  }

  // Create new folder
  const handleCreateFolder = async (name: string) => {
    try {
      const newFolderId = await storageService.createFolder({
        name,
        parentId: currentFolderId,
      })

      toast({
        title: "Folder created",
        description: `Folder "${name}" has been created.`,
      })

      loadData()
    } catch (error) {
      console.error("Error creating folder:", error)
      toast({
        title: "Error creating folder",
        description: "There was a problem creating the folder.",
        variant: "destructive",
      })
    }
  }

  // Rename folder
  const handleRenameFolder = async (folderId: string, newName: string) => {
    try {
      const folder = allFolders.find((f) => f.id === folderId)
      if (!folder) return

      folder.name = newName
      await storageService.updateFolder(folder)

      toast({
        title: "Folder renamed",
        description: `Folder has been renamed to "${newName}".`,
      })

      loadData()
    } catch (error) {
      console.error("Error renaming folder:", error)
      toast({
        title: "Error renaming folder",
        description: "There was a problem renaming the folder.",
        variant: "destructive",
      })
    }
  }

  // Delete folder
  const handleDeleteFolder = async (folderId: string) => {
    try {
      await storageService.deleteFolder(folderId)

      toast({
        title: "Folder deleted",
        description: "Folder has been deleted.",
      })

      loadData()
    } catch (error) {
      console.error("Error deleting folder:", error)
      toast({
        title: "Error deleting folder",
        description: "There was a problem deleting the folder.",
        variant: "destructive",
      })
    }
  }

  // Rename image
  const handleRenameImage = async (imageId: string, newName: string) => {
    try {
      await storageService.updateImageName(imageId, newName)

      toast({
        title: "Image renamed",
        description: `Image has been renamed to "${newName}".`,
      })

      // Update preview if the renamed image is currently being previewed
      if (previewImage && previewImage.id === imageId) {
        const updatedImage = await storageService.getImage(imageId)
        if (updatedImage) {
          setPreviewImage(updatedImage)
        }
      }

      loadData()
    } catch (error) {
      console.error("Error renaming image:", error)
      toast({
        title: "Error renaming image",
        description: "There was a problem renaming the image.",
        variant: "destructive",
      })
    }
  }

  // Move image
  const handleMoveImage = async (imageId: string, folderId: string) => {
    try {
      await storageService.moveImage(imageId, folderId)

      toast({
        title: "Image moved",
        description: "Image has been moved to the selected folder.",
      })

      // Close preview if the moved image was being previewed
      if (previewImage && previewImage.id === imageId) {
        setPreviewImage(null)
      }

      loadData()
    } catch (error) {
      console.error("Error moving image:", error)
      toast({
        title: "Error moving image",
        description: "There was a problem moving the image.",
        variant: "destructive",
      })
    }
  }

  // Delete image
  const handleDeleteImage = async (imageId: string) => {
    try {
      await storageService.deleteImage(imageId)

      toast({
        title: "Image deleted",
        description: "Image has been deleted.",
      })

      // Close preview if the deleted image was being previewed
      if (previewImage && previewImage.id === imageId) {
        setPreviewImage(null)
      }

      loadData()
    } catch (error) {
      console.error("Error deleting image:", error)
      toast({
        title: "Error deleting image",
        description: "There was a problem deleting the image.",
        variant: "destructive",
      })
    }
  }

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query)
  }

  // Handle image preview
  const handlePreviewImage = (image: StoredImage) => {
    setPreviewImage(image)
  }

  // Handle image selection (for external use)
  const handleSelectImage = (image: StoredImage) => {
    if (onSelectImage) {
      onSelectImage(image)
    }
  }

  // Handle file upload
  const handleUploadFiles = async (files: FileList) => {
    try {
      setIsUploading(true)
      setUploadProgress(0)

      // Check if browser storage is available
      const hasAccess = await storageService.checkDatabaseAccess()
      if (!hasAccess) {
        toast({
          title: "Storage not available",
          description: "Cannot access browser storage. Your images may not persist after page refresh.",
          variant: "destructive",
        })
        setIsUploading(false)
        return
      }

      const totalFiles = files.length
      let uploadedFiles = 0

      const uploadedImages: StoredImage[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]

        // Read file as data URL
        const reader = new FileReader()

        await new Promise<void>((resolve, reject) => {
          reader.onload = async (e) => {
            try {
              const dataUrl = e.target?.result as string

              // Create image object with ALL required fields
              const image: StoredImage = {
                id: generateId(), // Use the imported generateId function
                name: file.name,
                data: dataUrl,
                type: file.type, // Include the MIME type
                dateAdded: Date.now(),
                folderId: currentFolderId || "root",
                lastModified: Date.now(), // Include lastModified timestamp
              }

              // Save to storage
              await storageService.saveImage(image)

              // Add to the uploaded images array
              uploadedImages.push(image)

              // Update progress
              uploadedFiles++
              setUploadProgress(Math.round((uploadedFiles / totalFiles) * 100))

              resolve()
            } catch (error) {
              reject(error)
            }
          }

          reader.onerror = () => {
            reject(new Error("Error reading file"))
          }

          reader.readAsDataURL(file)
        })
      }

      // Notify parent component about all uploaded images
      if (uploadedImages.length > 0 && onImagesUploaded) {
        onImagesUploaded(uploadedImages)
      }

      toast({
        title: "Upload complete",
        description: `Successfully uploaded ${totalFiles} image${totalFiles !== 1 ? "s" : ""}.`,
      })

      // Reload data to show new images
      loadData()
    } catch (error) {
      console.error("Error uploading files:", error)
      toast({
        title: "Upload failed",
        description: "There was a problem uploading your images.",
        variant: "destructive",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  // Add this function to handle image selection
  const handleImageSelect = (image: StoredImage, isMultiSelect: boolean) => {
    if (multiSelect && isMultiSelect) {
      // Toggle selection
      if (selectedImageIds.includes(image.id)) {
        setSelectedImageIds(selectedImageIds.filter((id) => id !== image.id))
      } else {
        setSelectedImageIds([...selectedImageIds, image.id])
      }
    } else {
      // Single select - replace the current selection
      setSelectedImageIds([image.id])
    }

    // If this is a selectable explorer (for frame editor), also call the onSelectImage
    if (selectable && onSelectImage) {
      onSelectImage(image)
    } else if (!selectable) {
      // For regular explorer, show preview
      setPreviewImage(image)
    }
  }

  // Add this function to handle bulk delete
  const handleBulkDelete = async () => {
    if (selectedImageIds.length === 0) return

    if (window.confirm(`Are you sure you want to delete ${selectedImageIds.length} selected image(s)?`)) {
      try {
        for (const id of selectedImageIds) {
          await storageService.deleteImage(id)
        }

        toast({
          title: "Images deleted",
          description: `${selectedImageIds.length} image(s) have been deleted.`,
        })

        // Clear selection and reload
        setSelectedImageIds([])
        setPreviewImage(null)
        loadData()
      } catch (error) {
        console.error("Error deleting images:", error)
        toast({
          title: "Error deleting images",
          description: "There was a problem deleting the selected images.",
          variant: "destructive",
        })
      }
    }
  }

  // Add these functions for drag and drop to folders
  const handleDragStart = (e: React.DragEvent, imageIds: string[]) => {
    if (imageIds.length === 0) return

    e.dataTransfer.setData("imageIds", JSON.stringify(imageIds))
    setIsDraggingImages(true)
  }

  const handleDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault()
    setDraggedOverFolderId(folderId)
  }

  const handleDragLeave = () => {
    setDraggedOverFolderId(null)
  }

  const handleDrop = async (e: React.DragEvent, folderId: string) => {
    e.preventDefault()
    setDraggedOverFolderId(null)
    setIsDraggingImages(false)

    try {
      const imageIds = JSON.parse(e.dataTransfer.getData("imageIds")) as string[]
      if (imageIds.length === 0) return

      for (const id of imageIds) {
        await storageService.moveImage(id, folderId)
      }

      toast({
        title: "Images moved",
        description: `${imageIds.length} image(s) moved to folder.`,
      })

      // Clear selection and reload
      setSelectedImageIds([])
      setPreviewImage(null)
      loadData()
    } catch (error) {
      console.error("Error moving images:", error)
      toast({
        title: "Error moving images",
        description: "There was a problem moving the selected images.",
        variant: "destructive",
      })
    }
  }

  // Check if an image is already selected (for multi-select)
  const isImageSelected = (image: StoredImage) => {
    if (multiSelect && selectedImages && selectedImages.length > 0) {
      return selectedImages.some((img) => img.id === image.id) || selectedImageIds.includes(image.id)
    } else {
      return selectedImageIds.includes(image.id)
    }
  }

  // Sort and filter content
  const sortedFolders = [...folders].sort((a, b) => {
    if (sortBy === "name") return a.name.localeCompare(b.name)
    if (sortBy === "date") return b.dateCreated - a.dateCreated
    return a.name.localeCompare(b.name) // Default to name for "type" since folders are all the same type
  })

  const filteredFolders = searchQuery
    ? sortedFolders.filter((folder) => folder.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : sortedFolders

  // Update the sortedImages function to always sort by name first
  const sortedImages = [...images].sort((a, b) => {
    // Always sort by name first, then apply other sorting if requested
    if (sortBy === "name") return a.name.localeCompare(b.name)
    if (sortBy === "date") return b.dateAdded - a.dateAdded
    if (sortBy === "type") {
      const extA = a.name.split(".").pop()?.toLowerCase() || ""
      const extB = b.name.split(".").pop()?.toLowerCase() || ""
      return extA.localeCompare(extB)
    }
    // Default to name sorting
    return a.name.localeCompare(b.name)
  })

  const filteredImages = searchQuery
    ? sortedImages.filter((image) => image.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : sortedImages

  return (
    <div className="flex flex-col h-full">
      <Breadcrumb currentPath={currentPath} onNavigate={handleNavigate} />

      <Toolbar
        onCreateFolder={handleCreateFolder}
        onRefresh={loadData}
        onUploadFiles={handleUploadFiles}
        onViewChange={setView}
        onSortChange={setSortBy}
        onSearch={handleSearch}
        view={view}
        sortBy={sortBy}
      />

      {isUploading && (
        <div className="bg-primary/10 p-3 rounded-md mb-4">
          <div className="flex justify-between items-center mb-2">
            <span className="font-medium">Uploading images...</span>
            <span className="text-sm">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
            <div
              className="bg-primary h-full transition-all duration-300 ease-in-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}

      {selectedImageIds.length > 0 && (
        <div className="bg-accent/20 p-2 rounded-md mb-4 flex items-center justify-between">
          <div>
            <span className="font-medium">
              {selectedImageIds.length} image{selectedImageIds.length !== 1 ? "s" : ""} selected
            </span>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (selectedImageIds.length > 0) {
                  handleDragStart({ dataTransfer: new DataTransfer() } as React.DragEvent, selectedImageIds)
                }
              }}
              disabled={isDraggingImages}
            >
              Move to folder
            </Button>
            <Button variant="destructive" size="sm" onClick={handleBulkDelete}>
              Delete
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedImageIds([])}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="flex-1 flex flex-col md:flex-row gap-4 overflow-hidden">
        <div className={`${previewImage ? "md:w-1/2" : "w-full"} overflow-hidden flex flex-col`}>
          {isLoading ? (
            <div className="flex flex-col justify-center items-center h-64 space-y-4">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading content...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col justify-center items-center h-64 space-y-4 text-center">
              <AlertTriangle className="h-8 w-8 text-amber-500" />
              <p className="text-muted-foreground">{error}</p>
              <button className="text-sm text-primary hover:underline" onClick={loadData}>
                Try Again
              </button>
            </div>
          ) : (
            <ScrollArea className="flex-1">
              {view === "grid" ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-2">
                  {filteredFolders.map((folder) => (
                    <FolderItem
                      key={folder.id}
                      folder={folder}
                      onNavigate={handleNavigate}
                      onRename={handleRenameFolder}
                      onDelete={handleDeleteFolder}
                      view={view}
                      isDraggingOver={isDraggingImages && draggedOverFolderId === folder.id}
                      onDragOver={(e) => handleDragOver(e, folder.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, folder.id)}
                    />
                  ))}

                  {filteredImages.map((image) => (
                    <ImageItem
                      key={image.id}
                      image={image}
                      onSelect={handleImageSelect}
                      onRename={handleRenameImage}
                      onMove={handleMoveImage}
                      onDelete={handleDeleteImage}
                      folders={allFolders}
                      view={view}
                      selectable={selectable}
                      isSelected={isImageSelected(image)}
                      onDragStart={(e) => handleDragStart(e, [image.id])}
                    />
                  ))}

                  {filteredFolders.length === 0 && filteredImages.length === 0 && (
                    <div className="col-span-full flex justify-center items-center h-64 text-center">
                      <p className="text-muted-foreground">
                        {searchQuery ? "No results found" : "This folder is empty"}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredFolders.map((folder) => (
                    <FolderItem
                      key={folder.id}
                      folder={folder}
                      onNavigate={handleNavigate}
                      onRename={handleRenameFolder}
                      onDelete={handleDeleteFolder}
                      view={view}
                      isDraggingOver={isDraggingImages && draggedOverFolderId === folder.id}
                      onDragOver={(e) => handleDragOver(e, folder.id)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, folder.id)}
                    />
                  ))}

                  {filteredImages.map((image) => (
                    <ImageItem
                      key={image.id}
                      image={image}
                      onSelect={handleImageSelect}
                      onRename={handleRenameImage}
                      onMove={handleMoveImage}
                      onDelete={handleDeleteImage}
                      folders={allFolders}
                      view={view}
                      selectable={selectable}
                      isSelected={isImageSelected(image)}
                      onDragStart={(e) => handleDragStart(e, [image.id])}
                    />
                  ))}

                  {filteredFolders.length === 0 && filteredImages.length === 0 && (
                    <div className="flex justify-center items-center h-64 text-center">
                      <p className="text-muted-foreground">
                        {searchQuery ? "No results found" : "This folder is empty"}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </ScrollArea>
          )}
        </div>

        {previewImage && (
          <div className="md:w-1/2 flex-shrink-0 h-full">
            <ImagePreview image={previewImage} onClose={() => setPreviewImage(null)} />
          </div>
        )}
      </div>
    </div>
  )
}
