import React from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Check, Lock, Circle } from 'lucide-react';

interface ProgressStep {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'current' | 'locked';
  icon?: React.ReactNode;
}

interface ProgressProps {
  title?: string;
  description?: string;
  steps: ProgressStep[];
  onStepClick?: (stepId: string) => void;
  className?: string;
}

export function Progress({ 
  title, 
  description, 
  steps, 
  onStepClick,
  className = ""
}: ProgressProps) {
  const getStepIcon = (step: ProgressStep, index: number) => {
    if (step.icon) {
      return step.icon;
    }

    switch (step.status) {
      case 'completed':
        return <Check className="w-4 h-4 text-white" />;
      case 'current':
        return <span className="text-white text-sm font-medium">{index + 1}</span>;
      case 'locked':
        return <Lock className="w-3 h-3 text-muted-foreground" />;
      default:
        return <Circle className="w-3 h-3 text-muted-foreground" />;
    }
  };

  const getStepStyles = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed':
        return 'bg-primary text-primary-foreground border-primary';
      case 'current':
        return 'bg-primary text-primary-foreground border-primary shadow-sm';
      case 'locked':
        return 'bg-muted text-muted-foreground border-border';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getTextStyles = (status: ProgressStep['status']) => {
    switch (status) {
      case 'completed':
        return 'text-foreground';
      case 'current':
        return 'text-foreground';
      case 'locked':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  };

  const isClickable = (step: ProgressStep) => {
    return onStepClick && (step.status === 'completed' || step.status === 'current');
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Optional Header */}
      {(title || description) && (
        <div className="space-y-1">
          {title && <h4 className="text-sm font-medium">{title}</h4>}
          {description && (
            <p className="text-xs font-normal text-muted-foreground">{description}</p>
          )}
        </div>
      )}

      {/* Steps */}
      <div className="space-y-3">
        {steps.map((step, index) => (
          <div 
            key={step.id}
            className={`flex items-start gap-3 ${
              isClickable(step) 
                ? 'cursor-pointer hover:bg-accent/30 rounded-lg p-2 -m-2 transition-colors' 
                : ''
            }`}
            onClick={() => isClickable(step) ? onStepClick?.(step.id) : undefined}
          >
            {/* Step Icon/Number */}
            <div className={`
              w-8 h-8 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors
              ${getStepStyles(step.status)}
            `}>
              {getStepIcon(step, index)}
            </div>

            {/* Step Content */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className={`text-sm font-medium ${getTextStyles(step.status)}`}>
                {step.title}
              </div>
              <div className={`text-xs font-normal mt-0.5 ${getTextStyles(step.status)}`}>
                {step.description}
              </div>
            </div>

            {/* Optional Status Badge */}
            {step.status === 'current' && (
              <Badge variant="secondary" className="text-xs font-normal">
                Current
              </Badge>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}