"use client"

import type React from "react"

import { useState, useRef } from "react"
import { FolderPlus, Upload, RefreshCw, Grid, List, Search, SortAsc, Calendar, FileText } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface ToolbarProps {
  onCreateFolder: (name: string) => void
  onRefresh: () => void
  onUploadFiles: (files: FileList) => void
  onViewChange: (view: "grid" | "list") => void
  onSortChange: (sort: "name" | "date" | "type") => void
  onSearch: (query: string) => void
  view: "grid" | "list"
  sortBy: "name" | "date" | "type"
}

export function Toolbar({
  onCreateFolder,
  onRefresh,
  onUploadFiles,
  onViewChange,
  onSortChange,
  onSearch,
  view,
  sortBy,
}: ToolbarProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false)
  const [newFolderName, setNewFolderName] = useState("")
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    onSearch(searchQuery)
  }

  const handleCreateFolder = () => {
    if (newFolderName.trim()) {
      onCreateFolder(newFolderName.trim())
      setNewFolderName("")
      setIsCreateFolderOpen(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onUploadFiles(files)
      // Reset the input so the same file can be selected again
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  return (
    <div className="flex flex-col sm:flex-row gap-2 mb-4">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" onClick={() => setIsCreateFolderOpen(true)} title="Create new folder">
          <FolderPlus className="h-4 w-4 mr-2" />
          New Folder
        </Button>

        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          title="Select files to upload"
        >
          <Upload className="h-4 w-4 mr-2" />
          Upload Files
        </Button>

        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          className="hidden"
          multiple
          accept="image/*"
        />

        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onRefresh} title="Refresh">
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      <div className="flex gap-2 ml-auto">
        <form onSubmit={handleSearch} className="relative">
          <Search className="h-4 w-4 absolute left-2 top-2 text-muted-foreground" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-8 pl-8 w-[150px] sm:w-[200px]"
          />
        </form>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8" title="Sort by">
              <SortAsc className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuRadioGroup
              defaultValue="name"
              value={sortBy}
              onValueChange={(value) => onSortChange(value as any)}
            >
              <DropdownMenuRadioItem value="name">
                <FileText className="h-4 w-4 mr-2" />
                Name
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="date">
                <Calendar className="h-4 w-4 mr-2" />
                Date
              </DropdownMenuRadioItem>
              <DropdownMenuRadioItem value="type">
                <FileText className="h-4 w-4 mr-2" />
                Type
              </DropdownMenuRadioItem>
            </DropdownMenuRadioGroup>
          </DropdownMenuContent>
        </DropdownMenu>

        <div className="flex border rounded-md">
          <Button
            variant={view === "grid" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-r-none"
            onClick={() => onViewChange("grid")}
            title="Grid view"
          >
            <Grid className="h-4 w-4" />
          </Button>
          <Button
            variant={view === "list" ? "secondary" : "ghost"}
            size="icon"
            className="h-8 w-8 rounded-l-none"
            onClick={() => onViewChange("list")}
            title="List view"
          >
            <List className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Dialog open={isCreateFolderOpen} onOpenChange={setIsCreateFolderOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Folder</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Label htmlFor="folder-name">Folder Name</Label>
            <Input
              id="folder-name"
              value={newFolderName}
              onChange={(e) => setNewFolderName(e.target.value)}
              placeholder="My Folder"
              className="mt-2"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateFolderOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateFolder}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
