# Styling and Tailwind Guidelines

## Core Typography Rules

### IMPORTANT: Font Restrictions
- **Do NOT output any Tailwind classes for:**
  - Font size (e.g. `text-2xl`)
  - Font weight (e.g. `font-bold`) 
  - Line-height (e.g. `leading-none`)

**Exception:** Only use these classes if the user specifically asks to change typography.

### Reason
We have default typography setup for each HTML element in the `styles/globals.css` file and you must not override it unless requested.

## Design System Tokens

### Base Settings
- Base font-size: `14px` (defined as `--font-size: 14px`)
- Font weights available:
  - Normal: `var(--font-weight-normal)` (400)
  - Medium: `var(--font-weight-medium)` (500)

### Color System
Use the CSS custom properties defined in `globals.css`:
- `--background`, `--foreground`
- `--primary`, `--primary-foreground`
- `--secondary`, `--secondary-foreground`
- `--muted`, `--muted-foreground`
- `--accent`, `--accent-foreground`
- `--destructive`, `--destructive-foreground`
- `--border`, `--input`, `--ring`

### Border Radius
- Small: `--radius-sm`
- Medium: `--radius-md`
- Large: `--radius-lg`
- Extra Large: `--radius-xl`

## Layout Best Practices

### Responsive Design
- Use Flexbox and CSS Grid by default
- Only use absolute positioning when necessary
- Opt for responsive and well-structured layouts
- Make applications responsive unless it doesn't make sense to do so

### Common Layout Patterns
```tsx
// Centering content
<div className="size-full flex items-center justify-center">
  Content
</div>

// Card layout
<div className="p-4 bg-card border rounded-lg">
  Card content
</div>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  Grid items
</div>
```

## Dark Mode Support

The system includes automatic dark mode support via the `.dark` class:
- All color tokens automatically switch between light and dark variants
- Use semantic color names rather than specific colors
- Test components in both light and dark modes

## CSS File Rules

### Global Styles
- Do not update tokens in `styles/globals.css` unless user asks for specific design style
- Do not create a `tailwind.config.js` file (using Tailwind v4.0)

### Custom Styles
- If user specifies a style, look at classes and tokens in `styles/globals.css`
- Create and apply a cohesive style system based on the request
- Use CSS custom properties for consistency

## Typography Hierarchy

Default typography is handled automatically:
- `h1`: Large heading with medium weight
- `h2`: Extra large with medium weight  
- `h3`: Large with medium weight
- `h4`: Base size with medium weight
- `p`: Base size with normal weight
- `label`: Base size with medium weight
- `button`: Base size with medium weight
- `input`: Base size with normal weight

All have consistent `line-height: 1.5`