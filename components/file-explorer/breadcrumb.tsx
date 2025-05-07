"use client"

import { ChevronRight, Home } from "lucide-react"
import { Button } from "@/components/ui/button"
import type { ImageFolder } from "@/lib/storage-service"

interface BreadcrumbProps {
  currentPath: ImageFolder[]
  onNavigate: (folderId: string | null) => void
}

export function Breadcrumb({ currentPath, onNavigate }: BreadcrumbProps) {
  return (
    <div className="flex items-center overflow-x-auto whitespace-nowrap py-2 px-1 text-sm">
      <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => onNavigate(null)}>
        <Home className="h-4 w-4 mr-1" />
        Home
      </Button>

      {currentPath.map((folder, index) => (
        <div key={folder.id} className="flex items-center">
          <ChevronRight className="h-4 w-4 mx-1 text-muted-foreground" />
          <Button variant="ghost" size="sm" className="h-8 px-2" onClick={() => onNavigate(folder.id)}>
            {folder.name}
          </Button>
        </div>
      ))}
    </div>
  )
}
