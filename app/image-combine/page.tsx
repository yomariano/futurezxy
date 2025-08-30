'use client'
import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Upload, Download, Loader2, Sparkles, Users, Palette, Image as ImageIcon, Layers, Replace, Wand2, Camera, ArrowRight, Image, Columns, Grid3x3 } from 'lucide-react'
import { useToast } from "@/components/ui/use-toast"
import ImageUploader from '@/components/ImageUploader'
import CombinationModeSelector from '@/components/CombinationModeSelector'
import ImagePreview from '@/components/ImagePreview'
import { combinationModes } from '@/lib/combination-modes'

export default function ImageCombinePage() {
  const { toast } = useToast()
  const [image1, setImage1] = useState<string | null>(null)
  const [image2, setImage2] = useState<string | null>(null)
  const [resultImage, setResultImage] = useState<string | null>(null)
  const [selectedMode, setSelectedMode] = useState('background-replace')
  const [isProcessing, setIsProcessing] = useState(false)
  const [customPrompt, setCustomPrompt] = useState('')

  const handleImage1Upload = (file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      setImage1(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleImage2Upload = (file: File) => {
    const reader = new FileReader()
    reader.onloadend = () => {
      setImage2(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleProcess = async () => {
    if (!image1 || !image2) {
      toast({
        title: "Missing Images",
        description: "Please upload both images before processing.",
        variant: "destructive"
      })
      return
    }

    setIsProcessing(true)
    try {
      const response = await fetch('/api/combine-images', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          image1,
          image2,
          mode: selectedMode,
          customPrompt
        })
      })

      if (!response.ok) {
        throw new Error('Failed to process images')
      }

      const data = await response.json()
      setResultImage(data.resultImage)
      
      toast({
        title: "Success!",
        description: "Your images have been combined successfully.",
      })
    } catch (error) {
      console.error('Error processing images:', error)
      toast({
        title: "Processing Failed",
        description: "There was an error combining your images. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDownload = () => {
    if (!resultImage) return
    
    const link = document.createElement('a')
    link.href = resultImage
    link.download = `combined-${Date.now()}.png`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handleReset = () => {
    setImage1(null)
    setImage2(null)
    setResultImage(null)
    setCustomPrompt('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-5xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
            AI Image Combiner & Background Changer
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Replace backgrounds, combine images, and create amazing compositions with AI. Perfect for changing photo backgrounds or merging multiple images creatively!
          </p>
          
          {/* Quick Feature Badges */}
          <div className="flex flex-wrap gap-2 justify-center mt-4">
            <div className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium flex items-center gap-1">
              <Image className="h-3 w-3" />
              Background Replacement
            </div>
            <div className="px-3 py-1 bg-green-500/10 text-green-600 dark:text-green-400 rounded-full text-sm font-medium flex items-center gap-1">
              <Columns className="h-3 w-3" />
              Side by Side
            </div>
            <div className="px-3 py-1 bg-orange-500/10 text-orange-600 dark:text-orange-400 rounded-full text-sm font-medium flex items-center gap-1">
              <Grid3x3 className="h-3 w-3" />
              Photo Grids
            </div>
            <div className="px-3 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-full text-sm font-medium flex items-center gap-1">
              <Users className="h-3 w-3" />
              Face Swap
            </div>
            <div className="px-3 py-1 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-full text-sm font-medium flex items-center gap-1">
              <Palette className="h-3 w-3" />
              Style Transfer
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left Column - Image Uploads */}
          <div className="space-y-6">
            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  First Image
                </CardTitle>
                <CardDescription>
                  {selectedMode === 'background-replace' 
                    ? 'Upload the image with the subject/person you want to keep'
                    : selectedMode === 'side-by-side' || selectedMode === 'top-bottom' || selectedMode === 'grid-2x2'
                    ? 'Upload your first photo'
                    : selectedMode === 'picture-in-picture'
                    ? 'Upload the main/background image'
                    : 'Upload the main subject or person'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  onImageUpload={handleImage1Upload}
                  currentImage={image1}
                  label="Drop your first image here"
                  id="image1"
                />
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary transition-colors">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="h-5 w-5" />
                  Second Image
                </CardTitle>
                <CardDescription>
                  {selectedMode === 'background-replace'
                    ? 'Upload the new background image'
                    : selectedMode === 'side-by-side' || selectedMode === 'top-bottom' || selectedMode === 'grid-2x2'
                    ? 'Upload your second photo'
                    : selectedMode === 'picture-in-picture'
                    ? 'Upload the overlay/inset image'
                    : 'Upload the background or secondary image'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ImageUploader
                  onImageUpload={handleImage2Upload}
                  currentImage={image2}
                  label="Drop your second image here"
                  id="image2"
                />
              </CardContent>
            </Card>
          </div>

          {/* Middle Column - Mode Selection and Controls */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wand2 className="h-5 w-5" />
                  Combination Mode
                </CardTitle>
                <CardDescription>
                  Choose how you want to combine your images
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CombinationModeSelector
                  selectedMode={selectedMode}
                  onModeChange={setSelectedMode}
                  onCustomPromptChange={setCustomPrompt}
                  customPrompt={customPrompt}
                />
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleProcess}
                disabled={!image1 || !image2 || isProcessing}
                className="w-full h-12 text-lg"
                size="lg"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-5 w-5" />
                    Combine Images
                  </>
                )}
              </Button>

              {resultImage && (
                <>
                  <Button
                    onClick={handleDownload}
                    variant="outline"
                    className="w-full h-12"
                    size="lg"
                  >
                    <Download className="mr-2 h-5 w-5" />
                    Download Result
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="ghost"
                    className="w-full"
                  >
                    Start Over
                  </Button>
                </>
              )}
            </div>

            {/* Tips Card */}
            <Card className="bg-muted/50">
              <CardHeader>
                <CardTitle className="text-sm">Pro Tips</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {selectedMode === 'background-replace' ? (
                  <>
                    <p className="font-medium text-primary">🎯 Background Replacement:</p>
                    <p>• Use images with clear subjects</p>
                    <p>• Plain backgrounds work best</p>
                    <p>• Ensure good lighting match</p>
                  </>
                ) : selectedMode === 'side-by-side' || selectedMode === 'top-bottom' ? (
                  <>
                    <p className="font-medium text-primary">📐 Layout Combination:</p>
                    <p>• Use similar aspect ratios</p>
                    <p>• Match lighting & colors</p>
                    <p>• Great for before/after shots</p>
                  </>
                ) : selectedMode === 'grid-2x2' || selectedMode === 'collage' ? (
                  <>
                    <p className="font-medium text-primary">🎨 Creative Layouts:</p>
                    <p>• Mix different perspectives</p>
                    <p>• Play with color themes</p>
                    <p>• Create visual stories</p>
                  </>
                ) : selectedMode === 'picture-in-picture' ? (
                  <>
                    <p className="font-medium text-primary">🖼️ Picture-in-Picture:</p>
                    <p>• Overlay should be smaller</p>
                    <p>• Choose corner placement</p>
                    <p>• Good for reactions/comparisons</p>
                  </>
                ) : (
                  <>
                    <p>• Use high-quality images</p>
                    <p>• Try different modes</p>
                    <p>• Experiment with prompts</p>
                  </>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Result Preview */}
          <Card className="border-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Layers className="h-5 w-5" />
                Result Preview
              </CardTitle>
              <CardDescription>
                Your combined image will appear here
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ImagePreview image={resultImage} isProcessing={isProcessing} />
            </CardContent>
          </Card>
        </div>

        {/* Examples Section */}
        <Card>
          <CardHeader>
            <CardTitle>What You Can Create</CardTitle>
            <CardDescription>
              Explore different combination possibilities
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {combinationModes.slice(0, 4).map((mode) => (
                <div key={mode.id} className="text-center space-y-2">
                  <div className="h-20 bg-muted rounded-lg flex items-center justify-center">
                    <mode.icon className="h-8 w-8 text-primary" />
                  </div>
                  <p className="text-sm font-medium">{mode.name}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}