# Universal Modules Framework - Detailed Specifications

## Framework Philosophy

The Universal Modules Framework consists of 7 core components designed to handle 90% of interface scenarios with simple, flexible APIs that AI agents can easily understand and configure. Each module follows consistent patterns and can adapt to different contexts without complexity.

## Design Principles

### 1. Simplicity First
- **Minimal Props**: Only essential configuration options
- **Clear APIs**: Self-documenting prop names and types
- **No Hidden Complexity**: All behavior is explicit and predictable

### 2. AI Agent Friendly
- **Descriptive Props**: Property names that clearly indicate their purpose
- **Flexible Data Structures**: Accept various data formats gracefully
- **Example-Driven**: Easy to understand through simple examples

### 3. Visual Consistency
- **Shared Design System**: All modules use the same design tokens
- **Consistent Spacing**: Standard padding, margins, and gap patterns
- **Unified Typography**: Consistent text sizing and weight hierarchy

### 4. Responsive by Default
- **Mobile-First**: Optimized for mobile and scales up
- **Flexible Layouts**: Adapts to different container sizes
- **Accessible**: Full keyboard navigation and screen reader support

---

## Module 1: SimpleForm

### Purpose
Handles any input collection scenario from single field forms to complex multi-step forms with validation and submission.

### Core API
```typescript
interface SimpleFormProps {
  title?: string;
  description?: string;
  fields: FormField[];
  onSubmit: (data: Record<string, any>) => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  className?: string;
}

interface FormField {
  id: string;
  label: string;
  type: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea' | 'select' | 'checkbox' | 'date';
  required?: boolean;
  placeholder?: string;
  value?: any;
  options?: { value: string; label: string }[]; // For select fields
  validation?: (value: any) => string | null;
}
```

### Key Features
- **Field Types**: All common HTML input types plus textarea and select
- **Validation**: Built-in required validation plus custom validation functions
- **Auto-Focus**: Automatic focus management for better UX
- **Loading States**: Built-in loading spinner for submission states
- **Error Handling**: Field-level and form-level error display

### Usage Scenarios
- Client registration forms
- Settings configuration
- Search and filter forms
- Contact information collection
- Delivery method configuration

### Visual Design
- **Header**: Optional title and description with consistent typography
- **Fields**: Stacked layout with proper spacing and visual hierarchy
- **Actions**: Right-aligned submit/cancel buttons with loading states
- **Validation**: Inline error messages with destructive color styling

---

## Module 2: VerticalCards

### Purpose
Visual option selection with 1-4 cards, supporting single or multiple selection modes with rich content display.

### Core API
```typescript
interface VerticalCardsProps {
  title?: string;
  description?: string;
  options: CardOption[];
  selectionMode: 'single' | 'multiple';
  onSelect: (selectedIds: string[]) => void;
  selectedIds?: string[];
  maxSelections?: number; // For multiple mode
  required?: boolean;
  className?: string;
}

interface CardOption {
  id: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  badge?: string;
  disabled?: boolean;
  price?: string;
  features?: string[];
}
```

### Key Features
- **Visual Selection**: Large, clear cards with hover and selected states
- **Rich Content**: Icons, badges, prices, and feature lists
- **Selection Modes**: Single selection (radio) or multiple selection (checkbox)
- **Selection Limits**: Maximum number of selections for multiple mode
- **Visual Feedback**: Clear selected/unselected states with animation

### Usage Scenarios
- Delivery method selection (email, webhook, FTP)
- Plan or tier selection
- Feature option selection
- Client type selection
- Integration service selection

### Visual Design
- **Layout**: Responsive grid (1 column mobile, 2-4 columns desktop)
- **Cards**: Elevated cards with clear selection indicators
- **Content**: Icon at top, title, description, badge, optional price/features
- **States**: Hover, selected, disabled with appropriate visual feedback

---

## Module 3: RadioGroup

