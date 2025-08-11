import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Progress } from '../ui/progress';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Info } from 'lucide-react';

interface Metric {
  id: string;
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  type?: 'currency' | 'percentage' | 'number' | 'text';
}

interface ProgressItem {
  id: string;
  label: string;
  value: number;
  target?: number;
  color?: string;
}

interface Alert {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  action?: string;
}

interface SimpleInsightsProps {
  title?: string;
  description?: string;
  metrics?: Metric[];
  progress?: ProgressItem[];
  alerts?: Alert[];
  onActionClick?: (action: string, itemId: string) => void;
}

export function SimpleInsights({ 
  title, 
  description,
  metrics = [], 
  progress = [],
  alerts = [],
  onActionClick
}: SimpleInsightsProps) {
  const formatValue = (value: string | number, type?: string) => {
    if (type === 'currency' && typeof value === 'number') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }
    if (type === 'percentage' && typeof value === 'number') {
      return `${value}%`;
    }
    if (type === 'number' && typeof value === 'number') {
      return value.toLocaleString();
    }
    return value.toString();
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-3 h-3 text-green-600" />;
      case 'down': return <TrendingDown className="w-3 h-3 text-red-600" />;
      default: return <Minus className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Info className="w-4 h-4 text-blue-600" />;
    }
  };

  const getAlertStyle = (type: string) => {
    switch (type) {
      case 'success': return 'border-green-200 bg-green-50';
      case 'warning': return 'border-yellow-200 bg-yellow-50';
      case 'error': return 'border-red-200 bg-red-50';
      default: return 'border-blue-200 bg-blue-50';
    }
  };

  return (
    <Card className="p-4 max-w-2xl">
      <div className="space-y-4">
        {(title || description) && (
          <div className="space-y-1">
            {title && <h4 className="text-sm font-medium">{title}</h4>}
            {description && (
              <p className="text-xs font-normal text-muted-foreground">{description}</p>
            )}
          </div>
        )}

        {/* Metrics Grid */}
        {metrics.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
            {metrics.map(metric => (
              <div key={metric.id} className="bg-muted/30 p-3 rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-normal text-muted-foreground">{metric.label}</span>
                  {metric.trend && getTrendIcon(metric.trend)}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-medium">
                    {formatValue(metric.value, metric.type)}
                  </span>
                  {metric.change !== undefined && (
                    <span className={`text-xs font-normal ${
                      metric.change > 0 ? 'text-green-600' : 
                      metric.change < 0 ? 'text-red-600' : 'text-muted-foreground'
                    }`}>
                      {metric.change > 0 ? '+' : ''}{metric.change}%
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Progress Items */}
        {progress.length > 0 && (
          <div className="space-y-3">
            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Progress</h5>
            {progress.map(item => (
              <div key={item.id} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-normal">{item.label}</span>
                  <span className="text-xs font-normal text-muted-foreground">
                    {item.value}{item.target ? `/${item.target}` : '%'}
                  </span>
                </div>
                <Progress 
                  value={item.target ? (item.value / item.target) * 100 : item.value} 
                  className="h-2"
                />
              </div>
            ))}
          </div>
        )}

        {/* Alerts */}
        {alerts.length > 0 && (
          <div className="space-y-3">
            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Alerts</h5>
            {alerts.map(alert => (
              <div 
                key={alert.id} 
                className={`p-3 rounded-lg border ${getAlertStyle(alert.type)}`}
              >
                <div className="flex items-start gap-3">
                  {getAlertIcon(alert.type)}
                  <div className="flex-1 min-w-0">
                    <h6 className="text-sm font-medium mb-1">{alert.title}</h6>
                    <p className="text-sm font-normal text-muted-foreground">
                      {alert.message}
                    </p>
                    {alert.action && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onActionClick?.(alert.action!, alert.id)}
                        className="text-xs font-normal h-6 mt-2 p-0 hover:no-underline"
                      >
                        {alert.action}
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </Card>
  );
}