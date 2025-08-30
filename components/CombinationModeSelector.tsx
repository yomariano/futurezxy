'use client'
import { useState } from 'react'
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { combinationModes } from '@/lib/combination-modes'
import { Card } from "@/components/ui/card"

interface CombinationModeSelectorProps {
  selectedMode: string
  onModeChange: (mode: string) => void
  customPrompt: string
  onCustomPromptChange: (prompt: string) => void
}

export default function CombinationModeSelector({
  selectedMode,
  onModeChange,
  customPrompt,
  onCustomPromptChange
}: CombinationModeSelectorProps) {
  return (
    <div className="space-y-4">
      <RadioGroup value={selectedMode} onValueChange={onModeChange}>
        <div className="grid gap-3">
          {combinationModes.map((mode) => (
            <Card 
              key={mode.id} 
              className={`p-3 cursor-pointer transition-all hover:shadow-md ${
                selectedMode === mode.id ? 'ring-2 ring-primary' : ''
              } ${mode.featured ? 'border-primary/50 bg-primary/5' : ''}`}
              onClick={() => onModeChange(mode.id)}
            >
              <div className="flex items-start space-x-3">
                <RadioGroupItem value={mode.id} id={mode.id} className="mt-1" />
                <div className="flex-1 space-y-1">
                  <Label 
                    htmlFor={mode.id} 
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    <mode.icon className="h-4 w-4" />
                    <span className="font-medium">{mode.name}</span>
                    {mode.featured && (
                      <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                        Popular
                      </span>
                    )}
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {mode.description}
                  </p>
                  {mode.example && (
                    <p className="text-xs text-primary/70 italic">
                      Example: {mode.example}
                    </p>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      </RadioGroup>

      {selectedMode === 'custom' && (
        <div className="space-y-2 animate-in slide-in-from-top-2">
          <Label htmlFor="custom-prompt">Your Custom Prompt</Label>
          <Textarea
            id="custom-prompt"
            placeholder="Describe how you want to combine the images..."
            value={customPrompt}
            onChange={(e) => onCustomPromptChange(e.target.value)}
            className="min-h-[100px] resize-none"
          />
          <p className="text-xs text-muted-foreground">
            Be specific about what you want. E.g., "Merge both faces into one", "Create a double exposure effect", etc.
          </p>
        </div>
      )}
    </div>
  )
}