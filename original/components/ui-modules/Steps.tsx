import React, { useCallback } from 'react';
import { Button } from '../ui/button';
import { Alert, AlertDescription } from '../ui/alert';
import { HelpCircle, Check, Lock } from 'lucide-react';

type StepStatus = 'done' | 'current' | 'todo' | 'incomplete' | 'blocked';

type Step = {
  id: string;
  title: string;
  hint?: string;
  optional?: boolean;
};

type Action = { 
  id: string; 
  label: string; 
  variant?: 'default' | 'secondary' | 'ghost'; 
  disabled?: boolean; 
};

type StepsModule = {
  id?: string;
  title?: string;
  description?: string;
  helpUrl?: string;
  loading?: boolean;
  error?: string;
  empty?: string;
  actions?: Action[];
  kind: 'steps';
  locked?: boolean;
  variant: 'overview' | 'progress';
  steps: Step[];
  status?: Record<string, StepStatus>;
  current?: string;
  showIndex?: boolean;
  maxVisible?: number;
};

interface StepsProps extends StepsModule {
  onAction?: (actionId: string, data?: any) => void;
}

export function Steps({
  id,
  title,
  description,
  helpUrl,
  loading = false,
  error,
  empty,
  actions = [],
  variant,
  steps,
  status = {},
  current,
  showIndex = true,
  maxVisible,
  locked = false,
  onAction
}: StepsProps) {
  const getStepStatus = useCallback((step: Step): StepStatus => {
    if (variant === 'overview') {
      return status[step.id] || 'todo';
    }
    
    // Progress variant logic
    if (current === step.id) return 'current';
    if (status[step.id]) return status[step.id];
    
    // Default logic based on current step
    const currentIndex = steps.findIndex(s => s.id === current);
    const stepIndex = steps.findIndex(s => s.id === step.id);
    
    if (currentIndex === -1) return 'todo';
    if (stepIndex < currentIndex) return 'done';
    if (stepIndex === currentIndex) return 'current';
    return 'todo';
  }, [variant, status, current, steps]);

  const renderStepIndicator = useCallback((step: Step, index: number) => {
    const stepStatus = getStepStatus(step);
    
    // Larger circles with better visual distinction
    const baseClasses = "flex items-center justify-center w-8 h-8 rounded-full transition-all";
    
    switch (stepStatus) {
      case 'done':
        return (
          <div className={`${baseClasses} bg-foreground border-2 border-foreground text-background`}>
            <Check className="w-4 h-4" />
          </div>
        );
      
      case 'current':
        return (
          <div className={`${baseClasses} bg-background border-2 border-foreground text-foreground font-medium`}>
            {showIndex && <span className="text-sm">{index + 1}</span>}
          </div>
        );
      
      case 'blocked':
        return (
          <div className={`${baseClasses} bg-muted border-2 border-muted text-muted-foreground`}>
            <Lock className="w-4 h-4" />
          </div>
        );
      
      case 'incomplete':
        return (
          <div className={`${baseClasses} bg-background border-2 border-muted-foreground border-dashed text-muted-foreground`}>
            {showIndex && <span className="text-sm">{index + 1}</span>}
          </div>
        );
      
      default: // todo
        return (
          <div className={`${baseClasses} bg-background border-2 border-muted text-muted-foreground`}>
            {showIndex && <span className="text-sm">{index + 1}</span>}
          </div>
        );
    }
  }, [getStepStatus, showIndex]);

  const getStepTextClasses = useCallback((step: Step) => {
    const stepStatus = getStepStatus(step);
    
    switch (stepStatus) {
      case 'done':
        return 'text-foreground';
      case 'current':
        return 'text-foreground font-medium';
      case 'blocked':
        return 'text-muted-foreground';
      case 'incomplete':
        return 'text-muted-foreground';
      default:
        return 'text-muted-foreground';
    }
  }, [getStepStatus]);

  const visibleSteps = maxVisible ? steps.slice(0, maxVisible) : steps;
  const hiddenCount = maxVisible ? Math.max(0, steps.length - maxVisible) : 0;

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
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <div key={index} className="flex items-center gap-3 animate-pulse">
              <div className="w-8 h-8 bg-muted rounded-full"></div>
              <div className="flex-1 space-y-1">
                <div className="h-4 bg-muted rounded w-1/3"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (steps.length === 0) {
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
          <AlertDescription>{empty || 'No steps available'}</AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${
      locked 
        ? 'opacity-60 pointer-events-none' 
        : ''
    }`}>
      {/* Header */}
      {(title || description) && (
        <div className="space-y-2">
          {title && (
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-medium">{title}</h3>
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

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Steps Content - no container, direct content */}
      <div className="space-y-4">
        {visibleSteps.map((step, index) => (
            <div key={step.id} className="flex items-start gap-4">
              {/* Step Indicator */}
              <div className="flex-shrink-0 mt-0.5">
                {renderStepIndicator(step, index)}
              </div>

              {/* Step Content - smaller gap between title and description */}
              <div className="flex-1 min-w-0 space-y-0.5">
                <div className={`font-medium ${getStepTextClasses(step)}`}>
                  {step.title}
                  {step.optional && (
                    <span className="text-muted-foreground ml-2 text-sm font-normal">(optional)</span>
                  )}
                </div>
                {step.hint && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {step.hint}
                  </p>
                )}
              </div>
            </div>
        ))}

        {/* Hidden Steps Indicator */}
        {hiddenCount > 0 && (
          <div className="flex items-center gap-4">
            <div className="w-8 h-8 flex items-center justify-center">
              <div className="w-2 h-2 bg-muted-foreground rounded-full"></div>
            </div>
            <p className="text-sm text-muted-foreground">
              {hiddenCount} more step{hiddenCount > 1 ? 's' : ''}
            </p>
          </div>
        )}
      </div>

      {/* Actions */}
      {actions.length > 0 && (
        <div className="flex items-center gap-3">
          {actions.map((action) => (
            <Button
              key={action.id}
              variant={action.variant || 'outline'}
              disabled={loading || locked || action.disabled}
              onClick={() => onAction?.(action.id)}
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}