### Purpose
Single selection from a list of options, ideal for questions with 3+ choices where visual cards would be too heavy.

### Core API
```typescript
interface RadioGroupProps {
  title?: string;
  description?: string;
  options: RadioOption[];
  value?: string;
  onValueChange: (value: string) => void;
  required?: boolean;
  layout?: 'vertical' | 'horizontal';
  className?: string;
}

interface RadioOption {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
}
```

### Key Features
- **List Layout**: Compact vertical or horizontal list format
- **Clear Selection**: Radio button indicators with consistent styling
- **Optional Descriptions**: Secondary text for clarification
- **Keyboard Navigation**: Full arrow key navigation support

### Usage Scenarios
- Lead delivery frequency (immediate, hourly, daily)
- Data format selection (JSON, XML, CSV)
- Priority levels (low, medium, high, critical)
- Status filters (active, inactive, pending)
- Sort order options

### Visual Design
- **Option Layout**: Radio button + label + optional description
- **Spacing**: Consistent vertical/horizontal spacing between options
- **Typography**: Label uses medium weight, description uses normal weight
- **Focus States**: Clear keyboard focus indicators

---

## Module 4: CheckboxGroup

### Purpose
Multiple selection from a list with optional limits and grouping, perfect for filters and feature selection.

### Core API
```typescript
interface CheckboxGroupProps {
  title?: string;
  description?: string;
  options: CheckboxOption[];
  selectedIds?: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  maxSelections?: number;
  minSelections?: number;
  layout?: 'vertical' | 'horizontal' | 'grid';
  className?: string;
}

interface CheckboxOption {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
  category?: string; // For grouping
}
```

### Key Features
- **Multi-Selection**: Choose multiple options with visual feedback
- **Selection Limits**: Minimum and maximum selection constraints
- **Category Grouping**: Optional grouping with section headers
- **Smart Validation**: Real-time feedback on selection limits

### Usage Scenarios
- Client tag selection
- Feature filtering
- Lead field selection
- Permission settings
- Report criteria selection

### Visual Design
- **Option Layout**: Checkbox + label + optional description
- **Grouping**: Category headers with subtle separator lines
- **Limit Feedback**: Counter showing selected/max selections
- **Grid Layout**: Responsive grid for many options

---

## Module 5: SimpleTable

### Purpose
Data display with sorting, filtering, and actions. Handles any tabular data with flexible column configuration.

### Core API
```typescript
interface SimpleTableProps {
  title?: string;
  description?: string;
  columns: TableColumn[];
  data: Record<string, any>[];
  onRowAction?: (action: string, row: Record<string, any>) => void;
  onSort?: (columnKey: string, direction: 'asc' | 'desc') => void;
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  loading?: boolean;
  emptyMessage?: string;
  maxHeight?: string;
  className?: string;
}

interface TableColumn {
  key: string;
  label: string;
  type?: 'text' | 'number' | 'date' | 'badge' | 'action';
  sortable?: boolean;
  width?: string;
  render?: (value: any, row: Record<string, any>) => React.ReactNode;
}
```

### Key Features
- **Flexible Columns**: Text, numbers, dates, badges, and custom renders
- **Sorting**: Click column headers to sort ascending/descending
- **Row Actions**: Configurable actions (edit, delete, view, etc.)
- **Loading States**: Skeleton loading for async data
- **Empty States**: Customizable empty state messaging
- **Responsive**: Horizontal scroll on mobile, priority column ordering

### Usage Scenarios
- Client listing and management
- Lead data display
- Revenue reports
- User management
- Activity logs

### Visual Design
- **Header**: Sortable columns with arrow indicators
- **Rows**: Alternating background colors for readability
- **Actions**: Right-aligned action buttons or dropdown
- **Loading**: Skeleton rows maintaining layout
- **Scrolling**: Fixed header with scrollable body

---

## Module 6: SimpleInsights

### Purpose
Display metrics, progress bars, and alerts in a unified dashboard-style component.

