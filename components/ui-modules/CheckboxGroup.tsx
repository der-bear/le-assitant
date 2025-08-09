import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';

interface Option {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface CheckboxGroupProps {
  title?: string;
  description?: string;
  options: Option[];
  defaultValues?: string[];
  onSelect: (values: string[]) => void;
  submitLabel?: string;
  showSubmit?: boolean;
  minSelection?: number;
  maxSelection?: number;
}

export function CheckboxGroup({ 
  title, 
  description, 
  options, 
  defaultValues = [],
  onSelect,
  submitLabel = "Continue",
  showSubmit = true,
  minSelection,
  maxSelection
}: CheckboxGroupProps) {
  const [selectedValues, setSelectedValues] = useState<string[]>(defaultValues);

  const handleSubmit = () => {
    onSelect(selectedValues);
  };

  const handleValueChange = (optionId: string, checked: boolean) => {
    let newValues: string[];
    
    if (checked) {
      // Check max selection limit
      if (maxSelection && selectedValues.length >= maxSelection) {
        return;
      }
      newValues = [...selectedValues, optionId];
    } else {
      newValues = selectedValues.filter(id => id !== optionId);
    }
    
    setSelectedValues(newValues);
    
    if (!showSubmit) {
      onSelect(newValues);
    }
  };

  const isSubmitDisabled = () => {
    if (minSelection && selectedValues.length < minSelection) return true;
    if (maxSelection && selectedValues.length > maxSelection) return true;
    return selectedValues.length === 0;
  };

  return (
    <Card className="p-4 max-w-md">
      <div className="space-y-4">
        {(title || description) && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              {title && <h4 className="text-sm font-medium">{title}</h4>}
              {selectedValues.length > 0 && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {selectedValues.length} selected
                  {maxSelection && ` / ${maxSelection}`}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-xs font-normal text-muted-foreground">{description}</p>
            )}
          </div>
        )}

        <div className="space-y-3">
          {options.map((option) => (
            <div key={option.id} className="flex items-start space-x-3">
              <Checkbox 
                id={option.id}
                checked={selectedValues.includes(option.id)}
                onCheckedChange={(checked) => handleValueChange(option.id, !!checked)}
                disabled={option.disabled || (maxSelection && selectedValues.length >= maxSelection && !selectedValues.includes(option.id))}
                className="mt-0.5"
              />
              <div className="flex-1 min-w-0">
                <Label 
                  htmlFor={option.id} 
                  className="text-sm font-normal cursor-pointer"
                >
                  {option.label}
                </Label>
                {option.description && (
                  <p className="text-xs font-normal text-muted-foreground mt-0.5">
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {showSubmit && selectedValues.length > 0 && (
          <Button 
            onClick={handleSubmit}
            disabled={isSubmitDisabled()}
            className="w-full text-sm font-normal"
          >
            {submitLabel} ({selectedValues.length})
          </Button>
        )}
      </div>
    </Card>
  );
}