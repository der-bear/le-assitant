# Flow Framework Guidelines

## Overview
The Flow Framework provides a universal, declarative approach to defining and executing multi-step workflows in the LeadExec Assistant. It separates flow definitions from chat logic, enabling consistent user experiences across all tools and scenarios.

## Core Principles

### 1. Separation of Concerns
- **Flow Definitions**: Declarative configuration of steps and transitions
- **Flow Orchestrator**: Manages flow execution, state, and transitions
- **Chat Component**: Handles UI rendering and user interaction
- **UI Modules**: Pure, reusable components without flow logic

### 2. Consistent User Experience
- **All flows follow the same pattern**: Overview → Start → Steps → Completion
- **Unified locking behavior**: Previous steps lock when moving forward
- **Suggested actions**: Lock and highlight based on flow state
- **Modules remain pure**: No hardcoded wrappers or flow-specific logic

### 3. Flow Structure Pattern
Every flow must follow this consistent structure:
1. **Overview Step**: Shows process summary with indexed steps
2. **Start Action**: User-triggered initiation (e.g., "Start Setup", "Start Bulk Upload")
3. **Progressive Steps**: Each step locks upon completion
4. **Results Step**: Summary with next actions

## Architecture Components

### Flow Definition Structure
```typescript
interface FlowDefinition {
  id: string;                    // Unique identifier
  name: string;                   // Display name
  description: string;            // Brief description
  category: 'clients' | 'leads' | 'financial' | 'system';
  steps: StepDefinition[];        // Ordered array of steps
  metadata?: {
    icon?: string;
    estimatedTime?: string;
    permissions?: string[];
  };
}

interface StepDefinition {
  id: string;                    // Step identifier
  type: StepType;                // 'overview' | 'form' | 'choice' | 'process' | 'result'
  title: string;                  // Step title
  description?: string;           // Optional description
  component: ComponentConfig;     // UI module configuration
  actions?: ActionConfig[];       // Available actions
  validation?: ValidationConfig;  // Step validation rules
  transitions: TransitionConfig;  // Next step logic
  locks?: LockConfig;            // Locking behavior
}

interface ComponentConfig {
  kind: string;                  // Module type (form, steps, choice, etc.)
  props: Record<string, any>;    // Component-specific props
}

interface ActionConfig {
  id: string;
  label: string;
  icon?: string;
  type: 'primary' | 'secondary' | 'suggested';
  triggers?: string;              // Step ID or action to trigger
}
```

### Flow Orchestrator Responsibilities
1. **Flow Management**
   - Load and validate flow definitions
   - Initialize flow state
   - Track current step and completed steps

2. **Step Execution**
   - Render appropriate UI modules
   - Handle user interactions
   - Process step data

3. **State Management**
   - Maintain flow progress
   - Handle step locking
   - Manage suggested action states

4. **Transition Logic**
   - Determine next steps
   - Apply conditional transitions
   - Handle flow completion

## Implementation Patterns

### 1. Step Locking Pattern
```typescript
// A step is locked when:
const isLocked = completedSteps.has(stepId) && currentStep !== stepId;

// Suggested actions lock similarly:
const isActionLocked = flowActive && completedSteps.has(parentStepId) && currentStep !== parentStepId;
```

### 2. Action Highlighting Pattern
```typescript
// Highlight the triggered action
const isHighlighted = triggeredActionId === action.id;
```

### 3. Flow Initialization Pattern
```typescript
// Every flow starts with:
1. Reset session state
2. Show overview with steps
3. Wait for user "Start" action
4. Begin step progression
```

### 4. Step Completion Pattern
```typescript
// When a step completes:
1. Mark step as completed
2. Lock the completed step
3. Update current step
4. Transition to next step
```

## File Organization

```
/flows/
  /definitions/
    clientSetup.flow.ts         # Single client creation flow
    bulkUpload.flow.ts         # Bulk client upload flow
    deliveryConfig.flow.ts     # Delivery configuration flow
  /types/
    flow.types.ts              # Flow type definitions
  /orchestrator/
    FlowOrchestrator.ts        # Main orchestrator class
    FlowStateManager.ts        # Flow state management
    FlowTransitionEngine.ts    # Transition logic
  /factories/
    MessageFactory.ts          # Message creation utilities
    ComponentFactory.ts        # Component configuration
```

## Migration Strategy

### Phase 1: Foundation (Immediate)
1. Create flow type definitions
2. Build FlowOrchestrator service
3. Extract first flow (clientSetup) as proof of concept

### Phase 2: Migration (Progressive)
1. Convert bulk upload flow
2. Update ConversationalChat to use orchestrator
3. Ensure backward compatibility

### Phase 3: Enhancement (Future)
1. Add flow persistence
2. Implement flow branching
3. Support dynamic flow composition

## Validation Rules

### Flow Definition Validation
- Every flow MUST have an overview step
- Step IDs must be unique within a flow
- Transitions must reference valid step IDs
- Required fields must have validation rules

### Runtime Validation
- Validate user input before transitions
- Ensure step prerequisites are met
- Handle validation errors gracefully
- Provide clear error messages

## Testing Requirements

### Unit Tests
- Flow definition validation
- State transition logic
- Locking behavior
- Action triggering

### Integration Tests
- Complete flow execution
- Step transitions
- Error handling
- State persistence

## Best Practices

### DO:
- Keep flow definitions declarative
- Use consistent naming conventions
- Provide clear step descriptions
- Include helpful validation messages
- Test edge cases and error paths

### DON'T:
- Mix flow logic with UI components
- Hardcode flow-specific behavior in modules
- Create circular dependencies
- Skip validation steps
- Assume step order

## Example Flow Definition

```typescript
export const clientSetupFlow: FlowDefinition = {
  id: 'create-new-client',
  name: 'Create New Client',
  description: 'Set up a new client with guided configuration',
  category: 'clients',
  steps: [
    {
      id: 'overview',
      type: 'overview',
      title: 'Client Setup Process',
      component: {
        kind: 'steps',
        props: {
          variant: 'overview',
          title: 'Client Setup Process',
          steps: [
            { id: 'basic-info', title: 'Basic Information', hint: 'Company details and contact info' },
            { id: 'delivery-method', title: 'Delivery Method', hint: 'Choose how leads will be sent' },
            // ... more steps
          ],
          showIndex: true
        }
      },
      actions: [
        {
          id: 'start-setup',
          label: 'Start Setup',
          type: 'primary',
          triggers: 'basic-info'
        }
      ],
      transitions: {
        'start-setup': 'basic-info'
      }
    },
    // ... more step definitions
  ]
};
```

## Monitoring and Debugging

### Flow Events to Track
- Flow started
- Step completed
- Validation failed
- Flow abandoned
- Flow completed

### Debug Information
- Current flow state
- Step history
- Validation errors
- Transition decisions
- Lock states

## Future Considerations

### Extensibility
- Plugin system for custom steps
- Flow composition and reuse
- Dynamic flow generation
- A/B testing support

### Performance
- Lazy load flow definitions
- Cache compiled flows
- Optimize state updates
- Minimize re-renders

### Analytics
- Track flow completion rates
- Identify common failure points
- Measure step completion times
- Monitor user engagement