### Core API
```typescript
interface SimpleInsightsProps {
  title?: string;
  description?: string;
  metrics?: Metric[];
  progress?: ProgressItem[];
  alerts?: Alert[];
  layout?: 'stacked' | 'grid';
  className?: string;
}

interface Metric {
  id: string;
  label: string;
  value: number | string;
  type?: 'number' | 'currency' | 'percentage';
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  target?: number;
}

interface ProgressItem {
  id: string;
  label: string;
  value: number;
  target: number;
  color?: string;
}

interface Alert {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  dismissible?: boolean;
  action?: { label: string; onClick: () => void };
}
```

### Key Features
- **Metric Display**: Numbers, currency, percentages with trend indicators
- **Progress Bars**: Visual progress toward goals with color coding
- **Alert System**: Different alert types with optional actions
- **Flexible Layout**: Stacked for narrow spaces, grid for dashboards
- **Trend Indicators**: Up/down arrows with color coding

### Usage Scenarios
- Dashboard overviews
- Client performance metrics
- System status displays
- Goal tracking
- Warning and notification systems

### Visual Design
- **Metrics**: Large numbers with smaller labels and trend indicators
- **Progress**: Labeled progress bars with percentage and target values
- **Alerts**: Color-coded alert boxes with icons and optional actions
- **Grid Layout**: Responsive grid adapting to container width

---

## Module 7: Progress

### Purpose
Step-by-step workflow tracking with visual progress indicators and interactive navigation.

### Core API
```typescript
interface ProgressProps {
  title?: string;
  description?: string;
  steps: ProgressStep[];
  onStepClick?: (stepId: string) => void;
  className?: string;
}

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'locked';
  icon?: React.ReactNode;
}
```

### Key Features
- **Visual Progress**: Clear completed/current/locked step indicators
- **Interactive Navigation**: Click completed or current steps to navigate
- **Custom Icons**: Optional custom icons for steps
- **Status Badges**: Current step highlighted with badge
- **Responsive**: Works in narrow sidebars or wide content areas

### Usage Scenarios
- Multi-step client setup
- Onboarding workflows
- Configuration wizards
- Approval processes
- Tutorial progressions

### Visual Design
- **Step Indicators**: Circular indicators with numbers, checkmarks, or locks
- **Content**: Step title and description with status-based styling
- **Progress Line**: Visual connection between steps (optional)
- **Interactive States**: Hover effects for clickable steps
- **Current Badge**: "Current" badge for active step

---

## Framework Usage Guidelines

### 1. Module Selection
- **SimpleForm**: When you need to collect any kind of input
- **VerticalCards**: For 1-4 visual options with rich content
- **RadioGroup**: For 3+ simple single-choice options
- **CheckboxGroup**: For multiple selection with optional limits
- **SimpleTable**: For any tabular data display
- **SimpleInsights**: For metrics, progress, and status information
- **Progress**: For multi-step processes and workflows

### 2. Consistent Patterns
- **Titles and Descriptions**: Always use consistent heading hierarchy
- **Loading States**: Handle async operations with loading indicators
- **Error States**: Provide clear error messages and recovery options
- **Empty States**: Include helpful empty state messages
- **Accessibility**: Ensure all modules are keyboard navigable and screen reader friendly

### 3. AI Agent Implementation
- **Start Simple**: Begin with minimal required props
- **Add Complexity Gradually**: Add optional props as needed
- **Use Examples**: Reference common usage patterns
- **Test Thoroughly**: Verify all edge cases and error states

### 4. Customization Guidelines
- **Prefer Props Over CSS**: Use provided props instead of custom CSS
- **Consistent Spacing**: Use Tailwind spacing utilities when needed
- **Color System**: Stick to design system colors
- **Typography**: Follow established text size and weight patterns

This framework provides a solid foundation for building complex interfaces through simple, composable modules that AI agents can easily understand and configure for any use case.