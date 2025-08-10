import React, { useCallback, useEffect } from 'react';
import * as Icons from 'lucide-react';
import { toast } from 'sonner';
import { Alert as BaseAlert, AlertDescription } from '../ui/alert';
import { X } from 'lucide-react';
import { Button } from '../ui/button';

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
        return <Icons.CheckCircle className="h-4 w-4" />;
      case 'error':
        return <Icons.AlertCircle className="h-4 w-4" />;
      case 'warning':
        return <Icons.AlertTriangle className="h-4 w-4" />;
      case 'info':
      default:
        return <Icons.Info className="h-4 w-4" />;
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

  useEffect(() => {
    if (placement !== 'toast') return;

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

    if (type !== 'error' && onDismiss && toastConfig.duration !== Infinity) {
      const timeoutId = setTimeout(onDismiss, toastConfig.duration);
      return () => clearTimeout(timeoutId);
    }
  }, []);

  if (placement === 'toast') {
    return null;
  }

  return (
    <div className="relative w-full rounded-lg border px-4 py-3 text-sm bg-background border-border">
      <div className="flex items-start gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 mt-0.5">
          {getCustomIcon() || getDefaultIcon()}
        </div>
        
        {/* Content */}
        <div className="flex-1 min-w-0 space-y-1">
          {title && (
            <div className="text-sm font-medium text-foreground">{title}</div>
          )}
          <div className="text-sm font-normal text-foreground leading-relaxed">
            {message}
          </div>
        </div>

        {/* Dismiss button */}
        {dismissible && (
          <div className="flex-shrink-0">
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-6 w-6 p-0 hover:bg-muted"
              aria-label="Dismiss alert"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}