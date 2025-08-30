import { NextRequest, NextResponse } from 'next/server'
import { combinationModes } from '@/lib/combination-modes'

// Gemini API configuration
const GEMINI_API_KEY = process.env.GEMINI_API_KEY
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-1.5-flash'
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`

async function processImagesWithGemini(
  image1: string,
  image2: string,
  mode: string,
  customPrompt?: string
): Promise<string> {
  // Get the prompt based on mode
  let prompt = customPrompt || ''
  
  if (!customPrompt) {
    const modeConfig = combinationModes.find(m => m.id === mode)
    prompt = modeConfig?.prompt || 'Combine these two images creatively'
  }

  // Remove data URL prefixes to get base64 only
  const base64Image1 = image1.replace(/^data:image\/\w+;base64,/, '')
  const base64Image2 = image2.replace(/^data:image\/\w+;base64,/, '')

  try {
    if (!GEMINI_API_KEY) {
      throw new Error('GEMINI_API_KEY is not configured')
    }

    // Prepare the request to Gemini API
    const requestBody = {
      contents: [{
        parts: [
          {
            text: mode === 'background-replace' 
              ? `Task: Background Replacement
              
              1. Analyze the first image and identify the main subject (person, object, etc.)
              2. Analyze the second image as the new background
              3. Describe in detail how to:
                 - Remove the background from the first image
                 - Extract the main subject with clean edges
                 - Place the subject naturally into the new background
                 - Adjust lighting, shadows, and color matching
                 - Ensure realistic scale and perspective
              
              Provide step-by-step instructions and describe the final result.`
              : mode === 'side-by-side'
              ? `Task: Side-by-Side Photo Combination
              
              1. Analyze both images for content and dimensions
              2. Describe how to combine them horizontally:
                 - Resize both images to matching heights
                 - Place them side by side with even spacing
                 - Add a subtle border or seamless blend
                 - Ensure color balance between both images
                 - Create a cohesive final composition
              
              Describe the layout and final appearance.`
              : mode === 'top-bottom'
              ? `Task: Vertical Photo Stack
              
              1. Analyze both images for content and dimensions
              2. Describe how to stack them vertically:
                 - Resize both images to matching widths
                 - Stack them with the first image on top
                 - Create a clean transition between images
                 - Balance the overall composition
                 - Ensure visual flow from top to bottom
              
              Describe the stacked layout and final result.`
              : mode === 'grid-2x2'
              ? `Task: 2x2 Grid Layout
              
              1. Analyze both images
              2. Create a 2x2 grid arrangement:
                 - Use image 1 in top-left and bottom-right
                 - Use image 2 in top-right and bottom-left
                 - Ensure all quadrants are equal size
                 - Add subtle borders between sections
                 - Create a balanced, symmetric pattern
              
              Describe the grid layout and visual pattern.`
              : mode === 'picture-in-picture'
              ? `Task: Picture-in-Picture Overlay
              
              1. Use first image as the main background
              2. Place second image as an overlay:
                 - Resize second image to about 25-30% of the main image
                 - Position in corner (typically bottom-right)
                 - Add a border or shadow to the overlay
                 - Ensure overlay doesn't obscure important content
                 - Maintain visibility of both images
              
              Describe the overlay composition.`
              : mode === 'diagonal-split'
              ? `Task: Diagonal Split Combination
              
              1. Analyze both images
              2. Create a diagonal split effect:
                 - Split the canvas diagonally from corner to corner
                 - Place first image on one side of the diagonal
                 - Place second image on the other side
                 - Create a clean or blended transition line
                 - Ensure both images are properly visible
              
              Describe the diagonal composition.`
              : prompt + "\n\nPlease analyze these two images and describe how they would look when combined according to the prompt above. Provide a detailed description of the resulting combined image."
          },
          {
            inline_data: {
              mime_type: "image/jpeg",
              data: base64Image1
            }
          },
          {
            inline_data: {
              mime_type: "image/jpeg", 
              data: base64Image2
            }
          }
        ]
      }],
      generationConfig: {
        temperature: 0.9,
        topK: 1,
        topP: 1,
        maxOutputTokens: 2048,
      }
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Gemini API error:', errorData)
      throw new Error(`Gemini API error: ${response.status}`)
    }

    const data = await response.json()
    
    // Extract the generated text from Gemini response
    const generatedText = data.candidates?.[0]?.content?.parts?.[0]?.text || ''
    
    // Note: Gemini doesn't generate images directly, it provides text descriptions
    // For actual image generation, you would need to:
    // 1. Use Gemini's text output as a prompt for an image generation service
    // 2. Or use Google's Imagen API (if available)
    // 3. Or integrate with another image generation service
    
    // For now, we'll return a success message with the description
    // In production, you'd want to chain this with an image generation service
    return `data:text/plain;base64,${Buffer.from(generatedText).toString('base64')}`
    
  } catch (error) {
    console.error('Gemini processing error:', error)
    throw new Error('Failed to process images with Gemini')
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { image1, image2, mode, customPrompt } = body

    if (!image1 || !image2) {
      return NextResponse.json(
        { error: 'Both images are required' },
        { status: 400 }
      )
    }

    if (!mode) {
      return NextResponse.json(
        { error: 'Combination mode is required' },
        { status: 400 }
      )
    }

    // Process images with Gemini
    const resultImage = await processImagesWithGemini(
      image1,
      image2,
      mode,
      customPrompt
    )

    return NextResponse.json({
      resultImage,
      mode,
      prompt: customPrompt || combinationModes.find(m => m.id === mode)?.prompt
    })

  } catch (error) {
    console.error('Error in combine-images API:', error)
    return NextResponse.json(
      { error: 'Failed to combine images' },
      { status: 500 }
    )
  }
}

// Configuration for the API route
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'