import React from 'react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { Loader2, CheckCircle, AlertCircle, HelpCircle } from 'lucide-react';

type Action = { id: string; label: string; variant?: 'default'|'secondary'|'ghost'; disabled?: boolean };

type ProcessStateModule = {
  id?: string;
  title?: string;
  description?: string;
  helpUrl?: string;
  loading?: boolean;
  error?: string;
  empty?: string;
  actions?: Action[];
  kind: 'process-state';
  state: 'processing'|'completed'|'failed';
  detail?: string;
  retryActionId?: string;
};

interface ProcessStateProps extends ProcessStateModule {
  onAction?: (actionId: string) => void;
}

export function ProcessState({
  id,
  title,
  description,
  helpUrl,
  loading = false,
  error,
  empty,
  actions = [],
  state,
  detail,
  retryActionId,
  onAction
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
    <div className="space-y-4">
      {/* Header */}
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <div className="flex items-center gap-2">
              <h3 className="font-medium">{title}</h3>
              {helpUrl && (
                <Button variant="ghost" size="sm" asChild className="h-4 w-4 p-0">
                  <a href={helpUrl} target="_blank" rel="noopener noreferrer">
                    <HelpCircle className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {empty && (
        <Alert>
          <AlertDescription>{empty}</AlertDescription>
        </Alert>
      )}

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

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex items-center gap-3">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || 'outline'}
              disabled={loading || action.disabled}
              onClick={() => onAction?.(action.id)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}