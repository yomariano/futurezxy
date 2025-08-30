'use client'
import { Loader2, Sparkles } from 'lucide-react'

interface ImagePreviewProps {
  image: string | null
  isProcessing: boolean
}

export default function ImagePreview({ image, isProcessing }: ImagePreviewProps) {
  if (isProcessing) {
    return (
      <div className="h-64 md:h-96 bg-muted/50 rounded-lg flex flex-col items-center justify-center space-y-4">
        <div className="relative">
          <Loader2 className="h-12 w-12 text-primary animate-spin" />
          <Sparkles className="h-6 w-6 text-yellow-500 absolute -top-2 -right-2 animate-pulse" />
        </div>
        <div className="text-center space-y-2">
          <p className="text-sm font-medium">AI is working its magic...</p>
          <p className="text-xs text-muted-foreground">This may take a few moments</p>
        </div>
      </div>
    )
  }

  if (image) {
    // Check if the result is text (from Gemini analysis) or an actual image
    if (image.startsWith('data:text/')) {
      // Decode and display text result from Gemini
      const base64Text = image.replace('data:text/plain;base64,', '')
      const decodedText = atob(base64Text)
      
      return (
        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-medium text-primary">
            <Sparkles className="h-4 w-4" />
            Gemini Analysis Result
          </div>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <p className="whitespace-pre-wrap text-sm">{decodedText}</p>
          </div>
          <div className="text-xs text-muted-foreground italic">
            Note: Gemini provides image analysis. For actual image generation, integrate with an image generation service.
          </div>
        </div>
      )
    }
    
    // Display actual image
    return (
      <div className="relative group">
        <img
          src={image}
          alt="Combined result"
          className="w-full h-auto rounded-lg shadow-lg"
        />
        <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs opacity-0 group-hover:opacity-100 transition-opacity">
          Right-click to save
        </div>
      </div>
    )
  }

  return (
    <div className="h-64 md:h-96 bg-muted/30 rounded-lg flex items-center justify-center border-2 border-dashed border-muted-foreground/20">
      <div className="text-center space-y-2">
        <Sparkles className="h-12 w-12 text-muted-foreground/50 mx-auto" />
        <p className="text-sm text-muted-foreground">
          Your combined image will appear here
        </p>
      </div>
    </div>
  )
}