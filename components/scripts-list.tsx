"use client"

import { useState } from "react"
import { useConfig } from "./config-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Plus, Edit, Trash2, Play } from "lucide-react"
import type { Script } from "@/lib/types"
import { toast } from "@/components/ui/use-toast"

export function ScriptsList() {
  const { config, updateScript, addScript, deleteScript } = useConfig()
  const [isEditing, setIsEditing] = useState(false)
  const [editingScript, setEditingScript] = useState<Script | null>(null)
  const [editingIndex, setEditingIndex] = useState<number | null>(null)

  if (!config) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center">
          <p className="text-muted-foreground">No config loaded</p>
        </CardContent>
      </Card>
    )
  }

  const handleAddScript = () => {
    setEditingScript({
      name: `New Script ${config.scripts.length + 1}`,
      file: "/scripts/new_script.lua",
    })
    setEditingIndex(null)
    setIsEditing(true)
  }

  const handleEditScript = (script: Script, index: number) => {
    setEditingScript({ ...script })
    setEditingIndex(index)
    setIsEditing(true)
  }

  const handleDeleteScript = (index: number) => {
    if (window.confirm("Are you sure you want to delete this script?")) {
      deleteScript(index)
      toast({
        title: "Script deleted",
        description: "The script has been removed from the configuration.",
      })
    }
  }

  const handleSaveScript = () => {
    if (!editingScript) return

    if (editingIndex !== null) {
      updateScript(editingIndex, editingScript)
      toast({
        title: "Script updated",
        description: `${editingScript.name} has been updated.`,
      })
    } else {
      addScript(editingScript)
      toast({
        title: "Script added",
        description: `${editingScript.name} has been added to the configuration.`,
      })
    }

    setIsEditing(false)
    setEditingScript(null)
    setEditingIndex(null)
  }

  const handleRunScript = (script: Script) => {
    toast({
      title: "Script execution",
      description: `Running ${script.name}...`,
    })
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Scripts</h3>
        <Button size="sm" onClick={handleAddScript}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      <ScrollArea className="flex-1 rounded-md border">
        {config.scripts.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">No scripts defined. Click "Add" to create one.</div>
        ) : (
          <div className="p-4 space-y-2">
            {config.scripts.map((script, index) => (
              <Card key={index}>
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">{script.name}</CardTitle>
                  <CardDescription>File: {script.file}</CardDescription>
                </CardHeader>
                <CardFooter className="p-2 flex justify-end gap-2">
                  <Button variant="ghost" size="icon" onClick={() => handleRunScript(script)}>
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleEditScript(script, index)}>
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => handleDeleteScript(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>

      <Dialog open={isEditing} onOpenChange={setIsEditing}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingIndex !== null ? "Edit Script" : "Add New Script"}</DialogTitle>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="script-name">Script Name</Label>
              <Input
                id="script-name"
                value={editingScript?.name || ""}
                onChange={(e) => setEditingScript((prev) => (prev ? { ...prev, name: e.target.value } : null))}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="file">File Path</Label>
              <Input
                id="file"
                value={editingScript?.file || ""}
                onChange={(e) => setEditingScript((prev) => (prev ? { ...prev, file: e.target.value } : null))}
              />
              <p className="text-xs text-muted-foreground">Path to the script file (e.g., /scripts/myscript.lua)</p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setIsEditing(false)
                setEditingScript(null)
                setEditingIndex(null)
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveScript}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
