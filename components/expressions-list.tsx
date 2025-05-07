"use client"

import { useConfig } from "./config-provider"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Plus, Edit, Trash2 } from "lucide-react"
import type { Expression } from "@/lib/types"
import { toast } from "@/components/ui/use-toast"

export function ExpressionsList() {
  const {
    config,
    activeExpressionIndex,
    setActiveExpressionIndex,
    deleteExpression,
    setIsEditing,
    setEditingExpression,
  } = useConfig()

  if (!config) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center">
          <p className="text-muted-foreground">No config loaded</p>
        </CardContent>
      </Card>
    )
  }

  const handleAddExpression = () => {
    if (!config.frames.length) {
      toast({
        title: "Cannot add expression",
        description: "You need to define at least one frame type first.",
        variant: "destructive",
      })
      return
    }

    const newExpression: Expression = {
      name: `New Expression ${config.expressions.length + 1}`,
      frames: config.frames[0].name,
      animation: "auto",
      duration: 250,
    }

    setEditingExpression(newExpression)
    setIsEditing(true)
  }

  const handleEditExpression = (expression: Expression) => {
    setEditingExpression(JSON.parse(JSON.stringify(expression)))
    setIsEditing(true)
  }

  const handleDeleteExpression = (index: number) => {
    if (window.confirm("Are you sure you want to delete this expression?")) {
      deleteExpression(index)
      toast({
        title: "Expression deleted",
        description: "The expression has been removed from the configuration.",
      })
    }
  }

  return (
    <div className="flex flex-col h-full space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium">Expressions</h3>
        <Button size="sm" onClick={handleAddExpression}>
          <Plus className="h-4 w-4 mr-1" /> Add
        </Button>
      </div>

      <ScrollArea className="flex-1 rounded-md border">
        {config.expressions.length === 0 ? (
          <div className="p-4 text-center text-muted-foreground">
            No expressions defined. Click "Add" to create one.
          </div>
        ) : (
          <div className="p-4 space-y-2">
            {config.expressions.map((expression, index) => (
              <Card
                key={index}
                className={`cursor-pointer transition-colors ${
                  index === activeExpressionIndex ? "border-primary" : ""
                }`}
                onClick={() => setActiveExpressionIndex(index)}
              >
                <CardHeader className="p-4 pb-2">
                  <CardTitle className="text-base">{expression.name || `Expression ${index + 1}`}</CardTitle>
                  <CardDescription>Frames: {expression.frames}</CardDescription>
                </CardHeader>
                <CardContent className="p-4 pt-0 pb-2">
                  <div className="text-sm text-muted-foreground">
                    <div>Animation: {Array.isArray(expression.animation) ? "Custom sequence" : "Auto"}</div>
                    <div>Duration: {expression.duration}ms</div>
                    {expression.transition && <div>Transition: Yes</div>}
                  </div>
                </CardContent>
                <CardFooter className="p-2 flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleEditExpression(expression)
                    }}
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleDeleteExpression(index)
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  )
}
