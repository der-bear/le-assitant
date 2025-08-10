/**
 * useFlowOrchestrator Hook
 * React hook for integrating FlowOrchestrator with components
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { flowOrchestrator } from '../orchestrator/FlowOrchestrator';
import { 
  FlowDefinition, 
  StepDefinition, 
  FlowContext, 
  FlowEvent,
  FlowEventType,
  SuggestedActionConfig
} from '../types/flow.types';

interface UseFlowOrchestratorReturn {
  // Flow state
  currentFlow: FlowDefinition | null;
  currentStep: StepDefinition | null;
  flowContext: FlowContext;
  isFlowActive: boolean;
  
  // Flow control
  startFlow: (flowId: string) => void;
  completeStep: (data?: any) => void;
  handleAction: (actionId: string) => void;
  resetFlow: () => void;
  
  // Step state
  isStepLocked: (stepId: string) => boolean;
  isStepCompleted: (stepId: string) => boolean;
  isCurrentStep: (stepId: string) => boolean;
  
  // Suggested actions
  getSuggestedActions: () => SuggestedActionConfig[];
  triggeredActionId: string | null;
  
  // Events
  onFlowEvent: (type: FlowEventType, handler: (event: FlowEvent) => void) => void;
  offFlowEvent: (type: FlowEventType, handler: (event: FlowEvent) => void) => void;
}

export function useFlowOrchestrator(): UseFlowOrchestratorReturn {
  const [currentFlow, setCurrentFlow] = useState<FlowDefinition | null>(null);
  const [currentStep, setCurrentStep] = useState<StepDefinition | null>(null);
  const [flowContext, setFlowContext] = useState<FlowContext>(flowOrchestrator.getFlowContext());
  const [isFlowActive, setIsFlowActive] = useState<boolean>(false);
  const [triggeredActionId, setTriggeredActionId] = useState<string | null>(null);
  const actionTimeoutRef = useRef<NodeJS.Timeout>();

  // Update state when flow changes
  const updateState = useCallback(() => {
    setCurrentFlow(flowOrchestrator.getCurrentFlow());
    setCurrentStep(flowOrchestrator.getCurrentStep());
    setFlowContext(flowOrchestrator.getFlowContext());
    setIsFlowActive(flowOrchestrator.getCurrentFlow() !== null);
  }, []);

  // Start a flow
  const startFlow = useCallback((flowId: string) => {
    try {
      flowOrchestrator.startFlow(flowId);
      updateState();
    } catch (error) {
      console.error('Failed to start flow:', error);
    }
  }, [updateState]);

  // Complete current step
  const completeStep = useCallback((data?: any) => {
    flowOrchestrator.completeCurrentStep(data);
    updateState();
  }, [updateState]);

  // Handle action trigger
  const handleAction = useCallback((actionId: string) => {
    // Set triggered action for highlighting
    setTriggeredActionId(actionId);
    
    // Clear previous timeout
    if (actionTimeoutRef.current) {
      clearTimeout(actionTimeoutRef.current);
    }
    
    // Clear triggered action after animation
    actionTimeoutRef.current = setTimeout(() => {
      setTriggeredActionId(null);
    }, 500);
    
    // Process action in orchestrator
    flowOrchestrator.handleAction(actionId);
    updateState();
  }, [updateState]);

  // Reset flow
  const resetFlow = useCallback(() => {
    flowOrchestrator.resetFlow();
    updateState();
    setTriggeredActionId(null);
  }, [updateState]);

  // Check if step is locked
  const isStepLocked = useCallback((stepId: string) => {
    return flowOrchestrator.isStepLocked(stepId);
  }, []);

  // Check if step is completed
  const isStepCompleted = useCallback((stepId: string) => {
    return flowContext.completedSteps.has(stepId);
  }, [flowContext.completedSteps]);

  // Check if step is current
  const isCurrentStep = useCallback((stepId: string) => {
    return flowContext.currentStep === stepId;
  }, [flowContext.currentStep]);

  // Get suggested actions for current step
  const getSuggestedActions = useCallback(() => {
    return flowOrchestrator.getSuggestedActions();
  }, []);

  // Event handling
  const onFlowEvent = useCallback((type: FlowEventType, handler: (event: FlowEvent) => void) => {
    flowOrchestrator.on(type, handler);
  }, []);

  const offFlowEvent = useCallback((type: FlowEventType, handler: (event: FlowEvent) => void) => {
    flowOrchestrator.off(type, handler);
  }, []);

  // Subscribe to flow events
  useEffect(() => {
    const handleFlowEvent = (event: FlowEvent) => {
      // Update state on any flow event
      updateState();
      
      // Log events for debugging
      console.log('Flow Event:', event.type, event);
    };

    // Subscribe to all events
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
      flowOrchestrator.on(type, handleFlowEvent);
    });

    // Cleanup
    return () => {
      eventTypes.forEach(type => {
        flowOrchestrator.off(type, handleFlowEvent);
      });
      
      if (actionTimeoutRef.current) {
        clearTimeout(actionTimeoutRef.current);
      }
    };
  }, [updateState]);

  return {
    // Flow state
    currentFlow,
    currentStep,
    flowContext,
    isFlowActive,
    
    // Flow control
    startFlow,
    completeStep,
    handleAction,
    resetFlow,
    
    // Step state
    isStepLocked,
    isStepCompleted,
    isCurrentStep,
    
    // Suggested actions
    getSuggestedActions,
    triggeredActionId,
    
    // Events
    onFlowEvent,
    offFlowEvent
  };
}