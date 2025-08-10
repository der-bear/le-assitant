// Shared types and interfaces for UI modules

export type Action = { 
  id: string; 
  label: string; 
  variant?: 'default' | 'secondary' | 'ghost'; 
  disabled?: boolean; 
};

/**
 * Base interface that all UI modules should extend
 * Contains common props for consistent behavior across modules
 */
export interface BaseModule {
  /** Optional unique identifier for the module instance */
  id?: string;
  
  /** Module title displayed in header */
  title?: string;
  
  /** Module description/subtitle displayed below title */
  description?: string;
  
  /** Optional help URL - shows help icon when provided */
  helpUrl?: string;
  
  /** Loading state - shows loading skeleton when true */
  loading?: boolean;
  
  /** Error message - shows error alert when provided */
  error?: string;
  
  /** Empty state message - shows when no content available */
  empty?: string;
  
  /** Action buttons displayed at bottom of module */
  actions?: Action[];
  
  /** Module type identifier for runtime detection */
  kind: string;
}

/**
 * Extended base for modules that support locking/disabling
 */
export interface LockableModule extends BaseModule {
  /** Whether the module is disabled (grayed out but visible) */
  disabled?: boolean;
  
  /** Whether the module is locked (grayed out with pointer-events-none) */
  locked?: boolean;
}

/**
 * Common callback interfaces
 */
export interface ModuleCallbacks {
  onAction?: (actionId: string, data?: any) => void;
}

/**
 * Typography scale constants for consistent text sizing
 */
export const TYPOGRAPHY = {
  // Module headers
  moduleTitle: 'text-base font-medium leading-tight',
  moduleDescription: 'text-sm text-muted-foreground font-normal leading-relaxed',
  
  // Section headers within modules
  sectionTitle: 'text-sm font-medium',
  sectionDescription: 'text-xs text-muted-foreground',
  
  // Content text
  bodyText: 'text-sm',
  captionText: 'text-xs text-muted-foreground',
  
  // Large headers (for main module titles)
  largeTitle: 'text-lg font-medium',
} as const;

/**
 * Spacing constants for consistent layout
 */
export const SPACING = {
  // Vertical spacing
  moduleSpacing: 'space-y-6',
  sectionSpacing: 'space-y-4', 
  contentSpacing: 'space-y-2',
  tightSpacing: 'space-y-1',
  
  // Header gaps
  headerGap: 'gap-1',
  contentGap: 'gap-2',
  
  // Responsive gaps for card grids
  cardGaps: 'gap-2 sm:gap-3 md:gap-4',
} as const;