import React, { useCallback } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { HelpCircle, CheckCircle, AlertTriangle, XCircle, Info, ExternalLink } from 'lucide-react';

type SummaryItem = {
  id: string;
  title: string;
  subtitle?: string;
  status: 'success' | 'warning' | 'error' | 'info';
  message?: string;
  link?: { href: string; label?: string };
};

type Action = { 
  id: string; 
  label: string; 
  variant?: 'default' | 'secondary' | 'ghost'; 
  disabled?: boolean; 
};

type SummaryCardModule = {
  id?: string;
  title?: string;
  description?: string;
  helpUrl?: string;
  loading?: boolean;
  error?: string;
  empty?: string;
  actions?: Action[];
  kind: 'summary';
  items: SummaryItem[];
  compact?: boolean;
};

interface SummaryCardProps extends SummaryCardModule {
  onAction?: (actionId: string, data?: any) => void;
  onItemClick?: (item: SummaryItem) => void;
}

export function SummaryCard({
  id,
  title,
  description,
  helpUrl,
  loading = false,
  error,
  empty,
  actions = [],
  items,
  compact = false,
  onAction,
  onItemClick
}: SummaryCardProps) {
  const getStatusIcon = useCallback((status: SummaryItem['status']) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error':
        return <XCircle className="w-4 h-4 text-destructive" />;
      case 'info':
        return <Info className="w-4 h-4 text-blue-600" />;
      default:
        return null;
    }
  }, []);

  const getStatusBadge = useCallback((status: SummaryItem['status']) => {
    const variants = {
      success: 'default',
      warning: 'secondary',
      error: 'destructive',
      info: 'secondary'
    } as const;

    const labels = {
      success: 'Success',
      warning: 'Warning', 
      error: 'Error',
      info: 'Info'
    };

    return (
      <Badge variant={variants[status]} className="text-xs">
        {labels[status]}
      </Badge>
    );
  }, []);

  const handleItemClick = useCallback((item: SummaryItem) => {
    if (item.link) {
      window.open(item.link.href, '_blank', 'noopener,noreferrer');
    } else if (onItemClick) {
      onItemClick(item);
    }
  }, [onItemClick]);

  // Count items by status
  const statusCounts = items.reduce((counts, item) => {
    counts[item.status] = (counts[item.status] || 0) + 1;
    return counts;
  }, {} as Record<string, number>);

  if (loading) {
    return (
      <div className="space-y-6">
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

        {/* Loading State */}
        <Card className="p-6">
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div key={index} className="flex items-center gap-3 animate-pulse">
                <div className="w-4 h-4 bg-muted rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="space-y-6">
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

        <Alert>
          <AlertDescription>{empty || 'No items to display'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {/* Summary Overview */}
      {!compact && Object.keys(statusCounts).length > 1 && (
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">Summary</span>
            <div className="flex gap-3 text-xs">
              {statusCounts.success && (
                <span className="text-green-600">{statusCounts.success} successful</span>
              )}
              {statusCounts.warning && (
                <span className="text-yellow-600">{statusCounts.warning} warnings</span>
              )}
              {statusCounts.error && (
                <span className="text-destructive">{statusCounts.error} errors</span>
              )}
              {statusCounts.info && (
                <span className="text-blue-600">{statusCounts.info} info</span>
              )}
            </div>
          </div>
        </Card>
      )}

      <Card className="divide-y shadow-lg bg-card border">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`p-4 ${
              item.link || onItemClick 
                ? 'cursor-pointer hover:bg-accent transition-colors' 
                : ''
            }`}
            onClick={() => handleItemClick(item)}
          >
            <div className="flex items-start gap-3">
              {/* Status Icon */}
              <div className="mt-0.5 flex-shrink-0">
                {getStatusIcon(item.status)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h4 className="font-medium">{item.title}</h4>
                  {compact && getStatusBadge(item.status)}
                  {item.link && <ExternalLink className="w-3 h-3 text-muted-foreground" />}
                </div>

                {item.subtitle && (
                  <p className="text-sm text-muted-foreground mb-1">{item.subtitle}</p>
                )}

                {item.message && (
                  <p className="text-sm">{item.message}</p>
                )}

                {!compact && (
                  <div className="flex items-center justify-between mt-2">
                    {getStatusBadge(item.status)}
                    {item.link && (
                      <span className="text-xs text-muted-foreground">
                        {item.link.label || 'View details'}
                      </span>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </Card>

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