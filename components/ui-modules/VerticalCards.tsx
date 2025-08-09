import React, { useState } from 'react';
import { Card } from '../ui/card';
import { Button } from '../ui/button';
import { Badge } from '../ui/badge';
import { CheckCircle, Circle } from 'lucide-react';

interface CardOption {
  id: string;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  badge?: string;
  disabled?: boolean;
}

interface VerticalCardsProps {
  title?: string;
  description?: string;
  options: CardOption[];
  selectionMode?: 'single' | 'multiple' | 'none';
  defaultSelected?: string[];
  onSelect: (selectedIds: string[]) => void;
  submitLabel?: string;
  showSubmit?: boolean;
  maxSelection?: number;
}

export function VerticalCards({ 
  title, 
  description, 
  options, 
  selectionMode = 'single',
  defaultSelected = [],
  onSelect,
  submitLabel = "Continue",
  showSubmit = true,
  maxSelection
}: VerticalCardsProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(defaultSelected);

  const handleCardClick = (optionId: string) => {
    if (selectionMode === 'none') {
      onSelect([optionId]);
      return;
    }

    let newSelected: string[];

    if (selectionMode === 'single') {
      newSelected = [optionId];
    } else {
      // Multiple selection
      if (selectedIds.includes(optionId)) {
        newSelected = selectedIds.filter(id => id !== optionId);
      } else {
        if (maxSelection && selectedIds.length >= maxSelection) {
          return; // Don't allow more selections
        }
        newSelected = [...selectedIds, optionId];
      }
    }

    setSelectedIds(newSelected);

    if (!showSubmit || selectionMode === 'single') {
      onSelect(newSelected);
    }
  };

  const handleSubmit = () => {
    onSelect(selectedIds);
  };

  const getSelectionIcon = (optionId: string) => {
    if (selectionMode === 'none') return null;
    
    const isSelected = selectedIds.includes(optionId);
    
    if (selectionMode === 'single') {
      return isSelected ? (
        <Circle className="w-4 h-4 fill-primary text-primary" />
      ) : (
        <Circle className="w-4 h-4 text-muted-foreground" />
      );
    } else {
      return isSelected ? (
        <CheckCircle className="w-4 h-4 text-primary" />
      ) : (
        <Circle className="w-4 h-4 text-muted-foreground" />
      );
    }
  };

  return (
    <Card className="p-4 max-w-2xl">
      <div className="space-y-4">
        {(title || description) && (
          <div className="space-y-1">
            <div className="flex items-center justify-between">
              {title && <h4 className="text-sm font-medium">{title}</h4>}
              {selectionMode === 'multiple' && selectedIds.length > 0 && (
                <Badge variant="secondary" className="text-xs font-normal">
                  {selectedIds.length} selected
                  {maxSelection && ` / ${maxSelection}`}
                </Badge>
              )}
            </div>
            {description && (
              <p className="text-xs font-normal text-muted-foreground">{description}</p>
            )}
          </div>
        )}

        <div className={`grid gap-3 ${
          options.length === 1 ? 'grid-cols-1' :
          options.length === 2 ? 'grid-cols-2' :
          options.length === 3 ? 'grid-cols-3' :
          'grid-cols-2'
        }`}>
          {options.map((option) => {
            const isSelected = selectedIds.includes(option.id);
            const isDisabled = option.disabled || (
              maxSelection && 
              selectionMode === 'multiple' && 
              selectedIds.length >= maxSelection && 
              !isSelected
            );

            return (
              <Card
                key={option.id}
                className={`p-4 cursor-pointer transition-all hover:shadow-sm relative ${
                  isSelected 
                    ? 'ring-2 ring-primary bg-primary/5' 
                    : 'hover:bg-accent/50'
                } ${isDisabled ? 'opacity-50 cursor-not-allowed' : ''}`}
                onClick={() => !isDisabled && handleCardClick(option.id)}
              >
                <div className="space-y-3">
                  {/* Selection indicator */}
                  {selectionMode !== 'none' && (
                    <div className="absolute top-3 right-3">
                      {getSelectionIcon(option.id)}
                    </div>
                  )}

                  {/* Icon */}
                  {option.icon && (
                    <div className="w-8 h-8 flex items-center justify-center">
                      {option.icon}
                    </div>
                  )}

                  {/* Content */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h5 className="text-sm font-medium">{option.title}</h5>
                      {option.badge && (
                        <Badge variant="secondary" className="text-xs font-normal">
                          {option.badge}
                        </Badge>
                      )}
                    </div>
                    {option.description && (
                      <p className="text-xs font-normal text-muted-foreground">
                        {option.description}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {showSubmit && selectedIds.length > 0 && selectionMode === 'multiple' && (
          <Button 
            onClick={handleSubmit}
            className="w-full text-sm font-normal"
          >
            {submitLabel} ({selectedIds.length})
          </Button>
        )}
      </div>
    </Card>
  );
}