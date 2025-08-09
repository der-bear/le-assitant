import React, { useCallback } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { HelpCircle, TrendingUp, TrendingDown, Minus, Download } from 'lucide-react';

type Metric = {
  id: string;
  label: string;
  value: number | string;
  kind?: 'number' | 'currency' | 'percent';
  change?: number;
  icon?: string;
};

type Action = { 
  id: string; 
  label: string; 
  variant?: 'default' | 'secondary' | 'ghost'; 
  disabled?: boolean; 
};

type MetricsModule = {
  id?: string;
  title?: string;
  description?: string;
  helpUrl?: string;
  loading?: boolean;
  error?: string;
  empty?: string;
  actions?: Action[];
  kind: 'metrics';
  metrics: Metric[];
  layout?: 'stacked' | 'grid';
  exportable?: boolean; // simplified export flag
};

interface MetricsProps extends MetricsModule {
  onAction?: (actionId: string, data?: any) => void;
}

export function Metrics({
  id,
  title,
  description,
  helpUrl,
  loading = false,
  error,
  empty,
  actions = [],
  metrics,
  layout = 'grid',
  exportable = true,
  onAction
}: MetricsProps) {
  const formatValue = useCallback((value: number | string, kind?: string) => {
    if (typeof value === 'string') return value;
    
    switch (kind) {
      case 'currency':
        return new Intl.NumberFormat('en-US', { 
          style: 'currency', 
          currency: 'USD',
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        }).format(value);
      case 'percent':
        return `${value}%`;
      case 'number':
        return new Intl.NumberFormat('en-US').format(value);
      default:
        return new Intl.NumberFormat('en-US').format(value);
    }
  }, []);

  const formatChange = useCallback((change: number) => {
    const isPositive = change > 0;
    const isNegative = change < 0;
    const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
    const colorClass = isPositive ? 'text-green-600' : isNegative ? 'text-red-600' : 'text-muted-foreground';
    
    return (
      <div className={`flex items-center gap-1 text-xs ${colorClass}`}>
        <Icon className="w-3 h-3" />
        {Math.abs(change)}%
      </div>
    );
  }, []);

  const handleExport = useCallback(() => {
    onAction?.('export', { format: 'png', scope: 'current' });
  }, [onAction]);

  // Responsive grid classes based on metric count
  const getGridClasses = useCallback(() => {
    const count = metrics.length;
    if (layout === 'stacked') return 'space-y-4';
    
    // Responsive grid: 4 cols on xl, 2 cols on md, 1 col on sm
    if (count === 1) return 'grid grid-cols-1';
    if (count === 2) return 'grid grid-cols-1 md:grid-cols-2';
    if (count === 3) return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3';
    return 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4';
  }, [metrics.length, layout]);

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
        <div className={getGridClasses()}>
          {Array.from({ length: metrics.length || 4 }).map((_, index) => (
            <Card key={index} className="p-6 animate-pulse">
              <div className="space-y-4">
                <div className="h-4 bg-muted rounded w-1/2"></div>
                <div className="h-8 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/4"></div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (metrics.length === 0) {
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
          <AlertDescription>{empty || 'No metrics available'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      {(title || description || helpUrl) && (
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1 flex-1">
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

          {/* Export Button Inline */}
          <div className="flex items-center gap-2">
            {exportable && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleExport}
                className="h-8 px-3 text-xs gap-2"
                title="Export metrics as PNG"
              >
                <Download className="w-3 h-3" />
                Export
              </Button>
            )}

            {/* Custom Actions */}
            {actions.map((action) => (
              <Button
                key={action.id}
                variant={action.variant || 'outline'}
                size="sm"
                disabled={loading || action.disabled}
                onClick={() => onAction?.(action.id)}
                className="h-8 px-3 text-xs"
              >
                {action.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <div className={getGridClasses()}>
        {metrics.map((metric) => (
          <Card key={metric.id} className="p-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">{metric.label}</p>
                {metric.change !== undefined && formatChange(metric.change)}
              </div>
              <div className="text-2xl font-medium">
                {formatValue(metric.value, metric.kind)}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}