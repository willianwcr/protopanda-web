"use client"

import type React from "react"

import { useState } from "react"
import { Folder, MoreVertical, Edit, Trash2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { ImageFolder } from "@/lib/storage-service"
import { formatDate } from "@/lib/storage-service"

interface FolderItemProps {
  folder: ImageFolder
  onNavigate: (folderId: string | null) => void
  onRename: (folderId: string, newName: string) => void
  onDelete: (folderId: string) => void
  view: "grid" | "list"
  isDraggingOver?: boolean
  onDragOver?: (e: React.DragEvent) => void
  onDragLeave?: () => void
  onDrop?: (e: React.DragEvent) => void
}

export function FolderItem({
  folder,
  onNavigate,
  onRename,
  onDelete,
  view,
  isDraggingOver = false,
  onDragOver,
  onDragLeave,
  onDrop,
}: FolderItemProps) {
  const [isRenameOpen, setIsRenameOpen] = useState(false)
  const [newName, setNewName] = useState(folder.name)

  const handleRename = () => {
    if (newName.trim() && newName !== folder.name) {
      onRename(folder.id, newName.trim())
    }
    setIsRenameOpen(false)
  }

  const handleDelete = () => {
    if (window.confirm(`Are you sure you want to delete the folder "${folder.name}"?`)) {
      onDelete(folder.id)
    }
  }

  const handleNavigate = () => {
    onNavigate(folder.id)
  }

  if (view === "grid") {
    return (
      <>
        <div
          onDragOver={onDragOver ? (e) => onDragOver(e) : undefined}
          onDragLeave={onDragLeave}
          onDrop={onDrop ? (e) => onDrop(e) : undefined}
          className={`group relative border rounded-md overflow-hidden cursor-pointer hover:border-primary ${
            isDraggingOver ? "border-primary bg-primary/10" : ""
          }`}
          onClick={handleNavigate}
        >
          <div className="aspect-square bg-accent/10 flex items-center justify-center">
            <Folder className="h-16 w-16 text-accent-foreground/40" />
          </div>
          <div className="p-2">
            <p className="text-sm font-medium truncate">{folder.name}</p>
            <p className="text-xs text-muted-foreground">Folder • {formatDate(folder.dateCreated)}</p>
          </div>

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
              <DialogTitle>Rename Folder</DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <Label htmlFor="folder-name">Folder Name</Label>
              <Input
                id="folder-name"
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
      </>
    )
  }

  // List view
  return (
    <>
      <div
        onDragOver={onDragOver ? (e) => onDragOver(e) : undefined}
        onDragLeave={onDragLeave}
        onDrop={onDrop ? (e) => onDrop(e) : undefined}
        className={`group flex items-center p-2 hover:bg-accent rounded-md cursor-pointer ${
          isDraggingOver ? "bg-primary/10" : ""
        }`}
        onClick={handleNavigate}
      >
        <div className="h-10 w-10 rounded bg-accent/10 mr-3 flex-shrink-0 flex items-center justify-center">
          <Folder className="h-5 w-5 text-accent-foreground/40" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{folder.name}</p>
          <p className="text-xs text-muted-foreground">Folder • {formatDate(folder.dateCreated)}</p>
        </div>

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
            <DialogTitle>Rename Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
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
    </>
  )
}
