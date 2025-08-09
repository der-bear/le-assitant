# React Components Guidelines

## General Component Rules

### File Structure
- Create multiple React components and place them in the `/components` directory
- Import components with: `import { ComponentName } from "./components/component-name.tsx"`
- Only create new `.tsx` files
- Feel free to create multiple React components instead of writing all code in `/App.tsx`

### Component Architecture
- `/App.tsx` must have a default export
- `/App.tsx` should be the main component file
- Prefer generating multiple components and using them in `/App.tsx`
- Keep file sizes small and put helper functions and components in their own files

### Key Props and Lists
- Always provide a unique `key` prop for each element in a list
- When using arrays of data, each item should have a unique identifier
- Use that unique identifier as the `key` when rendering

### ShadCN Component Integration
- For ShadCN imports, use this format: `import { AspectRatio } from "./components/ui/aspect-ratio"`
- Do NOT create your own versions of ShadCN components
- Feel free to modify ShadCN components in small ways as needed
- The `components/ui` directory is only for Shadcn components
- Do not create new files in the `components/ui` directory

## Protected Files

### System Files
These files are protected and must not be created or modified:
- `/components/figma/ImageWithFallback.tsx`

## Component Creation Best Practices

### Structure
- Keep components focused and single-responsibility
- Use descriptive component names
- Organize related components in subdirectories when appropriate

### State Management
- Use React hooks appropriately
- Keep state as close to where it's used as possible
- Consider prop drilling vs context for state sharing

### Performance
- Use React.memo() for expensive components that re-render frequently
- Implement proper dependency arrays for useEffect and useMemo
- Avoid creating objects/functions in render methods

## Example Component Structure

```tsx
import { useState, useEffect } from 'react';
import { Button } from './components/ui/button';

export function ExampleComponent() {
  const [state, setState] = useState('');

  return (
    <div className="p-4">
      <Button onClick={() => setState('clicked')}>
        Click me
      </Button>
    </div>
  );
}
```