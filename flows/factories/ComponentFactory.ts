/**
 * Component Factory
 * Maps flow component configurations to React components
 */

import { ReactNode, createElement } from 'react';
import { ComponentConfig, FlowContext } from '../types/flow.types';

// Import UI modules
import { Form } from '../../components/ui-modules/Form';
import { Steps } from '../../components/ui-modules/Steps';
import { ChoiceList } from '../../components/ui-modules/ChoiceList';
import { Alert } from '../../components/ui-modules/Alert';
import { ProcessState } from '../../components/ui-modules/ProcessState';
import { SummaryCard } from '../../components/ui-modules/SummaryCard';
import { FileDrop } from '../../components/ui-modules/FileDrop';

// Component registry type
type ComponentRegistry = Map<string, React.ComponentType<any>>;

export class ComponentFactory {
  private registry: ComponentRegistry = new Map();

  constructor() {
    this.initializeDefaultComponents();
  }

  /**
   * Register default UI modules
   */
  private initializeDefaultComponents(): void {
    this.registry.set('form', Form);
    this.registry.set('steps', Steps);
    this.registry.set('choice', ChoiceList);
    this.registry.set('alert', Alert);
    this.registry.set('process', ProcessState);
    this.registry.set('summary', SummaryCard);
    this.registry.set('filedrop', FileDrop);
  }

  /**
   * Register a custom component
   */
  registerComponent(kind: string, component: React.ComponentType<any>): void {
    this.registry.set(kind, component);
  }

  /**
   * Create a component from configuration
   */
  createComponent(
    config: ComponentConfig, 
    context: FlowContext,
    additionalProps: Record<string, any> = {}
  ): ReactNode {
    const Component = this.registry.get(config.kind);
    
    if (!Component) {
      console.error(`Component "${config.kind}" not found in registry`);
      return null;
    }

    // Apply locking logic based on context
    const isLocked = this.isComponentLocked(context, additionalProps.stepId);
    
    // Merge props with locking state
    const props = {
      ...config.props,
      ...additionalProps,
      locked: isLocked,
      // Add flow context for components that might need it
      flowContext: context
    };

    return createElement(Component, props);
  }

  /**
   * Check if component should be locked based on flow context
   */
  private isComponentLocked(context: FlowContext, stepId?: string): boolean {
    if (!stepId || !context.currentStep) {
      return false;
    }

    // Component is locked if its step is completed and not current
    const isCompleted = context.completedSteps.has(stepId);
    const isCurrent = context.currentStep === stepId;
    
    return isCompleted && !isCurrent;
  }

  /**
   * Get registered component kinds
   */
  getRegisteredKinds(): string[] {
    return Array.from(this.registry.keys());
  }
}

// Export singleton instance
export const componentFactory = new ComponentFactory();