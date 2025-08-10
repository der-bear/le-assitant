/**
 * Flow Framework Type Definitions
 * Defines the universal structure for all flows in the LeadExec Assistant
 */

import { ReactNode } from 'react';

/**
 * Core flow definition structure
 */
export interface FlowDefinition {
  id: string;                                    // Unique flow identifier
  name: string;                                  // Display name for the flow
  description: string;                           // Brief description of what the flow does
  category: FlowCategory;                        // Flow categorization
  steps: StepDefinition[];                       // Ordered array of flow steps
  metadata?: FlowMetadata;                       // Optional flow metadata
}

/**
 * Flow categorization for organization
 */
export type FlowCategory = 'clients' | 'leads' | 'financial' | 'system' | 'general';

/**
 * Optional flow metadata
 */
export interface FlowMetadata {
  icon?: string;                                // Icon identifier (Lucide icon name)
  estimatedTime?: string;                        // Estimated completion time
  permissions?: string[];                        // Required permissions
  tags?: string[];                              // Searchable tags
}

/**
 * Individual step definition within a flow
 */
export interface StepDefinition {
  id: string;                                   // Unique step identifier within flow
  type: StepType;                               // Type of step
  title: string;                                 // Step title
  description?: string;                          // Optional step description
  component: ComponentConfig;                    // UI component configuration
  actions?: ActionConfig[];                      // Available actions for this step
  validation?: ValidationConfig;                 // Validation rules for step completion
  transitions: TransitionConfig;                 // Next step logic
  locks?: LockConfig;                           // Locking behavior configuration
  suggestedActions?: SuggestedActionConfig[];   // Suggested actions to show
}

/**
 * Step types
 */
export type StepType = 
  | 'overview'      // Initial overview with process steps
  | 'form'          // Form input step
  | 'choice'        // Choice selection step
  | 'process'       // Processing/loading step
  | 'result'        // Results/summary step
  | 'upload'        // File upload step
  | 'custom';       // Custom component step

/**
 * UI component configuration
 */
export interface ComponentConfig {
  kind: string;                                 // Module kind (form, steps, choice, etc.)
  props: Record<string, any>;                   // Component-specific props
  derivation?: DerivationConfig[];              // Field derivation rules (for forms)
}

/**
 * Field derivation configuration (for forms)
 */
export interface DerivationConfig {
  fieldId: string;                              // Target field to derive
  from: string[];                               // Source fields
  strategy: string;                             // Derivation strategy
  editable?: boolean;                           // Whether derived field is editable
}

/**
 * Action configuration
 */
export interface ActionConfig {
  id: string;                                   // Action identifier
  label: string;                                // Display label
  icon?: string;                                // Icon identifier
  type?: 'primary' | 'secondary' | 'danger';    // Action type
  triggers?: string;                            // Step ID or action to trigger
  condition?: ConditionConfig;                  // Conditional display
}

/**
 * Suggested action configuration (for assistant messages)
 */
export interface SuggestedActionConfig {
  id: string;                                   // Action identifier
  label: string;                                // Display label
  icon?: string;                                // Icon identifier
  onClick?: () => void;                         // Click handler
  triggers?: string;                            // Step to transition to
}

/**
 * Validation configuration
 */
export interface ValidationConfig {
  rules: ValidationRule[];                      // Array of validation rules
  onError?: (errors: ValidationError[]) => void; // Error handler
}

/**
 * Individual validation rule
 */
export interface ValidationRule {
  fieldId?: string;                             // Field to validate (for forms)
  rule: 'required' | 'email' | 'regex' | 'custom';
  message: string;                              // Error message
  pattern?: string;                             // Regex pattern (for regex rule)
  validator?: (value: any, context: any) => boolean; // Custom validator
}

/**
 * Validation error
 */
export interface ValidationError {
  fieldId?: string;
  message: string;
}

/**
 * Transition configuration
 */
export interface TransitionConfig {
  default?: string;                             // Default next step
  conditional?: ConditionalTransition[];        // Conditional transitions
  onComplete?: string;                          // Step to go to on completion
  onCancel?: string;                            // Step to go to on cancellation
  [actionId: string]: string | ConditionalTransition[] | undefined; // Action-based transitions
}

/**
 * Conditional transition
 */
export interface ConditionalTransition {
  condition: ConditionConfig;                   // Condition to evaluate
  target: string;                               // Target step if condition is true
}

/**
 * Condition configuration
 */
export interface ConditionConfig {
  type: 'field' | 'state' | 'custom';          // Condition type
  field?: string;                              // Field to check (for field type)
  operator?: 'equals' | 'notEquals' | 'contains' | 'exists';
  value?: any;                                 // Value to compare
  evaluator?: (context: FlowContext) => boolean; // Custom evaluator
}

/**
 * Lock configuration
 */
export interface LockConfig {
  whenCompleted?: boolean;                      // Lock when step is completed
  whenNotCurrent?: boolean;                     // Lock when not the current step
  custom?: (context: FlowContext) => boolean;   // Custom lock logic
}

/**
 * Flow execution context
 */
export interface FlowContext {
  flowId: string;                               // Current flow ID
  currentStep: string | null;                   // Current step ID
  completedSteps: Set<string>;                  // Set of completed step IDs
  stepData: Map<string, any>;                   // Data collected from each step
  metadata: Record<string, any>;                // Additional context metadata
}

/**
 * Flow state for persistence/restoration
 */
export interface FlowState {
  flowId: string;
  currentStep: string | null;
  completedSteps: string[];
  stepData: Record<string, any>;
  startedAt: Date;
  lastUpdatedAt: Date;
}

/**
 * Message structure for chat
 */
export interface FlowMessage {
  id: string;
  content: string;
  sender: 'user' | 'assistant';
  timestamp: Date;
  component?: ReactNode;
  suggestedActions?: SuggestedActionConfig[];
  stepId?: string;
  isLocked?: boolean;
}

/**
 * Flow event types for tracking
 */
export type FlowEventType = 
  | 'flow:started'
  | 'flow:completed'
  | 'flow:cancelled'
  | 'step:started'
  | 'step:completed'
  | 'step:failed'
  | 'action:triggered'
  | 'validation:failed';

/**
 * Flow event
 */
export interface FlowEvent {
  type: FlowEventType;
  flowId: string;
  stepId?: string;
  data?: any;
  timestamp: Date;
}

/**
 * Flow orchestrator interface
 */
export interface IFlowOrchestrator {
  // Flow management
  startFlow(flowId: string): void;
  getCurrentFlow(): FlowDefinition | null;
  resetFlow(): void;
  
  // Step management
  getCurrentStep(): StepDefinition | null;
  transitionToStep(stepId: string): void;
  completeCurrentStep(data?: any): void;
  
  // State management
  getFlowState(): FlowState;
  restoreFlowState(state: FlowState): void;
  
  // Event handling
  on(event: FlowEventType, handler: (event: FlowEvent) => void): void;
  off(event: FlowEventType, handler: (event: FlowEvent) => void): void;
}

/**
 * Component factory interface
 */
export interface IComponentFactory {
  createComponent(config: ComponentConfig, context: FlowContext): ReactNode;
  registerComponent(kind: string, component: React.ComponentType<any>): void;
}