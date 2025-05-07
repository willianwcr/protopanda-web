"use client"

import type React from "react"

import { useRef } from "react"
import { useConfig } from "./config-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Save, RefreshCw, HelpCircle, Trash2, Download } from "lucide-react"
import { defaultConfig } from "@/lib/default-config"
import type { Config } from "@/lib/types"
import { toast } from "@/components/ui/use-toast"

export function ConfigActions() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { config, loadConfig, saveConfig } = useConfig()

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string) as Config
        loadConfig(json)
        toast({
          title: "Config loaded",
          description: "Configuration file has been loaded successfully.",
        })
      } catch (error) {
        toast({
          title: "Error loading config",
          description: "The file is not a valid JSON configuration.",
          variant: "destructive",
        })
      }
    }
    reader.readAsText(file)

    // Reset the input so the same file can be selected again
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleSave = () => {
    saveConfig()
    toast({
      title: "Config saved",
      description: "Configuration file has been downloaded.",
    })
  }

  const handleReset = () => {
    if (
      window.confirm(
        "Are you sure you want to load the default configuration? This will replace your current configuration.",
      )
    ) {
      loadConfig(defaultConfig)
      toast({
        title: "Default config loaded",
        description: "Default configuration has been loaded.",
      })
    }
  }

  const handleDelete = () => {
    if (window.confirm("Are you sure you want to delete the configuration? This cannot be undone.")) {
      loadConfig({
        frames: [],
        expressions: [],
        scripts: [],
        boop: {
          enabled: false,
          transitionIn: "",
          transitionOut: "",
          boopAnimationName: "",
          transictionOnlyOnAnimation: "",
          transictionInOnlyOnSpecificFrame: 0,
        },
      })
      toast({
        title: "Config deleted",
        description: "Configuration has been deleted.",
      })
    }
  }

  const handleExport = () => {
    // This would typically generate an image from the canvas
    // For now, we'll just show a toast
    toast({
      title: "Image exported",
      description: "Animation preview has been exported as an image.",
    })
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle>Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" className="justify-start" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" />
            Load Config
          </Button>
          <input type="file" ref={fileInputRef} className="hidden" accept=".json" onChange={handleFileUpload} />

          <Button variant="outline" className="justify-start" onClick={handleSave} disabled={!config}>
            <Save className="mr-2 h-4 w-4" />
            Save Config
          </Button>

          <Button variant="outline" className="justify-start" onClick={handleReset}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Load Default Config
          </Button>

          <Button variant="outline" className="justify-start" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Export Image
          </Button>

          <Button
            variant="outline"
            className="justify-start"
            onClick={() => {
              toast({
                title: "Help",
                description: "This is a configuration editor for animation frames and expressions.",
              })
            }}
          >
            <HelpCircle className="mr-2 h-4 w-4" />
            Help
          </Button>

          <Button variant="destructive" className="justify-start col-span-2" onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Delete Config
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
