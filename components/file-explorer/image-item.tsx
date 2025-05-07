"use client"

import type React from "react"

import { useState } from "react"
import { MoreVertical, Edit, Trash2, FolderSymlink, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { StoredImage, ImageFolder } from "@/lib/storage-service"
import { formatFileSize, formatDate } from "@/lib/storage-service"

interface ImageItemProps {
  image: StoredImage
  onSelect?: (image: StoredImage, isMultiSelect: boolean) => void
  onRename: (imageId: string, newName: string) => void
  onMove: (imageId: string, folderId: string) => void
  onDelete: (imageId: string) => void
  folders: ImageFolder[]
  view: "grid" | "list"
  selectable?: boolean
  isSelected?: boolean
  onDragStart?: (e: React.DragEvent, imageId: string) => void
}

export function ImageItem({
  image,
  onSelect,
  onRename,
  onMove,
  onDelete,
  folders,
  view,
  selectable = false,
  isSelected = false,
  onDragStart,
}: ImageItemProps) {
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [isMoveOpen, setIsMoveOpen] = useState(false)
  const [newName, setNewName] = useState(image.name)
  const [selectedFolderId, setSelectedFolderId] = useState(image.folderId)

  const handleRename = () => {
    if (newName.trim() && newName !== image.name) {
      onRename(image.id, newName.trim())
    }
    setIsRenameOpen(false)
  }

  const handleMove = () => {
    if (selectedFolderId && selectedFolderId !== image.folderId) {
      onMove(image.id, selectedFolderId)
    }
    setIsMoveOpen(false)
  }

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete "${image.name}"?`)) {
      onDelete(image.id)
    }
  }

  const handleClick = (e: React.MouseEvent) => {
    if (onSelect) {
      // Check if Ctrl/Cmd key is pressed for multi-select
      const isMultiSelect = e.ctrlKey || e.metaKey
      onSelect(image, isMultiSelect)
    }
  }

  // Extract file extension
  const fileExt = image.name.split(".").pop()?.toLowerCase() || ""

  // Estimate file size from base64 data
  const fileSizeBytes = Math.round((image.data.length * 3) / 4)
  const fileSize = formatFileSize(fileSizeBytes)

  if (view === "grid") {
    return (
      <>
        <div
          className={`group relative border rounded-md overflow-hidden ${
            selectable ? "cursor-pointer hover:border-primary" : ""
          } ${isSelected ? "ring-2 ring-primary" : ""}`}
          draggable={true}
          onDragStart={(e) => onDragStart && onDragStart(e, image.id)}
          onClick={handleClick}
        >
          <div className="aspect-[2/1] bg-accent/20 flex items-center justify-center overflow-hidden">
            <div className="w-full h-full flex items-center justify-center">
              <img
                src={image.data || "/placeholder.svg"}
                alt={image.name}
                className="w-full h-full max-h-24"
                style={{
                  objectFit: "contain",
                  imageRendering: "pixelated",
                }}
              />
            </div>
          </div>
          <div className="p-2">
            <p className="text-sm font-medium truncate">{image.name}</p>
            <p className="text-xs text-muted-foreground">
              {fileExt.toUpperCase()} • {fileSize}
            </p>
          </div>

          {isSelected && (
            <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
              <Check className="h-3 w-3" />
            </div>
          )}

          <div className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="secondary" size="icon" className="h-7 w-7 bg-background/80 backdrop-blur-sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsRenameOpen(true)
                  }}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsMoveOpen(true)
                  }}
                >
                  <FolderSymlink className="h-4 w-4 mr-2" />
                  Move to folder
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="text-destructive focus:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDelete()
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Rename Image</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="image-name">Image Name</Label>
              <Input
                id="image-name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="mt-2"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsRenameOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleRename}>Save</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={isMoveOpen} onOpenChange={setIsMoveOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Move to Folder</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="folder-select">Select Folder</Label>
              <select
                id="folder-select"
                value={selectedFolderId}
                onChange={(e) => setSelectedFolderId(e.target.value)}
                className="w-full mt-2 p-2 border rounded-md"
              >
                <option value="root">Root</option>
                {folders
                  .filter((folder) => folder.id !== "root")
                  .map((folder) => (
                    <option key={folder.id} value={folder.id}>
                      {folder.name}
                    </option>
                  ))}
              </select>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMoveOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleMove}>Move</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </>
    )
  }

  // List view
  return (
    <>
      <div
        className={`group flex items-center p-2 hover:bg-accent rounded-md ${selectable ? "cursor-pointer" : ""} ${isSelected ? "bg-accent/50" : ""}`}
        draggable={true}
        onDragStart={(e) => onDragStart && onDragStart(e, image.id)}
        onClick={handleClick}
      >
        <div className="h-10 w-20 rounded bg-accent/20 mr-3 flex-shrink-0 overflow-hidden flex items-center justify-center">
          <img
            src={image.data || "/placeholder.svg"}
            alt={image.name}
            className="w-full h-full"
            style={{
              objectFit: "contain",
              imageRendering: "pixelated",
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{image.name}</p>
          <p className="text-xs text-muted-foreground">
            {fileExt.toUpperCase()} • {fileSize} • {formatDate(image.dateAdded)}
          </p>
        </div>

        {isSelected && (
          <div className="mr-2">
            <div className="bg-primary text-primary-foreground rounded-full p-1">
              <Check className="h-3 w-3" />
            </div>
          </div>
        )}

        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setIsRenameOpen(true)
                }}
              >
                <Edit className="h-4 w-4 mr-2" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation()
                  setIsMoveOpen(true)
                }}
              >
                <FolderSymlink className="h-4 w-4 mr-2" />
                Move to folder
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={(e) => {
                  e.stopPropagation()
                  handleDelete()
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <Dialog open={isRenameOpen} onOpenChange={setIsRenameOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Image</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="image-name">Image Name</Label>
            <Input
              id="image-name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="mt-2"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsRenameOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleRename}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isMoveOpen} onOpenChange={setIsMoveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Move to Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="folder-select">Select Folder</Label>
            <select
              id="folder-select"
              value={selectedFolderId}
              onChange={(e) => setSelectedFolderId(e.target.value)}
              className="w-full mt-2 p-2 border rounded-md"
            >
              <option value="root">Root</option>
              {folders
                .filter((folder) => folder.id !== "root")
                .map((folder) => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
            </select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMoveOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleMove}>Move</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}
