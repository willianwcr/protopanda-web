"use client"
import { FileExplorer } from "./file-explorer/file-explorer"
import { toast } from "@/components/ui/use-toast"
import type { StoredImage } from "@/lib/storage-service"

export function ImagesTab() {
  const handleSelectImage = (image: StoredImage) => {
    // Copy the image URL to clipboard
    navigator.clipboard
      .writeText(image.data)
      .then(() => {
        toast({
          title: "Image URL copied",
          description: "The image URL has been copied to your clipboard. You can use it in your frame patterns.",
        })
      })
      .catch((err) => {
        console.error("Could not copy text: ", err)
        toast({
          title: "Image selected",
          description: "Use this image in your frame patterns.",
        })
      })
  }

  return (
    <div className="h-full flex flex-col">
      <FileExplorer onSelectImage={handleSelectImage} />
    </div>
  )
}
