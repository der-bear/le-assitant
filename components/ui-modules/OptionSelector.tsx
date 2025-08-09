import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle } from 'lucide-react';

interface Option {
  id: string;
  label: string;
  description: string;
  icon?: React.ReactNode;
  recommended?: boolean;
}

interface OptionSelectorProps {
  title: string;
  description?: string;
  options: Option[];
  onSelect: (optionId: string) => void;
  multiSelect?: boolean;
  selectedOptions?: string[];
  submitLabel?: string;
  isCompleted?: boolean;
}

export function OptionSelector({ 
  title, 
  description, 
  options, 
  onSelect, 
  multiSelect = false,
  selectedOptions = [],
  submitLabel = "Continue",
  isCompleted = false
}: OptionSelectorProps) {
  const [selected, setSelected] = useState<string[]>(selectedOptions);

  const handleOptionClick = (optionId: string) => {
    if (multiSelect) {
      if (selected.includes(optionId)) {
        setSelected(prev => prev.filter(id => id !== optionId));
      } else {
        setSelected(prev => [...prev, optionId]);
      }
    } else {
      onSelect(optionId);
    }
  };

  const handleSubmit = () => {
    if (multiSelect && selected.length > 0) {
      onSelect(selected.join(','));
    }
  };

  return (
    <Card className="p-4 max-w-lg">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-medium">{title}</h4>
          {isCompleted && (
            <Badge variant="secondary" className="text-xs font-normal">
              <CheckCircle className="w-3 h-3 mr-1" />
              Completed
            </Badge>
          )}
        </div>
        
        {description && (
          <p className="text-sm font-normal text-muted-foreground">{description}</p>
        )}

        <div className="grid gap-2">
          {options.map(option => (
            <Button
              key={option.id}
              variant={selected.includes(option.id) ? "default" : "outline"}
              className="justify-start h-auto p-3 relative"
              onClick={() => handleOptionClick(option.id)}
              disabled={isCompleted}
            >
              <div className="flex items-start gap-3 w-full">
                {option.icon && <div className="mt-0.5">{option.icon}</div>}
                <div className="text-left flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">{option.label}</span>
                    {option.recommended && (
                      <Badge variant="secondary" className="text-xs font-normal">
                        Recommended
                      </Badge>
                    )}
                  </div>
                  <div className="text-xs font-normal text-muted-foreground mt-1">
                    {option.description}
                  </div>
                </div>
              </div>
            </Button>
          ))}
        </div>

        {multiSelect && selected.length > 0 && !isCompleted && (
          <Button onClick={handleSubmit} className="w-full text-sm font-medium">
            {submitLabel} ({selected.length} selected)
          </Button>
        )}
      </div>
    </Card>
  );
}