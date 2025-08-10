/**
 * ComponentFactory
 * Factory for creating flow components from configurations
 */

import React, { ReactNode } from 'react';
import { ComponentConfig, FlowContext } from '../types/flow.types';
import { Button } from '../../components/ui/button';
import { ArrowRight, Download, Upload, FileCheck, Check, Plus, List, Settings } from 'lucide-react';

// Import UI modules
import { Steps } from '../../components/ui-modules/Steps';
import { Form } from '../../components/ui-modules/Form';
import { ChoiceList } from '../../components/ui-modules/ChoiceList';
import { FileDrop } from '../../components/ui-modules/FileDrop';
import { ProcessState } from '../../components/ui-modules/ProcessState';
import { SummaryCard } from '../../components/ui-modules/SummaryCard';
import { Alert } from '../../components/ui-modules/Alert';

// Icon mapping
const iconMap = {
  ArrowRight,
  Download,
  Upload, 
  FileCheck,
  Check,
  Plus,
  List,
  Settings
};

export class ComponentFactory {
  private static componentRegistry = new Map<string, React.ComponentType<any>>();

  /**
   * Initialize with default components
   */
  static initialize() {
    // Register default UI modules
    this.registerComponent('steps', Steps);
    this.registerComponent('form', Form);
    this.registerComponent('choices', ChoiceList);
    this.registerComponent('filedrop', FileDrop);
    this.registerComponent('process', ProcessState);
    this.registerComponent('summary', SummaryCard);
    this.registerComponent('alert', Alert);
  }

  /**
   * Register a component type
   */
  static registerComponent(kind: string, component: React.ComponentType<any>): void {
    this.componentRegistry.set(kind, component);
  }

  /**
   * Create a component from configuration
   */
  static createComponent(
    config: ComponentConfig, 
    context: FlowContext,
    options?: {
      onAction?: (actionId: string) => void;
      onSubmit?: (data: any) => void;
      onUpload?: (files: File[]) => void;
      locked?: boolean;
      disabled?: boolean;
    }
  ): ReactNode {
    const Component = this.componentRegistry.get(config.kind);
    
    if (!Component) {
      console.warn(`Component "${config.kind}" not found in registry`);
      return this.createFallbackComponent(config);
    }

    // Merge props with context and options
    const props = {
      ...config.props,
      locked: options?.locked ?? false,
      disabled: options?.disabled ?? false
    };

    // Add event handlers based on component type
    switch (config.kind) {
      case 'form':
        if (options?.onSubmit) {
          props.onSubmit = options.onSubmit;
        }
        break;
        
      case 'choices':
        if (options?.onAction) {
          props.onChange = options.onAction;
        }
        break;
        
      case 'filedrop':
        if (options?.onUpload) {
          props.onUploadStart = options.onUpload;
        }
        break;
        
      case 'summary':
        if (options?.onAction) {
          props.onActionClick = options.onAction;
        }
        break;
    }

    // Handle dynamic prop substitution
    const processedProps = this.processProps(props, context);

    return <Component key={context.currentStep} {...processedProps} />;
  }

  /**
   * Create action buttons from configuration
   */
  static createActionButtons(
    actions: Array<{
      id: string;
      label: string;
      icon?: string;
      type?: 'primary' | 'secondary' | 'danger';
      onClick: () => void;
    }>,
    options?: {
      disabled?: boolean;
      triggeredId?: string | null;
    }
  ): ReactNode {
    if (!actions.length) return null;

    return (
      <div className="flex gap-2 mt-4">
        {actions.map(action => {
          const IconComponent = action.icon ? iconMap[action.icon as keyof typeof iconMap] : null;
          const isTriggered = options?.triggeredId === action.id;
          
          return (
            <Button
              key={action.id}
              onClick={action.onClick}
              variant={action.type === 'primary' ? 'default' : 'outline'}
              className={`gap-2 font-medium transition-all ${
                isTriggered ? 'ring-2 ring-primary ring-offset-2 bg-primary text-primary-foreground' : ''
              }`}
              disabled={options?.disabled}
            >
              {IconComponent && <IconComponent className="w-4 h-4" />}
              {action.label}
            </Button>
          );
        })}
      </div>
    );
  }

  /**
   * Create suggested action buttons
   */
  static createSuggestedActions(
    actions: Array<{
      id: string;
      label: string;
      icon?: string;
      onClick?: () => void;
      isLocked?: boolean;
    }>,
    options?: {
      triggeredId?: string | null;
    }
  ): ReactNode {
    if (!actions.length) return null;

    return (
      <div className="flex gap-2 mt-4 flex-wrap">
        {actions.map(action => {
          const IconComponent = action.icon ? iconMap[action.icon as keyof typeof iconMap] : null;
          const isTriggered = options?.triggeredId === action.id;
          const isLocked = action.isLocked ?? false;
          
          return (
            <Button
              key={action.id}
              onClick={action.onClick}
              variant="outline"
              size="sm"
              className={`gap-2 font-medium transition-all ${
                isTriggered ? 'ring-2 ring-primary ring-offset-2' : ''
              } ${
                isLocked ? 'opacity-50 cursor-not-allowed' : ''
              }`}
              disabled={isLocked}
            >
              {IconComponent && <IconComponent className="w-3 h-3" />}
              {action.label}
            </Button>
          );
        })}
      </div>
    );
  }

  /**
   * Create composite component (multiple components in one)
   */
  static createComposite(
    components: ComponentConfig[],
    context: FlowContext,
    options?: {
      onAction?: (actionId: string) => void;
      onSubmit?: (data: any) => void;
      locked?: boolean;
    }
  ): ReactNode {
    return (
      <div className="space-y-4">
        {components.map((config, index) => 
          this.createComponent(config, context, { ...options, key: index })
        )}
      </div>
    );
  }

  /**
   * Process props with dynamic substitution
   */
  private static processProps(props: any, context: FlowContext): any {
    const processed = { ...props };
    
    // Handle string interpolation in props
    const interpolate = (obj: any): any => {
      if (typeof obj === 'string') {
        return obj.replace(/\{(\w+)\}/g, (match, key) => {
          // Look for value in step data
          const stepData = context.stepData.get(context.currentStep || '');
          if (stepData && stepData[key] !== undefined) {
            return String(stepData[key]);
          }
          
          // Look in metadata
          if (context.metadata[key] !== undefined) {
            return String(context.metadata[key]);
          }
          
          return match; // Return original if not found
        });
      } else if (Array.isArray(obj)) {
        return obj.map(interpolate);
      } else if (obj && typeof obj === 'object') {
        const result: any = {};
        for (const [k, v] of Object.entries(obj)) {
          result[k] = interpolate(v);
        }
        return result;
      }
      
      return obj;
    };
    
    return interpolate(processed);
  }

  /**
   * Create fallback component for unknown types
   */
  private static createFallbackComponent(config: ComponentConfig): ReactNode {
    return (
      <div className="p-4 border border-dashed border-gray-300 rounded-lg">
        <p className="text-sm text-gray-500">
          Unknown component type: <code>{config.kind}</code>
        </p>
        {config.props.title && (
          <p className="font-medium mt-1">{config.props.title}</p>
        )}
      </div>
    );
  }
}

// Initialize default components
ComponentFactory.initialize();