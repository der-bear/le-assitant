import React from 'react';
import { Alert, AlertDescription } from '../../ui/alert';
import { Button } from '../../ui/button';
import { Action } from './types';

export interface ModuleErrorProps {
  error?: string;
}

export interface ModuleEmptyProps {
  empty?: string;
}

export interface ModuleActionsProps {
  actions?: Action[];
  loading?: boolean;
  disabled?: boolean;
  locked?: boolean;
  onAction?: (actionId: string, data?: any) => void;
}

/**
 * Standardized error state component
 */
export function ModuleError({ error }: ModuleErrorProps) {
  if (!error) return null;
  
  return (
    <Alert variant="destructive">
      <AlertDescription>{error}</AlertDescription>
    </Alert>
  );
}

/**
 * Standardized empty state component
 */
export function ModuleEmpty({ empty }: ModuleEmptyProps) {
  if (!empty) return null;
  
  return (
    <Alert>
      <AlertDescription>{empty}</AlertDescription>
    </Alert>
  );
}

/**
 * Standardized actions component
 */
export function ModuleActions({ 
  actions, 
  loading, 
  disabled, 
  locked, 
  onAction 
}: ModuleActionsProps) {
  if (!actions || actions.length === 0) return null;
  
  return (
    <div className="flex items-center gap-3">
      {actions.map((action) => (
        <Button
          key={action.id}
          variant={action.variant || 'outline'}
          disabled={loading || disabled || locked || action.disabled}
          onClick={() => onAction?.(action.id)}
        >
          {action.label}
        </Button>
      ))}
    </div>
  );
}