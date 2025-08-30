# AI Image Combiner - Gemini Integration Setup Guide

## Overview
The AI Image Combiner feature allows users to combine two images using Google's Gemini AI API. The feature is fully responsive and user-friendly with guided workflows.

## Features Implemented

### 1. Dual Image Upload
- Drag and drop support
- Click to browse files
- Image preview with remove option
- Mobile-responsive upload areas

### 2. Combination Modes

#### Photo Layout Combinations
- **Side by Side** (Featured): Place two photos horizontally next to each other
- **Top & Bottom**: Stack two photos vertically
- **2x2 Grid**: Create a grid pattern with both images
- **Picture in Picture**: Overlay second image as inset on first
- **Diagonal Split**: Combine with diagonal divider

#### Creative Combinations
- **Replace Background** (Featured): Remove background from image 1 and replace with image 2
- **Place Person in Scene**: Put person from image 1 into scene of image 2
- **Face Swap**: Exchange faces between two portraits
- **Style Transfer**: Apply artistic style of image 2 to image 1
- **Blend Scenes**: Seamlessly merge two scenes
- **Double Exposure**: Create artistic double exposure effects
- **Replace Object**: Replace main object with another
- **Creative Collage**: Artistic overlapping compositions
- **Custom Prompt**: User-defined combination instructions

### 3. User-Friendly Interface
- Clear instructions and descriptions for each mode
- Visual icons for easy mode identification
- Pro tips section for better results
- Example use cases for each mode
- Progress indicators during processing
- Download button for results

### 4. Mobile Responsiveness
- Responsive grid layout (1 column on mobile, 3 on desktop)
- Touch-friendly interface
- Optimized image sizes for mobile
- Collapsible mobile menu with navigation

## Gemini API Integration Setup

### Getting Your Gemini API Key

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Sign in with your Google account
3. Click "Create API Key"
4. Copy your API key

### Configuration

1. Add environment variables to your `.env` file:
```env
# Gemini API Configuration
GEMINI_API_KEY=your_gemini_api_key_here

# Choose your model (optional, defaults to gemini-1.5-flash)
# Available options:
# - gemini-1.5-flash (fastest, most cost-effective)
# - gemini-1.5-pro (best for complex tasks)
# - gemini-1.0-pro (legacy model)
GEMINI_MODEL=gemini-1.5-flash
```

2. The API endpoint is already configured to use Gemini in `/app/api/combine-images/route.ts`

### How It Works

1. **Image Upload**: Users upload two images through the drag-and-drop interface
2. **Mode Selection**: Users choose a combination mode or provide a custom prompt
3. **Gemini Processing**: The images and prompt are sent to the Gemini API
4. **Analysis**: Gemini analyzes both images and provides detailed descriptions
5. **Result**: The API returns the analysis result

### Important Notes

- **Gemini Capabilities**: Gemini excels at image analysis, understanding, and description but doesn't generate new images
- **Image Generation**: For actual image generation, you would need to:
  - Use Gemini's output as a prompt for an image generation service (like Stable Diffusion)
  - Or wait for Google's Imagen API to become publicly available
  - Or chain Gemini with another image generation API

### Model Selection Guide

| Model | Best For | Speed | Cost |
|-------|----------|-------|------|
| gemini-1.5-flash | Quick responses, simple combinations | Fast | Low |
| gemini-1.5-pro | Complex analysis, detailed descriptions | Medium | Medium |
| gemini-1.0-pro | Legacy support | Medium | Low |

### API Rate Limits

- Free tier: 60 requests per minute
- Paid tier: Higher limits based on your plan
- Consider implementing rate limiting in production

## File Structure

```
/root/futurezxy/
├── app/
│   ├── image-combine/
│   │   └── page.tsx          # Main image combiner page
│   └── api/
│       └── combine-images/
│           └── route.ts       # API endpoint for image processing
├── components/
│   ├── ImageUploader.tsx     # Drag-and-drop image upload component
│   ├── CombinationModeSelector.tsx  # Mode selection component
│   ├── ImagePreview.tsx      # Result preview component
│   └── ui/
│       ├── textarea.tsx      # Text area for custom prompts
│       └── radio-group.tsx   # Radio buttons for mode selection
└── lib/
    └── combination-modes.ts   # Configuration for all combination modes
```

## Usage

### For Background Replacement:
1. Navigate to `/image-combine` or click "AI Image Combiner" in the navigation
2. Upload your subject image (person/object) as Image 1
3. Upload your desired new background as Image 2
4. Select "Replace Background" mode (selected by default)
5. Click "Combine Images" to process
6. View the AI analysis and instructions

### For Photo Combinations (Side by Side, Grids, etc.):
1. Upload your first photo as Image 1
2. Upload your second photo as Image 2
3. Select your preferred layout:
   - **Side by Side**: Horizontal arrangement
   - **Top & Bottom**: Vertical stacking
   - **2x2 Grid**: Pattern creation
   - **Picture in Picture**: Overlay effect
   - **Diagonal Split**: Creative transition
4. Click "Combine Images" to process
5. View the layout description and instructions

### For Creative Combinations:
1. Upload two images using drag-and-drop or click to browse
2. Select a combination mode or use custom prompt
3. Click "Combine Images" to process
4. Download or view the result when ready

### Best Practices for Background Replacement:
- Use images with clear, well-lit subjects
- Simple or contrasting backgrounds work best for removal
- High-resolution images produce better results
- Ensure the new background matches the lighting direction of your subject

## Customization

### Adding New Combination Modes

Edit `/lib/combination-modes.ts`:
```typescript
{
  id: 'new-mode',
  name: 'New Mode Name',
  description: 'What this mode does',
  prompt: 'AI prompt for this mode',
  icon: IconComponent,
  example: 'Example use case'
}
```

### Styling

- Colors and themes: Edit Tailwind classes in components
- Layout: Modify grid classes in `/app/image-combine/page.tsx`
- Animations: Add Tailwind animation classes

## Performance Considerations

- Images are converted to base64 for processing
- Consider implementing image compression before upload
- Add file size limits in production
- Implement rate limiting for API endpoints
- Cache results to avoid reprocessing

## Security Notes

- Validate image formats on server
- Implement file size limits
- Add rate limiting to prevent abuse
- Store API keys securely in environment variables
- Never expose API keys to client-side code

## Next Steps

1. Get your Gemini API key from [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Add `GEMINI_API_KEY` to your `.env` file
3. Optionally set `GEMINI_MODEL` to your preferred model
4. Test the feature with real image combinations
5. Consider chaining Gemini with an image generation service for actual image creation
6. Implement usage tracking and rate limiting for production