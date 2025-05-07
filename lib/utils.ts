import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatImagePath(pattern: string, frameNumber: number): string {
  // Guard against undefined or invalid inputs
  if (!pattern || frameNumber === undefined) {
    return ""
  }

  try {
    // If the pattern is a data URL, return it directly
    if (pattern.startsWith("data:")) {
      return pattern
    }

    // Replace %d or (%d) with the frame number
    const imagePath = pattern.replace(/$$%d$$|%d/g, frameNumber.toString())
    return imagePath.startsWith("/") ? imagePath.slice(1) : imagePath
  } catch (error) {
    console.error("Error formatting image path:", error)
    return ""
  }
}
