import React, { useEffect, useCallback } from 'react';
import { Button } from '../ui/button';
import { Alert as BaseAlert, AlertDescription, AlertTitle } from '../ui/alert';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner@2.0.3';
import * as Icons from 'lucide-react';

type AlertType = 'success'|'error'|'info'|'warning';

type Action = { id: string; label: string; variant?: 'default'|'secondary'|'ghost'; disabled?: boolean };

type AlertModule = {
  id?: string;
  title?: string;
  description?: string;
  helpUrl?: string;
  loading?: boolean;
  error?: string;
  empty?: string;
  actions?: Action[];
  kind: 'alert';
  type: AlertType;
  message: string;
  placement?: 'inline'|'toast';
  dismissible?: boolean;
  durationMs?: number;
  icon?: string;
};

interface AlertProps extends AlertModule {
  onAction?: (actionId: string) => void;
  onDismiss?: () => void;
}

export function Alert({
  id,
  title,
  type,
  message,
  placement = 'inline',
  dismissible = true,
  durationMs,
  icon,
  actions = [],
  onAction,
  onDismiss
}: AlertProps) {
  const getDefaultIcon = useCallback(() => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-4 w-4" />;
      case 'error':
        return <AlertCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'info':
      default:
        return <Info className="h-4 w-4" />;
    }
  }, [type]);

  const getCustomIcon = useCallback(() => {
    if (!icon) return null;
    const IconComponent = (Icons as any)[icon];
    return IconComponent ? <IconComponent className="h-4 w-4" /> : null;
  }, [icon]);

  const getVariant = useCallback(() => {
    switch (type) {
      case 'error':
        return 'destructive';
      default:
        return 'default';
    }
  }, [type]);

  // Handle toast placement - only run once when component mounts if toast
  useEffect(() => {
    if (placement !== 'toast') return;

    const toastIcon = getCustomIcon() || getDefaultIcon();
    
    const toastConfig: any = {
      description: message,
      duration: type === 'error' ? Infinity : (durationMs || 4000),
    };

    if (title) {
      toastConfig.title = title;
    }

    if (dismissible && type !== 'error' && onDismiss) {
      toastConfig.action = {
        label: 'Dismiss',
        onClick: onDismiss
      };
    }

    // Show toast based on type
    switch (type) {
      case 'success':
        toast.success(title || 'Success', toastConfig);
        break;
      case 'error':
        toast.error(title || 'Error', toastConfig);
        break;
      case 'warning':
        toast.warning(title || 'Warning', toastConfig);
        break;
      case 'info':
      default:
        toast.info(title || 'Info', toastConfig);
        break;
    }

    // Only set cleanup timeout if not error type and has dismiss handler
    if (type !== 'error' && onDismiss && toastConfig.duration !== Infinity) {
      const timeoutId = setTimeout(onDismiss, toastConfig.duration);
      return () => clearTimeout(timeoutId);
    }
  }, []); // Empty dependency array - only run once on mount for toast

  // Only render inline alerts
  if (placement === 'toast') {
    return null;
  }

  return (
    <BaseAlert variant={getVariant()} className="relative bg-background border-border">
      <div className="flex items-start gap-3 sm:gap-4">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getCustomIcon() || getDefaultIcon()}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {title && (
            <AlertTitle className="text-base font-medium text-foreground leading-tight">
              {title}
            </AlertTitle>
          )}
          <AlertDescription className="text-sm font-normal text-foreground leading-relaxed">
            {message}
          </AlertDescription>
        </div>

        {/* Actions */}
        {(actions.length > 0 || dismissible) && (
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2 flex-shrink-0 mt-0.5">
            {actions.slice(0, 2).map((action) => (
              <Button
                key={action.id}
                variant={action.variant || 'ghost'}
                size="sm"
                disabled={action.disabled}
                onClick={() => onAction?.(action.id)}
                className="h-7 px-2 text-xs font-medium whitespace-nowrap min-w-0"
              >
                {action.label}
              </Button>
            ))}
            
            {dismissible && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onDismiss}
                className="h-7 w-7 p-0 flex-shrink-0"
                aria-label="Dismiss alert"
              >
                <X className="h-3 w-3" />
              </Button>
            )}
          </div>
        )}
      </div>
    </BaseAlert>
  );
}