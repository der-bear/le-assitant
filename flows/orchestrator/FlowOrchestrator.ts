/**
 * Flow Orchestrator
 * Central service for managing flow execution, state, and transitions
 */

import {
  FlowDefinition,
  StepDefinition,
  FlowContext,
  FlowState,
  FlowEvent,
  FlowEventType,
  IFlowOrchestrator,
  TransitionConfig,
  SuggestedActionConfig
} from '../types/flow.types';

export class FlowOrchestrator implements IFlowOrchestrator {
  private currentFlow: FlowDefinition | null = null;
  private flowContext: FlowContext = {
    flowId: '',
    currentStep: null,
    completedSteps: new Set<string>(),
    stepData: new Map<string, any>(),
    metadata: {}
  };
  
  private eventHandlers: Map<FlowEventType, Set<(event: FlowEvent) => void>> = new Map();
  private flowRegistry: Map<string, FlowDefinition> = new Map();

  constructor() {
    this.initializeEventHandlers();
  }

  /**
   * Register a flow definition
   */
  registerFlow(flow: FlowDefinition): void {
    this.flowRegistry.set(flow.id, flow);
  }

  /**
   * Register multiple flow definitions
   */
  registerFlows(flows: FlowDefinition[]): void {
    flows.forEach(flow => this.registerFlow(flow));
  }

  /**
   * Start a new flow
   */
  startFlow(flowId: string): void {
    const flow = this.flowRegistry.get(flowId);
    if (!flow) {
      throw new Error(`Flow with ID "${flowId}" not found`);
    }

    // Reset previous flow state
    this.resetFlow();

    // Initialize new flow
    this.currentFlow = flow;
    this.flowContext = {
      flowId: flow.id,
      currentStep: null,
      completedSteps: new Set<string>(),
      stepData: new Map<string, any>(),
      metadata: {
        startedAt: new Date(),
        flowName: flow.name
      }
    };

    // Start with the first step (usually overview)
    if (flow.steps.length > 0) {
      this.transitionToStep(flow.steps[0].id);
    }

    this.emitEvent('flow:started', { flowId });
  }

  /**
   * Get the current flow definition
   */
  getCurrentFlow(): FlowDefinition | null {
    return this.currentFlow;
  }

  /**
   * Reset the current flow
   */
  resetFlow(): void {
    if (this.currentFlow) {
      this.emitEvent('flow:cancelled', { flowId: this.currentFlow.id });
    }
    
    this.currentFlow = null;
    this.flowContext = {
      flowId: '',
      currentStep: null,
      completedSteps: new Set<string>(),
      stepData: new Map<string, any>(),
      metadata: {}
    };
  }

  /**
   * Get the current step definition
   */
  getCurrentStep(): StepDefinition | null {
    if (!this.currentFlow || !this.flowContext.currentStep) {
      return null;
    }
    
    return this.currentFlow.steps.find(
      step => step.id === this.flowContext.currentStep
    ) || null;
  }

  /**
   * Transition to a specific step
   */
  transitionToStep(stepId: string): void {
    if (!this.currentFlow) {
      throw new Error('No active flow');
    }

    const step = this.currentFlow.steps.find(s => s.id === stepId);
    if (!step) {
      throw new Error(`Step "${stepId}" not found in flow "${this.currentFlow.id}"`);
    }

    // Mark current step as completed if transitioning forward
    if (this.flowContext.currentStep) {
      this.flowContext.completedSteps.add(this.flowContext.currentStep);
      this.emitEvent('step:completed', { 
        flowId: this.currentFlow.id, 
        stepId: this.flowContext.currentStep 
      });
    }

    // Update current step
    this.flowContext.currentStep = stepId;
    
    this.emitEvent('step:started', { 
      flowId: this.currentFlow.id, 
      stepId 
    });
  }

  /**
   * Complete the current step with data
   */
  completeCurrentStep(data?: any): void {
    const currentStep = this.getCurrentStep();
    if (!currentStep) {
      throw new Error('No current step to complete');
    }

    // Validate step data if validation rules exist
    if (currentStep.validation) {
      const errors = this.validateStepData(data, currentStep.validation);
      if (errors.length > 0) {
        this.emitEvent('validation:failed', {
          flowId: this.flowContext.flowId,
          stepId: currentStep.id,
          data: errors
        });
        return;
      }
    }

    // Store step data
    if (data) {
      this.flowContext.stepData.set(currentStep.id, data);
    }

    // Determine next step
    const nextStepId = this.determineNextStep(currentStep, data);
    
    if (nextStepId === 'complete') {
      // Flow is complete
      this.flowContext.completedSteps.add(currentStep.id);
      this.emitEvent('step:completed', {
        flowId: this.flowContext.flowId,
        stepId: currentStep.id
      });
      this.emitEvent('flow:completed', {
        flowId: this.flowContext.flowId,
        data: Object.fromEntries(this.flowContext.stepData)
      });
      this.flowContext.currentStep = null;
    } else if (nextStepId) {
      // Transition to next step
      this.transitionToStep(nextStepId);
    }
  }

