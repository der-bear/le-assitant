import React from 'react';
import { ModuleHeader, ModuleHeaderProps } from './ModuleHeader';
import { ModuleError, ModuleEmpty, ModuleActions } from './ModuleStates';
import { BaseModule, ModuleCallbacks, SPACING } from './types';

export interface ModuleContainerProps extends BaseModule, ModuleCallbacks {
  children: React.ReactNode;
  
  /** Header configuration override */
  headerProps?: Partial<ModuleHeaderProps>;
  
  /** Whether to show the header section */
  showHeader?: boolean;
  
  /** Whether to show error/empty states */
  showStates?: boolean;
  
  /** Whether to show actions section */
  showActions?: boolean;
  
  /** Custom container className */
  containerClassName?: string;
}

/**
 * Container component that provides standard module layout
 * Handles header, error states, content, and actions consistently
 */
export function ModuleContainer({
  // BaseModule props
  id,
  title,
  description,
  helpUrl,
  loading = false,
  error,
  empty,
  actions = [],
  
  // ModuleCallbacks
  onAction,
  
  // Container-specific props
  children,
  headerProps,
  showHeader = true,
  showStates = true,
  showActions = true,
  containerClassName,
  
  // Additional props for locked modules
  disabled = false,
  locked = false,
  ...rest
}: ModuleContainerProps & { disabled?: boolean; locked?: boolean }) {
  // Provide default description if none is given  
  const effectiveDescription = description || (title ? "Step-by-step progress tracker with status indicators" : undefined);
  
  const containerClasses = containerClassName || SPACING.moduleSpacing;
  const lockingClasses = locked ? 'opacity-60 pointer-events-none' : '';
  
  return (
    <div 
      className={`${containerClasses} ${lockingClasses}`}
      {...(id && { id })}
    >
      {/* Header */}
      {showHeader && (
        <ModuleHeader
          title={title}
          description={effectiveDescription}
          helpUrl={helpUrl}
          {...headerProps}
        />
      )}

      {/* Error State */}
      {showStates && <ModuleError error={error} />}

      {/* Empty State */}
      {showStates && <ModuleEmpty empty={empty} />}

      {/* Main Content */}
      {children}

      {/* Actions */}
      {showActions && (
        <ModuleActions
          actions={actions}
          loading={loading}
          disabled={disabled}
          locked={locked}
          onAction={onAction}
        />
      )}
    </div>
  );
}