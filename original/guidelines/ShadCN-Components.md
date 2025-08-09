# ShadCN Components Reference

## Available Components

The following shadcn components are available in the `/components/ui` directory:

### Form & Input Components
- **button.tsx** - Displays a button or a component that looks like a button
- **input.tsx** - Displays a form input field or a component that looks like an input field
- **textarea.tsx** - Displays a form textarea or a component that looks like a textarea
- **checkbox.tsx** - A control that allows the user to toggle between checked and not checked
- **radio-group.tsx** - A set of checkable buttons where no more than one can be checked at a time
- **select.tsx** - Displays a list of options for the user to pick from—triggered by a button
- **slider.tsx** - An input where the user selects a value from within a given range
- **switch.tsx** - A control that allows the user to toggle between checked and not checked
- **form.tsx** - Building forms with React Hook Form and Zod
- **label.tsx** - Renders an accessible label associated with controls
- **input-otp.tsx** - Accessible one-time password component with copy paste functionality

### Layout & Structure
- **card.tsx** - Displays a card with header, content, and footer
- **separator.tsx** - Visually or semantically separates content
- **aspect-ratio.tsx** - Displays content within a desired ratio
- **resizable.tsx** - Accessible resizable panel groups and layouts with keyboard support
- **scroll-area.tsx** - Augments native scroll functionality for custom, cross-browser styling
- **table.tsx** - A responsive table component
- **sidebar.tsx** - A composable, themeable and customizable sidebar component

### Navigation Components
- **tabs.tsx** - A set of layered sections of content that are displayed one at a time
- **breadcrumb.tsx** - Displays the path to the current resource using a hierarchy of links
- **navigation-menu.tsx** - A collection of links for navigating websites
- **menubar.tsx** - A visually persistent menu common in desktop applications
- **pagination.tsx** - Pagination with page navigation, next and previous links

### Overlay Components
- **dialog.tsx** - A window overlaid on the primary window, rendering content underneath inert
- **alert-dialog.tsx** - A modal dialog that interrupts the user with important content
- **sheet.tsx** - Extends the Dialog component to display content that complements the main content
- **drawer.tsx** - For slide-in panels
- **popover.tsx** - Displays rich content in a portal, triggered by a button
- **tooltip.tsx** - A popup that displays information related to an element when focused or hovered

### Menu Components
- **dropdown-menu.tsx** - Displays a menu to the user triggered by a button
- **context-menu.tsx** - Displays a context menu triggered by right-click or long press
- **command.tsx** - Fast, composable, unstyled command menu for React

### Feedback Components
- **alert.tsx** - For notification messages
- **sonner.tsx** - For toast notifications
- **progress.tsx** - Displays an indicator showing completion progress of a task
- **skeleton.tsx** - Use to show a placeholder while content is loading
- **badge.tsx** - Displays a badge or a component that looks like a badge

### Interactive Components
- **accordion.tsx** - A vertically stacked set of interactive headings that reveal content sections
- **collapsible.tsx** - An interactive component which expands/collapses a panel
- **carousel.tsx** - A carousel with motion and swipe built using Embla
- **hover-card.tsx** - For sighted users to preview content available behind a link
- **toggle.tsx** - A two-state button that can be either on or off
- **toggle-group.tsx** - A set of two-state buttons that can be toggled on or off

### Data Display
- **avatar.tsx** - An image element with a fallback for representing the user
- **calendar.tsx** - A date field component that allows users to enter and edit date
- **chart.tsx** - Beautiful charts built using Recharts

## Usage Guidelines

### Import Syntax
Always use this format for ShadCN imports:
```tsx
import { AspectRatio } from "./components/ui/aspect-ratio";
import { Button } from "./components/ui/button";
import { Card, CardHeader, CardContent } from "./components/ui/card";
```

### Component Modification
- Do NOT create your own versions of ShadCN components
- Feel free to modify them in small ways as needed
- Extend functionality through composition rather than recreation

### File Management
- Be careful not to overwrite existing Shadcn components
- The `components/ui` directory is only for Shadcn components
- Do not create new files in this directory

## Example Usage

```tsx
import { Button } from "./components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "./components/ui/card";
import { Input } from "./components/ui/input";

export function ExampleComponent() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>Example Form</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input placeholder="Enter your name" />
        <Button className="w-full">Submit</Button>
      </CardContent>
    </Card>
  );
}
```