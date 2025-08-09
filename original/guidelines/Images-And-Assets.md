# Images and Assets Guidelines

## Image Components

### ImageWithFallback Component
For new images, always use the ImageWithFallback component:

```tsx
import { ImageWithFallback } from './components/figma/ImageWithFallback';

// Usage
<ImageWithFallback 
  src="https://images.unsplash.com/photo-example" 
  alt="Description"
  className="w-full h-auto"
/>
```

**Important:** 
- Do NOT create your own version of ImageWithFallback
- This component works exactly like the `<img>` tag
- Use this instead of the standard `<img>` tag for new images

### Unsplash Images
- Always use Unsplash for photos: `https://images.unsplash.com/`
- Ensure images are relevant to the content
- Use descriptive alt text for accessibility

## Figma Import Assets

### When User Provides Figma Selection
If working with Figma imports, you must use ALL provided images and vectors:

#### Import Syntax for Figma Assets
```tsx
// Images from Figma
import imgA from "figma:asset/76faf8f617b56e6f079c5a7ead8f927f5a5fee32.png";
import imgB from "figma:asset/f2dddff10fce8c5cc0468d3c13d16d6eeadcbdb7.png";

// SVGs from imports directory
import svgPaths from "./imports/svg-wg56ef214f";
```

#### Usage Rules for Figma Assets
- Images are importable through `figma:asset` paths
- Use ESM imports for all images and SVGs
- Do NOT create your own versions of the SVGs
- Always use the directly imported SVGs
- If user has imported an image that fulfills the same purpose, use that instead of ImageWithFallback

## SVG Handling

### Figma Imported SVGs
- SVGs from Figma will be in the `/imports` directory
- Import them exactly as provided
- Do not create your own versions
- Use the imported SVG components directly

```tsx
import { MySvgIcon } from "./imports/svg-component";

// Usage
<MySvgIcon className="w-6 h-6" />
```

### Custom SVGs
For non-Figma SVGs, you can:
- Create inline SVG components
- Import SVG files as React components
- Use SVG icon libraries like Lucide React

## Asset Organization

### File Structure
```
/imports/           - Figma imported assets
/components/figma/  - Figma-specific components (protected)
/public/           - Static assets (if needed)
```

### Naming Conventions
- Use descriptive names for assets
- Follow kebab-case for file names
- Include size or purpose in name when relevant

## Accessibility Guidelines

### Alt Text
- Always provide meaningful alt text
- Describe the content/purpose, not the appearance
- Use empty alt="" for decorative images

### Responsive Images
```tsx
<ImageWithFallback
  src="https://images.unsplash.com/photo-example"
  alt="Detailed description"
  className="w-full h-auto object-cover"
/>
```

### Performance Considerations
- Use appropriate image sizes
- Consider lazy loading for images below the fold
- Optimize image formats when possible

## Common Use Cases

### Hero Images
```tsx
<div className="relative h-64 overflow-hidden">
  <ImageWithFallback
    src="https://images.unsplash.com/photo-hero-image"
    alt="Hero image description"
    className="w-full h-full object-cover"
  />
</div>
```

### Avatar Images
```tsx
import { Avatar, AvatarImage, AvatarFallback } from "./components/ui/avatar";

<Avatar>
  <AvatarImage src="https://images.unsplash.com/photo-portrait" />
  <AvatarFallback>JD</AvatarFallback>
</Avatar>
```

### Background Images
```tsx
<div 
  className="h-64 bg-cover bg-center"
  style={{
    backgroundImage: "url('https://images.unsplash.com/photo-background')"
  }}
>
  Content overlay
</div>
```

## Error Handling
- ImageWithFallback component handles loading states automatically
- Always provide fallback content for critical images
- Consider loading placeholders for better UX