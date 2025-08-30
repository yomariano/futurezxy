'use client'
import { useState, useCallback } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"

interface ImageUploaderProps {
  onImageUpload: (file: File) => void
  currentImage: string | null
  label?: string
  id: string
}

export default function ImageUploader({ onImageUpload, currentImage, label = "Drop image here", id }: ImageUploaderProps) {
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const files = e.dataTransfer.files
    if (files.length > 0 && files[0].type.startsWith('image/')) {
      onImageUpload(files[0])
    }
  }, [onImageUpload])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      onImageUpload(files[0])
    }
  }, [onImageUpload])

  const handleRemove = useCallback(() => {
    const input = document.getElementById(id) as HTMLInputElement
    if (input) {
      input.value = ''
    }
  }, [id])

  return (
    <div className="w-full">
      {currentImage ? (
        <div className="relative group">
          <img
            src={currentImage}
            alt="Uploaded"
            className="w-full h-48 object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center">
            <Button
              onClick={handleRemove}
              variant="destructive"
              size="sm"
              className="mr-2"
            >
              <X className="h-4 w-4 mr-1" />
              Remove
            </Button>
          </div>
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all
            ${isDragging 
              ? 'border-primary bg-primary/10' 
              : 'border-muted-foreground/25 hover:border-primary hover:bg-muted/50'
            }
          `}
        >
          <input
            type="file"
            id={id}
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          <label htmlFor={id} className="cursor-pointer">
            <div className="flex flex-col items-center space-y-3">
              {isDragging ? (
                <ImageIcon className="h-12 w-12 text-primary animate-pulse" />
              ) : (
                <Upload className="h-12 w-12 text-muted-foreground" />
              )}
              <div className="space-y-1">
                <p className="text-sm font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">
                  or click to browse
                </p>
              </div>
            </div>
          </label>
        </div>
      )}
    </div>
  )
}