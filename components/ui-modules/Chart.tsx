import React, { useState, useCallback } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Alert, AlertDescription } from '../ui/alert';
import { Badge } from '../ui/badge';
import { HelpCircle, Download, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

type Metric = {
  id: string;
  label: string;
  value: number | string;
  kind?: 'number' | 'currency' | 'percent';
  change?: number;
  icon?: string;
};

type ChartType = 'line' | 'bar' | 'pie';

type Series = { 
  id: string; 
  label: string; 
  data: number[];
  color?: string;
};

type Action = { 
  id: string; 
  label: string; 
  variant?: 'default' | 'secondary' | 'ghost'; 
  disabled?: boolean; 
};

type ChartModule = {
  id?: string;
  title?: string;
  description?: string;
  helpUrl?: string;
  loading?: boolean;
  error?: string;
  empty?: string;
  actions?: Action[];
  kind: 'chart';
  type: ChartType;
  series: Series[];
  categories?: string[];
  stacked?: boolean;
  legend?: boolean;
  unit?: 'number' | 'currency' | 'percent' | string;
  switchableTypes?: ChartType[];
  headerMetrics?: Metric[];
  exportable?: boolean; // simplified export flag
};

interface ChartProps extends ChartModule {
  onChange?: (changes: { type?: ChartType }) => void;
  onAction?: (actionId: string, data?: any) => void;
}

// Better color palette starting with green
const CHART_COLORS = [
  '#16a34a', // Green (primary)
  '#3b82f6', // Blue (secondary)
  '#8b5cf6', // Purple
  '#f59e0b', // Amber
  '#ef4444', // Red
  '#06b6d4', // Cyan
  '#84cc16', // Lime
  '#f97316', // Orange
  '#ec4899', // Pink
  '#6366f1', // Indigo
  '#10b981', // Emerald
  '#8b5cf6'  // Violet
];

export function Chart({
  id,
  title,
  description,
  helpUrl,
  loading = false,
  error,
  empty,
  actions = [],
  type,
  series,
  categories = [],
  stacked = false,
  legend,
  unit = 'number',
  switchableTypes = [],
  headerMetrics = [],
  exportable = true,
  onChange,
  onAction
}: ChartProps) {
  // Provide default description if none is given
  const effectiveDescription = description || (title ? "Interactive chart visualization with data analysis and export capabilities" : undefined);
  const [currentType, setCurrentType] = useState<ChartType>(type);

  const handleTypeChange = useCallback((newType: ChartType) => {
    setCurrentType(newType);
    onChange?.({ type: newType });
  }, [onChange]);

  const handleExport = useCallback(() => {
    onAction?.('export', { format: 'png', scope: 'current' });
  }, [onAction]);

  const formatValue = useCallback((value: number | string, valueUnit?: string) => {
    const targetUnit = valueUnit || unit;
    if (typeof value === 'string') return value;
    
    switch (targetUnit) {
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
        return `${new Intl.NumberFormat('en-US').format(value)} ${targetUnit}`;
    }
  }, [unit]);

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

  // Custom tooltip component for better styling
  const CustomTooltip = useCallback(({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm backdrop-blur-sm">
        <p className="text-foreground font-semibold mb-2 text-xs uppercase tracking-wide text-muted-foreground">{label}</p>
        <div className="space-y-1">
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-3 min-w-[120px]">
              <div className="flex items-center gap-1">
                <div 
                  className="w-3 h-3 rounded-sm shadow-sm" 
                  style={{ backgroundColor: entry.color }}
                />
                <span className="text-foreground text-sm">{entry.name}</span>
              </div>
              <span className="text-foreground">{formatValue(entry.value)}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }, [formatValue]);

  // Custom pie tooltip
  const CustomPieTooltip = useCallback(({ active, payload }: any) => {
    if (!active || !payload || !payload[0]) {
      return null;
    }

    const data = payload[0];
    return (
      <div className="bg-popover border border-border rounded-lg shadow-lg p-3 text-sm backdrop-blur-sm">
        <div className="flex items-center justify-between gap-3 min-w-[120px]">
          <div className="flex items-center gap-2">
            <div 
              className="w-3 h-3 rounded-sm shadow-sm" 
              style={{ backgroundColor: data.payload.color }}
            />
            <span className="text-foreground text-sm">{data.name}</span>
          </div>
          <span className="text-foreground">{formatValue(data.value)}</span>
        </div>
      </div>
    );
  }, [formatValue]);

  // Prepare data for charts
  const chartData = categories.map((category, index) => {
    const dataPoint: any = { name: category };
    series.forEach(serie => {
      dataPoint[serie.id] = serie.data[index] || 0;
    });
    return dataPoint;
  });

  const pieData = currentType === 'pie' && series.length > 0 
    ? series[0].data.map((value, index) => ({
        name: categories[index] || `Item ${index + 1}`,
        value,
        color: CHART_COLORS[index % CHART_COLORS.length]
      }))
    : [];

  const renderChart = useCallback(() => {
    if (loading) {
      return (
        <div className="h-80 flex items-center justify-center">
          <div className="text-muted-foreground text-sm font-medium">Loading chart data...</div>
        </div>
      );
    }

    if (error) {
      return (
        <div className="h-80 flex items-center justify-center">
          <Alert variant="destructive">
            <AlertDescription className="font-medium">{error}</AlertDescription>
          </Alert>
        </div>
      );
    }

    if (series.length === 0 || (currentType !== 'pie' && categories.length === 0)) {
      return (
        <div className="h-80 flex items-center justify-center">
          <div className="text-muted-foreground text-sm font-medium">
            {empty || 'No data available'}
          </div>
        </div>
      );
    }

    const showLegend = legend !== undefined ? legend : series.length > 1;

    switch (currentType) {
      case 'line':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <LineChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                fontWeight={400}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                fontWeight={400}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => formatValue(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && (
                <Legend 
                  wrapperStyle={{ 
                    fontSize: '12px', 
                    color: 'hsl(var(--foreground))',
                    fontWeight: 400
                  }}
                />
              )}
              {series.map((serie, index) => (
                <Line
                  key={serie.id}
                  type="monotone"
                  dataKey={serie.id}
                  stroke={serie.color || CHART_COLORS[index % CHART_COLORS.length]}
                  strokeWidth={2}
                  dot={{ 
                    r: 4,
                    fill: serie.color || CHART_COLORS[index % CHART_COLORS.length],
                    strokeWidth: 1.5,
                    stroke: 'hsl(var(--background))'
                  }}
                  activeDot={{ 
                    r: 6,
                    fill: serie.color || CHART_COLORS[index % CHART_COLORS.length],
                    strokeWidth: 1.5,
                    stroke: 'hsl(var(--background))'
                  }}
                  name={serie.label}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        );

      case 'bar':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.4} />
              <XAxis 
                dataKey="name" 
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                fontWeight={400}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
              />
              <YAxis 
                stroke="hsl(var(--muted-foreground))"
                fontSize={11}
                fontWeight={400}
                axisLine={{ stroke: 'hsl(var(--border))' }}
                tickLine={{ stroke: 'hsl(var(--border))' }}
                tickFormatter={(value) => formatValue(value)}
              />
              <Tooltip content={<CustomTooltip />} />
              {showLegend && (
                <Legend 
                  wrapperStyle={{ 
                    fontSize: '12px', 
                    color: 'hsl(var(--foreground))',
                    fontWeight: 400
                  }}
                />
              )}
              {series.map((serie, index) => (
                <Bar
                  key={serie.id}
                  dataKey={serie.id}
                  fill={serie.color || CHART_COLORS[index % CHART_COLORS.length]}
                  name={serie.label}
                  stackId={stacked ? 'stack' : undefined}
                  radius={[2, 2, 0, 0]}
                />
              ))}
            </BarChart>
          </ResponsiveContainer>
        );

      case 'pie':
        return (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                outerRadius={100}
                innerRadius={0}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                labelLine={false}
                fontSize={11}
                fontWeight={400}
              >
                {pieData.map((entry, index) => (
                  <Cell 
                    key={`cell-${index}`} 
                    fill={entry.color}
                    stroke="hsl(var(--background))"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        );

      default:
        return null;
    }
  }, [currentType, chartData, pieData, series, categories, stacked, legend, loading, error, empty, formatValue, CustomTooltip, CustomPieTooltip]);

  return (
    <div className="space-y-6">
      {/* Header */}
      {(title || effectiveDescription) && (
        <div className="space-y-1">
          {title && (
            <div className="flex items-center gap-2">
              <h3 className="text-base font-medium text-foreground">{title}</h3>
              {helpUrl && (
                <Button variant="ghost" size="sm" asChild className="h-4 w-4 p-0">
                  <a href={helpUrl} target="_blank" rel="noopener noreferrer">
                    <HelpCircle className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
          )}
          {effectiveDescription && (
            <p className="text-sm text-muted-foreground font-normal">{effectiveDescription}</p>
          )}
        </div>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription className="font-medium">{error}</AlertDescription>
        </Alert>
      )}

      {/* Header Metrics */}
      {headerMetrics.length > 0 && (
        <div className={`grid gap-4 ${
          headerMetrics.length === 1 ? 'grid-cols-1' :
          headerMetrics.length === 2 ? 'grid-cols-1 md:grid-cols-2' :
          headerMetrics.length === 3 ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' :
          'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
        }`}>
          {headerMetrics.map((metric) => (
            <Card key={metric.id} className="p-4 bg-card border-border">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground font-normal">{metric.label}</p>
                  {metric.change !== undefined && formatChange(metric.change)}
                </div>
                <div className="text-xl font-medium text-foreground">
                  {formatValue(metric.value, metric.kind)}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Chart Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {/* Type Switcher */}
          {switchableTypes.length > 0 && (
            <div className="flex gap-1">
              {switchableTypes.map((chartType) => (
                <Button
                  key={chartType}
                  variant={currentType === chartType ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleTypeChange(chartType)}
                  className="h-7 px-3 text-xs capitalize font-medium"
                >
                  {chartType}
                </Button>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Export */}
          {exportable && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              className="h-8 px-3 text-xs gap-2 font-medium"
              title="Export chart as PNG"
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
              className="h-8 px-3 text-xs font-medium"
            >
              {action.label}
            </Button>
          ))}
        </div>
      </div>

      <Card className="p-3 bg-card border">
        {renderChart()}
      </Card>
    </div>
  );
}