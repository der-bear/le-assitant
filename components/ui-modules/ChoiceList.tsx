import React, { useState } from 'react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { RadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Alert, AlertDescription } from '../ui/alert';
import { HelpCircle } from 'lucide-react';
import * as Icons from 'lucide-react';

type Choice = { 
  id: string; 
  label: string; 
  description?: string; 
  icon?: string; 
  badge?: string; 
  disabled?: boolean; 
  group?: string 
};

type Action = { id: string; label: string; variant?: 'default'|'secondary'|'ghost'; disabled?: boolean };

type ChoiceListModule = {
  id?: string;
  title?: string;
  description?: string;
  helpUrl?: string;
  loading?: boolean;
  error?: string;
  empty?: string;
  actions?: Action[];
  kind: 'choices';
  options: Choice[];
  mode?: 'single'|'multiple';
  layout?: 'list'|'card'|'grid';
  value?: string | string[];
  min?: number; 
  max?: number;
  disabled?: boolean;
  locked?: boolean;
};

interface ChoiceListProps extends ChoiceListModule {
  onChange?: (value: string | string[]) => void;
  onAction?: (actionId: string) => void;
}

export function ChoiceList({
  id,
  title,
  description,
  helpUrl,
  loading = false,
  error,
  empty,
  actions = [],
  options,
  mode = 'single',
  layout,
  value,
  min,
  max,
  disabled = false,
  locked = false,
  onChange,
  onAction
}: ChoiceListProps) {
  const [selectedValue, setSelectedValue] = useState<string | string[]>(value || (mode === 'multiple' ? [] : ''));

  // Auto-detect layout
  const effectiveLayout = layout || (options.length <= 4 ? 'card' : 'list');

  const handleSelectionChange = (choiceId: string) => {
    let newValue: string | string[];

    if (mode === 'single') {
      newValue = choiceId;
    } else {
      const current = Array.isArray(selectedValue) ? selectedValue : [];
      if (current.includes(choiceId)) {
        newValue = current.filter(id => id !== choiceId);
      } else {
        if (max && current.length >= max) {
          return; // Don't allow selection beyond max
        }
        newValue = [...current, choiceId];
      }
    }

    setSelectedValue(newValue);
    onChange?.(newValue);
  };

  const getIcon = (iconName?: string) => {
    if (!iconName) return null;
    const IconComponent = (Icons as any)[iconName];
    return IconComponent ? <IconComponent className="w-4 h-4" /> : null;
  };

  const isSelected = (choiceId: string) => {
    if (mode === 'single') {
      return selectedValue === choiceId;
    }
    return Array.isArray(selectedValue) && selectedValue.includes(choiceId);
  };

  const selectedCount = mode === 'multiple' && Array.isArray(selectedValue) ? selectedValue.length : 0;

  // Group options if they have groups
  const groupedOptions = options.reduce((groups, option) => {
    const group = option.group || 'default';
    if (!groups[group]) groups[group] = [];
    groups[group].push(option);
    return groups;
  }, {} as Record<string, Choice[]>);

  const hasGroups = Object.keys(groupedOptions).length > 1 || !groupedOptions.default;

  const renderChoice = (choice: Choice) => {
    const selected = isSelected(choice.id);
    const icon = getIcon(choice.icon);

    if (effectiveLayout === 'list') {
      return (
        <div
          key={choice.id}
          className={`flex items-center space-x-3 p-3 sm:p-4 rounded-lg border bg-background cursor-pointer transition-colors ${
            selected 
              ? 'border-primary bg-primary/5' 
              : 'border-border hover:bg-accent'
          } ${choice.disabled || disabled || locked ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={() => !(choice.disabled || disabled || locked) && handleSelectionChange(choice.id)}
        >
          {mode === 'single' ? (
            <RadioGroup value={selected ? choice.id : ''} className="m-0 flex-shrink-0">
              <RadioGroupItem value={choice.id} disabled={choice.disabled || disabled || locked} />
            </RadioGroup>
          ) : (
            <Checkbox 
              checked={selected} 
              disabled={choice.disabled || disabled || locked}
              onCheckedChange={() => !(choice.disabled || disabled || locked) && handleSelectionChange(choice.id)}
              className="flex-shrink-0"
            />
          )}
          
          {icon && (
            <div className="text-muted-foreground flex-shrink-0">{icon}</div>
          )}
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start gap-2 flex-wrap">
              <span className="text-base font-medium text-foreground leading-tight flex-1 min-w-0">{choice.label}</span>
              {choice.badge && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5 font-normal flex-shrink-0">
                  {choice.badge}
                </Badge>
              )}
            </div>
            {choice.description && (
              <p className="text-sm font-normal text-muted-foreground mt-1.5 leading-relaxed">{choice.description}</p>
            )}
          </div>
        </div>
      );
    }

    // Card/Grid layout
    return (
      <Card
        key={choice.id}
        className={`p-4 sm:p-5 cursor-pointer transition-colors border-border bg-card hover:bg-accent ${
          selected 
            ? 'border-primary bg-primary/5' 
            : 'hover:bg-accent'
        } ${choice.disabled || disabled || locked ? 'opacity-50 cursor-not-allowed' : ''}`}
        onClick={() => !(choice.disabled || disabled || locked) && handleSelectionChange(choice.id)}
      >
        <div className="space-y-3 sm:space-y-4">
          {/* Icon and selection indicator */}
          <div className="flex items-center justify-between">
            {icon && (
              <div className="text-muted-foreground flex-shrink-0">{icon}</div>
            )}
            {mode === 'multiple' && (
              <div className={`w-4 h-4 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                selected ? 'bg-primary border-primary' : 'border-border'
              }`}>
                {selected && (
                  <div className="w-2 h-2 bg-primary-foreground rounded-sm" />
                )}
              </div>
            )}
            {mode === 'single' && (
              <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                selected ? 'border-primary' : 'border-border'
              }`}>
                {selected && (
                  <div className="w-2 h-2 bg-primary rounded-full" />
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-1.5">
            <div className="flex items-start gap-2 flex-wrap">
              <h4 className="text-base font-medium text-foreground leading-tight flex-1 min-w-0">{choice.label}</h4>
              {choice.badge && (
                <Badge variant="secondary" className="text-xs px-2 py-0.5 font-normal flex-shrink-0">
                  {choice.badge}
                </Badge>
              )}
            </div>
            {choice.description && (
              <p className="text-sm font-normal text-muted-foreground leading-relaxed">{choice.description}</p>
            )}
          </div>
        </div>
      </Card>
    );
  };

  const renderChoiceGroup = (groupName: string, choices: Choice[]) => (
    <div key={groupName} className="space-y-3 sm:space-y-4">
      {groupName !== 'default' && (
        <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wider leading-tight">
          {groupName}
        </h4>
      )}
      <div className={`${
        effectiveLayout === 'grid' 
          ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3' 
          : effectiveLayout === 'card'
          ? 'grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4'
          : 'space-y-2'
      }`}>
        {choices.map(renderChoice)}
      </div>
    </div>
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium text-foreground leading-tight">{title}</h3>
              {helpUrl && (
                <Button variant="ghost" size="sm" asChild className="h-4 w-4 p-0 flex-shrink-0">
                  <a href={helpUrl} target="_blank" rel="noopener noreferrer">
                    <HelpCircle className="h-3 w-3" />
                  </a>
                </Button>
              )}
            </div>
          )}
          {description && (
            <p className="text-sm font-normal text-muted-foreground leading-relaxed">{description}</p>
          )}
        </div>
      )}

      {/* Selection count for multiple mode */}
      {mode === 'multiple' && max && (
        <p className="text-sm font-normal text-muted-foreground">
          {selectedCount}/{max} selected
        </p>
      )}

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Empty State */}
      {empty && options.length === 0 && (
        <Alert>
          <AlertDescription>{empty}</AlertDescription>
        </Alert>
      )}

      {options.length > 0 && (
        <div className={`space-y-4 sm:space-y-6 ${
          locked 
            ? 'opacity-60 pointer-events-none' 
            : ''
        }`}>
          {hasGroups ? (
            Object.entries(groupedOptions).map(([groupName, choices]) =>
              renderChoiceGroup(groupName, choices)
            )
          ) : (
            renderChoiceGroup('default', options)
          )}
        </div>
      )}

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || 'outline'}
              disabled={loading || disabled || locked || action.disabled}
              onClick={() => onAction?.(action.id)}
              className="text-base font-medium"
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}