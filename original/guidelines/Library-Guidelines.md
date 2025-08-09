# Library Guidelines

## Import Syntax

### Standard Libraries
For most libraries, use the standard import syntax without specifying versions:
```tsx
import { ... } from 'package'
```

### Version-Specific Libraries
Some libraries require specific versions. Use this syntax:
```tsx
import { ... } from 'package@version'
```

#### Required Version Specifications:
- **react-hook-form**: `import { ... } from 'react-hook-form@7.55.0'`
- **sonner**: `import { toast } from "sonner@2.0.3"`

## Recommended Libraries

### UI & Components
- **shadcn/ui** - Available in `/components/ui` (see ShadCN Components documentation)
- **lucide-react** - For icons

### Data Visualization
- **recharts** - For charts and graphs

### UI Interactions
- **react-slick** - For carousels
- **react-responsive-masonry** - For Masonry grids
- **react-dnd** - For drag and drop interaction
- **popper.js** - For popovers and positioning

### Animation
- **motion/react** - For general animation
  - Import: `import { motion } from 'motion/react'`
  - Always call it "Motion" (not "Framer Motion")
  - Anything that worked with Framer Motion will work with Motion

### Layout & Resizing
- **re-resizable** - For resizable components
  - ❌ Do NOT use `react-resizable` (doesn't work in this environment)
  - ✅ Use `re-resizable` instead

### Canvas & Drawing
- For canvas-based drawing requests, use HTML5 Canvas directly
- ❌ Do NOT use konva react package (not supported)

## Library-Specific Guidelines

### Toast Notifications (Sonner)
```tsx
import { toast } from "sonner@2.0.3";

// Usage
toast("Hello World");
toast.success("Success message");
toast.error("Error message");
```

### Motion/React Animation
```tsx
import { motion } from 'motion/react';

// Usage
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  transition={{ duration: 0.5 }}
>
  Animated content
</motion.div>
```

### React Hook Form
```tsx
import { useForm } from 'react-hook-form@7.55.0';

export function MyForm() {
  const { register, handleSubmit } = useForm();
  
  return (
    <form onSubmit={handleSubmit(data => console.log(data))}>
      <input {...register('name')} />
      <button type="submit">Submit</button>
    </form>
  );
}
```

### Recharts
```tsx
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';

const data = [
  { name: 'Jan', value: 400 },
  { name: 'Feb', value: 300 }
];

<LineChart width={400} height={300} data={data}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="name" />
  <YAxis />
  <Tooltip />
  <Legend />
  <Line type="monotone" dataKey="value" stroke="#8884d8" />
</LineChart>
```

### Re-resizable
```tsx
import { Resizable } from 're-resizable';

<Resizable
  defaultSize={{ width: 200, height: 200 }}
  minWidth={100}
  minHeight={100}
>
  Resizable content
</Resizable>
```

## Best Practices

### Library Selection
- Always check if a ShadCN component exists before importing external libraries
- Prefer battle-tested libraries with good TypeScript support
- Use libraries that are commonly used in the React ecosystem

### Performance Considerations
- Import only what you need: `import { specificFunction } from 'library'`
- Avoid importing entire libraries when possible
- Use dynamic imports for heavy libraries when appropriate

### Version Management
- Only specify versions when required by the system
- Let the environment handle version resolution for standard packages
- Document any specific version requirements in comments when necessary