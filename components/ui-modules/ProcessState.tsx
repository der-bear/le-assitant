import React from 'react';
import { Button } from '../ui/button';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';
import { ModuleContainer } from './shared';
import { LockableModule, ModuleCallbacks } from './shared/types';

// Extend the base module with ProcessState-specific props
export interface ProcessStateModule extends LockableModule {
  kind: 'process-state';
  state: 'processing' | 'completed' | 'failed';
  detail?: string;
  retryActionId?: string;
}

export interface ProcessStateProps extends ProcessStateModule, ModuleCallbacks {}

export function ProcessState({
  state,
  detail,
  retryActionId,
  onAction,
  ...baseProps
}: ProcessStateProps) {
  const getIcon = () => {
    switch (state) {
      case 'processing':
        return <Loader2 className="h-4 w-4 animate-spin" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-destructive" />;
      default:
        return null;
    }
  };

  const getStatusText = () => {
    switch (state) {
      case 'processing':
        return 'Processing...';
      case 'completed':
        return 'Completed';
      case 'failed':
        return 'Failed';
      default:
        return '';
    }
  };

  const getTextColor = () => {
    switch (state) {
      case 'processing':
        return 'text-muted-foreground';
      case 'completed':
        return 'text-green-600';
      case 'failed':
        return 'text-destructive';
      default:
        return 'text-foreground';
    }
  };

  return (
    <ModuleContainer {...baseProps} onAction={onAction} showStates={false}>
      <div className="flex items-center gap-3 p-4 border rounded-lg bg-card">
        {/* Status Icon */}
        <div className="flex-shrink-0">
          {getIcon()}
        </div>

        {/* Status Text */}
        <div className="flex-1">
          <span className={`text-sm font-medium ${getTextColor()}`}>
            {getStatusText()}
          </span>
          {detail && (
            <span className="text-sm text-muted-foreground ml-2">
              {detail}
            </span>
          )}
        </div>

        {/* Retry Button */}
        {state === 'failed' && retryActionId && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onAction?.(retryActionId)}
            className="text-xs"
          >
            Retry
          </Button>
        )}
      </div>
    </ModuleContainer>
  );
}