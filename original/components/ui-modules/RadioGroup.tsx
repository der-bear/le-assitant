import React, { useState } from 'react';
import { Card } from '../ui/card';
import { RadioGroup as UIRadioGroup, RadioGroupItem } from '../ui/radio-group';
import { Label } from '../ui/label';
import { Button } from '../ui/button';

interface Option {
  id: string;
  label: string;
  description?: string;
  disabled?: boolean;
}

interface RadioGroupProps {
  title?: string;
  description?: string;
  options: Option[];
  defaultValue?: string;
  onSelect: (value: string) => void;
  submitLabel?: string;
  showSubmit?: boolean;
}

export function RadioGroup({ 
  title, 
  description, 
  options, 
  defaultValue,
  onSelect,
  submitLabel = "Continue",
  showSubmit = true
}: RadioGroupProps) {
  const [selectedValue, setSelectedValue] = useState<string>(defaultValue || '');

  const handleSubmit = () => {
    if (selectedValue) {
      onSelect(selectedValue);
    }
  };

  const handleValueChange = (value: string) => {
    setSelectedValue(value);
    if (!showSubmit) {
      onSelect(value);
    }
  };

  return (
    <Card className="p-4 max-w-md">
      <div className="space-y-4">
        {(title || description) && (
          <div className="space-y-1">
            {title && <h4 className="text-sm font-medium">{title}</h4>}
            {description && (
              <p className="text-xs font-normal text-muted-foreground">{description}</p>
            )}
          </div>
        )}

        <UIRadioGroup
          value={selectedValue}
          onValueChange={handleValueChange}
          className="space-y-3"
        >
          {options.map((option) => (
            <div key={option.id} className="flex items-start space-x-3">
              <RadioGroupItem 
                value={option.id} 
                id={option.id}
                disabled={option.disabled}
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
        </UIRadioGroup>

        {showSubmit && selectedValue && (
          <Button 
            onClick={handleSubmit}
            className="w-full text-sm font-normal"
          >
            {submitLabel}
          </Button>
        )}
      </div>
    </Card>
  );
}