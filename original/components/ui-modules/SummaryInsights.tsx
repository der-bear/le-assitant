import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Progress } from '../ui/progress';
import { TrendingUp, TrendingDown, Minus, AlertTriangle, CheckCircle, Clock } from 'lucide-react';

interface Metric {
  id: string;
  label: string;
  value: string | number;
  change?: number;
  trend?: 'up' | 'down' | 'neutral';
  type?: 'currency' | 'percentage' | 'number' | 'text';
  status?: 'success' | 'warning' | 'error' | 'info';
}

interface Insight {
  id: string;
  title: string;
  description: string;
  type: 'success' | 'warning' | 'error' | 'info';
  action?: string;
}

interface ProgressItem {
  id: string;
  label: string;
  value: number;
  target?: number;
  color?: string;
}

interface SummaryInsightsProps {
  title: string;
  metrics?: Metric[];
  insights?: Insight[];
  progress?: ProgressItem[];
  onActionClick?: (action: string, itemId: string) => void;
}

export function SummaryInsights({ 
  title, 
  metrics = [], 
  insights = [], 
  progress = [],
  onActionClick
}: SummaryInsightsProps) {
  const formatValue = (value: string | number, type?: string) => {
    if (type === 'currency' && typeof value === 'number') {
      return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(value);
    }
    if (type === 'percentage' && typeof value === 'number') {
      return `${value}%`;
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

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'success': return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      case 'error': return <AlertTriangle className="w-4 h-4 text-red-600" />;
      default: return <Clock className="w-4 h-4 text-blue-600" />;
    }
  };

  const getStatusColor = (type: string) => {
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
        <h4 className="text-sm font-medium">{title}</h4>

        {/* Metrics Grid */}
        {metrics.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
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
                {metric.status && (
                  <Badge 
                    variant={metric.status === 'success' ? 'default' : 'secondary'} 
                    className="text-xs font-normal mt-1"
                  >
                    {metric.status}
                  </Badge>
                )}
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

        {/* Insights */}
        {insights.length > 0 && (
          <div className="space-y-3">
            <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Insights</h5>
            {insights.map(insight => (
              <div 
                key={insight.id} 
                className={`p-3 rounded-lg border ${getStatusColor(insight.type)}`}
              >
                <div className="flex items-start gap-3">
                  {getStatusIcon(insight.type)}
                  <div className="flex-1 min-w-0">
                    <h6 className="text-sm font-medium mb-1">{insight.title}</h6>
                    <p className="text-sm font-normal text-muted-foreground">
                      {insight.description}
                    </p>
                    {insight.action && (
                      <button
                        onClick={() => onActionClick?.(insight.action!, insight.id)}
                        className="text-xs font-medium text-primary hover:underline mt-2"
                      >
                        {insight.action}
                      </button>
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