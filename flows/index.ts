/**
 * Flow Framework Entry Point
 * Main exports for the Flow Framework
 */

// Types
export * from './types/flow.types';

// Flow Definitions
export * from './definitions';

// Services
export { FlowOrchestrator, flowOrchestrator } from './orchestrator/FlowOrchestrator';
export { FlowRegistry } from './services/FlowRegistry';
export { ComponentFactory } from './factories/ComponentFactory';

// Hooks
export { useFlowOrchestrator } from './hooks/useFlowOrchestrator';

// Initialize flow system
import { FlowRegistry } from './services/FlowRegistry';

// Ensure registry is initialized when importing this module
FlowRegistry.initialize();