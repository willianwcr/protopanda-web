"use client"

import { useState } from "react"
import { AnimationPreview } from "@/components/animation-preview"
import { ConfigActions } from "@/components/config-actions"
import { ExpressionEditor } from "@/components/expression-editor"
import { ExpressionsList } from "@/components/expressions-list"
import { ConfigProvider } from "@/components/config-provider"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { FramesList } from "@/components/frames-list"
import { ScriptsList } from "@/components/scripts-list"
import { BoopSettings } from "@/components/boop-settings"
import { ImagesTab } from "@/components/images-tab"
import { Logo } from "@/components/logo"
import { ThemeToggle } from "@/components/theme-toggle"
import { Layers, Code, Settings, ImageIcon } from "lucide-react"

export default function Home() {
  const [activeTab, setActiveTab] = useState("expressions")

  return (
    <ConfigProvider>
      <div className="flex h-screen w-full overflow-hidden bg-background">
        {/* Left panel - Preview and Actions */}
        <div className="w-1/4 min-w-[300px] max-w-[400px] h-full border-r p-4 flex flex-col overflow-y-auto">
          <div className="flex justify-between items-center">
            <Logo />
            <ThemeToggle />
          </div>
          <AnimationPreview />
          <div className="mt-4">
            <ConfigActions />
          </div>
        </div>

        {/* Right panel - Main content */}
        <div className="flex-1 h-full flex flex-col overflow-hidden">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
            <div className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-10">
              <TabsList className="w-full justify-start px-6 py-3 h-auto">
                <TabsTrigger value="expressions" className="flex items-center gap-2 py-2 px-4">
                  <Layers className="h-4 w-4" />
                  <span>Expressions</span>
                </TabsTrigger>
                <TabsTrigger value="frames" className="flex items-center gap-2 py-2 px-4">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-4 w-4"
                  >
                    <rect x="2" y="2" width="8" height="8" rx="2" />
                    <rect x="14" y="2" width="8" height="8" rx="2" />
                    <rect x="2" y="14" width="8" height="8" rx="2" />
                    <rect x="14" y="14" width="8" height="8" rx="2" />
                  </svg>
                  <span>Frames</span>
                </TabsTrigger>
                <TabsTrigger value="scripts" className="flex items-center gap-2 py-2 px-4">
                  <Code className="h-4 w-4" />
                  <span>Scripts</span>
                </TabsTrigger>
                <TabsTrigger value="boop" className="flex items-center gap-2 py-2 px-4">
                  <Settings className="h-4 w-4" />
                  <span>Boop</span>
                </TabsTrigger>
                <TabsTrigger value="images" className="flex items-center gap-2 py-2 px-4">
                  <ImageIcon className="h-4 w-4" />
                  <span>Images</span>
                </TabsTrigger>
              </TabsList>
            </div>
            <div className="flex-1 overflow-hidden h-[calc(100vh-4rem)]">
              <TabsContent
                value="expressions"
                className="p-6 h-full overflow-y-auto m-0 data-[state=active]:flex data-[state=active]:flex-col"
              >
                <ExpressionsList />
              </TabsContent>
              <TabsContent
                value="frames"
                className="p-6 h-full overflow-y-auto m-0 data-[state=active]:flex data-[state=active]:flex-col"
              >
                <FramesList />
              </TabsContent>
              <TabsContent
                value="scripts"
                className="p-6 h-full overflow-y-auto m-0 data-[state=active]:flex data-[state=active]:flex-col"
              >
                <ScriptsList />
              </TabsContent>
              <TabsContent
                value="boop"
                className="p-6 h-full overflow-y-auto m-0 data-[state=active]:flex data-[state=active]:flex-col"
              >
                <BoopSettings />
              </TabsContent>
              <TabsContent
                value="images"
                className="p-6 h-full overflow-y-auto m-0 data-[state=active]:flex data-[state=active]:flex-col"
              >
                <ImagesTab />
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
      <ExpressionEditor />
    </ConfigProvider>
  )
}
