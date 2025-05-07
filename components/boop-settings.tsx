"use client"

import { useState, useEffect } from "react"
import { useConfig } from "./config-provider"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Checkbox } from "@/components/ui/checkbox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/components/ui/use-toast"
import type { Config } from "./config-provider"

export function BoopSettings() {
  const { config, updateBoopSettings } = useConfig()
  const [localSettings, setLocalSettings] = useState<Config["boop"] | null>(null)

  useEffect(() => {
    if (config) {
      setLocalSettings(JSON.parse(JSON.stringify(config.boop)))
    }
  }, [config])

  if (!config || !localSettings) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center">
          <p className="text-muted-foreground">No config loaded</p>
        </CardContent>
      </Card>
    )
  }

  const handleSave = () => {
    if (!localSettings) return
    updateBoopSettings(localSettings)
    toast({
      title: "Boop settings saved",
      description: "Boop settings have been updated.",
    })
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>Boop Settings</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 h-[calc(100%-4rem)] overflow-y-auto">
        <div className="flex items-center space-x-2">
          <Checkbox
            id="boop-enabled"
            checked={localSettings.enabled}
            onCheckedChange={(checked) =>
              setLocalSettings({
                ...localSettings,
                enabled: checked === true,
              })
            }
          />
          <Label htmlFor="boop-enabled">Enable Boop</Label>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transition-in">Transition In</Label>
          <Select
            value={localSettings.transitionIn}
            onValueChange={(value) => setLocalSettings({ ...localSettings, transitionIn: value })}
          >
            <SelectTrigger id="transition-in">
              <SelectValue placeholder="Select transition in" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {config.expressions
                .filter((e) => e.transition)
                .map((expression, index) => (
                  <SelectItem key={index} value={expression.name}>
                    {expression.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transition-out">Transition Out</Label>
          <Select
            value={localSettings.transitionOut}
            onValueChange={(value) => setLocalSettings({ ...localSettings, transitionOut: value })}
          >
            <SelectTrigger id="transition-out">
              <SelectValue placeholder="Select transition out" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {config.expressions
                .filter((e) => e.transition)
                .map((expression, index) => (
                  <SelectItem key={index} value={expression.name}>
                    {expression.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="boop-animation">Boop Animation</Label>
          <Select
            value={localSettings.boopAnimationName}
            onValueChange={(value) => setLocalSettings({ ...localSettings, boopAnimationName: value })}
          >
            <SelectTrigger id="boop-animation">
              <SelectValue placeholder="Select boop animation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">None</SelectItem>
              {config.expressions.map((expression, index) => (
                <SelectItem key={index} value={expression.name}>
                  {expression.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="transition-only-on">Transition Only On Animation</Label>
          <Select
            value={localSettings.transictionOnlyOnAnimation}
            onValueChange={(value) => setLocalSettings({ ...localSettings, transictionOnlyOnAnimation: value })}
          >
            <SelectTrigger id="transition-only-on">
              <SelectValue placeholder="Select animation" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="any">Any</SelectItem>
              {config.expressions.map((expression, index) => (
                <SelectItem key={index} value={expression.name}>
                  {expression.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="specific-frame">Transition In Only On Specific Frame</Label>
          <Input
            id="specific-frame"
            type="number"
            min={0}
            value={localSettings.transictionInOnlyOnSpecificFrame}
            onChange={(e) =>
              setLocalSettings({
                ...localSettings,
                transictionInOnlyOnSpecificFrame: Number(e.target.value),
              })
            }
          />
        </div>

        <Button onClick={handleSave} className="w-full">
          Save Boop Settings
        </Button>
      </CardContent>
    </Card>
  )
}
