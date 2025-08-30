import { Users, Palette, Layers, Replace, Camera, Sparkles, Blend, Wand2, Image, Grid3x3, Columns, Square, PanelTop } from 'lucide-react'

export const combinationModes = [
  {
    id: 'background-replace',
    name: 'Replace Background',
    description: 'Remove background from image 1 and replace with image 2',
    prompt: 'Remove the background from the first image (keeping the main subject/person) and place them naturally into the second image as the new background. Ensure proper lighting, shadows, and scale to make it look realistic',
    icon: Image,
    example: 'Portrait + scenic landscape = person in landscape',
    featured: true
  },
  {
    id: 'place-person',
    name: 'Place Person in Scene',
    description: 'Put the person from image 1 into the scene of image 2',
    prompt: 'Place the person from the first image naturally into the background scene of the second image, maintaining proper scale and lighting',
    icon: Users,
    example: 'Person at the beach, person in a city'
  },
  {
    id: 'face-swap',
    name: 'Face Swap',
    description: 'Swap faces between two people',
    prompt: 'Swap the faces between the two people in the images while maintaining natural appearance',
    icon: Replace,
    example: 'Exchange faces between two portraits'
  },
  {
    id: 'style-transfer',
    name: 'Style Transfer',
    description: 'Apply the artistic style of image 2 to image 1',
    prompt: 'Apply the artistic style, colors, and textures from the second image to the content of the first image',
    icon: Palette,
    example: 'Photo + Van Gogh painting style'
  },
  {
    id: 'blend-scenes',
    name: 'Blend Scenes',
    description: 'Seamlessly blend two scenes together',
    prompt: 'Create a seamless blend between the two images, merging them into one cohesive scene',
    icon: Blend,
    example: 'Sunset + cityscape = city at sunset'
  },
  {
    id: 'double-exposure',
    name: 'Double Exposure',
    description: 'Create an artistic double exposure effect',
    prompt: 'Create a double exposure effect combining both images artistically, typically with one as silhouette',
    icon: Layers,
    example: 'Portrait + forest = person filled with trees'
  },
  {
    id: 'object-replace',
    name: 'Replace Object',
    description: 'Replace main object in image 1 with object from image 2',
    prompt: 'Replace the main subject or object in the first image with the main subject from the second image',
    icon: Camera,
    example: 'Car on road + sports car = sports car on road'
  },
  {
    id: 'side-by-side',
    name: 'Side by Side',
    description: 'Place two photos next to each other horizontally',
    prompt: 'Combine these two images side by side horizontally with a clean border or seamless blend between them',
    icon: Columns,
    example: 'Before/after comparison, photo pairs',
    featured: true
  },
  {
    id: 'top-bottom',
    name: 'Top & Bottom',
    description: 'Stack two photos vertically',
    prompt: 'Combine these two images vertically, one on top and one on bottom, with a clean transition',
    icon: PanelTop,
    example: 'Sky and ground, reflection effects'
  },
  {
    id: 'grid-2x2',
    name: '2x2 Grid',
    description: 'Create a 2x2 grid with both images',
    prompt: 'Create a 2x2 grid layout using these two images, duplicating them to fill all four quadrants in an aesthetically pleasing arrangement',
    icon: Grid3x3,
    example: 'Photo montage, pattern creation'
  },
  {
    id: 'picture-in-picture',
    name: 'Picture in Picture',
    description: 'Place image 2 as a smaller overlay on image 1',
    prompt: 'Place the second image as a smaller picture-in-picture overlay on the first image, positioned in a corner or as an inset',
    icon: Square,
    example: 'Reaction videos, comparison shots'
  },
  {
    id: 'diagonal-split',
    name: 'Diagonal Split',
    description: 'Combine photos with a diagonal divider',
    prompt: 'Combine these two images with a diagonal split, creating an interesting visual transition between them',
    icon: Layers,
    example: 'Creative transitions, dual perspectives'
  },
  {
    id: 'collage',
    name: 'Creative Collage',
    description: 'Create an artistic collage from both images',
    prompt: 'Create a creative collage that artistically combines elements from both images with overlapping, varying sizes, and creative arrangements',
    icon: Sparkles,
    example: 'Artistic compositions, memory boards'
  },
  {
    id: 'custom',
    name: 'Custom Prompt',
    description: 'Describe exactly what you want',
    prompt: '',
    icon: Wand2,
    example: 'Your imagination is the limit!'
  }
]