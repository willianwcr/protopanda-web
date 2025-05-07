"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import type { Config, Expression, Frame, Script } from "@/lib/types"
import { emptyConfig } from "@/lib/empty-config"

interface ConfigContextType {
  config: Config | null
  activeExpressionIndex: number
  setActiveExpressionIndex: (index: number) => void
  loadConfig: (config: Config) => void
  saveConfig: () => void
  updateExpression: (index: number, expression: Expression) => void
  updateFrame: (index: number, frame: Frame) => void
  updateScript: (index: number, script: Script) => void
  updateBoopSettings: (boopSettings: Config["boop"]) => void
  addExpression: (expression: Expression) => void
  addFrame: (frame: Frame) => void
  addScript: (script: Script) => void
  deleteExpression: (index: number) => void
  deleteFrame: (index: number) => void
  deleteScript: (index: number) => void
  isEditing: boolean
  setIsEditing: (isEditing: boolean) => void
  editingExpression: Expression | null
  setEditingExpression: (expression: Expression | null) => void
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<Config | null>(emptyConfig)
  const [activeExpressionIndex, setActiveExpressionIndex] = useState(0)
  const [isEditing, setIsEditing] = useState(false)
  const [editingExpression, setEditingExpression] = useState<Expression | null>(null)

  const loadConfig = (newConfig: Config) => {
    setConfig(newConfig)
    setActiveExpressionIndex(0)
  }

  const saveConfig = () => {
    if (!config) return

    const dataStr = JSON.stringify(config, null, 2)
    const dataUri = "data:application/json;charset=utf-8," + encodeURIComponent(dataStr)

    const exportName = "config_export.json"

    const linkElement = document.createElement("a")
    linkElement.setAttribute("href", dataUri)
    linkElement.setAttribute("download", exportName)
    linkElement.click()
  }

  const updateExpression = (index: number, expression: Expression) => {
    if (!config) return
    const newExpressions = [...config.expressions]
    newExpressions[index] = expression
    setConfig({ ...config, expressions: newExpressions })
  }

  const updateFrame = (index: number, frame: Frame) => {
    if (!config) return
    const newFrames = [...config.frames]
    newFrames[index] = frame
    setConfig({ ...config, frames: newFrames })
  }

  const updateScript = (index: number, script: Script) => {
    if (!config) return
    const newScripts = [...config.scripts]
    newScripts[index] = script
    setConfig({ ...config, scripts: newScripts })
  }

  const updateBoopSettings = (boopSettings: Config["boop"]) => {
    if (!config) return
    setConfig({ ...config, boop: boopSettings })
  }

  const addExpression = (expression: Expression) => {
    if (!config) return
    setConfig({ ...config, expressions: [...config.expressions, expression] })
  }

  const addFrame = (frame: Frame) => {
    if (!config) return
    setConfig({ ...config, frames: [...config.frames, frame] })
  }

  const addScript = (script: Script) => {
    if (!config) return
    setConfig({ ...config, scripts: [...config.scripts, script] })
  }

  const deleteExpression = (index: number) => {
    if (!config) return
    const newExpressions = [...config.expressions]
    newExpressions.splice(index, 1)
    setConfig({ ...config, expressions: newExpressions })
    if (activeExpressionIndex >= newExpressions.length) {
      setActiveExpressionIndex(Math.max(0, newExpressions.length - 1))
    }
  }

  const deleteFrame = (index: number) => {
    if (!config) return
    const newFrames = [...config.frames]
    newFrames.splice(index, 1)
    setConfig({ ...config, frames: newFrames })
  }

  const deleteScript = (index: number) => {
    if (!config) return
    const newScripts = [...config.scripts]
    newScripts.splice(index, 1)
    setConfig({ ...config, scripts: newScripts })
  }

  return (
    <ConfigContext.Provider
      value={{
        config,
        activeExpressionIndex,
        setActiveExpressionIndex,
        loadConfig,
        saveConfig,
        updateExpression,
        updateFrame,
        updateScript,
        updateBoopSettings,
        addExpression,
        addFrame,
        addScript,
        deleteExpression,
        deleteFrame,
        deleteScript,
        isEditing,
        setIsEditing,
        editingExpression,
        setEditingExpression,
      }}
    >
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  const context = useContext(ConfigContext)
  if (context === undefined) {
    throw new Error("useConfig must be used within a ConfigProvider")
  }
  return context
}

export type { Config }