  /**
   * Handle action trigger
   */
  handleAction(actionId: string, stepId?: string): void {
    const step = stepId 
      ? this.currentFlow?.steps.find(s => s.id === stepId)
      : this.getCurrentStep();
      
    if (!step) {
      console.warn(`Step not found for action "${actionId}"`);
      return;
    }

    // Check if action triggers a transition
    const transition = step.transitions[actionId];
    if (transition) {
      if (typeof transition === 'string') {
        this.transitionToStep(transition);
      } else {
        // Handle conditional transitions
        console.warn('Conditional transitions not yet implemented');
      }
    }

    this.emitEvent('action:triggered', {
      flowId: this.flowContext.flowId,
      stepId: step.id,
      data: { actionId }
    });
  }

  /**
   * Get the current flow state
   */
  getFlowState(): FlowState {
    return {
      flowId: this.flowContext.flowId,
      currentStep: this.flowContext.currentStep,
      completedSteps: Array.from(this.flowContext.completedSteps),
      stepData: Object.fromEntries(this.flowContext.stepData),
      startedAt: this.flowContext.metadata.startedAt || new Date(),
      lastUpdatedAt: new Date()
    };
  }

  /**
   * Restore a flow state
   */
  restoreFlowState(state: FlowState): void {
    const flow = this.flowRegistry.get(state.flowId);
    if (!flow) {
      throw new Error(`Flow "${state.flowId}" not found`);
    }

    this.currentFlow = flow;
    this.flowContext = {
      flowId: state.flowId,
      currentStep: state.currentStep,
      completedSteps: new Set(state.completedSteps),
      stepData: new Map(Object.entries(state.stepData)),
      metadata: {
        startedAt: state.startedAt,
        lastUpdatedAt: state.lastUpdatedAt,
        flowName: flow.name
      }
    };
  }

  /**
   * Get flow context (for use in components)
   */
  getFlowContext(): FlowContext {
    return { ...this.flowContext };
  }

  /**
   * Check if a step is locked
   */
  isStepLocked(stepId: string): boolean {
    const step = this.currentFlow?.steps.find(s => s.id === stepId);
    if (!step) return false;

    // Default locking behavior: lock if completed and not current
    const isCompleted = this.flowContext.completedSteps.has(stepId);
    const isCurrent = this.flowContext.currentStep === stepId;
    
    if (step.locks) {
      if (step.locks.custom) {
        return step.locks.custom(this.flowContext);
      }
      if (step.locks.whenCompleted && isCompleted) {
        return true;
      }
      if (step.locks.whenNotCurrent && !isCurrent) {
        return true;
      }
    }

    // Default behavior
    return isCompleted && !isCurrent;
  }

  /**
   * Get suggested actions for current step
   */
  getSuggestedActions(): SuggestedActionConfig[] {
    const currentStep = this.getCurrentStep();
    if (!currentStep || !currentStep.suggestedActions) {
      return [];
    }

    // Add lock state to actions based on flow state
    return currentStep.suggestedActions.map(action => ({
      ...action,
      isLocked: this.isStepLocked(currentStep.id)
    }));
  }

  /**
   * Subscribe to flow events
   */
  on(event: FlowEventType, handler: (event: FlowEvent) => void): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, new Set());
    }
    this.eventHandlers.get(event)?.add(handler);
  }

  /**
   * Unsubscribe from flow events
   */
  off(event: FlowEventType, handler: (event: FlowEvent) => void): void {
    this.eventHandlers.get(event)?.delete(handler);
  }

  /**
   * Private: Initialize event handlers
   */
  private initializeEventHandlers(): void {
    const eventTypes: FlowEventType[] = [
      'flow:started',
      'flow:completed',
      'flow:cancelled',
      'step:started',
      'step:completed',
      'step:failed',
      'action:triggered',
      'validation:failed'
    ];
    
    eventTypes.forEach(type => {
      this.eventHandlers.set(type, new Set());
    });
  }

  /**
   * Private: Emit a flow event
   */
  private emitEvent(type: FlowEventType, data?: any): void {
    const event: FlowEvent = {
      type,
      flowId: this.flowContext.flowId,
      stepId: this.flowContext.currentStep || undefined,
      data,
      timestamp: new Date()
    };
    
    this.eventHandlers.get(type)?.forEach(handler => {
      try {
        handler(event);
      } catch (error) {
        console.error(`Error in event handler for ${type}:`, error);
      }
    });
  }

  /**
   * Private: Determine the next step based on transitions
   */
  private determineNextStep(step: StepDefinition, data?: any): string | null {
    const transitions = step.transitions;
    
    // Check for onComplete transition
    if (transitions.onComplete) {
      return transitions.onComplete;
    }
    
    // Check for default transition
    if (transitions.default) {
      return transitions.default;
    }
    
    // Check for conditional transitions (not yet implemented)
    if (transitions.conditional) {
      console.warn('Conditional transitions not yet implemented');
    }
    
    return null;
  }

  /**
   * Private: Validate step data
   */
  private validateStepData(data: any, validation: any): any[] {
    const errors: any[] = [];
    
    // Basic validation implementation
    if (validation.rules) {
      validation.rules.forEach((rule: any) => {
        if (rule.rule === 'required' && !data?.[rule.fieldId]) {
          errors.push({
            fieldId: rule.fieldId,
            message: rule.message
          });
        }
        // Add more validation rules as needed
      });
    }
    
    return errors;
  }
}

// Export singleton instance
export const flowOrchestrator = new FlowOrchestrator();