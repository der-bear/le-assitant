# Claude Code Instructions for LeadExec Assistant

## Project Overview
This is a React + TypeScript application for LeadExec AI Assistant - a conversational chat interface with embeddable UI modules for client management.

## Key Technologies
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS** with custom color system using oklch colors
- **shadcn/ui** components library
- **Lucide React** for icons

## Project Structure
```
/components/
  /ui/           - Base shadcn/ui components
  /ui-modules/   - Custom business logic modules (Table, Form, Steps, etc.)
/styles/
  globals.css    - Tailwind config and custom utilities
/services/       - API and utility services
/guidelines/     - IMPORTANT: Development guidelines and best practices (must read)
/original/       - Reference implementation (do not modify)
```

## Important Implementation Details

### Styling
- Use Tailwind CSS classes for all styling
- Custom opacity utilities are defined in globals.css for colors like `bg-muted/25`
- Hover effects require corresponding utilities in globals.css
- Use `transition-colors` with hover states for smooth transitions

### Component Patterns
- All UI modules follow a consistent prop interface with `kind`, `title`, `description`
- Components support `locked` and `disabled` states
- Use `useCallback` and `useMemo` for performance optimization

### Chat Flow Management
- ConversationalChat component manages the main chat interface
- Uses `completedSteps` Set to track workflow progress
- `currentStep` state tracks the active step
- Start Over functionality must clear both `completedSteps` and `currentStep`
- Components check both completed status AND current step for locking

### Common Issues & Solutions

#### Table Hover Effects
- Ensure hover utilities exist in globals.css
- Pattern: `.hover\:bg-muted\/25:hover { background-color: color-mix(in oklch, var(--muted) 25%, transparent); }`

#### Module Locking
- Components should be locked only if: `completedSteps.has(stepId) && currentStep !== stepId`
- Start Over must reset: flow state, completed steps, current step, and update existing messages

## Development Commands
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm run preview    # Preview production build
```

## Testing Checklist
- [ ] Test Start Over button clears all locked states
- [ ] Verify hover effects work on interactive elements
- [ ] Check responsive design on mobile viewports
- [ ] Ensure chat flow progresses correctly
- [ ] Validate form derivation logic works

## Code Style & Guidelines

### Must Read Guidelines
The project has comprehensive guidelines in the `/guidelines` directory:

- **[General-Development.md](./guidelines/General-Development.md)** - Overall development practices
- **[Guidelines.md](./guidelines/Guidelines.md)** - Main project guidelines
- **[React-Components.md](./guidelines/React-Components.md)** - React component best practices
- **[ShadCN-Components.md](./guidelines/ShadCN-Components.md)** - shadcn/ui component usage
- **[Styling-Guidelines.md](./guidelines/Styling-Guidelines.md)** - CSS and Tailwind styling rules
- **[Library-Guidelines.md](./guidelines/Library-Guidelines.md)** - Third-party library usage
- **[Images-And-Assets.md](./guidelines/Images-And-Assets.md)** - Asset management

### Key Principles
- Use descriptive variable names
- Keep components focused and single-purpose
- Extract complex logic into custom hooks
- Add TypeScript types for all props and state
- Follow existing patterns in the codebase
- Always refer to guidelines before implementing new features

## Known Configuration
- Vite config uses React plugin
- Tailwind configured with custom theme tokens
- TypeScript strict mode enabled
- Development server typically runs on port 5173

## Future Improvements
- Add comprehensive error handling
- Implement proper loading states
- Add accessibility attributes (ARIA labels)
- Consider adding unit tests for critical flows