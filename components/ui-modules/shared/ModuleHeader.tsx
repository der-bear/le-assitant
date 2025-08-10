import React from 'react';
import { Button } from '../../ui/button';
import { HelpCircle } from 'lucide-react';
import { TYPOGRAPHY, SPACING } from './types';

export interface ModuleHeaderProps {
  /** Header title */
  title?: string;
  
  /** Header description/subtitle */
  description?: string;
  
  /** Optional help URL - shows help icon when provided */
  helpUrl?: string;
  
  /** Title size variant */
  titleSize?: 'large' | 'normal';
  
  /** Custom title className override */
  titleClassName?: string;
  
  /** Custom description className override */
  descriptionClassName?: string;
}

/**
 * Reusable header component for UI modules
 * Provides consistent styling and help icon functionality
 */
export function ModuleHeader({
  title,
  description,
  helpUrl,
  titleSize = 'normal',
  titleClassName,
  descriptionClassName
}: ModuleHeaderProps) {
  // Don't render anything if no content
  if (!title && !description) {
    return null;
  }

  // Determine title classes
  const titleClasses = titleClassName || (
    titleSize === 'large' ? TYPOGRAPHY.largeTitle : TYPOGRAPHY.moduleTitle
  );

  const descriptionClasses = descriptionClassName || TYPOGRAPHY.moduleDescription;

  return (
    <div className={SPACING.tightSpacing}>
      {title && (
        <div className={`flex items-center ${SPACING.headerGap}`}>
          <h3 className={titleClasses}>{title}</h3>
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
        <p className={descriptionClasses}>{description}</p>
      )}
    </div>
  );
}